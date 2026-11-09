# Material framing and approximate chart alignment

Reviewed November 9, 2026. This is a presentation correction to the existing Lacouture viewer. No original JPEG, responsive preview, imported SVG, translation JSON, attribution or application catalog is changed. SVG downloads remain the exact original reconstruction.

## Diagnosis

All 29 SVG viewBoxes exactly match the original JPEG page dimensions. Chrome rendered image and SVG layers with identical x/y/width/height (0 CSS-pixel delta) for all plates. The live module and CSS matched the inspected distributed files. Preview widths are integer-rounded, with a maximum aspect-ratio discrepancy of 0.1382%; both preview sizes on all 29 plates chose zero displacement against originals at a common 750px height. That is not the visible chart-scale discrepancy.

The 21 square/diamond plates II–XXII have printed outer frame edges approximately 96.4–98.0% as long as the existing SVG frame edges. Printed chart centers differ by at most about 4.3 source pixels horizontally and 3.4 vertically, without a systematic upward chart-center displacement. Small scan rotation varies by plate. Typography, footnotes and internal geometry were independently regularized, so a whole-page scale/translation would move otherwise independently positioned content incorrectly.

The prior Fit mode scaled the entire 3000px-high page, including large historical margins. At a 1440×1000 viewport, plate II's page was about 475×646 CSS pixels, leaving its chart only 200px wide. Original and Compare also used different padding/fit deductions. That mode change made Compare approximately 2% smaller on desktop and 5% smaller on a narrow phone.

## Presentation

- Numbered plates open in **Fit artwork**. Both full pages receive the same uniform scale and are panned to the same SVG-derived color-study region, with 8% padding (minimum 32 source pixels). The full original remains scrollable; this is not a cropped/resampled asset. **Fit page** exposes all margins, and **Fit width** provides a full-width page. Supplementary pages default to Fit page and have no invented artwork frame.
- **100% · scan pixels** means one original scan pixel per CSS pixel; 150%, 200% and 300% use that same basis. These are no longer undisclosed multipliers of Fit. Numeric zoom and Original/Web/Compare mode switches preserve the viewed center where the scroll range permits. Selecting a Fit option resets framing so a deep pan is recoverable.
- Original, Web and Compare use one common page ratio and padding. Tiny responsive-derivative rounding cannot change the page box. The precomputed, browser-validated artwork bounds let Original frame immediately without fetching an SVG.
- Comparison cuts stay page-relative and independent. Grips stay in the visible portion of a track when that track crosses the viewport, clear of the other track. Source/Web labels follow the visible page region. A cut outside a deeply panned viewport remains at its chosen page position and can be reached by panning or keyboard focus. Loading and Retry messages stay outside the panned page.

## Chart-only correction and limits

**Align chart to scan** is on by default for II–XXII in Web translation and Compare. The control is reversible and its state survives mode/panel changes during the mounted viewer. It applies a measured similarity transform only to the chart swatches, frame and axis labels. The background, first four heading nodes and last three footer nodes do not move. Source image pixels and downloaded SVGs never change. A structural guard declines the correction if the pinned grid layout no longer matches; the unchanged translation remains visible with an explicit notice.

The coefficients below use the printed outer frame, measured independently from the JPEG with narrow dark-line ridge samples at 25 positions along each edge. Outlier rejection keeps the dominant frame ridge; intersections of fitted edges give the four source corners. A least-squares uniform rotation/scale/translation fits the SVG frame to those corners. Translation is relative to the existing SVG frame center; positive rotation follows SVG's clockwise screen coordinates. The scan and SVG hashes pin these measurements in the manifest, runtime data and test fixture.

| Plate | Uniform scale | Rotation | Center shift x, y (source pixels) |
| --- | --- | --- | --- |
| II | 97.354% | 0.331° | -1.40, -1.08 |
| III | 97.376% | 0.342° | -1.46, -1.26 |
| IV | 97.556% | 0.112° | -1.56, 0.33 |
| V | 97.498% | 0.251° | -2.01, -0.11 |
| VI | 97.619% | 0.086° | -0.12, 0.13 |
| VII | 97.405% | 0.335° | -1.84, 0.16 |
| VIII | 97.204% | 0.661° | -1.35, -0.14 |
| IX | 97.342% | 0.336° | -1.02, -0.56 |
| X | 97.591% | 0.032° | 0.17, -0.37 |
| XI | 97.313% | 0.346° | -1.27, -1.07 |
| XII | 97.362% | 0.407° | -1.36, -0.68 |
| XIII | 97.520% | 0.681° | -0.30, -3.39 |
| XIV | 97.204% | 0.660° | 0.81, 0.92 |
| XV | 97.239% | 0.500° | -1.05, 1.03 |
| XVI | 97.448% | 0.275° | 1.26, 0.16 |
| XVII | 97.375% | 0.776° | 3.55, -0.32 |
| XVIII | 97.103% | 0.817° | 4.28, 1.72 |
| XIX | 97.109% | 0.947° | -0.11, 0.95 |
| XX | 97.226% | 0.612° | 0.62, -0.46 |
| XXI | 97.698% | 0.164° | 1.16, 1.15 |
| XXII | 96.683% | 0.944° | 3.13, 1.43 |

This deliberately does not warp the scan or independently distort x/y. The transformed frame corners retain approximately 0.97–2.63 source pixels mean error by plate (maximum individual corner error 3.52px), reflecting non-similarity print/scan variation. Independently sampled internal gutters improve from median errors of roughly 5–9px to 1.95–4.02px, with residual 90th-percentile errors of 4.8–8.2px. Internal regularization and substituted type still differ visibly at high zoom; this is not an exact historical reproduction.

I bis and the curved fan plates XXIII–XXVIII already match their outer contours within a few source pixels. They receive no correction. Rose I's pale, hatched petal edges do not support a reliable automatic contour fit, so it also remains unchanged. Their original geometry and any residual mismatch are intentionally retained rather than inventing a match.

## Reproduction and checks

- `npm run check`: complete central validation, asset-hash tests, unit tests and static build.
- `python3 tooling/prepare-lacouture-assets.py --check`: original/preview/translation integrity and dimensions.
- `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs PLAYWRIGHT_CHANNEL=chrome node tests/material.browser.mjs`: complete 39-original/29-translation desktop/mobile behavior, two-axis mouse/touch/keyboard, focus, cancel, retry and stale-load suite.
- `PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs PLAYWRIGHT_CHANNEL=chrome node tests/material-framing.browser.mjs`: all 29 plates at 1440, 390 and 360px widths; shared layer/page dimensions; source-coordinate bounds including nested transforms; visible framing and grips; Original/Web/Compare size and center continuity; actual pixel zoom; preview rounding; alignment toggle/matrix/scope; supplements and failures.
- `tests/fixtures/material-frame-landmarks.json` records only reviewed source-frame corners and distributed scan hashes. Unit tests independently apply the runtime matrix to the SVG corners and verify every plate improves, without hiding residual error.

Browser evidence goes to ignored `review/material-framing-qa/`. Actual desktop and mobile viewport screenshots require visual review in addition to assertions. Browser-mobile emulation is not a physical-device test. Publication is separate; no source or deployment history is changed by this work.
