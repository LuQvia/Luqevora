import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'content/articles');
const date = '2026-07-19';
const official = 'https://shop-pro.jp/';
const sources = [
  { label: 'カラーミーショップ公式サイト', url: 'https://shop-pro.jp/' },
  { label: 'カラーミーショップ プラン・料金', url: 'https://shop-pro.jp/plans' },
  { label: 'カラーミーショップ 集客機能', url: 'https://shop-pro.jp/features/attract-customers/' },
  { label: 'カラーミーショップ SEO対策ヘルプ', url: 'https://help.shop-pro.jp/hc/ja/articles/115004714548' },
  { label: '各ページのSEO設定', url: 'https://help.shop-pro.jp/hc/ja/articles/1500004025742' }
];
const enSources = sources.map((s) => ({ label: s.label.replace('カラーミーショップ', 'Color Me Shop'), url: s.url }));
const routesJa = [
  ['color-me-shop-review','カラーミーショップレビュー｜料金・機能・SEOの注意点【2026年】','カラーミーショップを公式情報で検証。料金、決済手数料、商品管理、デザイン、SEO設定、集客、サポートと選び方を整理します。'],
  ['color-me-shop-vs-shopify','カラーミーショップとShopifyを比較｜料金・SEO・運用の違い','カラーミーショップとShopifyを、国内運用、料金構造、決済、アプリ、SEO、越境販売、サポートから比較します。'],
  ['color-me-shop-vs-xserver-shop','カラーミーショップとXServerショップを比較｜SaaSとEC-CUBE','カラーミーショップとXServerショップを、初期費用、販売手数料、EC-CUBE、保守、SEO、拡張性から比較します。'],
  ['japanese-ecommerce-platform-seo-comparison','国産ネットショップ作成サービスSEO比較｜確認すべき10項目','国産ECサービスをSEO観点で比較するための実務チェックリスト。カテゴリ、商品、サイトマップ、構造化データ、速度、運用権限を確認します。'],
  ['color-me-shop-seo-guide','カラーミーショップSEO設定ガイド｜カテゴリ・商品・サイトマップ','カラーミーショップのSEO設定を、タイトル、description、カテゴリ、商品、XMLサイトマップ、内部リンク、コンテンツ改善の順に解説します。']
];
const routesEn = [
  ['color-me-shop-review','Color Me Shop Review: Pricing, Features, and SEO Limits','Review Color Me Shop using official information on pricing, payments, catalog operations, design, SEO controls, acquisition tools, and support.'],
  ['color-me-shop-vs-shopify','Color Me Shop vs Shopify: Cost, SEO, and Operations','Compare Color Me Shop and Shopify across Japan-focused operations, pricing, payments, apps, SEO, international selling, and support.'],
  ['color-me-shop-vs-xserver-shop','Color Me Shop vs XServer Shop: SaaS vs Managed EC-CUBE','Compare Color Me Shop and XServer Shop by setup cost, platform fees, EC-CUBE, maintenance, SEO controls, and extensibility.'],
  ['japanese-ecommerce-platform-seo-comparison','Japanese Ecommerce Platform SEO Comparison: 10 Checks','A practical framework for comparing Japanese ecommerce platforms by category control, product metadata, sitemaps, structured data, performance, and governance.'],
  ['color-me-shop-seo-guide','Color Me Shop SEO Guide: Categories, Products, and Sitemaps','A practical Color Me Shop SEO workflow covering titles, descriptions, categories, products, XML sitemaps, internal links, and content improvement.']
];

const relJa = [
  {label:'カラーミーショップレビュー',url:'/ja/website-builders/color-me-shop-review/',description:'料金・機能・SEOの注意点を確認'},
  {label:'カラーミーショップとShopifyの比較',url:'/ja/website-builders/color-me-shop-vs-shopify/',description:'国内運用と拡張性を比較'},
  {label:'カラーミーショップとXServerショップの比較',url:'/ja/website-builders/color-me-shop-vs-xserver-shop/',description:'SaaS型とEC-CUBE型を比較'},
  {label:'国産ネットショップSEO比較',url:'/ja/website-builders/japanese-ecommerce-platform-seo-comparison/',description:'SEO要件を10項目で確認'},
  {label:'カラーミーショップSEO設定ガイド',url:'/ja/website-builders/color-me-shop-seo-guide/',description:'設定と改善手順を確認'},
  {label:'XServerショップレビュー',url:'/ja/website-builders/xserver-shop-review/',description:'固定費型EC-CUBEサービスを確認'},
  {label:'販売手数料0円のEC比較',url:'/ja/website-builders/fixed-fee-ecommerce-platform-comparison/',description:'月商別の総コストを比較'}
];
const relEn = [
  {label:'Color Me Shop review',url:'/en/website-builders/color-me-shop-review/',description:'Review pricing, features, and SEO controls'},
  {label:'Color Me Shop vs Shopify',url:'/en/website-builders/color-me-shop-vs-shopify/',description:'Compare Japan-focused operations and ecosystem scale'},
  {label:'Color Me Shop vs XServer Shop',url:'/en/website-builders/color-me-shop-vs-xserver-shop/',description:'Compare SaaS and managed EC-CUBE'},
  {label:'Japanese ecommerce platform SEO comparison',url:'/en/website-builders/japanese-ecommerce-platform-seo-comparison/',description:'Use a ten-point SEO platform checklist'},
  {label:'Color Me Shop SEO guide',url:'/en/website-builders/color-me-shop-seo-guide/',description:'Follow a practical optimization workflow'},
  {label:'XServer Shop review',url:'/en/website-builders/xserver-shop-review/',description:'Review the fixed-fee EC-CUBE option'},
  {label:'Fixed-fee ecommerce comparison',url:'/en/website-builders/fixed-fee-ecommerce-platform-comparison/',description:'Compare total cost by revenue level'}
];

function jaSections(slug) {
  const common = [
    { heading:'結論', body:[
      'カラーミーショップは、日本国内の商習慣、決済、配送、運営支援を重視しながら、テンプレートとHTML・CSS編集を組み合わせてネットショップを運営したい事業者向けの候補です。SEOでは各ページのタイトル要素・メタ要素、商品・大カテゴリー・小カテゴリー・グループ・フリーページの個別設定、XMLサイトマップなどを利用できます。',
      '検索順位はサービスを契約しただけで上がるものではありません。商品情報の独自性、カテゴリ設計、内部リンク、表示速度、在庫・終売ページの処理、外部評価、継続更新を含めて運用します。'
    ]},
    { heading:'料金と契約前の確認', body:[
      '公式料金ページではレギュラー、ラージ、プレミアムなどが案内されています。レギュラーは月額4,950円、ラージは月額9,595円、プレミアムは月額35,640円からと表示されています。契約期間、初期費用、決済手数料、アプリ、テンプレート、制作費を含む年間総額で判断してください。',
      '決済手数料はプランや決済方法で異なります。返金、チャージバック、入金サイクル、振込手数料、海外カード、定期購入の条件も申込時点で確認します。'
    ], table:{headers:['比較項目','確認内容','SEO・売上への影響'],rows:[['月額・初期費用','契約期間とプラン','固定費と投資回収'],['決済費用','料率・入金・返金','粗利と購入率'],['商品・画像容量','登録数と保存容量','品揃えと表示品質'],['サポート','窓口と対象範囲','障害時の復旧速度']]}},
    { heading:'ECカテゴリSEOを強くする設計', body:[
      'トップページだけでなく、大カテゴリー、小カテゴリー、グループ、商品詳細、特集ページへ検索意図を分担させます。カテゴリー名は顧客が検索する一般語を優先し、商品名だけでは説明できない選び方、用途、素材、サイズ、互換性、配送条件をカテゴリ本文や特集ページで補います。',
      '同じ説明文を多数の商品へ複製すると、検索結果で各ページの違いが伝わりません。メーカー情報をそのまま転載するのではなく、実測、利用場面、比較軸、注意事項、FAQを追加します。'
    ], bullets:['カテゴリ階層を深くしすぎない','商品一覧から重要商品へ明確にリンクする','終売ページは代替商品へ案内する','絞り込みURLのインデックス方針を決める','画像altとファイル容量を管理する']},
    { heading:'カラーミーショップで使えるSEO設定', body:[
      '公式ヘルプでは、検索エンジン対策画面からタイトル要素とメタ要素を設定でき、商品詳細、大カテゴリー、小カテゴリー、グループ、フリーページにも個別設定が可能と案内されています。XMLサイトマップをGoogle Search Consoleへ登録する手順も用意されています。',
      '設定欄を埋めること自体より、検索意図とページ内容が一致していることが重要です。タイトルは主要テーマを前半に置き、descriptionは対象者、比較軸、得られる情報を自然に説明します。キーワードの不自然な反復は避けます。'
    ]},
    { heading:'集客機能とSEOの役割分担', body:[
      '公式サイトはSNS・ブログ連携、SEO設定、広告配信、Instagram連携、メールマーケティング等を案内しています。SEOは中長期の自然検索流入、広告は短期の検証、SNSとメールは認知・再訪・リピートを担うように分けると評価しやすくなります。',
      '広告で売れた検索語や商品をSEOコンテンツへ反映し、SEOで流入したページの離脱や購入率を広告・LP改善へ戻す循環を作ります。'
    ]},
    { heading:'選び方と注意点', body:[
      '国内向けの運営支援と日本語管理を優先するならカラーミーショップ、海外販売や大規模アプリ基盤を重視するならShopify、EC-CUBEのコード・プラグイン運用を重視するならXServerショップを比較します。',
      '移行時は商品、顧客、注文、レビュー、会員、ポイント、メール、クーポン、URL、画像、計測タグ、検索評価を完全には移せない場合があります。契約前にエクスポート形式とURL変更範囲を確認してください。'
    ]}
  ];
  if (slug === 'color-me-shop-seo-guide') common.unshift({heading:'実施順序',body:['最初にSearch Consoleとアクセス解析の計測を確認し、次にカテゴリ構造、タイトル・description、商品本文、内部リンク、画像、サイトマップ、終売処理を順番に改善します。変更前後のクリック数、表示回数、掲載順位、購入率を同じ期間で比較します。'],bullets:['計測とインデックス確認','カテゴリと検索意図の対応表','重要ページのメタ情報','商品本文とFAQ','内部リンクとパンくず','XMLサイトマップ送信','月次改善']});
  if (slug.includes('vs-shopify')) common.splice(2,0,{heading:'Shopifyとの主な違い',body:['カラーミーショップは国内向けの運用と日本語支援を軸に比較しやすく、Shopifyは販売チャネル、越境、多言語・多通貨、アプリエコシステムを含む拡張性が強みです。どちらも追加アプリや制作費で総額が変わります。'],table:{headers:['項目','カラーミーショップ','Shopify'],rows:[['主な強み','国内運用・日本語支援','グローバル拡張・アプリ'],['SEO','ページ別設定とサイトマップ','テーマ・アプリを含む運用'],['費用','国内プランと決済条件','月額・決済・アプリ'],['向く事業','国内中心の中小EC','成長・多チャネルEC']]}});
  if (slug.includes('vs-xserver')) common.splice(2,0,{heading:'XServerショップとの主な違い',body:['カラーミーショップはSaaS型として標準機能と運営支援を使いやすくまとめています。XServerショップはEC-CUBEを基盤とし、コード、テンプレート、対応プラグインを扱える自由度と、運用担当者の技術負担をセットで評価します。'],table:{headers:['項目','カラーミーショップ','XServerショップ'],rows:[['方式','SaaS型','管理型EC-CUBE'],['初期構築','テンプレート中心','EC-CUBE設計'],['拡張','標準機能・アプリ','コード・プラグイン'],['保守','サービス側の更新','互換性確認が重要']]}});
  return common;
}
function enSections(slug) {
  return [
    {heading:'Verdict',body:['Color Me Shop is a Japan-focused ecommerce platform for merchants that value domestic payment, shipping, support, templates, and HTML/CSS customization. Its official documentation describes page-level title and meta controls plus XML sitemap submission.','Platform settings do not guarantee rankings. Sustainable organic performance still depends on unique product information, category architecture, internal links, performance, discontinued-product handling, and ongoing measurement.']},
    {heading:'Pricing and total cost',body:['The official plan page lists Regular at JPY 4,950 per month, Large at JPY 9,595, and Premium from JPY 35,640. Confirm current contract terms, setup fees, payment processing, apps, themes, implementation, and support before purchase.','Model total annual cost at realistic revenue levels rather than comparing subscription headlines alone.'],table:{headers:['Cost area','Check','Business impact'],rows:[['Subscription','Plan and term','Fixed operating cost'],['Payments','Rate, payout, refunds','Gross margin'],['Apps and design','Recurring and one-off fees','Capability and maintenance'],['Migration','Data and URL portability','Switching risk']]}},
    {heading:'SEO controls and category architecture',body:['The official help center says titles and meta elements can be configured for product details, major categories, subcategories, groups, and free pages. XML sitemap registration is also documented.','Map one primary search intent to each indexable page. Use categories for broad commercial themes, product pages for specific offers, and editorial pages for comparisons, selection criteria, and questions that product pages cannot answer well.'],bullets:['Keep category depth understandable','Write differentiated product descriptions','Link category guides to key products','Define handling for filters and sold-out items','Compress images and maintain useful alt text']},
    {heading:'Acquisition beyond organic search',body:['Color Me Shop promotes SEO settings alongside social, blog, advertising, Instagram, and email capabilities. Treat these as complementary channels: advertising validates demand, organic search compounds discovery, and email or social supports return visits and retention.','Use paid-search queries, landing-page conversion data, and customer questions to prioritize new category and guide content.']},
    {heading:'How it compares',body:['Compare Color Me Shop with Shopify when international expansion, a large app ecosystem, and multi-channel operations matter. Compare it with XServer Shop when managed EC-CUBE, code-level customization, and fixed platform commission are central requirements.','Before migration, verify export formats and whether products, customers, orders, reviews, memberships, points, coupons, URLs, images, analytics tags, and historical SEO signals can be preserved.']},
    {heading:'Implementation checklist',body:['Audit index coverage, titles, descriptions, category copy, product uniqueness, internal links, sitemap status, Core Web Vitals, structured data output, sold-out handling, and conversion tracking. Measure impressions, clicks, rankings, revenue, and conversion rate after each controlled change.']}
  ];
}
function makeArticle(lang, tuple) {
  const [slug,title,description] = tuple;
  const ja = lang === 'ja';
  return {
    id:`${slug}-${lang}`, translationKey:slug, language:lang, type:slug.includes('vs-')||slug.includes('comparison')?'comparison':'review', status:'published', slug,
    category:'website-builders', topic:'ecommerce-platforms', badge:ja?'公式情報検証・EC SEO強化':'Official-source review and ecommerce SEO',
    title, metaTitle:title, description,
    lead: ja ? 'カラーミーショップの単体評価だけでなく、ECカテゴリ、商品詳細、比較記事、SEO設定、集客チャネルを一つの構造として評価します。' : 'This review evaluates Color Me Shop as part of a wider ecommerce architecture covering categories, products, comparisons, SEO controls, and acquisition channels.',
    publishedAt:date, updatedAt:date, verifiedAt:date, author:ja?'Luqevora編集部':'Luqevora Editorial Team', featured:true, affiliateDisclosure:false,
    ctas:[{label:ja?'カラーミーショップ公式情報を確認':'Check Color Me Shop official details',officialUrl:official}],
    sources: ja?sources:enSources,
    sections: ja?jaSections(slug):enSections(slug),
    faqs: ja ? [
      {question:'カラーミーショップはSEOに弱いですか？',answer:'ページ別のタイトル・メタ設定やXMLサイトマップなどの機能があります。順位は商品情報の独自性、カテゴリ設計、内部リンク、速度、外部評価、継続改善にも左右されます。'},
      {question:'カラーミーショップとShopifyはどちらがよいですか？',answer:'国内向け運用と日本語支援を重視する場合はカラーミーショップ、越境販売やアプリ基盤を重視する場合はShopifyを比較します。総費用と移行性も確認してください。'},
      {question:'SEO設定後すぐに順位は上がりますか？',answer:'設定だけで順位上昇は保証されません。クロール・再評価には時間がかかり、コンテンツ品質や競合状況も影響します。'}
    ] : [
      {question:'Is Color Me Shop weak for SEO?',answer:'It provides page-level metadata controls and XML sitemap guidance. Rankings still depend on content quality, architecture, internal linking, performance, authority, and continuous improvement.'},
      {question:'Should I choose Color Me Shop or Shopify?',answer:'Color Me Shop is often compared for Japan-focused operations and support, while Shopify is compared for international scale and ecosystem breadth. Model total cost and migration risk.'},
      {question:'Will rankings improve immediately after setup?',answer:'No platform setting guarantees an immediate ranking increase. Crawling, re-evaluation, competition, and content quality all affect timing and outcome.'}
    ],
    relatedLinks:(ja?relJa:relEn).filter((x)=>!x.url.includes(`/${slug}/`)).slice(0,6)
  };
}
for (const tuple of routesJa) fs.writeFileSync(path.join(outDir,'ja',`${tuple[0]}.json`),JSON.stringify(makeArticle('ja',tuple),null,2)+'\n');
for (const tuple of routesEn) fs.writeFileSync(path.join(outDir,'en',`${tuple[0]}.json`),JSON.stringify(makeArticle('en',tuple),null,2)+'\n');

const seoPath=path.join(root,'content/config/seo.json');
const seo=JSON.parse(fs.readFileSync(seoPath,'utf8'));
for (const lang of ['ja','en']) for (const [slug] of routesJa) {
  const p=`content/articles/${lang}/${slug}.json`;
  if(!seo.indexing.includeSourceFiles.includes(p)) seo.indexing.includeSourceFiles.push(p);
}
if(!seo.indexing.priorityProducts.includes('color-me-shop')) seo.indexing.priorityProducts.push('color-me-shop');
fs.writeFileSync(seoPath,JSON.stringify(seo,null,2)+'\n');

const homePath=path.join(root,'content/config/home.json');
const home=JSON.parse(fs.readFileSync(homePath,'utf8'));
home.featuredComparisons=['color-me-shop-vs-shopify','color-me-shop-vs-xserver-shop','japanese-ecommerce-platform-seo-comparison',...home.featuredComparisons.filter(x=>!x.includes('color-me-shop')&&!x.includes('japanese-ecommerce'))].slice(0,6);
home.featuredReviews=['color-me-shop-review','color-me-shop-seo-guide',...home.featuredReviews.filter(x=>!x.includes('color-me-shop'))].slice(0,7);
fs.writeFileSync(homePath,JSON.stringify(home,null,2)+'\n');

const catPath=path.join(root,'content/config/categories.json');
const cats=JSON.parse(fs.readFileSync(catPath,'utf8'));
const wb=cats.find(x=>x.id==='website-builders');
wb.description.ja='Webサイト作成、ネットショップ、EC、ホスティング一体型サービスを、料金・SEO・決済・公開方法・独自ドメイン・移行性から比較します。';
wb.description.en='Compare website builders and ecommerce platforms by pricing, SEO controls, payments, publishing workflow, custom domains, hosting, and portability.';
fs.writeFileSync(catPath,JSON.stringify(cats,null,2)+'\n');

const pkgPath=path.join(root,'package.json');
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8')); pkg.version='1.16.0'; fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n');

// Add cluster links to existing ecommerce/website-builder articles without duplicating URLs.
for (const lang of ['ja','en']) {
  const dir=path.join(outDir,lang);
  const additions=(lang==='ja'?relJa:relEn).slice(0,5);
  for (const file of fs.readdirSync(dir).filter(x=>x.endsWith('.json'))) {
    if (routesJa.some(([slug])=>file===`${slug}.json`)) continue;
    const p=path.join(dir,file); let a;
    try { a=JSON.parse(fs.readFileSync(p,'utf8')); } catch { continue; }
    if (a.category!=='website-builders' && a.topic!=='ecommerce-platforms') continue;
    a.relatedLinks=Array.isArray(a.relatedLinks)?a.relatedLinks:[];
    const urls=new Set(a.relatedLinks.map(x=>x.url));
    for(const link of additions){ if(!urls.has(link.url)){a.relatedLinks.push(link);urls.add(link.url);} }
    a.relatedLinks=a.relatedLinks.slice(0,10);
    fs.writeFileSync(p,JSON.stringify(a,null,2)+'\n');
  }
}

const profilePath=path.join(root,'content/article-batches/product-profiles-expansion.json');
const profiles=JSON.parse(fs.readFileSync(profilePath,'utf8'));
profiles['color-me-shop']={
  name:'Color Me Shop', affiliateKey:null,
  sources:[{label:'Color Me Shop official site',url:'https://shop-pro.jp/'},{label:'Plans',url:'https://shop-pro.jp/plans'},{label:'SEO help',url:'https://help.shop-pro.jp/hc/ja/articles/115004714548'}],
  positioning:{ja:'国内向け決済・配送・運営支援とテンプレート、HTML・CSS編集を組み合わせたネットショップ作成サービス',en:'A Japan-focused ecommerce service combining domestic operations, templates, support, and HTML/CSS customization'},
  pricing:{ja:'レギュラー月額4,950円、ラージ9,595円、プレミアム35,640円から。契約時点の条件を要確認',en:'Regular JPY 4,950 monthly, Large JPY 9,595, and Premium from JPY 35,640; confirm current terms'},
  pricingDetail:{ja:'月額だけでなく初期費用、決済、アプリ、テンプレート、制作・移行費を含めて比較します。',en:'Compare subscription, setup, payments, apps, themes, implementation, and migration as total cost.'},
  workflow:{ja:'商品・受注・顧客・配送・集客を管理画面で運用し、ページ別SEO設定とサイトマップを管理します。',en:'Operate catalog, orders, customers, shipping, and acquisition while managing page metadata and sitemaps.'},
  bestFor:{ja:'国内向けECで日本語支援と標準機能を重視する中小事業者',en:'Small and midsize merchants prioritizing Japan-focused operations and support'},
  strengths:{ja:['国内向け運用','ページ別SEO設定','テンプレートとHTML・CSS編集'],en:['Japan-focused operations','Page-level SEO controls','Templates plus HTML/CSS customization']},
  limits:{ja:['総費用は決済・アプリで変動','越境要件は個別確認','移行時のURL・データ制約'],en:['Total cost varies with payments and apps','International requirements need validation','Migration can affect data and URLs']}
};
fs.writeFileSync(profilePath,JSON.stringify(profiles,null,2)+'\n');
console.log('Color Me Shop v1.16.0 content added');
