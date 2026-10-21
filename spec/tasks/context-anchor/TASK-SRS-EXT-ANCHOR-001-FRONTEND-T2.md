# TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2: In-Diff Symbol Selection & Cross-Reference Drawer

## Metadata
- **Task ID:** `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2`
- **Layer:** `frontend`
- **Title:** In-Diff Symbol Selection & Cross-Reference Drawer
- **Source Requirement References:** `REQ-ANCHOR-02`, `REQ-ANCHOR-03`, `AC-ANCHOR-02`, `AC-ANCHOR-03`
- **Source LLD References:** `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` §4.2, §5.2, §5.3, §5.4, §5.5, §5.6, §7, §10.3
- **Current State:** `approved`
- **Estimated Complexity:** `medium`
- **Dependencies:** `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1`

---

## Objective
Implement the in-diff identifier selection and hover detection engine, the floating action trigger (`<anchor-symbol-trigger>`), the slide-out Cross-Reference Results Drawer (`<anchor-results-drawer>`), base branch REST search API queries for GitHub and GitLab, and the tab-scoped in-memory cache (`search-cache.service.ts`).

---

## Scope

### In-Scope
- Selection & hover event listeners on diff code spans (`.blob-code-inner` on GitHub, `.line_content` on GitLab).
- Symbol query normalizer stripping syntax tokens (`()`, `""`, `->`, `$`, terminators) and filtering language keywords.
- Floating trigger component `src/components/diff/symbol-trigger.ts` (`<anchor-symbol-trigger>`) mounted inside `<anchor-overlay-root>` at cursor/selection coordinates.
- Cross-Reference Results Drawer `src/components/drawers/results-drawer.ts` (`<anchor-results-drawer>`):
  - Slide-out panel from the right edge with Shadow DOM isolation.
  - Queries GitHub `/search/code?q={symbol}+repo:{owner}/{repo}` and GitLab `/projects/:id/search?scope=blobs&search={symbol}&ref={base_branch}` using active PAT.
  - Groups search hits by file path, displaying line numbers and highlighted code snippets.
  - Clicking any match opens that exact file and line in a new background browser tab on the target branch.
- In-memory session cache `src/services/search-cache.service.ts` keyed by `{platform}:{project_id}@{ref}:{symbol}` with 15-minute TTL.
- Unit tests for symbol token sanitizer and search cache TTL/eviction.

### Out-Of-Scope
- Line-anchored private scratchpad editing (covered in Task T3).
- Automated blast radius indicator (covered in Task T5).

---

## Impacted Areas
- `src/components/diff/symbol-trigger.ts` [NEW]
- `src/components/drawers/results-drawer.ts` [NEW]
- `src/components/overlay/overlay-root.ts` [NEW]
- `src/services/search-cache.service.ts` [NEW]
- `src/services/symbol-sanitizer.ts` [NEW]
- `tests/symbol-sanitizer.test.ts` [NEW]
- `tests/search-cache.test.ts` [NEW]

---

## Edge Cases To Preserve
- **Rate Limit Response:** Handle 403 (GitHub) and 429 (GitLab) search errors gracefully, surfacing clear UI alerts and retry countdowns in the drawer.
- **Empty Search Hits:** Render clean empty state illustration when symbol has no external references.
- **Drawer Z-Index & Overflow:** Drawer must mount to `document.body` via `<anchor-overlay-root>` to prevent clipping by diff card `overflow: hidden`.

---

## Architecture Constraints
- Must adhere to `AD-FRONTEND-002` (Lit Web Components with Shadow DOM), `AD-FRONTEND-003` (Constructable Stylesheets via `AnchorBaseElement`), and `AD-X-001` (Direct-to-host REST).
- Zero DOM style leakage between host diffs and the drawer.

---

## Expected Evidence & Test Expectations
- Vitest unit tests verifying symbol sanitization across PHP, TypeScript, Python, and Go snippets.
- Unit tests validating `SearchCacheService` key generation, cache hits, misses, and expiration.
