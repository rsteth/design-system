# Workbench design system

The application owns its appearance, components and behavior. This workbench is a one-way snapshot, not an editor or a second source of truth. In an authorized checkout, read its AGENTS.md and design-system.md (or DESIGN.md when no dedicated guide exists) before editing. Reuse real components and semantic tokens, update synthetic fixtures, run the app checks, then explicitly refresh this snapshot. Do not edit the snapshot to change the application.

Supported study/app themes: workbench. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| workbench | --ds-color-background | color | #101011 |
| workbench | --ds-color-surface | color | #161617 |
| workbench | --ds-color-text | color | #f1f1f2 |
| workbench | --ds-color-text-muted | color | #a1a1a6 |
| workbench | --ds-color-accent | color | #f1f1f2 |
| workbench | --ds-color-accent-hover | color | #ffffff |
| workbench | --ds-color-border | color | #303034 |
| workbench | --ds-color-selection-background | color | #262629 |
| workbench | --ds-color-selection-text | color | #ffffff |
| workbench | --ds-color-focus | color | #ffffff |
| workbench | --ds-color-divider | color | #252528 |
| workbench | --ds-color-empty-background | color | #101011 |
| workbench | --ds-color-stage | color | #09090a |
| workbench | --ds-color-status | color | #a1a1a6 |
| workbench | --ds-color-warning | color | #d1d1d5 |
| workbench | --ds-color-error | color | #f1f1f2 |
| workbench | --ds-color-panel | color | #1b1b1d |
| workbench | --ds-color-action | color | #e9e7e1 |
| workbench | --ds-color-action-text | color | #171717 |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Live controls and token inspector | components |  |
| Empty and loaded collection states | patterns |  |
| Live studio, applications only | screens |  |

[Open this workbench](../../../apps/studio/?collection=workbench)
