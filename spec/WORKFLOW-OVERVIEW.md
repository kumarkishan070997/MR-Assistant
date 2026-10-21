# WORKFLOW-OVERVIEW.md

Top-level orchestration reference. Does not replace stage-specific workflow files.

---

## Linear Stage Model

Stages run per delivery task; stages 11-12 apply to backend-tagged tasks only (a per-task branch — one story's decomposition produces both a frontend task and a backend task, each carrying its own `Layer` field):

1. business specification intake
2. LLD creation
3. LLD review gate
4. decomposition into delivery tasks
5. decomposition review gate
6. scaffold check when needed
7. implement execution
8. implementation review gate
9. unit-test generation
10. testing review gate
11. integration testing generation (backend-tagged tasks only)
12. integration testing review gate (backend-tagged tasks only)
13. final validation
14. progress and traceability updates

A frontend-tagged task skips stages 11-12 and goes straight from stage 10 (Testing Review Gate) to stage 13 (Final Validation).

---

## Workflow Map

Shown for Layer Scope = `both`; a single-layer project produces/reviews only the in-scope LLD and its tasks at each step below.

```text
Business Spec
  -> Intake (one shared pass, layer-agnostic REQ/AC IDs)
  -> LLD Creation (LLD-FRONTEND + LLD-BACKEND, per Layer Scope) -> Review Gate (reviewed together when both) -> Revise
  -> Decomposition (Layer-tagged delivery tasks) -> Review Gate -> Revise
  -> Approved Delivery Tasks (each carries Layer: frontend|backend)
  -> Scaffold Check when needed (per code root)
  -> Task To Code -> Review Gate -> Revise
  -> Code To Unit Tests -> Review Gate -> Revise
  -> [backend-tagged tasks only] Integration Testing -> Review Gate -> Revise
  -> Final Validation
  -> Progress + Traceability Update
```

---

## Stage Summary

| Stage | Primary Input | Primary Output | Review Required | Layer Scope |
|---|---|---|---|---|
| Business Specification Intake | Business spec | Scoped intake understanding, shared layer-agnostic REQ/AC IDs | Yes | both (one pass) |
| LLD Creation | Approved business input | LLD-FRONTEND draft and/or LLD-BACKEND draft | Yes | per project Layer Scope |
| LLD Review Gate | In-scope LLD draft(s) | approved / revise / blocked, reviewed together as one gate when Layer Scope = both | Yes | per project Layer Scope |
| Decomposition | Approved in-scope LLD(s) | Delivery task set, each task tagged `Layer: frontend\|backend` | Yes | per project Layer Scope |
| Decomposition Review Gate | Task set | approved / revise / blocked | Yes | per project Layer Scope |
| Scaffold Check | Approved workflow context | `src-code-frontend/` and/or `src-code-backend/` project shell | Yes when needed | both, per root |
| Task To Code | Approved delivery task | Implementation draft | Yes | both (routed by task Layer) |
| Implementation Review Gate | Implementation draft | approved / revise / blocked | Yes | both |
| Code To Unit Tests | Approved implementation | Unit test suite | Yes | both |
| Testing Review Gate | Test suite | approved / revise / blocked | Yes | both |
| Integration Testing | Approved implementation + unit tests | Integration test suite | Yes | backend-tagged tasks only |
| Integration Testing Review Gate | Integration test suite | approved / revise / blocked | Yes | backend-tagged tasks only |
| Final Validation | Approved code, unit tests (+ integration tests for backend-tagged tasks) | Validation record | Yes | both (chain length varies by Layer) |
| Progress And Traceability Update | Validated outputs | Updated status and mappings | Final recording step | both |

---

## Exit Conditions

Workflow ends only when:
- every in-scope LLD (LLD-FRONTEND and/or LLD-BACKEND, per Layer Scope) is reviewed and approved
- decomposition is reviewed and approved
- implementation is reviewed and approved
- unit tests are reviewed and approved
- integration tests are reviewed and approved (backend-tagged tasks only)
- validation is complete
- traceability links are recorded
- progress artifacts are updated

---

## Review Gates

Every stage has a review gate. Outcomes: `approved`, `revise`, `blocked`. No stage advances without an explicit outcome. Full policy: `spec/REVIEW-AND-REVISION-POLICY.md`.

---

## Traceability Chain

Progressive, not end-only. Chain length depends on the task's `Layer`:

**Frontend tasks (4 links):**
1. business spec -> LLD-FRONTEND
2. LLD-FRONTEND -> delivery task
3. delivery task -> code changes
4. code changes -> unit tests

**Backend tasks (5 links):**
1. business spec -> LLD-BACKEND
2. LLD-BACKEND -> delivery task
3. delivery task -> code changes
4. code changes -> unit tests
5. unit tests -> integration tests

Both chains are recorded in the same per-story traceability shard (`spec/traceability/<module>/<STORY-ID>/TRACEABILITY.md`), distinguished by its `Layer` column — one shard per story, not two.

Update mappings when usable artifacts are created. Preserve mid-stage mappings if a session stops. Full rules: `spec/workflows/shared/TRACEABILITY-RULES.md`.

---

## Architecture Application

Index: `spec/ARCHITECTURE-REFERENCES.md` (each entry tagged frontend / backend / cross-cutting).

| Architecture Role | Layer | Planning Usage | Execution Usage |
|---|---|---|---|
| Routing and shell definitions | frontend | route and shell decisions in LLD-FRONTEND and decomposition | route placement and validation in `src-code-frontend/` |
| Rendering and data strategy | frontend | rendering and data decisions in LLD-FRONTEND | implementation strategy, state, security, performance, testing checks |
| Routing and API surface definitions | backend | endpoint and access-tier decisions in LLD-BACKEND and decomposition | route/endpoint placement and validation in `src-code-backend/` |
| Data and integration strategy | backend | persistence, caching, and external-integration decisions in LLD-BACKEND | implementation strategy, transactions, security, performance, testing checks |
| Module architecture | frontend and backend (per root) | module/service boundaries in the matching LLD and task slicing | implementation layering, imports, file placement, tests within the matching root |
| Cross-cutting contracts (API format, auth token shape, CORS) | cross-cutting | `AD-X-*` decisions referenced by both LLD-FRONTEND and LLD-BACKEND | conformance checks in both `src-code-frontend/` and `src-code-backend/` |

Full specs are reference-only for deep design and conformance questions.

---

## Alternate Planning Entry — Change Request

`/speccraft.change` is an alternate entry into planning for a story whose LLD pair is already `approved`/`done` — it replaces stages 1-5 for that story only, and auto-cascades a compatible change atomically through every forward-reachable story that depends on it (tracked in `spec/traceability/shared/STORY-DEPENDENCIES.md`). Any conflict found anywhere in the cascade blocks the entire CR run — nothing is written until the whole reachable subgraph is confirmed conflict-free. Once the resulting bundle is approved, every delta task re-enters this same linear stage model at stage 6 onward, unchanged. See `spec/workflows/change-request/CHANGE-REQUEST-STAGE.md`.

---

## Related Documents

- `spec/AGENTS.md` - operating contract, read orders, boundary rules
- `spec/workflows/` - stage-specific files
- `spec/workflows/change-request/CHANGE-REQUEST-STAGE.md` - alternate CR entry, cascade mechanism
- `spec/REVIEW-AND-REVISION-POLICY.md` - review gate policy
- `spec/workflows/shared/STAGE-CONTRACT.md` - stage boundary rules
- `spec/workflows/shared/TRACEABILITY-RULES.md` - traceability detail
- `spec/init.md` - execution bootstrap brief

---

## Handoff Expectation

Report at stage end: active stage, artifact produced or updated, review outcome, revision needed, traceability status, blockers or open questions.
