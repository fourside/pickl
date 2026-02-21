# Pickl

A TODO list PWA.

## Tech Stack

- **Frontend**: React, React Router v7, SWR, CSS Modules, Vite
- **Backend**: Hono on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite) + Kysely
- **Storage**: Cloudflare R2 (avatars)
- **Testing**: Vitest, React Testing Library, MSW

## Setup

```bash
npm ci
```

Create `.dev.vars`:

```
JWT_SECRET=any-local-secret
```

Run local D1 migrations:

```bash
npx wrangler d1 migrations apply pickl --local
```

Start dev server:

```bash
npm run dev
```

## Deploy

```bash
npx wrangler secret put JWT_SECRET
npm run build && npm run deploy
```
