# Public viewer release

The public viewer packages 213 app-owned synthetic fixture views: Focus 20, Great Circle 22, stethem 73, Reads 43 and Bandit 55, plus one workbench fixture (214 total). Counts include states and variants, not unique components. The packaged screens remain the same five applications plus the workbench; an explicit Compass option adds its foundations and guide only. Deferred project catalogs and the local audit directory are excluded. The separate reference library contains 85 attributed studies. Material contains Lacouture’s 29 plates and 10 supplementary pages. Material now includes the 29 existing SVG reconstructions and color/geometry data in its own viewer. The separate original Site keeps its existing access policy.

## Publication boundaries

The original design-system framework, tooling, docs and neutral specimens are MIT licensed. Application frontend previews and design catalogs are explicitly approved for public display but retain their source terms. The MIT grant does not relicense application code, artwork, fonts or third-party work. See the root notices and bundled dependency notices.

Reads and Bandit use real frontend UI with authored sample data. Reads' self-hosted Nunito font ships with its SIL Open Font License text; the adapter pins the font's hash and fails closed if the file changes. This release excludes their backend, authentication, provider integrations, live waitlist handling, private user data, environment files, source maps and private Git history. Native static adapters replace the server-dependent pieces. Buttons may change synthetic in-memory state but cannot submit to an account or service. Reload resets sample state. These previews do not grant anonymous application access.

Actual package versions identify the previews: Reads 0.1.0, Bandit 0.0.1 and design-system 0.5.0. A package version identifies these source packages, not a production acceptance or service-health claim. Private source revisions and source-tree hashes are withheld. SHA-256 values in the release manifest cover only files being distributed for integrity verification.

The iframe remains `sandbox="allow-scripts"`. No same-origin, form, popup or top-navigation permissions are added. The static host must supply `Access-Control-Allow-Origin: *` for opaque-origin module and font loading. Synthetic form controls use release-only local handlers rather than widening permissions.

Focus continues to use the disclosed fixture-only EPUB adapter. Its sample, loading and error states work; real EPUB parsing is not distributed. This avoids the previously unresolved dependency-notice chain without replacing those libraries’ code.

## Build and verify

Use `tooling/public-release.mjs` with explicit Focus, Great Circle and stethem source roots, `--focus-epub fixture-only`, and the paired `--reads-root` / `--bandit-root` options. Output must be a new directory under ignored `review/`. Before creating output, the offline preflight compares each source collection and complete fixture definitions, exact token bytes, and optional inventory content with its registry snapshot. Snapshot token/inventory digests are also verified. A mismatch fails closed and requires an explicit `tooling/sync-registry.mjs` refresh. Revision-only redaction and version labels in clean public source exports are not mistaken for content drift. App source inputs are checked for changes; Reads/Bandit tokens and inventories are included in the before/after input checks. Without both new app options, the private app snapshots remain excluded.

Run the complete `npm run check` gate, the standalone `tests/public-app-previews.browser.mjs` suite, the full `tests/workbench/public-release-browser.mjs` suite against the generated candidate, and `tooling/audit-public-release.mjs` against that same output. Inspect desktop/mobile screenshots. The static audit rejects unapproved project registrations and local coverage data, then checks manifest integrity, likely credential markers, private paths and revisions, source maps and license gaps; it is not a complete secret-detection or legal certification.

`tooling/public-source.mjs` exports a fresh source tree with private revision metadata withheld and local review artifacts excluded. Validate this exported tree separately before committing it into new, clean Git history. Do not push the local development stash, its ancestor commits or an assembly branch that contains them. Do not rewrite an existing public history as part of a normal release.

Publication is a separate authorized action. Preserve the original checkout and saved stashes. Verify exact remote commits, GitHub Pages deployment and the live viewer before claiming delivery. No repository visibility, default branch, app deployment, credentials or security permissions are changed by these build tools.

The source-preserved Manifolds no-canvas fixture has a known partial fallback: static diagrams remain, but its original ResizeObserver throws when no canvas context is available. The browser report records that exact error separately. It does not waive unexpected errors in any other fixture.


## Compass source registration

Compass is an explicitly registered sixth app in the source catalog. Its app-owned tokens, direction and guide can be published with `tooling/public-source.mjs --compass-root /absolute/compass/check-out`, alongside the required existing Reads/Bandit roots. This checks its source snapshot before export and withholds private revisions through the same sanitizer. The option does not add Compass to packaged public previews, copy its backend, run ingestion or grant new app access. The public viewer still requires a separately validated synthetic Compass adapter before its local fixture URLs may be included. Never publish loopback fixture URLs as working hosted previews or push this assembly branch's private history.


## Compass in the hosted viewer

An explicit `--compass-root` on the public release builder adds Compass foundations, direction and generated guide after checking the app-owned snapshot. The exported catalog has no screen fixtures and clearly names the omitted source fixture IDs. It links the public product site. The existing five packaged preview families and their full browser gates remain unchanged; Compass does not silently gain a static app adapter, backend, inventory bridge or hosted MCP. The audit permits this one catalog only with its exact catalog-only declaration, empty fixture list and matching release scope. Without the option, existing publication scope is unchanged.

### November18 Compass candidate validation

The catalog-only candidate passed620 packaged-preview theme/viewport cases,428 full workbench fixture runs,85 reference loads, Compass desktop/mobile foundations and guide checks, capture navigation, static integrity/privacy audit and the full206-test source check. No unexpected page errors, external requests or failed assets were observed by the workbench runner. Its two documented source-preserved no-canvas exceptions remain; deterministic failure fixtures also emit expected console diagnostics. This is static synthetic-preview validation, not backend or product availability certification. Screenless catalogs are excluded from capture choices so Compass cannot displace a working capture screen.
