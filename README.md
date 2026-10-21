# SDD Workflow Boilerplate

AI-agentic full-stack delivery workflow operating system. Converts one business specification into reviewed, traced, architecture-compliant frontend **and** backend code through a strict, stage-gated process — one story, two linked designs, two independent code roots, one traceability shard.

This repo ships as a **boilerplate** — `spec/architecture/` and `spec/business/` are intentionally empty or placeholder-filled. See [Before You Start](#before-you-start--new-project-setup) below for what to fill in before running any workflow command. NFR (non-functional requirements) enforcement is optional and off by default — see [Adding NFR Enforcement](#adding-nfr-enforcement-optional) if this project wants it.

`spec/` is the single canonical source of truth for workflow governance and delivery — there is no separate generated runtime layer or CI freshness check in this boilerplate.

---

## How It Works

**planning** turns one business spec into two approved, decomposed delivery task sets — frontend and backend.
**execution** turns those tasks into implementation, unit tests, (backend-only) integration tests, and validation evidence, routed by each task's `Layer` field into one of two independent code roots: `src-code-frontend/` and `src-code-backend/`.

Every stage has a review gate. No stage self-approves. Human must confirm before the next stage begins.

---

## Before You Start — New Project Setup

One-time setup, done once per project, **before** the first `/speccraft.orchestrate` or `/speccraft.tech-design` call. Skipping this makes every downstream stage guess at decisions it should be reading from a file.

| # | What to do | Where |
|---|---|---|
| 1 | Prune `.gitignore` — every rule in it is boilerplate-only, meant to keep this template's empty shell clean, not to stay forever. Read it now; act on it as the later steps below produce real content. Delete the `src-code-frontend/`/`src-code-backend/` lines once `/speccraft.scaffold` (step 5) has produced real source code, and delete or narrow the `spec/business/*`, `spec/tasks/*`, `spec/lld/*`, `spec/traceability/*`, `spec/progress/*` blocks once real spec content exists (step 9 onward) — each currently keeps only its folder's `README.md` tracked and silently ignores everything else, which is wrong once real business specs, LLDs, tasks, progress records, or traceability shards exist | `.gitignore` — see its own header comment for the exact lines |
| 2 | **Ask once, interactively, before anything else in this table.** Does this project need **frontend only**, **backend only**, or **both** layers? The agent must literally stop and pose this question in chat — never infer, guess, or silently default this from repo contents, folder names, or context, even when only one code root looks likely. Record the literal answer at the top of `spec/architecture/ARCH-DECISIONS.md` in a `## Layer Scope` section (create the file now if step 3 hasn't been done yet). Every later step in this table that says "both" applies only to the layer(s) named here | `spec/architecture/ARCH-DECISIONS.md` §Layer Scope (new section, above `AD-FRONTEND-*`/`AD-BACKEND-*`/`AD-X-*` rows) — see `spec/architecture/README.md` |
| 3 | Lock the stack(s) for the layer(s) selected in step 2 — frontend: framework, UI library, state management, forms, auth/session model, styling, testing framework; backend: framework, ORM/data-access layer, auth/session model, API style (REST/GraphQL/RPC), messaging/queue choice (if any), testing framework | `spec/architecture/ARCH-DECISIONS.md` (currently a placeholder — add `AD-FRONTEND-001`, `AD-BACKEND-001`, `AD-X-001` (cross-cutting, e.g. shared API contract shape, CORS, token format), ... rows for the in-scope layer(s), **then do step 11 below**) |
| 4 | Add any supporting architecture spec files this project needs (routing conventions, module boundaries, rendering strategy for frontend; data/integration strategy for backend — split however fits each chosen stack) — only for the layer(s) in scope | `spec/architecture/` (list new files in `spec/ARCHITECTURE-REFERENCES.md` so commands pick them up, **then do step 11 below**) |
| 5 | Fill in the scaffold contract for each locked stack (the layer(s) in scope): install commands, folder structure inside `src-code-frontend/` and/or `src-code-backend/`, required env vars, config file authorities | `spec/commands/speccraft.scaffold.md` — has placeholder sections per layer marked `Required Stack`, `Required Folder Structure`, `.env.example Required Entries`, `Config File Requirements` |
| 6 | **(Optional)** Add NFR enforcement — see [Adding NFR Enforcement](#adding-nfr-enforcement-optional). Skip entirely if this project doesn't want a separate non-functional-requirements gate | `spec/architecture/NFR-SUMMARY.md` — one merged file, not created by default; this boilerplate has zero mandatory NFR checks. If you add it, **do step 11 below** |
| 7 | Add cross-cutting implementation rules beyond the generic defaults (linting, state management conventions, data-fetching/data-access patterns, accessibility, rate limiting, performance) — populate any time after that layer's `/speccraft.scaffold` has run, before/while a task in that layer needs them | `src-code-frontend/rules/`, `src-code-backend/rules/` (add each root's own `shared/` subfolder for conventions duplicated across both) |
| 8 | Add reusable creation procedures for each stack if needed (how to create a component/logic-unit/store/service/repository/test in this project's conventions) — same timing as step 7 | `src-code-frontend/skills/`, `src-code-backend/skills/` |
| 9 | Drop the first business spec(s) in — one spec per story, shared by whichever layer(s) are in scope | `spec/business/<module>/<STORY-ID>.md` |
| 10 | If an API contract already exists for the first story (e.g. modifying an established endpoint), reference it. If this is a brand-new operation, skip this step — the contract doesn't need to exist yet; backend implementation writes it later from the approved LLD-BACKEND touchpoint table | `contracts/<module>/<module>.yaml` (one growing file per module, not per story — reference the path when invoking `/speccraft.tech-design` or record it in both LLDs' `API Spec Ref` metadata field) |
| 11 | Write an `## Agent Delta` section into every canonical file agents read every session (see §Agent Delta Protocol below) | Top of `spec/architecture/ARCH-DECISIONS.md`, any new file added in step 4, and `spec/architecture/NFR-SUMMARY.md` if you added it in step 6 |

Only step 2 (Layer Scope), step 3, step 9, and (once step 3 is done) step 11 for `ARCH-DECISIONS.md` are strictly required to get the first `/speccraft.orchestrate` call unblocked — step 2 unblocks step 3, since you cannot lock "the stack(s) in scope" without first knowing what's in scope. `/speccraft.scaffold frontend` and `/speccraft.scaffold backend` will each stop and ask for step 5 when they run. Step 6 (NFR) is optional and has no effect on any stage if skipped — there is no NFR gate to fail. Step 1 (.gitignore prune) isn't fully actionable on day one — its lines only matter once step 5 (scaffold) or step 9 (first business spec) produce real content — but read it now and come back to it before your first real commit, otherwise `git status` will look clean while `.gitignore` is silently excluding what you just added. `/speccraft.plan-foundation` (see below) satisfies steps 2, 3, 4, 5, 7, 8, and the `ARCH-DECISIONS.md`/step-4-file portion of 11 in one pass, if you'd rather not do them by hand.

### Greenfield Fast Path — `/speccraft.plan-foundation`

The table above assumes hand-authoring every field. If you already have a business spec ready and know your tech stack, `/speccraft.plan-foundation` replaces steps 2, 3, 4, 5, 7, and 8 with one drafted-then-reviewed pass:

1. Do step 1 (`.gitignore` prune) as normal.
2. Write the first business spec at `spec/business/<module>/<STORY-ID>.md` — this is now an input to the next step, not something you drop in afterward (step 9 happens here, ahead of the rest of the table).
3. Run `/speccraft.plan-foundation <business-spec-file> "<tech stack description>"` instead of manually doing steps 2, 3, 4, 5, 7, and 8. It drafts a Layer Scope recommendation from the business spec (step 2), proposes `ARCH-DECISIONS.md` stack rows from the stated tech stack (step 3), drafts supporting architecture spec files where the stack implies them (step 4), fills in `spec/commands/speccraft.scaffold.md`'s placeholders (step 5), and seeds `rules/`/`skills/` content (steps 7–8) — all in one combined review. Nothing is locked until you respond `approved`.
4. Continue at step 6 (NFR, optional) if you want it, otherwise go straight to `/speccraft.orchestrate` — steps 2, 3, 4, 5, 7, 8, 9, and 11 (for `ARCH-DECISIONS.md` and any step-4 files) are already done.

See `spec/commands/speccraft.plan-foundation.md` for the full command contract.

### Brownfield / Existing Codebase Path

The table above is the **greenfield** path — a brand-new stack locked from a blank `ARCH-DECISIONS.md`. If real application code already exists (already inside `src-code-frontend/`/`src-code-backend/`, or at some other existing path), steps 2–3 above are replaced, not skipped:

1. Do step 1 (`.gitignore` prune) as normal.
2. Run `/speccraft.onboard [path]` instead of manually answering Layer Scope and locking the stack. It asks Layer Scope interactively (same question as step 2), scans the existing code, and proposes `ARCH-DECISIONS.md` content (`AD-FRONTEND-*`/`AD-BACKEND-*`/`AD-X-*` — the same decision set as step 3) plus `rules/`/`skills/` content (the same content step 7–8 describe, discovered instead of hand-authored) for your review. Nothing is locked until you respond `approved`.
3. **(Optional)** Run `/speccraft.tech-debt frontend|backend` for a read-only report on the existing code's health — outdated dependencies, deprecated patterns, test gaps, and (once step 2 above is confirmed) drift from the decisions just locked. This is informational only; it does not block anything downstream.
4. Continue at step 4 of the table above — steps 4 onward are identical to the greenfield path. `/speccraft.scaffold` will (correctly) refuse to run for a layer whose code root already exists — that's expected; onboarding does not hand off into scaffolding.

See `spec/commands/speccraft.onboard.md` and `spec/commands/speccraft.tech-debt.md` for the full command contracts.

### Agent Delta Protocol — Keeping Token Cost Down

Every canonical spec file that agents must read on every session has a `## Agent Delta` section right after its title — a 5–10 line condensed summary (role, key facts, entry/blocked/done conditions — whatever that file's content warrants). Agents read only that section by default; they read the full file only when the delta doesn't answer the current question.

**There is no generator for this.** An earlier version of this workflow tried a Python script that regenerated compressed copies into a separate `spec-runtime/` folder — it added an external dependency, a staleness risk, and a CI job just to catch drift. It was dropped in favor of embedding the delta directly in the canonical file: the delta *is* the file, so it can never drift out of sync. See `CHANGE.md` "Change 10" for the full history if you want it.

**What this means for you:** when you fill in `spec/architecture/ARCH-DECISIONS.md` (step 3) or add a new architecture spec file (step 4), write its `## Agent Delta` section by hand at the same time — don't leave it to a later pass. Look at the existing pattern in `spec/architecture/NFR-SUMMARY.md` or any `spec/workflows/*/*-STAGE.md` file for the format. Then add the file to the Read Order in `spec/AGENTS.md` if it isn't already covered by `ARCH-DECISIONS.md`'s spot in that list.

### Quick Reference — "Where do I feed X?"

| You have... | Put it in... | Read by... |
|---|---|---|
| A locked framework/library decision (either layer) | `spec/architecture/ARCH-DECISIONS.md` (`AD-FRONTEND-*` / `AD-BACKEND-*` / `AD-X-*`) | Every LLD, decomposition, and implementation task |
| A routing / module-boundary / rendering rule (frontend) or a data/integration rule (backend) | New file under `spec/architecture/`, indexed in `spec/ARCHITECTURE-REFERENCES.md` | Same as above |
| A non-functional requirement (perf, security, a11y, API consistency, compliance, reliability...) — **optional** | `spec/architecture/NFR-SUMMARY.md` (one merged file, shared + FRONTEND-only + BACKEND-only headings) | Nothing, by default — see [Adding NFR Enforcement](#adding-nfr-enforcement-optional) to wire it in |
| The folder structure `/speccraft.scaffold` should create inside `src-code-frontend/` or `src-code-backend/` | `spec/commands/speccraft.scaffold.md` §Required Folder Structure (per layer) | `/speccraft.scaffold frontend`, `/speccraft.scaffold backend` |
| Install/setup commands for a locked stack | `spec/commands/speccraft.scaffold.md` §Required Stack (per layer) | `/speccraft.scaffold frontend`, `/speccraft.scaffold backend` |
| A business requirement / user story | `spec/business/<module>/<STORY-ID>.md` | `/speccraft.tech-design`, `/speccraft.orchestrate` |
| An API contract for a story (existing endpoint being modified) | `contracts/<module>/<module>.yaml` — cite it in both LLDs' `API Spec Ref` field | `/speccraft.tech-design` (hard-stops on conflict with the business spec) |
| A brand-new API operation (no contract yet) | Nothing to feed at LLD time — `LLD-BACKEND-<id>.md` §5 touchpoint table is the draft shape, agreed with `LLD-FRONTEND-<id>.md` | Backend `/speccraft.implement` writes `contracts/<module>/<module>.yaml` to match, during implementation |
| A live Swagger/OpenAPI URL for a module (optional convenience) | `spec/architecture/API-CONTRACT-SOURCE.md` (`{{SWAGGER_URL}}` per module) | `/speccraft.sync-swagger` only, human-triggered — never auto-read by any stage |
| A design reference (Figma, screenshot) | Cite the link/path when invoking `/speccraft.tech-design`, or reference it in the business spec | `/speccraft.tech-design` (hard-stops on conflict) — frontend LLD only |
| A deliberate change to an already-approved story's behavior | `spec/business/cr-changes/<module>/CR-<STORY-ID>-<n>.md` | `/speccraft.change` (auto-cascades to forward-reachable dependents, atomically) |
| A story-to-story dependency (this story consumes another's output) | `Depends On` field in both `LLD-FRONTEND-<id>.md`/`LLD-BACKEND-<id>.md` §1 Metadata, mirrored into `spec/traceability/shared/STORY-DEPENDENCIES.md` | `/speccraft.change`'s cascade walk |
| A cross-cutting implementation rule (lint, data-fetching/data-access pattern, etc.) | `src-code-frontend/rules/` or `src-code-backend/rules/` (+ each root's `shared/` subfolder) | `/speccraft.implement` (routed by task `Layer`) |
| A reusable creation procedure (how to build a component/logic-unit/service/repository here) | `src-code-frontend/skills/` or `src-code-backend/skills/` | `/speccraft.unit-test`, `/speccraft.integration-test` (via `.claude/commands/` stubs only — canonical contracts don't wire in skills) |
| A newly-filled canonical file agents must read every session | Add a hand-written `## Agent Delta` section at its top (no generator — see §Agent Delta Protocol above), then add it to `spec/AGENTS.md`'s Read Order | Every agent session |

---

### Adding NFR Enforcement (Optional)

This boilerplate has **no mandatory NFR (non-functional requirements) gate**. Every stage checks architecture conformance (routing, module, rendering/data — whatever `spec/architecture/` locks for each layer); NFR-ish concerns (performance, security, accessibility, API consistency, compliance, etc.) are not checked separately unless you opt in.

If this project needs a hard perf/security/compliance gate, wire it in yourself:

1. Fill in `spec/architecture/NFR-SUMMARY.md` with real budgets and rules per category (it ships with generic placeholder defaults — see the file for the category list; 6 of 8 categories are shared FRONTEND+BACKEND, Accessibility is frontend-only, API Consistency is backend-only).
2. Reference it from `spec/architecture/ARCH-DECISIONS.md`, or list it in `spec/ARCHITECTURE-REFERENCES.md` — either way, it becomes part of what agents read as "architecture" and gets checked as part of the existing Architecture Conformance dimension in every stage. No separate NFR checklist row exists to re-add; folding it into architecture conformance is the intended mechanism.
3. Add a `## Agent Delta` section to `NFR-SUMMARY.md` if you rewrote it substantially, and add it to the Read Order in `spec/AGENTS.md` (see §Agent Delta Protocol above) so agents actually load it every session — otherwise it's reference-only and easy to silently miss.
4. **Optional, more invasive:** if you want NFR surfaced as its own explicit checklist item again (rather than folded into architecture conformance), re-add it by hand to the relevant `spec/workflows/*/*-STAGE.md` Review Checklist / Done Criteria tables and to `spec/commands/speccraft.validate.md`'s output contract. Not required — step 2 alone is enough for agents to apply NFR constraints during design and validation.

---

## Full Workflow Diagram

This diagram illustrates Layer Scope = `both`. For frontend-only or backend-only projects, read every FRONTEND/BACKEND pairing in Stages 2–5 as "the layer(s) selected in step 2" — Stage 5.5 onward is already layer-selective exactly as drawn. See §Stage-By-Stage Walkthrough below for the exact conditional behavior.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  INPUT: spec/business/<story>.md                                            │
│  COMMAND: /speccraft.orchestrate spec/business/<story>.md                            │
└────────────────────────────────────────────────┬────────────────────────────┘
                                 │
                    ╔════════════▼════════════════╗
                    ║   planning                 ║
                    ║   Business Spec →         ║
                    ║   Approved Tasks (FRONTEND+BACKEND)  ║
                    ╚════════════╤════════════════╝
                                 │
          ┌────────────────────────▼──────────────────────┐
          │  Stage 1 · Business Spec Intake               │
          │  Read spec once, establish stable req IDs     │
          │  OUTPUT: intake notes + requirement IDs       │
          └────────────────────────┬──────────────────────┘
                                 │
          ┌────────────────────────▼──────────────────────┐
          │  Stage 2 · LLD Creation                       │
          │  COMMAND: /speccraft.tech-design <spec-file>           │
          │  Designs frontend AND backend behavior from   │
          │  the same requirement IDs                     │
          │  OUTPUT: spec/lld/LLD-FRONTEND-<id>.md              │
          │          spec/lld/LLD-BACKEND-<id>.md              │
          │          (companion pair, cross-referenced)   │
          └────────────────────────┬──────────────────────┘
                                 │
          ┌────────────────────────▼──────────────────────┐
          │  ⛔ Stage 3 · LLD Review Gate  [HARD STOP]   │
          │  Human reviews BOTH LLDs as one logical gate  │
          │  → approved / revise / blocked                │
          └────────────────────────┬──────────────────────┘
                        approved │
          ┌────────────────────────▼──────────────────────┐
          │  Stage 4 · Decomposition                      │
          │  COMMAND: /speccraft.decompose <lld-fe-file> <lld-be-file>│
          │  Break both approved LLDs into sized tasks,   │
          │  each tagged Layer: frontend|backend          │
          │  OUTPUT: spec/tasks/<module>/TASK-<id>-FRONTEND-T*.md   │
          │          spec/tasks/<module>/TASK-<id>-BACKEND-T*.md   │
          └────────────────────────┬──────────────────────┘
                                 │
          ┌────────────────────────▼──────────────────────┐
          │  ⛔ Stage 5 · Decomp Review Gate [HARD STOP] │
          │  Human reviews tasks for completeness,        │
          │  sizing, LLD traceability, cross-layer deps   │
          │  → approved / revise / blocked                │
          └────────────────────────┬──────────────────────┘
                        approved │
                    ╔════════════▼════════════════╗
                    ║   execution                 ║
                    ║   Approved Tasks →        ║
                    ║   Verified Delivery       ║
                    ╚════════════╤════════════════╝
                                 │
          ┌────────────────────────▼──────────────────────┐
          │  Stage 5.5 · Scaffold Check                   │
          │  COMMAND: /speccraft.scaffold frontend | /speccraft.scaffold backend│
          │  Creates the missing code root(s)              │
          │  OUTPUT: src-code-frontend/ and/or             │
          │          src-code-backend/ project shell       │
          └────────────────────────┬──────────────────────┘
                                 │
          ┌────────────────────────▼──────────────────────┐
          │  Stage 6 · Task-To-Code                       │
          │  COMMAND: /speccraft.implement <task-id>             │
          │  Reads task's Layer field, implements in the  │
          │  matching code root only                      │
          │  OUTPUT: changed files in src-code-frontend/  │
          │          or src-code-backend/                 │
          └────────────────────────┬──────────────────────┘
                                 │
          ┌────────────────────────▼──────────────────────┐
          │  Stage 7 · Implementation Review Gate         │
          │  Human reviews implementation for arch        │
          │  compliance, scope, correctness                │
          │  → approved / revise / blocked                │
          └────────────────────────┬──────────────────────┘
                        approved │
          ┌────────────────────────▼──────────────────────┐
          │  Stage 8 · Code-To-Unit-Tests                 │
          │  COMMAND: /speccraft.unit-test <task-id>       │
          │  Generate unit tests for approved impl        │
          │  OUTPUT: layer-appropriate unit test files    │
          └────────────────────────┬──────────────────────┘
                                 │
          ┌────────────────────────▼──────────────────────┐
          │  Stage 9 · Testing Review Gate                │
          │  Human reviews test coverage and quality      │
          │  → approved / revise / blocked                │
          └────────────────────────┬──────────────────────┘
                        approved │
                        ┌────────┴─────────┐
              task Layer=backend │         │ task Layer=frontend
                                 ▼         │  (skip straight to Stage 12)
          ┌──────────────────────────────┐ │
          │ Stage 10 · Integration Tests │ │
          │ COMMAND: /speccraft.integration-test  │ │
          │ Cross-boundary tests (API,   │ │
          │ persistence, external)       │ │
          │ BACKEND-TAGGED TASKS ONLY    │ │
          └───────────────┬──────────────┘ │
                          │                │
          ┌───────────────▼──────────────┐ │
          │ Stage 11 · Integration Test  │ │
          │ Review Gate  [HARD STOP]     │ │
          │ BACKEND-TAGGED TASKS ONLY    │ │
          │ → approved / revise / blocked│ │
          └───────────────┬──────────────┘ │
                  approved │                │
                           └────────┬───────┘
          ┌────────────────────────▼──────────────────────┐
          │  Stage 12 · Final Validation                  │
          │  COMMAND: /speccraft.validate <task-id>                 │
          │  Read-only check: impl matches task scope,    │
          │  tests cover required behaviors, traceability │
          │  chain complete — 4-link (FRONTEND) / 5-link (BACKEND)   │
          │  OUTPUT: spec/progress/<module>/progress-<id>.md (§Validation) │
          └────────────────────────┬──────────────────────┘
                                 │
          ┌────────────────────────▼──────────────────────┐
          │  Stage 13 · Progress + Traceability Update    │
          │  Update spec/traceability/ (one shard, +Layer │
          │  column) and spec/progress/ with final state  │
          └─────────────────────────────────────────────────┘
```

---

## Stage-By-Stage Walkthrough — What You Provide, What Lands Where

Each row is one stage: what you must have ready before it runs, what the agent produces, where it lands, and what you're expected to check at the gate.

### Stage 1 — Business Spec Intake

- **You provide:** a business spec file at `spec/business/<module>/<STORY-ID>.md` — clear enough scope to identify requirements for both layers
- **Agent produces:** stable, layer-agnostic requirement IDs, intake notes (one pass, not split per layer)
- **Lands in:** `## Intake` section in `spec/progress/<module>/progress-<STORY-ID>.md`
- **No review gate** — feeds straight into LLD creation

### Stage 2 — LLD Creation (`/speccraft.tech-design spec/business/<module>/<STORY-ID>.md`)

All of Stages 2–5 below are shown for Layer Scope = `both` (the default illustrative case). When this project's `## Layer Scope` in `ARCH-DECISIONS.md` is `frontend` or `backend` only, every "both"/pair below collapses to the single in-scope layer — one LLD, one `/speccraft.decompose` argument, one artifact per stage, no companion/cross-layer conflict checks (there is no companion to conflict with).

- **You provide (before running):** the business spec (step above), plus — if this project has one — the locked stacks in `spec/architecture/ARCH-DECISIONS.md` (including `spec/architecture/NFR-SUMMARY.md` if this project opted into NFR enforcement). Optionally an API contract and/or design reference (Figma/screenshot) if this story has one — the agent hard-stops if either materially conflicts with the business spec.
- **Agent produces:** the LLD artifact(s) for this project's Layer Scope — `LLD-FRONTEND-<id>.md` (routes, modules, state, edge cases, impacted areas, reuse-check against `components/`/`logic/`), `LLD-BACKEND-<id>.md` (endpoints, data ownership, edge cases, impacted areas, reuse-check against `services/`/`repositories/`), or both, linked as companions (each with a "Companion LLD Reference" section naming its pair and any cross-layer contract dependency) only when Layer Scope is `both`
- **Lands in:** `spec/lld/<module>/LLD-FRONTEND-<id>.md` and/or `spec/lld/<module>/LLD-BACKEND-<id>.md`, per Layer Scope
- **Traceability updated:** requirement IDs → LLD sections (the in-scope layer(s)), in `spec/traceability/<module>/<STORY-ID>/TRACEABILITY.md`

### Stage 3 — LLD Review Gate ⛔ HARD STOP

- **Your job:** read the in-scope LLD(s) — as one logical gate when Layer Scope is `both`, otherwise as a single artifact — check it matches the business requirement, respects the locked architecture for that layer, covers edge cases, and (when `both`) agrees with its companion where they share a contract
- **Respond with:** `approved` / `revise: [reason]` / `blocked: [reason]` — one response covers every in-scope LLD
- Nothing proceeds until you respond in the next turn — the agent cannot self-approve.

### Stage 4 — Decomposition (`/speccraft.decompose <lld-fe-file> <lld-be-file>` when Layer Scope = `both`; `/speccraft.decompose <lld-file>` for a single-layer project)

- **You provide:** nothing new — runs against every in-scope approved LLD together; when Layer Scope = `both`, cross-layer task dependencies (e.g. a backend endpoint task must exist before the frontend task consuming it) can be expressed via the task `Dependencies` field
- **Agent produces:** sized, implementation-ready delivery tasks for the in-scope layer(s), each with a mandatory `Layer: frontend|backend` field
- **Lands in:** `spec/tasks/<module>/TASK-<STORY-ID>-FRONTEND-T<n>.md` and/or `spec/tasks/<module>/TASK-<STORY-ID>-BACKEND-T<n>.md` (mirrored per module, flat, no `tasks/` subfolder, filename tag + `Layer` field)
- **Traceability updated:** LLD sections → task IDs (the in-scope layer(s))

### Stage 5 — Decomposition Review Gate ⛔ HARD STOP

- **Your job:** check task completeness, sizing, that every in-scope LLD section maps to a task, and (when Layer Scope = `both`) that cross-layer dependencies are correctly expressed
- **Respond with:** `approved` / `revise: [reason]` / `blocked: [reason]`

### Stage 5.5 — Scaffold Check (`/speccraft.scaffold frontend` and/or `/speccraft.scaffold backend`, once per repo per layer)

- **You provide (before running, once ever per layer):** the filled-in `spec/commands/speccraft.scaffold.md` — stack install commands and folder structure for that layer (see [Before You Start](#before-you-start--new-project-setup) steps 1–3). If `spec/architecture/ARCH-DECISIONS.md` has no locked decisions for that layer, the command stops here and tells you so.
- **Agent produces:** `src-code-frontend/` and/or `src-code-backend/` with the full project shell, passing build + test-runner check
- **Lands in:** the relevant code root; completion record in `spec/progress/shared/scaffold-frontend/STATUS.md` or `spec/progress/shared/scaffold-backend/STATUS.md`
- Runs exactly once per code root for the repo's lifetime — later tasks check for the matching root and skip this stage if it already exists.

### Stage 6 — Task-To-Code (`/speccraft.implement <task-id>`)

- **You provide:** nothing new — runs against one approved task at a time
- **Agent produces:** implementation for that task only, no scope expansion — reads the task's `Layer` field first and routes to the matching code root, architecture subset (`AD-FRONTEND-*` or `AD-BACKEND-*`), and rules subset (`src-code-frontend/rules/` or `src-code-backend/rules/`)
- **Lands in:** changed files under `src-code-frontend/` (Layer: frontend) or `src-code-backend/` (Layer: backend)
- **Traceability updated:** task ID → changed files

### Stage 7 — Implementation Review Gate

- **Your job:** check the diff stays in task scope, follows the locked architecture for that layer, and is correct
- **Respond with:** `approved` / `revise` / `blocked`

### Stage 8 — Code-To-Unit-Tests (`/speccraft.unit-test <task-id>`)

- **Agent produces:** unit tests covering the approved implementation, using whatever test framework was locked for that layer in `spec/architecture/ARCH-DECISIONS.md`
- **Lands in:** the test location defined in that layer's folder structure (see `spec/commands/speccraft.scaffold.md`)
- **Traceability updated:** changed files → test files

### Stage 9 — Testing Review Gate

- **Your job:** check meaningful coverage per `TESTING-STAGE.md`; if this project populated `spec/architecture/NFR-SUMMARY.md`'s Testability section, check against it too
- **Respond with:** `approved` / `revise` / `blocked`
- **Downstream branch:** `Layer: backend` tasks continue to Stage 10; `Layer: frontend` tasks skip Stages 10–11 and go straight to Stage 12

### Stage 10 — Integration Testing (`/speccraft.integration-test <task-id>`) — **backend-tagged tasks only**

- **Precondition:** refuses to run if the task's `Layer` is `frontend` — routes straight to `/speccraft.validate` instead
- **Agent produces:** integration tests exercising the task's real boundaries (API contract, persistence, external integration) — real or containerized dependencies preferred over mocks
- **Lands in:** the integration test location defined in `spec/commands/speccraft.scaffold.md` (backend section)
- **Traceability updated:** unit test files → integration test files

### Stage 11 — Integration Testing Review Gate ⛔ HARD STOP — **backend-tagged tasks only**

- **Your job:** check that tests exercise real boundaries rather than re-mocking unit-level logic, and that failure paths across the boundary are covered
- **Respond with:** `approved` / `revise` / `blocked`

### Stage 12 — Final Validation (`/speccraft.validate <task-id>`)

- **Agent produces (read-only check):** confirmation that implementation matches task scope, tests cover required behaviors, and the traceability chain is complete — a 4-link chain (req→LLD→task→code→test) for frontend tasks, a 5-link chain (adds unit-test→integration-test) for backend tasks
- **Lands in:** `## Task: TASK-<id>` → `### Validation` section in `spec/progress/<module>/progress-<STORY-ID>.md`
- Task is marked `done` only if this check passes.

### Stage 13 — Progress + Traceability Update

- Final state written to `spec/traceability/<module>/<STORY-ID>/TRACEABILITY.md` (one shard, `Layer` column shows both chains together) and the story's progress file (`spec/progress/<module>/progress-<STORY-ID>.md`). Any remaining open questions or gaps are recorded explicitly, not silently dropped.

---

## Commands

| Command | Usage | What It Does | Hard Stop After? |
|---------|-------|-------------|-----------------|
| `/speccraft.orchestrate` | `/speccraft.orchestrate spec/business/<file>.md` | Master orchestrator. Chains all stages in order for this project's Layer Scope, enforces all review gates, branches Stages 10–11 by task `Layer` | Yes — at every gate |
| `/speccraft.tech-design` | `/speccraft.tech-design spec/business/<file>.md` | Creates the LLD artifact(s) for this project's Layer Scope — a linked `LLD-FRONTEND-<id>.md` + `LLD-BACKEND-<id>.md` pair when scope is `both`, a single artifact otherwise. Checks API contract + design references for mismatches before writing | Yes — after the in-scope LLD(s) produced |
| `/speccraft.decompose` | `/speccraft.decompose <lld-fe-file> <lld-be-file>` (Layer Scope = `both`) or `/speccraft.decompose <lld-file>` (single-layer) | Breaks every in-scope approved LLD into sized, `Layer`-tagged delivery tasks in `spec/tasks/<module>/` | Yes — after tasks produced |
| `/speccraft.scaffold` | `/speccraft.scaffold frontend` \| `/speccraft.scaffold backend` | One-time per-layer project setup. Creates `src-code-frontend/` or `src-code-backend/` shell with all locked dependencies | Yes — after scaffold + build check |
| `/speccraft.implement` | `/speccraft.implement <task-id>` | Implements one approved task. Reads `Layer` first, routes to the matching code root. No scope expansion. Updates traceability | Yes — after implementation |
| `/speccraft.unit-test` | `/speccraft.unit-test <task-id>` | Generates unit tests for approved implementation, per the locked test framework for that layer | Yes — after tests produced |
| `/speccraft.integration-test` | `/speccraft.integration-test <task-id>` | Backend-tagged tasks only — generates cross-boundary integration tests. Refuses and routes to `/speccraft.validate` if `Layer: frontend` | Yes — after tests produced |
| `/speccraft.validate` | `/speccraft.validate <task-id>` | Read-only final check. Confirms impl matches scope, tests cover behaviors, traceability chain is complete (4-link FRONTEND / 5-link BACKEND) | Yes — task marked done only on pass |
| `/speccraft.change` | `/speccraft.change <CR-file> <story-id>` | Alternate planning entry for an already-approved story. Replaces stages 1–5 for that story and auto-cascades a compatible change atomically through every forward-reachable dependent | Yes — one combined gate covering the whole bundle |
| `/speccraft.sync-swagger` | `/speccraft.sync-swagger <module>` | Optional, human-triggered. Fetches the module's configured Swagger URL (`API-CONTRACT-SOURCE.md`), converts JSON→YAML if needed, merges into `contracts/<module>/<module>.yaml`. Never part of `/speccraft.orchestrate` or any stage | No — reports a summary, human reviews |
| `/speccraft.onboard` | `/speccraft.onboard [path]` | Brownfield-only, alternate entry to §Before You Start steps 2–3. Asks Layer Scope interactively, scans existing code, proposes `ARCH-DECISIONS.md` rows (Tier 1) and `rules`/`skills` content (Tier 2) for review. Never scaffolds, never touches `spec/business/` | Yes — after the combined Tier 1/2 review gate |
| `/speccraft.plan-foundation` | `/speccraft.plan-foundation <business-spec-file> "<tech stack description>"` | Greenfield-only, alternate entry to §Before You Start steps 2, 3, 4, 5, 7, 8. Drafts a Layer Scope recommendation from the business spec, proposes `ARCH-DECISIONS.md` rows and supporting arch docs from the stated stack, seeds `rules`/`skills` content, and fills in `speccraft.scaffold.md`'s placeholders. Never scaffolds, never touches `spec/business/` | Yes — after the combined review gate |
| `/speccraft.tech-debt` | `/speccraft.tech-debt frontend \| backend` | Optional, human-triggered. Read-only report on existing code health (dependencies, deprecated patterns, code hygiene, test gaps, type-safety gaps, architecture drift, security-lite smells). Never part of `/speccraft.orchestrate` or any stage | No — reports a summary, human reviews |

> **Review outcomes for every gate:** `approved` · `revise` · `blocked`
> AI cannot self-approve. Human must respond before next stage runs.

---

## Stage Reference Table

| Stage | Layer | Primary Input | Primary Output | Gate | Traceability Updated |
|-------|-------|--------------|----------------|------|---------------------|
| 1 · Intake | both (single pass) | Business spec file | Stable requirement IDs, intake notes | None | Req IDs created |
| 2 · LLD Creation | per Layer Scope (FRONTEND / BACKEND / FRONTEND+BACKEND) | Approved business spec | `LLD-FRONTEND-<id>.md` and/or `LLD-BACKEND-<id>.md` | LLD Review | Req → LLD section (in-scope layer(s)) |
| 3 · LLD Review | per Layer Scope (FRONTEND / BACKEND / FRONTEND+BACKEND) | In-scope LLD(s) | approved / revise / blocked | **HARD STOP** | Review decision logged |
| 4 · Decomposition | per Layer Scope (FRONTEND / BACKEND / FRONTEND+BACKEND) | Approved in-scope LLD(s) | `TASK-<id>-FRONTEND-T*.md` and/or `TASK-<id>-BACKEND-T*.md` | Decomp Review | LLD section → Task ID |
| 5 · Decomp Review | per Layer Scope (FRONTEND / BACKEND / FRONTEND+BACKEND) | Task files | approved / revise / blocked | **HARD STOP** | Review decision logged |
| 5.5 · Scaffold | per layer | None | `src-code-frontend/` and/or `src-code-backend/` | Human confirm | Scaffold status per layer |
| 6 · Task-To-Code | routed by task | Approved task file | Changed files in the matching code root | Impl Review | Task ID → changed files |
| 7 · Impl Review | routed by task | Implementation diff | approved / revise / blocked | Human review | Review finding logged |
| 8 · Tests | routed by task | Approved implementation | Unit test files | Test Review | Changed files → test files |
| 9 · Test Review | routed by task | Test files | approved / revise / blocked | Human review | Review finding logged |
| 10 · Integration Tests | **backend only** | Approved impl + unit tests | Integration test files | Integration Test Review | Unit test → integration test |
| 11 · Integration Test Review | **backend only** | Integration test files | approved / revise / blocked | **HARD STOP** | Review finding logged |
| 12 · Validation | routed by task | Approved code + tests | `progress-<id>.md` §Validation | Final check | 4-link (FRONTEND) / 5-link (BACKEND) chain verified |
| 13 · Progress Update | both | Verified outputs | Updated `spec/progress/` + `spec/traceability/` | None | Chain complete |

---

## Blocking Conditions

Any of these triggers a `blocked` state — hard stop, no LLD or code produced until human resolves:

| Condition | Where Checked |
|-----------|--------------|
| API contract conflicts with business user story | Stage 2 pre-execution, before first LLD line |
| Screenshot / design reference conflicts with business user story | Stage 2 pre-execution, before first LLD line (frontend LLD only) |
| Business spec too vague to identify scope | Stage 1 / Stage 2 |
| Architecture conflict with business requirement (either layer) | Stage 2 |
| `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` disagree on a shared contract (companion mismatch) — applies only when Layer Scope = `both` | Stage 2 / Stage 3 |
| Required source document missing | Any stage |
| `spec/architecture/ARCH-DECISIONS.md` still empty for the layer being scaffolded (stack not locked) | Stage 5.5 (scaffold) |
| `spec/architecture/ARCH-DECISIONS.md` has real content but no `## Agent Delta` section | Stage 2 (LLD creation), Stage 5.5 (scaffold) |
| `/speccraft.integration-test` invoked on a `Layer: frontend` task | Stage 10 |
| planning artifact not approved before execution begins | Stage 5.5 |
| `/speccraft.onboard` finds conflicting/ambiguous stack evidence for a Tier 1 or Tier 2 finding | `/speccraft.onboard` discovery |
| `/speccraft.onboard` invoked when `ARCH-DECISIONS.md` already has real `AD-FRONTEND-*`/`AD-BACKEND-*` content | `/speccraft.onboard` Pre-Execution Checks — refuses, points to manual edit |

---

## Repository Structure

```
my-app/
│
├── spec/                          # All workflow and architecture documents
│   ├── AGENTS.md                  # Agent identity and behavior rules
│   ├── WORKFLOW-OVERVIEW.md       # Full workflow map and rules
│   ├── SPEC-HIERARCHY.md          # Source precedence when docs conflict
│   ├── SPEC-FOLDER-STRUCTURE.md   # Authoritative folder structure definition
│   ├── SPEC-VERSION.md            # Spec cache version — bump on tracked-file changes
│   ├── REVIEW-AND-REVISION-POLICY.md  # Gate outcomes and revision rules
│   ├── ARCHITECTURE-REFERENCES.md # Index of all architecture authority docs
│   ├── init.md                    # execution bootstrap brief
│   │
│   ├── architecture/              # Locked architecture decisions — empty until this project's stacks are locked
│   │   ├── README.md              # ARCH-DECISIONS.md and any supporting spec files go here per project
│   │   ├── ARCH-DECISIONS.md      # AD-FRONTEND-* / AD-BACKEND-* / AD-X-* (cross-cutting) rows
│   │   ├── NFR-SUMMARY.md         # OPTIONAL — one merged file; 6 shared categories + FRONTEND-only Accessibility + BACKEND-only API Consistency
│   │   └── API-CONTRACT-SOURCE.md # OPTIONAL — per-module {{SWAGGER_URL}}, read only by /speccraft.sync-swagger when a human runs it
│   │
│   ├── commands/                  # Command contracts (one file per slash command)
│   │   ├── speccraft.orchestrate.md        # Master orchestrator command
│   │   ├── speccraft.tech-design.md        # LLD creation command — output layer(s) per Layer Scope (dual by default)
│   │   ├── speccraft.decompose.md           # Decomposition command — input layer(s) per Layer Scope (dual by default)
│   │   ├── speccraft.scaffold.md            # Project scaffold command — /speccraft.scaffold frontend|backend
│   │   ├── speccraft.implement.md        # Implementation command — Layer-routed
│   │   ├── speccraft.unit-test.md  # Test generation command — Layer-routed
│   │   ├── speccraft.integration-test.md   # Integration test command — backend-only precondition
│   │   ├── speccraft.validate.md            # Final validation command — 4-link/5-link chain
│   │   ├── speccraft.change.md      # CR command — alternate planning entry, atomic cascade
│   │   ├── speccraft.sync-swagger.md       # Optional Swagger sync command — human-triggered only
│   │   ├── speccraft.onboard.md  # Brownfield discovery command — alternate entry to Before You Start steps 2-3
│   │   ├── speccraft.plan-foundation.md  # Greenfield foundation command — alternate entry to Before You Start steps 2,3,4,5,7,8
│   │   └── speccraft.tech-debt.md     # Optional code-health report command — human-triggered only
│   │
│   ├── workflows/                 # Stage-specific workflow rules
│   │   ├── shared/                # Rules reused across all stages
│   │   │   ├── STAGE-CONTRACT.md      # Hard editing boundary between planning and execution
│   │   │   ├── TRACEABILITY-RULES.md  # What must be traced and how
│   │   │   └── SHARED-POLICIES.md     # Approval states, done criteria, handoff format, metrics, conflict-decision rules
│   │   ├── lld/                   # Stage 1–3 rules (Intake step covered inside LLD-STAGE.md)
│   │   ├── decomposition/         # Stage 4–5 rules
│   │   ├── implementation/        # Stage 6–7 rules
│   │   ├── testing/                # Stage 8–9 rules
│   │   ├── integration-testing/   # Stage 10–11 rules (backend-only)
│   │   ├── validation/            # Stage 12 rules
│   │   └── change-request/        # Alternate planning entry — CHANGE-REQUEST-STAGE.md
│   │
│   ├── business/                  # Business spec input files (read-only during workflow) — empty until you add stories
│   │   ├── <module>/              # Organized by module
│   │   │   └── <STORY-ID>.md
│   │   └── cr-changes/            # Change Request source files
│   │       └── <module>/
│   │           └── CR-<STORY-ID>-<n>.md
│   │
│   ├── lld/                       # Generated LLD artifacts (planning output), mirrored per business module
│   │   └── <module>/
│   │       ├── LLD-FRONTEND-<STORY-ID>.md   # single-layer projects produce only the file for the locked layer — see §Layer Scope
│   │       └── LLD-BACKEND-<STORY-ID>.md
│   │
│   ├── tasks/                     # Approved decomposed task files, mirrored per module, flat (no tasks/ subfolder)
│   │   └── <module>/
│   │       ├── TASK-<STORY-ID>-FRONTEND-T<n>.md   # single-layer projects produce only the file(s) for the locked layer
│   │       └── TASK-<STORY-ID>-BACKEND-T<n>.md
│   │
│   ├── progress/                  # One file per story (not per stage), mirrored per business module
│   │   ├── <module>/
│   │   │   └── progress-<STORY-ID>.md   # Intake shared; forks FRONTEND/BACKEND from the LLD section onward
│   │   └── shared/                # Repo-wide records not tied to one story (scaffold-frontend/STATUS.md, scaffold-backend/STATUS.md, ONBOARD-FRONTEND/STATUS.md, ONBOARD-BACKEND/STATUS.md, TECH-DEBT-FRONTEND/REPORT.md, TECH-DEBT-BACKEND/REPORT.md)
│   │
│   ├── traceability/               # Requirement → LLD → task → code → test mappings, sharded per story
│   │   ├── TRACEABILITY.md        # Root master template — do not use for active story rows
│   │   ├── shared/scaffold-frontend/TRACEABILITY.md  # Repo-wide frontend scaffold history
│   │   ├── shared/scaffold-backend/TRACEABILITY.md  # Repo-wide backend scaffold history
│   │   ├── shared/ONBOARD-FRONTEND/TRACEABILITY.md   # Repo-wide frontend brownfield onboarding history
│   │   ├── shared/ONBOARD-BACKEND/TRACEABILITY.md   # Repo-wide backend brownfield onboarding history
│   │   ├── shared/TECH-DEBT-FRONTEND/TRACEABILITY.md # Repo-wide frontend tech-debt audit history
│   │   ├── shared/TECH-DEBT-BACKEND/TRACEABILITY.md # Repo-wide backend tech-debt audit history
│   │   ├── shared/STORY-DEPENDENCIES.md        # Bidirectional story dependency ledger (Backward + Forward tables)
│   │   └── <module>/<STORY-ID>/TRACEABILITY.md  # Per-story shard, one file, +Layer column showing both chains
│   │
│   ├── rules/                     # Implementation rules (linting, coverage, etc.) — add per project
│   │   ├── frontend/
│   │   ├── backend/
│   │   └── shared/
│   └── skills/                    # Reusable creation procedures for AI agents — add per project
│       ├── frontend/
│       ├── backend/
│       └── shared/
│
├── contracts/                     # API contracts — cross-cutting, owned by neither layer; does not exist until a backend task first writes to it
│   └── <module>/
│       └── <module>.yaml          # one growing file per module (not per story); written/updated by backend implementation tasks
│
├── src-code-frontend/             # frontend project (execution output; stack locked in spec/architecture/) — does not exist until /speccraft.scaffold frontend runs
└── src-code-backend/              # backend project (execution output; stack locked in spec/architecture/) — does not exist until /speccraft.scaffold backend runs
```

---

## Source Code Structure (`src-code-frontend/` and `src-code-backend/`)

Neither code root exists yet in this boilerplate. Each is created independently by `/speccraft.scaffold frontend` or `/speccraft.scaffold backend` once that layer's stack is locked in `spec/architecture/ARCH-DECISIONS.md` (frontend: framework, UI library, state management, forms, auth/session model, styling, testing; backend: framework, ORM/data-access layer, auth/session model, API style, messaging/queue choice, testing). Their internal structures follow whatever each stack dictates — document it in `spec/architecture/` and `spec/commands/speccraft.scaffold.md` once decided. The two roots are independent: implementing, testing, or scaffolding one never requires the other to exist.

---

## Quick Start

### First run on a new project

1. Complete [Before You Start](#before-you-start--new-project-setup) steps 1–2 at minimum (prune `.gitignore`, answer Layer Scope), then step 3 and step 5 for the layer(s) in scope (lock the stack(s), fill in speccraft.scaffold.md).
2. Drop in the first business spec: `spec/business/<module>/<STORY-ID>.md`.
3. `/speccraft.orchestrate spec/business/<module>/<STORY-ID>.md`
4. Before committing this or any scaffolded code: do step 1 (prune `.gitignore`) — otherwise it silently never gets tracked.

### First run on a new project — fast path

1. Do step 1 (prune `.gitignore`) as normal.
2. Write the first business spec: `spec/business/<module>/<STORY-ID>.md`.
3. `/speccraft.plan-foundation spec/business/<module>/<STORY-ID>.md "<tech stack description>"` — replaces steps 2, 3, 4, 5, 7, 8, see [Greenfield Fast Path](#greenfield-fast-path--speccraftplan-foundation). Review and respond `approved` / `revise` / `blocked`.
4. `/speccraft.orchestrate spec/business/<module>/<STORY-ID>.md`

### First run on an existing (brownfield) project

1. Do step 1 (prune `.gitignore`) as normal.
2. `/speccraft.onboard [path]` — replaces steps 2–3, see [Brownfield / Existing Codebase Path](#brownfield--existing-codebase-path). Review and respond `approved` / `revise` / `blocked`.
3. **(Optional)** `/speccraft.tech-debt frontend` and/or `/speccraft.tech-debt backend` for a read-only code-health report.
4. Continue at step 4 onward exactly as the greenfield flow above — drop in the first business spec, then `/speccraft.orchestrate`.

### Starting a new user story (full workflow)
```text
/speccraft.orchestrate spec/business/<module>/<STORY-ID>.md
```

### Running a single stage
Shown here for Layer Scope = `both`. For a single-layer project, run only the line(s) for your locked layer (e.g. `/speccraft.decompose spec/lld/<module>/LLD-FRONTEND-<STORY-ID>.md` alone for a frontend-only project).
```text
/speccraft.tech-design spec/business/<module>/<STORY-ID>.md
/speccraft.decompose spec/lld/<module>/LLD-FRONTEND-<STORY-ID>.md spec/lld/<module>/LLD-BACKEND-<STORY-ID>.md
/speccraft.scaffold frontend
/speccraft.scaffold backend
/speccraft.implement TASK-<STORY-ID>-FRONTEND-T1
/speccraft.implement TASK-<STORY-ID>-BACKEND-T1
/speccraft.unit-test TASK-<STORY-ID>-FRONTEND-T1
/speccraft.unit-test TASK-<STORY-ID>-BACKEND-T1
/speccraft.integration-test TASK-<STORY-ID>-BACKEND-T1
/speccraft.validate TASK-<STORY-ID>-FRONTEND-T1
/speccraft.validate TASK-<STORY-ID>-BACKEND-T1
```

### One-time project setup
Shown here for Layer Scope = `both`. For a single-layer project, run only the scaffold for your locked layer.
```text
/speccraft.scaffold frontend
/speccraft.scaffold backend
```
Run each once before any execution task-to-code work for that layer. Creates `src-code-frontend/` and `src-code-backend/` per the stacks locked in `spec/architecture/ARCH-DECISIONS.md`.

---

## Workflow Governance Files

| File | Purpose |
|------|---------|
| `spec/AGENTS.md` | Agent identity, read order, behavioral rules |
| `spec/WORKFLOW-OVERVIEW.md` | Full workflow definition |
| `spec/SPEC-HIERARCHY.md` | Precedence when documents conflict |
| `spec/REVIEW-AND-REVISION-POLICY.md` | Review gate outcomes, revision loop rules |
| `spec/workflows/shared/STAGE-CONTRACT.md` | Hard editing boundary between planning and execution |
| `spec/workflows/shared/TRACEABILITY-RULES.md` | What must be traced and how |
| `spec/workflows/shared/SHARED-POLICIES.md` | Approval states, done criteria, handoff format, metrics rules, conflict-decision rules |
| `spec/traceability/<module>/<STORY-ID>/TRACEABILITY.md` | Live per-story traceability (one shard, +Layer column) + conflict decision log |
| `spec/ARCHITECTURE-REFERENCES.md` | Index of all architecture authority docs |

Spec docs were also cross-checked for cross-file consistency — a precedence conflict (NFR ranking) and a long tail of dead file references left over from the Change 1 consolidation (command contracts, traceability files, `GEMINI.md`, `.github/copilot-instructions.md`, `.claude/commands/*.md`) were found and fixed. See `CHANGE.md` "Change 11" for the full list. The frontend/backend merge (dual LLDs, dual code roots, Layer-tagged tasks, conditional integration-testing) is "Change 12" — see `CHANGE.md` for that entry.
