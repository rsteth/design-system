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

## Hosted catalog scope

This viewer contains Compass tokens, direction and guide only. Its app-owned screens are not packaged here. Open the public Compass site for the product; hosted MCP remains unavailable.

[Open Compass](https://compass-public-preview.robin-stethem.workers.dev/). No app backend, private inventory, local capture server or screen adapter is distributed by this registration.

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

[Open this workbench](../../../apps/studio/?collection=compass)
