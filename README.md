# Luqevora.com Static Platform v4.3.5


## v4.3.5 Kinsta application readiness

- Confirms the public brand as **Luqevora.com** and the operator display as **LuQvia**.
- Removes stale legal-form wording tied to LuQvia from archived legacy HTML structured data.
- Verifies the English and Japanese About, Editorial Policy, Affiliate Disclosure, Privacy, Terms, Contact, and Kinsta review pages.
- Keeps Kinsta links non-affiliate until the application is approved and a tracking link is issued.
v4.3.2 standardizes the public media/service name as **Luqevora.com** and the operator display as **LuQvia**, without publishing the operator's legal-form description. See `docs/BRAND_OPERATOR_UPDATE_V4.3.2.md`.

## SE Ranking Affiliate Integration v4.3.4

v4.3.4 activates 16 approved SE Ranking affiliate destinations for identifier `5202722`, localizes English and Japanese pricing CTAs, and adds disclosed sponsored placements to the SE Ranking review, the small-business SEO-tool comparison, and generated comparison articles. Invalid `/jp/jp/` paths are excluded. See `docs/SE_RANKING_AFFILIATE_V4.3.4.md`.

## Google Workspace US Referral Integration v4.3.3

v4.3.3 adds the approved United States Google Workspace referral URL to nine English high-intent pages, keeps the existing Japanese referral URL separate, and adds a private one-to-one promotion-code request route. Single-use promotion codes are deliberately excluded from the repository and public ZIP. See `docs/GOOGLE_WORKSPACE_US_REFERRAL_V4.3.3.md`.

## Google Workspace Referral Integration v4.3.1

v4.3.1 activates the approved Google Workspace referral URL on six high-intent Japanese articles. The site discloses the referral relationship, outputs sponsored link attributes, and routes promotion-code requests to LuQvia for private one-to-one distribution. Single-use promotion codes are deliberately excluded from the repository and public ZIP. See `docs/GOOGLE_WORKSPACE_REFERRAL_V4.3.1.md`.

## Business SaaS Affiliate Expansion v4.3.0

v4.3.0 adds 20 high-intent bilingual article pairs for monday.com, Google Workspace, Shopify, HubSpot CRM, and Hostinger. All pages publish with official links before approval and can switch to verified affiliate URLs through the central affiliate configuration. The release also adds Google Workspace and HubSpot CRM product profiles, an application-status registry, explicit indexing, LuQvia integration on relevant comparison pages, and release-specific QA. See `docs/BUSINESS_SAAS_AFFILIATE_V4.3.md`.

## LuQvia Website Production Integration v4.2.0

v4.2.0 adds a transparent LuQvia website-production and ongoing-support panel to 20 high-intent Japanese comparison articles. Service facts are centrally managed, operator ownership is disclosed, links are separated from affiliate advertising, and source-page attribution is added for website, free-diagnosis, LINE, and email routes. See `docs/LUQVIA_WEBSITE_PRODUCTION_V4.2.md` and `docs/QA_V4.2_LUQVIA_WEBSITE_PRODUCTION.md`.

## Store DX Platform Edition v4.1.0

v4.1.0 turns the Store DX content cluster into a bilingual guided platform. It adds `/ja/store-dx-assessment/` and `/en/store-dx-assessment/`, browser-only diagnosis logic, cross-category recommendations for POS, payments, reservations, LINE/customer retention, and accounting, four new product profiles, four new bilingual article pairs, and LuQvia consultation routes. The full pipeline passes with 0 content-audit errors/warnings, 0 public-validation warnings, v4.0 regression QA 158/158, and v4.1 QA 86/86. See `docs/STORE_DX_PLATFORM_V4.1.md` and `docs/QA_V4.1_STORE_DX_PLATFORM.md`.

## Integrated Cashless Payments Edition v4.0.0

v4.0.0 adds the bilingual Cashless Payments category, AirREGI, AirPAY, Square POS, and PayCAS Mobile product profiles, four individual review pairs, four comparison/implementation pairs, official CTA separation, approved A8.net placements, product-database updates, and release-specific QA. The final build passes the content audit and public validation with zero errors and zero warnings. See `docs/INTEGRATED_RELEASE_V4.0.md`, `docs/QA_V4.0_CASHLESS_PAYMENTS.md`, and `docs/A8_CTA_MAP_V4.0.md`.

## Integrated Revenue Edition v3.7.0

The Store DX v3.6.0 branch and the uploaded XServer affiliate v3.4.0 branch are integrated in this release. It retains all POS and restaurant-DX content while adding the complete XServer / XServer Business article and A8.net cluster. Content audit and public validation pass with zero errors and zero warnings. See `docs/INTEGRATED_RELEASE_V3.7.md`, `docs/QA_V3.7_INTEGRATED.md`, and `docs/A8_URL_SUBMISSION_V3.7.md`.

## Store DX v3.6.0

EMEAO! POS vendor-matching content and monetization routes added. See `docs/STORE_DX_EMEAO_V3.6.md`.

## Store DX v3.4.0

Restaurant POS and mobile-order content cluster added. See `docs/STORE_DX_V3.4.md`.

# Luqevora Static Platform

Luqevoraを、静的サイトの速度と安全性を維持したまま、記事データから自動生成する基盤です。

## この版の状態

- バージョン1.13.0は、XServerショップ実装版にグーペの店舗・美容サロン・予約関連記事、A8.net素材の原文保持出力、既存Webサイト制作記事からの内部導線を追加した収益化強化版です。
- 公開記事は日本語280件・英語280件です。すべて同一カテゴリ・スラッグの日英ペアになっています。
- 既存公開URLと購入意図の強い記事を中心に、日本語122件・英語122件を検索対象へ設定しています。残り316件は削除せず `noindex,follow` で保持し、固有性と根拠を高めてから段階公開できます。
- 12テーマの日英トピックハブ、記事ごとの判断要約・検証情報、意味的な関連記事5件を追加しました。
- 検索対象244記事には、固有の1200×675画像、画像サイトマップ情報、Article / BlogPosting構造化データを出力します。
- `hreflang` と `x-default` を日英ペアで統一し、サイトマップを固定ページ・トピック・日英記事の5ファイルへ分割しました。
- 日英RSSとIndexNow通知を備え、GitHub Pages公開後は追加・更新・削除されたURLだけを通知します。
- ビルド前に本文量、公式情報源、日英ペア、重複メタ情報、確認日の鮮度を監査し、JSON/CSVレポートを生成します。
- index対象ページのSHA-256公開マニフェストを生成し、直前の本番との差分を自動判定します。
- SEO画像は生成条件が変わったものだけ再生成するため、通常の検証時間を短縮できます。
- 旧HTMLから17テーマを日英の構造化データへ移行し、データから生成する記事は478件です。
- 現行公開サイト一式を `legacy/` に保存しています。
- ビルド時は現行サイトを先に `public/` へ複製し、データ化済み478記事と全トップ・カテゴリ・記事一覧を再生成します。
- 未移行の記事、固定ページ、デザイン、画像、JavaScript、`CNAME`、`.nojekyll` は維持されます。
- sitemap、robots、RSS、検索用データはビルド時に検索対象ページだけから再生成します。
- ホームの注目比較・レビューは `content/config/home.json` で日英共通に管理します。

品質監査、公開差分、選択的IndexNow通知は [`docs/SEO_OPERATIONS_V1.9.md`](docs/SEO_OPERATIONS_V1.9.md) を参照してください。SEO強化内容と段階公開は [`docs/SEO_ENHANCEMENT_V1.8.md`](docs/SEO_ENHANCEMENT_V1.8.md)、日英280記事マイルストーンは [`docs/BILINGUAL_280_AFFILIATE_MILESTONE.md`](docs/BILINGUAL_280_AFFILIATE_MILESTONE.md) に残しています。

## アフィリエイトリンクの運用

- 各比較記事のCTAには公式URLと `affiliateKey` を保存しています。
- `content/config/affiliates.json` が空の間は、通常の公式リンクとして出力します。
- 承認後に同ファイルへ追跡URLを登録すると、該当CTAだけを広告リンクへ切り替えます。
- 広告リンクへ切り替わった記事は、広告開示と `rel="sponsored nofollow noopener"` を自動で出力します。

## GitHubへ反映する手順

1. ZIPを展開し、中身をLuqevoraリポジトリのルートへアップロードします。
2. GitHub Pagesの公開元を **GitHub Actions** に設定します。
3. `main` ブランチへの反映後、`Build and validate` が完了するまで待ちます。
4. Actionsが成功したら、主要記事、`sitemap.xml`、`release-manifest.json`、言語切替を確認します。

ローカルではNode.js 20以上で次を実行できます。GitHub ActionsではNode.js 24を使用します。

```bash
npm run check
```

## 通常運用

1. `content/articles/ja` または `content/articles/en` に記事JSONを追加・更新します。
   日英共通の比較記事は `content/article-batches/` の構造化データでも管理できます。
2. `npm run check` を実行します。
3. GitHubへpushします。
4. GitHub Actionsが生成・検査し、合格時のみ公開します。公開後は変更URLだけをIndexNowへ通知します。

`public/` は自動生成物です。記事本文やメタ情報は直接編集せず、`content/` を更新してください。記事画像は `source-assets/` へ生成されます。

検索対象のルールは `content/config/seo.json` で管理します。`indexing.mode` を `all` に変えると全記事を検索対象へ切り替えられますが、先に独自検証・固有画像・内部リンク・検索意図の重複を確認してください。

検証では、各言語280記事以上、検索対象100記事以上、日英ルートと検索対象の完全一致、固有画像、トピック件数、分割サイトマップ、`x-default`、構造化データ、内部リンクを確認します。品質監査では本文量、公式情報源数、日付、翻訳ペア、タイトル・description重複も検査し、`reports/content-audit.json` とCSVへ出力します。

## v3.0 Comparison Database

`npm run catalog` generates `content/products/catalog.json`, the canonical comparison dataset used by `/ja/compare/`, `/en/compare/`, and `/product-catalog.json`. Pricing summaries, best-fit use cases, strengths, constraints, official sources, and related articles are managed with a shared schema.

## v3.2.0 operations management

Run `npm run operations` to regenerate the internal editorial dashboard:

- `reports/operations-dashboard.html`
- `reports/operations-dashboard.json`

The dashboard tracks verification deadlines, affiliate configuration, source coverage, and product-catalog review dates. It is not published under `public/`.

## v3.3 revenue optimization

Run `npm run revenue` to generate the private CTA inventory and monetization improvement queue:

- `reports/revenue-optimization.html`
- `reports/revenue-optimization.json`
- `reports/revenue-optimization.csv`

The report intentionally excludes estimated performance. Import real GA4 and affiliate-network exports before calculating CTR, CVR, EPC, or revenue.
