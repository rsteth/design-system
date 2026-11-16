# Blueprint guardrails

This is a dated record, not the current rules. How the system works today is in `contract.md`, and the steps for each task are in `agent-tasks.md`. Read this before changing blueprint wording, to see what literal wording has cost before.

November 16, 2026. A design pass on Reads found that three sentences in the blueprint had steered the app somewhere nobody chose. This note records what they were, what changed and what was deliberately left alone. Nothing here is published or installed in any app.

## What went wrong

- **“Preserve existing values.”** Followed literally, every literal in the stylesheet became a token: 188 of them, with 27 type sizes, 40 spacing steps and 17 radii, many named after their value. The app's check passed because it only rejected untokenized literals. It guaranteed tokens, not a scale.
- **“Preserve its framework, appearance and public URLs.”** This was written about installing the workbench. Copied into the app's root instructions it became a standing rule to preserve copy, which froze the product's wording long after installation.
- **No place for intent.** The contract asked for tokens, fixtures and inventory. Nothing recorded what the product was meant to feel like, so generated guides led with a token table and later work optimized for the table.

A fourth problem was not in the wording. The app's font stack led with `ui-rounded`, which only some browser engines resolve, so most visitors saw the system font and no check noticed.

## What changed

- **Blueprint wording.** Installation must not change the app, and that is stated as a rule for installation, not a freeze. Tokens record the scale the app uses; a set of values that is not a scale is reported as such instead of being named value by value. Root instructions win over the hash-locked blueprint files, and the blueprint says so itself.
- **`direction` in the collection contract.** An optional, public block: product, character, world, moments, signature and voice notes. The workbench shows it at the top of every section (in full on Foundations, one line beside fixtures) and every generated guide leads with it. `"status": "draft"` marks text the owner has not reviewed. Where nothing is written, one line is taken from the summary or study description and labeled.
- **One guide path.** `tooling/agent-guides.mjs` composes every guide the same way: title, direction, the app's optional prose notes, then tables generated from the snapshot. The whole-file override that Reads and Bandit used is gone; their snapshots now hold prose notes only. Notes live at `design/public-guide.md` in every app.
- **Draft directions for the six own entries.** Workbench, Reads, Gather Motion, Focus, Great Circle and stethem each carry a drafted direction. Reads' comes from its own `DESIGN.md`; the others were drafted here from fixture names, tokens and summaries, and need the owner's review. Reference studies carry none: they show the first sentence of their study description, labeled as unverified.
- **`adviseTokens` in the token package.** Plain-language notes about more distinct steps than a scale usually needs, near-identical colors within one role family, and font stacks that lead with a platform-only keyword. It is separate from validation and never fails a check. `npm run tokens:advice` prints the notes for the registered app snapshots, or for any token files passed as arguments.
- **`APP-DESIGN.template.md` in the blueprint.** A skeleton for an app's root `DESIGN.md` that keeps the current contract apart from dated history, and opens with the direction.
- **Adapter checklist.** Fixtures for every stored state, in-page confirmation instead of native dialogs, type checked in more than one engine, exact check commands in root instructions, separate ports for the workbench and its browser tests, and a written rule for adding a public file.
- **Document screenshots.** A short recipe for producing them from fixtures with a command, so they can be recaptured.

## What was left alone

- The one-way rule, the frame sandbox and the vendor pins. They worked.
- The engine's other views. Only the direction panel was added; `packages/workbench` and the blank starter's vendor copy stay identical to each other.
- Validation. Nothing that was valid is now invalid, and no opinion about style can fail an app's build.
- The advice is not wired into `npm run check`. It is a command to run and read.

## Calibration

The advice was tried on the Reads token document from before the design pass and after it. Before: ten notes, covering type sizes, spacing, radii, weights, line heights, tracking, six pairs of near-identical text colors and three font stacks. After: none. Close surface steps and hover states are not reported, because dark themes use them for depth and feedback.

Thresholds live in `scaleLimits` in `packages/tokens/index.mjs`. Treat them as starting points and change them when a real app shows they are wrong.

## Status on November 16, 2026

The central side is done. These are changes in the apps' own repositories and have not been made.

- **Every app:** copy the reviewed direction into `design/collection.json` without the `status` field, then refresh the snapshot. That refresh replaces the central draft.
- **Reads:** it now records an owner-approved direction in `design/collection.json`, generates the Direction bullets of its `DESIGN.md` from it, and names the source and the upgrade route in its instructions. Still to do there: end `design/public-guide.md` before its `## Inventory` heading, and have `scripts/guidance.mjs` print the direction ahead of the tables in the guide it publishes on its own domain. Its snapshot here has not been refreshed: it still predates Reads' design pass and still shows the central draft. Refresh it through the release assembly, so the public copy keeps its revision withheld.
- **Gather Motion:** add `design/public-guide.md` with the prose now held in its snapshot. Until it exists, the release freshness check reports a public guide mismatch for this app.
- **Focus, Great Circle, stethem:** nothing beyond the direction.
- **The other apps' instructions:** apart from Reads, none yet says that the direction's source is `design/collection.json` or how an upgrade happens. The upgraded blueprint files say it; the root instructions should too.

No app has been upgraded. The package version is 0.5.0, and the engine's `VERSION` constant and the starter's `engine-lock.json` move with it. The upgrade was tried on a throwaway export of Reads: it went from 0.4.0 to 0.5.0, kept `collections.json`, `index.html` and `main.mjs`, and Reads' design check and local workbench both worked on the result.

Recording a direction does not need the upgrade. The validator apps already vendor ignores fields it does not know, so an app can add `direction` now and a snapshot refresh carries it through. The upgrade is what brings the new wording, the token advice and the direction panel into the app's own local workbench.
