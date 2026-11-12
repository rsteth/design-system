# Reads design system

Reads brings chosen words into the voice of someone you love. Its interface uses a warm dark canvas, soft blue accents and rounded controls. Dark is the supported theme.

## Working with this system

The product is the source of truth; the workbench is a one-way view of its components and states. Reuse existing controls and semantic tokens before adding new ones. Keep native controls, visible keyboard focus, meaningful labels and headings, accessible dialogs and reduced-motion behavior. Do not replace the product palette with the workbench's own theme.

For an authorized repository edit, begin with that checkout's AGENTS.md and design-system.md. Change the actual app, update its synthetic fixtures and regenerate the workbench and this guide together. Public documentation is descriptive; it does not grant permission to edit, deploy or access an account. Sample fixtures do not prove live narration or authentication works.

[Open Reads](https://reads.sh/) · [Design workbench](https://stethem.com/design-system/apps/studio/)

## Inventory

The following token values and fixture names are generated from app-owned design data. They describe presentation, not private user data. Version labels identify the design contract, not a promise about a production deployment.

Design contract: 1. Themes: dark.

### Tokens: dark

| CSS variable | Type | Value |
| --- | --- | --- |
| `--ds-color-background` | color | #1d1b1a |
| `--ds-color-surface` | color | #292522 |
| `--ds-color-text` | color | #f4f4e9 |
| `--ds-color-text-muted` | color | #bdb1a3 |
| `--ds-color-border` | color | #4c423a |
| `--ds-color-surface-raised` | color | #302c29 |
| `--ds-color-accent` | color | #a9c8ed |
| `--ds-color-field` | color | #211e1c |
| `--ds-color-accent-ink` | color | #1b2c42 |
| `--ds-color-danger` | color | #f1b6a6 |
| `--ds-color-text-badge` | color | #d5c9bb |
| `--ds-color-link-decoration` | color | #a9c8ed66 |
| `--ds-color-placeholder` | color | #afa394 |
| `--ds-color-secondary` | color | #39312c |
| `--ds-color-border-strong` | color | #68574a |
| `--ds-color-focus` | color | #e0edff |
| `--ds-color-text-estimate` | color | #d3c5b5 |
| `--ds-color-status-border` | color | #53677e |
| `--ds-color-status-background` | color | #2d3945 |
| `--ds-color-status-text` | color | #c5ddf8 |
| `--ds-color-danger-background` | color | #483029 |
| `--ds-color-danger-border` | color | #765044 |
| `--ds-color-error-text` | color | #f3c6b9 |
| `--ds-color-error-background` | color | #412c27 |
| `--ds-color-error-border` | color | #785345 |
| `--ds-color-text-notice` | color | #e0d3c3 |
| `--ds-color-text-auth` | color | #e2c8b8 |
| `--ds-color-background-transparent` | color | #1d1b1a00 |
| `--ds-color-text-secondary` | color | #eee8df |
| `--ds-color-secondary-hover` | color | #3e3630 |
| `--ds-color-accent-hover` | color | #bed9f7 |
| `--ds-color-shadow-dialog` | color | #0008 |
| `--ds-color-backdrop` | color | #121110c9 |
| `--ds-color-text-label` | color | #e7ded2 |
| `--ds-color-text-close` | color | #c4b7a8 |
| `--ds-color-text-result` | color | #e4d7c6 |
| `--ds-color-text-nav` | color | #f2ece4 |
| `--ds-color-surface-note` | color | #38312d |
| `--ds-color-shadow-note` | color | #0004 |
| `--ds-color-text-caption` | color | #c7b8a8 |
| `--ds-color-text-art` | color | #e9dfd2 |
| `--ds-color-text-file` | color | #d1bba1 |
| `--ds-font-body` | fontFamily | ui-rounded,system-ui,-apple-system,sans-serif |
| `--ds-font-heading` | fontFamily | ui-rounded,'Arial Rounded MT Bold',system-ui,sans-serif |
| `--ds-radius-control` | dimension | 17px |
| `--ds-radius-field` | dimension | 14px |
| `--ds-radius-panel` | dimension | 26px |
| `--ds-radius-panel-mobile` | dimension | 23px |
| `--ds-space-panel` | dimension | 28px |
| `--ds-motion-duration` | dimension | 0.2s |
| `--ds-typography-dialog` | string | 550 29px/1.2 ui-rounded,system-ui,sans-serif |
| `--ds-typography-feature` | string | 550 clamp(40px,5vw,64px)/1.08 ui-rounded,system-ui,sans-serif |
| `--ds-typography-featurecard` | string | 550 21px/1.3 ui-rounded,system-ui,sans-serif |
| `--ds-typography-symbol` | string | 500 45px/1 Georgia,serif |
| `--ds-typography-symbolaccent` | string | 25px/1 system-ui |
| `--ds-typography-permission` | string | 500 32px/1.2 ui-rounded,system-ui,sans-serif |
| `--ds-font-rounded` | fontFamily | ui-rounded,system-ui,sans-serif |
| `--ds-font-system` | fontFamily | system-ui,sans-serif |
| `--ds-space-v20px` | dimension | 20px |
| `--ds-space-v26px` | dimension | 26px |
| `--ds-space-v34px` | dimension | 34px |
| `--ds-border-width-v1px` | dimension | 1px |
| `--ds-font-size-v42px` | dimension | 42px |
| `--ds-font-weight-strong` | number | 650 |
| `--ds-line-height-brand` | dimension | 1.15 |
| `--ds-font-tracking-vminus2p3px` | dimension | -2.3px |
| `--ds-font-size-v10px` | dimension | 10px |
| `--ds-font-weight-semibold` | number | 600 |
| `--ds-font-tracking-v1p3px` | dimension | 1.3px |
| `--ds-radius-mode` | dimension | 30px |
| `--ds-space-v9px` | dimension | 9px |
| `--ds-space-v12px` | dimension | 12px |
| `--ds-space-v50px` | dimension | 50px |
| `--ds-space-v38px` | dimension | 38px |
| `--ds-font-tracking-v2px` | dimension | 2px |
| `--ds-space-v18px` | dimension | 18px |
| `--ds-font-weight-heading` | number | 550 |
| `--ds-font-size-studiofluid` | string | clamp(36px,4.7vw,56px) |
| `--ds-font-tracking-vminus2px` | dimension | -2px |
| `--ds-line-height-title` | dimension | 1.12 |
| `--ds-space-v22px` | dimension | 22px |
| `--ds-line-height-reading` | dimension | 1.7 |
| `--ds-font-size-v16px` | dimension | 16px |
| `--ds-space-v32px` | dimension | 32px |
| `--ds-radius-notice` | dimension | 18px |
| `--ds-space-v17px` | dimension | 17px |
| `--ds-space-v28px` | dimension | 28px |
| `--ds-font-size-v12px` | dimension | 12px |
| `--ds-space-v7px` | dimension | 7px |
| `--ds-space-v24px` | dimension | 24px |
| `--ds-font-size-v23px` | dimension | 23px |
| `--ds-font-tracking-vminusp65px` | dimension | -.65px |
| `--ds-line-height-compact` | dimension | 1.3 |
| `--ds-space-v16px` | dimension | 16px |
| `--ds-font-tracking-v1px` | dimension | 1px |
| `--ds-space-v10px` | dimension | 10px |
| `--ds-text-decoration-v4px` | dimension | 4px |
| `--ds-line-height-control` | dimension | 1.5 |
| `--ds-space-v14px` | dimension | 14px |
| `--ds-line-height-comfortable` | dimension | 1.8 |
| `--ds-font-size-v14px` | dimension | 14px |
| `--ds-space-v8px` | dimension | 8px |
| `--ds-font-size-v13px` | dimension | 13px |
| `--ds-line-height-body` | dimension | 1.6 |
| `--ds-opacity-disabled` | string | .55 |
| `--ds-text-decoration-v2px` | dimension | 2px |
| `--ds-focus-width-v3px` | dimension | 3px |
| `--ds-focus-offset-v4px` | dimension | 4px |
| `--ds-focus-offset-v3px` | dimension | 3px |
| `--ds-font-weight-medium` | number | 500 |
| `--ds-font-size-v29px` | dimension | 29px |
| `--ds-line-height-heading` | dimension | 1.2 |
| `--ds-font-tracking-vminus1px` | dimension | -1px |
| `--ds-radius-file` | dimension | 9px |
| `--ds-space-v11px` | dimension | 11px |
| `--ds-font-weight-regular` | number | 400 |
| `--ds-space-v3px` | dimension | 3px |
| `--ds-space-v44px` | dimension | 44px |
| `--ds-font-size-v22px` | dimension | 22px |
| `--ds-font-tracking-vminusp5px` | dimension | -.5px |
| `--ds-radius-card` | dimension | 24px |
| `--ds-font-size-v21px` | dimension | 21px |
| `--ds-line-height-titlecard` | dimension | 1.4 |
| `--ds-radius-badge` | dimension | 20px |
| `--ds-space-v6px` | dimension | 6px |
| `--ds-radius-progress` | dimension | 8px |
| `--ds-font-size-v11px` | dimension | 11px |
| `--ds-space-v2px` | dimension | 2px |
| `--ds-font-size-v34px` | dimension | 34px |
| `--ds-font-tracking-vminus1p8px` | dimension | -1.8px |
| `--ds-font-size-v9px` | dimension | 9px |
| `--ds-font-size-v38px` | dimension | 38px |
| `--ds-font-tracking-vminus1p4px` | dimension | -1.4px |
| `--ds-font-size-v27px` | dimension | 27px |
| `--ds-font-size-v20px` | dimension | 20px |
| `--ds-space-v36px` | dimension | 36px |
| `--ds-motion-fast` | dimension | .15s |
| `--ds-font-size-v52px` | dimension | 52px |
| `--ds-font-tracking-vminus2p8px` | dimension | -2.8px |
| `--ds-font-size-vp87em` | dimension | .87em |
| `--ds-space-v80px` | dimension | 80px |
| `--ds-space-v82px` | dimension | 82px |
| `--ds-font-size-herofluid` | string | clamp(25px,3.2vw,33px) |
| `--ds-font-tracking-vminus1p1px` | dimension | -1.1px |
| `--ds-line-height-v20px` | dimension | 20px |
| `--ds-focus-offset-v5px` | dimension | 5px |
| `--ds-space-v30px` | dimension | 30px |
| `--ds-shadow-dialog` | string | 0 24px 100px var(--ds-color-shadow-dialog) |
| `--ds-space-v15px` | dimension | 15px |
| `--ds-radius-email` | dimension | 12px |
| `--ds-space-v4px` | dimension | 4px |
| `--ds-radius-submit` | dimension | 15px |
| `--ds-radius-note` | dimension | 16px |
| `--ds-shadow-note` | string | 0 10px 40px var(--ds-color-shadow-note) |
| `--ds-space-v100px` | dimension | 100px |
| `--ds-space-v40px` | dimension | 40px |
| `--ds-space-v48px` | dimension | 48px |
| `--ds-space-v23px` | dimension | 23px |
| `--ds-font-tracking-vminus2p5px` | dimension | -2.5px |
| `--ds-font-size-v17px` | dimension | 17px |
| `--ds-space-v25px` | dimension | 25px |
| `--ds-space-v70px` | dimension | 70px |
| `--ds-space-v55px` | dimension | 55px |
| `--ds-font-tracking-vminusp6px` | dimension | -.6px |
| `--ds-radius-wave` | dimension | 10px |
| `--ds-radius-track` | dimension | 4px |
| `--ds-font-size-v28px` | dimension | 28px |
| `--ds-font-size-v46px` | dimension | 46px |
| `--ds-font-size-v26px` | dimension | 26px |
| `--ds-font-tracking-vminusp9px` | dimension | -.9px |
| `--ds-radius-nav` | dimension | 13px |
| `--ds-space-v88px` | dimension | 88px |
| `--ds-font-size-v43px` | dimension | 43px |
| `--ds-font-size-v15px` | dimension | 15px |
| `--ds-space-v54px` | dimension | 54px |
| `--ds-space-v46px` | dimension | 46px |
| `--ds-space-v75px` | dimension | 75px |
| `--ds-radius-launcherbadge` | dimension | 25px |
| `--ds-font-tracking-v1p5px` | dimension | 1.5px |
| `--ds-font-weight-bold` | number | 700 |
| `--ds-font-size-launcherfluid` | string | clamp(42px,7vw,64px) |
| `--ds-font-tracking-vminus1p5px` | dimension | -1.5px |
| `--ds-line-height-display` | dimension | 1.08 |
| `--ds-font-size-v32px` | dimension | 32px |
| `--ds-opacity-waiting` | string | .65 |
| `--ds-radius-v14px` | dimension | 14px |
| `--ds-font-size-v8px` | dimension | 8px |
| `--ds-font-size-v45px` | dimension | 45px |

### Components, patterns and screens

| Fixture | Section | States |
| --- | --- | --- |
| landing | screens | signed out, scroll header, disclosure |
| waitlist | patterns | open, close, validation, synthetic submit |
| studio-empty | screens | empty, example, preflight |
| studio-ready | screens | completed, playback, download, delete |
| studio-progress | screens | running, cancel, retry |
| studio-failed | screens | failed, retry |
| studio-draining | screens | disabled admission, saved work |
| studio-disconnected | screens | provider disconnected, disabled controls |
| voice-sample | patterns | sample saved, disclosure, form controls |
| hosted-consent | patterns | explicit consent, estimate, required consent |
| hosted-review | screens | needs review, no automatic retry |
| reader-controls | components | filled text, pace, voice selection, preflight |
| reader-empty | components | empty, disabled generate |
| reader-long | components | long text, character count |
| reader-preflight-pending | components | checking estimate, disabled generate |
| reader-preflight-error | components | estimate error, disabled generate |
| hosted-allowance | patterns | remaining allowance, consent reset |
| job-queued | components | queued, cancel |
| job-running | components | running, cancel |
| job-completed | components | completed, playback, metadata, delete |
| job-cancelled | components | cancelled, retry |
| job-failed | components | failed, retry |
| job-blocked | components | failed, retry blocked |
| job-hosted | components | completed, provider disclosure, reserved estimate |
| studio-mixed | screens | queued, running, completed, failed, cancelled |
| recording-form | components | file selection, permissions, synthetic save |
| recording-error | patterns | invalid recording, retry |
| recording-saving | patterns | saving, disabled save |
| voice-deleted | components | sample deleted, profile deletion |
| hosted-create | patterns | rights consent, single speaker, provider consent, synthetic creation |
| hosted-pending | components | pending, verify, provider deletion |
| hosted-ready | components | ready, narration allowance disabled |
| hosted-failed | components | failed, verify |
| hosted-uncertain | patterns | needs review, no duplicate creation |
| account-unavailable | screens | account error, retry |
| account-expired | screens | expired session, studio locked |
| account-denied | screens | login denied |
| studio-offline | screens | connection lost |
| waitlist-unavailable | patterns | unavailable, retry, close reopen |
| waitlist-preparing | patterns | preparing, cancel reopen |
| waitlist-saving | patterns | submit pending, close reopen |
| waitlist-error | patterns | submission error, retry |
