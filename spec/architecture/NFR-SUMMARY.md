# Non-Functional Requirements Summary

## Agent Delta

**Role:** OPTIONAL reference, not a mandatory gate. This boilerplate does not check NFRs as a separate workflow dimension — if this project wants NFR constraints enforced, populate this file and reference it from `ARCH-DECISIONS.md` (or list it in `spec/ARCHITECTURE-REFERENCES.md`); it then gets picked up as part of the existing Architecture Conformance check in every stage, independently for `LLD-FRONTEND-<id>`/frontend tasks and `LLD-BACKEND-<id>`/backend tasks. See root `README.md` §Adding NFR Enforcement (Optional) for the full opt-in procedure.
**Categories:** Performance · Reusability · Security · Accessibility (frontend only) · API Consistency (backend only) · Compliance · Testability · Observability · Reliability
**Critical execution rules (only apply if this file is wired in):**
- No PII in localStorage / sessionStorage / client-side state stores (SEC-FRONTEND-001)
- No PII in logs, error responses, or any client-visible payload beyond what the contract requires (SEC-BACKEND-001)
- Auth/session tokens in an httpOnly cookie only — browser JS never reads, stores, or transmits them (SEC-FRONTEND-004)
- Secrets and credentials via environment/secret manager only — never hardcoded or committed (SEC-BACKEND-004)
- Route/endpoint access enforcement via a single server-side auth/authorization gate — frontend must never rely on client-side-only guards; backend must never trust a client-supplied role/permission claim (SEC-005, shared)
- Reuse before create: frontend checks `components/`, `logic/`, `lib/` first; backend checks `services/`, `repositories/`, `lib/` first (REUSE-001, shared)
- Shared logic units/services/utils coverage ≥ 90%; critical paths ≥ 80% (TEST-006, shared)
- Every route needs an error boundary (OBS-FRONTEND-001)
- Every unhandled error path returns the contract's standard error shape, never a raw stack trace (OBS-BACKEND-001)
- Async ops > 200ms: show loading indicator (REL-FRONTEND-003)
- Calls to external services or slow queries: explicit timeout and retry policy (REL-BACKEND-003)
- Every authenticated request touching a protected resource writes an append-only audit record — actor, action, resource, result, timestamp (AUDIT-001, AUDIT-004 — backend only)
**Apply:** if wired in, identify relevant categories per layer at LLD intake (frontend LLD checks Frontend + shared categories; backend LLD checks Backend + shared categories); carry forward to each layer-tagged task; check conformance at validation stage as part of Architecture Conformance, independently for the 4-link frontend chain and the 5-link backend chain.

---

## Performance

_Placeholder — thresholds below are generic performance defaults per layer; adjust per this project's targets once known._

**Frontend:**
- **NFR-PERF-FRONTEND-001** LCP ≤ 2.5s, 4G mobile (Lighthouse, 4× CPU throttle) on key pages — list this project's key pages here.
- **NFR-PERF-FRONTEND-002** INP ≤ 200ms on all interactive elements, all pages.
- **NFR-PERF-FRONTEND-003** CLS < 0.1 on all pages.
- **NFR-PERF-FRONTEND-004** Initial JS chunk ≤ 200KB gzipped. Fail build if exceeded; verify with bundle analyser every build.
- **NFR-PERF-FRONTEND-005** Every route code-split via dynamic import. No route component in initial bundle except landing page.
- **NFR-PERF-FRONTEND-006** Every polling/caching data logic unit must specify explicit stale/cache lifetimes — list per-entity values once known (e.g. status polling vs. static reference data).
- **NFR-PERF-FRONTEND-007** Lists/tables > 50 items must use virtual scrolling. Rendering all items to DOM prohibited.

**Backend:**
- **NFR-PERF-BACKEND-001** API p95 latency ≤ 300ms, p99 ≤ 800ms for synchronous endpoints — list this project's key endpoints here.
- **NFR-PERF-BACKEND-002** Background/async job processing time budget defined per job type — list per-job values once known.
- **NFR-PERF-BACKEND-003** No N+1 query patterns. Batch or join instead of looping per-row queries.
- **NFR-PERF-BACKEND-004** Every list/collection endpoint paginated. No unbounded result sets returned.
- **NFR-PERF-BACKEND-005** Database connection pool sized explicitly per service; no unbounded pool growth.
- **NFR-PERF-BACKEND-006** Every cache layer must specify explicit TTL and invalidation strategy — list per-entity values once known (e.g. session cache vs. reference-data cache).
- **NFR-PERF-BACKEND-007** Response payload size budget per endpoint; large payloads use streaming or pagination instead of one large response body.

---

## Reusability

**Frontend:**
- **NFR-REUSE-FRONTEND-001** Before creating component/logic-unit/utility, check `components/`, `logic/`, `lib/` for equivalent. Extend; do not duplicate.
- **NFR-REUSE-FRONTEND-002** Two components with < 20% functional difference must not both exist without written justification in LLD or PR.
- **NFR-REUSE-FRONTEND-003** Shared UI components (2+ features): `components/`. Feature-specific: `features/{feature}/components/`. No component creation at page/route level except page-shell wrappers.
- **NFR-REUSE-FRONTEND-004** Logic units used in 2+ features: `logic/`. Promotion removes the feature-local copy in same PR.
- **NFR-REUSE-FRONTEND-005** Client-side state stores for one feature: `features/{feature}/store/`. State used by 2+ features: `lib/store/`. No duplicate store slices per entity.
- **NFR-REUSE-FRONTEND-006** Utilities used in 2+ features: `lib/`. Must be pure (no side effects, no framework imports). Copying a function is a violation.
- **NFR-REUSE-FRONTEND-007** The locked UI component library's primitives are first choice for standard UI (see `spec/architecture/ARCH-DECISIONS.md`). Custom implementations require LLD justification.
- **NFR-REUSE-FRONTEND-008** Use design token names — no hardcoded hex values. ESLint enforced.
- **NFR-REUSE-FRONTEND-009** Validation schemas shared across form validation and API response validation defined once in a shared schemas location.

**Backend:**
- **NFR-REUSE-BACKEND-001** Before creating a service/repository/utility, check `services/`, `repositories/`, `lib/` for an equivalent. Extend; do not duplicate.
- **NFR-REUSE-BACKEND-002** Two services with < 20% functional difference must not both exist without written justification in LLD or PR.
- **NFR-REUSE-BACKEND-003** Cross-feature services and repositories: `services/`, `repositories/`. Feature-specific: `features/{feature}/`. No business logic embedded directly in route/controller handlers.
- **NFR-REUSE-BACKEND-004** Utilities used in 2+ features: `lib/`. Promotion removes the feature-local copy in same PR.
- **NFR-REUSE-BACKEND-005** Domain types/DTOs for one feature: `features/{feature}/types/`. Types used by 2+ features: `lib/types/`. No duplicate type definitions per entity.
- **NFR-REUSE-BACKEND-006** Shared utilities must be pure (no hidden side effects, no framework-coupled imports). Copying a function is a violation.
- **NFR-REUSE-BACKEND-007** The locked data-access pattern (ORM/query builder — see `spec/architecture/ARCH-DECISIONS.md`) is first choice for persistence. Raw queries require LLD justification.
- **NFR-REUSE-BACKEND-008** Configuration values via a single config module — no scattered `process.env` reads across the codebase.
- **NFR-REUSE-BACKEND-009** Validation schemas shared across request validation and internal invariant checks defined once in a shared schemas location.

---

## Security

**Frontend:**
- **NFR-SEC-FRONTEND-001** No PII (name, phone, email, government IDs) in `localStorage`/`sessionStorage`. Cross-session PII: httpOnly cookies or fetched fresh per session.
- **NFR-SEC-FRONTEND-002** No PII in URLs. User identifiers: opaque non-sequential IDs (UUID). Any regulated personal identifiers never in any URL.
- **NFR-SEC-FRONTEND-003** User-generated content → DOM via a sanitizing markdown/HTML renderer (default strict schema). Raw-HTML-injection APIs (e.g. `innerHTML` assignment) prohibited without security review exception.
- **NFR-SEC-FRONTEND-004** Auth/session tokens: httpOnly, Secure, SameSite=Strict cookies set by backend. Frontend must never read, store, or transmit auth tokens via JavaScript. Cookie name/shape defined per project in `spec/architecture/ARCH-DECISIONS.md`.
- **NFR-SEC-FRONTEND-005** Route access enforcement via a single server-side gate (see locked auth-enforcement decision). Layout-level guards are defence-in-depth only.
- **NFR-SEC-FRONTEND-006** Sensitive document/file uploads: pre-signed URL flow. Frontend never sends the raw binary through the app server. Client-side MIME, extension, and file size validation before upload.
- **NFR-SEC-FRONTEND-007** Regulated/sensitive data (government IDs, financial identifiers, verification status): never in browser console in production. Strip `console.log/debug/info` via build config.
- **NFR-SEC-FRONTEND-008** CSP headers in production. `unsafe-eval` and `unsafe-inline` prohibited in `script-src`. Use nonce or hash for required inline styles.
- **NFR-SEC-FRONTEND-009** Client-side form validation is UX-only. Every submission also validated server-side. LLDs must document client schema and server-side validation contract.
- **NFR-SEC-FRONTEND-010** Prohibited (CI lint failure): `eval()`, `new Function()`, dynamic `<script>` insertion, `setTimeout`/`setInterval` with string arg, `document.write()`.
- **NFR-SEC-FRONTEND-011** No packages with Critical/High CVEs. Dependency audit in CI on every PR.
- **NFR-SEC-FRONTEND-012** Click-out/external redirects: no PII in redirect URL. Tracking sent to internal analytics endpoint before redirect. Non-PII tracking params permitted.

**Backend:**
- **NFR-SEC-BACKEND-001** No PII (name, phone, email, government IDs) in logs, error responses, or any payload field not explicitly required by the contract. Redact or omit.
- **NFR-SEC-BACKEND-002** No PII in URLs (path or query string). Resource identifiers: opaque non-sequential IDs (UUID). Regulated personal identifiers never in any URL.
- **NFR-SEC-BACKEND-003** All external input validated and sanitized before use. No string-concatenated queries — parameterized queries or ORM binding only (SQL/NoSQL injection prevention).
- **NFR-SEC-BACKEND-004** Secrets, API keys, and credentials: environment variables or a secret manager only. Never hardcoded, logged, or committed. Rotation policy documented per credential type.
- **NFR-SEC-BACKEND-005** Route/endpoint access enforcement via a single server-side auth/authorization gate (see locked auth-enforcement decision). No endpoint trusts a client-supplied role or permission claim directly.
- **NFR-SEC-BACKEND-006** File/document uploads: validate MIME type, extension, and size server-side before persisting; store outside the web root or via object storage with signed URLs.
- **NFR-SEC-BACKEND-007** Regulated/sensitive data (government IDs, financial identifiers, verification status): encrypted at rest; access logged; never in plaintext logs.
- **NFR-SEC-BACKEND-008** Rate limiting on all public-facing endpoints, tuned per endpoint sensitivity. Auth endpoints have stricter limits than read-only endpoints.
- **NFR-SEC-BACKEND-009** All external input validated server-side regardless of any upstream (client or gateway) validation. LLDs must document the request schema and validation contract.
- **NFR-SEC-BACKEND-010** Prohibited (CI lint/scan failure): `eval()`, dynamic code execution from untrusted input, shell command construction from unsanitized input, deserializing untrusted data without a schema.
- **NFR-SEC-BACKEND-011** No dependencies with Critical/High CVEs. Dependency audit in CI on every PR.
- **NFR-SEC-BACKEND-012** Principle of least privilege for database roles and service credentials — no service account uses an admin/superuser role for routine operations.

---

## Accessibility

_Frontend only — no backend equivalent._

- **NFR-A11Y-001** All interactive elements keyboard-operable. Tab order logical, follows visual reading order.
- **NFR-A11Y-002** Visible focus indicator on all interactive elements. `outline: none` without replacement prohibited.
- **NFR-A11Y-003** Color contrast: normal text ≥ 4.5:1; large text (≥ 18pt or ≥ 14pt bold) and UI boundaries ≥ 3:1.
- **NFR-A11Y-004** All `<img>` must have `alt`. Informative: descriptive `alt`. Decorative: `alt=""` + `role="presentation"`. SVG icon buttons/links: `aria-label` or visually-hidden span.
- **NFR-A11Y-005** All form fields: accessible label via `htmlFor`/`id` or `aria-labelledby`. Placeholder-only labels prohibited.
- **NFR-A11Y-006** Form validation errors programmatically associated via `aria-describedby`. Error element `id` must match input's `aria-describedby`.
- **NFR-A11Y-007** Modal dialogs and drawers must trap focus. On close, return focus to triggering element.
- **NFR-A11Y-008** Dynamic content not triggered by user focus/page load: `aria-live` `polite` (non-urgent) or `assertive` (critical errors). Applies to: toasts, inline validation, loading changes, streaming/async content.
- **NFR-A11Y-009** `<html lang>` set to active locale (valid BCP 47). Update programmatically on locale switch.
- **NFR-A11Y-010** Pages with substantial nav before main content: skip navigation link as first focusable element. Visually hidden when unfocused (`sr-only`). Target: `<main>`.

---

## API Consistency

_Backend only — no forced frontend equivalent (frontend LLDs consume the same contract via `Companion LLD Reference`)._

- **NFR-API-001** All endpoints follow the project's locked routing and versioning convention (see `spec/architecture/ARCH-DECISIONS.md`). No ad hoc route shapes.
- **NFR-API-002** Error responses follow one standard shape (code, message, optional details) across all endpoints. No endpoint returns a raw stack trace or framework-default error page.
- **NFR-API-003** Status codes used consistently per operation semantics (2xx success, 4xx client error, 5xx server error) — no 200 responses carrying an error payload.
- **NFR-API-004** Every public endpoint has an up-to-date entry in `contracts/<module>/<module>.yaml`. Drift is resolved by backend `/speccraft.implement` keeping the file current as part of implementation output; if this project configured `spec/architecture/API-CONTRACT-SOURCE.md`, the file may optionally be cross-checked against the live Swagger URL via `/speccraft.sync-swagger`. No stage automatically detects or fixes drift by fetching the live URL itself — contract drift from implementation is a defect either way.
- **NFR-API-005** Breaking changes to a published endpoint require a new version; existing consumers must not silently break.
- **NFR-API-006** Request/response field naming convention locked project-wide (e.g. camelCase or snake_case) — no mixed conventions within one payload.

---

## Compliance

_Placeholder for both layers — compliance rules are jurisdiction- and business-specific. Define this project's requirements (data residency, consent, industry-specific regulations, retention) here before execution begins. Categories to consider: consent capture, PII handling, data residency, audit logging, industry-specific document/identity verification rules. Audit Trail rules below are backend-specific and not a placeholder — apply as-is unless the project needs stricter rules._

- **NFR-COMP-001** _(fill in per project — applies to both layers)_

### Audit Trail (backend only)

Audit records are a compliance/security artifact — a tamper-evident history of who did what, to what, and when. Distinct from `Observability` below, which is operational (debugging, metrics) and may be sampled, rotated, or discarded; audit records must not be. No direct frontend equivalent — frontend actions that trigger a protected-resource mutation are covered by the backend endpoint they call.

- **NFR-AUDIT-001** Every authenticated API request that reads or mutates a protected resource is recorded: actor ID (or service ID for machine callers), action (endpoint + method, mapped to a business action name), target resource type + ID, timestamp, result (success/failure + status code), correlation/request ID. Anonymous/public read-only endpoints are exempt unless the project's compliance rules say otherwise.
- **NFR-AUDIT-002** Every mutation (create/update/delete) on a regulated or business-critical entity additionally records a before/after diff or the changed fields — not the full payload if it contains PII beyond what NFR-SEC-BACKEND-001 allows unredacted.
- **NFR-AUDIT-003** Auth-lifecycle events recorded explicitly: login success/failure, logout, password/credential change, permission/role change, session revocation.
- **NFR-AUDIT-004** Audit records are append-only — no update or delete path exists for the audit store from application code. Written to a store or table separate from operational logs.
- **NFR-AUDIT-005** Audit records never contain secrets, raw credentials, or full unredacted PII payloads — same redaction rules as NFR-SEC-BACKEND-001, applied to the audit record itself, not just caller-facing responses.
- **NFR-AUDIT-006** Access to the audit store is itself access-controlled and is a target of NFR-AUDIT-001 (querying/exporting audit data is an auditable action).
- **NFR-AUDIT-007** Retention period defined per project/regulation (e.g. DPDP, industry-specific) — list this project's retention period once known. Do not default to indefinite retention without an explicit decision.
- **NFR-AUDIT-008** Audit write failure must not silently pass — either the audit write is part of the same transaction as the audited mutation, or a documented fallback (queue + guaranteed-delivery retry) exists. A dropped audit record for a regulated action is itself an incident.

---

## Testability

**Frontend:**
- **NFR-TEST-FRONTEND-001** Business logic (calculations, transforms, validation, state transitions): custom logic units or pure utilities only. Not inline in component markup, event handlers, or effects.
- **NFR-TEST-FRONTEND-002** Presentational components receive all data via inputs or context. Must not call data-fetching logic units directly.
- **NFR-TEST-FRONTEND-003** Client-side store updaters: pure synchronous (no side effects, no API calls, no async). Async belongs in logic units that call store updaters.
- **NFR-TEST-FRONTEND-004** Validation schemas: exported as named constants, importable without framework or browser APIs.
- **NFR-TEST-006** Coverage: shared logic units/services/utilities ≥ 90%, API/route functions ≥ 80%, critical paths ≥ 80% — list this project's critical paths once known. (shared rule, see Agent Delta)
- **NFR-TEST-FRONTEND-007** Every component with non-trivial render logic: (1) render smoke test, (2) interactive behavior test, (3) error/empty state test.
- **NFR-TEST-FRONTEND-010** Framework: list this project's unit/component and E2E test frameworks once locked.
- **NFR-TEST-FRONTEND-011** Mock service layer for integration tests with API calls. Real network calls prohibited. Handlers in a dedicated mocks location.

**Backend:**
- **NFR-TEST-BACKEND-001** Business logic (calculations, transforms, validation, state transitions): pure functions or service methods only, not embedded in route/controller handlers.
- **NFR-TEST-BACKEND-002** Repository/data-access functions isolated behind an interface so they can be substituted in unit tests without a real database.
- **NFR-TEST-BACKEND-003** Service methods: side effects (DB writes, external calls, queue publishes) isolated behind injectable dependencies, not constructed inline.
- **NFR-TEST-BACKEND-004** Validation schemas: exported as named constants, importable without a running server or database connection.
- **NFR-TEST-BACKEND-007** Every service with non-trivial business logic: (1) unit tests for the logic in isolation, (2) integration tests for the wired path (API contract + persistence), (3) failure-path tests (invalid input, dependency unavailable).
- **NFR-TEST-BACKEND-010** Framework: list this project's unit and integration test frameworks once locked.
- **NFR-TEST-BACKEND-011** Integration tests use a real or containerized dependency (test database, containerized queue) over mocking; document any mock boundary explicitly. Calls to production external services prohibited in tests.

---

## Observability

_Operational logs — debugging, metrics, ops visibility. May be sampled, rotated, or discarded. For the backend's tamper-evident who-did-what-when compliance record, see `Compliance §Audit Trail` above — do not conflate the two._

**Frontend:**
- **NFR-OBS-FRONTEND-001** Every route: error boundary (full-page error + retry). Every significant async feature: feature-level nested error boundary.
- **NFR-OBS-FRONTEND-002** Global unhandled-rejection listener in root entry point. Empty catch blocks prohibited.
- **NFR-OBS-FRONTEND-003** Streaming/long-running async errors: (a) surface user-visible error state, (b) log to observability sink with session ID, error type, elapsed time.
- **NFR-OBS-FRONTEND-004** All data-fetch errors: render inline error state. All mutation errors: form error field or toast. Silent errors (error true, no feedback) prohibited.
- **NFR-OBS-FRONTEND-005** Authenticated page views: route path (no PII), user tier/role, timestamp. Anonymous: only after analytics cookie consent.
- **NFR-OBS-FRONTEND-006** Click-out tracking: beacon API to internal analytics before redirect (fallback: fetch with keepalive). Redirect must not be blocked if tracking fails.
- **NFR-OBS-FRONTEND-007** All logging via a shared logger module: `console` in dev, observability sink in production. Direct `console.log` in component files prohibited.
- **NFR-OBS-FRONTEND-011** Error boundaries report via logger: error message, component stack, route path, user tier/role. PII scrubbed before transmission.
- **NFR-OBS-012** Log levels: `debug`, `info`, `warn`, `error`. Production transmits only `warn` and `error`. (shared rule)

**Backend:**
- **NFR-OBS-BACKEND-001** Every unhandled error path returns the contract's standard error shape and is logged with a correlation/request ID — never a raw stack trace to the caller.
- **NFR-OBS-BACKEND-002** Global unhandled-rejection/exception handler at process entry point. Empty catch blocks prohibited.
- **NFR-OBS-BACKEND-003** Long-running or async operations: (a) surface a queryable status/result, (b) log to the observability sink with a correlation ID, operation type, and elapsed time.
- **NFR-OBS-BACKEND-004** All data-access errors and external-call failures logged with enough context to diagnose (operation, correlation ID, error type) without duplicating for every retry.
- **NFR-OBS-BACKEND-005** Every request logged with: route, method, status code, latency, correlation ID. PII excluded or redacted.
- **NFR-OBS-BACKEND-006** Metrics emitted per endpoint: request count, error rate, latency distribution.
- **NFR-OBS-BACKEND-007** All logging via a shared logger module with structured (not string-concatenated) fields. Direct unstructured `console.log`/`print` in application code prohibited.
- **NFR-OBS-BACKEND-011** Error logs include: error message, stack trace (server-side only, never returned to caller), correlation ID, route/operation. PII scrubbed before transmission to any external sink.

---

## Reliability

**Frontend:**
- **NFR-REL-FRONTEND-001** Mutation errors: toast with human-readable message. Raw API error bodies and stack traces must not be exposed.
- **NFR-REL-FRONTEND-002** Retry: read queries up to 2× on 5xx/network timeout; no retry on 4xx. Mutations: no auto-retry — list this project's non-retryable critical mutations once known.
- **NFR-REL-FRONTEND-003** Async ops > 200ms: show loading indicator. Full-page: skeleton. Inline/button: button loading spinner.
- **NFR-REL-FRONTEND-004** All lists/tables/content areas with fetched data: explicit empty state with meaningful message and action. Blank `<div>` or null render for absent data prohibited.
- **NFR-REL-FRONTEND-005** Offline/network error: display last cached data with stale indicator; show persistent banner; do not crash or clear content.
- **NFR-REL-FRONTEND-006** Long-running async operations: on failure/timeout, show a clear retry message. Use an explicit timeout with cancellation.
- **NFR-REL-FRONTEND-008** Form submit buttons disabled while a mutation is pending.
- **NFR-REL-FRONTEND-010** Live connections (SSE/WebSocket): handle `onerror` explicitly; close on unmount; stop auto-reconnect after a bounded number of failures; show fallback error state.
- **NFR-REL-FRONTEND-011** HTTP 401: cancel all pending queries; clear query cache and reset auth store; redirect to login with a session-expired message.
- **NFR-REL-012** Critical commerce/transactional flows: idempotency key — UUID generated on form render, included in the request payload, reused on retry of partial failure. (shared rule, see Backend for the server-side check)

**Backend:**
- **NFR-REL-BACKEND-001** Errors returned to callers: contract-defined error shape with a safe, non-internal message. Raw exception messages and stack traces must not be exposed.
- **NFR-REL-BACKEND-002** Retry policy: idempotent reads retried up to 2× on 5xx/timeout from a downstream dependency; no retry on 4xx. Non-idempotent writes: no auto-retry unless protected by an idempotency key — list this project's non-retryable critical operations once known.
- **NFR-REL-BACKEND-003** Calls to external services or the database: explicit timeout set; no unbounded wait.
- **NFR-REL-BACKEND-004** All list/collection endpoints with no matching data: explicit empty result (`[]` or equivalent), not an error or null.
- **NFR-REL-BACKEND-005** Dependency degradation (cache down, non-critical downstream unavailable): degrade gracefully where possible (serve stale/cached data with an indicator) rather than failing the whole request.
- **NFR-REL-BACKEND-006** Long-running background operations: on failure/timeout, record a clear failure state with reason; use an explicit timeout with cancellation/cleanup.
- **NFR-REL-BACKEND-008** Mutating operations guarded against duplicate submission while a prior request for the same operation is still in flight.
- **NFR-REL-BACKEND-010** Persistent connections (WebSocket/SSE/queue consumers): handle disconnects explicitly; close cleanly on shutdown; bounded reconnect/backoff; do not silently drop messages.
- **NFR-REL-BACKEND-011** Auth token invalid/expired: return a consistent 401 contract; do not leak whether the identifier exists.
- **NFR-REL-BACKEND-012** Critical transactional flows (payments, order creation, etc.): idempotency key required in the request, checked before processing, reused safely on retry of a partial failure.
