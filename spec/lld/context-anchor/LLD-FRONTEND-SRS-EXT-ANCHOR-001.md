# LLD-FRONTEND-SRS-EXT-ANCHOR-001: PR / MR Context Anchor

## 1. Metadata

- **LLD ID:** `LLD-FRONTEND-SRS-EXT-ANCHOR-001`
- **Business Spec Reference:** [`spec/business/context-anchor/SRS-EXT-ANCHOR-001.md`](file:///c:/RSPL/MRdiff/spec/business/context-anchor/SRS-EXT-ANCHOR-001.md)
- **Work Item Reference:** `SRS-EXT-ANCHOR-001`
- **Layer:** `frontend`
- **Status:** `approved`
- **Last Updated:** `2026-10-20`
- **API Spec Reference:** Direct-to-host GitHub REST API v3 & GitLab REST API v4 (documented in `spec/architecture/ARCH-DECISIONS.md` `AD-X-001`)
- **Design Reference:** Native GitHub PR and GitLab MR diff layouts (`.blob-code-inner`, `.line_content`, `td.blob-num`, `td.diff-line-num`)
- **Depends On:** `None`

---

## 2. Purpose And Scope

### In Scope
- Content script bootstrap and dynamic lifecycle tracking for GitHub (`https://github.com/*/*/pull/*`) and GitLab (`https://gitlab.com/*/*/-/merge_requests/*` + user-defined self-hosted domains).
- Platform abstraction layer (`IPlatformAdapter`, `GitHubAdapter`, `GitLabAdapter`) normalizing DOM selectors, SPA events, and REST APIs.
- Extension Settings popup: multi-platform Personal Access Token (PAT) entry, connection testing, rate limit monitoring, and dynamic `chrome.permissions.request()` prompt for self-hosted GitLab domains.
- Floating in-diff symbol trigger (`<anchor-symbol-trigger>`) appearing on identifier selection/hover, stripping syntax tokens (`()`, `""`, `->`, `$`).
- Slide-out Cross-Reference Results Drawer (`<anchor-results-drawer>`) isolated via Shadow DOM, displaying base branch symbol references with syntax highlighting and file grouping.
- In-diff private scratchpad editor (`<anchor-scratchpad>`) injected inside table-safe `<tr><td colspan="100%">` wrappers, featuring markdown support, collapsible state, and debounced (300ms) persistence to `chrome.storage.local`.
- Dynamic note rehydration across virtualized diff scrolling, file collapsing, and Turbo/SPA transitions.
- Consolidated Review Checklist Drawer (`<anchor-checklist-dock>` & `<anchor-checklist-drawer>`) with smooth scrolling to target lines.
- One-click promotion of private notes to native GitHub review comments (`.js-add-line-comment`) and GitLab discussion notes (`.js-add-diff-note-button`).
- Automated Blast Radius Indicator (`<anchor-blast-badge>`) scanning modified declarations (PHP, JS/TS, Python, Go), querying base branch usages with a concurrency guard, and rendering color-coded risk badges (gray, amber, red).

### Out of Scope
- Backend server or custom telemetry endpoints (all communication is local or direct-to-host).
- Modifying host platform permissions or writing comments directly via API (comments are populated via native DOM textarea forms).
- Non-Chromium browser extensions (initial target is Google Chrome Manifest V3).

---

## 3. Source Requirements

| Requirement ID | Acceptance Criteria ID | Summary | Spec Mapping |
|---|---|---|---|
| **REQ-ANCHOR-01** | AC-ANCHOR-01 | Multi-Platform Token Setup & Dynamic Host Permissions | SRS-EXT-ANCHOR-001 §3 US-1.1 |
| **REQ-ANCHOR-02** | AC-ANCHOR-02 | In-Diff Symbol Trigger & Selection Extraction | SRS-EXT-ANCHOR-001 §3 US-2.1 |
| **REQ-ANCHOR-03** | AC-ANCHOR-03 | Cross-Reference Results Drawer & Session Cache | SRS-EXT-ANCHOR-001 §3 US-2.2 |
| **REQ-ANCHOR-04** | AC-ANCHOR-04 | Line-Anchored Private Scratchpad Table Injection | SRS-EXT-ANCHOR-001 §3 US-3.1 |
| **REQ-ANCHOR-05** | AC-ANCHOR-05 | Note Rehydration across Virtualized & Turbo Loads | SRS-EXT-ANCHOR-001 §3 US-3.2 |
| **REQ-ANCHOR-06** | AC-ANCHOR-06 | Aggregated Review Checklist Drawer & Line Navigation | SRS-EXT-ANCHOR-001 §3 US-3.3 |
| **REQ-ANCHOR-07** | AC-ANCHOR-07 | Promote Private Note to Native Review Comment | SRS-EXT-ANCHOR-001 §3 US-3.4 |
| **REQ-ANCHOR-08** | AC-ANCHOR-08 | Automated Blast Radius Counter on Modified Declarations | SRS-EXT-ANCHOR-001 §3 US-4.1 |

---

## 4. Functional Understanding

### 4.1 Reviewer User Journey
1. **Setup:** The reviewer opens the extension popup, enters their GitHub and/or GitLab PATs, and tests the connection. If auditing a self-hosted GitLab instance, they input the base URL and approve the Chrome permissions prompt.
2. **Reviewing Diffs:** Navigating to a pull request or merge request, the extension detects the platform and attaches lifecycle observers. As diff lines load:
   - Modified function/class declarations automatically display a color-coded **Blast Radius Badge** (`Used in 18 files - High Blast Radius`).
   - Selecting any identifier reveals a **Symbol Trigger Icon** next to the cursor; clicking it opens the **Cross-Reference Drawer** showing all repository call sites on the base branch without leaving the page.
   - Hovering over any line number surfaces a pin icon; clicking it inserts an inline **Private Scratchpad Editor** beneath the row. Notes auto-save with a 300ms debounce.
3. **Synthesis & Publishing:** The reviewer clicks the bottom-right dock pill (`Anchored Notes (5)`) to open the **Review Checklist Drawer**. They review their flagged issues, click "Promote to Comment" on critical items to populate the host platform's native comment box, and delete draft notes.

### 4.2 System Capability Tree
- **Capability 1: Host Lifecycle & Platform Adaptation**
  - Feature 1.1: Turbo / PJAX / SPA Page Observer (`PageLifecycleManager`)
  - Feature 1.2: Host Adapter Implementation (`GitHubAdapter`, `GitLabAdapter`)
- **Capability 2: DOM Injection & Encapsulation Engine**
  - Feature 2.1: Table Row Injector (`DiffTableInjector`)
  - Feature 2.2: Global Overlay Root (`<anchor-overlay-root>`)
  - Feature 2.3: Constructable Stylesheet Engine (`adoptedStyleSheets`)
- **Capability 3: In-Diff Intelligence**
  - Feature 3.1: Declaration Signature Scanner (`DeclarationScanner`)
  - Feature 3.2: Blast Radius Badge (`<anchor-blast-badge>`)
  - Feature 3.3: Floating Symbol Trigger (`<anchor-symbol-trigger>`)
  - Feature 3.4: Cross-Reference Results Drawer (`<anchor-results-drawer>`)
- **Capability 4: Local Private Scratchpad**
  - Feature 4.1: Inline Scratchpad Component (`<anchor-scratchpad>`)
  - Feature 4.2: Storage Bridge & Debouncer (`StorageService`)
  - Feature 4.3: Note Rehydrator (`NoteRehydrator`)
  - Feature 4.4: Checklist Drawer & Native Comment Prompter (`<anchor-checklist-drawer>`)

---

## 5. Frontend Design Decisions

### 5.1 Route, Host & Context Impact

| Host Pattern | Content Script Entrypoint | Injected UI Surfaces |
|---|---|---|
| `https://github.com/*/*/pull/*` | `src/entrypoints/content.ts` | In-diff badge (`tr.blob-code`), scratchpad row (`tr.anchor-row`), floating trigger, overlay drawers |
| `https://gitlab.com/*/*/-/merge_requests/*` | `src/entrypoints/content.ts` | In-diff badge (`tr.line_holder`), scratchpad row (`tr.anchor-row`), floating trigger, overlay drawers |
| Self-Hosted GitLab (`https://{custom_host}/*/*/-/merge_requests/*`) | Dynamic injection via `content.ts` matchers | Same as GitLab SaaS above |
| Extension Popup (`chrome-extension://.../popup.html`) | `src/entrypoints/popup/popup.ts` | Settings card, connection validator, rate-limit badge, dynamic host permission requester |

### 5.2 DOM Injection Strategy: Table-Safe Rows & Global Overlays

```
Host Diff Table (<table>)
 ├── <tbody>
 │    ├── <tr class="blob-code-row"> (Host line 88)
 │    │    ├── <td class="blob-num"> (Hover Pin Icon injected here)
 │    │    └── <td class="blob-code">
 │    │         └── <span class="blob-code-inner">
 │    │              └── <anchor-blast-badge> (ShadowRoot)
 │    └── <tr class="anchor-scratchpad-row"> (Injected Wrapper)
 │         └── <td colspan="100%">
 │              └── <anchor-scratchpad> (ShadowRoot)
 │
Host Document Body (<body>)
 └── <anchor-overlay-root> (ShadowRoot)
      ├── <anchor-symbol-trigger> (Position: fixed / popover)
      ├── <anchor-results-drawer> (Slide-out panel)
      └── <anchor-checklist-drawer> (Slide-out panel + dock pill)
```

- **Table Rows:** Direct `<div>` insertion inside `<tbody>` violates HTML specs. The extension creates `<tr class="anchor-scratchpad-row"><td colspan="100%"><anchor-scratchpad></td></tr>`.
- **Overlays:** Overlays mounted inside diff rows suffer from `overflow: hidden` clipping on diff cards. Mounting to `<anchor-overlay-root>` under `document.body` guarantees clean z-index stacking (`z-index: 99999`) and zero layout interference.

### 5.3 Style Isolation & Theme Token Inheritance

1. **Constructable Stylesheet:** A single compiled Tailwind CSS v4 bundle is parsed once into `sharedExtensionSheet = new CSSStyleSheet()`.
2. Every Lit component applies `shadowRoot.adoptedStyleSheets = [sharedExtensionSheet, componentSpecificStyles]`.
3. **Dynamic Theme Variables:**
   ```css
   :host {
     --anchor-bg-canvas: var(--color-canvas-default, var(--gl-background-color-default, #ffffff));
     --anchor-text-primary: var(--color-fg-default, var(--gl-text-color-default, #1f2328));
     --anchor-text-muted: var(--color-fg-muted, var(--gl-text-color-secondary, #656d76));
     --anchor-border: var(--color-border-default, var(--gl-border-color-default, #d0d7de));
     --anchor-accent: #0969da;
     --anchor-danger: #cf222e;
     --anchor-warning: #9a6700;
   }
   ```

### 5.4 State & Data Ownership Matrix

| State Domain | Owner Store | Persistence Mechanism | Cross-Context Synchronization |
|---|---|---|---|
| User Settings (PATs, Custom Hosts) | `settings.store.ts` (`$settings`) | `chrome.storage.local` under `"settings"` | `chrome.storage.onChanged` updates popup & content scripts |
| Review Session Notes | `notes.store.ts` (`$activeNotes`) | `chrome.storage.local` under `"review_sessions"` (300ms debounce) | `chrome.storage.onChanged` ensures inline editor and checklist stay in sync |
| Base Branch Symbol Search Cache | `search-cache.service.ts` | In-memory `Map<string, CacheEntry>` with 15-min TTL | Tab-scoped (cleared on tab close / hard reload) |
| Active Review Context | `context.store.ts` (`$reviewContext`) | In-memory atom derived from URL & DOM | Updated on Turbo/SPA navigation events |
| Drawer Visibility & Coordinates | `ui.store.ts` (`$uiState`) | In-memory atom | Internal to content script |

### 5.5 API Touchpoints Table

| Operation | Host Platform | Method & Endpoint | Headers | Request / Query | Success Response | Error Handling |
|---|---|---|---|---|---|---|
| **Verify GitHub PAT** | GitHub | `GET https://api.github.com/user` | `Bearer <token>` | None | `200 OK`, Rate limit in headers (`x-ratelimit-remaining`) | `401 Unauthorized` (invalid PAT) |
| **Verify GitLab PAT** | GitLab | `GET {base_url}/api/v4/personal_access_tokens/self` or `/version` | `PRIVATE-TOKEN: <token>` | None | `200 OK`, Version info | `401 Unauthorized` |
| **GitHub Symbol Search** | GitHub | `GET https://api.github.com/search/code` | `Bearer <token>` | `?q={symbol}+repo:{owner}/{repo}` | `200 OK`, `{ total_count, items: [{ path, text_matches }] }` | `403 Rate Limited` (exponential backoff) |
| **GitLab Symbol Search** | GitLab | `GET {base_url}/api/v4/projects/:id/search` | `PRIVATE-TOKEN: <token>` | `?scope=blobs&search={symbol}&ref={base_ref}` | `200 OK`, `[{ basename, filename, startline, data }]` | `429 Too Many Requests` |
| **Fetch File Content** | GitHub | `GET https://api.github.com/repos/{owner}/{repo}/contents/{path}` | `Bearer <token>` | `?ref={base_ref}` | `200 OK`, base64 encoded content | `404 Not Found` |
| **Fetch File Content** | GitLab | `GET {base_url}/api/v4/projects/:id/repository/files/:path/raw` | `PRIVATE-TOKEN: <token>` | `?ref={base_ref}` | `200 OK`, raw file text | `404 Not Found` |

### 5.6 Validation & Content Sanitization

- **Markdown Notes:** Formatted with `marked` and sanitized using `DOMPurify.sanitize(html, { ALLOWED_TAGS: ['b', 'i', 'code', 'pre', 'ul', 'ol', 'li', 'p', 'br', 'a'], ALLOWED_ATTR: ['href'] })`.
- **Symbol Query String:** Stripped of language sigils, quotes, parens, brackets, and terminators via `symbol.replace(/^[\s$#@\->]+|[\s();:,."'\`{}]+$/g, '')`.
- **GitLab Custom URLs:** Sanitized via `new URL(rawUrl).origin` to strip trailing slashes, paths, and invalid schemes.

---

## 6. Edge Cases & Error Mapping

| Scenario / Edge Case | Trigger / Source | Handling Strategy | User-Facing Outcome |
|---|---|---|---|
| **Rate Limit Exceeded** | GitHub/GitLab Search API returns 403/429 | Detect rate limit headers; suspend automated queries for current session; cache status | Tooltip on badge shows "Rate limited — Click to retry in Xm"; drawer shows warning pill |
| **Invalid / Expired PAT** | 401 Unauthorized on API call | Invalidate connection status in store; prompt re-entry | Settings popup badges turn Red; drawer prompts: "Update Personal Access Token" |
| **Massive PR (5,000+ lines)** | Large multi-file diff chunks | Single `MutationObserver` + `requestAnimationFrame` + `scheduler.yield()` after 30 lines | Smooth 60 FPS scrolling; off-screen lines stay unhydrated until visible |
| **SPA / Turbo Navigation** | User clicks between PR "Conversation" and "Files changed" tabs | `PageLifecycleManager` tracks `turbo:render` / `page:rendered`; disposes observers and re-scans | Badges and notes rehydrate immediately without duplicate instances |
| **Diff View Toggling** | Switching between Unified (inline) and Split (side-by-side) modes | Platform adapter detects layout class change (`.parallel-split-view`); re-calculates column spans | Scratchpads maintain correct row width (`colspan="100%"`) and diff side |
| **Collapsed Diff File** | User collapses file card in host UI | Host removes DOM nodes; Lit `disconnectedCallback()` fires | Memory and listeners cleanly freed; expanding card triggers rehydration |
| **Self-Hosted CORS / Host Permission Rejected** | User inputs custom GitLab domain but rejects Chrome prompt | Catch permission error in `chrome.permissions.request()` | Clear message in popup: "Host permission required to query your self-hosted GitLab" |
| **Symbol Query Collision** | Symbol matches language keyword (`if`, `for`, `class`) | Filter query against language reserved keyword list before triggering search | Suppress floating trigger for trivial language keywords |

---

## 7. Impacted Areas & Component Architecture

```
src-code-frontend/
├── src/
│   ├── entrypoints/
│   │   ├── background.ts                 # Service worker: alarms, auth relay, tab listeners
│   │   ├── content.ts                    # Content script bootstrap: mounts lifecycle & overlay root
│   │   └── popup/                        # Settings popup UI
│   │       ├── popup.ts                  # Settings controller & permission requester
│   │       ├── popup.html                # Popup layout
│   │       └── popup.css                 # Popup styles
│   ├── adapters/                         # Platform DOM & API adapters
│   │   ├── base.adapter.ts               # IPlatformAdapter interface contract
│   │   ├── github.adapter.ts             # GitHub selectors, Turbo events, REST v3
│   │   └── gitlab.adapter.ts             # GitLab selectors, page events, REST v4
│   ├── components/                       # Lit Custom Elements (Shadow DOM)
│   │   ├── base/
│   │   │   └── anchor-element.ts         # Base class sharing adoptedStyleSheets
│   │   ├── diff/
│   │   │   ├── blast-badge.ts            # <anchor-blast-badge>
│   │   │   ├── scratchpad-row.ts         # <anchor-scratchpad>
│   │   │   └── symbol-trigger.ts         # <anchor-symbol-trigger>
│   │   ├── drawers/
│   │   │   ├── results-drawer.ts         # <anchor-results-drawer>
│   │   │   ├── checklist-dock.ts         # <anchor-checklist-dock>
│   │   │   └── checklist-drawer.ts       # <anchor-checklist-drawer>
│   │   └── overlay/
│   │       └── overlay-root.ts           # <anchor-overlay-root>
│   ├── services/
│   │   ├── storage.service.ts            # chrome.storage.local bridge with 300ms debounce
│   │   ├── search-cache.service.ts       # In-memory Map<string, CacheEntry> with TTL
│   │   ├── declaration-scanner.ts        # Regex AST signature scanner (PHP, TS, Py, Go)
│   │   └── lifecycle-manager.ts          # Turbo, PJAX, and SPA navigation observer
│   ├── stores/
│   │   ├── notes.store.ts                # Reactive atom for PR review notes
│   │   ├── settings.store.ts             # Reactive atom for tokens & preferences
│   │   └── context.store.ts              # Active review context (platform, repo, PR id)
│   └── styles/
│       ├── tailwind.css                  # Master Tailwind directives & design tokens
│       └── theme-variables.css           # GitHub & GitLab semantic variable bridge
```

---

## 8. Architecture Application

- **AD-FRONTEND-001 (WXT):** Provides zero-config Manifest V3 manifest generation, automatic content script entrypoint injection, and fast HMR during development.
- **AD-FRONTEND-002 (Lit 3.x):** Powers all injected UI components. Zero virtual DOM overhead guarantees surgical updates. Native `disconnectedCallback()` ensures zero memory leaks when host diff files collapse.
- **AD-FRONTEND-003 (Tailwind v4 + adoptedStyleSheets):** Styles are compiled once in memory and attached by reference to all ShadowRoots via `shadowRoot.adoptedStyleSheets = [sharedExtensionSheet]`. Eliminates redundant `<style>` tags.
- **AD-FRONTEND-004 (Nano Stores):** Lightweight atoms (`$notes`, `$settings`) provide sub-millisecond reactive updates across disparate DOM injection points with automatic `chrome.storage.local` synchronization.
- **AD-FRONTEND-005 (Marked + DOMPurify):** Markdown scratchpad notes are rendered quickly with strict HTML tag and protocol whitelisting to comply with Chrome Web Store security guidelines.
- **AD-FRONTEND-006 & 007 (TypeScript & Vitest/Playwright):** Strict type safety on all adapter interfaces, tested with unit fixtures and headless browser integration tests.
- **AD-FRONTEND-008 & AD-X-001 (MV3 & Direct REST):** Direct-to-host API calls protect user privacy (no 3rd-party servers). Background SW remains strictly ephemeral.

---

## 9. Reuse-Before-Build Decisions

### Reuse Table (Existing Libraries & Platform APIs)
| Existing Artifact | Source / Import | Used By | Rationale |
|---|---|---|---|
| `LitElement`, `html`, `css` | `lit` | All UI components | Standard Web Component authoring without VDOM bloat |
| `atom`, `map` | `nanostores` | All stores | Framework-agnostic atomic reactive state |
| `marked.parse` | `marked` | `<anchor-scratchpad>` | Battle-tested markdown parser |
| `DOMPurify.sanitize` | `dompurify` | `<anchor-scratchpad>` | Zero-XSS guarantee for user-entered markdown |
| `chrome.storage.local` | Web Extension API | `StorageService` | Persistent extension storage |
| `chrome.permissions` | Web Extension API | Settings Popup | Dynamic runtime permission requests |

### Create Table (New Custom Units)
| New Artifact | Target Path | Reusable Beyond Feature | Promotion Target |
|---|---|---|---|
| `AnchorBaseElement` | `src/components/base/anchor-element.ts` | Yes | Base class for all extension components |
| `IPlatformAdapter` | `src/adapters/base.adapter.ts` | Yes | Core interface for any future code review platform |
| `DeclarationScanner` | `src/services/declaration-scanner.ts` | Yes | Universal regex declaration detector |
| `PageLifecycleManager` | `src/services/lifecycle-manager.ts` | Yes | Universal GitHub Turbo & GitLab SPA tracker |

---

## 10. State and UX States

### 10.1 Blast Radius Badge States
| Scenario | Visual Presentation | Interaction |
|---|---|---|
| **Scanning** | Small gray pulsing pill (`Scanning...`) | None |
| **Low Usage (1–2 matches)** | Neutral gray badge (`Used in 2 files`) | Hover displays tooltip with matched file paths |
| **Medium Usage (3–9 matches)**| Amber/yellow badge (`Used in 6 files`) | Hover displays tooltip; clicking opens search drawer |
| **High Blast Radius (10+)** | Red badge (`Used in 18 files - High Blast Radius`)| Hover displays warning tooltip; clicking opens drawer |
| **Error / Rate Limited** | Muted gray badge with alert icon (`Rate limited`) | Tooltip explains retry window |

### 10.2 Private Scratchpad Row States
| Scenario | Visual Presentation | Interaction |
|---|---|---|
| **Collapsed** | Small pin marker on line number with note count | Clicking expands inline row |
| **Active Editing** | Split editor: markdown textarea on left, live preview on right | Auto-debounces save to local storage (300ms) |
| **Saving / Saved** | Subtle checkmark indicator (`Saved locally`) | Disappears after 1.5s |
| **Promoted** | Badge indicates `Transferred to comment` | Option to delete or retain locally |

### 10.3 Cross-Reference Drawer States
| Scenario | Visual Presentation | Interaction |
|---|---|---|
| **Loading** | Skeleton shimmer list matching file card hierarchy | Cancel button aborts pending fetch |
| **Results Ready** | Grouped by file path with line numbers and highlighted code | Clicking match opens background tab at exact line |
| **Empty Results** | Centered empty illustration (`No external references found`) | Prompt to verify search term |
| **API Error** | Alert banner with specific error (401/403/404) | "Check PAT in Settings" link |

---

## 11. Testing Implications

### Unit Tests (`Vitest`)
- **Declaration Scanner:** Verify regex matching across PHP (`function`, `class`), JS/TS (`export function`, `export const`, `class`), Python (`def`, `class`), Go (`func`, `type struct`). Ensure comments and strings are ignored.
- **Platform Adapters:** Test URL matching and context extraction against 20+ fixture URLs (GitHub PRs, GitLab MRs, self-hosted GitLab paths, sub-groups).
- **Storage Service:** Test that rapid typing triggers exactly one `chrome.storage.local.set` call after 300ms of inactivity.

### Integration & E2E Tests (`Playwright`)
- Launch Chromium with unpacked extension.
- Load mock GitHub diff HTML fixture:
  - Verify `<anchor-blast-badge>` mounts adjacent to declarations.
  - Verify line number click injects valid `<tr><td colspan="100%">` row.
  - Verify styles do not leak to host `<table>` elements.
- Simulate Turbo navigation: verify note rehydration and absence of duplicate instances.

---

## 12. Open Questions And Assumptions

### Explicit Assumptions
1. **API Rate Limits:** Reviewed repositories have search API access enabled. Authenticated users receive 30 queries/minute on GitHub.
2. **Comment Promotion:** Host platform native comment buttons (`.js-add-line-comment` / `.js-add-diff-note-button`) remain accessible in the DOM. If host platforms update class names, the adapter pattern isolates the fix to `github.adapter.ts` or `gitlab.adapter.ts`.
3. **Storage Quota:** `chrome.storage.local` provides 10 MB per extension, which accommodates over 20,000 markdown notes.

### Unresolved / Deferrable Questions
- *None blocking LLD completion.* Concurrency limiting (max 2 queries) and viewport-gating via `IntersectionObserver` mitigate API quota risks.

---

## 13. Traceability Summary

| Requirement ID | Acceptance Criteria ID | LLD Sections | Coverage Status |
|---|---|---|---|
| **REQ-ANCHOR-01** | AC-ANCHOR-01 | §5.1, §5.4, §5.5, §6 | **Covered** (Popup, PAT storage, dynamic host permissions) |
| **REQ-ANCHOR-02** | AC-ANCHOR-02 | §4.2, §5.2, §5.6, §7 | **Covered** (In-diff hover/selection trigger, symbol sanitizer) |
| **REQ-ANCHOR-03** | AC-ANCHOR-03 | §4.2, §5.4, §5.5, §10.3 | **Covered** (Shadow DOM drawer, session cache, REST search) |
| **REQ-ANCHOR-04** | AC-ANCHOR-04 | §5.2, §5.3, §5.4, §10.2 | **Covered** (Table-safe row injection, 300ms debounce, Lit editor) |
| **REQ-ANCHOR-05** | AC-ANCHOR-05 | §4.1, §5.1, §6, §7 | **Covered** (PageLifecycleManager, Turbo/SPA rehydration) |
| **REQ-ANCHOR-06** | AC-ANCHOR-06 | §4.2, §5.2, §5.4, §7 | **Covered** (Checklist dock pill, aggregated drawer, smooth scroll) |
| **REQ-ANCHOR-07** | AC-ANCHOR-07 | §4.1, §5.5, §6 | **Covered** (Native comment form click & textarea injection) |
| **REQ-ANCHOR-08** | AC-ANCHOR-08 | §4.2, §5.5, §6, §10.1 | **Covered** (Declaration regex, blast badge, rate-limit guard) |

---

## 14. Companion LLD Reference

**Not Applicable** — Layer Scope is `frontend` only; no companion LLD exists. All API integrations communicate directly from the extension to GitHub and GitLab REST endpoints.
