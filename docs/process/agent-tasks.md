# Task guide and catalog map

Start in `design-system`, check `git status`, and read the task's applicable app instructions. Use explicit absolute checkout paths; do not assume the source app is the default sibling or that another worktree contains the same changes.

## Find the right catalog

- Robin viewer: `/apps/studio/`; `registry/index.json` includes the workbench self-collection plus app snapshots. For an app, use `?collection=<id>&section=screens` only when it has screen fixtures.
- App snapshots: `registry/apps/<id>/collection.json`; source repository and inspected revision are in the manifest. An optional inventory maps source paths, fixtures and states and distinguishes recorded check results from current verification.
- Reference studies: `/apps/studio/?library=references`; `registry/references.json`. Visual sheets and standard patterns are interpretation, not production application screens. Do not invent screenshots from a recipe or claim screens exist when none are registered.
- Capture studio: `/apps/studio/?library=capture`; registered scenes live in `packages/capture/scenes.mjs`, while actual scene code stays app-owned.
- Portable blueprint: `blueprints/workbench/README.md`; engine distribution and empty catalog live in `templates/blank/`.

## “Grab new thumbs for app X on my personal site”

Discover → capture → inspect → export/stage. No MCP setup is part of this workflow.

1. Open Capture studio from the home navigation or read `/packages/capture/catalog.json`; resolve X to its scene id. Current apps are Focus and Great Circle. Missing apps need an explicitly scoped app-owned adapter; do not fabricate or capture signed-in/private state.
2. Plan `npm run capture -- --scene <scene-id> --profile stethem-thumb --theme both --plan`, then run without `--plan`. Choose one theme if the user requested it.
3. Inspect the generated 800 × 600 `card.png` at real card size, including legibility, composition and source metadata. It is the complete 4:3 scene, not a cropped mobile capture.
4. Export/download or stage the selected PNG with `provenance.json` from its dated `review/captures/` folder. Tell the user which app/theme it represents and the intended site use. Keep existing approved site images untouched until replacement is explicitly authorized. Capture/staging does not imply deployment.

## “Grab screens for X”

1. Identify X via its collection id, title and source repository. Check whether the user wants real app screen evidence or a presentation capture; ask only if the distinction changes the result and is unclear.
2. If a capture scene exists, follow `capture-studio.md` and run `node tooling/capture.mjs --help`. Current scenes are `focus-reader` and `great-circle-route`; no arbitrary URL mode exists. Example: `npm run capture -- --scene focus-reader --profile all --theme both --focus-root /absolute/checkout`.
3. Otherwise inspect X's `fixtures` with `section: "screens"` and app-owned setup. Start the documented local server and capture declared routes/states with a fresh browser context, fixed viewport/theme and sample data. A site that has no capture adapter may still have real screen fixtures; do not mislabel ordinary fixture screenshots as a validated studio scene export.
4. If neither exists, report the gap and add an app-owned deterministic fixture/scene only when the requested work authorizes that project edit. Do not use private signed-in state, remote provider imagery or unapproved assets as a substitute.
5. Inspect the pixels. Report app/scene/state, source HEAD and dirty status, viewport/theme, timestamp, file hashes and limitations. Studio output uses ignored `review/captures/`; never automatically overwrite approved site thumbnails. Browser-only QA and capture do not change the source app.

The browser entrypoint is `/apps/studio/?library=capture`; deep links accept `scene`, `theme` and `profile`. `/packages/capture/catalog.json` and `npm run capture -- --list` expose the same allowlist. Plan any subset with `--plan`; `--scene all --profile all --theme both` requests 28 images. A browser-only agent can inspect, preview and download already generated outputs; generating exact-density validated exports requires terminal access to this checkout. The static address is not a remote shell service.

Seven profiles cover desktop, mobile, Apple dimension targets (two iPhones, iPad, Mac) and the intentional 4:3 stethem thumbnail. App Store dimension targets are web renders, not native captures or submission approval. Only the thumbnail profile includes an 800 × 600 derivative. Source is checked before/after; a failed run is not promoted as latest. The runner manages isolated loopback servers and does not install dependencies. See the capture guide for required Playwright/browser setup.

## “Put the blueprint in repo Y so we can go to work”

1. Locate and verify Y's existing local checkout, root instructions, branch and dirty files. Read its applicable skills. A repository name is not permission to guess a filesystem destination.
2. Read `blueprints/workbench/README.md`. From design-system run `node tooling/blueprint.mjs --check /absolute/project/path`, inspect the plan, then run without `--check` within the user's authorized scope.
3. The installer creates only a new `workbench/`, with an empty collection list, scoped engine, adaptation notes, agent entry point and source/hash lock. It refuses to overwrite an existing workbench. For an existing integration, inspect and adapt it manually rather than bypassing the guard.
4. Follow the copied `workbench/DESIGN.md`. Reuse the target's actual production UI and framework. Add a short pointer to its root AGENTS/README without replacing existing instructions. Add package scripts only when useful for that target; static apps do not need a framework or bundle.
5. Run that project's checks and fixture/browser QA. Report new/changed files, exact source pin and remaining gaps. No commit, upload, publication or deployment is implied by blueprint installation.

## Refresh a one-way app snapshot

Run `node tooling/sync-registry.mjs --check /absolute/app/path` to validate and inspect drift, then omit `--check` for the requested refresh. Paths may name one or several apps. All requested inputs validate before writes. The central script resolves its own repository root, not the caller's working directory.

The refresh preserves unmentioned apps, original collections and index metadata. Duplicate requested app ids fail. Identical manifest/tokens/inventory retain an already recorded integration revision; changed content resets it to `null` with `unpublished-local-snapshot`, never silently carrying forward a now-unverified commit. Base revision remains separate. An unreferenced old inventory file may remain on disk when the app removes its inventory; the manifest no longer loads it. File writes are individually replaced and the index is written last, not a cross-filesystem transaction.

Run `node --test tests/sync-registry.test.mjs tests/blueprint.test.mjs` for workflow regression tests, then `npm run check`. Do not confuse central check success with actual app server/browser success.

For a standalone portability smoke test, run `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs PLAYWRIGHT_CHANNEL=chrome node tests/workbench/blueprint-browser.mjs` with an existing browser installation. It installs into a temporary target, serves only those copied files, checks desktop/mobile and repeated navigation, and writes local review evidence to `review/blueprint-qa/`.
