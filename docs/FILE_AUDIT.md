# ファイル構成の見直し結果

## 現行で確認済みの大分類
- ルート: `index.html`, `404.html`, `CNAME`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `.nojekyll`, favicon。
- 共通アセット: `assets/css`, `assets/images`, `assets/js`。
- 日本語: `ja/` 配下にトップ、5カテゴリ、運営者情報、広告開示、問い合わせ、編集方針、プライバシー、利用規約。
- 英語: `en/` 配下に同等構成と `articles/`。

## 再構築後に廃止する管理方法
- 各HTMLへのヘッダー・フッター重複記載。
- トップ、カテゴリ、sitemapの個別手更新。
- 記事本文内へのアフィリエイトURL直書き。
- hreflang、canonical、構造化データのページ別手入力。
- 記事数や最終確認日のHTML直書き。

## 新構成へ移す対象
- ページ本文 → `content/articles` / `content/pages`。
- カテゴリ・ナビ → `content/config`。
- 共通レイアウト → `templates`。
- SEOタグ・JSON-LD → `scripts/build.mjs`。
- サイトマップ・検索索引 → ビルド時自動生成。
- 公開品質判定 → `scripts/validate.mjs` とGitHub Actions。
