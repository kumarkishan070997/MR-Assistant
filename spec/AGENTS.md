# AGENTS.md

## Agent Delta

**Role:** Root operating contract — read at start of every workflow session.
**Read order — planning:** `spec/SPEC-VERSION.md` → this file → stage workflow doc → input spec → `spec/architecture/ARCH-DECISIONS.md` (+ any other arch spec files this project added)
**Read order — execution:** `spec/init.md` → this file → stage workflow doc → identify the task's `Layer` field → matching half of `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-*` or `AD-BACKEND-*`; `AD-X-*` cross-cutting entries apply to both) → matching `src-code-frontend/AGENTS.md` or `src-code-backend/AGENTS.md` → approved task
**Source of truth:** user instruction > business spec > LLD > delivery task > arch specs (full order: `spec/SPEC-HIERARCHY.md`)
**Dual-layer branch:** stages 11-12 (Integration Testing Generation, Integration Testing Review Gate) run for backend-tagged tasks only; frontend-tagged tasks go straight from stage 10 (Testing Review Gate) to stage 13 (Final Validation) — a per-task branch, not per-story
**CR alternate entry:** `/speccraft.change` replaces stages 1-5 for a story whose LLD pair is already `approved`/`done`, and auto-cascades a compatible change atomically through its forward-reachable dependents — see `spec/workflows/change-request/CHANGE-REQUEST-STAGE.md`. Stages 6-14 run unchanged for every delta task produced, branching per task `Layer` exactly as normal decomposition output.
**Human-in-loop:** stop at every review gate; silence is not approval; AI cannot self-approve
**Hard boundary:** planning stages do not edit business specs; execution stages do not edit approved upstream artifacts; surface gaps — do not silently patch
**Never load:** `CHANGE.md`, `*.original.md`, `spec/_archive/**`, `_archive/**`
**Handoff format:** what changed / stage artifact / specs that guided it / assumptions / verification / stage status / remaining gaps

---

Root operating contract for all AI agents in this repository. Applies to Codex, Gemini, Claude Sonnet, Claude Haiku, and any file-capable agent. This repo is an AI agentic workflow system for full-stack (frontend + backend) spec-driven delivery.

---

## Workflow Shape

Stages run in one linear flow, per delivery task; stages 11-12 are conditional on the task's `Layer` (see note below):
1. business spec intake
2. LLD creation
3. LLD review gate
4. decomposition into delivery tasks
5. decomposition review gate
6. scaffold check when needed
7. implement execution
8. implementation review gate
9. unit-test generation
10. testing review gate
11. integration testing generation
12. integration testing review gate
13. final validation
14. progress and traceability updates

**Conditional branch (stages 11-12), per task not per story:** one story's decomposition produces both a frontend-tagged task and a backend-tagged task (each carrying its own `Layer: frontend|backend` field), and each task moves through this pipeline independently rather than the whole story taking one fixed path. A backend-tagged task runs stages 11-12 (integration testing generation + review gate) between the testing review gate and final validation. A frontend-tagged task skips stages 11-12 entirely and goes straight from stage 10 (Testing Review Gate) to stage 13 (Final Validation). Never infer the branch from the story as a whole — always read the individual task's `Layer` field.

---

## Context Exclusions

Never load these files unless a stage doc explicitly requires them:
- `CHANGE.md` in any folder
- any file matching `*.original.md`
- any file under `spec/_archive/`
- any file under `_archive/`

If a doc references an archived path, load the active replacement listed in this contract instead.

---

## Cache Version Check

Before any workflow work, read `spec/SPEC-VERSION.md`. If `current` changed since last session, reload mandatory spec files. If unchanged, cached spec content is still valid.

---

## Layer Scope Precondition — Universal, Every Command

Before **any** command (planning or execution — `/speccraft.scaffold` included, not just `/speccraft.tech-design`/`/speccraft.decompose`/`/speccraft.orchestrate`/`/speccraft.change`) reads `spec/architecture/ARCH-DECISIONS.md` for any reason, resolve `§Layer Scope` first:

- Section present → honor it for the rest of the run.
- Section absent, file empty/placeholder → stop and ask the human interactively (frontend / backend / both) — never infer or default this silently, regardless of which command triggered the read. If real application code already exists for this project, recommend `/speccraft.onboard` instead of a blank ask — see `spec/commands/speccraft.onboard.md` and `spec/architecture/README.md` §Layer Scope. If no application code exists yet but a business spec is ready, recommend `/speccraft.plan-foundation <business-spec-file> "<tech stack description>"` instead — see `spec/commands/speccraft.plan-foundation.md`.
- Section absent, but real `AD-FRONTEND-*`/`AD-BACKEND-*` content already exists (pre-existing project from before this convention) → treat as `both` — see `spec/architecture/README.md` §Layer Scope for the full rule.

This is a hard precondition, not a per-command convenience — it exists in `AGENTS.md` specifically so no command's own Pre-Execution Checks can be skipped or entered from an unexpected first command without still hitting this gate.

---

## Read Order

### Planning stages
1. `spec/SPEC-VERSION.md`
2. `spec/AGENTS.md`
3. relevant stage workflow doc under `spec/workflows/`
4. relevant input spec for current work item
5. `spec/architecture/ARCH-DECISIONS.md` (+ any other arch spec files this project added — see `spec/ARCHITECTURE-REFERENCES.md`; this includes `spec/architecture/NFR-SUMMARY.md` only if this project chose to populate it — see root `README.md` §Adding NFR Enforcement). Read `§Layer Scope` first — it resolves which of `AD-FRONTEND-*`/`AD-BACKEND-*` apply. Planning stages read the `AD-*` section(s) matching this project's in-scope layer(s), plus any `AD-X-*` cross-cutting entries — intake and LLD creation reason about the in-scope layer(s) before the fork.

`spec/WORKFLOW-OVERVIEW.md` is orientation only, not mandatory every run.

Read each file's `## Agent Delta` section only — read the full file only when the delta is insufficient for the current subtask.

### Execution stages
1. `spec/init.md`
2. `spec/AGENTS.md`
3. relevant stage workflow doc under `spec/workflows/`
4. identify the task's `Layer` field (`frontend` or `backend`), then read only the matching half of `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-*` sections for frontend tasks, `AD-BACKEND-*` for backend tasks, plus any `AD-X-*` cross-cutting entries either way) + any other arch spec files, including `spec/architecture/NFR-SUMMARY.md` if this project populated it
5. the matching root's `AGENTS.md` — `src-code-frontend/AGENTS.md` for frontend-tagged tasks, `src-code-backend/AGENTS.md` for backend-tagged tasks. Both files exist as separate per-root files; read only the one matching the task's `Layer`, not both.
6. approved delivery task

Read each file's `## Agent Delta` section only — read the full file only when the delta is insufficient for the current subtask.

If this project's architecture docs grow large enough to need a planning-only vs execution-only split, add dedicated files (e.g. a structure-reference doc for planning, a quick-reference doc for execution) and update this Read Order and `spec/ARCHITECTURE-REFERENCES.md` accordingly — this boilerplate ships with the single-file `ARCH-DECISIONS.md` only.

### Execution session model
- Each task gets fresh context.
- Within one task, run implementation -> testing -> (integration testing, backend-tagged tasks only) -> validation as one chained session.
- Files loaded for implementation stay in context for testing and validation of the same task.
- Do not reload `AGENTS.md`, `ARCH-DECISIONS.md`, the layer-matched `src-code-<layer>/AGENTS.md`, or the approved task file within the same task unless a new session starts.

Minimum context if limited:
- planning: `spec/AGENTS.md` (Agent Delta), current stage workflow doc (Agent Delta), `spec/architecture/ARCH-DECISIONS.md` (Agent Delta), current input spec
- execution: `spec/init.md`, `spec/AGENTS.md` (Agent Delta), current stage workflow doc (Agent Delta), the task-Layer-matched half of `spec/architecture/ARCH-DECISIONS.md` (Agent Delta), the matching `src-code-frontend/AGENTS.md` or `src-code-backend/AGENTS.md`, approved task file

---

## Role Of `spec/init.md`

Bootstrap brief for execution work.

- Do not read as mandatory for planning stages.
- Read when implementation-oriented work starts or resumes.
- Check `Workflow Foundation Status`: `PENDING` means setup still underway; `DONE` means do not restart workflow planning.
- Update `PENDING` to `DONE` only when foundation is stable.
- Reset only on explicit user request for a workflow redesign.

---

## Source Of Truth Hierarchy

Full precedence order: see `spec/SPEC-HIERARCHY.md` — do not duplicate the ranked list here; it drifts out of sync when only one copy gets updated.

If code and spec disagree, prefer spec and record the mismatch.
If two specs conflict with no precedence resolution, stop the stage and log an open question.

---

## Architecture References

- `spec/architecture/ARCH-DECISIONS.md` is the locked stack authority for both planning and execution in this boilerplate, once populated it is organized into `AD-FRONTEND-*` (frontend), `AD-BACKEND-*` (backend), and `AD-X-*` (cross-cutting, e.g. shared API contract format, auth token shape, CORS policy — decisions both layers must honor identically) subsections.
- Any further arch spec files this project adds (routing, module boundaries, rendering strategy, etc.) are indexed in `spec/ARCHITECTURE-REFERENCES.md`, tagged by Layer.

---

## Required Workflow Behavior

Every agent executes work in explicit stages.

| Stage | One-line rule |
|---|---|
| Intake | Read business input, establish stable requirement IDs, capture scope — one shared pass, layer-agnostic |
| LLD Creation | Produce LLD-FRONTEND and/or LLD-BACKEND (per this project's Layer Scope) from business input plus architecture context, each citing the shared REQ-IDs; no code |
| LLD Review Gate | Approve, revise, or block every in-scope LLD — as one gate for the LLD-FRONTEND/LLD-BACKEND pair when Layer Scope = both; do not decompose until each is independently approved |
| Decomposition | Derive Layer-tagged implementation-ready tasks from every in-scope approved LLD |
| Decomposition Review Gate | Approve task size, ordering, Layer tagging, and traceability; do not implement until approved |
| Scaffold Check | Create `src-code-frontend/` and/or `src-code-backend/` once per root when needed before that root's first implementation task |
| Task To Code | Implement only from approved task, routed to the code root matching the task's `Layer`; apply architecture constraints from the matching `AD-FRONTEND-*`/`AD-BACKEND-*` (+ `AD-X-*`) set |
| Implementation Review Gate | Validate scope, architecture, and quality; revise if needed |
| Code To Unit Tests | Create tests from code and ACs; cover success, failure, and state coverage |
| Testing Review Gate | Review quality, coverage, and determinism; do not close until approved |
| Integration Testing | Backend-tagged tasks only: create cross-boundary tests (API contract, persistence, external integration) from approved code and unit tests |
| Integration Testing Review Gate | Backend-tagged tasks only: review boundary coverage, realism, and determinism; do not close until approved |
| Final Validation | Validate business spec -> LLD -> task -> code -> unit tests (-> integration tests, backend-tagged tasks only) |
| Progress Update | Update progress and traceability artifacts for the work item |

---

## Review Gate Rule

`revise if needed` means:
- reviewer must approve, request revision, or block
- if revision is requested, update the artifact before advancing
- if inputs are insufficient, log the gap instead of guessing
- no stage may skip its review gate by assumption

---

## Implementation Rules For Frontend And Backend Work

Execution rules live in the layer-matched root: `src-code-frontend/AGENTS.md` + `src-code-frontend/rules/` for frontend-tagged tasks, `src-code-backend/AGENTS.md` + `src-code-backend/rules/` for backend-tagged tasks. Apply architecture constraints from the matching half of `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-*`/`AD-BACKEND-*`, plus any `AD-X-*` cross-cutting entries) and any other arch spec files this project added. Do not invent business rules covered by specs.

---

## Traceability Rules

Minimum chain is Layer-dependent:
- Frontend tasks (4 links): business spec -> LLD-FRONTEND -> delivery task -> code changes -> unit tests
- Backend tasks (5 links): business spec -> LLD-BACKEND -> delivery task -> code changes -> unit tests -> integration tests

Both chains are recorded in the same per-story shard (`spec/traceability/<module>/<STORY-ID>/TRACEABILITY.md`), distinguished by its `Layer` column — not two separate shards.

- Update traceability whenever a stage produces a usable artifact.
- If work stops mid-stage, preserve mappings for all produced artifacts and mark covered/uncovered scope.
- Unmapped scope is delivery risk and must be surfaced.

---

## Normal Agent Workflow

1. identify current stage
2. read the relevant workflow document
3. read the relevant input spec and architecture references
4. produce the smallest correct stage output
5. pass through the review gate
6. revise if needed
7. update progress and traceability artifacts
8. report output, assumptions, verification, and remaining gaps

---

## Hard Boundary Rule

Workflow boundaries are hard unless a human explicitly reopens an earlier artifact.

- planning stages do not edit business specs as normal stage work
- execution stages do not edit approved upstream planning artifacts as normal stage work
- if implementation reveals a gap or contradiction in an upstream artifact, do not silently patch it; record it with traceability and route to human review
- only explicit human instruction or an approved review decision may reopen a locked artifact

---

## Human-In-The-Loop Rule For Gaps And Blockers

Human review is the default escalation path for any blockage or implementation gap.

- record the gap with traceability to the affected requirement, LLD section, task, code area, or test area
- do not invent a hidden workaround that changes approved intent
- may propose options; must not self-approve a cross-stage correction
- when a gap affects source, scope, architecture, or requirement completeness, human decides
- all escalations must leave a visible record for later review

---

## When Not To Restart Workflow Design

Do not restart repository-wide workflow planning if:
- `spec/init.md` foundation status is `DONE`
- the user asks for a targeted document or task change
- work is clearly incremental within the existing workflow system

Use `spec/init.md` as context and continue the current stage.

---

## Handoff Format

Report at task end:
- what changed
- workflow stage or artifact it maps to
- specs that guided the change
- assumptions made
- verification performed
- stage status: draft / in review / revised / approved / blocked / done
- remaining gaps, if any
