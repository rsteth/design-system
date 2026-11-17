# Gather Motion design system

## Implement within the system

1. Start from the existing component for the screen or state. Extend it rather than making a second component for the workbench.
2. Reuse the semantic tokens below. In CSS use the listed custom properties; introduce a named app-owned token when a genuinely reusable decision is missing. Do not copy literal colors, spacing, type sizes, radii, shadows or motion durations into new controls.
3. Preserve visible labels, keyboard interaction, focus indicators, dialog dismissal and minimum control targets. Use reduced-motion preferences for motion. Keep authored controls free of decorative Unicode glyphs.
4. Represent new states with synthetic, deterministic fixtures that render the actual application component and CSS. Never copy customer media, account records or credentials into examples.
5. Run the repository's design checks and applicable tests before refreshing its workbench. App source flows to the workbench, not the reverse.

Layout geometry, breakpoints, artwork composition, circular shapes and runtime appearance controls have explicit exceptions in the repository. They are not a license to bypass the token model. The fixture catalog is a coverage map, not a claim that every live product workflow is tested.

## Ownership and use

The repository's AGENTS.md and design-system.md specify the editable sources, commands and local validation. This public guide is generated from the app-owned design contract; edit the sources, not this copy. It describes Gather Motion, not an official design standard for other products. Publication does not grant a new license to imagery or other assets.

[Open Gather Motion](https://gathermotion.io/). Public guidance helps discovery; it cannot force an agent to read it or authorize account access, edits or deployment.
