# STATE.md

**This file is the single source of truth for "where are we right now." Read it first, every session. Update it before ending every session, and always before a handover.**

---

## Current phase
Phase 1 — Document Intelligence (MVP)

## Current batch
Batch 1.2 (Auth + tenancy) — **COMPLETE**. Next: Batch 1.3 (Project + document upload).
NOTE: Batches 1.1 AND 1.2 were both built in one long session (2026-06-23) at the person's
explicit direction, against the usual one-batch-per-session rule. Handover written:
`handovers/HANDOVER_2026-06-23_batch-1.2-auth-tenancy.md`.

## Last completed batch
**Batch 1.2 — Auth + tenancy** (completed 2026-06-23).
Outputs verified: register tenant+user, login, receive JWT, hit protected `/auth/me` and get
tenant-scoped data, refresh with rotation + reuse detection. Committed acceptance test
`apps/api/test/auth.e2e-spec.ts` (5 tests passing) proves tenant B cannot read tenant A's rows
through the RLS-enforced connection. Tenant isolation also proven independently via raw SQL as the
non-superuser role. `npm run test:e2e` (in apps/api) runs it. **Not yet committed to git.**

### Batch 1.2 — what exists
- Schema (`apps/api/src/db/schema.ts`): tenants, users (role enum admin/consultant/developer),
  refresh_tokens (rotation chain + family), auth_audit. RLS enabled on all, fail-closed policies.
- Migration applied: `apps/api/drizzle/0000_majestic_rogue.sql`.
- Non-superuser role `planningos_app` via `apps/api/scripts/setup-app-role.sql` (local pw: planningos_app_dev_pw).
- Dual connections: `DRIZZLE_PRIVILEGED` (RLS bypass, auth bootstrap) + `DRIZZLE_APP` (RLS) with
  `TenantDb.run(tenantId, fn)` setting `app.current_tenant` per transaction.
- Auth module (`apps/api/src/auth/`): register/login/refresh/logout, JWT access(15m)+refresh(30d, distinct
  secrets, only SHA-256 of refresh stored), reuse detection revokes the family, RBAC guard, auth_audit writes.
- New env vars (apps/api/.env + .env.example): APP_DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
  JWT_ACCESS_TTL_SECONDS, JWT_REFRESH_TTL_SECONDS.

## (Batch 1.1) Last completed batch — history
**Batch 1.1 — Repo + infra scaffold** (completed 2026-06-23). Pushed to GitHub (public).
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
- ~~RLS vs. app-level tenant scoping~~ — **RESOLVED in Batch 1.2: HYBRID (Postgres RLS backstop + app-level
  tenant context via TenantDb).** Implemented and tested.
- Whether `web` and `admin` are separate apps or one app with role-based views — resolve before Phase 2.
- Design system not yet generated — run ui-ux-pro-max with `--persist` to `design-system/MASTER.md` before Batch 1.6.

## Notes for future batches
- **Sentry not yet delivering events.** Wiring is correct, but `SENTRY_DSN` is blank locally so Sentry is inert. Before relying on it: (a) create the Sentry project + DSN and set it in Render secrets / a local `.env` to confirm events land; (b) confirm a Sentry DPA exists before any personal/council data flows (05_COMPLIANCE.md rule 3). `@sentry/profiling-node` was intentionally omitted to avoid a native build dep; add later if profiling is wanted.
- **`npm audit`: 10 vulnerabilities (6 moderate, 4 high)** at install time, mostly transitive (drizzle-kit pulls deprecated `@esbuild-kit/*`, now merged into tsx). Did NOT run `audit fix --force` (breaking). Review in a pre-production hardening pass.
- **No DB migrations yet** — schema is empty (scope fence). drizzle-kit is configured; generate the first migration in Batch 1.2 when real tables (tenants, users, refresh_tokens, auth_audit) are added. Production must use migration history, not `db:push` (07_DEPLOYMENT.md).
- **render.yaml defines a `keyvalue` (Redis) service** that is unused until BullMQ lands in Batch 1.4 — intentional (blueprint reflects target infra).
- Cloudflare jurisdictional/regional restrictions must be configured before any council/public data exists (05_COMPLIANCE.md) — not relevant until Phase 3, noted so it isn't forgotten.
- Git: repo initialized + Batch 1.1 pushed to GitHub (public, `HasbiyallahuJafaru/PlanningOs`). **Batch 1.2 is NOT yet committed** — commit/push when authorized (`.env` is gitignored).
- **Tenant data access rule (enforce in every future batch):** all tenant-scoped reads/writes go through `TenantDb.run(tenantId, fn)` (RLS pool). The privileged pool (`DRIZZLE_PRIVILEGED`) is ONLY for auth bootstrap + migrations. New tenant tables MUST add the same RLS policy pattern as schema.ts.
- **Deploy debt for Batch 1.2:** `render.yaml` api service injects only `DATABASE_URL`. Before first deploy it needs `APP_DATABASE_URL`, `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (sync:false), and a release step that runs migrations then `scripts/setup-app-role.sql` with a secret app-role password.
- Batch 1.3 introduces the GENERAL `audit_events` table (per 03_DATA_MODEL.md) — distinct from the auth-specific `auth_audit` built in 1.2.

## Last session summary
One long session (2026-06-23): built Batch 1.1 (scaffold, pushed to GitHub) AND Batch 1.2 (auth + tenancy)
at the person's direction. Resolved tenant isolation = hybrid RLS. Implemented schema+RLS, non-superuser
app role, dual DB pools + TenantDb, full auth (register/login/refresh-rotation+reuse/logout/me/RBAC),
auth_audit. Proved tenant isolation via raw SQL and a 5-test jest e2e suite. typecheck/lint/build green.

## Next action
1. Commit + push Batch 1.2 (not yet committed) when authorized.
2. Start **Batch 1.3 — Project + document upload** (fresh session recommended): add `projects` + `documents`
   tables (tenant_id + RLS, same pattern as schema.ts) and the general `audit_events` table, an S3-compatible
   upload flow, and write an audit_events row on upload. All tenant data access via `TenantDb.run`. Do NOT
   build extraction (Batch 1.4). Inputs (Batch 1.2) are complete.
