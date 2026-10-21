# speccraft.integration-test

## Purpose

This command starts the execution integration-testing stage from approved implementation and approved unit test output.

Command shape:

```text
/speccraft.integration-test <task-id>
/speccraft.integration-test auto <task-id>
```

An optional leading `auto` token selects auto mode (see `## Auto Mode`); absent means interactive mode.

---

## Required Input

- task file path or task identifier
- implementation output reference, with review outcome `approved`
- unit test output reference, with review outcome `approved`

---

## Pre-Execution Checks

**Step zero, before check 1 below and before anything else in this command — including reading the task definition:** capture the real wall-clock `Start` timestamp per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable — applies even when this run ends immediately in `blocked` (e.g. `Layer: frontend` routing it away) and on continuation turns.

Before this command proceeds, confirm:

1. active phase is execution
2. the task ID maps to an existing, readable task definition
3. **the task's `Layer` field is `backend`** — check this first. If `Layer: frontend`, do NOT run this command: report that this task routes directly to `/speccraft.validate` instead, and stop. This command only ever runs for backend-tagged tasks.
4. the implementation for this task has been reviewed and is `approved`
5. the unit tests for this task have been reviewed and are `approved`

If these checks fail materially, do not proceed — state the blocker explicitly.

---

## Execution Rule

When this command is invoked, the agent should read:

1. `spec/init.md`
2. `spec/AGENTS.md`
3. `spec/WORKFLOW-OVERVIEW.md`
4. `spec/workflows/integration-testing/INTEGRATION-TESTING-STAGE.md`
5. the approved implementation output
6. the approved unit test output
7. the approved task
8. the task's API contract reference, if one exists

The agent must not skip the integration testing review gate after tests are produced.

---

## Expected Command Behavior

1. identify the boundaries the task's implementation crosses (API entrypoint, persistence, cache, queue, external service)
2. write or update integration tests exercising the wired path across those boundaries — real or containerized dependency preferred over mocks
3. cover the contract-level behavior: request/response shape, status/error codes, and the relevant failure paths (dependency down, timeout, conflict)
4. document any boundary that could not be integration-tested in the current environment, with reason
5. update traceability: unit tests -> integration tests

---

## Auto Mode

Auto mode produces the same integration test output under the same Expected Command Behavior as interactive mode. The only thing it changes is **who clears the Integration Testing Review Gate, and whether execution pauses to do it**.

This section is the authoritative behavior for every place elsewhere in this document that says "STOP" or "wait for human response" — read those as scoped to interactive-mode invocation; in auto mode, this section's rules apply instead. This section applies whenever this command's behavior runs in auto mode: invoked directly as `/speccraft.integration-test auto <task-id>`, or invoked by `/speccraft.orchestrate auto` for its Stage 10 (Integration Testing Generation) / Stage 11 (Integration Testing Review Gate).

### Who reviews

The agent itself reviews the tests it just produced against the cross-boundary coverage expected per `spec/workflows/integration-testing/INTEGRATION-TESTING-STAGE.md`, the same criteria a human reviewer would apply. The review record is still written in full (reviewer type = `AI`).

### Outcome: `approved`

Proceed to Final Validation. No pause.

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
- standalone (`/speccraft.integration-test auto`): report the same minimal handoff block with `Mode: auto`, then stop — this command still does not begin `/speccraft.validate` itself, even in auto mode
- invoked by `/speccraft.orchestrate auto`: return control to that run's Stage 12; the run's own Final Consolidated Handoff covers this stage's outcome, no separate handoff needed here

---

## Exit Behavior

After producing integration tests for the task:

1. output the list of test files written and a brief cross-boundary coverage summary (which boundaries were exercised, real vs. containerized vs. justified mock)
2. output the minimal handoff block (from `spec/workflows/shared/SHARED-POLICIES.md`)
3. append one row to current story traceability shard `spec/traceability/<mirrored-business-path>/TRACEABILITY.md` under `Workflow Metrics` per `spec/workflows/shared/SHARED-POLICIES.md` (story ID, command = `integration-test`, stage = `Integration Testing`, date, model, start/end timestamps, duration (computed), input/output tokens (actual from transcript, est. fallback), tok source, artifacts, status, notes)
4. Interactive mode: STOP — do not begin `/speccraft.validate`. Auto mode: see `## Auto Mode` § Exit Behavior in auto mode.
5. do not self-approve the test output (auto mode's own review, per `## Auto Mode`, is the documented exception)
6. Interactive mode: wait for human response in the next conversation turn

---

## Relationship To Other Documents

Read this document together with:

- `spec/workflows/integration-testing/INTEGRATION-TESTING-STAGE.md`
- `spec/workflows/testing/TESTING-STAGE.md` — upstream stage
- `spec/workflows/validation/VALIDATION-STAGE.md` — downstream stage
- `spec/commands/speccraft.unit-test.md`
- `spec/commands/speccraft.validate.md`
