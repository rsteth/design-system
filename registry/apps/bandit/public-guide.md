# Bandit design system

Bandit is a human-directed studio for short-form video. Its visual language is app-owned: glacier imagery, blue and copper accents, Jost display type, Inter interface type and Space Mono technical text. Preserve that identity rather than applying the workbench shell's appearance. The product supports its established light theme only.

## Implement within the system

1. Start from the existing component for the screen or state. Extend it rather than making a second component for the workbench.
2. Reuse the semantic tokens below. In CSS use the listed custom properties; introduce a named app-owned token when a genuinely reusable decision is missing. Do not copy literal colors, spacing, type sizes, radii, shadows or motion durations into new controls.
3. Preserve visible labels, keyboard interaction, focus indicators, dialog dismissal and minimum control targets. Use reduced-motion preferences for motion. Keep authored controls free of decorative Unicode glyphs.
4. Represent new states with synthetic, deterministic fixtures that render the actual application component and CSS. Never copy customer media, account records or credentials into examples.
5. Run the repository's design checks and applicable tests before refreshing its workbench. App source flows to the workbench, not the reverse.

Layout geometry, breakpoints, artwork composition, circular shapes and runtime appearance controls have explicit exceptions in the repository. They are not a license to bypass the token model. The fixture catalog is a coverage map, not a claim that every live product workflow is tested.

## Ownership and use

The repository's AGENTS.md and design-system.md specify the editable sources, commands and local validation. This public guide is generated from the app-owned design contract; edit the sources, not this copy. It describes Bandit, not an official design standard for other products. Publication does not grant a new license to imagery or other assets.

[Open Bandit](https://bandit.stethem.com/). Public guidance helps discovery; it cannot force an agent to read it or authorize account access, edits or deployment.

## Generated inventory

Product package version: 0.0.1. This identifies the package, not a verified deployed release.

Supported theme: light.

### light

| Token | CSS property | Type | Value |
| --- | --- | --- | --- |
| color.text | `--ds-color-text` | color | #152d3e |
| color.text.muted | `--ds-color-text-muted` | color | #526473 |
| color.background | `--ds-color-background` | color | #edece5 |
| color.background.subtle | `--ds-color-background-subtle` | color | #e0e5e5 |
| color.surface | `--ds-color-surface` | color | #faf8f0 |
| color.border | `--ds-color-border` | color | #c9d0d1 |
| color.border.control | `--ds-color-border-control` | color | #75838b |
| color.accent | `--ds-color-accent` | color | #315c7a |
| color.accent.soft | `--ds-color-accent-soft` | color | #e0e9ee |
| color.accent.border | `--ds-color-accent-border` | color | #8099aa |
| color.focus | `--ds-color-focus` | color | #8a4f30 |
| color.warning.soft | `--ds-color-warning-soft` | color | #f2e0d1 |
| color.warning.border | `--ds-color-warning-border` | color | #b37d57 |
| texture.opacity | `--ds-texture-opacity` | number | 0.12 |
| color.danger | `--ds-color-danger` | color | #8a352b |
| font.body | `--ds-font-body` | fontFamily | "Inter", -apple-system, "Segoe UI", sans-serif |
| font.heading | `--ds-font-heading` | fontFamily | "Jost", "Futura", "Century Gothic", sans-serif |
| font.mono | `--ds-font-mono` | fontFamily | "Space Mono", ui-monospace, SFMono-Regular, Consolas, monospace |
| radius.control | `--ds-radius-control` | dimension | 6px |
| radius.panel | `--ds-radius-panel` | dimension | 6px |
| size.control | `--ds-size-control` | dimension | 44px |
| color.landing.background | `--ds-color-landing-background` | color | #edece5 |
| color.landing.text | `--ds-color-landing-text` | color | #152d3e |
| color.landing.border | `--ds-color-landing-border` | color | #c9d0d1 |
| color.landing.signal | `--ds-color-landing-signal` | color | #2148e6 |
| color.landing.signal.hover | `--ds-color-landing-signal-hover` | color | #1836b8 |
| color.landing.night | `--ds-color-landing-night` | color | #0c1828 |
| color.landing.night.raised | `--ds-color-landing-night-raised` | color | #13233a |
| color.landing.frost | `--ds-color-landing-frost` | color | #eef1f5 |
| color.landing.haze | `--ds-color-landing-haze` | color | #9fb0c6 |
| color.landing.glow | `--ds-color-landing-glow` | color | #8ea6ff |
| color.landing.rail | `--ds-color-landing-rail` | color | #7f8c9950 |
| color.accent.hover | `--ds-color-accent-hover` | color | #244761 |
| color.overlay | `--ds-color-overlay` | color | #152d3e99 |
| color.shadow | `--ds-color-shadow` | color | #152d3e44 |
| texture.maximum | `--ds-texture-maximum` | number | 1 |
| backdrop.header.fade | `--ds-backdrop-header-fade` | dimension | 38% |
| backdrop.footer.fade | `--ds-backdrop-footer-fade` | dimension | 28% |
| color.white | `--ds-color-white` | color | #fff |
| color.validation.background | `--ds-color-validation-background` | color | #f0e5cb |
| color.validation.text | `--ds-color-validation-text` | color | #65501c |
| color.shadow.subtle | `--ds-color-shadow-subtle` | color | #302e2808 |
| color.heading.warm | `--ds-color-heading-warm` | color | #292824 |
| color.overview.scrim.strong | `--ds-color-overview-scrim-strong` | color | #102638e8 |
| color.overview.scrim.middle | `--ds-color-overview-scrim-middle` | color | #16334c9c |
| color.overview.scrim.clear | `--ds-color-overview-scrim-clear` | color | #16334c08 |
| color.overview.eyebrow | `--ds-color-overview-eyebrow` | color | #e9bd9a |
| type.tracking.minus.one.px | `--ds-type-tracking-minus-one-px` | dimension | -1px |
| space.scale.five.eight.px | `--ds-space-scale-five-eight-px` | dimension | 58px |
| type.size.legacyhero | `--ds-type-size-legacyhero` | dimension | clamp(44px, 5.5vw, 70px) |
| type.leading.one.point.zero.four | `--ds-type-leading-one-point-zero-four` | number | 1.04 |
| type.tracking.minus.three.px | `--ds-type-tracking-minus-three-px` | dimension | -3px |
| type.size.legacysection | `--ds-type-size-legacysection` | dimension | clamp(32px, 4vw, 48px) |
| type.tracking.minus.one.point.eight.px | `--ds-type-tracking-minus-one-point-eight-px` | dimension | -1.8px |
| type.leading.one.point.two.five | `--ds-type-leading-one-point-two-five` | number | 1.25 |
| type.tracking.minus.zero.point.six.px | `--ds-type-tracking-minus-zero-point-six-px` | dimension | -0.6px |
| type.leading.one.point.three | `--ds-type-leading-one-point-three` | number | 1.3 |
| type.tracking.minus.zero.point.three.px | `--ds-type-tracking-minus-zero-point-three-px` | dimension | -0.3px |
| type.leading.one.point.six | `--ds-type-leading-one-point-six` | number | 1.6 |
| type.tracking.one.point.eight.px | `--ds-type-tracking-one-point-eight-px` | dimension | 1.8px |
| space.scale.three.five.px | `--ds-space-scale-three-five-px` | dimension | 35px |
| type.tracking.minus.two.px | `--ds-type-tracking-minus-two-px` | dimension | -2px |
| motion.duration.zero.point.one.five.s | `--ds-motion-duration-zero-point-one-five-s` | dimension | 0.15s |
| type.tracking.one.point.five.px | `--ds-type-tracking-one-point-five-px` | dimension | 1.5px |
| type.tracking.one.point.two.px | `--ds-type-tracking-one-point-two-px` | dimension | 1.2px |
| elevation.selected | `--ds-elevation-selected` | string | 0 0 0 1px var(--ds-color-accent) |
| type.leading.one.point.five | `--ds-type-leading-one-point-five` | number | 1.5 |
| space.scale.five.zero.px | `--ds-space-scale-five-zero-px` | dimension | 50px |
| elevation.card | `--ds-elevation-card` | string | 0 8px 24px var(--ds-color-shadow-subtle) |
| type.leading.one.point.five.five | `--ds-type-leading-one-point-five-five` | number | 1.55 |
| type.leading.one.point.seven | `--ds-type-leading-one-point-seven` | number | 1.7 |
| space.scale.one.r.em | `--ds-space-scale-one-r-em` | dimension | 1rem |
| type.size.zero.point.seven.five.r.em | `--ds-type-size-zero-point-seven-five-r-em` | dimension | 0.75rem |
| type.tracking.zero.point.zero.eight.em | `--ds-type-tracking-zero-point-zero-eight-em` | dimension | 0.08em |
| elevation.review | `--ds-elevation-review` | string | inset 0 3px var(--ds-color-accent) |
| type.size.overview | `--ds-type-size-overview` | dimension | clamp(38px, 4.5vw, 60px) |
| motion.easing.standard | `--ds-motion-easing-standard` | string | cubic-bezier(0.2, 0.7, 0.2, 1) |
| color.landing.mark | `--ds-color-landing-mark` | color | #8794a3 |
| color.landing.night.border | `--ds-color-landing-night-border` | color | #ffffff1f |
| color.landing.border.strong | `--ds-color-landing-border-strong` | color | #ffffff4d |
| color.landing.border.soft | `--ds-color-landing-border-soft` | color | #ffffff29 |
| color.landing.overlay.faint | `--ds-color-landing-overlay-faint` | color | #ffffff0f |
| color.landing.memory.highlight | `--ds-color-landing-memory-highlight` | color | #f4f6ffeb |
| color.landing.memory.glow | `--ds-color-landing-memory-glow` | color | #bcc9ff |
| color.landing.memory.light | `--ds-color-landing-memory-light` | color | #5f7ef6 |
| color.landing.memory.blue | `--ds-color-landing-memory-blue` | color | #1a37b4 |
| color.landing.memory.deep | `--ds-color-landing-memory-deep` | color | #0f1f63 |
| color.landing.border.translucent | `--ds-color-landing-border-translucent` | color | #ffffff33 |
| color.landing.overlay.soft | `--ds-color-landing-overlay-soft` | color | #ffffff17 |
| type.tracking.minus.zero.point.zero.three.em | `--ds-type-tracking-minus-zero-point-zero-three-em` | dimension | -0.03em |
| motion.duration.zero.point.one.six.s | `--ds-motion-duration-zero-point-one-six-s` | dimension | 0.16s |
| type.size.hero | `--ds-type-size-hero` | dimension | clamp(38px, 10.4vw, 88px) |
| type.tracking.minus.zero.point.zero.four.five.em | `--ds-type-tracking-minus-zero-point-zero-four-five-em` | dimension | -0.045em |
| type.leading.zero.point.nine.eight | `--ds-type-leading-zero-point-nine-eight` | number | 0.98 |
| space.scale.minus.one | `--ds-space-scale-minus-one` | dimension | -1 |
| motion.duration.zero.point.three.s | `--ds-motion-duration-zero-point-three-s` | dimension | 0.3s |
| type.tracking.zero.point.zero.six.em | `--ds-type-tracking-zero-point-zero-six-em` | dimension | 0.06em |
| motion.duration.zero.point.two.s | `--ds-motion-duration-zero-point-two-s` | dimension | 0.2s |
| elevation.sequence | `--ds-elevation-sequence` | string | inset 0 2px 0 var(--ds-color-landing-signal) |
| space.scale.one.one.six.px | `--ds-space-scale-one-one-six-px` | dimension | 116px |
| type.size.section | `--ds-type-size-section` | dimension | clamp(32px, 4.5vw, 58px) |
| type.tracking.minus.zero.point.zero.three.eight.em | `--ds-type-tracking-minus-zero-point-zero-three-eight-em` | dimension | -0.038em |
| motion.duration.zero.point.eight.s | `--ds-motion-duration-zero-point-eight-s` | dimension | 0.8s |
| type.tracking.minus.zero.point.zero.two.five.em | `--ds-type-tracking-minus-zero-point-zero-two-five-em` | dimension | -0.025em |
| type.leading.one.point.two.two | `--ds-type-leading-one-point-two-two` | number | 1.22 |
| type.leading.one.point.four.five | `--ds-type-leading-one-point-four-five` | number | 1.45 |
| type.size.one.two.point.five.px | `--ds-type-size-one-two-point-five-px` | dimension | 12.5px |
| type.tracking.minus.zero.point.zero.two.em | `--ds-type-tracking-minus-zero-point-zero-two-em` | dimension | -0.02em |
| type.leading.one.point.two | `--ds-type-leading-one-point-two` | number | 1.2 |
| type.size.one.four.point.five.px | `--ds-type-size-one-four-point-five-px` | dimension | 14.5px |
| type.leading.one.point.one.five | `--ds-type-leading-one-point-one-five` | number | 1.15 |
| space.scale.minus.two.four.px | `--ds-space-scale-minus-two-four-px` | dimension | -24px |
| space.scale.seven.four.px | `--ds-space-scale-seven-four-px` | dimension | 74px |
| motion.duration.zero.point.five.s | `--ds-motion-duration-zero-point-five-s` | dimension | 0.5s |
| motion.duration.zero.point.four.five.s | `--ds-motion-duration-zero-point-four-five-s` | dimension | 0.45s |
| motion.duration.zero.point.two.five.s | `--ds-motion-duration-zero-point-two-five-s` | dimension | 0.25s |
| space.scale.one.seven.zero.px | `--ds-space-scale-one-seven-zero-px` | dimension | 170px |
| type.size.closing | `--ds-type-size-closing` | dimension | clamp(36px, 5.4vw, 68px) |
| type.tracking.minus.zero.point.zero.four.em | `--ds-type-tracking-minus-zero-point-zero-four-em` | dimension | -0.04em |
| type.leading.one.point.zero.two | `--ds-type-leading-one-point-zero-two` | number | 1.02 |
| type.tracking.one.point.six.px | `--ds-type-tracking-one-point-six-px` | dimension | 1.6px |
| elevation.dialog | `--ds-elevation-dialog` | string | 0 20px 70px var(--ds-color-shadow) |
| type.leading.one.point.eight | `--ds-type-leading-one-point-eight` | number | 1.8 |
| motion.duration.zero.point.seven.s | `--ds-motion-duration-zero-point-seven-s` | dimension | 0.7s |
| motion.duration.one.point.one.s | `--ds-motion-duration-one-point-one-s` | dimension | 1.1s |
| motion.easing.wipe | `--ds-motion-easing-wipe` | string | cubic-bezier(0.7, 0, 0.2, 1) |
| type.size.one.five.point.five.px | `--ds-type-size-one-five-point-five-px` | dimension | 15.5px |
| space.scale.one.three.zero.px | `--ds-space-scale-one-three-zero-px` | dimension | 130px |
| type.size.fourteen | `--ds-type-size-fourteen` | dimension | 14px |
| space.scale.eight | `--ds-space-scale-eight` | dimension | 8px |
| space.scale.ten | `--ds-space-scale-ten` | dimension | 10px |
| space.scale.fifteen | `--ds-space-scale-fifteen` | dimension | 15px |
| type.weight.semibold | `--ds-type-weight-semibold` | number | 600 |
| space.scale.thirtytwo | `--ds-space-scale-thirtytwo` | dimension | 32px |
| type.size.twentythree | `--ds-type-size-twentythree` | dimension | 23px |
| space.scale.twentysix | `--ds-space-scale-twentysix` | dimension | 26px |
| space.scale.thirty | `--ds-space-scale-thirty` | dimension | 30px |
| type.size.thirteen | `--ds-type-size-thirteen` | dimension | 13px |
| type.weight.bold | `--ds-type-weight-bold` | number | 700 |
| type.size.eleven | `--ds-type-size-eleven` | dimension | 11px |
| space.scale.seven | `--ds-space-scale-seven` | dimension | 7px |
| space.scale.twentyeight | `--ds-space-scale-twentyeight` | dimension | 28px |
| space.scale.four | `--ds-space-scale-four` | dimension | 4px |
| space.scale.twentytwo | `--ds-space-scale-twentytwo` | dimension | 22px |
| type.size.twelve | `--ds-type-size-twelve` | dimension | 12px |
| space.scale.sixty | `--ds-space-scale-sixty` | dimension | 60px |
| space.scale.thirtysix | `--ds-space-scale-thirtysix` | dimension | 36px |
| type.weight.medium | `--ds-type-weight-medium` | number | 500 |
| type.weight.regular | `--ds-type-weight-regular` | number | 400 |
| space.scale.twelve | `--ds-space-scale-twelve` | dimension | 12px |
| type.size.eighteen | `--ds-type-size-eighteen` | dimension | 18px |
| space.scale.sixteen | `--ds-space-scale-sixteen` | dimension | 16px |
| type.size.fifteen | `--ds-type-size-fifteen` | dimension | 15px |
| space.scale.twenty | `--ds-space-scale-twenty` | dimension | 20px |
| type.size.ten | `--ds-type-size-ten` | dimension | 10px |
| space.scale.five | `--ds-space-scale-five` | dimension | 5px |
| space.scale.nine | `--ds-space-scale-nine` | dimension | 9px |
| radius.scale.three | `--ds-radius-scale-three` | dimension | 3px |
| space.scale.twentyfour | `--ds-space-scale-twentyfour` | dimension | 24px |
| space.scale.eighteen | `--ds-space-scale-eighteen` | dimension | 18px |
| type.size.thirtysix | `--ds-type-size-thirtysix` | dimension | 36px |
| space.scale.twentyfive | `--ds-space-scale-twentyfive` | dimension | 25px |
| type.size.nine | `--ds-type-size-nine` | dimension | 9px |
| type.size.twentyfive | `--ds-type-size-twentyfive` | dimension | 25px |
| space.scale.nineteen | `--ds-space-scale-nineteen` | dimension | 19px |
| space.scale.six | `--ds-space-scale-six` | dimension | 6px |
| radius.scale.four | `--ds-radius-scale-four` | dimension | 4px |
| space.scale.eleven | `--ds-space-scale-eleven` | dimension | 11px |
| space.scale.thirteen | `--ds-space-scale-thirteen` | dimension | 13px |
| space.scale.seventeen | `--ds-space-scale-seventeen` | dimension | 17px |
| space.scale.fourteen | `--ds-space-scale-fourteen` | dimension | 14px |
| type.size.eight | `--ds-type-size-eight` | dimension | 8px |
| type.size.twentyseven | `--ds-type-size-twentyseven` | dimension | 27px |
| type.size.twentysix | `--ds-type-size-twentysix` | dimension | 26px |
| space.scale.forty | `--ds-space-scale-forty` | dimension | 40px |
| type.size.twentyone | `--ds-type-size-twentyone` | dimension | 21px |
| space.scale.thirtyeight | `--ds-space-scale-thirtyeight` | dimension | 38px |
| type.size.nineteen | `--ds-type-size-nineteen` | dimension | 19px |
| type.size.sixteen | `--ds-type-size-sixteen` | dimension | 16px |
| space.scale.three | `--ds-space-scale-three` | dimension | 3px |
| space.scale.fortytwo | `--ds-space-scale-fortytwo` | dimension | 42px |
| radius.scale.eight | `--ds-radius-scale-eight` | dimension | 8px |
| type.size.twenty | `--ds-type-size-twenty` | dimension | 20px |
| radius.scale.pill | `--ds-radius-scale-pill` | dimension | 999px |
| space.scale.seventysix | `--ds-space-scale-seventysix` | dimension | 76px |
| radius.scale.two | `--ds-radius-scale-two` | dimension | 2px |
| type.weight.book | `--ds-type-weight-book` | number | 450 |
| type.size.seventeen | `--ds-type-size-seventeen` | dimension | 17px |
| space.scale.hundred | `--ds-space-scale-hundred` | dimension | 100px |
| space.scale.seventytwo | `--ds-space-scale-seventytwo` | dimension | 72px |
| radius.scale.twenty | `--ds-radius-scale-twenty` | dimension | 20px |
| radius.scale.fourteen | `--ds-radius-scale-fourteen` | dimension | 14px |
| radius.scale.sixteen | `--ds-radius-scale-sixteen` | dimension | 16px |
| space.scale.sixtyfour | `--ds-space-scale-sixtyfour` | dimension | 64px |
| radius.scale.fifteen | `--ds-radius-scale-fifteen` | dimension | 15px |
| radius.scale.ten | `--ds-radius-scale-ten` | dimension | 10px |
| radius.scale.five | `--ds-radius-scale-five` | dimension | 5px |
| radius.scale.six | `--ds-radius-scale-six` | dimension | 6px |
| space.scale.eighty | `--ds-space-scale-eighty` | dimension | 80px |
| type.size.thirtyone | `--ds-type-size-thirtyone` | dimension | 31px |
| space.scale.two | `--ds-space-scale-two` | dimension | 2px |
| space.scale.fortyeight | `--ds-space-scale-fortyeight` | dimension | 48px |
| space.scale.fortyfour | `--ds-space-scale-fortyfour` | dimension | 44px |
| type.size.twentyfour | `--ds-type-size-twentyfour` | dimension | 24px |
| type.size.twentyeight | `--ds-type-size-twentyeight` | dimension | 28px |
| motion.duration.three.zero.m.s | `--ds-motion-duration-three-zero-m-s` | dimension | 30ms |
| motion.duration.six.zero.m.s | `--ds-motion-duration-six-zero-m-s` | dimension | 60ms |
| motion.duration.nine.zero.m.s | `--ds-motion-duration-nine-zero-m-s` | dimension | 90ms |
| motion.duration.one.two.zero.m.s | `--ds-motion-duration-one-two-zero-m-s` | dimension | 120ms |
| motion.duration.one.five.zero.m.s | `--ds-motion-duration-one-five-zero-m-s` | dimension | 150ms |
| motion.duration.one.eight.zero.m.s | `--ds-motion-duration-one-eight-zero-m-s` | dimension | 180ms |
| motion.duration.zero.point.zero.six.s | `--ds-motion-duration-zero-point-zero-six-s` | dimension | 0.06s |
| motion.duration.zero.point.one.two.s | `--ds-motion-duration-zero-point-one-two-s` | dimension | 0.12s |
| motion.duration.zero.point.one.eight.s | `--ds-motion-duration-zero-point-one-eight-s` | dimension | 0.18s |
| motion.duration.zero.point.two.four.s | `--ds-motion-duration-zero-point-two-four-s` | dimension | 0.24s |
| layout.landing.inset.forty | `--ds-layout-landing-inset-forty` | dimension | 40px |
| layout.landing.inset.twentyeight | `--ds-layout-landing-inset-twentyeight` | dimension | 28px |
| layout.landing.inset.sixteen | `--ds-layout-landing-inset-sixteen` | dimension | 16px |
| layout.landing.header.seventytwo | `--ds-layout-landing-header-seventytwo` | dimension | 72px |
| layout.landing.header.sixtyfour | `--ds-layout-landing-header-sixtyfour` | dimension | 64px |
| border.width.hairline | `--ds-border-width-hairline` | dimension | 1px |
| border.width.emphasis | `--ds-border-width-emphasis` | dimension | 2px |
| border.width.focus | `--ds-border-width-focus` | dimension | 3px |

### Production-backed specimens

52 fixtures. These use synthetic state; they do not demonstrate live authentication, payments or provider acceptance.

| Fixture | Name | Section | States |
| --- | --- | --- | --- |
| landing | Public landing | screens | default, waiting-list-unavailable, dialog-closed |
| overview | Production overview | screens | sample-productions, planning, plan-approved |
| empty | Empty production overview | screens | empty, read-only |
| controls | Studio controls | components | default, disabled, focus, selected |
| status | Studio feedback | patterns | empty, error, validation, approved |
| projects-populated | Projects and series / populated | screens | populated, reset-on-reload, synthetic-only |
| projects-empty | Projects and series / empty | screens | empty, reset-on-reload, synthetic-only |
| projects-viewer | Projects and series / viewer | screens | viewer, reset-on-reload, synthetic-only |
| profiles-populated | Content profiles / populated | screens | populated, reset-on-reload, synthetic-only |
| profiles-empty | Content profiles / empty | screens | empty, reset-on-reload, synthetic-only |
| profiles-viewer | Content profiles / viewer | screens | viewer, reset-on-reload, synthetic-only |
| library-populated | Subject and media library / populated | screens | populated, reset-on-reload, synthetic-only |
| library-empty | Subject and media library / empty | screens | empty, reset-on-reload, synthetic-only |
| library-viewer | Subject and media library / viewer | screens | viewer, reset-on-reload, synthetic-only |
| project-editor | Project editor | patterns | populated, reset-on-reload, synthetic-only |
| series-editor | Series editor | patterns | populated, reset-on-reload, synthetic-only |
| project-new | New project form | patterns | populated, reset-on-reload, synthetic-only |
| profile-editor | Draft profile editor | patterns | populated, reset-on-reload, synthetic-only |
| profile-published | Published immutable profile | patterns | populated, reset-on-reload, synthetic-only |
| profile-import | Profile import | patterns | populated, reset-on-reload, synthetic-only |
| subject-editor | Subject editor | patterns | populated, reset-on-reload, synthetic-only |
| reference-editor | Reference set editor | patterns | populated, reset-on-reload, synthetic-only |
| production-new-profile | New production / profile | screens | profile, reset-on-reload, synthetic-only |
| production-new-brief | New production / brief | screens | brief, reset-on-reload, synthetic-only |
| production-new-plan | New production / plan | screens | plan, reset-on-reload, synthetic-only |
| production-new-viewer | New production / viewer | screens | viewer, reset-on-reload, synthetic-only |
| board-populated | Production board / populated | screens | populated, reset-on-reload, synthetic-only |
| board-empty | Production board / empty | screens | empty, reset-on-reload, synthetic-only |
| board-approved | Production board / approved | screens | approved, reset-on-reload, synthetic-only |
| board-archived | Production board / archived | screens | archived, reset-on-reload, synthetic-only |
| board-error | Production board / error | screens | error, reset-on-reload, synthetic-only |
| board-loading | Production board / loading | screens | loading, reset-on-reload, synthetic-only |
| board-viewer | Production board / viewer | screens | viewer, reset-on-reload, synthetic-only |
| shot-editor | Shot editor and revision history | patterns | populated, reset-on-reload, synthetic-only |
| shot-new | New shot and dependencies | patterns | empty, reset-on-reload, synthetic-only |
| review-populated | Review room / populated | screens | populated, reset-on-reload, synthetic-only |
| review-empty | Review room / empty | screens | empty, reset-on-reload, synthetic-only |
| review-unapproved | Review room / unapproved | screens | unapproved, reset-on-reload, synthetic-only |
| review-error | Review room / error | screens | error, reset-on-reload, synthetic-only |
| review-loading | Review room / loading | screens | loading, reset-on-reload, synthetic-only |
| review-viewer | Review room / viewer | screens | viewer, reset-on-reload, synthetic-only |
| asset-ready | Media preview / ready | components | ready, reset-on-reload, synthetic-only |
| asset-expired | Media preview / expired | components | expired, reset-on-reload, synthetic-only |
| asset-loading | Media preview / loading | components | loading, reset-on-reload, synthetic-only |
| error-notice | Production error notice | components | default, reset-on-reload, synthetic-only |
| appearance | Appearance control | components | default, reset-on-reload, synthetic-only |
| memory-populated | Creative Memory / populated | patterns | populated, reset-on-reload, synthetic-only |
| memory-empty | Creative Memory / empty | patterns | empty, reset-on-reload, synthetic-only |
| memory-error | Creative Memory / error | patterns | error, reset-on-reload, synthetic-only |
| memory-viewer | Creative Memory / viewer | patterns | viewer, reset-on-reload, synthetic-only |
| advanced-controls | Shot reference and event controls | patterns | advanced, reset-on-reload, synthetic-only |
| advanced-review | Candidate comparison and advisory review | patterns | populated, reset-on-reload, synthetic-only |
