# Static public release preparation

This is a local candidate, not a deployment. Original design-system work is MIT licensed under the root `LICENSE` and `LICENSING.md`; existing app rights and third-party notices are unchanged. Do not infer permission to publish or make a repository public.

## Separate release builder

`node tooling/public-release.mjs --output review/<new-directory> --base /design-system/ --focus-root /absolute/focus/worktree --great-circle-root /absolute/great-circle/worktree --stethem-root /absolute/stethem/worktree`

Use the app-owned worktrees listed in the existing catalog-expansion report. The builder requires explicit paths and an unused directory under ignored `review/`. It never overwrites `dist`, local collection manifests, capture tools, or source apps. It rejects changed fixture snapshots, symlink inputs/output ancestors, environment files, common credential containers, source maps and absolute home-directory paths in output. Vite environment-file loading is disabled. This is a targeted static-input policy, not a general secret-detector certification.

Focus and Great Circle build only their original workbench entrypoints using installed dependencies. The app working directory is used for Tailwind content discovery. stethem fixtures pre-render the original HTML with its existing deterministic setup, including existing explicitly labeled no-JS simulations. Internal site links use registered static fixtures; excluded app links retain their public site destination. A source-tree hash before/after verifies app files were not changed.

The result includes 97 app fixtures, the isolated workbench engine, 84 attributed reference studies, dependency notices, source identities and per-file SHA-256/size inventory. The local capture UI is replaced only in the release with a clear explanation. It does not ship the runner, local capture reports, hidden files (except the deliberate .nojekyll marker), Git history, environment files, source maps, node_modules, tests or app servers.

The iframe remains `sandbox="allow-scripts"`. Public static assets require `Access-Control-Allow-Origin: *` for opaque-origin module/font loading. `_headers` provides this for compatible static hosts. Do not add `allow-same-origin`. Fixed device widths can scroll within the preview on narrow phones; the surrounding page must not overflow.

## Verification

Run `npm run check` and:

`PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs PLAYWRIGHT_CHANNEL=chrome node tests/workbench/public-release-browser.mjs review/<candidate>`

The browser suite serves only candidate files, with no application servers. It checks 97 fixtures at desktop/mobile, actual content and readiness, expected iframe sandbox, app-relative URLs, Tailwind typography, page bounds, all 84 reference sheets, capture exclusion and Back/Forward. Screenshots must also be inspected; readiness alone does not prove visual correctness. Repeat with `--base /` for standalone hosting and `/design-system/` for subpath integration.

All theme handshakes are required except three pre-existing Great Circle primitive fixtures (number, radius, disabled) have no theme handshake. They can mount, but their theme status stays unverified; this is not changed into a pass. Market River error/image-error fixtures intentionally generate failed simulated requests and console errors. Production service health, all app interactions and application CI are separate checks.

## Remaining rights review

Installed `path-webpack@0.0.3` and `marks-pane@1.0.9` declare MIT in package metadata but do not include full notices. The upstream repository roots also lack a license file (checked 2026-11-07). The candidate preserves metadata and marks `local-candidate-license-review-required`; it must not be published as cleared. Obtain exact applicable notices, or explicitly scope a release variant that does not distribute these dependencies. Do not invent copyright lines or apply the design-system MIT grant to third-party work or separate applications.

Sources: https://github.com/fchasen/path-webpack ; https://github.com/fchasen/marks . path-webpack README identifies Node.js v7.0.0 path.js as upstream; its upstream notice is at https://github.com/nodejs/node/blob/v7.0.0/LICENSE . That does not establish the complete terms of the modified wrapper.

## Practical hosting proposal, not action

Cloudflare Pages Direct Upload on the Free plan is suitable for this static candidate: approximately 53 MB total, fewer than 1,000 files, largest file 15.7 MB, no runtime server/functions. Current limits permit 20,000 files and 25 MiB per asset. Use a provider-generated pages.dev hostname first; availability is not checked. Expected hosting plan cost is $0, with no paid services or custom domain purchase authorized. Confirm the account/plan at deployment time.

Direct Upload sends the built site only and does not require making source repositories public or granting GitHub access. It cannot later be converted in place to Git integration. A new project would be needed for that change. `_headers` is supported for static responses.

Before upload, request exact approval to create the named Pages project in Robin's selected account and publicly upload the verified static files, including app UI and reference materials. Any signup/login or new OAuth grant must follow its own approval flow. No GitHub authorization, DNS change, new credential, recurring paid service, or personal-site production edit is included. After deployment, verify the returned public URL, CORS, a sample of every app/study and source hash before adding a personal-site link under separately authorized site work.

Official docs checked 2026-11-07:
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/configuration/headers/


## Opt-in fixture-only EPUB release

`--focus-epub fixture-only` is the smallest release-only alternative. Default `full` behavior is unchanged. Every registered Focus fixture already injects an app-owned deterministic EPUB loader; the actual parser is unused in these fixture states. The public builder replaces only `src/domain/epub.ts` in the build pipeline with an explicit rejection adapter, leaves source files untouched, and fails if epubjs, marks-pane or path-webpack appears anywhere in the Focus module graph. It neither copies nor substitutes those libraries’ code.

The preview preserves actual production components and all 20 original Focus fixtures, including authored EPUB sample, loading and error states. A visible notice in the standalone/embedded preview and collection descriptions states that EPUB content is authored sample text, real EPUB parsing is omitted, and uploaded files are not parsed. An unexpected parser call rejects with that explanation. This is not a working EPUB-import product demonstration and must not be described as one. The ordinary applications remain unchanged.

The fixture-only browser suite checks disclosure on every Focus fixture, module/dependency exclusion, EPUB sample playback/pause/close/reopen, loading/error interruption and opening the existing EPUB library sample on desktop/mobile. Unit tests exercise the exact rejection module. Remaining app/reference notices are retained. An empty `licenseGaps` list means the previously missing-notice dependencies are absent, not general legal certification or publication permission.

### Authoritative license evidence clarification

The installed versions and upstream package metadata both explicitly declare MIT:
- marks-pane 1.0.9: https://github.com/fchasen/marks/blob/master/package.json ; blob `revision-not-publicly-verified`.
- path-webpack 0.0.3: https://github.com/fchasen/path-webpack/blob/master/package.json ; blob `revision-not-publicly-verified`.

npm documents that the package `license` field communicates the package license using an SPDX identifier: https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#license . These are affirmative package-level MIT declarations, not evidence that the packages are unlicensed. Neither retrieved repository root nor installed package supplies a complete notice; path-webpack also names Node.js v7.0.0 as its source. We have not established complete attribution for every derived file or invented copyright holders/years. The full-parser candidate conservatively retains the notice-review flag. The fixture-only candidate removes the dependency chain rather than making a legal assumption about redistribution.

Tailwind’s license is also copied explicitly because its preflight CSS is inlined by PostCSS and does not appear in Rollup’s JavaScript module list.
