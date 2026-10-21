# Validation Stage

## Agent Delta

**Stage:** Validation (Final) — execution stage
**Entry:** implementation `approved` + review record; unit tests `approved` + review record; delivery task `approved`; all three arch docs available; if task `Layer: backend` - integration tests also `approved` + review record
**Output:** `## Task: TASK-{id}` → `### Validation` section in `spec/progress/<module>/progress-{STORY-ID}.md`, with all 8 required sections
**Required sections:** Task Identification / Inputs Checked / AC Coverage Table / Architecture Conformance / Traceability Chain / Issues Found / Validation Outcome / Required Actions. Traceability Chain length branches on Layer: frontend = 4 links (req->LLD / LLD->task / task->code / code->test); backend = 5 links (req->LLD / LLD->task / task->code / code->unit-test / unit-test->integration-test)
**Must not:** modify code or test files; reinterpret approved requirements; self-approve arch exceptions
**Blocked when:** any primary input missing or not in approved state (including integration tests, for backend-tagged tasks); inputs materially inconsistent
**Done when:** outcome is `approved`; Validation section written and complete; traceability updated; task status → `done`

---

## Overview

- Stage: `Final Validation` | Phase: `2`
- Upstream: for frontend-tagged tasks, `Testing Review Gate` (stage 9, direct); for backend-tagged tasks, `Integration Testing Review Gate` (stage 11) | Downstream: `Progress And Traceability Update`
- Primary Artifact: `Validation Record (§Validation section in progress-{STORY-ID}.md)`

Verifies that implementation and approved unit tests (plus, for backend-tagged tasks, approved integration tests) together conform to the approved delivery task, LLD, business requirements, and architecture specs.

This stage checks; it does not produce new code or tests. Gaps that validation cannot resolve must be surfaced explicitly and routed appropriately.

Responsible for:
- code-to-task, code-to-LLD, code-to-business-requirement conformance
- architecture conformance against all three project architecture documents
- unit (and, for backend-tagged tasks, integration) test coverage of acceptance criteria
- traceability chain completeness: frontend = business requirement -> LLD -> task -> code -> test (4 links); backend = business requirement -> LLD -> task -> code -> unit test -> integration test (5 links)
- recording outcome in the Validation section

Not responsible for: changing code or tests, reinterpreting approved requirements, self-approving exceptions to architecture constraints.

---

## Entry Conditions

May begin only when:

- **Start timestamp captured** — before any other entry condition is evaluated, capture the real wall-clock `Start` per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable, including on a run that ends immediately in `blocked`.
- implementation is `approved` with review record
- unit tests are `approved` with review record
- if task `Layer: backend` - integration tests are also `approved` with review record (frontend-tagged tasks have no integration-test requirement)
- delivery task is available and `approved`
- all three project architecture documents available

Must not begin when implementation, unit tests, or (for backend-tagged tasks) integration tests are still `draft`, `in-review`, `revise`, or `blocked` without explicit scope acceptance.

---

## Input Contract

**Primary inputs — mandatory:**

| Input | Required State | Location |
|-------|---------------|----------|
| Approved Delivery Task | `approved` | `spec/tasks/<module>/TASK-<STORY-ID>-<layer>-T<n>.md` |
| Approved Implementation | `approved` + review record | implementation code files in the layer-matching `src-code-<layer>/` root |
| Approved Unit Tests | `approved` + review record | test files for the task |
| Approved Integration Tests (backend-tagged tasks only) | `approved` + review record | integration test files for the task; not required for frontend-tagged tasks |
| Project routing architecture | available | see spec/AGENTS.md Architecture References |
| Project module architecture | available | see spec/AGENTS.md Architecture References |
| Project rendering/data architecture | available | see spec/AGENTS.md Architecture References |

**Reference inputs — load only when needed:**

| Input | When To Load |
|-------|-------------|
| Approved LLD | task's Source LLD References field is ambiguous, or a design conformance check requires direct comparison against source |
| Business Requirements + ACs | task's Source Requirement References field is ambiguous, or AC coverage is contested |

The approved delivery task is the traceability anchor. It carries requirement IDs with spec source locations and LLD section IDs — use these as the primary basis for conformance checks. Open the full LLD or business spec only when the task field reference is insufficient to resolve a specific check.

All three architecture documents are always required — not optional even if the task appears routing-neutral.

Mark `blocked` if any primary input is missing, not in approved state, or materially inconsistent with another required input in a way this stage cannot resolve.

Do not use: unapproved drafts, progress notes as authority, review comments without a corresponding approved artifact.

---

## Output Contract

The Validation section must contain all eight sections. Missing any section = invalid record.

**File location:** `## Task: TASK-{id}` → `### Validation` section in `spec/progress/<module>/progress-{STORY-ID}.md`

| Section | Required Content |
|---------|----------------|
| **1. Task Identification** | Task ID, title, LLD section reference, business spec reference |
| **2. Inputs Checked** | Architecture docs (by role), implementation + unit-testing review record references (plus integration-testing review record reference for backend-tagged tasks) |
| **3. AC Coverage Table** | AC-ID / criterion / unit test reference / integration test reference (backend-tagged tasks only, else `n/a`) / status (`pass` / `fail` / `missing`). Any `fail` or `missing` = cannot approve |
| **4. Architecture Conformance** | `compliant` or `violations found`. Violations: which doc, description, severity (critical/major/minor), approved exception if any |
| **5. Traceability Chain** | Frontend-tagged task: four links (business req→LLD / LLD→task / task→code / code→test). Backend-tagged task: five links (business req→LLD / LLD→task / task→code / code→unit-test / unit-test→integration-test). Each link `present` or `missing`. Any `missing` = cannot approve |
| **6. Issues Found** | All issues or "none". Per issue: ID (VAL-001), description, severity, affected check, required action |
| **7. Validation Outcome** | `approved` / `revise` / `blocked` + rationale. `revise`: which stage + issues. `blocked`: blocker + human decision needed |
| **8. Required Actions** | `approved`: Validation section written, traceability updated, task → `done`. `revise`/`blocked`: actions + responsible stage |

---

## Process Steps

### Checks To Perform

- **Code-to-task:** task objective delivered; in-scope work present; no out-of-scope additions; ACs addressed
- **Code-to-LLD:** structure, state ownership, rendering strategy (frontend) or data ownership/persistence strategy (backend), validation shape, edge cases follow the layer-matching approved LLD
- **Code-to-requirement:** each AC traceable to implementation; no contradiction of approved business requirement
- **Architecture** (all three docs): routing placement + shells (frontend) or routing/access-tier placement (backend); module ownership + import direction; rendering/data strategy (frontend) or data-and-integration strategy (backend) + security baseline
- **Contract conformance:** backend-tagged task touching a new/changed operation — `contracts/<module>/<module>.yaml` matches the approved LLD-BACKEND touchpoint table entry; frontend-tagged task whose cross-layer dependency has since resolved — implementation reconciled against the real contract file, not the draft LLD shape it started against
- **Test coverage:** each AC has ≥1 unit test; loading/empty/success/failure states covered where task requires; security flows tested; for backend-tagged tasks, each in-scope API entrypoint or cross-boundary interaction additionally has ≥1 integration test
- **Traceability chain:** frontend-tagged task = all four links present or explicitly recorded as missing; backend-tagged task = all five links present or explicitly recorded as missing

### Hard Boundaries

Validation is read-only and record-only. No code files and no test files are modified. Validation must not change code, change tests, reinterpret approved requirements, self-approve architecture exceptions, or silence known gaps by omitting them.

### When Gap Cannot Be Resolved

Record the gap in the issues list with severity. State whether it requires reopening implementation, reopening testing, or a human decision. Set outcome to `revise` or `blocked`. Do not proceed to `approved`.

### Human-In-The-Loop Triggers

Escalate when: architecture violation exists with no approved exception; requirement conflict cannot be interpreted from available sources; coverage gap requires a scope decision; implementation fundamentally misinterprets an approved requirement requiring re-approval of an earlier-phase artifact.

### Post-Approval Updates

After `approved` outcome: the Validation section must exist and be complete; `spec/traceability/` must reflect the completed chain; task progress status must be updated to `done`.

---

## Review Checklist

Review must end with `approved`, `revise`, or `blocked`.

| # | Check | Trigger |
|---|-------|---------|
| 1 | **AC Coverage** — all ACs have unit test coverage (plus integration test coverage where applicable, for backend-tagged tasks); all rows `pass`; required states covered | `revise` if any `missing` or `fail` |
| 2 | **Task Scope Conformance** — implementation stays within approved task scope; objective addressed | `revise` if scope drift |
| 3 | **Routing Architecture** — route/endpoint placement, shells (frontend) or access-tier expectations (backend) follow project routing architecture | `revise` if violations; `blocked` if exception required |
| 4 | **Module Architecture** — module boundaries, import direction, shared vs feature-local follow project module architecture | `revise` if violations; `blocked` if human exception needed |
| 5 | **Rendering/Data Architecture (frontend) or Data/Integration Architecture (backend)** — rendering, data-fetching, state (frontend) or persistence, caching, external-service integration (backend) follow the layer-matching project architecture | `revise` if contradicts arch; `blocked` if deviation requires human approval |
| 6 | **State Coverage In Tests** — loading/empty/success/failure states covered by unit tests; for backend-tagged tasks, cross-boundary failure paths additionally covered by integration tests where the task involves them | `revise` if required coverage missing |
| 7 | **Security And Compliance** — security-sensitive flows handled and tested; compliance behaviors handled | `revise` if untested; `blocked` if compliance risk requires human decision |
| 8 | **Traceability Chain** — all links present in the Validation section (four for frontend-tagged tasks, five for backend-tagged tasks) | `revise` if missing but fixable; `blocked` if earlier-phase artifact must reopen |
| 9 | **Contract Conformance** — backend-tagged task touching a new/changed operation: `contracts/<module>/<module>.yaml` matches the approved LLD-BACKEND touchpoint table; frontend-tagged task with a since-resolved cross-layer dependency: implementation reconciled against the real contract file | `revise` if contract not updated or reconciliation skipped; `blocked` if the contract materially disagrees with the approved LLD |
| 10 | **Issues Recorded** — all issues in issues section with severity and required action; list present even if empty | `revise` if issues noted elsewhere but not listed |

Mark `approved` only when: all ACs `pass`, architecture `compliant`, traceability all `present` for the layer-appropriate chain length, issues list has no unresolved items, Validation section complete.

---

## Done Criteria

Validation is `done` only when all are true:

1. `### Validation` section exists under `## Task: TASK-{id}` in `spec/progress/<module>/progress-{STORY-ID}.md`
2. All in-scope ACs present in coverage table with status `pass`
3. Architecture conformance section present and shows `compliant`
4. Traceability chain table present with all links `present` (four for frontend-tagged tasks, five for backend-tagged tasks)
5. Issues list present and contains no unresolved items
6. Validation outcome is `approved`
7. Task progress status updated to `done`
8. Traceability records in `spec/traceability/` updated to reflect completed chain

`approved` = validation passed all checks. `done` = record written, downstream artifacts updated, task formally closed.

Tests passing in a test runner does not constitute done — it does not confirm task scope conformance, LLD conformance, architecture conformance, AC test coverage, traceability chain completeness.

False-done patterns: tests pass but Validation section not written; record exists but AC table incomplete; `approved` before architecture check performed; task set to `done` before traceability updated; validation skipped because implementation looked correct.

---
