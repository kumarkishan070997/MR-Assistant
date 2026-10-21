# TRACEABILITY-RULES.md

Defines how traceability must work across the workflow. Reusable across all stages.

---

## Core Rule

Every meaningful artifact must be mappable to its upstream source and, when applicable, to its downstream artifact. Unmapped artifact: justify explicitly, or remove / revise / block. Traceability is part of workflow correctness, not optional evidence.

---

## Progressive Traceability Rule

- Create mappings as soon as a usable artifact exists
- Update mappings during each stage — do not wait until phase end
- If stage stops midway: preserve mappings for artifacts already produced; mark covered and uncovered scope explicitly

---

## Minimum Traceability Chain

Chain length depends on the task's `Layer`:

**Frontend chain (4 links):**
1. business requirement / AC → LLD
2. LLD → delivery task
3. delivery task → implementation artifact
4. implementation artifact → unit test coverage

**Backend chain (5 links):**
1. business requirement / AC → LLD
2. LLD → delivery task
3. delivery task → implementation artifact
4. implementation artifact → unit test coverage
5. unit test coverage → integration test coverage

Optional additional layers: business requirement → task, business requirement → test, architecture constraint → implementation, review decision → revised artifact.

---

## Dual-Chain-Per-Story Rule

One story produces one traceability shard — `spec/traceability/<module>/<STORY-ID>/TRACEABILITY.md` — never two. That single shard carries the chain(s) for this project's in-scope layer(s) — both the frontend chain and the backend chain side by side when Layer Scope = `both`, a single chain for a single-layer project — distinguished by a `Layer` column (`frontend` / `backend`) on every row, present regardless of Layer Scope. A shard is not split per layer; splitting it defeats the purpose of a merged full-stack view for a reviewer.

Each row's chain length follows its own `Layer`: a `frontend` row is evaluated against the 4-link chain above; a `backend` row against the 5-link chain. Do not force a frontend row to show an integration-test link, and do not let a backend row skip it.

---

## Stable Traceability Units

Use stable IDs wherever possible: requirement ID, AC ID, LLD section ID, task ID, implementation artifact ref, test case ID or test file ref, review record ID when it materially changes direction.

If source lacks IDs: create stable IDs at the earliest relevant phase and preserve them downstream. Do not replace with inconsistent local naming later.

---

## planning Traceability Responsibilities

Minimum mappings:
- business requirement → LLD section
- AC → LLD section
- LLD section → delivery task

Where relevant: architecture constraint → LLD section, impacted area → LLD section.

**planning incomplete if:** LLD exists without visible requirement mapping; tasks exist without visible LLD mapping; uncovered requirements are hidden.

---

## execution Traceability Responsibilities

Minimum mappings, all tasks:
- delivery task → implementation artifact
- implementation artifact → unit tests
- approved AC → test coverage where implemented

Additional mapping, backend-tagged tasks only:
- unit tests → integration tests

Where relevant: architecture constraint → implementation choice, review finding → revision.

**execution incomplete if:** code not linked to approved tasks; tests not linked to implemented behavior; for backend-tagged tasks, integration tests not linked to unit-tested behavior; validation cannot explain what was verified against what.

---

## Coverage Visibility Rule

Traceability must show both covered and uncovered scope. Hidden gaps = workflow failures.

A frontend row's "Integration Test Mapped" column must read `n/a (frontend task)` explicitly — never left blank. A blank cell reads as a hidden gap, which this rule treats as a workflow failure regardless of layer.

---

## Partial Work Rule

If work stops before stage complete: record source items already covered, downstream mappings already existing, what remains unmapped, current status. Interruption does not excuse missing mapping for produced artifacts.

---

## Locked Artifact Rule

- planning: do not rewrite business source to make traceability easier
- execution: do not silently edit planning outputs to repair broken mappings
- Gap requiring earlier-phase change: escalate to human review and record issue

---

## Traceability Granularity Rule

Good: requirement ID → LLD subsection; LLD subsection → task ID; task ID → specific file or code area; task ID → specific test file or group.

Poor: entire business spec → entire codebase; vague "covered by frontend" or "covered by backend". Granularity must help a reviewer understand scope, not hide it.

---

## Traceability Status States

| State | Meaning |
|---|---|
| `draft` | mappings started, incomplete |
| `partial` | some artifacts mapped, uncovered scope remains |
| `review-ready` | sufficiently complete for stage review |
| `approved` | accepted as part of stage approval |
| `blocked` | cannot progress — source or output ambiguity |

---

## Review And Traceability Relationship

- Review should verify required mappings exist
- Revision should update traceability as well as content
- `approved` must not be set if artifact is materially unmapped
- Traceability gaps should usually force `revise` or `blocked`

---

## Source Mismatch Blockage Rule

When conflict detected between source inputs during LLD stage: record block in traceability **before** any LLD design proceeds. Applies to:
- API contract vs business user story conflict
- Design reference (Figma, wireframes, mocks) vs business user story conflict
- New LLD vs an already-approved LLD sharing a module, resource, or endpoint (cross-story)
- `LLD-FRONTEND-<STORY-ID>.md` vs `LLD-BACKEND-<STORY-ID>.md` conflict within the same story's own companion pair (see `spec/workflows/lld/LLD-STAGE.md` Companion LLD Alignment) — same hard-stop mechanism, not a separate one

Append one row per conflict to current story traceability shard `spec/traceability/<module>/<STORY-ID>/TRACEABILITY.md` under `Conflict Decisions`:
- source A: business spec reference (or approved LLD reference, for LLD vs LLD / companion-pair mismatches) + specific claim
- source B: API contract, design ref, the other approved LLD, or the companion LLD + specific conflicting claim
- conflicting element: field names, endpoints, flows, status codes, states, navigation, schema/ownership decisions, API/data-shape contract between the FRONTEND/BACKEND pair
- affected area: LLD sections or behaviors blocked
- status: `open` until human provides explicit resolution

Do not produce review-ready LLD output for any area with `open` conflict row.
Schema and recording rules: `spec/workflows/shared/SHARED-POLICIES.md`

---

## Failure Conditions

Treat traceability as failing when:
- produced artifacts have no upstream mapping
- requirement coverage implied but not shown
- earlier-phase artifacts silently rewritten to repair mappings
- traceability contradicts approved artifacts
- tests claimed as coverage without linking to implemented behavior
- for backend-tagged rows: integration tests claimed as coverage without linking to unit-tested behavior
- a frontend row's Integration Test Mapped column left blank instead of `n/a (frontend task)`

→ trigger `revise` or `blocked`

---

## Recommended Traceability Families

Primary: business → LLD → tasks → code → unit tests → (backend-tagged rows only: integration tests) → coverage matrix, one shard per story with a `Layer` column carrying both chains.

Additional: architecture constraint → implementation, review decision → revised artifact.

---

## Interaction With Other Shared Rules

- `STAGE-CONTRACT.md` — every stage must define traceability responsibilities
- `spec/SPEC-HIERARCHY.md` — which source wins when mappings contested
- `spec/REVIEW-AND-REVISION-POLICY.md` — how traceability gaps affect approval

