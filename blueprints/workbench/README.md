# Portable one-way workbench blueprint

This blueprint is maintained in `rsteth/design-system` at `blueprints/workbench/`, with the runnable engine and empty catalog in `templates/blank/`. It can be copied and adapted for a new project. It does not copy Focus, Great Circle, stethem, reference studies, capture outputs or application source.

## Install into another project

From a reviewed design-system checkout, run:

```sh
node tooling/blueprint.mjs --check /absolute/path/to/project
node tooling/blueprint.mjs /absolute/path/to/project
```

The installer adds only a new `workbench/` directory. It refuses an existing workbench, source/target overlap and symlinked targets. It does not merge root instructions, edit package scripts, install dependencies, commit, push or deploy. If a filesystem error interrupts the copy, inspect the new partial directory before retrying; no existing project files are overwritten. The caller must be authorized to edit the selected project. A named GitHub repository alone is not a verified local checkout: locate it first.

## Upgrading an installed workbench

From a reviewed and committed design-system checkout, preview and then apply. The lock records that commit's hash without checking that it is pushed or kept, so use a commit the owner intends to keep:

```sh
node tooling/blueprint.mjs --upgrade --check /absolute/path/to/project
node tooling/blueprint.mjs --upgrade /absolute/path/to/project
```

The upgrade reads `workbench/blueprint-lock.json` to tell what the app changed since installation:

- A file that still matches the lock is replaced with the new version.
- A file the app adapted, usually `collections.json`, `index.html` and `main.mjs`, is kept. The tool says for each kept file whether the blueprint's own version changed; where it did, compare the two by hand.
- A new blueprint file is added. If the app already has a different file of that name, nothing is changed. Added files can include the workbench's own MIT `LICENSE` and `LICENSING.md`, which cover the copied workbench code only and not the app.
- An edited file under `vendor/` stops the upgrade. Restore it first.
- `design/vendor/tokens.mjs` is replaced when `design/vendor/pin.json` pins it and the copy matches its pin.

Nothing else in the project is read or written: not the app's collections, root instructions, scripts or dependencies. The tool validates everything before the first write, writes the lock last, and does not commit. Afterwards run the app's own checks and review the diff as one change. The lock lists the kept files under `adapted`.

`blueprint-lock.json` records the exact copied file hashes, source HEAD and whether the source was a dirty local snapshot. A dirty source is not a published release. For remote use, obtain an explicitly reviewed commit of design-system and run the same installer; never fetch and execute a moving branch automatically. The supplied original design-system code and documentation are MIT licensed; retain the included `LICENSE` and read `LICENSING.md`. The host application, app fixtures and separately licensed material retain their own terms. A license grant does not publish or deploy anything.

## Start without a build

From the installed `workbench/` directory:

```sh
python3 -m http.server 4100 --bind 127.0.0.1
```

Open `http://127.0.0.1:4100/`. The catalog intentionally starts empty. HTTP is required for browser modules and fetch; `file://` is unsupported. There is no React, parent repository or package installation requirement. The workbench uses its own skin, not a production-site theme.

## Adapt to the project

1. Read the destination repository's root instructions, build/test scripts and existing `DESIGN.md`. Installing the workbench must not change the app's framework, behavior, appearance or public URLs. That is a rule for installation, not a freeze on the product: later product work may change copy, layout and scale under the app's own instructions. Static HTML remains static HTML.
2. Follow `DESIGN.md` here to expose deterministic app-owned fixtures and a manifest/token document. Copy or explicitly export these into `workbench/collections/<app>/`; add that manifest's relative URL to `collections.json`.
3. Keep production components and fixture adapters in the app. The engine embeds the declared fixture URLs in isolated frames. It does not import, rewrite or save edits back to application source.
4. Update the title in `main.mjs`/`index.html`. Keep engine code under `vendor/workbench/` unchanged. Adopt a reviewed whole-engine update rather than editing vendor files.
5. Add a short pointer to the target root `AGENTS.md` or README if appropriate, preserving existing instructions: “For workbench fixtures and screenshots, read `workbench/AGENTS.md` and `workbench/DESIGN.md`. App source is authoritative; workbench flow is one-way.” This installer leaves that root edit for the agent's reviewed integration. When you write root instructions, say what later work may change as well as what it must keep. A line such as “preserve the copy” will be followed literally long after the installation it was written for. Root instructions win where they differ from this blueprint; the blueprint's own files are hash-locked and are not edited to match.
6. Run the project's existing checks and verify desktop/mobile fixtures, missing-server handling and repeated reset. A missing fixture server is not a successful test. Name the exact check commands in the root instructions, and give browser tests their own port or an ephemeral one so they do not collide with a running workbench server.

## The app's own design contract

`APP-DESIGN.template.md` is a skeleton for the target's root `DESIGN.md`. Copy it there and fill it in; do not edit the copy inside `workbench/`. It keeps two things apart that tend to merge:

- The contract says how the product looks, sounds and behaves today: direction, voice, interaction, scale and deliberate exceptions.
- Dated verification notes and the reasoning behind earlier decisions go in a separate history file, so the contract never has to say that an earlier paragraph no longer holds.

The skeleton opens with a five-line direction. The same five lines can be recorded in `collection.json` as the optional `direction` block described in `DESIGN.md`, so the workbench and generated guides lead with intent instead of a token table. Record it in one place and let the others quote it.

## Screens versus screenshots

A **screen fixture** is a real app route/state listed in the collection with `section: "screens"`. A **capture scene** is an intentional, reproducible composition for a screenshot. A reference pattern is neither evidence of an existing application screen nor a capture service.

For “grab screens for this project,” first identify the requested screen fixtures and purpose. Use synthetic/sample state, start the app's own fixture server, and capture with a fresh browser profile and explicit viewport/theme. Keep source revision, dirty state, scene/version, timestamp, output hashes and limitations beside the images. The central design-system has a capture runner for explicitly registered scenes; new projects require an app-owned scene/adapter and reviewed registration, not an arbitrary remote URL.

## Document screenshots

Screenshots in a README or docs folder go stale silently. Produce them with a command, from the same synthetic fixtures the workbench shows:

1. Start the app's fixture server, or let the capture script start it on an ephemeral port.
2. Open each chosen screen fixture in a fresh browser context at a fixed viewport, with reduced motion on.
3. Save full-page images to the documented paths and record the fixture id, viewport and source revision beside them or in the history file.
4. Recapture whenever the interface changes. Never capture signed-in or account state.

Keep the script in the app. It is a few lines over the app's existing browser test setup, not a workbench feature.

## One-way updates

Application source → fixtures/tokens/manifest → explicit workbench or registry snapshot. Edits in the workbench never automatically flow back. Engine upgrades are a separate, explicit design-system → vendor operation. Neither direction is a background two-way sync. Leave deployment and asset promotion to an independently authorized action.
