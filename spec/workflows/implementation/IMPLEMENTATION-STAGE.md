# Implementation Stage (Task to Code)

## Agent Delta

**Stage:** Implementation (Task to Code) — execution stage
**Entry:** task status is `approved`; task's `Layer` field read first to select `src-code-frontend/` or `src-code-backend/` root; matching root scaffolded; for any API operation the task touches, either `contracts/<module>/<module>.yaml` already covers it or the approved LLD-BACKEND touchpoint table does — one of the two must exist as design-time authority
**Backend tasks introducing or changing an operation:** the approved `LLD-BACKEND-<id>.md` §5 touchpoint table is the binding shape to implement against; writing/updating `contracts/<module>/<module>.yaml` to match it is part of this task's own output, not a precondition — the contract file does not need to pre-exist. A pre-existing entry for that operation — however it got there, hand-placed or pre-populated via the optional `/speccraft.sync-swagger` command — is never itself binding; the approved LLD-BACKEND touchpoint table always wins, and this task reconciles the file to match it, overwriting the pre-existing entry if it conflicts
**Frontend tasks consuming an operation:** read `contracts/<module>/<module>.yaml` if the operation is already there (its backend dependency has landed); otherwise use the approved, companion-checked LLD touchpoint table as the interim shape for a mocked implementation
**Blocked if:** an API operation the task touches has no design-time authority at all — neither an entry in `contracts/<module>/<module>.yaml` nor in an approved LLD touchpoint table — do not hand-write a shape with no authority; task is `blocked`
**Output:** changed file list; implemented behavior summary; arch + spec mapping; assumptions; blockers; verification performed; traceability task → code updated; for backend tasks touching an operation, confirmation that `contracts/<module>/<module>.yaml` was written/updated to match
**Architecture check every task:** read the task's `Layer` field first, then check the matching `AD-FRONTEND-*` or `AD-BACKEND-*` section of `ARCH-DECISIONS.md` alongside any `AD-X-*` cross-cutting decisions. Frontend: route placement (routing rules), module import direction, rendering strategy (RSC default / `'use client'` at leaves), all mutations via Server Actions. Backend: endpoint/route placement (routing rules), module/service import direction, data-access strategy (repository/ORM boundary, transaction scope), all external side effects behind the service layer
**Must not:** implement beyond approved task scope; invent backend/integration behavior without an approved contract; write into the wrong `src-code-<layer>/` root
**Done when:** implementation review is `approved`; arch constraints checked against the layer-matching section; traceability updated; ready for testing stage

---

## Overview

This stage governs how an approved execution task becomes implementation code. The agent reads the approved task, confirms architectural context, implements the smallest correct change that satisfies the task, and produces verified output with traceability links.

---

## Entry Conditions

Before implementation begins, confirm:

- **Start timestamp captured** — before any other precondition is evaluated, before the task file is read, capture the real wall-clock `Start` per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Non-skippable, and applies fresh per the Fresh Context Rule (`spec/commands/speccraft.implement.md`) — a new task invocation always captures a new `Start`, never a carried-over one.
- the approved task exists and its status is `approved`
- the task's `Layer` field has been read: `frontend` selects `src-code-frontend/` as the code root and the `AD-FRONTEND-*` ARCH-DECISIONS section; `backend` selects `src-code-backend/` and the `AD-BACKEND-*` section; `AD-X-*` cross-cutting decisions apply to either
- the approved LLD for the task scope is available (`LLD-FRONTEND-<id>.md` for frontend tasks, `LLD-BACKEND-<id>.md` for backend tasks)
- the layer-matching `src-code-<layer>/` root exists at repository root and the project has been scaffolded for that layer — if not, run `/speccraft.scaffold <layer>` before writing any feature code; do not create the code root as a side effect of a task execution
- for every API operation this task touches: `Layer: backend` — the approved `LLD-BACKEND-<id>.md` §5 touchpoint table entry is the binding shape; `contracts/<module>/<module>.yaml` is written or updated to match it as part of this task's implementation, not required beforehand. `Layer: frontend` — `contracts/<module>/<module>.yaml` is read if the operation is already there (backend dependency landed); otherwise the approved, companion-checked LLD touchpoint table is the interim shape for a mocked implementation
- if an operation this task touches has no design-time authority at all — not in `contracts/<module>/<module>.yaml` and not in an approved LLD touchpoint table — the task is `blocked` until the LLD covers it; do not hand-write request or response shapes with no authority

---

## Input Contract

### Minimum Task Input

Every executable task should provide:

- task identifier
- `Layer` field (`frontend` or `backend`) — read first; selects the code root and architecture section for every later step
- task title
- business goal or user outcome
- source references
  - business requirement, user story, or business rule
  - architecture references when relevant (layer-matching `AD-FRONTEND-*`/`AD-BACKEND-*` plus `AD-X-*`)
- scope boundaries
- implementation target
  - frontend: route, feature module, component set, API boundary, or state area
  - backend: route/endpoint, feature module, service, API boundary, or persistence area
- acceptance expectations
- edge cases and failure states
- explicit out-of-scope notes

### Blocker Rules

Do not start or continue silently if:

- a required dependency or API contract is missing
- the task conflicts with route, module, or rendering architecture (frontend) or routing, module, or data/integration architecture (backend)
- the task implies an earlier-phase spec change
- the task asks for behavior that is out of scope or deferred

In those cases, stop, document the blocker, and request human confirmation.

---

## Output Contract

### Minimum Implementation Output

Every completed implementation task should produce:

- changed file list
- summary of implemented behavior
- architecture and spec mapping
- assumptions taken
- blockers or follow-up gaps
- verification performed
- traceability updates needed or completed
- `Layer: backend` only, for tasks touching a new or changed API operation: confirmation that `contracts/<module>/<module>.yaml` was written or updated to match the approved `LLD-BACKEND-<id>.md` touchpoint table entry
- `Layer: frontend` only, when this task's cross-layer `Dependencies` entry has resolved since work began: confirmation that implementation was reconciled against the now-real `contracts/<module>/<module>.yaml` rather than left against the draft LLD shape

Record this under `### Implementation` in the task's `## Task: TASK-<id>` block in `spec/progress/<module>/progress-<STORY-ID>.md`.

### Output Rules

- output must describe what was actually implemented, not what was intended but skipped
- if part of scope remains open, mark it explicitly
- if a task was blocked, keep partial outputs clearly separated from approved-complete outputs

---

## Process Steps

1. read the approved task and cited source references
2. read the task's `Layer` field; select `src-code-frontend/` + `AD-FRONTEND-*` or `src-code-backend/` + `AD-BACKEND-*` accordingly (plus any `AD-X-*` cross-cutting decisions)
3. read the project architecture implementation reference for that layer (see execution Read Order in spec/AGENTS.md) — binding implementation constraints for this task
4. frontend: confirm route group, feature module, and rendering strategy. backend: confirm route/endpoint group, feature module, and data-access strategy
5. inspect existing code in the layer-matching root before introducing structure changes
6. implement the smallest correct change that satisfies the task, inside the layer-matching root
7. frontend: add or update validation, loading, empty, success, and failure states where relevant. backend: add or update request validation, and success, empty, conflict, and failure response handling where relevant
7b. `Layer: backend` only, if this task introduces or changes an API operation: write or update `contracts/<module>/<module>.yaml` to match the approved `LLD-BACKEND-<id>.md` touchpoint table entry for that operation, as part of this task's implementation
7c. `Layer: frontend` only, if this task's cross-layer `Dependencies` entry has resolved since work began: reconcile the implementation against the now-real `contracts/<module>/<module>.yaml` instead of the draft LLD shape it started against
8. review the result against the task and architecture constraints
9. revise if required
10. record assumptions, blockers, and traceability links

### Implementation Rules

- frontend: keep route files thin when feature modules are appropriate; follow the routing spec for access and layout boundaries; follow the framework architecture spec for server-client boundaries, caching, security, analytics, and performance
- backend: keep route/controller handlers thin; push business logic into the service layer; follow the routing spec for endpoint placement and access-tier boundaries; follow the data and integration architecture spec for persistence, transaction, caching, and external-integration boundaries
- follow the module architecture spec for module/service ownership and import direction, in either layer
- follow the always-load and conditional implementation rules as defined in the layer-matching `src-code-<layer>/AGENTS.md`
- do not invent backend or integration behavior without an approved contract
- prefer typed schemas and explicit state transitions

---

## Review Checklist

- does the code stay within approved task scope, and did it land in the layer-matching `src-code-<layer>/` root
- does route/endpoint placement follow the routing spec
- do module boundaries and imports follow the module architecture spec
- frontend: do rendering, caching, and server-client boundaries follow the framework architecture spec; backend: do persistence, caching, and external-integration boundaries follow the data and integration architecture spec
- frontend: are loading, empty, success, and failure states present where relevant; backend: are validation, empty, success, and failure response states present where relevant
- is accessibility preserved (frontend)
- are security and compliance-sensitive flows handled correctly
- are assumptions visible
- is traceability from task to code still clear
- `Layer: backend` only, for tasks touching a new/changed operation: was `contracts/<module>/<module>.yaml` written or updated to match the approved LLD-BACKEND touchpoint table
- `Layer: frontend` only, when a cross-layer dependency has since resolved: was implementation reconciled against the real contract file rather than left against the draft LLD shape

### Review Outcome

Allowed outcomes:

- `approved`
- `revise`
- `blocked`

---

## Revision Rules

- revise only the currently reviewed implementation artifact unless a human explicitly reopens earlier-phase scope
- preserve prior traceability mappings unless they are wrong and must be corrected visibly
- answer each review concern with either a change or an explicit rationale
- do not use revision as a reason to expand scope silently
- if revision reveals a planning defect, escalate rather than patching planning artifacts directly

---

## Done Criteria

Implementation is done only when:

- approved task intent is implemented
- implementation review outcome is `approved`
- architecture constraints have been checked
- assumptions and blockers are recorded
- traceability from task to code is updated or queued explicitly
- the work is ready for code-to-unit-tests generation

