# Source and publication branches

The repository currently has separate source and deployed-artifact branches:

- `feature/design-system-public` is the clean, publishable source: modules, tests, tooling and the portable starter.
- `feature/design-system-release` retains the private release assembly inputs and provenance. Export it only after reconciling source changes from the public development branch. Never publish its full history.
- `gh-pages` contains the generated website. It is not the development source or a substitute for testing the source tree.

The November 12 redesign was committed to both public source and Pages. The older private assembly checkout initially lacked that redesign; its corresponding source/test files have now been reconciled without merging the histories. New dimension specimens and self-workbench coverage are local changes until a separate reviewed publication.

For the next change, edit the source branch, keep the blank starter vendor synchronized, run `npm run check`, and test affected browser behavior. Reconcile the assembly source before exporting, use exact app input snapshots, and publish source and generated artifacts together. Do not copy an old assembly output over newer Pages edits. Check both branches and uncommitted changes before a build.

A future simplification could use one clearly named development branch plus `gh-pages`; it should preserve release provenance and existing history rather than flattening or force-pushing either branch.
