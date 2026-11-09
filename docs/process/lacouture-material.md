# Lacouture Material viewer

Material is a native, static viewer within the design-system shell. `apps/studio/material.mjs` renders the 29 existing SVG reconstructions and 39 original scanned pages. It has no account integrations, iframe, backend, persistence, or link to the private atlas at runtime. The separate atlas's access policy is unchanged.

## Reading and interaction

- Original, Web translation and Compare retain the selected panel. Direct links use `library=material`, `panel=<id>` and `view=translation|compare`; omission of `view` means Original. The previous `view=panels` also falls back to Original.
- All 29 plates retain section grouping, original SVG geometry and scan-derived colors. The ten supplementary pages have no invented translation; they display an explicit original-only notice. Returning to a numbered plate restores the preferred mode.
- The viewer supports Fit, 150%, 200% and 300% zoom with contained scrolling. Compare overlays both full pages at the same size. Two independently draggable dividers reveal Source only below and to the right of their intersection; at 50% / 50%, only the bottom-right quarter is the scan. Web fills the other three quarters. The inactive divider becomes subdued while the other is being adjusted, and each has a 44px touch target. Grips stay clear of the other divider, and keyboard focus highlights the full track even when a zoomed grip is outside the viewport.
- Divider positions survive zoom, resize, mode switches and panel selection within the viewer. Keyboard sliders expose their movement orientation and percentages: arrows move 1%, Shift + arrows or Page Up/Down move 10%, Home/End reach the edges. Escape during a drag restores its starting position; pointer cancellation, lost capture, blur and leaving the viewer safely end adjustment. Keyboard swatch focus reveals an obscured translation color rather than hiding focus behind the scan.
- Swatches use a single keyboard tab stop, with arrows/Home/End moving among cells and Enter/Space selecting. The inspector presents approximate sRGB HEX and an explicit copy result. When clipboard access fails, the value remains selectable.
- Original 3000px JPEGs and the exact imported self-contained SVGs are downloadable. Display scans use responsive 750px/1500px previews, with originals available for high-density or zoomed views.
- Async loads cannot overwrite a newer selection or a destroyed viewer. Failed HTTP or malformed SVG responses are evicted and can be retried. SVG document styles, active elements and resource URLs are removed before insertion; approved source typography is reapplied with scoped styles.

## Provenance and rights

Charles Lacouture's *Répertoire chromatique* was published in Paris by Gauthier-Villars et fils in 1890, with chromolithographs by G. Severeyns. The source is [Getty Research Institute, Los Angeles, via Internet Archive](https://archive.org/details/gri_33125012875395). The [complete processed JP2 archive](https://archive.org/download/gri_33125012875395/gri_33125012875395_jp2.zip) supplies all 226 scanned pages.

On November 8, 2026, the exact Internet Archive item recorded `NOT_IN_COPYRIGHT`. That is a copyright-status statement, not an item-specific CC0 dedication. Getty's [Open Content FAQ](https://www.getty.edu/projects/open-content-program/faqs/) requires an explicit Open Content/CC0 identification before treating an image as CC0. No such designation is asserted for these files. See Getty's [library permissions guidance](https://www.getty.edu/research-conservation/library/reproductions-permissions/) and Internet Archive's [rights guidance](https://archivesupport.zendesk.com/hc/en-us/articles/360014759692-Rights). Attribution does not imply endorsement or legal certification in every jurisdiction.

The original source work and digitization are credited separately from the SVG reconstruction/interface. Flat colors are spatial averages derived from the scan, not calibrated historical pigments. Geometry is regularized; typography is substituted; paper texture, wear and fine chromolithographic hatching remain visible only in Original. The root MIT grant does not claim ownership of the historical work or scans.

All 39 acquired original JPEGs are unchanged. The manifest records original and preview dimensions/hashes, exact SVG/data hashes and the source export hash. The 29 SVGs and 23 JSON files preserve their original bytes. There are 1,695 reconstructed swatches, not a claim of 1,695 distinct historical colors. Supplemental modern dealer material was not included as original 1890 material.

## Verification

Run `npm run check` for the full central gate. `python3 tooling/prepare-lacouture-assets.py --check` checks all original/preview/translation hashes and preview dimensions; it needs macOS `sips`. Rebuilding previews is an explicit local preparation step with `--source <exported-dist>` and never rewrites scans.

Run `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs PLAYWRIGHT_CHANNEL=chrome node tests/material.browser.mjs` for all 39 originals and 29 translations at desktop and mobile widths, history, mode restoration, keyboard selection, two-axis mouse/touch/keyboard comparison, exact edge reachability, source hit interception, zoomed/panned dragging and focus visibility, cancellation/teardown, copy denial, retries, stale-response handling and sanitizer regression checks. Evidence goes to ignored `review/lacouture-qa/`. `MATERIAL_TEST_ROOT` can target a packaged release. Screenshots require visual inspection separately.

Publication uses the existing public-release and clean-source-export workflow. Do not push this assembly worktree's inherited development/stash history. A passing local build is not a live release or a production application acceptance claim.
