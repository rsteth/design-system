# Contract and ownership

## Semantic values, existing appearance

The v1 JSON schemas live in `packages/tokens`. Runtime validators add safety and consistency checks beyond JSON Schema. Token documents declare named modes, explicit selectors and typed dotted token names. The CSS compiler emits `--ds-<token-path>` variables and optional aliases for legacy names. Tokens are app-owned during this migration: shared vocabulary does not force a shared palette, font or spacing scale. Preserve current literals, cascade position and specificity. Generated CSS must match exactly on every check.

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
