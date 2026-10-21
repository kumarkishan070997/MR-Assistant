# Traceability Shard: SRS-EXT-ANCHOR-001

## Metadata
- **Story ID:** `SRS-EXT-ANCHOR-001`
- **Module:** `context-anchor`
- **Layer Scope:** `frontend`
- **Status:** `completed`
- **Last Updated:** `2026-10-20`

---

## Business Spec to LLD

| Layer | REQ-ID | AC-ID | LLD Document | LLD Section | Status | Source | Notes |
|---|---|---|---|---|---|---|---|
| frontend | REQ-ANCHOR-01 | AC-ANCHOR-01 | `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` | §5.1, §5.4, §5.5, §6 | approved | original | Multi-platform PAT configuration & dynamic host permissions |
| frontend | REQ-ANCHOR-02 | AC-ANCHOR-02 | `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` | §4.2, §5.2, §5.6, §7 | approved | original | In-diff hover/selection trigger with symbol sanitization |
| frontend | REQ-ANCHOR-03 | AC-ANCHOR-03 | `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` | §4.2, §5.4, §5.5, §10.3 | approved | original | Cross-reference results drawer with session caching |
| frontend | REQ-ANCHOR-04 | AC-ANCHOR-04 | `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` | §5.2, §5.3, §5.4, §10.2 | approved | original | Line-anchored private scratchpad table row injection & 300ms debounce |
| frontend | REQ-ANCHOR-05 | AC-ANCHOR-05 | `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` | §4.1, §5.1, §6, §7 | approved | original | Note rehydration across dynamic Turbo / SPA diff chunk rendering |
| frontend | REQ-ANCHOR-06 | AC-ANCHOR-06 | `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` | §4.2, §5.2, §5.4, §7 | approved | original | Review checklist dock button & drawer with smooth scroll to line |
| frontend | REQ-ANCHOR-07 | AC-ANCHOR-07 | `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` | §4.1, §5.5, §6 | approved | original | Promote private note to native GitHub review / GitLab discussion comment |
| frontend | REQ-ANCHOR-08 | AC-ANCHOR-08 | `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` | §4.2, §5.5, §6, §10.1 | approved | original | Regex declaration scanner & automated blast radius counter badge |

---

## LLD to Tasks

| Layer | LLD Section | Task ID | Scope Summary | Status |
|---|---|---|---|---|
| frontend | §4.2, §5.1, §5.4, §5.5, §6, §7 | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1` | Platform Adapters, Lifecycle Manager & Settings Popup | approved |
| frontend | §4.2, §5.2, §5.3, §5.4, §5.5, §5.6, §7, §10.3 | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2` | In-Diff Symbol Selection & Cross-Reference Drawer | approved |
| frontend | §4.1, §4.2, §5.2, §5.3, §5.4, §5.6, §6, §7, §10.2 | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3` | Line-Anchored Private Scratchpads & Dynamic Rehydration Engine | approved |
| frontend | §4.1, §4.2, §5.2, §5.4, §5.5, §6, §7 | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4` | Review Checklist Drawer & Native Comment Promotion | approved |
| frontend | §4.2, §5.5, §6, §7, §10.1 | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5` | Automated Declaration Scanner & Blast Radius Risk Indicator | approved |

---

## Tasks to Code

| Layer | Task ID | Target Files | Status |
|---|---|---|---|
| frontend | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1` | `src/adapters/*`, `src/services/lifecycle-manager.ts`, `src/stores/settings.store.ts`, `src/entrypoints/popup/*` | approved |
| frontend | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2` | `src/components/diff/symbol-trigger.ts`, `src/components/drawers/results-drawer.ts`, `src/components/overlay/overlay-root.ts`, `src/services/symbol-sanitizer.ts`, `src/services/search-cache.service.ts`, `src/entrypoints/content.ts` | approved |
| frontend | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3` | `src/components/diff/scratchpad-row.ts`, `src/services/diff-table-injector.ts`, `src/services/note-rehydrator.ts`, `src/services/storage.service.ts`, `src/services/markdown.service.ts`, `src/stores/notes.store.ts` | approved |
| frontend | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4` | `src/components/drawers/checklist-dock.ts`, `src/components/drawers/checklist-drawer.ts`, `src/components/overlay/overlay-root.ts`, `src/adapters/github.adapter.ts`, `src/adapters/gitlab.adapter.ts` | approved |
| frontend | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5` | `src/services/declaration-scanner.ts`, `src/services/query-queue.service.ts`, `src/components/diff/blast-badge.ts`, `src/services/note-rehydrator.ts` | approved |

---

## Code to Tests

| Layer | Code Unit | Test File | Test Type | Status |
|---|---|---|---|---|
| frontend | Platform Adapters & Settings | `tests/adapters.test.ts`, `tests/settings.test.ts` | unit | passed |
| frontend | Symbol Trigger & Cache | `tests/symbol-sanitizer.test.ts`, `tests/search-cache.test.ts` | unit | passed |
| frontend | Scratchpad & Rehydration | `tests/storage-service.test.ts`, `tests/markdown-sanitize.test.ts` | unit | passed |
| frontend | Checklist & Comment Promoter | `tests/comment-promoter.test.ts` | unit | passed |
| frontend | Declaration Scanner & Badges | `tests/declaration-scanner.test.ts`, `tests/blast-badge.test.ts` | unit | passed |

---

## Unit Tests to Integration Tests

| Layer | Unit Test File | Integration Test File | Status | Notes |
|---|---|---|---|---|
| frontend | n/a | n/a | n/a | n/a (frontend task — 4-link chain) |

---

## Coverage Matrix

| Layer | REQ-ID | AC-ID | LLD Mapped | Task Mapped | Code Mapped | Unit Test Mapped | Integration Test Mapped |
|---|---|---|---|---|---|---|---|
| frontend | REQ-ANCHOR-01 | AC-ANCHOR-01 | Yes | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1` | Yes | Yes (10/10 passed) | n/a (frontend task) |
| frontend | REQ-ANCHOR-02 | AC-ANCHOR-02 | Yes | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2` | Yes | Yes (15/15 passed) | n/a (frontend task) |
| frontend | REQ-ANCHOR-03 | AC-ANCHOR-03 | Yes | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2` | Yes | Yes (5/5 passed) | n/a (frontend task) |
| frontend | REQ-ANCHOR-04 | AC-ANCHOR-04 | Yes | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3` | Yes | Yes (4/4 passed) | n/a (frontend task) |
| frontend | REQ-ANCHOR-05 | AC-ANCHOR-05 | Yes | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3` | Yes | Yes (10/10 passed) | n/a (frontend task) |
| frontend | REQ-ANCHOR-06 | AC-ANCHOR-06 | Yes | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4` | Yes | Yes (4/4 passed) | n/a (frontend task) |
| frontend | REQ-ANCHOR-07 | AC-ANCHOR-07 | Yes | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4` | Yes | Yes (4/4 passed) | n/a (frontend task) |
| frontend | REQ-ANCHOR-08 | AC-ANCHOR-08 | Yes | `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5` | Yes | Yes (18/18 passed) | n/a (frontend task) |

---

## Traceability Metrics

- **Requirements Total:** 8
- **Requirements Covered by LLD:** 8 (100%)
- **Requirements Covered by Tasks:** 8 (100%)
- **Requirements Implemented:** 8 / 8 (100%)
- **AC Total:** 8
- **AC Covered by Tasks:** 8 (100%)
- **AC Tested:** 8 / 8 (100%)
- **Tasks Emitted:** 5 (Frontend: 5, Backend: 0)
- **Unmapped Requirements:** 0

### Workflow Metrics Log

| Story ID | Command | Stage | Date | Model | Duration (min) | Input Tok (est.) | Output Tok (est.) | Artifacts | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `SRS-EXT-ANCHOR-001` | `/speccraft.scaffold frontend` | Scaffold | 2026-10-20 | Gemini 3.8 Flash | 5 | ~15000 | ~4000 | `src-code-frontend/` | approved | Scaffolding complete |
| `SRS-EXT-ANCHOR-001` | `/speccraft.implement T1` | Implementation | 2026-10-20 | Gemini 3.8 Flash | 8 | ~22000 | ~6500 | `src/adapters/*`, `src/stores/*`, `popup/*` | approved | T1 implemented & tested |
| `SRS-EXT-ANCHOR-001` | `/speccraft.implement T2` | Implementation | 2026-10-20 | Gemini 3.8 Flash | 8 | ~24000 | ~7000 | `src/components/*`, `src/services/*`, `content.ts` | approved | T2 implemented & tested |
| `SRS-EXT-ANCHOR-001` | `/speccraft.implement T3` | Implementation | 2026-10-20 | Gemini 3.8 Flash | 10 | ~27000 | ~7500 | `src/components/diff/*`, `src/services/*`, `stores/notes.store.ts` | approved | T3 implemented & tested |
| `SRS-EXT-ANCHOR-001` | `/speccraft.implement T4` | Implementation | 2026-10-20 | Gemini 3.8 Flash | 8 | ~26000 | ~7000 | `src/components/drawers/checklist-*`, `tests/comment-promoter.test.ts` | approved | T4 implemented & tested |
| `SRS-EXT-ANCHOR-001` | `/speccraft.implement T5` | Implementation | 2026-10-20 | Gemini 3.8 Flash | 8 | ~28000 | ~7500 | `src/services/declaration-scanner.ts`, `src/components/diff/blast-badge.ts` | approved | T5 implemented & tested |
| `SRS-EXT-ANCHOR-001` | `/speccraft.validate` | Validation | 2026-10-20 | Gemini 3.8 Flash | 5 | ~22000 | ~5500 | `spec/verification/context-anchor/SRS-EXT-ANCHOR-001/VERIFICATION.md` | done | Story 100% validated (4-link chain) |

---

## Conflict Decisions

| Decision ID | Layer | Description | Outcome | Date |
|---|---|---|---|---|
| None | frontend | No conflicts encountered during LLD intake or creation | Accepted | 2026-10-20 |
