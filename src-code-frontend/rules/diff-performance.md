# Rule: High-Performance Diff Rendering (60 FPS Guardrails)

## Mandatory Rules

1. **MutationObserver Throttling & Batching:**
   - Attach only one `MutationObserver` instance to the diff root container (`#files` or `.diff-files-holder`).
   - Accumulate added diff nodes in a processing queue and flush on `requestAnimationFrame`.
   - Never query DOM synchronously inside observer callbacks (e.g. `document.querySelectorAll`).

2. **Cooperative Scheduling (`scheduler.yield`):**
   - When scanning lines on PRs/MRs exceeding 50 modified rows, chunk processing in batches of 20–30 lines.
   - Yield control via `scheduler.yield()` (or `setTimeout(0)` fallback) between batches to maintain uninterrupted 60 FPS scrolling.

3. **Viewport-Aware Deferral (IntersectionObserver):**
   - Complex subtrees (markdown editors, AST declaration blast radius counts) must only be hydrated when their row intersects the viewport with a `200px` root margin.
   - Detached or unmounted diff rows must cleanly fire `disconnectedCallback()` to remove subscriptions.

4. **In-Memory Caching & Rate-Limit Tracking:**
   - Base branch search API responses must be cached in `Map<string, CacheEntry>` for the lifetime of the review session.
   - Enforce a maximum concurrency of 2 simultaneous requests for automated blast radius checks to avoid exhausting GitHub/GitLab search quotas.
