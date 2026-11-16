# Contract and ownership

## How the pieces fit

Each app owns its design data in its own repository. Everything in this repository is derived from it on request.

| In the app | What it holds | Who changes it |
| --- | --- | --- |
| `design/tokens.json` | The app's values, as a scale | The app |
| `design/collection.json` | Fixtures, themes, source, license and the optional `direction` | The app |
| `design/public-guide.md` | Optional prose notes for the public guide | The app |
| `DESIGN.md`, root agent instructions | The app's own contract and rules; these win over anything installed | The app |
| `workbench/`, `design/vendor/` | Installed copies of the blueprint, engine and token validator, pinned by hash | Only `tooling/blueprint.mjs` |

From the app to here, when someone asks for a refresh:

1. `tooling/sync-registry.mjs <app>` copies the collection, tokens, inventory and guide notes into `registry/apps/<id>/`.
2. `npm run guides:build` regenerates `registry/guides/<id>/design-system.md` and `llms.txt`.
3. The studio workbench reads the snapshot and shows the direction, tokens and fixtures.

From here to the app, when someone asks for an upgrade: `tooling/blueprint.mjs --upgrade <app>` replaces the installed copies and nothing else.

Nothing flows from a workbench or a guide back into an app. Steps for each of these are in `agent-tasks.md`.

## Direction

A collection may carry an optional `direction` block: product, character, world, moments, signature and voice notes. It records what the product is meant to be, so that intent is read before values.

- **Where it is written:** the app's `design/collection.json`. That is the source. An app's `DESIGN.md` may say the same thing in prose, and the two must agree.
- **Where it shows:** at the top of every workbench section, in full on Foundations and as one line beside fixtures, and at the top of every generated guide. It is public.
- **Draft:** `"status": "draft"` marks text the owner has not reviewed. Both places label it. The mark covers the whole block. Text written by an agent carries it until the owner has written or approved every field.
- **Central drafts:** a snapshot in `registry/apps/` may carry a draft direction written here. It is the one hand-written field in a snapshot. A refresh keeps it while the app has no direction of its own. The first refresh after the app records one, draft or not, replaces it whole; nothing is merged. A direction written into a snapshot without the draft mark is not kept: the freshness check reports it and the next refresh drops it.
- **Nothing written:** the workbench and the guide show the first sentence of the collection summary or study description and say where it came from, or say that none is written. Reference studies are never given a written direction; theirs is always taken from the study description and labeled unverified.
- **Limits:** each field is plain text of at most 400 characters without angle brackets; `moments` and `voice` are lists of one to twelve.

## Guides

Every entry's guide has one structure, composed by `tooling/agent-guides.mjs`: title, direction, the app's prose notes, then token and fixture tables generated from the snapshot. An app keeps its notes in `design/public-guide.md`. `design/guide-public.md` is also read, because Gather Motion already uses that name; new apps use the first. Notes that contain a table or repeat a generated section are refused. Guides are never edited by hand.

## Semantic values, existing appearance

The v1 JSON schemas live in `packages/tokens`. Runtime validators add safety and consistency checks beyond JSON Schema. Token documents declare named modes, explicit selectors and typed dotted token names. The CSS compiler emits `--ds-<token-path>` variables and optional aliases for legacy names. Tokens are app-owned: shared vocabulary does not force a shared palette, font or spacing scale. On first adoption, keep the rendered result, cascade position and specificity unchanged. That is a rule for the migration, not a requirement to mint one token per literal or to keep every value forever: an app may later consolidate its values into a deliberate scale, and `adviseTokens` points out where one is missing. Generated CSS must match its token document exactly on every check.

Suggested semantic vocabulary: `color.background`, `color.surface`, `color.text`, `color.text.muted`, `color.accent`, `color.accent.hover`, `color.border`, `font.body`, `font.heading`, `font.mono`, `space.control`, `radius.control`, `motion.duration`. The three connected app base modes share `color.background`, `color.surface`, `color.text`, `color.text.muted` and `color.accent`; registry tests enforce these names and types. Optional `color.border` has the same meaning wherever present. App-specific semantic tokens can be added; this is a vocabulary, not a forced visual theme. Raw asset URLs are not CSS token values.

A collection declares type (`app`, `original`, `reference`), renderer (`dom`, `react`), source repository and exact base revision, provenance, terms, themes and actual fixture URLs. Collection `source.revision` is the inspected upstream base, not a claim that uncommitted integration exists there. A reviewed integration commit is recorded separately in the release report. Reference analyses must remain distinguishable from original work. No references are imported in phase 1/2.

## Repository boundaries

Shared behavior and tooling belong here. Production controls, domain state, markup and fixtures belong to each application. App token JSON is authoritative for the app. The central registry copies metadata/tokens only through explicit refresh and records its source; never edit its snapshot as an alternative theme owner. Changes arrive as reviewable version bumps, never two-way silent synchronization.

Each app exposes `dev`, `build`, `typecheck`, `lint`, `test`, `workbench`, `check:design`. Static adapters should describe what each command does honestly: syntax checking is not TypeScript; copying a static site is not transpilation. Do not convert static HTML to React just to make scripts identical.

The gradual layout is `src/app`, `src/ui`, `src/features`, `src/domain`, `src/styles`, `workbench`, `tests`, `DESIGN.md`. Existing entry paths may remain until a justified migration; phase 1/2 establishes `src/styles`/design contracts, shared appearance behavior, fixtures and checks, not a full file shuffle. Preserve public URLs, storage keys, routing safeguards, accessibility and asset licenses.

## Versioning and release

`schemaVersion` changes only for contract-breaking changes. Shared package versions follow semver; collection revisions and source commits are separate. This work uses an explicitly unpublished, hash-pinned local `0.1.0` snapshot. `tooling/sync-consumer.mjs` regenerates vendored source; `verify-vendor.mjs` detects drift. The package is private to prevent accidental registry publication. No default branch, production or deployment is changed.

Release checklist: core tests; each consumer build/typecheck/lint/tests; regenerated CSS and vendor integrity; real-control interaction checks; matching desktop/mobile before/after screenshots; disclose network/font/map nondeterminism; review source/license notices; obtain publication/deployment approval; pin exact released source and verify remote/CI. Never label unavailable fixtures or unrun checks as passed.

## Local-only and unversioned applications

A source app without a remote can declare `source.repository: "local:<collection id>"` and `source.visibility: "local-only"`. This exact identifier is valid only for application collections. It is displayed as text, never a remote link, and carries no publication permission. Existing repositories retain their real HTTPS source and inspected revision.

An unversioned application can record `reviewedRevision: null` with `sourceSnapshot: {algorithm: "sha256", files: [{path, sha256}]}` in its inventory. Every path must be an app-relative file and every digest is verified during explicit registry refresh. This pins source bytes without inventing a Git commit. It is distinct from redacting an actual private revision in a public artifact.

The local project-coverage directory separates registered views, missing adapters and source/provenance constraints. Counts are fixture views, not unique production components. The public export allowlist in `tooling/public-collection-scope.mjs` keeps the local audit and new unapproved app catalogs out of public source and deployable output. Expanding that allowlist requires publication scope review, not just adding a local fixture.
