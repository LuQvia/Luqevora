# QA — Store DX Platform v4.1.0

Verification date: 2026-07-20

## Full pipeline

Command:

```bash
npm run check
```

Result:

- product catalog generation: passed
- operations dashboard generation: passed
- revenue inventory generation: passed
- content audit: 0 errors, 0 warnings
- SEO image generation: passed
- full build: passed
- release manifest generation: passed
- public validation: 988 HTML files, 0 warnings
- v4.0 cashless regression QA: 158 / 158 passed
- v4.1 Store DX QA: 86 / 86 passed

## v4.1-specific checks

The release-specific suite verifies:

- package and platform configuration versions
- eight new Japanese/English article files and publication state
- four new product profiles in the comparison catalog
- official CTA configuration and separation from affiliate links
- Japanese and English Store DX hubs
- Japanese and English browser-based assessment pages
- canonical URLs and structured data
- industry and operational-problem input options
- privacy disclosure that answers remain in the browser
- product links across POS, payment, reservations, retention, and accounting
- LuQvia website, LINE, and email routes
- assessment JavaScript asset publication
- sitemap inclusion for assessment and new articles
- search-data inclusion for all eight articles
- retained public-site scale

Machine-readable output: `reports/v4.1-store-dx-platform-qa.json`.

## Regression handling

The v4.0 cashless QA is retained in the standard check command. This confirms that Store DX additions do not remove the previous AirREGI, AirPAY, Square POS, PayCAS Mobile, comparison, sitemap, search, structured-data, internal-link, or approved A8.net implementation.

## Deployment check

After extraction or repository upload, run:

```bash
npm ci
npm run check
```

Publish only when the command exits successfully.
