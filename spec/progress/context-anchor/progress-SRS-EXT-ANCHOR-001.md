# Progress — SRS-EXT-ANCHOR-001

## Intake

- **Work Item ID:** `SRS-EXT-ANCHOR-001`
- **Business Spec Source:** [`spec/business/context-anchor/SRS-EXT-ANCHOR-001.md`](file:///c:/RSPL/MRdiff/spec/business/context-anchor/SRS-EXT-ANCHOR-001.md)
- **Scope Summary:** Manifest V3 dual-platform (GitHub & GitLab) Chrome Extension delivering in-diff symbol cross-referencing, blast radius estimation, and private line-anchored scratchpads without leaving the code review interface.
- **Requirement IDs:** `REQ-ANCHOR-01` through `REQ-ANCHOR-08` (stable, spec-origin).
- **Acceptance Criteria IDs:** `AC-ANCHOR-01` through `AC-ANCHOR-08` (stable, spec-origin).
- **Architecture Assessment:**
  - Routing & Host Lifecycle: Applicable (Turbo/PJAX for GitHub, Vue Router / page lifecycle for GitLab).
  - Module & Injection: Applicable (Table-safe `<tr><td colspan="100%">` wrappers for scratchpads, body overlays for drawers).
  - Rendering & Styles: Applicable (Lit 3.x Web Components, Shadow DOM, Tailwind v4 constructable stylesheets).
  - Data & Storage: Applicable (Nano Stores, `chrome.storage.local` with 300ms debounce, in-memory search cache).
- **Gaps & Open Questions:** None blocking. Concurrency limit (max 2 queries) and viewport gating resolve search API rate limit concerns.
- **Intake State:** `approved`
- **Date:** 2026-10-20

---

## LLD

### Frontend — LLD-FRONTEND-SRS-EXT-ANCHOR-001

- **Artifact:** [`spec/lld/context-anchor/LLD-FRONTEND-SRS-EXT-ANCHOR-001.md`](file:///c:/RSPL/MRdiff/spec/lld/context-anchor/LLD-FRONTEND-SRS-EXT-ANCHOR-001.md)
- **Layer:** `frontend`
- **Status:** `approved`
- **Date:** 2026-10-20
- **Summary:** Complete 14-section Low-Level Design covering platform adapter abstraction (`IPlatformAdapter`), table-safe diff DOM injection, constructable stylesheets (`adoptedStyleSheets`), atomic reactive state with Nano Stores, direct-to-host REST queries with session caching, 60 FPS MutationObserver batching with `scheduler.yield()`, and full error mapping.
- **Coverage:** 8 / 8 requirements (100% coverage).
- **Open Questions / Assumptions:** Authenticated GitHub users receive 30 queries/minute; search calls throttled with concurrency guard; `chrome.storage.local` provides sufficient 10MB quota for private notes.

---

## Decomposition

- **Status:** `approved`
- **Date:** 2026-10-20
- **Tasks Emitted:** 5 delivery tasks (`spec/tasks/context-anchor/`):
  1. `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1`: Platform Adapters, Lifecycle Manager & Settings Popup (medium)
  2. `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2`: In-Diff Symbol Selection & Cross-Reference Drawer (medium)
  3. `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3`: Line-Anchored Private Scratchpads & Dynamic Rehydration Engine (medium)
  4. `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4`: Review Checklist Drawer & Native Comment Promotion (medium)
  5. `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5`: Automated Declaration Scanner & Blast Radius Risk Indicator (medium)
- **Dependency Flow:** T1 -> [T2, T3, T5]; T3 -> T4.

---

## Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1

### Status
`approved` (Passed Implementation Review Gate)

### Implementation
- Implemented `IPlatformAdapter` interface in `src/adapters/base.adapter.ts`.
- Implemented `GitHubAdapter` in `src/adapters/github.adapter.ts` handling GitHub PR URLs, context extraction, Turbo events, and rate-limit inspection.
- Implemented `GitLabAdapter` in `src/adapters/gitlab.adapter.ts` handling GitLab SaaS and self-hosted domains with custom host matching.
- Implemented `PageLifecycleManager` in `src/services/lifecycle-manager.ts` tracking SPA page navigation with clean observer teardown.
- Implemented `settings.store.ts` using Nano Stores with bidirectional `chrome.storage.local` persistence.
- Built Settings Popup UI (`index.html`, `popup.css`, `main.ts`) featuring token inputs, connection testing, rate limit badge, and dynamic `chrome.permissions.request()` prompt for self-hosted instances.

### Testing
- `tests/adapters.test.ts`: 6 unit tests passing (GitHub & GitLab URL detection, context extraction, diff table row injection).
- `tests/settings.test.ts`: 2 unit tests passing (storage load and save).
- `tests/baseline.test.ts`: 2 unit tests passing.
- Total test count: 10 passed (100% pass rate).

### Validation
- WXT build completed successfully in 2.09s (`wxt build`).
- Production bundle size: 60.01 kB.

### Blockers
None.

### Decisions
Dynamic host permission prompts are invoked synchronously inside the test connection button click event handler to ensure valid user gesture context in Chrome.

---

## Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2

### Status
`approved` (Passed Implementation Review Gate)

### Implementation
- Implemented `sanitizeSymbol()` in `src/services/symbol-sanitizer.ts`:
  - Strips leading & trailing syntax sigils (`$`, `->`, `::`, `#`, quotes, parentheses, brackets, colons).
  - Normalizes dotted/arrow/static scope access to target method/property name.
  - Filters common language keywords across JavaScript, TypeScript, PHP, Python, and Go.
  - Rejects pure numbers, empty strings, single-character tokens, and tokens exceeding 80 characters.
- Implemented `SearchCacheService` in `src/services/search-cache.service.ts`:
  - Canonical key scheme: `{platform}:{projectPath}@{ref}:{symbol}` (case-normalized).
  - 15-minute default TTL with automatic cache expiration and eviction.
  - In-memory Map supporting fast lookup, deletion, and size reporting.
- Implemented `<anchor-symbol-trigger>` in `src/components/diff/symbol-trigger.ts`:
  - Floating Web Component extending `AnchorBaseElement` with Shadow DOM isolation.
  - Fixed-position viewport anchoring above or below the active selection.
  - Dispatches composed `anchor-symbol-lookup` custom event upon user click.
- Implemented `<anchor-results-drawer>` in `src/components/drawers/results-drawer.ts`:
  - 440px slide-out right drawer with backdrop click-to-dismiss.
  - Shimmer loading state during REST API execution.
  - Search hit grouping by file path, displaying line numbers and highlighted code snippets.
  - Deep links open target branch file and line in a new background browser tab (`_blank`).
  - Graceful handling of GitHub (403) and GitLab (429) rate limit responses with actionable user guidance.
- Implemented `<anchor-overlay-root>` in `src/components/overlay/overlay-root.ts`:
  - Top-level container mounted directly to `document.body` to avoid diff card `overflow: hidden` clipping.
  - Orchestrates trigger visibility, cache lookups, token retrieval, and platform adapter REST queries.
- Wired `src/entrypoints/content.ts`:
  - Initializes `PageLifecycleManager` and mounts `<anchor-overlay-root>`.
  - Captures `mouseup` on diff code containers (`.blob-code-inner`, `.line_content`, `[data-tag="diff"]`).
  - Positions trigger at selection bounding rect coordinates.

### Testing
- `tests/symbol-sanitizer.test.ts`: 15 unit tests passing (JS/TS, PHP, Python, Go, and edge case guardrails).
- `tests/search-cache.test.ts`: 5 unit tests passing (key canonicalization, cache hits, misses, TTL expiry, cache clearing).
- Total test count across suite: 30 passed (100% pass rate).

### Validation
- WXT build completed successfully in 3.01s (`wxt build`).
- Total production bundle size: 94.8 kB (including `content.js` at 48.83 kB).

### Blockers
None.

### Decisions
Overlay root and floating action trigger use fixed viewport coordinates rather than page scroll offsets to ensure stability during dynamic diff scrolling and collapsible file expansions.

---

## Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3

### Status
`approved` (Passed Implementation Review Gate)

### Implementation
- Implemented `notes.store.ts` (`$activeNotes` atom):
  - Canonical key generator `buildNoteKey()` handling complex platform, repo, PR, and sub-group file paths.
  - Typed `LineNote` data model with content, collapse state, and promotion tracking.
- Implemented `StorageService` in `src/services/storage.service.ts`:
  - Debounced (300ms) persistence bridge writing to `chrome.storage.local` under `"review_sessions"`.
  - Immediate in-memory atom updates to keep typing responsiveness sub-50ms.
  - Contextual filtering loader `loadNotesForReview()` scoping storage reads strictly to the current PR/MR.
- Implemented `renderSanitizedMarkdown()` in `src/services/markdown.service.ts`:
  - Synchronous `marked` markdown parsing.
  - Strict `DOMPurify` HTML sanitization whitelisting safe text tags and neutralizing XSS, inline scripts, event handlers (`onerror`), and dangerous URI schemes (`javascript:`).
- Implemented `<anchor-scratchpad>` in `src/components/diff/scratchpad-row.ts`:
  - Lit custom element extending `AnchorBaseElement` with Shadow DOM isolation.
  - Three editing modes: Split (side-by-side textarea + live preview), Write only, and Preview only.
  - Real-time debounced auto-saving (300ms) with visual status badges (`Saving...`, `Saved locally`).
  - Expand/collapse toggle preserving user preference.
  - Action buttons for note deletion and "Promote to Comment" event dispatching.
- Implemented `DiffTableInjector` in `src/services/diff-table-injector.ts`:
  - Injects hoverable pin button into `td.blob-num` (GitHub) and `td.diff-line-num` (GitLab).
  - Inserts table-safe `<tr class="anchor-scratchpad-row"><td colspan="100%"><anchor-scratchpad></td></tr>` directly beneath target line row.
  - Toggles row display on pin button click and removes row cleanly on note deletion.
- Implemented `NoteRehydrator` in `src/services/note-rehydrator.ts`:
  - `MutationObserver` on diff containers tracking newly added virtualized or expanded diff chunks.
  - Cooperative batch scheduling with `requestAnimationFrame` and `scheduler.yield()` / micro-delay chunking (40 rows/batch) to sustain 60 FPS scrolling on 2,000+ line diffs.
  - Automatically re-attaches pin icons and rehydrates saved active notes without duplicating DOM elements.
- Wired `src/entrypoints/content.ts` to boot `NoteRehydrator` on page navigation.

### Testing
- `tests/storage-service.test.ts`: 4 unit tests passing (canonical keys across sub-group paths, 300ms debounce idle verification, deletion, and context filtering).
- `tests/markdown-sanitize.test.ts`: 10 unit tests passing (headings, lists, code fences, XSS scripts, inline handlers, javascript: URIs, iframes, embed/object stripping, whitespace).
- Total test count across suite: 44 passed (100% pass rate).

### Validation
- WXT production build completed successfully in 2.43s (`wxt build`).
- Total production bundle size: 185.33 kB (`content.js` 139.12 kB including Marked & DOMPurify).

### Blockers
None.

### Decisions
DiffTableInjector injects full `colspan="100%"` wrapper rows beneath the line row to maintain HTML table specification compliance and avoid corrupting diff column alignments in both Unified and Split diff layouts.

---

## Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4

### Status
`approved` (Passed Implementation Review Gate)

### Implementation
- Implemented `<anchor-checklist-dock>` in `src/components/drawers/checklist-dock.ts`:
  - Fixed-position pill button in bottom-right corner displaying active note count (`Anchored Notes (5)`).
  - Listens reactively to `$activeNotes` store via `StoreController` (auto-hides when count is 0).
  - Dispatches composed `anchor-toggle-checklist` custom event on click.
- Implemented `<anchor-checklist-drawer>` in `src/components/drawers/checklist-drawer.ts`:
  - Slide-out panel from the right edge with Shadow DOM isolation.
  - Groups notes by file path with line numbers and preview snippets.
  - Clicking any note or line badge smoothly scrolls the main viewport to the target row (`scrollIntoView({ behavior: 'smooth', block: 'center' })`), auto-expands collapsed file cards, and flash-highlights the line.
  - Markdown summary export button formatting all review notes with file and line links for one-click clipboard copying.
  - Note actions: jump to line, copy markdown, promote to native comment form, and delete.
- Implemented `triggerNativeComment()` in `GitHubAdapter` and `GitLabAdapter`:
  - Locates native line comment button (`.js-add-line-comment` on GitHub, `.js-add-diff-note-button` on GitLab) and simulates click.
  - Polls with timeout guard for the native textarea, populates stored markdown text, dispatches synthetic `input` event, and focuses the field.
  - Updates note status to `promoted: true` in store and `chrome.storage.local`.
- Integrated dock, drawer, and comment promotion event dispatchers in `<anchor-overlay-root>`.

### Testing
- `tests/comment-promoter.test.ts`: 4 unit tests passing (note clustering by file, GitHub button triggering & textarea population, GitLab note button triggering, missing button handling).
- Total test count across suite: 48 passed (100% pass rate across 8 test files).

### Validation
- WXT production build completed successfully in 2.11s (`wxt build`).
- Total production bundle size: 203.97 kB (`content.js` 157.76 kB).

### Blockers
None.

### Decisions
Comment promotion prepares and populates the native comment form but leaves the final submission to the reviewer, ensuring the human reviewer maintains final authority over public review comments.

---

## Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5

### Status
`done` (Passed Implementation Review Gate & Final Validation)

### Implementation
- Implemented `detectDeclaration()` in `src/services/declaration-scanner.ts`:
  - Language inference by file extension (`inferLanguage()`) for PHP, TypeScript, JavaScript, Python, and Go.
  - Regex AST declaration signature detection: PHP functions/classes/traits/interfaces, TS/JS async/arrow/standard functions & classes, Python def/class, Go func/receiver methods & type struct.
  - Strips diff prefixes (`+`, `-`), ignores full-line comments (`//`, `#`, `/*`, `*`), and filters trailing inline comments.
- Implemented `QueryQueue` in `src/services/query-queue.service.ts`:
  - Strictly enforces max concurrency limit of 2 concurrent API search queries.
  - In-flight request deduplication avoiding duplicate queries for the same symbol.
  - Rate-limit pause/backoff guardrails catching 403 (GitHub) and 429 (GitLab) errors.
- Implemented `<anchor-blast-badge>` in `src/components/diff/blast-badge.ts`:
  - Lit custom element extending `AnchorBaseElement` with Shadow DOM isolation.
  - Three color-coded impact tiers: Low (<= 2 files, neutral gray), Medium (3-9 files, amber/yellow), High (10+ files, red badge `Used in N files - High Blast Radius`).
  - Hover preview tooltip showing top referenced file paths.
  - Click-through navigation opening the Cross-Reference Results Drawer for deep exploration.
  - `IntersectionObserver` with 200px root margin to defer lookup execution until line scrolls near the viewport.
- Wired declaration scanning into `NoteRehydrator.processSingleRow()` to automatically attach badges to modified declaration lines.

### Testing
- `tests/declaration-scanner.test.ts`: 12 unit tests passing (language inference, PHP, TS/JS, Python, Go, and comment/noise rejection).
- `tests/blast-badge.test.ts`: 6 unit tests passing (max-2 concurrency, request deduplication, rate limiting, and color tier thresholds).
- Total test count across suite: 66 passed (100% pass rate across 10 test files).

### Validation
1. **Task Identification**: `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5`, "Automated Declaration Scanner & Blast Radius Risk Indicator", `Layer: frontend`. LLD references: `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` §4.2, §5.5, §6, §7, §10.1. Requirement references: `REQ-ANCHOR-08`, `AC-ANCHOR-08`.
2. **Inputs Checked**:
   - Architecture references: `AD-FRONTEND-001` (WXT), `AD-FRONTEND-002` (Lit Web Components), `AD-FRONTEND-003` (Tailwind & Constructable Stylesheets), `AD-X-001` (Direct-to-host REST), `AD-X-002` (Zero Telemetry), `AD-X-003` (4-Link Traceability).
   - Implementation review: `approved` (human gate approval confirmed).
   - Unit tests review: `approved` (18/18 tests passing for T5 scope, 66/66 suite-wide).
   - Integration tests: `n/a` (frontend task — 4-link chain).
3. **AC Coverage Table**:
   | AC-ID | Criterion | Unit Test Reference | Integration Test Reference | Status |
   |---|---|---|---|---|
   | `AC-ANCHOR-08` | AST declaration regex scanner detecting modified functions/classes across PHP, TS/JS, Python, Go with concurrency limit 2 and color-coded risk badge (<=2 gray, 3-9 amber, >=10 red) | `tests/declaration-scanner.test.ts` (12 tests), `tests/blast-badge.test.ts` (6 tests) | n/a (frontend task) | pass |
4. **Architecture Conformance**: `compliant`. Shadow DOM style encapsulation strictly preserved via `AnchorBaseElement`, REST queries routed direct-to-host, 200px viewport gating via `IntersectionObserver`, concurrency throttled to max 2 simultaneous queries.
5. **Traceability Chain**:
   - `REQ-ANCHOR-08` → `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` (§4.2, §5.5, §6, §7, §10.1): `present`
   - `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` → `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5`: `present`
   - `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5` → `src/services/declaration-scanner.ts`, `src/services/query-queue.service.ts`, `src/components/diff/blast-badge.ts`: `present`
   - Code → `tests/declaration-scanner.test.ts`, `tests/blast-badge.test.ts`: `present`
   - **4-Link Chain Completeness**: 4 / 4 links `present` (100%).
6. **Issues Found**: None.
7. **Validation Outcome**: `approved` (All acceptance criteria pass, 4-link traceability intact, production build passes).
8. **Required Actions**: Mark task `done`, record validation metrics, finalize story traceability shard.

### Blockers
None.

### Decisions
Integrated `IntersectionObserver` with a 200px root margin on each blast badge element so that massive PRs with dozens of modified functions do not queue REST queries for off-screen lines until the user scrolls into their vicinity.

---

## Story Final Validation

### Summary
Story `SRS-EXT-ANCHOR-001` ("PR / MR Context Anchor Chrome Extension") has completed all 5 delivery tasks across the pure frontend layer scope. All 8 business requirements and 8 acceptance criteria are fully implemented, verified, and mapped across the complete 4-link traceability chain.

### Cumulative Verification Overview
- **Tasks Completed**: 5 / 5 (`TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1` through `T5`) — all marked `done`.
- **Test Suite**: 10 test files, 66 unit tests passing (100% pass rate).
- **Production Bundle**: WXT 0.19.29 + Vite 6.4.4 produced clean MV3 build in 2.20s:
  - Total bundle size: **214.08 kB** (`content.js` 167.73 kB, `popup.js` 14.28 kB, `background.js` 10.27 kB).
- **Architecture & Security Conformance**:
  - `AD-FRONTEND-001` (WXT MV3 framework): Fully compliant.
  - `AD-FRONTEND-002` (Lit 3.x Web Components): Shadow DOM isolation (`mode: 'open'`) ensures host styling does not corrupt extension UI.
  - `AD-FRONTEND-003` (Constructable Stylesheets): `AnchorBaseElement` shares stylesheets cleanly across shadow roots without FOUC.
  - `AD-FRONTEND-004` (Nano Stores): Lightweight reactive stores with 300ms debounced persistence to `chrome.storage.local`.
  - `AD-X-001` (Direct-to-host REST): All API queries go directly to GitHub/GitLab endpoints using user PAT.
  - `AD-X-002` (Zero Telemetry & Local Storage): Zero third-party networks, zero analytics, private notes remain local.
  - `AD-X-003` (4-Link Traceability): 100% end-to-end requirement-to-test mapping.

---

## Traceability Metrics

| Metric | Value |
|---|---|
| Total Requirements | 8 |
| Requirements Mapped to LLD | 8 (100%) |
| Requirements Mapped to Tasks | 8 (100%) |
| Requirements Implemented | 8 / 8 (100%) |
| Total Acceptance Criteria | 8 |
| AC Tested | 8 / 8 (100%) |
| Tasks Created | 5 |
| Tasks Completed | 5 / 5 (100%) |
| Active Task | None (Story Complete) |
| Story Status | `completed` |
