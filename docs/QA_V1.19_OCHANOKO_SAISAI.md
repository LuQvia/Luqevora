# QA — v1.19.0 Ochanoko Saisai and homepage audit

## Homepage audit
- The public domain could not be fetched or found in indexed search results from the verification environment, so the v1.18.0 generated public site was audited as the deployment candidate.
- Removed internal-facing wording such as "priority articles" from homepage, category, and article-directory metadata.
- Changed the homepage article-count label from search-ready to published.
- Rebalanced homepage features so the newest product does not dominate all comparison and review slots.
- Expanded the website-builder category description to include local-business sites and booking routes.

## Content scope
- Added 10 Japanese and 10 English Ochanoko Saisai articles.
- Added review, pricing, plan, comparison, salon, restaurant, coupon/calendar, and SEO intent coverage.
- Updated the existing store website builder comparison and related-link clusters.

## Affiliate implementation
- Program ID: s00000015680002
- Registered five current A8.net materials without modifying href, a8mat, rel=nofollow, fixed copy, or 1x1 tracking pixels.
- Did not register or publish the supplied JPY 750 material because it conflicts with current official pricing.
- Japanese articles display advertising disclosure and A8.net materials. English articles use the official destination.

## Evidence policy
- Pricing uses the official current plan page checked on 2026-07-19.
- The service is described as a local-business website builder and not an ecommerce cart, matching the official registration page.
- Custom-domain setup and annual domain fees are stated separately.
- Competitor comparisons use provider-owned pricing and feature pages.

## Validation
Run: npm run check
