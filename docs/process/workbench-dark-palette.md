# Independent workbench and reference palettes

Local, unpublished implementation. Existing uncommitted work was preserved.

## Boundaries

- The shared shell defaults to `workbench`, a dark monochrome skin. The personal-site `stethem` skin remains optional and explicitly scoped.
- Studio separates Workbenches (Robin / Reference studies) from the production Capture studio. Capture mounts and destroys through its separate module, not the collection registry.
- Reference studies open directly on Components; Foundations and Sources retain token and provenance inspection.
- The self collection and empty starter use the actual dark shell. The three registered applications retain their source and pinned vendor snapshots.
- All 84 generated sheet documents use source-derived palette roles. No source CSS, logos, images, fonts or external site frames are imported.

## Source mapping

`tooling/reference-palette.mjs` maps literal source canvas, surface, text, muted text, accent, link and divider colors. Sheet annotations require 4.5:1 contrast against the two selected surfaces. When a source role is absent or unsuitable for annotation contrast, an explicit neutral or reused-text fallback is recorded. This does not alter the original recipe declarations or source evidence, and does not claim all recipe samples are accessible.

Every sheet's **Interpretation, evidence & missing detail → Sheet palette mapping** lists its field/line evidence or fallback. The generated report records the same mapping. These roles are authored interpretations of secondary analysis, not official brand tokens.

## Verification

- `npm run check` validates JavaScript/data, both generated skins, deterministic reference imports, unit tests and static build.
- `tests/reference-palette.test.mjs` checks source roles, safety, declared fallbacks and sheet-label contrast for all 84 studies.
- `tests/workbench/self-collection.mjs` checks exact dark tokens, real engine imports, bounded self previews, theme acknowledgment, desktop/mobile layout, replaceable skin and empty starter.
- `tests/workbench/reference-sheets-browser.mjs` checks 168 study/viewport combinations, exact computed per-sheet palettes, unchanged surrounding shell color, filtering/reset, source links, sandbox, no overflow, no uncaught errors and no external requests.
- `tests/workbench/reference-browser.mjs` checks own/reference separation, search, repeated and interrupted transitions, history, inert hostile text and mobile layout.
- `tests/workbench/browser.mjs` checks isolated engine fixtures, theme handshake/comparison, viewport controls, cleanup and empty/error states.

Final visual-review screenshots are under `tests/workbench/artifacts/dark-workbench/`: Stripe, Linear and Claude desktop examples plus a Stripe mobile view. Other browser reports retain their existing artifact locations. They demonstrate local authored examples, not official brand fidelity.

No commit, push, deployment, app vendor sync, or personal-site publication was performed.
