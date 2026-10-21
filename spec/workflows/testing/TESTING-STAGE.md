# Testing Stage (Code to Unit Tests)

## Agent Delta

**Stage:** Testing (Code to Unit Tests) — execution stage; continuation after implementation
**Entry:** approved implementation available; task ID and ACs known
**Session chain:** ARCH-DECISIONS.md, AGENTS.md, init.md, task file already in context — do not reload them
**Output:** changed/added test files; behavior coverage summary; untested gaps documented; traceability code → tests updated
**Must cover:** happy path + relevant failure/guard paths; each AC has ≥1 test; loading/empty/success/error states where task requires
**Must not:** test behavior the implementation does not own; widen implementation scope; use unstable timing or brittle DOM coupling
**Done when:** testing review is `approved`; meaningful coverage exists; untestable areas explicitly documented; traceability updated
**Downstream:** conditional on the task's `Layer` field — if `Layer: backend`, downstream is Integration Testing (`spec/workflows/integration-testing/INTEGRATION-TESTING-STAGE.md`, stage 10); if `Layer: frontend`, downstream is Final Validation (stage 12) directly, skipping Integration Testing. This stage's own review gate and done-criteria are otherwise identical for both layers.

---

## Overview

This stage governs how approved implementation output is translated into unit test coverage. One task may include both code and tests; this is the default. Tests must cover meaningful behaviors introduced or changed by the task, including happy paths, failure paths, and guard conditions.

Unit tests verify a unit's logic in isolation (collaborators substituted). For backend-tagged tasks, they are not a substitute for Integration Testing (next stage for that layer), which verifies the same behavior wired together across real boundaries (API contract, persistence, external services). Frontend-tagged tasks have no Integration Testing stage — unit testing here is the last test stage before Final Validation.

---

## Entry Conditions

- **Start timestamp captured** — before any other entry condition is evaluated, capture the real wall-clock `Start` per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable — the Session Chain exception below waives re-reading files already in context, it does not waive capturing a fresh `Start` for this stage's own duration measurement.
- approved implementation output is available
- task identifier and title are known
- acceptance expectations or requirement references are available
- **Session chain:** running as continuation from Task-To-Code / Implementation Review (the execution steps immediately prior to Testing) — `ARCH-DECISIONS.md`, `AGENTS.md`, `init.md`, and the approved task file are already in context; do not reload them. This does not extend to timestamp capture — `Start` is captured fresh for Testing regardless of what else is carried over from the prior stage.

---

## Input Contract

Testing input should provide:

- approved implementation output
- task identifier and title
- acceptance expectations or requirement references
- known edge cases
- known failure or guard conditions
- relevant testability constraints from architecture documents

---

## Output Contract

Testing output should provide:

- changed or added test files
- behavior coverage summary
- gaps that remain intentionally untested
- verification performed
- traceability from code behavior to tests

Record this under `### Testing` in the task's `## Task: TASK-<id>` block in `spec/progress/<module>/progress-<STORY-ID>.md`.

### Coverage Targets
- Branch coverage target (e.g., 80%) where the project defines one; otherwise "meaningful coverage" per §Rules below
- Key paths that must have tests, named explicitly

### Excluded From Unit Tests
Behaviors that cannot be unit tested and why (e.g., browser/runtime API unavailable in test environment for frontend tasks; full cross-boundary flow routed to Integration Testing or external service behavior not reproducible in isolation for backend tasks) — must be named explicitly, not silently skipped.

### Test Case Shape
Each behavior's test case should record: Setup, Input, Expected outcome, Edge cases, Test file — whether documented inline in the test or in a pre-implementation test plan.

---

## Process Steps

1. identify the behavior introduced or changed by the task
2. map each meaningful behavior to one or more test cases
3. add or update unit tests close to the affected module or test convention used in the target repo
4. review the tests for readability, determinism, and task coverage
5. revise if required
6. run relevant verification

### Rules

- one task may include both code and tests; this is the default
- do not write tests for behavior that the implementation does not own
- do not rely on unstable timing or brittle DOM coupling when a clearer assertion is available
- test both the happy path and relevant failure or guard paths
- if a case cannot be unit tested because a contract is missing, document the gap explicitly

---

## Review Checklist

- do the tests cover critical task behavior
- are new branches introduced by the task represented
- are validation and guard paths exercised where relevant
- are the tests deterministic and maintainable
- are test names clear about intent
- is traceability from code to tests still visible

### Review Outcome

Allowed outcomes:

- `approved`
- `revise`
- `blocked`

---

## Revision Rules

- revise tests to address review feedback without silently widening implementation scope
- if tests expose an implementation defect, route the work back through implementation review and revision instead of hiding the defect
- preserve existing traceability unless correction is required
- document remaining untestable areas explicitly

---

## Done Criteria

Testing is done only when:

- unit tests have been added or updated for the approved implementation
- testing review outcome is `approved`
- meaningful happy-path and relevant failure or guard-path coverage exists
- gaps are explicitly documented
- traceability from code to tests is updated or queued explicitly


