# traceability

Runtime traceability is sharded per work item, not stored in one shared master file.

## Layout

- `spec/traceability/<mirrored-business-path>/TRACEABILITY.md`
- `spec/traceability/shared/scaffold-frontend/TRACEABILITY.md` and `spec/traceability/shared/scaffold-backend/TRACEABILITY.md` for scaffold-only shared setup history (independent per layer — two scaffold runs, two histories)
- `spec/traceability/shared/STORY-DEPENDENCIES.md` — the one other shared-ledger exception: a repo-wide, bidirectional story dependency ledger (Backward + Forward tables) consumed by `/speccraft.change`. **No `Layer` column** — dependency is a story-level fact, not a per-layer one; layer-specificity lives entirely in each row's free-text Touchpoint, which names the exact companion file (`LLD-FRONTEND-<id>.md` or `LLD-BACKEND-<id>.md`) a coupling binds to.

`<mirrored-business-path>` mirrors the full business path (module + story-id subfolder) — traceability is the one system that still nests per-story, unlike `spec/lld/`, `spec/tasks/`, and `spec/progress/`, which mirror only the module and carry the story ID in the filename:

- `spec/business/<module>/<STORY-ID>.md`
  -> `spec/traceability/<module>/<STORY-ID>/TRACEABILITY.md`

## One Shard, Both Chains

Every story gets exactly **one** shard, not two. Its `TRACEABILITY.md` holds the chain(s) for this project's in-scope layer(s) in the same tables — the frontend chain and the backend chain side by side when Layer Scope = `both`, a single chain for a single-layer project — distinguished by a `Layer` column (`frontend` / `backend` / `shared`) that is always the first data column and stays present regardless of Layer Scope. This is what makes the shard useful to a full-stack reviewer in one read.

The two chains differ in length: frontend is a 4-link chain (req → `LLD-FRONTEND-<id>` → task → code → test); backend is a 5-link chain (req → `LLD-BACKEND-<id>` → task → code → unit-test → integration-test). The `Unit Tests to Integration Tests` section and the Coverage Matrix's `Integration Test Mapped` column exist for both layers but are populated `n/a (frontend task)` for frontend rows — never left blank — since frontend tasks skip the integration-testing stage entirely and go straight to validation.

**Worked example** (Layer Scope = `both`; a single-layer project's shard simply has rows for only its one in-scope `Layer` value) — module `checkout`, story `STORY-101`. `spec/traceability/checkout/STORY-101/TRACEABILITY.md` contains, in its `Business Spec to LLD` table, one row with `Layer=frontend` pointing at `LLD-FRONTEND-STORY-101.md` and one row with `Layer=backend` pointing at `LLD-BACKEND-STORY-101.md` for the same Req ID. Its `Tasks to Code` and `Code to Tests` tables carry both `TASK-STORY-101-FRONTEND-T1` (Layer=frontend, code under `src-code-frontend/`) and `TASK-STORY-101-BACKEND-T1` (Layer=backend, code under `src-code-backend/`) rows. Only the backend row continues into `Unit Tests to Integration Tests`; the frontend row's Coverage Matrix entry shows `Integration Test Mapped = n/a (frontend task)`.

## What Each Shard Contains

Each story-local `TRACEABILITY.md` should hold, with every table's first data column being `Layer`:

- business to LLD mappings (frontend rows -> `LLD-FRONTEND-<id>`, backend rows -> `LLD-BACKEND-<id>`)
- LLD to task mappings
- task to code mappings
- code to test mappings (frontend: final link; backend: unit-test link)
- unit test to integration test mappings (backend rows only; no frontend rows)
- coverage matrix (frontend rows: 4 applicable links; backend rows: 5)
- workflow metrics for that story
- conflict decisions for that story (`Layer=shared` for a same-story FRONTEND/BACKEND contract mismatch)

Root `spec/traceability/` should not be used for active story-level row appends except shared scaffold traceability.
