# speccraft.validate.md

## Purpose

This document defines the command contract for running Final Validation for a completed task in execution.

Command shape:

```text
/speccraft.validate <task-id>
/speccraft.validate auto <task-id>
```

An optional leading `auto` token selects auto mode (see `## Auto Mode`); absent means interactive mode.

This command is intended to invoke the Final Validation stage for a single task once its implementation and tests are approved. The required tests, and the traceability chain length verified, depend on the task's `Layer`: frontend tasks use a 4-link chain (req → LLD → task → code → test); backend tasks use a 5-link chain (req → LLD → task → code → unit test → integration test).

---

## Why This Exists

The command layer should be explicit, not magical.

Without a command contract:

- agents may run validation on unapproved or incomplete implementation outputs
- validation scope may drift from the approved task and LLD
- verification records may not be created or may vary in location and format
- traceability from task to code to tests may not be updated
- the final gate before a work item is marked `done` may be bypassed informally
- frontend and backend tasks may be validated against the wrong chain length

This document makes `/speccraft.validate` predictable and reviewable for both layers.

---

## Command Intent

`/speccraft.validate <task-id>` means:

- identify the task, read its `Layer` field, and identify its associated implementation and test outputs
- verify that the implementation conforms to the approved task definition
- verify that the implementation conforms to the approved LLD (the layer-matching one — `LLD-FRONTEND-<id>.md` for frontend tasks, `LLD-BACKEND-<id>.md` for backend tasks)
- verify that the implementation conforms to business requirements and acceptance criteria
- verify that the implementation conforms to architecture constraints (routing/module/rendering for frontend, routing/module/data-integration for backend)
- **`Layer: backend` only, for tasks touching a new or changed API operation** — verify `contracts/<module>/<module>.yaml` was written or updated to match the approved LLD-BACKEND touchpoint table entry
- **`Layer: frontend` only, when a cross-layer dependency has resolved since implementation began** — verify implementation was reconciled against the now-real `contracts/<module>/<module>.yaml`, not left against the draft LLD shape
- verify that unit tests cover the implemented behavior at the required level
- **`Layer: backend` only** — verify that integration tests cover the task's cross-boundary behavior (API contract, persistence, external integration) at the required level
- produce a validation record in the `### Validation` section under `## Task: TASK-{id}` in `spec/progress/<module>/progress-{STORY-ID}.md`
- update traceability to reflect completion state — 4-link chain for frontend, 5-link chain for backend
- report an honest final state for the task

This command does not:

- change code
- change tests
- reopen the approved task definition
- reopen the approved LLD
- approve changes to earlier-phase artifacts

---

## Required Input

The command requires:

- one task ID reference

Accepted examples:

```text
/speccraft.validate TASK-101-FRONTEND-T2
/speccraft.validate TASK-101-BACKEND-T3
```

The task must be:

- readable, with a readable `Layer` field
- its implementation must have a review outcome of `approved`
- its unit tests must have a review outcome of `approved`
- **`Layer: backend` only** — its integration tests must have a review outcome of `approved`
- the task definition itself must exist and be readable

---

## Pre-Execution Checks

**Step zero, before check 1 below and before anything else in this command — including locating the task definition:** capture the real wall-clock `Start` timestamp per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable — applies even when this run ends immediately in `blocked` and on continuation turns.

Before validation work begins, the command should confirm, for both layers:

1. active work is execution
2. the task ID maps to an existing, readable task definition
3. the task's `Layer` field is readable and is `frontend` or `backend` — branch the remaining checks on this value
4. the implementation for this task has been reviewed and is `approved`
5. the unit tests for this task have been reviewed and are `approved`
6. the source LLD for this task is identifiable and readable — the layer-matching LLD (`LLD-FRONTEND-<id>.md` or `LLD-BACKEND-<id>.md`)
7. the source business requirement references are traceable
8. relevant architecture references are known — the matching `AD-FRONTEND-*` or `AD-BACKEND-*` section (plus any `AD-X-*` cross-cutting decisions)

**`Layer: backend` only**, additionally confirm:

9. the integration tests for this task have been reviewed and are `approved` — this is a required input for backend tasks; do not proceed to validation without it

**`Layer: frontend`** tasks skip check 9 entirely — no integration test input is required or expected.

If these checks fail materially, the command should not proceed and should state the blocker explicitly.

---

## Documents This Command Must Use

At minimum, the command should operate with these documents:

- `spec/AGENTS.md`
- `spec/init.md`
- `spec/WORKFLOW-OVERVIEW.md`
- `spec/SPEC-HIERARCHY.md`
- `spec/REVIEW-AND-REVISION-POLICY.md`
- `spec/workflows/shared/STAGE-CONTRACT.md`
- `spec/workflows/shared/TRACEABILITY-RULES.md`
- `spec/workflows/shared/SHARED-POLICIES.md` (approval states, done criteria, handoff format, metrics rules, conflict-decision rules)
- `spec/workflows/implementation/IMPLEMENTATION-STAGE.md`
- `spec/workflows/testing/TESTING-STAGE.md`
- `spec/workflows/integration-testing/INTEGRATION-TESTING-STAGE.md` — **`Layer: backend` tasks only**
- `spec/workflows/validation/VALIDATION-STAGE.md`
- `spec/architecture/ARCH-DECISIONS.md` — the matching `AD-FRONTEND-*` or `AD-BACKEND-*` section
- any further project architecture files indexed in `spec/ARCHITECTURE-REFERENCES.md`

---

## Expected Command Behavior

When the command runs successfully, it should:

1. locate the task definition, confirm it is readable, and read its `Layer` field
2. locate the approved implementation output for this task (in `src-code-frontend/` or `src-code-backend/`, per `Layer`)
3. locate the approved unit test output for this task
4. **`Layer: backend` only** — locate the approved integration test output for this task
5. locate the source LLD (the layer-matching one) and trace back to source business requirements
6. verify that implementation scope matches the approved task scope
7. verify that implementation conforms to architecture constraints (routing, module, rendering for frontend; routing, module, data/integration for backend)
8. verify that unit tests cover the implemented behavior at a meaningful level
9. **`Layer: backend` only** — verify that integration tests cover the task's cross-boundary behavior at a meaningful level
10. check that acceptance criteria and requirement IDs are traceable end-to-end — 4 links for frontend (req → LLD → task → code → test), 5 links for backend (req → LLD → task → code → unit test → integration test)
11. produce a validation record in the `### Validation` section under `## Task: TASK-{id}` in `spec/progress/<module>/progress-{STORY-ID}.md`
12. update traceability to reflect final state
13. assign an honest final state to the task

The command should not label the task `done` unless all validation checks pass for that task's chain length, or all gaps are explicitly recorded.

---

## Output Expectations

Primary output:

- a validation record for the task in the `### Validation` section under `## Task: TASK-{id}` in `spec/progress/<module>/progress-{STORY-ID}.md`

The validation record should include at minimum:

- task ID, title, and `Layer`
- implementation reviewed and state
- unit tests reviewed and state
- **`Layer: backend` only** — integration tests reviewed and state
- validation checks performed
- architecture conformance result
- traceability chain status (4-link or 5-link, per `Layer`)
- any gaps, open questions, or unresolved items
- final task state

Supporting outputs may include:

- traceability update record
- open questions requiring follow-up
- escalation note if validation reveals a phase boundary issue

---

## Recommended Output Location

Recommended location for produced validation records:

```text
spec/progress/<module>/progress-<STORY-ID>.md  (## Task: TASK-{id} → ### Validation)
```

If the story's progress file does not yet exist, the command should create it. If the task's `## Task: TASK-{id}` block does not yet exist, append it.

---

## Traceability Expectations

This command must update or confirm, for both layers:

- task -> code traceability
- task -> unit test traceability
- requirement or AC ID -> task -> code -> unit tests chain (frontend: this is the final link, 4-link chain)

**`Layer: backend` only**, additionally:

- unit test -> integration test traceability
- requirement or AC ID -> task -> code -> unit tests -> integration tests chain (5-link chain)

Where relevant, it should also confirm:

- architecture constraint carry-through from the layer-matching LLD to implementation

If a gap is found in the traceability chain:

- record it explicitly in the validation record
- do not invent a mapping that does not exist
- flag it as an open item if it does not block final state

---

## Review Expectations

Final Validation is itself a review-like gate, for both layers.

After validation completes, the expected outcomes are:

- `done`: all checks pass for that task's chain length, task is complete
- `blocked`: a gap was found that requires human review or earlier-stage revision

Unlike every other stage gate, there is no `revise` outcome here — validation is read-only and produces no artifact of its own to revise, for either layer. A gap found here does not get fixed in the validation record; it routes back to whichever earlier stage's own review gate owns the affected artifact (implementation, unit tests, integration tests, LLD, etc.), which then goes through its normal `revise` cycle before validation is re-run.

The command should not label the task `done` if architecture or traceability gaps remain unresolved.

If a material issue is discovered that would require changing approved code, tests, or earlier-phase artifacts, the command must escalate rather than self-resolve.

---

## Failure And Block Conditions

This command should record a `blocked` state and stop when:

- the approved implementation does not match the approved task scope
- the implementation violates architecture constraints in a material way
- unit tests do not cover the implemented behavior at a meaningful level
- **`Layer: backend` only** — integration tests do not cover the task's cross-boundary behavior at a meaningful level, or are missing/not approved
- the traceability chain cannot be established from requirement to code (4-link for frontend, 5-link for backend)
- **`Layer: backend` only** — a new/changed API operation in scope was not reflected in `contracts/<module>/<module>.yaml`, or the file materially disagrees with the approved LLD-BACKEND touchpoint table
- **`Layer: frontend` only** — a cross-layer dependency has resolved but implementation was not reconciled against the real contract file
- validation reveals that an earlier-phase artifact must be revised

Use `blocked` when human-in-the-loop resolution is required to determine the correct next action.

---

## Hard Boundary Rules

This command must not change outcomes by altering source artifacts, for either layer.

Rules:

- do not change code as part of validation
- do not change tests as part of validation
- do not edit the approved task definition
- do not edit either approved LLD
- do not silently accept architecture violations by softening the validation criteria
- do not mark a task `done` when known material gaps remain
- do not skip the integration-test check for a `Layer: backend` task, and do not require it for a `Layer: frontend` task

If issues are found, record them honestly in the validation record and escalate.

---

## Human-In-The-Loop Triggers

Human escalation is required when:

- validation reveals a material architecture violation in approved code
- the traceability chain cannot be completed without reopening a planning artifact
- a known gap exists that affects correctness but cannot be resolved without a scope change
- the implementation does not match the approved task scope in a material way that was not already flagged in review

The command may document findings but must not self-approve corrections that cross phase boundaries.

---

## Minimal Command Handoff

At minimum, a successful command run should be able to report:

```text
Command:
Task ID:
Layer:
Active Phase:
Active Stage:
Implementation State:
Unit Tests State:
Integration Tests State: (backend only, else N/A)
Validation Record:
Architecture Conformance:
Traceability Chain Status: (4-link or 5-link)
Gaps Or Open Questions:
Final Task State:
Next Recommended Action:
```

---

## Auto Mode

Auto mode produces the same Validation record under the same Failure And Block Conditions and Hard Boundary Rules as interactive mode. The only thing it changes is **whether execution pauses after a `blocked` outcome**. There is no `revise` outcome to self-review here — this command is read-only, per §Done Criteria above — so auto mode has nothing to self-approve; it only changes how `blocked` is handled.

This section is the authoritative behavior for every place elsewhere in this document that says "stop" (Failure And Block Conditions) or the plain `STOP` below — read those as scoped to interactive-mode invocation; in auto mode, this section's rules apply instead. This section applies whenever this command's behavior runs in auto mode: invoked directly as `/speccraft.validate auto <task-id>`, or invoked by `/speccraft.orchestrate auto` for its Stage 12 (Final Validation).

### Outcome: `done`

Report and continue — same as interactive mode, nothing changes.

### Outcome: `blocked`

Does not stop the run:

1. write the full Blocker/Decision row per `spec/workflows/shared/SHARED-POLICIES.md` § Blocker And Decision Log Rules to the current story's traceability shard, naming which earlier-stage artifact the gap routes back to
2. resolve it — prefer the higher-authority source per `spec/SPEC-HIERARCHY.md`; when authority is genuinely ambiguous, take the most conservative interpretation and say so
3. set `Approver` to `auto-mode-ai`, fill `Why` with the actual reasoning, including which earlier stage's own `## Auto Mode` handling the gap is deferred to
4. set `Status` to `resolved` (never left `open`)
5. continue — the task's Final Task State remains `blocked` in the record even though the run itself does not pause

### Exit Behavior in auto mode

Steps 1-3 of `## Exit Behavior` below still happen unchanged (progress file path, handoff block, Workflow Metrics row). Step 4 does not apply. Instead:
- standalone (`/speccraft.validate auto`): report the same minimal handoff block with `Mode: auto`, then stop
- invoked by `/speccraft.orchestrate auto`: return control to that run's Stage 13; the run's own Final Consolidated Handoff covers this task's outcome, no separate handoff needed here

---

## Exit Behavior

After producing the Validation section:

1. output the progress file path, task `Layer`, and final task state (done / blocked)
2. output the minimal handoff block
3. append one row to current story traceability shard `spec/traceability/<mirrored-business-path>/TRACEABILITY.md` under `Workflow Metrics` per `spec/workflows/shared/SHARED-POLICIES.md` (story ID, command = `validate`, stage = `Validation`, date, model, start/end timestamps, duration (computed), input/output tokens (actual from transcript, est. fallback), tok source, artifacts = progress file path, status = done or blocked, notes)
4. Interactive mode: STOP. Auto mode: see `## Auto Mode` § Exit Behavior in auto mode.

---

## Relationship To Other Documents

Read this document together with:

- all root workflow policy docs
- all shared workflow docs
- all implementation stage docs
- all testing stage docs
- all integration testing stage docs (`Layer: backend` tasks)
- all architecture docs

Role split:

- workflow docs define the behavior of each stage
- `speccraft.validate.md` defines how the command should invoke Final Validation behavior from a completed task ID input, branching on the task's `Layer` for chain length and required test inputs
