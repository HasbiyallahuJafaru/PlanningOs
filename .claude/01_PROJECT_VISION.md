# 01_PROJECT_VISION.md

## What this is
A full-stack planning operations platform for the UK planning and permitting lifecycle. Not a chatbot — a workflow engine that ingests documents, structures cases, detects missing items, retrieves relevant policy, and helps humans move decisions forward. Every AI output is explainable and links back to source documents; high-risk actions require human approval. This is an architectural rule, not a preference — see `05_COMPLIANCE.md`.

## Who it serves, in order of go-to-market
1. **Developers and planning consultants** (first buyer — shorter sales cycle, no procurement gate)
2. **Councils** (entered later, once dev/consultant usage + precedent data exist — see Phase 3 in `04_PHASE_PLAN.md`)
3. **The public** (consultation/objection layer, introduced once council relationships exist)

This sequencing matters architecturally: the system must be multi-tenant from day one (confirmed decision) so a council tenant can be added later without a schema rebuild, even though councils are not the first customer.

## Core product behavior rules (non-negotiable, apply to every module)
- AI is used for narrow, controllable tasks only: document extraction, classification, policy retrieval, summarization, issue detection, precedent comparison, deadline reminders
- Every AI-generated recommendation must cite its source document or policy reference
- Any action that materially affects a person's application (e.g. flags it as non-compliant) requires human approval before it's final — this is an Article 22 (UK GDPR automated decision-making) architectural constraint, not just good practice
- The system never replaces officer judgement

## Modules (full list, not all built at MVP — see `04_PHASE_PLAN.md` for sequencing)
A. Pre-application — submission completeness checking
B. Application intake — structured case ingestion
C. Policy intelligence — policy retrieval + precedent feedback loop (precedent loop is a later enhancement, not MVP)
D. Officer casework — case dashboard (council-side, later phase)
E. Committee pack generation (council-side, later phase)
F. Enforcement — breach tracking, notices, appeals (council-side, later phase)
G. Build-out monitoring — condition discharge, milestone tracking
H. Analytics — backlog, turnaround, bottleneck reporting
I. Interop layer — Idox/Civica/Northgate integration (council-side, Phase 3, NOT Phase 1)
J. Biodiversity Net Gain tracking (Phase 3, mandatory UK compliance dataset since 2024)

## What MVP (Phase 1) actually is
Document intelligence only: upload, extract structured fields, flag missing items, generate summary. Sold to developers/consultants. No interop, no council casework, no enforcement, no BNG tracking yet. Resist scope creep into these — they are real modules with real cost, not checkboxes.

## Explicit non-goals for MVP
- No GIS/spatial layer yet (constraint lookups deferred)
- No public consultation portal yet
- No incumbent system interop yet
- No multi-authority configurability yet (multi-tenant ≠ multi-authority — tenant isolation exists, council-specific policy configuration does not)
