# SPEC-FOLDER-STRUCTURE.md

Canonical folder-structure reference for `spec/`.

## Core Rule

`spec/` is the source of truth for AI-agentic workflow and spec-driven delivery. It contains workflow governance, architecture constraints (including optional NFR specs), business specs, LLD outputs, delivery tasks, progress records, traceability, and command contracts. Implementation code, plus per-layer implementation rules and reusable creation-procedure skills, belong under the two independent code roots: `src-code-frontend/` and `src-code-backend/`.

---

## Root Repository Separation

| Path | Role |
|---|---|
| `spec/` | workflow governance, architecture, requirements, LLD, tasks, traceability — single canonical source of truth for both layers |
| `contracts/<module>/<module>.yaml` | API contract — cross-cutting, owned by neither layer; one growing file per module (not per story); written/updated by backend implementation tasks, read by both LLDs and both code roots |
| `src-code-frontend/` | frontend project root — structure defined once the frontend framework is locked in `spec/architecture/` (`AD-FRONTEND-*`) |
| `src-code-backend/` | backend project root — structure defined once the backend framework is locked in `spec/architecture/` (`AD-BACKEND-*`) |
| `.claude/commands/` | thin root-level command stubs for AI agents — each points to its canonical contract under `spec/commands/` |

`src-code-frontend/` and `src-code-backend/` are two independent roots, not nested under one `src-code/` — each is created by `/speccraft.scaffold frontend` or `/speccraft.scaffold backend` per the stack locked in `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-*` / `AD-BACKEND-*` sections respectively; `AD-X-*` entries are cross-cutting and apply to both).

Paths in `src-code-<layer>/rules/` and `src-code-<layer>/skills/` that reference `src/features/`, `src/components/`, etc. are relative to that same `src-code-<layer>/` root — rule/skill content lives inside the root it governs, not under `spec/`. AI workflow begins from `spec/`, not from either code root.

---

## Current Operational Scope

Business spec -> LLD(s) for this project's Layer Scope (`LLD-FRONTEND` and/or `LLD-BACKEND`; both, linked, when Layer Scope = `both`) -> decomposition into Layer-tagged delivery tasks -> execution against the code root matching each task's `Layer` -> validated code + unit tests (+ integration tests for backend-tagged tasks) + progress + traceability updates.

Execution path: intake (one shared pass) -> LLD creation (`LLD-FRONTEND` and/or `LLD-BACKEND`, per Layer Scope; reviewed together as one gate when Layer Scope = `both`) -> LLD review -> decomposition -> decomposition review -> task handoff -> task-to-code (routed by task `Layer`) -> implementation review -> code-to-unit-tests -> testing review -> integration-tests (backend-tagged tasks only) -> integration testing review (backend-tagged tasks only) -> final validation -> progress and traceability updates.

---

## Canonical `spec/` Tree

```text
spec/
├─ AGENTS.md
├─ init.md
├─ WORKFLOW-OVERVIEW.md
├─ SPEC-HIERARCHY.md
├─ REVIEW-AND-REVISION-POLICY.md
├─ SPEC-FOLDER-STRUCTURE.md
├─ architecture/
│  ├─ README.md   (empty until project stack is locked — see ARCH-DECISIONS.md)
│  ├─ NFR-SUMMARY.md   (OPTIONAL — not a mandatory gate; empty/unused by default)
│  └─ API-CONTRACT-SOURCE.md   (OPTIONAL — per-module {{SWAGGER_URL}}, read only by /speccraft.sync-swagger when a human runs it)
├─ workflows/
│  ├─ README.md
│  ├─ shared/
│  │  ├─ STAGE-CONTRACT.md
│  │  ├─ TRACEABILITY-RULES.md
│  │  └─ SHARED-POLICIES.md   (approval states, done criteria, handoff format, metrics rules, conflict-decision rules)
│  ├─ lld/                    (covers Stage 1 Intake + Stage 2–3 LLD; produces the LLD-FRONTEND + LLD-BACKEND pair)
│  ├─ decomposition/
│  ├─ implementation/
│  ├─ testing/
│  ├─ integration-testing/    (backend-tagged tasks only)
│  ├─ validation/
│  └─ change-request/         (alternate planning entry — CHANGE-REQUEST-STAGE.md)
├─ commands/
├─ business/
│  └─ cr-changes/
│     └─ <module>/
│        └─ CR-<STORY-ID>-<n>.md
├─ lld/
│  └─ <module>/
│     ├─ LLD-FRONTEND-<id>.md
│     └─ LLD-BACKEND-<id>.md
├─ tasks/
│  └─ <module>/                            (flat — no per-layer subfolder)
│     ├─ TASK-<STORY-ID>-FRONTEND-T<n>.md
│     └─ TASK-<STORY-ID>-BACKEND-T<n>.md
├─ progress/
│  ├─ <module>/
│  │  └─ progress-<STORY-ID>.md   (one file per story; forks FRONTEND/BACKEND at the LLD section onward)
│  └─ shared/          (repo-wide, not story-mirrored — e.g. scaffold-frontend/STATUS.md, scaffold-backend/STATUS.md)
└─ traceability/
   ├─ README.md
   ├─ shared/
   │  ├─ scaffold-frontend/
   │  │  └─ TRACEABILITY.md
   │  ├─ scaffold-backend/
   │  │  └─ TRACEABILITY.md
   │  └─ STORY-DEPENDENCIES.md   (bidirectional story dependency ledger — Backward + Forward tables, no Layer column)
   └─ <mirrored-business-path>/
      └─ TRACEABILITY.md         (one shard per story, +Layer column; both chains visible together)
```

`src-code-frontend/` and `src-code-backend/` are created by `/speccraft.scaffold frontend` / `/speccraft.scaffold backend` and do not exist yet in this boilerplate — they sit as siblings of `spec/` at the repository root. `contracts/` is the same kind of sibling — it does not exist until a backend task first writes to it (no pre-population, no scaffold step).

Per-layer implementation rules and reusable creation-procedure skills live in `src-code-<layer>/rules/` and `src-code-<layer>/skills/` (each with a `shared/` subfolder), not under `spec/` — see §Folder Responsibilities below.

---

## Progress Layout

One progress file per story — not one file per stage, not one file per layer. Mirrors only the business module (not the full story-id path), same convention as `spec/lld/`:

- `spec/business/<module>/<STORY-ID>.md` -> `spec/progress/<module>/progress-<STORY-ID>.md`

**Updated mirroring rule — fork starts at LLD, not intake.** Intake is a single shared pass on one business spec, so it stays one section regardless of layer. The fork into frontend/backend artifacts begins at the LLD stage (matching where the artifacts themselves fork): the LLD section splits into one status subsection per in-scope layer (two, when Layer Scope = `both`), decomposition stays a single section (one task set, listing whichever Layer tag(s) are in scope), and from the first task onward every section is per-task-per-layer. Integration-testing progress exists only under backend-tagged tasks.

Shown below for Layer Scope = `both`; a single-layer project has only the one relevant `### LLD-FRONTEND Status` or `### LLD-BACKEND Status` subsection and only tasks for its in-scope layer.

```
# Progress — <STORY-ID>

## Intake                          (one section — shared, layer-agnostic)
## LLD
### LLD-FRONTEND Status
### LLD-BACKEND Status
## Decomposition                   (one section — one task set, in-scope Layer tag(s))
## Task: TASK-<STORY-ID>-FRONTEND-T1
### Status
### Implementation
### Testing
### Validation
### Blockers
### Decisions
## Task: TASK-<STORY-ID>-BACKEND-T1
### Status
### Implementation
### Testing
### Integration Testing            (backend-tagged tasks only)
### Validation
### Blockers
### Decisions
## Task: TASK-<STORY-ID>-FRONTEND-T2
...
## Traceability Metrics
```

Sections are appended, not overwritten — revision history stays visible.

`spec/progress/shared/` is the exception — repo-wide records not tied to one story (e.g. `scaffold-frontend/STATUS.md`, `scaffold-backend/STATUS.md` — one status file per independent scaffold run, per code root), unaffected by this per-story layout.

`spec/lld/` follows the module-mirror, filename-carries-story-id convention, one file per layer per story: `spec/lld/<module>/LLD-FRONTEND-<STORY-ID>.md` + `spec/lld/<module>/LLD-BACKEND-<STORY-ID>.md`. `spec/tasks/<module>/` follows the same module-mirror convention (no per-story or `tasks/` subfolder) — the filename alone carries story id, Layer tag, and sequence: `TASK-<STORY-ID>-FRONTEND-T<n>.md` / `TASK-<STORY-ID>-BACKEND-T<n>.md`, each with a mandatory `Layer: frontend|backend` field in its body as a belt-and-suspenders check against filename typos.

`spec/traceability/` is the one system that still mirrors the full business path (module + story-id subfolder) — one shard per story (not two), with a `Layer` column as its first data column so both chains are visible together — see `spec/traceability/README.md`.

`spec/traceability/shared/scaffold-frontend/` and `spec/traceability/shared/scaffold-backend/` are independent scaffold-run shards (already split from the former single `SCAFFOLD/` folder) — one per code root, tracked independently since the two scaffold runs are independent.

---

## Current State

### Already Created

Workflow governance complete: root docs, architecture reference index, shared workflow docs, stage workflow docs (one consolidated `*-STAGE.md` per stage — Intake is covered inside `spec/workflows/lld/LLD-STAGE.md` §Intake Step, not a separate file; document templates are covered inline in each stage's Output Contract, not a separate templates folder), all command contracts, optional NFR summary (`spec/architecture/NFR-SUMMARY.md`), all traceability tracking files, placeholder READMEs for runtime artifact folders.

`spec/rules/` and `spec/skills/` never exist — Change 16 removed the spec-side mirror. Project rules/skills live solely in `src-code-<layer>/rules/` and `src-code-<layer>/skills/` (each split into that layer's own files plus a `shared/` subfolder for conventions duplicated across both roots), created by that layer's `/speccraft.scaffold` and populated per root `README.md` §Before You Start steps 5-6 — see `CHANGE.md` "Change 16".

`spec/traceability/shared/scaffold-frontend/` and `spec/traceability/shared/scaffold-backend/` already exist as placeholder shards (git-moved from the former single `spec/traceability/shared/SCAFFOLD/`), and `.gitignore`'s traceability exception already covers `spec/traceability/shared/`.

### Awaiting Execution Input

| Artifact | Location | Trigger |
|---|---|---|
| Business spec instances | `spec/business/` | Must exist before workflow runs |
| Generated LLD instances | `spec/lld/<module>/` (LLD-FRONTEND + LLD-BACKEND) | LLD execution |
| Delivery task instances | `spec/tasks/<module>/` | Decomposition |
| Progress records | `spec/progress/<module>/` | Created as work proceeds |
| Traceability row data | `spec/traceability/` | Populated as work proceeds |

---

## Active vs Future-Ready

### Active Now

`spec/business/`, `spec/business/cr-changes/`, `spec/workflows/shared/`, `spec/workflows/lld/`, `spec/workflows/decomposition/`, `spec/workflows/implementation/`, `spec/workflows/testing/`, `spec/workflows/integration-testing/` (backend-tagged tasks only), `spec/workflows/validation/`, `spec/workflows/change-request/`, `spec/commands/`, `spec/traceability/`, `spec/lld/`, `spec/tasks/`, `spec/progress/`.


### Awaiting Input

- `spec/business/` - needs business spec files before workflow runs
- `src-code-frontend/` - scaffold before first frontend-tagged implementation task (`/speccraft.scaffold frontend`)
- `src-code-backend/` - scaffold before first backend-tagged implementation task (`/speccraft.scaffold backend`)

---

## Folder Responsibilities

| Folder | Purpose |
|---|---|
| `spec/` root | workflow governance, top-level policy, workflow control docs |
| `spec/architecture/` | authoritative architecture constraints for both layers (`AD-FRONTEND-*` frontend, `AD-BACKEND-*` backend, `AD-X-*` cross-cutting) |
| `spec/workflows/` | reusable workflow behavior and stage-specific contracts |
| `spec/commands/` | command contracts invoking workflow behavior |
| `spec/business/` | source business requirements |
| `spec/business/cr-changes/` | human-authored Change Request source files, mirrored per module, consumed by `/speccraft.change` |
| `spec/lld/` | generated and reviewed LLD-FRONTEND/LLD-BACKEND artifact pairs, mirrored per business module |
| `spec/tasks/<module>/` | approved delivery task packets, mirrored per module, flat, filename carries story id + Layer + sequence |
| `spec/progress/` | stage and task progress records, one file per story, mirrored per business module, forking FRONTEND/BACKEND from the LLD section onward |
| `spec/traceability/` | per-story requirement-to-output mapping shards mirrored from `spec/business/` paths, one shard per story with a `Layer` column; `shared/STORY-DEPENDENCIES.md` is the repo-wide story dependency ledger exception |

---

## Operational Start Point

AI using this repo: begin in `spec/`, read active governance docs, load `spec/business/` for the work item, run planning stages through approved task creation, run execution stages through validated implementation and tests — routed to the code root matching each task's `Layer`.

---

## Maintenance Rule

Update whenever a new stable folder family is added, an existing folder purpose changes, active execution scope changes, or implementation-rule governance changes.

---

## Full Authoritative Document List

Convention: one consolidated `*-STAGE.md` per stage (not a per-concern file split) — mirrors the Agent Delta protocol's anti-drift rationale in root `README.md`.

### Planning stage docs

Intake is documented inside `spec/workflows/lld/LLD-STAGE.md` §Intake Step — there is no separate `spec/workflows/intake/` folder or file.

`spec/workflows/lld/LLD-STAGE.md` - covers both Intake and LLD Creation: entry/input/output contracts (LLD-FRONTEND + LLD-BACKEND pair), review checklist, revision rules, done criteria.

`spec/commands/speccraft.tech-design.md`, `spec/commands/speccraft.decompose.md`

### Execution pre-entry

`spec/commands/speccraft.scaffold.md` - run once per code root before that root's first task-to-code work; creates `src-code-frontend/` and/or `src-code-backend/`

### Execution stage docs

`spec/workflows/decomposition/DECOMPOSITION-STAGE.md`, `spec/workflows/implementation/IMPLEMENTATION-STAGE.md`, `spec/workflows/testing/TESTING-STAGE.md`, `spec/workflows/integration-testing/INTEGRATION-TESTING-STAGE.md` (backend-tagged tasks only), `spec/workflows/validation/VALIDATION-STAGE.md` - each covers its stage's entry/input/output contracts, review checklist, revision rules, done criteria.

`spec/commands/speccraft.implement.md`, `spec/commands/speccraft.unit-test.md`, `spec/commands/speccraft.integration-test.md`, `spec/commands/speccraft.validate.md`

### Alternate planning entry

`spec/workflows/change-request/CHANGE-REQUEST-STAGE.md` - alternate entry replacing stages 1-5 for an already-approved story; bidirectional dependency ledger, atomic cascade, one combined review gate.

`spec/commands/speccraft.change.md` - `/speccraft.change <CR-file> <original-story-id>`, human-triggered, not part of `/speccraft.orchestrate`'s orchestration.

### Active in both planning and execution

`spec/commands/speccraft.orchestrate.md` (master orchestrator)

`src-code-frontend/rules/`, `src-code-backend/rules/` - project-specific implementation rules (linting, forms, data fetching, accessibility, performance, error handling, data access patterns, rate limiting, etc.), each split into that layer's own rules plus a `shared/` subfolder for cross-layer conventions duplicated across both roots. Doesn't exist until that layer's `/speccraft.scaffold` runs — add per project, see root `README.md` §Before You Start step 5.

`src-code-frontend/skills/`, `src-code-backend/skills/` - project-specific reusable creation procedures (component/service/logic-unit/store/repository/test conventions), same per-layer + `shared/` split as rules above. Doesn't exist until that layer's `/speccraft.scaffold` runs — add per project, see root `README.md` §Before You Start step 6.

`spec/architecture/NFR-SUMMARY.md` - NFR categories shared across both layers (performance, reusability, security, compliance, testability, observability, reliability) plus two layer-specific headings with no forced parallel (Accessibility — frontend only; API Consistency — backend only), in one consolidated file. OPTIONAL — not read or checked by default; see root `README.md` §Adding NFR Enforcement (Optional).
