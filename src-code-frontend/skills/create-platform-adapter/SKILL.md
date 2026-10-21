---
name: create-platform-adapter
description: Procedure for creating or updating host platform DOM and API adapters.
---

# Creating a Platform Adapter in PR / MR Context Anchor

When adding or extending platform support (GitHub, GitLab SaaS, GitLab Self-Hosted):

## 1. Implement `IPlatformAdapter`
Adhere to the interface defined in `src/adapters/base.adapter.ts`:
```ts
export class GitLabAdapter implements IPlatformAdapter {
  readonly platformId = 'gitlab' as const;

  isCurrentHost(url: URL, customHosts: string[]): boolean {
    if (url.hostname === 'gitlab.com') return true;
    return customHosts.some(host => {
      try { return new URL(host).hostname === url.hostname; }
      catch { return false; }
    });
  }

  getDiffContainer(): HTMLElement | null {
    return document.querySelector('.diffs-tab, .diff-files-holder, .files');
  }

  // Implement remaining required methods...
}
```

## 2. Dynamic Lifecycle Handling
- Ensure SPA navigation events are cleanly hooked:
  - GitHub: `turbo:render`, `turbo:load`, `pjax:end`
  - GitLab: `page:rendered`, `page:receive`, History API events
- Provide an `unsubscribe` cleanup function from `observeNavigation`.

## 3. Native Comment Promotion
- To trigger native comment boxes without page reload:
  - Locate the native comment button (`.js-add-line-comment` on GitHub, `.js-add-diff-note-button` on GitLab).
  - Dispatch a simulated `click` event.
  - Locate the newly rendered textarea, populate its `value`, and trigger an `'input'` event so the host platform's auto-save/validation registers the change.
