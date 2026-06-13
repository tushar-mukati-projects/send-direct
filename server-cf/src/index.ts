import { SignalRoom } from "./room";
import type { Env } from "./env";

export { SignalRoom };

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const STUN: IceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const originList = (value?: string): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const originAllowed = (origin: string | null, allowed?: string): boolean => {
  const list = originList(allowed);
  if (list.length === 0) return true;
  return Boolean(origin && list.includes(origin));
};

const corsHeaders = (origin: string | null, allowed?: string): Record<string, string> => {
  const list = originList(allowed);
  const allow =
    list.length === 0
      ? (origin ?? "*")
      : origin && list.includes(origin)
        ? origin
        : (list[0] ?? "*");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  };
};

const buildIceServers = async (env: Env): Promise<IceServer[]> => {
  const servers: IceServer[] = [...STUN];
  if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return servers;
  try {
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: 86400 }),
      },
    );
    if (response.ok) {
      const data = (await response.json()) as { iceServers?: IceServer };
      if (data.iceServers) servers.push(data.iceServers);
    }
  } catch {
    return servers;
  }
  return servers;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (url.pathname === "/health") return Response.json({ ok: true });

    if (url.pathname === "/ice") {
      const headers = corsHeaders(origin, env.ALLOWED_ORIGINS);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      const iceServers = await buildIceServers(env);
      return Response.json({ iceServers }, { headers });
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Upgrade Required", { status: 426 });
    }
    if (!originAllowed(origin, env.ALLOWED_ORIGINS)) {
      return new Response("origin not allowed", { status: 403 });
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) return new Response("rate limited", { status: 429 });

    const code = url.pathname.slice(1).toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return new Response("bad code", { status: 400 });

    const id = env.SIGNAL_ROOM.idFromName(code);
    return env.SIGNAL_ROOM.get(id).fetch(request);
  },
};
