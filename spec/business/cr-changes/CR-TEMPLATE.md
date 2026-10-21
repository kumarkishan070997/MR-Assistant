# CR-<STORY-ID>-<n>: <short title>

Template for a Change Request source file. Copy to
`spec/business/cr-changes/<module>/CR-<STORY-ID>-<n>.md`, fill in, then invoke
`/speccraft.change spec/business/cr-changes/<module>/CR-<STORY-ID>-<n>.md <STORY-ID>`.

See the CR Eligibility Check in `spec/workflows/change-request/CHANGE-REQUEST-STAGE.md`
for how this gets classified before `/speccraft.change` acts on it — this file must
describe a deliberate change/extension to already-approved behavior on an existing
story, not a new story and not a defect-fix report.

---

## Target Story

`<STORY-ID>`

## Date

YYYY-MM-DD

## Requested By

Name / role

## Description Of Change

What deliberately changes or extends the already-approved behavior of this story.
Be specific enough that the CR Eligibility Check and the CR-3 discovery pass can
work from this alone.

## Reason

Why this change is needed now.

## Requirement/AC IDs Affected (optional hint)

Existing requirement/AC IDs this touches, if known. Not required — `/speccraft.change`
assigns new IDs during CR-5 regardless — but naming them here speeds up discovery.

## Expected Impact / Areas Touched (optional hint)

Companion file(s) (`LLD-FRONTEND-<id>.md` / `LLD-BACKEND-<id>.md`) or downstream
stories you expect this to reach. Not authoritative — the CR-3 walk determines
actual cascade — but useful context for the discovery pass.
