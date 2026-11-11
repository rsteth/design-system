# Learning Machines / 03 — website

Static article plus four independent, progressively enhanced panels. The site owns writing, DOM controls and the original orthographic 3D renderer. Numerical mechanics and synthetic fixtures come from the exact committed `rsteth/learning-machines` revision in `mechanics-pin.json`; no runtime remote requests are made.

## Update the pin

```sh
node scripts/sync-learning-machines.mjs /path/to/learning-machines FULL_COMMIT_SHA manifolds
node scripts/render-manifold-preview.mjs
node scripts/test-manifolds.mjs
node scripts/test-arrows.mjs
```

The optional `manifolds` selector preserves the previous attention-memory default sync command and does not alter studies 01–02. Sync reads committed Git blobs and writes hashes, MIT license, exact tree and commit URLs. The generated static previews use the same pinned FK, grid, route and PCA fixtures as the live panels. Do not copy working-tree mechanics into the page or use an invented revision.

## Illustration view

The shared live/static renderer uses a front-facing 180° camera yaw: physical +Y remains forward, while increasing forward distance appears screen-left/down. The visible torso/head faces are -X, +Y and the top. The screen-right/down/toward-camera basis preserves chirality; no joint coordinates, target poses, fixtures or PCA data are inverted.

## Controls and mathematical labels

- Free arms: fourteen actual joint coordinates within rig limits; ball stays unattached. Wrist axis markers show 3D orientation.
- Rigid grasp: six ball coordinates plus two posture preferences. Failure retains the last accepted pose and draws the requested target with a dashed outline. Release enables independent joint controls. Reset to canonical grasp loads a known example; it is not a simulated contact transition.
- Cost: sampled y/z slice with fixed x/orientation/posture, four-neighbour shortest and weighted least-cost routes. The shortest path is a valid discrete route, not a straight-line Cartesian claim. Invalid cells are hatched and cannot be traversed. Increasing physical Y goes rightward on the coordinate chart but down-left in the front-view robot; the chart and robot view intentionally use different screen directions.
- Skill threads (`threads.mjs`): each synthetic handoff is one thread on PC1 and PC2; the third axis is joint-space distance from the fitted two-component plane at the same scale. All scores are computed at load from the pinned fixture and PCA mechanics. Drag or arrow keys turn the view, three buttons give preset views, and clicking a pose loads its PCA coordinates; the sliders and buttons remain the keyboard path. `skill-static.svg` is the same renderer drawn into an SVG-recording context.
- Layout: in the cost and skill panels the robot sits beside its figure on wide screens and directly above it on narrow ones; `sideBySide` in `page.mjs` moves the scene at setup, so the no-JavaScript fallback keeps the plain stacked order. With the hand-designed controller the skill figure also dots in the Reach and Present lines, solved with the pinned IK, to show where the designed coordinates sit in the fitted space.
- Skill: PCA signs are arbitrary. The synthetic training data orients PC1 toward farther-forward ball positions and PC2 toward higher positions; these are mixed fitted axes, not Reach/Present or universal meanings. Score ranges come from the fixture, with an extended display range for the outside-family example. Hand-designed Reach/Present or training-fitted PC1/PC2, raw and projected residuals, held-out errors, and a deliberately out-of-family sideward target. Projection restores relative grasp geometry only; it need not recover the original demonstrated target.

All panels reset separately. No autoplay. Standard labelled controls support keyboard and touch. Distinct fixture-derived fallback diagrams and the full article survive disabled/failed JavaScript. Positions are metres; sliders show joint angles in degrees, internal mechanics use radians. Cost fields disclose torque's equal-load quasistatic assumptions and normalized proxy formulas. Original code/artwork is MIT-compatible; external sources are linked as further reading, not sources for synthetic numerical data.

Publishing remains a separate authorized action. Local commits and a valid pin are not evidence of a public release; do not claim source URLs resolve until the exact source revision is pushed.
