# Capture studio: one address, seven formats

Open `/apps/studio/?library=capture` from the Design system home navigation. Share a precise selection with, for example, `/apps/studio/?library=capture&scene=focus-reader&profile=mobile&theme=dark`. The UI exposes all formats, batch commands, local previews, verified exports and source metadata. App scenes stay app-owned; the studio is a one-way capture/review surface.

## For an agent arriving at the address

1. Open **Capture studio**. Choose the scene, format and theme, or read `/packages/capture/catalog.json` for the machine-readable allowlist and specification links.
2. A browser-only agent can preview available scenes and download already generated/verified exports. **The static address cannot launch a browser, start app servers or execute a shell.** It is not an MCP server or arbitrary-URL screenshot endpoint.
3. An agent with terminal access should open this repository, read `AGENTS.md`, run `npm run capture -- --list`, and plan a selection with `--plan`. A missing local checkout/browser/app scene is a setup gap, not a successful capture.
4. Run the copied command using the installed dependencies below. Inspect the output, refresh exports, and review the exact pixels and source metadata before use.

## Quick task: new thumbs for app X on the personal site

No MCP service or setup is required. Follow **discover → capture → inspect → export/stage**:

- Discover X in the scene selector or catalog; only Focus and Great Circle are registered today.
- Run `npm run capture -- --scene <scene-id> --profile stethem-thumb --theme both --plan`, then omit `--plan`. Use a single theme if requested.
- Inspect `card.png` at 800 × 600, check composition/legibility and the source provenance. Select the theme that fits the intended card.
- Export/download the reviewed image and provenance, or leave them staged in the dated local review folder and report the exact files. A missing scene is a reported adapter gap, not permission to invent or use private content.
- Do not silently replace an approved personal-site image or publish. Site asset replacement and deployment remain separately authorized steps.

## Formats

| Profile | CSS viewport | Density | Original PNG | Use |
| --- | --- | --- | --- | --- |
| `stethem-thumb` | 1200 × 900 | 1× | 1200 × 900 | Intentional 4:3; also 800 × 600 card |
| `desktop` | 1440 × 900 | 1× | 1440 × 900 | Responsive desktop web UI |
| `mobile` | 390 × 844 | 3× | 1170 × 2532 | Responsive mobile web UI |
| `app-store-iphone-6-3` | 402 × 874 | 3× | 1206 × 2622 | iPhone Dynamic Island, medium display |
| `app-store-iphone-6-9` | 440 × 956 | 3× | 1320 × 2868 | iPhone Dynamic Island, large display |
| `app-store-ipad-13` | 1032 × 1376 | 2× | 2064 × 2752 | iPad 13-inch |
| `app-store-mac` | 1440 × 900 | 2× | 2880 × 1800 | Mac 16:10 |

All profiles render fresh UI at the declared viewport and device pixel ratio. They do not enlarge an existing thumbnail. The original is a viewport capture, not a full-page capture or crop. Only the thumbnail profile uses a derivative, a high-quality 800 × 600 downsample of its complete 4:3 scene. The Great Circle thumbnail preserves its original intentional composition; responsive profiles do not use its thumbnail transform.

### Apple standards and honest limits

Checked 2026-11-07 against [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications), [App Store assets](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets), and [App Review metadata rules](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata).

Apple accepts JPEG/JPG/PNG, 1–10 screenshots per device size, without alpha channels/transparency. The runner emits RGB PNGs and checks exact dimensions and absence of an alpha channel for App Store profiles. Apple currently names medium Dynamic Island iPhone and, for iPadOS apps, 13-inch iPad as required. Its page also describes device-specific fallback scaling; verify the actual app/platform/localization slots rather than assuming one iPhone image fills all requirements. These are selected portrait iPhone/iPad and landscape Mac targets, not every supported size, localization, landscape phone, Watch, TV, Vision or future device target.

**Dimension match is not submission compliance.** Current scenes are web applications rendered by Chromium, not screenshots captured from a native iOS/iPadOS/macOS binary, simulator or device. Their platform eligibility and App Review acceptance are unverified. Review requires accurate app-in-use imagery, rights and appropriate sample content. A real native capture adapter, native build/device provenance and target-listing review remain necessary before treating these as store-ready assets. Nothing uploads to App Store Connect.

## Scenes and deterministic data

- **Focus** (`focus-reader`, scene 1.1.0): the production Reader, paused on authored sample prose. No personal books or saved preferences.
- **Great Circle** (`great-circle-route`, scene 1.1.0): the production planner, a fixed synthetic route and original schematic map. The scene identifies the map as illustrative and not for navigation; no third-party tiles are downloaded. Existing provider notices do not claim those providers supplied the synthetic map.

`capture/scene.json` in each app declares profiles, dimensions, source files, route and version. Capture runtime reports scene/profile/theme/version in its readiness handshake. Unsupported profiles fail closed. The catalog is an allowlist, not a second application implementation.

## Run one or all

The default source checkouts are `../design-foundation-work/focus-speed-reader` and `../design-foundation-work/great_circle`, relative to this repository. Override with `--focus-root` and `--great-circle-root`; use explicit verified checkouts. Existing Node 20+, app dependencies, Playwright and browser are required. Nothing installs automatically.

On this computer, an existing Playwright entry and browser are available:

```sh
export PLAYWRIGHT_MODULE=/absolute/app/node_modules/playwright/index.mjs
export PLAYWRIGHT_CHANNEL=chrome
npm run capture -- --list
npm run capture -- --scene all --profile all --theme both --plan
npm run capture -- --scene focus-reader --profile mobile --theme light
npm run capture -- --scene focus-reader --profile all --theme both
npm run capture -- --scene all --profile all --theme both
```

The full selection is 28 captures: two scenes × seven formats × two themes. Omitted options retain the older default: all scenes, light theme, `stethem-thumb`. `--list` and `--plan` print JSON without launching a browser or writing captures. See `npm run capture:help`.

The runner starts installed Vite directly in each source checkout on isolated loopback ports 5196/5197 with strict port ownership and workbench mode (no API proxy), then stops its servers. Port conflicts fail instead of capturing another checkout. Arbitrary URLs, remote destinations and output paths are unsupported.

Live preview is separate: run `npm run workbench -- --strictPort` in each app feature checkout for ports 5186/5187, plus `npm run dev` here. Iframes retain `sandbox="allow-scripts"`, never same-origin/profile/download privileges. Readiness checks the actual frame, version, profile and theme; timeout and reset are explicit. Preview scaling is visual fitting only, not an exact-density export.

## Outputs and review

Outputs remain ignored under `review/captures/<dated-run>/<scene>-<theme>-<profile>/`:

- `original.png`: exact profile pixel size.
- `card.png`: only for `stethem-thumb`, 800 × 600.
- `provenance.json`: scene/profile/theme, viewport/density, browser-render disclosure, data/license notes, source state and hashes.
- Run-level `report.json`: requested selection, capture timestamp, browser/runner versions and source hashes.

`latest.json` updates only after the complete requested run succeeds. Subset successes replace only matching scene/theme/profile entries; other dated exports remain available with their individual timestamps. Failed-run evidence can remain in its dated folder but is never promoted. A single-writer lock refuses concurrent captures to prevent lost index updates. If a killed process leaves `.capture.lock`, inspect its recorded PID and verify the capture is stopped before removing that lock; do not bypass an active run.

The UI verifies PNG dimensions and SHA-256 and decodes pixels before exposing downloads, then uses verified browser blobs for matching preview/download bytes. Old schema-1 thumbnail exports remain readable but are dated historical evidence, not a live version claim. Source changes require regeneration. A built static bundle includes catalog and documentation, but not local `review/` exports; missing exports are shown honestly.

## Boundaries and provenance

Every capture uses a fresh browser context with service workers blocked, external requests denied, fixed locale/timezone, decoded images/fonts, reduced motion and disabled animations. It rejects runtime/network/asset failures and frame overflow. The browser clock is not globally frozen because rendering libraries need timers; app-owned sample data is fixed.

Source metadata includes repository, HEAD, branch, dirty state, bounded source-file hashes and combined tree hash. Source is rechecked after capture; concurrent app edits fail. Dependency lockfiles are hashed, installed dependency integrity is not attested. Secrets, private browser state and source contents are not copied. Output/source symlink boundaries are enforced. A dirty local capture is not a deployed-release claim.

Nothing commits, pushes, uploads, publishes, deploys, replaces approved stethem images, changes production UI or converts stethem to a hosted editing service. Native app adapters, additional projects, video, map providers and asset promotion are separate explicit work.

## Verification

- `node --test tests/capture.test.mjs`: profile/scene/route/theme allowlists, safe paths, source hashing, catalog consistency, matrix planning, subset retention and PNG verification.
- `npm run test:capture:browser`: live scene handshake, review/download integrity, navigation/history/races, mobile layout and missing-server retry (requires preview servers and generated exports).
- `npm run test:capture:runner`: wrong-port refusal, failed-run latest preservation, lock cleanup, subset retention and repeat image identity (requires generated full matrix and Playwright).
- `npm run test:capture:profiles`: profile controls, deep links/batch commands and profile-aware review (requires preview servers and Playwright).
- Each app's `tests/capture.browser.mjs`: every profile/theme, deterministic reload pixels, exact sizes, no outside network, responsive bounds and opaque sandbox handshake.
- `npm run check`: central validation/test/build gate. App builds/lint/design tests are separate.
