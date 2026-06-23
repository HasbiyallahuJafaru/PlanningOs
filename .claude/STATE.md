# STATE.md

**This file is the single source of truth for "where are we right now." Read it first, every session. Update it before ending every session, and always before a handover.**

---

## Current phase
Phase 1 — Document Intelligence (MVP)

## Current batch
Batch 1.1 (Repo + infra scaffold) — **COMPLETE**. Next: Batch 1.2 (Auth + tenancy).

## Last completed batch
**Batch 1.1 — Repo + infra scaffold** (completed 2026-06-23).
All three stated outputs verified by actually running, not just reading code:
- `npm run dev` boots `api` (:3001) + `web` (:3000) together (via `concurrently`). ✓
- `GET /health` → 200; `GET /health/db` → 200 (Drizzle ran `SELECT 1` against local Postgres). ✓
- Sentry error path verified: `GET /health/debug-sentry` throws a plain Error caught by `SentryGlobalFilter` → 500. ⚠️ See caveat below — Sentry is INERT locally (no DSN), so nothing was actually delivered to a Sentry project yet.

### What exists now
```
package.json (npm workspaces: apps/*, packages/*; `npm run dev` = concurrently api+web)
tsconfig.base.json, .gitignore, .env.example, render.yaml (DRAFT, not deployed)
apps/api/    NestJS 11 — main.ts (+instrument.ts Sentry-first import), app.module.ts
             (SentryModule + SentryGlobalFilter as first APP_FILTER + DatabaseModule),
             db/ (global Drizzle node-postgres provider, pool closed on shutdown, empty schema),
             health/health.controller.ts (/health, /health/db, /health/debug-sentry),
             drizzle.config.ts, eslint.config.mjs, .env (gitignored, local only)
apps/web/    Next.js 16 + React 19 App Router — app/layout.tsx, app/page.tsx, globals.css
             (light theme), next.config.ts, eslint.config.mjs (native flat config)
packages/shared/  placeholder package, not imported anywhere yet (by design)
```
- build + lint + typecheck all GREEN for api and web.
- Local Postgres: PostgreSQL 16.14 running on :5432, user/pass `postgres`/`postgres`, DB `planningos_dev` created.
- graphify code graph built into `graphify-out/` (gitignored) — use `graphify query "..."` for navigation.

## Resolved decisions this batch (do not re-litigate)
- **Frontend framework for `apps/web`: Next.js 16 (React 19).** Confirmed with the person. Deploys on Render as a Node service.
- **Pinned versions deliberately (NOT latest-major) — recorded so they aren't "upgraded" blindly:**
  - **TypeScript 5.9.3**, not TS 6.0.x. TS 6 is brand new; NestJS 11's toolchain isn't validated on it and `typescript-eslint` requires `typescript <6.1.0`.
  - **ESLint 9.39.4**, not ESLint 10. `eslint-config-next` / `eslint-plugin-react@7.37.5` break on ESLint 10 (removed `context.getFilename()`).
  - NestJS 11.1.27, Next 16.2.9, React 19.2.7, drizzle-orm 0.45.2 / drizzle-kit 0.31.10, pg 8.22.0, @sentry/nestjs 10.59.0, @types/node ^24.13.2.
- **Render EU region = `frankfurt`** on every service + datastore (no UK region exists on Render; Frankfurt satisfies EU/UK residency per 05_COMPLIANCE.md).
- Web ESLint uses `eslint-config-next`'s **native flat-config exports** (`./core-web-vitals`, `./typescript`), spread directly — the legacy FlatCompat path is broken on modern ESLint.

## Open architectural decisions not yet resolved
- **RLS vs. app-level tenant scoping** — MUST resolve and implement in Batch 1.2 (flagged in `02_ARCHITECTURE.md`). Still open.
- Whether `web` and `admin` are separate apps or one app with role-based views — resolve before Phase 2.
- Design system not yet generated — run ui-ux-pro-max with `--persist` to `design-system/MASTER.md` before Batch 1.6.

## Notes for future batches
- **Sentry not yet delivering events.** Wiring is correct, but `SENTRY_DSN` is blank locally so Sentry is inert. Before relying on it: (a) create the Sentry project + DSN and set it in Render secrets / a local `.env` to confirm events land; (b) confirm a Sentry DPA exists before any personal/council data flows (05_COMPLIANCE.md rule 3). `@sentry/profiling-node` was intentionally omitted to avoid a native build dep; add later if profiling is wanted.
- **`npm audit`: 10 vulnerabilities (6 moderate, 4 high)** at install time, mostly transitive (drizzle-kit pulls deprecated `@esbuild-kit/*`, now merged into tsx). Did NOT run `audit fix --force` (breaking). Review in a pre-production hardening pass.
- **No DB migrations yet** — schema is empty (scope fence). drizzle-kit is configured; generate the first migration in Batch 1.2 when real tables (tenants, users, refresh_tokens, auth_audit) are added. Production must use migration history, not `db:push` (07_DEPLOYMENT.md).
- **render.yaml defines a `keyvalue` (Redis) service** that is unused until BullMQ lands in Batch 1.4 — intentional (blueprint reflects target infra).
- Cloudflare jurisdictional/regional restrictions must be configured before any council/public data exists (05_COMPLIANCE.md) — not relevant until Phase 3, noted so it isn't forgotten.
- **Git is not initialized / nothing committed.** Per harness rules, committing is gated on an explicit ask. Recommended first action when authorized: `git init`, then commit the scaffold (`.env` and `node_modules` are already gitignored).

## Last session summary
Read full `.claude` doc suite. Confirmed Next.js for `apps/web`. Scaffolded the monorepo (api/web/shared), wired Drizzle + Sentry + health checks, drafted `render.yaml` (Frankfurt). Verified builds/lints/typechecks and ran all services live. Pinned TS to 5.9 and ESLint to 9 after the latest majors broke the toolchain. Batch 1.1 outputs all met.

## Next action
Start **Batch 1.2 — Auth + tenancy** in a fresh session. First decision to make: **RLS vs. app-level tenant scoping** (resolve before implementing). Build the Universal JWT blueprint (users, roles, refresh_tokens, auth_audit), embed the tenant claim, and write the cross-tenant isolation test that proves tenant B cannot read tenant A's data. Inputs (Batch 1.1) are complete.
