# ARCH-DECISIONS.md

## Agent Delta

**Role:** Authoritative locked stack and architecture decisions for PR / MR Context Anchor Chrome Extension.
**Layer Scope:** `frontend` (Pure browser extension running in Manifest V3; no custom backend server in this repository).
**Frontend Stack:** WXT (Vite 6 / Rollup), Lit 3.x (Web Components, native Shadow DOM), Tailwind CSS v4 + Constructable Stylesheets (`adoptedStyleSheets`), Nano Stores (<1 KB) with typed `chrome.storage.local` persistence, Marked + DOMPurify, TypeScript 5.7+ (strict mode), Vitest (unit) + Playwright (E2E extension context).
**Cross-Cutting:** Direct-to-host GitHub REST API v3 and GitLab REST API v4; zero third-party telemetry; runtime dynamic host permissions for self-hosted GitLab instances.
**Precedence:** User instruction > business spec > LLD > delivery task > this file > other arch specs (see `spec/SPEC-HIERARCHY.md`).

---

## Layer Scope

**Layer Scope:** `frontend`

Locked for PR / MR Context Anchor. This project is a Manifest V3 browser extension whose deployable code lives entirely under `src-code-frontend/`. No `src-code-backend/` is generated or required for this project since all API communications connect directly from the extension to GitHub (`api.github.com`) and GitLab (`gitlab.com` / self-hosted) endpoints.

---

## Architectural Decisions — Frontend (`AD-FRONTEND-*`)

| Decision ID | Area | Choice | Rationale & Constraints |
|---|---|---|---|
| **AD-FRONTEND-001** | Framework & Bundler | **WXT** (v0.19+) on Vite 6 / Rollup | Purpose-built Manifest V3 extension framework. Auto-generates `manifest.json`, natively supports Shadow DOM content script mounting (`createShadowRootUi`), provides automated background SW and content script HMR, and auto-bundles web-accessible resources. |
| **AD-FRONTEND-002** | UI Component Model | **Lit** (v3.2+) Web Components | Native Custom Elements with built-in `ShadowRoot` (`mode: 'open'`). Tiny ~5 KB footprint with zero Virtual DOM overhead. Reactive property updates surgically manipulate only affected DOM nodes. Automatic cleanup via standard `disconnectedCallback()` prevents memory leaks when host diff nodes are unmounted. |
| **AD-FRONTEND-003** | Styling & Isolation | **Tailwind CSS v4** + **Constructable Stylesheets** (`adoptedStyleSheets`) | Single compiled `CSSStyleSheet` instance in memory shared by reference across all injected ShadowRoots (`shadowRoot.adoptedStyleSheets = [sharedSheet]`). Prevents DOM duplication while ensuring zero style leakage between extension and host diffs. Dynamic theme variables mapped to GitHub (`--color-canvas-default`) and GitLab (`--gl-background-color-default`) tokens. |
| **AD-FRONTEND-004** | State Management | **Nano Stores** (`nanostores` v0.11+) + Typed Storage Bridge | Micro-library (<1 KB) atomic reactive stores. Integrates seamlessly with Lit (`@nanostores/lit`). Bridges persistence to `chrome.storage.local` with debounced auto-save (300ms) and listens to `chrome.storage.onChanged` for instantaneous cross-context sync between inline diff notes, drawers, and popup. |
| **AD-FRONTEND-005** | Markdown & Formatting | **Marked** (lite build) + **DOMPurify** | Fast, lightweight AST markdown parsing for private scratchpad notes. Output is strictly sanitized via DOMPurify with whitelisted tags and protocols to comply with Chrome Web Store CSP and security guidelines. |
| **AD-FRONTEND-006** | Language & Typing | **TypeScript** (v5.7+, Strict Mode) | Complete type safety across Chrome APIs (`chrome.*`), platform adapter contracts, AST regex matching, and storage schemas. |
| **AD-FRONTEND-007** | Testing Strategy | **Vitest** (Unit) + **Playwright** (E2E) | Vitest executes lightning-fast unit tests for regex declaration scanners, adapter URL parsers, and storage debouncers. Playwright runs real Chromium browser instances with the unpacked extension to verify DOM injection, Shadow DOM isolation, and Turbo navigation rehydration. |
| **AD-FRONTEND-008** | Extension Architecture | **Manifest V3** Isolated Content Scripts + Ephemeral SW | Content scripts run in Chrome's Isolated World; background service worker is strictly ephemeral (zero persistent state in SW memory; all state in `chrome.storage.local` or `chrome.storage.session`). Runtime host permissions (`chrome.permissions.request`) for self-hosted GitLab domains. |

---

## Architectural Decisions — Cross-Cutting (`AD-X-*`)

| Decision ID | Area | Choice | Rationale & Constraints |
|---|---|---|---|
| **AD-X-001** | External API Integration | Direct-to-Host REST (GitHub v3 / GitLab v4) | Direct API calls using user-supplied Personal Access Tokens (PATs) passed in headers (`Bearer <token>` for GitHub, `PRIVATE-TOKEN: <token>` for GitLab). Zero intermediate proxies, zero third-party telemetry, zero external tracking. Rate limits tracked via response headers and cached per active session in `Map<string, CacheEntry>`. |
