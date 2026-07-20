import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleRoot = path.join(root, 'content/articles');
const date = '2026-07-20';
const official = 'https://www.xserver.ne.jp/';
const businessOfficial = 'https://business.xserver.ne.jp/';

const xserverSourcesJa = [
  {label:'エックスサーバー公式サイト',url:'https://www.xserver.ne.jp/'},
  {label:'エックスサーバー料金プラン',url:'https://www.xserver.ne.jp/price/index.php'},
  {label:'エックスサーバー機能一覧',url:'https://www.xserver.ne.jp/functions/'},
  {label:'エックスサーバー特長',url:'https://www.xserver.ne.jp/feature/'},
  {label:'独自ドメイン永久無料特典',url:'https://www.xserver.ne.jp/manual/man_order_present_domain.php'},
  {label:'自動バックアップ機能',url:'https://www.xserver.ne.jp/functions/service_backup.php'},
  {label:'WordPress簡単インストール',url:'https://www.xserver.ne.jp/manual/man_install_auto_word.php'},
  {label:'WordPress簡単移行',url:'https://www.xserver.ne.jp/manual/man_install_transfer_wp.php'},
  {label:'エックスサーバーサポート',url:'https://www.xserver.ne.jp/support/'},
  {label:'法人向けレンタルサーバー選び方ガイド',url:'https://www.xserver.ne.jp/comparison/'}
];
const xserverSourcesEn = xserverSourcesJa.map((s)=>({label:s.label
  .replace('エックスサーバー','XServer')
  .replace('料金プラン','pricing plans')
  .replace('機能一覧','feature list')
  .replace('特長','service features')
  .replace('独自ドメイン永久無料特典','permanent domain benefit')
  .replace('自動バックアップ機能','automatic backup')
  .replace('WordPress簡単インストール','WordPress installation')
  .replace('WordPress簡単移行','WordPress migration')
  .replace('サポート','support')
  .replace('法人向けレンタルサーバー選び方ガイド','business hosting selection guide'),url:s.url}));
const businessSourcesJa = [
  {label:'XServerビジネス公式サイト',url:'https://business.xserver.ne.jp/'},
  {label:'XServerビジネス料金プラン',url:'https://business.xserver.ne.jp/price/'},
  {label:'XServerビジネス機能一覧',url:'https://business.xserver.ne.jp/functions/'},
  {label:'マネージド専用サーバー',url:'https://business.xserver.ne.jp/feature/dedicated.php'},
  {label:'XServerビジネス特長',url:'https://business.xserver.ne.jp/feature/'},
  {label:'XServerビジネス アフィリエイト案内',url:'https://business.xserver.ne.jp/affiliate/'}
];
const businessSourcesEn = businessSourcesJa.map((s)=>({label:s.label
  .replace('公式サイト','official site').replace('料金プラン','pricing plans').replace('機能一覧','feature list')
  .replace('マネージド専用サーバー','managed dedicated servers').replace('特長','service features').replace('アフィリエイト案内','affiliate information'),url:s.url}));
const competitorSources = {
  conoha:[
    {label:'ConoHa WING料金',url:'https://www.conoha.jp/pricing/'},
    {label:'ConoHa WINGリソース',url:'https://www.conoha.jp/wing/function/resource/'},
    {label:'ConoHa WINGビジネスプラン',url:'https://www.conoha.jp/wing/business/'}
  ],
  lolipop:[
    {label:'ロリポップ！料金',url:'https://lolipop.jp/pricing/'},
    {label:'ロリポップ！機能一覧',url:'https://lolipop.jp/service/specs/'},
    {label:'ロリポップ！サーバー仕様',url:'https://lolipop.jp/service/server-spec/'}
  ]
};

const routes = [
  {slug:'xserver-rental-server-review',type:'review',cta:'xserver-main',
   jaTitle:'エックスサーバーレビュー｜料金・機能・注意点【2026年】',
   enTitle:'XServer Review: Pricing, Features, and Contract Limits (2026)',
   jaDescription:'エックスサーバーを公式情報で検証。料金、容量、WordPress、独自ドメイン、バックアップ、メール、サポート、契約時の注意点を解説します。',
   enDescription:'An official-source XServer review covering pricing, storage, WordPress, domains, backups, email, support, and contract constraints.',
   jaLead:'エックスサーバーは、WordPress運用、複数ドメイン、メール、無料SSL、14日分バックアップをまとめて利用できる国内レンタルサーバーです。知名度や速度訴求だけでなく、通常料金、長期契約、ドメイン特典の条件、復旧方法まで確認して判断します。',
   enLead:'XServer is a Japan-focused hosting service combining WordPress workflows, multiple domains, email, SSL, and fourteen-day backups. This review evaluates normal pricing, contract terms, domain-benefit conditions, recovery, and support rather than relying on market-share or speed slogans.'},
  {slug:'xserver-rental-server-pricing',type:'guide',cta:'xserver-price',
   jaTitle:'エックスサーバー料金・プラン比較｜スタンダード・プレミアム・ビジネス',
   enTitle:'XServer Pricing: Standard, Premium, and Business Plans Compared',
   jaDescription:'エックスサーバー3プランの通常料金、容量、ドメイン特典、Xwrite、法人機能、契約期間と支払総額を比較します。',
   enDescription:'Compare XServer Standard, Premium, and Business by normal pricing, storage, domain benefits, Xwrite, business controls, and prepaid terms.',
   jaLead:'料金はキャンペーンの実質月額だけでなく、通常料金と契約期間分の支払総額で比較します。スタンダードで足りる利用者が多い一方、プレミアムとビジネスは容量、対象ドメイン、Xwrite、法人管理機能に違いがあります。',
   enLead:'Pricing should be compared using normal renewal rates and the full prepaid contract amount, not a temporary effective monthly figure. Standard fits many projects, while Premium and Business add storage, domain options, Xwrite benefits, and business-oriented controls.'},
  {slug:'xserver-rental-server-pros-cons',type:'review',cta:'xserver-main',
   jaTitle:'エックスサーバーのメリット・デメリット｜契約前の確認事項',
   enTitle:'XServer Pros and Cons: What to Check Before Contracting',
   jaDescription:'エックスサーバーの長所と注意点を、WordPress、料金、バックアップ、複数サイト、メール、サポート、契約条件から整理します。',
   enDescription:'Assess XServer advantages and limits across WordPress, pricing, backups, multiple sites, email, support, and contract conditions.',
   jaLead:'メリットは、WordPressと複数サイト運用に必要な主要機能を一つの管理環境にまとめやすい点です。注意点は、長期契約の前払い、ドメイン特典の条件、プラン名の「ビジネス」と別サービスのXServerビジネスが混同されやすい点です。',
   enLead:'The main advantage is that common WordPress and multi-site workflows can be consolidated in one administration environment. Trade-offs include prepaid long terms, conditions attached to domain benefits, and possible confusion between the Business plan and the separate XServer Business service.'},
  {slug:'xserver-wordpress-quick-start-guide',type:'guide',cta:'xserver-wordpress-guide',
   jaTitle:'エックスサーバーでWordPressを始める方法｜クイックスタートと移行',
   enTitle:'Starting WordPress on XServer: Quick Start, Installation, and Migration',
   jaDescription:'エックスサーバーでWordPressを始める手順を解説。クイックスタート、簡単インストール、簡単移行、SSL、DNS、公開前確認を整理します。',
   enDescription:'A practical XServer WordPress guide covering Quick Start, installation, migration, SSL, DNS, backups, and pre-launch checks.',
   jaLead:'新規サイトは申込み時のクイックスタートまたは契約後の簡単インストール、既存サイトはWordPress簡単移行を利用できます。自動化できる範囲と、DNS切替、メール、外部サービス、バックアップを手作業で確認する範囲を分けることが重要です。',
   enLead:'New projects can use Quick Start at signup or the post-contract installation tool, while existing sites can use WordPress migration. The safe workflow separates automated steps from manual checks for DNS, email, external services, backups, and final cutover.'},
  {slug:'xserver-multiple-domain-site-guide',type:'guide',cta:'xserver-domain',
   jaTitle:'エックスサーバーで複数サイトを運営する方法｜ドメイン・メール管理',
   enTitle:'Running Multiple Sites on XServer: Domains, Email, FTP, and Governance',
   jaDescription:'エックスサーバーで複数ドメイン、サブドメイン、WordPress、メール、FTPを管理する方法と、権限・バックアップ・費用の注意点を解説します。',
   enDescription:'Plan multiple domains, WordPress sites, email accounts, FTP access, backups, ownership, and operating controls on XServer.',
   jaLead:'エックスサーバーはマルチドメイン、サブドメイン、メールアカウント、FTPアカウントを複数設定できます。ただし「設定数が多い」ことと「安全に運用できる」ことは別なので、サイト所有者、請求、権限、バックアップ、障害連絡を分離します。',
   enLead:'XServer supports multiple domains, subdomains, email accounts, and FTP accounts. Capacity to create many objects is not the same as safe governance, so ownership, billing, access, backups, and incident contacts should be separated for every site.'},
  {slug:'xserver-company-website-email-guide',type:'guide',cta:'xserver-company-email',
   jaTitle:'会社ホームページと独自ドメインメールをエックスサーバーで準備する方法',
   enTitle:'Preparing a Company Website and Domain Email on XServer',
   jaDescription:'会社ホームページ、独自ドメイン、メール、SSL、WordPress、担当者権限、バックアップをエックスサーバーで準備する手順を整理します。',
   enDescription:'Plan a company website, domain email, SSL, WordPress, account ownership, backups, and support on XServer.',
   jaLead:'会社サイトでは、公開できることよりも、契約名義、ドメイン所有、メール到達性、退職時の引継ぎ、復旧手順を管理できることが重要です。エックスサーバーを使う場合も、会社名義のアカウントと共有ルールを先に決めます。',
   enLead:'For a company website, contract ownership, domain control, email deliverability, staff handover, and recovery matter more than merely publishing pages. When using XServer, establish company-owned accounts and documented access rules before production.'},
  {slug:'xserver-vs-conoha-wing',type:'comparison',cta:'xserver-main',competitor:'conoha',
   jaTitle:'エックスサーバーとConoHa WINGを比較｜料金・契約・WordPressの違い',
   enTitle:'XServer vs ConoHa WING: Pricing, Contracts, and WordPress Workflows',
   jaDescription:'エックスサーバーとConoHa WINGを、通常料金、長期契約、短期利用、容量、WordPress、ドメイン、バックアップ、サポートから比較します。',
   enDescription:'Compare XServer and ConoHa WING by normal pricing, long and short terms, storage, WordPress, domains, backups, and support.',
   jaLead:'長期前払いと実績重視ならエックスサーバー、WINGパックに加えて時間単位の通常料金を選びたいならConoHa WINGが比較候補です。キャンペーン価格ではなく、更新料金、解約時の柔軟性、必要な管理機能で判断します。',
   enLead:'XServer is a candidate for prepaid long-term operation and a mature domestic workflow, while ConoHa WING also provides an hourly standard-billing path alongside WING Pack. Compare renewal pricing, exit flexibility, administration, and actual support needs.'},
  {slug:'xserver-vs-lolipop',type:'comparison',cta:'xserver-main',competitor:'lolipop',
   jaTitle:'エックスサーバーとロリポップ！を比較｜初心者向けの選び方【2026年】',
   enTitle:'XServer vs Lolipop: A Beginner-Focused Hosting Comparison (2026)',
   jaDescription:'エックスサーバーとロリポップ！を、料金、容量、WordPress、バックアップ、電話サポート、複数サイト運用から比較します。',
   enDescription:'Compare XServer and Lolipop by pricing, storage, WordPress, backups, telephone support, and multi-site operations.',
   jaLead:'初期費用を抑えて小規模サイトから始めるならロリポップ！の各プラン、大容量と複数サイト運用を早い段階から想定するならエックスサーバーが候補です。最安プランではなく、実際に使うWordPress対応プラン同士で比較します。',
   enLead:'Lolipop offers a broader low-cost entry ladder for smaller projects, while XServer is a candidate when larger storage and multi-site operation are planned early. Compare WordPress-capable plans that match the workload, not the lowest headline price.'},
  {slug:'xserver-business-review',type:'review',cta:'xserver-business-main',business:true,
   jaTitle:'XServerビジネスレビュー｜共有・仮想・物理専用サーバーの選び方',
   enTitle:'XServer Business Review: Shared, Virtual, and Physical Managed Servers',
   jaDescription:'XServerビジネスを公式情報で検証。共有サーバー、仮想・物理マネージド専用サーバー、料金、SLA、管理機能、サポートを解説します。',
   enDescription:'Review XServer Business shared hosting and managed virtual and physical dedicated servers by pricing, SLA, controls, and support.',
   jaLead:'XServerビジネスは、一般向けエックスサーバーを基盤に、法人向けの管理、設定代行、セキュリティ、専用サーバー選択肢を強化したサービスです。契約担当者が「法人だから高いプラン」と決めるのではなく、共有・仮想・物理の必要性を障害影響、権限、予算から判断します。',
   enLead:'XServer Business extends the XServer operating model with business administration, setup assistance, security controls, and managed dedicated options. The choice among shared, virtual, and physical plans should follow isolation, access control, operational support, and budget rather than company status alone.'},
  {slug:'xserver-vs-xserver-business',type:'comparison',cta:'xserver-business-guide',business:true,
   jaTitle:'エックスサーバーとXServerビジネスの違い｜法人はどちらを選ぶべきか',
   enTitle:'XServer vs XServer Business: Which Service Fits a Company?',
   jaDescription:'一般向けエックスサーバーとXServerビジネスを、料金、初期費用、管理権限、設定代行、セキュリティ、専用環境、サポートから比較します。',
   enDescription:'Compare XServer and XServer Business by pricing, setup fees, permissions, assisted setup, security, isolation, and support.',
   jaLead:'一般向けエックスサーバーのビジネスプランと、別サービスのXServerビジネスは同じものではありません。小規模法人で標準機能が足りる場合と、複数担当者、設定代行、専用環境、管理統制が必要な場合を分けて選びます。',
   enLead:'The Business plan inside regular XServer is not the same product as XServer Business. A small company may be served by standard XServer, while organizations needing delegated administration, assisted operations, dedicated environments, or stronger governance should evaluate XServer Business.'}
];

const planTableJa = {headers:['プラン','36か月の通常月額換算','容量','主な差分'],rows:[
  ['スタンダード','990円','500GB NVMe','基本機能、条件付きで独自ドメイン最大2つ'],
  ['プレミアム','1,980円','600GB NVMe','対象ドメイン拡大、Xwrite無料特典'],
  ['ビジネス','3,960円','700GB NVMe','法人向け管理・改ざん検知・無料代行枠']
]};
const planTableEn = {headers:['Plan','Normal 36-month equivalent','Storage','Primary distinction'],rows:[
  ['Standard','JPY 990','500 GB NVMe','Core features and up to two qualifying domains under conditions'],
  ['Premium','JPY 1,980','600 GB NVMe','Broader domain choices and Xwrite benefit'],
  ['Business','JPY 3,960','700 GB NVMe','Business controls, tamper detection, and included assistance']
]};
const businessTableJa = {headers:['サービス','主な用途','通常料金の考え方','運用上の特徴'],rows:[
  ['XServer','個人・小規模法人のWeb/WordPress','36か月月額換算990円から','共用環境、一般向け管理画面'],
  ['XServerビジネス共有','法人サイト・メール・運用代行','36か月月額3,762円から＋初期費用','法人機能、設定代行、管理支援'],
  ['仮想マネージド専用','高負荷・分離・管理者不足','36か月月額19,800円から＋初期費用','仮想専有、運用保守を提供者が担当'],
  ['物理マネージド専用','物理占有・強い分離要件','月額29,700円から＋初期費用','1台を物理占有']
]};
const businessTableEn = {headers:['Service','Primary use','Normal pricing model','Operational profile'],rows:[
  ['XServer','Personal and smaller-company web/WordPress','From JPY 990 monthly equivalent on 36 months','Shared environment and standard control panel'],
  ['XServer Business shared','Company sites, email, and assisted operations','From JPY 3,762 per month on 36 months plus setup','Business controls and assisted configuration'],
  ['Managed virtual dedicated','Higher load, separation, limited in-house administration','From JPY 19,800 per month on 36 months plus setup','Virtual allocation with provider management'],
  ['Managed physical dedicated','Physical isolation requirements','From JPY 29,700 per month plus setup','Physical single-customer server']
]};

function commonJa(business=false){
  if(business) return [
    {heading:'料金とプラン構造',body:['XServerビジネスは共有サーバー、マネージド専用サーバー仮想タイプ、物理タイプに分かれます。共有サーバーはスタンダード、プレミアム、エンタープライズがあり、長期契約ほど月額換算が下がります。初期費用があるため、一般向けエックスサーバーと月額だけで比較しないでください。','専用サーバーは、仮想タイプが性能と費用のバランス、物理タイプが物理占有と分離を重視する構成です。キャンペーン実質額ではなく通常料金、初期費用、契約期間、移行費、社内工数を含めて判断します。'],table:businessTableJa},
    {heading:'法人運用で確認する機能',body:['法人では、複数担当者の権限分離、退職・異動時のアクセス回収、障害連絡、請求書、ログ、バックアップ、WAF、改ざん検知、メール認証を確認します。XServerビジネスは共有・専用プランごとに管理機能やリソースが異なります。','設定代行や移転支援があっても、業務システムの動作保証、外部SaaS、DNS、メール配送、アプリケーション保守まで自動的に含まれるわけではありません。責任範囲を契約前に文書化します。']},
    {heading:'共有・仮想・物理の選び方',body:['共有サーバーは費用を抑えやすく、一般的な会社サイトやメールに適します。仮想マネージド専用は他利用者の影響を抑えながら運用を委託したい場合、物理タイプは物理分離や占有リソースが要件の場合に検討します。','専用環境を選んでも、アプリケーション障害、設定不備、アカウント侵害、外部API停止は別のリスクです。可用性要件、復旧時間、バックアップ保管先、監視、責任者を決めます。']},
    {heading:'契約前チェック',body:['無料試用中に、管理画面、権限、メール、SSL、バックアップ、サポート受付、請求書、移行手順を確認します。成果条件上は6か月以上の契約が対象ですが、記事では利用者の必要期間を優先して説明します。'],bullets:['必要な分離レベルを共有・仮想・物理から決める','初期費用と契約期間分の総額を確認する','設定代行の対象外作業を確認する','障害時の連絡先と社内責任者を決める','試用環境でメールと復旧を検証する']}
  ];
  return [
    {heading:'基本仕様と料金の読み方',body:['通常の36か月契約時の月額換算はスタンダード990円、プレミアム1,980円、ビジネス3,960円です。初期費用は無料で、容量は500GB、600GB、700GBのNVMeです。表示額は契約期間分を月割りした金額なので、申込み時の支払総額を確認します。','キャンペーンのキャッシュバックや実質月額は期限と条件があります。長期運用の判断では通常更新料金、自動更新、ドメイン維持条件、移行費、外部バックアップ費を基準にします。'],table:planTableJa},
    {heading:'WordPress・バックアップ・セキュリティ',body:['WordPress簡単インストール、簡単移行、サイトコピー、リカバリー、無料SSL、WAFなどが提供されています。自動バックアップはWeb・メールとMySQLを過去14日分保持すると案内されています。','バックアップがあることと、必要時間内に復元できることは別です。テーマ更新、プラグイン変更、移行前には自分でもファイルとデータベースを取得し、DNS、外部ストレージ、SaaS設定も別に保全します。']},
    {heading:'複数サイト・メール運用',body:['マルチドメイン、サブドメイン、メールアカウント、FTPアカウントは無制限と案内されています。多数のサイトを置く場合は、容量だけでなくCPU・メモリ、同時処理、障害影響、権限、請求の集中を確認します。','メールではDKIM、DMARC、迷惑メール対策、転送、Webメールが利用できます。業務メールを運用する場合は、SPF/DKIM/DMARC、退職者アカウント、共有パスワード、配送ログ、Google Workspace等との併用を設計します。']},
    {heading:'契約前チェック',body:['10日間の無料お試しで管理画面や通常申込みを確認できますが、WordPressクイックスタートなど申込み方法によって試用条件が異なる場合があります。広告成果は6か月以上の契約が条件でも、読者には利用目的に合う期間を案内します。'],bullets:['通常更新料金と支払総額を確認する','ドメイン特典の契約期間・自動更新条件を確認する','試用とクイックスタートの違いを確認する','バックアップからの復元手順を試す','電話は平日、メールは24時間受付など窓口時間を分けて確認する']}
  ];
}
function commonEn(business=false){
  if(business) return [
    {heading:'Pricing and service structure',body:['XServer Business is divided into shared hosting, managed virtual dedicated servers, and managed physical dedicated servers. Shared hosting offers Standard, Premium, and Enterprise tiers, with lower monthly equivalents on longer contracts. Setup fees mean it should not be compared with regular XServer on monthly price alone.','Virtual managed dedicated plans balance isolation and cost, while physical plans assign a physical server to one customer. Evaluate normal rates, setup charges, contract length, migration work, and internal operating cost instead of a temporary campaign figure.'],table:businessTableEn},
    {heading:'Business operating requirements',body:['Companies should review separated administrator rights, access removal after staff changes, incident notification, invoices, logs, backups, WAF, tamper detection, and mail authentication. Capabilities differ across shared and dedicated XServer Business plans.','Assisted configuration and migration do not automatically cover application warranties, third-party SaaS, DNS ownership, mail delivery, or software maintenance. Document the provider and customer responsibility boundary before signing.']},
    {heading:'Choosing shared, virtual, or physical',body:['Shared hosting is the cost-oriented option for common company sites and email. Managed virtual dedicated hosting is relevant when stronger separation and provider-managed operations are needed. Physical dedicated hosting fits explicit physical-isolation or exclusive-resource requirements.','A dedicated environment does not remove application failures, configuration mistakes, compromised accounts, or external API outages. Define availability, recovery time, backup location, monitoring, and named owners.']},
    {heading:'Pre-contract checklist',body:['Use the trial to inspect administration, permissions, email, SSL, backups, support channels, invoicing, and migration. The affiliate condition requires a contract of at least six months, but editorial guidance should prioritize the reader’s actual operating term.'],bullets:['Choose the required separation level','Calculate setup and full contract cost','Confirm exclusions from assisted setup','Assign internal incident and account owners','Test mail and recovery during the trial']}
  ];
  return [
    {heading:'Reading pricing and specifications',body:['Normal thirty-six-month monthly equivalents are JPY 990 for Standard, JPY 1,980 for Premium, and JPY 3,960 for Business. Setup is free, and NVMe storage is 500 GB, 600 GB, and 700 GB. The displayed monthly figure is a division of the prepaid contract amount, so review the actual checkout total.','Cashback and effective monthly prices have dates and conditions. Long-term evaluation should use normal renewal pricing, automatic-renewal settings, domain-benefit conditions, migration work, and independent backup cost.'],table:planTableEn},
    {heading:'WordPress, backup, and security',body:['XServer provides WordPress installation, migration, site copying, recovery tools, SSL, and WAF controls. Official specifications state that Web and mail data plus MySQL backups are retained for the previous fourteen days.','A retained backup is not proof that the site can be restored within the required time. Take independent file and database backups before migrations and updates, and separately protect DNS, external storage, and SaaS configuration.']},
    {heading:'Multiple sites and email',body:['The service lists unlimited domains, subdomains, email accounts, and FTP accounts. For many sites, also evaluate CPU and memory contention, incident blast radius, permissions, and concentration of billing and ownership.','Mail functions include DKIM, DMARC, spam controls, forwarding, and webmail. Business mail requires explicit SPF/DKIM/DMARC design, leaver procedures, password controls, delivery logging, and any Google Workspace or Microsoft 365 split.']},
    {heading:'Pre-contract checklist',body:['A ten-day trial is available for regular applications, while signup paths such as WordPress Quick Start can have different trial conditions. The affiliate program pays only on contracts of six months or longer, but the article should recommend the term that fits the reader.'],bullets:['Check normal renewal and checkout total','Confirm domain-benefit term and auto-renewal conditions','Distinguish trial and Quick Start paths','Test backup restoration','Separate weekday telephone hours from round-the-clock email intake']}
  ];
}

const specificJa = {
 'xserver-rental-server-review':[
  {heading:'結論：WordPressと複数サイトを国内環境でまとめたい人向け',body:['スタンダードは500GB、無料SSL、WordPress支援、14日分バックアップを備え、多くの個人ブログや小規模サイトで検討しやすいプランです。プレミアム・ビジネスは容量やドメイン、Xwrite、法人機能の要件がある場合に比較します。','国内シェアNo.1や速度No.1は公式が調査条件付きで掲げる表現です。実際の選定では、自サイトのTTFB、LCP、管理画面応答、バックアップ時間、サポート品質を試用環境で確認します。']},
  {heading:'向いている人・慎重に検討したい人',body:['向いているのは、国内サポート、WordPress、複数ドメイン、メールを一つの契約にまとめたい人です。長期契約の一括前払いを避けたい人、時間課金を使いたい人、物理専用や高度なマネージド運用が必要な法人は他サービスも比較します。']}
 ],
 'xserver-rental-server-pricing':[
  {heading:'結論：多くの利用者はスタンダードから検討',body:['スタンダードは通常36か月月額換算990円、500GBで、WordPress・メール・複数ドメインの基本機能を利用できます。プレミアムは600GBとXwrite無料特典、ビジネスは700GBと法人向け管理機能が主な差です。','容量だけで上位プランへ上げず、Xwrite、対象ドメイン、管理者ユーザー、改ざん検知、無料代行枠が必要かで選びます。']},
  {heading:'支払総額と成果条件',body:['A8.netの成果条件はスタンダード、プレミアム、ビジネスの6か月以上の契約です。3か月契約は成果対象外ですが、記事では広告成果ではなく利用者の必要期間を基準に案内します。','無料お試しから本契約する場合は、申込み後10日以内の支払い、契約期間、返金を伴うキャンセル条件を確認します。']}
 ],
 'xserver-rental-server-pros-cons':[
  {heading:'主なメリット',body:['WordPress、ドメイン、メール、SSL、バックアップを一つの管理画面で扱いやすく、複数サイトを追加しても基本機能の課金項目が増えにくい点が利点です。国内向けの電話、メール、チャット窓口もあります。'],bullets:['初期費用無料、通常月額990円から','500GB以上のNVMe容量','WordPress設置・移行・リカバリー機能','Web・メール・MySQLの14日分バックアップ','複数ドメイン、メール、FTPの運用']},
  {heading:'主なデメリットと注意点',body:['長期契約は契約期間分の前払いで、キャンペーン終了後や更新時の負担を見落としやすい点に注意します。無制限表記も、実際の性能・迷惑メール対策・アカウント管理には運用上の制約があります。'],bullets:['最安の月額表示は長期前払いの月割り','ドメイン無料特典に契約期間と自動更新条件','電話・チャットは平日受付','専用リソース保証が必要なら別サービスを比較','一般プランのビジネスとXServerビジネスは別物']}
 ],
 'xserver-wordpress-quick-start-guide':[
  {heading:'新規サイトの2つの始め方',body:['申込み時にドメイン取得、SSL、WordPress設置をまとめるクイックスタートと、通常契約後にサーバーパネルから簡単インストールする方法があります。試用したい場合は通常申込み、最短で公開準備したい場合はクイックスタートを比較します。','管理者名、メールアドレス、パスワードは公開情報や他サービスと使い回さず、二段階認証、バックアップ、更新担当を設定します。']},
  {heading:'既存WordPressの移行',body:['簡単移行では移行元URLとWordPressログイン情報を使いますが、特殊構成、容量、認証、セキュリティプラグイン等で失敗する場合があります。移行前に元サーバーのファイル・DBを取得し、テストURLで表示と管理画面を確認します。','DNS切替後も旧サーバーを一定期間残し、フォーム、メール、決済、予約、アクセス解析、キャッシュ、cronを確認してから解約します。']}
 ],
 'xserver-multiple-domain-site-guide':[
  {heading:'複数サイト運用の基本設計',body:['サイトごとにドメイン、WordPress管理者、メール、FTP、バックアップ、請求責任者を台帳化します。一つのサーバーに集約すると管理は簡単になりますが、障害・侵害・契約停止の影響範囲も広がります。','顧客サイトを預かる制作会社は、契約名義、ドメイン所有権、退職者権限、納品時の移管方法を契約書で決めます。']},
  {heading:'独自ドメイン永久無料特典',body:['スタンダードは新規契約時の契約期間と自動更新設定に条件があり、12か月以上で1つ、24か月以上で2つが案内されています。プレミアム・ビジネスは本契約中であれば2つ利用できる条件です。','対象TLD、取得・移管・切替の可否、他社移管時の解除手数料を確認します。無料特典と、所有している任意の独自ドメインをサーバーへ設定できることは別の話です。']}
 ],
 'xserver-company-website-email-guide':[
  {heading:'会社名義で準備するもの',body:['サーバー、ドメイン、SSL、メール、Googleアカウント、Search Console、Analyticsは会社が管理できる名義にします。制作会社や担当者個人のアカウントだけで管理すると、退職・契約終了時に復旧できなくなるおそれがあります。','代表メール、請求連絡先、障害連絡先、二段階認証の復旧手段を複数人で管理し、権限は必要最小限にします。']},
  {heading:'独自ドメインメールの注意点',body:['メールアドレスを作るだけでなく、SPF、DKIM、DMARC、迷惑メール対策、転送、容量、退職者アカウント、共有アドレスを設計します。大量配信や営業メールは通常の業務メールと分離し、配信サービスを利用します。','Webサイトとメールを同じサーバーに置く場合、サーバー移転やDNS変更がメールへ与える影響を事前に確認します。']}
 ],
 'xserver-vs-conoha-wing':[
  {heading:'結論：長期運用か契約柔軟性か',body:['エックスサーバーは長期契約の通常料金、WordPress支援、複数サイト運用を一体で比較しやすい構成です。ConoHa WINGはWINGパックに加え、時間単位の通常料金を選べる点が差になります。','独自ドメイン特典は、エックスサーバーではプランと契約条件、ConoHaではWINGパック等の条件を確認します。'],table:{headers:['項目','エックスサーバー','ConoHa WING'],rows:[['料金方式','3～36か月の契約期間','WINGパック／時間単位通常料金'],['通常最小容量','500GB NVMe','公式現行プランを確認'],['無料試用','10日間','申込方式により確認'],['ドメイン特典','条件付きで最大2つ','WINGパック等の条件付き'],['比較の軸','複数サイト・国内運用','短期柔軟性・管理画面']]}},
  {heading:'どちらを選ぶか',body:['長期運用、複数ドメイン、既存のエックスサーバー系管理経験を重視するならエックスサーバーが候補です。短期検証、時間課金、ConoHaの管理画面や他サービスとの統合を重視するならConoHa WINGを試します。','同じWordPressサイトを使い、初回表示、キャッシュ時、管理画面、バックアップ、障害情報、解約手順を比較してください。']}
 ],
 'xserver-vs-lolipop':[
  {heading:'結論：低価格から段階的に始めるか、余裕を持って始めるか',body:['ロリポップ！は低価格帯から複数のプランを選びやすく、小規模サイトの費用を抑えたい場合に候補です。エックスサーバーはスタンダードから500GBを備え、複数サイトとWordPress運用をまとめたい場合に比較しやすい構成です。','ロリポップ！ではWordPress、バックアップ、電話サポート等の対応がプランで異なるため、最安プランだけで比較しません。'],table:{headers:['項目','エックスサーバー','ロリポップ！'],rows:[['開始価格の考え方','スタンダード990円から','低価格プランから段階的'],['容量','500GBから','プランにより異なる'],['WordPress','全3プランで運用候補','対応プランを選択'],['バックアップ','14日分自動バックアップ','プラン・機能条件を確認'],['向く運用','複数サイト・長期','小規模開始・予算重視']]}},
  {heading:'選び方',body:['1サイトを低コストで始め、アクセスや必要機能に応じて上げたいならロリポップ！を比較します。複数サイト、メール、容量、バックアップを最初からまとめたいならエックスサーバーを比較します。','移転の手間も費用なので、1年後のサイト数、画像容量、メール、担当者、更新作業を予測します。']}
 ],
 'xserver-business-review':[
  {heading:'結論：法人専用の運用支援と分離要件がある場合に検討',body:['一般的な会社サイトやメールであれば、まず共有サーバーで要件を満たせるか確認します。アクセス負荷、セキュリティ、権限、監査、専用リソース、運用担当者不足が課題なら仮想・物理マネージド専用サーバーを検討します。','XServerビジネスは法人向け機能と支援を提供しますが、社内のアカウント管理、コンテンツ更新、アプリケーション脆弱性、外部サービス障害まで代行するわけではありません。']},
  {heading:'成果条件と広告運用',body:['A8.netでは共有サーバー6か月以上が10,000円、仮想タイプ6か月以上が20,000円、物理タイプ6か月以上が30,000円の成果地点です。記事では報酬額ではなく、必要な分離と運用支援を基準に提案します。','一般向けエックスサーバーの広告リンクを法人専用サーバー記事へ流用せず、XServerビジネス専用リンクを使用します。']}
 ],
 'xserver-vs-xserver-business':[
  {heading:'結論：会社規模ではなく運用要件で分ける',body:['小規模法人でも、一般向けエックスサーバーのスタンダードやビジネスプランで足りる場合があります。一方、複数管理者、設定代行、改ざん検知、専用窓口、仮想・物理専用環境が必要ならXServerビジネスを比較します。','「法人だからXServerビジネス」「個人だから一般向け」と機械的に分けず、障害影響、責任分界、復旧時間、管理者人数で選びます。'],table:businessTableJa},
  {heading:'一般向けビジネスプランとの違い',body:['一般向けエックスサーバー内のビジネスプランは、700GB、管理者ユーザー、改ざん検知、無料代行枠などを持つ上位プランです。XServerビジネスは別契約の法人向けサービスで、共有・仮想・物理専用サーバーと法人運用支援を提供します。','名称だけでなく、初期費用、料金、試用期間、管理機能、SLA、設定代行、専用環境を個別に比較してください。']}
 ]
};

const specificEn = {
 'xserver-rental-server-review':[
  {heading:'Verdict: a domestic platform for WordPress and multiple sites',body:['Standard provides 500 GB NVMe storage, SSL, WordPress tools, and fourteen-day backups, making it a practical starting point for many blogs and smaller sites. Premium and Business should be considered when domain choices, Xwrite, administration, or storage justify the higher plan.','Market-share and speed labels are provider claims with stated research conditions. Test TTFB, LCP, administration response, backup time, and support on the intended site during the trial.']},
  {heading:'Who it fits and who should compare alternatives',body:['It fits users who want Japan-based support, WordPress, domains, and mail in one contract. Users needing hourly billing, guaranteed dedicated resources, or extensive managed enterprise operations should compare alternatives.']}
 ],
 'xserver-rental-server-pricing':[
  {heading:'Verdict: start the comparison with Standard',body:['Standard is JPY 990 per month on the normal thirty-six-month equivalent with 500 GB storage. Premium adds 600 GB and the Xwrite benefit, while Business adds 700 GB and business-oriented controls.','Do not upgrade for storage alone. Identify whether the project actually needs Xwrite, broader domain eligibility, administrator users, tamper detection, or included assistance.']},
  {heading:'Checkout total and affiliate eligibility',body:['The A8.net program pays on contracts of at least six months, and three-month contracts are excluded. Editorial guidance must still recommend the term that fits the reader rather than optimizing for commission eligibility.','When converting from the trial, confirm payment timing, contract term, renewal, and the rule concerning cancellations with refunds.']}
 ],
 'xserver-rental-server-pros-cons':[
  {heading:'Advantages',body:['WordPress, domains, email, SSL, and backups can be managed within one service, and the cost structure does not add a platform charge for every additional domain. Japan-based telephone, mail, and chat support are available on different schedules.'],bullets:['No setup fee and normal pricing from JPY 990','500 GB or more of NVMe storage','WordPress installation, migration, and recovery tools','Fourteen-day Web, mail, and database backups','Multi-domain and mail operation']},
  {heading:'Trade-offs',body:['Long terms are prepaid, and campaign or effective pricing can obscure renewal cost. Unlimited labels do not remove resource, anti-abuse, mail-delivery, or access-governance constraints.'],bullets:['Lowest monthly figure assumes a long prepaid term','Domain benefits have term and auto-renewal conditions','Telephone and chat are weekday services','Dedicated guarantees require another service','The Business plan and XServer Business are different products']}
 ],
 'xserver-wordpress-quick-start-guide':[
  {heading:'Two paths for a new WordPress site',body:['Quick Start combines domain, SSL, and WordPress during signup. The alternative is a regular contract followed by WordPress installation in the server panel. Compare the need for a trial against the need for the shortest setup path.','Use unique administrator credentials, enable account protections, and assign update and recovery owners before launch.']},
  {heading:'Migrating an existing site',body:['The migration tool uses the source URL and WordPress login, but unusual architectures, authentication, security plugins, or data size can cause failure. Back up the source files and database and validate the migrated site on a test route.','Keep the old hosting active after DNS cutover until forms, email, payments, booking, analytics, cache, and scheduled jobs have been verified.']}
 ],
 'xserver-multiple-domain-site-guide':[
  {heading:'Governance for multiple sites',body:['Maintain a register for each domain, WordPress administrator, mail system, FTP account, backup, contract owner, and billing owner. Consolidation simplifies administration but expands the impact of a compromised account, outage, or contract suspension.','Agencies should document domain ownership, customer access, leaver procedures, and the handover process.']},
  {heading:'Permanent domain benefit',body:['For a new Standard contract, official conditions specify one free domain on at least twelve months and two on at least twenty-four months, together with automatic renewal. Premium and Business provide two while the server contract remains active.','Confirm eligible TLDs, transfer support, switching rules, and any fee when moving a benefited domain away. This benefit is separate from the ability to attach independently owned domains.']}
 ],
 'xserver-company-website-email-guide':[
  {heading:'Use company-owned accounts',body:['Hosting, domains, SSL, mail, Search Console, Analytics, and recovery methods should be controlled by the company. Accounts owned only by an agency or individual employee create continuity risk at staff or vendor changes.','Maintain multiple authorized contacts, recovery methods, and least-privilege access.']},
  {heading:'Domain email design',body:['Creating mailboxes is only the first step. Plan SPF, DKIM, DMARC, spam controls, forwarding, mailbox capacity, shared addresses, and leaver handling. Separate bulk marketing delivery from normal company mail.','When website and mail share DNS, test how a hosting move or DNS change affects delivery before production cutover.']}
 ],
 'xserver-vs-conoha-wing':[
  {heading:'Verdict: long-term operating model or billing flexibility',body:['XServer is easier to evaluate as a prepaid long-term service with integrated WordPress and multi-site operations. ConoHa WING also offers standard hourly billing in addition to WING Pack.','Domain benefits are conditional on the relevant plan and contract structure at both providers.'],table:{headers:['Item','XServer','ConoHa WING'],rows:[['Billing','Prepaid terms','WING Pack or hourly standard billing'],['Storage','500 GB NVMe from Standard','Confirm current official tier'],['Trial','Ten days','Depends on application path'],['Domain benefit','Up to two under conditions','Conditional on WING Pack or offer'],['Primary fit','Multi-site long-term operation','Billing flexibility and ConoHa ecosystem']]}},
  {heading:'How to choose',body:['Choose XServer when long-term multi-domain operation and its domestic workflow are priorities. Test ConoHa WING when short-term flexibility or the ConoHa administration model is important.','Use the same WordPress site to test first view, cached view, dashboard response, backups, support information, and cancellation.']}
 ],
 'xserver-vs-lolipop':[
  {heading:'Verdict: low-cost entry or larger starting margin',body:['Lolipop offers a broader ladder from low-cost plans and is relevant for a small project with strict budget limits. XServer starts with 500 GB and is easier to compare for planned multi-site and WordPress growth.','WordPress, backups, and support differ by Lolipop plan, so compare the actual eligible tier rather than the lowest advertised price.'],table:{headers:['Item','XServer','Lolipop'],rows:[['Starting model','Standard from JPY 990','Multiple lower-cost tiers'],['Storage','500 GB or more','Varies by plan'],['WordPress','Candidate on all three main tiers','Choose a WordPress-capable tier'],['Backups','Fourteen-day automatic backups','Confirm plan and feature conditions'],['Typical fit','Multi-site and long-term','Smaller entry and budget control']]}},
  {heading:'Selection method',body:['Choose Lolipop when one smaller site and gradual upgrades are the priority. Choose XServer when multiple sites, email, storage, and backups should be consolidated early.','Include the future cost of migration when estimating the first-year saving.']}
 ],
 'xserver-business-review':[
  {heading:'Verdict: evaluate when business operations or isolation justify it',body:['Start by testing whether shared XServer Business meets a normal company-site and mail requirement. Evaluate virtual or physical managed dedicated plans when load, separation, security, permissions, or limited in-house administration justify them.','Business-oriented support does not replace internal access control, content maintenance, application security, or third-party service resilience.']},
  {heading:'Affiliate conditions',body:['The A8.net program lists JPY 10,000 for shared hosting, JPY 20,000 for managed virtual dedicated, and JPY 30,000 for managed physical dedicated on contracts of at least six months. Recommendations must be based on isolation and operating requirements, not commission size.','Use the XServer Business material only on business-service pages, not the regular XServer destination.']}
 ],
 'xserver-vs-xserver-business':[
  {heading:'Verdict: divide by operating requirements, not company size',body:['A small company may be adequately served by regular XServer Standard or Business. XServer Business becomes relevant when delegated administration, assisted configuration, stronger controls, dedicated options, or a formal business-support model are required.','Do not automatically map companies to XServer Business and individuals to regular XServer. Use blast radius, responsibility, recovery objectives, and administrator count.'],table:businessTableEn},
  {heading:'Business plan versus XServer Business',body:['The Business plan inside regular XServer adds 700 GB, administrator users, tamper detection, and included assistance. XServer Business is a separate service with shared, managed virtual dedicated, and managed physical dedicated offerings.','Compare setup fee, normal rates, trial period, controls, SLA, assistance, and isolation rather than product names.']}
 ]
};

const ctaLabels = {
  'xserver-wordpress-quick-start-guide': {ja: '公式のWordPress開始手順を確認', en: 'Check the official WordPress setup guide'},
  'xserver-company-website-email-guide': {ja: '会社メール・ホームページ準備ガイドを確認', en: 'Check the company website and email guide'},
  'xserver-vs-xserver-business': {ja: '法人向けサーバー選び方ガイドを確認', en: 'Check the business hosting selection guide'}
};

const relatedJa = routes.map(r=>({label:r.jaTitle.replace(/【.*?】/g,''),url:`/ja/hosting-security/${r.slug}/`,description:r.jaDescription}));
const relatedEn = routes.map(r=>({label:r.enTitle.replace(/\s*\(2026\)/g,''),url:`/en/hosting-security/${r.slug}/`,description:r.enDescription}));
function faqJa(route){
 if(route.business) return [
  {question:'XServerビジネスは一般向けエックスサーバーと同じですか？',answer:'別サービスです。一般向けエックスサーバーにもビジネスプランがありますが、XServerビジネスは共有・仮想・物理専用サーバーと法人向け運用支援を提供します。'},
  {question:'法人なら必ずXServerビジネスを選ぶべきですか？',answer:'いいえ。小規模な会社サイトやメールなら一般向けエックスサーバーで足りる場合があります。権限、設定代行、分離、専用環境、SLA等の要件で判断します。'},
  {question:'無料お試しはありますか？',answer:'公式サイトではXServerビジネスに14日間の無料お試しが案内されています。試用対象、支払、移行、専用プランの条件を申込画面で確認してください。'}
 ];
 return [
  {question:'エックスサーバーの通常料金はいくらですか？',answer:'公式機能一覧では36か月契約時の月額換算がスタンダード990円、プレミアム1,980円、ビジネス3,960円です。契約期間分の支払総額と最新キャンペーンを申込画面で確認してください。'},
  {question:'10日間無料お試しはありますか？',answer:'通常のサーバー申込みには10日間無料のお試しが案内されています。WordPressクイックスタートなど申込み方法により条件が異なるため確認が必要です。'},
  {question:'バックアップは何日分ですか？',answer:'公式機能一覧ではWeb・メールデータとMySQLデータベースを過去14日分保持します。外部サービスやDNSを含む独立バックアップも用意してください。'}
 ];
}
function faqEn(route){
 if(route.business) return [
  {question:'Is XServer Business the same as regular XServer?',answer:'No. Regular XServer has a plan named Business, while XServer Business is a separate service offering shared and managed virtual and physical dedicated hosting.'},
  {question:'Does every company need XServer Business?',answer:'No. A smaller company site may fit regular XServer. Decide by permissions, assisted operations, isolation, dedicated resources, and service-level requirements.'},
  {question:'Is a trial available?',answer:'The official XServer Business site advertises a fourteen-day trial. Confirm eligibility, payment, migration, and dedicated-plan conditions at application.'}
 ];
 return [
  {question:'What are the normal XServer prices?',answer:'Official specifications list thirty-six-month monthly equivalents of JPY 990 for Standard, JPY 1,980 for Premium, and JPY 3,960 for Business. Confirm the full prepaid amount and current offers at checkout.'},
  {question:'Is there a ten-day trial?',answer:'A ten-day trial is advertised for regular server applications. Conditions differ for signup paths such as WordPress Quick Start.'},
  {question:'How many days of backup are retained?',answer:'Official specifications state fourteen days for Web and mail data and fourteen days for MySQL. Maintain independent backups for DNS and external services.'}
 ];
}

for(const route of routes){
 for(const lang of ['ja','en']){
  const ja=lang==='ja';
  const business=Boolean(route.business);
  const sources=[...(business?(ja?businessSourcesJa:businessSourcesEn):(ja?xserverSourcesJa:xserverSourcesEn))];
  if(route.competitor){
   const extras=competitorSources[route.competitor];
   sources.push(...extras.map(s=>ja?s:{label:s.label.replace('料金',' pricing').replace('リソース',' resources').replace('ビジネスプラン',' business plans').replace('ロリポップ！','Lolipop').replace('機能一覧',' feature list').replace('サーバー仕様',' server specifications'),url:s.url}));
  }
  const article={
   id:`${route.slug}-${lang}`,translationKey:route.slug,language:lang,type:route.type,status:'published',slug:route.slug,category:'hosting-security',topic:'web-hosting',
   badge:ja?'広告掲載・公式情報検証':'Official-source verification',title:ja?route.jaTitle:route.enTitle,metaTitle:ja?route.jaTitle:route.enTitle,
   description:ja?route.jaDescription:route.enDescription,lead:ja?route.jaLead:route.enLead,publishedAt:date,updatedAt:date,verifiedAt:date,author:ja?'Luqevora編集部':'Luqevora Editorial Team',featured:['xserver-rental-server-review','xserver-rental-server-pricing','xserver-business-review'].includes(route.slug),affiliateDisclosure:ja,
   ctas:[{label:ctaLabels[route.slug]?.[lang] || (ja?(business?'XServerビジネスの公式条件を確認':'エックスサーバーの公式条件を確認'):(business?'Check official XServer Business terms':'Check official XServer terms')),officialUrl:business?businessOfficial:official,affiliateKey:ja?route.cta:(business?'xserver-business-official':'xserver-official')}],
   sources,sections:[...(ja?specificJa[route.slug]:specificEn[route.slug]),...(ja?commonJa(business):commonEn(business))],faqs:ja?faqJa(route):faqEn(route),
   relatedLinks:(ja?relatedJa:relatedEn).filter(l=>!l.url.endsWith(`/${route.slug}/`)).slice(0,9)
  };
  for(const section of article.sections||[]) delete section.affiliateMaterialKey;
  fs.writeFileSync(path.join(articleRoot,lang,`${route.slug}.json`),`${JSON.stringify(article,null,2)}\n`);
 }
}

// Replace the legacy generated comparison with the structured source while preserving its public URL.
const legacyPath=path.join(root,'content/article-batches/legacy-migrations.json');
if(fs.existsSync(legacyPath)){
  const legacy=JSON.parse(fs.readFileSync(legacyPath,'utf8'));
  const filtered=legacy.filter((item)=>item.slug!=='xserver-vs-lolipop');
  if(filtered.length!==legacy.length) fs.writeFileSync(legacyPath,`${JSON.stringify(filtered,null,2)}\n`);
}

const affiliatePath=path.join(root,'content/config/affiliates.json');
const affiliates=JSON.parse(fs.readFileSync(affiliatePath,'utf8'));
const materials={
 'xserver-main':'<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+CO22XM+CO4+61JSI" rel="nofollow">レンタルサーバー エックスサーバー</a>\n<img border="0" width="1" height="1" src="https://www18.a8.net/0.gif?a8mat=4B84X2+CO22XM+CO4+61JSI" alt="">',
 'xserver-price':'<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+CO22XM+CO4+60OXE" rel="nofollow">初期費用無料、月額990円から、高速・多機能・高安定レンタルサーバー『エックスサーバー』</a>\n<img border="0" width="1" height="1" src="https://www15.a8.net/0.gif?a8mat=4B84X2+CO22XM+CO4+60OXE" alt="">',
 'xserver-domain':'<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+CO22XM+CO4+61C2Q" rel="nofollow">あなたのお持ちの独自ドメイン、全て利用できます！</a>\n<img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=4B84X2+CO22XM+CO4+61C2Q" alt="">',
 'xserver-wordpress-guide':'<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+CO22XM+CO4+6QEUQ" rel="nofollow">【初心者でも安心】たった10分で出来るWordPressブログの始め方</a>\n<img border="0" width="1" height="1" src="https://www10.a8.net/0.gif?a8mat=4B84X2+CO22XM+CO4+6QEUQ" alt="">',
 'xserver-company-email':'<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+CO22XM+CO4+6SCAQ" rel="nofollow">【初心者でも簡単】会社メールアドレスとホームページの準備方法を丁寧に解説</a>\n<img border="0" width="1" height="1" src="https://www11.a8.net/0.gif?a8mat=4B84X2+CO22XM+CO4+6SCAQ" alt="">',
 'xserver-business-main':'<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+CO22XM+CO4+6LP3M" rel="nofollow">XServerビジネス</a>\n<img border="0" width="1" height="1" src="https://www13.a8.net/0.gif?a8mat=4B84X2+CO22XM+CO4+6LP3M" alt="">',
 'xserver-business-guide':'<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+CO22XM+CO4+6SK0I" rel="nofollow">ビジネス用途・法人様向け レンタルサーバー選び方ガイド</a>\n<img border="0" width="1" height="1" src="https://www16.a8.net/0.gif?a8mat=4B84X2+CO22XM+CO4+6SK0I" alt="">'
};
for(const [key,rawHtml] of Object.entries(materials)) affiliates.links[key]={type:'rawHtml',network:'A8.net',programId:'s00000001642001',language:'ja',destination:key.startsWith('xserver-business')?businessOfficial:official,rawHtml};
affiliates.links['xserver-official']={type:'official',network:'Official',language:'en',destination:official,url:official};
affiliates.links['xserver-business-official']={type:'official',network:'Official',language:'en',destination:businessOfficial,url:businessOfficial};
fs.writeFileSync(affiliatePath,`${JSON.stringify(affiliates,null,2)}\n`);

// Upgrade existing Japanese XServer Business references to the active A8.net material.
for(const filename of fs.readdirSync(path.join(articleRoot,'ja')).filter(n=>n.endsWith('.json'))){
 const file=path.join(articleRoot,'ja',filename); let a; try{a=JSON.parse(fs.readFileSync(file,'utf8'));}catch{continue;}
 let changed=false;
 for(const cta of a.ctas||[]){if(cta.affiliateKey==='xserver-business-official'){cta.affiliateKey='xserver-business-main';changed=true;}}
 for(const section of a.sections||[]){if(section.affiliateMaterialKey==='xserver-business-official'){section.affiliateMaterialKey='xserver-business-main';changed=true;}}
 if(changed){a.affiliateDisclosure=true;a.updatedAt=date;a.verifiedAt=date;fs.writeFileSync(file,`${JSON.stringify(a,null,2)}\n`);}
}
// Add XServer option to the existing Shin comparison.
const shinCompare=path.join(articleRoot,'ja','shin-rental-server-vs-xserver.json');
if(fs.existsSync(shinCompare)){
 const a=JSON.parse(fs.readFileSync(shinCompare,'utf8')); a.ctas=a.ctas||[];
 if(!a.ctas.some(c=>c.affiliateKey==='xserver-main')) a.ctas.push({label:'エックスサーバーの公式条件を確認',officialUrl:official,affiliateKey:'xserver-main'});
 a.updatedAt=date;a.verifiedAt=date;fs.writeFileSync(shinCompare,`${JSON.stringify(a,null,2)}\n`);
}

const seoPath=path.join(root,'content/config/seo.json'); const seo=JSON.parse(fs.readFileSync(seoPath,'utf8'));
for(const route of routes) for(const lang of ['ja','en']){const p=`content/articles/${lang}/${route.slug}.json`;if(!seo.indexing.includeSourceFiles.includes(p))seo.indexing.includeSourceFiles.push(p);}
for(const id of ['xserver','xserver-business']) if(!seo.indexing.priorityProducts.includes(id)) seo.indexing.priorityProducts.push(id);
fs.writeFileSync(seoPath,`${JSON.stringify(seo,null,2)}\n`);

const homePath=path.join(root,'content/config/home.json'); const home=JSON.parse(fs.readFileSync(homePath,'utf8'));
home.featuredComparisons=['xserver-vs-conoha-wing','xserver-vs-lolipop','xserver-vs-xserver-business','shin-rental-server-vs-xserver','ochanoko-saisai-vs-goope'];
home.featuredReviews=['xserver-rental-server-review','xserver-business-review','xserver-rental-server-pricing','shin-rental-server-review','jimdo-review','ochanoko-saisai-review'];
fs.writeFileSync(homePath,`${JSON.stringify(home,null,2)}\n`);

const categoryPath=path.join(root,'content/config/categories.json'); const categories=JSON.parse(fs.readFileSync(categoryPath,'utf8'));
const hosting=categories.find(c=>c.id==='hosting-security');
hosting.description.ja='エックスサーバー、シンレンタルサーバー、ConoHa WING、ロリポップ！などを、通常料金・更新・WordPress・容量・バックアップ・移行・法人運用から比較します。';
hosting.description.en='Compare XServer, Shin Rental Server, ConoHa WING, Lolipop, and other hosting services by normal pricing, WordPress, storage, backups, migration, and business operations.';
fs.writeFileSync(categoryPath,`${JSON.stringify(categories,null,2)}\n`);

const profilePath=path.join(root,'content/article-batches/product-profiles-expansion.json'); const profiles=JSON.parse(fs.readFileSync(profilePath,'utf8'));
profiles.xserver={name:'XServer',affiliateKey:'xserver-main',sources:xserverSourcesJa,positioning:{ja:'WordPress、複数ドメイン、メール、SSL、14日分バックアップを備える国内レンタルサーバー',en:'Japan-focused hosting with WordPress workflows, multiple domains, email, SSL, and fourteen-day backups'},pricing:{ja:'通常36か月月額換算はスタンダード990円、プレミアム1,980円、ビジネス3,960円。初期費用無料',en:'Normal thirty-six-month equivalents are JPY 990, JPY 1,980, and JPY 3,960, with no setup fee'},pricingDetail:{ja:'長期契約は契約期間分を前払い。キャンペーンではなく通常更新料金、ドメイン条件、移行・復旧費を含めて比較',en:'Long terms are prepaid; compare normal renewal, domain conditions, migration, and recovery rather than campaign effective pricing'},workflow:{ja:'WordPress簡単インストール・移行、無料SSL、WAF、バックアップ、メール、複数ドメインを管理',en:'Operate WordPress installation and migration, SSL, WAF, backups, email, and multiple domains'},bestFor:{ja:'国内サポートと複数WordPress・会社サイトを一つの管理環境にまとめたい個人・制作会社・中小企業',en:'Individuals, agencies, and smaller companies consolidating multiple WordPress or company sites with Japan-based support'},strengths:{ja:['500GB以上のNVMe','WordPress運用支援','14日分バックアップ','複数ドメイン・メール'],en:['500 GB or more NVMe','WordPress tools','Fourteen-day backups','Multi-domain and email']},limits:{ja:['長期契約は前払い','ドメイン特典に条件','電話・チャットは平日','専用保証は別サービス'],en:['Prepaid long terms','Conditional domain benefit','Weekday telephone and chat','Dedicated guarantees require another service']}};
profiles['xserver-business']={name:'XServer Business',affiliateKey:'xserver-business-main',sources:businessSourcesJa,positioning:{ja:'共有サーバーから仮想・物理マネージド専用まで、法人向け管理・支援を提供するホスティング',en:'Business hosting ranging from shared service to managed virtual and physical dedicated servers'},pricing:{ja:'共有36か月月額3,762円から。仮想専用19,800円から、物理専用29,700円から。初期費用あり',en:'Shared from JPY 3,762 per month on thirty-six months, managed virtual from JPY 19,800, physical from JPY 29,700, with setup fees'},pricingDetail:{ja:'キャンペーン実質額ではなく初期費用、通常月額、契約期間、移行、運用支援、社内工数で比較',en:'Compare setup, normal monthly rates, term, migration, assistance, and internal effort rather than effective campaign pricing'},workflow:{ja:'法人権限、設定代行、移転支援、セキュリティ、共有・専用環境を要件に合わせて運用',en:'Operate business permissions, assisted setup, migration, security, and shared or dedicated environments'},bestFor:{ja:'複数担当者、管理統制、設定支援、専用リソース、法人サポートを必要とする組織',en:'Organizations needing multiple administrators, governance, assisted operations, dedicated resources, and business support'},strengths:{ja:['共有・仮想・物理の選択肢','設定・移転支援','法人管理機能','マネージド専用サーバー'],en:['Shared, virtual, and physical options','Setup and migration assistance','Business controls','Managed dedicated servers']},limits:{ja:['初期費用あり','通常料金は一般向けより高い','専用でもアプリ運用は別責任','要件定義が必要'],en:['Setup fees','Higher normal cost than consumer hosting','Application operations remain separate','Requires clear requirements']}};
fs.writeFileSync(profilePath,`${JSON.stringify(profiles,null,2)}\n`);

// Add selected XServer cluster links to other hosting articles.
for(const lang of ['ja','en']){
 const dir=path.join(articleRoot,lang); const additions=(lang==='ja'?relatedJa:relatedEn).slice(0,6); const newNames=new Set(routes.map(r=>`${r.slug}.json`));
 for(const filename of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))){if(newNames.has(filename))continue; const file=path.join(dir,filename); let a;try{a=JSON.parse(fs.readFileSync(file,'utf8'));}catch{continue;} if(a.category!=='hosting-security'&&a.topic!=='web-hosting')continue; a.relatedLinks=Array.isArray(a.relatedLinks)?a.relatedLinks:[]; const urls=new Set(a.relatedLinks.map(l=>l.url)); for(const link of additions){if(!urls.has(link.url)){a.relatedLinks.push(link);urls.add(link.url);}} a.relatedLinks=a.relatedLinks.slice(0,12); fs.writeFileSync(file,`${JSON.stringify(a,null,2)}\n`);}
}

const pkgPath=path.join(root,'package.json'); const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8')); pkg.version='3.4.0'; pkg.scripts['add:xserver']='node scripts/add-xserver-v340.mjs'; fs.writeFileSync(pkgPath,`${JSON.stringify(pkg,null,2)}\n`);
const sitePath=path.join(root,'content/config/site.json'); const site=JSON.parse(fs.readFileSync(sitePath,'utf8')); site.assetVersion='5.5.0'; site.defaultVerifiedAt=date; fs.writeFileSync(sitePath,`${JSON.stringify(site,null,2)}\n`);
const qa=`# QA — v3.4.0 XServer affiliate and article cluster\n\n## Scope\n- Added 10 Japanese and 10 English articles for regular XServer and XServer Business.\n- Kept XServer for WordPress and XServer Shop as separate products and programs.\n- Migrated the legacy xserver-vs-lolipop route into the structured article source.\n\n## Affiliate implementation\n- Program ID: s00000001642001\n- Registered seven selected A8.net materials exactly as supplied, including href, a8mat, rel=nofollow, copy, and 1x1 pixels.\n- Japanese pages use intent-matched materials. English pages use official links only.\n- Existing Japanese XServer Business references were upgraded from placeholder official keys to the active A8.net material.\n- Advertising disclosure remains visible through the article template.\n\n## Editorial policy\n- Normal pricing and current official specifications were checked on 2026-07-20.\n- Temporary campaign effective prices are not used as evergreen plan prices.\n- Market-share and performance claims are attributed to the provider and are not treated as independent performance findings.\n- A8.net eligibility (six months or longer) is disclosed, but recommendations prioritize reader needs.\n\n## Validation\nRun: npm run check\n`;
fs.writeFileSync(path.join(root,'docs/QA_V3.4_XSERVER_AFFILIATE.md'),qa);
console.log(`Added ${routes.length*2} XServer articles and integrated selected A8.net materials.`);
