# CR-changes

Change Request source files — the human-authored input to `/speccraft.change`, kept separate from original business specs in `spec/business/<module>/`.

## Naming Convention

`spec/business/cr-changes/<module>/CR-<STORY-ID>-<n>.md` — mirrored per business module (same convention as `spec/business/<module>/<STORY-ID>.md`), one file per Change Request, numbered per story starting at `1`.

A CR file must identify the target story (`<STORY-ID>`) and describe what deliberately changes or extends already-approved behavior — it is not a new story and not a defect-fix report. See the CR Eligibility Check in `spec/workflows/change-request/CHANGE-REQUEST-STAGE.md` for how a request is classified before `/speccraft.change` will act on it. See `CR-TEMPLATE.md` in this folder for the expected file structure.

Invoke with `/speccraft.change spec/business/cr-changes/<module>/CR-<STORY-ID>-<n>.md <STORY-ID>`.
