# SendDirect — Design Notes & Rationale

This document explains *why* SendDirect is built the way it is. It doubles as a study guide for
talking through the project: every section is a decision you should be able to defend.

## 1. The core idea

Send a file from one browser to another **without the file ever touching a server**. The bytes go
**peer-to-peer** over an encrypted WebRTC `RTCDataChannel`; the only server involvement is a tiny
**signalling** exchange to introduce the two browsers. This means:

- **Privacy:** files are never uploaded or stored anywhere; the transport is DTLS-encrypted.
- **Cost/scale:** the server moves only a few KB of handshake JSON per transfer, regardless of file
  size. A 10 GB transfer costs the server nothing in bandwidth.

## 2. Why WebRTC (not "upload then download")

The naive approach uploads the file to a server (or S3/R2) and the receiver downloads it. That
costs storage + 2× bandwidth, adds latency, and means the file sits on infrastructure you have to
secure. WebRTC's `RTCDataChannel` gives a **direct, encrypted, bidirectional byte pipe between two
browsers** — exactly what a transfer wants. The cost is complexity: WebRTC needs a signalling
channel and NAT traversal, which is most of what this project is.

## 3. Signalling: what and why

Two browsers can't find each other directly — they're behind NATs with no fixed addresses. WebRTC
solves connection setup with an exchange of:
- **SDP** (`offer`/`answer`): each side's media/data capabilities and parameters.
- **ICE candidates:** possible network paths (host, server-reflexive via STUN, relayed via TURN).

Something must shuttle these between the peers *before* the P2P channel exists. That's the
**signalling server**. Our protocol (zod-validated) is deliberately tiny:

```
create {code} → created          join {code} → joined / room-full / room-not-found
peer-joined                      offer/answer {sdp}        ice {candidate}        bye
```

The host (sender) creates a room keyed by a 6-char code; the guest (receiver) joins with that code;
the server relays offer/answer/ICE between them, then gets out of the way.

## 4. Why Cloudflare Durable Objects for signalling

The hard requirement: the two peers' WebSocket connections must be handled by the **same stateful
thing** so it can relay between them.

- A plain server with an in-memory `Map<code, {host, guest}>` works on **one** process, but doesn't
  survive horizontal scaling (peer A and peer B could hit different instances) or restarts.
- Workers are stateless and ephemeral — no shared memory between isolates.
- **Durable Objects** are the right primitive: a single-threaded, addressable, stateful actor.
  `idFromName(code)` deterministically routes both peers to the **same** DO instance anywhere on
  Cloudflare's edge. One DO = one room. It scales to millions of independent rooms automatically,
  each tiny and isolated.

This is the textbook DO use case (chat rooms / multiplayer / coordination), applied to signalling.

## 5. WebSocket Hibernation (cost at scale)

A signalling WebSocket stays open for the whole transfer but is mostly **idle** (the bytes flow P2P,
not through it). If the DO stayed resident the entire time, you'd pay for wall-clock duration on
every concurrent transfer. The **WebSocket Hibernation API** lets the DO be evicted from memory
while its sockets stay open, and revived only when a message actually arrives.

The catch: instance memory is gone after hibernation. So the host/guest *roles* aren't stored in
fields — they're attached to each socket with `serializeAttachment({ role })`, which **survives
hibernation**. On wake, `getWebSockets()` + the attachments reconstruct who's who. An `alarm()`
gives each room a 2-hour TTL so abandoned rooms clean themselves up.

## 6. Backpressure (correctness under speed)

If you loop `channel.send(chunk)` as fast as JS can, you overflow the data channel's send buffer and
the connection dies. The fix is **flow control**: keep the in-flight buffer between a low and high
watermark. We set `bufferedAmountLowThreshold` and, whenever `bufferedAmount` exceeds the high
watermark (8 MB), `await` a `drain()` that resolves on the `bufferedamountlow` event (or on channel
close, so it can't hang). Chunks are 16 KiB — small enough to stay under the safe SCTP message size
across browsers.

## 7. Integrity: manifest + accept + per-file verification

- The sender first sends a **manifest** (file names + sizes). The receiver shows it and the user
  explicitly **accepts** before any bytes flow.
- Files are framed with `file-begin` / chunks / `file-end`. The receiver tracks bytes per file and
  **verifies `received === manifest size`** before marking a file complete. The overall transfer
  only reports "done" once *every* file is verified — a truncated/dropped transfer surfaces an error
  instead of silently producing a corrupt file. (Verified end-to-end via live two-window transfers
  with a deterministic byte pattern; the unit + Workers-pool tests cover the helpers, schemas, and
  signalling relay.)

## 8. NAT traversal: STUN always, TURN optional

- **STUN** tells a peer its public address so two peers can usually connect directly. Free, no relay.
- **Symmetric NATs** (some mobile/corporate networks) defeat STUN; those need **TURN**, which
  *relays* the media — meaning TURN carries the actual bytes and costs bandwidth.
- Decision: STUN by default (covers the large majority), TURN **optional and built but dormant**.
  The Worker's `/ice` endpoint mints short-lived Cloudflare TURN credentials when configured; the
  client fetches ICE servers from `/ice` before connecting. Enabling TURN is one dashboard step +
  two secrets — deferred because it has a real bandwidth cost and most connections don't need it.
- **Trickle ICE:** candidates are sent as they're discovered (lower latency). Candidates that arrive
  before the remote description is set are buffered and flushed after `setRemoteDescription`.

## 9. Security model

- **No secrets in the client.** TURN credentials are minted server-side and short-lived; nothing
  sensitive ships in the bundle.
- **Origin allow-list** on the Worker rejects WebSocket upgrades from unknown origins.
- **Per-IP rate limiting** (Workers rate-limit binding, 60 upgrades/min) blunts connection floods.
- **Encryption** is automatic: WebRTC data channels are DTLS-encrypted end-to-end.
- **Files are never persisted** — the server is a pure relay of handshake JSON.

## 10. Why it scales

- **Frontend** is a static export on Cloudflare Pages → served from the CDN edge, effectively
  unbounded read traffic.
- **Signalling** is serverless and auto-scaling; each room is an isolated, hibernating DO.
- **The data path is P2P** → the server's bandwidth is ~constant regardless of file size or count.
  This is the property that makes the whole thing cheap to run at scale.

## 11. Frontend architecture notes

- A **zustand store is the state machine** (`home → send/select → send/share → transfer → done`, and
  the receive flow). React Query/axios aren't used because there's no REST API — the network layer
  is WebSocket + WebRTC, so forcing them would be cargo-culting.
- The WebRTC layer (`signaling`, `peer`, `sender`, `receiver`, `session`) is plain **factory
  functions** returning closures — no classes — kept behind a small seam so the UI never touches raw
  RTC objects.
- **Static export** + a query-param receive route (`/r?c=CODE`) keeps the whole app deployable as
  static files (no per-code prerendered pages), while still supporting deep links.

## 12. Tradeoffs & what's next

- **Receiver memory:** each file reassembles in memory before download. Streaming straight to disk
  (File System Access API) only delivers bounded memory if the sender is paced by the receiver's
  disk write speed — i.e. it needs a receiver→sender flow-control message. Rather than ship a
  streaming path that looks bounded but isn't, that flow-control protocol is listed as future work.
- **1:1 only:** one room = two peers. Multi-peer (mesh/SFU) would be a larger design.
- **Next steps:** enable TURN in production, add a receiver→sender flow-control signal for huge
  files, a resumable-transfer protocol, and a browser e2e (Playwright) on top of the existing unit +
  Workers-pool integration tests.

## 13. Quick interview Q&A

- **"Why Durable Objects instead of a Node WebSocket server?"** Single-threaded stateful actor
  addressable by code → both peers deterministically hit the same instance, scales horizontally for
  free, no sticky-session infrastructure.
- **"What is hibernation solving?"** Idle-but-open signalling sockets shouldn't bill compute while
  the bytes flow P2P; hibernation evicts the DO and revives it on message, with roles preserved via
  socket attachments.
- **"How do you not corrupt files?"** Backpressure to avoid buffer overflow, ordered data channel,
  per-file byte-count verification against the manifest, and success only when all files verify.
- **"Where could it fail to connect?"** Symmetric NAT with no TURN — that's the one reliability gap,
  and exactly why the TURN path is built and ready to switch on.
- **"What never touches the server?"** The file bytes. Only SDP/ICE signalling JSON does.
