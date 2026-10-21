# SPEC-HIERARCHY.md

## Core Rule

Higher-precedence source wins. If hierarchy doesn't clearly resolve conflict: stop stage, record conflict, mark `blocked`/`revise`, route to review.

---

## Global Precedence Order

1. current user instruction
2. approved business requirement / acceptance criterion
3. approved LLD
4. approved delivery task
5. `spec/architecture/` — this project's locked architecture spec files (see `spec/ARCHITECTURE-REFERENCES.md`; includes `spec/architecture/NFR-SUMMARY.md` if this project populated it). Once `ARCH-DECISIONS.md` is populated it is organized into `AD-FRONTEND-*` (frontend), `AD-BACKEND-*` (backend), and `AD-X-*` (cross-cutting) subsections — all three sit at this same position 5, no cross-layer priority between `AD-FRONTEND-*` and `AD-BACKEND-*`.
6. approved review decisions / recorded exception approvals
7. workflow policy documents
8. templates and example files
9. existing generated artifacts, existing code, prior progress notes

- Lower-ranked artifact may guide; may not override higher-ranked source.
- Progress notes / generated artifacts are evidence, not truth.
- Templates define structure, not business behavior.

---

## Phase-Specific Hierarchy

### planning — produces: LLD, task definitions, traceability mappings

Active sources (priority order): user instruction → business req/AC → architecture specs → workflow policy.

- LLD must not override business requirements.
- Tasks must not override approved LLD.
- Decomposition convenience must not override architecture.

### execution — produces: code, tests, validation evidence, progress records

Active sources (priority order): user instruction → business req/AC → approved LLD → approved task → architecture specs.

- Implementation must not override approved task scope without reopening review.
- Code convenience must not override architecture.
- Test shortcuts must not override acceptance criteria.

---

## Stage-Level Authority

| Stage | Authoritative Sources (in order) |
|---|---|
| Business Spec Intake | user instruction → business spec → approved domain references |
| LLD Creation | user instruction → business req/AC → architecture specs |
| Decomposition | approved LLD → business req/AC → architecture specs |
| Task → Code | approved task → LLD → business req/AC → architecture specs |
| Code → Unit Tests | approved task → business req/AC → LLD behavior → implemented code |
| Unit Tests → Integration Tests (backend-tagged tasks only) | approved task → business req/AC → approved implementation → approved unit tests |
| Final Validation | business req/AC → LLD → task → architecture specs → impl+tests(+integration tests for backend-tagged tasks) as evidence |

Non-authoritative at Business Spec Intake: existing code, generated artifacts, unverified prior assumptions.

Tests must not validate behavior contradicting approved requirements merely because code behaves that way.

Validation checks conformance; it does not redefine sources.

---

## Architecture Document Authority

- `spec/architecture/ARCH-DECISIONS.md` — locked stack decisions, organized in three prefix families once populated: `AD-FRONTEND-*` (frontend — framework, styling, components, state, forms, session, testing), `AD-BACKEND-*` (backend — framework, persistence/ORM, auth/session, API style, messaging, testing), `AD-X-*` (cross-cutting — decisions both layers must honor identically, e.g. shared API contract format, auth token shape, CORS policy)
- Any further arch spec files this project adds (e.g. routing, module boundaries, rendering strategy, data and integration strategy) — indexed in `spec/ARCHITECTURE-REFERENCES.md` with a Layer tag

Architecture-architecture conflict: do not invent compromise; log conflict; escalate to review.

Task/LLD vs architecture: architecture wins unless explicit approved exception is recorded.

---

## Acceptance Criteria Rules

- LLD section untraceable to business req/AC → justify or remove.
- Task untraceable to approved LLD section + requirement → justify or remove.
- Code changes untraceable to approved task → justify or remove.
- Tests not validating approved behavior → do not count as completion evidence.

If business spec lacks stable IDs: create them in planning; preserve through LLD, tasks, code refs, tests.

---

## Review Decisions & Exceptions

Exception is authoritative only if all four are explicit: what is excepted, scope, approving reviewer, reason.

Acceptable uses: temporary architecture exception, approved scope reduction, accepted deviation for missing dependency.

Unrecorded reviewer comments do not count.

---

## Existing Code & Generated Artifacts

Low precedence. May provide: implementation context, examples, reusable assets, migration constraints.

Existing code vs approved spec: spec wins; log mismatch; plan remediation through workflow.

Generated artifacts are weak truth sources unless explicitly approved stage outputs.

---

## Locked Artifact Rule

Approved earlier-phase artifacts are read-only for later phases unless human explicitly reopens them.

- planning: business specs must not be silently edited during workflow execution.
- execution: approved planning artifacts are locked planning inputs; must not be silently edited.
- Later-phase artifact requires earlier-phase correction → AI must escalate, not rewrite.
- Only explicit human instruction or human-approved review may authorize editing a locked artifact.

---

## Progress & Traceability Records

Operational records — do not outrank business reqs, LLD, tasks, or architecture specs.

- Progress reflects status; cannot declare invalid work correct.
- Traceability reveals coverage; cannot invent approval.
- Dashboards summarize state; cannot replace underlying artifacts.

---

## Conflict Resolution Procedure

1. Identify conflicting sources.
2. Determine hierarchy position of each.
3. Choose higher-precedence source if hierarchy clearly resolves it.
4. Record decision in artifact or decisions log.
5. If hierarchy unclear → stop stage, send to review.

Never continue a stage with a hidden unresolved conflict.

---

## Escalation Triggers

Escalate to review (do not assume) when:

- business req conflicts with architecture
- LLD conflicts with architecture
- task conflicts with LLD
- implementation requires changing approved task scope
- tests expose incomplete or contradictory approved behavior
- two architecture documents appear to conflict
- design references and functional requirements conflict materially

---

## Hierarchy Quick Examples

| Conflict | Winner |
|---|---|
| Frontend: existing code (client-side store) vs approved task + a locked rendering-strategy decision (e.g. server-first) | approved task + architecture |
| Backend: existing code (ad hoc query) vs approved task + a locked data-access decision (e.g. repository-only) | approved task + architecture |
| LLD (seller access) vs business req (buyer-only) | business req; revise LLD |
| Task convenience (duplicate pattern) vs reuse-before-build principle | reuse-before-build wins; avoid duplication |
| Test passes but validates behavior not in approved AC | test not authoritative; revise test/impl |

---

## Related Documents

| Doc | Covers |
|---|---|
| `spec/AGENTS.md` | agent behavior |
| `spec/WORKFLOW-OVERVIEW.md` | work movement across phases/stages |
| `spec/SPEC-HIERARCHY.md` | which source wins on conflict |
| `spec/init.md` | execution bootstrap |

---

## Handoff

Report when hierarchy decision affects current work: conflicting sources, winning source, whether review needed, exception applied, where decision recorded.


