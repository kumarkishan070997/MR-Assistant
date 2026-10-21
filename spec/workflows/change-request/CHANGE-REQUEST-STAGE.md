# Change Request (CR) Stage

## Agent Delta

**Stage:** Change Request — alternate planning entry for an already-approved story; replaces stages 1-5 only
**Entry:** original story S has every in-scope LLD (`LLD-FRONTEND-<S>.md` and `LLD-BACKEND-<S>.md` both, when Layer Scope = `both`; the single in-scope LLD otherwise) at `approved`/`done`; a CR file identifies S and is classified "Change Request" by the CR Eligibility Check
**Output:** one combined bundle — for S and every compatible forward-reachable dependent found by the cascade: an LLD delta (`## Change Requests` section, new IDs) in whichever companion file(s) the coupling actually named, plus a decomposition delta (new Layer-tagged task files continuing that story's own sequence) — submitted together as one review gate
**Mechanism:** two-pass, atomic — Pass 1 (CR-0 through CR-4) is read-only discovery; nothing is written until Pass 1 finds zero conflicts across the whole reachable subgraph; Pass 2 (CR-5) applies the bundle
**Cascade:** auto-cascades a compatible change through the full forward-reachable dependent chain (not one hop, not flag-and-stop) — tracked via `spec/traceability/shared/STORY-DEPENDENCIES.md`
**Must not:** write anything if any conflict or data-integrity error is found anywhere in the walk; edit an existing ledger row's Touchpoint text (v1 restriction — a CR only adds new rows for newly-created delta stories); re-open Implementation/Testing/Integration/Validation stage docs — CR-produced delta tasks enter the existing unified pipeline (stage 6 onward) exactly like normal decomposition output
**Blocked when:** CR Eligibility Check resolves to anything other than "Change Request"; S's in-scope LLD(s) are not all `approved`/`done`; ledger integrity check finds a mismatched Backward/Forward pair; cycle detected while walking forward dependents; any conflict found anywhere in the cascade
**Done when:** the combined bundle (S + every compatible cascaded story) is `approved` as one gate; each delta story's tasks have entered the normal stage 6+ pipeline and completed it

---

## Overview

`/speccraft.change` is an alternate entry point into planning for a story whose in-scope LLD(s) are already `approved`/`done`. It does not restart the workflow from Intake — it reads what already exists, discovers how far a compatible change can safely propagate through other stories that depend on the changed story, and either applies the whole compatible set atomically or blocks the entire run on the first conflict found anywhere in the walk.

This document defines only the CR-specific stages (CR-0 through CR-5). Once the combined bundle is approved, every delta task produced — whatever `Layer` it carries — re-enters the existing pipeline at stage 6 (Scaffold Check) and proceeds exactly as normal decomposition output would: `IMPLEMENTATION-STAGE.md`, `TESTING-STAGE.md`, `INTEGRATION-TESTING-STAGE.md` (backend-tagged tasks only), and `VALIDATION-STAGE.md` require **zero edits and zero CR-awareness** — a CR-produced task is indistinguishable from one produced by ordinary `/speccraft.decompose`. There is no separate frontend/backend CR stage table; the existing per-task `Layer` branch (see `spec/AGENTS.md` §Workflow Shape) already handles this.

Read this document together with:

- `spec/AGENTS.md`
- `spec/REVIEW-AND-REVISION-POLICY.md`
- `spec/workflows/shared/STAGE-CONTRACT.md`
- `spec/workflows/shared/TRACEABILITY-RULES.md`
- `spec/workflows/shared/SHARED-POLICIES.md` (for the `Source` traceability column values and the `## Change Request: CR-<n>` progress schema CR-5 writes)
- `spec/workflows/lld/LLD-STAGE.md` (for the `Depends On` metadata field and companion-pair conventions a CR reuses)
- `spec/workflows/decomposition/DECOMPOSITION-STAGE.md` (for the delta-scoped decomposition a CR triggers)

---

## CR Eligibility Check

Classify the incoming request before anything else runs:

| Category | Criteria | Correct path |
|---|---|---|
| Pre-approval revision | Target story's LLD pair is not yet `approved`/`done` | `/speccraft.tech-design` — ordinary revision, not a CR |
| Defect fix | Code/tests diverge from an already-approved LLD/task | Reopen Implementation/Testing for that task via the existing Locked Artifact Rule (`spec/AGENTS.md` §Hard Boundary Rule) — no `/speccraft.change` |
| **Change Request** | Deliberately changes/extends approved behavior; attaches to ≥1 existing requirement ID or one new one under the same story; LLD needs only a delta | `/speccraft.change` — this stage |
| New story | Doesn't attach to the existing story, or would rewrite most of its LLD pair / invalidate multiple `done` tasks | New business spec via `/speccraft.tech-design`; consider marking the old story superseded |

Anything other than "Change Request" → `/speccraft.change` refuses and redirects to the correct path; it does not proceed.

---

## Entry Conditions

`/speccraft.change` may begin only when:

- **Start timestamp captured** — before any other entry condition is evaluated, before the CR Eligibility Check itself, capture the real wall-clock `Start` per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable, captured once for the whole cascaded run, including when the Eligibility Check redirects elsewhere.
- the CR Eligibility Check above resolves to "Change Request"
- every one of the original story S's in-scope LLD(s) is `approved`/`done` — `LLD-FRONTEND-<S>.md` **and** `LLD-BACKEND-<S>.md` both, when Layer Scope = `both` (if either is not, `blocked` — pointing to `/speccraft.tech-design`); the single in-scope LLD otherwise
- the CR file is readable and identifies S unambiguously

---

## Stage Model

| Stage | Name | What happens |
|---|---|---|
| CR-0 | Ledger Integrity Check | Read `spec/traceability/shared/STORY-DEPENDENCIES.md`. Every Backward row must have a matching Forward row and vice versa, for S and everything reachable below it. Mismatch → data-integrity error, `blocked`, stop before anything else runs. |
| CR-1 | CR Eligibility Check | Classify per the table above. Anything but "Change Request" → refuse and redirect, do not proceed. |
| CR-2 | Original Story Gate | Confirm every in-scope LLD (`LLD-FRONTEND-<S>.md` and `LLD-BACKEND-<S>.md` both, when Layer Scope = `both`; the single in-scope LLD otherwise) is `approved`/`done`. Any not → `blocked`, pointing to `/speccraft.tech-design`. |
| CR-3 | Pass 1 — Discovery (read-only) | Targeted-check S's own backward deps: read only the Touchpoint section each names. Conflict with what S consumes → `Conflict Decisions` row, `blocked`, stop. Then walk S's forward dependents transitively, tracking visited story IDs (cycle → data-integrity error, `blocked`, stop). For each dependent D reached via parent P: read D's own Backward row for P (already recorded when D's LLD was created) — this gives D's Touchpoint on P, naming which companion file(s) it binds to. **Unaffected** → prune this branch entirely. **Affected, compatible** → mark D for the apply bundle; continue the walk to D's own forward dependents (D becomes the next P). **Affected, conflicting** → record a `Conflict Decisions` row identifying the P↔D break (Conflict Type `Story vs Story`), mark the **entire CR run** `blocked`, stop the whole walk — not just this branch. |
| CR-4 | Pass 1 — Conflict Gate | If CR-0 or CR-3 found any conflict or integrity error anywhere in the reachable subgraph → exit now. Nothing has been written to any file. |
| CR-5 | Pass 2 — Apply + Combined Review | Only runs if Pass 1 found zero conflicts. For S and every compatible node, in traversal order: assign new requirement/AC IDs continuing that story's own existing numbering (never renumber/delete; mark replaced ones "superseded by `<new-id>`"). Append a `## Change Requests` section to whichever companion file(s) (`LLD-FRONTEND-<id>.md` and/or `LLD-BACKEND-<id>.md`) the triggering Touchpoint actually named — CR ID, source ref (for cascaded nodes: which upstream story's change triggered this), date, requirement IDs added/superseded, affected LLD sections, new edge cases, open questions. Apply `DECOMPOSITION-STAGE.md` to that story's delta only: new task file(s) continuing its own `TASK-<STORY-ID>-{FRONTEND\|BACKEND}-T*` sequence, in the Layer(s) actually affected. Update that story's traceability shard with new business→LLD and LLD→task rows for the delta, each row's `Source` set to `CR-<n>` (that story's own CR sequence number, never the literal word "change-request") — never `original`, so a reviewer or dashboard can isolate exactly which rows this CR introduced. Append a `## Change Request: CR-<n>` section to that story's progress file per the schema in `spec/workflows/shared/SHARED-POLICIES.md` §Change Request Log Rules — including the Cascade Impact table (populated from the CR-3 walk result: every story visited, its relationship, and its `pruned`/`included`/`blocking` decision) on story S's entry only; cascaded stories' entries carry `Role: cascaded` and point back to S via `Originating Story` and `Trigger Reason` instead of repeating the walk. Submit the **entire bundle** — S's delta plus every cascaded story's delta — together for one combined review. |

**Stage 6 onward is not re-specified here.** Once CR-5's bundle is approved, every delta task (whatever `Layer` it carries) enters the existing pipeline at Scaffold Check exactly as normal decomposition output would, branching on its own `Layer` field per `spec/AGENTS.md` §Workflow Shape (backend-tagged tasks run Integration Testing; frontend-tagged tasks skip straight to Final Validation).

---

## Depends On vs. the Companion-Pair Convention

Story dependency is a **story-level** fact, not a per-layer one — a story depends on another story, full stop. `STORY-DEPENDENCIES.md` rows key on Story ID only, no `Layer` column. The `Depends On` field in each companion LLD's §1 Metadata (see `LLD-STAGE.md`) is populated identically in both `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` for a given story. All layer-specificity lives in the free-text **Touchpoint** column, which names the exact companion file and section a coupling actually binds to (e.g. `"consumes LLD-BACKEND-US-2 §5 API touchpoint /orders shape"` vs `"consumes LLD-FRONTEND-US-2 §10 state shape"`) — the same pattern `SHARED-POLICIES.md` already uses for the companion-pair conflict trigger.

Consequence for CR-3/CR-5: a dependent is read and touched only in the companion file(s) its own Touchpoint actually names — never both files by default. A CR never has to open both companion files of every downstream dependent, only the one(s) actually named by that hop's Touchpoint.

---

## Input Contract

Required: `<CR-file>` (identifies target story S and describes the intended change), `<original-story-id>` (S). Both must be present and readable before CR-0 runs.

Read (in addition to S's own business spec, approved LLD pair, delivery tasks, progress, and traceability shard): `spec/traceability/shared/STORY-DEPENDENCIES.md` in full for the Backward/Forward integrity check and the forward walk.

---

## Output Contract

One combined bundle: for S and every node marked compatible in Pass 1 — an LLD delta in the affected companion file(s), a decomposition delta (new task files, delta-scoped, continuing that story's own numbering), a traceability update (new rows in that story's existing shard, `Source = CR-<n>`), and a progress update (`## Change Request: CR-<n>` section per `SHARED-POLICIES.md` §Change Request Log Rules, Cascade Impact table on S's entry only). All of it submitted together, one review response covers the whole bundle.

---

## Review Checklist

Review must end with `approved`, `revise`, or `blocked` for the **whole bundle** — not per-story.

| # | Check | Trigger |
|---|-------|---------|
| 1 | **Eligibility correctness** — CR was genuinely eligible for `/speccraft.change`, not a mis-routed pre-approval revision, defect fix, or new story | `blocked` if mis-routed |
| 2 | **Ledger integrity** — Backward/Forward rows mirrored for S and the whole reachable subgraph | `blocked` if mismatch found post-hoc |
| 3 | **ID continuity** — every new requirement/AC/task ID continues its story's own existing sequence; no renumbering, no deletion; superseded IDs marked, not removed | `revise` if violated |
| 4 | **Bundle completeness** — every node Pass 1 marked compatible actually appears in the bundle; no silently dropped cascaded story | `revise` if incomplete |
| 5 | **Layer correctness** — each delta LLD/task change landed only in the companion file(s)/Layer(s) its Touchpoint actually named | `revise` if a change bled into an unaffected companion file |
| 6 | **Atomicity evidence** — nothing was written for any story before Pass 1 completed with zero conflicts | `blocked` if evidence suggests partial application |

---

## Revision Rules

When `revise`: address findings for the specific story/stories named, without re-walking the whole cascade from scratch unless the revision itself changes a Touchpoint's compatibility assessment. Preserve: IDs already assigned, ledger rows already written, unaffected stories correctly excluded from the bundle. Must not: renumber IDs, silently drop a cascaded story from the bundle, re-open a story's already-`approved` non-CR sections beyond what the CR delta requires.

Use `blocked` when: a conflict surfaces during review that Pass 1 missed; the CR itself needs to change an existing dependency (out of scope for `/speccraft.change` v1 — route to a human decision on how to update `STORY-DEPENDENCIES.md` directly, outside this command).

---

## Done Criteria

1. CR Eligibility Check passed
2. Ledger integrity check passed for S and the full reachable subgraph
3. Pass 1 discovery completed with zero unresolved conflicts
4. Bundle (S + every compatible cascaded story) approved as one gate
5. Every delta task entered stage 6+ and completed the normal pipeline for its `Layer`
6. Traceability and progress updated for every story touched by the bundle, each cascaded entry cross-referencing the originating story

False-done patterns: bundle marked approved while a conflict remains open in any cascaded branch; a delta task treated as needing separate CR-aware Implementation/Testing/Validation logic; a ledger row added without its mirrored counterpart in the same turn.
