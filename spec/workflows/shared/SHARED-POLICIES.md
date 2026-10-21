# Shared Workflow Policies

---

## Approval State Model

### Standard States

| State | Meaning | Downstream allowed? |
|-------|---------|-------------------|
| `draft` | authoring started, not review-ready | no |
| `in-review` | submitted for review, outcome pending | no |
| `revise` | review found issues requiring changes | no |
| `approved` | passed required review for current stage | yes |
| `blocked` | cannot continue — missing input, unresolved conflict, or dependency | no |
| `done` | artifact and required downstream evidence are complete | n/a |

### State Transitions

```
draft -> in-review -> approved -> done
draft -> in-review -> revise -> in-review -> approved
draft -> in-review -> blocked
approved -> revise  (downstream discovery reopens it via review)
approved -> blocked (new dependency surfaces)
```

### Downstream Usage Rule

- `approved` may be used downstream
- `draft`, `in-review`, `revise` must not be treated as approved downstream inputs
- `blocked` must not progress
- `done` means stage-complete for current scope — not just approved for the next step

### Locked Artifact Rule

Once a prior-phase artifact is `approved`, it is locked.

- execution must not silently edit approved planning artifacts
- changes to approved earlier artifacts require explicit human reopening or approved human review
- status changes on locked artifacts must be visible and justified

### Human-Approval Rule

**Critical: AI cannot self-approve. Stage boundary transitions require explicit human approval.**

1. AI produces artifact (LLD, task set, implementation, tests)
2. AI outputs artifact summary + minimal handoff block
3. AI stops — execution turn ends
4. Human reads the artifact
5. Human responds in next turn: `approved` / `revise: [reason]` / `blocked: [reason]`
6. AI proceeds only after receiving explicit human approval

Applies at every stage gate:

- LLD Review Gate — AI stops after producing LLD
- Decomposition Review Gate — AI stops after producing tasks
- Implementation Review Gate — AI stops after producing implementation
- Testing Review Gate — AI stops after producing unit tests
- Integration Testing Review Gate — AI stops after producing integration tests (backend-tagged tasks only; frontend-tagged tasks do not pass through this gate)
- Foundation Review Gate — `/speccraft.plan-foundation`'s single combined Human Review Gate (Layer Scope + all four discovery tiers); AI stops after producing the draft

Silence is not approval. A well-structured artifact is not approval.

**Sanctioned exception:** the following are the only invocations permitted to clear a gate above without a human message — each governed entirely by that command's own `## Auto Mode` section, not by an exception carved into this rule:

- `/speccraft.orchestrate auto <business-spec-file>`
- `/speccraft.plan-foundation auto <business-spec-file> "<tech stack description>"`
- `/speccraft.tech-design auto <business-spec-file>`
- `/speccraft.decompose auto <lld-fe-file> <lld-be-file>` / `/speccraft.decompose auto <lld-file>`
- `/speccraft.implement auto <task-id>`
- `/speccraft.unit-test auto <task-id>`
- `/speccraft.integration-test auto <task-id>`
- `/speccraft.validate auto <task-id>`

The last six also apply — via the same `## Auto Mode` section in each of their own command contracts, not via any override text in `speccraft.orchestrate.md` — when `/speccraft.orchestrate auto` invokes their behavior for its own Stage 2 through Stage 12; orchestrate does not carry gate-clearing logic for these six stages on their behalf.

All sanctioned auto-mode invocations still write a full review record and, for `revise`/`blocked` outcomes, a logged rationale (`Decided By` / `Approver` = `auto-mode-ai`, or `Source: auto-mode-resolved` rows plus inline `Open Concerns` notes for plan-foundation, which keeps no separate traceability file) — auto mode removes the pause, not the review.

---

## Done Criteria Rules

### Core Rule

Mark `done` only when ALL of the following are true:

1. required output artifact exists in required form
2. artifact is aligned with authoritative inputs
3. required review outcome is complete
4. no unresolved required revision remains
5. traceability is updated to required depth for that stage
6. known blockers are resolved or explicitly accepted
7. handoff information is sufficient for downstream or historical use

`done` is not synonymous with: created, written, compiled, reviewed once, approved-for-next-stage, mostly complete.

### planning Done Rules

**Intake done:** recording complete, scope clear enough for LLD, gaps identified, requirement IDs usable, handoff to LLD clear.

**LLD done:** LLD complete for current scope, passed review, revisions resolved, edge cases addressed or logged, traceability from requirements to LLD updated, handoff to decomposition clear.

**Decomposition done:** delivery tasks complete, implementation-ready, passed review, revisions resolved, task dependencies clear, traceability from LLD to tasks updated, handoff to execution clear.

**planning overall done:** approved delivery tasks exist, requirement-to-LLD mapping exists, LLD-to-task mapping exists, unresolved planning issues visible.

### execution Done Rules

**Implementation done:** code changes present, passed review, revisions resolved, architecture addressed, traceability from task to code updated, handoff to testing clear.

**Unit testing done:** tests exist, cover approved behavior and meaningful failure paths, review complete, revisions resolved, traceability from code and requirements to tests updated.

**Integration testing done (backend-tagged tasks only — frontend-tagged tasks skip this stage; see `spec/workflows/testing/TESTING-STAGE.md` downstream note):** tests exist, cover cross-boundary behavior (API contract, persistence, external integration) introduced or changed by the task, real/containerized dependencies used where feasible, review complete, revisions resolved, traceability from unit tests to integration tests updated.

**Validation done:** validated against approved sources, architecture compliance checked, coverage gaps visible, issues recorded honestly. Backend-tagged tasks additionally require integration tests complete before validation begins; frontend-tagged tasks do not.

**execution overall done:** implementation complete, unit tests complete, validation complete; for backend-tagged tasks, integration tests are also complete; task-to-code + code-to-unit-test traceability exists (plus unit-test-to-integration-test for backend-tagged tasks); progress records up to date.

---

## Handoff Format

### Core Rule

Every meaningful workflow handoff must state:

1. where the work is in the workflow
2. what artifact is being handed off
3. what state it is in
4. what was completed
5. what is still missing
6. whether downstream progression is allowed
7. what traceability has already been updated

### Handoff Types

| Type | When used |
|------|-----------|
| `stage-handoff` | one stage finishes, next stage can begin |
| `review-handoff` | artifact submitted for review |
| `revision-handoff` | review requests changes, work returns to producing stage |
| `blocked-handoff` | stage cannot continue, human intervention needed |
| `interruption-handoff` | work stops before stage completion, must resume later |

### Minimal Handoff Template

```
Handoff Type:
Active Phase:
Active Stage:
Artifact:
Current State:
Upstream Inputs Used:
Completed Work:
Remaining Work:
Review Outcome Or Review Need:
Traceability Status:
Blockers Or Open Questions:
Next Recommended Action:
```

### Blocked Handoff Requirements

Must include:

- exact blocker
- why revision alone cannot solve it
- which artifact or source is affected
- what category: business requirement / architecture / LLD / task / implementation / tests
- what human or review decision is needed to unblock

### Locked Artifact Handoff Rule

If the next step would require editing a locked earlier-phase artifact, say so explicitly. Do not imply the next actor can silently modify approved business specs, LLDs, or tasks.

---

## Metrics Rules

### When To Record

Record metrics after producing primary artifact(s), before the hard stop. One row per execution turn. Revisions add new rows — never overwrite existing rows.

### Schema

| Field | Description | How To Populate |
|-------|-------------|-----------------|
| Story ID | Work item ID | From command input |
| Layer | `frontend` / `backend` / `shared` | From task's `Layer` field; `shared` for stages that precede the FRONTEND/BACKEND fork (intake, decomposition-level rows covering both) |
| Command | Command name | tech-design / decompose / implement / unit-test / integration-test / validate / change |
| Stage | Workflow stage | Intake / LLD / Decomposition / Implementation / Testing / Integration Testing / Validation / Change Request |
| Date | YYYY-MM-DD | Current date |
| Model | AI model ID | e.g., claude-sonnet-4-6 |
| Start | YYYY-MM-DD HH:MM | Real wall-clock timestamp, captured at command start (see Duration Capture) |
| End | YYYY-MM-DD HH:MM | Real wall-clock timestamp, captured immediately before writing this row |
| Duration (min) | Elapsed minutes | `round((End − Start) in minutes)` — computed from Start/End, never estimated |
| Input Tok | Input tokens | Real usage from session transcript (see Token Capture); chars ÷ 4 fallback if transcript unavailable |
| Output Tok | Output tokens | Real usage from session transcript (see Token Capture); chars ÷ 4 fallback if transcript unavailable |
| Tok Source | `actual` / `estimated` | `actual` when transcript-derived, `estimated` when chars ÷ 4 fallback was used — never leave ambiguous |
| Artifacts | Files produced or updated | Comma-separated relative paths |
| Status | Command outcome | in-review / approved / revised / blocked / done |
| Notes | Optional context | Revision reason, blockers, flags |

### Duration Capture

**Non-skippable first step.** Capturing `Start` is the literal first action of every command and every stage invocation covered by this document — it happens before Pre-Execution Checks, before Entry Conditions are evaluated, before any input file is read. Every command contract and every stage contract must state this explicitly as its first step (see `spec/workflows/shared/STAGE-CONTRACT.md` §Timestamp Capture Rule); a command/stage document that only mentions `Start`/`End` at exit time, without requiring capture at entry time, does not satisfy this policy. This applies uniformly: on a fresh invocation, on a continuation/resume turn, and on a run that ends immediately in `blocked` — there is no path through a command that skips this step.

Real timestamps, not guesses:

1. Before anything else for this command/stage — before reading any input file, before evaluating Pre-Execution Checks or Entry Conditions — run the shell's real clock and record it: `date "+%Y-%m-%d %H:%M"` (bash) or `Get-Date -Format "yyyy-MM-dd HH:mm"` (PowerShell). Hold this as `Start`.
2. Immediately before writing the metrics row (step "When To Record"), run the same command again. Hold this as `End`.
3. `Duration (min) = round((End − Start) in minutes)`. If a human review/approval gate paused execution between Start and End (hard stop awaiting human response), subtract the paused interval — Duration reflects agent work time, not human wait time. Note the excluded wait separately in `Notes` if material (e.g. `excludes ~15min human review wait`).
4. `Start = n/a` is reserved for one narrow case: a mid-session continuation where the turn genuinely has no clean command-start boundary to capture against (e.g. the harness resumed control mid-stage after a crash, with no new command invocation to hook the capture onto). It is never a substitute for forgetting step 1 on a normal invocation, and it is never the default outcome of a continuation turn — a continuation still invoking a command (e.g. resuming after a `revise` handoff) captures `Start` fresh, the same as a first invocation. Never fabricate a number either way. A missing measurement is more honest than an invented one, but a missing measurement should be rare, not routine.
5. **This is enforced at review, not just written as policy.** Per `spec/workflows/shared/STAGE-CONTRACT.md` §Review Contract Rules (Metrics Row Integrity), a `Workflow Metrics` row showing `Start = n/a` or `Duration (min) = n/a` with no justification in `Notes` is an automatic `revise` trigger at that stage's next review gate — blocking `approved` for that turn the same as any other unresolved review finding, even when the artifact content itself is otherwise sound. See §Revision Rows below for how the corrective row is recorded and why fixing it is cheap.

### Token Capture

Real usage first, char-count fallback second — never fabricate a middle number. Two methods produce `actual`; pick whichever your execution context gives you access to. Not a preference — Method A exists because a model running inside Claude Code has no tool exposing its own `message.usage`; Method B exists for any caller that already holds the raw API response.

**Method A — Claude Code CLI/extension transcript** (use when the command is executed by Claude running inside Claude Code CLI or the VSCode extension):

1. **Locate the transcript.** Claude Code writes every turn's real usage to `~/.claude/projects/<project-slug>/<session-id>.jsonl` (project-slug = cwd path with separators replaced by `-`). Pick the `.jsonl` in that folder most recently modified as of `End`. Subagents spawned via the Agent/Task tool land in this same transcript — no separate capture needed for them.
2. **Sum real usage.** Filter entries with `type == "assistant"` whose timestamp falls within `[Start, End]`. For each, read `message.usage`: `input_tokens`, `output_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`.
   - `Input Tok = Î£ input_tokens + Î£ cache_creation_input_tokens + Î£ cache_read_input_tokens` (all three are billed as input).
   - `Output Tok = Î£ output_tokens`.
   - If cache creation/read was non-trivial (say >10% of input), note the split in `Notes` (e.g. `cache_read=42k of 50k input`) — useful signal, not worth its own column.
   - Set `Tok Source = actual`.

**Method B — direct API usage object** (use when the executing agent/script itself holds the provider's raw response — a non-Claude-Code CLI, a direct API call, a different-model agent):

1. **Read usage off the response you already have** — no file lookup, no matching by timestamp:
   - Claude API: `message.usage.{input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens}`
   - OpenAI: `response.usage.{prompt_tokens, completion_tokens}`
   - Gemini: `response.usageMetadata.{promptTokenCount, candidatesTokenCount}`
   - Other providers: whatever field the response documents as token usage.
2. **Sum across every call made during this command's window** (a command may issue several LLM calls — sum all of them, same as Method A sums transcript entries).
3. Set `Tok Source = actual`.

**Fallback.** Only when neither method applies — no transcript file found/matchable (Method A) and no usage object was captured at call time (Method B):
   ```
   1 token ≈ 4 characters of English text
   Input estimate  = Î£ (chars in all files read for this command) ÷ 4
   Output estimate = Î£ (chars in all artifacts written + response prose) ÷ 4
   ```
   Set `Tok Source = estimated`. Do not silently blend — a row is either fully `actual` or fully `estimated`.

### Revision Rows

When a command is revised: do not edit the existing row — it is immutable history. Append a new row with same Story ID + Command, Status = `in-review`. Add revision reason to Notes.

**Metrics-only revise** (triggered by an unjustified `n/a`, per §Duration Capture step 5): the stage's overall review outcome for that turn is `revise` — per the Human-Approval Rule, downstream progression waits for `approved`, and an unjustified `n/a` row means this turn is not yet `approved`, same as any other unresolved review finding. What makes this revise cheap is scope, not exemption: fixing it does not reopen the LLD/task/code/test content review — it only requires appending a new metrics row, same Story ID + Command, Status `in-review`, that either supplies a real `Start`/`End` (if genuinely recoverable, e.g. it exists in the session transcript even though it wasn't captured live) or an explicit justification in `Notes` for why `n/a` stands. Once that row is appended, re-review is a one-line check, not a re-read of the artifact.

### Where To Write

```
spec/traceability/<mirrored-business-path>/TRACEABILITY.md (`Workflow Metrics` section)
```

---

## Conflict Decision Rules

### When To Record

Record before writing any LLD section or code for the conflicting area.

| Trigger | Example |
|---------|---------|
| API contract conflicts with business user story | OpenAPI endpoint shape differs from AC behavior |
| Design reference conflicts with business user story | Figma flow adds a step the spec does not mention |
| Business user story conflicts with existing code | New story changes behavior another story's code implements |
| One user story conflicts with another | AC in story B contradicts approved behavior from story A |
| New LLD conflicts with an existing approved LLD | Story B's LLD assigns different schema/ownership to a resource story A's approved LLD already owns |
| Same-story `LLD-FRONTEND-<id>.md` conflicts with `LLD-BACKEND-<id>.md` | Companion pair disagrees on API/data shape (see LLD-STAGE.md Companion LLD Alignment) |
| Architecture decision conflicts with a business requirement | Spec asks for a stack choice the locked architecture decision excludes |
| A Change Request's cascade breaks a downstream story's touchpoint | `/speccraft.change` walks forward from story P and finds dependent D's Touchpoint on P is now incompatible (Conflict Type `Story vs Story`) |

One row per conflict element. If one stop surfaces three conflicts, write three rows.

### Schema

| Field | Description |
|-------|-------------|
| Decision ID | `DEC-<NNN>` — increment from last row |
| Story ID | Work item where conflict was found |
| Layer | `frontend` / `backend` / `shared` — which layer(s) the conflict affects |
| Date | YYYY-MM-DD |
| Stage | Intake / LLD / Decomposition / Implementation / Testing / Integration Testing / Change Request |
| Conflict Type | `API vs Story` · `Design vs Story` · `Story vs Story` · `LLD vs LLD` · `Story vs Code` · `Story vs Arch` |
| Source A | First conflicting source — reference + specific claim |
| Source B | Second conflicting source — reference + specific claim |
| Conflicting Element | What specifically differs |
| Status | `open` · `resolved` · `deferred` |
| Resolution | Human decision — which source wins, or compromise made — or, when `Decided By = auto-mode-ai`, the AI's reasoned resolution per `speccraft.orchestrate.md` § Auto Mode |
| Decided By | Human name, role, `human-in-loop`, or `auto-mode-ai` (auto-mode runs only — see `speccraft.orchestrate.md` § Auto Mode; requires a real `Resolution`, never a placeholder) |
| Recorded By | AI model that detected and logged it |
| Unblocks | Stage/task/LLD section that can now proceed |

### Status Values

- `open` — conflict detected, hard stop in effect, human has not responded (interactive mode only — an auto-mode run never leaves a row `open`, see below)
- `resolved` — explicit decision provided, work may continue — by a human (`Decided By = human-in-loop` or a name/role), or by the AI in an auto-mode run (`Decided By = auto-mode-ai`)
- `deferred` — human acknowledged conflict, agreed to defer; current story may continue with scope reduced (interactive mode only — auto mode always resolves rather than deferring, since deferring still implies a later human decision)

### Rules

**Always record before continuing.** No LLD section, no task, no code change for any area covered by an `open` conflict row.

**Do not self-resolve — interactive mode.** AI may identify, propose options, and write the row — but Status must stay `open` until human responds. **Auto mode is the documented exception:** the AI resolves and sets Status to `resolved` (`Decided By = auto-mode-ai`) in the same turn, per `speccraft.orchestrate.md` § Auto Mode — never for any other command or mode.

**Rows are immutable.** Never overwrite. If resolution changes, append a new row `DEC-<previous>-R1`.

### Where To Write

```
spec/traceability/<mirrored-business-path>/TRACEABILITY.md (`Conflict Decisions` section)
```

---

## Change Request Log Rules

### When To Record

Record whenever `/speccraft.change` (CR-5) applies a delta to a story — whether that
story is the originating story S or a cascaded dependent found by the CR-3 walk.
One entry per CR per story: S gets one `## Change Request: CR-<n>` entry (Role
`originating`), each cascaded story gets its own entry in its own file (Role
`cascaded`), each using that story's own CR sequence number.

### Entry Schema

One key/value table per `## Change Request: CR-<n>` section.

| Field | Description | How To Populate |
|-------|-------------|-----------------|
| CR ID | `CR-<n>` — this story's own sequence, increment from its last CR entry | From the section heading |
| Role | `originating` / `cascaded` | `originating` for story S; `cascaded` for every other story in the bundle |
| Originating Story | Story ID whose CR triggered this bundle | Self, when Role = `originating` |
| Source CR File | Path to the human-authored CR file | e.g. `spec/business/cr-changes/<module>/CR-<STORY-ID>-<n>.md`; blank for a cascaded entry with no CR file of its own |
| Date | YYYY-MM-DD | Current date |
| Trigger Reason | Which upstream Touchpoint/coupling triggered this entry | Blank/self for `originating`; names the P→D coupling for `cascaded` |
| Requirement IDs Added | Comma-separated new requirement/AC IDs | From CR-5 ID assignment |
| Requirement IDs Superseded | Comma-separated, `superseded by <new-id>` notation preserved | From CR-5 ID assignment |
| Spawned Task IDs | Comma-separated new task IDs for this story's delta | From the delta-scoped decomposition |
| Bundle Status | `approved` / `revise` / `blocked` | Mirrors the whole-bundle review outcome (see `CHANGE-REQUEST-STAGE.md` Review Checklist) |

The section body holds exactly one real markdown table using these field names as
its literal header row, one data row per CR ID (append a new `-R1`/`-R2` row on
revision, per §Revision Rule below — never edit the row in place):

```
## Change Request: CR-<n>

| CR ID | Role | Originating Story | Source CR File | Date | Trigger Reason | Requirement IDs Added | Requirement IDs Superseded | Spawned Task IDs | Bundle Status |
|-------|------|--------------------|-----------------|------|-----------------|------------------------|------------------------------|--------------------|----------------|
```

### Cascade Impact Table (originating story's entry only)

Persists the CR-3 discovery walk result — otherwise this only ever exists in the
command's chat handoff and is lost once the conversation scrolls away. Written
once, on story S's `## Change Request: CR-<n>` entry only; cascaded stories do not
repeat it.

| Field | Description |
|-------|-------------|
| Story ID | A story reached during the CR-3 forward walk |
| Relationship | How it was reached (e.g. `direct dependent of S`, `dependent of <parent story>`) |
| Decision | `pruned` (unaffected) / `included` (compatible, in bundle) / `blocking` (conflicting — only possible if the run ultimately blocked) |
| Reason | Why — the Touchpoint compatibility judgment, or the conflict found |

Written as a second table directly below the CR entry table, under its own
`### Cascade Impact` subheading, one row per story visited during the CR-3 walk:

```
### Cascade Impact

| Story ID | Relationship | Decision | Reason |
|----------|--------------|----------|--------|
```

### Revision Rule

Same idiom as Conflict Decisions: never overwrite. If a bundle is revised, append
a new row for the same CR ID suffixed `-R1`, `-R2`, ... rather than editing the
original entry in place — this preserves the CR's review-cycle history.

### Where To Write

```
spec/progress/<module>/progress-<STORY-ID>.md (`## Change Request: CR-<n>` section, one per touched story)
```

---

## Blocker And Decision Log Rules

Distinct from Conflict Decision Rules above — this covers a task's general blockers and non-conflict decisions, not source-vs-source conflicts.

### Blockers Schema

Under `## Task: TASK-{id}` → `### Blockers` in `spec/progress/<module>/progress-{STORY-ID}.md`.

| Field | Description |
|-------|-------------|
| Blocker ID | `BLK-<NNN>` — increment from last row |
| Stage | Stage where blocker surfaced |
| Description | What is blocked |
| Source | What caused the blocker |
| Resolution Required | What must happen to unblock |
| Status | `open` · `resolved` (auto-mode runs resolve in the same turn — see `speccraft.orchestrate.md` § Auto Mode) |
| Resolution Date | YYYY-MM-DD |
| Resolution Notes | For an auto-mode resolution, state the reasoning — same requirement as a human resolution note |

### Decisions Schema

Under `## Task: TASK-{id}` → `### Decisions` in `spec/progress/<module>/progress-{STORY-ID}.md`.

| Field | Description |
|-------|-------------|
| Decision ID | `TDEC-<NNN>` — increment from last row |
| Stage | Stage where decision was made |
| Decision | The decision itself |
| Why | Reasoning |
| Alternatives Considered | Options rejected and why |
| Approver | Human name, role, `human-in-loop`, or `auto-mode-ai` (auto-mode runs only — see `speccraft.orchestrate.md` § Auto Mode) |
| Date | YYYY-MM-DD |

