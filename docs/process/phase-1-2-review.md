# Phase 1/2 implementation review

Verified locally on 2026-11-07. Nothing pushed, merged, published or deployed. All repositories use `feature/design-foundation`; original app checkouts and their default branches remain untouched.

## Implemented

- Framework-neutral collection/token schemas, typed semantic vocabulary, deterministic CSS compiler and drift checks.
- Shared five-token baseline across apps: background, surface, text, muted text and accent. App-specific values, fonts, aliases and selectors remain app-owned.
- DOM appearance state controller, with a thin optional React hook. Focus and Great Circle's actual production controls use this behavior, preserving localStorage keys, no-flash bootstrap, markup, icons, copy, dialog behavior and per-app CSS.
- Vanilla workbench: Foundations, Components, Patterns, Screens, Checks, Sources; token inspection, isolated actual app fixtures, viewport controls and theme comparison. Theme confirmation requires an explicit frame/nonce handshake; an iframe load is not success.
- Independently usable empty starter with an exact engine pin. It contains no app collections or brand studies.
- Three real app integrations: both React apps expose actual appearance controls; static stethem uses nine original root font/color tokens and embeds its actual portfolio and teaching controls. No React conversion or production build dependency for stethem.
- Consistent documented commands, source ownership, generated CSS checks, local package pins and before/after evidence. Broader folder restructuring and a full component inventory remain future incremental work.

## Local source identities

Consumers pin engine/core source `revision-not-publicly-verified`, version 0.1.0, with per-file SHA-256 integrity. Later central commits add registry/evidence only; consumers are not expected to change on every report update.

- Focus integration: `revision-not-publicly-verified`.
- Great Circle integration: `revision-not-publicly-verified`.
- stethem integration: `revision-not-publicly-verified`.

Collection source.revision records the inspected upstream base. Central registrySnapshot.integrationRevision records the exact local integration above. These commits are local, not remote release claims.

## Checks passed

- Core: 33 Node tests covering token safety/compilation, appearance state, collection provenance, common app vocabulary, empty starter and workbench behavior; static build and syntax/JSON checks.
- Workbench synthetic browser suite: six sections, empty starter, filtering/text escaping, viewport sizing, comparison, teardown, missing-fixture timeout and mobile overflow.
- Real registry browser suite: Focus and Great Circle toggle themes/palettes, repeat dialog open/close and acknowledge comparison themes inside isolated frames. Static native attention controls and portfolio render correctly. Zero uncaught page errors.
- Focus: build, strict TypeScript, existing full ESLint plus integration checks, three design tests, existing reader/appearance browser suite, vendor/schema/CSS checks.
- Great Circle: build, strict TypeScript, scoped integration lint, 135 existing unit tests plus three design tests, 12 existing desktop/mobile appearance browser tests, vendor/schema/CSS checks. No prior general-purpose lint was present; scoped lint is not a claim of full-repository ESLint.
- Each React app: 16 exact-byte screenshot comparisons against original token declarations (2 themes × 4 palettes × production/workbench surfaces), persistence, keyboard/focus/Escape, device-theme and blocked-storage behavior. Semantic-name cleanup reran final build/types/lint/design/parity checks without changing rendered values.
- stethem: all existing static/content/mechanics/render checks, build/check commands, six full computed-style comparisons and six controlled screenshot comparisons (three pages × desktop/mobile). Fonts/layout settled and only animated GIF/video masked. Initial unmasked comparisons were 4/6 exact; controlled comparisons are 6/6. Repeated/reset/reversed production controls pass.
- Normal dev CORS remains unchanged. Opaque-origin preview CORS is opt-in in React workbench mode; Great Circle's API proxy is disabled in that mode.

## Reproduce locally

Start each app's `npm run workbench`, then run central `npm run workbench` and open http://127.0.0.1:4310/apps/studio/ on the same computer. Registry fixture URLs are explicit local development URLs, not published previews. Static standalone workbench is http://127.0.0.1:8776/design/workbench/.

Run `npm run check` here. Browser commands and Playwright/browser prerequisites are in `tests/workbench/README.md`; consumer commands are in each app's DESIGN.md. An existing installed Chrome was used with an isolated test profile, not the owner's signed-in session. No package or browser installation is needed for the central Node checks.

## Verification limits and next steps

- React lockfile metadata was validated against the official npm registry using existing runtime dependencies. A fresh clean install was not run. Focus still emits an existing Browserslist stale-data warning.
- Maps/remote feeds were blocked or fixture-backed for deterministic UI checks. No live provider/routing test, broad backend migration or production certification is implied.
- Static collection is light-only and intentionally has no theme adapter; the shell displays unverified rather than inventing dark-mode support.
- Public package/repository publication, deployment, CI on remote commits and broader app restructuring are not part of this local result. No brand reference collections or third-party assets were imported.
- Next review step: inspect the local studio and source diffs. Publish feature branches only when authorized, verify those exact remote commits/CI, then adopt versioned release updates. Do not merge or deploy implicitly.
