# TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3: Line-Anchored Private Scratchpads & Rehydration Engine

## Metadata
- **Task ID:** `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3`
- **Layer:** `frontend`
- **Title:** Line-Anchored Private Scratchpads & Dynamic Rehydration Engine
- **Source Requirement References:** `REQ-ANCHOR-04`, `REQ-ANCHOR-05`, `AC-ANCHOR-04`, `AC-ANCHOR-05`
- **Source LLD References:** `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` §4.1, §4.2, §5.2, §5.3, §5.4, §5.6, §6, §7, §10.2
- **Current State:** `approved`
- **Estimated Complexity:** `medium`
- **Dependencies:** `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1`

---

## Objective
Implement line-number hover pin triggers in diffs, table-safe `<tr><td colspan="100%">` row wrapper injection, the inline collapsible scratchpad component (`<anchor-scratchpad>`), debounced (300ms) persistence to `chrome.storage.local`, and the dynamic note rehydration engine (`NoteRehydrator`) tracking virtualized diff chunks and Turbo/SPA transitions.

---

## Scope

### In-Scope
- Line number hover pin icon injection into `td.blob-num` (GitHub) and `td.diff-line-num` (GitLab).
- Table-safe row injection utility `DiffTableInjector` inserting `<tr class="anchor-scratchpad-row"><td colspan="100%"><anchor-scratchpad></td></tr>` directly below the target line row.
- Inline collapsible scratchpad component `src/components/diff/scratchpad-row.ts` (`<anchor-scratchpad>`):
  - Markdown editor support (bold, lists, code blocks) using `marked` + `DOMPurify`.
  - Auto-debounced (300ms) save handler writing to `notes.store.ts` (`$activeNotes`) and `chrome.storage.local`.
  - Unique storage key structure: `{platform}_{owner_or_namespace}_{repo}_{pr_or_mr_id}_{file_path}_{line_number}`.
  - Collapsed/expanded state toggle with persistent preference.
- Dynamic note rehydration engine `src/services/note-rehydrator.ts`:
  - `MutationObserver` on diff containers batched via `requestAnimationFrame` with `scheduler.yield()`.
  - Scans newly attached DOM diff rows against the local storage index for the current review session.
  - Re-injects pin markers and restores expanded scratchpads without duplicating elements.
- Unit tests for debounced storage saving and markdown sanitization.

### Out-Of-Scope
- Checklist drawer aggregation and comment promotion (covered in Task T4).
- Base branch symbol search (covered in Task T2).

---

## Impacted Areas
- `src/components/diff/scratchpad-row.ts` [NEW]
- `src/services/diff-table-injector.ts` [NEW]
- `src/services/note-rehydrator.ts` [NEW]
- `src/services/storage.service.ts` [NEW]
- `src/stores/notes.store.ts` [NEW]
- `tests/storage-service.test.ts` [NEW]
- `tests/markdown-sanitize.test.ts` [NEW]

---

## Edge Cases To Preserve
- **HTML Table Integrity:** Injected rows must never break host table layout, borders, or diff alignment across Unified and Split diff modes.
- **Scroll Performance (60 FPS):** `MutationObserver` callbacks must be throttled with `requestAnimationFrame` and cooperative chunking to ensure rapid scrolling on 2,000+ line diffs does not drop frames.
- **Dynamic File Expansion:** Rehydrate notes when previously collapsed or lazily loaded diff cards are expanded by the user.

---

## Architecture Constraints
- Must adhere to `AD-FRONTEND-002` (Lit Web Components), `AD-FRONTEND-003` (Constructable Stylesheets), `AD-FRONTEND-004` (Nano Stores + Chrome Storage), and `AD-FRONTEND-005` (Marked + DOMPurify).
- Unmounted diff rows must cleanly fire `disconnectedCallback()` to destroy listeners and prevent memory leaks.

---

## Expected Evidence & Test Expectations
- Vitest unit test confirming debounced persistence fires exactly once after a 300ms idle window.
- Unit tests validating `DOMPurify` XSS defense (stripping `<script>`, `onerror`, and invalid protocols).
- Vitest tests verifying storage key generation across complex GitLab sub-group paths.
