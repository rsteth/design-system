# Great Circle design system

The application owns its appearance, components and behavior. This workbench is a one-way snapshot, not an editor or a second source of truth. In an authorized checkout, read its AGENTS.md and design-system.md (or DESIGN.md when no dedicated guide exists) before editing. Reuse real components and semantic tokens, update synthetic fixtures, run the app checks, then explicitly refresh this snapshot. Do not edit the snapshot to change the application.

Supported study/app themes: light, dark. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| light | --ds-color-background | color | #f6f3eb |
| light | --ds-color-surface | color | #fffdf7 |
| light | --ds-color-raised | color | #e6e5d9 |
| light | --ds-color-text | color | #302e28 |
| light | --ds-color-text-muted | color | #625e51 |
| light | --ds-color-border | color | #827c6b |
| light | --ds-color-accent | color | #435f4b |
| light | --ds-color-on-accent | color | #fffdf7 |
| light | --ds-color-accent-bg | color | #e2e9df |
| light | --ds-color-start | color | #8a432d |
| light | --ds-color-warning | color | #79531b |
| light | --ds-color-warning-bg | color | #fff0c9 |
| light | --ds-color-danger | color | #9b303f |
| light | --ds-color-danger-bg | color | #ffe9eb |
| light | --ds-color-map-bg | color | #deded5 |
| light | --ds-color-map-ink | color | #192d40 |
| light | --ds-color-map-start | color | #8a432d |
| dark | --ds-color-background | color | #20231f |
| dark | --ds-color-surface | color | #2b302a |
| dark | --ds-color-raised | color | #394038 |
| dark | --ds-color-text | color | #f6f3eb |
| dark | --ds-color-text-muted | color | #c4c5b8 |
| dark | --ds-color-border | color | #929887 |
| dark | --ds-color-accent | color | #b7d0b4 |
| dark | --ds-color-on-accent | color | #20231f |
| dark | --ds-color-accent-bg | color | #394b3a |
| dark | --ds-color-start | color | #f3b59b |
| dark | --ds-color-warning | color | #f7d58d |
| dark | --ds-color-warning-bg | color | #4a3c21 |
| dark | --ds-color-danger | color | #ffbdc7 |
| dark | --ds-color-danger-bg | color | #542d36 |
| dark | --ds-color-map-bg | color | #30372e |
| red-green | --ds-color-accent | color | #155596 |
| red-green | --ds-color-accent-bg | color | #e3edf7 |
| red-green | --ds-color-start | color | #8e4300 |
| red-green | --ds-color-map-ink | color | #134a81 |
| red-green | --ds-color-map-start | color | #8e4300 |
| dark-red-green | --ds-color-accent | color | #9ccfff |
| dark-red-green | --ds-color-accent-bg | color | #263f58 |
| dark-red-green | --ds-color-start | color | #ffc48b |
| blue-yellow | --ds-color-accent | color | #873868 |
| blue-yellow | --ds-color-accent-bg | color | #f6e4ee |
| blue-yellow | --ds-color-start | color | #00665b |
| blue-yellow | --ds-color-map-ink | color | #7c225a |
| blue-yellow | --ds-color-map-start | color | #00665b |
| dark-blue-yellow | --ds-color-accent | color | #f4b8dc |
| dark-blue-yellow | --ds-color-accent-bg | color | #503346 |
| dark-blue-yellow | --ds-color-start | color | #8edecf |
| high-contrast | --ds-color-background | color | #fffdf7 |
| high-contrast | --ds-color-surface | color | #fffdf7 |
| high-contrast | --ds-color-raised | color | #fffdf7 |
| high-contrast | --ds-color-text | color | #181818 |
| high-contrast | --ds-color-text-muted | color | #303030 |
| high-contrast | --ds-color-border | color | #181818 |
| high-contrast | --ds-color-accent | color | #181818 |
| high-contrast | --ds-color-on-accent | color | #fffdf7 |
| high-contrast | --ds-color-accent-bg | color | #eeeae0 |
| high-contrast | --ds-color-start | color | #181818 |
| high-contrast | --ds-color-map-ink | color | #181818 |
| high-contrast | --ds-color-map-start | color | #181818 |
| dark-high-contrast | --ds-color-background | color | #111 |
| dark-high-contrast | --ds-color-surface | color | #111 |
| dark-high-contrast | --ds-color-raised | color | #111 |
| dark-high-contrast | --ds-color-text | color | #fffdf7 |
| dark-high-contrast | --ds-color-text-muted | color | #fffdf7 |
| dark-high-contrast | --ds-color-border | color | #fffdf7 |
| dark-high-contrast | --ds-color-accent | color | #fffdf7 |
| dark-high-contrast | --ds-color-on-accent | color | #111 |
| dark-high-contrast | --ds-color-accent-bg | color | #303030 |
| dark-high-contrast | --ds-color-start | color | #fffdf7 |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Appearance | components | light, dark, four palettes, dialog open, keyboard focus, dismiss, reopen, blocked storage, OS theme, eight theme/palette combinations, desktop, mobile |
| Numeric input | components | default, invalid, focus, commit, Escape restore |
| Radius editor | components | default, editing, invalid, disabled, focus, commit, cancel, repeated edit |
| Disabled radius | components | default, editing, invalid, disabled, focus, commit, cancel, repeated edit |
| Empty planner | screens | desktop sidebar, mobile drawer, focus trap, Escape, Done, close, reopen, empty, populated, loading, error, desktop, mobile, preferences, cardinal buttons, route invalidation, eight theme/palette combinations |
| Route and metrics | screens | offline tiles, circle guide, Start, Size, center locked, center preview, cancel, commit, ideal layer visible/hidden, disabled locate, empty, populated, loading, error, desktop, mobile, preferences, cardinal buttons, route invalidation, metrics, snap note, details, distance warning, export, download again, eight theme/palette combinations |
| Larger-loop warning | screens | offline tiles, circle guide, Start, Size, center locked, center preview, cancel, commit, ideal layer visible/hidden, disabled locate, empty, populated, loading, error, desktop, mobile, preferences, cardinal buttons, route invalidation, metrics, snap note, details, distance warning, export, download again |
| Service error | screens | empty, populated, loading, error, desktop, mobile, preferences, cardinal buttons, route invalidation |
| Generation and cancellation | patterns | pending, cancel, Escape, repeated open, focus return, background inert, empty, populated, loading, error, desktop, mobile, preferences, cardinal buttons, route invalidation |
| Mobile route settings | patterns | desktop sidebar, mobile drawer, focus trap, Escape, Done, close, reopen |
| Coordinate validation | patterns | collapsed, expanded, invalid, valid apply |
| Map handles and layers | patterns | offline tiles, circle guide, Start, Size, center locked, center preview, cancel, commit, ideal layer visible/hidden, disabled locate |
| Place results | patterns | empty input, disabled submit, populated, no results, 503, loading, cancel, Escape, select |
| No places found | patterns | empty input, disabled submit, populated, no results, 503, loading, cancel, Escape, select |
| Search service error | patterns | empty input, disabled submit, populated, no results, 503, loading, cancel, Escape, select |
| Pending search and cancellation | patterns | empty input, disabled submit, populated, no results, 503, loading, cancel, Escape, select |
| No eligible loop | screens | error, status, retry, empty metrics |
| Circle fit unavailable | screens | error, status, retry, empty metrics |
| Search budget stopped | screens | error, status, retry, empty metrics |
| Planning budget stopped | screens | error, status, retry, empty metrics |
| Map service error | screens | error, status, retry, empty metrics |
| Map download stopped | screens | error, status, retry, empty metrics |

[Open this workbench](../../../apps/studio/?collection=great-circle)
