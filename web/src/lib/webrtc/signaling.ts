import { SIGNAL_URL } from "@/lib/webrtc/constants";
import { serverMessageSchema, type ClientMessage, type ServerMessage } from "@/schemas/signaling";

interface SignalingHandlers {
  onMessage: (message: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: string) => void;
}

export const createSignaling = (handlers: SignalingHandlers) => {
  let ws: WebSocket | null = null;
  const queue: ClientMessage[] = [];

  const send = (message: ClientMessage): void => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      queue.push(message);
    }
  };

  const connect = (code: string): void => {
    const socket = new WebSocket(`${SIGNAL_URL.replace(/\/$/, "")}/${code}`);
    ws = socket;

    socket.onopen = () => {
      queue.splice(0).forEach((message) => send(message));
      handlers.onOpen?.();
    };
    socket.onclose = () => handlers.onClose?.();
    socket.onerror = () => handlers.onError?.("signalling connection failed");
    socket.onmessage = (event: MessageEvent<string>) => {
      try {
        const result = serverMessageSchema.safeParse(JSON.parse(event.data));
        if (result.success) handlers.onMessage(result.data);
      } catch {
        return;
      }
    };
  };

  const close = (): void => {
    const socket = ws;
    ws = null;
    if (!socket) return;
    socket.onopen = socket.onclose = socket.onerror = socket.onmessage = null;
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  };

  return { connect, send, close };
};
