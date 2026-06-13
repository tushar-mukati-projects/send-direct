import {
  clientMessageSchema,
  type IceCandidate,
  type ServerErrorReason,
  type SessionDescription,
} from "./schemas";
import type { Env } from "./env";

type ServerMessage =
  | { type: "created"; code: string }
  | { type: "joined"; code: string }
  | { type: "peer-joined" }
  | { type: "peer-left" }
  | { type: "offer"; sdp: SessionDescription }
  | { type: "answer"; sdp: SessionDescription }
  | { type: "ice"; candidate: IceCandidate }
  | { type: "error"; reason: ServerErrorReason; message: string };

type Role = "host" | "guest";

const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

export class SignalRoom {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state;
  }

  fetch = async (request: Request): Promise<Response> => {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.state.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  };

  webSocketMessage = (socket: WebSocket, raw: string | ArrayBuffer): void => {
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
        if (this.socketWithRole("host")) {
          return this.reject(socket, "room-exists", "that code is already in use");
        }
        this.setRole(socket, "host");
        void this.state.storage.setAlarm(Date.now() + ROOM_TTL_MS);
        return this.send(socket, { type: "created", code: message.code });
      }
      case "join": {
        const host = this.socketWithRole("host");
        if (!host)
          return this.reject(socket, "room-not-found", "no sender is waiting on that code");
        if (this.socketWithRole("guest")) {
          return this.reject(socket, "room-full", "someone is already connected to that code");
        }
        this.setRole(socket, "guest");
        this.send(socket, { type: "joined", code: message.code });
        return this.send(host, { type: "peer-joined" });
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
        socket.close(1000, "bye");
        return;
    }
  };

  webSocketClose = (socket: WebSocket): void => {
    const peer = this.peerOf(socket);
    if (!peer) return;
    this.send(peer, { type: "peer-left" });
    if (this.roleOf(socket) === "host") peer.close(1000, "peer-left");
  };

  webSocketError = (socket: WebSocket): void => {
    this.webSocketClose(socket);
  };

  alarm = (): void => {
    for (const socket of this.state.getWebSockets()) socket.close(1000, "room expired");
  };

  private roleOf = (socket: WebSocket): Role | null => {
    const attachment = socket.deserializeAttachment() as { role: Role } | null;
    return attachment?.role ?? null;
  };

  private setRole = (socket: WebSocket, role: Role): void => {
    socket.serializeAttachment({ role });
  };

  private socketWithRole = (role: Role): WebSocket | null =>
    this.state.getWebSockets().find((socket) => this.roleOf(socket) === role) ?? null;

  private peerOf = (socket: WebSocket): WebSocket | null =>
    this.state.getWebSockets().find((other) => other !== socket && this.roleOf(other) !== null) ??
    null;

  private reject = (socket: WebSocket, reason: ServerErrorReason, message: string): void => {
    this.fail(socket, reason, message);
    socket.close(1008, reason);
  };

  private send = (socket: WebSocket, message: ServerMessage): void => {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      return;
    }
  };

  private fail = (socket: WebSocket, reason: ServerErrorReason, message: string): void => {
    this.send(socket, { type: "error", reason, message });
  };
}
