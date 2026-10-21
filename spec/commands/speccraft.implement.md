# speccraft.implement

Command starts execution implementation stage from an approved delivery task.

Auto mode: an optional leading `auto` token selects auto mode (see `## Auto Mode`); absent means interactive mode.

---

## Required Input

- task file path or task identifier
- confirmation that task status is `approved`

---

## Fresh Context Rule

**Each task invocation starts a fresh context.** Do not carry over prior task implementation context. Load only what this specific task needs. This keeps per-task token cost bounded and prevents context bloat across tasks.

---

## Execution Rule

**Before anything else in this invocation — before reading the task's `Layer` field, before any file read:** capture the real wall-clock `Start` timestamp per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable, and it applies fresh to each task invocation per the Fresh Context Rule above — a new context means a new `Start` capture, never a carried-over or guessed one.

For each task invocation, read the task's `Layer` field **first** — it determines the code root, the architecture section, and the rule files for the rest of this list. Filename tag (`-FRONTEND-`/`-BACKEND-`) is belt-and-suspenders only; branch on the `Layer` field programmatically, not on the filename.

Read in order:

1. `spec/AGENTS.md`
2. relevant execution stage doc under `spec/workflows/` (implementation stage)
3. the approved task file — read its `Layer` field before anything else in this list
4. `spec/architecture/ARCH-DECISIONS.md` — **read before writing any code**; locked decisions are non-negotiable; `Layer: frontend` → read the `AD-FRONTEND-*` section, `Layer: backend` → read the `AD-BACKEND-*` section (either may also depend on `AD-X-*` cross-cutting decisions) (+ any other arch spec files this project added)
5. `Layer: frontend` → `src-code-frontend/AGENTS.md`; `Layer: backend` → `src-code-backend/AGENTS.md` — implementation rule routing for that root

Then write implementation output to the routed root: `Layer: frontend` → `src-code-frontend/`; `Layer: backend` → `src-code-backend/`.

For any API operation this task touches: `Layer: backend` — the approved `LLD-BACKEND-<id>.md` §5 touchpoint table entry is the binding shape; write or update `contracts/<module>/<module>.yaml` to match it as part of this task's own implementation output — the contract file does not need to pre-exist. `Layer: frontend` — read `contracts/<module>/<module>.yaml` if the operation is already there (its backend dependency has landed); otherwise use the approved, companion-checked LLD touchpoint table as the interim shape for a mocked implementation, and reconcile against the real file once the dependency resolves. If an operation has neither a real contract entry nor an approved LLD touchpoint entry, the task is `blocked` — do not hand-write a shape with no design-time authority.

Load additional rule files **only if the task explicitly requires them** — follow routing in the layer's `AGENTS.md`: `src-code-frontend/rules/` for frontend tasks, `src-code-backend/rules/` for backend tasks (created by that layer's `/speccraft.scaffold`; empty until a project fills them in).

Do NOT load full architecture specs beyond `ARCH-DECISIONS.md`'s `## Agent Delta` section as a standard read unless it's insufficient for the current task.

---

## Auto Mode

Auto mode produces the same implementation output under the same Execution Rule as interactive mode. The only thing it changes is **who clears the Implementation Review Gate, and whether execution pauses to do it**.

This section is the authoritative behavior for every place elsewhere in this document that says "STOP" or "wait for human response" — read those as scoped to interactive-mode invocation; in auto mode, this section's rules apply instead. This section applies whenever this command's behavior runs in auto mode: invoked directly as `/speccraft.implement auto <task-id>`, or invoked by `/speccraft.orchestrate auto` for its Stage 6 (Task-To-Code Execution) / Stage 7 (Implementation Review Gate).

### Who reviews

The agent itself reviews the implementation it just produced against the task's scope and the layer's architecture decisions, the same criteria a human reviewer would apply. The review record is still written in full (reviewer type = `AI`).

### Outcome: `approved`

Proceed to code-to-unit-tests. No pause.

### Outcome: `revise`

The agent revises the implementation itself and re-reviews, up to **2 automatic revise-retries**. If still not clean after 2 retries, log the remaining issue(s) as Accepted Issues (Issue / Justification / Accepted By = `auto-mode-ai`) per `spec/workflows/shared/STAGE-CONTRACT.md` § Accepted Issues, and proceed with those issues visible in the review record — never silently dropped.

### Outcome: `blocked`

Does not stop the run:

1. write the full Blocker/Decision row per `spec/workflows/shared/SHARED-POLICIES.md` § Blocker And Decision Log Rules to the current story's traceability shard
2. resolve it — prefer the higher-authority source per `spec/SPEC-HIERARCHY.md`; when authority is genuinely ambiguous, take the most conservative interpretation and say so
3. set `Approver` to `auto-mode-ai`, fill `Why` with the actual reasoning
4. set `Status` to `resolved` (never left `open`)
5. continue

### Exit Behavior in auto mode

Steps 1-3 of `## Exit Behavior` below still happen unchanged (file list, handoff block, Workflow Metrics row). Step 4 does not apply. Instead:
- standalone (`/speccraft.implement auto`): report the same minimal handoff block with `Mode: auto`, then stop — this command still does not begin code-to-unit-tests itself, even in auto mode
- invoked by `/speccraft.orchestrate auto`: return control to that run's Stage 8; the run's own Final Consolidated Handoff covers this stage's outcome, no separate handoff needed here

---

## Exit Behavior

After producing implementation output:

1. Output list of files written and brief implementation summary
2. Output minimal handoff block (stage, artifact, traceability status, assumptions, blockers, next action)
3. Append one row to current story traceability shard `spec/traceability/<mirrored-business-path>/TRACEABILITY.md` under `Workflow Metrics` per `spec/workflows/shared/SHARED-POLICIES.md`
4. Interactive mode: STOP — do not begin code-to-unit-tests; wait for human response. Auto mode: see `## Auto Mode` § Exit Behavior in auto mode.
5. Do not self-approve implementation (auto mode's own review, per `## Auto Mode`, is the documented exception)

Implementation cannot be approved by the same execution that produced it.

