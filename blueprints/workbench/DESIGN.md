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

Token documents use `schemaVersion: 1`, `namespace` matching the app id and explicit modes/selectors. Preserve existing values. Shared semantic vocabulary includes `color.background`, `color.surface`, `color.text`, `color.text.muted` and `color.accent`; shared names do not require matching palettes. Tokens are not raw asset URLs.

Add a snapshot path to the initially empty catalog, for example:

```json
{"schemaVersion":1,"collections":["./collections/my-app/collection.json"]}
```

Relative fixture URLs resolve against the containing manifest, not the viewer. Prefer explicit loopback URLs for separate app dev servers. Serve all catalog/token files over HTTP. Do not weaken the frame sandbox to make fixtures work.

## One-way and static-site boundaries

Refresh derived metadata only from named app checkouts. The central command is `node tooling/sync-registry.mjs /absolute/app/path`; `--check` validates and reports drift without writing. An update to one app must leave all other apps registered. Snapshot metadata identifies inspected base and, when already verified for identical content, integration revision. Changed snapshots invalidate old integration claims until reviewed.

A production static site can remain a static build artifact. Local capture and workbench verification do not require a hosted editor, server-side persistence or two-way synchronization. Future automation should use exact input commits and reviewable artifacts/changes, with deployment separately authorized.
