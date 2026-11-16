# Task guide and catalog map

Start in `design-system`, check `git status`, and read the task's applicable app instructions. `contract.md` opens with how the apps, the registry, the workbench and the guides fit together; read that first if the request touches more than one of them. Each task below says what to read for it; the entry and the target app's own root instructions are meant to be enough. Use explicit absolute checkout paths; do not assume the source app is the default sibling or that another worktree contains the same changes.

## Find the right catalog

- Robin viewer: `/apps/studio/`; `registry/index.json` includes the workbench self-collection plus app snapshots. For an app, use `?collection=<id>&section=screens` only when it has screen fixtures.
- App snapshots: `registry/apps/<id>/collection.json`; source repository and inspected revision are in the manifest. An optional inventory maps source paths, fixtures and states and distinguishes recorded check results from current verification.
- Reference studies: `/apps/studio/?library=references`; `registry/references.json`. Visual sheets and standard patterns are interpretation, not production application screens. Do not invent screenshots from a recipe or claim screens exist when none are registered.
- Capture studio: `/apps/studio/?library=capture`; registered scenes live in `packages/capture/scenes.mjs`, while actual scene code stays app-owned.
- Portable blueprint: `blueprints/workbench/README.md`; engine distribution and empty catalog live in `templates/blank/`. `blueprints/workbench/APP-DESIGN.template.md` is the skeleton for an app's own design contract.
- Token advice: `npm run tokens:advice` prints non-failing notes for the registered app snapshots, or for token files given as arguments. The notes are advice and never fail a check.

## “Grab new thumbs for app X on my personal site”

Discover → capture → inspect → export/stage. No MCP setup is part of this workflow.

1. Open Capture studio from the home navigation or read `/packages/capture/catalog.json`; resolve X to its scene id. Current apps are Focus and Great Circle. Missing apps need an explicitly scoped app-owned adapter; do not fabricate or capture signed-in/private state.
2. Plan `npm run capture -- --scene <scene-id> --profile stethem-thumb --theme both --plan`, then run without `--plan`. Choose one theme if the user requested it.
3. Inspect the generated 800 × 600 `card.png` at real card size, including legibility, composition and source metadata. It is the complete 4:3 scene, not a cropped mobile capture.
4. Export/download or stage the selected PNG with `provenance.json` from its dated `review/captures/` folder. Tell the user which app/theme it represents and the intended site use. Keep existing approved site images untouched until replacement is explicitly authorized. Capture/staging does not imply deployment.

## “Grab screens for X”

For public presentation images, start at `/apps/studio/?library=capture`.
Its app/screen/profile selectors use the same published fixture registry as the
workbenches. Open the unscaled screen and capture it with a fresh browser context
at the displayed viewport and density. These are synthetic presentation fixtures,
not signed-in production screens. No app servers are required. Terminal agents
can use `node tooling/capture-public.mjs --app X --profile desktop --plan`, then
omit `--plan`; see the capture guide. The page itself does not generate PNGs.

For locally validated exports and provenance, follow the original workflow:


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
3. The installer creates only a new `workbench/`, with an empty collection list, scoped engine, adaptation notes, agent entry point and source/hash lock. It refuses to overwrite an existing workbench. For a project that already has one, follow the upgrade task below rather than bypassing the guard.
4. Follow the copied `workbench/DESIGN.md`. Reuse the target's actual production UI and framework. Add a short pointer to its root AGENTS/README without replacing existing instructions. Add package scripts only when useful for that target; static apps do not need a framework or bundle.
5. Run that project's checks and fixture/browser QA. Report new/changed files, exact source pin and remaining gaps. No commit, upload, publication or deployment is implied by blueprint installation.

## “Upgrade the blueprint in app X”

This brings an installed `workbench/` and its pinned token validator to the current version. It does not change the app's tokens, fixtures, collection, instructions or scripts.

Read this entry and the app's root instructions. The blueprint README repeats these steps for a reader inside an app; you do not need both.

1. Locate and verify X's local checkout, branch and uncommitted files, and read its root instructions.
2. Check this repository's `git status`. Upgrade from a committed checkout, so the app's lock records a commit. If there are uncommitted changes here, say so and ask before going on. The lock records the commit's hash but cannot check that the commit is pushed or kept, so use one on a branch the owner intends to keep and name the commit and branch in your report.
3. Run `node tooling/blueprint.mjs --upgrade --check /absolute/app/path` and read the plan: files it would replace, add and remove, files kept because the app adapted them, and the token validator. Added files can include `APP-DESIGN.template.md`, a skeleton that changes nothing until someone copies it, and the workbench's own MIT `LICENSE` and `LICENSING.md`. The license files cover the copied workbench code only, not the app; name them in your report so the owner sees them arrive.
4. If the tool refuses, stop and report why. An edited file under `vendor/`, a token copy that does not match its pin, or an app file that clashes with a new blueprint file each need the owner's decision. Do not edit a vendor file or a lock to get past the refusal.
5. Run it again without `--check`.
6. The tool says for each kept file whether the blueprint's version changed. Where it did, compare the app's copy with the one in `templates/blank/` and bring over what applies. Where it did not, there is nothing to merge.
7. Run the app's own checks as its root instructions name them. The upgrade changes what a person sees in the app's local workbench, so include its browser checks where it has them, and open the local workbench to see that it loads.
8. Report both versions, the files changed and kept, the source pin, and which checks ran and which did not. Do not commit unless asked, even where the app's instructions describe committing as part of its own workflow. If a central refresh was also asked for, continue with the snapshot task below.

## “Write or rework the direction for X”

Read this entry and the Direction section of `contract.md`.

1. Find where X's direction lives. For an app it is `direction` in the app's `design/collection.json`. If the app has none, its snapshot here in `registry/apps/<id>/collection.json` may hold a draft. The Workbench's own is in `collections/original/workbench/collection.json`. Reference studies have none and are not given one.
2. Derive it from what the product does and who it is for: read the app's `DESIGN.md`, its landing copy and its fixture names. Without the app's checkout, use what its snapshot holds here: the summary, fixture names, inventory and guide notes. Say in your report what you could not read. Do not derive it from the token table or from what is fashionable.
3. Write the fields the contract lists. Character is two or three concrete words, not clean, modern, sleek, minimal or premium. World is a place or a material, not a list of the app's colors. Moments are the one or two places that get rich color and detail. Leave a field out rather than fill it with words that fit any product.
4. Where the owner gave words for a field, use them exactly. Revise another field only where it now contradicts the owner's words, and list every field you changed with its old and new text so the owner can undo any of them.
5. Mark text you wrote with `"status": "draft"`. The mark covers the whole block: keep it while any field is not the owner's own or approved text, and say which fields are the owner's words.
6. With edit access to the app: change `design/collection.json` there, keep the Direction section of its `DESIGN.md` saying the same thing, run the app's checks, then refresh the snapshot. Without it: edit only the `direction` block of the snapshot here and keep it marked as a draft. Never hand-edit any other field of a snapshot.
7. Run `npm run guides:build`, then `npm run check`.
8. Serve this checkout with `npm run dev`. If it reports that port 4310 is taken, another checkout may be using it: run `node tooling/serve.mjs . <port>` with a free port instead. Open `/apps/studio/?collection=<id>`, confirm the version in the header matches `package.json`, and read the Direction panel on Foundations and on one fixture section.

## Refresh a one-way app snapshot

Run `node tooling/sync-registry.mjs --check /absolute/app/path` to validate and inspect drift, then omit `--check` for the requested refresh. Paths may name one or several apps. All requested inputs validate before writes. The central script resolves its own repository root, not the caller's working directory.

The refresh preserves unmentioned apps, original collections and index metadata. Duplicate requested app ids fail. Identical manifest/tokens/inventory retain an already recorded integration revision; changed content resets it to `null` with `unpublished-local-snapshot`, never silently carrying forward a now-unverified commit. Base revision remains separate. An unreferenced old inventory file may remain on disk when the app removes its inventory; the manifest no longer loads it. File writes are individually replaced and the index is written last, not a cross-filesystem transaction.

Run `node --test tests/sync-registry.test.mjs tests/blueprint.test.mjs` for workflow regression tests, then `npm run check`. Do not confuse central check success with actual app server/browser success.

For a standalone portability smoke test, run `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs PLAYWRIGHT_CHANNEL=chrome node tests/workbench/blueprint-browser.mjs` with an existing browser installation. It installs into a temporary target, serves only those copied files, checks desktop/mobile and repeated navigation, and writes local review evidence to `review/blueprint-qa/`.

## Read a product design contract

Start at `llms.txt` or the studio's Implementation guide link. Each existing Robin entry has `registry/guides/<id>/design-system.md`; reference entries have adaptation guidance explicitly distinguished from official product contracts. Every guide has the structure described under Guides in `contract.md`: direction, the app's prose notes, then generated tables. Explicit registry sync copies the notes and release freshness checks compare them to the source. Run `npm run guides:build` after syncing, then `npm run check`. Generated guides contain selected token/fixture fields, not raw source metadata.

For an authorized app change, follow its repo instructions and edit its actual components and tokens, then refresh the one-way snapshot. A public guide does not grant permission or ensure a crawler reads it. Public capture navigation is informational; fresh capture generation still needs a local checkout with approved scenes.
