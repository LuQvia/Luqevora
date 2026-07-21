import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleRoot = path.join(root, 'content/articles');
const date = '2026-07-19';
const official = 'https://www.jimdo.com/jp/';

const jimdoSourcesJa = [
  { label: 'ジンドゥー公式サイト', url: 'https://www.jimdo.com/jp/' },
  { label: 'ジンドゥー料金プラン', url: 'https://www.jimdo.com/jp/pricing/' },
  { label: '2026年 有料プラン価格改定', url: 'https://www.jimdo.com/jp/2026/03/18/%E6%9C%89%E6%96%99%E3%83%97%E3%83%A9%E3%83%B3%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E3%81%AE%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B-%E6%96%B0%E8%A6%8F%E3%81%AE%E3%81%8A%E5%AE%A2%E6%A7%98%E5%90%91%E3%81%91/' },
  { label: '特定商取引法に基づく料金表', url: 'https://www.jimdo.com/jp/info/%E7%89%B9%E5%AE%9A%E5%95%86%E5%8F%96%E5%BC%95%E6%B3%95%E3%81%AB%E5%9F%BA%E3%81%A5%E3%81%8F%E8%A1%A8%E8%A8%98/' },
  { label: 'AIビルダーとクリエイターの違い', url: 'https://www.jimdo.com/jp/blog-hp-2types-jimdo-kaisetsu/' },
  { label: 'ジンドゥーのネットショップ', url: 'https://www.jimdo.com/jp/website/online-store/' },
  { label: 'ジンドゥークリエイター SEOサポート', url: 'https://help.jimdo.com/hc/ja/categories/115001247063-SEO' },
  { label: '独自ドメインの導入', url: 'https://help.jimdo.com/hc/ja/articles/115005537906-%E7%8B%AC%E8%87%AA%E3%83%89%E3%83%A1%E3%82%A4%E3%83%B3%E3%81%AE%E5%B0%8E%E5%85%A5-%E3%81%84%E3%81%8F%E3%81%A4%E3%81%8B%E3%81%AE%E6%96%B9%E6%B3%95%E3%81%8C%E3%81%94%E3%81%96%E3%81%84%E3%81%BE%E3%81%99' },
  { label: '外部ドメイン接続とDNS', url: 'https://help.jimdo.com/hc/ja/articles/115005533983-%E5%A4%96%E9%83%A8%E3%81%A7%E7%AE%A1%E7%90%86%E3%81%97%E3%81%A6%E3%81%84%E3%82%8B%E7%8B%AC%E8%87%AA%E3%83%89%E3%83%A1%E3%82%A4%E3%83%B3%E3%81%AE%E6%8E%A5%E7%B6%9A%E3%81%A8%E3%83%8D%E3%83%BC%E3%83%A0%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC-DNS-%E3%81%AE%E5%A4%89%E6%9B%B4%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6' }
];

const jimdoSourcesEn = [
  { label: 'Jimdo Japan official site', url: 'https://www.jimdo.com/jp/' },
  { label: 'Jimdo Japan pricing', url: 'https://www.jimdo.com/jp/pricing/' },
  { label: '2026 pricing revision', url: 'https://www.jimdo.com/jp/2026/03/18/%E6%9C%89%E6%96%99%E3%83%97%E3%83%A9%E3%83%B3%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E3%81%AE%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B-%E6%96%B0%E8%A6%8F%E3%81%AE%E3%81%8A%E5%AE%A2%E6%A7%98%E5%90%91%E3%81%91/' },
  { label: 'Commercial transaction pricing disclosure', url: 'https://www.jimdo.com/jp/info/%E7%89%B9%E5%AE%9A%E5%95%86%E5%8F%96%E5%BC%95%E6%B3%95%E3%81%AB%E5%9F%BA%E3%81%A5%E3%81%8F%E8%A1%A8%E8%A8%98/' },
  { label: 'AI Builder and Creator comparison', url: 'https://www.jimdo.com/jp/blog-hp-2types-jimdo-kaisetsu/' },
  { label: 'Jimdo online store overview', url: 'https://www.jimdo.com/jp/website/online-store/' },
  { label: 'Jimdo Creator SEO help', url: 'https://help.jimdo.com/hc/en-us/categories/115001247063-SEO' },
  { label: 'Jimdo Creator domain options', url: 'https://help.jimdo.com/hc/ja/articles/115005537906-%E7%8B%AC%E8%87%AA%E3%83%89%E3%83%A1%E3%82%A4%E3%83%B3%E3%81%AE%E5%B0%8E%E5%85%A5-%E3%81%84%E3%81%8F%E3%81%A4%E3%81%8B%E3%81%AE%E6%96%B9%E6%B3%95%E3%81%8C%E3%81%94%E3%81%96%E3%81%84%E3%81%BE%E3%81%99' }
];

const competitorSources = {
  wix: [
    { label: 'Wix premium plan guidance', url: 'https://support.wix.com/ja/article/%E3%83%97%E3%83%AC%E3%83%9F%E3%82%A2%E3%83%A0%E3%83%97%E3%83%A9%E3%83%B3%E3%82%92%E9%81%B8%E6%8A%9E%E3%81%99%E3%82%8B' },
    { label: 'Wix domain and plan billing', url: 'https://support.wix.com/ja/article/%E3%83%89%E3%83%A1%E3%82%A4%E3%83%B3%E3%81%AE%E8%B3%BC%E5%85%A5-vs-%E3%83%97%E3%83%AC%E3%83%9F%E3%82%A2%E3%83%A0%E3%83%97%E3%83%A9%E3%83%B3%E3%81%AE%E8%B3%BC%E5%85%A5' },
    { label: 'Wix SEO support', url: 'https://support.wix.com/ja/seo' }
  ],
  studio: [
    { label: 'Studio pricing', url: 'https://studio.design/ja/pricing' },
    { label: 'Studio FAQ', url: 'https://studio.design/ja/faq' },
    { label: 'Studio project billing', url: 'https://help.studio.design/ja/articles/9139530-studio%E3%81%AE%E3%83%97%E3%83%A9%E3%83%B3%E6%96%99%E9%87%91%E6%94%AF%E6%89%95%E3%81%84%E3%81%AF-%E3%83%97%E3%83%AD%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%E5%8D%98%E4%BD%8D%E3%81%A7%E3%81%99%E3%81%8B-%E3%82%A2%E3%82%AB%E3%82%A6%E3%83%B3%E3%83%88%E5%8D%98%E4%BD%8D%E3%81%A7%E3%81%99%E3%81%8B' }
  ],
  wordpress: [
    { label: 'WordPress.com pricing', url: 'https://wordpress.com/ja/pricing/?compare=1' },
    { label: 'WordPress.com domains', url: 'https://wordpress.com/ja/support/domains/' },
    { label: 'WordPress.com Personal plan features', url: 'https://wordpress.com/ja/support/plan-features/personal-plan/' }
  ]
};

const routes = [
  {
    slug: 'jimdo-review', type: 'review',
    jaTitle: 'Jimdoの評判・料金・注意点｜AIビルダーとCreatorを検証',
    enTitle: 'Jimdo Review: Pricing, AI Builder, Creator, and Limits',
    jaDescription: 'Jimdoを料金、AIビルダー、クリエイター、独自ドメイン、SEO、ネットショップ、契約更新、移行性から公式情報で検証します。',
    enDescription: 'An official-source Jimdo review covering pricing, AI Builder, Creator, domains, SEO, ecommerce, renewals, and portability.',
    jaLead: 'Jimdoは、質問に答えて短時間で構成を作るAIビルダーと、HTML・CSSやブログ、ショップを扱えるクリエイターを提供するクラウド型ホームページ作成サービスです。両者は別製品で互換性がないため、作り始める前の選択が重要です。',
    enLead: 'Jimdo provides two separate website-building systems: AI Builder for guided, fast setup and Creator for deeper editing, blogging, store features, and code customization. Because the two systems are not interchangeable, product selection matters before content is built.'
  },
  {
    slug: 'jimdo-pricing', type: 'guide',
    jaTitle: 'Jimdo料金プラン比較｜2026年改定後の総額と選び方',
    enTitle: 'Jimdo Pricing: 2026 Plans, Total Cost, and Selection Guide',
    jaDescription: '2026年改定後のJimdo AIビルダーとクリエイターの料金、契約期間、更新時ドメイン費用、無料版との違いを整理します。',
    enDescription: 'Compare Jimdo AI Builder and Creator prices after the 2026 revision, including terms, domain renewal costs, and free-plan limits.',
    jaLead: 'Jimdoは2026年に新規契約向け料金を改定しました。初回料金だけでなく、契約期間分の一括請求、更新時のドメイン利用枠、必要なSEO・ショップ機能まで含めて総額を判断します。',
    enLead: 'Jimdo revised new-customer pricing in 2026. A useful comparison includes full-term billing, domain charges at renewal, and the plan required for SEO, store, and customization needs rather than the first displayed price alone.'
  },
  {
    slug: 'jimdo-ai-builder-vs-creator', type: 'comparison',
    jaTitle: 'Jimdo AIビルダーとクリエイターの違い｜選び方を比較',
    enTitle: 'Jimdo AI Builder vs Creator: Key Differences and Selection',
    jaDescription: 'Jimdo AIビルダーとクリエイターを、作成方法、スマホ編集、HTML・CSS、ブログ、ショップ、SEO、移行性から比較します。',
    enDescription: 'Compare Jimdo AI Builder and Creator by setup workflow, mobile editing, code, blogging, ecommerce, SEO, and portability.',
    jaLead: 'AIビルダーは質問とブロック編集を中心に、クリエイターは見たまま編集、ブログ、ショップ、HTML・CSSカスタマイズを中心に設計されています。両サービス間でコンテンツをそのまま移動できない点が最大の注意事項です。',
    enLead: 'AI Builder emphasizes guided questions and block-based editing, while Creator emphasizes visual editing, blogging, store functions, and HTML or CSS customization. The largest constraint is that content cannot simply be transferred between the two products.'
  },
  {
    slug: 'jimdo-vs-wix', type: 'comparison',
    jaTitle: 'JimdoとWixを比較｜初心者・店舗サイトに向くのはどちら？',
    enTitle: 'Jimdo vs Wix: Which Builder Fits Beginners and Local Sites?',
    jaDescription: 'JimdoとWixを、作成の簡単さ、デザイン、アプリ、SEO、独自ドメイン、ブログ、予約・EC、運用負担から比較します。',
    enDescription: 'Compare Jimdo and Wix by ease of use, design, apps, SEO, domains, blogging, bookings, ecommerce, and operating effort.',
    jaLead: 'Jimdoは機能を絞った作成フロー、Wixはテンプレート、アプリ、CMS、予約・ECなどの拡張性が特徴です。初心者向けという同じ分類でも、必要な機能を少なく保つか、後から増やすかで適性が変わります。',
    enLead: 'Jimdo is designed around a comparatively focused building workflow, while Wix provides a broad template, app, CMS, booking, and ecommerce ecosystem. Both can suit beginners, but the better fit depends on whether simplicity or expansion is the priority.'
  },
  {
    slug: 'jimdo-vs-studio', type: 'comparison',
    jaTitle: 'JimdoとStudioを比較｜簡単作成とデザイン自由度の違い',
    enTitle: 'Jimdo vs Studio: Guided Setup or Design Flexibility?',
    jaDescription: 'JimdoとStudioを、料金、デザイン、CMS、独自ドメイン、共同編集、SEO、ページ上限、運用方法から比較します。',
    enDescription: 'Compare Jimdo and Studio by pricing, design control, CMS, domains, collaboration, SEO, page limits, and workflow.',
    jaLead: 'Jimdoは小規模事業者が情報を入力して早く公開する用途、StudioはノーコードでレイアウトとCMSを設計する用途に向きます。サイトを誰が作り、誰が更新し、何ページ運用するかを先に決めると選びやすくなります。',
    enLead: 'Jimdo is suited to small operators who want to enter information and publish quickly, while Studio is oriented toward no-code layout and CMS design. Selection becomes clearer after defining who builds, who updates, and how many pages or collections the site requires.'
  },
  {
    slug: 'jimdo-vs-wordpress', type: 'comparison',
    jaTitle: 'JimdoとWordPressを比較｜簡単運用と拡張性の違い',
    enTitle: 'Jimdo vs WordPress: Managed Simplicity or Extensibility?',
    jaDescription: 'JimdoとWordPress.com・セルフホスト型WordPressを、料金、保守、テーマ、プラグイン、SEO、移行、所有権から比較します。',
    enDescription: 'Compare Jimdo with WordPress.com and self-hosted WordPress by cost, maintenance, themes, plugins, SEO, migration, and control.',
    jaLead: 'Jimdoはホスティング込みで更新作業を減らしやすく、WordPressはテーマ、プラグイン、データ管理の選択肢を広げやすい仕組みです。サイト規模と保守能力を基準に比較します。',
    enLead: 'Jimdo bundles hosting and reduces technical maintenance, while WordPress can provide a wider theme, plugin, and data-control ecosystem. The decision should follow site complexity and the organization’s ability to operate the platform.'
  },
  {
    slug: 'jimdo-salon-website-guide', type: 'guide',
    jaTitle: 'Jimdoで美容サロンのホームページを作る方法｜構成と注意点',
    enTitle: 'Building a Salon Website with Jimdo: Structure and Checks',
    jaDescription: 'Jimdoで美容室・眉毛サロン・エステのサイトを作る際のページ構成、予約導線、料金表示、写真、SEO、法的表示を解説します。',
    enDescription: 'Plan a salon website in Jimdo with pages, booking routes, pricing, photography, local SEO, disclosures, and operating checks.',
    jaLead: '美容サロンのホームページは、見た目だけでなく、メニュー、価格、施術時間、予約、アクセス、キャンセル、FAQを迷わず確認できることが重要です。Jimdoの簡単な編集環境を使い、更新担当者が維持できる構成にします。',
    enLead: 'A salon website must make services, prices, duration, booking, access, cancellation rules, and frequently asked questions easy to find. Jimdo can support a maintainable structure when the design is aligned with the staff responsible for updates.'
  },
  {
    slug: 'jimdo-small-business-guide', type: 'guide',
    jaTitle: 'Jimdoで小規模事業のホームページを作る手順｜公開後まで解説',
    enTitle: 'Jimdo for Small Business: From Planning to Post-Launch Operations',
    jaDescription: 'Jimdoで小規模事業者がホームページを作る手順を、目的、ページ設計、ドメイン、問い合わせ、SEO、公開後の更新から解説します。',
    enDescription: 'A small-business Jimdo workflow covering objectives, page design, domains, enquiries, SEO, launch, and ongoing updates.',
    jaLead: '小規模事業のサイトは、機能を増やすより、問い合わせや来店につながる情報を少ないページで正確に保つことが重要です。無料版で操作を確認し、有料化前にドメインと契約期間を決めます。',
    enLead: 'A small-business site benefits more from accurate, maintained information and a clear conversion route than from a large feature set. Test the editor on the free tier, then decide domain ownership, term length, and required paid features before upgrading.'
  },
  {
    slug: 'jimdo-seo-guide', type: 'guide',
    jaTitle: 'JimdoのSEO設定ガイド｜タイトル・URL・サイトマップを改善',
    enTitle: 'Jimdo SEO Guide: Titles, URLs, Sitemaps, and Content',
    jaDescription: 'Jimdoで行うSEO設定を、ページタイトル、概要、URL、見出し、画像、内部リンク、サイトマップ、Search Consoleから解説します。',
    enDescription: 'Improve Jimdo SEO with page titles, descriptions, URLs, headings, images, internal links, sitemaps, and Search Console.',
    jaLead: 'JimdoにはSEO設定がありますが、設定項目を埋めるだけで順位が上がるわけではありません。検索意図に合うページ、固有の文章、分かりやすい構造、地域情報、継続更新を組み合わせます。',
    enLead: 'Jimdo includes SEO controls, but filling metadata fields alone does not create rankings. Sustainable visibility combines relevant pages, unique content, clear information architecture, local signals, internal links, and ongoing maintenance.'
  },
  {
    slug: 'best-website-builders-for-beginners', type: 'comparison',
    jaTitle: '初心者向けホームページ作成サービス比較｜5サービスの選び方',
    enTitle: 'Best Website Builders for Beginners: Five Options Compared',
    jaDescription: 'Jimdo、Wix、Studio、グーペ、WordPress.comを、簡単さ、料金、デザイン、ブログ、予約、SEO、移行性から比較します。',
    enDescription: 'Compare Jimdo, Wix, Studio, Goope, and WordPress.com by ease, cost, design, blogging, booking, SEO, and portability.',
    jaLead: '初心者向けサービスは、操作が簡単というだけで選ぶと、後からページ数、予約、ブログ、独自ドメイン、移行で行き詰まります。最初の公開速度と、2年後に必要になる機能を同時に比較します。',
    enLead: 'Choosing only by initial ease can create limits later in pages, booking, blogging, domains, or migration. A useful beginner comparison balances fast publishing with the functions and ownership requirements likely to matter two years later.'
  }
];

const relatedJa = [
  { label: 'Jimdoレビュー', url: '/ja/website-builders/jimdo-review/', description: '料金・機能・契約条件を確認' },
  { label: 'Jimdo料金プラン比較', url: '/ja/website-builders/jimdo-pricing/', description: '2026年改定後の総額を比較' },
  { label: 'AIビルダーとクリエイターの違い', url: '/ja/website-builders/jimdo-ai-builder-vs-creator/', description: '互換性と機能差を確認' },
  { label: 'JimdoとWixの比較', url: '/ja/website-builders/jimdo-vs-wix/', description: '簡単さと拡張性を比較' },
  { label: 'JimdoとStudioの比較', url: '/ja/website-builders/jimdo-vs-studio/', description: '作成速度とデザインを比較' },
  { label: 'JimdoとWordPressの比較', url: '/ja/website-builders/jimdo-vs-wordpress/', description: '保守負担と拡張性を比較' },
  { label: '美容サロン向けJimdoガイド', url: '/ja/website-builders/jimdo-salon-website-guide/', description: '予約・料金・店舗情報を設計' },
  { label: '小規模事業向けJimdoガイド', url: '/ja/website-builders/jimdo-small-business-guide/', description: '公開から更新まで確認' },
  { label: 'Jimdo SEO設定ガイド', url: '/ja/website-builders/jimdo-seo-guide/', description: '検索設定と改善手順を確認' },
  { label: '初心者向けホームページ作成比較', url: '/ja/website-builders/best-website-builders-for-beginners/', description: '5サービスを横断比較' }
];
const relatedEn = relatedJa.map((link) => ({
  label: link.label
    .replace('Jimdoレビュー', 'Jimdo review')
    .replace('Jimdo料金プラン比較', 'Jimdo pricing')
    .replace('AIビルダーとクリエイターの違い', 'AI Builder vs Creator')
    .replace('JimdoとWixの比較', 'Jimdo vs Wix')
    .replace('JimdoとStudioの比較', 'Jimdo vs Studio')
    .replace('JimdoとWordPressの比較', 'Jimdo vs WordPress')
    .replace('美容サロン向けJimdoガイド', 'Jimdo for salon websites')
    .replace('小規模事業向けJimdoガイド', 'Jimdo for small business')
    .replace('Jimdo SEO設定ガイド', 'Jimdo SEO guide')
    .replace('初心者向けホームページ作成比較', 'Website builders for beginners'),
  url: link.url.replace('/ja/', '/en/'),
  description: 'Related official-source comparison and implementation guide'
}));

function jaPricingTable() {
  return {
    headers: ['サービス', 'プラン', '1年契約', '2年契約'],
    rows: [
      ['AIビルダー', 'Start', '15,480円', '27,600円'],
      ['AIビルダー', 'Grow', '24,840円', '44,640円'],
      ['クリエイター', 'Pro', '18,720円', '31,200円'],
      ['クリエイター', 'Business', '40,560円', '71,760円'],
      ['クリエイター', 'SEO PLUS', '66,300円', '123,240円'],
      ['クリエイター', 'Platinum', '83,100円', '154,200円']
    ]
  };
}
function enPricingTable() {
  return {
    headers: ['Product', 'Plan', 'One year', 'Two years'],
    rows: [
      ['AI Builder', 'Start', 'JPY 15,480', 'JPY 27,600'],
      ['AI Builder', 'Grow', 'JPY 24,840', 'JPY 44,640'],
      ['Creator', 'Pro', 'JPY 18,720', 'JPY 31,200'],
      ['Creator', 'Business', 'JPY 40,560', 'JPY 71,760'],
      ['Creator', 'SEO PLUS', 'JPY 66,300', 'JPY 123,240'],
      ['Creator', 'Platinum', 'JPY 83,100', 'JPY 154,200']
    ]
  };
}

function jaSections(slug) {
  const commonFinal = {
    heading: '契約前に確認すること',
    body: [
      '無料版では実際の文章、画像、メニュー、問い合わせ導線を入れ、スマートフォン表示と更新作業を確認します。有料化する前に、独自ドメインをJimdoで管理するか外部事業者に残すか、契約期間、更新日、支払い担当者、解約手順を記録してください。',
      'ホームページ作成サービスを変更するときは、ページURL、画像、ブログ、フォーム回答、商品、SEO設定がそのまま移行できるとは限りません。原稿と画像の元データを別に保管し、公開後も定期的にページ一覧と問い合わせ動作を点検します。'
    ],
    bullets: ['無料版で編集とスマホ表示を試す', '初回だけでなく更新時の総額を確認する', 'ドメインの管理元とDNS変更権限を記録する', '原稿・画像・商品データを別に保管する', '問い合わせと計測タグを公開後にテストする']
  };
  const map = {
    'jimdo-review': [
      { heading: '結論：早く公開したい小規模サイトの有力候補', body: ['JimdoはサーバーやCMSの導入を別に行わず、無料版からページを作成できます。AIビルダーは質問に答えて構成を整えたい人、クリエイターはブログ、ショップ、HTML・CSS、細かなSEO設定を使いたい人に向きます。', '弱点は、AIビルダーとクリエイターが別システムであり、途中で選択を変える際にコンテンツをそのまま移せないことです。複雑な予約、会員、データベース、大規模ECが必要な場合はWix、Studio、WordPress、専用システムも比較します。'], affiliateMaterialKey: 'jimdo-short' },
      { heading: 'AIビルダーとクリエイターは別サービス', body: ['AIビルダーは作成アシスタントとブロック編集で短時間の公開を目指す仕組みです。スマートフォン中心で編集したい人や、完成イメージが固まっていない小規模事業者に使いやすい構成です。', 'クリエイターはドラッグ＆ドロップ編集、ブログ、ショップ、HTML・CSSによる調整を行えます。両者には互換性がなく、サイト内コンテンツの複製や移動ができないため、将来のブログ・ショップ・コード利用を先に確認します。'] },
      { heading: '2026年改定後の料金', body: ['料金は契約期間分が一括請求されます。AIビルダーは1か月契約もありますが、長期契約と比べた総額、更新時のドメイン利用枠を確認します。クリエイターはProからPlatinumまで機能段階があり、必要なSEO・ショップ・サポートに合わせて選びます。', '無料版は操作確認に有効ですが、独自ドメインや広告非表示など、事業サイトに必要な機能は有料プランが前提です。料金表示は税込で、更新条件やドメイン費用が変わる場合があるため申込画面を最終確認します。'], table: jaPricingTable(), affiliateMaterialKey: 'jimdo-software' },
      { heading: '独自ドメインとSEO', body: ['有料プランではJimdoで取得したドメイン、移管したドメイン、外部事業者で管理するドメインを利用できます。外部メールを維持する場合はネームサーバー変更ではなくCNAME接続が適する場合があるため、DNS構成を確認します。', 'クリエイターにはページタイトル、概要、URL、画像、サイトマップ、Search ConsoleなどのSEO支援情報があります。ただし検索順位はサービス名ではなく、ページ内容、地域情報、内部リンク、表示品質、継続更新によって決まります。'] },
      { heading: 'ネットショップと外部機能', body: ['クリエイターではショップ機能を使い、PayPal、Stripe、銀行振込、代引きなどを案内できます。公式案内では出店・販売手数料なしとされていますが、決済事業者の手数料、配送、返品、在庫、税務、特定商取引法表示は別に設計します。', '予約、会員、顧客管理、複雑な在庫連携が必要な場合は外部サービスとの接続を検討します。導入前に必要なデータが取得できるか、サービス変更時にCSV等で持ち出せるかを確認してください。'] },
      commonFinal
    ],
    'jimdo-pricing': [
      { heading: '料金比較の結論', body: ['最安プランではなく、必要な機能を満たす最小プランで比較します。短期間だけ使うならAIビルダーの月契約は柔軟ですが、年間総額は高くなります。長期契約では1回の支払額と途中解約時の扱いを確認します。', '事業サイトでは独自ドメイン、広告非表示、アクセス計測、SEO設定、問い合わせ、ブログやショップの有無を確認します。ドメイン利用枠や更新時の追加費用を含めて2年間の総額を出すと判断しやすくなります。'], affiliateMaterialKey: 'jimdo-short' },
      { heading: 'AIビルダーの料金', body: ['Startは1か月1,720円、1年15,480円、2年27,600円、Growは1か月2,720円、1年24,840円、2年44,640円です。価格は初回契約時の税込表示で、更新時はドメイン利用枠が加算されます。', '月契約は試しやすい一方、A8.netの本プログラムでは1か月契約が成果対象外です。利用者は広告成果ではなく、自身の利用期間と必要機能を優先して契約方式を選んでください。'] },
      { heading: 'クリエイターの料金', body: ['2026年改定後はProが1年18,720円、Businessが40,560円、SEO PLUSが66,300円、Platinumが83,100円です。2年契約ではそれぞれ31,200円、71,760円、123,240円、154,200円です。', 'クリエイターは上位プランほどSEOや運用支援の選択肢が増えますが、名称だけで判断せず、実際に必要なページ数、ショップ、統計、サポート、コード、ロボット制御を機能表で確認します。'], table: jaPricingTable(), affiliateMaterialKey: 'jimdo-software' },
      { heading: '無料版と有料版の境界', body: ['無料版は編集操作、テンプレート、文章量、画像比率、スマホ表示を確認する用途に適しています。独自ドメインを接続し、ブランドサイトとして公開するには有料化が必要です。', '無料登録だけではA8.netの成果条件を満たしませんが、無料版を試さずに長期契約へ進む必要もありません。公開予定のページを仮作成し、制限と編集負担を確認してから選びます。'] },
      { heading: 'ドメインと更新費用', body: ['初回契約時にドメイン特典があっても、次回更新時から費用が発生する場合があります。クリエイターでは基本ドメイン費用が更新時に自動加算される条件があるため、利用しない場合の解約期限も確認します。', 'ドメインを外部管理に残すと、サービス変更時に移行しやすい一方、DNSと請求が分かれます。Jimdo側で管理すると設定は簡単ですが、DNSを個別編集できないケースがあります。将来のメールや外部サービス接続を含めて決めます。'] },
      commonFinal
    ],
    'jimdo-ai-builder-vs-creator': [
      { heading: '結論：公開速度ならAIビルダー、運用の幅ならクリエイター', body: ['AIビルダーは質問への回答とブロック編集で、少ない判断で早く形にしたい人に向きます。クリエイターはページ構成、ブログ、ショップ、HTML・CSS、SEO設定を自分で調整したい人に向きます。', 'どちらが上位という関係ではありません。作成途中でサービスを変更するとコンテンツを自動移行できないため、公開後に増やす機能を先に洗い出します。'], affiliateMaterialKey: 'jimdo-easy' },
      { heading: '作成フローとスマートフォン編集', body: ['AIビルダーは業種や目的に関する質問をもとにページ案を作り、ブロックを選んで編集します。完成イメージがない場合でも進めやすく、スマートフォン中心の更新にも適しています。', 'クリエイターは見たまま編集を基礎に、より細かな構成を作れます。スマートフォンアプリで運用できますが、すべての編集機能がパソコンと同じではないため、初期制作と日常更新を分ける設計が現実的です。'] },
      { heading: 'ブログ・ショップ・コード', body: ['クリエイターはブログとショップ機能を備え、HTML・CSSで細部を調整できます。コンテンツを継続追加するサイト、商品を掲載するサイト、制作会社が調整するサイトでは有力です。', 'AIビルダーは速度と簡潔さを優先するため、複雑なカスタムコードやデータ構造を前提にしません。外部サービスの埋め込みや連携が必要な場合は、事前にテストページで動作を確認します。'], affiliateMaterialKey: 'jimdo-software' },
      { heading: 'SEOとアクセス解析', body: ['クリエイターのサポートにはタイトル、概要、カスタムURL、画像、サイトマップ、Search Console、高度なロボット設定などが整理されています。高度な設定の一部はBusiness等の対象プランが必要です。', 'AIビルダーでも基本的な検索表示を整えられますが、両サービスの設定項目は同一ではありません。必要なURL制御、リダイレクト、noindex、構造化データ、計測タグを一覧にして比較します。'] },
      { heading: '選び方チェック', body: ['5ページ程度の会社・店舗案内を早く作るならAIビルダー、ブログやショップを増やし、コードやSEO設定を細かく扱うならクリエイターが候補です。', '無料版で同じ文章と写真を使った試作を行い、30分で更新できるか、スマホで崩れないか、必要なフォームと計測が動くかを確認して決定します。'] },
      commonFinal
    ],
    'jimdo-vs-wix': [
      { heading: '結論：機能を絞るならJimdo、拡張するならWix', body: ['JimdoはAIビルダーとクリエイターの2系統で、初心者が迷いにくい作成フローを提供します。Wixはテンプレート、アプリ、CMS、予約、ネットショップ、マーケティングなどを幅広く組み合わせられます。', '小規模な会社案内や店舗案内を早く公開するならJimdoが扱いやすく、多機能な予約・会員・データベース・ECを一つの環境で増やすならWixを比較します。'], affiliateMaterialKey: 'jimdo-easy' },
      { heading: 'デザインと編集', body: ['Jimdo AIビルダーはブロックを選び、クリエイターは見たまま編集とHTML・CSSで調整します。自由度を制限することで、更新担当者が崩しにくい点が利点です。', 'Wixは配置やアプリの選択肢が多く、要件に合わせた画面を作りやすい反面、設定項目と運用ルールが増えます。複数人で編集する場合は、テンプレート化と権限管理を確認します。'] },
      { heading: 'SEO・ドメイン・計測', body: ['Jimdoクリエイターはページタイトル、概要、URL、サイトマップ、Search Console等を扱えます。WixはSEOダッシュボード、チェックリスト、動的ページのSEO設定などを提供しています。', '両サービスとも独自ドメイン利用には有料プランが必要です。ドメイン購入とサイトプランが別契約になる場合、更新日と請求元を一覧化します。SEOは機能数だけでなく、更新可能なコンテンツ設計で比較します。'], affiliateMaterialKey: 'jimdo-software' },
      { heading: '予約・EC・外部連携', body: ['Jimdoクリエイターにはショップ機能がありますが、複雑な予約や会員管理は外部サービスとの組み合わせを確認します。WixはWix Bookings、Wix Stores等のアプリを含む拡張環境を持ちます。', '必要機能が少ない場合は多機能な環境がかえって運用負担になります。予約枠、事前決済、顧客台帳、商品数、配送、メール配信の要件を先に定義し、追加料金も含めて比較します。'] },
      { heading: '移行と長期運用', body: ['どちらも専用ビルダーで作ったレイアウトを別サービスへ完全移行することは難しいため、原稿、画像、商品、顧客、URL一覧を外部保管します。', 'サイトを将来制作会社へ引き継ぐ場合、編集権限、ドメイン所有者、請求アカウント、二要素認証、バックアップ方法を明確にします。'] },
      commonFinal
    ],
    'jimdo-vs-studio': [
      { heading: '結論：自分で簡単に作るJimdo、デザインとCMSを設計するStudio', body: ['Jimdoは小規模事業者が自分で作成・更新しやすいサービスです。Studioはレイアウト表現、CMS、共同編集、ページやフォーム上限をプランごとに設計でき、制作者やデザイナーとの共同制作に向きます。', '店舗案内を早く公開するならJimdo、ブランドサイトや採用サイトをデザインから作り込み、CMSで更新するならStudioを比較します。'], affiliateMaterialKey: 'jimdo-easy' },
      { heading: '料金体系の違い', body: ['JimdoはAIビルダーとクリエイターでプランが分かれ、契約期間分を一括請求します。Studioはサイト単位のプロジェクト課金で、Free、Mini、Personal、Business、Business Plus等があります。', 'Studioの年払い月額換算はMini 590円、Personal 1,190円、Business 3,980円、Business Plus 9,980円ですが、ページ数、CMS、フォーム回答、バージョン管理等の上限を合わせて比較します。'], affiliateMaterialKey: 'jimdo-short' },
      { heading: 'デザイン・CMS・更新担当', body: ['Jimdoはテンプレートやブロックを基準に作るため、非制作者が更新しやすい一方、複雑なレイアウトの再現には限界があります。クリエイターはHTML・CSSを使えますが、独自コードは自己管理です。', 'Studioはノーコードで自由度の高いレイアウトとCMSを作れます。制作担当と更新担当が別の場合は、CMS項目、権限、公開フロー、バージョン履歴を設計すると強みを活かせます。'] },
      { heading: '独自ドメイン・SEO・移行', body: ['両サービスとも独自ドメイン接続は有料プランが基本です。JimdoはCreatorのドメイン接続方法が複数あり、StudioはMini以上で独自ドメイン接続と計測連携が利用できます。', 'SEOではタイトル、説明、URL、見出し、画像、サイトマップ、リダイレクト等の必要項目を比較します。サービス変更時のHTML移行ではなく、URL対応表とコンテンツ原稿を基準に再構築する前提が安全です。'] },
      { heading: '選び方', body: ['事業者本人が写真とお知らせを更新する5〜10ページのサイトはJimdo、デザイナーが制作しCMSで事例や記事を増やすサイトはStudioが適します。', '無料版で同じトップページを試作し、制作時間、スマホ調整、更新権限、公開手順、将来のページ増加を比較してください。'] },
      commonFinal
    ],
    'jimdo-vs-wordpress': [
      { heading: '結論：保守を減らすJimdo、選択肢を増やすWordPress', body: ['Jimdoはホスティング、更新基盤、編集画面が一体化し、サーバー保守を減らせます。WordPress.comもホスティング一体型ですが、プランに応じてテーマ、プラグイン、コード、ストレージ等の幅が変わります。', 'セルフホスト型WordPressはサーバー、ドメイン、テーマ、プラグインを選べる反面、更新、バックアップ、セキュリティ、障害対応を自分または保守会社で担います。'], affiliateMaterialKey: 'jimdo-software' },
      { heading: '料金と運用コスト', body: ['Jimdoはプラン料金にホスティングが含まれます。WordPress.comも有料プランで独自ドメインを接続でき、年間契約等では1年間無料のドメイン特典があります。', 'セルフホスト型はサーバー代だけで安く見えても、有料テーマ、プラグイン、制作、保守、バックアップ、復旧の費用が加わります。月額だけでなく、年間の作業時間と外注費を含めて比較します。'] },
      { heading: 'ブログ・SEO・拡張性', body: ['Jimdoクリエイターはブログ、ショップ、ページ別SEO設定を備えます。WordPressは投稿、カテゴリ、カスタム投稿、プラグイン、API等を使い、大量の記事や複雑な情報構造へ拡張しやすい仕組みです。', '数ページの会社案内であればJimdoの簡潔さが有利です。数百記事、会員、予約、学習管理、複雑なフォーム、独自データ連携を予定するならWordPress側の要件を具体化します。'] },
      { heading: 'データ所有と移行', body: ['専用ビルダーはデザインをそのまま外部へ移しにくいため、原稿と画像を別保管します。WordPressは標準エクスポートやデータベースを利用できますが、テーマやプラグイン依存部分は移行作業が必要です。', 'ドメインを外部管理に残しておくと、どちらからでも移転しやすくなります。URLを変更する場合は301リダイレクト、Search Console、サイトマップ、内部リンクを更新します。'] },
      { heading: '選び方', body: ['更新者が非技術者で、ページ数が少なく、保守を最小化したいならJimdoが候補です。コンテンツ量と機能が増え、制作・保守担当を確保できるならWordPressが候補です。', '無料試作と小規模な検証サイトを作り、更新時間、バックアップ、権限、問い合わせ、表示速度、移行手順まで比較してください。'] },
      commonFinal
    ],
    'jimdo-salon-website-guide': [
      { heading: '最初に作る7ページ', body: ['トップ、メニュー・料金、施術事例、スタッフ、店舗情報・アクセス、予約・問い合わせ、FAQ・キャンセルポリシーを基本にします。ページ数を増やすより、来店前の疑問を短い導線で解消することが重要です。', '医療行為と誤認させる表現、効果保証、根拠のないNo.1、口コミの不適切な加工を避けます。写真の使用許諾、個人情報、特定商取引法表示が必要な販売を行う場合の表示も確認します。'], affiliateMaterialKey: 'jimdo-easy' },
      { heading: 'AIビルダーとクリエイターの選択', body: ['写真と基本情報を早く公開し、ブログやショップを使わない場合はAIビルダーが候補です。施術事例やブログを継続更新し、HTML・CSSやショップ機能を使う場合はクリエイターを比較します。', '両サービスは互換性がないため、将来ブログやオンライン販売を行う可能性があるなら、初期段階でクリエイターを試す価値があります。'] },
      { heading: '予約導線を設計する', body: ['予約ボタンは各ページの同じ位置に置き、電話、LINE、予約サイト、フォームの役割を整理します。複数導線がある場合は、空き状況と予約変更の管理元を一本化し、二重予約を防ぎます。', 'Jimdoだけで複雑な予約管理を完結させる前提にせず、外部予約サービスへのリンクや埋め込みをテストします。スマートフォンでタップしやすいか、遷移後も店舗名とメニューが分かるかを確認します。'], affiliateMaterialKey: 'jimdo-short' },
      { heading: '写真・料金・アクセス', body: ['写真は外観、入口、施術スペース、スタッフ、仕上がり例を用途別に用意し、過度な加工を避けます。画像を圧縮し、代替テキストを設定します。', '料金は税込表示、所要時間、追加料金、対象条件を同じ画面にまとめます。アクセスには住所、地図、最寄駅、駐車場、建物入口、営業時間、遅刻時の扱いを掲載します。'] },
      { heading: 'ローカルSEOと更新', body: ['店舗名、地域、サービスをページタイトルと見出しに自然に含め、Googleビジネスプロフィールの名称、住所、電話番号と一致させます。地域名だけを大量に並べるページは作らず、実際の店舗情報と事例を増やします。', '月1回は料金、スタッフ、営業時間、キャンセル規定、予約リンクを点検します。閉店・移転・臨時休業の情報はサイト、SNS、地図サービスで同時に更新します。'] },
      commonFinal
    ],
    'jimdo-small-business-guide': [
      { heading: '目的と成果地点を一つに絞る', body: ['問い合わせ、予約、来店、資料請求、採用応募など、サイトの主要成果を一つ決めます。トップページでは誰向けの何のサービスか、対応地域、特徴、料金目安、次の行動をファーストビュー付近で示します。', '複数事業を一つのサイトへ詰め込む場合は、事業ごとのページと問い合わせ先を分けます。会社情報、プライバシーポリシー、広告表示、法定表示も公開前に準備します。'], affiliateMaterialKey: 'jimdo-easy' },
      { heading: '無料版で試作する', body: ['無料版でトップ、サービス、会社情報、問い合わせの4ページを作り、文章量、写真比率、スマートフォン表示、更新速度を確認します。', 'AIビルダーとクリエイターは互換性がないため、ブログ、ショップ、コード、SEO設定の必要性を考え、同じ原稿で小さな試作を比較します。'] },
      { heading: '有料化とドメイン', body: ['独自ドメインを使う段階で有料プランを選びます。AIビルダーのStart・Grow、クリエイターのPro以上について、契約期間、更新費用、ドメイン利用枠、必要機能を比較します。', '会社のドメインは代表者個人ではなく、会社管理のメールアドレスと支払い方法で取得し、管理者を複数記録します。外部メールを利用する場合はDNS接続方法を確認します。'], affiliateMaterialKey: 'jimdo-software' },
      { heading: '問い合わせと計測', body: ['フォームには必要最小限の項目を設定し、送信完了画面、通知メール、迷惑メール対策、個人情報の保存先を確認します。公開後に実際の端末から送信テストを行います。', 'アクセス解析はページ閲覧だけでなく、電話タップ、予約ボタン、フォーム完了など事業成果を計測します。毎月の問い合わせ数と検索クエリを確認し、情報不足のページを改善します。'] },
      { heading: '公開後90日の運用', body: ['公開直後はSearch Console、サイトマップ、インデックス、リンク切れ、表示崩れを確認します。30日ごとに事例、FAQ、お知らせを追加し、サービス内容と料金の変更を反映します。', 'サイトを作って終わりにせず、問い合わせ対応で繰り返し聞かれる質問をFAQへ移し、成約前に必要な情報を増やします。'] },
      commonFinal
    ],
    'jimdo-seo-guide': [
      { heading: 'SEOの結論：設定とコンテンツを分けて考える', body: ['Jimdoクリエイターではページタイトル、概要、カスタムURL、画像、サイトマップ、Search Console、高度なロボット設定等を扱えます。これらは検索エンジンへ正しく伝えるための基盤です。', '順位を得るには、利用者の質問に答える固有ページ、信頼できる事業情報、内部リンク、更新、外部評価が必要です。自動生成した薄い地域ページや同じ文章の複製は避けます。'], affiliateMaterialKey: 'jimdo-software' },
      { heading: 'ページタイトル・概要・URL', body: ['ページごとに異なるタイトルを設定し、サービス名、地域、検索者の目的を自然に含めます。概要はクリックを促す説明として、料金、対象、特徴を簡潔に書きます。', 'URLは短く意味が分かる英数字にし、公開後の変更を減らします。変更する場合はリダイレクト設定の可否を確認し、内部リンクとサイトマップを更新します。'] },
      { heading: '見出し・文章・画像', body: ['1ページに大見出しを一つ置き、H2・H3で内容を整理します。会社の強みだけでなく、対象者、料金、手順、制約、よくある質問を具体的に書きます。', '画像は表示サイズに合わせて圧縮し、内容を説明する代替テキストを付けます。写真だけで価格や重要事項を伝えず、検索とアクセシビリティのため本文にも記載します。'] },
      { heading: 'サイトマップとSearch Console', body: ['サイトマップをGoogle Search Consoleへ送信し、重要ページがインデックスされているか確認します。公開直後に検索結果へ出ないことは通常であり、同じ申請を何度も繰り返すより、クロール可能な内部リンクを整えます。', '404、重複タイトル、意図しないnoindex、古いURLへのリンクを定期点検します。Creator Businessで使える高度なnoindex等は、必要ページだけに限定します。'] },
      { heading: 'ローカルビジネスのSEO', body: ['店舗・地域サービスでは名称、住所、電話番号、営業時間をGoogleビジネスプロフィール等と一致させ、アクセス、対応地域、事例、スタッフ、FAQを掲載します。', '地域名を置き換えただけのページを量産せず、実際の店舗や提供実績に基づく内容を作ります。口コミは利用規約と広告規制に従い、選別や誇張を避けます。'], affiliateMaterialKey: 'jimdo-short' },
      commonFinal
    ],
    'best-website-builders-for-beginners': [
      { heading: '結論：初心者向けは目的別に選ぶ', body: ['短時間で小規模サイトを作るならJimdo、アプリや予約・ECを広げるならWix、デザインとCMSを作り込むならStudio、店舗案内と基本予約をまとめるならグーペ、ブログと拡張性を重視するならWordPress.comが候補です。', '最も簡単なサービスは人によって異なります。公開ページ数、更新担当、予約、商品、ブログ、独自ドメイン、移行予定を先に決めます。'], affiliateMaterialKey: 'jimdo-easy' },
      { heading: '5サービス比較', body: ['JimdoはAIビルダーとクリエイターから選びます。Wixは機能とアプリが広く、StudioはレイアウトとCMS、グーペは店舗情報と予約、WordPress.comは投稿とプラグイン等の拡張が強みです。', '無料版で試せる範囲、独自ドメインに必要なプラン、広告表示、フォーム、CMS、バックアップ、サポートを同じ条件で確認します。'], table: { headers: ['サービス', '向く用途', '主な注意点'], rows: [['Jimdo', '小規模事業・店舗サイト', 'AIとCreatorは互換性なし'], ['Wix', '予約・EC・多機能サイト', '機能追加で運用が複雑化'], ['Studio', 'デザイン・CMSサイト', 'プラン別ページ・CMS上限'], ['グーペ', '店舗情報・基本予約', '高度機能は外部連携を確認'], ['WordPress.com', 'ブログ・拡張サイト', 'プラン別機能差を確認']] }, affiliateMaterialKey: 'jimdo-software' },
      { heading: '料金の比較方法', body: ['無料プランの有無だけでなく、独自ドメイン、広告非表示、フォーム、CMS、予約、決済、アクセス解析を使うための最低プランを比較します。', '年払いの月額換算と実際の一括支払額を区別し、更新時ドメイン、追加アプリ、決済手数料、制作代行、保守費を含めて2年間の総額を出します。'] },
      { heading: 'SEOとコンテンツ運用', body: ['すべてのサービスで基本SEOは可能ですが、URL制御、リダイレクト、noindex、構造化データ、CMS、ブログ、Search Console連携の範囲が異なります。', 'SEO機能の多さより、担当者が継続して固有の事例、FAQ、料金、地域情報を更新できるかが重要です。'] },
      { heading: '無料版で行う共通テスト', body: ['同じトップページ、サービスページ、問い合わせページを各サービスで作り、制作時間、スマホ表示、ページ追加、画像圧縮、フォーム通知を比較します。', 'テスト後はドメイン所有者、管理者権限、支払い、データ保管、解約・移行手順を確認して契約します。'] },
      commonFinal
    ]
  };
  return map[slug];
}

function enSections(slug) {
  const commonFinal = {
    heading: 'Checks before a paid contract',
    body: [
      'Use the free tier to place real copy, images, navigation, and an enquiry route, then test mobile rendering and routine updates. Before upgrading, document whether the domain remains with an external registrar, the billing term, renewal date, payment owner, and cancellation process.',
      'A proprietary builder layout rarely transfers intact to another platform. Keep the original copy, images, product information, URL inventory, and legal text outside the builder, then test enquiries and analytics after every major release.'
    ],
    bullets: ['Test editing and mobile output on the free tier', 'Compare renewal and full-term cost, not only introductory pricing', 'Record domain ownership and DNS access', 'Keep copy and media outside the platform', 'Test forms and measurement after publishing']
  };
  const map = {
    'jimdo-review': [
      { heading: 'Verdict: a practical option for fast, smaller sites', body: ['Jimdo removes separate hosting and CMS installation and allows a free prototype. AI Builder suits users who want guided structure, while Creator suits users who need blogging, store tools, HTML or CSS, and more detailed SEO operations.', 'The principal constraint is that AI Builder and Creator are separate systems and content cannot be transferred directly between them. Complex booking, membership, databases, or large ecommerce requirements should trigger a comparison with Wix, Studio, WordPress, or specialist software.'] },
      { heading: 'Two products with different workflows', body: ['AI Builder uses guided questions and block editing to reduce decisions and accelerate publishing. It fits smaller operators that edit from a phone or do not have a fixed design concept.', 'Creator supports visual editing, blogging, store functions, and HTML or CSS adjustments. Because the systems are not compatible, future content, commerce, and code requirements should be decided before production begins.'] },
      { heading: 'Pricing after the 2026 revision', body: ['Jimdo bills the selected term in advance. AI Builder also has monthly contracts, while Creator uses feature-based tiers from Pro through Platinum. The relevant comparison includes the renewal domain allowance and the tier required for SEO or commerce.', 'A free site is useful for editor testing, but a business domain and removal of platform branding normally require a paid plan. Confirm the current checkout because prices, renewal conditions, and domain charges can change.'], table: enPricingTable() },
      { heading: 'Domains and search visibility', body: ['Paid plans can use a Jimdo-managed domain, a transferred domain, or a domain kept at an external registrar. If external mail must remain active, a CNAME connection may be preferable to changing nameservers, depending on the DNS design.', 'Creator help covers page titles, descriptions, URLs, images, sitemaps, and Search Console. Search performance still depends on useful pages, local business consistency, internal links, performance, and maintenance rather than the builder name.'] },
      { heading: 'Commerce and external systems', body: ['Creator includes store functionality and can present payment methods such as PayPal, Stripe, bank transfer, and cash on delivery. Provider transaction fees may be absent, but payment processing, shipping, returns, inventory, tax, and legal disclosures remain operational responsibilities.', 'For booking, membership, customer records, or complex inventory, test an external service and confirm whether important data can be exported before committing.'] },
      commonFinal
    ],
    'jimdo-pricing': [
      { heading: 'How to compare Jimdo cost', body: ['Compare the smallest plan that satisfies the required features, not the cheapest headline plan. Monthly AI Builder contracts improve flexibility but cost more over a year, while longer contracts create a larger prepaid commitment.', 'A business site should model a custom domain, platform branding, analytics, SEO controls, enquiries, blogging, and store requirements. A two-year total including renewal domain costs is more useful than a monthly equivalent.'] },
      { heading: 'AI Builder pricing', body: ['Start is JPY 1,720 monthly, JPY 15,480 for one year, and JPY 27,600 for two years. Grow is JPY 2,720 monthly, JPY 24,840 for one year, and JPY 44,640 for two years. Renewal can add the published domain allowance.', 'The A8.net program supplied for the Japanese site excludes one-month contracts from commission eligibility. Readers should choose the contract that fits their operating period rather than optimizing for publisher compensation.'] },
      { heading: 'Creator pricing', body: ['After the 2026 revision, one-year prices are JPY 18,720 for Pro, JPY 40,560 for Business, JPY 66,300 for SEO PLUS, and JPY 83,100 for Platinum. Two-year prices are JPY 31,200, JPY 71,760, JPY 123,240, and JPY 154,200.', 'Higher names do not automatically mean better value. Verify the exact SEO, store, statistics, support, code, and robots controls required by the site.'], table: enPricingTable() },
      { heading: 'Free versus paid use', body: ['The free tier is appropriate for testing the editor, templates, copy length, image ratios, and mobile output. A branded business domain requires a paid plan.', 'A free registration does not meet the supplied affiliate program’s paid-plan conversion condition, but there is no reason to skip product testing. Build a realistic prototype before selecting a term.'] },
      { heading: 'Domain and renewal cost', body: ['An initial domain benefit can be followed by renewal charges. Creator customers should confirm the basic domain cost that can be added at first renewal and the deadline to remove an unused domain option.', 'Keeping the domain with an external registrar improves portability but separates billing and DNS. Managing it inside Jimdo simplifies some setup but can reduce DNS flexibility. Decide with future email and service integrations in mind.'] },
      commonFinal
    ],
    'jimdo-ai-builder-vs-creator': [
      { heading: 'Verdict: AI Builder for speed, Creator for operational range', body: ['AI Builder reduces decisions through guided questions and blocks. Creator provides more control over structure, blogging, store functions, HTML or CSS, and SEO settings.', 'Neither is a direct upgrade of the other. Because content does not automatically move between them, define future functions before creating the production site.'] },
      { heading: 'Editing and mobile workflow', body: ['AI Builder generates a starting structure from business and objective questions. It is useful when the visual concept is not defined and routine edits happen on mobile.', 'Creator provides visual editing and broader structural control. A mobile application supports operations, but not every desktop function is necessarily available, so separate initial production from routine content updates.'] },
      { heading: 'Blogging, store, and code', body: ['Creator supports blogging, store functions, and HTML or CSS adjustments. It is the more natural option for sustained content publishing or agency-managed customization.', 'AI Builder prioritizes fast composition and does not assume a complex custom-code or data architecture. Test any embedded booking, CRM, or marketing system in a prototype.'] },
      { heading: 'SEO and analytics', body: ['Creator documentation covers titles, descriptions, custom URLs, images, sitemaps, Search Console, and advanced robots controls. Some advanced settings require an eligible higher tier.', 'AI Builder and Creator do not have identical control panels. List the required redirects, noindex rules, structured data, and analytics tags before selecting a product.'] },
      { heading: 'Decision checklist', body: ['Choose AI Builder for a compact information site that must launch quickly. Choose Creator when blogging, commerce, code, or more detailed search controls are expected.', 'Prototype the same copy and images in the relevant free environment and compare update time, mobile quality, forms, and analytics.'] },
      commonFinal
    ],
    'jimdo-vs-wix': [
      { heading: 'Verdict: focus with Jimdo, expansion with Wix', body: ['Jimdo provides two focused builder systems intended to reduce setup decisions. Wix provides a broad environment of templates, applications, CMS, bookings, ecommerce, and marketing tools.', 'A compact company or local-business site can benefit from Jimdo’s restraint. A site expected to add bookings, memberships, databases, or deeper commerce should evaluate Wix’s ecosystem.'] },
      { heading: 'Design and editing', body: ['Jimdo AI Builder uses blocks, while Creator combines visual editing with HTML or CSS. The narrower system can make it harder for non-designers to break a consistent layout.', 'Wix offers more placement and application choices, which can support detailed requirements but also creates more configuration and governance work. Multi-editor sites need templates and permission rules.'] },
      { heading: 'SEO, domains, and measurement', body: ['Jimdo Creator supports titles, descriptions, URLs, sitemaps, and Search Console workflows. Wix provides an SEO dashboard, checklist, and controls for dynamic pages.', 'Both require paid plans for custom domains. Domain registration and site subscriptions may renew separately, so record the owner, renewal date, and billing source.'] },
      { heading: 'Bookings, commerce, and integrations', body: ['Jimdo Creator includes store functions, but complex bookings or membership may require external tools. Wix provides applications such as bookings and stores within its ecosystem.', 'Additional capability is useful only when the team can maintain it. Define booking capacity, prepayment, customer records, product volume, shipping, and email needs before selecting.'] },
      { heading: 'Migration and governance', body: ['Neither proprietary layout should be assumed to migrate intact. Keep source content, media, products, customers, and URL inventories outside the service.', 'For an agency handover, document account ownership, domain control, two-factor authentication, billing, and recovery procedures.'] },
      commonFinal
    ],
    'jimdo-vs-studio': [
      { heading: 'Verdict: guided self-service or designed no-code production', body: ['Jimdo is well suited to operators who want to publish and maintain a smaller site themselves. Studio is oriented toward designed layouts, CMS models, collaboration, and plan-based page or form limits.', 'Jimdo fits a fast local-business presence. Studio should be considered for brand, recruitment, or editorial sites designed by specialists and maintained through structured CMS fields.'] },
      { heading: 'Pricing structure', body: ['Jimdo separates AI Builder and Creator plans and bills the selected term. Studio charges by website project and offers Free, Mini, Personal, Business, Business Plus, and Enterprise options.', 'Studio annual monthly equivalents begin at JPY 590 for Mini, JPY 1,190 for Personal, JPY 3,980 for Business, and JPY 9,980 for Business Plus. Compare page, CMS, form, and version-history limits rather than price alone.'] },
      { heading: 'Design, CMS, and editors', body: ['Jimdo templates and blocks support maintainability for non-designers. Creator can use HTML or CSS, but custom code is managed by the site owner.', 'Studio offers flexible no-code layout and CMS design. When production and editorial responsibilities are separate, define fields, permissions, publication steps, and version recovery.'] },
      { heading: 'Domains, SEO, and migration', body: ['Custom domains generally require paid plans in both products. Jimdo Creator supports several domain connection approaches, while Studio enables custom domains and analytics integrations from eligible plans.', 'Compare titles, descriptions, URLs, redirects, noindex controls, sitemaps, and CMS outputs. Plan migration as a content and URL rebuild rather than an export of the visual layout.'] },
      { heading: 'Selection rule', body: ['Jimdo fits a five-to-ten-page site maintained by the business owner. Studio fits a designed site with structured case studies, articles, or team production.', 'Build the same small page in each free environment and compare production time, mobile adjustments, editorial permissions, and page growth.'] },
      commonFinal
    ],
    'jimdo-vs-wordpress': [
      { heading: 'Verdict: lower maintenance or broader extensibility', body: ['Jimdo bundles hosting, updates, and editing in one managed system. WordPress.com is also managed, but plan levels determine theme, plugin, code, and storage capabilities.', 'Self-hosted WordPress expands server, theme, plugin, and data choices, while requiring responsibility for updates, backups, security, and incident recovery.'] },
      { heading: 'Cost and operating effort', body: ['Jimdo pricing includes hosting. WordPress.com paid plans can connect a custom domain and eligible annual terms include a first-year domain benefit.', 'Self-hosted WordPress can appear inexpensive at the server level, but themes, plugins, implementation, maintenance, backups, and recovery add cost. Compare annual labor and external support as well as subscriptions.'] },
      { heading: 'Publishing, SEO, and expansion', body: ['Jimdo Creator supports blogging, stores, and page-level search settings. WordPress can scale through posts, categories, custom content types, plugins, and APIs.', 'A compact company site may benefit from Jimdo simplicity. Hundreds of articles, memberships, learning systems, complex forms, or bespoke integrations may justify WordPress.'] },
      { heading: 'Data and migration', body: ['Keep source copy and images outside any proprietary builder. WordPress provides export and database options, but theme and plugin dependencies still require migration work.', 'External domain ownership helps migration from either platform. URL changes require redirects, Search Console updates, sitemaps, and internal-link corrections.'] },
      { heading: 'Selection rule', body: ['Jimdo fits nontechnical editors, fewer pages, and low maintenance. WordPress fits growing content or functions when implementation and maintenance resources are available. Assign an owner for updates, security, and recovery in either model.', 'Test routine editing, backups, permissions, forms, performance, and migration steps before choosing.'] },
      commonFinal
    ],
    'jimdo-salon-website-guide': [
      { heading: 'The seven essential pages', body: ['Start with home, services and pricing, work examples, staff, location and access, booking or enquiry, and FAQs with cancellation rules. Clear pre-visit information is more important than a large page count.', 'Avoid unsupported treatment claims, guaranteed outcomes, misleading rankings, and improperly edited reviews. Confirm photo permission, privacy obligations, and ecommerce legal disclosures where relevant.'] },
      { heading: 'Selecting AI Builder or Creator', body: ['AI Builder is a candidate when the site is primarily photographs and basic information without sustained blogging or commerce. Creator is stronger when the salon publishes cases, blogs, products, or custom code.', 'Because the two systems are not compatible, test Creator early if future editorial or online sales work is likely.'] },
      { heading: 'Booking route design', body: ['Place the booking call to action consistently and define the roles of phone, messaging, an external booking marketplace, and forms. Keep availability and booking changes in a single operational system to avoid duplicates.', 'Do not assume Jimdo alone will manage complex scheduling. Test external booking links or embeds on mobile and confirm that the destination preserves the salon and service context.'] },
      { heading: 'Photography, pricing, and access', body: ['Prepare exterior, entrance, treatment space, staff, and result images for specific purposes. Compress files, avoid excessive retouching, and add useful alternative text.', 'Present tax-inclusive prices, duration, optional charges, and eligibility together. Access information should include the address, map, station, parking, entrance, hours, and late-arrival rules.'] },
      { heading: 'Local SEO and maintenance', body: ['Keep the business name, address, telephone, and hours consistent with the Google Business Profile. Add genuine local context, service pages, staff, cases, and FAQs rather than mass-producing city-name variants.', 'Review prices, staff, hours, policies, and booking links monthly. Update closures or relocations across the site, social profiles, and map listings together.'] },
      commonFinal
    ],
    'jimdo-small-business-guide': [
      { heading: 'Choose one primary conversion', body: ['Select the primary outcome: enquiry, booking, visit, document request, or recruitment application. The first screen should identify the audience, service, location, differentiator, approximate cost, and next action.', 'Separate different businesses into clear sections and routes. Prepare company information, privacy, advertising disclosure, and any required commerce terms before launch.'] },
      { heading: 'Prototype on the free tier', body: ['Build home, service, company, and enquiry pages with real content. Test copy length, image ratios, mobile rendering, and update time.', 'Because AI Builder and Creator are not compatible, assess blogging, store, code, and SEO needs and prototype the appropriate system before committing.'] },
      { heading: 'Upgrade and connect the domain', body: ['Choose a paid plan when a custom domain is required. Compare AI Builder Start or Grow and Creator Pro or higher by term, renewal cost, domain allowance, and required features.', 'Register the company domain with a company-controlled email and payment method. Record multiple administrators and select a DNS connection that preserves required external mail.'] },
      { heading: 'Enquiries and measurement', body: ['Collect only necessary form fields and confirm completion messages, notifications, spam protection, and personal-data storage. Submit tests from real mobile devices after publishing.', 'Measure telephone taps, booking clicks, and completed forms rather than page views alone. Review enquiries and search queries monthly to identify missing information.'] },
      { heading: 'The first ninety days', body: ['Verify Search Console, sitemap discovery, indexing, broken links, and responsive issues. Add cases, FAQs, and updates, and reflect service or pricing changes promptly.', 'Convert repeated sales questions into site content so visitors can qualify themselves before contacting the business.'] },
      commonFinal
    ],
    'jimdo-seo-guide': [
      { heading: 'SEO combines controls and content', body: ['Jimdo Creator documentation includes titles, descriptions, custom URLs, images, sitemaps, Search Console, and advanced robots settings. These controls help search systems understand the site.', 'Visibility requires useful intent-matched pages, trustworthy business information, internal links, performance, and maintenance. Avoid automated thin location pages and duplicated copy. Review search queries and update pages when customer language or services change.'] },
      { heading: 'Titles, descriptions, and URLs', body: ['Create a unique title for each page using the service, location, and user objective naturally. Write a description that clarifies audience, pricing, and value rather than repeating keywords.', 'Keep URLs short and meaningful and minimize changes after publishing. When a URL changes, use supported redirects and update internal links and sitemaps.'] },
      { heading: 'Headings, copy, and images', body: ['Use one principal heading and organize content with lower-level headings. Explain audience, pricing, process, constraints, and frequent questions instead of relying on promotional claims.', 'Compress images and provide descriptive alternative text. Do not communicate essential prices or rules only inside images.'] },
      { heading: 'Sitemaps and Search Console', body: ['Submit the sitemap and inspect whether important pages are indexed. Repeated submission is less useful than crawlable internal links and unique content.', 'Review 404s, duplicate metadata, accidental noindex rules, and obsolete links. Use advanced robots settings only where a page genuinely should not appear in search.'] },
      { heading: 'Local business SEO', body: ['Keep business name, address, telephone, and hours consistent with map and directory listings. Publish access, service areas, cases, staff, and FAQs.', 'Do not generate pages by replacing only a city name. Use real locations and verified service experience, and handle reviews under the relevant platform and advertising rules.'] },
      commonFinal
    ],
    'best-website-builders-for-beginners': [
      { heading: 'Verdict: select by the operating model', body: ['Jimdo fits fast smaller sites, Wix fits broader apps and bookings, Studio fits designed no-code CMS sites, Goope fits Japanese local-business information and basic booking, and WordPress.com fits editorial growth and extensibility.', 'Ease is contextual. Define page count, editors, bookings, products, blogging, domain ownership, and future migration before selecting.'] },
      { heading: 'Five options compared', body: ['Jimdo offers AI Builder and Creator. Wix provides a broad application ecosystem. Studio focuses on design and CMS. Goope structures local business information and booking. WordPress.com provides publishing and plan-based plugin capabilities.', 'Compare the free tier, custom-domain requirements, platform branding, forms, CMS, backups, and support under the same scenario.'], table: { headers: ['Service', 'Best fit', 'Primary check'], rows: [['Jimdo', 'Small business and local sites', 'AI Builder and Creator are separate'], ['Wix', 'Booking, ecommerce, and feature-rich sites', 'Complexity grows with apps'], ['Studio', 'Designed CMS sites', 'Page and CMS limits by plan'], ['Goope', 'Local information and basic booking', 'Validate advanced integrations'], ['WordPress.com', 'Publishing and expansion', 'Plan-specific features']] } },
      { heading: 'Cost comparison method', body: ['Compare the minimum plan for custom domains, removal of branding, forms, CMS, booking, payments, and analytics. Distinguish monthly equivalents from the actual prepaid invoice.', 'Build a two-year total including domains, applications, payment processing, implementation, and maintenance.'] },
      { heading: 'SEO and editorial operations', body: ['All five can support basic search visibility, but URL control, redirects, noindex, structured data, CMS, blogging, and Search Console workflows differ.', 'The practical advantage is the system the team can use to publish unique cases, FAQs, pricing, and local information consistently.'] },
      { heading: 'Common free-tier test', body: ['Build the same home, service, and enquiry pages. Compare production time, mobile rendering, page creation, image handling, and notification delivery.', 'Then document domain ownership, administration, billing, data retention, cancellation, and migration before paying.'] },
      commonFinal
    ]
  };
  return map[slug];
}

function sourcesFor(slug, lang) {
  const base = lang === 'ja' ? jimdoSourcesJa : jimdoSourcesEn;
  const extra = [];
  if (slug === 'jimdo-vs-wix' || slug === 'best-website-builders-for-beginners') extra.push(...competitorSources.wix);
  if (slug === 'jimdo-vs-studio' || slug === 'best-website-builders-for-beginners') extra.push(...competitorSources.studio);
  if (slug === 'jimdo-vs-wordpress' || slug === 'best-website-builders-for-beginners') extra.push(...competitorSources.wordpress);
  return [...base, ...extra];
}

function affiliateKeyFor(slug) {
  if (['jimdo-review', 'jimdo-pricing', 'jimdo-seo-guide'].includes(slug)) return 'jimdo-short';
  if (['jimdo-ai-builder-vs-creator', 'jimdo-vs-wix', 'jimdo-vs-studio', 'jimdo-vs-wordpress', 'best-website-builders-for-beginners'].includes(slug)) return 'jimdo-software';
  return 'jimdo-easy';
}

function faqs(lang, slug) {
  const jaBase = [
    { question: 'Jimdoは無料で使い続けられますか？', answer: '無料プランがあります。独自ドメインや事業利用に必要な機能を使う場合は有料プランを比較してください。' },
    { question: 'AIビルダーからクリエイターへサイトを移せますか？', answer: '両サービスは別システムで互換性がなく、サイト内コンテンツをそのまま移動・複製できません。作成前に必要機能を確認してください。' },
    { question: 'Jimdoの料金は毎月払いですか？', answer: '有料プランは1か月、1年、2年などの契約期間があり、選択した期間分が請求されます。クリエイターの提供期間はプランにより異なるため申込画面を確認してください。' },
    { question: '独自ドメインは使えますか？', answer: '有料プランではJimdoで取得・移管する方法と、外部で管理するドメインを接続する方法があります。メールやDNS要件も確認してください。' }
  ];
  const enBase = [
    { question: 'Can Jimdo be used for free?', answer: 'Jimdo provides free plans for testing and basic publishing. A custom domain and business-oriented functions require an appropriate paid plan.' },
    { question: 'Can a site move from AI Builder to Creator?', answer: 'The products are separate and content cannot be directly copied or transferred between them. Select the system after reviewing future requirements.' },
    { question: 'Is Jimdo billed monthly?', answer: 'Available terms include monthly, one-year, and two-year options depending on the product and plan. The selected term is billed according to the current checkout conditions.' },
    { question: 'Can Jimdo use a custom domain?', answer: 'Paid plans can use domains registered or transferred through Jimdo or domains kept with an external registrar. Confirm DNS and email requirements.' }
  ];
  if (slug === 'jimdo-seo-guide') {
    return lang === 'ja' ? [jaBase[3], { question: 'JimdoだけでSEO順位は上がりますか？', answer: 'サービスを選ぶだけでは順位は決まりません。検索意図に合う固有コンテンツ、内部リンク、地域情報、表示品質、継続更新が必要です。' }, { question: 'サイトマップをSearch Consoleへ送れますか？', answer: 'ジンドゥークリエイターの公式サポートではサイトマップとGoogle Search Consoleの設定手順が案内されています。' }] : [enBase[3], { question: 'Does Jimdo guarantee SEO rankings?', answer: 'No builder guarantees rankings. Useful content, information architecture, local consistency, internal links, performance, and ongoing updates are required.' }, { question: 'Can a Jimdo sitemap be submitted to Search Console?', answer: 'Jimdo Creator documentation provides sitemap and Google Search Console workflows.' }];
  }
  return (lang === 'ja' ? jaBase : enBase).slice(0, 3);
}

function makeArticle(route, lang) {
  const ja = lang === 'ja';
  const related = (ja ? relatedJa : relatedEn).filter((link) => !link.url.includes(`/${route.slug}/`)).slice(0, 8);
  return {
    id: `${route.slug}-${lang}`,
    translationKey: route.slug,
    language: lang,
    type: route.type,
    status: 'published',
    slug: route.slug,
    category: 'website-builders',
    topic: 'website-builders',
    badge: ja ? '広告掲載・公式情報検証' : 'Official sources reviewed',
    title: ja ? route.jaTitle : route.enTitle,
    metaTitle: ja ? route.jaTitle : route.enTitle,
    description: ja ? route.jaDescription : route.enDescription,
    lead: ja ? route.jaLead : route.enLead,
    publishedAt: date,
    updatedAt: date,
    verifiedAt: date,
    author: ja ? 'Luqevora.com編集部' : 'Luqevora.com Editorial Team',
    featured: true,
    affiliateDisclosure: ja,
    ctas: [{
      label: ja ? 'Jimdoの公式プランを確認' : 'Check Jimdo Japan official plans',
      officialUrl: official,
      affiliateKey: ja ? affiliateKeyFor(route.slug) : 'jimdo-official'
    }],
    sources: sourcesFor(route.slug, lang),
    sections: ja ? jaSections(route.slug) : enSections(route.slug),
    faqs: faqs(lang, route.slug),
    relatedLinks: related
  };
}

for (const route of routes) {
  for (const lang of ['ja', 'en']) {
    const article = makeArticle(route, lang);
    const out = path.join(articleRoot, lang, `${route.slug}.json`);
    fs.writeFileSync(out, `${JSON.stringify(article, null, 2)}\n`);
  }
}

const affiliatePath = path.join(root, 'content/config/affiliates.json');
const affiliates = JSON.parse(fs.readFileSync(affiliatePath, 'utf8'));
const rawLinks = {
  'jimdo-short': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+3HMI6Y+OFG+TRVYQ" rel="nofollow">ジンドゥー</a>\n<img border="0" width="1" height="1" src="https://www18.a8.net/0.gif?a8mat=4B8452+3HMI6Y+OFG+TRVYQ" alt="">',
  'jimdo-software': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+3HMI6Y+OFG+TWLPU" rel="nofollow">ホームページ作成ソフト【ジンドゥー】</a>\n<img border="0" width="1" height="1" src="https://www16.a8.net/0.gif?a8mat=4B8452+3HMI6Y+OFG+TWLPU" alt="">',
  'jimdo-easy': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+3HMI6Y+OFG+TWTFM" rel="nofollow">ありえないほど簡単にホームページができる【ジンドゥー】</a>\n<img border="0" width="1" height="1" src="https://www13.a8.net/0.gif?a8mat=4B8452+3HMI6Y+OFG+TWTFM" alt="">'
};
for (const [key, rawHtml] of Object.entries(rawLinks)) {
  affiliates.links[key] = {
    type: 'rawHtml', network: 'A8.net', programId: 's00000003166005', language: 'ja', destination: official, rawHtml
  };
}
affiliates.links['jimdo-official'] = { type: 'official', network: 'Official', language: 'en', destination: official, url: official };
fs.writeFileSync(affiliatePath, `${JSON.stringify(affiliates, null, 2)}\n`);

const seoPath = path.join(root, 'content/config/seo.json');
const seo = JSON.parse(fs.readFileSync(seoPath, 'utf8'));
for (const route of routes) {
  for (const lang of ['ja', 'en']) {
    const source = `content/articles/${lang}/${route.slug}.json`;
    if (!seo.indexing.includeSourceFiles.includes(source)) seo.indexing.includeSourceFiles.push(source);
  }
}
if (!seo.indexing.priorityProducts.includes('jimdo')) seo.indexing.priorityProducts.push('jimdo');
fs.writeFileSync(seoPath, `${JSON.stringify(seo, null, 2)}\n`);

const homePath = path.join(root, 'content/config/home.json');
const home = JSON.parse(fs.readFileSync(homePath, 'utf8'));
home.featuredComparisons = ['jimdo-vs-wix', 'jimdo-vs-studio', 'jimdo-vs-wordpress', 'shin-rental-server-vs-xserver', 'color-me-shop-vs-shopify'];
home.featuredReviews = ['jimdo-review', 'jimdo-ai-builder-vs-creator', 'jimdo-pricing', 'shin-rental-server-review', 'color-me-shop-review', 'goope-review'];
fs.writeFileSync(homePath, `${JSON.stringify(home, null, 2)}\n`);

const categoryPath = path.join(root, 'content/config/categories.json');
const categories = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));
const website = categories.find((category) => category.id === 'website-builders');
website.description.ja = 'AIホームページ作成、ノーコード、店舗サイト、ネットショップを、料金・SEO・独自ドメイン・更新性・決済・移行性から比較します。';
website.description.en = 'Compare AI website builders, no-code tools, local-business sites, and ecommerce by pricing, SEO, domains, maintainability, payments, and portability.';
fs.writeFileSync(categoryPath, `${JSON.stringify(categories, null, 2)}\n`);

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.version = '1.18.0';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

const sitePath = path.join(root, 'content/config/site.json');
const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
site.assetVersion = '4.9.0';
site.defaultVerifiedAt = date;
fs.writeFileSync(sitePath, `${JSON.stringify(site, null, 2)}\n`);

const profilePath = path.join(root, 'content/article-batches/product-profiles-expansion.json');
const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
profiles.jimdo = {
  name: 'Jimdo', affiliateKey: 'jimdo-short', sources: jimdoSourcesJa,
  positioning: { ja: 'AIビルダーとクリエイターを選べる、個人・小規模事業向けクラウド型ホームページ作成サービス', en: 'A cloud website builder for individuals and small businesses with separate AI Builder and Creator products' },
  pricing: { ja: 'AIビルダーStartは1年15,480円、Creator Proは1年18,720円から。2026年改定後の更新条件を確認', en: 'AI Builder Start is JPY 15,480 yearly and Creator Pro is JPY 18,720 yearly; verify 2026 renewal terms' },
  pricingDetail: { ja: '契約期間分の請求、更新時ドメイン費用、必要なSEO・ショップ・コード機能を含めて比較します。', en: 'Compare full-term billing, renewal domain cost, and the tier required for SEO, commerce, and code.' },
  workflow: { ja: 'AIビルダーは質問とブロックで作成し、クリエイターは見たまま編集、ブログ、ショップ、HTML・CSSを使います。', en: 'AI Builder uses guided questions and blocks; Creator adds visual editing, blogging, stores, and HTML or CSS.' },
  bestFor: { ja: 'サーバー保守をせず、自分で小規模な会社・店舗・ポートフォリオサイトを更新したい利用者', en: 'Users who want to maintain a smaller company, local-business, or portfolio site without server administration' },
  strengths: { ja: ['無料版で試作', '作成方法を2系統から選択', 'ホスティング一体型', '独自ドメイン・SEO・ショップ対応'], en: ['Free prototyping', 'Two distinct building workflows', 'Managed hosting', 'Domains, SEO, and store support'] },
  limits: { ja: ['AIビルダーとクリエイターは互換性なし', '更新時ドメイン費用を確認', '高度機能はプラン差', '専用レイアウトの外部移行は限定的'], en: ['No AI Builder-Creator compatibility', 'Renewal domain cost', 'Advanced features vary by plan', 'Limited layout portability'] }
};
fs.writeFileSync(profilePath, `${JSON.stringify(profiles, null, 2)}\n`);

for (const lang of ['ja', 'en']) {
  const dir = path.join(articleRoot, lang);
  const additions = (lang === 'ja' ? relatedJa : relatedEn).slice(0, 6);
  const newFiles = new Set(routes.map((route) => `${route.slug}.json`));
  for (const filename of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    if (newFiles.has(filename)) continue;
    const file = path.join(dir, filename);
    let article;
    try { article = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    if (article.category !== 'website-builders' && article.topic !== 'website-builders' && article.topic !== 'ecommerce-platforms') continue;
    article.relatedLinks = Array.isArray(article.relatedLinks) ? article.relatedLinks : [];
    const urls = new Set(article.relatedLinks.map((link) => link.url));
    for (const link of additions) {
      if (!urls.has(link.url)) { article.relatedLinks.push(link); urls.add(link.url); }
    }
    article.relatedLinks = article.relatedLinks.slice(0, 10);
    fs.writeFileSync(file, `${JSON.stringify(article, null, 2)}\n`);
  }
}

const qa = `# QA — v1.18.0 Jimdo\n\n## Scope\n- Added 10 Japanese and 10 English Jimdo articles.\n- Registered three user-supplied A8.net text materials without changing tracking URLs or pixels.\n- Added official-link fallback for English pages.\n- Updated homepage features, website-builder category copy, priority indexing, product profile, related links, sitemap/RSS/search inputs, package version, and asset version.\n\n## New routes\n${routes.map((route) => `- /ja/website-builders/${route.slug}/\n- /en/website-builders/${route.slug}/`).join('\n')}\n\n## Evidence policy\n- Jimdo pricing uses official pages and the 2026 price revision checked on 2026-07-19.\n- AI Builder and Creator are described as separate, non-compatible systems.\n- Affiliate-program PR copy was not copied into editorial paragraphs.\n- The phrase \"ありえないほど簡単\" remains inside the supplied advertising material only.\n- Competitor comparisons use provider-owned documentation.\n\n## Affiliate materials\n- Program ID: s00000003166005\n- Keys: jimdo-short, jimdo-software, jimdo-easy\n- Japanese pages use A8.net materials with advertising disclosure.\n- English pages use the official Jimdo Japan destination only.\n\n## Validation\nRun: npm run check\n`;
fs.writeFileSync(path.join(root, 'docs/QA_V1.18_JIMDO.md'), qa);

console.log(`Added ${routes.length * 2} Jimdo articles and updated v1.18.0 configuration.`);
