# Decomposition Stage

## Agent Delta

**Stage:** Decomposition — planning stage
**Entry:** every in-scope LLD is `approved` (both `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md`, per `spec/architecture/ARCH-DECISIONS.md` §Layer Scope = `both`; the single in-scope LLD otherwise); requirement references stable; no unresolved arch conflicts
**Output:** `spec/tasks/<module>/TASK-<STORY-ID>-FRONTEND-T<n>.md` / `-BACKEND-T<n>.md` — mirrored per business module, flat (no `tasks/` subfolder), one file per task, filename tagged by layer; each has stable ID, mandatory `Layer: frontend|backend` field, objective, in/out-of-scope, impacted areas, arch constraints, dependencies, test expectations
**Task shapes:** Frontend: Foundation / Feature-Module / Component-Slice / Shared Utility. Backend: Foundation / Domain-Service / Endpoint / Shared Utility. Read only the heading matching the LLD being sliced
**Default sizing:** medium — code + tests in one task; split only on risk, shared-layer, dependency, or distinct-surface boundaries; do not split by technical layer within one flow (this means within-codebase layers — types/actions/hook-store on frontend, types/repository/service on backend — never the mandatory frontend/backend `Layer` split, which every task carries regardless of sizing)
**Task ordering:** dependency-driven only, via the `Dependencies` field — a frontend task that consumes a backend task's contract is sequenced after it; a task with no cross-layer dependency has no forced order relative to the other layer. No blanket "all backend before all frontend"
**Must not:** generate code; silently edit approved LLD; hide planning gaps in vague task wording; omit the `Layer` field
**Done when:** decomposition review is `approved`; LLD section → task and requirement → task mappings exist; execution handoff clear

---

## Overview

Converts every in-scope approved LLD (`LLD-FRONTEND-<STORY-ID>.md` and/or `LLD-BACKEND-<STORY-ID>.md`, per this project's Layer Scope) into delivery-ready, layer-tagged tasks for execution. When Layer Scope = `both`, cross-layer task dependencies (e.g. a backend endpoint task must exist before the frontend task consuming it) are expressed via the existing `Dependencies` field.

- Stage: `Decomposition` | Phase: `1`
- Upstream: `LLD Review Gate` | Downstream: `Decomposition Review Gate`
- Primary Artifact: `Delivery Task Set`

A delivery task is not a vague to-do item. It must be scoped, traceable, reviewable, architecture-constrained, and small enough to execute safely. This stage translates approved design into executable work units — it does not rewrite LLDs, generate code, or hide planning gaps.

If decomposition reveals an LLD gap, escalate — do not silently repair inside task definitions.

**Invoked from `/speccraft.change`:** decomposition scope is limited to that story's delta only — new task file(s) continuing its own existing `TASK-<STORY-ID>-{FRONTEND|BACKEND}-T*` sequence, in whichever Layer(s) the CR's LLD delta actually touched. Review happens via the CR's own combined review gate (`spec/workflows/change-request/CHANGE-REQUEST-STAGE.md`), not this stage's separate Decomposition Review Gate.

---

## Entry Conditions

Begin only when:

- **Start timestamp captured** — before any other entry condition is evaluated, before any LLD file is read, capture the real wall-clock `Start` per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable, including on a run that will immediately end in `blocked`.
- every in-scope LLD is `approved` (not `draft`, `in-review`, or `revise`) — when Layer Scope = `both`, both `LLD-FRONTEND-<STORY-ID>.md` and `LLD-BACKEND-<STORY-ID>.md` must be approved; a single approved LLD is not sufficient to begin decomposition if the other is also in scope
- source requirement references are stable
- LLD traceability is strong enough for task derivation, in every in-scope LLD
- no unresolved architecture conflicts remain in any approved design, and (when Layer Scope = `both`) no unresolved companion-pair conflict remains between the two

---

## Input Contract

Required:

1. current user instruction (e.g. `/speccraft.decompose <lld-fe-file> <lld-be-file>` when Layer Scope = `both`, or `/speccraft.decompose <lld-file>` for a single-layer project)
2. every in-scope approved LLD for the work item — both `LLD-FRONTEND-<STORY-ID>.md` AND `LLD-BACKEND-<STORY-ID>.md` when Layer Scope = `both`; the single in-scope LLD otherwise
3. stable requirement or acceptance-criteria references
4. stable LLD section references, from every in-scope LLD

Required-if-relevant:

6–8. the project architecture documents (routing, module, rendering for frontend tasks; routing, module, data-and-integration for backend tasks) — loaded via planning Read Order in spec/AGENTS.md; full detail available from full arch specs as reference-only

Supporting:

9. review decisions attached to the approved LLD
10. API contract references
11. design references

---

## Output Contract

Primary output: a delivery task set for the work item.

### Required Task Fields

Each task must include:

| Field | Requirement |
|-------|-------------|
| Task ID | unique, stable through execution (e.g., `TASK-REG-001`); filename tagged `TASK-<STORY-ID>-FRONTEND-T<n>.md` or `-BACKEND-T<n>.md` |
| Layer | `frontend` or `backend` — mandatory; belt-and-suspenders with the filename tag so a rename typo cannot silently misroute execution |
| Title | one coherent delivery slice — not vague |
| Source Requirement References | requirement IDs or acceptance criteria IDs — mandatory |
| Source LLD References | LLD section IDs, from the layer-matching LLD (`LLD-FRONTEND-<id>.md` or `LLD-BACKEND-<id>.md`) — mandatory |
| Objective | one clear implementation outcome |
| In-Scope Work | concrete work list, including tests where relevant |
| Out-Of-Scope Work | explicit boundaries, especially near adjacent flows |
| Impacted Areas | frontend: routes, modules, components, logic units, stores, schemas, tests; backend: routes/endpoints, modules, services, repositories, schemas, tests |
| Edge Cases To Preserve | edge cases inherited from the layer-matching LLD; state explicitly if none |
| Architecture Constraints | project architecture constraints active for this task (routing, module, rendering for frontend; routing, module, data-and-integration for backend) |
| Reuse Expectations | reuse, extension, or shared-layer promotion where needed |
| Dependencies | other task IDs, schema/contract availability, upstream decisions |
| Implementation Notes | risk, sequencing, state ownership, integration-sensitive notes |
| Expected Evidence | artifacts, test coverage, traceability update |
| Test Expectations | success + failure + edge-case paths |
| Current State | `draft` → `in-review` → `approved` |
| Estimated Complexity | `small` / `medium` / `large` — recorded sizing hint; does not override Task Sizing Rules below |
| Open Questions Or Blockers | explicit; do not pretend task is ready when blocked |

### Execution-Ready Rule

A task is execution-ready only when execution can answer: what am I implementing, why, which requirement, which LLD decision, what is in/out of scope, what areas are impacted, what constraints apply, what tests to include, what evidence shows completion.

### Traceability Minimum

Each task must support: requirement ID → task ID and LLD section ID → task ID.

### Forbidden Task Patterns

Tasks that trigger `revise`: no requirement references, no LLD references, no `Layer` field, no out-of-scope boundary, no impacted areas, no architecture constraints where clearly needed, no edge cases, no test expectations, vague title/objective, multiple unrelated delivery slices, a filename layer tag that disagrees with the `Layer` field.

---

## Task Sizing Rules

### Core Rule

Default task size is **medium** — one coherent implementation slice, one meaningful user-facing behavior, one reviewable architectural unit of work.

Hybrid model: default to medium, split only when risk, shared-layer impact, or dependency structure justifies it. Goal: smallest usefully executable set, not maximum task count.

execution token cost scales directly with task count — per-task governance overhead is fixed regardless of task size. Minimize task count to the smallest set that satisfies dependency, risk, and review requirements. Splitting by technical layer within one flow is the most common source of unnecessary tasks.

### Code And Tests

By default, one task includes both implementation and related test work. Split tests into a separate task only when test work is unusually large, cross-cutting, or blocked by sequencing.

### Preferred Count

- `1–4 tasks` — acceptable for small work items
- `5–12 tasks` — preferred normal range
- `13–20 tasks` — acceptable with explicit justification
- `20+` — strong signal to reassess; common causes: over-fragmentation, splitting by file/function not delivery value

### When To Split

Split when one or more is true:
- **Risk boundary** — one part is materially riskier or needs distinct review (e.g., shared auth logic vs. route wiring)
- **Shared-layer boundary** — one part creates a reusable asset, another consumes it
- **Dependency boundary** — one task must exist before another can start safely
- **Distinct surface** — materially different user-facing surfaces with no atomic delivery reason to combine
- **Distinct ownership** — different modules or architecture concerns where combining obscures responsibility

### When Not To Split

Do not split just because code spans multiple files, tests are needed, a slice has obvious substeps, or there are several small UI elements in one coherent slice.

Additional anti-patterns — do not split (frontend):
- **Same business flow, Feature-Module layer.** Types, interfaces, schemas, server-side actions, and the orchestration hook/store for a feature all serve one data integration concern. They belong in one task. "Types only" and "server-side actions only" tasks have no standalone delivery value.
- **Types and interfaces alone.** Generated contracts, ViewModel types, and DTOs travel with the server-side actions or API wrappers that produce and consume them.
- **Styling alone.** Utility CSS classes and CSS modules belong with the component they style. Never separate a component's markup from its styling.
- **A single-feature orchestration hook/store.** A hook/store that wires a feature's server-side actions and manages multi-step state for that feature belongs in the Feature-Module task — not a separate task, even if multiple Component-Slice tasks consume it. It becomes its own task only when consumed across independent features or user stories.
- **Sequential same-flow steps.** Step A producing input immediately consumed by Step B, both serving the same business behavior, belong in one Feature-Module task.

Additional anti-patterns — do not split (backend):
- **Same business flow, Domain-Service layer.** Types, interfaces, schemas, repository functions, and the service layer for a feature all serve one data integration concern. They belong in one task. "Types only" and "repository only" tasks have no standalone delivery value.
- **Types and interfaces alone.** Generated contracts, DTOs, and mappers travel with the repository or service code that produces and consumes them.
- **Migration alone.** A database migration belongs with the repository/model code that depends on the new schema shape. Never separate a schema change from the code that requires it.
- **A single-feature service class.** A service that wires a feature's repositories and manages multi-step business logic for that feature belongs in the Domain-Service task — not a separate task, even if multiple Endpoint tasks consume it. It becomes its own task only when consumed across independent features or user stories.
- **Sequential same-flow steps.** Step A producing input immediately consumed by Step B, both serving the same business behavior, belong in one Domain-Service task.

### Natural Task Shapes

Two shape sets — one per layer, four shapes each. Decomposing `LLD-FRONTEND-<id>.md` uses **Frontend Task Shapes**; decomposing `LLD-BACKEND-<id>.md` uses **Backend Task Shapes**. Read only the heading matching the LLD you are slicing before applying split criteria.

#### Frontend Task Shapes

**Foundation Task** — platform work that multiple flows in the feature share:
- Shared state stores, middleware gates, auth layouts
- Shared utilities consumed by 2+ downstream tasks
- Keep separate because it is a hard dependency boundary for all other tasks in the feature

**Feature-Module Task** — the route, component, hook, and store wiring for one business flow, plus everything that handles data for it:
- Generated type declarations / mocked shapes derived from the API contract (`contracts/<module>/<module>.yaml` if the backend dependency has landed, else the companion-checked LLD-BACKEND touchpoint table as an interim mock) — this task never authors the contract file itself, only consumes it
- ViewModel / DTO mappers
- Validation schemas for those API inputs
- Server-side actions or API wrapper functions that call those endpoints
- Orchestration hook/store that wires the server-side actions and manages multi-step flow state for this feature
- Primary route wiring for the feature's entry point
- Unit tests for all of the above

One feature = one Feature-Module task. Do not split by layer (types task → actions task → hook/store task).

**Component-Slice Task** — the view layer for one discrete UI surface in the flow:
- Component markup for that surface
- Utility CSS classes and component-level CSS
- Additional route wiring if this surface is a distinct terminal step
- Form wiring (form library + schema resolver) if a form
- Component unit tests

One UI surface = one Component-Slice task. Multiple Component-Slice tasks for the same feature are independent and can run in parallel after the Feature-Module task completes.

**Shared Utility Task** — keep separate only when:
- A logic unit, store, or utility is consumed across independent features or user stories (not merely across steps of the same feature)
- It creates a cross-feature shared-layer asset

This is different from a single-feature orchestration hook/store (which belongs in the Feature-Module Task for that feature).

#### Backend Task Shapes

**Foundation Task** — platform work that multiple flows in the feature share:
- Shared DB connection/pool config, auth middleware, base error-handling middleware
- Shared utilities consumed by 2+ downstream tasks
- Keep separate because it is a hard dependency boundary for all other tasks in the feature

**Domain-Service Task** — everything that handles data for one business flow or feature:
- API contract file (`contracts/<module>/<module>.yaml`) — written/updated to match the approved LLD-BACKEND touchpoint table, per `IMPLEMENTATION-STAGE.md`; does not need to pre-exist
- Generated type declarations, DTO mappers
- Validation schemas for those API inputs
- Repository/data-access functions for the flow's persistence
- Service layer that orchestrates repository calls, business rules, and any external integration for this feature
- Unit tests for all of the above

One feature = one Domain-Service task. Do not split by layer (types task → repository task → service task).

**Endpoint Task** — the entrypoint layer for one discrete API operation in the flow:
- Route/controller handler wiring for that operation
- Request parsing and validation wiring
- Response shaping and status/error-code mapping
- Route registration and middleware attachment if this operation is the terminal step
- Endpoint unit tests

One API operation = one Endpoint task. Multiple Endpoint tasks for the same feature are independent and can run in parallel after the Domain-Service task completes.

**Shared Utility Task** — keep separate only when:
- A service, repository, or utility is consumed across independent features or user stories (not merely across steps of the same feature)
- It creates a cross-feature shared-layer asset

This is different from a single-feature service class (which belongs in the Domain-Service Task for that feature).

### Task Quality Signals

| Signal | Meaning |
|--------|---------|
| objective requires "and" for unrelated concerns | likely needs splitting |
| no standalone delivery value | merge with sibling |
| spans multiple major flows without one outcome | too broad |
| exists only because decomposer split by file/function | too small |
| types, interfaces, or contract as a standalone task | merge with the actions/repository and orchestration/service code that creates and consumes them |
| separate tasks for sequential steps of the same data flow | merge into one Feature-Module (frontend) or Domain-Service (backend) task for the feature |
| objective is broad but not operational | too vague |
| task's `Layer` field disagrees with which LLD or task shape it was derived from | wrong layer tag — fix before review |

### Architecture-Aware Sizing

Frontend: use project routing/module/rendering architecture to find natural task seams. Backend: use project routing/module/data-and-integration architecture. Do not combine across route, module, or shared-layer boundaries carelessly, in either layer.

---

## Process Steps

1. Confirm entry conditions and load every in-scope approved LLD + architecture documents for the in-scope layer(s)
2. Identify task seams per layer using business-flow-first reasoning, run once against each in-scope LLD (`LLD-FRONTEND-<id>.md` and/or `LLD-BACKEND-<id>.md`):
   a. List distinct business flows or user-facing behaviors from the LLD. Each flow is one task candidate — not each technical layer within that flow.
   b. Frontend: for each flow, the Feature-Module grouping (contract, types, schemas, server-side actions, orchestration hook/store, primary route) is one natural grouping; each distinct Component-Slice (its component, markup, CSS, form wiring) is another natural grouping. Backend: for each flow, the Domain-Service grouping (contract, types, schemas, repository, service) is one natural grouping; each distinct Endpoint (route/controller handler, request validation, response mapping) is another natural grouping.
   c. Identify platform work per layer — shared stores/middleware/layouts (frontend) or shared middleware/connection config/base error handling (backend) that multiple flows depend on. These become a separate Foundation task per layer (dependency boundary).
   d. Identify cross-feature utilities per layer: hooks/stores/helpers (frontend) or services/repositories/helpers (backend) consumed across independent features or user stories. These become their own tasks (shared-layer boundary). Single-feature orchestration units belong in the Feature-Module/Domain-Service task for that feature.
3. For each task: tag `Layer: frontend` or `Layer: backend`; apply architecture application rules for that layer; preserve edge cases and impacted areas from the layer-matching LLD
4. Apply sequencing and dependency logic, including cross-layer dependencies (only possible when Layer Scope = `both`; e.g. a backend Endpoint task the frontend Feature-Module task's API touchpoint depends on) via the `Dependencies` field. Ordering is derived strictly from actual dependency edges — a task with no cross-layer `Dependencies` entry has no forced order relative to the other layer. Never default to "all backend tasks before all frontend tasks" as a blanket rule
5. Update planning traceability: LLD section → task ID, requirement ID → task ID, for the in-scope layer(s)
6. Produce task set; confirm each task passes the execution-ready check and carries a correct `Layer` field
7. Produce handoff for Decomposition Review Gate

### Architecture Application Rules

**Routing:** Frontend: use project routing architecture for route-oriented task boundaries, shell/layout-related task separation, access-flow-sensitive grouping. Backend: use project routing architecture for endpoint-oriented task boundaries, middleware/access-tier-related task separation, access-flow-sensitive grouping.

**Module:** Use project module architecture for module/service ownership decisions, shared-vs-feature-local boundaries, import and layering implications, in either layer.

**Rendering and Data (frontend) / Data And Integration (backend):** Frontend: use project rendering and data architecture for server-vs-client-sensitive task boundaries, state-related splits, testing-aware decomposition. Backend: use project data and integration architecture for persistence-vs-external-integration task boundaries, transaction-related splits, testing-aware decomposition.

Tasks must not be shaped in ways that encourage obvious architecture violations.

### Hard Boundaries

Must not: edit business spec, edit approved LLD silently, generate code, generate tests, hide planning gaps in vague task wording, invent planning decisions.

### Human-In-The-Loop Triggers

Escalate when: approved LLD appears insufficient for safe task derivation, source conflicts require reopening a locked artifact, 20+ tasks with none mergeable, decomposition requires a scope tradeoff not already approved, architecture conflict visible at task level.

---

## Review Checklist

Review must end in `approved`, `revise`, or `blocked` only.

| # | Check | Trigger |
|---|-------|---------|
| 1 | **Upstream readiness** — decomposition based on every in-scope `approved` LLD (both, when Layer Scope = `both`); requirement and LLD refs stable in each | `revise` if refs weak; `blocked` if any in-scope LLD not approved |
| 2 | **Scope fidelity** — task set reflects approved LLD scope per layer; no silent expansion or omission | `revise` if drift visible; `blocked` if approved scope too ambiguous |
| 3 | **Task quality** — each task has clear identity, objective, and is implementation-relevant; not vague, trivial, or mixed | `revise` if tasks require execution to guess fundamentals |
| 4 | **Task sizing** — hybrid medium-size rule followed per layer; count proportionate; code+tests together by default | `revise` if inflated or fragmented; `blocked` if structurally unstable |
| 5 | **Edge case carry-through** — important LLD edge cases survive into tasks; failure/empty/loading/access cases visible | `revise` if disappeared; `blocked` if makes execution unsafe |
| 6 | **Impacted areas carry-through** — each task identifies relevant impacted areas; full picture preserved | `revise` if generic/missing; `blocked` if adjacent-flow risk unresolved |
| 7 | **Architecture carry-through** — routing/module/rendering (frontend) or routing/module/data-and-integration (backend) constraints from the layer-matching LLD preserved | `revise` if disappeared; `blocked` if executing tasks requires unresolved arch exception |
| 8 | **Reuse carry-through** — reuse expectations from LLD preserved; no quiet duplicate encouragement | `revise` if reuse ignored |
| 9 | **Dependencies and sequencing** — dependencies visible, including cross-layer dependencies; sequencing meaningful; prerequisite work identifiable | `revise` if unclear; `blocked` if safe order undeterminable |
| 10 | **Traceability** — requirement IDs and LLD section IDs map to task IDs; uncovered areas visible | `revise` if partial/weak; `blocked` if too broken to trust scope |
| 11 | **Layer tagging** — every task has a `Layer` field matching its filename tag and its source LLD (`LLD-FRONTEND-<id>.md` → `frontend`, `LLD-BACKEND-<id>.md` → `backend`) | `revise` if missing or mismatched |
| 12 | **execution readiness** — execution can begin without guessing core scope; no hidden planning work remains | `revise` if not execution-ready; `blocked` if execution should not start |

Mark `approved` only when all checks pass. Do not approve merely because tasks exist or titles sound specific.

---

## Revision Rules

When `revise`:

- address review findings directly
- preserve source requirement references, approved LLD linkage, locked artifact boundaries
- may change: task titles, objectives, grouping, splitting, merging, dependency ordering, field completeness
- must not silently rewrite business spec, approved LLD, or approved scope
- update traceability alongside content; changed task IDs must be traced forward

When revision reveals that upstream LLD changes are needed: `blocked`, not repeated revision.

---

## Done Criteria

Decomposition is `done` only when all are true for the current scope:

1. task set exists with stable IDs, each tagged with a mandatory `Layer` field matching its filename tag
2. tasks are sized appropriately and clear enough for implementation, per layer's task shapes
3. tasks carry forward: edge cases, impacted areas, architecture constraints, from the layer-matching LLD
4. dependencies and sequencing are visible, including cross-layer dependencies
5. LLD section ID → task ID and requirement ID → task ID mappings exist for every in-scope LLD (`LLD-FRONTEND-<id>.md` and/or `LLD-BACKEND-<id>.md`)
6. decomposition review outcome is `approved`; required revisions resolved
7. execution handoff is clear

`done` ≠ `approved`: approved means execution may use the task set; done means decomposition stage is complete and recorded.

False-done patterns: tasks created but not reviewed; reviewed but still vague; numerous but over-fragmented; approved but dependencies confusing.

---

## Approval States And Review Gate

### States

| State | Meaning | Downstream allowed? |
|-------|---------|-------------------|
| `draft` | authoring started, not review-ready | no |
| `in-review` | submitted for review, outcome pending | no |
| `revise` | review found issues requiring changes | no |
| `approved` | passed required review for current stage | yes |
| `blocked` | cannot continue — missing input, unresolved conflict, or dependency | no |
| `done` | artifact and required downstream evidence complete | n/a |

### Human-Approval Rule

**AI cannot self-approve. Every stage gate requires explicit human approval.**

1. AI produces artifact, outputs summary, stops — execution turn ends
2. Human reads artifact and responds: `approved` / `revise: [reason]` / `blocked: [reason]`
3. AI proceeds only after receiving explicit human approval in the next turn

Silence is not approval. A well-structured artifact is not approval.

---

## Cross-References

Read this stage document together with:

- `spec/AGENTS.md`
- `spec/REVIEW-AND-REVISION-POLICY.md`
- `spec/workflows/shared/STAGE-CONTRACT.md`
- `spec/workflows/shared/TRACEABILITY-RULES.md`
- `spec/workflows/lld/LLD-STAGE.md`

