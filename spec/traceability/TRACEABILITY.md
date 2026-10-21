# Traceability Master File — TEMPLATE ONLY, DO NOT WRITE HERE

> **Deprecated write target.** This file is a schema reference, not a live artifact. Do not add real story rows below.
>
> Write live traceability data to:
> - `spec/traceability/<mirrored-business-path>/TRACEABILITY.md` — one shard per story, holding both the frontend and backend chains together, distinguished by the `Layer` column
> - `spec/traceability/shared/scaffold-frontend/TRACEABILITY.md` and `spec/traceability/shared/scaffold-backend/TRACEABILITY.md` for scaffold-only shared setup history (independent per layer)

---

## Business Spec to LLD

### Usage
Update this section each time an LLD is created or revised. Do not defer population to end of phase. Add a row when a requirement is identified; update Status as mapping progresses. A requirement consumed by both layers gets two rows — one `frontend` (LLD File = `LLD-FRONTEND-<STORY-ID>.md`), one `backend` (LLD File = `LLD-BACKEND-<STORY-ID>.md`).

`Source` marks where a row came from: `original` for rows written by `/speccraft.tech-design`; `CR-<n>` (this story's own CR sequence number) for rows written by `/speccraft.change` CR-5. This is what lets a reviewer or dashboard isolate exactly which mappings a given Change Request introduced.

### Status Legend
- **mapped** - requirement is fully addressed in the referenced LLD section
- **partial** - requirement is referenced in an LLD but coverage is incomplete
- **missing** - requirement has no LLD coverage yet

### Traceability Table

| Layer | Req ID | Req Description | LLD File | LLD Section | Source | Status |
|-------|--------|-----------------|----------|-------------|--------|--------|

### Last Updated
_(no entries yet)_

---

## LLD to Tasks

### Usage
Update this section each time a task is created during decomposition. Add a row per LLD section when the LLD is approved; fill in Task ID as tasks are defined. Do not defer population to end of decomposition. `Layer` must match the LLD file's layer (`LLD-FRONTEND-<id>.md` rows are always `frontend`, `LLD-BACKEND-<id>.md` rows are always `backend`).

`Source` marks where a row came from: `original` for rows written by `/speccraft.decompose`; `CR-<n>` (this story's own CR sequence number) for rows written by `/speccraft.change` CR-5's delta-scoped decomposition.

### Status Legend
- **mapped** - LLD section is fully covered by one or more tasks
- **partial** - LLD section has some task coverage but gaps remain
- **missing** - LLD section has no corresponding task yet

### Traceability Table

| Layer | LLD File | LLD Section | Task ID | Source | Status |
|-------|----------|-------------|---------|--------|--------|

### Last Updated
_(no entries yet)_

---

## Tasks to Code

### Usage
Update this section as implementation proceeds for each task. Add a row when a task moves to implementation; list all changed files and units. Update Status when implementation is complete and reviewed. `Layer` mirrors the task's own mandatory `Layer` field and its `TASK-<STORY-ID>-FRONTEND-T<n>` / `-BACKEND-T<n>` filename tag; code files are under `src-code-frontend/` or `src-code-backend/` accordingly.

### Status Legend
- **mapped** - task is fully implemented and all code units are identified
- **partial** - task is in progress or some code units are not yet identified
- **missing** - task has no code mapping yet

### Traceability Table

| Layer | Task ID | Code Files / Units Changed | Status |
|-------|---------|---------------------------|--------|

### Last Updated
_(no entries yet)_

---

## Code to Tests

### Usage
Update this section as tests are written. Add a row per code unit when implementation is complete; fill in test file and test case names as tests are authored. Do not defer population to end of the testing stage. For `frontend` rows this is the final test link in the chain (4-link chain: req→LLD-FRONTEND→task→code→test). For `backend` rows this is the unit-test link only — the chain continues below (5-link chain: req→LLD-BACKEND→task→code→unit-test→integration-test).

### Status Legend
- **mapped** - code unit has test file and all required test cases present
- **partial** - code unit has a test file but coverage is incomplete
- **missing** - code unit has no test coverage yet

### Traceability Table

| Layer | Task ID | Code Unit | Test File | Test Cases | Status |
|-------|---------|-----------|-----------|------------|--------|

### Last Updated
_(no entries yet)_

---

## Unit Tests to Integration Tests

### Usage
**Backend tasks only.** Frontend tasks have no integration-testing stage — the frontend chain ends at Code to Tests above and goes straight to Validation. Do not add `frontend` rows to this section. Update this section as integration tests are written. Add a row per backend task when unit tests are approved; fill in the boundaries covered (API contract, persistence, external integration) and integration test file as tests are authored. Do not defer population to end of the integration testing stage.

### Status Legend
- **mapped** - task has integration test coverage for all boundaries it introduces or changes
- **partial** - task has an integration test file but boundary coverage is incomplete
- **missing** - task has no integration test coverage yet
- **n/a (frontend task)** - not applicable; frontend tasks skip this stage entirely

### Traceability Table

| Layer | Task ID | Boundaries Covered | Integration Test File | Test Cases | Status |
|-------|---------|--------------------|-----------------------|------------|--------|

### Last Updated
_(no entries yet)_

---

## Coverage Matrix

### Usage
Update this section progressively as each traceability section is populated. A row is added when a requirement is first identified per layer. Each column is filled in as that layer of the chain is completed. Do not populate all at once at the end of the phase. **`Integration Test Mapped` is never left blank**: for `frontend` rows it is always populated `n/a (frontend task)`; for `backend` rows it is `mapped`/`partial`/`missing` like every other chain-link column.

### Status Legend
- **mapped** - this chain link is fully covered
- **partial** - this chain link has incomplete coverage
- **missing** - this chain link has no coverage yet
- **n/a (frontend task)** - link does not apply to this layer (Integration Test Mapped column, frontend rows only)
- **complete** - all chain links applicable to this row's layer are mapped (frontend: 4 links; backend: 5 links)
- **partial** (Overall Status) - one or more applicable chain links are partial or missing
- **missing** (Overall Status) - no chain links beyond requirement identification exist

### Coverage Table

| Layer | Req ID | LLD Mapped | Task Mapped | Code Mapped | Test Mapped | Integration Test Mapped | Overall Status |
|-------|--------|-----------|-------------|-------------|-------------|--------------------------|----------------|

### Last Updated

---

## Workflow Metrics

### How To Read

- **Layer**: `frontend`, `backend`, or `shared` (e.g. a combined-LLD review turn covering both companion LLDs in one pass)
- **Start / End**: real wall-clock timestamps; **Duration**: computed from them, never estimated
- **Input Tok / Output Tok**: real usage from the session transcript when available, char-count fallback otherwise
- **Tok Source**: `actual` (transcript-derived) or `estimated` (char-count fallback) — never ambiguous
- **Exact counts**: available via Claude Code `/caveman-stats` or session log at `~/.claude/projects/<project>/<session>.jsonl`
- **Each row = one execution turn** — if a command is revised, a new row is added

Schema and capture method: `spec/workflows/shared/SHARED-POLICIES.md`

### Metrics Table

| Layer | Story ID | Command | Stage | Date | Model | Start | End | Duration (min) | Input Tok | Output Tok | Tok Source | Artifacts | Status | Notes |
|-------|----------|---------|-------|------|-------|-------|-----|----------------|-----------|------------|------------|-----------|--------|-------|

### Last Updated

---

## Conflict Decisions

### How To Read

- **Layer**: `frontend`, `backend`, or `shared` (use `shared` for a same-story FRONTEND/BACKEND contract mismatch caught at the companion-LLD review gate)
- **Status `open`** — conflict detected; hard stop in effect; no LLD section or code may be written for this area until resolved
- **Status `resolved`** — human decided; work may continue per the recorded resolution
- **Status `deferred`** — conflict acknowledged; current story scoped around it; resolution assigned to named future story
- **Each row = one conflicting element** — if one hard stop surfaces multiple conflicts, each gets its own row
- **Rows are never overwritten** — if a resolution changes, a new row is appended with ID suffix `-R1`

Schema and recording rules: `spec/workflows/shared/SHARED-POLICIES.md`

### Decisions Table

| Layer | Decision ID | Story ID | Date | Stage | Conflict Type | Source A | Source B | Conflicting Element | Status | Resolution | Decided By | Recorded By | Unblocks |
|-------|-------------|----------|------|-------|--------------|----------|----------|---------------------|--------|------------|------------|-------------|---------|
| — | — | — | — | — | — | — | — | — | — | — | — | — | — |

### Last Updated
_(no entries yet)_
