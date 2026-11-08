# Full app catalog and repository reshape

Completed locally on November 7, 2026. All four repositories remain on `feature/design-foundation`; no pushes, default-branch edits, publication or deployment. Original app checkouts remain clean.

## What changed

The earlier foundation supplied contracts, shared appearance behavior, preserved tokens and representative fixtures. This pass does the actual repository reshape and full current app-owned UI inventory.

- Focus: `src/app` composition; `features/library` and `features/reader`; reusable `ui` primitives; `domain` storage, backup and EPUB logic; `styles`; independent `workbench`; tests.
- Great Circle: `src/app` composition; `ui` controls; `features/map` and `features/planner`; unchanged domain/routing modules; `styles`; workbench and tests. Backend, workflow and worker imports follow moved modules without changing algorithm/security/deployment behavior.
- stethem: native `app`, `ui`, `features`, `domain`, `styles`, `workbench`, `tests`. Public HTML, assets, pinned learning mechanics and URLs stay where they were. Thin entry shims preserve static hosting without a build step or React.

Catalog fixtures use actual production UI/modules with deterministic fixture data, not lookalike implementations or screenshots. Source-mapped inventories declare states and constraints. Every registered fixture maps to an inventory item; validation checks real source/evidence files and rejects traversal or symlink escape.

## Scope and counts

- Focus: 20 fixtures, 20 inventory groups (12 covered, 4 partial, 3 excluded, 1 blocked).
- Great Circle: 22 fixtures, 13 inventory groups (10 covered, 1 partial, 2 excluded).
- stethem: 55 fixtures, 29 inventory groups (26 covered, 1 partial, 2 excluded), covering all 9 authored pages.
- Total: 97 fixtures; 62 inventory groups. These counts are not a claim that every possible external/browser/provider condition is represented.

Core 0.3.0 adds inventory schema, validation, source/evidence path checks, recorded coverage display and fixture state descriptions. Its Checks page distinguishes authored evidence from live results. The shell retains the stethem skin and finite self-preview collection.

## Exact local source identities

- Consumers pin shared core `revision-not-publicly-verified`, version 0.3.0, with 31 source hashes each.
- Focus final integration `revision-not-publicly-verified`.
- Great Circle final integration `revision-not-publicly-verified`.
- stethem final integration `revision-not-publicly-verified`.

The collection source and inventory reviewedRevision refer to the inspected starting baseline. registrySnapshot.integrationRevision identifies the finished local implementation above. None of these are remote release claims.

## Validation

- Central: 45 unit tests, schema/syntax/generated-skin checks, static build, synthetic coverage browser suite, self-catalog tests, original integration tests. All 97 fixtures also passed both responsive and 390px mobile embedding through the actual central shell: 194/194, zero uncaught errors or external requests.
- Focus: build, strict types, full lint, 5 source contracts, vendor/inventory integrity, 16 original-token pixel comparisons, existing reader regression, all fixture/repeated/interrupted/sandbox-adapter flows. Actual production EPUB/IndexedDB/backup tests include corrupt EPUB, repeated restore, native delete decisions and export failure/retry. CSS, generated tokens, types, EPUB parser and appearance control bytes remain identical after relocation.
- Great Circle: 135 unit/backend tests, 5 design contracts, 108 legacy browser passes with 10 intentional project skips, 43 ORS browser passes with 3 intentional skips, 44 fixture viewport runs, 16 pixel comparisons, build/types/scoped lint/Lambda packaging. 32 moved modules are unchanged except imports; CSS/token bytes unchanged. One old timing-sensitive geometry test now waits for committed React/Leaflet projection instead of asserting stale state; expected behavior was not relaxed.
- stethem: all original regressions, generated-asset checks, preservation guards and build/check adapters; 110 fixture viewport runs; repeated/interrupted controls; 6 video/motion combinations; 6 actual JavaScript-disabled fallback comparisons. 24 authored-page/archive-state desktop/mobile screenshots and computed-style snapshots match exactly. Both before/after use identical software-rendering flags to remove GPU font-raster noise, with no tolerances and only animated GIF/video masked.
- Independent source review checked production imports, source reuse, domain preservation and test changes. It caught a motion-dependent video fixture bug, fixed and verified under both reduced-motion and normal preferences. Review also corrected no-JS fixtures so their explicitly labeled simulation includes original noscript copy, backed by true JavaScript-disabled browser comparisons.

## Explicit boundaries

- Focus has no pre-existing startup-storage-error screen. It remains a blocked product state rather than inventing UI during a no-redesign task. A representative corrupt EPUB is tested; exhaustive corrupt-file/filesystem variants are not claimed.
- Browser/OS alert, confirmation, file-picker and download chrome cannot be shown inside the unchanged opaque sandbox. Labeled harness adapters cover embedded behavior; standalone tests exercise real native paths. GPX export is verified standalone, not granted extra iframe privileges.
- Static favicon behavior runs unchanged, but browser-tab animation is not pixel-tested. External projects and the independently maintained uninitialized Verbosele submodule are explicitly excluded from the site's authored catalog.
- Routing/search/map grids, Market River data and error states use deterministic fixtures. Live providers, feed availability, geolocation and route suitability are not certified.
- A clean dependency reinstall was not run; existing installed dependencies were reused. Package-lock metadata is validated; known bundle/Browserslist warnings remain documented.

## Review locally

Run each app's `npm run workbench` and central `npm run workbench`. Open http://127.0.0.1:4310/apps/studio/. Source paths and scenario directions appear in each app's DESIGN.md, collection and inventory. App evidence is under Focus/Great Circle `review/workbench/` and stethem `design/evidence/`. Central full-mount evidence is `tests/workbench/artifacts/catalog-smoke-results.json`.

The next step is review and any requested gap fixes. Publication of feature branches, remote CI verification, merging and deployment remain separate authorized actions.
