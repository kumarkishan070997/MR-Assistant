# progress

Contains workflow progress records — one file per story, not one file per stage.

## Layout

`spec/progress/<module>/progress-<STORY-ID>.md` — single file, mirrored per business module (filename carries the story ID, same convention as `spec/lld/` and `spec/tasks/`).

One `## <Stage>` section per stage, appended progressively as the story moves through the workflow. Per-task stages (Implementation, Testing, Integration Testing, Validation, Blockers, Decisions) nest under a `## Task: TASK-<id>` heading, one per task.

**The fork happens at the LLD stage.** `## Intake` stays one shared section — intake runs once against the single business spec and produces layer-agnostic Req IDs before any layer split. Starting at `## LLD`, records split per in-scope layer: one subsection per in-scope layer (two, when Layer Scope = `both`, one per companion LLD: `LLD-FRONTEND-<STORY-ID>`, `LLD-BACKEND-<STORY-ID>`), each tracked to its own approval state. `## Decomposition` stays a single section (one decompose pass reads every in-scope approved LLD and emits layer-tagged tasks). From there the fork is carried structurally by the task headings themselves: `## Task: TASK-<STORY-ID>-FRONTEND-T<n>` vs `## Task: TASK-<STORY-ID>-BACKEND-T<n>` — no extra nesting needed since the filename tag and the task's `Layer` field already separate them. `### Integration Testing` only ever appears under a backend task heading; frontend task headings skip straight from `### Testing` to `### Validation`.

Example section order for one story (shown for Layer Scope = `both`; single-layer projects have only one LLD subsection and only the tasks for their in-scope layer):

```
# Progress — <STORY-ID>

## Intake
## LLD
### Frontend — LLD-FRONTEND-<STORY-ID>
### Backend — LLD-BACKEND-<STORY-ID>
## Decomposition
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
### Integration Testing
### Validation
### Blockers
### Decisions
...
## Change Request: CR-1
## Traceability Metrics
```

`## Change Request: CR-<n>` is appended (one shared section, not per-layer split — matching how `## Decomposition` already stays single) whenever `/speccraft.change` applies a delta to this story, whether as the originating story or a cascaded dependent. Field schema, the Cascade Impact table (originating story only), and revision rules: `spec/workflows/shared/SHARED-POLICIES.md` §Change Request Log Rules.

Progress must be honest, state-aware, and traceability-aware. Sections are appended, not overwritten — revision history stays visible (see `spec/workflows/shared/SHARED-POLICIES.md` §Metrics Rules and §Blocker And Decision Log Rules for row-level append rules).

`spec/progress/shared/` is the exception — repo-wide records not tied to one story (e.g. `scaffold-frontend/STATUS.md`, `scaffold-backend/STATUS.md`), unaffected by this per-story layout.
