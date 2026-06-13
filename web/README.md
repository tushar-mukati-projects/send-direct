# SendDirect — web

The SendDirect web app (Next.js App Router, TypeScript, Tailwind v4, static export). See the
[root README](../README.md) for the full picture and architecture, and [DESIGN.md](../DESIGN.md)
for the rationale.

## Develop

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_SIGNAL_URL etc.
npm run dev                  # http://localhost:3000
```

Requires the signalling Worker running (see `../server-cf`: `npx wrangler dev`, port 8787). Set
`NEXT_PUBLIC_SIGNAL_URL` to its WebSocket URL.

## Layout

```
src/
├── app/                 routes: / (app), /r (deep-link receive, ?c=CODE), layout, globals.css
├── components/
│   ├── layout/          AppShell, Header, Footer, TerminalBackdrop, ScreenTopBar
│   └── ui/              Button (cva), StatusDot
├── features/            home / send / receive / transfer / shared view components
├── hooks/transfer/      useTransferProgress (derived transfer view-model)
├── lib/
│   ├── webrtc/          peer, signaling, sender, receiver, session, constants
│   ├── code.ts          6-char code generation / parsing
│   └── format.ts        size / time / extension helpers
├── stores/              transfer-store.ts (zustand state machine + session wiring)
├── schemas/             zod schemas for signalling + data-channel control messages
└── types/               shared types
```

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm test` — Vitest (helpers + schemas)
- `npm run typecheck` · `npm run lint` · `npm run format:check`
- `npm run check` — typecheck + lint + format
