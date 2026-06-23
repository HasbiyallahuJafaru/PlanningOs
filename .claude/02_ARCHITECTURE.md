# 02_ARCHITECTURE.md

## Confirmed stack decisions (do not re-litigate these without explicit instruction)
- **Repo structure:** Monorepo — `apps/api`, `apps/admin`, `apps/web` (confirmed)
- **Backend:** NestJS — check current stable version via npm before scaffolding, do not assume a version from training data
- **ORM:** Drizzle — verify current syntax against official docs before writing schema, Drizzle's API has changed across versions
- **Database:** PostgreSQL, managed instance on Render, **EU/UK region explicitly selected at provisioning** — never rely on a default region
- **Queue:** BullMQ, backed by managed Redis on Render
- **Auth:** Universal JWT blueprint (see person's existing `AUTH_SYSTEM.md` pattern — rotating refresh tokens with reuse detection, tenant claim embedded in token)
- **Multi-tenancy:** `tenant_id` on every table from day one. Decide app-level scoping vs. Postgres RLS before Batch 1 of Phase 1 — this is an open decision, flag it, do not assume one silently.
- **File storage:** S3-compatible object storage for uploaded documents
- **Hosting:** Render — API, admin, web as separate services from the same monorepo; managed Postgres + Redis as add-ons in the same project. `render.yaml` (Blueprint) defines all services as git-tracked infra-as-code — do not configure services by hand in the dashboard without also writing it to `render.yaml`.
- **CDN/DNS/WAF:** Cloudflare sits in front of Render for DNS, CDN, and WAF only — it does not run the application. Do not attempt to deploy NestJS/BullMQ to Cloudflare Workers; this was evaluated and rejected (BullMQ's persistent-connection worker model does not fit the Workers runtime).
- **Error monitoring:** Sentry, wired in from the first commit, every service
- **AI adapter:** vendor-agnostic service layer — do not hardcode calls to a single provider's SDK inside business logic. Route by task:
  - Document extraction / classification → cheapest viable model that meets accuracy bar (evaluate DeepSeek, Haiku-tier, etc. — check current pricing/capability before assuming)
  - Ambiguous/complex documents → escalate to a stronger model only when the cheap-tier output fails a confidence check
  - Never hardcode a specific model string — store it in config, check for newer versions before each major batch

## Monorepo layout (target)
```
apps/
  api/        — NestJS backend
  admin/      — officer/internal dashboard (council-side, later phase)
  web/        — developer/consultant-facing app (Phase 1 priority)
packages/
  shared/     — shared types, validation schemas
  ui/         — shared component library (apply hasbiy-ui / ui-ux-pro-max design system here once installed)
.claude/      — this documentation suite
```

## Design system
UI/UX Pro Max skill — install locally per project (`uipro init --ai claude`), generate design system with `--persist` to `design-system/MASTER.md`. Light theme only. Style category must satisfy WCAG 2.2 AA — favor "Accessible & Ethical" / "Inclusive Design" categories over decorative styles, since the council/public-facing side has a legal accessibility requirement and the product should not have two visually inconsistent design systems for different user types.

## Open architectural decisions (resolve before relevant batch, do not silently default)
- RLS vs. app-level tenant scoping — resolve before Phase 1 Batch 1
- Whether `web` and `admin` are genuinely separate apps or one app with role-based views — resolve before Phase 2 (workflow engine) begins, since officer casework lives in `admin`
