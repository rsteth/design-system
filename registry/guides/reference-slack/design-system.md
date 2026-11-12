# Slack design system

Independent unverified reference. This is an authored adaptation study, not an official design system or a claim about the current product. Use it for inspiration, not as authority over another project. Preserve source attribution and do not reuse third-party logos or assets without appropriate rights.

Supported study/app themes: analysis. Contract schema: 1.

Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.

## Tokens

| Theme | CSS variable | Type | Value |
| --- | --- | --- | --- |
| analysis | --ds-colors-primary | color | #4a154b |
| analysis | --ds-colors-primarydeep | color | #481a54 |
| analysis | --ds-colors-primarypress | color | #611f69 |
| analysis | --ds-colors-primarytint | color | #592466 |
| analysis | --ds-colors-onprimary | color | #ffffff |
| analysis | --ds-colors-ink | color | #1d1d1d |
| analysis | --ds-colors-inkmute | color | #696969 |
| analysis | --ds-colors-linkblue | color | #1264a3 |
| analysis | --ds-colors-linkhover | color | #3860be |
| analysis | --ds-colors-canvas | color | #ffffff |
| analysis | --ds-colors-canvascream | color | #f4ede4 |
| analysis | --ds-colors-canvaslavender | color | #f9f0ff |
| analysis | --ds-colors-surfaceelev | color | #ffffff |
| analysis | --ds-colors-surfaceaubergine | color | #4a154b |
| analysis | --ds-colors-hairline | color | #e6e6e6 |
| analysis | --ds-colors-hairlinestrong | color | #000000 |
| analysis | --ds-colors-semanticerror | color | #cc4117 |
| analysis | --ds-colors-semanticsuccess | color | #007a5a |
| analysis | --ds-colors-onauberginemute | color | #d9bdde |
| analysis | --ds-typography-displayxxl-fontfamily | fontFamily | Salesforce-Avant-Garde, system-ui, -apple-system, BlinkMacSystemFont, sans-serif |
| analysis | --ds-typography-displayxxl-fontsize | dimension | 64px |
| analysis | --ds-typography-displayxxl-fontweight | number | 700 |
| analysis | --ds-typography-displayxxl-lineheight | number | 1.12 |
| analysis | --ds-typography-displayxxl-letterspacing | dimension | -0.768px |
| analysis | --ds-typography-displayxl-fontfamily | fontFamily | Salesforce-Avant-Garde, system-ui, -apple-system, BlinkMacSystemFont, sans-serif |
| analysis | --ds-typography-displayxl-fontsize | dimension | 58px |
| analysis | --ds-typography-displayxl-fontweight | number | 600 |
| analysis | --ds-typography-displayxl-lineheight | number | 1.25 |
| analysis | --ds-typography-displayxl-letterspacing | dimension | -0.464px |
| analysis | --ds-typography-displaylg-fontfamily | fontFamily | Salesforce-Avant-Garde, system-ui, -apple-system, BlinkMacSystemFont, sans-serif |
| analysis | --ds-typography-displaylg-fontsize | dimension | 50px |
| analysis | --ds-typography-displaylg-fontweight | number | 700 |
| analysis | --ds-typography-displaylg-lineheight | number | 1.12 |
| analysis | --ds-typography-displaylg-letterspacing | dimension | -0.6px |
| analysis | --ds-typography-displaymd-fontfamily | fontFamily | Salesforce-Avant-Garde, system-ui, -apple-system, BlinkMacSystemFont, sans-serif |
| analysis | --ds-typography-displaymd-fontsize | dimension | 32px |
| analysis | --ds-typography-displaymd-fontweight | number | 700 |
| analysis | --ds-typography-displaymd-lineheight | number | 1.25 |
| analysis | --ds-typography-displaymd-letterspacing | dimension | -0.256px |
| analysis | --ds-typography-headinglg-fontfamily | fontFamily | Salesforce-Avant-Garde, system-ui, -apple-system, BlinkMacSystemFont, sans-serif |
| analysis | --ds-typography-headinglg-fontsize | dimension | 24px |
| analysis | --ds-typography-headinglg-fontweight | number | 700 |
| analysis | --ds-typography-headinglg-lineheight | number | 1.33 |
| analysis | --ds-typography-headinglg-letterspacing | dimension | -0.096px |
| analysis | --ds-typography-headingmd-fontfamily | fontFamily | Salesforce-Avant-Garde, system-ui, -apple-system, BlinkMacSystemFont, sans-serif |
| analysis | --ds-typography-headingmd-fontsize | dimension | 22px |
| analysis | --ds-typography-headingmd-fontweight | number | 600 |
| analysis | --ds-typography-headingmd-lineheight | number | 1.4 |
| analysis | --ds-typography-headingmd-letterspacing | number | 0 |
| analysis | --ds-typography-headingsm-fontfamily | fontFamily | Salesforce-Avant-Garde, system-ui, -apple-system, BlinkMacSystemFont, sans-serif |
| analysis | --ds-typography-headingsm-fontsize | dimension | 18px |
| analysis | --ds-typography-headingsm-fontweight | number | 600 |
| analysis | --ds-typography-headingsm-lineheight | number | 1.56 |
| analysis | --ds-typography-headingsm-letterspacing | dimension | -0.0216px |
| analysis | --ds-typography-bodylg-fontfamily | fontFamily | Salesforce-Sans, system-ui, -apple-system, sans-serif |
| analysis | --ds-typography-bodylg-fontsize | dimension | 18px |
| analysis | --ds-typography-bodylg-fontweight | number | 400 |
| analysis | --ds-typography-bodylg-lineheight | number | 1.55 |
| analysis | --ds-typography-bodylg-letterspacing | dimension | -0.0216px |
| analysis | --ds-typography-bodymd-fontfamily | fontFamily | Salesforce-Sans, system-ui, -apple-system, sans-serif |
| analysis | --ds-typography-bodymd-fontsize | dimension | 16px |
| analysis | --ds-typography-bodymd-fontweight | number | 400 |
| analysis | --ds-typography-bodymd-lineheight | number | 1.55 |
| analysis | --ds-typography-bodymd-letterspacing | number | 0 |
| analysis | --ds-typography-bodystrong-fontfamily | fontFamily | Salesforce-Sans, system-ui, -apple-system, sans-serif |
| analysis | --ds-typography-bodystrong-fontsize | dimension | 16px |
| analysis | --ds-typography-bodystrong-fontweight | number | 700 |
| analysis | --ds-typography-bodystrong-lineheight | number | 1.5 |
| analysis | --ds-typography-bodystrong-letterspacing | dimension | 0.16px |
| analysis | --ds-typography-buttonlg-fontfamily | fontFamily | Salesforce-Sans, system-ui, -apple-system, sans-serif |
| analysis | --ds-typography-buttonlg-fontsize | dimension | 18px |
| analysis | --ds-typography-buttonlg-fontweight | number | 700 |
| analysis | --ds-typography-buttonlg-lineheight | number | 1 |
| analysis | --ds-typography-buttonlg-letterspacing | number | 0 |
| analysis | --ds-typography-buttonmd-fontfamily | fontFamily | Salesforce-Sans, system-ui, -apple-system, sans-serif |
| analysis | --ds-typography-buttonmd-fontsize | dimension | 16px |
| analysis | --ds-typography-buttonmd-fontweight | number | 700 |
| analysis | --ds-typography-buttonmd-lineheight | number | 1.38 |
| analysis | --ds-typography-buttonmd-letterspacing | dimension | 0.2px |
| analysis | --ds-typography-buttoncap-fontfamily | fontFamily | Salesforce-Sans, system-ui, -apple-system, sans-serif |
| analysis | --ds-typography-buttoncap-fontsize | dimension | 14.4px |
| analysis | --ds-typography-buttoncap-fontweight | number | 700 |
| analysis | --ds-typography-buttoncap-lineheight | number | 1 |
| analysis | --ds-typography-buttoncap-letterspacing | dimension | 0.144px |
| analysis | --ds-typography-caption-fontfamily | fontFamily | Salesforce-Sans, system-ui, -apple-system, sans-serif |
| analysis | --ds-typography-caption-fontsize | dimension | 14px |
| analysis | --ds-typography-caption-fontweight | number | 400 |
| analysis | --ds-typography-caption-lineheight | number | 1.43 |
| analysis | --ds-typography-caption-letterspacing | dimension | 0.1px |
| analysis | --ds-typography-microcap-fontfamily | fontFamily | Salesforce-Sans, system-ui, -apple-system, sans-serif |
| analysis | --ds-typography-microcap-fontsize | dimension | 12px |
| analysis | --ds-typography-microcap-fontweight | number | 700 |
| analysis | --ds-typography-microcap-lineheight | number | 1 |
| analysis | --ds-typography-microcap-letterspacing | dimension | 0.96px |
| analysis | --ds-rounded-xs | dimension | 2px |
| analysis | --ds-rounded-sm | dimension | 4px |
| analysis | --ds-rounded-md | dimension | 8px |
| analysis | --ds-rounded-lg | dimension | 12px |
| analysis | --ds-rounded-xl | dimension | 16px |
| analysis | --ds-rounded-xxl | dimension | 48px |
| analysis | --ds-rounded-pill | dimension | 90px |
| analysis | --ds-spacing-xs | dimension | 4px |
| analysis | --ds-spacing-sm | dimension | 8px |
| analysis | --ds-spacing-md | dimension | 12px |
| analysis | --ds-spacing-lg | dimension | 16px |
| analysis | --ds-spacing-xl | dimension | 20px |
| analysis | --ds-spacing-xxl | dimension | 24px |
| analysis | --ds-spacing-huge | dimension | 28px |

## Fixtures

| Name | Section | States |
| --- | --- | --- |
| Standard patterns · original compositions | patterns | default, completed, filtered, empty, selected, invalid, saved locally, canceled |
| Source-linked recipe sheet · authored interpretation | components |  |

[Open this workbench](../../../apps/studio/?library=references&collection=reference-slack)
