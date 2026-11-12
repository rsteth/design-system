# Focus Speed Reader design system

The application owns its appearance, components and behavior. This workbench is a one-way snapshot, not an editor or a second source of truth. In an authorized checkout, read its AGENTS.md and design-system.md (or DESIGN.md when no dedicated guide exists) before editing. Reuse real components and semantic tokens, update synthetic fixtures, run the app checks, then explicitly refresh this snapshot. Do not edit the snapshot to change the application.

Supported study/app themes: light, dark. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| light | --ds-color-background | color | #f6f3eb |
| light | --ds-color-surface | color | #fffdf7 |
| light | --ds-color-text | color | #302e28 |
| light | --ds-color-text-muted | color | #5d6054 |
| light | --ds-color-border | color | #77796c |
| light | --ds-color-accent | color | #456044 |
| light | --ds-color-primary | color | #456044 |
| light | --ds-color-on-primary | color | #ffffff |
| light | --ds-color-focus | color | #9b422d |
| dark | --ds-color-background | color | #20231f |
| dark | --ds-color-surface | color | #2b302a |
| dark | --ds-color-text | color | #f6f3eb |
| dark | --ds-color-text-muted | color | #c1c6b9 |
| dark | --ds-color-border | color | #929b8c |
| dark | --ds-color-accent | color | #b5d1a5 |
| dark | --ds-color-primary | color | #b5d1a5 |
| dark | --ds-color-on-primary | color | #20231f |
| dark | --ds-color-focus | color | #ffb69d |
| red-green | --ds-color-accent | color | #185e87 |
| red-green | --ds-color-primary | color | #185e87 |
| red-green | --ds-color-focus | color | #9c4400 |
| dark-red-green | --ds-color-accent | color | #9ed5ff |
| dark-red-green | --ds-color-primary | color | #9ed5ff |
| dark-red-green | --ds-color-focus | color | #ffc185 |
| blue-yellow | --ds-color-accent | color | #81407d |
| blue-yellow | --ds-color-primary | color | #81407d |
| blue-yellow | --ds-color-focus | color | #006860 |
| dark-blue-yellow | --ds-color-accent | color | #f0b5e7 |
| dark-blue-yellow | --ds-color-primary | color | #f0b5e7 |
| dark-blue-yellow | --ds-color-focus | color | #8adfd1 |
| high-contrast | --ds-color-background | color | #fffdf7 |
| high-contrast | --ds-color-surface | color | #ffffff |
| high-contrast | --ds-color-text | color | #171813 |
| high-contrast | --ds-color-text-muted | color | #34362e |
| high-contrast | --ds-color-border | color | #171813 |
| high-contrast | --ds-color-accent | color | #171813 |
| high-contrast | --ds-color-primary | color | #171813 |
| high-contrast | --ds-color-focus | color | #171813 |
| dark-high-contrast | --ds-color-background | color | #10120f |
| dark-high-contrast | --ds-color-surface | color | #10120f |
| dark-high-contrast | --ds-color-text | color | #ffffff |
| dark-high-contrast | --ds-color-text-muted | color | #ffffff |
| dark-high-contrast | --ds-color-border | color | #ffffff |
| dark-high-contrast | --ds-color-accent | color | #ffffff |
| dark-high-contrast | --ds-color-primary | color | #ffffff |
| dark-high-contrast | --ds-color-focus | color | #ffffff |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Production appearance controls | components | default, dialog, focus, all themes and palettes |
| Empty library | screens | empty, disabled backup |
| Text and EPUB library | screens | populated, focus, delete confirm/cancel, backup, restore |
| Library loading | screens | loading |
| Paste content form | patterns | empty, validation, focus, cancel/reopen |
| Upload file form | patterns | file input, validation, tab switching |
| Ready to add text | patterns | populated, success, repeated submit |
| Pending content save | patterns | loading, disabled, cancel during pending |
| Failed content save | patterns | error, retry |
| Reader at first word | screens | paused, playing, speed, seek, rewind/forward |
| Reader with saved progress | screens | populated, appearance interrupts playback, close/reopen |
| Reader at final word | screens | complete, replay |
| No readable words | screens | empty, error, disabled |
| Pending EPUB extraction | screens | loading, disabled, close while pending |
| Failed EPUB extraction | screens | error, disabled, close/reopen |
| EPUB reader with extracted words | screens | populated |
| Recognition-point word | components | default |
| Long word fitting | components | responsive |
| Empty word primitive | components | empty |
| Failed library backup | patterns | export failure, retry, native or embedded notice |

[Open this workbench](../../../apps/studio/?collection=focus)
