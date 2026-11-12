# Mongodb design system

Independent unverified reference. This is an authored adaptation study, not an official design system or a claim about the current product. Use it for inspiration, not as authority over another project. Preserve source attribution and do not reuse third-party logos or assets without appropriate rights.

Supported study/app themes: analysis. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| analysis | --ds-colors-primary | color | #00ed64 |
| analysis | --ds-colors-primarydeep | color | #00b545 |
| analysis | --ds-colors-primarypressed | color | #008c34 |
| analysis | --ds-colors-onprimary | color | #001e2b |
| analysis | --ds-colors-brandgreen | color | #00ed64 |
| analysis | --ds-colors-brandgreendark | color | #00684a |
| analysis | --ds-colors-brandgreenmid | color | #00a35c |
| analysis | --ds-colors-brandgreensoft | color | #c3f0d2 |
| analysis | --ds-colors-brandtealdeep | color | #001e2b |
| analysis | --ds-colors-brandteal | color | #003d4f |
| analysis | --ds-colors-brandtealmid | color | #00684a |
| analysis | --ds-colors-accentpurple | color | #7b3ff2 |
| analysis | --ds-colors-accentorange | color | #fa6e39 |
| analysis | --ds-colors-accentpink | color | #f06bb8 |
| analysis | --ds-colors-accentblue | color | #3d4f9f |
| analysis | --ds-colors-semanticwarningbg | color | #fff8e0 |
| analysis | --ds-colors-semanticwarningtext | color | #946f3f |
| analysis | --ds-colors-canvas | color | #ffffff |
| analysis | --ds-colors-canvasdark | color | #001e2b |
| analysis | --ds-colors-surface | color | #f9fbfa |
| analysis | --ds-colors-surfacesoft | color | #f4f7f6 |
| analysis | --ds-colors-surfacefeature | color | #e3fcef |
| analysis | --ds-colors-hairline | color | #e1e5e8 |
| analysis | --ds-colors-hairlinesoft | color | #eceff1 |
| analysis | --ds-colors-hairlinestrong | color | #c1ccd6 |
| analysis | --ds-colors-hairlinedark | color | #1c2d38 |
| analysis | --ds-colors-ink | color | #001e2b |
| analysis | --ds-colors-charcoal | color | #1c2d38 |
| analysis | --ds-colors-slate | color | #3d4f5b |
| analysis | --ds-colors-steel | color | #5c6c7a |
| analysis | --ds-colors-stone | color | #7c8c9a |
| analysis | --ds-colors-muted | color | #a8b3bc |
| analysis | --ds-colors-ondark | color | #ffffff |
| analysis | --ds-colors-ondarkmuted | color | #a8b3bc |
| analysis | --ds-typography-herodisplay-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-herodisplay-fontsize | dimension | 72px |
| analysis | --ds-typography-herodisplay-fontweight | number | 500 |
| analysis | --ds-typography-herodisplay-lineheight | number | 1.1 |
| analysis | --ds-typography-herodisplay-letterspacing | dimension | -1.5px |
| analysis | --ds-typography-displaylg-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-displaylg-fontsize | dimension | 56px |
| analysis | --ds-typography-displaylg-fontweight | number | 500 |
| analysis | --ds-typography-displaylg-lineheight | number | 1.15 |
| analysis | --ds-typography-displaylg-letterspacing | dimension | -1px |
| analysis | --ds-typography-heading1-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-heading1-fontsize | dimension | 48px |
| analysis | --ds-typography-heading1-fontweight | number | 500 |
| analysis | --ds-typography-heading1-lineheight | number | 1.2 |
| analysis | --ds-typography-heading1-letterspacing | dimension | -0.5px |
| analysis | --ds-typography-heading2-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-heading2-fontsize | dimension | 36px |
| analysis | --ds-typography-heading2-fontweight | number | 500 |
| analysis | --ds-typography-heading2-lineheight | number | 1.25 |
| analysis | --ds-typography-heading2-letterspacing | dimension | -0.5px |
| analysis | --ds-typography-heading3-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-heading3-fontsize | dimension | 28px |
| analysis | --ds-typography-heading3-fontweight | number | 500 |
| analysis | --ds-typography-heading3-lineheight | number | 1.3 |
| analysis | --ds-typography-heading4-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-heading4-fontsize | dimension | 22px |
| analysis | --ds-typography-heading4-fontweight | number | 500 |
| analysis | --ds-typography-heading4-lineheight | number | 1.35 |
| analysis | --ds-typography-heading5-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-heading5-fontsize | dimension | 18px |
| analysis | --ds-typography-heading5-fontweight | number | 600 |
| analysis | --ds-typography-heading5-lineheight | number | 1.4 |
| analysis | --ds-typography-subtitle-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-subtitle-fontsize | dimension | 18px |
| analysis | --ds-typography-subtitle-fontweight | number | 400 |
| analysis | --ds-typography-subtitle-lineheight | number | 1.5 |
| analysis | --ds-typography-bodymd-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-bodymd-fontsize | dimension | 16px |
| analysis | --ds-typography-bodymd-fontweight | number | 400 |
| analysis | --ds-typography-bodymd-lineheight | number | 1.55 |
| analysis | --ds-typography-bodymdmedium-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-bodymdmedium-fontsize | dimension | 16px |
| analysis | --ds-typography-bodymdmedium-fontweight | number | 500 |
| analysis | --ds-typography-bodymdmedium-lineheight | number | 1.55 |
| analysis | --ds-typography-bodysm-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-bodysm-fontsize | dimension | 14px |
| analysis | --ds-typography-bodysm-fontweight | number | 400 |
| analysis | --ds-typography-bodysm-lineheight | number | 1.5 |
| analysis | --ds-typography-bodysmmedium-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-bodysmmedium-fontsize | dimension | 14px |
| analysis | --ds-typography-bodysmmedium-fontweight | number | 500 |
| analysis | --ds-typography-bodysmmedium-lineheight | number | 1.5 |
| analysis | --ds-typography-caption-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-caption-fontsize | dimension | 13px |
| analysis | --ds-typography-caption-fontweight | number | 400 |
| analysis | --ds-typography-caption-lineheight | number | 1.4 |
| analysis | --ds-typography-captionbold-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-captionbold-fontsize | dimension | 13px |
| analysis | --ds-typography-captionbold-fontweight | number | 600 |
| analysis | --ds-typography-captionbold-lineheight | number | 1.4 |
| analysis | --ds-typography-micro-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-micro-fontsize | dimension | 12px |
| analysis | --ds-typography-micro-fontweight | number | 500 |
| analysis | --ds-typography-micro-lineheight | number | 1.4 |
| analysis | --ds-typography-microuppercase-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-microuppercase-fontsize | dimension | 11px |
| analysis | --ds-typography-microuppercase-fontweight | number | 600 |
| analysis | --ds-typography-microuppercase-lineheight | number | 1.4 |
| analysis | --ds-typography-microuppercase-letterspacing | dimension | 1px |
| analysis | --ds-typography-buttonmd-fontfamily | fontFamily | Euclid Circular A |
| analysis | --ds-typography-buttonmd-fontsize | dimension | 14px |
| analysis | --ds-typography-buttonmd-fontweight | number | 600 |
| analysis | --ds-typography-buttonmd-lineheight | number | 1.3 |
| analysis | --ds-typography-codemd-fontfamily | fontFamily | Source Code Pro |
| analysis | --ds-typography-codemd-fontsize | dimension | 14px |
| analysis | --ds-typography-codemd-fontweight | number | 400 |
| analysis | --ds-typography-codemd-lineheight | number | 1.55 |
| analysis | --ds-rounded-xs | dimension | 4px |
| analysis | --ds-rounded-sm | dimension | 6px |
| analysis | --ds-rounded-md | dimension | 8px |
| analysis | --ds-rounded-lg | dimension | 12px |
| analysis | --ds-rounded-xl | dimension | 16px |
| analysis | --ds-rounded-xxl | dimension | 24px |
| analysis | --ds-rounded-full | dimension | 9999px |
| analysis | --ds-spacing-xxs | dimension | 4px |
| analysis | --ds-spacing-xs | dimension | 8px |
| analysis | --ds-spacing-sm | dimension | 12px |
| analysis | --ds-spacing-md | dimension | 16px |
| analysis | --ds-spacing-lg | dimension | 20px |
| analysis | --ds-spacing-xl | dimension | 24px |
| analysis | --ds-spacing-xxl | dimension | 32px |
| analysis | --ds-spacing-xxxl | dimension | 40px |
| analysis | --ds-spacing-sectionsm | dimension | 48px |
| analysis | --ds-spacing-section | dimension | 64px |
| analysis | --ds-spacing-sectionlg | dimension | 96px |
| analysis | --ds-spacing-hero | dimension | 120px |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Standard patterns · original compositions | patterns | default, completed, filtered, empty, selected, invalid, saved locally, canceled |
| Source-linked recipe sheet · authored interpretation | components |  |

[Open this workbench](../../../apps/studio/?library=references&collection=reference-mongodb)
