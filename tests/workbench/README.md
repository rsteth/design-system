# Workbench verification

- Unit suite (also included in root npm test): `node --test tests/workbench/*.test.mjs`.
- Self-contained browser suite: `node tests/workbench/browser.mjs`. Starts and stops its own localhost server, uses synthetic fixtures, verifies the standalone empty starter and engine behavior.
- Self-collection + skin: `node tests/workbench/self-collection.mjs`. Starts its own server, verifies the exact monochrome workbench palette, replaceable skin, actual shared engine imports, self-fixture recursion bounds, standalone starter, and desktop/mobile screenshots.
- Real registry integration: start central studio (`npm run workbench`) plus app fixture servers at the URLs in registry manifests, then `node tests/workbench/integration.mjs`. This verifies shell-skin isolation and exercises actual production appearance controls and native static-page interactions inside sandboxed iframes. The default studio URL is http://127.0.0.1:4310/apps/studio/; set STUDIO_URL to override.

Browser suites require Playwright available to Node and an installed browser. Set PLAYWRIGHT_MODULE to an existing absolute Playwright module entry and PLAYWRIGHT_CHANNEL=chrome to use an already installed Chrome. No package or browser is automatically installed. Each run uses a fresh isolated browser profile; it does not use the owner's signed-in browser.

Screenshots and integration-results.json are written to artifacts/. Synthetic screenshots are labeled QA collection and are engine evidence, not proof of app fidelity. Integration screenshots show app-owned fixtures. The static app declares light only. Its development fixture server injects a light-only adapter; standalone published HTML still does not depend on the workbench. Only successful adapter acknowledgment updates theme status, not iframe load. A theme acknowledgment is not a full visual or accessibility certification.

Inventory coverage QA is synthetic and does not assert app completeness. `browser.mjs` checks status counts, partial/excluded/blocked reasons, historical status/command/scope/evidence, descriptions/states, empty/absent inventories, and mobile overflow. `tests/inventory.test.mjs` checks validation, referential integrity, traversal and symlink boundaries.

- Full app catalog smoke: `node tests/workbench/catalog-smoke.mjs` opens every registered real app fixture through the central shell at responsive and exact 390px frame widths, checks readiness, original sandbox permissions, inventory loading and no external requests/uncaught errors. Start all local app servers first. Intentionally empty word primitives are verified by their real production element, not a text-length heuristic. App-owned suites separately verify state interactions and pixel parity. The recorded report is `artifacts/catalog-smoke-results.json`.

## Independent references (0.4.0)

- `npm run references:check` validates offline deterministic imports and exact pinned source hashes. `npm run check` includes this gate.
- `node tests/workbench/reference-browser.mjs` verifies the separate library, all 84 loaded studies, search/no matches, switching/history/races, inert hostile text, safe links and responsive layout. It also mounts all nine authored specimens through the real central shell at responsive/mobile frame widths.
- `node tests/workbench/reference-specimens-browser.mjs` verifies all 9 neutral specimens at 1200px/390px in the unchanged sandbox: theme acknowledgment, filters, repeated draft validation/reset, Cancel/Escape/focus, no overflow or external requests.
- Specimen screenshots are original authored examples, never evidence of official brand fidelity. Current homepage research is independently scoped from design accuracy; blocked or historical-missing URLs stay explicit.

## Generated reference sheets

- `node tests/workbench/reference-sheets-browser.mjs` mounts all 84 sheets through the real shell at responsive and exact 390px widths (168 cases). It checks readiness, the unchanged sandbox, zero external requests, errors or overflow, valid emitted CSS, recipe search/reset, original-site link states, and own-work separation. Selected contrasting studies also exercise repeated action/input/navigation controls and reset focus.
- `tests/reference-sheets.test.mjs` covers reference cycles/missing paths, CSS allowlists, hostile input, manual prose hashes/evidence, all generated sheets, and semantic classification of tables and asset-bearing controls.
- Screenshots/results live in `artifacts/reference-sheets/`. They demonstrate local interpreted specimens only; they do not certify official fidelity, complete component behavior or universal accessibility.

- `node tests/workbench/reference-evidence-browser.mjs` checks all 24 recovered declarations at responsive/390px widths (48 cases), exact local rendered heights/borders, nine supplementary input samples, static error/read-only/disabled states, keyboard focus and source-category labels. This tests the local workbench, not the actual brand sites.
