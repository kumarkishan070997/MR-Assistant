# TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4: Review Checklist Drawer & Native Comment Promotion

## Metadata
- **Task ID:** `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4`
- **Layer:** `frontend`
- **Title:** Review Checklist Drawer & Native Comment Promotion
- **Source Requirement References:** `REQ-ANCHOR-06`, `REQ-ANCHOR-07`, `AC-ANCHOR-06`, `AC-ANCHOR-07`
- **Source LLD References:** `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` §4.1, §4.2, §5.2, §5.4, §5.5, §6, §7
- **Current State:** `approved`
- **Estimated Complexity:** `medium`
- **Dependencies:** `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3`

---

## Objective
Implement the fixed dock counter button (`<anchor-checklist-dock>`), the aggregated review checklist sidebar drawer (`<anchor-checklist-drawer>`) with smooth scrolling to lines, and the "Promote to Comment" action automating the triggering and population of native GitHub/GitLab review comment forms (`.js-add-line-comment` / `.js-add-diff-note-button`).

---

## Scope

### In-Scope
- Floating dock counter button `src/components/drawers/checklist-dock.ts` (`<anchor-checklist-dock>`):
  - Fixed in the bottom-right corner displaying active note count (`Anchored Notes (5)`).
  - Listens reactively to `$activeNotes` store updates.
- Aggregated Review Checklist Drawer `src/components/drawers/checklist-drawer.ts` (`<anchor-checklist-drawer>`):
  - Mounted inside `<anchor-overlay-root>` under `document.body` with Shadow DOM style isolation.
  - Groups notes by file path with line numbers and preview text.
  - Clicking any note smoothly scrolls the main viewport to that exact diff line (triggering host card expansion if collapsed).
  - Actions per note: "Delete", "Mark Completed/Checked", "Copy as Markdown".
- "Promote to Comment" integration:
  - Invokes `IPlatformAdapter.triggerNativeComment(line, text)`.
  - Simulates click on native comment button (`.js-add-line-comment` on GitHub, `.js-add-diff-note-button` on GitLab).
  - Locates the injected native textarea, populates the stored note markdown, dispatches input events, and marks the note as "Transferred".
- Cross-context synchronization ensuring note edits in the checklist drawer instantly reflect in inline scratchpad rows (and vice versa).

### Out-Of-Scope
- Directly posting comments via REST API (users review and submit through the native host UI).
- AST blast radius indicators (covered in Task T5).

---

## Impacted Areas
- `src/components/drawers/checklist-dock.ts` [NEW]
- `src/components/drawers/checklist-drawer.ts` [NEW]
- `src/adapters/github.adapter.ts` [MODIFY — implement triggerNativeComment]
- `src/adapters/gitlab.adapter.ts` [MODIFY — implement triggerNativeComment]
- `tests/comment-promoter.test.ts` [NEW]

---

## Edge Cases To Preserve
- **Native Comment Form Delay:** Await the appearance of the native textarea in the DOM with a timeout guard after clicking the native trigger button.
- **Scroll Alignment on Split Diffs:** Ensure `scrollIntoView({ behavior: 'smooth', block: 'center' })` correctly brings target split diff rows into view.
- **Store Sync:** Deleting a note in the drawer must immediately remove the corresponding inline scratchpad row in the diff.

---

## Architecture Constraints
- Must adhere to `AD-FRONTEND-002` (Lit Web Components), `AD-FRONTEND-003` (Constructable Stylesheets), and `AD-FRONTEND-004` (Nano Stores reactivity).
- All drawer UI must be isolated in Shadow DOM to prevent interference from host CSS.

---

## Expected Evidence & Test Expectations
- Vitest unit tests verifying note grouping logic, Markdown export formatting, and store deletion events.
- Unit tests mocking DOM textarea injection and synthetic `input` event dispatching.
