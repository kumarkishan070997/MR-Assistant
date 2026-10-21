# architecture

Contains authoritative full-stack architecture references (frontend and backend).

These files are constraints for workflow stages. They are not replaced by workflow docs.

`ARCH-DECISIONS.md` is not created yet — this boilerplate ships with no project stack locked in. The first thing written into it, before any `AD-FRONTEND-*`/`AD-BACKEND-*`/`AD-X-*` row, is a `## Layer Scope` section (see below) — everything after it only ever populates the in-scope layer(s).

Once a project locks its stack, populate it using three ID prefixes: `AD-FRONTEND-001`, `AD-FRONTEND-002`, ... for frontend decisions; `AD-BACKEND-001`, `AD-BACKEND-002`, ... for backend decisions; and `AD-X-001`, ... for cross-cutting decisions both layers must honor identically (e.g. shared API contract format, auth token shape, CORS policy).

## Layer Scope

The very first section of `ARCH-DECISIONS.md`, placed immediately after `## Agent Delta` and before any `AD-*` row:

```markdown
## Layer Scope

**Layer Scope:** `frontend` | `backend` | `both`

Locked once per project, before any stack is locked below — see root `README.md` §Before You Start, step 2. Determines which of `AD-FRONTEND-*` / `AD-BACKEND-*` this project populates below, and which layer(s) `/speccraft.tech-design`, `/speccraft.decompose`, `/speccraft.orchestrate`, and `/speccraft.change` produce or require artifacts for.

Changing this value after any story's LLD has been approved is a scope change, not a routine edit — reconcile any already-produced artifacts of a dropped layer manually; no automated migration exists for this.
```

This is a workflow-configuration fact, not an architecture decision either layer's code must honor — that is why it is its own named section rather than an `AD-X-*` row (that log is reserved for cross-cutting technical decisions, e.g. API contract shape, CORS, token format).

**Resolution rule for agents reading this file:**
- `## Layer Scope` section present → honor its value for the current run
- Section absent, file empty or placeholder → this is a new project; stop and ask the human interactively which of frontend / backend / both this project needs — never infer or default this silently. **If real application code already exists** (already in `src-code-frontend/`/`src-code-backend/`, or at some other existing path), do not run this ask as a blank prompt — recommend `/speccraft.onboard` instead, which asks the same question but backs the answer with a scan of the existing code (see `spec/commands/speccraft.onboard.md`). **If no application code exists yet but a business spec is ready**, recommend `/speccraft.plan-foundation <business-spec-file> "<tech stack description>"` instead of a blank ask — it drafts a Layer Scope recommendation from the business spec plus a stated stack for human confirmation (see `spec/commands/speccraft.plan-foundation.md`)
- Section absent, but `AD-FRONTEND-*` and/or `AD-BACKEND-*` already has real content → pre-existing project from before this convention existed; treat as `both` (the only reading consistent with a repo that already functioned under the old always-both system) — but flag the missing section and recommend adding it

`AD-X-001` should record the API contract convention: format (e.g. OpenAPI 3.1), stored at `contracts/<module>/<module>.yaml` (one growing file per module, not per story), reference-only — no codegen wired into `/speccraft.scaffold` by default. The file itself does not pre-exist; it is written/updated by backend implementation tasks as new operations land, matching the approved `LLD-BACKEND-<id>.md` touchpoint table for that operation.

`NFR-SUMMARY.md` — optional. Non-functional requirements (performance, security, accessibility, API consistency, etc.) are not a mandatory gate in this boilerplate. One merged file covers both layers: 6 categories (Performance, Reusability, Security, Compliance, Testability, Observability, Reliability) hold frontend and backend sub-bullets side by side, `Accessibility` is frontend-only, `API Consistency` is backend-only. Fill it in only if this project wants NFR constraints enforced; see root `README.md` §Adding NFR Enforcement (Optional) for how to wire it into the workflow, independently per layer.
