import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleRoot = path.join(root, 'content/articles');
const date = '2026-07-19';
const official = 'https://www.shin-server.jp/';

const shinSourcesJa = [
  { label: 'シンレンタルサーバー公式サイト', url: 'https://www.shin-server.jp/' },
  { label: 'シンレンタルサーバー 料金', url: 'https://www.shin-server.jp/service/price.php' },
  { label: 'シンレンタルサーバー 機能一覧', url: 'https://www.shin-server.jp/service/functions.php' },
  { label: 'シンレンタルサーバー 特長', url: 'https://www.shin-server.jp/service/feature.php' },
  { label: 'シンレンタルサーバー ビジネスプラン', url: 'https://www.shin-server.jp/service/business.php' },
  { label: 'シンレンタルサーバー 自動バックアップ', url: 'https://www.shin-server.jp/service/detail_backup.php' },
  { label: 'WordPressクイックスタート FAQ', url: 'https://www.shin-server.jp/support/faq/contract_new_wordpress_plan.php' },
  { label: 'WordPress簡単移行マニュアル', url: 'https://www.shin-server.jp/support/manual/man_install_transfer_wp.php' },
  { label: 'シンレンタルサーバー 利用規約', url: 'https://www.shin-server.jp/rule.php' }
];

const shinSourcesEn = shinSourcesJa.map((source) => ({
  label: source.label
    .replace('シンレンタルサーバー', 'Shin Rental Server')
    .replace('料金', 'Pricing')
    .replace('機能一覧', 'Feature list')
    .replace('特長', 'Service features')
    .replace('ビジネスプラン', 'Business plans')
    .replace('自動バックアップ', 'Automatic backups')
    .replace('利用規約', 'Terms of service')
    .replace('マニュアル', 'manual'),
  url: source.url
}));

const competitorSources = {
  xserver: [
    { label: 'エックスサーバー 料金', url: 'https://www.xserver.ne.jp/price/' },
    { label: 'エックスサーバー 自動バックアップ', url: 'https://www.xserver.ne.jp/functions/service_backup.php' },
    { label: 'エックスサーバー WordPress運用機能', url: 'https://www.xserver.ne.jp/feature/wordpress_reasons.php' }
  ],
  conoha: [
    { label: 'ConoHa WING 料金', url: 'https://www.conoha.jp/pricing/' },
    { label: 'ConoHa WING リソース', url: 'https://www.conoha.jp/wing/function/resource/' },
    { label: 'ConoHa WING ビジネスプラン', url: 'https://www.conoha.jp/wing/business/' }
  ],
  lolipop: [
    { label: 'ロリポップ！料金', url: 'https://lolipop.jp/pricing/' },
    { label: 'ロリポップ！機能一覧', url: 'https://lolipop.jp/service/specs/' },
    { label: 'ロリポップ！サーバー仕様', url: 'https://lolipop.jp/service/server-spec/' }
  ],
  mixhost: [
    { label: 'mixhost公式サイト・料金', url: 'https://mixhost.jp/' },
    { label: 'mixhost更新料金改定', url: 'https://mixhost.jp/news/1736' },
    { label: 'mixhost利用規約', url: 'https://mixhost.jp/tos/' }
  ]
};

const routes = [
  {
    slug: 'shin-rental-server-review',
    type: 'review',
    jaTitle: 'シンレンタルサーバーレビュー｜料金・速度・注意点【2026年】',
    enTitle: 'Shin Rental Server Review: Pricing, Performance, and Limits (2026)',
    jaDescription: 'シンレンタルサーバーを公式情報で検証。料金、容量、WordPress、バックアップ、独自ドメイン、ビジネスプラン、試用条件と注意点を解説します。',
    enDescription: 'An official-source review of Shin Rental Server covering pricing, storage, WordPress, backups, domains, business plans, trial conditions, and operational limits.',
    jaLead: 'シンレンタルサーバーは、NVMeストレージ、大容量プラン、WordPress支援機能、14日分の自動バックアップを備えた国内共用レンタルサーバーです。広告上の速度表現だけでなく、通常料金、契約期間、移行条件、復旧手順まで確認して評価します。',
    enLead: 'Shin Rental Server is a Japan-focused shared hosting service built around NVMe storage, large plan capacities, WordPress workflows, and fourteen-day automatic backups. This review separates promotional performance claims from contract, migration, and recovery requirements.'
  },
  {
    slug: 'shin-rental-server-pricing',
    type: 'guide',
    jaTitle: 'シンレンタルサーバー料金・プラン比較｜通常版とビジネス版',
    enTitle: 'Shin Rental Server Pricing: Standard and Business Plans Compared',
    jaDescription: 'シンレンタルサーバーの通常プランとビジネスプランを比較。月額換算、一括前払い、更新料金、容量、CPU・メモリ、選び方を整理します。',
    enDescription: 'Compare Shin Rental Server standard and business plans by monthly equivalent, prepayment, renewal cost, storage, CPU, memory, and operational fit.',
    jaLead: '料金比較ではキャンペーンの実質価格ではなく、通常の契約更新料金と契約期間分の一括前払いを基準にします。必要以上に上位プランへ上げず、容量、同時処理、運用人数、復旧要件から選びます。',
    enLead: 'A reliable cost model should use normal renewal pricing and the full prepaid contract amount rather than temporary effective discounts. Plan selection should follow capacity, concurrent workload, administration, and recovery needs.'
  },
  {
    slug: 'shin-rental-server-wordpress',
    type: 'guide',
    jaTitle: 'シンレンタルサーバーでWordPressを始める方法と移行手順',
    enTitle: 'Using Shin Rental Server for WordPress: Setup and Migration Guide',
    jaDescription: 'WordPressクイックスタート、簡単インストール、簡単移行、SSL、バックアップ、DNS切替、移行対象外データと公開前チェックを解説します。',
    enDescription: 'A practical guide to WordPress Quick Start, installation, migration, SSL, backups, DNS cutover, excluded data, and pre-launch checks on Shin Rental Server.',
    jaLead: '新規サイトはWordPressクイックスタート、既存サイトはWordPress簡単移行を利用できます。ただしクイックスタートでは10日間無料のお試しが付かず、簡単移行にも容量や構成の制限があります。',
    enLead: 'New sites can use WordPress Quick Start, while existing sites can use the migration tool. Quick Start does not include the ten-day trial, and automated migration has version, size, and architecture limits.'
  },
  {
    slug: 'shin-rental-server-pros-cons',
    type: 'review',
    jaTitle: 'シンレンタルサーバーのメリット・デメリット｜契約前の確認事項',
    enTitle: 'Shin Rental Server Pros and Cons: Checks Before You Contract',
    jaDescription: 'シンレンタルサーバーの利点と注意点を、性能、容量、WordPress、バックアップ、サポート、契約更新、試用、移行の観点から整理します。',
    enDescription: 'Assess Shin Rental Server advantages and constraints across performance, storage, WordPress, backups, support, renewal, trial, and migration.',
    jaLead: '長所は大容量・WordPress運用・バックアップ・独自ドメイン特典を一つの契約にまとめやすい点です。一方で長期契約は一括前払いで、速度No.1等の表現は自社測定条件を確認する必要があります。',
    enLead: 'The service combines large storage, WordPress operations, backups, and domain benefits in one contract. Its trade-offs include prepaid long terms and performance claims that must be read with their provider-defined test conditions.'
  },
  {
    slug: 'shin-rental-server-vs-xserver',
    type: 'comparison',
    jaTitle: 'シンレンタルサーバーとエックスサーバーを比較｜違いと選び方',
    enTitle: 'Shin Rental Server vs XServer: Differences and Selection Guide',
    jaDescription: 'シンレンタルサーバーとエックスサーバーを、通常料金、容量、WordPress、無料お試し、バックアップ、ドメイン、運用実績から比較します。',
    enDescription: 'Compare Shin Rental Server and XServer by normal pricing, storage, WordPress workflow, trials, backups, domains, and operational maturity.',
    jaLead: '両サービスは同じエックスサーバー株式会社が提供し、WordPress簡単移行や14日分の自動バックアップなど共通点があります。価格差だけでなく、サービスの位置づけ、プラン構成、検証重視か実績重視かで選びます。',
    enLead: 'Both services are operated by XServer Inc. and share workflows such as WordPress migration and fourteen-day backups. The practical distinction is not price alone, but product positioning, plan structure, experimentation, and operational maturity.'
  },
  {
    slug: 'shin-rental-server-vs-conoha-wing',
    type: 'comparison',
    jaTitle: 'シンレンタルサーバーとConoHa WINGを比較｜料金・契約の違い',
    enTitle: 'Shin Rental Server vs ConoHa WING: Pricing and Contract Differences',
    jaDescription: 'シンレンタルサーバーとConoHa WINGを、料金体系、通常課金、WINGパック、容量、CPU・メモリ、ドメイン、WordPressから比較します。',
    enDescription: 'Compare Shin Rental Server and ConoHa WING by billing model, WING Pack, storage, CPU, memory, domain benefits, and WordPress workflow.',
    jaLead: 'シンレンタルサーバーは契約期間ごとの一括前払い、ConoHa WINGは長期契約のWINGパックに加えて時間単位の通常料金を選べます。短期検証と長期運用のどちらを優先するかが大きな分岐点です。',
    enLead: 'Shin Rental Server uses prepaid contract terms, while ConoHa WING offers both long-term WING Pack contracts and hourly standard billing with monthly caps. The key decision is whether short-term flexibility or long-term commitment matters more.'
  },
  {
    slug: 'shin-rental-server-vs-lolipop',
    type: 'comparison',
    jaTitle: 'シンレンタルサーバーとロリポップ！を比較｜初心者向けの選び方',
    enTitle: 'Shin Rental Server vs Lolipop: A Beginner-Focused Comparison',
    jaDescription: 'シンレンタルサーバーとロリポップ！を、料金、プラン幅、LiteSpeed、容量、WordPress、バックアップ、電話サポートから比較します。',
    enDescription: 'Compare Shin Rental Server and Lolipop by pricing, plan range, LiteSpeed, storage, WordPress, backups, and support.',
    jaLead: 'ロリポップ！は低価格プランから法人向けまで段階が細かく、シンレンタルサーバーはベーシックから大容量・高リソースを提供します。最安値ではなく、WordPressに必要なプラン同士で比較します。',
    enLead: 'Lolipop spans very low-cost entry plans through business-oriented tiers, while Shin Rental Server starts with a larger resource profile. Compare plans that actually support the intended WordPress workload rather than headline minimum prices.'
  },
  {
    slug: 'shin-rental-server-vs-mixhost',
    type: 'comparison',
    jaTitle: 'シンレンタルサーバーとmixhostを比較｜更新料金・機能の違い',
    enTitle: 'Shin Rental Server vs mixhost: Renewal Cost and Feature Differences',
    jaDescription: 'シンレンタルサーバーとmixhostを、初回料金と更新料金、WordPress、移行、LiteSpeed、バックアップ、返金保証から比較します。',
    enDescription: 'Compare Shin Rental Server and mixhost by introductory and renewal cost, WordPress, migration, LiteSpeed, backups, and refund conditions.',
    jaLead: 'mixhostは初回割引と更新料金が明確に分かれ、LiteSpeed CacheやWordPress管理機能を訴求しています。シンレンタルサーバーは通常更新料金を軸に、大容量とエックスサーバー系の管理機能を比較します。',
    enLead: 'mixhost separates introductory and renewal prices and emphasizes LiteSpeed Cache plus WordPress management tools. Shin Rental Server is better evaluated around standard renewal pricing, large storage, and the XServer-family administration model.'
  },
  {
    slug: 'best-wordpress-hosting-japan',
    type: 'comparison',
    jaTitle: 'WordPress向け国内レンタルサーバー比較｜5社の選び方【2026年】',
    enTitle: 'Best WordPress Hosting in Japan: Five Services Compared (2026)',
    jaDescription: 'シンレンタルサーバー、エックスサーバー、ConoHa WING、ロリポップ！、mixhostを料金、移行、バックアップ、速度機能、契約条件で比較します。',
    enDescription: 'Compare five Japan-focused WordPress hosts by pricing, migration, backups, performance tooling, domains, and contract structure.',
    jaLead: '国内WordPressサーバーは、各社が高速性を訴求しているため、広告上の速度順位だけでは選べません。復元可能なバックアップ、移行制限、更新料金、管理画面、サポート、契約解除の柔軟性を同じ表で比較します。',
    enLead: 'Most Japan-focused WordPress hosts promote speed, so a selection should not rely on a provider ranking alone. Compare recoverable backups, migration limits, renewal pricing, administration, support, and contract flexibility.'
  },
  {
    slug: 'best-japanese-web-hosting',
    type: 'comparison',
    jaTitle: '国内レンタルサーバーおすすめ比較｜用途別に選ぶ基準【2026年】',
    enTitle: 'Best Japanese Web Hosting: Selection by Use Case (2026)',
    jaDescription: 'ブログ、法人サイト、複数サイト、短期検証、LiteSpeed利用など用途別に、国内レンタルサーバーの比較基準とおすすめ候補を整理します。',
    enDescription: 'A use-case framework for Japanese web hosting covering blogs, business sites, multiple sites, short trials, LiteSpeed, backups, and migration.',
    jaLead: 'おすすめは一社に固定できません。長期ブログ、法人サイト、制作会社の複数サイト、短期テスト、LiteSpeed利用など、用途ごとに必要な契約条件と運用機能が異なります。',
    enLead: 'There is no single best host for every project. Long-term blogs, business sites, agency portfolios, short tests, and LiteSpeed-based operations require different contract and administration choices.'
  }
];

const relatedJa = [
  { label: 'シンレンタルサーバーレビュー', url: '/ja/hosting-security/shin-rental-server-review/', description: '料金・機能・注意点を公式情報で確認' },
  { label: 'シンレンタルサーバー料金比較', url: '/ja/hosting-security/shin-rental-server-pricing/', description: '通常版とビジネス版を比較' },
  { label: 'WordPress設定・移行ガイド', url: '/ja/hosting-security/shin-rental-server-wordpress/', description: '新規設置と移行手順を確認' },
  { label: 'メリット・デメリット', url: '/ja/hosting-security/shin-rental-server-pros-cons/', description: '契約前の判断材料を整理' },
  { label: 'シンレンタルサーバーとエックスサーバー', url: '/ja/hosting-security/shin-rental-server-vs-xserver/', description: '同一運営会社の2サービスを比較' },
  { label: 'シンレンタルサーバーとConoHa WING', url: '/ja/hosting-security/shin-rental-server-vs-conoha-wing/', description: '料金体系と運用方法を比較' },
  { label: 'シンレンタルサーバーとロリポップ！', url: '/ja/hosting-security/shin-rental-server-vs-lolipop/', description: '初心者向けプランを比較' },
  { label: 'シンレンタルサーバーとmixhost', url: '/ja/hosting-security/shin-rental-server-vs-mixhost/', description: '更新料金とWordPress機能を比較' },
  { label: 'WordPress向け国内サーバー比較', url: '/ja/hosting-security/best-wordpress-hosting-japan/', description: '国内5サービスを横断比較' },
  { label: '国内レンタルサーバーおすすめ比較', url: '/ja/hosting-security/best-japanese-web-hosting/', description: '用途別の選び方を確認' },
  { label: '法人向けレンタルサーバー比較', url: '/ja/hosting-security/business-web-hosting-comparison/', description: '法人運用の要件を比較' },
  { label: 'JETBOYレビュー', url: '/ja/hosting-security/jetboy-review/', description: 'LiteSpeedとcPanelの候補を確認' }
];

const relatedEn = relatedJa.map((link) => ({
  label: link.label
    .replace('シンレンタルサーバーレビュー', 'Shin Rental Server review')
    .replace('シンレンタルサーバー料金比較', 'Shin Rental Server pricing')
    .replace('WordPress設定・移行ガイド', 'WordPress setup and migration guide')
    .replace('メリット・デメリット', 'Pros and cons')
    .replace('シンレンタルサーバーとエックスサーバー', 'Shin Rental Server vs XServer')
    .replace('シンレンタルサーバーとConoHa WING', 'Shin Rental Server vs ConoHa WING')
    .replace('シンレンタルサーバーとロリポップ！', 'Shin Rental Server vs Lolipop')
    .replace('シンレンタルサーバーとmixhost', 'Shin Rental Server vs mixhost')
    .replace('WordPress向け国内サーバー比較', 'WordPress hosting in Japan')
    .replace('国内レンタルサーバーおすすめ比較', 'Japanese web hosting comparison')
    .replace('法人向けレンタルサーバー比較', 'Business web hosting comparison')
    .replace('JETBOYレビュー', 'JETBOY review'),
  url: link.url.replace('/ja/', '/en/'),
  description: link.description
    .replace('料金・機能・注意点を公式情報で確認', 'Review pricing, features, and constraints')
    .replace('通常版とビジネス版を比較', 'Compare standard and business plans')
    .replace('新規設置と移行手順を確認', 'Review setup and migration steps')
    .replace('契約前の判断材料を整理', 'Review pre-contract trade-offs')
    .replace('同一運営会社の2サービスを比較', 'Compare two services from the same operator')
    .replace('料金体系と運用方法を比較', 'Compare billing and operations')
    .replace('初心者向けプランを比較', 'Compare beginner-oriented choices')
    .replace('更新料金とWordPress機能を比較', 'Compare renewal cost and WordPress tooling')
    .replace('国内5サービスを横断比較', 'Compare five Japan-focused services')
    .replace('用途別の選び方を確認', 'Choose by use case')
    .replace('法人運用の要件を比較', 'Compare business hosting requirements')
    .replace('LiteSpeedとcPanelの候補を確認', 'Review a LiteSpeed and cPanel option')
}));

function planTableJa() {
  return {
    headers: ['プラン', '36か月契約の通常月額換算', 'vCPU・メモリ', 'NVMe容量'],
    rows: [
      ['ベーシック', '1,078円', '6コア・8GB', '700GB'],
      ['スタンダード', '2,002円', '8コア・12GB', '1,000GB'],
      ['プレミアム', '4,004円', '10コア・16GB', '1,200GB']
    ]
  };
}

function planTableEn() {
  return {
    headers: ['Plan', 'Normal 36-month equivalent', 'vCPU and memory', 'NVMe storage'],
    rows: [
      ['Basic', 'JPY 1,078', '6 cores and 8 GB', '700 GB'],
      ['Standard', 'JPY 2,002', '8 cores and 12 GB', '1,000 GB'],
      ['Premium', 'JPY 4,004', '10 cores and 16 GB', '1,200 GB']
    ]
  };
}

function commonJaSections() {
  return [
    {
      heading: '基本仕様と料金の読み方',
      body: [
        '通常プランはベーシック、スタンダード、プレミアムの3段階です。公式機能一覧では36か月契約時の通常月額換算が1,078円、2,002円、4,004円と案内されています。表示される月額は契約期間分を月割りした金額で、支払いは契約期間分の一括前払いです。',
        'キャンペーンでは割引やキャッシュバックが行われますが、更新時の負担を判断するには通常の更新料金を基準にします。初年度の実質価格だけでなく、2回目以降の支払額、ドメイン特典の維持条件、解約手続きの期限まで確認してください。'
      ],
      table: planTableJa()
    },
    {
      heading: 'WordPressと移行機能',
      body: [
        '新規契約時のWordPressクイックスタートは、WordPress設置、独自SSL設定、ドメイン取得・設定をまとめて行います。ただし申込みと同時に料金が発生し、10日間無料のお試しは利用できません。無料期間で管理画面を確認したい場合は通常申込みとの違いを理解して選びます。',
        'WordPress簡単移行は、移行元URLとログイン情報を使って他社サーバーから移行する機能です。マルチサイト、2GBを超えるデータベース、WordPress.com、特殊な本体構成などは対象外になる場合があります。.htaccessやwp-content外のデータも自動移行されないため、公開前に差分を確認します。'
      ]
    },
    {
      heading: 'バックアップと復旧',
      body: [
        '全プランでWeb・メールデータとMySQLデータベースを1日1回保存し、過去14日分を保持すると案内されています。自動取得されていても、復元対象、復元単位、反映時間、DNSや外部ストレージのデータは別管理です。',
        '更新前、テーマ変更前、プラグイン追加前、移行前には、サーバー側バックアップとは別に自分でもファイルとデータベースを取得します。バックアップが存在することと、必要時間内に復元できることは別なので、テスト環境で復旧手順を確認してください。'
      ]
    },
    {
      heading: '速度表現を評価する方法',
      body: [
        '公式サイトは国内最速No.1と案内していますが、2026年6月30日の自社調査で、選定した国内6サービス・プランをh2loadで5回計測した結果です。速度順位は測定対象、同時接続、キャッシュ、PHP処理、データベース、地域によって変わります。',
        '実サイトではテーマ、画像、広告タグ、外部フォント、プラグイン、アクセス集中、管理画面の処理も影響します。契約後は同じサイトを使い、TTFB、LCP、管理画面応答、バックアップ時間、負荷時エラーを測定して判断します。'
      ]
    },
    {
      heading: '契約前チェックリスト',
      body: [
        '長期契約を選ぶ前に、必要容量、WordPress数、メール数、バックアップ復元、サポート窓口、請求方法、契約更新、自動更新、移行対象外データを確認します。法人利用では担当者退職時のアカウント移管、二要素認証、権限分離、障害連絡の受信先も決めます。'
      ],
      bullets: [
        '通常更新料金と契約期間分の総額を確認する',
        '無料お試しとWordPressクイックスタートの併用可否を確認する',
        '簡単移行の対象外データを手動で保全する',
        '14日分バックアップから復元する手順を試す',
        '独自ドメイン特典の対象種類と維持条件を確認する',
        '速度は自社サイトの実測で判断する'
      ]
    }
  ];
}

function commonEnSections() {
  return [
    {
      heading: 'Core plans and how to read pricing',
      body: [
        'The standard service has Basic, Standard, and Premium plans. The official feature table lists normal thirty-six-month equivalents of JPY 1,078, JPY 2,002, and JPY 4,004. These are monthly equivalents, while the selected contract term is prepaid in full.',
        'Temporary discounts and cashback can reduce first-term effective cost. Renewal planning should instead use the normal renewal amount, domain-benefit conditions, and the deadline for stopping automatic renewal.'
      ],
      table: planTableEn()
    },
    {
      heading: 'WordPress setup and migration',
      body: [
        'WordPress Quick Start combines installation, custom-domain configuration, and automatic SSL setup during the order process. Payment is charged immediately and the ten-day free trial does not apply to this route.',
        'The automated migration tool uses the source URL and WordPress credentials. Multisite installations, databases above 2 GB, WordPress.com, and modified structures may be ineligible. The tool does not move every .htaccess rule or data stored outside wp-content, so a manual inventory remains necessary.'
      ]
    },
    {
      heading: 'Backups and recovery',
      body: [
        'The provider states that Web, mail, and MySQL data are copied once per day and retained for fourteen days across all plans. This does not automatically cover external DNS, third-party storage, external mail, or every application dependency.',
        'Keep an independent file and database backup before updates, migrations, and major configuration changes. A retained backup is only useful when the team knows the restore scope, expected recovery time, and post-restore verification process.'
      ]
    },
    {
      heading: 'How to interpret performance claims',
      body: [
        'The official site presents a domestic speed ranking based on a provider-run test dated June 30, 2026. It compared six selected services or plans using five h2load measurements. Results depend on the sample, workload, cache state, concurrency, application code, database work, and visitor location.',
        'Use a representative site to measure time to first byte, Largest Contentful Paint, administrator response, backup duration, and error behavior under load. A marketing benchmark should be treated as a starting hypothesis, not a guarantee for a specific production site.'
      ]
    },
    {
      heading: 'Pre-contract checklist',
      body: [
        'Before a long commitment, confirm storage, site count, mailboxes, restore workflow, support channels, invoicing, renewal settings, migration exclusions, and domain-benefit eligibility. Business users should also define account ownership, two-factor authentication, offboarding, and incident contacts.'
      ],
      bullets: [
        'Model normal renewal cost and the full prepaid amount',
        'Choose between the free trial and immediate WordPress Quick Start',
        'Preserve data excluded from automated migration',
        'Test restoration from the fourteen-day backup set',
        'Verify eligible domain types and benefit conditions',
        'Measure performance with the actual application'
      ]
    }
  ];
}

function jaSpecificSections(slug) {
  const specific = {
    'shin-rental-server-review': [
      {
        heading: '結論',
        body: [
          'シンレンタルサーバーは、1サイトから複数WordPressまで、容量とCPU・メモリに余裕を持たせたい利用者に向く候補です。ベーシックでもNVMe 700GB、6コア、8GBと案内され、独自ドメイン永久無料特典、無料SSL、電話・メールサポートがあります。',
          '一方、長期契約の月額表示は一括前払いの月割りであり、WordPressクイックスタートは無料お試し対象外です。速度No.1の表現は自社測定条件付きなので、契約後の実測と復元テストを前提に評価します。'
        ],
        affiliateMaterialKey: 'shin-server-long'
      },
      {
        heading: '通常プランとビジネスプランの違い',
        body: [
          '通常プランは共用環境の容量と処理枠を段階的に増やす構成です。ビジネスプランは通常版と同等の基本機能に加え、法人利用を想定したプラン体系として案内されています。公式料金ではビジネス・ベーシック、スタンダード、プレミアムの通常36か月月額換算が1,630円、3,418円、7,236円です。',
          '法人だから自動的にビジネスプランが必要とは限りません。保証リソース、管理機能、請求、サポート、SLA相当の要件を比較し、通常プランで足りるかを確認します。'
        ]
      }
    ],
    'shin-rental-server-pricing': [
      {
        heading: '結論：通常料金で比較する',
        body: [
          'ベーシックは小規模から中規模のWordPress、スタンダードは画像や複数サイトが増える運用、プレミアムは容量と処理余裕を優先する運用に向きます。最初から上位プランに固定せず、アクセス、バックアップ容量、同時作業、メール使用量を確認します。',
          '初回キャンペーンは契約日で変化するため、この記事では通常更新料金を軸にしています。申込画面では支払総額、適用条件、キャッシュバック受取条件、更新時期を再確認してください。'
        ],
        affiliateMaterialKey: 'shin-server-short'
      },
      {
        heading: 'ビジネスプラン料金',
        body: [
          'ビジネス・ベーシック、ビジネス・スタンダード、ビジネス・プレミアムの通常36か月月額換算は、それぞれ1,630円、3,418円、7,236円です。通常プランより高くなるため、法人向け機能や運用要件に対する差額として評価します。'
        ],
        table: {
          headers: ['プラン', '通常36か月月額換算', '向く運用'],
          rows: [
            ['ビジネス・ベーシック', '1,630円', '小規模法人サイト・複数担当者'],
            ['ビジネス・スタンダード', '3,418円', '中規模サイト・処理余裕重視'],
            ['ビジネス・プレミアム', '7,236円', '高容量・高負荷を想定']
          ]
        }
      },
      {
        heading: '年間総額を計算する',
        body: [
          '月額換算だけでなく、契約期間を掛けた初回支払額、更新時支払額、追加ドメイン、外部バックアップ、テーマ、移行代行、運用保守の費用を合計します。制作会社では顧客請求とサーバー更新月をそろえると管理しやすくなります。'
        ]
      }
    ],
    'shin-rental-server-wordpress': [
      {
        heading: '結論：新規と移行で申込方法を分ける',
        body: [
          '新規WordPressを最短で公開するならクイックスタート、既存サイトを移すなら通常契約後のWordPress簡単移行が基本です。クイックスタートは申込時決済で無料お試しがなく、既存サイト移行には使えません。',
          '移行は複製、動作確認、DNS切替、旧サーバー保持、最終差分確認の順に進めます。DNSを先に切り替えると移行中の更新やメールを失う可能性があるため、最後に変更します。'
        ],
        affiliateMaterialKey: 'shin-server-evolve'
      },
      {
        heading: '新規WordPressの設定手順',
        body: [
          '申込時にドメイン、ブログ名、管理者ユーザー、テーマを設定し、SSLが有効になったことを確認します。公開前にパーマリンク、タイムゾーン、サイトURL、管理者メール、バックアップ、更新方針、セキュリティ設定、アクセス解析を整えます。'
        ],
        bullets: ['管理者名にadminを使わない', '強固なパスワードと二要素認証を設定する', '不要なテーマ・プラグインを削除する', '公開前にnoindexを解除する', 'サイトマップとSearch Consoleを確認する']
      },
      {
        heading: '簡単移行で移らないもの',
        body: [
          '.htaccess、wp-content外のファイル、バックアップ系プラグインが作ったデータ、特殊な本体構造、外部メール、DNSレコード、CDN設定は別途確認します。フォーム、決済、会員、予約サイトはテスト注文や通知メールまで検証してください。'
        ]
      }
    ],
    'shin-rental-server-pros-cons': [
      {
        heading: '主なメリット',
        body: [
          'ベーシックから700GBのNVMe容量があり、WordPress簡単インストール・移行、無料SSL、独自ドメイン特典、14日分の自動バックアップをまとめて利用できます。サイト数や画像が増える運用では容量の余裕が管理負担を減らします。'
        ],
        bullets: ['通常プランでも大容量', 'WordPressの新規設置と移行を支援', 'Web・メール・MySQLを14日分保持', '独自ドメイン永久無料特典', '電話・メールサポート']
      },
      {
        heading: '主なデメリット',
        body: [
          '長期契約は一括前払いで、途中の事業変更やサービス移転に対する柔軟性が下がります。クイックスタートでは無料お試しがなく、簡単移行もすべてのサイト構成を扱えるわけではありません。',
          '速度No.1や最大倍率は限定条件のベンチマークです。自社サイトの速度や収益改善を保証するものではなく、テーマや広告スクリプトが重ければサーバー変更だけでは解決しません。'
        ],
        bullets: ['長期契約は契約期間分を一括前払い', 'クイックスタートは無料お試し対象外', '自動移行には構成・容量制限', 'ベンチマークと実サイト性能は異なる', 'バックアップは独立保管も必要']
      },
      {
        heading: '向く人・向かない人',
        body: [
          '向くのは、国内サポート、大容量、WordPress、複数サイトを重視し、長期契約を受け入れられる利用者です。短期間だけ試したい、月単位で停止したい、英語中心のサポートや海外リージョンが必要な場合は他サービスも比較します。'
        ],
        affiliateMaterialKey: 'shin-server-newgen'
      }
    ],
    'shin-rental-server-vs-xserver': [
      {
        heading: '結論',
        body: [
          '新技術や大容量を積極的に試したいならシンレンタルサーバー、長い運用実績と広い利用者基盤を重視するならエックスサーバーが比較しやすいです。両方とも通常36か月の月額換算は1,000円前後からで、契約期間分を一括で支払います。',
          'シンのベーシックは通常1,078円、エックスサーバーのスタンダードは通常990円です。キャンペーンを除く差は小さいため、容量、管理画面、ドメイン特典、試用、将来のサービス統合を含めて選びます。'
        ],
        affiliateMaterialKey: 'shin-server-long'
      },
      {
        heading: '主要項目比較',
        body: ['両サービスとも14日分の自動バックアップとWordPress簡単移行を提供しています。実務では既存契約との統合、管理者の慣れ、サポート情報量が差になります。'],
        table: {
          headers: ['項目', 'シンレンタルサーバー', 'エックスサーバー'],
          rows: [
            ['通常36か月の最安月額換算', '1,078円', '990円'],
            ['無料お試し', '10日間・申込方法に注意', '10日間'],
            ['自動バックアップ', '14日分', '14日分'],
            ['WordPress移行', '簡単移行あり', '簡単移行あり'],
            ['位置づけ', '新技術・大容量を訴求', '実績・標準性を訴求']
          ]
        }
      }
    ],
    'shin-rental-server-vs-conoha-wing': [
      {
        heading: '結論',
        body: [
          '長期前払いで大容量を確保するならシンレンタルサーバー、契約初期の柔軟性や時間単位課金を重視するならConoHa WINGが比較候補です。ConoHaの独自ドメイン無料特典はWINGパックに付くため、通常料金と混同しないようにします。',
          '共有プランのCPU・メモリ表示は、保証値か目安値かを確認します。ConoHa WINGの通常プランでは目安値と案内され、ビジネスプランでは契約ごとの保証リソースが示されています。'
        ],
        affiliateMaterialKey: 'shin-server-evolve'
      },
      {
        heading: '主要項目比較',
        body: ['料金の柔軟性はConoHa、通常プランの保存容量はシンが比較しやすい構成です。どちらも無料SSL、自動バックアップ、WordPress支援を提供します。'],
        table: {
          headers: ['項目', 'シンレンタルサーバー', 'ConoHa WING'],
          rows: [
            ['料金方式', '3～36か月の一括前払い', 'WINGパックまたは時間課金'],
            ['最小通常プラン容量', '700GB', '500GB'],
            ['ドメイン特典', '対象ドメイン永久無料', 'WINGパックで2個'],
            ['短期利用', '契約期間単位', '通常料金が柔軟'],
            ['法人向けリソース', 'ビジネスプランあり', '保証型ビジネスプランあり']
          ]
        }
      }
    ],
    'shin-rental-server-vs-lolipop': [
      {
        heading: '結論',
        body: [
          '費用を抑えて小規模WordPressを始めるならロリポップ！ライトやスタンダード、大容量と処理余裕を最初から確保するならシンレンタルサーバーが候補です。ロリポップ！のハイスピードは36か月月額660円でLiteSpeed、700GB、MySQL無制限を案内しています。',
          'ロリポップ！はプラン幅が広い一方、バックアップや電話サポートなどの対応範囲がプランで異なります。シンは通常3プランで基本機能をそろえやすいため、管理の単純さを重視する場合に比較しやすいです。'
        ],
        affiliateMaterialKey: 'shin-server-newgen'
      },
      {
        heading: '主要項目比較',
        body: ['最安プラン同士では用途が異なるため、WordPress運用ならロリポップ！ハイスピードとシンのベーシックを中心に比較します。'],
        table: {
          headers: ['項目', 'シン・ベーシック', 'ロリポップ！ハイスピード'],
          rows: [
            ['通常36か月月額換算', '1,078円', '660円'],
            ['容量', '700GB NVMe', '700GB SSD'],
            ['Webサーバー', 'nginx系高速構成', 'Nginx＋LiteSpeed'],
            ['自動バックアップ', '全通常プランで14日分', 'ハイスピードは無料提供'],
            ['無料お試し', '10日間', '10日間']
          ]
        }
      }
    ],
    'shin-rental-server-vs-mixhost': [
      {
        heading: '結論',
        body: [
          '更新料金を予測しやすく大容量を求めるならシンレンタルサーバー、LiteSpeed Cache、WordPress Toolkit、テストサイト機能などWordPress管理機能を重視するならmixhostが比較候補です。mixhostは初回料金と更新料金が異なるため、必ず更新後の総額で比較します。',
          'mixhostは30日間返金保証を案内し、シンは10日間無料お試しを案内しています。返金保証は無料期間ではないため、適用対象、申請期限、除外料金を規約で確認します。'
        ],
        affiliateMaterialKey: 'shin-server-short'
      },
      {
        heading: '主要項目比較',
        body: ['シンは標準更新料金、mixhostは初回・更新の二段階表示です。WordPressの管理機能と契約後コストを同時に比較します。'],
        table: {
          headers: ['項目', 'シンレンタルサーバー', 'mixhost'],
          rows: [
            ['料金表示', '契約期間別の通常・キャンペーン', '初回料金と更新料金'],
            ['高速化', 'NVMe・独自高速化機能', 'LiteSpeed Cache'],
            ['WordPress移行', '簡単移行', 'らくらく引っ越し'],
            ['バックアップ', '14日分', 'ライト以外は14日分を案内'],
            ['試用・保証', '10日間無料お試し', '30日間返金保証']
          ]
        }
      }
    ],
    'best-wordpress-hosting-japan': [
      {
        heading: '結論：用途別の第一候補',
        body: [
          '大容量と新技術ならシンレンタルサーバー、実績と標準性ならエックスサーバー、短期課金の柔軟性ならConoHa WING、低価格から段階的に始めるならロリポップ！、LiteSpeedとWordPress管理機能ならmixhostが比較候補です。',
          'どのサービスもプランや契約期間で条件が変わります。最安価格だけでなく、更新料金、復元、移行、ドメイン、管理画面、サポートを同じ用途で比較します。'
        ],
        affiliateMaterialKey: 'shin-server-long'
      },
      {
        heading: '5サービス比較',
        body: ['数値は2026年7月19日に確認した公式情報を基準とし、キャンペーンは除外または別扱いにします。'],
        table: {
          headers: ['サービス', '強み', '注意点', '向く用途'],
          rows: [
            ['シンレンタルサーバー', '大容量・WordPress・14日バックアップ', '長期一括前払い', '複数サイト・画像多め'],
            ['エックスサーバー', '実績・情報量・標準機能', '短期解約には不向き', '長期ブログ・企業サイト'],
            ['ConoHa WING', '通常料金とWINGパック', '特典条件が料金方式で違う', '短期検証・長期運用'],
            ['ロリポップ！', '低価格からプランが豊富', '機能がプランで異なる', '初心者・小規模サイト'],
            ['mixhost', 'LiteSpeed・WordPress管理', '初回と更新料金が違う', '開発・テスト運用']
          ]
        }
      },
      {
        heading: 'SEOで重要なのはサーバー名ではない',
        body: [
          'サーバー変更だけで順位が上がる保証はありません。クロール安定性、稼働、表示速度、Core Web Vitals、エラー率は技術基盤ですが、検索意図、独自情報、内部リンク、サイト構造、外部評価も必要です。速度改善は同一サイトの変更前後で測定します。'
        ]
      }
    ],
    'best-japanese-web-hosting': [
      {
        heading: '結論：用途で絞り込む',
        body: [
          '個人ブログ、法人サイト、EC、会員サイト、制作会社の顧客サイトでは必要条件が異なります。まずCMS、アクセス、メール、容量、復旧目標、契約期間、担当者数を決め、その条件を満たすプランだけを比較します。',
          'シンレンタルサーバーは大容量とWordPressを重視する選択肢です。法人の権限管理やSLA、専用リソースが必要なら、通常共用プランだけでなく法人専用サービスやクラウドも比較します。'
        ],
        affiliateMaterialKey: 'shin-server-newgen'
      },
      {
        heading: '用途別の候補',
        body: ['候補は価格順ではなく、必要な運用責任と契約の柔軟性で整理します。'],
        table: {
          headers: ['用途', '重視項目', '比較候補'],
          rows: [
            ['長期WordPressブログ', '更新料金・移行・バックアップ', 'シン、エックスサーバー'],
            ['短期プロジェクト', '時間課金・停止しやすさ', 'ConoHa WING通常料金'],
            ['低予算の小規模サイト', '最低費用・段階的アップグレード', 'ロリポップ！'],
            ['LiteSpeed運用', 'キャッシュ・管理ツール', 'mixhost、ロリポップ！ハイスピード'],
            ['法人サイト', '権限・SLA・サポート・請求', '各社ビジネスプラン']
          ]
        }
      },
      {
        heading: '移行可能性を最初に確認する',
        body: [
          '独自ドメインを維持できても、メール、DNS、SSL、cron、データベース、キャッシュ、CDN、WAF、アクセスログ、バックアップは移行作業が必要です。新規契約時から移行台帳を作り、将来の乗り換えコストを下げます。'
        ]
      }
    ]
  };
  return specific[slug] || [];
}

function enSpecificSections(slug) {
  const specific = {
    'shin-rental-server-review': [
      { heading: 'Verdict', body: ['Shin Rental Server is a strong candidate for users who want generous storage, WordPress assistance, automatic backups, SSL, and a domain benefit in one Japan-focused contract. Basic is listed with 700 GB NVMe storage, 6 vCPU cores, and 8 GB memory.', 'The main cautions are prepaid long terms, the absence of a free trial when Quick Start is used, and provider-run speed claims that require application-level verification.'], affiliateMaterialKey: null },
      { heading: 'Standard versus business plans', body: ['The standard range has three plans. The business range uses Business Basic, Business Standard, and Business Premium, with normal thirty-six-month equivalents of JPY 1,630, JPY 3,418, and JPY 7,236. A company should choose the business range only when its governance or resource requirements justify the difference.'] }
    ],
    'shin-rental-server-pricing': [
      { heading: 'Verdict: model normal renewal cost', body: ['Basic fits smaller WordPress workloads, Standard provides more headroom for multiple sites and media, and Premium targets larger storage and processing requirements. The first-term promotion should not define a multi-year decision.', 'Calculate the prepaid total, renewal amount, external backup, implementation, theme, migration, and administration cost.'], affiliateMaterialKey: null },
      { heading: 'Business plan pricing', body: ['Normal thirty-six-month equivalents are JPY 1,630 for Business Basic, JPY 3,418 for Business Standard, and JPY 7,236 for Business Premium.'], table: { headers: ['Plan', 'Normal 36-month equivalent', 'Operational fit'], rows: [['Business Basic', 'JPY 1,630', 'Small business sites'], ['Business Standard', 'JPY 3,418', 'Mid-size operational headroom'], ['Business Premium', 'JPY 7,236', 'Larger storage and workload']] } },
      { heading: 'Calculate total annual cost', body: ['Add the full server payment, non-included domains, independent backups, paid themes, migration work, and ongoing maintenance. Agencies should align renewal ownership and client billing before placing multiple customer sites in one account.'] }
    ],
    'shin-rental-server-wordpress': [
      { heading: 'Verdict: separate new setup from migration', body: ['Use Quick Start for a new installation and the migration tool for an existing site. Quick Start charges immediately, has no ten-day trial, and is not the path for moving an existing installation.', 'For migration, copy first, validate on the destination, change DNS last, keep the old server active, and verify final content and mail delivery.'], affiliateMaterialKey: null },
      { heading: 'New WordPress setup checklist', body: ['After ordering, verify SSL, permalink structure, time zone, site URL, administrator email, backups, update policy, security settings, and analytics.'], bullets: ['Avoid admin as the administrator name', 'Use a strong password and two-factor authentication', 'Remove unused plugins and themes', 'Remove noindex before launch', 'Verify the sitemap and Search Console'] },
      { heading: 'What automated migration does not cover', body: ['Review .htaccess, data outside wp-content, backup-plugin archives, modified core structures, external mail, DNS records, CDN settings, forms, payments, memberships, and scheduled tasks. Test the complete business workflow before switching traffic.'] }
    ],
    'shin-rental-server-pros-cons': [
      { heading: 'Advantages', body: ['The Basic plan begins with large NVMe storage and includes WordPress installation and migration workflows, SSL, domain benefits, and fourteen-day backups. This can reduce fragmentation for users running multiple content-heavy sites.'], bullets: ['Large storage from the entry plan', 'WordPress setup and migration assistance', 'Fourteen-day Web, mail, and database retention', 'Eligible permanent domain benefit', 'Phone and email support'] },
      { heading: 'Constraints', body: ['Long contracts are prepaid and reduce flexibility when a project changes. Quick Start removes the free-trial period, and automated migration cannot handle every architecture.', 'Performance rankings are bounded benchmarks rather than guarantees. Heavy themes, advertising scripts, third-party fonts, and inefficient database work can remain slow after a host change.'], bullets: ['Prepaid contract terms', 'No trial with Quick Start', 'Migration exclusions', 'Benchmark and production results differ', 'Independent backups remain necessary'] },
      { heading: 'Who should and should not choose it', body: ['It suits users who value domestic support, large storage, WordPress, and multi-site operation and can accept a longer commitment. Users needing monthly cancellation, overseas regions, or primarily English support should compare alternatives.'], affiliateMaterialKey: null }
    ],
    'shin-rental-server-vs-xserver': [
      { heading: 'Verdict', body: ['Choose Shin Rental Server when experimental features and larger entry storage are priorities. Choose XServer when a longer operating record and a broad installed base matter more. The normal thirty-six-month equivalents start at JPY 1,078 and JPY 990 respectively.', 'Both have prepaid terms, WordPress migration, and fourteen-day backups, so administration familiarity and product direction often matter more than the small headline price difference.'], affiliateMaterialKey: null },
      { heading: 'Core comparison', body: ['The two services share an operator and several workflows. Existing account consolidation, documentation familiarity, and long-term product positioning should be part of the decision.'], table: { headers: ['Area', 'Shin Rental Server', 'XServer'], rows: [['Normal 36-month entry equivalent', 'JPY 1,078', 'JPY 990'], ['Trial', 'Ten days with route limitations', 'Ten days'], ['Backups', 'Fourteen days', 'Fourteen days'], ['WordPress migration', 'Available', 'Available'], ['Positioning', 'New technology and large storage', 'Operational maturity and broad adoption']] } }
    ],
    'shin-rental-server-vs-conoha-wing': [
      { heading: 'Verdict', body: ['Choose Shin Rental Server for a prepaid long-term contract with large entry storage. Choose ConoHa WING when hourly standard billing or a WING Pack better fits the project. Domain benefits on ConoHa depend on WING Pack rather than standard hourly billing.', 'Shared-plan CPU and memory figures should be read as guarantees or reference values according to the provider. ConoHa explicitly separates its shared plan guidance from guaranteed business resources.'], affiliateMaterialKey: null },
      { heading: 'Core comparison', body: ['ConoHa has more short-term billing flexibility, while Shin begins with larger storage. Both support SSL, backups, and WordPress operations.'], table: { headers: ['Area', 'Shin Rental Server', 'ConoHa WING'], rows: [['Billing', 'Prepaid 3 to 36 months', 'WING Pack or hourly standard billing'], ['Entry storage', '700 GB', '500 GB'], ['Domain benefit', 'Eligible permanent domain', 'Two with WING Pack'], ['Short projects', 'Term based', 'More flexible standard billing'], ['Business resources', 'Business range', 'Guaranteed business range']] } }
    ],
    'shin-rental-server-vs-lolipop': [
      { heading: 'Verdict', body: ['Lolipop is attractive when a user wants to start at a lower price and upgrade gradually. Shin Rental Server is attractive when larger storage and a stronger resource profile are required from the beginning. The meaningful WordPress comparison is Lolipop High Speed against Shin Basic rather than the email-only entry tier.', 'Lolipop plan capabilities vary more by tier, including backup and phone support. Shin has a narrower standard plan range with a more consistent feature baseline.'], affiliateMaterialKey: null },
      { heading: 'Core comparison', body: ['Lolipop High Speed lists a JPY 660 thirty-six-month equivalent, 700 GB SSD, LiteSpeed, and unlimited MySQL. Shin Basic lists JPY 1,078, 700 GB NVMe, 6 cores, and 8 GB memory.'], table: { headers: ['Area', 'Shin Basic', 'Lolipop High Speed'], rows: [['Normal 36-month equivalent', 'JPY 1,078', 'JPY 660'], ['Storage', '700 GB NVMe', '700 GB SSD'], ['Web stack', 'Provider high-speed stack', 'Nginx and LiteSpeed'], ['Automatic backup', 'Fourteen days', 'Included for High Speed'], ['Trial', 'Ten days', 'Ten days']] } }
    ],
    'shin-rental-server-vs-mixhost': [
      { heading: 'Verdict', body: ['Choose Shin Rental Server for large storage and a normal-renewal pricing model. Choose mixhost when LiteSpeed Cache, WordPress Toolkit, staging, and related WordPress administration features are central.', 'mixhost separates introductory and renewal prices. It promotes a thirty-day refund guarantee, while Shin promotes a ten-day free trial. A refund guarantee is not a free trial and must be checked against eligibility and excluded fees.'], affiliateMaterialKey: null },
      { heading: 'Core comparison', body: ['Compare post-introductory cost together with WordPress administration, migration, and backup recovery.'], table: { headers: ['Area', 'Shin Rental Server', 'mixhost'], rows: [['Price presentation', 'Term pricing and promotions', 'Introductory and renewal pricing'], ['Acceleration', 'NVMe and provider optimization', 'LiteSpeed Cache'], ['Migration', 'WordPress migration tool', 'WordPress easy migration'], ['Backups', 'Fourteen days', 'Fourteen days except Light'], ['Trial or guarantee', 'Ten-day trial', 'Thirty-day refund guarantee']] } }
    ],
    'best-wordpress-hosting-japan': [
      { heading: 'Verdict by use case', body: ['Shin Rental Server stands out for large entry storage and a newer platform direction. XServer emphasizes operational maturity. ConoHa WING offers billing flexibility. Lolipop provides a broad low-cost ladder. mixhost emphasizes LiteSpeed and WordPress management.', 'Compare normal renewal cost, migration exclusions, recoverable backups, domain conditions, administration, and support for the same workload.'], affiliateMaterialKey: null },
      { heading: 'Five-service comparison', body: ['The framework uses official information checked on July 19, 2026 and separates temporary promotions from recurring conditions.'], table: { headers: ['Service', 'Strength', 'Constraint', 'Best fit'], rows: [['Shin Rental Server', 'Large storage and WordPress workflow', 'Prepaid long terms', 'Multiple media-heavy sites'], ['XServer', 'Maturity and documentation', 'Limited short-term flexibility', 'Long-running blogs and business sites'], ['ConoHa WING', 'Hourly or WING Pack billing', 'Benefits vary by billing type', 'Testing and long-term operation'], ['Lolipop', 'Low entry cost and many tiers', 'Capabilities vary by tier', 'Beginners and small sites'], ['mixhost', 'LiteSpeed and WordPress tools', 'Introductory and renewal gap', 'Development and staging workflows']] } },
      { heading: 'Hosting is only one part of Search Engine Optimization', body: ['A host change does not guarantee ranking gains. Availability, response time, Core Web Vitals, and error rate support technical quality, while search intent, original information, architecture, internal linking, and authority remain essential. Measure the same site before and after any infrastructure change.'] }
    ],
    'best-japanese-web-hosting': [
      { heading: 'Verdict: filter by use case', body: ['A personal blog, business site, ecommerce application, membership site, and agency portfolio require different controls. Define CMS, traffic, mail, storage, recovery objective, contract term, and administrators before comparing plans.', 'Shin Rental Server is a candidate when WordPress and large storage are important. When a business needs formal resource guarantees, separate roles, or a service-level commitment, compare business and cloud services rather than consumer shared hosting alone.'], affiliateMaterialKey: null },
      { heading: 'Use-case shortlist', body: ['The shortlist should follow operational responsibility and contract flexibility rather than minimum advertised price.'], table: { headers: ['Use case', 'Priority', 'Candidates'], rows: [['Long-term WordPress blog', 'Renewal, migration, backups', 'Shin and XServer'], ['Short project', 'Hourly billing and easy shutdown', 'ConoHa WING standard billing'], ['Small low-budget site', 'Low entry and gradual upgrades', 'Lolipop'], ['LiteSpeed workflow', 'Cache and WordPress tools', 'mixhost and Lolipop High Speed'], ['Business site', 'Governance, support, billing, service levels', 'Business plans from each provider']] } },
      { heading: 'Design for future migration', body: ['A custom domain can remain stable, but mail, DNS, SSL, cron, databases, cache, CDN, Web Application Firewall rules, logs, and backups still require migration. Maintain an infrastructure inventory from the first day to reduce future switching cost.'] }
    ]
  };
  return specific[slug] || [];
}

function makeFaqs(lang, slug) {
  if (lang === 'ja') {
    const base = [
      { question: 'シンレンタルサーバーには無料お試しがありますか？', answer: '通常申込みでは10日間無料のお試しが案内されています。ただしWordPressクイックスタートは申込みと同時に支払いが発生し、無料お試しの対象外です。' },
      { question: '自動バックアップは何日分ですか？', answer: '公式情報ではWeb・メールデータとMySQLデータベースを1日1回保存し、過去14日分を保持します。外部サービスやDNSなどは別途保全してください。' },
      { question: '長期契約の月額表示は毎月払いですか？', answer: '月額は契約期間分の料金を1か月あたりに換算した表示です。契約期間分を一括前払いするため、申込画面の支払総額を確認してください。' }
    ];
    if (slug.includes('wordpress')) base.push({ question: 'WordPress簡単移行ですべて移せますか？', answer: 'いいえ。.htaccess、wp-content外のデータ、特殊構成、外部メールやDNSなどは別途確認が必要です。移行後にフォームや通知もテストしてください。' });
    if (slug.includes('vs-') || slug.startsWith('best-')) base.push({ question: 'キャンペーン価格だけで比較してよいですか？', answer: '初回割引は期間や条件で変わります。通常更新料金、契約総額、特典の維持条件、移行コストで比較してください。' });
    return base.slice(0, 4);
  }
  const base = [
    { question: 'Does Shin Rental Server include a free trial?', answer: 'The normal order route advertises a ten-day trial. WordPress Quick Start charges immediately and does not include that trial.' },
    { question: 'How long are automatic backups retained?', answer: 'The official service information states that Web, mail, and MySQL data are retained for fourteen days with one backup per day.' },
    { question: 'Is the monthly equivalent charged monthly?', answer: 'No. The displayed monthly equivalent divides the prepaid contract amount by the number of months. Confirm the full checkout amount.' }
  ];
  if (slug.includes('wordpress')) base.push({ question: 'Does automated WordPress migration move everything?', answer: 'No. Some .htaccess rules, data outside wp-content, modified structures, external mail, and DNS settings require separate handling.' });
  if (slug.includes('vs-') || slug.startsWith('best-')) base.push({ question: 'Should I compare only promotional prices?', answer: 'No. Compare normal renewal cost, full contract amount, benefit conditions, support, recovery, and migration cost.' });
  return base.slice(0, 4);
}

function sourcesFor(slug, lang) {
  let extra = [];
  if (slug.includes('xserver')) extra = competitorSources.xserver;
  if (slug.includes('conoha')) extra = competitorSources.conoha;
  if (slug.includes('lolipop')) extra = competitorSources.lolipop;
  if (slug.includes('mixhost')) extra = competitorSources.mixhost;
  if (slug.startsWith('best-')) extra = [...competitorSources.xserver, ...competitorSources.conoha, ...competitorSources.lolipop, ...competitorSources.mixhost];
  const base = lang === 'ja' ? shinSourcesJa : shinSourcesEn;
  const transformed = lang === 'ja' ? extra : extra.map((s) => ({ label: s.label, url: s.url }));
  const seen = new Set();
  return [...base, ...transformed].filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

function affiliateKeyFor(slug) {
  if (slug.includes('wordpress')) return 'shin-server-evolve';
  if (slug.includes('pricing') || slug.includes('mixhost')) return 'shin-server-short';
  if (slug.includes('lolipop') || slug.includes('pros-cons') || slug === 'best-japanese-web-hosting') return 'shin-server-newgen';
  return 'shin-server-long';
}

function makeArticle(route, lang) {
  const ja = lang === 'ja';
  const specific = ja ? jaSpecificSections(route.slug) : enSpecificSections(route.slug);
  const common = ja ? commonJaSections() : commonEnSections();
  const related = (ja ? relatedJa : relatedEn).filter((link) => !link.url.includes(`/${route.slug}/`)).slice(0, 8);
  return {
    id: `${route.slug}-${lang}`,
    translationKey: route.slug,
    language: lang,
    type: route.type,
    status: 'published',
    slug: route.slug,
    category: 'hosting-security',
    topic: 'web-hosting',
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
    ctas: [
      {
        label: ja ? 'シンレンタルサーバーの公式条件を確認' : 'Check the official Shin Rental Server terms',
        officialUrl: official,
        affiliateKey: ja ? affiliateKeyFor(route.slug) : 'shin-server-official'
      }
    ],
    sources: sourcesFor(route.slug, lang),
    sections: [...specific, ...common],
    faqs: makeFaqs(lang, route.slug),
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
  'shin-server-long': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+2FIRH6+5GDG+5YJRM" rel="nofollow">自由と先進性を兼ね備えた新世代レンタルサーバー『シンレンタルサーバー』</a>\n<img border="0" width="1" height="1" src="https://www19.a8.net/0.gif?a8mat=4B8452+2FIRH6+5GDG+5YJRM" alt="">',
  'shin-server-evolve': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+2FIRH6+5GDG+5ZEMQ" rel="nofollow">シン化するレンタルサーバー『シンレンタルサーバー』</a>\n<img border="0" width="1" height="1" src="https://www12.a8.net/0.gif?a8mat=4B8452+2FIRH6+5GDG+5ZEMQ" alt="">',
  'shin-server-url': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+2FIRH6+5GDG+5YZ76" rel="nofollow">https://www.shin-server.jp/</a>\n<img border="0" width="1" height="1" src="https://www19.a8.net/0.gif?a8mat=4B8452+2FIRH6+5GDG+5YZ76" alt="">',
  'shin-server-newgen': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+2FIRH6+5GDG+5Z6WY" rel="nofollow">新世代レンタルサーバー『シンレンタルサーバー』</a>\n<img border="0" width="1" height="1" src="https://www11.a8.net/0.gif?a8mat=4B8452+2FIRH6+5GDG+5Z6WY" alt="">',
  'shin-server-short': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+2FIRH6+5GDG+5YRHE" rel="nofollow">シンレンタルサーバー</a>\n<img border="0" width="1" height="1" src="https://www16.a8.net/0.gif?a8mat=4B8452+2FIRH6+5GDG+5YRHE" alt="">'
};
for (const [key, rawHtml] of Object.entries(rawLinks)) {
  affiliates.links[key] = {
    type: 'rawHtml',
    network: 'A8.net',
    programId: 's00000025450001',
    language: 'ja',
    destination: official,
    rawHtml
  };
}
affiliates.links['shin-server-official'] = {
  type: 'official',
  network: 'Official',
  language: 'en',
  destination: official,
  url: official
};
fs.writeFileSync(affiliatePath, `${JSON.stringify(affiliates, null, 2)}\n`);

const seoPath = path.join(root, 'content/config/seo.json');
const seo = JSON.parse(fs.readFileSync(seoPath, 'utf8'));
for (const route of routes) {
  for (const lang of ['ja', 'en']) {
    const source = `content/articles/${lang}/${route.slug}.json`;
    if (!seo.indexing.includeSourceFiles.includes(source)) seo.indexing.includeSourceFiles.push(source);
  }
}
if (!seo.indexing.priorityProducts.includes('shin-rental-server')) seo.indexing.priorityProducts.push('shin-rental-server');
fs.writeFileSync(seoPath, `${JSON.stringify(seo, null, 2)}\n`);

const homePath = path.join(root, 'content/config/home.json');
const home = JSON.parse(fs.readFileSync(homePath, 'utf8'));
home.featuredComparisons = [
  'shin-rental-server-vs-xserver',
  'shin-rental-server-vs-conoha-wing',
  'best-wordpress-hosting-japan',
  'color-me-shop-vs-shopify',
  'color-me-shop-vs-xserver-shop'
];
home.featuredReviews = [
  'shin-rental-server-review',
  'shin-rental-server-pricing',
  'shin-rental-server-wordpress',
  'color-me-shop-review',
  'xserver-shop-review',
  'jetboy-review'
];
fs.writeFileSync(homePath, `${JSON.stringify(home, null, 2)}\n`);

const categoryPath = path.join(root, 'content/config/categories.json');
const categories = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));
const hosting = categories.find((category) => category.id === 'hosting-security');
hosting.description.ja = 'レンタルサーバー、WordPressホスティング、クラウド、ドメイン、セキュリティを、通常料金・更新・容量・バックアップ・移行・サポート条件から比較します。';
hosting.description.en = 'Compare web hosting, WordPress hosting, cloud, domains, and security by normal pricing, renewals, storage, backups, migration, and support conditions.';
fs.writeFileSync(categoryPath, `${JSON.stringify(categories, null, 2)}\n`);

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.version = '1.17.0';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

const sitePath = path.join(root, 'content/config/site.json');
const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
site.assetVersion = '4.8.0';
site.defaultVerifiedAt = date;
fs.writeFileSync(sitePath, `${JSON.stringify(site, null, 2)}\n`);

const profilePath = path.join(root, 'content/article-batches/product-profiles-expansion.json');
const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
profiles['shin-rental-server'] = {
  name: 'Shin Rental Server',
  affiliateKey: 'shin-server-long',
  sources: shinSourcesJa,
  positioning: {
    ja: 'NVMe大容量、WordPress支援、14日分バックアップ、独自ドメイン特典を備える国内共用レンタルサーバー',
    en: 'Japan-focused shared hosting with large NVMe storage, WordPress workflows, fourteen-day backups, and domain benefits'
  },
  pricing: {
    ja: '通常36か月月額換算はベーシック1,078円、スタンダード2,002円、プレミアム4,004円。契約期間分を一括前払い',
    en: 'Normal thirty-six-month equivalents are JPY 1,078, JPY 2,002, and JPY 4,004, prepaid for the selected term'
  },
  pricingDetail: {
    ja: 'キャンペーンの実質価格ではなく、通常更新料金、支払総額、ドメイン条件、外部バックアップ、移行費を含めて比較します。',
    en: 'Compare normal renewal cost, full prepayment, domain conditions, independent backups, and migration cost rather than temporary effective prices.'
  },
  workflow: {
    ja: 'WordPressクイックスタート、簡単インストール、簡単移行、無料SSL、14日分バックアップを使って運用します。',
    en: 'Operate with WordPress Quick Start, installation, migration, SSL, and fourteen-day backups.'
  },
  bestFor: {
    ja: '国内サポート、大容量、複数WordPress、長期契約を重視する個人・制作会社・中小事業者',
    en: 'Individuals, agencies, and smaller businesses prioritizing domestic support, storage, multiple WordPress sites, and long-term contracts'
  },
  strengths: {
    ja: ['ベーシックから700GB NVMe', 'WordPress新規設置・移行', '14日分自動バックアップ', '独自ドメイン特典'],
    en: ['700 GB NVMe from Basic', 'WordPress setup and migration', 'Fourteen-day automatic backups', 'Domain benefit']
  },
  limits: {
    ja: ['長期契約は一括前払い', 'クイックスタートは無料お試し対象外', '自動移行には対象外構成', '速度表現は自社測定条件付き'],
    en: ['Prepaid long terms', 'No trial with Quick Start', 'Automated migration exclusions', 'Provider-defined performance tests']
  }
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
    try {
      article = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    if (article.category !== 'hosting-security' && article.topic !== 'web-hosting') continue;
    article.relatedLinks = Array.isArray(article.relatedLinks) ? article.relatedLinks : [];
    const urls = new Set(article.relatedLinks.map((link) => link.url));
    for (const link of additions) {
      if (!urls.has(link.url)) {
        article.relatedLinks.push(link);
        urls.add(link.url);
      }
    }
    article.relatedLinks = article.relatedLinks.slice(0, 10);
    fs.writeFileSync(file, `${JSON.stringify(article, null, 2)}\n`);
  }
}

const qa = `# QA — v1.17.0 Shin Rental Server\n\n## Scope\n- Added 10 Japanese and 10 English articles.\n- Added five user-supplied A8.net materials without modifying destination URLs or tracking pixels.\n- Added an official-link fallback for English pages.\n- Updated hosting category copy, home features, priority indexing, product profile, related links, sitemap/RSS/search generation inputs, and package version.\n\n## New routes\n${routes.map((route) => `- /ja/hosting-security/${route.slug}/\n- /en/hosting-security/${route.slug}/`).join('\n')}\n\n## Evidence policy\n- Product facts are based on provider-owned pages checked on 2026-07-19.\n- Temporary campaign prices are not treated as stable recurring prices.\n- Performance rankings are described with provider test date and methodology limits.\n- Affiliate-program PR copy was not copied into editorial paragraphs.\n\n## Affiliate materials\n- Program ID: s00000025450001\n- Keys: shin-server-long, shin-server-evolve, shin-server-url, shin-server-newgen, shin-server-short\n- Japanese pages use A8.net links and first-view advertising disclosure.\n- English pages use the official destination only.\n\n## Validation\nRun: npm run check\n`;
fs.writeFileSync(path.join(root, 'docs/QA_V1.17_SHIN_RENTAL_SERVER.md'), qa);

console.log(`Added ${routes.length * 2} Shin Rental Server articles and updated v1.17.0 configuration.`);
