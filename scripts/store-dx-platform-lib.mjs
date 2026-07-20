import fs from 'node:fs/promises';
import path from 'node:path';

const jsonForScript = value => JSON.stringify(value).replace(/</g, '\\u003c');

function localizedLinks(site, language, tail) {
  const other = language === 'ja' ? 'en' : 'ja';
  return `<link rel="alternate" hreflang="ja" href="${site.baseUrl}/ja/${tail}"><link rel="alternate" hreflang="en" href="${site.baseUrl}/en/${tail}"><link rel="alternate" hreflang="x-default" href="${site.baseUrl}/${site.defaultLanguage}/${tail}">`;
}

function productCard(product, language, esc) {
  const bestFor = product.bestFor?.[language] || '';
  const strengths = (product.strengths?.[language] || []).slice(0, 2).map(item => `<li>${esc(item)}</li>`).join('');
  const label = language === 'ja' ? '製品データを確認' : 'View product data';
  return `<article class="store-dx-product-card"><span>${esc(product.categoryName?.[language] || product.category)}</span><h3>${esc(product.name)}</h3><p>${esc(bestFor)}</p><ul>${strengths}</ul><a class="text-link" href="/${language}/products/${esc(product.id)}/">${label}</a></article>`;
}

function articleCard(language, route, title, description, esc) {
  return `<a class="store-dx-article-card" href="${route}"><strong>${esc(title)}</strong><span>${esc(description)}</span></a>`;
}

export async function generateStoreDxPlatform({root, outputRoot, site, productCatalog, articleRecords, renderDirectoryCard, header, footer, currentLabel, esc, writeFile}) {
  const config = JSON.parse(await fs.readFile(path.join(root, 'content/config/store-dx-platform.json'), 'utf8'));
  const productById = new Map((productCatalog.products || []).map(product => [product.id, product]));
  const featuredIds = [...new Set(Object.values(config.productGroups).flat())];
  const featured = featuredIds.map(id => productById.get(id)).filter(Boolean);
  const storeDxArticles = (articleRecords || []).filter(record => record.category === 'store-dx');

  for (const language of site.languages) {
    const other = language === 'ja' ? 'en' : 'ja';
    const isJa = language === 'ja';
    const canonical = `${site.baseUrl}/${language}/store-dx/`;
    const diagnosisCanonical = `${site.baseUrl}/${language}/store-dx-assessment/`;
    const title = isJa ? '店舗DX総合ガイド｜POS・決済・予約・LINE・会計を整理 | Luqevora' : 'Store DX Hub: POS, Payments, Booking, LINE, and Accounting | Luqevora';
    const description = isJa
      ? '飲食店、美容サロン、小売店のPOS、決済、予約、顧客管理、LINE、会計を課題別に整理し、無料診断で導入順序と候補を確認できます。'
      : 'Plan POS, payments, booking, customer records, LINE, and accounting for restaurants, salons, retail, and service businesses with a free browser-based assessment.';
    const graph = {'@context':'https://schema.org','@graph':[
      {'@type':'CollectionPage','@id':`${canonical}#webpage`,url:canonical,name:title,description,inLanguage:language,isPartOf:{'@id':`${site.baseUrl}/#website`}},
      {'@type':'ItemList','@id':`${canonical}#solutions`,numberOfItems:featured.length,itemListElement:featured.map((product,index)=>({'@type':'ListItem',position:index+1,name:product.name,url:`${site.baseUrl}/${language}/products/${product.id}/`}))},
      {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Luqevora',item:`${site.baseUrl}/${language}/`},{'@type':'ListItem',position:2,name:isJa?'店舗DX':'Store DX',item:canonical}]}
    ]};

    const workstreams = isJa ? [
      ['01','売上・会計','POS、決済、値引き、取消、現金差額を同じ基準で記録します。','/ja/cashless-payments/pos-register-vs-cashless-payment/'],
      ['02','予約・注文','予約枠、スタッフ、設備、モバイルオーダーを業種別に整えます。','/ja/store-dx/store-dx-stack-comparison/'],
      ['03','顧客・再来店','顧客カルテ、LINE、リマインド、クーポンの目的と同意を設計します。','/ja/store-dx/salon-store-dx-guide/'],
      ['04','会計・データ連携','POS売上、決済入金、銀行、会計、勤怠を重複入力せずにつなぎます。','/ja/store-dx/store-dx-implementation-roadmap/']
    ] : [
      ['01','Sales and checkout','Align POS, payments, discounts, cancellations, and cash differences.','/en/cashless-payments/pos-register-vs-cashless-payment/'],
      ['02','Booking and ordering','Structure schedules, resources, mobile ordering, and intake by industry.','/en/store-dx/store-dx-stack-comparison/'],
      ['03','Customer retention','Define customer records, LINE, reminders, offers, and consent.','/en/store-dx/salon-store-dx-guide/'],
      ['04','Accounting and data','Connect POS sales, settlements, banks, accounting, and staff data without duplicate entry.','/en/store-dx/store-dx-implementation-roadmap/']
    ];

    const industryRows = isJa ? [
      ['飲食店','POS・決済 → 注文管理 → 売上分析 → 会計','注文受付だけでなく厨房と提供工程を確認'],
      ['美容サロン','予約・顧客カルテ → 決済 → LINE → 会計','スタッフ枠、施術時間、再来店導線を優先'],
      ['小売店','商品マスタ → POS・在庫 → 決済 → 会計','返品、棚卸し、複数店舗、EC在庫を確認'],
      ['サービス店舗','予約・受付 → 決済 → 顧客管理 → 会計','設備枠、回数券、前払い、キャンセルを確認']
    ] : [
      ['Restaurant','POS and payments → ordering → analysis → accounting','Review kitchen and service capacity, not intake alone'],
      ['Salon','Booking and records → payments → LINE → accounting','Prioritize staff capacity, duration, and retention'],
      ['Retail','Product data → POS and stock → payments → accounting','Test returns, stock counts, locations, and ecommerce'],
      ['Service business','Booking and intake → payments → CRM → accounting','Review resources, passes, prepayment, and cancellation']
    ];

    const articles = isJa ? [
      [config.articleRoutes.ja.roadmap,'店舗DX導入ロードマップ','一度に切り替えず、30日単位で導入と定着を進めます。'],
      [config.articleRoutes.ja.stack,'店舗DXツール構成比較','POS、決済、予約、LINE、会計の組み合わせを比較します。'],
      [config.articleRoutes.ja.salon,'美容サロンの店舗DX','予約と顧客管理を中心に設計します。'],
      [config.articleRoutes.ja.retail,'小売店の店舗DX','商品・在庫・決済・会計をつなぎます。']
    ] : [
      [config.articleRoutes.en.roadmap,'Store DX implementation roadmap','Introduce and validate systems in controlled thirty-day stages.'],
      [config.articleRoutes.en.stack,'Store DX stack comparison','Compare combinations of POS, payments, booking, LINE, and accounting.'],
      [config.articleRoutes.en.salon,'Salon Store DX guide','Design booking, customer records, retention, and accounting.'],
      [config.articleRoutes.en.retail,'Retail Store DX guide','Connect product data, inventory, payments, and accounting.']
    ];

    const platformHtml = `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}">${localizedLinks(site, language, 'store-dx/')}<meta property="og:type" content="website"><meta property="og:site_name" content="Luqevora"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${site.baseUrl}/assets/images/og-default.png"><link rel="stylesheet" href="/assets/css/style.css?v=${site.assetVersion}"><script type="application/ld+json">${jsonForScript(graph)}</script><script defer src="/assets/js/analytics-v4.8.0.js"></script><script defer src="/assets/js/main-v4.7.0.js"></script></head><body>${header(language,'store-dx',`/${other}/store-dx/`)}<main id="main"><section class="store-dx-hero"><div class="container store-dx-hero-grid"><div><nav class="breadcrumb"><a href="/${language}/">Luqevora</a><span>/</span><span>${isJa?'店舗DX':'Store DX'}</span></nav><span class="eyebrow">${isJa?'店舗経営のデジタル化':'Digital operations for local businesses'}</span><h1>${isJa?'店舗DXを、製品選びではなく業務改善から設計する':'Design Store DX around operating problems, not product lists'}</h1><p>${isJa?'POS・決済・予約・顧客管理・LINE・会計を、業種と課題に合わせて導入順序から整理します。':'Plan POS, payments, booking, customer records, LINE, and accounting in the right sequence for the business.'}</p><div class="store-dx-actions"><a class="btn btn-primary" data-track-event="store_dx_diagnosis_open" href="/${language}/store-dx-assessment/">${isJa?'無料診断を開始':'Start the free assessment'}</a><a class="btn btn-secondary" href="${articles[0][0]}">${isJa?'導入ロードマップを見る':'View the roadmap'}</a></div><p class="store-dx-privacy-note">${isJa?'診断入力はブラウザ内で処理され、送信されません。':'Assessment inputs are processed in the browser and are not submitted.'}</p></div><aside class="store-dx-summary"><strong>${isJa?'最初に決める4項目':'Four decisions to make first'}</strong><ol><li>${isJa?'最も時間がかかる作業':'Largest recurring workload'}</li><li>${isJa?'正とする売上・顧客データ':'Source of truth for sales and customers'}</li><li>${isJa?'担当者と例外処理':'Owner and exception process'}</li><li>${isJa?'12か月の総費用':'Twelve-month total cost'}</li></ol></aside></div></section><section class="section section-white"><div class="container"><span class="eyebrow">${isJa?'課題別の設計':'Workstreams'}</span><h2>${isJa?'店舗DXを4つの業務に分ける':'Divide Store DX into four operating workstreams'}</h2><div class="store-dx-workstream-grid">${workstreams.map(([num,name,text,url])=>`<article><span>${num}</span><h3>${esc(name)}</h3><p>${esc(text)}</p><a class="text-link" href="${url}">${isJa?'詳しく確認':'Review the workflow'}</a></article>`).join('')}</div></div></section><section class="section"><div class="container"><span class="eyebrow">${isJa?'業種別の優先順位':'Industry sequence'}</span><h2>${isJa?'同じツールでも導入順序は業種で変わる':'The sequence changes by industry'}</h2><div class="table-wrap"><table class="comparison-table"><thead><tr><th>${isJa?'業種':'Industry'}</th><th>${isJa?'推奨する検討順':'Suggested sequence'}</th><th>${isJa?'注意点':'Primary caution'}</th></tr></thead><tbody>${industryRows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></section><section class="section section-white"><div class="container"><span class="eyebrow">${isJa?'比較データ':'Product data'}</span><h2>${isJa?'店舗DXで比較できる主な候補':'Products represented in the Store DX data model'}</h2><p>${isJa?'性能ランキングではありません。公式情報を共通項目へ整理し、候補を絞るためのデータです。':'This is not a performance ranking. Provider-owned information is normalized to support shortlisting.'}</p><div class="store-dx-product-grid">${featured.slice(0,12).map(product=>productCard(product,language,esc)).join('')}</div><div class="section-actions"><a class="btn btn-secondary" href="/${language}/compare/?category=store-dx">${isJa?'製品比較DBを開く':'Open the product database'}</a></div></div></section><section class="section"><div class="container"><span class="eyebrow">${isJa?'実践ガイド':'Implementation guides'}</span><h2>${isJa?'導入前に確認する記事':'Guides to review before implementation'}</h2><div class="store-dx-article-grid">${articles.map(([route,aTitle,aDescription])=>articleCard(language,route,aTitle,aDescription,esc)).join('')}</div></div></section><section class="section section-white"><div class="container"><span class="eyebrow">${isJa?'店舗DXの記事一覧':'All Store DX articles'}</span><h2>${isJa?'比較・レビュー・導入ガイド':'Comparisons, reviews, and implementation guides'}</h2><div class="article-directory-grid">${storeDxArticles.filter(record=>record.language===language).map(record=>renderDirectoryCard(record,language)).join('')}</div></div></section><section class="section store-dx-consultation"><div class="container store-dx-consultation-grid"><div><span class="eyebrow">${isJa?'LuQvia店舗DX相談':'LuQvia Store DX consultation'}</span><h2>${isJa?'製品を決める前に、現状と優先課題を整理する':'Clarify the workflow and priorities before selecting products'}</h2><p>${isJa?'診断結果、現在利用中のサービス、店舗数、困っている作業をまとめて相談できます。特定製品の導入を保証するものではありません。':'Use the assessment result, current tools, locations, and recurring problems as a structured consultation brief. No specific implementation outcome is guaranteed.'}</p></div><div class="store-dx-actions"><a class="btn btn-primary" data-track-event="store_dx_line_open" href="${config.consultation.line}" rel="noopener noreferrer" target="_blank">${isJa?'公式LINEで相談':'Contact LuQvia on LINE'}</a><a class="btn btn-secondary" href="mailto:${config.consultation.email}">${isJa?'メールで相談':'Contact by email'}</a></div></div></section></main>${footer(language)}</body></html>`;
    await writeFile(path.join(outputRoot, language, 'store-dx', 'index.html'), platformHtml);

    const diagnosisTitle = isJa ? '店舗DX無料診断｜業種・課題から導入順序と候補を整理 | Luqevora' : 'Free Store DX Assessment: Build a Roadmap and Shortlist | Luqevora';
    const diagnosisDescription = isJa
      ? '業種、店舗数、現在のツール、課題、予算を入力し、店舗DXの優先順位、候補製品、関連ガイドをブラウザ内で表示します。'
      : 'Enter industry, locations, current tools, problems, and budget to generate a Store DX sequence, product shortlist, and related guides in the browser.';
    const appData = {
      version: config.version,
      language,
      products: featured.map(product => ({id:product.id,name:product.name,category:product.category,positioning:product.positioning?.[language]||'',bestFor:product.bestFor?.[language]||'',strengths:product.strengths?.[language]||[],limits:product.limits?.[language]||[],flags:product.flags||{}})),
      productGroups: config.productGroups,
      articleRoutes: config.articleRoutes[language],
      consultation: config.consultation
    };
    const diagnosisGraph = {'@context':'https://schema.org','@graph':[
      {'@type':'WebApplication','@id':`${diagnosisCanonical}#app`,name:diagnosisTitle,url:diagnosisCanonical,description:diagnosisDescription,inLanguage:language,applicationCategory:'BusinessApplication',browserRequirements:'Requires JavaScript',isAccessibleForFree:true},
      {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Luqevora',item:`${site.baseUrl}/${language}/`},{'@type':'ListItem',position:2,name:isJa?'店舗DX':'Store DX',item:canonical},{'@type':'ListItem',position:3,name:isJa?'無料診断':'Free assessment',item:diagnosisCanonical}]}
    ]};

    const painOptions = isJa ? [
      ['checkout','会計・決済の入力や締め作業'],['booking','予約・電話対応・予定変更'],['orders','注文受付・提供待ち'],['inventory','商品・在庫・棚卸し'],['retention','再来店・LINE・顧客対応'],['accounting','会計・入金・経費の転記'],['website','Webサイト・申込導線'],['staffing','勤怠・シフト・人員配置']
    ] : [
      ['checkout','Checkout, payment entry, and closing'],['booking','Booking, calls, and schedule changes'],['orders','Order intake and service waiting time'],['inventory','Products, inventory, and stock counts'],['retention','Retention, LINE, and customer communication'],['accounting','Accounting, settlement, and expense entry'],['website','Website and inquiry journey'],['staffing','Attendance, shifts, and staffing']
    ];
    const currentOptions = isJa ? [['pos','POSレジ'],['payment','キャッシュレス決済'],['booking','予約システム'],['line','LINE公式アカウント'],['accounting','会計ソフト'],['website','店舗Webサイト']] : [['pos','POS'],['payment','Cashless payments'],['booking','Booking system'],['line','LINE Official Account'],['accounting','Accounting software'],['website','Store website']];
    const diagnosisHtml = `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(diagnosisTitle)}</title><meta name="description" content="${esc(diagnosisDescription)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${diagnosisCanonical}">${localizedLinks(site, language, 'store-dx-assessment/')}<meta property="og:type" content="website"><meta property="og:site_name" content="Luqevora"><meta property="og:title" content="${esc(diagnosisTitle)}"><meta property="og:description" content="${esc(diagnosisDescription)}"><meta property="og:url" content="${diagnosisCanonical}"><meta property="og:image" content="${site.baseUrl}/assets/images/og-default.png"><link rel="stylesheet" href="/assets/css/style.css?v=${site.assetVersion}"><script type="application/ld+json">${jsonForScript(diagnosisGraph)}</script><script defer src="/assets/js/analytics-v4.8.0.js"></script><script defer src="/assets/js/main-v4.7.0.js"></script><script defer src="/assets/js/store-dx-diagnosis-v4.1.0.js"></script></head><body>${header(language,'store-dx',`/${other}/store-dx-assessment/`)}<main id="main"><section class="store-dx-diagnosis-hero"><div class="container"><nav class="breadcrumb"><a href="/${language}/">Luqevora</a><span>/</span><a href="/${language}/store-dx/">${isJa?'店舗DX':'Store DX'}</a><span>/</span><span>${isJa?'無料診断':'Assessment'}</span></nav><span class="eyebrow">${isJa?'所要時間の目安：3分':'Estimated completion: three minutes'}</span><h1>${isJa?'店舗DX無料診断':'Free Store DX assessment'}</h1><p>${isJa?'業種と課題から、導入する順序、比較候補、確認すべき記事を整理します。入力内容は送信されません。':'Generate a phased implementation sequence, product shortlist, and reading plan. Inputs are not submitted.'}</p></div></section><section class="section section-white"><div class="container store-dx-diagnosis" data-store-dx-diagnosis data-lang="${language}"><form data-store-dx-form><div class="store-dx-form-grid"><fieldset><legend>1. ${isJa?'業種':'Industry'}</legend>${[['restaurant',isJa?'飲食店':'Restaurant'],['salon',isJa?'美容サロン':'Salon'],['retail',isJa?'小売店':'Retail'],['service',isJa?'スクール・施設・サービス店舗':'Class, facility, or service']].map(([value,label],index)=>`<label><input type="radio" name="industry" value="${value}"${index===0?' checked':''}>${label}</label>`).join('')}</fieldset><fieldset><legend>2. ${isJa?'店舗数':'Locations'}</legend>${[['one',isJa?'1店舗':'One'],['small',isJa?'2〜5店舗':'Two to five'],['multi',isJa?'6店舗以上':'Six or more']].map(([value,label],index)=>`<label><input type="radio" name="locations" value="${value}"${index===0?' checked':''}>${label}</label>`).join('')}</fieldset><fieldset class="store-dx-wide"><legend>3. ${isJa?'改善したい課題（複数選択）':'Problems to improve (select multiple)'}</legend><div class="store-dx-checkbox-grid">${painOptions.map(([value,label])=>`<label><input type="checkbox" name="pain" value="${value}">${label}</label>`).join('')}</div></fieldset><fieldset class="store-dx-wide"><legend>4. ${isJa?'現在利用している仕組み':'Current systems'}</legend><div class="store-dx-checkbox-grid">${currentOptions.map(([value,label])=>`<label><input type="checkbox" name="current" value="${value}">${label}</label>`).join('')}</div></fieldset><fieldset><legend>5. ${isJa?'予算の考え方':'Budget approach'}</legend>${[['test',isJa?'無料・低コストで検証':'Test with free or low-cost options'],['balanced',isJa?'費用と連携のバランス':'Balance cost and integration'],['support',isJa?'導入支援・サポート重視':'Prioritize implementation support']].map(([value,label],index)=>`<label><input type="radio" name="budget" value="${value}"${index===1?' checked':''}>${label}</label>`).join('')}</fieldset><fieldset><legend>6. ${isJa?'導入時期':'Target timing'}</legend>${[['research',isJa?'情報収集中':'Researching'],['quarter',isJa?'3か月以内':'Within three months'],['urgent',isJa?'1か月以内':'Within one month']].map(([value,label],index)=>`<label><input type="radio" name="timing" value="${value}"${index===0?' checked':''}>${label}</label>`).join('')}</fieldset></div><div class="store-dx-actions"><button class="btn btn-primary" type="submit">${isJa?'診断結果を表示':'Show assessment'}</button><button class="btn btn-secondary" type="reset">${isJa?'入力をリセット':'Reset'}</button></div></form><section class="store-dx-results" data-store-dx-results hidden aria-live="polite"><div class="store-dx-result-header"><div><span class="eyebrow">${isJa?'診断結果':'Assessment result'}</span><h2 data-store-dx-result-title></h2><p data-store-dx-result-summary></p></div><button class="btn btn-secondary" type="button" data-store-dx-print>${isJa?'印刷・PDF保存':'Print or save as PDF'}</button></div><h3>${isJa?'推奨する導入順序':'Suggested implementation sequence'}</h3><div class="store-dx-roadmap" data-store-dx-roadmap></div><h3>${isJa?'比較候補':'Product shortlist'}</h3><p>${isJa?'順位は性能評価ではなく、選択した課題と製品データの一致度です。契約前に公式条件を確認してください。':'The order reflects selected needs and catalog matches, not a performance rating. Verify official terms before purchase.'}</p><div class="store-dx-product-grid" data-store-dx-products></div><h3>${isJa?'次に読むガイド':'Recommended guides'}</h3><div class="store-dx-article-grid" data-store-dx-guides></div><div class="store-dx-consultation-panel"><h3>${isJa?'結果を使ってLuQviaへ相談':'Use the result as a LuQvia consultation brief'}</h3><p>${isJa?'相談時は業種、店舗数、現在の仕組み、優先課題、希望時期を共有してください。':'Share the industry, locations, current systems, priorities, and target timing.'}</p><div class="store-dx-actions"><a class="btn btn-primary" data-track-event="store_dx_result_line_open" href="${config.consultation.line}" rel="noopener noreferrer" target="_blank">${isJa?'公式LINEで相談':'Contact on LINE'}</a><a class="btn btn-secondary" href="mailto:${config.consultation.email}">${isJa?'メールで相談':'Contact by email'}</a></div></div></section><script type="application/json" data-store-dx-data>${jsonForScript(appData)}</script></div></section></main>${footer(language)}</body></html>`;
    await writeFile(path.join(outputRoot, language, 'store-dx-assessment', 'index.html'), diagnosisHtml);
  }
}
