# speccraft.sync-swagger.md

## Purpose

This document defines the command contract for `/speccraft.sync-swagger`, an optional, human-triggered convenience that fetches a module's configured Swagger/OpenAPI endpoint and merges it into `contracts/<module>/<module>.yaml`.

Command shape:

```text
/speccraft.sync-swagger <module>
```

This command is entirely optional. A project with no live Swagger endpoint never runs it, and the contract mechanism works fully without it — backend `/speccraft.implement` still authors `contracts/<module>/<module>.yaml` from the approved `LLD-BACKEND-<id>.md` touchpoint table either way (see `spec/SPEC-VERSION.md` "Note — v11", `spec/workflows/implementation/IMPLEMENTATION-STAGE.md`).

---

## Why This Exists

Some projects have a live Swagger/OpenAPI endpoint (an existing service, a spec-first design tool) whose current shape a human wants reflected in `contracts/<module>/<module>.yaml` without hand-copying and reformatting. This command automates that one convenience action — fetch, convert to YAML if needed, merge into the file — and nothing else. It never runs automatically and never becomes a parallel source of truth: the file it writes to is the same one `/speccraft.implement` already owns at implementation time.

---

## Command Intent

`/speccraft.sync-swagger <module>` means:

- read `spec/architecture/API-CONTRACT-SOURCE.md`, resolve the configured Swagger URL for `<module>`
- fetch the live spec from that URL
- if the response is JSON (OpenAPI/Swagger JSON), convert to YAML — this repo's contract format is YAML-only throughout
- **merge** the fetched operations into `contracts/<module>/<module>.yaml` at the operation level — update or add operations present in the fetched spec; do not delete existing entries absent from the fetched spec (a live snapshot may not represent every hand-authored or LLD-derived entry currently in flight)
- report a diff-style summary (endpoints added / removed / modified) for human review
- not fetch, write, or touch anything else — no other file, no other module unless separately invoked

Does not: run automatically as part of `/speccraft.orchestrate` or any stage's Process Steps; overwrite operations wholesale; delete entries silently; author any file other than `contracts/<module>/<module>.yaml` (plus its own report output).

---

## Pre-Execution Checks

**Timestamp capture — explicitly not applicable.** Every other command in this repo captures a `Start` timestamp as its non-skippable first step (`spec/workflows/shared/SHARED-POLICIES.md` §Duration Capture) because it later writes a `Workflow Metrics` row that needs it. `/speccraft.sync-swagger` is the one exception: per its own Exit Behavior below, it never appends a traceability shard row — there is no `Workflow Metrics` row for a `Start`/`End` pair to feed. This is a deliberate, stated exemption, not a silent gap: if this command is ever changed to write metrics, timestamp capture must be added as its first step at that time, per `spec/workflows/shared/STAGE-CONTRACT.md` §Timestamp Capture Rule.

1. confirm `spec/architecture/API-CONTRACT-SOURCE.md` exists and has a configured `{{SWAGGER_URL}}` entry for `<module>` — if the file doesn't exist or the module has no entry, stop and report; this command is a no-op until a human configures it (same "placeholder, stop and report" pattern as `/speccraft.scaffold` against an empty `ARCH-DECISIONS.md`)
2. confirm `<module>` is a valid module name matching an existing or intended `contracts/<module>/` path

---

## Ownership — `/speccraft.sync-swagger` Is Advisory Only

`/speccraft.sync-swagger` and backend `/speccraft.implement` can both write to `contracts/<module>/<module>.yaml`. The precedence is one-directional and simple:

- `/speccraft.sync-swagger` only pre-populates or refreshes the file from the live endpoint — it has no binding authority over what a backend task must implement.
- `/speccraft.implement` (backend) remains the **sole binding authority** at implementation time — it always writes/updates the file to match the **approved `LLD-BACKEND-<id>.md` §5 touchpoint table**, and overwrites any pre-existing entry for that operation (however it got there — hand-placed or `/speccraft.sync-swagger`-populated) if it conflicts with the approved LLD. The LLD always wins; see `IMPLEMENTATION-STAGE.md`.
- Consequence: `/speccraft.sync-swagger` can never cause a backend task to implement the wrong shape. At worst, a stale or since-changed live endpoint gets silently corrected the next time `/speccraft.implement` runs for that operation.

---

## Expected Command Behavior

1. Read `spec/architecture/API-CONTRACT-SOURCE.md`; resolve `<module>`'s configured Swagger URL
2. Fetch the live OpenAPI/Swagger spec from that URL
3. If the fetched spec is JSON, convert it to YAML
4. Read the existing `contracts/<module>/<module>.yaml`, if it exists
5. Merge: for each operation in the fetched spec, add it if new, update it if changed; leave any existing operation not present in the fetched spec untouched (never silently delete)
6. Write the merged result back to `contracts/<module>/<module>.yaml`
7. Report a summary: operations added, operations updated, operations left untouched (present before, absent from this fetch)

---

## Hard Boundary Rules

- must not run as a side effect of any other command or stage
- must not touch any file other than `contracts/<module>/<module>.yaml` and its own report output
- must not silently drop existing entries not present in the fetched spec
- must not treat its own output as binding over an approved `LLD-BACKEND-<id>.md` touchpoint table — `/speccraft.implement` always reconciles against the LLD, not against whatever `/speccraft.sync-swagger` last wrote

---

## Failure And Block Conditions

Stop and report when:

- `spec/architecture/API-CONTRACT-SOURCE.md` does not exist or has no entry for `<module>`
- the configured URL is unreachable or does not return a parseable OpenAPI/Swagger document
- the fetched spec cannot be converted to YAML

---

## Minimal Command Handoff

```text
Command: /speccraft.sync-swagger <module>
Swagger URL Resolved: yes / no
Fetch: succeeded / failed
Operations Added: <n>
Operations Updated: <n>
Operations Left Untouched: <n>
Current State: complete / blocked
Next Recommended Action:
```

---

## Exit Behavior

1. output the minimal command handoff block and the diff-style summary
2. STOP — no traceability shard append (this is a repo-wide convenience action, not a story/task-scoped stage; do not invent a traceability requirement for it)
3. do not chain into any other command

---

## Relationship To Other Documents

Read this document together with:

- `spec/architecture/API-CONTRACT-SOURCE.md` — the per-module Swagger URL source this command reads
- `spec/workflows/implementation/IMPLEMENTATION-STAGE.md` — the stage that owns `contracts/<module>/<module>.yaml` at implementation time; this command's output is always subordinate to it
- `spec/commands/speccraft.implement.md` — where the LLD-BACKEND touchpoint table always wins on conflict

Never referenced from: `spec/commands/speccraft.orchestrate.md` or any stage's Process Steps / Entry Conditions — this command is standalone and human-invoked only, same status as `/speccraft.scaffold`.
