# Integration Testing Stage

## Agent Delta

**Stage:** Integration Testing — execution stage; runs after Unit Tests are approved, before Final Validation
**Entry:** task `Layer` must be `backend` — this stage does not run for frontend-tagged tasks, which route directly from the Testing Review Gate to Final Validation; approved implementation available; approved unit tests available; task ID and ACs known
**Session chain:** ARCH-DECISIONS.md, AGENTS.md, init.md, task file, implementation, unit tests already in context — do not reload them
**Output:** changed/added integration test files; cross-boundary coverage summary (API contract, persistence, external integration, messaging); untested gaps documented; traceability unit-tests → integration-tests updated
**Must cover:** each in-scope API endpoint or entrypoint at the contract level (request → response shape, status codes, error contract); real or containerized dependency interactions the task introduces or changes (database, cache, queue, external service call) — mocked only where a real/containerized dependency is infeasible, and the mock boundary is stated explicitly
**Must not:** duplicate what unit tests already cover in isolation; widen implementation scope; leave test data/state uncleaned between runs; depend on production external services
**Done when:** integration testing review is `approved`; meaningful cross-boundary coverage exists; untestable areas explicitly documented; traceability updated

---

## Overview

This stage governs how approved implementation and approved unit tests are extended with integration test coverage — tests that exercise the task's behavior across real boundaries (process, network, persistence, external service) rather than in isolation with collaborators substituted.

Unit tests (previous stage) verify a unit's logic in isolation. Integration tests verify that the units wired together — controller/handler → service → repository → data store, or service → external API/queue — behave correctly across the real (or realistically containerized) boundary. Both are required; neither substitutes for the other.

---

## Entry Conditions

- **Start timestamp captured** — for any task whose `Layer` check below resolves to `backend` and therefore actually enters this stage, capture the real wall-clock `Start` per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture before evaluating any other entry condition. Non-skippable for every backend-tagged task that reaches this stage — frontend-tagged tasks never enter this stage at all, so no capture applies to them here.
- task `Layer` must be `backend` — check this first. This stage does not run for frontend-tagged tasks: those route directly from the Testing Review Gate (stage 9) to Final Validation (stage 12), skipping Integration Testing and its review gate entirely
- approved implementation output is available
- approved unit tests are available for the same task
- task identifier and title are known
- acceptance expectations or requirement references are available
- **Session chain:** running as continuation from Code-To-Unit-Tests / Testing Review (the execution steps immediately prior to Integration Testing) — `ARCH-DECISIONS.md`, `AGENTS.md`, `init.md`, the approved task file, implementation, and unit tests are already in context; do not reload them

Must not begin when the task is frontend-tagged, or when implementation or unit tests are still `draft`, `in-review`, `revise`, or `blocked`.

---

## Input Contract

Integration testing input should provide:

- task `Layer` field confirmed as `backend` — mandatory precondition; if the task is frontend-tagged this stage refuses to run and routes the task to `/speccraft.validate` instead
- approved implementation output
- approved unit test output
- task identifier and title
- acceptance expectations or requirement references
- API contract for the task, if one exists (OpenAPI/AsyncAPI or equivalent)
- known cross-boundary interactions the task introduces or changes: database access, cache, message queue/event bus, external service call, background job
- relevant architecture constraints (performance budgets, reliability behaviors, security boundaries) that apply at the integration level

---

## Output Contract

Integration testing output should provide:

- changed or added integration test files
- cross-boundary coverage summary: which boundaries were exercised (API contract, persistence, messaging, external integration) and how (real, containerized, or explicitly justified mock)
- gaps that remain intentionally untested, with reason
- verification performed (e.g. test run output)
- traceability from unit-tested behavior to integration test coverage

Record this under `### Integration Testing` in the task's `## Task: TASK-<id>` block in `spec/progress/<module>/progress-<STORY-ID>.md`.

---

## Process Steps

1. identify the boundaries the task's implementation crosses (API entrypoint, persistence, cache, queue, external service)
2. for each boundary, determine the realistic test strategy: real dependency, containerized dependency (e.g. ephemeral test database/queue), or contract-level mock — prefer real/containerized; use a mock only when a real dependency is infeasible in the test environment, and record the boundary substituted
3. write or update integration tests that exercise the wired path — not the unit's internal logic a second time
4. cover the contract: request/response shape, status/error codes, transaction boundaries, idempotency where the task requires it, retries/timeouts where the task's architecture-defined reliability behavior requires it
5. ensure test data setup and teardown leaves no residual state between runs
6. review the tests for realism, determinism, and boundary coverage
7. revise if required
8. run relevant verification

### Rules

- do not re-assert unit-level logic already covered by unit tests — assert the wiring and the boundary contract instead
- prefer real or containerized dependencies over mocks; mocking a boundary this stage exists to test defeats its purpose unless genuinely infeasible
- tests must be deterministic — no reliance on shared mutable external state, unbounded timing, or production services
- test both the successful cross-boundary path and the relevant failure path (dependency unavailable, timeout, conflict, validation rejection at the boundary)
- if a boundary cannot be integration-tested in the current environment, document the gap explicitly rather than skipping silently

---

## Review Checklist

- do the tests exercise real (or realistically containerized) boundaries rather than re-mocking what unit tests already isolated
- is the API/contract-level behavior covered: request/response shape, status/error codes
- are persistence, cache, queue, or external-service interactions covered where the task touches them
- are failure and degraded paths across boundaries covered (dependency down, timeout, conflict)
- is test data setup/teardown clean and isolated between runs
- are the tests deterministic and free of production dependencies
- is traceability from unit tests to integration tests visible

### Review Outcome

Allowed outcomes:

- `approved`
- `revise`
- `blocked`

---

## Revision Rules

- revise tests to address review feedback without silently widening implementation scope
- if tests expose an implementation or contract defect, route the work back through implementation review and revision instead of hiding the defect
- preserve existing traceability unless correction is required
- document remaining untestable boundaries explicitly, with reason

---

## Done Criteria

Integration testing is done only when:

- integration tests have been added or updated for the approved implementation and approved unit tests
- integration testing review outcome is `approved`
- meaningful boundary coverage exists: API contract, and any persistence/cache/queue/external-service interaction the task introduces or changes
- gaps are explicitly documented with reason
- traceability from unit tests to integration tests is updated or queued explicitly

---

## Relationship To Other Documents

Read this document together with:

- `spec/AGENTS.md`
- `spec/REVIEW-AND-REVISION-POLICY.md`
- `spec/workflows/shared/STAGE-CONTRACT.md`
- `spec/workflows/shared/TRACEABILITY-RULES.md`
- `spec/workflows/testing/TESTING-STAGE.md` — upstream stage (unit tests)
- `spec/workflows/validation/VALIDATION-STAGE.md` — downstream stage (final validation)
