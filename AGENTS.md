# AGENTS.md instructions for this repository

<INSTRUCTIONS>
# AGENTS.md

## Purpose

This is the root bootstrap file for any AI agent entering this repository.

It is intentionally thin.

The authoritative workflow, policy, architecture, and command documents live under `spec/`.

Do not treat this root file as the full operating contract.

---

## Read First

Any agent entering this repository should read in this order:

1. `spec/SPEC-FOLDER-STRUCTURE.md`
2. `spec/AGENTS.md`
3. `spec/WORKFLOW-OVERVIEW.md`
4. the relevant stage document under `spec/workflows/`
5. `spec/init.md` if execution work is active

---

## Repository Model

This repository is organized with clear separation, and has **two independent project roots** for code — not one shared `src-code/`:

- `spec/` = source of truth for workflow governance, architecture, requirements, LLD (two linked LLDs per story), tasks (Layer-tagged), and traceability
- `src-code-frontend/` = frontend project (created by `/speccraft.scaffold frontend`, structured per the frontend stack locked in `spec/architecture/ARCH-DECISIONS.md`)
- `src-code-backend/` = backend project (created by `/speccraft.scaffold backend`, structured per the backend stack locked in `spec/architecture/ARCH-DECISIONS.md`)
- `.claude/commands/` = thin root-level command stubs for Claude Code — each points to its canonical contract under `spec/commands/`
- `.agents/skills/` = same commands as Codex CLI skills (`SKILL.md` per command) — each points to its canonical contract under `spec/commands/`
- `.github/prompts/` = same commands as GitHub Copilot Chat prompt files — each points to its canonical contract under `spec/commands/`
- `.gemini/commands/` = same commands as Gemini CLI TOML commands — each points to its canonical contract under `spec/commands/`

`src-code-frontend/` and `src-code-backend/` are each a deployable project root. All implementation code, configuration, and build output for a given layer live inside its own root. Both are self-contained, independent of each other, and separate from the workflow governance in `spec/`. A task's `Layer` field determines which root an agent works in — never mix frontend and backend code into the other root.

AI-first workflow should begin from `spec/`, not from either code root.

---

## Commands

`.claude/commands/` (Claude Code), `.agents/skills/` (Codex CLI), `.github/prompts/` (GitHub Copilot), `.gemini/commands/` (Gemini CLI) each hold thin bootstrap entrypoints only — every one tells the agent to read its counterpart under `spec/commands/` before acting.

Cursor, Grok Build, Windsurf/Devin, and Qodo also read this root `AGENTS.md` directly — no dedicated folder strictly required for those, but Qodo's own `agents/` format is added anyway for its native slash-command menu.

Canonical command contracts live under:

- `spec/commands/`

---

## Rule

If this root file and a document under `spec/` ever appear to disagree, `spec/` wins.

</INSTRUCTIONS>

