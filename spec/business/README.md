# business

Place approved business specifications here.

AI-first operational flow should begin from business specs in this folder and move through the workflow stages until approved task creation.

Still one spec per story — the frontend/backend split does not change intake. LLD Creation reads the single approved spec once and fans it out into two companion LLDs (`LLD-FRONTEND-<STORY-ID>.md` + `LLD-BACKEND-<STORY-ID>.md`), both citing the same Req IDs produced from this one file.

Deliberate changes to an already-approved story's behavior go through `cr-changes/<module>/CR-<STORY-ID>-<n>.md` and `/speccraft.change` instead of a new business spec here — see `spec/business/cr-changes/README.md`.

## Naming Convention

`spec/business/<module>/<STORY-ID>.md` — one file per story, mirrored per business module.

## Template

Copy the block below into `spec/business/<module>/<STORY-ID>.md` and fill it in. Keep it business language — no framework names, no component names, no schema design; that's LLD's job. REQ-IDs and AC-IDs must be stable and traceable — intake (`/speccraft.tech-design`) reuses them as-is across frontend and backend LLDs, so never renumber once assigned.

```markdown
# <STORY-ID> — <Short Title>

## 1. Summary

1–3 sentences: what this story delivers and why. No design, no implementation detail.

## 2. Scope

**In scope:**
- ...

**Out of scope:**
- ...

## 3. Requirements

| REQ-ID | Description | Notes |
|---|---|---|
| REQ-<STORY-ID>-01 | ... | ... |

## 4. Acceptance Criteria

| AC-ID | REQ-ID | Given / When / Then | Notes |
|---|---|---|---|
| AC-<STORY-ID>-01 | REQ-<STORY-ID>-01 | Given ... When ... Then ... | ... |

## 5. Edge Cases

- ...

## 6. Dependencies

- **Depends On:** `<STORY-ID>` (or `None`)
- **External systems / data / APIs this story relies on:** ...

## 7. Non-Functional Notes (optional)

Only fill in with explicit performance/security/accessibility/compliance asks. Otherwise: `Not specified` — do not invent NFRs.

## 8. Open Questions

- ...
```
