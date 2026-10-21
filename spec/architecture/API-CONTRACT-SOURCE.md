# API-CONTRACT-SOURCE.md

Optional, per-module declaration of a live Swagger/OpenAPI endpoint — the input `/speccraft.sync-swagger` reads to pre-populate or refresh `contracts/<module>/<module>.yaml`.

## Why This File Exists

The contract convention (`contracts/<module>/<module>.yaml`, one growing file per module, written/updated by backend `/speccraft.implement` — see `spec/SPEC-VERSION.md` "Note — v11") works completely without this file. A project with no live Swagger endpoint never fills this in, and every stage that reads `contracts/<module>/<module>.yaml` behaves identically either way.

This file exists only for projects that *do* have a live Swagger/OpenAPI endpoint and want a convenience command to seed or refresh the contract file from it, instead of hand-copying.

## Read-Only-By-`/speccraft.sync-swagger` Rule

This file is read **only** by `/speccraft.sync-swagger` when a human explicitly invokes it. It is never read by `/speccraft.tech-design`, `/speccraft.decompose`, `/speccraft.implement`, `/speccraft.orchestrate`, or any other stage or command. It is deliberately **not** part of `spec/AGENTS.md`'s mandatory Read Order (neither planning nor execution) and deliberately **not** added to `spec/SPEC-VERSION.md`'s Tracked Spec Files list — nothing caches against it, and no stage's Agent Delta needs to summarize it. These two omissions are intentional; do not "fix" them by adding this file to either list.

No `## Agent Delta` section is included here, for the same reason — the Agent Delta Protocol (root `README.md`) exists for files agents must read every session; this file is the opposite; a delta would misleadingly imply it belongs in a mandatory read path.

## Per-Module Swagger URL

| Module | Swagger URL | Notes |
|---|---|---|
| _(none configured — add a row per module that has a live Swagger/OpenAPI endpoint)_ | `{{SWAGGER_URL}}` | |

Exactly one URL per module, matching the 1:1 `contracts/<module>/<module>.yaml` convention. If a module's live spec needs more than one source, resolve that as a project-specific decision before adding a row — this file does not support multiple URLs per module.
