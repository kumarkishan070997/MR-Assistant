# speccraft.change.md

Command: `/speccraft.change <CR-file> <original-story-id>`

Applies a Change Request to an already-approved story S and auto-cascades it, atomically, through every forward-reachable story that depends on S — as far as compatibility holds.

---

## Command Intent

- Use the named CR file and story ID as primary sources
- First classify the request via the CR Eligibility Check (`spec/workflows/change-request/CHANGE-REQUEST-STAGE.md`) — proceed only if it resolves to "Change Request"
- Read-only discovery pass (Pass 1): check S's own backward dependencies, then walk S's forward dependents transitively via `spec/traceability/shared/STORY-DEPENDENCIES.md`, pruning unaffected branches and marking compatible ones for the bundle
- Any conflict or data-integrity error anywhere in the walk blocks the **entire** run — nothing is written
- Apply pass (Pass 2, only if Pass 1 is clean): write an LLD delta + decomposition delta for S and every compatible cascaded story, in the companion file(s) each Touchpoint actually named
- Submit the whole bundle for **one** combined review

Does not: restart Intake; re-open Implementation/Testing/Integration/Validation stage docs; edit an existing `STORY-DEPENDENCIES.md` row's Touchpoint text; touch any story outside the forward-reachable subgraph from S.

---

## Required Input

- `<CR-file>` — readable, identifies target story S and describes the intended change
- `<original-story-id>` — S, must resolve to an existing story with an approved LLD pair

---

## Pre-Execution Checks

**Step zero, before check 1 below and before anything else in this command — including reading the CR file:** capture the real wall-clock `Start` timestamp per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable — applies even when this run ends immediately in `blocked` (e.g. the CR Eligibility Check redirects elsewhere), and applies once for the whole cascaded run, not per walked story.

1. CR Eligibility Check resolves to "Change Request" (see table in `CHANGE-REQUEST-STAGE.md`) — else refuse and redirect to the correct path (`/speccraft.tech-design`, Locked Artifact Rule reopen, or new business spec), do not proceed
2. every one of S's in-scope LLD(s) is `approved`/`done` — `LLD-FRONTEND-<S>.md` **and** `LLD-BACKEND-<S>.md` both, when Layer Scope = `both`; the single in-scope LLD otherwise — else `blocked`, pointing to `/speccraft.tech-design`
3. CR file is readable and unambiguously identifies S
4. `spec/traceability/shared/STORY-DEPENDENCIES.md` exists and is readable

If these checks fail materially, do not proceed to discovery.

---

## Documents This Command Must Use

- `spec/AGENTS.md`
- `spec/SPEC-HIERARCHY.md`
- `spec/REVIEW-AND-REVISION-POLICY.md`
- `spec/workflows/shared/STAGE-CONTRACT.md`
- `spec/workflows/shared/TRACEABILITY-RULES.md`
- `spec/workflows/shared/SHARED-POLICIES.md` (§Change Request Log Rules — `Source` column values, progress entry schema, Cascade Impact table)
- `spec/workflows/change-request/CHANGE-REQUEST-STAGE.md`
- `spec/workflows/decomposition/DECOMPOSITION-STAGE.md` (for delta-scoped decomposition)
- `spec/traceability/shared/STORY-DEPENDENCIES.md`

---

## Expected Behavior

**Pass 1 — Discovery (read-only, no writes):**

1. Read S's business spec, approved LLD pair, delivery tasks, progress, and traceability shard.
2. Read the CR file; identify what changes vs. what stays untouched.
3. Look up S in `STORY-DEPENDENCIES.md`. Cross-check Backward/Forward tables are mirrored consistently for S and everything reachable below — mismatch → data-integrity error, `blocked`, stop (nothing further runs).
4. Targeted-check S's own backward deps: read only the Touchpoint section each names. Conflict with what S consumes → `Conflict Decisions` row, `blocked`, stop.
5. Walk S's forward dependents transitively, tracking visited story IDs (cycle → data-integrity error, `blocked`, stop). For each dependent D reached via parent P: read D's own Backward row for P (its Touchpoint, naming which companion file(s) it binds to). Unaffected → prune this branch. Affected + compatible → mark D for the bundle, continue the walk to D's own forward dependents. Affected + conflicting → record a `Conflict Decisions` row (Conflict Type `Story vs Story`) identifying the P↔D break, mark the **entire CR run** `blocked`, stop the whole walk.
6. Any conflict or integrity error anywhere → exit now. Nothing has been written to any file.

**Pass 2 — Apply (only if Pass 1 found zero conflicts):**

7. For S and every compatible node found in Pass 1, in traversal order: assign new requirement/AC IDs continuing that story's own existing numbering (never renumber/delete; mark replaced ones "superseded by `<new-id>`"). Append a `## Change Requests` section to whichever companion file(s) the triggering Touchpoint actually named. Apply `DECOMPOSITION-STAGE.md` to that story's delta only, continuing its own `TASK-<STORY-ID>-{FRONTEND|BACKEND}-T*` sequence. Update that story's traceability shard with new business→LLD and LLD→task rows for the delta, `Source` set to `CR-<n>` (that story's own CR sequence number — see `spec/workflows/shared/SHARED-POLICIES.md` §Change Request Log Rules). Append a `## Change Request: CR-<n>` section to that story's progress file per the same schema — Role `originating` for S with a Cascade Impact table recording the CR-3 walk result, Role `cascaded` cross-referencing S for every other node.
8. Submit the entire bundle — S's delta plus every cascaded story's delta — together for one combined review.

---

## Output

Primary: for S and every compatible cascaded story — LLD delta section(s), delta task files continuing that story's own sequence, updated traceability rows (`Source = CR-<n>`), updated progress section (`## Change Request: CR-<n>` per `SHARED-POLICIES.md` §Change Request Log Rules). All reported together as one bundle.

Supporting: list of stories walked, pruned (unaffected), included (compatible), or blocking (conflicting); ledger integrity result; review-ready or blocked handoff for the whole bundle.

---

## Failure & Block Conditions

Move to `blocked` when:
- CR Eligibility Check resolves to anything other than "Change Request"
- S's in-scope LLD(s) are not all `approved`/`done` (both, when Layer Scope = `both`)
- `STORY-DEPENDENCIES.md` Backward/Forward tables mismatch anywhere in the reachable subgraph
- A cycle is detected while walking forward dependents
- Any conflict is found anywhere in the cascade (S's own backward deps, or any P↔D hop)

None of the above may be worked around by narrowing scope silently — a conflict anywhere blocks the whole run, not just the branch it was found in.

---

## Exit Behavior

**HARD STOP after the bundle is produced (or after Pass 1 blocks).**

1. Output the walked-story list (pruned / included / blocking) and, if not blocked, the full bundle summary (every LLD delta + task delta produced)
2. Output minimal handoff block (command, CR file, story S, bundle contents or block reason, review need, next action)
3. If blocked: report exactly which check failed and why; confirm nothing was written
4. If bundle produced: append rows to each touched story's traceability shard per `spec/workflows/shared/SHARED-POLICIES.md`
5. STOP — do not invoke `/speccraft.decompose` separately for the delta, do not begin execution; wait for human response covering the whole bundle

This hard stop replaces the separate LLD Review Gate and Decomposition Review Gate for the delta scope only — it does not collapse the Implementation/Testing/Integration/Validation gates downstream, which still run per-task as normal once the bundle is approved and each delta task proceeds through the existing stage 6+ pipeline.

The bundle cannot be approved by the same execution that produced it. If human responds `revise: [reason]` → revise the named story/stories and stop again. If human responds `blocked: [reason]` → record blocker and stop.
