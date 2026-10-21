# speccraft.orchestrate.md

## Purpose

This document defines the command contract for the master end-to-end workflow orchestration command.

Command shape:

```text
/speccraft.orchestrate <business-spec-file>
/speccraft.orchestrate auto <business-spec-file>
```

This command is the single entry point to chain the entire delivery workflow from a business spec input to validated, traced full-stack delivery output. It orchestrates both planning and execution in sequence, enforcing review gates, revision loops, and traceability at every stage, and fans one business spec out into linked frontend and backend delivery streams.

The default form is **interactive mode**: every stage boundary is a human-approval gate, exactly as described throughout this document. The `auto` form is **auto mode**: the same 13 stages, same artifacts, same traceability obligations — but no stage boundary pauses for a human message. See `## Auto Mode` below for exactly how review, revision, and blocked conditions are handled without a pause. Every other section of this document describes interactive-mode gate behavior unless it explicitly says otherwise.

---

## Why This Exists

Without an orchestration command contract:

- agents may run stages out of order
- review gates may be skipped by assumption
- traceability may be built only at the end instead of progressively
- blocked work may be retried without context
- human-in-the-loop pause points may be inconsistent across sessions
- the end-to-end workflow state may not be recoverable after interruption
- frontend and backend work may drift out of sync with no shared checkpoint

This document makes `/speccraft.orchestrate` the authoritative orchestration contract and makes the full workflow resumable, auditable, and human-reviewable at any stage boundary, for both layers together.

---

## Command Intent

`/speccraft.orchestrate <business-spec-file>` means:

- take the named business specification file as the starting input
- execute the full planning and execution workflow in order
- fan Stage 2 out into the LLD artifact(s) for this project's Layer Scope (one or two, per `spec/architecture/ARCH-DECISIONS.md` §Layer Scope) from the single intake
- enforce review gates at every stage boundary
- pause for human-in-the-loop at any gate that produces `revise` or `blocked`
- update traceability progressively throughout execution, not only at the end
- track progress in `spec/progress/` at every stage
- produce or update artifacts in their correct locations at each stage, routed to the correct layer's code root
- run Stage 10 (Integration Testing) and Stage 11 (its review gate) only for tasks tagged `Layer: backend`
- report current state, artifact state, and next required action at every pause point

This command does not:

- skip review gates
- self-approve locked artifacts across phase boundaries
- allow execution to begin before planning is fully approved
- allow later stages to begin before earlier stages are approved
- run Stage 10/11 for frontend-tagged tasks — those tasks go straight from Stage 9 to Stage 12

---

## Required Input

The command requires:

- one business specification file reference
- an optional leading `auto` token selecting auto mode (see `## Auto Mode`); absent means interactive mode

Accepted examples:

```text
/speccraft.orchestrate spec/business/BUSINESS-SPEC-001.md
/speccraft.orchestrate auto spec/business/BUSINESS-SPEC-001.md
```

The file must be:

- readable
- in scope for the current repository work
- strong enough to support planning LLD creation for the in-scope layer(s)

A missing or unreadable business spec file ends the run with a clear error in both modes — `auto` mode's "never pause for a human" guarantee applies to workflow review gates, not to an invalid starting input.

---

## Auto Mode

Auto mode runs every one of the 13 stages below in the same order, producing the same artifacts, under the same traceability and metrics obligations as interactive mode. The only thing auto mode changes is **who clears each review gate and whether execution pauses to do it**. It never skips a review, and it never hides a decision — it just does not wait for a human to make it.

This section is the authoritative behavior for every place elsewhere in this document that says "HARD STOP", "wait for human", "pause", or "requires human approval" — read those as scoped to interactive mode; in auto mode, this section's rules apply instead. Stages 2, 4, 6, 8, 10, and 12 invoke behavior defined in another command's own contract (`speccraft.tech-design.md`, `speccraft.decompose.md`, `speccraft.implement.md`, `speccraft.unit-test.md`, `speccraft.integration-test.md`, `speccraft.validate.md`) — each of those contracts now carries its own `## Auto Mode` section that is, by its own text, also authoritative whenever `/speccraft.orchestrate auto` invokes it. This section does not need to separately override their stop language; it already is overridden, at the source.

### Who reviews

At every gate (Stage 3, 5, 7, 9, 11, 12), the agent itself performs the review, using the exact same Stage Review Checklist from `spec/REVIEW-AND-REVISION-POLICY.md` a human reviewer would use for that artifact type. `AI` is already a sanctioned reviewer type under that document's Allowed Reviewers section — auto mode simply uses it at every gate instead of only some. The review record is still written in full (reviewer type = `AI`), per Review Record — Minimum Fields.

### Outcome: `approved`

Proceed to the next stage immediately. No pause.

### Outcome: `revise`

The agent revises the artifact itself and re-reviews, up to **2 automatic revise-retries per stage**. If the artifact is still not clean after 2 retries, the remaining issue(s) are logged as **Accepted Issues** (Issue / Justification / Accepted By = `auto-mode-ai`) per `spec/workflows/shared/STAGE-CONTRACT.md` § Accepted Issues, and the stage proceeds with those issues visible in the artifact's review record — never silently dropped. This bounds the loop so it always terminates.

### Outcome: `blocked`

Does **not** stop the run. A `blocked` outcome (conflict, missing decision, contradictory requirement — see `## Failure And Block Conditions`) is handled like this instead:

1. write the full Conflict Decision row (`spec/workflows/shared/SHARED-POLICIES.md` § Conflict Decision Rules) or Blocker/Decision row (§ Blocker And Decision Log Rules) — same schema, same "record before continuing" requirement as interactive mode
2. make an explicit, reasoned resolution: prefer the higher-authority source per `spec/SPEC-HIERARCHY.md`; when authority is genuinely ambiguous, take the most conservative interpretation and say so
3. set `Decided By` (Conflict Decisions) or `Approver` (Blocker/Decisions) to `auto-mode-ai` — a value reserved for auto-mode resolutions, alongside the existing `human-in-loop` — and fill `Resolution` / `Why` with the actual reasoning, not a placeholder
4. set the row's `Status` to `resolved` (never left `open`)
5. continue to the next stage

A `blocked` outcome is never auto-approved without a logged reason — it is always resolved on the record first.

### Run-level requirements

- **Final consolidated handoff**: at the end of an auto run (whether it reaches Stage 13 or ends early on an unrecoverable input error), output one summary covering every stage's outcome, every Accepted Issue, and every auto-resolved conflict/blocker, so a human can audit the entire unattended run after the fact.
- Metrics (`Workflow Metrics` rows) and traceability updates are required at every stage exactly as in interactive mode — auto mode changes gate-pause behavior only, nothing else.

---

## Pre-Execution Checks

**Step zero, before check 1 below and before anything else in this command — including reading the business spec file:** capture the real wall-clock `Start` timestamp per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable — applies even when this run ends immediately in `blocked`.

This top-level capture is separate from, and does not substitute for, the `Start` capture each individual stage's underlying command contract (`speccraft.tech-design.md`, `speccraft.decompose.md`, `speccraft.implement.md`, etc.) makes on its own behalf when `/speccraft.orchestrate` invokes it — each of those commands still captures and records its own `Start`/`End` for its own `Workflow Metrics` row, per its own contract, exactly as if it had been invoked directly by a human. `/speccraft.orchestrate` orchestrating the sequence does not collapse per-stage timestamp capture into one top-level measurement.

Before the workflow begins, the command should confirm:

1. the business spec file exists and is readable
2. the business scope can be identified from the file
3. stable requirement references exist or can be established during intake
4. this project's Layer Scope is resolved (`spec/architecture/ARCH-DECISIONS.md` §Layer Scope — ask interactively if the file is empty/placeholder, per `spec/commands/speccraft.tech-design.md` Pre-Execution Check 0) and relevant architecture references are known for the in-scope layer(s) (the `AD-*` section(s) matching them, plus any `AD-X-*` cross-cutting decisions)

If these checks fail materially, the command should not proceed and should state the blocker explicitly.

---

## Documents This Command Must Use

This command orchestrates the entire workflow and must use all documents listed below.

Root policy documents:

- `spec/AGENTS.md`
- `spec/init.md`
- `spec/WORKFLOW-OVERVIEW.md`
- `spec/SPEC-HIERARCHY.md`
- `spec/REVIEW-AND-REVISION-POLICY.md`

Shared workflow documents:

- `spec/workflows/shared/STAGE-CONTRACT.md`
- `spec/workflows/shared/TRACEABILITY-RULES.md`
- `spec/workflows/shared/SHARED-POLICIES.md` (approval states, done criteria, handoff format, metrics rules, conflict-decision rules)

Stage documents (one consolidated `*-STAGE.md` per stage — each covers entry/input/output contracts, review checklist, revision rules, done criteria):

- `spec/workflows/lld/LLD-STAGE.md` (covers Intake and LLD Creation; produces the FRONTEND/BACKEND LLD pair)
- `spec/workflows/decomposition/DECOMPOSITION-STAGE.md`
- `spec/workflows/implementation/IMPLEMENTATION-STAGE.md`
- `spec/workflows/testing/TESTING-STAGE.md`
- `spec/workflows/integration-testing/INTEGRATION-TESTING-STAGE.md` — **read only when a task's `Layer` is `backend`**
- `spec/workflows/validation/VALIDATION-STAGE.md`

Architecture documents:

- all files under `spec/architecture/` — **read before Stage 2**; locked cross-story decisions; never re-derived per story; note the `AD-FRONTEND-*` / `AD-BACKEND-*` / `AD-X-*` prefixes in `ARCH-DECISIONS.md`

Command contracts:

- `spec/commands/speccraft.tech-design.md`
- `spec/commands/speccraft.decompose.md`
- `spec/commands/speccraft.implement.md`
- `spec/commands/speccraft.unit-test.md`
- `spec/commands/speccraft.integration-test.md` — conditionally invoked, backend-tagged tasks only
- `spec/commands/speccraft.validate.md`

---

## Expected Command Behavior

The command executes stages in the following fixed order. Each stage must complete review before the next begins. Stages 1-5.5 operate once per story across both layers. Stages 6-13 operate per task; Stage 10-11 branch per task on the task's `Layer` field.

### Stage 1: Business Spec Intake

- read the business spec file
- identify or establish stable requirement IDs (layer-agnostic — every in-scope LLD will cite the same IDs)
- confirm that the business scope is well-defined enough to begin LLD creation
- record intake output (single intake record, not split per layer)

### Stage 2: LLD Creation

- invoke LLD creation behavior as defined in `spec/commands/speccraft.tech-design.md`
- read this project's Layer Scope from `spec/architecture/ARCH-DECISIONS.md` §Layer Scope before invoking
- from the one approved intake, produce the LLD artifact(s) for the in-scope layer(s), mirrored per business module:
  - Layer Scope `frontend` -> `spec/lld/<module>/LLD-FRONTEND-<STORY-ID>.md` only
  - Layer Scope `backend` -> `spec/lld/<module>/LLD-BACKEND-<STORY-ID>.md` only
  - Layer Scope `both` -> both files, exactly as before this feature existed
- when Layer Scope is `both`, each LLD includes a Companion LLD Reference section naming its pair and any cross-layer contract dependency; when Layer Scope is single-layer, that section states there is no companion
- update traceability: requirement IDs -> LLD sections, for the in-scope LLD(s)

### Stage 3: LLD Review Gate

**Interactive mode: HARD STOP. Do not proceed in the same execution.** Auto mode: no pause — resolve per `## Auto Mode` and continue.

After Stage 2 produces the in-scope LLD artifact(s):

- output the in-scope LLD file path(s), a summary of what each covers, and the minimal handoff block
- STOP execution here
- wait for human response in the next conversation turn
- do not self-evaluate any LLD and proceed to Stage 4 in the same execution
- do not produce tasks, write code, or take any downstream action until every in-scope LLD is explicitly approved

When Layer Scope = `both`, this is one logical gate covering the pair — in interactive mode, the human responds once for both artifacts together; in auto mode, the agent reviews both artifacts together the same way. When Layer Scope is single-layer, this gate covers the single artifact.

Allowed human responses (interactive mode):
- `approved` — every in-scope LLD approved; proceed to Stage 4 in the next execution
- `revise: [reason]` — return to LLD creation; under Layer Scope = `both`, a revise on one LLD does not require redoing the other, but Stage 4 does not open until both are independently approved
- `blocked: [reason]` — stop, record blocker, require human decision before continuing

The AI must not infer approval from silence or from its own review of the artifacts it just produced. (Auto mode: the AI's own review, performed per `## Auto Mode`, is the mechanism — that section is the one place this rule is deliberately superseded.)

### Stage 4: Decomposition

- invoke decomposition behavior as defined in `spec/commands/speccraft.decompose.md`
- signature: `/speccraft.decompose <lld-fe-file> <lld-be-file>` when Layer Scope = `both` (both approved LLDs read together); `/speccraft.decompose <lld-file>` when Layer Scope is single-layer (the one approved LLD is sufficient input)
- produce task files in `spec/tasks/<module>/` (mirrored per module, flat, no `tasks/` subfolder) for the in-scope layer(s), each filename tagged `-FRONTEND-`/`-BACKEND-` and each carrying a mandatory `Layer: frontend|backend` metadata field matching the in-scope layer it was derived from
- cross-layer task dependencies (only possible when Layer Scope = `both`; e.g. a BACKEND endpoint task the FRONTEND task consumes) are expressed via the existing `Dependencies` field, citing a task ID from the other layer; ordering is dependency-driven only — no blanket "backend tasks before frontend tasks" rule, a task with no cross-layer dependency has no forced order
- update traceability: LLD sections -> task IDs, for the in-scope layer(s)

### Stage 5: Decomposition Review Gate

**Interactive mode: HARD STOP. Do not proceed in the same execution.** Auto mode: no pause — resolve per `## Auto Mode` and continue.

After Stage 4 decomposition task files are produced:

- output the task list (in-scope layer(s)), execution order, sizing rationale, and minimal handoff block
- STOP execution here
- wait for human response in the next conversation turn
- do not self-evaluate the decomposition and proceed to execution in the same execution
- do not scaffold, write code, or take any downstream action until explicit approval is received

Allowed human responses (interactive mode):
- `approved` — planning complete; proceed to Stage 5.5 and execution in the next execution
- `revise: [reason]` — return to decomposition, revise tasks, resubmit
- `blocked: [reason]` — stop, record blocker, require human decision before continuing

The AI must not infer approval from silence or from its own review of the artifacts it just produced. (Auto mode: see `## Auto Mode`.)

### Stage 5.5: Project Scaffold Check

Before any task-to-code work begins for a given layer, confirm that layer's code root exists at repository root.

- if a task is `Layer: frontend` and `src-code-frontend/` does not exist: run `/speccraft.scaffold frontend` first and confirm it is complete before proceeding with that task
- if a task is `Layer: backend` and `src-code-backend/` does not exist: run `/speccraft.scaffold backend` first and confirm it is complete before proceeding with that task
- the two scaffolds are independent — one may exist without the other, and they may be run in either order
- each scaffold happens exactly once for the repository lifetime; it is not repeated per task or per workflow run

### Stage 6: Task-To-Code Execution

- for each approved task (executed sequentially by default):
  - read the task file's `Layer` field first
  - route: `Layer: frontend` -> write to `src-code-frontend/`, read `ARCH-DECISIONS.md` AD-FRONTEND-* section, read `src-code-frontend/AGENTS.md` + `src-code-frontend/rules/`; `Layer: backend` -> write to `src-code-backend/`, read AD-BACKEND-* section, read `src-code-backend/AGENTS.md` + `src-code-backend/rules/`
  - produce implementation output in the routed code root
  - update traceability: task ID -> changed files

### Stage 7: Implementation Review Gate

- for each implemented task:
  - submit implementation for review
  - allowed outcomes: `approved`, `revise`, `blocked`
  - if `revise`: enter revision loop, return to review (auto mode: bounded per `## Auto Mode`)
  - if `blocked`: interactive mode — report blocker, pause, require human-in-the-loop resolution; auto mode — resolve per `## Auto Mode` and continue
  - if `approved`: proceed to Stage 8 for this task

### Stage 8: Code-To-Unit-Tests Generation

- for each task with approved implementation:
  - read the task's `Layer` field; produce unit tests under that layer's test convention (`src-code-frontend/` or `src-code-backend/`)
  - update traceability: changed files -> test files

### Stage 9: Testing Review Gate

- for each task's test output:
  - submit tests for review
  - allowed outcomes: `approved`, `revise`, `blocked`
  - if `revise`: enter revision loop, return to review (auto mode: bounded per `## Auto Mode`)
  - if `blocked`: interactive mode — report blocker, pause, require human-in-the-loop resolution; auto mode — resolve per `## Auto Mode` and continue
  - if `approved`: proceed **per this task's `Layer`** — `backend` -> Stage 10; `frontend` -> skip Stage 10 and 11, proceed directly to Stage 12

### Stage 10: Integration Testing Generation — CONDITIONAL (backend-tagged tasks only)

- applies only to tasks with `Layer: backend`; frontend-tagged tasks do not enter this stage
- for each backend task with approved implementation and approved unit tests:
  - invoke integration testing behavior as defined in `spec/commands/speccraft.integration-test.md`
  - produce or update integration test files covering cross-boundary behavior (API contract, persistence, external integration)
  - update traceability: unit tests -> integration tests

### Stage 11: Integration Testing Review Gate — CONDITIONAL (backend-tagged tasks only)

- applies only to tasks with `Layer: backend`
- for each task's integration test output:
  - submit tests for review
  - allowed outcomes: `approved`, `revise`, `blocked`
  - if `revise`: enter revision loop, return to review (auto mode: bounded per `## Auto Mode`)
  - if `blocked`: interactive mode — report blocker, pause, require human-in-the-loop resolution; auto mode — resolve per `## Auto Mode` and continue
  - if `approved`: proceed to Stage 12 for this task

### Stage 12: Final Validation

- for each task:
  - `Layer: frontend` — requires approved implementation and approved unit tests (Stages 6-9 only); invoke final validation behavior as defined in `spec/commands/speccraft.validate.md` and verify the 4-link chain (req -> LLD -> task -> code -> test)
  - `Layer: backend` — requires approved implementation, approved unit tests, and approved integration tests (Stages 6-11); invoke final validation behavior as defined in `spec/commands/speccraft.validate.md` and verify the 5-link chain (req -> LLD -> task -> code -> unit test -> integration test)
  - produce validation record in the `### Validation` section under `## Task: TASK-{id}` in `spec/progress/<module>/progress-{STORY-ID}.md`

### Stage 13: Progress And Traceability Updates

- update all progress artifacts to reflect completion state, for both layers
- confirm full traceability chain per task: frontend tasks show the 4-link chain, backend tasks show the 5-link chain, both visible in the one traceability shard's `Layer` column
- record any remaining open questions or gaps explicitly
- mark the work item `done` only if all checks pass and all gaps are recorded

---

## Output Expectations

Stage-by-stage outputs:

- Stage 1: intake record, stable requirement IDs
- Stage 2: `spec/lld/<module>/LLD-FRONTEND-{STORY-ID}.md` and/or `spec/lld/<module>/LLD-BACKEND-{STORY-ID}.md`, per Layer Scope
- Stage 4: task files in `spec/tasks/<module>/TASK-{STORY-ID}-FRONTEND-T{n}.md` and/or `TASK-{STORY-ID}-BACKEND-T{n}.md`, per Layer Scope
- Stage 6: implementation output (changed files, in `src-code-frontend/` or `src-code-backend/` per task `Layer`)
- Stage 8: unit test files
- Stage 10: integration test files — backend-tagged tasks only
- Stage 12: validation record in the `### Validation` section under `## Task: TASK-{id}` in `spec/progress/<module>/progress-{STORY-ID}.md`
- Stage 13: updated traceability and progress artifacts

Progress is recorded in `spec/progress/` throughout execution.

Traceability is updated in `spec/traceability/` at each stage — one shard per story, with a `Layer` column showing both chains together.

---

## Traceability Expectations

Traceability is progressive throughout the entire workflow, not built only at the end.

At minimum, this command must maintain:

- requirement ID -> LLD section (created at Stage 2, for every in-scope LLD)
- LLD section -> task ID (created at Stage 4, for the in-scope layer(s))
- task ID -> code changes (created at Stage 6)
- code changes -> unit tests (created at Stage 8)
- unit tests -> integration tests (created at Stage 10, backend-tagged tasks only)

If the workflow stops at any stage, traceability for all produced artifacts must still be updated before the session ends.

---

## Review Expectations

Every stage boundary has a review gate. No stage may advance without an explicit review outcome.

Allowed review outcomes:

- `approved`: proceed to the next stage
- `revise`: return to the producing stage, revise, resubmit for review (auto mode: bounded per `## Auto Mode`)
- `blocked`: interactive mode — stop, report the blocker, require human-in-the-loop resolution; auto mode — resolve per `## Auto Mode` and continue

The workflow may not self-approve any artifact produced in the same execution step. (Auto mode is the documented exception — see `## Auto Mode`.)

---

## Pause Point Behavior

**Interactive mode:** the command must pause at every `revise` or `blocked` outcome and report the current state using the minimal handoff format below.

At any pause point, the agent must report:

- which stage produced the outcome
- what artifact is affected (and which layer)
- what the outcome was
- what must happen before the workflow can resume
- what stages are complete and what stages remain, per layer

**Auto mode:** no pause points occur. The equivalent reporting happens once, at the end of the run, in the Final Consolidated Handoff described in `## Auto Mode` — covering every stage's outcome instead of one pause point at a time.

---

## Failure And Block Conditions

**Interactive mode:** the command should stop and report `blocked` when any of the conditions below are met. **Auto mode:** the same conditions still trigger `blocked` handling, but "stop" means "resolve on the record per `## Auto Mode`, then continue" rather than pausing for a human.

The command should treat these as `blocked` triggers:

- the business spec is too vague to support LLD creation
- stable requirement references cannot be established
- an architecture conflict is discovered that cannot be resolved within the stage
- a review gate produces `blocked`
- execution discovers a gap that requires reopening a planning artifact
- any stage cannot proceed without a decision the agent cannot make unilaterally
- **API contract conflicts with the business user story** — append conflict row(s) to current story traceability shard before stopping
- **design reference / screenshot conflicts with the business user story** — append conflict row(s) to current story traceability shard before stopping
- **a user story conflicts with existing code from another approved story** — append conflict row(s) to current story traceability shard before stopping
- **one user story conflicts with another approved user story** — append conflict row(s) to current story traceability shard before stopping
- **a new LLD conflicts with an existing approved LLD touching the same module/resource/endpoint** — append conflict row(s) to current story traceability shard before stopping
- **`LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` for the same story contradict each other's contract** (e.g. FRONTEND assumes a request/response shape the BACKEND LLD's actual endpoint contract does not provide) — same-story cross-layer conflict, applies only when Layer Scope = `both`; blocked the same way, logged in Conflict Decisions the same way

For all conflict-triggered blocks: one row per conflicting element in `spec/traceability/<mirrored-business-path>/TRACEABILITY.md` under `Conflict Decisions`. Interactive mode: status `open`, no LLD section or code change for that area until status becomes `resolved` or `deferred` by a human. Auto mode: the agent resolves and sets status `resolved` in the same turn per `## Auto Mode`, then continues — status is never left `open` in auto mode. Schema and rules: `spec/workflows/shared/SHARED-POLICIES.md`.

The command should report `revise` when a review gate finds issues that can be resolved by revising within the current stage.

---

## Hard Boundary Rules

This command must respect all phase and stage boundaries.

Rules:

- execution must not begin until planning is fully approved (every in-scope LLD independently approved — both, when Layer Scope = `both`)
- implementation must not begin until decomposition is approved
- testing must not begin until implementation is approved
- integration testing must not begin until unit testing is approved, and only applies to backend-tagged tasks
- final validation must not begin until testing is approved (and, for backend tasks, integration testing is approved)
- no earlier-phase artifact may be silently changed during a later stage
- if an execution discovery requires a planning change: interactive mode — stop and escalate; auto mode — resolve per `## Auto Mode` and continue
- **interactive mode: AI must not self-approve artifacts it produced in the same execution step.** Auto mode is the one documented exception to this rule — see `## Auto Mode`.
- **interactive mode: `approved` is a human-provided response, never an AI inference.** In auto mode, an AI-produced `approved` (per `## Auto Mode`'s review mechanics) is the sanctioned mechanism, not a violation of this rule.
- **interactive mode: Stage 3 and Stage 5 are HARD STOPS that end the current execution turn.** Auto mode does not stop at either — see `## Auto Mode`.
- interactive mode: the workflow spans multiple conversation turns — each review gate requires a new human message before the next stage begins. Auto mode runs all stages without waiting for a new human message at any gate.
- interactive mode: proceeding past a review gate without an explicit human approval response is a workflow violation. This rule does not apply in auto mode, where the AI's own review is the approval mechanism by design.
- a task's `Layer` field determines its code root and whether Stage 10/11 apply — commands must branch on the `Layer` field programmatically, not on the filename tag alone (applies identically in both modes)

---

## Human-In-The-Loop Triggers

**Interactive mode:** human escalation is required when:

- any review gate produces `blocked`
- a business source is materially contradictory or incomplete
- a source-to-architecture conflict exists that cannot be resolved within scope
- a scope change would require reopening a locked artifact
- the workflow has been paused and must be resumed with new context
- any stage produces output that the agent cannot honestly approve
- `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` disagree on a shared contract (Layer Scope = `both` only)

The agent must not self-approve corrections across phase boundaries.

**Auto mode:** none of the above pause the run — every one of these conditions routes to the `blocked` handling in `## Auto Mode` (logged resolution, `Decided By = auto-mode-ai`, status `resolved`, then continue). The trade-off is deliberate: auto mode trades real-time human escalation for a fully logged, audit-after-the-fact trail via the Final Consolidated Handoff.

---

## Minimal Command Handoff

At every pause point or session end, the command must report:

```text
Command: /speccraft.orchestrate
Mode: <interactive|auto>
Business Spec: <file>
Current Phase: <1 or 2>
Current Stage: <stage name>
Last Artifact: <path>
Last Artifact State: <draft|in-review|revise|approved|blocked|done>
Stages Complete: <list, per layer where applicable>
Stages Remaining: <list, per layer where applicable>
Blockers Or Open Questions: <list or none>
Next Required Action: <what must happen>
```

This handoff format must be produced at every pause point (interactive mode) or as the Final Consolidated Handoff (auto mode, see `## Auto Mode`) so that any human or AI collaborator can resume or audit the workflow without losing context.

---

## Relationship To Other Documents

Read this document together with:

- all root workflow policy docs
- all shared workflow docs
- all LLD stage docs
- all decomposition stage docs
- all implementation stage docs
- all testing stage docs
- all integration testing stage docs (backend-tagged tasks)
- all architecture docs
- `spec/commands/speccraft.tech-design.md`
- `spec/commands/speccraft.decompose.md`
- `spec/commands/speccraft.implement.md`
- `spec/commands/speccraft.unit-test.md`
- `spec/commands/speccraft.integration-test.md` — conditionally invoked, backend-tagged tasks only
- `spec/commands/speccraft.validate.md`

Role split:

- stage workflow docs define the behavior of each individual stage
- command contracts define how individual commands invoke that behavior from a specific input
- `speccraft.orchestrate.md` defines how the master orchestrator chains all stages together into a single end-to-end execution with enforced review gates, progressive traceability, and recoverable pause behavior, across both frontend and backend layers
