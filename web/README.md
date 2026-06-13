# SendDirect — frontend

The SendDirect web app (Next.js App Router, TypeScript, Tailwind v4). See the
[root README](../README.md) for the full picture, architecture, and how the frontend pairs with
the signalling backend.

## Develop

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_SIGNAL_URL etc.
npm run dev                  # http://localhost:3000
```

Requires the signalling backend running (see `../backend`). Set `NEXT_PUBLIC_SIGNAL_URL` to its
WebSocket URL.

## Layout

```
src/
├── app/                 routes: / (app), /r/[code] (deep-link receive), layout, globals.css
├── components/
│   ├── layout/          AppShell, Header, Footer, TerminalBackdrop, ScreenTopBar
│   └── ui/              PrimaryButton, StatusDot
├── features/            home / send / receive / transfer / shared view components
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
- `npm run lint`
- `npx tsc --noEmit` — typecheck
