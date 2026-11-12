# stethem design system

The application owns its appearance, components and behavior. This workbench is a one-way snapshot, not an editor or a second source of truth. In an authorized checkout, read its AGENTS.md and design-system.md (or DESIGN.md when no dedicated guide exists) before editing. Reuse real components and semantic tokens, update synthetic fixtures, run the app checks, then explicitly refresh this snapshot. Do not edit the snapshot to change the application.

Supported study/app themes: light. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| light | --ds-font-heading | fontFamily | "Space Grotesk", "Arial", sans-serif |
| light | --ds-font-body | fontFamily | "Inter", "Arial", sans-serif |
| light | --ds-font-mono | fontFamily | "Space Mono", "Courier New", monospace |
| light | --ds-color-text | color | #24211f |
| light | --ds-color-text-muted | color | #6b625d |
| light | --ds-color-accent | color | #9c4635 |
| light | --ds-color-accent-hover | color | #783326 |
| light | --ds-color-background | color | #fff |
| light | --ds-color-surface | color | #f3f1ed |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Portfolio | screens |  |
| 404 and recovery links | screens |  |
| Mysterious Modular Device | screens |  |
| Fischer Price Revolutionary Device | screens |  |
| The Spoon App | screens |  |
| Learning Machines collection | screens |  |
| Token study · default | screens |  |
| Token study · no-js | screens |  |
| Token study · no-canvas | screens |  |
| Attention and memory · default | screens |  |
| Attention and memory · no-js | screens |  |
| Attention and memory · no-canvas | screens |  |
| Market River archive · populated | screens |  |
| Market River archive · loading | screens |  |
| Market River archive · empty | screens |  |
| Market River archive · error | screens |  |
| Market River archive · history-fallback | screens |  |
| Market River archive · image-error | screens |  |
| Typography, links and inline SVG arrows | components |  |
| Project grid, thumbnails and metadata | patterns |  |
| Museum video controls and poster · paused | components |  |
| Museum video controls and poster · playing | components |  |
| Museum video controls and poster · error | components |  |
| Back link, essay and photo sequence | patterns |  |
| Study headings, caveats and provenance | patterns |  |
| Five-stage token story · pieces | patterns |  |
| Five-stage token story · rows | patterns |  |
| Five-stage token story · context | patterns |  |
| Five-stage token story · scores | patterns |  |
| Five-stage token story · append | patterns |  |
| Five-stage token story · stop | patterns |  |
| Piece selection and word splits · selected | components |  |
| Piece selection and word splits · word | components |  |
| Sampling choice and seed validation · sample | components |  |
| Sampling choice and seed validation · invalid | components |  |
| Seeded histogram playground · empty | patterns |  |
| Seeded histogram playground · populated | patterns |  |
| Component trace and worked disclosures · hover | patterns |  |
| Component trace and worked disclosures · pinned | patterns |  |
| Component trace and worked disclosures · expanded | patterns |  |
| Generated teaching artwork | components |  |
| Context range and countable growth tiles · minimum | components |  |
| Context range and countable growth tiles · maximum | components |  |
| Context range and countable growth tiles · tile | components |  |
| Architecture choice and layer selection · hybrid | patterns |  |
| Architecture choice and layer selection · converted | patterns |  |
| Architecture choice and layer selection · last | patterns |  |
| Event stepper and lossy recall · empty | patterns |  |
| Event stepper and lossy recall · populated | patterns |  |
| Event stepper and lossy recall · complete | patterns |  |
| Snapshot carousel and focused card · populated | patterns |  |
| Snapshot carousel and focused card · focused | patterns |  |
| Manifest grouping, ordering, weather selection | patterns |  |
| Pinned educational models | patterns |  |
| Market River archive · no-js | screens |  |
| Manifolds and motion · default | screens |  |
| Manifolds and motion · no-js | screens |  |
| Manifolds and motion · no-canvas | screens |  |
| Fourteen joint coordinates · default | components |  |
| Fourteen joint coordinates · adjusted | components |  |
| Rigid grasp and released joints · accepted | patterns |  |
| Rigid grasp and released joints · unreachable | patterns |  |
| Rigid grasp and released joints · released | patterns |  |
| Cost fields and grid routes · torque | patterns |  |
| Cost fields and grid routes · joint-limit | patterns |  |
| Cost fields and grid routes · clearance | patterns |  |
| Cost fields and grid routes · invalid | patterns |  |
| Task coordinates and fitted skill · task | patterns |  |
| Task coordinates and fitted skill · pca | patterns |  |
| Task coordinates and fitted skill · held-out | patterns |  |
| Task coordinates and fitted skill · outside | patterns |  |
| Skill thread view controls · edge | components |  |
| Skill thread view controls · above | components |  |

[Open this workbench](../../../apps/studio/?collection=stethem)
