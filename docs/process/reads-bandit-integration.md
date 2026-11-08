# Reads and Bandit: app-owned blueprint integration

The Robin registry now includes Reads and Bandit alongside Focus, Great Circle, stethem and the workbench self-collection. These are real application fixtures, separate from independent reference studies. The central engine and existing application snapshots remain unchanged.

## Ownership and appearance

- Reads keeps its warm charcoal canvas, ivory type, soft blue accent, rounded controls and existing landing illustration/copy. Fifty app-owned semantic tokens now supply both landing and studio CSS. Eleven synthetic states reuse the actual production HTML, CSS and application module.
- Bandit keeps its glacier artwork, blue/copper accents and product typography. Its app-owned token contract and five production-component fixtures make landing, overview, waiting-list and empty/offline states inspectable without a backend.
- Each project has a pinned portable workbench. The workbench's monochrome frame is separate from product appearance. No theme editor, two-way sync or runtime remote dependency was added.

The app-owned `design/collection.json`, `design/tokens.json` and `design/inventory.json` are authoritative. Registry copies are derived with `tooling/sync-registry.mjs`. Source revisions identify the inspected base, not a claim that integration work already exists upstream. New snapshots deliberately have `integrationRevision: null` and `unpublished-local-snapshot`; local implementation commits are separate review evidence.

## Start and inspect

Start the relevant app's fixture server before opening central screens. An unloaded frame is not a passed check.

- Reads checkout: `npm run workbench` serves its viewer and fixtures on loopback port 3148.
- Bandit checkout: `npm run design:build`, then `npm run design:serve`, serves its production-built fixture adapter on loopback port 4318. Use the app's own workbench script for the standalone viewer on port 4319.
- Central checkout: `npm run dev`, then `/apps/studio/?collection=reads&section=screens` or `/apps/studio/?collection=bandit&section=screens`.

The central viewer retains `sandbox="allow-scripts"`. Both apps acknowledge only their declared theme using the existing nonce-based adapter. Neither app requires weakening the sandbox, signed-in state or production cookies. Preview operations use synthetic state only. Reads' live identity, provider, encrypted waitlist storage and lifecycle controls are not connected to its fixture server. Bandit's preview is separately isolated from its normal application backend.

Explicit refresh:

```sh
node tooling/sync-registry.mjs --check /absolute/reads-checkout /absolute/bandit-checkout
node tooling/sync-registry.mjs /absolute/reads-checkout /absolute/bandit-checkout
npm run check
```

The refresh preserves every unmentioned app and original collection. Token/manifest changes invalidate an old integration claim instead of silently retaining it.

## Verification and limits

`tests/reads-bandit.test.mjs` verifies collection/token contracts, root semantic colors, token/inventory hashes, source revision honesty, mapped fixtures and preservation of existing registry entries.

With both app fixture servers running, execute `tests/workbench/reads-bandit-browser.mjs` using an existing Playwright module (`PLAYWRIGHT_MODULE`) and browser (`PLAYWRIGHT_CHANNEL=chrome` when appropriate). It verifies central collection selection, actual sandboxed first screens, declared theme handshake, desktop/mobile bounds and repeated section navigation. It writes ignored review evidence to `review/reads-bandit-qa/`. App-owned browser suites cover the remaining states and interactions; the central smoke test does not claim to replace them.

Reads' app-owned checks include 184 tests, syntax/build gates, 33 fixture/viewport cases and three separate actual-runtime synthetic browser journeys. Eight of nine before/after runtime screenshots were byte-identical after token extraction. The remaining desktop feature screenshot differed in an in-progress button hover transition. User-authored text is not stripped of symbols. Product-authored emoji/decorative-glyph checks are separate from the unchanged pinned viewer's existing punctuation.

These registrations are local development/review surfaces, not deployments, live provider acceptance or published screenshot assets. No capture-studio composition is registered for either app by this change. Screen fixtures may be captured locally, but dedicated multi-format capture profiles still require an explicit app-owned scene adapter.

## Recorded local integration results

November 7, 2026: central `npm run check` passed all 116 tests and the static build; reference reproduction verified 84 analyses and 758 files. The combined central browser check passed both apps at desktop/mobile sizes with real painted iframe captures and theme acknowledgments. Reads implementation is local feature commit `revision-not-publicly-verified`; Bandit implementation is local feature commit `revision-not-publicly-verified`. These are local review results, not remote CI or publication claims.
