import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

// Open a WebSocket against the in-test Worker and return the accepted client socket.
async function openSocket(code: string): Promise<WebSocket> {
  const response = await SELF.fetch(`https://x/${code}`, {
    // ALLOWED_ORIGINS (wrangler.toml) gates the upgrade; send an allowed Origin.
    headers: { Upgrade: "websocket", Origin: "http://localhost:3000" },
  });
  expect(response.status).toBe(101);
  const socket = response.webSocket;
  if (!socket) throw new Error("expected a webSocket on the upgrade response");
  socket.accept();
  return socket;
}

// Resolve with the next parsed JSON message from the socket, or reject on timeout.
function nextMessage(socket: WebSocket, timeoutMs = 2000): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("timed out waiting for a websocket message"));
    }, timeoutMs);
    const onMessage = (event: MessageEvent) => {
      cleanup();
      resolve(JSON.parse(event.data as string));
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.removeEventListener("message", onMessage);
    };
    socket.addEventListener("message", onMessage);
  });
}

describe("worker HTTP routes", () => {
  it("GET /health returns { ok: true }", async () => {
    const response = await SELF.fetch("https://x/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("GET /ice returns iceServers with a STUN entry", async () => {
    const response = await SELF.fetch("https://x/ice", {
      headers: { Origin: "http://localhost:3000" },
    });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { iceServers: { urls: string | string[] }[] };
    expect(Array.isArray(body.iceServers)).toBe(true);
    const flat = body.iceServers.flatMap((s) => (Array.isArray(s.urls) ? s.urls : [s.urls]));
    expect(flat.some((u) => u.startsWith("stun:"))).toBe(true);
  });
});

describe("signalling websocket flow", () => {
  it("relays create/join/peer-joined/offer between two peers", async () => {
    const host = await openSocket("ABC123");
    const guest = await openSocket("ABC123");

    // Host creates the room.
    host.send(JSON.stringify({ type: "create", code: "ABC123" }));
    expect(await nextMessage(host)).toMatchObject({ type: "created", code: "ABC123" });

    // Guest joins; guest gets "joined", host gets "peer-joined".
    const hostPeerJoined = nextMessage(host);
    guest.send(JSON.stringify({ type: "join", code: "ABC123" }));
    expect(await nextMessage(guest)).toMatchObject({ type: "joined", code: "ABC123" });
    expect(await hostPeerJoined).toMatchObject({ type: "peer-joined" });

    // Host sends an offer; guest receives the relayed offer.
    const guestOffer = nextMessage(guest);
    host.send(JSON.stringify({ type: "offer", sdp: { type: "offer", sdp: "v=0" } }));
    expect(await guestOffer).toMatchObject({
      type: "offer",
      sdp: { type: "offer", sdp: "v=0" },
    });

    host.close();
    guest.close();
  });
});
