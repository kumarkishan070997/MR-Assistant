# TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1: Platform Adapters, Lifecycle Manager & Settings Popup

## Metadata
- **Task ID:** `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1`
- **Layer:** `frontend`
- **Title:** Platform Adapters, Lifecycle Manager & Settings Popup
- **Source Requirement References:** `REQ-ANCHOR-01`, `AC-ANCHOR-01`
- **Source LLD References:** `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` §4.2, §5.1, §5.4, §5.5, §6, §7
- **Current State:** `approved`
- **Estimated Complexity:** `medium`
- **Dependencies:** `None`

---

## Objective
Implement the core platform abstraction layer (`IPlatformAdapter`, `GitHubAdapter`, `GitLabAdapter`), the SPA/Turbo lifecycle manager (`PageLifecycleManager`), the typed settings store, and the extension Settings Popup UI supporting GitHub/GitLab PAT validation, rate limit inspection, and runtime dynamic host permissions for self-hosted GitLab domains.

---

## Scope

### In-Scope
- Platform Adapter contract `src/adapters/base.adapter.ts` (`IPlatformAdapter`, `ReviewContext`, `DiffLineContext`).
- `GitHubAdapter` implementation handling GitHub URL matching (`https://github.com/*/*/pull/*`), context extraction (owner/repo/PR ID), Turbo navigation events (`turbo:render`, `turbo:load`), and `#files` diff container detection.
- `GitLabAdapter` implementation handling GitLab SaaS (`gitlab.com`) and custom self-hosted domains, context extraction (group/subgroup/project/MR IID), page events (`page:rendered`), and `.diffs-tab` detection.
- `PageLifecycleManager` in `src/services/lifecycle-manager.ts` observing SPA navigation transitions with teardown and re-initialization hooks.
- Settings store `src/stores/settings.store.ts` (`$settings`) backed by `chrome.storage.local` with schema validation.
- Settings Popup UI in `src/entrypoints/popup/`:
  - GitHub card: PAT entry, connection test button calling `GET https://api.github.com/user`, and rate-limit remaining badge (`x-ratelimit-remaining`).
  - GitLab card: PAT entry, base URL input (defaults to `https://gitlab.com`), connection test button calling `/api/v4/version`, and dynamic host permissions request via `chrome.permissions.request({ origins: [customUrl + '/*'] })`.
- Unit tests verifying URL parsing, adapter context extraction, and settings persistence.

### Out-Of-Scope
- In-diff UI components (badges, scratchpads, floating triggers) — covered in subsequent tasks.
- Background alarms or periodic polling.

---

## Impacted Areas
- `src/adapters/base.adapter.ts` [NEW]
- `src/adapters/github.adapter.ts` [NEW]
- `src/adapters/gitlab.adapter.ts` [NEW]
- `src/services/lifecycle-manager.ts` [NEW]
- `src/stores/settings.store.ts` [NEW]
- `src/entrypoints/popup/popup.ts` [NEW]
- `src/entrypoints/popup/popup.html` [NEW]
- `tests/adapters.test.ts` [NEW]
- `tests/settings.test.ts` [NEW]

---

## Edge Cases To Preserve
- **Self-Hosted URL Normalization:** Strip trailing slashes, paths, or query params from custom GitLab URLs (`new URL(rawUrl).origin`).
- **Permission Rejection:** If the user rejects the Chrome permissions prompt for a custom host, gracefully display an inline error without crashing the popup.
- **401 Unauthorized:** Clearly distinguish invalid/expired PATs from network connectivity errors.

---

## Architecture Constraints
- Must adhere to `AD-FRONTEND-001` (WXT), `AD-FRONTEND-004` (Nano Stores), `AD-FRONTEND-006` (TypeScript strict), and `AD-X-001` (Direct-to-host REST).
- Dynamic permission request must run in the synchronous user gesture turn of the button click handler.

---

## Expected Evidence & Test Expectations
- `pnpm test` executes Vitest suite:
  - 10+ URL parsing tests covering GitHub PRs, GitLab MRs, and sub-group paths.
  - Mock connection tests verifying 200 OK and 401 Unauthorized handling.
  - Settings store debounced save and load from mock `chrome.storage.local`.
