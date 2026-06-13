# SendDirect

Browser-to-browser peer-to-peer file sharing over **real WebRTC**. Files travel directly from
one browser to another across an encrypted `RTCDataChannel` — nothing is uploaded to or stored on
a server. The only thing the backend does is **signalling** (relaying the WebRTC handshake); file
bytes never pass through it.

The UI is a dark "phosphor terminal" design recreated faithfully from a Claude Design prototype.

```
send-direct/
├── web/         Next.js (App Router, TS, Tailwind v4) — the SendDirect web app (static export)
└── server-cf/   Cloudflare Worker + Durable Object — the signalling relay (one room per code)
```

## How it works

```
 Browser A (sender)        Worker + Durable Object        Browser B (receiver)
  pick files → code  ── create room ─▶  room = DO(code)
                            ◀─ peer-joined ─   join code  ◀──  enter code / open /r?c=CODE
  createOffer ──── offer ────▶ relay ──── offer ────▶ setRemoteDescription
  setRemoteDescription ◀─ answer ─ relay ◀─ answer ── createAnswer
       ⇄ trickle ICE candidates relayed both ways ⇄
       ╚════ RTCDataChannel opens (DTLS-encrypted, peer-to-peer) ════╝
  send manifest ─────────────────────────────────▶ show incoming list
                            ◀──── "accept" ──────── user clicks ACCEPT
  stream 16KB chunks (backpressure-gated) ────────▶ reassemble → download
```

- **Signalling only** flows through the Worker (SDP offer/answer + ICE candidates). Each 6-char
  code maps to one **Durable Object** that holds the two sockets and relays between them.
- **NAT traversal:** public Google STUN by default. Strict/symmetric NATs need a **TURN** relay —
  configure it via the web env vars below, otherwise some connections cannot be established.
- The shareable link `…/r?c=CODE` opens the receive flow with the code prefilled, and the QR code
  encodes that same link (scannable with any phone camera).

## Running locally

Two terminals.

**Worker** (signalling, port 8787):

```bash
cd server-cf
npm install
npx wrangler dev          # runs the Worker + Durable Object locally
```

**Web** (Next.js, port 3000):

```bash
cd web
npm install
cp .env.example .env.local   # already created; points NEXT_PUBLIC_SIGNAL_URL at ws://localhost:8787
npm run dev
```

Open two windows at <http://localhost:3000>:

1. Window A → **Send** → pick a file → you get a 6-char code, a link, and a QR.
2. Window B → **Receive** → type the code (or open the link from A) → watch the real ICE/DTLS
   handshake → **Incoming** manifest → **Accept & Download**. The file transfers peer-to-peer and
   downloads in B.

## Web env (`web/.env.example`)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SIGNAL_URL` | WebSocket URL of the Worker (`ws://localhost:8787` in dev, `wss://…workers.dev` in prod). |
| `NEXT_PUBLIC_APP_ORIGIN` | Origin for share links / QR codes (falls back to the live origin). |
| `NEXT_PUBLIC_TURN_URL` / `_USERNAME` / `_CREDENTIAL` | Optional TURN relay for strict NATs. |

## Worker config (`server-cf/wrangler.toml`)

| Var | Purpose |
|---|---|
| `ALLOWED_ORIGINS` | Comma-separated allowed browser origins. **Empty = allow all** (dev only). |

## Tech

- **Web:** Next.js App Router, TypeScript (strict), Tailwind v4, shadcn-style `Button` (cva),
  zustand (state machine), zod (message/manifest validation), `react-qr-code`, sonner. WebRTC is
  wrapped behind a small transport layer in `src/lib/webrtc/` (`peer`, `signaling`, `sender`,
  `receiver`, `session` — all plain factory functions); transfer view-model lives in
  `src/hooks/transfer/`. Builds to a static export (`out/`).
- **server-cf:** Cloudflare Worker + a `SignalRoom` Durable Object (one per code) + zod. Relays
  SDP/ICE, cleans up on disconnect. No file bytes ever pass through it.

## Deploy (Cloudflare)

```bash
# Worker
cd server-cf && npx wrangler deploy

# Web (static export → Pages)
cd web && NEXT_PUBLIC_SIGNAL_URL=wss://<your-worker>.workers.dev npm run build
npx wrangler pages deploy out --project-name send-direct --branch main
```

Set `ALLOWED_ORIGINS` in `server-cf/wrangler.toml` to your Pages origin and redeploy the Worker.
For reliable transfers across all networks, configure TURN via the `NEXT_PUBLIC_TURN_*` vars.

## Limitations

- The receiver buffers each file in memory before saving (one `Blob` per file). Fine for typical
  files; very large multi-GB files would benefit from streaming-to-disk (File System Access API)
  in a future iteration.
- Durable Objects may require the Workers Paid plan depending on usage (SQLite DOs have a free
  tier with limits).
```
