# REVIEW-AND-REVISION-POLICY.md

## Core Principle

Stage advances only when: artifact reviewed, outcome explicit, required revisions made, records updated. Artifact existence alone is not completion.

---

## Allowed Reviewers

- human reviewer
- AI reviewer
- combined human + AI

If a step or user instruction requires human approval, AI review alone is insufficient.

---

## Review Outcomes

Only three valid outcomes:

| Outcome | Meaning |
|---|---|
| `approved` | artifact acceptable; known issues explicitly accepted; next stage may begin |
| `revise` | not acceptable; changes required; stage stays active until re-reviewed |
| `blocked` | cannot progress — required dependency, decision, input, or clarification missing/contradictory |

No informal outcome counts as stage completion.

---

## Artifact Status Model

| Status | When |
|---|---|
| `draft` | before review submission |
| `in-review` | awaiting review outcome |
| `revise` | review requested changes |
| `approved` | cleared for next-stage use |
| `blocked` | progress cannot continue |
| `done` | artifact + required evidence complete |

---

## Stage Review Checklists

### planning

**Business Spec Intake** — review for:
- scope understanding
- requirement completeness assumptions
- known source gaps
- requirement ID / AC readiness

**LLD** — review for:
- source, architecture alignment
- edge cases, impacted areas, open questions
- traceability to source requirements
- when Layer Scope = `both`, confirm the story's `LLD-FRONTEND-<id>.md` and `LLD-BACKEND-<id>.md` are internally consistent with each other (no contradicting API/data-shape assumptions) before either is marked approved

**Decomposition** — review for:
- task granularity, dependency ordering, implementation readiness
- traceability to LLD and requirements
- no speculative or duplicate work

### execution

**Implementation** — review for:
- task, architecture conformance
- reuse-before-build conformance
- state / error / loading / empty / recovery handling
- unintended impacted areas

**Unit Tests** — review for:
- requirement coverage, deterministic behavior
- meaningful success and failure paths
- implementation alignment
- no invalid or misleading assertions

**Integration Tests** — review for (backend-tagged tasks only):
- cross-boundary coverage (API contract, persistence, external integration) rather than re-isolated unit logic
- real or containerized dependency use over mocking, with any mock boundary justified
- deterministic, isolated test data setup and teardown
- meaningful success and failure paths across the boundary

**Final Validation** — review for:
- source-to-output conformance
- traceability completeness
- architecture compliance
- completion honesty

---

## Revision Rules

Revision is mandatory (not optional) when:

- review outcome is `revise`
- hierarchy conflict discovered affecting current output
- traceability gaps exist for produced artifacts
- edge cases or impacted areas missing where required
- architecture violations found
- task scope too vague to execute safely
- tests do not reflect approved behavior

Revision must preserve: artifact version, review feedback, accepted decision points, unresolved open questions, established traceability mappings, status transition history.

Do not silently erase prior context.

---

## Blocking Rules

Use `blocked` only when progress cannot continue meaningfully.

Valid: missing source input, contradictory requirements, unresolved hierarchy/architecture conflict, required approval unavailable, dependency on unapproved prior artifact.

Do not misuse for: ordinary revision work, low-confidence-but-solvable work, incomplete-but-reviewable drafts.

---

## Review Record — Minimum Fields

Every review must record:

- artifact reviewed
- active phase + stage
- reviewer type (human / AI)
- review outcome
- issues found
- required actions
- whether downstream progression is allowed

If `blocked`, also record: exact blocker, source of blocker, what must happen to unblock.

---

## Progressive Review

Review happens at each major stage, not only end-of-phase.

- Each major stage must be reviewed before downstream progression.
- Meaningful partial artifacts may be reviewed for early feedback.
- Interruption does not cancel the obligation to review outputs before relying on them downstream.

---

## Review Depth

Review must match artifact type — surface-only checks are insufficient:

| Artifact | Must assess (not just) |
|---|---|
| LLD | behavior, edge cases, impacted areas, constraints — not just formatting; for the FRONTEND/BACKEND pair, cross-LLD consistency too |
| Decomposition | ordering, granularity, execution realism — not just task count |
| Implementation | architecture, behavioral correctness — not just compile success |
| Unit Tests | coverage quality, assertion relevance — not just passing results |
| Integration Tests (backend-tagged tasks only) | real cross-boundary coverage, not re-mocked unit logic — not just passing results |

---

## Escalation Triggers

Escalate for human or explicit review when:

- requirement-to-architecture conflict exists
- design reference materially conflicts with functional requirements
- scope reduction or exception requires reviewer approval
- implementation reveals missing planning decisions
- same revision issue repeats without convergence

Human-in-the-loop escalation is mandatory when a blockage would otherwise require changing a locked earlier-phase artifact.

---

## Exception Handling

Exception is valid only if explicit. Record must include: what is excepted, why, scope, who approved, temporary or permanent.

Valid examples: temporary architecture exception, missing test coverage accepted for blocked dependency, intentionally deferred scope.

Unrecorded exceptions do not count.

---

## Review & Traceability

- Review must verify required traceability mappings exist.
- Revision must update both artifact content and traceability.
- Traceability gaps found during review → outcome must be `revise` or `blocked`, not `approved`.

---

## Completion Rule

Stage / work item is NOT complete when:
- review missing or outcome ambiguous
- required revisions unresolved
- blocking issues unrecorded
- traceability incomplete for produced artifacts

---

## Related Documents

| Doc | Covers |
|---|---|
| `spec/AGENTS.md` | agent behavior |
| `spec/WORKFLOW-OVERVIEW.md` | workflow movement |
| `spec/SPEC-HIERARCHY.md` | source precedence |
| `spec/REVIEW-AND-REVISION-POLICY.md` | approval / revision / blocking |
| `spec/init.md` | execution bootstrap |

---

## Handoff

Report at end of any stage task: artifact reviewed/updated, phase, stage, status before/after, review outcome, revision still needed, blockers, downstream progression allowed.


