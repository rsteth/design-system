# Design system foundation

A framework-neutral contract and reusable workbench, with real app-owned examples. The application foundation preserves current appearance while standardizing interfaces and behavior. Phase 3 adds a separate library of independent reference analyses, without importing brand assets or changing the applications.

- `packages/tokens`: collection/token validation and deterministic CSS generation.
- `packages/appearance`: framework-neutral preference controller. Apps retain their storage keys, markup, copy and styling.
- `packages/react`: optional thin React hook; the core and static site do not depend on React.
- `packages/workbench`: isolated preview shell.
- `apps/studio`: portfolio registry viewer.
- `templates/blank`: empty reusable starter.
- `registry/apps`: explicit app manifests and source versions, not editable copies of app source.
- `collections/reference`: 84 pinned, attributed third-party analyses and safe extracted tokens.
- `collections/reference-specimens`: original neutral examples for three selected studies.
- `registry/references.json`: the reference library, separate from `registry/index.json` (Robin).

Run `npm ci` for the pinned YAML development parser, then `npm run check` and `npm run dev` and open `/apps/studio/`. Node 20+ is required. The browser engine has no runtime package dependency; only the offline reference importer uses the pinned YAML parser. App fixture servers are separate and must be started in their own checkouts. Missing servers are not passing checks.

Local integration uses `node tooling/sync-consumer.mjs /absolute/app/path`. This copies a hash-pinned snapshot into `vendor/design-system`; app code must not modify that copy. The snapshot is intentionally labeled unpublished. Generated token CSS is checked in for static hosting; no runtime CDN or moving-branch fetch is required. A future release should pin a published package or commit and arrive as a reviewable version bump. Nothing here publishes or deploys.

Robin Stethem’s original design-system code, documentation and neutral authored specimens are [MIT licensed](LICENSE). See [license scope](LICENSING.md) for the exact boundary. Application source and snapshots retain their own terms; imported analyses retain their upstream MIT notices. Third-party logos, trademarks, fonts, images and other assets are not relicensed. The package remains private to prevent accidental registry publication.

## Start here: tasks and portable blueprint

Read [AGENTS.md](AGENTS.md) for ownership and [the task guide](docs/process/agent-tasks.md) for commands and the catalog map.

- **Capture one or all formats**: open `/apps/studio/?library=capture`, select desktop/mobile/App Store dimensions/stethem thumbnail, and copy the command. Agents can read `/packages/capture/catalog.json` or run `npm run capture -- --list`; `--plan` previews the exact matrix. The address is a static review interface, not a remote execution endpoint.
- **“Grab screens for X”**: find X's real screen fixtures or registered capture scene, then follow [capture studio](docs/process/capture-studio.md). Capture output is local review material, never an automatic website replacement.
- **“Put the blueprint in repo Y”**: use [the portable blueprint](blueprints/workbench/README.md). `node tooling/blueprint.mjs --check /absolute/project/path` previews; omit `--check` to add a new self-contained `workbench/`. Existing directories and root files are not overwritten.
- **“Refresh X in the workbench”**: `node tooling/sync-registry.mjs /absolute/app/path` updates only that app's derived snapshot and retains other collections. Use `--check` to inspect drift without writes.

Workbenches are **one-way for now**: the app owns source, fixtures and tokens; workbenches consume them. The portable engine can be upgraded explicitly, but it is not a two-way editor. stethem remains a static site. The [sync plan](docs/process/one-way-sync.md) describes a possible manual GitHub Action with pinned inputs and reviewable output; no workflow or deployment is enabled.

## Workbench self collection and skin

The studio now includes Workbench itself as an original collection. Its fixtures run the same engine: live controls/token inspection, empty/loaded states, and a bounded studio containing app collections only. The data is bounded before rendering so self-preview cannot recurse. Open `/apps/studio/?collection=workbench&section=components`.

The workbench now uses filled, square Warp-inspired buttons and panels within its own dark monochrome skin: near-black surfaces, white/gray type, precise borders and compact geometry. It is separate from the personal site. `skins/workbench.tokens.json` is authoritative; the previous `stethem` skin remains an explicit opt-in. The blank starter uses the dark skin and remains empty. Existing app source and pinned application vendors are unchanged.

## Populated application catalogs

The initial three-app expansion registered 97 real fixtures: Focus 20, Great Circle 22 and stethem 55. Current local counts come from the app-owned catalogs and the Project coverage view; later source refreshes and additional apps are not included in those historical counts. Their code is organized by app, UI, features, domain, styles, workbench and tests, using static entry shims where appropriate rather than forcing a framework or build step. Each collection links a source-mapped inventory. Checks distinguish covered, partial, excluded and blocked items; recorded results are not a live CI assertion.

Engine 0.3.0 adds inventory validation and display. See `docs/process/catalog-expansion-review.md` for exact local source identities, preserved appearance evidence and honest limits. No app or package is published by these changes.

## Independent reference studies

The studio opens on **Robin** under **Workbenches**. **Capture studio** is a separate production workspace, not another collection. Select **Reference studies** to browse/search all 84 analyses independently, or open `/apps/studio/?library=references`. References never enter application registry snapshots, appearance tokens, or app vendor distributions. The self-workbench studio remains applications-only.

Every study retains the original `DESIGN.md`, its exact SHA-256, source commit `fcc70284932276d085f01ef9f83edde90b1258cb`, fork/upstream provenance, and the full VoltAgent MIT notice. Imported values are **unverified secondary analysis**, not official tokens. Missing fields remain missing. Source parsing repairs are explicit, and raw Markdown is displayed only as inert text. Homepage checks establish current identity only, never design fidelity or historical accuracy. See [third-party notices](THIRD_PARTY_NOTICES.md).

Three selected studies have original neutral specimens: Stripe-inspired atmosphere/precision, Linear-inspired technical depth, and Dell-1996-inspired catalog structure. These are not reproductions or official implementations. They use system fonts, invented content and original CSS, with no copied logos, images, font files or screenshots. All 84 studies now also have generated, source-linked recipe sheets, separate from these curated compositions.

`npm run references:check` reproduces the imports offline from hash-locked source evidence; no sibling checkout or network is needed. `npm run references:import` regenerates derived files. To verify against the original fork explicitly, run `node tooling/import-references.mjs --check --source /absolute/path/to/awesome-design-md-p`. The source must match the pinned revision and be clean. Changes to source data, researched homepage evidence or specimen registration require regeneration and review. Nothing imports a moving branch automatically.

## Visual reference workbenches

Open `/apps/studio/?library=references&section=components` to explore all 84 independent study sheets. Foundations also has an **Open visual workbench** action. One shared renderer presents palettes, substituted system-font typography, spacing/radii, and 2,135 recipe specimens. The 74 structured sources supply 2,086 recipes; ten separately hash-locked, manually normalized prose sources add 49 partial recipes. These counts include style samples and variants, not production components. Original imported evidence and app registries are unchanged.

All 84 studies also share three original standard patterns, composed from each study's tokens with disclosed fallbacks: 252 patterns in total. These are authored comparison examples, separate from the curated specimens and the original recipe sheets, not reproductions of official application UI. Screens is disabled when a collection has no screen fixtures; the existing curated screen specimens remain available.

Each recipe retains exact source citations in non-rendered metadata and `report.json`, while exposing applied, substituted and unsupported properties without repeated line labels. A uniform **Open original site** control opens the recorded current/candidate site; missing historical or ambiguous identities remain unavailable. No original site is embedded. Local specimens retain the existing `allow-scripts` sandbox.

Run `npm run references:import` to regenerate sheets and their machine-readable coverage report, or `npm run references:check` to verify them. Shared authored assets live in `collections/reference-sheets/`; the safe compiler is `tooling/reference-sheets.mjs`. Manual prose decisions remain in `tooling/reference-prose-normalizations.json`, never silently merged into the pinned source analysis. See `docs/process/reference-workbench-implementation.md` for exact gaps and verification. Nothing is published or installed into the applications.

### Dated evidence pilot

`tooling/reference-source-recoveries.json` adds 24 reviewed recoveries from the same pinned prose without editing the original data. Ten original ambiguities remain. `registry/reference-supplements.json` records separately dated official documentation and current page-text observations for Runway, SAP and IBM. The IBM sheet adds nine neutral Carbon Core input/state specimens, explicitly separate from its website snapshot. A cloud-browser fallback measured default desktop CTAs on Runway and SAP, now shown as two additional dated specimens. IBM returned an unavailable response; mobile/hover/focus observations remain unknown. See `docs/process/reference-evidence-pilot.md`.

### Independent company palettes

Each generated reference sheet now uses a source-derived palette within its own isolated document. Canvas, surface, text, muted text, accent, links and dividers are mapped from the pinned analysis. **Interpretation, evidence & missing detail → Sheet palette mapping** lists source fields or explicit neutral/contrast fallbacks. Exact line citations remain available in non-rendered metadata and the linked evidence data. This mapping is an authored interpretation, not an official brand token contract. Sample declarations and source hashes are unchanged. The surrounding workbench remains monochrome; switching companies never recolors it or an application.

`tests/reference-palette.test.mjs` verifies all 84 mappings, injection safety, and 4.5:1 contrast for sheet annotations on both sheet surfaces. This does not certify every imported specimen's contrast or official fidelity.

## Reads and Bandit

Reads and Bandit have app-owned blueprint integrations and derived entries in Robin. Their initial integration had eleven Reads fixtures and five Bandit fixtures; the local coverage expansion now registers 42 and 52 respectively. The public release remains separately reviewed and packaged. Their product identities remain separate from the viewer skin. Start each app's isolated fixture server before opening Screens. See [integration, local commands and verification limits](docs/process/reads-bandit-integration.md). Registry refreshes stay explicit and one-way; neither app was deployed by this work.

## Public viewer packaging

See [the public viewer release guide](docs/process/public-viewer-release.md) for the approved synthetic Reads/Bandit previews, Material gallery, version-only public provenance, clean source export and publication checks.

## Existing-app coverage

The active own-work catalog stays limited to **Focus, Great Circle, stethem, Reads and Bandit**, plus the workbench self-collection, matching the published project list. Their source-faithful local expansion contains 209 registered fixture views (previously 113); variants are not unique component counts. Learning Machines and Market River remain within stethem rather than becoming extra project entries. Reference studies, Material and Capture studio are unchanged.

The broader project experiment is no longer active. Its additional registry snapshots and coverage directory are recoverable in the existing local Git history; their source adapters remain in their own local checkouts. Nothing was permanently discarded, pushed or published. See `docs/local/project-coverage-2026-11-11.md` for the current local scope and verification.

App fixtures remain source-owned and arrive through explicit `tooling/sync-registry.mjs` updates. The existing public-app allowlist also remains unchanged. A future public release needs its own packaging review and authorization; local `dist/` is not a publication command.
