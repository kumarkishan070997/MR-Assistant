# lld

Place generated or approved LLD artifacts here.

These are planning outputs derived from business specs and reviewed before decomposition.

Mirrored per business module: `spec/business/<module>/<STORY-ID>.md` -> `spec/lld/<module>/LLD-FRONTEND-<STORY-ID>.md` + `spec/lld/<module>/LLD-BACKEND-<STORY-ID>.md` — one linked pair per story, produced together by `/speccraft.tech-design`. No per-story subfolder — module folders and LLD files are created on demand. Each LLD has a "Companion LLD Reference" section naming its pair and any cross-layer contract dependency.
