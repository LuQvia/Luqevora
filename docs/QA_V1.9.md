# Luqevora v1.9.0 QA Report

Date: 2026-07-18

## Release gate

- `npm run check`: PASS
- Published data articles: 478
- Public article pages: 560
- Indexable article pages: 244 (122 Japanese, 122 English)
- Noindex article pages: 316
- Public HTML files: 614
- Sitemap URLs: 297
- Release manifest pages: 297
- Unique indexable article images: 244
- Main validator: 0 errors, 0 warnings

## Content audit

- Blocking errors: 0
- Advisory warnings: 91
- Average score for indexable data articles: 93.4
- Minimum score for indexable data articles: 70
- Promotion-eligible noindex articles: 316
- Promotion-eligible bilingual pairs: 158
- Promotion queue written to report: top 25 pairs / 50 articles

Advisory warning breakdown:

- Content depth: 46
- Source depth: 32
- FAQ depth: 13

These warnings are retained as an editorial improvement queue and do not bypass structural release checks.

## Incremental image generation

- Target images: 244
- Reused from cache: 244
- Regenerated in the final check: 0
- Dimensions: 1200x675
- Format: JPEG

## Release delta tests

Same-manifest comparison:

- Added: 0
- Updated: 0
- Deleted: 0
- Unchanged: 297

Synthetic comparison:

- Added: 1
- Updated: 1
- Deleted: 1
- Unchanged: 295

IndexNow dry run accepted exactly the three synthetic changed URLs in one batch.

## Static checks

- All `scripts/*.mjs` files passed `node --check`.
- GitHub Actions workflow passed YAML parsing.
- Release manifest contains 297 unique URLs and 297 unique SHA-256 hashes.
- Release manifest type counts: 244 articles, 26 topic pages, 27 other pages.

## Release decision

PASS. The package is ready for repository upload and GitHub Actions deployment. The 91 advisory content warnings should be handled as an ongoing editorial queue, not as deployment failures.
