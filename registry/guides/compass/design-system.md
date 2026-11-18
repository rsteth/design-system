# Compass design system

## Direction

- **Product:** Compass gives an agent the public vulnerability record and the evidence from projects you select, so it can say what needs a look, with the source and the uncertainty in view.
- **Character:** watchful, exact, unhurried
- **World:** The combat information centre of a ship at night. The lights are down, one screen is lit, and the watch already knows what it will do when a contact is called.
- **Moments:** The night globe on the homepage: Earth drawn in characters, lit along one limb, turning slowly, with one contact and its bearing; The Connect via MCP action at the centre of that screen
- **Signature:** One amber contact on a dark globe, with its bearing read off the compass ring. Amber is used for nothing else.

Draft, not yet reviewed by the owner. Treat it as a starting point.

## Voice

- Say what is known, where it came from and what is not covered.
- A missing match is never called safe.
- Short declarative lines, like a report on a net. No urgency words.
- Capitals are for instrument labels and the hero title. Sentences that explain stay in sentence case.

The application owns its appearance, components and behavior. This workbench is a one-way snapshot, not an editor or a second source of truth. In an authorized checkout, read its AGENTS.md and design-system.md (or DESIGN.md when no dedicated guide exists) before editing. Reuse real components and semantic tokens, update synthetic fixtures, run the app checks, then explicitly refresh this snapshot. Do not edit the snapshot to change the application.

Supported study/app themes: dark, light. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| dark | --ds-color-background | color | #0a0d14 |
| dark | --ds-color-surface | color | #121724 |
| dark | --ds-color-text | color | #e8ebf1 |
| dark | --ds-color-text-muted | color | #939cab |
| dark | --ds-color-border | color | #2a3140 |
| dark | --ds-color-accent | color | #8fb4ff |
| dark | --ds-color-on-accent | color | #0a1020 |
| dark | --ds-color-contact | color | #f2a640 |
| dark | --ds-font-mono | fontFamily | "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace |
| dark | --ds-size-target | dimension | 44px |
| dark | --ds-motion-duration | dimension | 150ms |
| light | --ds-color-background | color | #f6f6f2 |
| light | --ds-color-surface | color | #edeee8 |
| light | --ds-color-text | color | #202320 |
| light | --ds-color-text-muted | color | #5e645f |
| light | --ds-color-border | color | #d1d4ce |
| light | --ds-color-accent | color | #184cdb |
| light | --ds-color-on-accent | color | #ffffff |
| light | --ds-color-contact | color | #9a5200 |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Homepage | screens | dark, light, desktop, mobile, reduced motion, no JavaScript |
| Connection guide | screens | dark, light, desktop, mobile, copy command |
| Advisory index | screens | dark, light, loading, populated, no matches, index unavailable |

[Open this workbench](../../../apps/studio/?collection=compass)
