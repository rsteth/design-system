# Design-system agent entry point

Read `README.md`, then `docs/process/agent-tasks.md` for the requested task. Read `docs/process/contract.md` before changing interfaces, ownership or snapshots. Check repository status first and preserve unrelated uncommitted work. Look for applicable project-local skills before implementation; do not assume a skill is installed.

## Current scope

Workbenches are one-way viewers. Application source, production UI, fixtures, capture scenes and token values stay app-owned. Registry documents and generated catalogs are derived snapshots. Do not add automatic workbench-to-app edits, a general-purpose theme editor, backend persistence or silent cross-project synchronization. stethem stays a static site; do not convert it to React or a hosted editing service.

- `packages/workbench/`: shared engine and scoped workbench skin. Keep any companion changes in `templates/blank/vendor/workbench/` identical and verify the engine tests.
- `blueprints/workbench/` + `templates/blank/`: portable blueprint and empty runnable starter. `tooling/blueprint.mjs` adds a new `workbench/` to a named target; it refuses existing destinations and leaves root instructions/scripts untouched.
- `registry/index.json` + `registry/apps/`: own-work catalog and app snapshots. Use `tooling/sync-registry.mjs`, never a parallel hand-edited theme owner. Refreshing one app must preserve other entries and must not claim an old integration revision for changed content.
- `registry/references.json` + `collections/reference*`: attributed independent studies. They are separate from app snapshots/vendors. Do not treat speculative recipes or neutral patterns as real app screens.
- `packages/capture/` + `tooling/capture.mjs`: allowlisted local capture recipes. App scenes remain in their source checkouts. Outputs under ignored `review/` are review evidence, not production assets.

## Common language

“Grab screens for X” means discover X's screen fixtures or approved scenes and make reproducible captures with provenance. “Put the blueprint in repo Y so we can go to work” means verify the target checkout, install/adapt the reusable blueprint without overwriting existing work, and leave a discoverable pointer in the target's own instructions when appropriate. See the task guide for exact entry points and limits.

## “Grab new thumbs for app X on my personal site”

Keep the agent path simple; no MCP server is configured or needed. Discover X in the studio's **Capture studio** tab or `packages/capture/catalog.json`, map it to an approved scene, and use `stethem-thumb`. Run `npm run capture -- --scene <scene-id> --profile stethem-thumb --theme both --plan`, then omit `--plan` to capture. Inspect both themes at actual 800 × 600 card size and check source/version/hash metadata. Export or stage the chosen `card.png` and provenance under ignored `review/captures/`, and report the files and proposed site usage. Do not silently copy into the personal site's production assets, replace approved images or publish. If X lacks an approved scene, report the missing adapter instead of inventing an app screenshot. See `docs/process/capture-studio.md` for exact commands and boundaries.

## Verification and publication

Use Node 20+ and the existing pinned dependencies. Run `npm run check` for central validation, tests and static build; app-specific checks and browser tests are separate. Do not report missing servers, unavailable capture scenes, stale images or skipped checks as passed. Run focused regression tests while developing and the full gate after final edits.

Do not publish, push, deploy, replace approved images, enable Actions schedules or modify unrelated projects as an incidental step. Any future one-way automation should pin exact source inputs and produce reviewable artifacts/changes; see `docs/process/one-way-sync.md`.
