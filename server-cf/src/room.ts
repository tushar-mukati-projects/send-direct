import {
  clientMessageSchema,
  type IceCandidate,
  type ServerErrorReason,
  type SessionDescription,
} from "./schemas";

type ServerMessage =
  | { type: "created"; code: string }
  | { type: "joined"; code: string }
  | { type: "peer-joined" }
  | { type: "peer-left" }
  | { type: "offer"; sdp: SessionDescription }
  | { type: "answer"; sdp: SessionDescription }
  | { type: "ice"; candidate: IceCandidate }
  | { type: "error"; reason: ServerErrorReason; message: string };

export class SignalRoom {
  host: WebSocket | null = null;
  guest: WebSocket | null = null;

  fetch = async (request: Request): Promise<Response> => {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    server.accept();
    server.addEventListener("message", (event) => this.onMessage(server, event.data));
    server.addEventListener("close", () => this.onClose(server));
    server.addEventListener("error", () => this.onClose(server));
    return new Response(null, { status: 101, webSocket: client });
  };

  send = (socket: WebSocket, message: ServerMessage): void => {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      return;
    }
  };

  fail = (socket: WebSocket, reason: ServerErrorReason, message: string): void => {
    this.send(socket, { type: "error", reason, message });
  };

  peerOf = (socket: WebSocket): WebSocket | null => {
    if (socket === this.host) return this.guest;
    if (socket === this.guest) return this.host;
    return null;
  };

  onMessage = (socket: WebSocket, raw: string | ArrayBuffer): void => {
    if (typeof raw !== "string") return;

    let result: ReturnType<typeof clientMessageSchema.safeParse>;
    try {
      result = clientMessageSchema.safeParse(JSON.parse(raw));
    } catch {
      return this.fail(socket, "bad-message", "invalid JSON");
    }

    if (!result.success) {
      return this.fail(socket, "bad-message", result.error.issues[0]?.message ?? "invalid message");
    }
    const message = result.data;

    switch (message.type) {
      case "create": {
        if (this.host) return this.fail(socket, "room-exists", "that code is already in use");
        this.host = socket;
        return this.send(socket, { type: "created", code: message.code });
      }
      case "join": {
        if (!this.host)
          return this.fail(socket, "room-not-found", "no sender is waiting on that code");
        if (this.guest)
          return this.fail(socket, "room-full", "someone is already connected to that code");
        this.guest = socket;
        this.send(socket, { type: "joined", code: message.code });
        return this.send(this.host, { type: "peer-joined" });
      }
      case "offer":
      case "answer":
      case "ice": {
        const peer = this.peerOf(socket);
        if (!peer) return this.fail(socket, "not-in-room", "no peer to relay to");
        if (message.type === "ice")
          return this.send(peer, { type: "ice", candidate: message.candidate });
        return this.send(peer, { type: message.type, sdp: message.sdp });
      }
      case "bye":
        return this.onClose(socket);
    }
  };

  onClose = (socket: WebSocket): void => {
    const peer = this.peerOf(socket);
    if (socket === this.host) {
      this.host = null;
      this.guest = null;
    } else if (socket === this.guest) {
      this.guest = null;
    } else {
      return;
    }
    if (peer) this.send(peer, { type: "peer-left" });
  };
}
