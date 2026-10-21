# AGENTS.md — Frontend Code Root Operating Contract

## Role
This file is the root operating contract for AI agents working inside `src-code-frontend/`.

## Authoritative Governance
- Architecture decisions: [`spec/architecture/ARCH-DECISIONS.md`](file:///c:/RSPL/MRdiff/spec/architecture/ARCH-DECISIONS.md) (`AD-FRONTEND-*`, `AD-X-*`)
- Structural architecture: [`spec/architecture/EXTENSION-ARCHITECTURE.md`](file:///c:/RSPL/MRdiff/spec/architecture/EXTENSION-ARCHITECTURE.md)
- Delivery tasks: `spec/tasks/context-anchor/`
- Implementation rules: `src-code-frontend/rules/`
- Creation skills: `src-code-frontend/skills/`

## Core Rules for Frontend Tasks
1. **Manifest V3 CSP:** Never inject raw unsanitized HTML, inline scripts, or `eval()`. Use `marked` + `DOMPurify` for markdown.
2. **Shadow DOM Isolation:** All injected components (badges, scratchpads, drawers, tooltips) must run in `ShadowRoot` (`mode: 'open'`).
3. **Constructable Stylesheets:** Extend `AnchorBaseElement` and inherit `sharedExtensionSheet` via `shadowRoot.adoptedStyleSheets`.
4. **Table DOM Safety:** Inject line notes inside `<tr class="anchor-scratchpad-row"><td colspan="100%"><anchor-scratchpad></td></tr>` to preserve host table layouts.
5. **60 FPS Performance:** Throttle DOM observers with `requestAnimationFrame` and cooperative scheduling (`scheduler.yield()`).
6. **Isolated Storage:** Persist notes to `chrome.storage.local` with debounced auto-save (300ms).
