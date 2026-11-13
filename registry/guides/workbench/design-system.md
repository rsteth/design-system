# Workbench design system

The application owns its appearance, components and behavior. This workbench is a one-way snapshot, not an editor or a second source of truth. In an authorized checkout, read its AGENTS.md and design-system.md (or DESIGN.md when no dedicated guide exists) before editing. Reuse real components and semantic tokens, update synthetic fixtures, run the app checks, then explicitly refresh this snapshot. Do not edit the snapshot to change the application.

Supported study/app themes: workbench. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| workbench | --ds-color-background | color | #060609 |
| workbench | --ds-color-surface | color | #0c0e11 |
| workbench | --ds-color-text | color | #ebe8df |
| workbench | --ds-color-text-muted | color | #85837e |
| workbench | --ds-color-accent | color | #ebe8df |
| workbench | --ds-color-accent-hover | color | #f9f7f1 |
| workbench | --ds-color-border | color | #18191d |
| workbench | --ds-color-selection-background | color | #16171b |
| workbench | --ds-color-selection-text | color | #f9f7f1 |
| workbench | --ds-color-focus | color | #ebe8df |
| workbench | --ds-color-divider | color | #18191d |
| workbench | --ds-color-empty-background | color | #060609 |
| workbench | --ds-color-stage | color | #060609 |
| workbench | --ds-color-status | color | #85837e |
| workbench | --ds-color-warning | color | #b3b1aa |
| workbench | --ds-color-error | color | #f9f7f1 |
| workbench | --ds-color-panel | color | #0c0e11 |
| workbench | --ds-color-action | color | #ebe8df |
| workbench | --ds-color-action-text | color | #0c0e11 |
| workbench | --ds-color-text-secondary | color | #b3b1aa |
| workbench | --ds-color-text-bright | color | #f9f7f1 |
| workbench | --ds-color-border-strong | color | #2b2c31 |
| workbench | --ds-color-raised | color | #16171b |
| workbench | --ds-font-display | fontFamily | ui-serif, "New York", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif |
| workbench | --ds-font-sans | fontFamily | system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif |
| workbench | --ds-font-mono | fontFamily | ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace |
| workbench | --ds-motion-quick | dimension | 150ms |
| workbench | --ds-motion-slow | dimension | 380ms |
| workbench | --ds-motion-ease | string | cubic-bezier(.2, .7, .15, 1) |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Live controls and token inspector | components |  |
| Studio navigation and jump palette | components | open, search, keyboard, dismiss, library switch |
| Empty and loaded collection states | patterns |  |
| Live application registry viewer | screens |  |

[Open this workbench](../../../apps/studio/?collection=workbench)
