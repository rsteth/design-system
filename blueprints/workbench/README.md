# Portable one-way workbench blueprint

This blueprint is maintained in `rsteth/design-system` at `blueprints/workbench/`, with the runnable engine and empty catalog in `templates/blank/`. It can be copied and adapted for a new project. It does not copy Focus, Great Circle, stethem, reference studies, capture outputs or application source.

## Install into another project

From a reviewed design-system checkout, run:

```sh
node tooling/blueprint.mjs --check /absolute/path/to/project
node tooling/blueprint.mjs /absolute/path/to/project
```

The installer adds only a new `workbench/` directory. It refuses an existing workbench, source/target overlap and symlinked targets. It does not merge root instructions, edit package scripts, install dependencies, commit, push or deploy. If a filesystem error interrupts the copy, inspect the new partial directory before retrying; no existing project files are overwritten. The caller must be authorized to edit the selected project. A named GitHub repository alone is not a verified local checkout: locate it first.

`blueprint-lock.json` records the exact copied file hashes, source HEAD and whether the source was a dirty local snapshot. A dirty source is not a published release. For remote use, obtain an explicitly reviewed commit of design-system and run the same installer; never fetch and execute a moving branch automatically. The supplied original design-system code and documentation are MIT licensed; retain the included `LICENSE` and read `LICENSING.md`. The host application, app fixtures and separately licensed material retain their own terms. A license grant does not publish or deploy anything.

## Start without a build

From the installed `workbench/` directory:

```sh
python3 -m http.server 4100 --bind 127.0.0.1
```

Open `http://127.0.0.1:4100/`. The catalog intentionally starts empty. HTTP is required for browser modules and fetch; `file://` is unsupported. There is no React, parent repository or package installation requirement. The workbench uses its own skin, not a production-site theme.

## Adapt to the project

1. Read the destination repository's root instructions, build/test scripts and existing `DESIGN.md`. Preserve its framework, appearance and public URLs. Static HTML remains static HTML.
2. Follow `DESIGN.md` here to expose deterministic app-owned fixtures and a manifest/token document. Copy or explicitly export these into `workbench/collections/<app>/`; add that manifest's relative URL to `collections.json`.
3. Keep production components and fixture adapters in the app. The engine embeds the declared fixture URLs in isolated frames. It does not import, rewrite or save edits back to application source.
4. Update the title in `main.mjs`/`index.html`. Keep engine code under `vendor/workbench/` unchanged. Adopt a reviewed whole-engine update rather than editing vendor files.
5. Add a short pointer to the target root `AGENTS.md` or README if appropriate, preserving existing instructions: “For workbench fixtures and screenshots, read `workbench/AGENTS.md` and `workbench/DESIGN.md`. App source is authoritative; workbench flow is one-way.” This installer leaves that root edit for the agent's reviewed integration.
6. Run the project's existing checks and verify desktop/mobile fixtures, missing-server handling and repeated reset. A missing fixture server is not a successful test.

## Screens versus screenshots

A **screen fixture** is a real app route/state listed in the collection with `section: "screens"`. A **capture scene** is an intentional, reproducible composition for a screenshot. A reference pattern is neither evidence of an existing application screen nor a capture service.

For “grab screens for this project,” first identify the requested screen fixtures and purpose. Use synthetic/sample state, start the app's own fixture server, and capture with a fresh browser profile and explicit viewport/theme. Keep source revision, dirty state, scene/version, timestamp, output hashes and limitations beside the images. The central design-system has a capture runner for explicitly registered scenes; new projects require an app-owned scene/adapter and reviewed registration, not an arbitrary remote URL.

## One-way updates

Application source → fixtures/tokens/manifest → explicit workbench or registry snapshot. Edits in the workbench never automatically flow back. Engine upgrades are a separate, explicit design-system → vendor operation. Neither direction is a background two-way sync. Leave deployment and asset promotion to an independently authorized action.
