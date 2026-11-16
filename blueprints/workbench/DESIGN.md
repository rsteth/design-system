# App adapter checklist

The application owns its visual language and behavior. This blueprint is a viewer and workflow contract, not a new product theme.

## Suggested layout, adapted to the existing stack

- `design/collection.json`: app identity, source/provenance/license, fixture URLs and token path.
- `design/tokens.json`: current app-owned semantic values, not the workbench's theme.
- `design/inventory.json` (optional): source-to-fixture/state coverage and recorded test results.
- `workbench/`: isolated viewer with a generated local collection snapshot.
- App-owned fixture adapters: import/render real production components and deterministic sample state.
- `capture/` (optional): explicitly versioned presentation scenes and readiness checks.
- Existing source and tests: retain their current layout. Suggested `src/ui`, `src/features` and `src/domain` directories are not a required migration.

## Collection contract

The current schemas and validators are maintained at `packages/tokens/` in design-system. Use `schemaVersion: 1`, a unique kebab-case `id`, `kind: "app"`, actual `renderer` (`dom` or `react`), title/summary, a relative token URL, explicit themes, source repository, exact inspected revision (or `null` for unreleased work), provenance, license and fixtures. Do not invent source revisions or license grants.

Each fixture needs a stable id, human title, section (`components`, `patterns` or `screens`) and HTTP(S) URL. Declare meaningful states and deterministic setup. Screens should use real route/state compositions. Reference-only collections without screen fixtures should not imply that Screens are available.

Token documents use `schemaVersion: 1`, `namespace` matching the app id and explicit modes/selectors. Record the scale the app uses. On first adoption, keep the rendered result unchanged; that does not mean one token per literal. If the existing values do not form a scale (dozens of sizes, spacings or radii, or tokens named after their value such as `space.v17px`), say so in the inventory notes and leave consolidation as a named follow-up, rather than presenting one-off values as a system. After adoption the app may consolidate its scale; pixels are allowed to change on purpose. Shared semantic vocabulary includes `color.background`, `color.surface`, `color.text`, `color.text.muted` and `color.accent`; shared names do not require matching palettes. Tokens are not raw asset URLs.

`adviseTokens` in the token package returns plain-language notes about a token document: more distinct steps than a scale usually needs (and how many of them are named after their value), near-identical colors and a font stack that leads with a platform-only keyword. A deliberate scale produces no notes. The notes are advice. They never fail a build; print them in the app's design check and decide.

### Direction (optional)

A collection may carry a `direction` block so that intent travels with the tokens:

```json
"direction": {
  "product": "What it does and for whom, in one plain sentence.",
  "character": "Two or three concrete words.",
  "world": "The place or material the product belongs to.",
  "moments": ["The one or two places that get rich color and detail."],
  "signature": "One small detail only this product would have.",
  "voice": ["Short rules for how the product speaks."]
}
```

Every field is optional and public: the workbench shows it at the top of every section and the generated guide leads with it. Add `"status": "draft"` while the text has not been reviewed by the owner, and remove it afterwards; a draft is labeled wherever it is shown. Without a direction, both places fall back to the first sentence of `summary` and say so. Derive it from what the product does, not from what is fashionable, and leave it out rather than fill it with words that fit any product.

Optional prose for the public guide goes in `design/public-guide.md`: how to work within the system, and links. Do not put token or fixture tables there; they are generated from the snapshot.

Add a snapshot path to the initially empty catalog, for example:

```json
{"schemaVersion":1,"collections":["./collections/my-app/collection.json"]}
```

Relative fixture URLs resolve against the containing manifest, not the viewer. Prefer explicit loopback URLs for separate app dev servers. Serve all catalog/token files over HTTP. Do not weaken the frame sandbox to make fixtures work.

## What fixtures should expose

Fixtures are where problems become visible. When adapting an app, check that they show:

- Every stored state the interface can render, including the rare ones. Raw state names such as `needs_review` reaching the page are found this way.
- Loading, failure, empty and interrupted versions of each flow, not only the finished one.
- Confirmation steps. A native `confirm()` cannot be fixtured or styled; an in-page dialog can, and is worth a fixture of its own.
- Real type. Open one fixture in more than one browser engine and confirm the family that renders is the one the tokens name.
- Narrow screens, at the widths the app's tests already use.

If the app publishes a fixed set of files, record in its root instructions every place a new public file must be registered. A font or image added to the stylesheet is otherwise a silent release change.

## One-way and static-site boundaries

Refresh derived metadata only from named app checkouts. The central command is `node tooling/sync-registry.mjs /absolute/app/path`; `--check` validates and reports drift without writing. An update to one app must leave all other apps registered. Snapshot metadata identifies inspected base and, when already verified for identical content, integration revision. Changed snapshots invalidate old integration claims until reviewed.

A production static site can remain a static build artifact. Local capture and workbench verification do not require a hosted editor, server-side persistence or two-way synchronization. Future automation should use exact input commits and reviewable artifacts/changes, with deployment separately authorized.
