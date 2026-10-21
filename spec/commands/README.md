# Commands

This folder contains thin command contracts that trigger the workflow system.

Commands should point to authoritative workflow documents under `spec/workflows/` instead of duplicating their rules.

Current commands:

- `speccraft.orchestrate.md` - master orchestrator, chains every stage below with enforced review gates
- `speccraft.tech-design.md` - planning: one approved business spec -> `LLD-FRONTEND-<id>.md` + `LLD-BACKEND-<id>.md`
- `speccraft.decompose.md` - planning: two approved LLDs (FRONTEND + BACKEND) -> layer-tagged delivery tasks
- `speccraft.scaffold.md` - execution pre-entry: one-time creation of `src-code-frontend/` (`/speccraft.scaffold frontend`) or `src-code-backend/` (`/speccraft.scaffold backend`) — independent runs
- `speccraft.implement.md` - execution: approved task -> implementation, routed by task `Layer` to the matching code root
- `speccraft.unit-test.md` - execution: approved implementation -> unit tests, routed by task `Layer`
- `speccraft.integration-test.md` - execution: approved implementation + unit tests -> integration tests — **conditionally invoked**: only for tasks with `Layer: backend`; `Layer: frontend` tasks skip this command entirely and go straight to `/speccraft.validate`
- `speccraft.validate.md` - execution: read-only final validation of a completed task — 4-link chain for frontend tasks, 5-link chain (adds integration tests) for backend tasks
- `speccraft.change.md` - alternate planning entry: an already-approved story's LLD delta, auto-cascaded atomically to every forward-reachable dependent — never part of `/speccraft.orchestrate`
- `speccraft.sync-swagger.md` - optional, human-triggered: fetches a module's configured Swagger URL, merges into `contracts/<module>/<module>.yaml` — never part of `/speccraft.orchestrate`

