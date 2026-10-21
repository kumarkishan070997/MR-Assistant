# shared

Contains shared progress records that are not tied to one business story.

Scaffold status is split per layer — two independent scaffold runs, two independent statuses: `scaffold-frontend/STATUS.md` (frontend, `src-code-frontend/`) and `scaffold-backend/STATUS.md` (backend, `src-code-backend/`). Both are created at runtime by `/speccraft.scaffold frontend` / `/speccraft.scaffold backend` — neither exists until its scaffold run has happened.
