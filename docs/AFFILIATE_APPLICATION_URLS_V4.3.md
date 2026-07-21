# アフィリエイト・紹介プログラム申請用URL v4.3

確認日：2026-07-20

Google Workspaceは紹介プログラム登録済みで、専用紹介リンクを掲載しています。その他は審査前のため公式サイトへの通常リンクです。認定パートナー等の表現は使用していません。

## monday.com

申請先：<https://monday.com/affiliate-program>

現在の状態：PartnerStackのアカウント作成段階で停止中。記事は先行公開可能です。

代表URL：

- https://luqevora.com/ja/business-software/monday-work-management-plans-comparison/
- https://luqevora.com/ja/business-software/monday-crm-vs-hubspot-crm/
- https://luqevora.com/ja/store-dx/monday-multiple-store-operations/
- https://luqevora.com/ja/business-software/monday-web-production-project-management/
- https://luqevora.com/ja/business-software/monday-implementation-checklist/

## Google Workspace

状態：紹介プログラム登録済み・専用リンク反映済み

紹介リンク：<https://referworkspace.app.goo.gl/ewLM>

プロモーションコード：公開禁止のため、公開リポジトリには保存せず個別配布

申請先：<https://workspace.google.com/intl/ja/referral-program/>

代表URL：

- https://luqevora.com/ja/business-software/google-workspace-pricing-small-business/
- https://luqevora.com/ja/business-software/google-workspace-vs-microsoft-365-small-business/
- https://luqevora.com/ja/business-software/gmail-vs-google-workspace-business-email/
- https://luqevora.com/ja/business-software/google-workspace-domain-email-setup/

## Shopify

申請先：<https://www.shopify.com/jp/affiliates>

代表URL：

- https://luqevora.com/ja/website-builders/shopify-pricing-total-cost-japan/
- https://luqevora.com/ja/website-builders/shopify-vs-base-small-business/
- https://luqevora.com/ja/website-builders/shopify-vs-stores-small-business/
- https://luqevora.com/ja/website-builders/shopify-launch-checklist-small-store/

## HubSpot

申請先：<https://www.hubspot.com/partners/affiliates>

代表URL：

- https://luqevora.com/ja/business-software/hubspot-free-crm-review-small-business/
- https://luqevora.com/ja/business-software/hubspot-free-vs-starter/
- https://luqevora.com/ja/business-software/hubspot-vs-salesforce-small-business/
- https://luqevora.com/ja/business-software/crm-comparison-small-business-japan/

## Hostinger

申請先：<https://www.hostinger.com/jp/affiliates>

代表URL：

- https://luqevora.com/ja/hosting-security/hostinger-pricing-renewal-cost-japan/
- https://luqevora.com/ja/hosting-security/hostinger-vs-xserver-small-business/
- https://luqevora.com/ja/hosting-security/hostinger-overseas-website-guide/

## 承認後の変更

1. 提携サービスの管理画面で正式な追跡URLを取得する。
2. `content/config/affiliates.json` の `links` に該当キーを追加する（Google Workspaceは反映済み）。
3. `npm run check` を実行する。
4. 記事が広告開示、`rel="sponsored nofollow noopener"`、広告計測属性付きで生成されたことを確認する。
5. 提携先から掲載URLの申告を求められた場合は、上記URLを登録する。

キー：

- monday.com：`monday-com`
- Google Workspace：`google-workspace`
- Shopify：`shopify`
- HubSpot：`hubspot-crm`
- Hostinger：`hostinger`
