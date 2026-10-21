# Rule: Manifest V3 Content Script Constraints & Lifecycle

## Mandatory Rules

1. **Strict CSP & Code Execution:**
   - Never use `eval()`, `new Function()`, or dynamic `<script>` injection.
   - All event bindings must use Lit declarative syntax (`@click=${this.handleClick}`).
   - All HTML rendering from markdown must pass through `DOMPurify.sanitize()` before being placed into DOM.

2. **Isolated World DOM Communication:**
   - Content scripts share the DOM with host pages (GitHub/GitLab) but run in an isolated JavaScript context.
   - Do not attempt to access JavaScript variables directly from `window` (e.g. host app state). Read data strictly from DOM attributes, data tags (`data-testid`, `data-color-mode`), and current URL.

3. **SPA / Dynamic Lifecycle Management:**
   - Content scripts must register listeners with `PageLifecycleManager` to capture Turbo transitions (`turbo:render`, `turbo:load`) on GitHub and client-side page updates on GitLab.
   - On page navigation, cleanly dispose all existing `MutationObserver` instances and active timers before re-initializing.

4. **Background Service Worker Communication:**
   - Use `chrome.runtime.sendMessage` for background tasks (e.g., querying GitHub/GitLab APIs if offloading CORS or rate-limiting).
   - In `chrome.runtime.onMessage` listeners that perform async work, always `return true;` synchronously to keep the response channel open.
   - Service workers are ephemeral (~30s lifetime); never store long-running state in global SW variables.
