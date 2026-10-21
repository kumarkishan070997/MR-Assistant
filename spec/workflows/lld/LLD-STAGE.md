# LLD Stage (Intake + Low-Level Design)

## Agent Delta

**Stage:** LLD — planning stage (Intake → Low-Level Design)
**Entry:** business spec file provided; scope extractable; active phase is planning
**Output step 1 — Intake:** ONE shared Intake Record with stable REQ-IDs, AC-IDs, arch doc assessment, gaps list; state `in-review`
**Output step 2 — LLD:** one LLD per in-scope layer, produced from the one approved Intake Record, per this project's Layer Scope (`spec/architecture/ARCH-DECISIONS.md` §Layer Scope) — `spec/lld/<module>/LLD-FRONTEND-{STORY-ID}.md` and/or `spec/lld/<module>/LLD-BACKEND-{STORY-ID}.md`, each with all 14 required sections (13 design sections + Companion LLD Reference, the latter marked `Not Applicable` for single-layer scope); each in `in-review`; when Layer Scope = `both`, produced together and reviewed as one gate
**Must not:** produce code, tests, or tasks; self-approve; silently resolve gaps; renumber IDs already assigned; fork the Intake step itself into a separate FRONTEND/BACKEND pass
**Blocked when:** scope cannot be extracted; LLD-blocking gaps unresolved; API or design ref conflicts materially with business spec; new LLD conflicts materially with an already-approved LLD sharing a module/resource/endpoint; `LLD-FRONTEND-{STORY-ID}.md` conflicts materially with its own companion `LLD-BACKEND-{STORY-ID}.md` (Layer Scope = `both` only)
**Done when:** every in-scope LLD review is `approved`; requirements mapped to LLD sections in each; handoff to decomposition is clear
**CR alternate entry:** a story's already-`approved`/`done` LLD pair may also be reached via `/speccraft.change` instead of this stage — see `spec/workflows/change-request/CHANGE-REQUEST-STAGE.md`. This is not a new LLD-stage entry gate; it replaces stages 1-5 for that one story and cascades atomically to its forward-reachable dependents.

---

## Operating Principles

Stack-agnostic rules that apply regardless of what gets locked in `spec/architecture/ARCH-DECISIONS.md`. Apply to both `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` unless a bullet is explicitly layer-scoped:

1. **Traceability** — every component/service, logic unit/repository, store/schema, and test named in either LLD maps to ≥1 acceptance criterion and ≥1 impacted-area entry. Unmapped artifacts are not generated.
2. **Reuse before build** — check for an existing reusable unit before proposing a new one (see §9 Reuse-Before-Build Decisions). Build new only when reuse is confirmed unavailable.
3. **Contract is source of truth** — where an API contract exists, request/response shapes come from that contract, not hand-written, for both LLDs. Frontend hand-written types are limited to view models / domain models and form or validation schemas; backend hand-written types are limited to domain models and internal mappers.
4. **One decision per surface** — each route/component (frontend) or endpoint/resource (backend) gets one explicit design decision (state ownership, rendering/persistence approach, validation strategy) in its own §5; no mixed ambiguity left for execution to guess at.
5. **Permissions enforced server-side first** — the authoritative permission check happens server-side (route guard, server-side handler, middleware, or service layer — named in `LLD-BACKEND-<id>.md`). Any client-side or UI-layer check in `LLD-FRONTEND-<id>.md` is display-only and never the security boundary. The concrete permission model (RBAC, ABAC, or otherwise) is a project's own architecture decision, not prescribed here.

---

## Overview

planning stage. Converts a business specification into one or two approved LLD(s) — per this project's Layer Scope — suitable for decomposition. Sequential steps:

1. **Business Specification Intake** — ONE shared pass: validates the spec, establishes stable layer-agnostic requirement IDs, identifies architecture relevance, surfaces gaps before design begins. Not forked per layer — every in-scope LLD cites the same REQ-IDs/AC-IDs from this single Intake Record.
2. **LLD Creation** — converts the one approved Intake Record into one implementation-relevant low-level design per in-scope layer: `LLD-FRONTEND-<STORY-ID>.md` and/or `LLD-BACKEND-<STORY-ID>.md`. When Layer Scope = `both`, both are produced together and reviewed as one gate — a human responds once for the pair; decomposition does not open until both are independently `approved`. When Layer Scope is single-layer, the single LLD follows its own review cycle.

Neither step produces code, tests, or tasks.

Read this document together with:

- `spec/AGENTS.md`
- `spec/REVIEW-AND-REVISION-POLICY.md`
- `spec/workflows/shared/STAGE-CONTRACT.md`
- `spec/workflows/shared/TRACEABILITY-RULES.md`

---

## Approval States And Review Gate

### States

| State | Meaning | Downstream allowed? |
|-------|---------|-------------------|
| `draft` | authoring started, not review-ready | no |
| `in-review` | submitted for review, outcome pending | no |
| `revise` | review found issues requiring changes | no |
| `approved` | passed required review for current stage | yes |
| `blocked` | cannot continue — missing input, unresolved conflict, or dependency | no |
| `done` | artifact and required downstream evidence complete | n/a |

### Human-Approval Rule

**AI cannot self-approve. Every stage gate requires explicit human approval.**

1. AI produces artifact, outputs summary, stops — execution turn ends
2. Human reads artifact and responds: `approved` / `revise: [reason]` / `blocked: [reason]`
3. AI proceeds only after receiving explicit human approval in the next turn

Silence is not approval. A well-structured artifact is not approval.

---

## Intake Step

### What Intake Must Do

**Understand Scope.** State in a few sentences what the work item covers and what it does not. If scope cannot be extracted, intake is blocked.

**Establish Requirement IDs.** Use existing stable IDs if the spec has them. Otherwise create: `REQ-001`, `REQ-002` for requirements, `AC-001`, `AC-002` for acceptance criteria. IDs must be unique, stable, mapped to source location, and never renumbered after intake is approved.

**Identify Architecture Documents.** One shared assessment covering both layers — do not split into a frontend pass and a backend pass. Assess relevance for:
- routing and shell concerns (access tiers, navigation, layout — frontend; endpoint versioning, access tiers, middleware — backend)
- module ownership concerns (feature-vs-shared layer decisions, import boundaries — both layers)
- rendering and data concerns (rendering approach, state management, data fetching, testing decisions — frontend; persistence strategy, transaction boundaries, caching, external service integration, testing decisions — backend)

Identification only — architecture application happens during LLD creation, split per layer at that point.

**Record Gaps And Open Questions.** List all gaps explicitly. Do not silently resolve. Distinguish LLD-blocking gaps from deferrable ones.

Intake must not: produce design, write code/tests, rewrite the business spec, make architecture decisions, start decomposition, or self-approve.

### Intake Output: The Intake Record

| Field | Rules |
|---|---|
| Work Item ID or Name | Unique, stable across revisions |
| Business Spec Source File Reference | File path and section — mandatory |
| Scope Summary | 1–3 sentences; extracted from spec, not invented |
| Requirement IDs | Complete list: ID, brief description, spec source location, whether spec-origin or intake-created |
| Acceptance Criteria IDs | IDs with source locations, or explicit statement that spec contains none |
| Architecture Documents Assessment | Each assessed: applicable / not applicable / uncertain (with reason) |
| Gaps And Open Questions | Each gap with spec location and LLD-blocking status |
| Intake State | `draft` / `in-review` / `approved` / `revise` / `blocked` — set honestly |
| Recommended Next Step | Proceed to review / resolve gaps / blocked / proceed to LLD |

Core rule: Intake Record must be specific enough that LLD agent can begin without re-examining the spec for scope or stable IDs.

### Intake Review Checklist

Review must end with `approved`, `revise`, or `blocked`.

| # | Check | Trigger |
|---|-------|---------|
| 1 | **Input Source** — based on actual business spec file; source reference stated | `revise` if missing; `blocked` if no valid spec |
| 2 | **Scope Clarity** — 1–3 sentence summary present, extracted from spec, out-of-scope noted | `revise` if vague/invented; `blocked` if no scope can be extracted |
| 3 | **Requirement IDs** — present, stable, consistent scheme, each mapped to source location | `revise` if missing/inconsistent; `blocked` if spec too ambiguous for stable IDs |
| 4 | **Acceptance Criteria** — ACs present with source refs, or absence explicitly noted | `revise` if blank; `blocked` if ACs contradictory enough to prevent ID assignment |
| 5 | **Architecture Assessment** — all three documents assessed; each clearly marked | `revise` if any not assessed; `blocked` if scope too unclear to assess |
| 6 | **Gaps And Open Questions** — listed explicitly with LLD-blocking status; none silently resolved | `revise` if absent for complex spec; `blocked` if LLD-blocking gaps unresolved |
| 7 | **Intake State Honesty** — state reflects actual record quality; not `approved` before review | `revise` if inconsistent; `blocked` if `approved` with blocking gaps |
| 8 | **LLD Readiness** — LLD agent could begin design without re-examining spec | `revise` if too thin; `blocked` if fundamentally insufficient |

### Intake Revision Rules

Preserve: source file reference, requirement IDs already assigned, accepted source locations, AC IDs, gap records identified by review.

May change: scope summary wording, requirement/AC descriptions, architecture assessments, gap blocking status, recommended next step.

Must not silently: renumber IDs in use, remove gap records, resolve LLD-blocking gaps by assumption, claim `approved` before re-review.

Use `blocked` when: spec is too incomplete for stable IDs after two passes; LLD-blocking gap cannot be resolved without new spec content; spec itself needs revision.

### Intake Done Criteria

1. Intake Record exists with business spec source referenced
2. Scope stated clearly in 1–3 sentences
3. Requirement IDs stable, complete, mapped to source locations
4. AC IDs identified or absence explicitly noted
5. All three architecture documents assessed
6. All known gaps visible with LLD-blocking status stated
7. No LLD-blocking gaps recorded as non-blocking
8. Intake review completed with `approved`
9. Handoff to LLD creation is clear

### Intake Traceability Foundation

Must create: work item ID, business spec source file reference, requirement ID list with spec source location, acceptance criteria ID list if applicable. This is the seed all downstream stages extend. If interrupted, preserve IDs already assigned, mark traceability as `partial`, do not renumber.

---

## Entry Conditions

LLD creation may begin only when:

- **Start timestamp captured** — before any other entry condition is evaluated, before any input is read, capture the real wall-clock `Start` per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable, including on a run that will immediately end in `blocked`.
- intake is `approved` (the one shared Intake Record — not per-layer)
- business requirement scope is known
- active phase is confirmed as planning
- this project's Layer Scope is resolved and relevant architecture documents are identified for the in-scope layer(s)

Must not begin if: intake is not `approved`, business requirement is materially ambiguous, required source documents are missing, work item depends on an unresolved known conflict. Every in-scope LLD (`LLD-FRONTEND-<id>.md` and/or `LLD-BACKEND-<id>.md`, per Layer Scope) is produced from this same entry point — there is no separate FRONTEND-only or BACKEND-only entry gate beyond what Layer Scope itself determines.

---

## Input Contract

### Required Authoritative Inputs

**1. Current User Instruction** — highest precedence for the current run.

**2. Approved Business Requirement Source** — must be specific enough to identify current work scope; must not be silently edited during planning.

**3. Stable Requirement References** — IDs from the one shared intake. Do not proceed to review-ready output without stable requirement references. Every in-scope LLD cites the same IDs.

**4a. `spec/architecture/ARCH-DECISIONS.md` §Layer Scope** — read before anything else in this section; resolves which of 4b's subsets apply. If absent and the file is empty/placeholder, stop and ask the human interactively (frontend / backend / both) — never infer.

**4b. `spec/architecture/ARCH-DECISIONS.md`** — always required for every in-scope LLD. Contains locked decisions under `AD-FRONTEND-*` (frontend), `AD-BACKEND-*` (backend), and `AD-X-*` (cross-cutting, e.g. shared API contract shape, CORS, auth token shape). Read the subset matching the in-scope layer(s), plus `AD-X-*`, before any design work begins on each LLD. Non-negotiable constraints. If business spec conflicts, escalate.

**4c. The project architecture structure reference** (file path in spec/AGENTS.md planning Read Order) — always required, for the in-scope layer(s). Covers the frontend structure reference (route group map, feature module map, component layers) and/or the backend structure reference (service/module map, endpoint map, data-access layer map), as applicable. Full arch specs are reference-only for planning.

**Optional:** design references (Figma, wireframes, sequence diagrams, ERDs) — inform structure, do not override business behavior; API contracts — shape integration constraints for every in-scope LLD; domain references (glossary, entities, prior decisions) — improve consistency.

### Hard Stops

**API Contract vs Business Spec conflict:** applies only when `contracts/<module>/<module>.yaml` already covers the operation (an established endpoint being modified) — if it conflicts materially with the business spec (different endpoints, missing operations, conflicting field names, different status codes, different flow assumptions), record each specific mismatch, set LLD status to `blocked`, escalate to human before any further design. For a brand-new operation with no existing contract entry, this hard-stop does not apply — there is nothing to conflict with yet; the binding shape is whatever `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` agree on in their touchpoint tables (enforced by the Companion LLD conflict hard-stop below). The contract file itself is written later, during backend implementation (see `IMPLEMENTATION-STAGE.md`) — it is not an LLD-stage output.

**Design Reference vs Business Spec conflict:** if design references conflict materially with the business user story (different flows, fields, required states) — record each specific mismatch, set LLD status to `blocked`, escalate before any further design.

**LLD vs LLD conflict (cross-story):** if the LLD under creation conflicts materially with an already-approved LLD (from a different story) that shares a module, resource, or endpoint (different schema, different data ownership, contradictory endpoint contract, contradictory access rules) — record each specific mismatch, set LLD status to `blocked`, escalate before any further design. Check impacted areas (§7) against other approved LLDs touching the same module before marking a section review-ready.

**Companion LLD conflict (same story, FRONTEND vs BACKEND) — applies only when Layer Scope = `both`:** the same hard-stop mechanism applies within one story's own pair. If `LLD-FRONTEND-<STORY-ID>.md` and `LLD-BACKEND-<STORY-ID>.md` disagree on API shape, data shape, status/error codes, or state ownership at their shared boundary — record each specific mismatch the same way, set both LLDs' status to `blocked`, escalate before either is marked review-ready. This is not a new mechanism; it is the LLD vs LLD hard-stop scoped to a single story's companion pair instead of across stories. Single-layer scope: there is no companion, so this check never applies.

---

## Output Contract

### Required LLD Sections

Each in-scope LLD (`LLD-FRONTEND-<STORY-ID>.md` and/or `LLD-BACKEND-<STORY-ID>.md`, per Layer Scope) requires all 14 sections below — including for single-layer projects, so every section-count reference in this document and its Review Checklist stays valid regardless of scope. §5 content is layer-specific (frontend design decisions in `LLD-FRONTEND`, backend design decisions in `LLD-BACKEND`); all other sections apply to every in-scope layer, scoped to that layer's concerns.

1. **Metadata** — LLD ID, business spec reference, work item reference, status, last updated, API spec reference (if one exists for this scope — `contracts/<module>/<module>.yaml`, hand-placed or optionally pre-populated via `/speccraft.sync-swagger` if this project configured `spec/architecture/API-CONTRACT-SOURCE.md`), design reference (if one exists, e.g. Figma/wireframe link for FRONTEND, sequence diagram/ERD link for BACKEND), Depends On: [STORY-ID, ...] — populated from `spec/traceability/shared/STORY-DEPENDENCIES.md` when this story's design assumes another story's output; identical in both `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` (a story-level fact, not a per-layer one) — the ledger's Touchpoint free text names which companion file the coupling actually binds to
2. **Purpose And Scope** — what is in/out of scope
3. **Source Requirements** — requirement IDs, AC IDs — traceability anchor; same IDs as cited by the companion LLD
4. **Functional Understanding** — user-facing intent, relevant roles, behavior path, major state transitions. For a complex feature, optionally decompose it into a Capability → Feature → Sub-feature → Buildable Unit tree to make traceability concrete before naming impacted areas in §7
5. **Frontend Design Decisions** (in `LLD-FRONTEND-<id>.md`) / **Backend Design Decisions** (in `LLD-BACKEND-<id>.md`) — frontend: route impact, module ownership, server/client boundaries, state ownership, rendering strategy, validation strategy, API touchpoints; backend: route/endpoint impact, module/service ownership, data ownership and persistence strategy, transaction boundaries, validation strategy, external integration and API touchpoints. Recommended shapes: a state/data-ownership table (what state or data, which owner, the rule for it); an API touchpoint table (operation, method, path, request shape, success shape, error codes) where an API contract exists — both LLDs must agree on this table's shape; a validation table (field, rule, error message/contract). Permission checks follow the server-side-first principle in §Operating Principles — name which layer enforces each check, not a specific permission model
6. **Edge Cases** — validation failures, empty states, loading delays, access failures, missing data, retry/recovery. Recommended shape: an error-mapping table (error, source, handling strategy, user-facing/caller-facing outcome)
7. **Impacted Areas** — frontend: routes, modules, components, logic units, stores, schemas, API wrappers, adjacent flows; backend: routes/endpoints, modules, services, repositories, schemas, adjacent flows; distinguish direct/indirect/new
8. **Architecture Application** — show how architecture documents (the relevant `AD-FRONTEND-*`/`AD-BACKEND-*`/`AD-X-*` subset) shaped design decisions; not a list of documents
9. **Reuse-Before-Build Decisions** — reuse/extend vs create; feature-local vs shared-layer. Recommended shape: a reuse table (existing artifact, import path, used by) and a create table (new artifact, target path, reusable beyond this feature, promotion target)
10. **State And UX States** — loading, empty, success, error, recovery states. Recommended shape: one table per state category (scenario, component/unit affected, expected behavior)
11. **Testing Implications** — critical flows, failure paths, edge-case behavior, areas needing tests
12. **Open Questions And Assumptions** — separate explicit assumptions from unresolved questions from blocked items
13. **Traceability Summary** — which requirements map to which LLD sections; covered vs uncovered
14. **Companion LLD Reference** — when Layer Scope = `both`: names the paired LLD (`LLD-FRONTEND-<id>.md` names `LLD-BACKEND-<id>.md` and vice versa) and any cross-layer contract dependency between them (shared API shape, shared data shape, shared error contract). When Layer Scope is single-layer: states `Not Applicable — Layer Scope is <frontend|backend> only; no companion LLD exists`. This is the section reviewed by the Companion LLD Alignment check (§Review Checklist item 11), which applies only when Layer Scope = `both`.

LLD must be explicit, scoped, requirement-traceable, architecture-aware, decomposition-ready, honest about uncertainty. Must not be: a rewritten business spec, a code implementation plan, happy-path-only, vague brainstorm, placeholder template.

---

## Process Steps

### Intake Step

1. Confirm preconditions: business spec file provided, scope clear, active phase is planning
2. Read spec; extract and bound scope
3. Establish or confirm requirement IDs; map each to source location
4. Identify AC IDs or note absence
5. Assess each of the three architecture document categories for relevance
6. Record all gaps; assess each as LLD-blocking or deferrable
7. Set intake state honestly; submit for review

### LLD Creation Step

1. Confirm intake is `approved` (the one shared Intake Record)
2. Read `spec/architecture/ARCH-DECISIONS.md` — §Layer Scope first, then the `AD-*` subset(s) matching the in-scope layer(s) plus `AD-X-*` — before any design work
3. Read the project architecture structure reference for the in-scope layer(s) (see planning Read Order in spec/AGENTS.md)
4. Compare API contracts and design references against business spec; hard stop on material conflict
5. Interpret business requirements in architecture context, separately for each in-scope layer
6. Apply reuse-before-build check for all proposed units, in every in-scope LLD
7. Compare impacted modules/resources/endpoints against other approved LLDs (cross-story); hard stop on material conflict
8. Only when Layer Scope = `both`: cross-check `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` against each other at their shared boundary (API shape, data shape, error contract); hard stop on material conflict within the pair. Single-layer scope: skip — there is no companion
9. Write all 14 required sections in every in-scope LLD (`LLD-FRONTEND-<STORY-ID>.md` and/or `LLD-BACKEND-<STORY-ID>.md`); when Layer Scope = `both`, produce them together; mark incomplete sections and open questions honestly
10. Submit every in-scope LLD for review — as one gate when Layer Scope = `both`

Both steps: surface contradictions as open questions, review issues, or blockers — never resolve silently. Update traceability progressively. Use `blocked` when progress requires a human decision.

---

## Review Checklist

Review must end with `approved`, `revise`, or `blocked`.

| # | Check | Trigger |
|---|-------|---------|
| 1 | **Scope And Source** — work item identified; requirement IDs present; out-of-scope visible | `revise` if refs weak; `blocked` if source contradictory |
| 2 | **Functional Understanding** — reflects intended behavior; roles identified; flows understandable | `revise` if underspecified; `blocked` if core behavior unclear |
| 3 | **Edge Cases** — explicitly identified; failure/empty/loading/recovery visible | `revise` if only happy path; `blocked` if critical edge case unresolved |
| 4 | **Impacted Areas** — explicit; route/module/shared-layer impacts visible | `revise` if weak/partial; `blocked` if decomposition would be unsafe |
| 5 | **Architecture Alignment** — routing/module/rendering (FRONTEND) or routing/module/data-and-integration (BACKEND) constraints visible and applied | `revise` if listed but not applied; `blocked` if requires unresolved arch exception |
| 6 | **Reuse-Before-Build** — create-vs-reuse visible; shared-vs-feature-local decisions visible | `revise` if no reuse consideration |
| 7 | **Open Questions And Assumptions** — visible; uncertainty not hidden | `revise` if hidden; `blocked` if unresolved questions prevent safe decomp |
| 8 | **Traceability** — requirement IDs map to LLD sections; strong enough for decomposition | `revise` if incomplete; `blocked` if fundamentally broken |
| 9 | **Decomposition Readiness** — tasks can be created without inventing missing behavior | `revise` if guesswork still required; `blocked` if unsafe to decompose |
| 10 | **Cross-Story LLD Alignment** — impacted modules/resources/endpoints checked against other approved LLDs from other stories; no unresolved material conflict | `revise` if check not performed; `blocked` if a material conflict is found and unresolved |
| 11 | **Companion LLD Alignment** — applies only when Layer Scope = `both`: confirm `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` name each other in §14 and do not contradict each other on API shape, data shape, error contract, or status codes. Single-layer scope: confirm §14 states `Not Applicable` and skip the rest of this check | `revise` if §14 missing or thin (when applicable); `blocked` if the pair materially contradicts each other |

Mark `approved` only when source alignment is strong, edge cases sufficient, architecture influence visible, traceability good enough for decomposition, unresolved questions do not invalidate safe progression, and (per items 10–11) neither cross-story nor (when Layer Scope = `both`) companion-pair conflicts remain unresolved.

---

## Revision Rules

When `revise`: address review findings directly. Preserve: approved LLD sections, established traceability mappings, requirement IDs (do not renumber), open questions already recorded. May change: incomplete sections, edge cases, impacted areas, architecture application, assumptions, open questions list, traceability notes. Must not: edit business spec, rewrite approved sections beyond what review requested, delete unresolved open questions, proceed to decomposition before re-review.

Use `blocked` when: business requirement is contradictory; source conflict requires reopening a locked artifact; architecture conflict cannot be resolved inside LLD stage; required human decision not yet made.

---

## Done Criteria

LLD stage is `done` only when all are true for every in-scope LLD (both `LLD-FRONTEND-<STORY-ID>.md` and `LLD-BACKEND-<STORY-ID>.md` when Layer Scope = `both`; the single LLD otherwise):

1. Every in-scope LLD artifact exists for the defined scope; when Layer Scope = `both`, each names the other in §14 Companion LLD Reference (single-layer scope: §14 states `Not Applicable`)
2. All in-scope requirements and ACs mapped to LLD sections in each
3. Edge cases addressed or logged as open questions in each
4. Impacted areas identified (direct, indirect, new) in each
5. Architecture constraints applied: routing/module/rendering (FRONTEND), routing/module/data-and-integration (BACKEND) — whichever apply to the in-scope layer(s)
6. Open questions listed honestly in each
7. Every in-scope LLD review is `approved` (reviewed together as one gate when Layer Scope = `both`); required revisions completed and re-reviewed
8. Traceability from requirements to LLD sections updated for each
9. No unresolved cross-story conflict remains; when Layer Scope = `both`, no unresolved companion-pair (FRONTEND vs BACKEND) conflict remains either
10. Handoff to decomposition is clear
11. Decomposition consumed every in-scope LLD and completed its stage

`approved` = every in-scope LLD may be used as input to decomposition (decomposition does not open until each is independently `approved`). `done` = LLD stage complete, recorded, handoff-ready, and decomposition has consumed every in-scope LLD.

False-done patterns: an LLD generated but review not conducted; reviewed but traceability not updated; `approved` but required revisions never resubmitted; requirements in scope with no LLD treatment; intake record not reviewed; architecture docs not assessed at intake; (Layer Scope = `both`) one LLD of the pair approved while its companion is still `draft`/`revise`/`blocked`; companion LLDs approved without cross-checking their shared boundary.

