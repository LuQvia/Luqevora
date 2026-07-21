# SE Ranking Affiliate Integration v4.3.4

## Purpose

This release activates the approved SE Ranking affiliate identifier `5202722` across the highest-intent SEO-tool content in English and Japanese.

## Central configuration

Sixteen links supplied from the SE Ranking affiliate dashboard are stored in `content/config/affiliates.json`:

- 9 English destinations: home, pricing, features, competitor research, position tracking, keyword research, registration, on-page checker, and easy-to-use page
- 7 Japanese destinations: home, pricing, features, competitor research, website audit, position tracking, and backlink checker

Every tracked URL retains both parameters:

- `ga=5202722`
- `source=link`

No `/jp/jp/` path is used.

## Placement strategy

The release places affiliate CTAs on:

- English and Japanese SE Ranking reviews
- English and Japanese small-business SEO-tool comparison pages
- Generated comparison articles where SE Ranking is one of the products

The shared SE Ranking product profile selects the localized pricing link automatically:

- English: `se-ranking-en-pricing`
- Japanese: `se-ranking-ja-pricing`

## Disclosure and attributes

Affiliate placements include:

- an adjacent affiliate disclosure
- `rel="sponsored nofollow noopener"`
- `target="_blank"`
- `data-affiliate-key`
- `data-affiliate-link="true"`

Official-source citations remain ordinary non-affiliate links so research evidence and commercial CTAs stay separate.

## Verification

Run:

```bash
npm run check
```

Release-specific assertions are written to:

- `reports/v4.3.4-se-ranking-affiliate-qa.json`

The QA checks all 16 central URLs, affiliate ID consistency, language-specific keys, priority-page disclosures, sponsored attributes, duplicate Japanese paths, and site-wide placement counts.
