# TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5: Automated Declaration Scanner & Blast Radius Risk Indicator

## Metadata
- **Task ID:** `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5`
- **Layer:** `frontend`
- **Title:** Automated Declaration Scanner & Blast Radius Risk Indicator
- **Source Requirement References:** `REQ-ANCHOR-08`, `AC-ANCHOR-08`
- **Source LLD References:** `LLD-FRONTEND-SRS-EXT-ANCHOR-001.md` §4.2, §5.5, §6, §7, §10.1
- **Current State:** `approved`
- **Estimated Complexity:** `medium`
- **Dependencies:** `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1`

---

## Objective
Implement the regex-based AST declaration signature scanner for PHP, TypeScript/JavaScript, Python, and Go diff chunks, the automated base-branch search lookup with concurrency limiting and rate-limit guardrails, the color-coded risk badge component (`<anchor-blast-badge>`), and the hover preview tooltip.

---

## Scope

### In-Scope
- Regex scanner service `src/services/declaration-scanner.ts` detecting modified declaration signatures in added/changed diff lines:
  - **PHP:** `function name(`, `class Name`
  - **JS/TS:** `export function name`, `export const name =`, `class Name`
  - **Python:** `def name(`, `class Name:`
  - **Go:** `func Name(`, `type Name struct`
- Automated search query queue with a concurrency limit of 2 and session cache lookups (`search-cache.service.ts`).
- Viewport gating via `IntersectionObserver`: defer lookup queries until declaration rows scroll within `200px` of the viewport.
- Blast radius badge component `src/components/diff/blast-badge.ts` (`<anchor-blast-badge>`):
  - Mounted directly into diff line code containers (`.blob-code-inner` / `.line_content`).
  - Color-coded presentation based on matched file counts:
    - Low impact (1–2 matches): Neutral gray badge (`Used in 2 files`)
    - Medium impact (3–9 matches): Amber/yellow badge (`Used in 6 files`)
    - High impact (10+ matches): Orange/red badge (`Used in 18 files - High Blast Radius`)
  - Hover tooltip displaying top matched file paths.
  - Clicking the badge opens the Cross-Reference Results Drawer (via Task T2 integration).
- Rate limit mitigation: suspend automated background lookups if API returns 403/429 rate limit errors, displaying a muted retry pill.
- Comprehensive Vitest unit tests verifying declaration regex matching across all four languages and concurrency throttling.

### Out-Of-Scope
- Full LSP AST semantic analysis (relies on base branch search queries per SRS).
- Private scratchpad note editing (covered in Task T3).

---

## Impacted Areas
- `src/services/declaration-scanner.ts` [NEW]
- `src/components/diff/blast-badge.ts` [NEW]
- `tests/declaration-scanner.test.ts` [NEW]
- `tests/blast-badge.test.ts` [NEW]

---

## Edge Cases To Preserve
- **Comment & String False Positives:** Regex should ignore lines where declaration patterns occur inside line comments (`//`, `#`) or string literals.
- **Quota Protection:** PRs with 50+ changed declarations must not fire 50 simultaneous queries; strictly enforce maximum concurrency of 2 requests with session deduplication.
- **Off-Screen Rows:** Unhydrated off-screen declaration rows remain lightweight skeleton badges until scrolled into view.

---

## Architecture Constraints
- Must adhere to `AD-FRONTEND-002` (Lit Web Components), `AD-FRONTEND-003` (Constructable Stylesheets via `AnchorBaseElement`), and `AD-X-001` (Direct-to-host REST).
- Shadow DOM isolation ensures badge colors and tooltips are not distorted by host page styles.

---

## Expected Evidence & Test Expectations
- Vitest unit tests testing 30+ language signature variations across PHP, TS/JS, Python, and Go.
- Unit tests verifying the query queue limits concurrency to 2 simultaneous requests.
- Vitest tests verifying color-coded badge thresholds (gray for <=2, amber for 3-9, red for >=10).
