# CLAUDE.md — Master Instructions

This file is read first, every session, before any code is written. It governs how work happens on this project. Read the files referenced below in full before touching code.

## Project name (working title)
UK Planning and Permitting Platform — "PlanningOS" (placeholder, rename when branding is locked)

## Session start protocol (run every time, no exceptions)
1. `pip install graphifyy` (if not already installed in this environment)
2. Run `/graphify .` to index the codebase
3. Run `graphify claude install` (once per project — skip if already run)
4. Read `STATE.md` — this tells you the current phase, current batch, and what was last completed
5. Read the phase file referenced in `STATE.md` under `04_PHASE_PLAN.md`
6. Use `graphify query "..."` instead of grepping raw files for anything beyond trivial lookups

## Reading order for full context
1. `STATE.md` — where we are right now (read this every session, always)
2. `01_PROJECT_VISION.md` — what this product is and why
3. `02_ARCHITECTURE.md` — stack, hosting, monorepo structure
4. `03_DATA_MODEL.md` — schema, current and planned
5. `04_PHASE_PLAN.md` — phases broken into batches
6. `05_COMPLIANCE.md` — what must be true about every line of code (GDPR, residency, accessibility, audit)
7. `06_CODING_STANDARDS.md` — universal code standard, applies to every commit
8. `07_DEPLOYMENT.md` — Render setup, environments, secrets

## The batching rule (this is the core anti-hallucination mechanism)

**Never build more than one batch in a single session unless the batch is explicitly marked small.**

A batch is a self-contained, independently testable unit of work defined in `04_PHASE_PLAN.md`. Before starting a batch:
- State which batch you are starting, out loud, in the response, before writing code
- Confirm the batch's stated inputs (what must already exist) are actually present — check the repo, don't assume
- Confirm the batch's stated outputs (what must exist when done) before declaring it complete

Do not jump ahead to a later batch "while you're in there." If you notice something a later batch needs, write it down in `STATE.md` under "Notes for future batches" — do not build it now. Scope discipline is what prevents drift across a long build.

## Documentation-first rule
Before writing any integration code for any external API, library, or SDK — fetch the current official documentation. Never rely on training data for syntax, auth flows, or API contracts, including for Drizzle, NestJS, BullMQ, Render, and any AI provider SDK. Versions move; assumptions about syntax from memory are a primary hallucination source on long projects.

## Model and library versions
Never hardcode a model name or library version from memory. Check npm/PyPI/the provider's docs for the current version before writing it into code or a config file.

## The 50% context handover protocol

When you estimate the current session's context usage has reached roughly 50%, stop new feature work and do the following before continuing:

1. Update `STATE.md` with exactly what's done, what's in progress, and what's next
2. Generate a new handover document using the template in `SESSION_HANDOVER_TEMPLATE.md`, save it as `handovers/HANDOVER_[YYYY-MM-DD]_[batch-name].md`
3. Tell the person explicitly: "Context is at roughly 50% — handover document written to `handovers/[filename]`. Recommend starting a new session and pointing me at `STATE.md` plus this handover file."
4. Do not start a new batch after this point in the same session unless told to continue anyway

This exists because long sessions degrade output quality before they hit hard context limits — handing over early, deliberately, with a clean written record, produces more reliable code than pushing a single session as far as it will go.

## Universal code standard (applies to every batch, every file)
See `06_CODING_STANDARDS.md` in full. Summary: stress test, integration check, run + statically analyze, auto-fix obvious bugs and report them, escalate architectural issues, apply best practices. API batches require actually executing and testing endpoints, not just reading the code back.

## Cost discipline
Route to the cheapest model/tool that meets the task. Evaluate DeepSeek/Kimi/Qwen alongside Claude/OpenAI for any AI-feature work in this product — see `02_ARCHITECTURE.md` for the current AI-adapter routing rules.
