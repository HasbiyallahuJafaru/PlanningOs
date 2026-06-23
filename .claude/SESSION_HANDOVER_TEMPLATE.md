# Session Handover Template

Copy this into `handovers/HANDOVER_[YYYY-MM-DD]_[batch-name].md` when context hits ~50%. Fill every section — do not leave anything as a placeholder when actually writing a real handover.

---

## Handover date
[date]

## Phase / batch in progress
[e.g. Phase 1, Batch 1.4 — Extraction pipeline]

## What was completed this session
[Specific, factual — "wrote the BullMQ extraction job and the AI adapter call" not "made progress on extraction"]

## What is in progress, not finished
[State exactly what's half-built and what's missing to finish it]

## What was verified (per the universal code standard)
- [ ] Stress tested
- [ ] Integration checked against existing modules
- [ ] Actually run + statically analyzed
- [ ] Any bugs found — list them and their fix status

## Decisions made this session
[Any architectural or scope decision made — even small ones, e.g. "chose X library version because Y"]

## Open questions / decisions NOT yet made
[Anything still unresolved — pull from STATE.md's open decisions list, update if any were resolved this session]

## Exact next step
[The single next action a fresh session should take — be specific enough that no re-reading of the whole batch plan is needed to know what to do first]

## Files touched this session
[List paths — helps the next session's first `graphify query` target the right area]

---

**After writing this file:** update `STATE.md` to reflect the same information in its condensed form, then tell the person the handover is ready and a new session should start.
