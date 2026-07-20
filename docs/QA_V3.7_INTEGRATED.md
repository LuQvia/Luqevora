# QA — v3.7.0 Integrated Revenue Edition

## Integrated scope

- Store DX cluster: Kantan Chumon, funfo, and EMEAO! POS sourcing content.
- XServer cluster: ten Japanese and ten English articles for XServer and XServer Business.
- Existing website-builder, ecommerce, hosting, AI, and business-software content remains intact.
- The home page balances Store DX, hosting, and website-operation comparisons rather than allowing one cluster to replace the others.

## Affiliate controls

- Kantan Chumon: 7 supplied A8.net materials retained.
- funfo: 2 supplied A8.net materials retained.
- EMEAO!: 4 supplied A8.net materials retained.
- XServer / XServer Business: 7 supplied A8.net materials retained exactly as included in the uploaded branch.
- Japanese pages use intent-matched A8.net materials. English pages use official links only.
- Advertising disclosure, rel=nofollow, and 1x1 tracking pixels are preserved by the existing templates.

## Content improvements

- Store DX source depth was expanded with official product, pricing, and POS-selection references.
- Initial English Store DX guides were expanded with implementation, pilot, outage, reconciliation, and governance checklists.
- Content audit improved from 22 advisory warnings before integration to zero.

## Validation results

- Published data articles: 640
- Indexable articles in search data: 406
- HTML files: 936
- Unique article images: 406
- Sitemap URLs: 619
- Release manifest pages: 619
- Comparison products: 68
- Content audit errors: 0
- Content audit warnings: 0
- Public validation errors: 0
- Public validation warnings: 0

## Reproduction

Run:

```bash
npm run check
```

The XServer update can be reproduced independently with:

```bash
npm run add:xserver
```
