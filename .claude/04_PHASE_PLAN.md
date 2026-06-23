# 04_PHASE_PLAN.md

Each batch lists: **Inputs** (what must already exist), **Build**, **Outputs** (what must exist when done, testable), **Do not** (explicit scope fences). Never start a batch whose inputs aren't met. Never do work listed under a later batch's "Build" early.

---

## PHASE 1 — Document Intelligence (MVP, dev/consultant-facing)

### Batch 1.1 — Repo + infra scaffold
**Inputs:** none (first batch)
**Build:** Monorepo skeleton (`apps/api`, `apps/web`, `packages/shared`), NestJS app boots, Drizzle connects to a local Postgres, `render.yaml` drafted (not yet deployed), Sentry wired into `api`.
**Outputs:** `npm run dev` boots api + web locally; a health-check endpoint returns 200; Sentry receives a test error.
**Do not:** write any business logic, any table beyond a placeholder, or touch auth yet.

### Batch 1.2 — Auth + tenancy
**Inputs:** Batch 1.1 complete
**Build:** Universal JWT blueprint implemented (users, roles, refresh_tokens, auth_audit tables), tenant claim in token, resolve RLS-vs-app-level scoping decision (flagged open in `02_ARCHITECTURE.md`) and implement it.
**Outputs:** can register a tenant + user, log in, receive a token, hit a protected route, get tenant-scoped data back; a second tenant cannot see the first tenant's data (write an actual test proving this).
**Do not:** build project/document tables yet.

### Batch 1.3 — Project + document upload
**Inputs:** Batch 1.2 complete
**Build:** `projects` and `documents` tables, S3-compatible upload flow, file stored, `audit_events` row written on upload.
**Outputs:** an authenticated user can create a project, upload a file, see it listed; an audit event exists for the upload.
**Do not:** build extraction yet — this batch is upload/storage only.

### Batch 1.4 — Extraction pipeline
**Inputs:** Batch 1.3 complete
**Build:** BullMQ job triggered on upload, AI adapter call (cheapest viable model, per `02_ARCHITECTURE.md` routing rules), `extracted_fields` populated, confidence scoring, `requires_human_review` flag set per the Article 22 rule.
**Outputs:** uploading a real planning document produces structured extracted fields visible via API; low-confidence fields are flagged; a human-approval step exists before any extraction is treated as final.
**Do not:** build missing-item detection logic yet — that's the next batch.

### Batch 1.5 — Missing-item detection + summary
**Inputs:** Batch 1.4 complete
**Build:** rule-based or AI-assisted check for missing required document types per a configurable checklist; summary generation per project.
**Outputs:** a project with incomplete documents shows a missing-items list; a project summary can be generated and is explainable (cites which documents/fields it drew from).
**Do not:** build the `web` frontend's full UI polish yet unless a batch explicitly says so — backend correctness first.

### Batch 1.6 — Web frontend (Phase 1 UI)
**Inputs:** Batches 1.1–1.5 complete and tested
**Build:** `apps/web` — upload flow, project list, extracted fields view, missing-items view, summary view. Apply the design system from `design-system/MASTER.md` once generated (light theme, see `02_ARCHITECTURE.md`).
**Outputs:** a developer/consultant user can complete the full Phase 1 flow end-to-end through the UI.
**Do not:** build admin/officer views — that's Phase 2/3, different app.

---

## PHASE 2 — Workflow Engine

### Batch 2.1 — Tasks, deadlines, comments
**Inputs:** Phase 1 complete
**Build:** `tasks` table, assignment, deadline tracking, comment threads on projects.

### Batch 2.2 — Precedent data capture begins
**Inputs:** Batch 2.1 complete
**Build:** ingestion of publicly available planning decision data (per-council, where published) into a precedent store — capture only, no retrieval logic yet.
**Do not:** build retrieval/matching yet — that's Phase 4, once volume exists.

---

## PHASE 3 — Council Entry: Policy, Enforcement, BNG, Interop

This phase only starts once there is a real council relationship or signed pilot — do not pre-build council-specific work speculatively.

- Policy library + retrieval
- Enforcement casework (`enforcement_cases`, `appeals` tables)
- BNG module (`bng_records`, `habitat_units`)
- Interop layer (Idox/Civica/Northgate) — confirm which system the actual pilot council uses before building a specific adapter; do not build generic interop speculatively
- Council-specific RBAC roles (`officer`, `enforcement_officer`, `manager`)
- Compliance certification track begins in parallel (Cyber Essentials Plus, WCAG AA formal audit, G-Cloud listing) — see `05_COMPLIANCE.md`

---

## PHASE 4 — Build-out, Analytics, Precedent Retrieval Live
- `milestones` table, condition discharge tracking
- Analytics/dashboard module
- Precedent retrieval goes live (matching, not just storage) — only once Phase 2's capture has accumulated enough decided cases

## PHASE 5 — Multi-authority Platform
- Per-council configuration (local plan variation, service structure)
- Enterprise security hardening, full procurement readiness
