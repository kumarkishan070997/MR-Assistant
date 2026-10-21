# speccraft.tech-debt.md

## Purpose

This document defines the command contract for producing a read-only technical-debt report on an existing codebase. It is a companion to `/speccraft.onboard`, not a replacement: onboarding locks *decisions and conventions*; this command reports on *code health* against those decisions (and against the code itself, independent of them).

Command shape:

```text
/speccraft.tech-debt frontend
/speccraft.tech-debt backend
```

Each invocation is independent, per layer — same shape as `/speccraft.scaffold`. Layer Scope must already be resolved (via greenfield lock-in or `/speccraft.onboard`) for this command to take a layer argument at all.

---

## Why This Exists

Brownfield adoption benefits from knowing what state the existing code is actually in — outdated dependencies, deprecated patterns, missing tests, and drift from whatever stack decisions were just locked — before planning work lands on top of it. Without this command, that assessment either doesn't happen or is done ad hoc with no consistent record.

This command is deliberately **informational, not a gate**: nothing downstream is blocked by its findings. It exists so a human can decide what debt to schedule, not to enforce a debt ceiling.

---

## Command Intent

`/speccraft.tech-debt frontend|backend` means:

- confirm Layer Scope includes the target layer, and real code exists to audit
- scan the code for two kinds of signal (see Derivation Modes)
- produce a categorized, evidenced findings report
- write the report and stop — never fix, refactor, or upgrade anything itself

---

## Pre-Execution Checks

0. confirm `spec/architecture/ARCH-DECISIONS.md` §Layer Scope is resolved and includes the target layer — if it excludes this layer, stop and report the mismatch
1. confirm real code exists to audit: `src-code-frontend/`/`src-code-backend/`, or the path recorded from a prior `/speccraft.onboard` run — refuse on an empty scaffold; there is nothing to audit yet
2. note whether `ARCH-DECISIONS.md`'s `AD-FRONTEND-*`/`AD-BACKEND-*` section and/or that layer's `rules/` are populated — this determines whether the Architecture Drift category (Mode B, below) has anything to compare against this run

---

## Derivation Modes — Two Sources, Additive

Findings come from two independent sources. Both run every time; Mode B is simply empty when there is nothing to compare against yet.

### Mode A — code-only, always runs, no baseline needed

A pure static scan of the code itself. Works whether or not `/speccraft.onboard` or greenfield stack-locking has ever run for this project.

### Mode B — architecture-comparison, needs a locked baseline

Reads each locked `AD-FRONTEND-*`/`AD-BACKEND-*`/`AD-X-*` row or Tier-2 `rules/` convention as the "expected" value, then scans the code for exceptions to it — one locked decision produces one targeted check; each violation found is a separate finding with its own evidence. Example: `AD-FRONTEND-003` locks state management to Redux Toolkit; the scan finds Zustand also imported in three files → three drift findings, each citing its import line. No locked decisions yet → this category is simply empty for this run, not a reason to refuse the audit.

---

## Findings Categories

Each finding carries: `Severity` (High / Med / Low), `Category`, `Mode` (A / B), `Evidence` (file:line), `Recommendation`.

| Category | Mode | What it looks for |
|---|---|---|
| Dependencies | A | outdated / major-version-behind packages, anything past stated EOL, no-longer-maintained libraries |
| Deprecated / EOL patterns | A | framework APIs flagged deprecated in current docs, EOL language/runtime versions |
| Code hygiene | A | `TODO`/`FIXME`/`HACK` density, large commented-out blocks, oversized files/functions (line-count heuristic), duplication hotspots |
| Test gaps | A (sharper with a Tier-2 baseline) | source files with no matching test file — uses the locked Tier-2 test convention if present, otherwise a generic same-directory/`__tests__` heuristic |
| Type-safety gaps | A | suppression markers (`@ts-ignore`, `# type: ignore`, `any` casts) — count and location |
| Architecture drift | B only | code that contradicts an already-locked `AD-FRONTEND-*`/`AD-BACKEND-*` decision or Tier-2 `rules/` convention |
| Security-lite smells (defensive only) | A | hardcoded-looking secrets/credentials patterns, disabled auth checks, overly permissive CORS — flagged for human review, never exploited or verified live |

---

## Output Expectations

Primary output: `spec/progress/shared/TECH-DEBT-FRONTEND/REPORT.md` (frontend run) or `spec/progress/shared/TECH-DEBT-BACKEND/REPORT.md` (backend run) — same shared, non-story home as `scaffold-frontend/STATUS.md` / `scaffold-backend/STATUS.md`. The two reports are independent — one may exist without the other.

Optional: list the report path in `spec/ARCHITECTURE-REFERENCES.md` so a later LLD touching a flagged module can cite known debt — opt-in reference, not a mandatory read for any stage, same treatment as `spec/architecture/NFR-SUMMARY.md`.

---

## Gate Style — Informational, Not Blocking

This command has **no approval gate**. It reports a summary; the human reviews it on their own schedule — modeled on `/speccraft.sync-swagger`'s "reports a summary, human reviews" behavior (Hard Stop After: No). No stage's Pre-Execution Checks reference this report as a precondition unless a project deliberately wires it in by hand (same opt-in spirit as NFR enforcement).

---

## Hard Boundary Rules

This command must not:

- fix, refactor, upgrade, or otherwise modify any code it audits
- treat itself as a substitute for `/speccraft.onboard`'s Tier 1/Tier 2 discovery — Mode B is only as complete as whatever `ARCH-DECISIONS.md`/`rules/` already lock
- perform live vulnerability-database lookups, CVE verification, or any network call to check dependency exploitability
- block or gate any other command's execution

---

## Failure And Block Conditions

- Layer Scope excludes the target layer — stop, report mismatch
- no real code found at the resolved path — stop, nothing to audit
- (informational command — findings themselves never block; only the two conditions above stop the run)

---

## Minimal Command Handoff

```text
Command: /speccraft.tech-debt frontend | backend
Code Found: yes / no
Mode A Findings: <count> (High: n, Med: n, Low: n)
Mode B Findings: <count> (empty if no locked baseline yet)
Report Written: spec/progress/shared/TECH-DEBT-FRONTEND|BACKEND/REPORT.md
Current State: complete / blocked
Next Recommended Action:
```

---

## Exit Behavior

After a run completes:

1. output the minimal handoff block above
2. append one row to `spec/traceability/shared/TECH-DEBT-FRONTEND/TRACEABILITY.md` (frontend run) or `spec/traceability/shared/TECH-DEBT-BACKEND/TRACEABILITY.md` (backend run) under `Workflow Metrics` per `spec/workflows/shared/SHARED-POLICIES.md` (story ID = `TECH-DEBT-FRONTEND` or `TECH-DEBT-BACKEND`, command, stage = `Tech Debt Audit`, date, model, start/end timestamps, duration, input/output tokens, tok source, artifacts, status, notes)
3. no STOP required — this command does not block downstream work; the human may read the report whenever they choose

Running this command has no bearing on the other layer's audit, and may be re-run at any time to refresh the report (each run overwrites the prior report for that layer — this is a point-in-time snapshot, not an append-only log).

---

## Relationship To Other Documents

Read this document together with:

- `spec/commands/speccraft.onboard.md` — the companion command that produces the Tier 1/Tier 2 baseline Mode B compares against
- `spec/architecture/ARCH-DECISIONS.md` — source of Mode B's "expected" values, when locked
- `spec/commands/speccraft.sync-swagger.md` — the closest existing precedent for a non-blocking, human-reviewed, informational command
- `spec/ARCHITECTURE-REFERENCES.md` — optional index location for this report
