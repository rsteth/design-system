# Reference workbenches: implementation assessment

Verified locally on 2026-11-07 against feature/design-foundation at 5f0a9ca. This is a plan, not a claim that new galleries are implemented. No publication or application change.

## What is already present

The independent reference library has 84 pinned, MIT-attributed secondary analyses and 8,029 extracted values. Three studies (Stripe, Linear, Dell 1996) have nine original neutral fixtures across components, patterns and screens. Robin and reference registries are separate. The iframe is sandboxed with allow-scripts only.

A read-only audit is available as `node tooling/reference-readiness.mjs`. Its JSON gives a source URL, source hash, counts and next step for every example. It verifies raw source hashes and checks component reference existence. It does not validate CSS, behavior, fidelity or rights.

74 analyses contain structured colors, typography, spacing, radii and components. Across these there are 2,086 component recipes and 8,151 token references; all references resolve. Recipe counts include states, style-only surfaces, logo blocks and photo containers, not 2,086 distinct functioning components.

The ten prose-only studies are Kraken, Lamborghini, Lovable, Mastercard, Runway, Sanity, Spotify, Starbucks, Tesla and The Verge. They do contain useful component descriptions, including dimensions and states, but currently only reported colors are extracted. They need deliberate line-linked normalization rather than invented defaults.

## Practical delivery sequence

1. Build a generated specimen sheet for each of the 74 structured studies. Show the palette, type scale, radii and spacing plus buttons, fields, cards, navigation and badges where described. Keep source component names and state variants. Label structural markup and behavior as authored interpretations. Unknown recipes get honest style samples, not a claim of complete controls.
2. Normalize the ten prose studies with source-line evidence and clearly documented uncertainty, then put them through the same pipeline. This makes a visual workbench for every example achievable without pretending the descriptions are production code.
3. Add curated patterns/screens to selected examples where the composition teaches something distinct. Prioritize existing Stripe/Linear/Dell, then contrasts such as IBM, Figma, Airbnb, Spotify and Nintendo 2001. Do not stamp the same dashboard with 84 palettes: grids, density, type, geometry and interaction should be deliberately studied.
4. Add cross-study comparisons and an explicit experiment workflow. Borrow selected attributes into an original, separately named draft with provenance; never overwrite app tokens or claim a whole brand system has been adopted. Actual first-party open-source component packages can be a later, separate tier after package/version/license review.

## Architecture

- Preserve collections/reference as deterministic, pinned evidence. Add a compiler under tooling that reads study.analysis.components; do not execute Markdown, source CSS or arbitrary values.
- Resolve references through a strict typed allowlist. Map backgroundColor/textColor/rounded/typography/padding and the documented border, sizing and table fields to approved output properties. Record rejected/unimplemented values. Check cycles, missing references and safe CSS syntax. Reference existence alone is not sufficient.
- Produce static specimen markup/styles under a separate generated reference-specimens area and register their local component fixture routes through the importer. Reuse the existing sandbox and theme-adapter handshake. Avoid additional runtime fetches, external fonts, images, live submissions or source-code installation.
- Use reusable semantic specimen templates, with explicit per-study overrides for shape or layout. Default/hover/pressed/focused/disabled recipes remain evidence-backed variants; any inferred state or accessibility addition is labeled. Theme names should identify the study track, not promise official light/dark support.
- Keep source properties and resolved values beside every preview, plus the source commit/path/line and which structure or interaction is original. Show missing facts as missing. Keep official homepage and source-analysis links distinct.
- Generated studies and curated screens must be separate fixture kinds/labels. Existing three curated studies remain untouched, and own-app registries/vendor snapshots do not change.

## Limits and licensing

The imported MIT license covers VoltAgent's analysis text and derivations of that text with the notice retained. It does not grant rights to the companies' logos, photographs, proprietary typefaces, trademarks, actual component code or distinctive assets. Use original placeholder content, system fonts or separately cleared open fonts, and an explicit independent/unofficial label. A visually faithful commercial brand clone requires separate review and is not the objective.

Homepages are not a guaranteed live embed: framing restrictions, auth, network changes and historical mismatches make them links, not the rendering dependency. Existing research records 72 verified current identities, six blocked, four unverified and two missing historical sources; those checks do not verify design fidelity. Dell 1996 and Nintendo 2001 should not silently link a modern homepage as historical evidence.

Updated 2026-11-08: Robin selected MIT for his original design-system code, documentation and neutral specimens. See the root `LICENSE` and `LICENSING.md`; applications and third-party assets are excluded, and imported MIT notices remain intact. This license selection does not publish, install external components or change repository defaults.

## Verification gate for implementation

Compile deterministically; reject unsafe source input; test reference resolution and missing/unsupported values; mount every generated route in the existing sandbox at desktop/mobile widths; check keyboard/focus, repeated interactions, disabled/error states, no external requests and no horizontal overflow. Rerun Robin separation, engine, starter and app-registry regression checks. Screenshots establish rendered local behavior only, not official fidelity or universal accessibility.
