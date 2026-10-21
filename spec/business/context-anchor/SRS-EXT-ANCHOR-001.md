# SRS-EXT-ANCHOR-001 — PR / MR Context Anchor (GitHub & GitLab Chrome Extension)

## 1. Summary

**PR / MR Context Anchor** is a Manifest V3 Chrome Extension designed to streamline code reviews on both **GitHub** and **GitLab**. It provides in-diff cross-referencing, blast radius estimation, and private line-anchored scratchpads without leaving the review interface, eliminating context switching and preventing premature draft comments.

---

## 2. Scope

**In scope:**
- Chrome Extension (Manifest V3) running on GitHub PR diffs (`https://github.com/*/*/pull/*`) and GitLab MR diffs (`https://gitlab.com/*/*/-/merge_requests/*` + configurable self-hosted GitLab domains).
- DOM & dynamic page navigation adapters (Turbo/PJAX for GitHub, Vue Router / page lifecycle for GitLab).
- Settings popup for multi-platform personal access token (PAT) configuration and testing.
- Runtime dynamic permission request for user-defined self-hosted GitLab domains.
- In-diff symbol hover/selection trigger and slide-out cross-reference search drawer.
- Private line-anchored sticky scratchpads with auto-debounced (300ms) persistence in `chrome.storage.local`.
- Dynamic note rehydration across virtualized / lazy diff loading.
- Aggregated review checklist drawer with smooth scrolling to line.
- One-click promotion of private notes to native GitHub review comments or GitLab discussion notes.
- Automated blast radius indicator (badge showing file usage counts for modified declarations in PHP, JS/TS, Python, Go).
- Light, Dark, and Dimmed theme adaptation for both host platforms.

**Out of scope:**
- Centralized/cloud-hosted storage or third-party telemetry server (all data is direct-to-host or local).
- Full language server protocol (LSP) indexing (uses base branch search APIs).
- Browser support outside Google Chrome / Chromium-based browsers for initial release.

---

## 3. Requirements

| REQ-ID | Description | Notes |
|---|---|---|
| REQ-ANCHOR-01 | Multi-Platform Token Setup & Authentication | Settings popup for GitHub and GitLab PATs, connection testing, rate limit monitoring, and runtime host permissions for self-hosted GitLab. |
| REQ-ANCHOR-02 | In-Diff Symbol Selection & Trigger | Floating action button rendered on hover/selection of code identifiers in diff lines, stripping syntax tokens. |
| REQ-ANCHOR-03 | Cross-Reference Results Drawer | Isolated slide-out drawer showing file and line occurrences of selected symbols across the base branch via REST search APIs. |
| REQ-ANCHOR-04 | Line-Anchored Private Note Creation | Injected pin icon in line number column and inline collapsible markdown scratchpad editor beneath diff rows. |
| REQ-ANCHOR-05 | Note Rehydration Across Dynamic Loads | MutationObserver and lifecycle listeners re-injecting visual markers and notes as diff lines render or hydrate dynamically. |
| REQ-ANCHOR-06 | Aggregated Review Checklist Drawer | Fixed dock button and consolidated checklist drawer displaying all active notes for current PR/MR with smooth scroll to line. |
| REQ-ANCHOR-07 | Promote Note to Platform Review Comment | Button to populate native review comment forms (.js-add-line-comment / .js-add-diff-note-button) with stored note text. |
| REQ-ANCHOR-08 | Automated Blast Radius Indicator | Regex detection of modified declarations (PHP, JS/TS, Python, Go) and inline color-coded badge indicating repository usage count. |

---

## 4. Acceptance Criteria

| AC-ID | REQ-ID | Given / When / Then | Notes |
|---|---|---|---|
| AC-ANCHOR-01 | REQ-ANCHOR-01 | **Given** a reviewer in settings, **When** they input GitHub/GitLab PATs, **Then** validate tokens against `/user` or `/version`, display rate limit remaining, and save to `chrome.storage.local`. Support `chrome.permissions.request()` for self-hosted GitLab domains. | US-1.1 |
| AC-ANCHOR-02 | REQ-ANCHOR-02 | **Given** a code line inside `.blob-code-inner` (GitHub) or `.line_content` (GitLab), **When** user selects or hovers an identifier, **Then** strip syntax tokens (`()`, `""`, `->`, `$`) and render a floating trigger in a Shadow DOM wrapper. | US-2.1 |
| AC-ANCHOR-03 | REQ-ANCHOR-03 | **Given** a triggered symbol lookup, **When** user clicks the trigger, **Then** slide open a Shadow DOM isolated drawer showing grouped search hits from GitHub `/search/code` or GitLab `/projects/:id/search` and cache in session memory. | US-2.2 |
| AC-ANCHOR-04 | REQ-ANCHOR-04 | **Given** a diff line row, **When** hovering line numbers (`.blob-num` / `.diff-line-num`), **Then** show note pin icon; clicking inserts an inline collapsible scratchpad table row persisting to `chrome.storage.local` with 300ms debounce. | US-3.1 |
| AC-ANCHOR-05 | REQ-ANCHOR-05 | **Given** a long PR with lazy-loaded diff chunks or Turbo page transitions, **When** new diff nodes attach to DOM, **Then** scan local storage and re-inject note markers and editors without duplicating instances. | US-3.2 |
| AC-ANCHOR-06 | REQ-ANCHOR-06 | **Given** anchored notes in the active PR/MR, **When** reviewer clicks the bottom dock counter button, **Then** open checklist drawer grouped by file path; clicking an entry smoothly scrolls to that diff line. | US-3.3 |
| AC-ANCHOR-07 | REQ-ANCHOR-07 | **Given** a private scratchpad note, **When** reviewer clicks "Promote to Comment", **Then** trigger native comment form (`.js-add-line-comment` or `.js-add-diff-note-button`), inject text into textarea, and mark note as transferred. | US-3.4 |
| AC-ANCHOR-08 | REQ-ANCHOR-08 | **Given** added/modified lines in diff, **When** declaration signatures match regex for PHP, TS/JS, Python, or Go, **Then** query base branch usage and display a color-coded badge (1-2 gray, 3-9 amber, 10+ red) with hover tooltip. | US-4.1 |

---

## 5. Non-Functional Requirements & Constraints

- **DOM Overhead & Cleanup:** Injected DOM elements must cleanly disconnect and destroy event listeners when diff rows are unmounted or collapsed.
- **Scroll Performance:** MutationObserver callbacks must be batched with `requestAnimationFrame` and cooperative scheduling to guarantee 60 FPS scrolling.
- **CSS Encapsulation:** All injected UI (badges, scratchpads, drawers, tooltips) must run within a `ShadowRoot` (`mode: 'open'`) with Constructable Stylesheets.
- **Security & Privacy:** Zero third-party telemetry. Storage tokens restricted exclusively to extension context.
- **Theme Support:** Injected components must dynamically adapt to GitHub and GitLab color schemes (Light, Dark, Dimmed).

---

## 6. Dependencies & Adapters

- **Platform Adapters:**
  - GitHub: `turbo:render`, `pjax:end`, `#files`, `.blob-code-inner`, `td.blob-num`, `.js-add-line-comment`.
  - GitLab: `page:rendered`, `.diffs-tab`, `.line_content`, `td.diff-line-num`, `.js-add-diff-note-button`.
- **Target APIs:**
  - GitHub REST API: `https://api.github.com`
  - GitLab REST API: `https://gitlab.com/api/v4` (and custom self-hosted endpoints)

---

## 7. Storage Schema (`chrome.storage.local`)

```json
{
  "settings": {
    "github": {
      "pat": "ghp_xxxxxxxxxxxxxxxxxxxx",
      "rate_limit_remaining": 4980
    },
    "gitlab": {
      "pat": "glpat-xxxxxxxxxxxxxxxxxxxx",
      "base_url": "https://gitlab.com",
      "custom_hosts": ["https://gitlab.internal-corp.net"]
    },
    "general": {
      "auto_blast_radius": true,
      "theme_mode": "auto"
    }
  },
  "review_sessions": {
    "github_owner_repo_pr102": {
      "platform": "github",
      "project_path": "owner/repo",
      "review_id": "102",
      "updated_at": 1729400000000,
      "notes": [
        {
          "id": "note_1729400012345",
          "file_path": "app/Http/Controllers/OrderController.php",
          "line_number": 88,
          "diff_side": "right",
          "content": "Confirm that this does not cause rounding errors with multi-currency orders.",
          "status": "active"
        }
      ]
    }
  }
}
```
