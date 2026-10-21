# tasks

Contains delivery-ready planning outputs (approved task packets from decomposition).

Mirrored per business module: `spec/business/<module>/<STORY-ID>.md` -> `spec/tasks/<module>/TASK-<STORY-ID>-FRONTEND-T<n>.md` / `TASK-<STORY-ID>-BACKEND-T<n>.md`. No per-story subfolder, no `tasks/` subfolder — module folders and task files are created on demand by `/speccraft.decompose`. Every task file carries a mandatory `Layer: frontend|backend` field in addition to the `-FRONTEND-`/`-BACKEND-` filename tag — belt-and-suspenders so a rename typo can't silently misroute execution. One story's frontend and backend tasks live side by side in the same flat module folder and are reviewed together in one decomposition pass.
