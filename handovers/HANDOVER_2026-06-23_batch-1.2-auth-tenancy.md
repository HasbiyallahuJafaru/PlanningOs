# Session Handover

## Handover date
2026-06-23

## Phase / batch in progress
Phase 1 — **Batch 1.2 (Auth + tenancy) COMPLETE**. Next up: Batch 1.3 (Project + document upload).
(Note: Batches 1.1 and 1.2 were both built in this single long session, against the usual
one-batch-per-session rule, at the person's explicit direction.)

## What was completed this session
**Batch 1.1 (earlier in session):** monorepo scaffold (api/web/shared), Drizzle+Sentry+health,
render.yaml draft, pushed to GitHub (public). See STATE.md history.

**Batch 1.2 (this part):**
- **Decision resolved:** tenant isolation = **HYBRID (Postgres RLS backstop + app-level tenant context)**.
- **Schema** (`apps/api/src/db/schema.ts`): `tenants`, `users` (role enum admin/consultant/developer,
  unique(tenant_id,email)), `refresh_tokens` (rotation chain + family), `auth_audit`. RLS enabled on all,
  policies `USING/WITH CHECK (… = current_setting('app.current_tenant', true)::uuid)` — fails CLOSED.
- **Migration** `apps/api/drizzle/0000_majestic_rogue.sql` generated + applied to local `planningos_dev`.
- **Non-superuser app role**: `apps/api/scripts/setup-app-role.sql` (creates `planningos_app`, NOSUPERUSER/
  NOBYPASSRLS, grants). Provisioned locally with password `planningos_app_dev_pw`.
- **Dual DB connections** (`apps/api/src/db/`): `DRIZZLE_PRIVILEGED` (owner, bypasses RLS — auth bootstrap)
  and `DRIZZLE_APP` (planningos_app, RLS-enforced). `TenantDb.run(tenantId, fn)` opens a transaction and
  sets `app.current_tenant` (transaction-local) so RLS scopes all queries.
- **Auth module** (`apps/api/src/auth/`): register (creates tenant + admin user, argon2id), login
  (tenant slug + email + password), refresh (rotating + reuse detection → revokes whole family), logout
  (family revoke), `GET /auth/me` (JWT-guarded, reads via RLS path), `GET /auth/admin-check` (RBAC demo).
  Access JWT (15m) + refresh JWT (30d, distinct secret); only SHA-256 of refresh stored. `auth_audit`
  rows written for register/login success+failure/refresh/reuse/logout. Global ValidationPipe.
- **Committed acceptance test** `apps/api/test/auth.e2e-spec.ts` (jest + supertest), 5 tests, all passing.

## What is in progress, not finished
Nothing half-built. Batch 1.2 is complete and verified. NOT committed to git yet (see next step).

## What was verified (per the universal code standard)
- [x] Stress tested — refresh reuse detection + family revocation exercised live (HTTP) and the rotated
      token is correctly killed after reuse; bad login, missing token, DTO rejection all return correct codes.
- [x] Integration checked — health endpoints still 200; existing scaffold untouched except renamed DRIZZLE
      token → DRIZZLE_PRIVILEGED; web unaffected.
- [x] Actually run + statically analyzed — endpoints exercised over HTTP; RLS isolation proven via raw SQL
      as the non-superuser role AND via the jest e2e test through TenantDb; typecheck + lint + build green.
- [x] Bugs found & fixed: (1) ts-jest tsconfig path → use `<rootDir>/../tsconfig.json`; (2) missing
      `@nestjs/testing` dep → added; (3) `expiresIn` placeholder 0 → wired to access TTL via AUTH_CONFIG.

## Decisions made this session
- Tenant isolation: **Hybrid RLS + app scoping** (the person chose this).
- **Login requires tenant slug** so user lookup stays tenant-scoped (avoids global cross-tenant email search).
- Auth bootstrap (register/login/refresh) runs on the privileged pool (bypasses RLS); all future tenant
  business data access MUST go through `TenantDb.run`, never the privileged pool.
- Password hashing: **argon2id** via `@node-rs/argon2` (prebuilt binary — no native build on Windows).
- Refresh tokens are signed JWTs (distinct secret) with a DB row as source of truth for revocation/rotation.
- Roles/grants live in an env-specific SQL script, NOT migrations (no role passwords in source).

## Open questions / decisions NOT yet made
- `web` vs `admin` as separate apps or one role-based app — resolve before Phase 2.
- Design system (ui-ux-pro-max `--persist` → design-system/MASTER.md) — before Batch 1.6.

## Exact next step
1. (If authorized) commit Batch 1.2 and push: it is NOT yet committed. `.env` is gitignored; the migration,
   schema, auth module, scripts/setup-app-role.sql, and test should be committed.
2. Then start **Batch 1.3 — Project + document upload**: add `projects` + `documents` tables (with
   tenant_id + RLS policies, same pattern as schema.ts), an S3-compatible upload flow, and the general
   `audit_events` table (distinct from auth_audit) with a row written on upload. Use `TenantDb.run` for all
   project/document reads/writes. Do NOT build extraction (that's 1.4).

## Deployment debt to wire before first deploy (added to STATE notes)
- `render.yaml` api service currently only injects `DATABASE_URL`. It needs **`APP_DATABASE_URL`** (the
  planningos_app connection) + `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (sync:false) + a provisioning step
  that runs migrations then `setup-app-role.sql` with a secret app-role password.
- Sentry still inert (no DSN). `npm audit`: 10 transitive vulns (6 moderate/4 high) — review pre-prod.

## Files touched this session (Batch 1.2)
- `apps/api/src/db/schema.ts`, `drizzle.provider.ts`, `tenant-db.service.ts`, `database.module.ts`
- `apps/api/src/config/auth.config.ts`
- `apps/api/src/auth/*` (auth.module/controller/service, token.service, audit.service, jwt.strategy,
  jwt-auth.guard, roles.guard, roles.decorator, current-user.decorator, auth.types, dto/*)
- `apps/api/src/app.module.ts`, `src/main.ts`, `src/health/health.controller.ts`
- `apps/api/drizzle/0000_majestic_rogue.sql`, `drizzle/meta/*`
- `apps/api/scripts/setup-app-role.sql`
- `apps/api/test/auth.e2e-spec.ts`, `test/jest-e2e.json`
- `apps/api/package.json`, `apps/api/.env`, `apps/api/.env.example`
