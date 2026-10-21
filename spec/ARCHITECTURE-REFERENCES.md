# ARCHITECTURE-REFERENCES.md

Single index of authoritative architecture documents. Reference this file wherever arch docs are listed — do not re-list them inline in other documents.

---

## Authoritative Architecture Documents

_Placeholder — `spec/architecture/` is empty in this boilerplate. Once this project's stack is locked, add the arch spec file(s) (e.g. framework, routing, module boundaries — split however makes sense for the chosen stack) and list them below, each tagged with its Layer._

| Document | Scope | Layer | Apply In |
|---|---|---|---|
| `spec/architecture/ARCH-DECISIONS.md` | Locked stack decisions — `AD-FRONTEND-001`, `AD-FRONTEND-002`, ... (framework, styling, components, state, forms, session, testing, code quality); `AD-BACKEND-001`, `AD-BACKEND-002`, ... (framework, persistence/ORM, auth/session, API style, messaging, testing, code quality); `AD-X-001`, ... (cross-cutting, e.g. shared API contract format, auth token shape, CORS policy) | frontend / backend / cross-cutting | Every LLD (`LLD-FRONTEND` and/or `LLD-BACKEND`) and implementation task — read before designing or coding, filtered to the rows matching the task's or LLD's `Layer` |
| `spec/architecture/EXTENSION-ARCHITECTURE.md` | Chrome extension architecture — adapter pattern matrix, table-safe Shadow DOM injection, constructable stylesheets, 60 FPS diff rendering & lifecycle management | frontend | Every LLD (`LLD-FRONTEND`) and frontend implementation task — read before designing DOM hooks or components |
| `contracts/<module>/<module>.yaml` | API contract — one growing file per module; not pre-created, written/updated by backend implementation tasks to match the approved LLD-BACKEND touchpoint table | cross-cutting | LLD creation (binding shape once it exists), backend implementation (authors it), frontend implementation (consumes it or the draft LLD shape if not yet written) |

---

## Rules

- These documents are **authoritative** — workflow docs wrap around them, never override them silently.
- If a business spec appears to conflict with a decision in ARCH-DECISIONS.md, escalate to human — do not self-resolve.
- When implementing, note in the task/LLD metadata which decisions apply (e.g. "AD-FRONTEND-001, AD-X-002").
- If a new cross-story architectural decision is made, add it to ARCH-DECISIONS.md under a new `AD-FRONTEND-NNN` / `AD-BACKEND-NNN` / `AD-X-NNN` ID, matching the layer it applies to.
- `/speccraft.tech-design` and `/speccraft.implement` filter this index by Layer before reading full arch spec files — a frontend-tagged LLD or task reads `AD-FRONTEND-*` and `AD-X-*` rows only; a backend-tagged one reads `AD-BACKEND-*` and `AD-X-*` rows only.

---

## Related

- `spec/commands/speccraft.scaffold.md §Architectural Decisions Not Implemented At Scaffold` — deferred decisions with per-story read pointers
- `spec/SPEC-HIERARCHY.md` — precedence model when documents conflict
- `spec/progress/shared/TECH-DEBT-FRONTEND/REPORT.md`, `spec/progress/shared/TECH-DEBT-BACKEND/REPORT.md` — optional, produced by `/speccraft.tech-debt`; cite a report entry from an in-scope LLD only if this project chooses to (opt-in, same treatment as `NFR-SUMMARY.md` — not a mandatory read for any stage)
