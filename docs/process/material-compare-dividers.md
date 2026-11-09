# Chromatique Compare divider boundaries

Reviewed locally on 2026-11-09. Compare now draws only the two boundaries of the bottom-right Original region: from the true cut down to the page bottom, and from the true cut right to the page edge. The unused upward and leftward extensions are removed.

## Geometry and edge semantics

- The Original clip remains `inset(y 0 0 x)` in page-relative percentages. Vertical and horizontal lines use those same true x/y coordinates, not the clamped reachable handle position.
- At an interior cut, both segments form the top and left boundaries of the Original region. There is no divider in the other three Web quadrants.
- At `x = 100` or `y = 100`, Original has zero area. Both lines are hidden, including their shadows, while the single handle remains reachable.
- At `x = 0`, the vertical edge is the outside of the page, not a boundary between the images, so only that line is hidden. The same rule hides the horizontal line at `y = 0`. At `(0, 0)`, the entire page is Original and neither line is drawn.
- A nonempty sliver retains its real boundary. Panning or zooming can clip either segment out of view. No substitute line is drawn from an offscreen cut to the reachable proxy.

The visible 5% initial inset, centered SVG arrow icon, single 44px control, keyboard and touch input, directional snap/release, cancellation, chart alignment, selection/native-drag suppression, and swatch/HEX copy behavior are unchanged. Original images, SVG artwork, attribution, the plate index and application previews are unchanged.

## Reproduce the checks

Use an already installed Playwright module and Chrome; the scripts do not install dependencies:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs PLAYWRIGHT_CHANNEL=chrome \
  node tests/material-compare-dividers.browser.mjs
```

The default test starts a loopback-only static server for the checkout and aborts requests to other origins. `MATERIAL_TEST_ROOT=/path/to/packaged/tree` selects another local static tree. `MATERIAL_TEST_OUTPUT=review/custom-divider-qa` selects a separate evidence folder. An explicit `MATERIAL_TEST_URL` can instead point at an independently authorized viewer URL containing `library=material&panel=plate-ii&view=compare`; it performs the same read-only browser interactions without starting a server. Publication is never part of the test.

`tests/material-compare-geometry.mjs` exports `assertCompareDividers(page)` for other browser checks. It measures actual DOM line rectangles, visibility and the Original clip against the true cut. The existing initial-position and full Material interaction suites also call it, so snap, cancellation and other input regressions cannot silently restore full-width lines.

## Local validation

Chrome 156.0.8078.80:

- `npm run check`: passed; 156 tests, zero failures or skips, design/reference checks and static build.
- Dedicated divider suite: 101 states at 1440, 390 and 320px widths. Initial inset, center, every edge midpoint/corner, near-edge slivers, six offscreen pan positions, stationary proxy grabs, mouse snap/release, Escape, mobile touch from bottom-right, alignment and resize passed.
- Dedicated divider suite against generated `dist/`: the same 101 states passed.
- `tests/material.browser.mjs`: 117 Original and 87 translation view cases across three widths, plus input/cancellation, selection suppression, copy success/failure, navigation, retry and sanitization regressions passed.
- `tests/material-framing.browser.mjs`: 116 plate/viewport cases across 1440, 390, 360 and 320px widths, including fit/zoom/pan, layer alignment, preview aspect and mode transitions passed.
- `tests/material-index.browser.mjs`: all 29 plate and ten supplement destinations, keyboard/history/reload, failure/retry and rapid navigation passed at 1440, 390 and 320px widths.
- No unexpected external requests or uncaught page errors in those runs.

Desktop/mobile initial, centered, bottom-right and offscreen-proxy screenshots were visually inspected. Evidence is under ignored `review/material-compare-dividers-qa/`, `review/material-compare-dividers-dist-qa/`, `review/lacouture-qa/`, `review/material-framing-qa/` and `review/material-index-qa/`. Mobile coverage uses browser emulation, not physical devices; other browser engines were not tested. This local change does not publish or deploy anything.
