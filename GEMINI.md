# GEMINI.md — Gemini CLI Bootstrap

This file is the entry point for Gemini CLI agents entering this repository.

Read this file first, then follow the Read First list below before doing any work.

---

## What This Repository Is

This is a spec-driven AI agentic full-stack delivery workflow boilerplate. Copy it into a new project and populate `spec/business/` and `spec/architecture/` with that project's specifics.

Three root directories that matter:

- `spec/` — source of truth for all workflow governance, architecture, requirements, LLD (two linked LLDs per story: `LLD-FRONTEND-<id>.md` + `LLD-BACKEND-<id>.md`), tasks (Layer-tagged), traceability
- `src-code-frontend/` — frontend project (created by `/speccraft.scaffold frontend`, per the frontend stack locked in `spec/architecture/`; may not exist yet)
- `src-code-backend/` — backend project (created by `/speccraft.scaffold backend`, per the backend stack locked in `spec/architecture/`; may not exist yet)

Do not confuse `spec/` with either code root. All governance lives in `spec/`. All deployable frontend code lives in `src-code-frontend/`; all deployable backend code lives in `src-code-backend/`. These are two independent roots, not one shared `src-code/` — a task's `Layer: frontend|backend` field determines which root an agent works in.

---

## Cache Version Check

Before any work: read `spec/SPEC-VERSION.md`. Note `current` version.
If version changed since last session → reload all mandatory spec files.
If unchanged → cached spec content still valid, skip re-reads.

### Gemini Context Cache (if total spec input > 32,768 tokens)
```python
import google.generativeai as genai

# Create context cache with stable spec content
cache = genai.caches.create(
    model="gemini-1.5-pro",
    contents=[spec_content],   # combined mandatory spec files
    ttl="3600s"                # 1 hour TTL
)
# Reference cache in subsequent calls
model = genai.GenerativeModel.from_cached_content(cached_content=cache)
```
On `spec/SPEC-VERSION.md` version increment: delete old cache, recreate with updated content.
Note: context cache min threshold = 32,768 tokens. After spec compression, planning content
may be below threshold — in that case, no explicit cache needed (Gemini auto-caches prefix).

---

## Read First

Read in this order before doing any work:

1. `spec/SPEC-VERSION.md` — cache version check (see above)
2. `spec/SPEC-FOLDER-STRUCTURE.md` — canonical layout of the repository
3. `spec/AGENTS.md` — role and behavioral rules for all AI agents
4. `spec/WORKFLOW-OVERVIEW.md` — two-phase workflow model
5. `spec/SPEC-HIERARCHY.md` — which documents override which
6. `spec/REVIEW-AND-REVISION-POLICY.md` — how review gates work
7. `spec/workflows/shared/SHARED-POLICIES.md` — approval state model, human-approval rule, done criteria, handoff format, metrics rules, conflict-decision rules

If execution implementation work is active, also read:

8. `spec/init.md` — execution bootstrap and precondition checklist, then identify the task's `Layer` before reading further arch/rules content

---

## Workflow Commands

Commands are defined as contracts in `spec/commands/`. The root `.claude/commands/` folder has thin entry-point stubs pointing to those contracts.

| Command | Contract | What It Does |
|---------|----------|--------------|
| `speccraft.orchestrate <spec-file>` | `spec/commands/speccraft.orchestrate.md` | Master orchestrator: intake → dual LLD → dual-input decompose → code → tests → (backend-only) integration tests → validate |
| `speccraft.tech-design <spec-file>` | `spec/commands/speccraft.tech-design.md` | planning: create linked `LLD-FRONTEND-<id>.md` + `LLD-BACKEND-<id>.md` from one business spec |
| `speccraft.decompose <lld-fe-file> <lld-be-file>` | `spec/commands/speccraft.decompose.md` | planning: decompose both approved LLDs into Layer-tagged delivery tasks |
| `speccraft.scaffold frontend\|backend` | `spec/commands/speccraft.scaffold.md` | execution pre-entry: scaffold the frontend project into `src-code-frontend/` or the backend project into `src-code-backend/` |
| `speccraft.implement <task-file>` | `spec/commands/speccraft.implement.md` | execution: implement one approved task, routed by its `Layer` field |
| `speccraft.unit-test <task-file>` | `spec/commands/speccraft.unit-test.md` | execution: generate unit tests for approved implementation, routed by `Layer` |
| `speccraft.integration-test <task-id>` | `spec/commands/speccraft.integration-test.md` | execution: backend-tagged tasks only — generate integration tests for approved implementation + unit tests |
| `speccraft.validate <task-id>` | `spec/commands/speccraft.validate.md` | execution: final validation, 4-link chain (frontend) or 5-link chain (backend), produce VERIFICATION.md |
| `speccraft.onboard [path]` | `spec/commands/speccraft.onboard.md` | brownfield-only, alternate entry to Before You Start steps 2-3: asks Layer Scope interactively, scans existing code, proposes ARCH-DECISIONS.md rows (Tier 1) + rules/skills content (Tier 2) for review |
| `speccraft.tech-debt frontend\|backend` | `spec/commands/speccraft.tech-debt.md` | optional, human-triggered — read-only code-health report, never part of `speccraft.orchestrate` |

To invoke a command: read its contract file in full first, then execute.

---

## Critical Workflow Rules

These rules apply to ALL AI agents in this repository regardless of model.

### 1. HARD STOP At Every Review Gate

The workflow spans multiple conversation turns. It does not complete in one execution.

```
Turn 1: produce LLD-FRONTEND + LLD-BACKEND → output summary → STOP
Turn 2: human responds "approved" or "revise: ..." (covers the pair)
Turn 3: run decomposition → output task list (both layers) → STOP
Turn 4: human responds "approved" or "revise: ..."
Turn 5: scaffold + implement task 1 → STOP for review
```

### 2. No Self-Approval

AI must not evaluate its own artifact and proceed as if approved.

- `approved` = human response in next turn only
- silence = not approval
- well-formed artifact = not approval

### 3. Phase Boundaries Are Hard

- execution must not begin until planning is fully approved by human
- Implementation must not begin until decomposition is approved
- If execution discovers a planning gap: stop, escalate, do not silently patch

### 4. OpenAPI Types Are Generated, Not Hand-Written

All API request/response types come from generation off the OpenAPI contract — into `src-code-frontend/src/types/api/` for frontend consumers, and into `src-code-backend/`'s equivalent generated-types location for backend handlers. Do not hand-write API types (see this project's data-fetching/data-access rule in `src-code-frontend/rules/` or `src-code-backend/rules/`, once added — see root `README.md` §Before You Start step 5).

### 5. Code Lives In The Matching Code Root

All implementation code lives under `src-code-frontend/` or `src-code-backend/`, per the task's `Layer`. Never mix code into `spec/`, and never cross-write frontend code into `src-code-backend/` or vice versa.

---

## Stack Reference (Locked Decisions)

`spec/architecture/` is currently empty. Once each layer's stack is locked, record it in
`spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-*` / `AD-BACKEND-*` / `AD-X-*`) and `CLAUDE.md` — `CLAUDE.md` overrides all arch spec files on stack decisions.

---

## Where To Report Progress

- progress: one file per story, `spec/progress/<module>/progress-<STORY-ID>.md`, with a `## <Stage>` section appended per stage (Intake, LLD, Decomposition; per-task Implementation/Testing/Integration Testing (backend-only)/Validation/Blockers/Decisions under `## Task: TASK-<id>`)
- Traceability: `spec/traceability/<module>/<STORY-ID>/TRACEABILITY.md` (one shard per story, not two — `Layer` column shows both chains together)

Update these progressively during execution, not only at the end.

---

## If AGENTS.md And This File Disagree

`spec/AGENTS.md` and `spec/` documents win. This file is an entry point, not a policy source.
