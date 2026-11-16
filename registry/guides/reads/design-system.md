# Reads design system

## Direction

- **Product:** Reads turns a story, an essay or a letter into audio read in the voice of someone you love, with that person's permission.
- **Character:** hushed, tender, careful
- **World:** A bedside at night, with lamp light, a kept letter and headphones.
- **Moments:** The listener illustration on the landing; The finished listen in the studio, which is still a native audio bar and the next place to spend craft
- **Signature:** The listener's slow sway. It is the only looping motion in the product and stops under reduced motion.

Decide how something should look or read from this before reaching for the tables below.

## Voice

- Say what will happen in ordinary words, to one person, late in the day.
- Use the product's words: a reading, a part, a recording, their voice.
- Sentence case with no trailing period on headings, labels and buttons.
- Name ElevenLabs only where words or a recording leave Reads.

Reads brings chosen words into the voice of someone you love. Its interface uses a warm dark canvas, soft blue accents and rounded controls. Dark is the supported theme.

## Working with this system

The product is the source of truth; the workbench is a one-way view of its components and states. Reuse existing controls and semantic tokens before adding new ones. Keep native controls, visible keyboard focus, meaningful labels and headings, accessible dialogs and reduced-motion behavior. Do not replace the product palette with the workbench's own theme.

For an authorized repository edit, begin with that checkout's AGENTS.md and design-system.md. Change the actual app, update its synthetic fixtures and regenerate the workbench and this guide together. Public documentation is descriptive; it does not grant permission to edit, deploy or access an account. Sample fixtures do not prove live narration or authentication works.

[Open Reads](https://reads.sh/) · [Design workbench](https://stethem.com/design-system/apps/studio/)

## Inventory

The following token values and fixture names are generated from app-owned design data. They describe presentation, not private user data. Version labels identify the design contract, not a promise about a production deployment.

Supported study/app themes: dark. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| dark | --ds-color-background | color | #1d1b1a |
| dark | --ds-color-surface | color | #292522 |
| dark | --ds-color-text | color | #f4f4e9 |
| dark | --ds-color-text-muted | color | #bdb1a3 |
| dark | --ds-color-border | color | #4c423a |
| dark | --ds-color-surface-raised | color | #302c29 |
| dark | --ds-color-accent | color | #a9c8ed |
| dark | --ds-color-field | color | #211e1c |
| dark | --ds-color-accent-ink | color | #1b2c42 |
| dark | --ds-color-danger | color | #f1b6a6 |
| dark | --ds-color-link-decoration | color | #a9c8ed66 |
| dark | --ds-color-secondary | color | #39312c |
| dark | --ds-color-border-strong | color | #68574a |
| dark | --ds-color-focus | color | #e0edff |
| dark | --ds-color-status-border | color | #53677e |
| dark | --ds-color-status-background | color | #2d3945 |
| dark | --ds-color-status-text | color | #c5ddf8 |
| dark | --ds-color-danger-background | color | #483029 |
| dark | --ds-color-danger-border | color | #765044 |
| dark | --ds-color-background-transparent | color | #1d1b1a00 |
| dark | --ds-color-text-secondary | color | #e4dace |
| dark | --ds-color-secondary-hover | color | #3e3630 |
| dark | --ds-color-accent-hover | color | #bed9f7 |
| dark | --ds-color-shadow-dialog | color | #0008 |
| dark | --ds-color-backdrop | color | #121110c9 |
| dark | --ds-color-shadow-note | color | #0004 |
| dark | --ds-font-body | fontFamily | Nunito,ui-rounded,system-ui,-apple-system,sans-serif |
| dark | --ds-radius-control | dimension | 16px |
| dark | --ds-radius-field | dimension | 12px |
| dark | --ds-radius-panel | dimension | 24px |
| dark | --ds-radius-panel-mobile | dimension | 20px |
| dark | --ds-space-panel | dimension | 28px |
| dark | --ds-motion-duration | dimension | 0.2s |
| dark | --ds-typography-dialog | string | 500 28px/1.25 Nunito,ui-rounded,system-ui,sans-serif |
| dark | --ds-typography-feature | string | 500 clamp(40px,5vw,64px)/1.1 Nunito,ui-rounded,system-ui,sans-serif |
| dark | --ds-typography-featurecard | string | 500 20px/1.25 Nunito,ui-rounded,system-ui,sans-serif |
| dark | --ds-typography-symbol | string | 500 48px/1 Georgia,serif |
| dark | --ds-typography-permission | string | 500 32px/1.25 Nunito,ui-rounded,system-ui,sans-serif |
| dark | --ds-space-v20px | dimension | 20px |
| dark | --ds-border-width-v1px | dimension | 1px |
| dark | --ds-font-weight-semibold | number | 600 |
| dark | --ds-space-v12px | dimension | 12px |
| dark | --ds-font-size-v16px | dimension | 16px |
| dark | --ds-space-v32px | dimension | 32px |
| dark | --ds-space-v28px | dimension | 28px |
| dark | --ds-font-size-v12px | dimension | 12px |
| dark | --ds-space-v24px | dimension | 24px |
| dark | --ds-space-v16px | dimension | 16px |
| dark | --ds-text-decoration-v4px | dimension | 4px |
| dark | --ds-line-height-comfortable | dimension | 1.8 |
| dark | --ds-font-size-v14px | dimension | 14px |
| dark | --ds-space-v8px | dimension | 8px |
| dark | --ds-line-height-body | dimension | 1.6 |
| dark | --ds-opacity-disabled | string | .55 |
| dark | --ds-text-decoration-v2px | dimension | 2px |
| dark | --ds-focus-width-v3px | dimension | 3px |
| dark | --ds-focus-offset-v4px | dimension | 4px |
| dark | --ds-font-weight-medium | number | 500 |
| dark | --ds-line-height-heading | dimension | 1.25 |
| dark | --ds-font-weight-regular | number | 400 |
| dark | --ds-radius-badge | dimension | 12px |
| dark | --ds-space-v2px | dimension | 2px |
| dark | --ds-font-size-v20px | dimension | 20px |
| dark | --ds-motion-fast | dimension | .15s |
| dark | --ds-space-v80px | dimension | 80px |
| dark | --ds-font-size-herofluid | string | clamp(24px,3.2vw,32px) |
| dark | --ds-shadow-dialog | string | 0 24px 100px var(--ds-color-shadow-dialog) |
| dark | --ds-space-v4px | dimension | 4px |
| dark | --ds-shadow-note | string | 0 10px 40px var(--ds-color-shadow-note) |
| dark | --ds-space-v40px | dimension | 40px |
| dark | --ds-space-v48px | dimension | 48px |
| dark | --ds-radius-track | dimension | 4px |
| dark | --ds-font-size-v28px | dimension | 28px |
| dark | --ds-font-size-launcherfluid | string | clamp(40px,7vw,64px) |
| dark | --ds-line-height-display | dimension | 1.1 |
| dark | --ds-font-size-v32px | dimension | 32px |
| dark | --ds-font-size-v18px | dimension | 18px |
| dark | --ds-font-size-v24px | dimension | 24px |
| dark | --ds-font-size-v40px | dimension | 40px |
| dark | --ds-font-size-v48px | dimension | 48px |
| dark | --ds-font-tracking-display | dimension | -0.045em |
| dark | --ds-font-tracking-heading | dimension | -0.025em |
| dark | --ds-space-v56px | dimension | 56px |
| dark | --ds-space-v72px | dimension | 72px |
| dark | --ds-space-v96px | dimension | 96px |
| dark | --ds-radius-small | dimension | 8px |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Landing and waiting-list availability | screens | signed out, scroll header, disclosure |
| Waiting-list dialog | patterns | open, close, validation, synthetic submit |
| Empty studio | screens | empty, example, preflight |
| Saved listen | screens | completed, playback, download, delete |
| Read in progress | screens | running, cancel, retry |
| Recoverable failed read | screens | failed, retry |
| Draining studio | screens | disabled admission, saved work |
| Login-only studio | screens | provider disconnected, disabled controls |
| Saved voice recording | patterns | sample saved, disclosure, form controls |
| Hosted narration consent | patterns | explicit consent, estimate, required consent |
| Uncertain hosted outcome | screens | needs review, no automatic retry |
| Reading controls | components | filled text, pace, voice selection, preflight |
| Empty reader controls | components | empty, disabled generate |
| Long reader content | components | long text, character count |
| Estimate pending | components | checking estimate, disabled generate |
| Estimate unavailable | components | estimate error, disabled generate |
| Hosted allowance and consent | patterns | remaining allowance, consent reset |
| Queued listen card | components | queued, cancel |
| Running listen card | components | running, cancel |
| Completed listen card | components | completed, playback, metadata, delete |
| Cancelled listen card | components | cancelled, retry |
| Failed listen card | components | failed, retry |
| Blocked retry card | components | failed, retry blocked |
| Hosted narration card | components | completed, provider disclosure, reserved estimate |
| Mixed saved listens | screens | queued, running, completed, failed, cancelled |
| Recording form | components | file selection, permissions, synthetic save |
| Recording validation error | patterns | invalid recording, retry |
| Recording save pending | patterns | saving, disabled save |
| Deleted original recording | components | sample deleted, profile deletion |
| Hosted voice creation consent | patterns | rights consent, single speaker, provider consent, synthetic creation |
| Hosted voice awaiting verification | components | pending, verify, provider deletion |
| Hosted voice ready | components | ready, narration allowance disabled |
| Hosted voice verification failed | components | failed, verify |
| Uncertain voice creation | patterns | needs review, no duplicate creation |
| Account loading failure | screens | account error, retry |
| Expired session | screens | expired session, studio locked |
| Login failure | screens | login denied |
| Studio connection lost | screens | connection lost |
| Unavailable waiting list | patterns | unavailable, retry, close reopen |
| Waiting list preparing | patterns | preparing, cancel reopen |
| Waiting list submission pending | patterns | submit pending, close reopen |
| Waiting list submission failure | patterns | submission error, retry |
| Delete confirmation | patterns | confirm open, keep, delete |

[Open this workbench](../../../apps/studio/?collection=reads)
