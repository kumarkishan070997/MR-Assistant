# sdd-insights

Local tool, not spec content. Do not add to `spec/SPEC-VERSION.md` tracked list. Agents must not read `sdd-insights.html` as planning/execution context.

## What

`sdd-insights.html` — self-contained, no server, no external dependencies (no CDN, no build step). Reads `spec/traceability/**/TRACEABILITY.md` shards and, optionally, `spec/progress/**/progress-*.md` files directly in-browser and renders a filterable, graphical view. Nothing is written back to disk or stored outside the browser tab's memory — closing/reloading the page clears all loaded data; re-pick the folder(s) to reload.

## How to use

1. Open `sdd-insights.html` directly in a Chromium-based browser (Chrome/Edge) — double-click, or `file://` path.
2. Click **Select traceability folder** and pick `spec/traceability`.
3. Use the sidebar tree to filter by module/story (mirrors `spec/traceability/<module>/<STORY-ID>/`).
4. Switch tabs for each traceability chain link (including Unit Test → Integration Test, populated for backend-tagged tasks only), Workflow Metrics (with per-story cost rollup), Conflict Decisions, and Change Requests.
5. Each table has a **Layer** filter alongside the Status filter — use it to narrow a full-stack story down to just its frontend tasks, just its backend tasks, or leave it on all to see both chains together.
6. The **Business → LLD** and **LLD → Task** tabs additionally have a **Source** filter — `original` for rows written by `/speccraft.tech-design`/`/speccraft.decompose`, or a specific `CR-<n>` for rows a `/speccraft.change` bundle added — use it to isolate exactly what one Change Request touched in a story's traceability.
7. Click **Select progress folder** and pick `spec/progress` to populate the **Change Requests** tab. It lists every `## Change Request: CR-<n>` entry found (per `spec/workflows/shared/SHARED-POLICIES.md` §Change Request Log Rules), with the originating story's entry expandable to show its Cascade Impact table — the CR-3 discovery walk result (which dependent stories were pruned/included/blocking). This tab is independent of the Stories sidebar, which filters traceability data only; it can be used with or without the traceability folder loaded.

Requires `webkitdirectory` folder-input support (Chrome/Edge). Not supported in Firefox/Safari folder picker.
