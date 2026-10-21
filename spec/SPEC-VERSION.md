# Spec Version

current: 0.4.1
last_updated: 2026-10-20
changed_files:
  - spec/architecture/ARCH-DECISIONS.md
  - spec/architecture/EXTENSION-ARCHITECTURE.md
  - spec/ARCHITECTURE-REFERENCES.md
  - spec/commands/speccraft.scaffold.md

---

## Note — v20 (2026-07-21)

Renames `spec/delivery/` to `spec/tasks/` — the folder held task packets but was named after the artifact's lifecycle stage rather than what it contains, inconsistent with `spec/lld/` and with this file's own pre-existing "Do NOT increment... Task file edits under `spec/tasks/`" line, which already used the new name. All live path references updated repo-wide; see `CHANGE.md` "Change 23" for the full file list and rationale. Historical `CHANGE.md` entries and archived version notes below that quote the old `spec/delivery/*` path are left untouched — they are dated records of past state.

---

## Note — v19 (2026-07-20)

Adds two new commands for onboarding an existing (brownfield) application — previously this boilerplate was entirely greenfield-oriented with no path to derive `ARCH-DECISIONS.md` or `rules`/`skills` content from code that already exists. `/speccraft.onboard [path]` asks Layer Scope interactively, scans existing code, and splits findings into Tier 1 (LLD-required stack decisions → `ARCH-DECISIONS.md`) and Tier 2 (everything else → `rules`/`skills`, rooted wherever the code actually lives), gated on one combined human review. `/speccraft.tech-debt frontend|backend` is a companion, non-blocking, read-only code-health report (dependencies, deprecated patterns, code hygiene, test/type-safety gaps, architecture drift vs. any locked baseline, security-lite smells). Neither command touches `spec/business/` — business-spec reverse-engineering remains a documented non-goal/future phase. See `CHANGE.md` "Change 22" for the full rationale.

---

## Note — v18 (2026-07-15)

Closes a gap in v17's Layer Scope feature: the resolution check (present → honor; absent+placeholder → ask interactively; absent+real content → default `both`) previously lived only inside `/speccraft.tech-design`, `/speccraft.decompose`, `/speccraft.orchestrate`, `/speccraft.change` — so `/speccraft.scaffold`, a common first command on a fresh repo, could run without ever surfacing the question. Promotes the check to a universal precondition in `spec/AGENTS.md` (read by every command, planning and execution, regardless of entry point) and adds an explicit Pre-Execution Check to `spec/commands/speccraft.scaffold.md` that also blocks scaffolding a layer excluded by the resolved Layer Scope (e.g. `/speccraft.scaffold backend` when Layer Scope = `frontend`). No change to `/speccraft.tech-design`/`/speccraft.decompose`/`/speccraft.orchestrate`/`/speccraft.change` — their existing checks already did this correctly. See `CHANGE.md` "Change 21".

---

## Note — v17 (2026-07-15)

Adds **Layer Scope** — a per-project, one-time interactive choice (frontend / backend / both) that replaces the previous always-both-layers default for planning Stages 1-5. Recorded in a new `## Layer Scope` section at the top of `spec/architecture/ARCH-DECISIONS.md` (asked once, before any stack is locked — root `README.md` "Before You Start" step 2, right after the `.gitignore` prune step). `/speccraft.tech-design`, `/speccraft.decompose`, `/speccraft.orchestrate`, and `/speccraft.change` now read this value first and produce/require only the in-scope layer's LLD/task artifacts instead of always generating both and expecting the human to ignore the unwanted half. Stage 5.5 onward was already layer-selective (independent `/speccraft.scaffold`, per-task `Layer` routing, backend-only integration testing) and needed no change. Backward compatible: a pre-existing project with real `AD-FRONTEND-*`/`AD-BACKEND-*` content but no `## Layer Scope` section is read as `both` — the only reading consistent with a repo that already worked under the prior system — so no existing project's behavior changes. See `CHANGE.md` "Change 20" for the full rationale.

---

## Note — v16 (2026-07-15)

Tracked Spec Files list was silently out of date: `LLD-STAGE.md`, `DECOMPOSITION-STAGE.md`,
`IMPLEMENTATION-STAGE.md`, `CHANGE-REQUEST-STAGE.md` had all been edited under v15 (see v15's
archived `changed_files` list below) yet none were in the tracked list — so per the "When To
Increment Version" rule (increment only on *tracked* file change), future edits to them would
stop forcing a version bump, leaving the Gemini manual cache-recreate step silently skipped.
Adds a new **stage mandatory** bucket for all `spec/workflows/**/*STAGE.md` + shared stage
infra files, and a **command mandatory** bucket for `spec/commands/*.md` + `.claude/commands/*.md`.
No workflow behavior changed — cache-tracking coverage fix only.

---

## Note — v15 (2026-07-15)

Adds two features together: (1) `/speccraft.change` — an alternate planning entry for an already-approved story, backed by a bidirectional story-dependency ledger (`spec/traceability/shared/STORY-DEPENDENCIES.md`) and an atomic, auto-cascading apply to every forward-reachable dependent; stage 6 onward is unchanged, CR-produced delta tasks are indistinguishable from normal decomposition output. (2) `/speccraft.sync-swagger` — an optional, human-triggered convenience that pre-populates or refreshes `contracts/<module>/<module>.yaml` from a configured live Swagger URL, strictly advisory (backend `/speccraft.implement` always remains the sole binding authority on conflict); also fixes a residual v9-merge bug where `DECOMPOSITION-STAGE.md` wrongly listed the API contract file as a frontend task deliverable. See `CHANGE.md` "Change 19" for the full rationale.

**v15 changed_files (archived):**
```
spec/workflows/change-request/CHANGE-REQUEST-STAGE.md
spec/commands/speccraft.change.md
.claude/commands/speccraft.change.md
spec/traceability/shared/STORY-DEPENDENCIES.md
spec/business/cr-changes/README.md
spec/workflows/shared/SHARED-POLICIES.md
spec/workflows/lld/LLD-STAGE.md
spec/AGENTS.md
spec/WORKFLOW-OVERVIEW.md
spec/SPEC-FOLDER-STRUCTURE.md
spec/progress/README.md
spec/traceability/README.md
spec/business/README.md
spec/commands/speccraft.tech-design.md
spec/workflows/decomposition/DECOMPOSITION-STAGE.md
spec/architecture/API-CONTRACT-SOURCE.md
spec/commands/speccraft.sync-swagger.md
.claude/commands/speccraft.sync-swagger.md
spec/workflows/implementation/IMPLEMENTATION-STAGE.md
spec/architecture/NFR-SUMMARY.md
.github/copilot-instructions.md
README.md
spec/commands/README.md
CHANGE.md
```

---

## Note — v14 (2026-07-07)

Moves the `.gitignore` prune step from step 10 to step 1 of "Before You Start" — read first, even though
most of its content isn't actionable until later steps (scaffold, first business spec) produce real
content to prune around. Renumbered steps 2-10 accordingly; all internal step cross-references updated
to match. No content change beyond the reordering and renumbering. See `CHANGE.md` "Change 18".

---

## Note — v13 (2026-07-07)

Documents that every rule in `.gitignore` is boilerplate-only — meant to keep this template's empty shell
clean, not to stay forever. Added a header comment in `.gitignore` itself plus a new "Before You Start"
step 10 in root `README.md` naming exactly which lines to prune once real content exists: the
`src-code-frontend/`/`src-code-backend/` lines once `/speccraft.scaffold` has produced real source code, and the
`spec/business/*`, `spec/delivery/*`, `spec/lld/*`, `spec/traceability/*`, `spec/progress/*` wildcard-ignore
blocks once real business specs, LLDs, tasks, progress records, or traceability shards exist — each
currently keeps only its folder's `README.md` tracked and would otherwise silently exclude everything real
a project drops in. No functional change to what's ignored today; a warning fix only. See `CHANGE.md`
"Change 17" for the full rationale.

---

## Merge Note — v9 (2026-07-07)

This version merges the separate `SDD-Custom-Backend` workflow into this tree, making it a full-stack
(frontend + backend) workflow. One business spec now fans out into two linked LLDs (`LLD-FRONTEND-<id>.md` /
`LLD-BACKEND-<id>.md`), decomposition emits `Layer`-tagged tasks routed to one of two independent code roots
(`src-code-frontend/`, `src-code-backend/`), and the integration-testing stage (adopted from the backend
tree) applies to backend-tagged tasks only. `SDD-Custom-Backend` is retired as of this version — see
`CHANGE.md` "Change 12" for the full rationale.

---

## Note — v10 (2026-07-07)

Clarifies two things introduced by v9's FRONTEND/BACKEND merge that were ambiguous on first read: (1) the sizing
rule "do not split by technical layer within one flow" now explicitly scopes to within-codebase layers
(types/actions/hook-store on frontend, types/repository/service on backend) — not the mandatory
frontend/backend `Layer` split every task carries; (2) task execution ordering is dependency-driven only,
via the `Dependencies` field — no blanket "backend tasks before frontend tasks" rule. See `CHANGE.md`
"Change 14" for the full rationale.

---

## Note — v11 (2026-07-07)

Formalizes the API contract convention: `contracts/<module>/<module>.yaml`, one growing file per module
(not per story), cross-cutting — owned by neither layer. The contract does not pre-exist for a brand-new
operation; it is written/updated by backend `/speccraft.implement` to match the approved `LLD-BACKEND-<id>.md`
touchpoint table, as part of that task's implementation output, not a precondition for starting it.
Frontend tasks read the real file once their backend dependency lands, or the companion-checked LLD
touchpoint table as an interim mock shape before that. This also corrected a conflict left over from the
v9 merge: `IMPLEMENTATION-STAGE.md` previously required an OpenAPI spec to pre-exist and blocked otherwise
— that no longer matches how contracts are authored in this workflow. See `CHANGE.md` "Change 15" for the
full rationale.

---

## Note — v12 (2026-07-07)

Removes `spec/rules/` and `spec/skills/` as a concept — they never exist as spec-side folders.
`src-code-<layer>/rules/` and `src-code-<layer>/skills/` are now the sole location for per-layer
implementation rules and reusable creation-procedure skills, created by that layer's `/speccraft.scaffold` and
populated per project. This fixes a live drift: `spec/AGENTS.md` already routed rule-loading straight to
`src-code-<layer>/rules/`, while `speccraft.implement.md` and other docs still pointed at a spec-side mirror that
was never more than a doubled copy. See `CHANGE.md` "Change 16" for the full rationale.

---

## What This File Is

Single source of truth for spec cache version. All agents check this file before reading
mandatory spec files. Version increment = all cached spec content is stale = re-read and re-cache.

---

## Tracked Spec Files

These files are cached for token savings. Version increment invalidates all of them.

**planning mandatory:**
- `spec/AGENTS.md` (since v7)
- `spec/SPEC-FOLDER-STRUCTURE.md` (since v7)
- `spec/WORKFLOW-OVERVIEW.md` (since v7)
- `spec/SPEC-HIERARCHY.md` (since v7)
- `spec/REVIEW-AND-REVISION-POLICY.md` (since v7)
- `spec/workflows/shared/SHARED-POLICIES.md` (since v7)
- `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-*`/`AD-BACKEND-*`/`AD-X-*` sections — a task reads only its matching layer's section plus cross-cutting) — **not yet created**, `spec/architecture/` is still empty per `CLAUDE.md`; stamp its own "since vN" the version it's first populated
- _(add any further arch spec files here once this project's stack is locked — `spec/architecture/NFR-SUMMARY.md` is optional and only mandatory-cached if this project populated and wired it in)_ (since v7)

**execution mandatory:**
- `spec/init.md` (since v7)
- `spec/architecture/ARCH-DECISIONS.md` (matching layer section) — **not yet created**, see note above
- `src-code-frontend/AGENTS.md` (once `/speccraft.scaffold frontend` has created `src-code-frontend/`) — frontend-tagged tasks only — **not yet created**, stamp "since vN" the version `/speccraft.scaffold frontend` first creates it
- `src-code-backend/AGENTS.md` (once `/speccraft.scaffold backend` has created `src-code-backend/`) — backend-tagged tasks only — **not yet created**, stamp "since vN" the version `/speccraft.scaffold backend` first creates it

**stage mandatory** (only the active stage's own file(s) — a task reads its current stage, not all of them):
- `spec/workflows/shared/STAGE-CONTRACT.md` (since v7)
- `spec/workflows/shared/TRACEABILITY-RULES.md` (since v7)
- `spec/workflows/lld/LLD-STAGE.md` (since v7)
- `spec/workflows/decomposition/DECOMPOSITION-STAGE.md` (since v7)
- `spec/workflows/implementation/IMPLEMENTATION-STAGE.md` (since v7)
- `spec/workflows/testing/TESTING-STAGE.md` (since v7)
- `spec/workflows/validation/VALIDATION-STAGE.md` (since v7)
- `spec/workflows/integration-testing/INTEGRATION-TESTING-STAGE.md` (since v8 — backend workflow merge)
- `spec/workflows/change-request/CHANGE-REQUEST-STAGE.md` (since v15)

**command mandatory** (only the invoked command's own file — mirrored pair, both change together):
- `spec/commands/*.md` + `.claude/commands/*.md` (mirrored pairs, same intro version each):
  - `speccraft.unit-test.md`, `speccraft.decompose.md`, `speccraft.tech-design.md`, `speccraft.orchestrate.md`, `speccraft.scaffold.md`, `speccraft.implement.md`, `speccraft.validate.md` — since v7
  - `README.md` (spec/commands only, no `.claude` mirror) — since v7
  - `speccraft.integration-test.md` — since v8
  - `speccraft.change.md` — since v15
  - `speccraft.sync-swagger.md` — since v15
  - `speccraft.onboard.md` — since v19
  - `speccraft.tech-debt.md` — since v19

---

## When To Increment Version

Increment `current` by 1 and update `last_updated` and `changed_files` when:
- Any tracked spec file above has its content changed
- A new file is added to the tracked list

Do NOT increment for:
- `spec/progress/` updates
- `spec/traceability/` updates
- Task file edits under `spec/tasks/`
- Comments or whitespace-only changes

---

## Per-Model Cache Invalidation

When version increments, take these actions per model:

| Model | Action on version change |
|-------|------------------------|
| Claude (Anthropic API / Bedrock) | No action — `cache_control` content hash auto-invalidates |
| Gemini | Delete old context cache, recreate: `genai.caches.create({ model, contents, ttl })` |
| OpenAI / Codex / Copilot / Azure | No action — prefix cache auto-invalidates on content change |
| Mistral | No action — automatic |
| Local models (Ollama, Llama, etc.) | No action — no API cache; rely on spec compression |

---

## How To Update This File

When you change a tracked spec file:

1. Increment `current` by 1
2. Set `last_updated` to today's date (YYYY-MM-DD)
3. List changed files in `changed_files`
4. Follow per-model invalidation steps in table above

Example update:

```
current: 2
last_updated: 2026-07-01
changed_files:
  - spec/AGENTS.md
  - spec/architecture/ARCH-DECISIONS.md
```
