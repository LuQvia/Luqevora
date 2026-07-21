# Google Workspace US Referral Integration v4.3.3

## 目的

英語圏、とくに米国からの検索流入を収益化するため、米国向けGoogle Workspace紹介リンクを英語ページへ地域別に実装します。日本向け紹介リンクとはキーを分離し、英語ページから日本向けリンクへ誤誘導しない構成です。

## 公開する情報

- 米国向け紹介リンク：`https://referworkspace.app.goo.gl/GNVm`
- 英語CTA：`Start Google Workspace with our US referral link`
- 割引コード申請CTA：`Request a 10% first-year promo code`
- 申請先：`info@luqvia.com`
- アフィリエイト開示と `rel="sponsored nofollow noopener"`
- 米国では請求情報入力時、14日間試用の申込み完了前にコードを入力する案内

## 公開しない情報

Google Workspaceのプロモーションコードは1コードにつき1つの紹介先アカウントのみ利用できます。そのため、コード本体は記事、設定ファイル、検索データ、GitHubリポジトリ、公開ZIPには保存しません。コードは非公開台帳で管理し、利用希望者へ個別に案内します。

## 対象英語ページ

### v4.3構造化記事

1. `google-workspace-pricing-small-business`
2. `google-workspace-vs-microsoft-365-small-business`
3. `gmail-vs-google-workspace-business-email`
4. `google-workspace-domain-email-setup`

### 英語記事バッチ

1. `custom-domain-email-guide`
2. `google-chat-guide`
3. `google-meet-guide`
4. `google-workspace-guide`
5. `slack-vs-google-chat`

合計9ページで米国向け紹介リンクとプロモーションコード申請導線を有効化します。

## 中央設定

- 日本向け：`google-workspace`
- 米国・英語向け：`google-workspace-us`
- コード申請：`google-workspace-us-promo-request`

`content/config/affiliates.json`で地域と言語を分離しています。

## 公式確認先

- Google Workspace Referral Program: <https://workspace.google.com/referral-program/>
- Referral FAQ: <https://workspace.google.com/landing/partners/referral/faqs/>

## QA

`npm run qa:v433`で以下を検証します。

- 米国向け紹介URLの設定
- 日本向けリンクとの分離
- 9ページの紹介CTA
- 9ページの割引コード申請CTA
- 広告開示とsponsored属性
- コード非公開の説明
- 公開ページにコード形式の文字列が含まれないこと
