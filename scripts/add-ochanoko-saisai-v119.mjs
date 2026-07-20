import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleRoot = path.join(root, 'content/articles');
const date = '2026-07-19';
const official = 'https://www.ocnk.me/';

const baseSourcesJa = [
  { label: 'おちゃのこさいさい公式サイト', url: 'https://www.ocnk.me/' },
  { label: 'おちゃのこさいさい利用料金', url: 'https://www.ocnk.me/pricing' },
  { label: 'おちゃのこさいさい機能一覧', url: 'https://www.ocnk.me/feature' },
  { label: 'おちゃのこさいさい ご利用の流れ', url: 'https://www.ocnk.me/step' },
  { label: 'おちゃのこさいさい新規登録', url: 'https://www.ocnk.me/entry' },
  { label: '2024年料金改定のお知らせ', url: 'https://www.ocnk.me/news?note=20240618' }
];
const baseSourcesEn = [
  { label: 'Ochanoko Saisai official site', url: 'https://www.ocnk.me/' },
  { label: 'Ochanoko Saisai pricing', url: 'https://www.ocnk.me/pricing' },
  { label: 'Ochanoko Saisai feature list', url: 'https://www.ocnk.me/feature' },
  { label: 'Ochanoko Saisai setup flow', url: 'https://www.ocnk.me/step' },
  { label: 'Ochanoko Saisai registration page', url: 'https://www.ocnk.me/entry' },
  { label: '2024 price revision notice', url: 'https://www.ocnk.me/news?note=20240618' }
];
const competitorSources = {
  jimdo: [
    { label: 'Jimdo pricing', url: 'https://www.jimdo.com/jp/pricing/' },
    { label: 'Jimdo 2026 price revision', url: 'https://www.jimdo.com/jp/2026/03/18/%E6%9C%89%E6%96%99%E3%83%97%E3%83%A9%E3%83%B3%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E3%81%AE%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B-%E6%96%B0%E8%A6%8F%E3%81%AE%E3%81%8A%E5%AE%A2%E6%A7%98%E5%90%91%E3%81%91/' }
  ],
  goope: [
    { label: 'グーペ公式サイト', url: 'https://goope.jp/' },
    { label: 'グーペのプラン・料金', url: 'https://goope.jp/service/price/' },
    { label: 'グーペの機能一覧', url: 'https://goope.jp/service/function/' }
  ],
  studio: [
    { label: 'Studio料金プラン', url: 'https://studio.design/ja/pricing' },
    { label: 'Studio FAQ', url: 'https://studio.design/ja/faq' }
  ]
};

const routes = [
  {
    slug: 'ochanoko-saisai-review', type: 'review', cta: 'ochanoko-saisai-short',
    jaTitle: 'おちゃのこさいさいの評判・料金・注意点｜店舗サイト向け機能を検証',
    enTitle: 'Ochanoko Saisai Review: Pricing, Store Features, and Limits',
    jaDescription: 'おちゃのこさいさいを料金、独自ドメイン、クーポン、カレンダー、スマホ更新、SEO、メール、移行性から公式情報で検証します。',
    enDescription: 'Review Ochanoko Saisai using official pricing, domains, coupons, calendars, mobile administration, SEO, email, and portability details.',
    jaLead: 'おちゃのこさいさいは、飲食店、美容室、エステ、教室などの店舗情報を、クーポン、カレンダー、スタッフ紹介、ブログと一緒に管理できるホームページ作成サービスです。ネットショップ用のショッピングカートは搭載していないため、店舗案内サイトとして評価します。',
    enLead: 'Ochanoko Saisai is a Japanese website builder for restaurants, salons, schools, and other local businesses. It combines store information, coupons, calendars, staff pages, blogging, and mobile administration, but it does not provide an ecommerce shopping cart.'
  },
  {
    slug: 'ochanoko-saisai-pricing', type: 'guide', cta: 'ochanoko-saisai-service',
    jaTitle: 'おちゃのこさいさい料金比較｜月額・独自ドメイン費用と総額',
    enTitle: 'Ochanoko Saisai Pricing: Plans, Domains, and Total Cost',
    jaDescription: 'ベーシックとアドバンスドの月額、契約期間、独自ドメイン設定費、ドメイン更新費、無料試用を整理します。',
    enDescription: 'Compare Basic and Advanced monthly pricing, contract terms, custom-domain setup charges, domain renewals, and the free trial.',
    jaLead: '料金は契約期間によって月額換算が変わり、独自ドメインを使うアドバンスドでは初期設定費用とドメイン年間費用が別途発生する場合があります。表示月額だけでなく、初年度と更新年度の総額を分けて確認します。',
    enLead: 'Pricing varies by contract term. The Advanced plan can also require a domain setup charge and annual domain fee, so the useful comparison separates the first-year total from recurring cost.'
  },
  {
    slug: 'ochanoko-saisai-basic-vs-advanced', type: 'comparison', cta: 'ochanoko-saisai-service',
    jaTitle: 'おちゃのこさいさい ベーシックとアドバンスドの違いを比較',
    enTitle: 'Ochanoko Saisai Basic vs Advanced: Plan Differences',
    jaDescription: '共用ドメイン、独自ドメイン、容量、フリーページ、メール、広告表示、初期費用から2プランを比較します。',
    enDescription: 'Compare shared and custom domains, storage, free pages, email accounts, platform advertising, setup fees, and operating fit.',
    jaLead: 'ベーシックは共用ドメインで低コストに店舗案内を始めるプラン、アドバンスドは独自ドメイン、広告非表示、容量・ページ・メール無制限を重視するプランです。事業サイトとして長く使うか、短期間の案内サイトとして使うかで選択が変わります。',
    enLead: 'Basic is a lower-cost shared-domain plan for a compact store-information site. Advanced adds a custom domain, removes platform advertising, and expands storage, page, and email limits for longer-term business use.'
  },
  {
    slug: 'ochanoko-saisai-vs-jimdo', type: 'comparison', cta: 'ochanoko-saisai-short', competitor: 'jimdo',
    jaTitle: 'おちゃのこさいさいとJimdoを比較｜店舗機能と作成の簡単さ',
    enTitle: 'Ochanoko Saisai vs Jimdo: Store Features and Ease of Use',
    jaDescription: '店舗向け機能、料金、独自ドメイン、ブログ、ショップ、デザイン、SEO、スマホ更新から比較します。',
    enDescription: 'Compare store-oriented features, pricing, domains, blogging, ecommerce, design, SEO, and mobile administration.',
    jaLead: 'おちゃのこさいさいはクーポン、カレンダー、スタッフ、店舗情報をまとめたい店舗向けです。JimdoはAIビルダーとクリエイターから作成方法を選び、より一般的な会社・ポートフォリオ・小規模ショップにも展開できます。',
    enLead: 'Ochanoko Saisai emphasizes store information, coupons, calendars, and staff pages. Jimdo offers AI Builder and Creator for a broader range of company, portfolio, blog, and small-store sites.'
  },
  {
    slug: 'ochanoko-saisai-vs-goope', type: 'comparison', cta: 'ochanoko-saisai-coupon', competitor: 'goope',
    jaTitle: 'おちゃのこさいさいとグーペを比較｜店舗ホームページの選び方',
    enTitle: 'Ochanoko Saisai vs Goope: Choosing a Local-Business Builder',
    jaDescription: '店舗情報、予約、クーポン、カレンダー、料金、独自ドメイン、メール、サポートの違いを比較します。',
    enDescription: 'Compare store information, bookings, coupons, calendars, pricing, domains, email, and support between two Japanese builders.',
    jaLead: 'どちらも店舗向けですが、おちゃのこさいさいはクーポンやカレンダーを含む情報発信、グーペは店舗情報と予約枠を一体で運用する用途が中心です。必要な予約の複雑さとサポート条件を基準に選びます。',
    enLead: 'Both products target local businesses. Ochanoko Saisai centers on store communication with coupons and calendars, while Goope places more emphasis on store information and built-in booking capacity.'
  },
  {
    slug: 'ochanoko-saisai-vs-studio', type: 'comparison', cta: 'ochanoko-saisai-service', competitor: 'studio',
    jaTitle: 'おちゃのこさいさいとStudioを比較｜店舗運用とデザイン自由度',
    enTitle: 'Ochanoko Saisai vs Studio: Store Operations or Design Control',
    jaDescription: 'テンプレート、デザイン、CMS、店舗機能、料金、独自ドメイン、SEO、共同編集、運用負担から比較します。',
    enDescription: 'Compare templates, design control, CMS, store functions, pricing, domains, SEO, collaboration, and operating effort.',
    jaLead: 'おちゃのこさいさいは店舗情報を定型機能で早く運用するサービス、StudioはレイアウトとCMSをノーコードで設計するサービスです。更新担当者のスキルと、デザインをどこまで独自化するかが分岐点です。',
    enLead: 'Ochanoko Saisai provides predefined store-management functions for quick operation. Studio is a no-code design and CMS platform with broader layout control, making team skill and design requirements the key decision factors.'
  },
  {
    slug: 'ochanoko-saisai-salon-guide', type: 'guide', cta: 'ochanoko-saisai-salon',
    jaTitle: 'おちゃのこさいさいで美容室・エステのサイトを作る方法',
    enTitle: 'Building a Salon or Esthetic Website with Ochanoko Saisai',
    jaDescription: '美容室、眉毛サロン、エステ向けに、メニュー、スタッフ、クーポン、カレンダー、予約導線、写真、FAQを設計します。',
    enDescription: 'Plan services, staff pages, coupons, calendars, booking routes, photography, policies, and FAQs for a salon website.',
    jaLead: '美容サロンではデザインだけでなく、料金、施術時間、予約方法、キャンセル条件、アクセスを迷わず確認できることが重要です。おちゃのこさいさいの店舗向け機能を使い、更新担当者がスマートフォンでも維持できる構成にします。',
    enLead: 'A salon website must make pricing, treatment duration, booking, cancellation rules, and access easy to find. Ochanoko Saisai can organize this information in a mobile-manageable store-site structure.'
  },
  {
    slug: 'ochanoko-saisai-restaurant-guide', type: 'guide', cta: 'ochanoko-saisai-coupon',
    jaTitle: 'おちゃのこさいさいで飲食店ホームページを作る方法',
    enTitle: 'Building a Restaurant Website with Ochanoko Saisai',
    jaDescription: '飲食店向けにメニュー、営業時間、定休日、地図、写真、クーポン、予約・電話導線、アレルギー情報を設計します。',
    enDescription: 'Plan menus, hours, closures, maps, photography, coupons, phone or booking routes, and allergy information for a restaurant site.',
    jaLead: '飲食店サイトでは、営業中か、何をいくらで提供するか、どこにあるか、予約できるかを短時間で判断できる必要があります。カレンダー、クーポン、店舗情報を使い、SNSだけでは不足する固定情報を整理します。',
    enLead: 'A restaurant site should quickly answer whether the business is open, what it serves, where it is, and how to reserve. Calendars, coupons, and store information can provide stable details that social feeds alone do not.'
  },
  {
    slug: 'store-website-coupon-calendar-guide', type: 'guide', cta: 'ochanoko-saisai-coupon',
    jaTitle: '店舗ホームページのクーポン・カレンダー活用ガイド',
    enTitle: 'Coupon and Calendar Guide for Local-Business Websites',
    jaDescription: 'クーポン、定休日、イベント、キャンペーンをホームページで運用する設計、更新ルール、計測、注意点を解説します。',
    enDescription: 'Design and operate website coupons, closing-day calendars, events, campaigns, measurement, and maintenance rules.',
    jaLead: 'クーポンとカレンダーは設置するだけでは成果につながりません。期限、利用条件、対象サービス、更新担当者、計測方法を決め、古い情報が残らない運用を作る必要があります。',
    enLead: 'Coupons and calendars do not create value merely by existing. The site needs expiry rules, eligibility, ownership, measurement, and a maintenance process that prevents outdated information.'
  },
  {
    slug: 'ochanoko-saisai-seo-guide', type: 'guide', cta: 'ochanoko-saisai-long',
    jaTitle: 'おちゃのこさいさいSEO設定ガイド｜店舗検索で確認する項目',
    enTitle: 'Ochanoko Saisai SEO Guide for Local-Business Search',
    jaDescription: 'ページ別メタタグ、見出し、店舗情報、Googleマップ、画像、内部リンク、Search Console、更新方法を整理します。',
    enDescription: 'Organize page metadata, headings, business details, maps, images, internal links, Search Console, and update routines.',
    jaLead: 'おちゃのこさいさいではページごとのメタタグやヘッダー設定、Googleマップ、外部アクセス解析を利用できます。SEOは設定だけで完了せず、店舗ごとの固有情報と継続更新を組み合わせて改善します。',
    enLead: 'Ochanoko Saisai supports page-level metadata and header settings, Google Maps, and external analytics. Search visibility still depends on unique local-business information, clear pages, internal links, and ongoing updates.'
  }
];

function priceTableJa() {
  return {
    headers: ['プラン', '1か月', '6か月（月額換算）', '12か月（月額換算）'],
    rows: [
      ['ベーシック', '1,320円', '1,210円', '1,100円'],
      ['アドバンスド', '2,200円', '2,090円', '1,980円']
    ]
  };
}
function priceTableEn() {
  return {
    headers: ['Plan', '1 month', '6-month monthly equivalent', '12-month monthly equivalent'],
    rows: [
      ['Basic', 'JPY 1,320', 'JPY 1,210', 'JPY 1,100'],
      ['Advanced', 'JPY 2,200', 'JPY 2,090', 'JPY 1,980']
    ]
  };
}
function planTableJa() {
  return {
    headers: ['項目', 'ベーシック', 'アドバンスド'],
    rows: [
      ['公開URL', '共用ドメイン', '独自ドメイン'],
      ['容量', '1GB', '無制限'],
      ['フリーページ', '20ページ', '無制限'],
      ['メールアドレス', '10個', '無制限'],
      ['広告表示', 'あり', 'なし'],
      ['独自ドメイン設定費', '対象外', '7,920円']
    ]
  };
}
function planTableEn() {
  return {
    headers: ['Item', 'Basic', 'Advanced'],
    rows: [
      ['Public URL', 'Shared domain', 'Custom domain'],
      ['Storage', '1 GB', 'Unlimited'],
      ['Free pages', '20', 'Unlimited'],
      ['Email accounts', '10', 'Unlimited'],
      ['Platform advertising', 'Displayed', 'Removed'],
      ['Custom-domain setup', 'Not applicable', 'JPY 7,920']
    ]
  };
}

const genericJaFinal = {
  heading: '契約前と公開後の確認',
  body: [
    '30日間の無料試用では、実際の文章、写真、メニュー、店舗情報、問い合わせ導線を入れ、スマートフォン表示と管理画面の更新作業を確認します。無料期間終了後に継続する場合は、管理画面から契約と支払いを完了します。',
    '専用サービスから別のCMSへ移る場合、デザインや機能をそのまま移行できるとは限りません。原稿、画像、料金表、スタッフ情報、URL一覧を外部にも保管し、公開後は電話、フォーム、地図、計測タグを定期的にテストしてください。'
  ],
  bullets: ['無料試用で実際のページを作る', '契約期間と更新総額を確認する', 'ドメインとDNSの管理者を記録する', '原稿・画像を別に保管する', '問い合わせと計測を定期テストする']
};
const genericEnFinal = {
  heading: 'Checks before contracting and after launch',
  body: [
    'During the 30-day trial, place real copy, photographs, menus, store information, and enquiry routes, then test both mobile output and routine administration. Continued use requires completing the contract and payment process from the administration screen.',
    'A proprietary builder rarely transfers its design and functions directly to another CMS. Keep original copy, images, price tables, staff data, and a URL inventory outside the platform, then retest phone links, forms, maps, and analytics after major changes.'
  ],
  bullets: ['Build realistic pages during the trial', 'Confirm the term and renewal total', 'Record domain and DNS ownership', 'Keep original content outside the builder', 'Retest enquiries and analytics']
};

function jaSections(slug) {
  const shared = {
    overview: {
      heading: '主な機能と向いている用途',
      body: [
        '公式機能一覧では、クーポン、HTMLメールマガジン、カレンダー、最新情報、サービス紹介、スタッフ紹介、写真アルバム、フリーページ、アンケート、ブログ、店舗情報、Googleマップが案内されています。管理画面はスマートフォンとタブレットにも対応します。',
        '店舗の固定情報と定期的なお知らせを一つの管理画面で更新したい小規模事業者に向きます。一方、商品カート、在庫、決済、配送を必要とするネットショップは対象外であり、公式登録ページでもショッピングカート機能がないと明記されています。'
      ]
    },
    cost: {
      heading: '料金と独自ドメイン費用',
      body: [
        'ベーシックは12か月契約で月額換算1,100円、アドバンスドは1,980円です。短期契約ほど月額換算は上がるため、試用後に必要な運用期間を決めて選びます。',
        'アドバンスドの独自ドメイン設定費用は7,920円です。おちゃのこ側で取得する場合は、.com等が年3,960円、.jpが年6,600円、.shopが年7,920円と案内されています。ドメインを他社で管理する場合はDNS変更手順を確認します。'
      ],
      table: priceTableJa()
    },
    seo: {
      heading: 'SEO・アクセス解析・移行性',
      body: [
        'ページごとにメタタグやヘッダーを設定でき、Googleマップと外部アクセス解析ツールも利用できます。サービス名や地域名を並べるだけでなく、料金、対象、手順、事例、FAQを別ページで具体化します。',
        '専用テンプレートと管理機能は更新を簡単にする一方、別サービスへのレイアウト移行は限定的です。独自ドメイン、原稿、画像、計測アカウントを自社で管理し、変更時に再構築できる状態を保ちます。'
      ]
    }
  };
  const map = {
    'ochanoko-saisai-review': [
      { heading: '結論：店舗情報を手軽に更新したい事業者向け', body: ['おちゃのこさいさいは、店舗案内、メニュー、スタッフ、クーポン、カレンダー、ブログをまとめて運用したい小規模店舗の候補です。共用ドメインで始めるベーシックと、独自ドメイン・広告非表示・大容量を使うアドバンスドがあります。', '高度な予約管理やネットショップを中心にするサービスではありません。予約は外部サービスへの導線も含めて設計し、商品販売が必要な場合はカラーミーショップ、Shopify、おちゃのこネット等を別に比較します。'], affiliateMaterialKey: 'ochanoko-saisai-short' },
      shared.overview, shared.cost,
      { heading: 'ベーシックとアドバンスド', body: ['ベーシックは共用ドメイン、容量1GB、フリーページ20件、メール10個で、サービス広告が表示されます。短期間の案内サイトや独自ドメインを必要としない店舗に向きます。', 'アドバンスドは独自ドメイン、広告非表示、容量・フリーページ・メール無制限です。長期運用する事業サイトではブランド名のURLとメールを維持しやすくなりますが、設定費とドメイン費を総額へ加えます。'], table: planTableJa(), affiliateMaterialKey: 'ochanoko-saisai-service' },
      shared.seo, genericJaFinal
    ],
    'ochanoko-saisai-pricing': [
      { heading: '結論：初年度費用と更新費用を分ける', body: ['最安表示はベーシック12か月契約の月額換算1,100円です。アドバンスドは月額換算1,980円に加え、独自ドメイン設定費と、取得方法によって年間ドメイン費用が必要です。', '無料試用は本登録後30日間です。試用中にページを完成に近づけ、必要なプラン、契約期間、ドメイン管理方法を決めると無駄な変更を減らせます。'], affiliateMaterialKey: 'ochanoko-saisai-service' },
      shared.cost,
      { heading: '初年度の概算方法', body: ['ベーシック12か月は月額換算1,100円の12か月分を基準にします。アドバンスド12か月は月額換算1,980円の12か月分に、初回の独自ドメイン設定費7,920円と、必要に応じてドメイン取得費を加えます。', '既存ドメインを持ち込む場合は取得費が別事業者側に残ります。メールも同じドメインで利用する場合は、DNSのMX、SPF、DKIM等を変更前に確認します。'] },
      { heading: '短期契約と長期契約', body: ['1か月契約は試験運用や期間限定サイトに向きますが、月額換算は高くなります。6か月・12か月契約は継続が決まっている場合の単価を下げられます。', '返金や途中解約の条件、更新日、休会手数料、支払方法を規約と管理画面で確認し、担当者が変わっても更新できるよう契約情報を記録します。'] },
      { heading: '価格表示で避けるべき誤解', body: ['過去の広告素材には月額750円という表現が残っていますが、現在の公式料金とは一致しないため本サイトでは使用しません。料金記事は公式ページの現行価格と確認日を優先します。', '月額換算は毎月払いを意味しない場合があります。契約期間分の請求タイミングと、独自ドメイン関連費用を合計して判断します。'] },
      genericJaFinal
    ],
    'ochanoko-saisai-basic-vs-advanced': [
      { heading: '結論：試験運用はベーシック、事業資産化はアドバンスド', body: ['独自ドメインを使わず、ページ数が少なく、広告表示を許容できるならベーシックが合理的です。会社名・店舗名のドメイン、広告非表示、容量やページ数の余裕を重視するならアドバンスドを選びます。', '将来プランを変更する可能性がある場合は、URL変更によるSEO・印刷物・SNSプロフィールへの影響を先に確認します。'], affiliateMaterialKey: 'ochanoko-saisai-service' },
      { heading: '機能差を一覧で比較', body: ['両プランとも店舗向けの基本機能を利用できます。大きな違いは公開URL、容量、ページ、メール、広告表示、独自ドメイン関連費用です。', 'ベーシックの共用ドメインは初期負担を抑えられますが、アドバンスドの独自ドメインは長期的なブランド認知と移行時のURL維持に有利です。'], table: planTableJa() },
      shared.cost,
      { heading: '店舗規模別の選び方', body: ['イベント、期間限定店舗、教室の案内など、情報量が少なく運用期間が読みにくい場合はベーシックから試せます。店舗を継続運営し、スタッフ、事例、FAQ、ブログを増やす場合はアドバンスドの上限が扱いやすくなります。', '複数店舗はページ設計と更新権限が複雑になるため、店舗別ページ、共通メニュー、問い合わせ先、構造化データを整理し、必要ならCMSや制作会社も比較します。'] },
      shared.seo, genericJaFinal
    ],
    'ochanoko-saisai-vs-jimdo': [
      { heading: '結論：店舗定型機能ならおちゃのこ、用途の広さならJimdo', body: ['クーポン、カレンダー、店舗情報、スタッフ紹介を最初から使うならおちゃのこさいさいが分かりやすい構成です。JimdoはAIビルダーでの簡単作成と、クリエイターのブログ・ショップ・HTML/CSSを選べます。', 'どちらも無料で操作確認できますが、独自ドメイン、広告非表示、SEO、更新方法、将来のサイト規模を同じ条件で比較します。'], affiliateMaterialKey: 'ochanoko-saisai-short' },
      { heading: '主な違い', body: ['おちゃのこさいさいは店舗運営の定型項目をまとめる設計です。Jimdoは店舗以外の会社、ポートフォリオ、ブログ、小規模ショップにも対応しやすい汎用型です。', 'JimdoのAIビルダーとクリエイターは別システムで互換性がないため、作成前に必要機能を選ぶ必要があります。おちゃのこさいさいはショッピングカートを持たない点を確認します。'], table: { headers: ['比較項目', 'おちゃのこさいさい', 'Jimdo'], rows: [['主用途', '店舗案内・クーポン・カレンダー', '会社・店舗・ポートフォリオ・小規模ショップ'], ['作成方式', '店舗向けテンプレート', 'AIビルダー／クリエイター'], ['ネットショップ', 'カート機能なし', 'クリエイターでショップ機能'], ['独自ドメイン', 'アドバンスド', '有料プラン'], ['注意点', 'ドメイン設定費', '2製品間の互換性なし']] } },
      { heading: '料金と運用負担', body: ['おちゃのこさいさいは店舗向け機能を含む月額制で、アドバンスドでは独自ドメイン設定費を加えます。Jimdoは製品とプランによる機能差が大きく、契約期間分の一括請求と更新時ドメイン費用を確認します。', '担当者が頻繁に更新するなら、実際のスマートフォンでメニュー変更、お知らせ、写真追加を試し、作業時間の短い方を選びます。'] },
      shared.seo, genericJaFinal
    ],
    'ochanoko-saisai-vs-goope': [
      { heading: '結論：クーポン・カレンダー重視か、予約・サポート重視か', body: ['おちゃのこさいさいはクーポン、カレンダー、メルマガ、アンケートを含む店舗発信を低コストでまとめやすいサービスです。グーペは店舗情報と予約枠を一体で扱い、スタンダードでは電話サポートも選べます。', '予約が単純な外部リンクで足りるか、サービス・日程枠を管理画面で管理したいかを最初に確認します。'], affiliateMaterialKey: 'ochanoko-saisai-coupon' },
      { heading: '機能と用途の違い', body: ['おちゃのこさいさいはイベントや定休日のカレンダー、クーポン、HTMLメルマガ、アンケートが特徴です。グーペは料金プランごとに予約サービス数と日程枠の上限があり、店舗予約をサイト内で扱う設計です。', 'どちらも日本語の店舗サイトを短時間で作りやすい一方、高度な在庫、会員、複雑なシフト予約、事前決済は専用サービスを比較します。'], table: { headers: ['比較項目', 'おちゃのこさいさい', 'グーペ'], rows: [['主な強み', 'クーポン・カレンダー・メルマガ', '店舗情報・予約枠'], ['独自ドメイン', 'アドバンスド', 'プラン条件を確認'], ['電話サポート', '公式窓口を確認', 'スタンダードで予約制'], ['無料試用', '30日間', '15日間'], ['ECカート', 'なし', '専用ECではない']] } },
      { heading: '料金比較の注意点', body: ['おちゃのこさいさいは独自ドメイン設定費が別に発生します。グーペは初期費用とプラン料金、予約上限、容量、メール数を合わせて比較します。', '年間総額だけでなく、店舗スタッフが更新できるか、問い合わせ対応、テンプレート変更、データ移行にかかる工数も費用として見ます。'] },
      shared.seo, genericJaFinal
    ],
    'ochanoko-saisai-vs-studio': [
      { heading: '結論：定型店舗サイトはおちゃのこ、独自デザインとCMSはStudio', body: ['店舗情報、クーポン、カレンダーを決まった管理項目で運用するならおちゃのこさいさいが短時間です。ブランド表現、レイアウト、CMSコレクション、チーム制作を重視するならStudioが候補です。', '完成イメージだけでなく、公開後に誰がどの画面で更新するかを比較します。'], affiliateMaterialKey: 'ochanoko-saisai-service' },
      { heading: '設計思想の違い', body: ['おちゃのこさいさいは店舗サイトに必要な機能をあらかじめ用意し、非制作者でも情報を追加しやすくしています。Studioはキャンバス上でデザインし、CMSモデルやフォームを設計するため、自由度が高い分、初期設計の知識が必要です。', 'Studioのプランはページ数、CMSモデル・アイテム、フォーム回答、バージョン管理等に上限があります。おちゃのこさいさいはプラン別の容量・ページ・メール上限を確認します。'], table: { headers: ['比較項目', 'おちゃのこさいさい', 'Studio'], rows: [['向く用途', '小規模店舗の定型情報', 'ブランドサイト・CMS'], ['デザイン', 'テンプレート中心', 'ノーコードで高い自由度'], ['店舗機能', 'クーポン・カレンダー等', 'CMSや外部サービスで設計'], ['共同制作', '小規模運用向け', '複数ユーザー・権限対応'], ['料金単位', 'アカウント／サイト', 'プロジェクト単位']] } },
      { heading: 'SEOと保守', body: ['どちらもタイトル、説明、独自ドメイン、アクセス解析など基本要件を扱えます。Studioはリダイレクトやカスタムコード等がプランによって異なり、おちゃのこさいさいはページ別メタタグと外部解析を使います。', '制作会社がStudioで作り、店舗が日常更新する場合は権限とCMS入力画面を設計します。おちゃのこさいさいは定型項目が多いため、少人数運用では教育コストを抑えやすい構成です。'] },
      { heading: '費用を比べる方法', body: ['おちゃのこさいさいは月額、独自ドメイン設定費、ドメイン年間費を合計します。Studioはサイトプランと、必要に応じてワークスペース、制作費、CMS設計、保守費を合計します。', '店舗の売上に直結する更新が毎週あるなら、安いプランよりも更新担当者が短時間で作業できる仕組みを優先します。'] },
      genericJaFinal
    ],
    'ochanoko-saisai-salon-guide': [
      { heading: '結論：予約前の不安を減らすページ構成にする', body: ['トップページには対象顧客、代表メニュー、料金、所要時間、予約ボタン、店舗情報を置きます。メニューページ、スタッフ、アクセス、FAQ、キャンセル規定を分け、Instagramだけに重要情報を残さないようにします。', 'おちゃのこさいさいのサービス紹介、スタッフ紹介、写真、クーポン、カレンダーを役割ごとに使います。'], affiliateMaterialKey: 'ochanoko-saisai-salon' },
      { heading: 'メニューと料金表示', body: ['施術名、対象、料金、所要時間、注意事項、追加料金、再来条件を同じ場所に記載します。価格を画像だけにせず、検索とアクセシビリティのためテキストでも掲載します。', '限定クーポンは通常価格、対象者、期限、併用可否、予約方法を明記し、期限切れ後に自動更新する場合も内容を毎回確認します。'] },
      { heading: '予約・カレンダー・スタッフ', body: ['カレンダーは休業日、イベント、キャンペーンを伝える用途に使い、実際の予約枠管理は外部予約システムや電話・LINE等へ明確に導線を置きます。', 'スタッフ紹介には得意施術、対応日時、指名方法を記載します。個人情報や退職者情報が残らないよう更新責任者を決めます。'] },
      { heading: '写真とスマートフォン表示', body: ['店内、施術スペース、入口、スタッフ、仕上がり例を目的別に撮影します。画像を圧縮し、スマートフォンで文字や予約ボタンが小さくならないか確認します。', '症例や口コミを掲載する場合は同意、広告規制、誇張表現に注意し、効果を保証する表現を避けます。'] },
      shared.seo, genericJaFinal
    ],
    'ochanoko-saisai-restaurant-guide': [
      { heading: '結論：営業時間・メニュー・場所を最短で伝える', body: ['トップページの最初に営業状況、ジャンル、代表価格、所在地、電話・予約導線を配置します。定休日や臨時休業はカレンダーと最新情報の両方で案内し、Googleビジネスプロフィールとも一致させます。', '店舗写真と料理写真だけでなく、席、入口、駐車場、支払方法、子ども連れ・バリアフリー等の来店判断情報を掲載します。'], affiliateMaterialKey: 'ochanoko-saisai-coupon' },
      { heading: 'メニューの作り方', body: ['カテゴリ、商品名、価格、内容量、提供時間を整理します。季節メニューと定番メニューを分け、価格変更時に古いPDFや画像が残らない運用を決めます。', 'アレルギーや原材料は店舗の確認手順を明記し、個別対応を保証できない場合はその範囲も分かりやすく説明します。'] },
      { heading: 'クーポンとキャンペーン', body: ['クーポンには期限、対象、利用条件、提示方法、他券併用、予約要否を記載します。利益を圧迫する常設値引きより、平日時間帯、初回来店、特定メニュー等の目的を定めます。', 'クーポン利用をPOSや予約メモで記録し、配布数ではなく来店数、客単価、再来率で評価します。'] },
      { heading: '予約と問い合わせ導線', body: ['電話、外部予約サービス、問い合わせフォームの役割を分けます。営業時間外の電話、当日予約、団体予約、キャンセルについて案内し、利用者が迷わないボタン文言にします。', '外部予約画面へ移動する場合は店舗名と日時が正しいか、戻る導線があるか、計測できるかを確認します。'] },
      shared.seo, genericJaFinal
    ],
    'store-website-coupon-calendar-guide': [
      { heading: '結論：期限・対象・更新責任を先に決める', body: ['クーポンは値引きの表示ではなく、来店行動を促す契約条件です。期限、対象商品、最低利用額、併用可否、提示方法、利用回数を明記します。', 'カレンダーは定休日、臨時休業、イベント、予約可能日を混在させず、色やアイコンの意味を固定します。'], affiliateMaterialKey: 'ochanoko-saisai-coupon' },
      { heading: 'クーポン設計', body: ['新規客、休眠客、平日集客、特定メニューなど目的を一つに絞ります。割引額だけでなく、対象者と期待する次回行動を決め、利用時に識別できるコードや提示画面を使います。', '有効期限を自動更新する場合は、価格、在庫、スタッフ体制、法令、広告表現が現在も適切かを更新前に確認します。'] },
      { heading: 'カレンダー設計', body: ['通常休業、臨時休業、イベント、キャンペーンを別カテゴリにします。SNS投稿とホームページで日付が食い違わないよう、一次情報をどこで管理するか決めます。', '予約枠を表す場合は、リアルタイム在庫との同期可否を確認します。同期できないカレンダーを空き状況として使うと二重予約につながるため、案内用と予約用を分けます。'] },
      { heading: '計測と改善', body: ['クーポン表示、電話タップ、予約ボタン、フォーム完了を計測し、利用者数と売上を確認します。単純なクリック数だけで成果を判断しません。', '月次で期限切れ、誤字、古い価格、リンク切れを点検します。更新担当者が不在でも停止できるよう、管理者権限と手順を共有します。'] },
      { heading: '表示上の注意', body: ['ファーストビューに過度な値引きだけを置かず、通常価格、条件、店舗情報を同時に確認できるようにします。景品表示、医療・美容広告、酒類等の業種規制がある場合は個別に確認します。', '画像内だけに条件を入れると読みづらく、検索にも伝わりにくいため、本文テキストでも条件を記載します。'] },
      genericJaFinal
    ],
    'ochanoko-saisai-seo-guide': [
      { heading: '結論：設定より店舗情報の具体性が重要', body: ['ページ別メタタグ、見出し、Googleマップ、アクセス解析は検索エンジンへ内容を伝える基盤です。順位を得るには、店舗固有のサービス、料金、地域、事例、FAQ、更新情報が必要です。', '地域名だけを置き換えた薄いページや、他店と同じメーカー説明の転載を避けます。'], affiliateMaterialKey: 'ochanoko-saisai-long' },
      { heading: 'タイトル・説明・見出し', body: ['ページごとに一意のタイトルを付け、サービス名、地域、利用者の目的を自然に含めます。説明文は料金、対象、特徴、予約方法を簡潔にまとめます。', 'H1はページの主題を一つにし、H2・H3で料金、手順、事例、注意点、FAQへ分けます。重要事項を画像だけで掲載しません。'] },
      { heading: '店舗情報とローカル検索', body: ['名称、住所、電話番号、営業時間をGoogleビジネスプロフィール、SNS、予約サイトと一致させます。駐車場、駅からの経路、対応地域、支払方法も具体的に書きます。', '複数店舗は店舗ごとに固有ページを作り、住所、電話、営業時間、写真、スタッフ、予約先を混同しないようにします。'] },
      { heading: '画像・内部リンク・表示速度', body: ['画像は表示サイズに合わせて圧縮し、内容を説明する代替テキストを付けます。トップからメニュー、店舗、FAQ、予約へ内部リンクを張り、孤立ページを作らないようにします。', '大きな画像、外部ウィジェット、埋め込みSNSを増やしすぎると表示が遅くなります。実機で読み込みと操作を確認します。'] },
      { heading: 'Search Consoleと更新', body: ['独自ドメインを使う場合はGoogle Search Consoleで所有権を確認し、インデックス、検索語、ページエラーを確認します。外部アクセス解析では電話、予約、フォーム等の成果を計測します。', '料金、営業時間、スタッフ、キャンペーンが変わったら、関連ページと構造化データを同時に更新します。半年ごとに出典と確認日を見直します。'] },
      genericJaFinal
    ]
  };
  return map[slug];
}

function enSections(slug) {
  const shared = {
    overview: {
      heading: 'Core functions and best-fit use cases',
      body: [
        'The official feature list includes coupons, HTML newsletters, calendars, news, service pages, staff profiles, photo albums, free pages, surveys, blogging, business information, and Google Maps. The administration interface supports smartphones and tablets.',
        'The product fits smaller local businesses that want stable business information and regular announcements in one interface. It is not an ecommerce platform: the official registration page states that no shopping-cart function is included.'
      ]
    },
    cost: {
      heading: 'Pricing and custom-domain cost',
      body: [
        'Basic costs JPY 1,100 per month on a 12-month equivalent, while Advanced costs JPY 1,980. Shorter contracts have higher monthly equivalents, so the operating period should be defined after the trial.',
        'Advanced has a JPY 7,920 custom-domain setup fee. If the provider registers the domain, published annual fees include JPY 3,960 for common generic domains, JPY 6,600 for .jp, and JPY 7,920 for .shop. Existing external domains require DNS planning.'
      ],
      table: priceTableEn()
    },
    seo: {
      heading: 'SEO, analytics, and portability',
      body: [
        'Page-level metadata and headers can be configured, and Google Maps plus external analytics tools can be used. Search performance still requires specific services, prices, processes, examples, frequently asked questions, and location information.',
        'The dedicated templates and administration reduce update work but do not guarantee direct migration to another CMS. Keep the domain, copy, images, and analytics accounts under the business owner’s control.'
      ]
    }
  };
  const comparisonEnd = genericEnFinal;
  const map = {
    'ochanoko-saisai-review': [
      { heading: 'Verdict: a focused builder for local-business information', body: ['Ochanoko Saisai is a practical option when a small business wants to manage services, staff, coupons, a calendar, news, and blogging without installing a CMS. Basic uses a shared domain; Advanced adds a custom domain, removes platform advertising, and expands limits.', 'It is not designed as a full booking or ecommerce system. Complex scheduling may require an external booking service, and product sales require a separate ecommerce platform.'], affiliateMaterialKey: undefined },
      shared.overview, shared.cost,
      { heading: 'Basic and Advanced', body: ['Basic includes a shared domain, 1 GB of storage, 20 free pages, 10 email accounts, and platform advertising. It is suitable for a compact or temporary information site.', 'Advanced provides a custom domain, no platform advertising, and unlimited storage, free pages, and email accounts. The custom-domain setup and annual registration cost must be added to the total.'], table: planTableEn() },
      shared.seo, genericEnFinal
    ],
    'ochanoko-saisai-pricing': [
      { heading: 'Verdict: separate first-year and recurring totals', body: ['The lowest displayed equivalent is JPY 1,100 per month for Basic on a 12-month contract. Advanced is JPY 1,980 per month equivalent, with a custom-domain setup fee and possible annual domain charge.', 'The free trial runs for 30 days after full registration. Use it to complete a realistic prototype and choose the term and domain arrangement before paying.'] },
      shared.cost,
      { heading: 'Estimating first-year cost', body: ['For Basic, multiply the selected monthly equivalent by the contract length. For Advanced, add JPY 7,920 for initial custom-domain setup and any annual domain registration fee to the plan total.', 'When an existing domain remains with another registrar, registration cost stays external. Confirm MX, SPF, DKIM, and other DNS records before changing settings if domain email is already active.'] },
      { heading: 'Short and long contracts', body: ['A one-month term can fit a temporary campaign or uncertain project but has a higher monthly equivalent. Six- and twelve-month terms reduce the unit price when the site will continue.', 'Review refunds, termination, renewal, suspension charges, and payment methods, and document the account owner so the business can renew even when staff changes.'] },
      { heading: 'Avoid outdated price claims', body: ['An older supplied advertising material states JPY 750 per month. That does not match the current official pricing and is intentionally excluded from this site.', 'A monthly equivalent may not mean monthly billing. Confirm the actual payment timing and add domain-related costs before comparing providers.'] },
      genericEnFinal
    ],
    'ochanoko-saisai-basic-vs-advanced': [
      { heading: 'Verdict: Basic for testing, Advanced for a durable business asset', body: ['Basic is reasonable when a shared domain, limited page count, and platform advertising are acceptable. Advanced is the better fit when the business needs its own domain, more content, more email accounts, and no platform advertising.', 'If a later plan change alters the public URL, assess the impact on search visibility, printed materials, social profiles, and existing links before launch.'] },
      { heading: 'Plan differences', body: ['Both plans provide the core local-business functions. The largest differences are public URL, storage, page and email limits, platform advertising, and custom-domain cost.', 'A shared domain reduces initial effort, while a custom domain creates a more portable long-term identity if the business later rebuilds the site elsewhere.'], table: planTableEn() },
      shared.cost,
      { heading: 'Selection by business stage', body: ['Basic can fit a temporary event, short-term class, or small information site. Advanced is easier to operate when staff, case studies, FAQs, and blog content will grow over time.', 'Multi-location businesses need separate location pages, consistent contact data, and clear booking destinations. A more flexible CMS may be appropriate when the structure becomes complex.'] },
      shared.seo, genericEnFinal
    ],
    'ochanoko-saisai-vs-jimdo': [
      { heading: 'Verdict: predefined store functions or broader site use', body: ['Choose Ochanoko Saisai when coupons, calendars, store information, and staff profiles are primary. Jimdo offers AI Builder and Creator and can cover a wider set of company, portfolio, blog, and small-store uses.', 'Test both free environments with the same copy, images, navigation, and enquiry route. Compare domains, branding, SEO controls, and future site scope.'] },
      { heading: 'Key differences', body: ['Ochanoko Saisai is organized around local-business fields. Jimdo is a more general builder, but its AI Builder and Creator are separate products and content does not transfer directly between them.', 'Ochanoko Saisai does not include a shopping cart. Jimdo Creator includes store functionality, although payment, shipping, legal disclosures, and migration still require planning.'], table: { headers: ['Item', 'Ochanoko Saisai', 'Jimdo'], rows: [['Primary use', 'Store information, coupons, calendars', 'Company, portfolio, blog, small store'], ['Building model', 'Store-oriented templates', 'AI Builder or Creator'], ['Ecommerce', 'No shopping cart', 'Creator store functions'], ['Custom domain', 'Advanced', 'Paid plans'], ['Main constraint', 'Domain setup cost', 'No compatibility between two products']] } },
      { heading: 'Cost and operating effort', body: ['Ochanoko Saisai bundles its store functions into the plan, with additional domain setup on Advanced. Jimdo pricing varies by product, plan, term, and renewal-domain conditions.', 'Have the actual update owner change a menu, publish news, and add photographs on a phone. The platform that reduces recurring work can be more valuable than a small subscription difference.'] },
      shared.seo, comparisonEnd
    ],
    'ochanoko-saisai-vs-goope': [
      { heading: 'Verdict: communication tools or booking-oriented operation', body: ['Ochanoko Saisai combines coupons, calendars, newsletters, and surveys for store communication. Goope places greater emphasis on store information and booking capacity, with telephone support available on its higher plan.', 'Define whether an external booking link is sufficient or whether services and date slots must be managed inside the website product.'] },
      { heading: 'Functions and operating fit', body: ['Ochanoko Saisai provides calendars, coupons, HTML newsletters, and surveys. Goope publishes plan-specific booking-service and date-slot limits.', 'Neither should be assumed to replace complex inventory, membership, staff scheduling, prepayment, or customer-management software. Test those workflows separately.'], table: { headers: ['Item', 'Ochanoko Saisai', 'Goope'], rows: [['Main strength', 'Coupons, calendars, newsletters', 'Store information and booking slots'], ['Custom domain', 'Advanced', 'Depends on plan conditions'], ['Telephone support', 'Confirm current support route', 'Reservation-based on Standard'], ['Free trial', '30 days', '15 days'], ['Ecommerce cart', 'No', 'Not a dedicated ecommerce platform']] } },
      { heading: 'Cost comparison', body: ['Ochanoko Saisai can add a custom-domain setup fee. Goope adds its setup charge, plan fee, booking limits, storage, and email allowances.', 'Include staff training, support, template changes, and data migration in the operating cost rather than comparing subscription price alone.'] },
      shared.seo, comparisonEnd
    ],
    'ochanoko-saisai-vs-studio': [
      { heading: 'Verdict: store administration or design and CMS control', body: ['Ochanoko Saisai is faster for predefined store information, coupons, and calendars. Studio is better suited to custom visual design, CMS collections, and collaborative production.', 'Compare who builds the site and who performs weekly updates after publication.'] },
      { heading: 'Different design models', body: ['Ochanoko Saisai provides predefined management fields so non-designers can update local-business content. Studio uses a visual canvas and CMS models, providing more freedom but requiring greater initial design and governance work.', 'Studio plans differ by pages, CMS models and items, form responses, version history, redirects, and other controls. Ochanoko Saisai differs mainly by domain, storage, pages, email, and advertising.'], table: { headers: ['Item', 'Ochanoko Saisai', 'Studio'], rows: [['Best fit', 'Compact local-business site', 'Brand site and CMS'], ['Design', 'Template-centered', 'High no-code flexibility'], ['Store functions', 'Coupons and calendars', 'Designed through CMS or external tools'], ['Collaboration', 'Small-team operation', 'Multiple users and permissions'], ['Billing unit', 'Service account/site', 'Project']] } },
      { heading: 'SEO and maintenance', body: ['Both can support core metadata, custom domains, and analytics. Studio plan levels affect redirects, custom code, and CMS limits, while Ochanoko Saisai provides page metadata and external analytics support.', 'When an agency builds in Studio, design update permissions and CMS input views carefully. Ochanoko Saisai can lower training effort for a small store because its fields are predefined.'] },
      { heading: 'Comparing total cost', body: ['For Ochanoko Saisai, add the plan, domain setup, and annual domain fee. For Studio, add the project plan, any workspace cost, production, CMS design, and maintenance.', 'When store information changes weekly, update time and governance can matter more than the lowest monthly subscription.'] },
      comparisonEnd
    ],
    'ochanoko-saisai-salon-guide': [
      { heading: 'Verdict: design the site around pre-booking questions', body: ['The top page should identify the target customer, primary services, prices, duration, booking route, and location. Separate service menus, staff, access, FAQs, and cancellation policies so important information is not confined to Instagram.', 'Use service, staff, photo, coupon, and calendar functions for distinct purposes.'] },
      { heading: 'Services and price display', body: ['List the service name, target, price, duration, limitations, additional charges, and repeat-visit conditions together. Do not publish important prices only inside images.', 'For coupons, state the normal price, eligible customers, expiry, combination rules, and booking route. Review automatically renewed offers before each new period.'] },
      { heading: 'Booking, calendar, and staff', body: ['Use the calendar for closures, events, and campaigns. Place a clear route to an external booking system, telephone, or messaging channel when real-time slots are managed elsewhere.', 'Staff pages should explain specialties, availability, and appointment selection. Assign ownership so former staff information does not remain online.'] },
      { heading: 'Photography and mobile display', body: ['Photograph the entrance, interior, treatment area, staff, and representative results for specific information goals. Compress images and test text and booking controls on actual phones.', 'Obtain appropriate consent for case photographs and testimonials, follow applicable advertising rules, and avoid guaranteed-result claims.'] },
      shared.seo, genericEnFinal
    ],
    'ochanoko-saisai-restaurant-guide': [
      { heading: 'Verdict: communicate opening status, menu, and location immediately', body: ['The first screen should present current opening information, cuisine, representative prices, location, and phone or booking route. Keep closures aligned across the site and business listings.', 'Include seating, entrance, parking, payment methods, accessibility, and family information in addition to food photography.'] },
      { heading: 'Menu structure', body: ['Organize category, item name, price, portion, and service period. Separate permanent and seasonal menus and define a process for removing outdated PDFs or price images.', 'Explain the allergy-information process and the limits of individual accommodation rather than making guarantees that operations cannot support.'] },
      { heading: 'Coupons and campaigns', body: ['State expiry, eligibility, presentation method, combination rules, and reservation requirements. Design offers around a business objective such as weekday demand, first visits, or a selected menu.', 'Track redemptions through the point-of-sale or booking notes and evaluate visits, average transaction, and return rate rather than coupon views alone.'] },
      { heading: 'Booking and enquiry routes', body: ['Clarify the roles of telephone, external booking services, and forms. Explain same-day bookings, group reservations, after-hours contact, and cancellation rules.', 'When sending users to an external service, verify the correct location and date context, a return route, and measurement of completed actions.'] },
      shared.seo, genericEnFinal
    ],
    'store-website-coupon-calendar-guide': [
      { heading: 'Verdict: define expiry, eligibility, and ownership first', body: ['A coupon is a set of offer conditions, not merely a discount graphic. State expiry, eligible products, minimum spend, combination rules, presentation method, and usage frequency.', 'Separate regular closures, temporary closures, events, and booking availability in the calendar and use a consistent visual legend.'] },
      { heading: 'Coupon design', body: ['Choose one purpose: new customers, inactive customers, weekday demand, or a selected service. Define both the audience and the desired next action, and use an identifiable code or screen.', 'When expiry automatically renews, review price, inventory, staffing, legal requirements, and advertising language before each period.'] },
      { heading: 'Calendar design', body: ['Use distinct categories for regular closures, temporary changes, events, and campaigns. Select a single source of truth so the website and social posts do not conflict.', 'Do not present a manually updated calendar as real-time availability when it is not synchronized. Separate information calendars from actual booking inventory.'] },
      { heading: 'Measurement and maintenance', body: ['Measure coupon views, phone taps, booking buttons, and completed forms, then connect those actions to visits and revenue. Clicks alone do not establish business value.', 'Run a monthly check for expired offers, incorrect prices, broken links, and ownership. Share administrator access and shutdown procedures.'] },
      { heading: 'Presentation and compliance', body: ['Do not let an aggressive discount replace the normal price, conditions, and business information. Review sector-specific promotion and advertising rules.', 'Place conditions in accessible text as well as images so they can be read, searched, and updated reliably.'] },
      genericEnFinal
    ],
    'ochanoko-saisai-seo-guide': [
      { heading: 'Verdict: specific local information matters more than settings alone', body: ['Page metadata, headings, maps, and analytics are foundations for search interpretation. Rankings require unique services, pricing, location details, examples, frequently asked questions, and updates.', 'Avoid thin pages that merely replace a place name or copy generic manufacturer descriptions.'] },
      { heading: 'Titles, descriptions, and headings', body: ['Give every page a unique title that naturally includes the service, location, and user purpose. Use the description to summarize pricing, eligibility, differentiators, and booking method.', 'Keep one primary heading and structure price, process, examples, caveats, and FAQs with secondary headings. Do not hide critical information inside images.'] },
      { heading: 'Business data and local search', body: ['Keep name, address, phone, and opening hours consistent across the website, business profile, social channels, and booking services. Add parking, station access, service area, and payment methods.', 'For multiple locations, create unique location pages and avoid mixing addresses, phone numbers, hours, photographs, staff, and booking destinations.'] },
      { heading: 'Images, internal links, and performance', body: ['Compress images to their displayed dimensions and add useful alternative text. Link from the home page to services, locations, FAQs, and booking routes so important pages are not isolated.', 'Large photographs, external widgets, and social embeds can slow the page. Test load and interaction on actual mobile devices.'] },
      { heading: 'Search Console and updates', body: ['For a custom domain, verify ownership in Google Search Console and monitor indexing, queries, and errors. Track business outcomes such as phone taps, bookings, and form completions in analytics.', 'When prices, staff, hours, or campaigns change, update all related pages and structured data. Recheck sources and verification dates at least twice a year.'] },
      genericEnFinal
    ]
  };
  return map[slug];
}

function sourcesFor(route, lang) {
  const base = lang === 'ja' ? baseSourcesJa : baseSourcesEn;
  const extra = route.competitor ? competitorSources[route.competitor] : [];
  return [...base, ...extra];
}

const relatedJa = routes.map(route => ({
  label: route.jaTitle.replace(/｜.*$/, ''),
  url: `/ja/website-builders/${route.slug}/`,
  description: route.jaDescription.replace(/。$/, '')
}));
const relatedEn = routes.map(route => ({
  label: route.enTitle.replace(/:.*$/, ''),
  url: `/en/website-builders/${route.slug}/`,
  description: route.enDescription.replace(/\.$/, '')
}));

function faqs(lang, slug) {
  const jaCommon = [
    { question: 'おちゃのこさいさいはネットショップを作れますか？', answer: '公式登録ページではショッピングカート機能はないと案内されています。商品販売が必要な場合は別のECサービスを比較してください。' },
    { question: '無料で試せますか？', answer: '本登録後30日間の無料試用が案内されています。継続する場合は試用期間中に管理画面から契約と支払いを行います。' },
    { question: '独自ドメインを使えますか？', answer: 'アドバンスドプランで利用できます。初期設定費用と、取得方法に応じた年間ドメイン費用を確認してください。' }
  ];
  const enCommon = [
    { question: 'Can Ochanoko Saisai build an online store?', answer: 'The official registration page states that the service does not include a shopping cart. Compare a separate ecommerce platform when products must be sold online.' },
    { question: 'Is there a free trial?', answer: 'The provider offers a 30-day trial after full registration. Continued use requires completing the contract and payment process.' },
    { question: 'Can it use a custom domain?', answer: 'The Advanced plan supports a custom domain. Include the setup charge and any annual registration fee in the total cost.' }
  ];
  if (slug === 'store-website-coupon-calendar-guide') {
    return lang === 'ja' ? [
      { question: 'クーポンの期限は自動更新できますか？', answer: '公式マニュアルでは期限を一定期間ごとに自動更新する設定が案内されています。更新前に価格と条件を再確認してください。' },
      { question: 'カレンダーを予約枠として使えますか？', answer: '同期されない案内カレンダーをリアルタイム空き枠として使うと二重予約の原因になります。予約在庫は専用システムと分けてください。' },
      jaCommon[1]
    ] : [
      { question: 'Can coupon expiry renew automatically?', answer: 'The provider manual describes periodic automatic expiry updates. Review pricing and conditions before each renewal.' },
      { question: 'Can the calendar represent live booking inventory?', answer: 'A calendar that is not synchronized should not be presented as real-time availability. Use a dedicated booking system for inventory.' },
      enCommon[1]
    ];
  }
  return lang === 'ja' ? jaCommon : enCommon;
}

function makeArticle(route, lang) {
  const ja = lang === 'ja';
  const related = (ja ? relatedJa : relatedEn).filter(link => !link.url.includes(`/${route.slug}/`)).slice(0, 8);
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
    author: ja ? 'Luqevora編集部' : 'Luqevora Editorial Team',
    featured: true,
    affiliateDisclosure: ja,
    ctas: [{
      label: ja ? 'おちゃのこさいさいの公式プランを確認' : 'Check the official Ochanoko Saisai plans',
      officialUrl: official,
      affiliateKey: ja ? route.cta : 'ochanoko-saisai-official'
    }],
    sources: sourcesFor(route, lang),
    sections: ja ? jaSections(route.slug) : enSections(route.slug),
    faqs: faqs(lang, route.slug),
    relatedLinks: related
  };
}

for (const route of routes) {
  for (const lang of ['ja', 'en']) {
    const article = makeArticle(route, lang);
    fs.writeFileSync(path.join(articleRoot, lang, `${route.slug}.json`), `${JSON.stringify(article, null, 2)}\n`);
  }
}

const affiliatePath = path.join(root, 'content/config/affiliates.json');
const affiliates = JSON.parse(fs.readFileSync(affiliatePath, 'utf8'));
const materials = {
  'ochanoko-saisai-short': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+3MDZ16+3CZK+BWVTE" rel="nofollow">【おちゃのこさいさい】</a>\n<img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=4B8452+3MDZ16+3CZK+BWVTE" alt="">',
  'ochanoko-saisai-service': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+3MDZ16+3CZK+BX3J6" rel="nofollow">ホームページ作成サービス、おちゃのこさいさい</a>\n<img border="0" width="1" height="1" src="https://www18.a8.net/0.gif?a8mat=4B8452+3MDZ16+3CZK+BX3J6" alt="">',
  'ochanoko-saisai-salon': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+3MDZ16+3CZK+BYT9E" rel="nofollow">おちゃのこさいさい</a>では、店舗・エステ・サロン向けのホームページをテンプレートから選ぶだけで作製できます\n<img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=4B8452+3MDZ16+3CZK+BYT9E" alt="">',
  'ochanoko-saisai-coupon': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+3MDZ16+3CZK+BZ0Z6" rel="nofollow">おちゃのこさいさい</a>で、カレンダー・クーポン付きホームページを作製\n<img border="0" width="1" height="1" src="https://www19.a8.net/0.gif?a8mat=4B8452+3MDZ16+3CZK+BZ0Z6" alt="">',
  'ochanoko-saisai-long': '<a href="https://px.a8.net/svt/ejp?a8mat=4B8452+3MDZ16+3CZK+BZO4I" rel="nofollow">おちゃのこさいさい</a>は、文字どおりに、おちゃのこさいさい的に<br>\nホームページを作製できます。<br>\nカレンダー・クーポン・商品紹介・スタッフ紹介など基本的な機能を<br>\n盛りだくさん用意しています。<br>\n無料試用期間もあります、是非お試しを！\n\n<img border="0" width="1" height="1" src="https://www18.a8.net/0.gif?a8mat=4B8452+3MDZ16+3CZK+BZO4I" alt="">'
};
for (const [key, rawHtml] of Object.entries(materials)) {
  affiliates.links[key] = { type: 'rawHtml', network: 'A8.net', programId: 's00000015680002', language: 'ja', destination: official, rawHtml };
}
affiliates.links['ochanoko-saisai-official'] = { type: 'official', network: 'Official', language: 'en', destination: official, url: official };
fs.writeFileSync(affiliatePath, `${JSON.stringify(affiliates, null, 2)}\n`);

const seoPath = path.join(root, 'content/config/seo.json');
const seo = JSON.parse(fs.readFileSync(seoPath, 'utf8'));
for (const route of routes) {
  for (const lang of ['ja', 'en']) {
    const source = `content/articles/${lang}/${route.slug}.json`;
    if (!seo.indexing.includeSourceFiles.includes(source)) seo.indexing.includeSourceFiles.push(source);
  }
}
if (!seo.indexing.priorityProducts.includes('ochanoko-saisai')) seo.indexing.priorityProducts.push('ochanoko-saisai');
fs.writeFileSync(seoPath, `${JSON.stringify(seo, null, 2)}\n`);

const homePath = path.join(root, 'content/config/home.json');
const home = JSON.parse(fs.readFileSync(homePath, 'utf8'));
home.featuredComparisons = [
  'ochanoko-saisai-vs-goope',
  'shin-rental-server-vs-xserver',
  'color-me-shop-vs-shopify',
  'jimdo-vs-wix',
  'xserver-shop-vs-shopify'
];
home.featuredReviews = [
  'ochanoko-saisai-review',
  'jimdo-review',
  'shin-rental-server-review',
  'color-me-shop-review',
  'goope-review',
  'chatgpt-review'
];
fs.writeFileSync(homePath, `${JSON.stringify(home, null, 2)}\n`);

const buildPath = path.join(root, 'scripts/build.mjs');
let build = fs.readFileSync(buildPath, 'utf8');
build = build.replace("'検索対象として優先した比較・レビュー・ガイドを、新しい確認日順に表示します。', 'Priority comparisons, reviews, and guides are listed by latest verification date.'", "'公開中の比較・レビュー・ガイドを、新しい確認日順に表示します。', 'Published comparisons, reviews, and guides are listed by latest verification date.'");
build = build.replace('`優先度の高い${records.length}件のAI・SaaS・Webサービス比較、レビュー、ガイドを公式情報で整理。料金・機能・制約から選べます。`', '`AI・SaaS・Webサービスの比較、レビュー、ガイドを${records.length}件掲載。公式情報を基に料金・機能・制約を整理します。`');
build = build.replace('`Explore ${records.length} priority comparisons, reviews, and guides for AI, SaaS, and web services using provider-owned pricing, feature, and policy sources.`', '`Explore ${records.length} AI, SaaS, and web-service comparisons, reviews, and guides based on provider-owned pricing, feature, and policy sources.`');
build = build.replace("'検索対象の記事', 'search-ready articles'", "'公開中の記事', 'published articles'");
build = build.replace('`検索対象として優先した${records.length}件の比較記事・個別レビュー・ガイドを、カテゴリ・記事種別・キーワードで探せます。`', '`公開中の${records.length}件の比較記事・個別レビュー・ガイドを、カテゴリ・記事種別・キーワードで探せます。`');
build = build.replace('`Search ${records.length} priority Luqevora comparisons, product reviews, and guides by category, content type, topic, or keyword.`', '`Search ${records.length} published Luqevora comparisons, product reviews, and guides by category, content type, topic, or keyword.`');
fs.writeFileSync(buildPath, build);

const categoryPath = path.join(root, 'content/config/categories.json');
const categories = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));
const website = categories.find(category => category.id === 'website-builders');
website.description.ja = 'ホームページ作成、ノーコード、店舗サイト、予約導線、ネットショップを、料金・SEO・独自ドメイン・更新性・決済・移行性から比較します。';
website.description.en = 'Compare website builders, no-code tools, local-business sites, booking routes, and ecommerce by pricing, SEO, domains, maintainability, payments, and portability.';
fs.writeFileSync(categoryPath, `${JSON.stringify(categories, null, 2)}\n`);

const profilePath = path.join(root, 'content/article-batches/product-profiles-expansion.json');
const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
profiles['ochanoko-saisai'] = {
  name: 'おちゃのこさいさい', affiliateKey: 'ochanoko-saisai-short', sources: baseSourcesJa,
  positioning: { ja: 'クーポン、カレンダー、店舗情報、スタッフ、ブログをまとめて更新できる店舗向けホームページ作成サービス', en: 'A local-business website builder combining coupons, calendars, store information, staff pages, and blogging' },
  pricing: { ja: 'ベーシックは12か月契約で月額換算1,100円、アドバンスドは1,980円。独自ドメイン設定費は別途', en: 'Basic is JPY 1,100 and Advanced JPY 1,980 monthly equivalent on 12-month terms; custom-domain setup is extra' },
  pricingDetail: { ja: '契約期間、独自ドメイン設定費、年間ドメイン費、広告表示、ページ・容量・メール上限を合わせて比較します。', en: 'Compare term length, domain setup and renewal, advertising, storage, page, and email limits.' },
  workflow: { ja: '店舗向けテンプレートと定型機能を管理画面から更新し、スマートフォン・タブレットでも運用します。', en: 'Update store-oriented templates and predefined functions from a mobile-compatible administration screen.' },
  bestFor: { ja: '飲食店、美容室、エステ、教室等で、店舗情報とキャンペーンを少人数で更新したい事業者', en: 'Restaurants, salons, schools, and other small local businesses managing information and campaigns with a small team' },
  strengths: { ja: ['30日間無料試用', 'クーポン・カレンダー', 'スマホ管理', '店舗・スタッフ・ブログ機能'], en: ['30-day trial', 'Coupons and calendars', 'Mobile administration', 'Store, staff, and blog functions'] },
  limits: { ja: ['ショッピングカートなし', '独自ドメイン設定費', 'ベーシックは広告表示', '専用レイアウトの移行は限定的'], en: ['No shopping cart', 'Custom-domain setup fee', 'Advertising on Basic', 'Limited layout portability'] }
};
fs.writeFileSync(profilePath, `${JSON.stringify(profiles, null, 2)}\n`);

const packagePath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
pkg.version = '1.19.0';
fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

const sitePath = path.join(root, 'content/config/site.json');
const site = JSON.parse(fs.readFileSync(sitePath, 'utf8'));
site.assetVersion = '5.0.0';
site.defaultVerifiedAt = date;
fs.writeFileSync(sitePath, `${JSON.stringify(site, null, 2)}\n`);

function addRelatedAndUpdateExisting(lang) {
  const dir = path.join(articleRoot, lang);
  const additions = (lang === 'ja' ? relatedJa : relatedEn).slice(0, 8);
  const newFiles = new Set(routes.map(route => `${route.slug}.json`));
  for (const filename of fs.readdirSync(dir).filter(name => name.endsWith('.json'))) {
    if (newFiles.has(filename)) continue;
    const file = path.join(dir, filename);
    let article;
    try { article = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    if (article.category !== 'website-builders' && article.topic !== 'website-builders') continue;
    article.relatedLinks = Array.isArray(article.relatedLinks) ? article.relatedLinks : [];
    const urls = new Set(article.relatedLinks.map(link => link.url));
    for (const link of additions) {
      if (!urls.has(link.url)) { article.relatedLinks.push(link); urls.add(link.url); }
    }
    article.relatedLinks = article.relatedLinks.slice(0, 10);
    fs.writeFileSync(file, `${JSON.stringify(article, null, 2)}\n`);
  }
}
addRelatedAndUpdateExisting('ja');
addRelatedAndUpdateExisting('en');

function extendStoreComparison(lang) {
  const file = path.join(articleRoot, lang, 'store-website-builder-comparison.json');
  const article = JSON.parse(fs.readFileSync(file, 'utf8'));
  const section = article.sections.find(item => item.table && Array.isArray(item.table.rows));
  if (section) {
    const name = lang === 'ja' ? 'おちゃのこさいさい' : 'Ochanoko Saisai';
    if (!section.table.rows.some(row => row[0] === name)) {
      section.table.rows.unshift(lang === 'ja'
        ? ['おちゃのこさいさい', '店舗案内・クーポン・カレンダー', '店舗向け定型機能、スマホ更新', 'カートなし、ドメイン設定費']
        : ['Ochanoko Saisai', 'Store information, coupons, calendars', 'Predefined store features and mobile updates', 'No cart; domain setup cost']);
    }
  }
  article.updatedAt = date;
  article.verifiedAt = date;
  fs.writeFileSync(file, `${JSON.stringify(article, null, 2)}\n`);
}
extendStoreComparison('ja');
extendStoreComparison('en');

const qa = `# QA — v1.19.0 Ochanoko Saisai and homepage audit\n\n## Homepage audit\n- The public domain could not be fetched or found in indexed search results from the verification environment, so the v1.18.0 generated public site was audited as the deployment candidate.\n- Removed internal-facing wording such as "priority articles" from homepage, category, and article-directory metadata.\n- Changed the homepage article-count label from search-ready to published.\n- Rebalanced homepage features so the newest product does not dominate all comparison and review slots.\n- Expanded the website-builder category description to include local-business sites and booking routes.\n\n## Content scope\n- Added 10 Japanese and 10 English Ochanoko Saisai articles.\n- Added review, pricing, plan, comparison, salon, restaurant, coupon/calendar, and SEO intent coverage.\n- Updated the existing store website builder comparison and related-link clusters.\n\n## Affiliate implementation\n- Program ID: s00000015680002\n- Registered five current A8.net materials without modifying href, a8mat, rel=nofollow, fixed copy, or 1x1 tracking pixels.\n- Did not register or publish the supplied JPY 750 material because it conflicts with current official pricing.\n- Japanese articles display advertising disclosure and A8.net materials. English articles use the official destination.\n\n## Evidence policy\n- Pricing uses the official current plan page checked on 2026-07-19.\n- The service is described as a local-business website builder and not an ecommerce cart, matching the official registration page.\n- Custom-domain setup and annual domain fees are stated separately.\n- Competitor comparisons use provider-owned pricing and feature pages.\n\n## Validation\nRun: npm run check\n`;
fs.writeFileSync(path.join(root, 'docs/QA_V1.19_OCHANOKO_SAISAI.md'), qa);

console.log(`Added ${routes.length * 2} Ochanoko Saisai articles and updated v1.19.0 configuration.`);
