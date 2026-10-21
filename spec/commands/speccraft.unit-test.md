# speccraft.unit-test

## Purpose

This command starts the execution testing stage from approved implementation output.

---

## Required Input

- task file path or task identifier
- implementation output reference
- confirmation that implementation has passed review

An optional leading `auto` token selects auto mode (see `## Auto Mode`); absent means interactive mode.

---

## Execution Rule

**Before anything else in this invocation — before reading the task's `Layer` field, before any file read:** capture the real wall-clock `Start` timestamp per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable, whether this turn is a fresh invocation or a continuation from `task-to-code`.

Read the task's `Layer` field **first** — it determines the test file location and test-framework choice for the rest of this command. Branch on the `Layer` field programmatically, not on the filename tag.

When this command is invoked, the agent should read:

1. `spec/init.md`
2. `spec/AGENTS.md`
3. `spec/WORKFLOW-OVERVIEW.md`
4. `spec/workflows/testing/TESTING-STAGE.md`
5. the approved task, and its `Layer` field
6. the approved implementation output — `Layer: frontend` → under `src-code-frontend/`; `Layer: backend` → under `src-code-backend/`

Write unit tests under the routed layer's test convention: `Layer: frontend` → `src-code-frontend/`'s test convention and frontend test framework (per `src-code-frontend/AGENTS.md`); `Layer: backend` → `src-code-backend/`'s test convention and backend test framework (per `src-code-backend/AGENTS.md`).

The agent must not skip the testing review gate after tests are produced.

---

## Auto Mode

Auto mode produces the same unit test output under the same Execution Rule as interactive mode. The only thing it changes is **who clears the Testing Review Gate, and whether execution pauses to do it**.

This section is the authoritative behavior for every place elsewhere in this document that says "STOP" or "wait for human response" — read those as scoped to interactive-mode invocation; in auto mode, this section's rules apply instead. This section applies whenever this command's behavior runs in auto mode: invoked directly as `/speccraft.unit-test auto <task-id>`, or invoked by `/speccraft.orchestrate auto` for its Stage 8 (Code-To-Unit-Tests Generation) / Stage 9 (Testing Review Gate).

### Who reviews

The agent itself reviews the tests it just produced against the implementation and the task's expected test implications, the same criteria a human reviewer would apply per `spec/workflows/testing/TESTING-STAGE.md`. The review record is still written in full (reviewer type = `AI`).

### Outcome: `approved`

Proceed per the task's `Layer` — `backend` to integration testing, `frontend` directly to validation. No pause.

### Outcome: `revise`

The agent revises the affected test(s) itself and re-reviews, up to **2 automatic revise-retries**. If still not clean after 2 retries, log the remaining issue(s) as Accepted Issues (Issue / Justification / Accepted By = `auto-mode-ai`) per `spec/workflows/shared/STAGE-CONTRACT.md` § Accepted Issues, and proceed with those issues visible in the review record — never silently dropped.

### Outcome: `blocked`

Does not stop the run:

1. write the full Blocker/Decision row per `spec/workflows/shared/SHARED-POLICIES.md` § Blocker And Decision Log Rules to the current story's traceability shard
2. resolve it — prefer the higher-authority source per `spec/SPEC-HIERARCHY.md`; when authority is genuinely ambiguous, take the most conservative interpretation and say so
3. set `Approver` to `auto-mode-ai`, fill `Why` with the actual reasoning
4. set `Status` to `resolved` (never left `open`)
5. continue

### Exit Behavior in auto mode

Steps 1-3 of `## Exit Behavior` below still happen unchanged (test file list, handoff block, Workflow Metrics row). Step 4 does not apply. Instead:
- standalone (`/speccraft.unit-test auto`): report the same minimal handoff block with `Mode: auto`, then stop — this command still does not begin `/speccraft.validate` itself, even in auto mode
- invoked by `/speccraft.orchestrate auto`: return control to that run's Stage 10/12 (per the task's `Layer`); the run's own Final Consolidated Handoff covers this stage's outcome, no separate handoff needed here

---

## Exit Behavior

After producing unit tests for the task:

1. output the list of test files written and a brief coverage summary
2. output the minimal handoff block (from `spec/workflows/shared/SHARED-POLICIES.md`)
3. append one row to current story traceability shard `spec/traceability/<mirrored-business-path>/TRACEABILITY.md` under `Workflow Metrics` per `spec/workflows/shared/SHARED-POLICIES.md` (story ID, command = `unit-test`, stage = `Testing`, date, model, start/end timestamps, duration (computed), input/output tokens (actual from transcript, est. fallback), tok source, artifacts, status, notes)
4. Interactive mode: STOP — do not begin validate. Auto mode: see `## Auto Mode` § Exit Behavior in auto mode.
5. do not self-approve the test output (auto mode's own review, per `## Auto Mode`, is the documented exception)
6. Interactive mode: wait for human response in the next conversation turn


