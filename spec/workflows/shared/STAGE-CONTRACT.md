# STAGE-CONTRACT.md

Common contract every workflow stage document must follow. Stage-specific docs extend, not contradict, this contract.

---

## Core Rule

Every stage must declare:
1. what inputs it may use
2. what output it produces
3. what it must not edit
4. what review gate follows
5. what traceability it updates
6. what makes it `approved`, `revise`, or `blocked`

A stage may branch conditionally based on a task's `Layer` tag; both branches still owe all mandatory sections of that stage's contract — branching changes WHICH content applies, not whether the stage's obligations are met.

---

## Stage Identity

Each stage document must identify: stage name, purpose, upstream prerequisite stage, downstream next stage.

---

## Mandatory Sections

Each stage-specific workflow file must cover these in substance (exact headings may differ):

1. Purpose
2. Stage Scope
3. Inputs
4. Preconditions — **first precondition, always, is Start-timestamp capture** (see Timestamp Capture Rule below); every other precondition is evaluated after it, never before
5. Output Artifact
6. Required Checks During Production
7. Hard Boundaries
8. Traceability Updates
9. Review Gate
10. Exit Criteria
11. Failure Or Block Conditions
12. Handoff Requirements

---

## Input Contract Rules

Stage documents must classify inputs by authority:
- primary required inputs
- supporting inputs
- reference-only inputs
- forbidden inputs for decision-making

Higher-authority inputs must be identified explicitly. Existing code is context only, not authority. Templates define structure, not business truth. Progress records show state, not source requirements.

---

## Output Contract Rules

- Output must match current stage only; no silent downstream stage work
- Partial output must be marked `partial`
- Output must be traceable to source inputs
- Output must be reviewable without hidden reasoning

Examples: LLD stage -> LLD only; decomposition -> tasks only; implementation -> code changes only, not retroactive spec edits.

---

## Hard Editing Boundary Rules

- planning stages must not edit business specs as normal execution behavior
- execution stages must not edit approved upstream planning artifacts as normal execution behavior
- locked artifacts change only via explicit human instruction or approved review decision
- later-stage discovery of earlier-stage issues must escalate with traceability, never silently rewrite

---

## Review Contract Rules

Allowed outcomes: `approved`, `revise`, `blocked`.

Stage docs must define: what reviewer examines, what evidence is needed, what revision triggers are expected, what blocks progression. No stage contract is complete without explicit review expectations.

### Accepted Issues

An issue found during review may be accepted instead of fixed, only with explicit justification recorded on the review record: Issue, Justification, Accepted By. Accepted issues do not block `approved` outcome but remain visible in the review record — they are not silently dropped.

### Metrics Row Integrity

Every review gate must also check the `Workflow Metrics` row this turn appended (per `SHARED-POLICIES.md` §Duration Capture / §Metrics Rules) — not just the artifact content.

- **`Start = n/a` (or `Duration (min) = n/a`) with no justification in `Notes` is an automatic `revise` trigger.** The reviewer must not wave this through as an incidental gap or bundle it silently into an `approved` outcome — an unjustified `n/a` row is treated the same as any other unmet review requirement in this contract.
- If `Notes` already states the reason (the narrow legitimate case described in `SHARED-POLICIES.md` §Duration Capture — no clean command-start boundary to capture against), the row is acceptable as-is and does not trigger `revise` on this basis.
- This `revise` does not require redoing the artifact itself (the LLD/task/code/test output may be entirely sound). What it requires, per §Revision Rows in `SHARED-POLICIES.md`, is a corrective metrics row appended next turn — never editing the flagged row — carrying either a real captured `Start`/`End` if one is genuinely available, or an explicit justification note if it is not.
- This is deliberately a low-cost revision loop (fix the row, not the design), not a loophole — the point is that an unjustified `n/a` has a real consequence at the next review gate instead of none, per `spec/commands/*.md` Exit Behavior steps that append this row before the hard stop.

---

## Traceability Contract Rules

- Traceability is progressive; update when usable artifacts are produced, not at workflow end
- Interruption does not permit unmapped produced artifacts
- Covered and uncovered scope must both be visible
- planning stages update business-spec-to-LLD or LLD-to-task mappings as relevant
- execution stages update task-to-code or code-to-test mappings as relevant

---

## Requirement Coverage Rule

Each stage must define how it contributes to requirement coverage and how missing coverage is detected and surfaced.

---

## Edge Cases And Impacted Areas Rule

If a stage can change understanding of behavior or scope, it must explicitly consider edge cases and impacted areas. Mandatory in at least intake, LLD, decomposition, implementation review, and validation.

---

## Reuse-Before-Build Rule

If a stage influences design or implementation shape, it must account for reuse: when to check for existing units, how to mark create-vs-reuse decisions, and how to surface reuse conflicts during review.

---

## Timestamp Capture Rule

Every stage document's Entry Conditions/Preconditions section must list, as its literal first bullet, capture of the real wall-clock `Start` timestamp per `spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture. Every command document invoking that stage's behavior must do the same as the first line of its Pre-Execution Checks (or, for commands with no Pre-Execution Checks section, as the first line of its Execution Rule) — see the individual command contracts under `spec/commands/`.

Rules:

- This is a non-skippable, non-deferrable first step — it precedes every other precondition, every input read, and every branch (including a branch that resolves to `blocked` before any real work starts).
- It applies identically on a fresh invocation and on a continuation/resume turn. A stage document must not carve out a "session chain, already in context" exception that also skips timestamp capture — skipping a file re-read is not license to skip capturing `Start` for this turn's own duration measurement.
- A stage or command document that mentions `Start`/`End` only at its exit/handoff step, without requiring capture at entry, does not satisfy this rule — exit-time mention alone allows the capture to be skipped, guessed, or backfilled, which is exactly what this rule exists to prevent.
- `Start = n/a` remains available for the narrow case described in `SHARED-POLICIES.md` §Duration Capture, but it is an exception path, not a routine outcome — a stage/command contract must not be written in a way that makes `n/a` the common case.

---

## Human-In-The-Loop Contract

Stage docs must specify when human escalation is required: business / architecture conflict, missing upstream decision, need to reopen locked earlier artifact, implementation gap that changes approved intent.

---

## Recommended Stage Template Shape

1. Purpose -> 2. Stage Scope -> 3. Inputs -> 4. Preconditions -> 5. Output Artifact -> 6. Production Rules -> 7. Hard Boundaries -> 8. Traceability Updates -> 9. Review Gate -> 10. Exit Criteria -> 11. Failure Or Block Conditions -> 12. Handoff Requirements

---

## Stage Quality Checklist

Stage doc is strong if it clearly answers:
- what the stage produces
- what inputs are authoritative
- what cannot be edited
- what traceability is updated
- what review follows and what counts as `approved` / `revise` / `blocked`
- what happens if stage stops midway
- how architecture affects the stage

---

## Interaction With Other Root Documents

- `spec/AGENTS.md` - agent behavior
- `spec/WORKFLOW-OVERVIEW.md` - end-to-end flow
- `spec/SPEC-HIERARCHY.md` - source precedence
- `spec/REVIEW-AND-REVISION-POLICY.md` - approval behavior
- `STAGE-CONTRACT.md` - how each stage document must be structured
