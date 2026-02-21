# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Vite dev server (frontend + API via Cloudflare plugin)
npm run build         # Production build
npm test              # Frontend + model tests (vitest, jsdom)
npm run test:api      # API integration tests (vitest, cloudflare workers pool)
npm run test:all      # Both test suites sequentially
npm run lint          # Biome check (lint + format)
npm run lint:fix      # Biome auto-fix
npm run knip          # Find unused files, dependencies, and exports
npm run knip:fix      # Auto-fix knip issues
npm run deploy        # wrangler deploy to Cloudflare Workers
npm run ladle         # Component development server (Ladle)
```

Run a single test file: `npx vitest run src/front/features/auth/page.test.tsx`
Run a single API test: `npx vitest run --config vitest.config.workers.ts src/api/routes/auth.test.ts`

## Architecture

Pickl is a shared shopping list PWA for two users. Full-stack TypeScript: React frontend + Hono API on Cloudflare Workers with D1 (SQLite).

### Layer structure

```
src/models/     → Domain types + Valibot schemas (shared source of truth)
src/api/        → Hono backend (routes, middleware, Kysely DB queries)
src/front/      → React SPA (Vite, React Router v7, SWR)
```

Both `src/api/` and `src/front/` import from `src/models/` but never from each other.

### Frontend organization

Each feature is a self-contained directory under `src/front/features/` containing its page component, API client (`api.ts`), CSS Module, tests, and stories. Shared code lives in `src/front/shared/` (auth context, API client wrapper, reusable components).

- **Data fetching**: SWR with 30-second polling; optimistic updates via `mutate`
- **Routing**: React Router v7 library mode — `/login`, `/`, `/lists/:id`, `/settings`
- **Auth**: JWT stored in localStorage, `AuthContext` provides user state, `AuthGuard` protects routes
- **Styling**: CSS Modules (`.module.css`), no utility framework
- **PWA**: Service worker at `src/front/sw.ts` using Workbox precaching + push notifications

### Backend

- Hono app exported from `src/api/index.ts`, mounted in `worker.ts`
- JWT auth middleware on all `/api/*` routes except login
- Sliding token expiration: refreshed token sent via `X-Refreshed-Token` response header
- Kysely query builder over Cloudflare D1; schema defined in `src/api/db.ts`
- Database migrations in `migrations/`

### Testing

- **Frontend/models tests** (`vitest.config.ts`): jsdom environment, MSW for API mocking, React Testing Library. Setup in `src/front/test-setup.ts`. Test wrapper in `src/front/testing/wrapper.tsx` provides router + auth + SWR context.
- **API tests** (`vitest.config.workers.ts`): `@cloudflare/vitest-pool-workers` runs tests against real D1 via wrangler config.

## Deploy

- `npm run build && npm run deploy` でデプロイする（`dist/` を消した場合は先にビルドが必要）
- `JWT_SECRET` はローカル開発用が `.dev.vars` にあり、本番では暗号化シークレットとして設定する
  ```bash
  npx wrangler secret put JWT_SECRET <<< $(node -e "console.log(crypto.randomUUID())")
  ```
- シークレットはデプロイ前に設定しておくのが望ましい

## Conventions

- Biome for linting and formatting (2-space indent, organized imports)
- camelCase in TypeScript, snake_case in database columns
- Valibot for validation schemas (both API request validation and model types)
- Items use soft deletes (`deleted_at`) and auto-hide after 48h when checked (`checked_at`)
