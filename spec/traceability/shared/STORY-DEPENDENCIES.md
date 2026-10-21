# Story Dependency Ledger

Repo-wide, not story-mirrored — like `spec/traceability/shared/scaffold-frontend/` and `scaffold-backend/`, this file lives under `spec/traceability/shared/` rather than inside any one story's shard.

Tracks story-to-story dependency, both directions, as two explicit tables. **No `Layer` column** — dependency is a story-level fact (a story depends on another story, not "FRONTEND depends on BACKEND"); layer-specificity lives in each row's free-text Touchpoint, which names the exact companion file (`LLD-FRONTEND-<id>.md` or `LLD-BACKEND-<id>.md`) and section a coupling actually binds to. This is the same pattern already used for the companion-pair conflict trigger in `spec/workflows/shared/SHARED-POLICIES.md`.

---

## How This Ledger Is Written

The **Backward** table is the authored input — whenever a story's LLD declares a dependency on another story (see `spec/commands/speccraft.tech-design.md`), that command writes a Backward row for the dependent story **and**, in the same turn, the mirrored Forward row for the upstream story. The Forward table is never authored independently — it is always a same-turn mirrored write of a Backward row. This keeps the two tables from drifting: there is exactly one place drift could be introduced (a missed second write), and `/speccraft.change`'s CR-0 stage guards against exactly that.

**v1 restriction:** `/speccraft.change` only *reads* this ledger and *adds* new rows for newly-created delta stories spawned by a cascade. It never edits an existing dependency row's Touchpoint text. A CR that itself needs to change what a story depends on is out of scope for `/speccraft.change` today — route that as a direct, human-reviewed edit to this file instead.

---

## Backward Dependencies

The authored input — a story declares what it depends on.

| Story ID | Depends On (backward) | Touchpoint | Last Updated |
|---|---|---|---|
| _(no rows yet — populated when the first story's LLD declares a dependency)_ | | | |

---

## Forward Dependencies

Mirrored, not independently authored — written in the same turn as a Backward row, filed under the upstream story instead.

| Story ID | Depended On By (forward) | Touchpoint | Last Updated |
|---|---|---|---|
| _(no rows yet — mirrors the Backward table above)_ | | | |

---

## Ledger Integrity Rules

- **Mirrored pair rule.** Every Backward row must have exactly one matching Forward row (same two story IDs, same Touchpoint) and vice versa. `/speccraft.change`'s CR-0 stage checks this for the target story and its whole forward-reachable subgraph before anything else runs — a mismatch is a data-integrity error, not an ordinary conflict, and blocks the run.
- **Acyclic rule.** The dependency graph must be acyclic. `/speccraft.change`'s forward walk (CR-3) tracks visited story IDs; revisiting one mid-walk is also a data-integrity error, not a normal conflict, and blocks the run.
- **Touchpoint specificity.** Touchpoint text must name which companion file and section the coupling binds to, e.g. `"consumes LLD-BACKEND-US-2 §5 API touchpoint /orders shape"` — not just "depends on US-2." This is what lets a CR's cascade read and touch only the companion file(s) actually affected by a hop, instead of opening both companion files of every downstream dependent.
