# 06_CODING_STANDARDS.md

## Universal code standard (every batch, no exceptions)
On every new code or design addition:
1. **Stress test** — edge cases, load, scalability implications
2. **Integration check** — confirm no conflicts or regressions with existing modules
3. **Actually run the code** + deep static analysis — do not declare a batch complete from reading code back, execute it
4. **Auto-fix obvious bugs** and report what was fixed
5. **Escalate critical architectural issues** for review rather than silently working around them
6. **Apply best practices** for the layer being touched

## Layer-specific verification
- **API (`apps/api`):** execute and test actual endpoints, not just unit-test in isolation
- **Admin/Web frontends:** lint + typecheck + build must pass; component tests for any non-trivial interactive component
- **Mobile (if/when Flutter components are added for this project):** lint + typecheck + component test

## Documentation-first, every integration
Before writing integration code for Drizzle, NestJS modules, BullMQ, Render's API/CLI, any AI provider SDK, or any third-party API (Idox/Civica/Northgate when Phase 3 arrives) — fetch current official docs. Do not write auth flows, query syntax, or API contracts from memory.

## Versioning
Check the actual current version of any library/SDK/model before referencing it in code, config, or documentation. Never hardcode a version or model name from training data.

## File and function discipline
- Max 300 lines per file
- Full doc-comments (JSDoc/TSDoc) on every function — mid-level readable, not terse
- No silent scope expansion — if you notice something outside the current batch needs attention, write it to `STATE.md` under "Notes for future batches," do not build it now

## Currency
If any calculation in this product touches GBP/USD or any other currency pair, fetch the live exchange rate — never use a hardcoded or estimated rate.
