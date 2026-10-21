# init.md - execution bootstrap

## Foundation Status

- Status: `DONE`
- Workflow foundation complete; architecture locked and business spec populated.

---

## Repository Mission

Workflow OS for full-stack (frontend + backend) spec-driven delivery. Moves business inputs to delivery outputs via:
- explicit stage boundaries, mandatory review gates, revision loops
- strong traceability, architecture-aware rules

**planning:** approved delivery-ready task definitions.
**execution:** implementation, tests, validation, delivery evidence. No stage skips review gate.

---

## First-Action Rule

Read: this file -> `spec/AGENTS.md` -> `spec/WORKFLOW-OVERVIEW.md` -> active stage doc + approved task.
Entry rules: `spec/WORKFLOW-OVERVIEW.md` §Exit Conditions and §Review Gates.

---

## Source Of Truth

- `spec/business/` - business specs
- `spec/lld/` - LLD outputs, mirrored per business module, one file per layer per story (`spec/lld/<module>/LLD-FRONTEND-<id>.md` + `LLD-BACKEND-<id>.md`)
- `spec/tasks/<module>/` - delivery task definitions, mirrored per business module, flat, filename carries story id + Layer + sequence (`TASK-<id>-FRONTEND-T<n>.md` / `TASK-<id>-BACKEND-T<n>.md`)
- `spec/progress/` - progress records, one file per story (`spec/progress/<module>/progress-<STORY-ID>.md`), forking FRONTEND/BACKEND at the LLD section onward
- `spec/traceability/` - traceability records, one shard per story with a `Layer` column
- `spec/ARCHITECTURE-REFERENCES.md` - architecture index
- `src-code-frontend/AGENTS.md` - frontend implementation-rule routing (read for frontend-tagged tasks only)
- `src-code-backend/AGENTS.md` - backend implementation-rule routing (read for backend-tagged tasks only)

---

## Design Principles

Every artifact must have explicit inputs, outputs, rules, review conditions, revision triggers, traceability, open-question handling, and done criteria.

- Docs too vague for consistent model execution are incomplete.
- Traceability is progressive. Every artifact maps to source inputs and coverage status even on session interruption.

---

## Architecture Constraint Rule

Architecture docs are authoritative. Index: `spec/ARCHITECTURE-REFERENCES.md`. Reference in LLD creation, decomposition, implement, and final validation.

---

## Initial Build Goal (while `PENDING`)

Build stable doc and operating structure for:
- workflow control docs, stage-specific docs, review/revision rules, templates
- delivery, progress, and traceability structures
- root-level command guidance for multiple agent models

Do not drift into product implementation unless user explicitly asks.

---

## Expected First Outputs

- root workflow overview and source-of-truth hierarchy docs
- shared workflow rules
- LLD, decomposition, implementation, testing, integration testing (backend-tagged tasks only), and validation workflow docs
- framework / component / service / repository implementation-rule docs, per code root
- task, progress, and traceability templates

---

## Definition Of Done

Foundation is complete when:
- stage flow is documented end to end
- each major stage has its own workflow doc set
- review and revision rules are explicit
- architecture references are integrated
- delivery, progress, and traceability structures are defined
- different AI models can follow the workflow without inventing steps

---

## Non-Goals

- product feature implementation unrelated to workflow foundation
- speculative abstractions without workflow need
- vague best-practice docs without executable detail
- architecture rewrites of routing, module, or framework specs
- all-in-one giant docs over reusable smaller docs

---

## Handoff Format

Report: what changed · workflow artifact or stage mapped · references used · assumptions · verification · stage status (draft / in review / revised / approved / blocked / done) · remaining gaps.

---

## Starter Prompt

```text
Read spec/init.md, then read spec/AGENTS.md and spec/WORKFLOW-OVERVIEW.md.
Confirm that execution has started and that an approved delivery task exists.
Identify the current execution workflow stage and the task's Layer field (frontend or backend) before producing output.
Use the repository workflow documents as the execution system.
Use spec/architecture/ARCH-DECISIONS.md (the AD-FRONTEND-*/AD-BACKEND-* half matching the task's Layer, plus any AD-X-* cross-cutting entries) and any further project architecture files indexed in spec/ARCHITECTURE-REFERENCES.md as architecture constraints where relevant.
Read the matching src-code-frontend/AGENTS.md or src-code-backend/AGENTS.md for implementation-rule routing.
Do not invent missing requirements. Record gaps, questions, and review needs explicitly.
```
