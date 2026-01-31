# Mini Elementor — Next.js Drag & Drop Page Builder

A JSON-first page builder with Section → Row → Column → Component layout, drag & drop editing, undo/redo history, and server-rendered output.

## Quick start

```bash
npm install
npm run dev
```

Open:
- Editor: `http://localhost:3000/editor`
- Rendered page: `http://localhost:3000/page/home`

## Prisma setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Run `npx prisma generate` (uses `prisma.config.ts`).
3. Run `npx prisma migrate dev --name init`.

Prisma 7 uses the Postgres adapter (`@prisma/adapter-pg`) and requires `DATABASE_URL`.

## Core ideas

- JSON is the source of truth.
- Editor dispatches Redux actions to mutate JSON.
- Renderer is pure JSON → UI.

See `project_onboarding.md` for full details.
