# Clickhouse design system

Independent unverified reference. This is an authored adaptation study, not an official design system or a claim about the current product. Use it for inspiration, not as authority over another project. Preserve source attribution and do not reuse third-party logos or assets without appropriate rights.

Supported study/app themes: analysis. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| analysis | --ds-colors-primary | color | #faff69 |
| analysis | --ds-colors-primaryactive | color | #e6eb52 |
| analysis | --ds-colors-primarydisabled | color | #3a3a1f |
| analysis | --ds-colors-ink | color | #ffffff |
| analysis | --ds-colors-body | color | #cccccc |
| analysis | --ds-colors-bodystrong | color | #e6e6e6 |
| analysis | --ds-colors-muted | color | #888888 |
| analysis | --ds-colors-mutedsoft | color | #5a5a5a |
| analysis | --ds-colors-hairline | color | #2a2a2a |
| analysis | --ds-colors-hairlinestrong | color | #3a3a3a |
| analysis | --ds-colors-canvas | color | #0a0a0a |
| analysis | --ds-colors-surfacesoft | color | #121212 |
| analysis | --ds-colors-surfacecard | color | #1a1a1a |
| analysis | --ds-colors-surfaceelevated | color | #242424 |
| analysis | --ds-colors-surfaceyellowband | color | #faff69 |
| analysis | --ds-colors-onprimary | color | #0a0a0a |
| analysis | --ds-colors-ondark | color | #ffffff |
| analysis | --ds-colors-onyellow | color | #0a0a0a |
| analysis | --ds-colors-accentemerald | color | #22c55e |
| analysis | --ds-colors-accentrose | color | #ef4444 |
| analysis | --ds-colors-accentblue | color | #3b82f6 |
| analysis | --ds-colors-success | color | #22c55e |
| analysis | --ds-colors-warning | color | #f59e0b |
| analysis | --ds-colors-error | color | #ef4444 |
| analysis | --ds-typography-displayxl-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-displayxl-fontsize | dimension | 72px |
| analysis | --ds-typography-displayxl-fontweight | number | 700 |
| analysis | --ds-typography-displayxl-lineheight | number | 1.05 |
| analysis | --ds-typography-displayxl-letterspacing | dimension | -2.5px |
| analysis | --ds-typography-displaylg-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-displaylg-fontsize | dimension | 56px |
| analysis | --ds-typography-displaylg-fontweight | number | 700 |
| analysis | --ds-typography-displaylg-lineheight | number | 1.1 |
| analysis | --ds-typography-displaylg-letterspacing | dimension | -2px |
| analysis | --ds-typography-displaymd-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-displaymd-fontsize | dimension | 40px |
| analysis | --ds-typography-displaymd-fontweight | number | 700 |
| analysis | --ds-typography-displaymd-lineheight | number | 1.15 |
| analysis | --ds-typography-displaymd-letterspacing | dimension | -1.5px |
| analysis | --ds-typography-displaysm-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-displaysm-fontsize | dimension | 32px |
| analysis | --ds-typography-displaysm-fontweight | number | 700 |
| analysis | --ds-typography-displaysm-lineheight | number | 1.2 |
| analysis | --ds-typography-displaysm-letterspacing | dimension | -1px |
| analysis | --ds-typography-titlelg-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-titlelg-fontsize | dimension | 24px |
| analysis | --ds-typography-titlelg-fontweight | number | 700 |
| analysis | --ds-typography-titlelg-lineheight | number | 1.3 |
| analysis | --ds-typography-titlelg-letterspacing | dimension | -0.3px |
| analysis | --ds-typography-titlemd-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-titlemd-fontsize | dimension | 18px |
| analysis | --ds-typography-titlemd-fontweight | number | 600 |
| analysis | --ds-typography-titlemd-lineheight | number | 1.4 |
| analysis | --ds-typography-titlemd-letterspacing | number | 0 |
| analysis | --ds-typography-titlesm-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-titlesm-fontsize | dimension | 16px |
| analysis | --ds-typography-titlesm-fontweight | number | 600 |
| analysis | --ds-typography-titlesm-lineheight | number | 1.4 |
| analysis | --ds-typography-titlesm-letterspacing | number | 0 |
| analysis | --ds-typography-statdisplay-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-statdisplay-fontsize | dimension | 56px |
| analysis | --ds-typography-statdisplay-fontweight | number | 700 |
| analysis | --ds-typography-statdisplay-lineheight | number | 1 |
| analysis | --ds-typography-statdisplay-letterspacing | dimension | -1.5px |
| analysis | --ds-typography-bodymd-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-bodymd-fontsize | dimension | 16px |
| analysis | --ds-typography-bodymd-fontweight | number | 400 |
| analysis | --ds-typography-bodymd-lineheight | number | 1.55 |
| analysis | --ds-typography-bodymd-letterspacing | number | 0 |
| analysis | --ds-typography-bodysm-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-bodysm-fontsize | dimension | 14px |
| analysis | --ds-typography-bodysm-fontweight | number | 400 |
| analysis | --ds-typography-bodysm-lineheight | number | 1.55 |
| analysis | --ds-typography-bodysm-letterspacing | number | 0 |
| analysis | --ds-typography-caption-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-caption-fontsize | dimension | 13px |
| analysis | --ds-typography-caption-fontweight | number | 500 |
| analysis | --ds-typography-caption-lineheight | number | 1.4 |
| analysis | --ds-typography-caption-letterspacing | number | 0 |
| analysis | --ds-typography-captionuppercase-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-captionuppercase-fontsize | dimension | 12px |
| analysis | --ds-typography-captionuppercase-fontweight | number | 600 |
| analysis | --ds-typography-captionuppercase-lineheight | number | 1.4 |
| analysis | --ds-typography-captionuppercase-letterspacing | dimension | 1.5px |
| analysis | --ds-typography-code-fontfamily | fontFamily | JetBrains Mono, ui-monospace, monospace |
| analysis | --ds-typography-code-fontsize | dimension | 14px |
| analysis | --ds-typography-code-fontweight | number | 400 |
| analysis | --ds-typography-code-lineheight | number | 1.55 |
| analysis | --ds-typography-code-letterspacing | number | 0 |
| analysis | --ds-typography-button-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-button-fontsize | dimension | 14px |
| analysis | --ds-typography-button-fontweight | number | 600 |
| analysis | --ds-typography-button-lineheight | number | 1 |
| analysis | --ds-typography-button-letterspacing | number | 0 |
| analysis | --ds-typography-navlink-fontfamily | fontFamily | Inter, sans-serif |
| analysis | --ds-typography-navlink-fontsize | dimension | 14px |
| analysis | --ds-typography-navlink-fontweight | number | 500 |
| analysis | --ds-typography-navlink-lineheight | number | 1.4 |
| analysis | --ds-typography-navlink-letterspacing | number | 0 |
| analysis | --ds-rounded-xs | dimension | 4px |
| analysis | --ds-rounded-sm | dimension | 6px |
| analysis | --ds-rounded-md | dimension | 8px |
| analysis | --ds-rounded-lg | dimension | 12px |
| analysis | --ds-rounded-pill | dimension | 9999px |
| analysis | --ds-rounded-full | dimension | 9999px |
| analysis | --ds-spacing-xxs | dimension | 4px |
| analysis | --ds-spacing-xs | dimension | 8px |
| analysis | --ds-spacing-sm | dimension | 12px |
| analysis | --ds-spacing-md | dimension | 16px |
| analysis | --ds-spacing-lg | dimension | 24px |
| analysis | --ds-spacing-xl | dimension | 32px |
| analysis | --ds-spacing-xxl | dimension | 48px |
| analysis | --ds-spacing-section | dimension | 96px |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Standard patterns · original compositions | patterns | default, completed, filtered, empty, selected, invalid, saved locally, canceled |
| Source-linked recipe sheet · authored interpretation | components |  |

[Open this workbench](../../../apps/studio/?library=references&collection=reference-clickhouse)
