# speccraft.onboard.md

## Purpose

This document defines the command contract for onboarding an **existing** application into this workflow — a codebase that already has real, running code, as opposed to the greenfield path where a human locks a brand-new stack from a blank `spec/architecture/ARCH-DECISIONS.md`.

Command shape:

```text
/speccraft.onboard [path]
```

`path` is optional — only needed when the existing code is not already inside `src-code-frontend/`/`src-code-backend/`. There is no `frontend|backend|both` argument: Layer Scope is not known yet going in (discovering it is this command's first job), so it is asked interactively, not passed on the command line.

---

## Why This Exists

Without this command, brownfield adoption has no guided path: a human would have to read the existing codebase themselves and hand-transcribe stack decisions into `ARCH-DECISIONS.md` before any planning stage could run. `/speccraft.scaffold` already correctly refuses to run once a code root exists (see `spec/commands/speccraft.scaffold.md` Pre-Execution Checks / Hard Boundary Rules) — that protects existing code from being overwritten, but it does nothing to help *document* that code's architecture.

This command fills that gap: it scans existing code and proposes `ARCH-DECISIONS.md` content and `rules/`/`skills/` content for human confirmation, instead of starting from a blank interactive prompt.

---

## Command Intent

`/speccraft.onboard [path]` means:

- resolve Layer Scope interactively (never inferred from what code happens to be present)
- locate the existing code for each confirmed layer
- scan it and draft two tiers of findings (see below)
- present the draft to the human for review
- on approval, write the confirmed content into its target location(s)
- never scaffold, never move/relocate existing code, never write to `spec/business/`

---

## Pre-Execution Checks

0. confirm `spec/architecture/ARCH-DECISIONS.md` does not already have real `AD-FRONTEND-*`/`AD-BACKEND-*` content — if it does, this command refuses: it is a first-time discovery tool, not a re-sync tool; point to manual edits of `ARCH-DECISIONS.md` instead
1. **ask Layer Scope interactively:** stop and ask the human, in chat, whether this existing application is `frontend` / `backend` / `both` — worded the same as root `README.md` §Before You Start step 2. Never infer this from which code root happens to exist or from scan results — the absence of `src-code-backend/`, for example, does not by itself mean backend is out of scope; the backend may live elsewhere and simply not have been pointed to yet. This is the same hard rule as `spec/AGENTS.md` §Layer Scope Precondition and `spec/architecture/README.md` §Layer Scope.
2. for each layer confirmed in scope, locate its existing code:
   - check `src-code-frontend/` / `src-code-backend/` first (already-conventional layout)
   - if absent, ask the human for that layer's existing app path — never assume one
3. confirm the located path actually contains real source code (not an empty directory) before scanning

---

## Discovery — Two Tiers By Destination

Scanning reads manifest/dependency files (`package.json`, `requirements.txt`, `pyproject.toml`, `pom.xml`, `build.gradle`, `go.mod`, `*.csproj`, etc.) and the surrounding source tree, then splits findings by where they belong:

### Tier 1 — LLD-required stack decisions → `spec/architecture/ARCH-DECISIONS.md` only

Scope is exactly the enumerated decision set already named in root `README.md` §Before You Start step 3 / `spec/architecture/README.md` — nothing wider:

- **Frontend (`AD-FRONTEND-*`):** framework, UI library, state management, forms, auth/session model, styling, typing, test framework
- **Backend (`AD-BACKEND-*`):** framework, ORM/data-access layer, auth/session model, API style (REST/GraphQL/RPC), messaging/queue choice (if any), typing, test framework
- **Cross-cutting (`AD-X-*`):** API contract shape, CORS policy, token format

Each proposed row carries an `Evidence` column citing the file (and line, where meaningful) that justified the inference, e.g. `package.json:12`.

### Tier 2 — everything else discovered → `rules/` and `skills/`, never `ARCH-DECISIONS.md`

Finer-grained conventions that don't gate LLD/decomposition: lint configuration, naming conventions, folder substructure beyond the top level, data-fetching/data-access patterns, component/service/repository creation patterns, existing test-writing conventions, rate-limiting/accessibility patterns already in use, and similar. This is the same content root `README.md` §Before You Start steps 7–8 describe as manually authored — here it is discovered instead.

**Destination root for Tier 2 follows where the code actually lives:**
- code already inside `src-code-frontend/`/`src-code-backend/` → write to that root's `rules/` and `skills/` (matching the existing convention exactly)
- code at a user-provided arbitrary path (this command never relocates it) → write `rules/` and `skills/` subfolders under that same provided path instead (`<user-path>/rules/`, `<user-path>/skills/`)

---

## Human Review Gate

Present both tiers together as one combined review — the human sees the proposed `ARCH-DECISIONS.md` rows and the proposed `rules/`/`skills/` drafts in the same pass.

Respond with: `approved` / `revise: [reason]` / `blocked: [reason]` — same vocabulary as every other gate in this workflow (see `spec/workflows/shared/SHARED-POLICIES.md`).

Only on `approved` does the agent write:
- Tier 1 into `ARCH-DECISIONS.md`: `## Layer Scope`, the confirmed `AD-FRONTEND-*`/`AD-BACKEND-*`/`AD-X-*` rows, and a `## Agent Delta` section (see root `README.md` §Agent Delta Protocol)
- Tier 2 into the resolved `rules/`/`skills/` root

Nothing is locked before this gate passes. The agent cannot self-approve.

---

## Ambiguous Evidence

If scanning finds conflicting signals for a single decision (e.g. two competing frontend frameworks both present, or mixed ORM usage with no clear primary) — for either tier — stop and report `blocked: [reason]`, ask the human directly. Never guess a resolution, consistent with this repo's existing "never infer Layer Scope silently" rule in `spec/AGENTS.md`.

---

## Hard Boundary Rules

This command must not:

- write any feature code, fix bugs, or refactor anything in the existing codebase
- move, rename, or restructure existing code (Tier 2 output is written to wherever the code already lives, not the other way around)
- write to `spec/business/` (business context is explicitly out of scope for this command — see Non-Goals)
- write to `ARCH-DECISIONS.md` or `rules/`/`skills/` before the human review gate returns `approved`
- run if `ARCH-DECISIONS.md` already has real `AD-FRONTEND-*`/`AD-BACKEND-*` content

---

## Failure And Block Conditions

- `spec/architecture/ARCH-DECISIONS.md` already populated — refuse, point to manual edit
- Layer Scope not yet answered — stop and ask, never infer
- no existing code found at the resolved/provided path for a confirmed layer
- ambiguous or conflicting stack evidence for any Tier 1 or Tier 2 finding
- human responds `revise` — redo the affected finding(s) and re-present; do not partially apply an unapproved draft

---

## Relationship To `/speccraft.scaffold`

`/speccraft.scaffold frontend|backend` will (correctly, unchanged) still refuse to run once a code root already exists — that is the desired brownfield behavior: no empty shell gets created over real code. This command's job ends at architecture and `rules`/`skills` documentation; it does not hand off into `/speccraft.scaffold`, and running it does not make `/speccraft.scaffold` runnable for a layer whose code already exists.

---

## Non-Goals

- reverse-engineering `spec/business/` specs from existing feature behavior — a distinct, undelivered future phase; this command produces architecture documentation only, not business specs
- fixing, upgrading, or refactoring anything discovered as a gap — see `/speccraft.tech-debt` for a read-only report on code health; this command never modifies code itself
- moving or restructuring existing code into `src-code-frontend/`/`src-code-backend/` — Tier 2 output follows the code, never the reverse

---

## Minimal Command Handoff

```text
Command: /speccraft.onboard [path]
Layer Scope Resolved: frontend / backend / both
Existing Code Located: yes / no (per layer)
Tier 1 Draft Rows Proposed: <count>
Tier 2 Draft Entries Proposed: <count>
Review Outcome: approved / revise / blocked
ARCH-DECISIONS.md Written: yes / no
rules/skills Written: yes / no
Current State: complete / blocked
Next Recommended Action:
```

---

## Exit Behavior

After a run completes:

1. output the minimal handoff block above
2. append one row to `spec/traceability/shared/ONBOARD-FRONTEND/TRACEABILITY.md` and/or `spec/traceability/shared/ONBOARD-BACKEND/TRACEABILITY.md` (per confirmed layer) under `Workflow Metrics` per `spec/workflows/shared/SHARED-POLICIES.md` (story ID = `ONBOARD-FRONTEND` or `ONBOARD-BACKEND`, command, stage = `Brownfield Onboarding`, date, model, start/end timestamps, duration, input/output tokens, tok source, artifacts, status, notes)
3. record completion in `spec/progress/shared/ONBOARD-FRONTEND/STATUS.md` and/or `spec/progress/shared/ONBOARD-BACKEND/STATUS.md`
4. STOP — do not proceed to any planning stage until the human confirms the written `ARCH-DECISIONS.md` and `rules`/`skills` content is acceptable

Running once per repo is expected, per layer confirmed in scope — same one-time-per-layer spirit as `/speccraft.scaffold`, though this command runs *before* `/speccraft.scaffold` in the brownfield timeline rather than in place of it.

---

## Relationship To Other Documents

Read this document together with:

- `spec/architecture/ARCH-DECISIONS.md` — the target for Tier 1 output
- `spec/architecture/README.md` — Layer Scope resolution rule, extended to recommend this command when real code already exists
- `spec/AGENTS.md` — Layer Scope Precondition (universal gate this command satisfies via interactive ask)
- root `README.md` — §Before You Start, Brownfield / Existing Codebase Path (this command replaces steps 2–3 for a brownfield project)
- `spec/commands/speccraft.scaffold.md` — the command this one deliberately does not hand off into
- `spec/commands/speccraft.tech-debt.md` — companion command for a read-only code-health report, independent of this one
