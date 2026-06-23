# PlanningOS

UK planning & permitting operations platform (working title). A workflow engine for
the planning lifecycle — ingest documents, structure cases, detect missing items,
retrieve policy, and help humans move decisions forward. Multi-tenant from day one;
every AI output is explainable and high-risk actions require human approval.

> Status: **Phase 1 (Document Intelligence MVP)** — Batch 1.1 (repo + infra scaffold) complete.

## Monorepo layout

```
apps/
  api/        NestJS backend (TypeScript)
  web/        Next.js developer/consultant-facing app
packages/
  shared/     shared types & validation schemas
.claude/      project documentation suite (vision, architecture, data model, phases, compliance)
render.yaml   Render Blueprint (infra-as-code) — draft
```

## Stack

- **Backend:** NestJS 11, Drizzle ORM, PostgreSQL
- **Frontend:** Next.js 16 / React 19
- **Queue:** BullMQ + Redis (added in a later batch)
- **Hosting:** Render (EU/Frankfurt region), Cloudflare in front for DNS/CDN/WAF
- **Monitoring:** Sentry

## Local development

Requires Node 20+ and a local PostgreSQL instance.

```bash
npm install                       # install all workspaces
cp apps/api/.env.example apps/api/.env   # then set DATABASE_URL
npm run dev                       # boots api (:3001) + web (:3000)
```

Health check: `GET http://localhost:3001/health`

## Documentation

Start with [.claude/STATE.md](.claude/STATE.md) for current status, then the numbered
docs in [.claude/](.claude/) for vision, architecture, data model, phase plan, and
compliance requirements.
