# EXTENSION-ARCHITECTURE.md

## Agent Delta

**Role:** Detailed architecture and structural specification for PR / MR Context Anchor (Manifest V3 Chrome Extension).
**Key Contracts:** `IPlatformAdapter` interface isolating GitHub vs. GitLab DOM structures and REST APIs; `DiffLifecycleManager` for SPA / Turbo / PJAX navigation tracking; Table-aware Shadow DOM injection (`<tr><td colspan="100%">`); Constructable Stylesheet sharing (`adoptedStyleSheets = [sharedSheet]`); Throttled MutationObserver with `requestAnimationFrame` + cooperative scheduling (`scheduler.yield`); Ephemeral SW caching via `Map<string, CacheEntry>` & `chrome.storage.session`.
**Related Docs:** `spec/architecture/ARCH-DECISIONS.md`, `spec/business/context-anchor/SRS-EXT-ANCHOR-001.md`.

---

## 1. Platform Adapter Architecture

The extension runs across both **GitHub** (`github.com`) and **GitLab** (`gitlab.com` and custom self-hosted domains). All host-specific DOM selectors, dynamic page event hooks, and REST API calls are strictly encapsulated behind the `IPlatformAdapter` interface.

```ts
export interface ReviewContext {
  platform: 'github' | 'gitlab';
  host: string;
  projectPath: string; // "owner/repo" or "group/subgroup/project"
  reviewId: string;    // PR number or MR IID
  baseRef: string;     // Base branch (e.g. "main")
  headRef: string;     // Head/feature branch
}

export interface DiffLineContext {
  element: HTMLElement;
  filePath: string;
  lineNumber: number;
  diffSide: 'left' | 'right';
  codeContent: string;
}

export interface IPlatformAdapter {
  readonly platformId: 'github' | 'gitlab';
  
  // Host Detection & Context
  isCurrentHost(url: URL, customHosts: string[]): boolean;
  extractReviewContext(): ReviewContext | null;
  observeNavigation(onNavigate: (ctx: ReviewContext) => void): () => void;
  
  // DOM Inspection & Injection
  getDiffContainer(): HTMLElement | null;
  scanDiffLines(container: HTMLElement): DiffLineContext[];
  injectScratchpadRow(line: DiffLineContext, component: HTMLElement): void;
  triggerNativeComment(line: DiffLineContext, text: string): Promise<boolean>;
  
  // API Queries
  searchSymbolReferences(ctx: ReviewContext, symbol: string, token: string): Promise<SymbolReferenceResult>;
}
```

### 1.1 Host-Specific Adapter Matrix

| Feature | GitHub Adapter | GitLab Adapter |
|---|---|---|
| **Navigation Events** | `turbo:render`, `turbo:load`, `pjax:end` | `page:receive`, `page:rendered`, History API `pushState` |
| **Diff Root Selector** | `#files`, `.js-diff-container` | `.diffs-tab`, `.diff-files-holder`, `.files` |
| **Diff Code Row** | `tr.blob-code`, `.blob-code-inner` | `tr.line_holder`, `.line_content` |
| **Line Number Element** | `td.blob-num` | `td.diff-line-num`, `a.diff-line-num` |
| **Diff Modes** | Unified / Split via class flags on `.file` | `.parallel-split-view` vs `.inline-view` |
| **Native Comment Button** | `.js-add-line-comment` | `.js-add-diff-note-button` |
| **Base API Endpoint** | `https://api.github.com` | `{base_url}/api/v4` |
| **Auth Header** | `Bearer <token>` | `PRIVATE-TOKEN: <token>` |

---

## 2. Shadow DOM Table-Safe Injection Strategy

Code review diffs on GitHub and GitLab are rendered as HTML tables (`<table><tbody><tr>`). Injecting plain `<div>` containers into `<tbody>` or between table rows creates invalid HTML, breaking browser table layout and sticky headers.

### 2.1 The Table-Row Wrapper Pattern
When an inline scratchpad is mounted:
1. The adapter locates the target diff row (`<tr>`).
2. Creates an injected table row:
   ```html
   <tr class="anchor-scratchpad-row" data-anchor-line="142">
     <td colspan="100%" class="anchor-scratchpad-cell">
       <!-- Lit Web Component mounted here -->
       <anchor-line-scratchpad></anchor-line-scratchpad>
     </td>
   </tr>
   ```
3. Inserts the wrapper using `targetRow.insertAdjacentElement('afterend', scratchpadRow)`.
4. Inside `<anchor-line-scratchpad>`, an open `ShadowRoot` isolates the markdown editor, toolbars, and buttons from host page CSS.

### 2.2 Global Overlay Mounting
Modals, side drawers (Cross-Reference Drawer, Review Checklist Drawer), and floating trigger icons are **not** injected into table rows. They are mounted directly to a single root `<anchor-overlay-root>` placed under `document.body`:
- Prevents clipping from `overflow: hidden` on host diff cards.
- Uses viewport coordinates (`position: fixed`) aligned with `getBoundingClientRect()` of target elements.

---

## 3. Style Encapsulation via Constructable Stylesheets

To prevent style duplication across hundreds of injected micro-components (e.g. blast radius badges and line pins):

1. **Single Memory Instance:** Tailwind v4 utilities and component base styles are compiled into a single CSS string at build time.
2. In the content script bootstrap, the stylesheet is parsed once into a constructable stylesheet:
   ```ts
   export const sharedExtensionSheet = new CSSStyleSheet();
   sharedExtensionSheet.replaceSync(compiledCssContent);
   ```
3. Every Lit component inherits from `AnchorBaseElement`:
   ```ts
   export class AnchorBaseElement extends LitElement {
     static override shadowRootOptions: ShadowRootInit = { mode: 'open' };

     override connectedCallback() {
       super.connectedCallback();
       if (this.shadowRoot && !this.shadowRoot.adoptedStyleSheets.includes(sharedExtensionSheet)) {
         this.shadowRoot.adoptedStyleSheets = [sharedExtensionSheet, ...(this.constructor as typeof AnchorBaseElement).elementStyles];
       }
     }
   }
   ```
4. **Theme Variable Inheritance:** Host theme tokens pierce the shadow boundary via CSS Custom Properties. The extension defines semantic tokens that map to host variables:
   ```css
   :host {
     --anchor-bg: var(--color-canvas-default, var(--gl-background-color-default, #ffffff));
     --anchor-fg: var(--color-fg-default, var(--gl-text-color-default, #1f2328));
     --anchor-border: var(--color-border-default, var(--gl-border-color-default, #d0d7de));
     --anchor-accent: #0969da;
   }
   ```

---

## 4. 60 FPS Diff Rendering & Resource Management

Massive PRs contain thousands of lines. To eliminate scroll jank:

1. **Batched Mutation Observer:**
   A single `MutationObserver` monitors the diff root (`#files` or `.diff-files-holder`). Mutations are enqueued and processed inside `requestAnimationFrame`.
2. **Cooperative Scheduling (`scheduler.yield`):**
   When processing batches larger than 50 diff lines, the scanner yields control to the browser's event loop to prevent blocking user interactions.
3. **Viewport-Aware Deferral (IntersectionObserver):**
   Heavy operations (fetching blast radius counts, rendering full markdown previews) are gated by an `IntersectionObserver` with a `200px` root margin. Off-screen rows remain unhydrated until scrolled into view.
4. **Deterministic Teardown:**
   When GitHub/GitLab dynamically collapses or unmounts diff files, Lit's native `disconnectedCallback()` fires, immediately freeing event listeners, timers, and store subscriptions.

---

## 5. Ephemeral Service Worker & Caching

Chrome Manifest V3 terminates background service workers after ~30s of inactivity.
- **Rule:** Zero critical state in global service worker memory.
- **Search Cache Policy:** Search API responses are cached in content script memory using `Map<string, CacheEntry>` with a 15-minute TTL.
- **Persistent Data:** Settings (PATs, custom hosts) and note records are stored exclusively in `chrome.storage.local`.
- **Dynamic Host Permissions:** Added interactively in the settings popup using `chrome.permissions.request({ origins: [customGitLabUrl + '/*'] })`.
