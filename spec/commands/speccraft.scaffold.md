# speccraft.scaffold.md

## Purpose

This document defines the command contract for scaffolding the frontend and backend projects before execution implementation begins. The two scaffolds are **independent** — each is its own invocation, may run in either order, and one may exist without the other.

Command shape:

```text
/speccraft.scaffold frontend
/speccraft.scaffold backend
```

Each invocation creates its own code root at repository root (`src-code-frontend/` or `src-code-backend/`) and initializes a fully configured project inside it, following the locked stack decisions in `spec/architecture/ARCH-DECISIONS.md` (the `AD-FRONTEND-*` section for frontend, the `AD-BACKEND-*` section for backend; either may also depend on `AD-X-*` cross-cutting decisions).

**Placeholder note:** `spec/architecture/` is empty in this boilerplate. Before `/speccraft.scaffold frontend` can run for a real project, populate `ARCH-DECISIONS.md`'s `AD-FRONTEND-*` section with that project's locked framework, UI library, state management, forms, auth/session model, styling, and testing stack. Before `/speccraft.scaffold backend` can run, populate the `AD-BACKEND-*` section with the locked framework, ORM/data-access layer, API style (REST/GraphQL/RPC), messaging/queue choice (if any), auth/session model, and testing stack. Then fill in the placeholder sections below with the concrete commands for each stack.

---

## Why This Exists

execution task-to-code execution requires a valid project structure to write code into, for both layers.

Without an explicit scaffold step:

- agents may create either code root inconsistently as a side effect of task execution
- project configuration may be incomplete or inconsistent across tasks
- dependencies may be missing or mismatched between tasks
- the folder structure may not match the conventions expected by `src-code-frontend/rules/`/`src-code-backend/rules/` and `src-code-frontend/skills/`/`src-code-backend/skills/` once populated
- the two layers' roots may be scaffolded with divergent assumptions about shared contracts

This command makes scaffolding a deliberate, one-time-per-layer, reviewable step that happens once before any feature code is written in that layer.

---

## Command Intent

`/speccraft.scaffold frontend` means:

- create `src-code-frontend/` at repository root
- initialize the locked frontend framework + language toolchain inside it
- configure all locked frontend dependencies per `ARCH-DECISIONS.md`'s `AD-FRONTEND-*` section
- set up the internal folder structure per the project's architecture spec files
- create the target location for generated API types (e.g. from an OpenAPI spec, if applicable)
- produce a working empty shell that can run and pass a baseline build check
- not write any feature code, business logic, or components

`/speccraft.scaffold backend` means:

- create `src-code-backend/` at repository root
- initialize the locked backend framework + language toolchain inside it
- configure all locked backend dependencies per `ARCH-DECISIONS.md`'s `AD-BACKEND-*` section
- set up the internal folder structure per the project's architecture spec files
- create the target location for generated API types (e.g. from an OpenAPI spec, if applicable)
- produce a working empty shell that can run and pass a baseline build check
- not write any feature code, business logic, or route handlers

The two runs are independent: neither requires the other to exist, run first, or run at all.

---

## Pre-Execution Checks

**Step zero, before check 0 in either subsection below and before anything else in this command — including checking whether the target code root already exists:** capture the real wall-clock `Start` timestamp per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable — applies even when this run ends immediately in `blocked` (e.g. Layer Scope excludes this layer, or the code root already exists).

### Frontend (`/speccraft.scaffold frontend`)

0. confirm `spec/architecture/ARCH-DECISIONS.md` §Layer Scope is resolved (per `spec/AGENTS.md` §Layer Scope Precondition — ask interactively if unresolved, never infer) and includes `frontend` (`frontend` or `both`) — if Layer Scope resolves to `backend` only, stop and report the mismatch: this project is not scoped to include a frontend, do not scaffold one
1. confirm `src-code-frontend/` does not already exist — if it exists, do not overwrite; report and stop
2. confirm planning is complete (at least one approved frontend task exists) or that scaffolding is explicitly requested before tasks are ready
3. confirm `spec/architecture/ARCH-DECISIONS.md`'s `AD-FRONTEND-*` section is populated and readable — it is the locked stack authority; if it is still empty, stop and report that stack decisions must be locked first
4. confirm `spec/architecture/ARCH-DECISIONS.md` has a `## Agent Delta` section immediately after its title — if it has real content but no delta section, stop and report the gap; do not scaffold against a file agents can't cheaply read every session

### Backend (`/speccraft.scaffold backend`)

0. confirm `spec/architecture/ARCH-DECISIONS.md` §Layer Scope is resolved (per `spec/AGENTS.md` §Layer Scope Precondition — ask interactively if unresolved, never infer) and includes `backend` (`backend` or `both`) — if Layer Scope resolves to `frontend` only, stop and report the mismatch: this project is not scoped to include a backend, do not scaffold one
1. confirm `src-code-backend/` does not already exist — if it exists, do not overwrite; report and stop
2. confirm planning is complete (at least one approved backend task exists) or that scaffolding is explicitly requested before tasks are ready
3. confirm `spec/architecture/ARCH-DECISIONS.md`'s `AD-BACKEND-*` section is populated and readable — it is the locked stack authority; if it is still empty, stop and report that stack decisions must be locked first
4. confirm `spec/architecture/ARCH-DECISIONS.md` has a `## Agent Delta` section immediately after its title — if it has real content but no delta section, stop and report the gap; do not scaffold against a file agents can't cheaply read every session

---

## Required Stack

### Frontend

_Placeholder — fill in once `ARCH-DECISIONS.md`'s `AD-FRONTEND-*` section is populated for this project._

Stack decisions are locked in `spec/architecture/ARCH-DECISIONS.md`. Do not restate them here — read that doc before scaffolding, then list the concrete install commands for this project's frontend stack below.

```bash
# Initialize WXT with Vanilla/Lit TypeScript structure
npx wxt@latest init src-code-frontend --template vanilla
cd src-code-frontend

# Install core runtime dependencies
npm install lit nanostores @nanostores/lit marked dompurify

# Install dev & test dependencies
npm install -D typescript @types/chrome @types/dompurify @types/marked tailwindcss @tailwindcss/vite postcss vitest @playwright/test
```

### Backend

_Placeholder — fill in once `ARCH-DECISIONS.md`'s `AD-BACKEND-*` section is populated for this project._

```bash
# backend install commands go here once the stack is locked
```

---

## Required Folder Structure

### Inside `src-code-frontend/`

_Placeholder — fill in once the project's architecture spec files define the authoritative folder structure._

Authoritative structure: `spec/architecture/` (see `ARCH-DECISIONS.md` `AD-FRONTEND-*` section and any supporting spec files for this project).

| Path | Purpose |
|------|---------|
| `src/entrypoints/background.ts` | MV3 background service worker: API relay, alarms, auth listener |
| `src/entrypoints/content.ts` | Injected content script: DOM observer, host adapter bootstrap, shadow roots |
| `src/entrypoints/popup/` | Settings popup UI: PAT entry, rate limits, self-hosted GitLab URL config |
| `src/adapters/` | Platform DOM & API adapters (`IPlatformAdapter`, GitHub, GitLab) |
| `src/components/` | Lit custom elements (`<anchor-blast-badge>`, `<anchor-scratchpad>`, drawers) |
| `src/services/` | Storage bridge, session search cache, declaration regex scanner, lifecycle manager |
| `src/stores/` | Reactive Nano Stores (`notes.store.ts`, `settings.store.ts`) |
| `src/styles/` | Tailwind v4 source tokens and dynamic theme variables |
| `tests/` | Vitest unit tests (adapters, regex AST scanners, debouncers) |
| `rules/` | Project-specific frontend implementation rules |
| `skills/` | Project-specific frontend creation procedure skills |

### Inside `src-code-backend/`

_Placeholder — fill in once the project's architecture spec files define the authoritative folder structure._

Authoritative structure: `spec/architecture/` (see `ARCH-DECISIONS.md` `AD-BACKEND-*` section and any supporting spec files for this project).

| Path | Purpose |
|------|---------|
| _(fill in once stack is locked)_ | |

---

## Expected Command Behavior

### `/speccraft.scaffold frontend`

1. create `src-code-frontend/` directory at repository root
2. initialize the locked frontend framework + toolchain per `ARCH-DECISIONS.md`'s `AD-FRONTEND-*` section
3. install additional dependencies per the `Required Stack` (Frontend) section above
4. configure the locked UI component library, if any
5. configure strict typing per the locked language/type-checker decision
6. configure the locked test runner (unit + component testing setup)
7. create the folder structure defined in `Required Folder Structure` (Frontend) above — empty folders with `.gitkeep` where needed. For `rules/`, `rules/shared/`, `skills/`, `skills/shared/`: if `spec/architecture/rules-seed/frontend/` exists (staged by `/speccraft.plan-foundation`), move its `rules/` and `skills/` trees into this root as-is and delete the staging folder; otherwise create these four subfolders empty with `.gitkeep` (populated later per root README.md §Before You Start steps 7-8)
8. create any auth/session stub required by the locked auth decision
9. create a root route/page stub implementing the locked auth redirect behavior, if applicable
10. create `.env.example` with all required env var names and placeholder values
11. initialize any locked git hook tooling (lint/test-on-commit), if applicable
12. verify the project builds without errors
13. verify the test runner starts without errors
14. record scaffold completion in `spec/progress/shared/scaffold-frontend/STATUS.md`

### `/speccraft.scaffold backend`

1. create `src-code-backend/` directory at repository root
2. initialize the locked backend framework + toolchain per `ARCH-DECISIONS.md`'s `AD-BACKEND-*` section
3. install additional dependencies per the `Required Stack` (Backend) section above
4. configure the locked ORM/data-access layer and database connection config, if any
5. configure strict typing per the locked language/type-checker decision
6. configure the locked test runner (unit + integration testing setup)
7. create the folder structure defined in `Required Folder Structure` (Backend) above — empty folders with `.gitkeep` where needed. For `rules/`, `rules/shared/`, `skills/`, `skills/shared/`: if `spec/architecture/rules-seed/backend/` exists (staged by `/speccraft.plan-foundation`), move its `rules/` and `skills/` trees into this root as-is and delete the staging folder; otherwise create these four subfolders empty with `.gitkeep` (populated later per root README.md §Before You Start steps 7-8)
8. create any auth/session middleware stub required by the locked auth decision
9. create a root health-check endpoint stub implementing the locked baseline route behavior, if applicable
10. create `.env.example` with all required env var names and placeholder values
11. initialize any locked git hook tooling (lint/test-on-commit), if applicable
12. verify the project builds without errors
13. verify the test runner starts without errors
14. record scaffold completion in `spec/progress/shared/scaffold-backend/STATUS.md`

---

## `.env.example` Required Entries

### Frontend

```bash
# Build & Runtime Mode
NODE_ENV=development

# Optional default GitLab Self-Hosted Host (for local testing)
# VITE_DEFAULT_GITLAB_HOST=https://gitlab.internal-corp.net
```

### Backend

_Placeholder — fill in once the project's env var needs are known._

```bash
# API
# PORT=

# Database
# DATABASE_URL=

# Session / Auth (server-side only — never expose publicly)
# SESSION_SECRET=

# Build
NODE_ENV=development
```

---

## Config File Requirements

Config details live in their authority docs — do not duplicate here.

### Frontend

| File | Authority |
|------|-----------|
| `wxt.config.ts` | `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-001`, `AD-FRONTEND-008`) |
| `tsconfig.json` | `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-006`) |
| `vitest.config.ts` | `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-007`) |
| `playwright.config.ts` | `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-007`) |
| `package.json` | `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-001` - `AD-FRONTEND-007`) |

### Backend

| File | Authority |
|------|-----------|
| _(fill in once stack is locked — e.g. tsconfig.json, test runner config, lint config, framework config)_ | `spec/architecture/ARCH-DECISIONS.md` (`AD-BACKEND-*`) / `src-code-backend/rules/` |

---

## Output Expectations

### Frontend

Primary output: `src-code-frontend/` directory with complete project scaffold

Supporting outputs:
- `spec/progress/shared/scaffold-frontend/STATUS.md` recording scaffold completion state (runtime-created — does not exist until this command runs)
- note in progress: whether build and test runner passed baseline check

### Backend

Primary output: `src-code-backend/` directory with complete project scaffold

Supporting outputs:
- `spec/progress/shared/scaffold-backend/STATUS.md` recording scaffold completion state (runtime-created — does not exist until this command runs)
- note in progress: whether build and test runner passed baseline check

The two STATUS files are independent — one may exist without the other, reflecting which scaffold(s) have run.

---

## Hard Boundary Rules

This command must not, for either layer:

- write any feature components/route handlers, business logic, stores/services/repositories, or pages/models (beyond stubs listed above)
- write any business logic
- create any files in `spec/`
- overwrite an existing `src-code-frontend/` or `src-code-backend/` directory
- skip the baseline build check

---

## Failure And Block Conditions

This command should stop and report when, for the layer being scaffolded:

- `spec/architecture/ARCH-DECISIONS.md` §Layer Scope is unresolved (ask interactively) or resolves to a scope that excludes this layer
- the target code root (`src-code-frontend/` or `src-code-backend/`) already exists (do not overwrite, report state)
- `spec/architecture/ARCH-DECISIONS.md`'s relevant section (`AD-FRONTEND-*` or `AD-BACKEND-*`) is still empty (stack not yet locked)
- `spec/architecture/ARCH-DECISIONS.md` has real content but no `## Agent Delta` section
- dependency installation fails (network, version conflict)
- the project fails to build on the empty scaffold
- the test runner fails on the empty scaffold

---

## Minimal Command Handoff

At minimum, a successful scaffold run should be able to report:

```text
Command: /speccraft.scaffold frontend | /speccraft.scaffold backend
Code Root Created: yes / no
Dependencies Installed: yes / no / partial
Folder Structure Created: yes / no
Build Check: passed / failed
Test Runner Check: passed / failed
Current State: complete / blocked
Next Recommended Action:
```

---

## Exit Behavior

After a scaffold run completes:

1. output the minimal handoff block for the layer just scaffolded
2. append one row to `spec/traceability/shared/scaffold-frontend/TRACEABILITY.md` (frontend run) or `spec/traceability/shared/scaffold-backend/TRACEABILITY.md` (backend run) under `Workflow Metrics` per `spec/workflows/shared/SHARED-POLICIES.md` (story ID = `SCAFFOLD-FRONTEND` or `SCAFFOLD-BACKEND`, command, stage = `Scaffold`, date, model, start/end timestamps, duration (computed), input/output tokens (actual from transcript, est. fallback), tok source, artifacts, status, notes)
3. STOP — do not begin task-to-code for that layer until human confirms the scaffold is acceptable

Running one layer's scaffold has no bearing on the other layer — `/speccraft.scaffold backend` may run before, after, or without `/speccraft.scaffold frontend` ever running, and vice versa.

---

## Relationship To Other Documents

Read this document together with:

- `spec/architecture/ARCH-DECISIONS.md` — locked stack decisions (`AD-FRONTEND-*` / `AD-BACKEND-*` / `AD-X-*`); each scaffold must match its section
- `spec/architecture/` — any supporting arch spec files this project adds
- `spec/commands/speccraft.plan-foundation.md` — greenfield command that fills this file's own placeholder sections and stages `spec/architecture/rules-seed/<layer>/` content step 7 above consumes; not required, but if it ran, its output is what step 7 picks up
- `spec/init.md` — execution bootstrap
- `spec/commands/speccraft.orchestrate.md` — scaffold is Stage 5.5 in the master workflow, run per-layer as needed
- `spec/workflows/implementation/IMPLEMENTATION-STAGE.md` — scaffold is a precondition, per layer

---

## Architectural Decisions Not Implemented At Scaffold — Read Before Implementing

_Placeholder — this table is for decisions that are fully specified in the arch docs but intentionally deferred to the relevant user story (e.g. full auth enforcement beyond the login gate/base middleware, deep-link resolution, SSE lifecycles, webhook retry semantics, queue-consumer lifecycles, library version deltas from the original spec). Fill in rows as this project's architecture docs and scaffold implementation are built out, tagging each row Frontend/Backend/Cross-cutting._

| Decision | Layer | Read Before… | Doc Reference |
|---|---|---|---|
| _(fill in as needed)_ | | | |
