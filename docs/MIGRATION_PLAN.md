# 現行Luqevoraからの移行手順

## Phase 0: バックアップ
1. 現行GitHubリポジトリをZIPで保存。
2. ZIP展開物をこのプロジェクトの `legacy/` に配置。
3. `npm run inventory` で全ファイルを棚卸し。

## Phase 1: URL台帳
1. `npm run import:legacy` を実行。
2. `content/legacy-manifest.json` の全URL、title、description、canonical、H1を確認。
3. 既存URLと新URLの対応表を作成し、変更ゼロを原則とする。

## Phase 2: 共通アセット
1. `legacy/assets/` のCSS、画像、JSを確認。
2. 現行デザインを `templates/` と `/assets/` に分離。
3. ヘッダー、フッター、ナビゲーション、言語切替を共通化。

## Phase 3: 既存記事の構造化
1. 1記事ずつJSONへ変換。
2. 日英記事に同一 `translationKey` を設定。
3. 公開日、更新日、最終確認日、公式出典を分離。
4. 比較表、CTA、広告リンクを構造化データへ移す。

### 現在の進捗

- 第1バッチ14件、第2バッチ8件に加え、旧HTML17テーマを日英構造化データへ移行済み。
- 既存日本語記事39件の英語版、比較140テーマ、個別レビュー24テーマ、提携候補12社の料金・代替・用途別36テーマの日英版を追加済み。
- 公開記事は日本語280件・英語280件で、記事ルートは完全に対応。
- 未移行ページは `legacy/` から公開物へ複製してURLとデザインを維持。
- 記事一覧、sitemap、robots、検索用データは全記事を対象に自動生成。

## Phase 4: 固定ページ
運営者情報、広告開示、編集方針、お問い合わせ、プライバシー、利用規約を `content/pages/` へ移す。

## Phase 5: 並行公開テスト
1. `npm run check`。
2. `public/` を別ブランチまたはステージングで公開。
3. PC、スマホ、日英切替、全URL、SEOタグを比較。

## Phase 6: 本番切替
1. 現行版のタグを作成。
2. GitHub PagesのSourceをGitHub Actionsへ変更。
3. mainへマージ。
4. 公開直後に主要URL、sitemap、robots、404、解析を確認。
