# spec

## Purpose

This folder is the source-of-truth zone for:

- workflow governance
- architecture constraints
- business specifications
- generated LLDs (one linked frontend/backend pair per story)
- delivery task definitions (Layer-tagged, both frontend and backend)
- progress records
- traceability records

Document templates are covered inline in each stage's Output Contract, not a separate templates folder.

AI-first work should begin from `spec/`, not from implementation code. `spec/` is the single canonical source of truth — no separate generated runtime layer. Two independent code roots exist for implementation output: `src-code-frontend/` and `src-code-backend/`.

## File & Folder Naming

Two conventions coexist by design:

- **Organizational folders** (`business/`, `tasks/`, `lld/`, `architecture/`, `workflows/`, `traceability/`, `progress/`, `dashboard/`, `commands/`, `cr-changes/`, `traceability/shared/scaffold-frontend/`, `traceability/shared/scaffold-backend/`) — lowercase-kebab, named for what they hold.
- **Governance/policy docs and artifact-family identifiers** (`SPEC-HIERARCHY.md`, `SPEC-VERSION.md`, `WORKFLOW-OVERVIEW.md`, `LLD-FRONTEND-<id>.md`, `AD-FRONTEND-*`, `NFR-*`, `ONBOARD-FRONTEND/`, `TECH-DEBT-FRONTEND/`) — UPPER-SNAKE case, matching the identifier style used throughout `spec/` for artifact types and IDs. `README.md`, `AGENTS.md`, and `init.md` keep their platform-recognized lowercase names.

Current rollout:

- the full pipeline is active end to end: business spec -> two linked LLDs -> decomposition -> implement -> unit-test -> integration-test (backend-tagged tasks only) -> final validation -> progress and traceability updates
- see root `README.md` and `spec/SPEC-FOLDER-STRUCTURE.md` §Current Operational Scope for the stage-by-stage detail

