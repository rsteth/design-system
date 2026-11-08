# Phase 3 independent reference library review

Local implementation verified on 2026-11-07. No push, publication, deployment, default-branch change or application vendor update.

## Result

- The studio defaults to Robin: Workbench, Focus, Great Circle and stethem. A separate Reference studies library loads its own registry only when selected. Search, empty results, repeated selection, browser history and switching while loading are handled explicitly.
- 84 independent studies imported from Robin's rsteth/awesome-design-md-p fork at `fcc70284932276d085f01ef9f83edde90b1258cb`, with upstream VoltAgent attribution. Each retains exact raw DESIGN.md bytes, SHA-256, pinned source URL, full MIT license, original source name, source-path evidence and incomplete/unverified status.
- 8,029 extracted values. 74 structured YAML analyses, 10 prose-only analyses. Prose-only reported colors do not acquire invented semantic roles. Three malformed YAML scalar repairs are hash-gated, disclosed and reversible from retained raw source. Missing fields are never silently filled.
- Nine original neutral fixtures across three representative studies: Tally Garden (Stripe-inspired atmosphere/precision), Fieldnote (Linear-inspired technical depth), Meadow Supply (Dell 1996-inspired catalog). Each has component/pattern/screen examples, system-font fallbacks, invented content, explicit source-versus-inferred choices and local interactions. No copied logos, images, fonts or screenshots.
- 72 researched current homepages verified; 6 blocked, 4 unverified, 2 historical sources missing. Current identity does not validate source design claims. Dell 1996 and Nintendo 2001 do not substitute modern corporate pages for missing historical originals. See reference-homepages.md for evidence and unresolved cases.

## Implementation boundaries

`registry/index.json`, `registry/apps`, `collections/original/workbench`, shared appearance/react packages and all three app feature worktrees remain unchanged from phase 2. The existing app pin remains engine 0.3.0/d90f562; phase 3 changes only the central workbench/reference library. Static stethem remains static.

Central engine/starter 0.4.0 adds optional study metadata, inert source display, evidence labels and reference search. The starter remains empty and exactly mirrors the engine. References never override shell or app tokens. Sandboxing remains allow-scripts only, and adapter confirmation still verifies exact source frame plus nonce rather than assuming iframe load means success. Reference theme mode is “analysis”, not a claim of official theme support; comparison is disabled for single-mode references.

The offline importer uses pinned yaml 2.9.1 as its sole development dependency. No parser is loaded in browser runtime. It rejects duplicate/prototype keys, custom tags, aliases, malformed generic YAML, unsafe CSS, and unsafe specimen routes. Source-specific repairs require exact raw hashes. Regeneration fails on stale, missing or extra generated files. Generated fixture routes preserve nested static hosting prefixes.

## Verification

- Fresh npm ci --ignore-scripts: one dependency, zero audit findings at check time.
- Full npm run check: 63 Node tests, syntax/schema/skin checks, deterministic offline import check and static build.
- Pinned original checkout import check: all 84 studies and 589 generated files match source and transformations.
- Reference browser: 84-study load, own/reference separation, repeated search/select/switch, no matches, history/races, hostile text escaping, safe links, responsive layouts and unchanged shell palette. All nine authored specimens also mount through their generated registry URLs in the central shell at two frame widths (18 additional cases).
- Specimen browser: 18 cases (9 fixtures at 1200px/390px), unchanged sandbox, adapter acknowledgement, repeated filters, invalid/valid local drafts, Cancel/reset/Escape/focus return, zero external requests or uncaught errors.
- Existing synthetic engine and self-collection suites: empty starter, skin isolation, teardown, unverified missing fixtures, inventory honesty, exact viewports and bounded nested self-preview.
- Real application integration: all six checks pass. All 194 app-catalog responsive/mobile cases pass with zero uncaught errors or external requests. Results recorded under tests/workbench/artifacts.

An older integration test assumed the pre-expansion static component was the first fixture and had no adapter. It now selects the existing named attention/portfolio fixtures and positively checks their already-shipped light-only development adapter. Production code was not changed. Initial app regression attempt was stopped because old local servers had exited; all three were restarted before validation.

Independent source review found two implementation issues: invalid 5/7-digit CSS hex input accepted for hypothetical future data, and root-relative fixture URLs breaking a nested hosting prefix. Both were fixed with regression tests; neither altered source analyses or app UI.

## Review locally

Start npm run workbench in this repo. Open `/apps/studio/?library=references` or `/apps/studio/?library=references&collection=reference-stripe&section=screens`. Source facts and verification limits are visible in Foundations/Sources; most studies are analysis-only and have no runnable specimen.

Evidence: tests/workbench/artifacts/reference-library-*.png, reference-provenance-mobile.png, reference-specimens/results.json and its desktop/mobile screenshots, plus integration-results.json and catalog-smoke-results.json. These establish local implementation behavior, not official brand fidelity, production readiness or remote CI.

Further authored studies can be added deliberately to collections/reference-specimens/manifest.json and imported again. No reference is automatically adopted into an application's tokens or appearance.
