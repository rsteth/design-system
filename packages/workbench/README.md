# Workbench engine 0.2.0

A dependency-free ES-module shell, separate from application frameworks and collection styles. Import `index.mjs` and load `style.css` in the host page.

```js
import { loadCollections, mountWorkbench } from './index.mjs';
const app = mountWorkbench(document.querySelector('#app'), { title: 'My workbench' });
app.setCollections(await loadCollections('./collections.json'));
// app.destroy() removes the shell and message listeners.
```

`mountWorkbench(container, {collections, title})` accepts resolved collection objects with optional `tokensData` and `inventoryData`. `loadCollections(registryURL, {base, fetcher})` accepts an array or `{collections: [...]}` of manifest URLs or inline manifests, resolving relative manifest, token, inventory, and fixture URLs against their containing document. Network or schema errors reject explicitly. Collection content is rendered as text, never HTML. No collection CSS reaches the shell.

Menu: Foundations (filterable authored tokens), Components, Patterns, Screens (app-owned fixtures), Checks (metadata and recorded inventory/evidence), and Sources (revision, provenance, license, raw manifest). Viewports select exact iframe widths with horizontal scrolling; compare themes opens two separately sandboxed fixtures. Comparison is within one collection, not a claim of cross-app token equivalence.

## Preview boundary

Only HTTP(S) URLs without embedded credentials are accepted. Iframes use `sandbox="allow-scripts"` and `referrerpolicy="no-referrer"`; no same-origin access, top navigation, popups, or form submissions are granted. Fixture JavaScript runs in an opaque sandbox origin. Apps requiring origin-sensitive storage, module CORS, authentication, or embed permissions may not work there. Use the external fixture link to inspect the app in its own origin rather than weakening isolation.

Theme selection sends the `workbenchTheme` query parameter and an optional `workbench:set-theme` message. A visible unverified state remains unless an opt-in adapter confirms the exact theme and request nonce from that frame's window. A load event alone is not evidence a theme worked or that the remote app rendered. The engine never directly restyles a remote document. The '*' postMessage target is necessary for an opaque sandbox origin; payloads contain no sensitive information.

Use `installThemeAdapter(applyTheme, {themes})` from `theme-adapter.mjs` in an app-owned fixture to adapt to its own theme contract. The callback must actually apply the requested theme and reject if unsupported. Serve the adapter in a way the fixture sandbox can load (bundled into the fixture or with appropriate development-only CORS). Do not grant additional sandbox permissions for convenience.

`templates/blank` vendors this exact version with an empty registry so it can be copied out and run independently. No registry or app is imported by the engine itself.

## Shell skin and self collection

The default `workbench` shell uses a dark monochrome palette independent of the personal site: one warm light on a cool near-black, with hairlines and space in place of boxed panels. Its type families and motion timings are tokens too, so the Workbench collection documents them in its own Foundations. `skins/workbench.tokens.json` is authoritative; `npm run skin:build` generates scoped CSS for both `workbench` and the optional legacy `stethem` skin. `npm run check:design` detects drift. Neither skin styles app frames.

`mountWorkbench(container, {skin: 'stethem'})` sets `data-wb-skin` on this engine instance. `handle.setSkin('another-name')` changes that selector without reloading fixtures. A future skin supplies a separately reviewed `.wb-shell[data-wb-skin="another-name"]` rule with the same `--wb-*` contract. Both workbench and stethem are shipped. The default and the self collection use workbench. Shell skin and the collection's Theme selector are independent.

`initialCollection` and `initialSection` select an initial catalog location. Studio links may use `?collection=workbench&section=components`.

The Workbench original collection lives in `collections/original/workbench`. Its fixtures import this exact engine, not copies of component markup. Components shows live controls/token inspection with child fixtures removed. Patterns switches real empty/loaded states using `setCollections`. Screens loads the actual application registry with Workbench removed. A separate navigation fixture mounts the real studio chrome, including its jump palette, against fixture-free collections. The recorded inventory explicitly lists remaining layout-token and full-host coverage limits. These data boundaries prevent self-preview recursion without weakening iframe isolation.

## Recorded inventory (0.3.0)

An app collection can declare `"inventory": "inventory.json"`. The loader resolves it beside the manifest into `inventoryData`; a declared but missing inventory is an explicit load error. The standalone engine remains dependency-free. Fixtures may include `description` and `states` for authored catalog context.

Checks shows counts for covered, partial, excluded and blocked inventory items, source paths, fixture references, recorded states and reasons. Recorded check status, command, scope and evidence paths are historical assertions, never a live execution or completeness certificate. Empty/absent inventories explicitly show unknown coverage. Sandbox and theme handshake guarantees are unchanged.

The v1 inventory contract is in `packages/tokens/inventory.schema.json`; `validateInventory(document, collection)` adds duplicate-ID and fixture-reference integrity checks. `reviewedRevision` is the full baseline SHA reviewed, not the worktree tip. Source and evidence paths are app-root-relative files. `design.mjs` verifies their existence and rejects traversal, remote paths and symlink escape. Covered UI items need fixture references; domain coverage need not have a browser fixture. Partial, excluded and blocked items require reasons. Registry synchronization copies inventory snapshots with a SHA-256 hash and keeps the app manifest authoritative.

## Independent reference studies (0.4.0)

An optional adjacent `study` document provides unverified secondary analysis, exact source/hash evidence, imported sections, missing fields, explicit parser repairs and homepage verification separate from design fidelity. Text is inert, links use HTTP(S) safety checks, and reference collections without fixtures are analysis-only. Original neutral specimens do not imply official UI or theme support.

The studio keeps `registry/index.json` (Robin) separate from `registry/references.json` (independent studies). Search and library history are opt-in studio/navigation behavior; app consumers retain their existing registry. The engine adds optional `searchCollections` and `onCollectionChange` options without a framework or parser dependency. Single-theme references cannot enable comparison. The starter stays empty.

## Signature, contrast and entry motion

Every collection page carries a colour signature under its title: the collection's unique colour tokens for the selected mode as one band, neutrals by lightness and then hues in 20° bands, sorted in OKLCH. It is a single `role="slider"` stop. The pointer or the arrow keys read out a token's name, hex and OKLCH value; a click, Enter or Space copies the hex. `colorSignature(tokensData, mode)` and `signatureGradient(colors)` are exported for hosts that want the same band elsewhere. Colours are resolved by the browser through a 1×1 canvas, so the functions return an empty list outside one.

Each colour sample shows white and black set on the colour with the WCAG 2 contrast ratio each would reach, struck through below 4.5. This is arithmetic on the token value, not an accessibility verdict for any interface. Clicking a sample copies the authored value and announces it through the inspector's status region.

Section, collection, fixture, theme, viewport and comparison changes still re-render synchronously, and focus now returns to the control that caused the change. Each render marks the shell with `data-wb-section` and `data-wb-enter` (`collection`, `section` or `refresh`) and sets `--wb-nav-shift` on the section indicator to the distance from its previous position. The `workbench` skin uses those hooks for CSS entry motion, off under reduced motion; no state waits on an animation. The skin keeps Components, Patterns and Screens still, so a fixture preview is never moving or fading while someone reaches for it. `handle.showCollection(id)` selects a collection the same way the picker does and keeps the current section.

A host with a fixed header sets `--wb-offset-top` on an ancestor of the shell so the sticky sidebar clears it.
