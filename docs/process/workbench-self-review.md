# Workbench skin and self catalog

Local-only engine update to 0.2.0, verified November 7, 2026. No publication, deployment or app-source change.

The central shell uses stethem.com's existing palette: white #fff, warm gray #f3f1ed, charcoal #24211f, muted text #6b625d, rust #9c4635 and hover #783326, with the existing #ddd border. Typography and layout are unchanged. Named, scoped skin tokens are separate from component CSS, and setSkin changes the skin without replacing mounted fixtures. No alternate palette is invented.

Workbench is now an original collection in its own registry. Components uses the real engine's controls and token inspector, Patterns switches real empty/loaded states, and Screens runs the actual studio with only the three app collections. The self collection is removed or its fixtures stripped before nested mounting, so the workbench cannot recursively embed itself. All fixtures retain the original sandbox boundary.

The blank starter includes the exact 0.2.0 engine and default skin, but no app or self collection. Existing app repositories and pinned vendor packages remain untouched by this shell update.

Checks: 35 Node tests, schema/syntax and generated-skin checks, static build, synthetic browser suite, self-catalog browser suite, standalone starter and three real-app browser integrations. Tests explicitly verify that changing shell colors does not alter iframe app computed styles. Self fixture coverage includes responsive sizing, repeated state switches, theme acknowledgment and bounded frame trees. Screenshots live under tests/workbench/artifacts.

Preview: /apps/studio/?collection=workbench&section=components. The skin is a current default, not a commitment to one permanent visual identity. Future app-wide population and architecture reshaping are separate work beyond this shell change.
