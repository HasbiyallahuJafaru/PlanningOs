# 05_COMPLIANCE.md

## Build now vs. certify later (see prior conversation — do not conflate the two)

### Build now (architectural, cheap to do early, expensive to retrofit)
- **UK/EU data residency:** Render region pinned to EU/UK at provisioning. Cloudflare in front must have jurisdictional restrictions configured before any council/public data exists — do not assume default behavior is compliant.
- **RBAC via JWT tenant claims:** implemented in Phase 1 Batch 1.2, not deferred.
- **Audit logging:** `audit_events` table exists from Batch 1.3 onward, every meaningful action writes a row.
- **Article 22 (UK GDPR automated decision-making):** any AI output that could materially affect an application's outcome requires human approval before being final. This is implemented as `requires_human_review` on `extracted_fields` and equivalent flags on every later module's AI outputs. Non-negotiable, check for it in every batch involving AI output.
- **Data minimisation:** do not store personal data in any field that doesn't need it. Review `extracted_fields` contents against this before Phase 1 ships.
- **DPAs:** before integrating any AI vendor, storage provider, or sub-processor, confirm a Data Processing Agreement exists or is in the vendor's standard terms — flag this to the person if unclear, do not assume.
- **Accessible-by-default frontend:** even though Phase 1's dev/consultant users have no legal accessibility requirement, build to WCAG 2.2 AA from the start to avoid a Phase 3 retrofit.

### Certify later (Phase 3, budget time/cost for these, do not attempt to fake them)
- Cyber Essentials Plus
- ISO 27001
- G-Cloud / Crown Commercial Service framework listing
- Formal WCAG 2.2 AA audit + VPAT/accessibility statement
- FOI/EIR-ready record export tooling — planning records are subject to Freedom of Information Act 2000 / Environmental Information Regulations 2004 requests once council data exists
- Statutory retention period fields (planning decisions often permanent record; enforcement records have specific limitation periods) — add retention metadata to relevant tables at the start of Phase 3, not before

## Hard rules that apply at every phase
1. No AI-generated output is ever presented as final without a path to human override.
2. No personal data leaves UK/EU-pinned infrastructure.
3. No sub-processor (AI vendor, storage, email) is added without checking its data handling terms first.
4. No council or public-facing UI ships without an accessibility pass, regardless of phase.

## Flag, don't assume
If a batch touches anything in this file and the right answer isn't obvious from this document, stop and ask rather than picking a default — these are legal/regulatory areas, not engineering preferences.
