# Dated evidence pilot: source recovery and official guidance

Reviewed 2026-11-07 UTC. Local-only changes. Original DESIGN.md files, source hashes, imported analysis objects, app tokens/registries and curated specimens remain unchanged. No publication, asset-pack downloads, protected assets copied into the project, or third-party embeds.

## Source recoveries

24 of the original 34 unrendered declarations now have exact, source-specific overlays:

- 17 bottom borders: MiniMax 2, Mintlify 4, Miro 2, Mistral 3, MongoDB 3, Notion 3.
- Seven SAP heights: navigation 60px, product tabs 32px/44px, breadcrumb 17px, services hero band 450px, primary button 44px, floating button 58px.

These are **secondary-source recoveries**, not official-site verification. `tooling/reference-source-recoveries.json` retains each original value, source hash, exact supporting prose line/text, review date and safe replacement. The displayed property disclosure links both the original field and its supporting prose. The compiler rejects stale hashes, changed field values, changed support text and unsafe replacement values. It does not globally turn numbers into pixels or reinterpret malformed borders.

Ten remain unresolved: the inactive transparent 2px border reservation in MiniMax, Mintlify, Mistral, MongoDB and Notion; SAP hero-title 40, hero-display 188, section-heading 35, feature-title 22 and list-item 38. Nearby line-height values are not evidence of element height. The source's accessibility claim is not adopted as a compliance assertion.

## Separate dated source tracks

Sources were read as public-page text on 2026-11-07. The latest official-document pass records 18:24:36 UTC. A later successful cloud-browser pass records 18:35:11 UTC immediately after its measurements. An earlier IBM website-doc pass retains only the observation date, rather than an invented exact timestamp. Categories stay separate:

- **Official documentation:** first-party descriptions within their stated system/version scope.
- **Current page text:** extracted homepage content, not colors, dimensions, responsive behavior or rendered state.
- **Rendered website observation:** successful read-only computed-style and bounding-box measurements of Runway and SAP at 1180×757, default state only.
- **Availability response:** IBM returned an error page. It is recorded as availability evidence, not a design measurement.
- **Authored interpretation:** local semantic markup, neutral content, system fonts, unspecified styling and sample behavior.

### Runway

[Brand guidelines](https://runway.com/brand-guidelines) describe name/logo usage, legibility and clear space. They do not provide component tokens. Downloads entail additional guidelines/terms, and none were downloaded. The initial [homepage](https://runway.com/) text read confirmed navigation and a trial action only. The later cloud-browser pass measured its “Try Runway for free” CTA: 40px high, 8px radius, 8px 12px padding, 16px/24px weight-600 text, rgb(247,247,247) background and rgb(12,12,12) text. A separate neutral specimen applies those default-desktop values with system fonts and original content. The original four partial recipes remain unchanged.

### SAP

[SAP Digital Design System](https://www.sap.com/design-system/digital) addresses public-facing websites and digital experiences, separately from Fiori product guidance. Its landing page advertises Figma UI Kit v2.2.21; this is not proof of sap.com's runtime version. No official component dimensions were obtained. Earlier foundations/components reads reported restricted-fetch errors and were not revisited. Initial homepage text extraction contained a JavaScript-display warning. The later rendered pass, after rejecting optional cookies, measured the “Explore Joule Studio” CTA at the final https://www.sap.com/index.html URL: 42px high, 8px radius, 11px 13px padding, 16px/18px weight-500 text, white background, rgb(0,64,176) text and a 1px solid rgb(71,94,117) border. This is a separate neutral desktop specimen. It may be a different variant/template from the older 44px primary-button example. The seven source-prose recoveries remain secondary-source evidence, not officially verified values.

### IBM

[Carbon Core text-input guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/text-input/guidelines), marked Stable/React and updated September 30, 2026, document 24/32/40/48px input sizes, outside labels, helper text, input states and a 40px textarea minimum.

The sheet now includes nine original supplementary specimens: four documented sizes; error, warning, disabled and read-only states; and a textarea minimum-height example. Only documented dimensions/semantics are attributed to Carbon. Exact colors, error glyph, wording, width, type and focus appearance are authored. They are static state studies, not complete validation implementations or original IBM components.

[Carbon for IBM.com](https://www.ibm.com/standards/carbon/) is the appropriate separate website track. Its [extended-tabs guidance](https://www.ibm.com/standards/carbon/components/tabs-extended/) distinguishes v1's separate component from v2's base Carbon tabs/editorial styling. The observed page update was September 23, 2024, not a new 2026 release. A later connector reread was unavailable. No exact website implementation version or rendered tab behavior is asserted. The cloud-browser homepage attempt returned “Site Unavailable / Unable to access this site.” Cause was not established; no alternative access route was probed and no IBM homepage styles were measured.

## Browser measurement limits

The local browser operation failed before page rendering, including a bounded recovery. The supported dedicated cloud-browser fallback then rendered Runway and SAP successfully. Its fixed viewport was 1180×757; no viewport-changing capability was available, so no mobile observations were claimed. No hover, focus, pressed or disabled states were deliberately activated or measured.

Measurements use read-only DOM getComputedStyle and getBoundingClientRect. The reporting timestamp was captured immediately after measurement. The current homepages did not expose a release/version. Computed font-family names are documentary, not proof that those fonts loaded; the local specimens substitute system fonts. Text-dependent widths (183.46875px Runway, 182.25px SAP) were recorded as evidence but deliberately not copied as universal control widths. Hero heading metrics were recorded, but their imagery/backgrounds are not reproduced.

The extracted-text, official-documentation and successful-rendered records are retained separately rather than replacing one another. IBM's unavailable response remains an availability record, not visual evidence. Restricted SAP documentation subpaths were not revisited; no access controls were bypassed.

Local specimen QA uses the project's existing isolated browser-test workflow. The local 390px checks validate authored responsive presentation of the specimens, not the original brands' mobile designs.

## Verification

- `npm run check`: syntax/schema/import determinism, all unit tests and static build.
- `reference-evidence-browser.mjs`: 48 source-recovery/viewport cases, actual local CSS heights/bottom borders, documented sizes and static state semantics, two observation-based CTA samples at both local widths, keyboard focus, provenance and no external requests/errors/overflow.
- `reference-sheets-browser.mjs`: all 84 local sheets through the real workbench sandbox at desktop/mobile, 168 cases.
- Original Robin and reference registries remain distinct. No app source or vendor updates.

Source manifest: `registry/reference-supplements.json`. Full remaining gap list: `reference-workbench-implementation.md`. These records do not claim full accessibility, brand fidelity or redistribution rights.
