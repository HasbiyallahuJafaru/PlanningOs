# 07_DEPLOYMENT.md

## Platform
Render. All services and infra defined in `render.yaml` at repo root — this file is the source of truth, not the dashboard. Any change made by hand in the Render dashboard must be reflected back into `render.yaml` in the same session.

## Region
EU/UK region selected explicitly for every service and managed datastore. Verify this is set correctly before first deploy of each new service — do not assume it inherits from another service.

## Services (target, expand as phases progress)
- `api` — NestJS, Node service, EU/UK region
- `web` — Phase 1 frontend, static or Node SSR depending on framework choice made in Batch 1.1
- `admin` — added Phase 2/3 when officer casework begins
- Managed Postgres — EU/UK region, confirm before first migration runs
- Managed Redis — EU/UK region, for BullMQ

## Environments
- `development` — local, via `.env`, never committed
- `staging` — Render preview/staging service, used before any production deploy
- `production` — gated behind staging verification passing

## Secrets
Never in `render.yaml` or source code. Set via Render's secret management. `.env.example` in the repo documents required keys without values.

## DNS / CDN / WAF
Cloudflare sits in front of Render. Configure jurisdictional/regional restrictions in Cloudflare before any council or public data exists — see `05_COMPLIANCE.md`. Cloudflare does not run the application; this was a deliberate decision after evaluating Workers compatibility with NestJS + BullMQ.

## Pre-deploy checklist (every deploy to production)
- [ ] Staging passed the universal code standard checks in `06_CODING_STANDARDS.md`
- [ ] No secrets in committed files
- [ ] Migrations reviewed (Drizzle) — confirm migration history exists, do not rely on `db:push` alone in production
- [ ] Sentry receiving events from the deployed service
- [ ] Region confirmed EU/UK on every new service/datastore
