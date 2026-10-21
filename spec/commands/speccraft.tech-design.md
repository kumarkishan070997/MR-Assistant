# speccraft.tech-design.md

Command: `/speccraft.tech-design <business-spec-file>`
Auto mode: `/speccraft.tech-design auto <business-spec-file>` (see `## Auto Mode`)

Starts or continues planning LLD creation for a single business spec input. Produces one LLD artifact per in-scope layer — per this project's Layer Scope (`spec/architecture/ARCH-DECISIONS.md` §Layer Scope) — linked as companions only when Layer Scope is `both`.

---

## Command Intent

- Use named business spec as primary source
- Enter or continue planning LLD creation flow
- Validate input set is strong enough
- Run intake once (single pass, layer-agnostic REQ-IDs/AC-IDs) — do not split intake per layer
- Produce or update `LLD-FRONTEND-<STORY-ID>.md` and/or `LLD-BACKEND-<STORY-ID>.md` per Layer Scope, each citing the same requirement/AC IDs from the shared intake
- When Layer Scope = `both`: add a "Companion LLD Reference" section to each LLD naming its pair file and any cross-layer contract dependency. When Layer Scope is single-layer: that section states there is no companion (see §Output below)
- Update planning traceability (business requirement → LLD mappings, for the in-scope layer(s))
- Hand off into review, revision, or blocked state — one logical gate covering every in-scope LLD (the pair, when Layer Scope = `both`)

Does not: decompose into tasks, write code, write tests, edit the business spec.

---

## Required Input

One business spec file reference. File must be readable, in scope, and strong enough to support planning design for the in-scope layer(s).

An optional leading `auto` token selects auto mode (see `## Auto Mode`); absent means interactive mode.

---

## Pre-Execution Checks

**Step zero, before check 0 below and before anything else in this command — including reading the business spec file:** capture the real wall-clock `Start` timestamp per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable — applies even when this run ends immediately in `blocked` (e.g. Layer Scope unresolved) and on continuation turns, not only fresh invocations.

0. **Layer Scope resolved** — read `spec/architecture/ARCH-DECISIONS.md` §Layer Scope before anything else:
   - Present → honor it for the rest of this run.
   - Absent, and the file is empty/placeholder (no real `AD-FRONTEND-*`/`AD-BACKEND-*` content) → stop before any design work and ask the human interactively which Layer Scope applies (frontend / backend / both) — never infer or default this.
   - Absent, but the file already has real `AD-FRONTEND-*` and/or `AD-BACKEND-*` content (pre-existing project, set up before this convention existed) → treat as `both` — the only backward-compatible reading, since no repo could have functioned under the prior always-both system with just one layer's architecture populated. Note the missing section as a gap and recommend it be added; do not block on it.
1. Active phase is planning
2. Business spec file exists and is readable
3. Business scope can be identified
4. Stable requirement references exist or can be established via intake (one pass, shared by every in-scope LLD)
5. Relevant architecture references known or explicitly noted as absent — for the `AD-*` section(s) matching the in-scope layer(s), plus any `AD-X-*` cross-cutting decisions
6. `spec/architecture/ARCH-DECISIONS.md` has a `## Agent Delta` section immediately after its title if it has real (non-placeholder) content — if content exists but the delta is missing, stop and report the gap; do not design against it without the fast-path summary in place
7. **If API contract provided** — compare against business spec before designing; material conflict = hard stop: record specific mismatches, set status `blocked`, escalate to human
8. **If design references provided** — compare against business spec before designing; material conflict = hard stop: record specific mismatches, set status `blocked`, escalate to human

Checks 7 and 8 happen **before** any LLD section is written. Do not assume all sources agree.

---

## Documents This Command Must Use

- `spec/AGENTS.md`
- `spec/SPEC-HIERARCHY.md`
- `spec/REVIEW-AND-REVISION-POLICY.md`
- `spec/workflows/shared/STAGE-CONTRACT.md`
- `spec/workflows/shared/TRACEABILITY-RULES.md`
- `spec/workflows/lld/LLD-STAGE.md`
- `spec/architecture/ARCH-DECISIONS.md` — **read first**; §Layer Scope before anything else, then the locked decisions, which are non-negotiable and never re-derived or overridden; read the `AD-*` section(s) matching the in-scope layer(s) plus any `AD-X-*` cross-cutting decisions
- project architecture structure reference (see planning Read Order in `spec/AGENTS.md`)

Do NOT load full architecture specs as standard reads. Load only if architecture structure reference is insufficient for the specific design question.

---

## Expected Behavior

1. Read business spec; identify or establish stable requirement references — one intake pass, shared by every in-scope LLD
2. Read `ARCH-DECISIONS.md` before any design work — §Layer Scope, then the `AD-*` section(s) matching the in-scope layer(s) plus cross-cutting decisions
3. Read project architecture structure reference
4. Compare API contracts and design references against business spec — hard stop on material conflict
5. Determine relevant architecture constraints per in-scope layer
6. Apply reuse-before-build for all proposed units, in every in-scope layer — check existing modules, services, components, endpoints before proposing new ones
7. If frontend is in scope: write all required LLD sections for `LLD-FRONTEND-<STORY-ID>.md` (per `LLD-STAGE.md`); mark incomplete sections and open questions honestly
8. If backend is in scope: write all required LLD sections for `LLD-BACKEND-<STORY-ID>.md` (per `LLD-STAGE.md`); mark incomplete sections and open questions honestly
9. Only when Layer Scope = `both`: add the "Companion LLD Reference" section (14th LLD section) to each LLD — name the pair file, and state any cross-layer contract dependency (e.g. "depends on BACKEND section 9 endpoint `/checkout/confirm` returning `orderId`+`status`"). Single-layer scope: write §14 as `Not Applicable — Layer Scope is <frontend|backend> only`
10. Only when Layer Scope = `both`: check for same-story cross-layer conflict — does `LLD-FRONTEND-<id>.md` assume an API shape that contradicts `LLD-BACKEND-<id>.md`'s actual endpoint contract? If so, this is a same-story cross-layer conflict — hard stop, same handling as the cross-story "LLD vs LLD" conflict check. Single-layer scope: skip this check — there is no companion to conflict with
11. Update traceability: business requirements → LLD sections, for the in-scope layer(s); rows written here are always `Source = original` (see `spec/traceability/TRACEABILITY.md` §Business Spec to LLD)
12. If either LLD declares a backward dependency on another story (`Depends On` in §1 Metadata), write both the Backward row (this story) and the mirrored Forward row (the upstream story) to `spec/traceability/shared/STORY-DEPENDENCIES.md` in the same turn — never write one without the other
13. Assign honest state per LLD; prepare one review handoff covering every in-scope LLD

---

## Output

Primary: one LLD artifact per in-scope layer, mirrored per business module —
- `spec/lld/<module>/LLD-FRONTEND-<STORY-ID>.md` (frontend in scope)
- `spec/lld/<module>/LLD-BACKEND-<STORY-ID>.md` (backend in scope)

Every in-scope LLD cites the same requirement/AC IDs from the shared intake. When Layer Scope = `both`, each has a "Companion LLD Reference" section naming its pair plus any cross-layer contract dependency; when single-layer, that section states there is no companion.

Supporting: open questions, decision notes, traceability update, review-ready or blocked handoff — one summary block reporting every in-scope file path together.

---

## Failure & Block Conditions

Move to `revise` or `blocked` when:
- Business spec too vague for stable requirement IDs
- Relevant architecture constraints missing and materially needed for an in-scope layer
- `spec/architecture/ARCH-DECISIONS.md` has real content but no `## Agent Delta` section — blocked until added
- Source conflict prevents safe design interpretation
- API contract conflicts materially with business spec — hard stop
- Design references conflict materially with business spec — hard stop
- Edge cases or impacted areas cannot be safely identified
- **`LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` contradict each other's contract** (same-story cross-layer conflict, applies only when Layer Scope = `both`) — hard stop, log in Conflict Decisions the same way as a cross-story LLD vs LLD conflict

Use `blocked` when human resolution required.

When Layer Scope = `both`, a `revise` on one LLD does not require redoing the other — but the pair is reviewed as one logical gate, and downstream decomposition does not open until both are independently approved. When Layer Scope is single-layer, this is simply the single LLD's own revise/approve cycle.

---

## Auto Mode

Auto mode produces the same in-scope LLD artifact(s) under the same Pre-Execution Checks, Expected Behavior, and Failure & Block Conditions as interactive mode. The only thing it changes is **who clears the Exit Behavior review gate, and whether execution pauses to do it**.

This section is the authoritative behavior for every place elsewhere in this document that says "HARD STOP" or "wait for human response" — read those as scoped to interactive-mode invocation; in auto mode, this section's rules apply instead. This section applies whenever this command's behavior runs in auto mode: invoked directly as `/speccraft.tech-design auto <business-spec-file>`, or invoked by `/speccraft.orchestrate auto` for its Stage 2 (LLD Creation) / Stage 3 (LLD Review Gate).

### Who reviews

The agent itself reviews every in-scope LLD it just produced, using the same checklist a human reviewer would apply per `spec/workflows/lld/LLD-STAGE.md`. The review record is still written in full (reviewer type = `AI`).

### Outcome: `approved`

Proceed — the in-scope LLD(s) stand as produced. No pause.

### Outcome: `revise`

The agent revises the affected in-scope LLD(s) itself and re-reviews, up to **2 automatic revise-retries**. If still not clean after 2 retries, log the remaining issue(s) as Accepted Issues (Issue / Justification / Accepted By = `auto-mode-ai`) per `spec/workflows/shared/STAGE-CONTRACT.md` § Accepted Issues, and proceed with those issues visible in the review record — never silently dropped.

### Outcome: `blocked`

Does not stop the run:

1. write the full Conflict Decision row per `spec/workflows/shared/SHARED-POLICIES.md` § Conflict Decision Rules to the current story's traceability shard
2. resolve it — prefer the higher-authority source per `spec/SPEC-HIERARCHY.md`; when authority is genuinely ambiguous, take the most conservative interpretation and say so
3. set `Decided By` to `auto-mode-ai`, fill `Resolution` with the actual reasoning
4. set `Status` to `resolved` (never left `open`)
5. continue

### Exit Behavior in auto mode

Steps 1-4 of `## Exit Behavior` below still happen unchanged (file paths, handoff block, conflict rows, Workflow Metrics row). Step 5 does not apply. Instead:
- standalone (`/speccraft.tech-design auto`): report the same Minimal Command Handoff with `Mode: auto`, then stop — this command still does not invoke `/speccraft.decompose` itself, even in auto mode
- invoked by `/speccraft.orchestrate auto`: return control to that run's Stage 4; the run's own Final Consolidated Handoff covers this stage's outcome, no separate handoff needed here

---

## Exit Behavior

**Interactive mode: HARD STOP after every in-scope LLD artifact is produced. Auto mode: see `## Auto Mode`.**

1. Output every in-scope LLD file path and a brief coverage summary for each, in one summary block
2. Output minimal handoff block (command, input, phase, stage, in-scope artifact(s), state(s), requirement scope, traceability status, blockers, next action)
3. If conflict triggered hard stop (including same-story FRONTEND/BACKEND contract mismatch, when Layer Scope = `both`) — append one row per conflict to current story traceability shard `spec/traceability/<mirrored-business-path>/TRACEABILITY.md` under `Conflict Decisions` per `spec/workflows/shared/SHARED-POLICIES.md`
4. Append one row to current story traceability shard `spec/traceability/<mirrored-business-path>/TRACEABILITY.md` under `Workflow Metrics` per `spec/workflows/shared/SHARED-POLICIES.md`
5. Interactive mode: STOP — do not invoke `/speccraft.decompose`; wait for human response. Auto mode: see `## Auto Mode` § Exit Behavior in auto mode.

No in-scope LLD can be approved by the same execution that produced it (auto mode's own review, per `## Auto Mode`, is the documented exception).
If human responds `revise: [reason]` (naming which LLD, or all of them) → revise the named LLD(s) and stop again with new handoff.
If human responds `blocked: [reason]` → record blocker and stop.
Decomposition (Stage 4) does not begin until every in-scope LLD is independently `approved` (both `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md`, when Layer Scope = `both`).
