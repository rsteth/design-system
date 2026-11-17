# Gather Motion design system

## Direction

- **Product:** A human-directed studio for short-form video, from brief and shot plan through review to a finished cut.
- **Character:** A plotting table: the work is the subject and the interface is the instrument laid over it.
- **World:** Paper light and blue-black dark themes, drawn in one line weight with cut corners, rails and stations.
- **Moments:** Frames passing through the slash of the gather/motion wordmark on the landing.; Plan, Review and Deliver as stations on one line, with a sequence strip and take rail.
- **Signature:** Cut corners as the only bezel; Space Grotesk headings, Inter reading text and Space Mono tags and figures.

Draft, not yet reviewed by the owner. Treat it as a starting point.

## Voice

- Keep accept or reject, select a take, approve plan and approve cut distinct.
- Mono capitals are for state tags and rail numbers, never sentences.

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

Supported study/app themes: light, dark. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| light | --ds-color-text | color | #14161b |
| light | --ds-color-text-muted | color | #595d66 |
| light | --ds-color-background | color | #edece5 |
| light | --ds-color-background-subtle | color | #e2e0d8 |
| light | --ds-color-surface | color | #f7f6f1 |
| light | --ds-color-border | color | #c8c6bd |
| light | --ds-color-border-control | color | #14161b |
| light | --ds-color-accent | color | #2148e6 |
| light | --ds-color-accent-soft | color | #dde3fb |
| light | --ds-color-accent-border | color | #93a6f0 |
| light | --ds-color-focus | color | #2148e6 |
| light | --ds-color-warning-soft | color | #fbe5d8 |
| light | --ds-color-warning-border | color | #e39a76 |
| light | --ds-color-danger | color | #b3261e |
| light | --ds-font-body | fontFamily | "Inter", -apple-system, "Segoe UI", sans-serif |
| light | --ds-font-heading | fontFamily | "Space Grotesk", "Inter", -apple-system, sans-serif |
| light | --ds-font-mono | fontFamily | "Space Mono", ui-monospace, SFMono-Regular, Consolas, monospace |
| light | --ds-size-control | dimension | 44px |
| light | --ds-color-accent-hover | color | #1836b8 |
| light | --ds-color-overlay | color | #14161b99 |
| light | --ds-color-shadow | color | #14161b44 |
| light | --ds-color-validation-background | color | #f4e7c3 |
| light | --ds-color-validation-text | color | #5c4708 |
| light | --ds-type-leading-one-point-three | number | 1.3 |
| light | --ds-type-leading-one-point-five | number | 1.5 |
| light | --ds-motion-easing-standard | string | cubic-bezier(0.2, 0.7, 0.2, 1) |
| light | --ds-type-tracking-minus-zero-point-zero-three-em | dimension | -0.03em |
| light | --ds-type-leading-zero-point-nine-eight | number | 0.98 |
| light | --ds-type-tracking-zero-point-zero-six-em | dimension | 0.06em |
| light | --ds-type-size-section | dimension | clamp(32px, 4.5vw, 58px) |
| light | --ds-type-leading-one-point-one-five | number | 1.15 |
| light | --ds-type-leading-one-point-zero-two | number | 1.02 |
| light | --ds-elevation-dialog | string | 0 20px 70px var(--ds-color-shadow) |
| light | --ds-type-size-fourteen | dimension | 14px |
| light | --ds-space-scale-eight | dimension | 8px |
| light | --ds-type-weight-semibold | number | 600 |
| light | --ds-space-scale-thirtytwo | dimension | 32px |
| light | --ds-type-size-thirteen | dimension | 13px |
| light | --ds-type-size-eleven | dimension | 11px |
| light | --ds-space-scale-four | dimension | 4px |
| light | --ds-type-size-twelve | dimension | 12px |
| light | --ds-type-weight-medium | number | 500 |
| light | --ds-type-weight-regular | number | 400 |
| light | --ds-space-scale-twelve | dimension | 12px |
| light | --ds-type-size-eighteen | dimension | 18px |
| light | --ds-space-scale-sixteen | dimension | 16px |
| light | --ds-space-scale-twenty | dimension | 20px |
| light | --ds-space-scale-twentyfour | dimension | 24px |
| light | --ds-space-scale-six | dimension | 6px |
| light | --ds-space-scale-forty | dimension | 40px |
| light | --ds-type-size-sixteen | dimension | 16px |
| light | --ds-type-size-twenty | dimension | 20px |
| light | --ds-type-weight-book | number | 450 |
| light | --ds-space-scale-hundred | dimension | 100px |
| light | --ds-space-scale-sixtyfour | dimension | 64px |
| light | --ds-space-scale-eighty | dimension | 80px |
| light | --ds-space-scale-two | dimension | 2px |
| light | --ds-space-scale-fortyeight | dimension | 48px |
| light | --ds-type-size-twentyfour | dimension | 24px |
| light | --ds-type-size-twentyeight | dimension | 28px |
| light | --ds-motion-duration-one-two-zero-m-s | dimension | 120ms |
| light | --ds-border-width-hairline | dimension | 1px |
| light | --ds-border-width-emphasis | dimension | 2px |
| light | --ds-border-width-focus | dimension | 3px |
| light | --ds-color-media | color | #0d0f14 |
| light | --ds-color-media-text | color | #e6e8ee |
| light | --ds-color-attention | color | #a33a10 |
| light | --ds-color-attention-pop | color | #e8612c |
| light | --ds-color-positive | color | #2f8f5b |
| light | --ds-color-positive-soft | color | #dcefe3 |
| light | --ds-color-positive-text | color | #1f6b43 |
| light | --ds-color-positive-border | color | #8fc4a5 |
| light | --ds-color-stage-plan | color | #2148e6 |
| light | --ds-color-stage-review | color | #7a5cf0 |
| light | --ds-color-stage-deliver | color | #e8a013 |
| light | --ds-color-action | color | #14161b |
| light | --ds-color-action-text | color | #f7f6f1 |
| light | --ds-color-action-hover | color | #30333b |
| light | --ds-type-size-thirtytwo | dimension | 32px |
| light | --ds-color-frame-edge | color | #14161b59 |
| light | --ds-color-frame-fill | color | #2148e60d |
| light | --ds-color-frame-hatch | color | #14161b1f |
| light | --ds-type-size-wordmark | dimension | clamp(44px, 11.5vw, 176px) |
| light | --ds-motion-duration-passage | dimension | 4.5s |
| light | --ds-motion-duration-enter | dimension | 240ms |
| light | --ds-motion-duration-bounce | dimension | 750ms |
| dark | --ds-color-text | color | #eceef4 |
| dark | --ds-color-text-muted | color | #9aa3b5 |
| dark | --ds-color-background | color | #0f1218 |
| dark | --ds-color-background-subtle | color | #1f2532 |
| dark | --ds-color-surface | color | #161a23 |
| dark | --ds-color-border | color | #2c3344 |
| dark | --ds-color-border-control | color | #cfd5e3 |
| dark | --ds-color-accent | color | #7c97ff |
| dark | --ds-color-accent-hover | color | #9db1ff |
| dark | --ds-color-accent-soft | color | #1a2347 |
| dark | --ds-color-accent-border | color | #3a4c9a |
| dark | --ds-color-focus | color | #7c97ff |
| dark | --ds-color-warning-soft | color | #3a2015 |
| dark | --ds-color-warning-border | color | #8a4a2c |
| dark | --ds-color-attention | color | #ffb08a |
| dark | --ds-color-attention-pop | color | #ff7a3d |
| dark | --ds-color-danger | color | #ff8f85 |
| dark | --ds-color-positive | color | #5fc48a |
| dark | --ds-color-positive-soft | color | #14301f |
| dark | --ds-color-positive-text | color | #8fdcae |
| dark | --ds-color-positive-border | color | #2f6b49 |
| dark | --ds-color-stage-plan | color | #6c8cff |
| dark | --ds-color-stage-review | color | #a78bfa |
| dark | --ds-color-stage-deliver | color | #f5b83d |
| dark | --ds-color-action | color | #eceef4 |
| dark | --ds-color-action-text | color | #0f1218 |
| dark | --ds-color-action-hover | color | #cfd5e3 |
| dark | --ds-color-media | color | #07090d |
| dark | --ds-color-validation-background | color | #33290d |
| dark | --ds-color-validation-text | color | #f0d98a |
| dark | --ds-color-overlay | color | #000000b3 |
| dark | --ds-color-shadow | color | #00000066 |
| dark | --ds-color-frame-edge | color | #7c97ff8c |
| dark | --ds-color-frame-fill | color | #7c97ff26 |
| dark | --ds-color-frame-hatch | color | #7c97ff00 |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Public landing | screens | default, waiting-list-unavailable, dialog-closed |
| Production overview | screens | sample-productions, planning, plan-approved |
| Empty production overview | screens | empty, read-only |
| Studio controls | components | default, disabled, focus, selected |
| Studio feedback | patterns | empty, error, validation, approved |
| Projects and series / populated | screens | populated, reset-on-reload, synthetic-only |
| Projects and series / empty | screens | empty, reset-on-reload, synthetic-only |
| Projects and series / viewer | screens | viewer, reset-on-reload, synthetic-only |
| Content profiles / populated | screens | populated, reset-on-reload, synthetic-only |
| Content profiles / empty | screens | empty, reset-on-reload, synthetic-only |
| Content profiles / viewer | screens | viewer, reset-on-reload, synthetic-only |
| Subject and media library / populated | screens | populated, reset-on-reload, synthetic-only |
| Subject and media library / empty | screens | empty, reset-on-reload, synthetic-only |
| Subject and media library / viewer | screens | viewer, reset-on-reload, synthetic-only |
| Project editor | patterns | populated, reset-on-reload, synthetic-only |
| Series editor | patterns | populated, reset-on-reload, synthetic-only |
| New project form | patterns | populated, reset-on-reload, synthetic-only |
| Draft profile editor | patterns | populated, reset-on-reload, synthetic-only |
| Published immutable profile | patterns | populated, reset-on-reload, synthetic-only |
| Profile import | patterns | populated, reset-on-reload, synthetic-only |
| Subject editor | patterns | populated, reset-on-reload, synthetic-only |
| Reference set editor | patterns | populated, reset-on-reload, synthetic-only |
| New production / profile | screens | profile, reset-on-reload, synthetic-only |
| New production / brief | screens | brief, reset-on-reload, synthetic-only |
| New production / plan | screens | plan, reset-on-reload, synthetic-only |
| New production / viewer | screens | viewer, reset-on-reload, synthetic-only |
| Production board / populated | screens | populated, reset-on-reload, synthetic-only |
| Production board / empty | screens | empty, reset-on-reload, synthetic-only |
| Production board / approved | screens | approved, reset-on-reload, synthetic-only |
| Production board / archived | screens | archived, reset-on-reload, synthetic-only |
| Production board / error | screens | error, reset-on-reload, synthetic-only |
| Production board / loading | screens | loading, reset-on-reload, synthetic-only |
| Production board / viewer | screens | viewer, reset-on-reload, synthetic-only |
| Shot editor and revision history | patterns | populated, reset-on-reload, synthetic-only |
| New shot and dependencies | patterns | empty, reset-on-reload, synthetic-only |
| Review room / populated | screens | populated, reset-on-reload, synthetic-only |
| Review room / empty | screens | empty, reset-on-reload, synthetic-only |
| Review room / unapproved | screens | unapproved, reset-on-reload, synthetic-only |
| Review room / error | screens | error, reset-on-reload, synthetic-only |
| Review room / loading | screens | loading, reset-on-reload, synthetic-only |
| Review room / viewer | screens | viewer, reset-on-reload, synthetic-only |
| Deliver / populated | screens | populated, reset-on-reload, synthetic-only |
| Deliver / empty | screens | empty, reset-on-reload, synthetic-only |
| Media preview / ready | components | ready, reset-on-reload, synthetic-only |
| Media preview / expired | components | expired, reset-on-reload, synthetic-only |
| Media preview / loading | components | loading, reset-on-reload, synthetic-only |
| Production error notice | components | default, reset-on-reload, synthetic-only |
| Creative Memory / populated | patterns | populated, reset-on-reload, synthetic-only |
| Creative Memory / empty | patterns | empty, reset-on-reload, synthetic-only |
| Creative Memory / error | patterns | error, reset-on-reload, synthetic-only |
| Creative Memory / viewer | patterns | viewer, reset-on-reload, synthetic-only |
| Shot reference and event controls | patterns | advanced, reset-on-reload, synthetic-only |
| Candidate comparison and advisory review | patterns | populated, reset-on-reload, synthetic-only |
| Director / planning packet | patterns | populated |
| Director / read-only | patterns | viewer |
| Director / local model controls | patterns | configured-synthetic |

[Open this workbench](../../../apps/studio/?collection=bandit)
