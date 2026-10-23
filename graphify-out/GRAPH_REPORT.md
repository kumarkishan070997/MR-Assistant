# Graph Report - MRdiff  (2026-10-23)

## Corpus Check
- 132 files · ~129,406 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: .toml 13, .css 2, (none) 1)

## Summary
- 1368 nodes · 1936 edges · 99 communities (76 shown, 23 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f3177b2f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- GitHubAdapter
- package.json
- checklist-drawer.ts
- PrReviewService
- AnchorSymbolTrigger
- AnchorChecklistDrawer
- AnchorBlastBadge
- IPlatformAdapter
- .processSingleRow
- AnchorScratchpad
- NoteRehydrator
- Traceability Master File — TEMPLATE ONLY, DO NOT WRITE HERE
- AnchorChecklistDock
- compilerOptions
- SHARED-POLICIES.md
- Stage-By-Stage Walkthrough — What You Provide, What Lands Where
- speccraft.orchestrate.md
- Progress — SRS-EXT-ANCHOR-001
- speccraft.scaffold.md
- DECOMPOSITION-STAGE.md
- speccraft.plan-foundation.md
- LLD-FRONTEND-SRS-EXT-ANCHOR-001: PR / MR Context Anchor
- LLD-STAGE.md
- spec/AGENTS.md
- speccraft.validate.md
- SPEC-FOLDER-STRUCTURE.md
- REVIEW-AND-REVISION-POLICY.md
- Spec Version
- STAGE-CONTRACT.md
- speccraft.onboard.md
- SPEC-HIERARCHY.md
- TRACEABILITY-RULES.md
- speccraft.decompose.md
- speccraft.tech-debt.md
- GEMINI.md — Gemini CLI Bootstrap
- speccraft.tech-design.md
- IMPLEMENTATION-STAGE.md
- speccraft.integration-test
- TESTING-STAGE.md
- Validation Stage
- init.md - execution bootstrap
- Integration Testing Stage
- Non-Functional Requirements Summary
- speccraft.sync-swagger.md
- Change Request (CR) Stage
- Traceability Shard: SRS-EXT-ANCHOR-001
- Final Story Verification Report: SRS-EXT-ANCHOR-001
- WORKFLOW-OVERVIEW.md
- EXTENSION-ARCHITECTURE.md
- Auto Mode
- Auto Mode
- TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1: Platform Adapters, Lifecycle Manager & Settings Popup
- TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2: In-Diff Symbol Selection & Cross-Reference Drawer
- TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3: Line-Anchored Private Scratchpads & Rehydration Engine
- TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4: Review Checklist Drawer & Native Comment Promotion
- TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5: Automated Declaration Scanner & Blast Radius Risk Indicator
- ReviewContext
- speccraft.change.md
- StorageService
- markdown.service.ts
- SRS-EXT-ANCHOR-001 — PR / MR Context Anchor (GitHub & GitLab Chrome Extension)
- CR-<STORY-ID>-<n>: <short title>
- DiffTableInjector
- devDependencies
- scripts
- QueryQueue
- AGENTS.md
- Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1
- ARCH-DECISIONS.md
- Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3
- Story Dependency Ledger
- dependencies
- noise-reducer.service.ts
- API-CONTRACT-SOURCE.md
- ARCHITECTURE-REFERENCES.md
- traceability
- Traceability: SCAFFOLD-BACKEND
- Traceability: SCAFFOLD-FRONTEND
- AGENTS.md — Frontend Code Root Operating Contract
- Creating a Platform Adapter in PR / MR Context Anchor
- sdd-insights
- Creating a Lit Web Component in PR / MR Context Anchor
- architecture
- CR-changes
- business/README.md
- progress
- spec/README.md
- Rule: High-Performance Diff Rendering (60 FPS Guardrails)
- Mandatory Rules
- Mandatory Rules
- lld/README.md
- tasks/README.md
- integration-testing/README.md

## God Nodes (most connected - your core abstractions)
1. `AnchorChecklistDrawer` - 41 edges
2. `IPlatformAdapter` - 39 edges
3. `ReviewContext` - 35 edges
4. `AnchorBaseElement` - 32 edges
5. `extractFilePath()` - 32 edges
6. `GitLabAdapter` - 24 edges
7. `AnchorScratchpad` - 23 edges
8. `GitHubAdapter` - 22 edges
9. `vitest` - 21 edges
10. `AnchorOverlayRoot` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Agent Delta` --references--> `IPlatformAdapter`  [INFERRED]
  spec/architecture/EXTENSION-ARCHITECTURE.md → src-code-frontend/src/adapters/base.adapter.ts
- `Inside `src-code-frontend/`` --references--> `IPlatformAdapter`  [INFERRED]
  spec/commands/speccraft.scaffold.md → src-code-frontend/src/adapters/base.adapter.ts
- `Frontend — LLD-FRONTEND-SRS-EXT-ANCHOR-001` --references--> `IPlatformAdapter`  [INFERRED]
  spec/progress/context-anchor/progress-SRS-EXT-ANCHOR-001.md → src-code-frontend/src/adapters/base.adapter.ts
- `3. Style Encapsulation via Constructable Stylesheets` --references--> `AnchorBaseElement`  [INFERRED]
  spec/architecture/EXTENSION-ARCHITECTURE.md → src-code-frontend/src/components/base/anchor-element.ts
- `Cumulative Verification Overview` --references--> `AnchorBaseElement`  [INFERRED]
  spec/progress/context-anchor/progress-SRS-EXT-ANCHOR-001.md → src-code-frontend/src/components/base/anchor-element.ts

## Import Cycles
- None detected.

## Communities (99 total, 23 thin omitted)

### Community 0 - "GitHubAdapter"
Cohesion: 0.15
Nodes (5): 2. Purpose And Scope, In Scope, Out of Scope, DiffLineContext, GitHubAdapter

### Community 1 - "package.json"
Cohesion: 0.13
Nodes (13): happy-dom, nanostores, tailwindcss, @tailwindcss/vite, @types/chrome, @types/dompurify, typescript, @webcomponents/custom-elements (+5 more)

### Community 2 - "checklist-drawer.ts"
Cohesion: 0.06
Nodes (40): lit, vitest, SymbolReferenceMatch, SymbolReferenceResult, AnchorBaseElement, sharedExtensionSheet, AnchorPeekCard, AnchorResultsDrawer (+32 more)

### Community 3 - "PrReviewService"
Cohesion: 0.31
Nodes (3): AIStreamCallback, PrReviewService, ReviewProfileSettings

### Community 5 - "AnchorChecklistDrawer"
Cohesion: 0.09
Nodes (3): AnchorChecklistDrawer, AnchorOverlayRoot, PrReviewFinding

### Community 7 - "IPlatformAdapter"
Cohesion: 0.15
Nodes (5): 9. Reuse-Before-Build Decisions, Create Table (New Custom Units), Reuse Table (Existing Libraries & Platform APIs), IPlatformAdapter, PageLifecycleManager

### Community 8 - ".processSingleRow"
Cohesion: 0.36
Nodes (7): Implementation, cleanDiffLine(), DeclarationMatch, detectDeclaration(), extractClassNameFromPath(), inferLanguage(), SupportedLanguage

### Community 9 - "AnchorScratchpad"
Cohesion: 0.12
Nodes (6): AnchorScratchpad, AIAction, AICallContext, AIResponse, AIService, AISettings

### Community 11 - "Traceability Master File — TEMPLATE ONLY, DO NOT WRITE HERE"
Cohesion: 0.05
Nodes (39): Business Spec to LLD, Code to Tests, Conflict Decisions, Coverage Matrix, Coverage Table, Decisions Table, How To Read, How To Read (+31 more)

### Community 13 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, experimentalDecorators, isolatedModules, module, moduleResolution, resolveJsonModule, skipLibCheck, strict (+4 more)

### Community 15 - "SHARED-POLICIES.md"
Cohesion: 0.05
Nodes (38): Approval State Model, Blocked Handoff Requirements, Blocker And Decision Log Rules, Blockers Schema, Cascade Impact Table (originating story's entry only), Change Request Log Rules, Conflict Decision Rules, Core Rule (+30 more)

### Community 16 - "Stage-By-Stage Walkthrough — What You Provide, What Lands Where"
Cohesion: 0.05
Nodes (37): Adding NFR Enforcement (Optional), Agent Delta Protocol — Keeping Token Cost Down, Before You Start — New Project Setup, Blocking Conditions, Brownfield / Existing Codebase Path, Commands, First run on a new project, First run on a new project — fast path (+29 more)

### Community 17 - "speccraft.orchestrate.md"
Cohesion: 0.05
Nodes (36): Auto Mode, Command Intent, Documents This Command Must Use, Expected Command Behavior, Failure And Block Conditions, Hard Boundary Rules, Human-In-The-Loop Triggers, Minimal Command Handoff (+28 more)

### Community 18 - "Progress — SRS-EXT-ANCHOR-001"
Cohesion: 0.06
Nodes (31): Blockers, Blockers, Blockers, Cumulative Verification Overview, Decisions, Decisions, Decisions, Decomposition (+23 more)

### Community 19 - "speccraft.scaffold.md"
Cohesion: 0.06
Nodes (30): Architectural Decisions Not Implemented At Scaffold — Read Before Implementing, Backend, Backend, Backend, Backend, Backend (`/speccraft.scaffold backend`), Command Intent, Config File Requirements (+22 more)

### Community 20 - "DECOMPOSITION-STAGE.md"
Cohesion: 0.06
Nodes (31): Agent Delta, Approval States And Review Gate, Architecture Application Rules, Architecture-Aware Sizing, Backend Task Shapes, Code And Tests, Core Rule, Cross-References (+23 more)

### Community 21 - "speccraft.plan-foundation.md"
Cohesion: 0.07
Nodes (27): Auto Mode, Command Intent, Discovery — Five Tiers By Destination, Exit Behavior, Failure And Block Conditions, Final Handoff, Hard Boundary Rules, Human Review Gate (+19 more)

### Community 22 - "LLD-FRONTEND-SRS-EXT-ANCHOR-001: PR / MR Context Anchor"
Cohesion: 0.08
Nodes (25): 10.1 Blast Radius Badge States, 10.2 Private Scratchpad Row States, 10.3 Cross-Reference Drawer States, 10. State and UX States, 11. Testing Implications, 12. Open Questions And Assumptions, 13. Traceability Summary, 14. Companion LLD Reference (+17 more)

### Community 23 - "LLD-STAGE.md"
Cohesion: 0.08
Nodes (25): Agent Delta, Approval States And Review Gate, Done Criteria, Entry Conditions, Hard Stops, Human-Approval Rule, Input Contract, Intake Done Criteria (+17 more)

### Community 24 - "spec/AGENTS.md"
Cohesion: 0.09
Nodes (21): Agent Delta, Architecture References, Cache Version Check, Context Exclusions, Execution session model, Execution stages, Handoff Format, Hard Boundary Rule (+13 more)

### Community 25 - "speccraft.validate.md"
Cohesion: 0.09
Nodes (21): Auto Mode, Command Intent, Documents This Command Must Use, Exit Behavior, Exit Behavior in auto mode, Expected Command Behavior, Failure And Block Conditions, Hard Boundary Rules (+13 more)

### Community 26 - "SPEC-FOLDER-STRUCTURE.md"
Cohesion: 0.09
Nodes (20): Active in both planning and execution, Active Now, Active vs Future-Ready, Already Created, Alternate planning entry, Awaiting Execution Input, Awaiting Input, Canonical `spec/` Tree (+12 more)

### Community 27 - "REVIEW-AND-REVISION-POLICY.md"
Cohesion: 0.11
Nodes (18): Allowed Reviewers, Artifact Status Model, Blocking Rules, Completion Rule, Core Principle, Escalation Triggers, Exception Handling, execution (+10 more)

### Community 28 - "Spec Version"
Cohesion: 0.11
Nodes (18): How To Update This File, Merge Note — v9 (2026-07-07), Note — v10 (2026-07-07), Note — v11 (2026-07-07), Note — v12 (2026-07-07), Note — v13 (2026-07-07), Note — v14 (2026-07-07), Note — v15 (2026-07-15) (+10 more)

### Community 29 - "STAGE-CONTRACT.md"
Cohesion: 0.11
Nodes (18): Accepted Issues, Core Rule, Edge Cases And Impacted Areas Rule, Hard Editing Boundary Rules, Human-In-The-Loop Contract, Input Contract Rules, Interaction With Other Root Documents, Mandatory Sections (+10 more)

### Community 30 - "speccraft.onboard.md"
Cohesion: 0.11
Nodes (16): Ambiguous Evidence, Command Intent, Discovery — Two Tiers By Destination, Exit Behavior, Failure And Block Conditions, Hard Boundary Rules, Human Review Gate, Minimal Command Handoff (+8 more)

### Community 31 - "SPEC-HIERARCHY.md"
Cohesion: 0.11
Nodes (17): Acceptance Criteria Rules, Architecture Document Authority, Conflict Resolution Procedure, Core Rule, Escalation Triggers, execution — produces: code, tests, validation evidence, progress records, Existing Code & Generated Artifacts, Global Precedence Order (+9 more)

### Community 32 - "TRACEABILITY-RULES.md"
Cohesion: 0.11
Nodes (17): Core Rule, Coverage Visibility Rule, Dual-Chain-Per-Story Rule, execution Traceability Responsibilities, Failure Conditions, Interaction With Other Shared Rules, Locked Artifact Rule, Minimum Traceability Chain (+9 more)

### Community 33 - "speccraft.decompose.md"
Cohesion: 0.12
Nodes (15): Auto Mode, Command Intent, Documents This Command Must Use, Exit Behavior, Exit Behavior in auto mode, Expected Behavior, Failure & Block Conditions, Outcome: `approved` (+7 more)

### Community 34 - "speccraft.tech-debt.md"
Cohesion: 0.12
Nodes (15): Command Intent, Derivation Modes — Two Sources, Additive, Exit Behavior, Failure And Block Conditions, Findings Categories, Gate Style — Informational, Not Blocking, Hard Boundary Rules, Minimal Command Handoff (+7 more)

### Community 35 - "GEMINI.md — Gemini CLI Bootstrap"
Cohesion: 0.12
Nodes (15): 1. HARD STOP At Every Review Gate, 2. No Self-Approval, 3. Phase Boundaries Are Hard, 4. OpenAPI Types Are Generated, Not Hand-Written, 5. Code Lives In The Matching Code Root, Cache Version Check, Critical Workflow Rules, Gemini Context Cache (if total spec input > 32,768 tokens) (+7 more)

### Community 36 - "speccraft.tech-design.md"
Cohesion: 0.12
Nodes (14): Auto Mode, Command Intent, Documents This Command Must Use, Exit Behavior, Exit Behavior in auto mode, Expected Behavior, Failure & Block Conditions, Outcome: `approved` (+6 more)

### Community 37 - "IMPLEMENTATION-STAGE.md"
Cohesion: 0.12
Nodes (15): Agent Delta, Blocker Rules, Done Criteria, Entry Conditions, Implementation Rules, Input Contract, Minimum Implementation Output, Minimum Task Input (+7 more)

### Community 38 - "speccraft.integration-test"
Cohesion: 0.13
Nodes (14): Auto Mode, Execution Rule, Exit Behavior, Exit Behavior in auto mode, Expected Command Behavior, Outcome: `approved`, Outcome: `blocked`, Outcome: `revise` (+6 more)

### Community 39 - "TESTING-STAGE.md"
Cohesion: 0.13
Nodes (14): Agent Delta, Coverage Targets, Done Criteria, Entry Conditions, Excluded From Unit Tests, Input Contract, Output Contract, Overview (+6 more)

### Community 40 - "Validation Stage"
Cohesion: 0.13
Nodes (14): Agent Delta, Checks To Perform, Done Criteria, Entry Conditions, Hard Boundaries, Human-In-The-Loop Triggers, Input Contract, Output Contract (+6 more)

### Community 41 - "init.md - execution bootstrap"
Cohesion: 0.14
Nodes (13): Architecture Constraint Rule, Definition Of Done, Design Principles, Expected First Outputs, First-Action Rule, Foundation Status, Handoff Format, init.md - execution bootstrap (+5 more)

### Community 42 - "Integration Testing Stage"
Cohesion: 0.14
Nodes (13): Agent Delta, Done Criteria, Entry Conditions, Input Contract, Integration Testing Stage, Output Contract, Overview, Process Steps (+5 more)

### Community 43 - "Non-Functional Requirements Summary"
Cohesion: 0.15
Nodes (12): Accessibility, Agent Delta, API Consistency, Audit Trail (backend only), Compliance, Non-Functional Requirements Summary, Observability, Performance (+4 more)

### Community 44 - "speccraft.sync-swagger.md"
Cohesion: 0.15
Nodes (11): Command Intent, Exit Behavior, Expected Command Behavior, Failure And Block Conditions, Hard Boundary Rules, Minimal Command Handoff, Ownership — `/speccraft.sync-swagger` Is Advisory Only, Pre-Execution Checks (+3 more)

### Community 45 - "Change Request (CR) Stage"
Cohesion: 0.15
Nodes (12): Agent Delta, Change Request (CR) Stage, CR Eligibility Check, Depends On vs. the Companion-Pair Convention, Done Criteria, Entry Conditions, Input Contract, Output Contract (+4 more)

### Community 46 - "Traceability Shard: SRS-EXT-ANCHOR-001"
Cohesion: 0.17
Nodes (11): Business Spec to LLD, Code to Tests, Conflict Decisions, Coverage Matrix, LLD to Tasks, Metadata, Tasks to Code, Traceability Metrics (+3 more)

### Community 47 - "Final Story Verification Report: SRS-EXT-ANCHOR-001"
Cohesion: 0.17
Nodes (11): 1. Executive Summary, 2. Four-Link Traceability Chain Verification, 3. Architecture & Security Invariant Conformance Audit, 4.1 Automated Test Results (Vitest v3.2.7), 4.2 Production Bundle Verification (`wxt build`), 4. Test Execution & Build Verification, 6. Deliverables Inventory, 7. Sign-off & Completion (+3 more)

### Community 48 - "WORKFLOW-OVERVIEW.md"
Cohesion: 0.17
Nodes (10): Alternate Planning Entry — Change Request, Architecture Application, Exit Conditions, Handoff Expectation, Linear Stage Model, Related Documents, Review Gates, Stage Summary (+2 more)

### Community 49 - "EXTENSION-ARCHITECTURE.md"
Cohesion: 0.18
Nodes (9): 1.1 Host-Specific Adapter Matrix, 1. Platform Adapter Architecture, 2.1 The Table-Row Wrapper Pattern, 2.2 Global Overlay Mounting, 2. Shadow DOM Table-Safe Injection Strategy, 3. Style Encapsulation via Constructable Stylesheets, 4. 60 FPS Diff Rendering & Resource Management, 5. Ephemeral Service Worker & Caching (+1 more)

### Community 50 - "Auto Mode"
Cohesion: 0.18
Nodes (10): Auto Mode, Execution Rule, Exit Behavior, Exit Behavior in auto mode, Fresh Context Rule, Outcome: `approved`, Outcome: `blocked`, Outcome: `revise` (+2 more)

### Community 51 - "Auto Mode"
Cohesion: 0.18
Nodes (10): Auto Mode, Execution Rule, Exit Behavior, Exit Behavior in auto mode, Outcome: `approved`, Outcome: `blocked`, Outcome: `revise`, Purpose (+2 more)

### Community 52 - "TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1: Platform Adapters, Lifecycle Manager & Settings Popup"
Cohesion: 0.18
Nodes (10): Architecture Constraints, Edge Cases To Preserve, Expected Evidence & Test Expectations, Impacted Areas, In-Scope, Metadata, Objective, Out-Of-Scope (+2 more)

### Community 53 - "TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2: In-Diff Symbol Selection & Cross-Reference Drawer"
Cohesion: 0.18
Nodes (10): Architecture Constraints, Edge Cases To Preserve, Expected Evidence & Test Expectations, Impacted Areas, In-Scope, Metadata, Objective, Out-Of-Scope (+2 more)

### Community 54 - "TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3: Line-Anchored Private Scratchpads & Rehydration Engine"
Cohesion: 0.18
Nodes (10): Architecture Constraints, Edge Cases To Preserve, Expected Evidence & Test Expectations, Impacted Areas, In-Scope, Metadata, Objective, Out-Of-Scope (+2 more)

### Community 55 - "TASK-SRS-EXT-ANCHOR-001-FRONTEND-T4: Review Checklist Drawer & Native Comment Promotion"
Cohesion: 0.18
Nodes (10): Architecture Constraints, Edge Cases To Preserve, Expected Evidence & Test Expectations, Impacted Areas, In-Scope, Metadata, Objective, Out-Of-Scope (+2 more)

### Community 56 - "TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5: Automated Declaration Scanner & Blast Radius Risk Indicator"
Cohesion: 0.18
Nodes (10): Architecture Constraints, Edge Cases To Preserve, Expected Evidence & Test Expectations, Impacted Areas, In-Scope, Metadata, Objective, Out-Of-Scope (+2 more)

### Community 58 - "speccraft.change.md"
Cohesion: 0.20
Nodes (8): Command Intent, Documents This Command Must Use, Exit Behavior, Expected Behavior, Failure & Block Conditions, Output, Pre-Execution Checks, Required Input

### Community 59 - "StorageService"
Cohesion: 0.40
Nodes (3): Implementation, StorageService, setNoteInStore()

### Community 60 - "markdown.service.ts"
Cohesion: 0.28
Nodes (7): dompurify, marked, 5. Security & Edge Case Handling Audit, ALLOWED_ATTR, ALLOWED_TAGS, getPurify(), renderSanitizedMarkdown()

### Community 61 - "SRS-EXT-ANCHOR-001 — PR / MR Context Anchor (GitHub & GitLab Chrome Extension)"
Cohesion: 0.22
Nodes (8): 1. Summary, 2. Scope, 3. Requirements, 4. Acceptance Criteria, 5. Non-Functional Requirements & Constraints, 6. Dependencies & Adapters, 7. Storage Schema (`chrome.storage.local`), SRS-EXT-ANCHOR-001 — PR / MR Context Anchor (GitHub & GitLab Chrome Extension)

### Community 62 - "CR-<STORY-ID>-<n>: <short title>"
Cohesion: 0.22
Nodes (8): CR-<STORY-ID>-<n>: <short title>, Date, Description Of Change, Expected Impact / Areas Touched (optional hint), Reason, Requested By, Requirement/AC IDs Affected (optional hint), Target Story

### Community 63 - "DiffTableInjector"
Cohesion: 0.31
Nodes (4): 4.1 Reviewer User Journey, 4.2 System Capability Tree, 4. Functional Understanding, DiffTableInjector

### Community 64 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, happy-dom, tailwindcss, @tailwindcss/vite, @types/chrome, @types/dompurify, typescript, vitest (+1 more)

### Community 65 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, build:firefox, compile, dev, dev:firefox, test, zip (+1 more)

### Community 67 - "AGENTS.md"
Cohesion: 0.29
Nodes (5): Commands, Purpose, Read First, Repository Model, Rule

### Community 68 - "Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1"
Cohesion: 0.29
Nodes (7): Blockers, Decisions, Implementation, Status, Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1, Testing, Validation

### Community 69 - "ARCH-DECISIONS.md"
Cohesion: 0.33
Nodes (4): Agent Delta, Architectural Decisions — Cross-Cutting (`AD-X-*`), Architectural Decisions — Frontend (`AD-FRONTEND-*`), Layer Scope

### Community 70 - "Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3"
Cohesion: 0.33
Nodes (6): Blockers, Decisions, Status, Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T3, Testing, Validation

### Community 71 - "Story Dependency Ledger"
Cohesion: 0.33
Nodes (5): Backward Dependencies, Forward Dependencies, How This Ledger Is Written, Ledger Integrity Rules, Story Dependency Ledger

### Community 72 - "dependencies"
Cohesion: 0.33
Nodes (6): dependencies, dompurify, lit, marked, nanostores, @webcomponents/custom-elements

### Community 73 - "noise-reducer.service.ts"
Cohesion: 0.53
Nodes (4): collapseNoiseFiles(), isNoiseFile(), NOISE_PATTERNS, NoiseCollapseResult

### Community 74 - "API-CONTRACT-SOURCE.md"
Cohesion: 0.40
Nodes (3): Per-Module Swagger URL, Read-Only-By-`/speccraft.sync-swagger` Rule, Why This File Exists

### Community 75 - "ARCHITECTURE-REFERENCES.md"
Cohesion: 0.40
Nodes (3): Authoritative Architecture Documents, Related, Rules

### Community 76 - "traceability"
Cohesion: 0.40
Nodes (4): Layout, One Shard, Both Chains, traceability, What Each Shard Contains

### Community 77 - "Traceability: SCAFFOLD-BACKEND"
Cohesion: 0.40
Nodes (4): Conflict Decisions, Last Updated, Traceability: SCAFFOLD-BACKEND, Workflow Metrics

### Community 78 - "Traceability: SCAFFOLD-FRONTEND"
Cohesion: 0.40
Nodes (4): Conflict Decisions, Last Updated, Traceability: SCAFFOLD-FRONTEND, Workflow Metrics

### Community 79 - "AGENTS.md — Frontend Code Root Operating Contract"
Cohesion: 0.40
Nodes (4): AGENTS.md — Frontend Code Root Operating Contract, Authoritative Governance, Core Rules for Frontend Tasks, Role

### Community 80 - "Creating a Platform Adapter in PR / MR Context Anchor"
Cohesion: 0.40
Nodes (4): 1. Implement `IPlatformAdapter`, 2. Dynamic Lifecycle Handling, 3. Native Comment Promotion, Creating a Platform Adapter in PR / MR Context Anchor

### Community 81 - "sdd-insights"
Cohesion: 0.50
Nodes (3): How to use, sdd-insights, What

### Community 82 - "Creating a Lit Web Component in PR / MR Context Anchor"
Cohesion: 0.50
Nodes (3): 1. Inherit from `AnchorBaseElement`, 2. Event Delegation & Lifecycle, Creating a Lit Web Component in PR / MR Context Anchor

## Knowledge Gaps
- **5 isolated node(s):** `@types/chrome`, `@types/dompurify`, `happy-dom`, `tailwindcss`, `typescript`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 923 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `IPlatformAdapter` connect `IPlatformAdapter` to `GitHubAdapter`, `checklist-drawer.ts`, `Task: TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1`, `AnchorChecklistDrawer`, `AnchorBlastBadge`, `NoteRehydrator`, `Creating a Platform Adapter in PR / MR Context Anchor`, `EXTENSION-ARCHITECTURE.md`, `Progress — SRS-EXT-ANCHOR-001`, `speccraft.scaffold.md`, `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T1: Platform Adapters, Lifecycle Manager & Settings Popup`, `ReviewContext`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `IPlatformAdapter` (e.g. with `1. Platform Adapter Architecture` and `Agent Delta`) actually correct?**
  _`IPlatformAdapter` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@types/chrome`, `@types/dompurify`, `happy-dom` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `AnchorBaseElement` connect `checklist-drawer.ts` to `AnchorSymbolTrigger`, `AnchorChecklistDrawer`, `AnchorBlastBadge`, `IPlatformAdapter`, `.processSingleRow`, `AnchorScratchpad`, `AnchorChecklistDock`, `Final Story Verification Report: SRS-EXT-ANCHOR-001`, `AGENTS.md — Frontend Code Root Operating Contract`, `EXTENSION-ARCHITECTURE.md`, `Progress — SRS-EXT-ANCHOR-001`, `Creating a Lit Web Component in PR / MR Context Anchor`, `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T2: In-Diff Symbol Selection & Cross-Reference Drawer`, `TASK-SRS-EXT-ANCHOR-001-FRONTEND-T5: Automated Declaration Scanner & Blast Radius Risk Indicator`, `Mandatory Rules`, `StorageService`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `AnchorBaseElement` (e.g. with `3. Style Encapsulation via Constructable Stylesheets` and `Create Table (New Custom Units)`) actually correct?**
  _`AnchorBaseElement` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Should `checklist-drawer.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05965858041329739 - nodes in this community are weakly interconnected._