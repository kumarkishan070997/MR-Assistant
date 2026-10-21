# speccraft.plan-foundation.md

## Purpose

This document defines the command contract for bootstrapping a **greenfield** project's architecture foundation from a business spec and a stated tech stack — a codebase with no application code yet, as opposed to `/speccraft.onboard`'s brownfield path, which discovers a stack by scanning existing code.

Command shape:

```text
/speccraft.plan-foundation <business-spec-file> "<tech stack description>"
/speccraft.plan-foundation auto <business-spec-file> "<tech stack description>"
```

`<business-spec-file>` is a path to an existing file under `spec/business/<module>/<STORY-ID>.md`. `<tech stack description>` is a single free-text argument (quote it — it will almost always contain spaces), e.g. `"React + Vite frontend, Node/Express backend, Postgres via Prisma, REST API"`. There is no separate stack-spec file: the description is read once and never re-read from disk.

The default form is **interactive mode**: the Human Review Gate below pauses for an explicit human `approved` / `revise` / `blocked` response before anything is written, exactly as described throughout this document. The `auto` form is **auto mode**: the same five tiers of discovery, the same draft content, the same write order — but the agent clears its own review gate instead of pausing for a human. See `## Auto Mode` below for exactly how review, revision, `blocked`, and an `unclear` Layer Scope are handled without a pause. Every other section of this document describes interactive-mode gate behavior unless it explicitly says otherwise.

Argument parsing: an optional leading `auto` token selects auto mode; when present it is consumed first, and the remaining tokens are parsed exactly as below. Absent means interactive mode (default). After that: the first whitespace-delimited token is the business spec file path (repo convention never puts spaces in `spec/business/` paths); everything after it is the tech stack description, whether or not it is quoted.

---

## Why This Exists

Without this command, greenfield setup has no guided path: root `README.md` §Before You Start and `docs/greenfield-setup.md` describe answering Layer Scope, locking the stack, filling `speccraft.scaffold.md`'s placeholders, and authoring `rules/`/`skills/` content as pure manual, hand-authored steps — no command performs any of them. `/speccraft.tech-design`'s only fallback when these are missing is a bare interactive chat question with no stack-proposal logic. `/speccraft.onboard` fills the equivalent gap for brownfield projects, but explicitly refuses to run without real code to scan — it has nothing to offer a project that is genuinely starting from zero.

This command fills that gap: it drafts, from the named business spec plus a stated tech stack, everything a human would otherwise type by hand into `ARCH-DECISIONS.md`, `speccraft.scaffold.md`, supporting architecture spec files, and `rules/`/`skills/`, and presents it all for one combined human review.

---

## Command Intent

`/speccraft.plan-foundation <business-spec-file> "<tech stack description>"` means:

- read the named business spec and draft a Layer Scope recommendation (`frontend` / `backend` / `both`) — a recommendation for the review gate, never silently applied
- parse the stated tech stack description against the same enumerated Tier 1 decision set `/speccraft.onboard` uses, sourced from what was actually said plus named-stack ecosystem conventions where the description is silent
- draft Tier 2 `rules`/`skills` seed content from the named stack's known idioms — there is no code to scan, so this is convention knowledge, not discovery
- draft Tier 3 fill-in of this project's own `spec/commands/speccraft.scaffold.md` placeholders so scaffold is immediately runnable once approved
- draft Tier 4 supporting architecture spec files (routing/module-boundary/rendering strategy for frontend; data/integration strategy for backend) where the stated stack and Tier 1 decisions actually imply structure worth documenting
- present the Layer Scope recommendation and all four tiers together in one combined review gate — a human review gate by default, or the agent's own self-review in `auto` mode (see `## Auto Mode`)
- on approval, write everything at once
- never scaffold, never touch `spec/business/`, never run against a project that already has real code or already-locked stack decisions

---

## Auto Mode

Auto mode runs the same five tiers of discovery below, producing the same draft content, under the same Hard Boundary Rules as interactive mode. The only thing auto mode changes is **who clears the Human Review Gate, how an `unclear` Layer Scope is resolved, and whether execution pauses to do either** — it never skips a tier, and it never hides a decision.

This section is the authoritative behavior for every place elsewhere in this document that says "human review gate", "present for confirmation", "the human's response", "STOP", or "human must confirm" — read those as scoped to interactive mode; in auto mode, this section's rules apply instead.

### Resolving an `unclear` Layer Scope

Tier 0 may mark one layer `unclear — human must confirm` when the BRD gives no usable signal for it (see Tier 0). Interactive mode leaves that to the human; auto mode cannot pause, so it resolves deterministically instead:

- **One layer unclear, the other has a usable signal:** exclude the unclear layer from the run — draft Tier 1 through Tier 4 for the signaled layer only. Drafting the unclear layer anyway would mean inventing structure the BRD never described, which Non-Goals already forbids; excluding it is the conservative choice, consistent with the Unstated-Field Rule's bias toward the smallest defensible footprint.
- **Both layers unclear (the BRD gives no usable signal at all):** this is not a scope question the agent can resolve by guessing — there is nothing to draft. Treat it the same as a missing/unreadable business spec input error (see Pre-Execution Checks): stop, report why, and ask for either a clearer BRD or an explicit Layer Scope in chat. This is the one case where auto mode still stops — because there is no draft to review in the first place, not because a review gate needs a human.

State which of these applied, if either, in the Final Handoff.

### Who reviews the Human Review Gate

The agent itself performs the review, applying the same criteria a human reviewer would: Tier 1 completeness against the confirmed layer(s), correct `Source` tagging (in particular that every `stack-convention` row genuinely follows the Unstated-Field Rule's fixed order rather than an arbitrary guess), Tier 3 mechanically matching the approved Tier 1 rows, and Tier 4 files written only where the stated stack or Tier 1 decisions actually imply structure worth documenting. This command writes no traceability/progress artifact in either mode, so there is no separate review-record file — the outcome and reasoning are stated in the Final Handoff instead.

### Outcome: `approved`

Write immediately, in the order given under Human Review Gate. No pause.

### Outcome: `revise`

The agent redrafts the affected tier(s) itself and re-reviews, up to **2 automatic revise-retries**. If a concern remains after 2 retries, it is not silently dropped: record it as an `## Auto Mode — Open Concerns` note appended to the affected file(s) (`ARCH-DECISIONS.md`'s `## Agent Delta`, or the relevant Tier 4 file) stating what the concern is and why the agent proceeded anyway, then write as normal. This bounds the loop so it always terminates.

### Outcome: `blocked`

Reserved, per Failure And Block Conditions, for a stated stack description that asserts two mutually exclusive values for the same required Tier 1 field — a genuine self-contradiction, not just an unstated field. Auto mode does not pause to ask for clarification:

1. resolve the field using the same conservative bias as Unstated-Field Rule steps 3–4 (prefer the minimal/no-dependency option if either conflicting value is minimal; otherwise prefer whichever value was stated first in the description)
2. tag that row's `Source` column `auto-mode-resolved` (not `stated-stack` — the description did name values, but two contradictory ones, so it does not earn the ordinary stated-stack tag) and use the Notes column to state both conflicting values found and which one was kept and why
3. continue drafting the remaining tiers normally

A `blocked` outcome is never resolved without that Notes-column reasoning — it is always resolved on the record, just not on a separate traceability file, since this command keeps none.

### Final Handoff

At the end of an auto run — whether it completes normally or stops early because both layers were unclear (see above) — output the same Minimal Command Handoff block as interactive mode, with `Mode: auto` and the auto-only fields filled in, so a human can audit the unattended draft after the fact even though it has already been written.

---

## Pre-Execution Checks

A missing/unreadable business spec file, a missing tech stack description, or "both layers unclear" (see `## Auto Mode`) end the run with a clear error in both modes — auto mode's no-pause guarantee applies to the Human Review Gate, not to invalid or insufficient starting input.

0. confirm no real application code already exists for the layer(s) this BRD likely touches — check `src-code-frontend/` and `src-code-backend/` first; if either contains real source (not just boilerplate placeholders), this is not a greenfield project — stop and recommend `/speccraft.onboard [path]` instead, regardless of what `ARCH-DECISIONS.md` currently contains. This check runs before check 1 because existing code is the more specific signal — a project can have locked-but-unscaffolded decisions and still be genuinely greenfield, but it cannot have real running code and still be greenfield.
1. confirm `spec/architecture/ARCH-DECISIONS.md` does not already have real `AD-FRONTEND-*`/`AD-BACKEND-*` content — if it does (and check 0 found no code, i.e. decisions were locked but never scaffolded), this command refuses: it is a first-time foundation tool, not a re-lock tool. Point the human at a manual edit of `ARCH-DECISIONS.md` for the specific field that needs to change — `/speccraft.change` is a story-level Change Request mechanism for already-approved LLDs, not an architecture re-lock tool; do not point to it for this case.
2. confirm `<business-spec-file>` exists and is readable under `spec/business/<module>/<STORY-ID>.md`
3. confirm `<tech stack description>` is present and non-empty — if omitted, stop and ask for it in chat rather than drafting from the BRD alone; a stack description is this command's second required input, not optional context

---

## Discovery — Five Tiers By Destination

### Tier 0 — Layer Scope recommendation

Read the business spec's Summary, Scope, Requirements, and Acceptance Criteria sections. Look for frontend signals (form, screen, page, UI, list view, "user sees/enters/clicks") versus backend signals (API, endpoint, persistence, server-assigned, database, "server is the source of truth"). Draft a Layer Scope recommendation (`frontend` / `backend` / `both`) with one line of rationale citing which BRD language drove it (e.g. "BRD describes both a submission form and a server-assigned identifier — recommend `both`"). This is a recommendation, not a silent inference — see Human Review Gate. If the BRD gives no usable signal either way for one layer (e.g. a pure data-migration story with no UI language and no explicit backend language), mark that layer `unclear — human must confirm` in the draft rather than defaulting it in either direction. (Auto mode: see `## Auto Mode` for how `unclear` is resolved without a human confirming it.)

### Tier 1 — LLD-required stack decisions → `spec/architecture/ARCH-DECISIONS.md` only

Same enumerated decision set as `/speccraft.onboard` Tier 1 — nothing wider:

- **Frontend (`AD-FRONTEND-*`):** framework, UI library, state management, forms, auth/session model, styling, typing, test framework
- **Backend (`AD-BACKEND-*`):** framework, ORM/data-access layer, auth/session model, API style (REST/GraphQL/RPC), messaging/queue choice (if any), typing, test framework
- **Cross-cutting (`AD-X-*`):** API contract shape, CORS policy, token format

Only draft rows for the layer(s) recommended in Tier 0 (subject to the human's final confirmation at the gate — if the human changes Layer Scope at review time, re-draft the affected tier(s) before re-presenting).

Each row carries a `Source` column instead of onboard's `Evidence` column, since there is no code to cite:
- `Source: BRD` — the row's value follows directly from something the business spec states or implies (e.g. "no auth" because the BRD's Non-Goals explicitly excludes authentication)
- `Source: stated-stack` — the value was named explicitly in the `<tech stack description>` argument
- `Source: stack-convention` — the description didn't name this field explicitly; drafted per the Unstated-Field Rule below. Rows sourced this way are the ones most likely to need a `revise`, and must be visually grouped or flagged as such in the presented draft — they are proposed defaults, not restated facts.
- `Source: auto-mode-resolved` — auto mode only (see `## Auto Mode`); the description named two mutually exclusive values for this field and the agent resolved the contradiction itself rather than pausing to ask. Always carries a Notes-column explanation of both conflicting values and which was kept and why.

**Unstated-Field Rule — deterministic, not a judgment call made fresh each run:** a required Tier 1 field the stack description never names is *always* drafted, never silently skipped. Which value to draft is decided by this fixed order, so the same input produces the same draft every run:

1. **The description states this same field explicitly for the sibling layer, in a full-stack (`both`) description** (e.g. it says "TypeScript" for the backend but never says "TypeScript" or "JavaScript" for the frontend, even though both were described in one pass) — draft the sibling layer's value for consistency, tag `stack-convention`, and note in the row's Notes column that it was inferred from the other layer's stated typing rather than stated for this layer directly. This is a stronger signal than ecosystem convention below and is checked first.
2. **A single ecosystem-idiomatic pairing exists for the named stack** (e.g. a stated Vite frontend implies Vitest as the paired test runner) — draft that pairing, tag `stack-convention`.
3. **No single pairing exists, but a minimal/no-dependency option exists among the peers** (e.g. no UI library named → draft "none"; no state library named → draft "framework built-ins only"; no test runner named for a stated Node backend → draft the language/runtime's own built-in test runner over a third-party library) — draft the minimal option, tag `stack-convention`. Bias toward the smallest footprint specifically *because* it is always a safe, revisable starting point regardless of which peer the human actually wanted.
4. **None of the above applies — the remaining peer options are real architectural alternatives with no minimal/default option among them** (e.g. "Node backend" names no framework at all, and Express/Fastify/Koa are peers with no ecosystem-tiebreaker and no "do nothing" option) — draft the single most widely-adopted peer (highest ecosystem share) rather than blocking, tag `stack-convention`, and note in the row's Notes column which peer(s) were passed over. Still never `blocked` for this case: guessing wrong here costs one `revise` reply, which is strictly cheaper than a mid-draft stop for a field that was never going to block the human from reviewing everything else in the same pass.

**`blocked: [reason]` is reserved for genuine self-contradiction only** — the stated stack description (or the description plus the BRD) asserts two mutually exclusive things about the *same* field (e.g. "React frontend" earlier in the description and "Vue components" later in it), so there is no single value to draft at all, not even a defensible guess. This mirrors onboard's Ambiguous Evidence section, which triggers on the same kind of genuine conflict (two competing frameworks both found in code), not on a field the scan simply never mentions.

### Tier 2 — stack-convention seed content → staged for `rules/` and `skills/`, never `ARCH-DECISIONS.md`

Finer-grained conventions analogous to onboard's Tier 2 (naming conventions, folder substructure beyond the top level, typical data-fetching/data-access patterns, component/service/repository creation patterns, typical test-writing conventions for the named stack) — but derived from the named stack's documented idioms, not scanned from code, since no code exists yet. Cite the convention's basis in the drafted content itself (e.g. "Vite + React convention: colocate a component's test file as `Component.test.tsx` beside `Component.tsx`") so the human reviewing it can tell this is a proposed starting convention, not an observed fact.

**Destination — staged, not final, because the code root doesn't exist yet:** write to `spec/architecture/rules-seed/<layer>/rules/`, `spec/architecture/rules-seed/<layer>/rules/shared/`, `spec/architecture/rules-seed/<layer>/skills/`, `spec/architecture/rules-seed/<layer>/skills/shared/` (one `<layer>` tree per confirmed layer) — mirroring exactly the four folders `/speccraft.scaffold` creates under the code root, staged one level up until that root exists. `/speccraft.scaffold`'s step 7 picks this staged content up and moves it into the real root the first time that layer is scaffolded, then removes the staging folder (see `spec/commands/speccraft.scaffold.md`). If a layer's scaffold never runs, its staged seed simply sits unused under `spec/architecture/rules-seed/<layer>/` — harmless, not a broken reference.

### Tier 3 — scaffold contract fill-in → `spec/commands/speccraft.scaffold.md` placeholders, this project's own copy

Mechanically derived from the approved Tier 1 rows (not independently drafted — if Tier 1 changes at review, redraft Tier 3 to match before re-presenting):
- `Required Stack` (per resolved layer): concrete install commands for the locked framework/libraries
- `Required Folder Structure` (per resolved layer): a real path/purpose table replacing the `_(fill in once stack is locked)_` placeholder row, following the named stack's idiomatic layout
- `.env.example` entries (per resolved layer): concrete env var names implied by the locked decisions (e.g. `DATABASE_URL` if an ORM/persistence decision is not "none", `SESSION_SECRET` only if an auth/session decision is not "none")
- `Config File Requirements` (per resolved layer): the concrete config file list (e.g. `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`) replacing the placeholder row, each still pointing to `ARCH-DECISIONS.md`/`rules/` as authority exactly as the existing placeholder text does — this command fills in *which files*, it does not duplicate their content

### Tier 4 — supporting architecture spec files → `spec/architecture/`, indexed in `spec/ARCHITECTURE-REFERENCES.md`

For each confirmed layer, draft the structural docs root `README.md` §Before You Start step 4 describes: frontend routing conventions, module boundaries, and rendering strategy; backend data-access layering and integration strategy. Follow the shape of `examples/greenfield-demo/spec/architecture/FRONTEND-STRUCTURE.md` and `BACKEND-STRUCTURE.md` (or, for a project with real code already present via a prior onboard, `examples/brownfield-demo`'s equivalents) as the reference: a `## Agent Delta` section immediately after the title, then the structural content, then a `## Related` section pointing back to `ARCH-DECISIONS.md`, `ARCHITECTURE-REFERENCES.md`, and `speccraft.scaffold.md`.

Write only what the stated stack and approved Tier 1 decisions actually imply — a stated router (e.g. Next.js, React Router) earns a routing-conventions section; a stated stack naming no router and no second screen in the BRD gets a thinner document or none at all, never an invented convention. A layer whose stack gives no structural decisions beyond Tier 1 legitimately produces an empty Tier 4 — that is an expected outcome, not a gap to flag at review.

Each drafted file gets its own `## Agent Delta` section (this is the step-4-file portion of root `README.md` step 11, alongside `ARCH-DECISIONS.md`'s own delta) and a new row in `spec/ARCHITECTURE-REFERENCES.md`'s architecture documents table so agents pick it up in their read order.

---

## Human Review Gate

**Interactive mode.** Auto mode does not pause here — see `## Auto Mode`.

Present the Tier 0 Layer Scope recommendation, Tier 1 rows, Tier 2 seed drafts, Tier 3 scaffold fill-in, and any Tier 4 files together as one combined review — same single-pass principle as onboard, extended to include the Layer Scope recommendation itself instead of gating it separately beforehand. (Auto mode: the agent performs this same combined review itself, per `## Auto Mode`.)

Respond with: `approved` / `revise: [reason]` / `blocked: [reason]` — same vocabulary as every other gate in this workflow (`spec/workflows/shared/SHARED-POLICIES.md`).

If the human's response changes the Layer Scope recommendation (confirms a different value than drafted), redraft Tier 1 through Tier 4 for the corrected layer set before re-presenting — do not write a stale draft for a layer the human just excluded, or skip a layer the human just added. (Auto mode: the equivalent Layer Scope resolution happens per `## Auto Mode`, before any tier is drafted, not as a re-presentation loop.)

Only on `approved` does the agent write, in this order:
1. `ARCH-DECISIONS.md`: `## Agent Delta`, `## Layer Scope`, the confirmed `AD-FRONTEND-*`/`AD-BACKEND-*`/`AD-X-*` rows
2. `spec/architecture/rules-seed/<layer>/` staged Tier 2 content, per confirmed layer
3. `spec/commands/speccraft.scaffold.md`'s placeholder sections, per confirmed layer
4. any Tier 4 supporting architecture spec files, plus their `spec/ARCHITECTURE-REFERENCES.md` rows

Nothing is locked before this gate passes. The agent cannot self-approve. (Auto mode is the documented exception — see `## Auto Mode`.)

---

## Hard Boundary Rules

This command must not:

- write any feature code, `src-code-frontend/`, or `src-code-backend/` — it never scaffolds
- write to `spec/business/` — the business spec is read-only input
- write to `ARCH-DECISIONS.md`, the `rules-seed/` staging tree, `speccraft.scaffold.md`, or any Tier 4 file before the review gate returns `approved` (interactive mode: a human `approved`; auto mode: the agent's own `approved` outcome per `## Auto Mode`)
- run if real application code already exists (Pre-Execution Check 0)
- run if `ARCH-DECISIONS.md` already has real `AD-FRONTEND-*`/`AD-BACKEND-*` content (Pre-Execution Check 1)
- silently default a Layer Scope recommendation the BRD gives no usable signal for — interactive mode: mark it `unclear` and let the human decide at the gate; auto mode: resolve it per `## Auto Mode`'s deterministic rule and state the resolution in the Final Handoff — "silently" is the forbidden part, not "without pausing"
- draft `spec/architecture/NFR-SUMMARY.md` content or an API contract reference — both stay out of scope for this command (see Non-Goals)

---

## Failure And Block Conditions

**Interactive mode:**

- real application code already exists for a layer this BRD likely touches — refuse, point to `/speccraft.onboard [path]`
- `spec/architecture/ARCH-DECISIONS.md` already has real `AD-FRONTEND-*`/`AD-BACKEND-*` content and no code exists — refuse, point to manual edit
- `<business-spec-file>` missing or unreadable
- `<tech stack description>` omitted — stop and ask for it, do not draft from the BRD alone
- stated stack description asserts two mutually exclusive values for the same required Tier 1 field (genuine self-contradiction, not just an unstated field) — `blocked: [reason]`, ask for clarification
- BRD gives no usable Layer Scope signal for one layer — mark `unclear`, let the human decide, do not default
- human responds `revise` — redraft the affected tier(s) and re-present; do not partially apply an unapproved draft

**Auto mode** (see `## Auto Mode` for the full mechanics):

- real application code already exists, or `ARCH-DECISIONS.md` already has real content, or the business spec is missing/unreadable, or the tech stack description is omitted — refuse/stop identically to interactive mode; these are invalid-input conditions, not review-gate outcomes, so auto mode's no-pause guarantee does not apply to them
- stated stack description asserts two mutually exclusive values for the same required Tier 1 field — resolved and logged as `Source: auto-mode-resolved`, not asked about; run continues
- BRD gives no usable Layer Scope signal for one layer — excluded from the run if the sibling layer has a signal; if neither layer has a signal, the run stops the same way as a missing business spec (nothing to draft)
- the agent's own review of its draft finds an issue — redrafted and re-reviewed, bounded to 2 automatic retries, per `## Auto Mode`

---

## Relationship To `/speccraft.onboard`

Mutually exclusive entry points into the same destination file. `/speccraft.onboard` is for a codebase that already has real running code to scan; `/speccraft.plan-foundation` is for a codebase that has neither, only a business spec and a stated intent. Each refuses to run in the other's situation (see Pre-Execution Checks). Once either has run and been approved, the project is in the same state — a populated `ARCH-DECISIONS.md` — and both hand off identically into `/speccraft.scaffold`.

## Relationship To `/speccraft.scaffold`

This command does not invoke `/speccraft.scaffold` and does not create either code root. It exists specifically to make `/speccraft.scaffold frontend`/`/speccraft.scaffold backend` immediately runnable afterward — every one of scaffold's Pre-Execution Checks that currently blocks on an empty `ARCH-DECISIONS.md` or an empty placeholder section should pass once this command's output is approved. Scaffold's step 7 checks for this command's staged `rules-seed/<layer>/` output before falling back to creating empty folders.

## Relationship To `/speccraft.tech-design`

`/speccraft.tech-design`'s only fallback today, when Layer Scope or a required `AD-*` row is missing, is a bare interactive chat question with no stack-proposal logic. This command is the guided alternative to that fallback for a project that has a BRD ready but hasn't yet answered root `README.md` §Before You Start steps 2, 3, 4, 5, 7, and 8 by hand. Running this command first means `/speccraft.tech-design` never has to fall back to the bare question at all.

---

## Non-Goals

- discovering or scanning any existing code — that is `/speccraft.onboard`'s job exclusively; this command assumes zero code exists
- inventing business requirements not present in the named business spec — it only reads the BRD to infer Layer Scope and cross-reference stated non-goals (e.g. "no auth"), never to add scope
- writing feature code, running `/speccraft.scaffold`, or creating either code root
- amending an already-locked `ARCH-DECISIONS.md` — see Pre-Execution Check 1
- drafting `spec/architecture/NFR-SUMMARY.md` — NFR enforcement stays optional and manual (root `README.md` §Before You Start step 6), independent of this command
- drafting or referencing an API contract file — root `README.md` §Before You Start step 10 only applies when a story modifies an already-existing contract, which a fresh greenfield BRD's first story never does

---

## Minimal Command Handoff

```text
Command: /speccraft.plan-foundation <business-spec-file> "<tech stack description>"
Mode: interactive / auto
Layer Scope Recommended: frontend / backend / both / unclear (per layer)
Layer Scope Confirmed: frontend / backend / both
Layer Scope Auto-Resolution: n/a (interactive) / excluded <layer> / stopped — both layers unclear (auto only)
Tier 1 Draft Rows Proposed: <count> (stated-stack: <n>, stack-convention: <n>, BRD: <n>, auto-mode-resolved: <n>)
Tier 2 Seed Entries Proposed: <count>
Tier 3 Scaffold Sections Filled: Required Stack / Required Folder Structure / .env.example / Config File Requirements
Tier 4 Architecture Files Proposed: <count> (per layer, may be zero)
Review Outcome: approved / revise / blocked
Auto Mode Revise-Retries Used: n/a (interactive) / <count, 0-2> (auto only)
Auto Mode Open Concerns Logged: n/a (interactive) / yes / no (auto only)
ARCH-DECISIONS.md Written: yes / no
rules-seed/ Staged: yes / no
speccraft.scaffold.md Placeholders Filled: yes / no
Tier 4 Files Written: yes / no
Current State: complete / blocked
Next Recommended Action:
```

---

## Exit Behavior

**Interactive mode.** After a run completes:

1. output the minimal handoff block above
2. STOP — do not proceed to `/speccraft.scaffold` or any planning stage until the human confirms the written `ARCH-DECISIONS.md`, staged `rules-seed/`, filled `speccraft.scaffold.md` sections, and any Tier 4 files are acceptable

**Auto mode.** The write (or the early stop for "both layers unclear") already happened before this output — there is no pending human confirmation to wait for, since the draft was reviewed and approved by the agent itself per `## Auto Mode`. After a run completes:

1. output the Final Handoff (the same minimal handoff block above, with `Mode: auto` and its auto-only fields filled in)
2. STOP regardless — auto mode never chains into `/speccraft.scaffold` or any planning stage on its own, same as interactive mode; the human's role shifts from pre-write approval to post-write audit

No traceability or progress artifact is written by this command in either mode — unlike onboard, scaffold, and the orchestrate-chained stages, which track per-story workflow metrics, this is a one-time, pre-story foundation-setup step with nothing to track against a story. Auto mode's resolutions are recorded inline in the written files themselves (`Source: auto-mode-resolved` rows, `## Auto Mode — Open Concerns` notes) and in the Final Handoff, not in a separate log.

Running once per project is expected — same one-time-per-project spirit as steps 2–3/4/5/7–8 of root `README.md` §Before You Start, which this command replaces.

---

## Relationship To Other Documents

Read this document together with:

- `spec/architecture/ARCH-DECISIONS.md` — the target for Tier 1 output
- `spec/architecture/README.md` — Layer Scope resolution rule, extended to recommend this command when no code exists yet but a business spec does
- `spec/AGENTS.md` — Layer Scope Precondition (universal gate this command satisfies via a drafted-then-confirmed recommendation, not a blind ask)
- `spec/ARCHITECTURE-REFERENCES.md` — the index Tier 4 output is added to
- root `README.md` — §Before You Start, New Project Setup (this command replaces steps 2, 3, 4, 5, 7, and 8 for a greenfield project with a BRD ready)
- `spec/commands/speccraft.onboard.md` — the brownfield counterpart this command deliberately does not overlap with
- `spec/commands/speccraft.scaffold.md` — the command this one deliberately does not invoke, but makes immediately runnable
