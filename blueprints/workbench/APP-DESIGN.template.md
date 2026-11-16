# <App> design contract

Copy this file to the project root as `DESIGN.md` and fill it in. Delete any section that does not apply and every line of guidance in angle brackets.

This file says how <App> looks, sounds and behaves today. Dated verification notes and the reasoning behind earlier decisions go in `docs/design-history.md`, not here. If a paragraph stops being true, change the paragraph.

## Direction

- **Product:** <what it does and for whom, in one plain sentence>
- **Character:** <two or three concrete words; not clean, modern, sleek, minimal or premium>
- **World:** <the place or material the product belongs to>
- **Moments:** <the one or two places that get rich color and detail; say honestly if one is not built yet>
- **Signature:** <one small detail only this product would have>

Everything else stays quiet.

## Voice and copy

- <the product's own words for its things, and the internal words that must not reach the page>
- <case and punctuation for headings, labels and buttons>
- <where a third party is named, and where it is not>
- <what every consent or payment point must say>
- <how numbers, costs and times are written>
- Never alter text a person typed.

## Interaction

- <how destructive actions are confirmed>
- <how many accent actions a group may have, and how secondary and destructive ones look>
- <what stays native and browser-owned>
- Keep semantic headings, labels, visible keyboard focus and reduced-motion support.

## Scale

Add a step only when a reusable decision needs it. Do not mint a token for a one-off value.

- **Family:** <the face that actually renders, where its files live and under what license>
- **Sizes:** <the steps>
- **Weights:** <the steps>
- **Spacing:** <the steps>
- **Radii:** <one per role>
- **Color:** <the ramp, the text roles, the accent, and what is deliberately excluded>

## Exceptions

<what the token check deliberately does not cover, such as layout dimensions, breakpoints and illustration geometry>

## Fixtures

<how many, what serves them, and what they do and do not prove. Every new state gets one.>

## Commands

<the design commands. The full list of checks to run after a change belongs in the root agent instructions, with the exact command for each.>

## Ownership

App source feeds the fixtures, manifest and tokens, which feed an explicit workbench snapshot. Nothing flows back. `workbench/AGENTS.md` and `workbench/DESIGN.md` are a vendored blueprint; where they differ from this file, this file wins.

## Adding a public file

<if the app publishes a fixed set of files: every place a new one must be registered, and who approves it>
