# Gather Motion design system

## Direction

- **Product:** A studio for making short-form video, where a person directs every production from brief to approved shot.
- **Character:** cool-headed, exacting, unhurried
- **World:** A production office with a view of ice: glacier blue, copper fittings and a call sheet set in monospace.
- **Moments:** The glacier artwork on the landing; The production board, where shots move from plan to approved
- **Signature:** Technical details set in Space Mono, like markings on a slate.

Draft, not yet reviewed by the owner. Treat it as a starting point.

Gather Motion is a human-directed studio for short-form video. Its visual language is app-owned: glacier imagery, blue and copper accents, Jost display type, Inter interface type and Space Mono technical text. Preserve that identity rather than applying the workbench shell's appearance. The product supports its established light theme only.

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

Supported study/app themes: light. Contract schema: 1. Package version: 0.0.1, which identifies the package and not a verified deployed release.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| light | --ds-color-text | color | #152d3e |
| light | --ds-color-text-muted | color | #526473 |
| light | --ds-color-background | color | #edece5 |
| light | --ds-color-background-subtle | color | #e0e5e5 |
| light | --ds-color-surface | color | #faf8f0 |
| light | --ds-color-border | color | #c9d0d1 |
| light | --ds-color-border-control | color | #75838b |
| light | --ds-color-accent | color | #315c7a |
| light | --ds-color-accent-soft | color | #e0e9ee |
| light | --ds-color-accent-border | color | #8099aa |
| light | --ds-color-focus | color | #8a4f30 |
| light | --ds-color-warning-soft | color | #f2e0d1 |
| light | --ds-color-warning-border | color | #b37d57 |
| light | --ds-texture-opacity | number | 0.12 |
| light | --ds-color-danger | color | #8a352b |
| light | --ds-font-body | fontFamily | "Inter", -apple-system, "Segoe UI", sans-serif |
| light | --ds-font-heading | fontFamily | "Jost", "Futura", "Century Gothic", sans-serif |
| light | --ds-font-mono | fontFamily | "Space Mono", ui-monospace, SFMono-Regular, Consolas, monospace |
| light | --ds-radius-control | dimension | 6px |
| light | --ds-radius-panel | dimension | 6px |
| light | --ds-size-control | dimension | 44px |
| light | --ds-color-landing-background | color | #edece5 |
| light | --ds-color-landing-text | color | #152d3e |
| light | --ds-color-landing-border | color | #c9d0d1 |
| light | --ds-color-landing-signal | color | #2148e6 |
| light | --ds-color-landing-signal-hover | color | #1836b8 |
| light | --ds-color-landing-night | color | #0c1828 |
| light | --ds-color-landing-night-raised | color | #13233a |
| light | --ds-color-landing-frost | color | #eef1f5 |
| light | --ds-color-landing-haze | color | #9fb0c6 |
| light | --ds-color-landing-glow | color | #8ea6ff |
| light | --ds-color-landing-rail | color | #7f8c9950 |
| light | --ds-color-accent-hover | color | #244761 |
| light | --ds-color-overlay | color | #152d3e99 |
| light | --ds-color-shadow | color | #152d3e44 |
| light | --ds-texture-maximum | number | 1 |
| light | --ds-backdrop-header-fade | dimension | 38% |
| light | --ds-backdrop-footer-fade | dimension | 28% |
| light | --ds-color-white | color | #fff |
| light | --ds-color-validation-background | color | #f0e5cb |
| light | --ds-color-validation-text | color | #65501c |
| light | --ds-color-shadow-subtle | color | #302e2808 |
| light | --ds-color-heading-warm | color | #292824 |
| light | --ds-color-overview-scrim-strong | color | #102638e8 |
| light | --ds-color-overview-scrim-middle | color | #16334c9c |
| light | --ds-color-overview-scrim-clear | color | #16334c08 |
| light | --ds-color-overview-eyebrow | color | #e9bd9a |
| light | --ds-type-tracking-minus-one-px | dimension | -1px |
| light | --ds-space-scale-five-eight-px | dimension | 58px |
| light | --ds-type-size-legacyhero | dimension | clamp(44px, 5.5vw, 70px) |
| light | --ds-type-leading-one-point-zero-four | number | 1.04 |
| light | --ds-type-tracking-minus-three-px | dimension | -3px |
| light | --ds-type-size-legacysection | dimension | clamp(32px, 4vw, 48px) |
| light | --ds-type-tracking-minus-one-point-eight-px | dimension | -1.8px |
| light | --ds-type-leading-one-point-two-five | number | 1.25 |
| light | --ds-type-tracking-minus-zero-point-six-px | dimension | -0.6px |
| light | --ds-type-leading-one-point-three | number | 1.3 |
| light | --ds-type-tracking-minus-zero-point-three-px | dimension | -0.3px |
| light | --ds-type-leading-one-point-six | number | 1.6 |
| light | --ds-type-tracking-one-point-eight-px | dimension | 1.8px |
| light | --ds-space-scale-three-five-px | dimension | 35px |
| light | --ds-type-tracking-minus-two-px | dimension | -2px |
| light | --ds-motion-duration-zero-point-one-five-s | dimension | 0.15s |
| light | --ds-type-tracking-one-point-five-px | dimension | 1.5px |
| light | --ds-type-tracking-one-point-two-px | dimension | 1.2px |
| light | --ds-elevation-selected | string | 0 0 0 1px var(--ds-color-accent) |
| light | --ds-type-leading-one-point-five | number | 1.5 |
| light | --ds-space-scale-five-zero-px | dimension | 50px |
| light | --ds-elevation-card | string | 0 8px 24px var(--ds-color-shadow-subtle) |
| light | --ds-type-leading-one-point-five-five | number | 1.55 |
| light | --ds-type-leading-one-point-seven | number | 1.7 |
| light | --ds-space-scale-one-r-em | dimension | 1rem |
| light | --ds-type-size-zero-point-seven-five-r-em | dimension | 0.75rem |
| light | --ds-type-tracking-zero-point-zero-eight-em | dimension | 0.08em |
| light | --ds-elevation-review | string | inset 0 3px var(--ds-color-accent) |
| light | --ds-type-size-overview | dimension | clamp(38px, 4.5vw, 60px) |
| light | --ds-motion-easing-standard | string | cubic-bezier(0.2, 0.7, 0.2, 1) |
| light | --ds-color-landing-mark | color | #8794a3 |
| light | --ds-color-landing-night-border | color | #ffffff1f |
| light | --ds-color-landing-border-strong | color | #ffffff4d |
| light | --ds-color-landing-border-soft | color | #ffffff29 |
| light | --ds-color-landing-overlay-faint | color | #ffffff0f |
| light | --ds-color-landing-memory-highlight | color | #f4f6ffeb |
| light | --ds-color-landing-memory-glow | color | #bcc9ff |
| light | --ds-color-landing-memory-light | color | #5f7ef6 |
| light | --ds-color-landing-memory-blue | color | #1a37b4 |
| light | --ds-color-landing-memory-deep | color | #0f1f63 |
| light | --ds-color-landing-border-translucent | color | #ffffff33 |
| light | --ds-color-landing-overlay-soft | color | #ffffff17 |
| light | --ds-type-tracking-minus-zero-point-zero-three-em | dimension | -0.03em |
| light | --ds-motion-duration-zero-point-one-six-s | dimension | 0.16s |
| light | --ds-type-size-hero | dimension | clamp(38px, 10.4vw, 88px) |
| light | --ds-type-tracking-minus-zero-point-zero-four-five-em | dimension | -0.045em |
| light | --ds-type-leading-zero-point-nine-eight | number | 0.98 |
| light | --ds-space-scale-minus-one | dimension | -1 |
| light | --ds-motion-duration-zero-point-three-s | dimension | 0.3s |
| light | --ds-type-tracking-zero-point-zero-six-em | dimension | 0.06em |
| light | --ds-motion-duration-zero-point-two-s | dimension | 0.2s |
| light | --ds-elevation-sequence | string | inset 0 2px 0 var(--ds-color-landing-signal) |
| light | --ds-space-scale-one-one-six-px | dimension | 116px |
| light | --ds-type-size-section | dimension | clamp(32px, 4.5vw, 58px) |
| light | --ds-type-tracking-minus-zero-point-zero-three-eight-em | dimension | -0.038em |
| light | --ds-motion-duration-zero-point-eight-s | dimension | 0.8s |
| light | --ds-type-tracking-minus-zero-point-zero-two-five-em | dimension | -0.025em |
| light | --ds-type-leading-one-point-two-two | number | 1.22 |
| light | --ds-type-leading-one-point-four-five | number | 1.45 |
| light | --ds-type-size-one-two-point-five-px | dimension | 12.5px |
| light | --ds-type-tracking-minus-zero-point-zero-two-em | dimension | -0.02em |
| light | --ds-type-leading-one-point-two | number | 1.2 |
| light | --ds-type-size-one-four-point-five-px | dimension | 14.5px |
| light | --ds-type-leading-one-point-one-five | number | 1.15 |
| light | --ds-space-scale-minus-two-four-px | dimension | -24px |
| light | --ds-space-scale-seven-four-px | dimension | 74px |
| light | --ds-motion-duration-zero-point-five-s | dimension | 0.5s |
| light | --ds-motion-duration-zero-point-four-five-s | dimension | 0.45s |
| light | --ds-motion-duration-zero-point-two-five-s | dimension | 0.25s |
| light | --ds-space-scale-one-seven-zero-px | dimension | 170px |
| light | --ds-type-size-closing | dimension | clamp(36px, 5.4vw, 68px) |
| light | --ds-type-tracking-minus-zero-point-zero-four-em | dimension | -0.04em |
| light | --ds-type-leading-one-point-zero-two | number | 1.02 |
| light | --ds-type-tracking-one-point-six-px | dimension | 1.6px |
| light | --ds-elevation-dialog | string | 0 20px 70px var(--ds-color-shadow) |
| light | --ds-type-leading-one-point-eight | number | 1.8 |
| light | --ds-motion-duration-zero-point-seven-s | dimension | 0.7s |
| light | --ds-motion-duration-one-point-one-s | dimension | 1.1s |
| light | --ds-motion-easing-wipe | string | cubic-bezier(0.7, 0, 0.2, 1) |
| light | --ds-type-size-one-five-point-five-px | dimension | 15.5px |
| light | --ds-space-scale-one-three-zero-px | dimension | 130px |
| light | --ds-type-size-fourteen | dimension | 14px |
| light | --ds-space-scale-eight | dimension | 8px |
| light | --ds-space-scale-ten | dimension | 10px |
| light | --ds-space-scale-fifteen | dimension | 15px |
| light | --ds-type-weight-semibold | number | 600 |
| light | --ds-space-scale-thirtytwo | dimension | 32px |
| light | --ds-type-size-twentythree | dimension | 23px |
| light | --ds-space-scale-twentysix | dimension | 26px |
| light | --ds-space-scale-thirty | dimension | 30px |
| light | --ds-type-size-thirteen | dimension | 13px |
| light | --ds-type-weight-bold | number | 700 |
| light | --ds-type-size-eleven | dimension | 11px |
| light | --ds-space-scale-seven | dimension | 7px |
| light | --ds-space-scale-twentyeight | dimension | 28px |
| light | --ds-space-scale-four | dimension | 4px |
| light | --ds-space-scale-twentytwo | dimension | 22px |
| light | --ds-type-size-twelve | dimension | 12px |
| light | --ds-space-scale-sixty | dimension | 60px |
| light | --ds-space-scale-thirtysix | dimension | 36px |
| light | --ds-type-weight-medium | number | 500 |
| light | --ds-type-weight-regular | number | 400 |
| light | --ds-space-scale-twelve | dimension | 12px |
| light | --ds-type-size-eighteen | dimension | 18px |
| light | --ds-space-scale-sixteen | dimension | 16px |
| light | --ds-type-size-fifteen | dimension | 15px |
| light | --ds-space-scale-twenty | dimension | 20px |
| light | --ds-type-size-ten | dimension | 10px |
| light | --ds-space-scale-five | dimension | 5px |
| light | --ds-space-scale-nine | dimension | 9px |
| light | --ds-radius-scale-three | dimension | 3px |
| light | --ds-space-scale-twentyfour | dimension | 24px |
| light | --ds-space-scale-eighteen | dimension | 18px |
| light | --ds-type-size-thirtysix | dimension | 36px |
| light | --ds-space-scale-twentyfive | dimension | 25px |
| light | --ds-type-size-nine | dimension | 9px |
| light | --ds-type-size-twentyfive | dimension | 25px |
| light | --ds-space-scale-nineteen | dimension | 19px |
| light | --ds-space-scale-six | dimension | 6px |
| light | --ds-radius-scale-four | dimension | 4px |
| light | --ds-space-scale-eleven | dimension | 11px |
| light | --ds-space-scale-thirteen | dimension | 13px |
| light | --ds-space-scale-seventeen | dimension | 17px |
| light | --ds-space-scale-fourteen | dimension | 14px |
| light | --ds-type-size-eight | dimension | 8px |
| light | --ds-type-size-twentyseven | dimension | 27px |
| light | --ds-type-size-twentysix | dimension | 26px |
| light | --ds-space-scale-forty | dimension | 40px |
| light | --ds-type-size-twentyone | dimension | 21px |
| light | --ds-space-scale-thirtyeight | dimension | 38px |
| light | --ds-type-size-nineteen | dimension | 19px |
| light | --ds-type-size-sixteen | dimension | 16px |
| light | --ds-space-scale-three | dimension | 3px |
| light | --ds-space-scale-fortytwo | dimension | 42px |
| light | --ds-radius-scale-eight | dimension | 8px |
| light | --ds-type-size-twenty | dimension | 20px |
| light | --ds-radius-scale-pill | dimension | 999px |
| light | --ds-space-scale-seventysix | dimension | 76px |
| light | --ds-radius-scale-two | dimension | 2px |
| light | --ds-type-weight-book | number | 450 |
| light | --ds-type-size-seventeen | dimension | 17px |
| light | --ds-space-scale-hundred | dimension | 100px |
| light | --ds-space-scale-seventytwo | dimension | 72px |
| light | --ds-radius-scale-twenty | dimension | 20px |
| light | --ds-radius-scale-fourteen | dimension | 14px |
| light | --ds-radius-scale-sixteen | dimension | 16px |
| light | --ds-space-scale-sixtyfour | dimension | 64px |
| light | --ds-radius-scale-fifteen | dimension | 15px |
| light | --ds-radius-scale-ten | dimension | 10px |
| light | --ds-radius-scale-five | dimension | 5px |
| light | --ds-radius-scale-six | dimension | 6px |
| light | --ds-space-scale-eighty | dimension | 80px |
| light | --ds-type-size-thirtyone | dimension | 31px |
| light | --ds-space-scale-two | dimension | 2px |
| light | --ds-space-scale-fortyeight | dimension | 48px |
| light | --ds-space-scale-fortyfour | dimension | 44px |
| light | --ds-type-size-twentyfour | dimension | 24px |
| light | --ds-type-size-twentyeight | dimension | 28px |
| light | --ds-motion-duration-three-zero-m-s | dimension | 30ms |
| light | --ds-motion-duration-six-zero-m-s | dimension | 60ms |
| light | --ds-motion-duration-nine-zero-m-s | dimension | 90ms |
| light | --ds-motion-duration-one-two-zero-m-s | dimension | 120ms |
| light | --ds-motion-duration-one-five-zero-m-s | dimension | 150ms |
| light | --ds-motion-duration-one-eight-zero-m-s | dimension | 180ms |
| light | --ds-motion-duration-zero-point-zero-six-s | dimension | 0.06s |
| light | --ds-motion-duration-zero-point-one-two-s | dimension | 0.12s |
| light | --ds-motion-duration-zero-point-one-eight-s | dimension | 0.18s |
| light | --ds-motion-duration-zero-point-two-four-s | dimension | 0.24s |
| light | --ds-layout-landing-inset-forty | dimension | 40px |
| light | --ds-layout-landing-inset-twentyeight | dimension | 28px |
| light | --ds-layout-landing-inset-sixteen | dimension | 16px |
| light | --ds-layout-landing-header-seventytwo | dimension | 72px |
| light | --ds-layout-landing-header-sixtyfour | dimension | 64px |
| light | --ds-border-width-hairline | dimension | 1px |
| light | --ds-border-width-emphasis | dimension | 2px |
| light | --ds-border-width-focus | dimension | 3px |

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
| Media preview / ready | components | ready, reset-on-reload, synthetic-only |
| Media preview / expired | components | expired, reset-on-reload, synthetic-only |
| Media preview / loading | components | loading, reset-on-reload, synthetic-only |
| Production error notice | components | default, reset-on-reload, synthetic-only |
| Appearance control | components | default, reset-on-reload, synthetic-only |
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
