import { SignalRoom } from "./room";

export { SignalRoom };

export interface Env {
  SIGNAL_ROOM: DurableObjectNamespace;
  ALLOWED_ORIGINS?: string;
}

const originAllowed = (origin: string | null, allowed?: string): boolean => {
  const list = (allowed ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (list.length === 0) return true;
  return Boolean(origin && list.includes(origin));
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true });
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Upgrade Required", { status: 426 });
    }
    if (!originAllowed(request.headers.get("Origin"), env.ALLOWED_ORIGINS)) {
      return new Response("origin not allowed", { status: 403 });
    }

    const code = url.pathname.slice(1).toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      return new Response("bad code", { status: 400 });
    }

    const id = env.SIGNAL_ROOM.idFromName(code);
    return env.SIGNAL_ROOM.get(id).fetch(request);
  },
};
