import fs from 'node:fs/promises';
import path from 'node:path';
import {root, readJson, writeFile} from './lib.mjs';

const DATE = '2026-07-20';
const CATEGORY = 'store-dx';
const OFFICIAL = 'https://f.012grp.co.jp/wiz_kantanchumon_hojyokin';
const SUBSIDY_NORMAL = 'https://it-shien.smrj.go.jp/applicant/subsidy/normal';
const SUBSIDY_FLOW = 'https://it-shien.smrj.go.jp/applicant/flow/';
const SUBSIDY_SCHEDULE = 'https://it-shien.smrj.go.jp/schedule/';

const categoriesPath = path.join(root, 'content/config/categories.json');
const categories = await readJson(categoriesPath);
if (!categories.some(item => item.id === CATEGORY)) {
  categories.push({
    id: CATEGORY,
    order: 45,
    path: CATEGORY,
    name: {ja: '店舗DX', en: 'Store & Restaurant DX'},
    description: {
      ja: '飲食店・小売店・美容サロンなどのPOSレジ、モバイルオーダー、決済、予約、顧客管理、売上分析を、導入目的・運用負担・公式条件から比較します。',
      en: 'Compare POS systems, mobile ordering, payments, reservations, customer management, and sales analytics for restaurants and local businesses.'
    }
  });
  categories.sort((a, b) => (a.order || 999) - (b.order || 999));
  await writeFile(categoriesPath, `${JSON.stringify(categories, null, 2)}\n`);
}

const navPath = path.join(root, 'content/config/navigation.json');
const nav = await readJson(navPath);
const navItems = {
  ja: {label: '店舗DX', url: '/ja/store-dx/'},
  en: {label: 'Store DX', url: '/en/store-dx/'}
};
for (const language of ['ja', 'en']) {
  if (!nav[language].some(item => item.url === navItems[language].url)) {
    const index = nav[language].findIndex(item => item.url.includes('/hosting-security/'));
    nav[language].splice(index >= 0 ? index : nav[language].length, 0, navItems[language]);
  }
}
await writeFile(navPath, `${JSON.stringify(nav, null, 2)}\n`);

const topicsPath = path.join(root, 'content/config/topics.json');
const topics = await readJson(topicsPath);
const newTopics = [
  {
    id: 'restaurant-pos-orders', aliases: ['restaurant-pos', 'mobile-order', 'pos-register'], category: CATEGORY,
    name: {ja: '飲食店POS・注文管理', en: 'Restaurant POS & Ordering'},
    description: {ja: 'POSレジと注文管理を、店舗規模、会計、オーダー、教育、サポートから比較します。', en: 'Compare restaurant POS and ordering by store size, checkout, order flow, training, and support.'}
  },
  {
    id: 'restaurant-dx-operations', aliases: ['restaurant-dx', 'store-operations', 'sales-analysis'], category: CATEGORY,
    name: {ja: '飲食店DX・店舗運営', en: 'Restaurant DX & Operations'},
    description: {ja: '人手不足、客単価、インバウンド、売上分析など店舗運営課題をDXで改善する方法を整理します。', en: 'Plan digital workflows for staffing, average order value, inbound customers, and sales analysis.'}
  },
  {
    id: 'digital-subsidies', aliases: ['it-subsidy', 'digitalization-subsidy'], category: CATEGORY,
    name: {ja: 'DX補助金・導入計画', en: 'DX Subsidies & Implementation'},
    description: {ja: '補助金の対象確認、申請前の見積、交付決定、導入順序を整理します。', en: 'Understand eligibility checks, quotations, grant decisions, and implementation timing.'}
  }
];
for (const topic of newTopics) if (!topics.some(item => item.id === topic.id)) topics.push(topic);
await writeFile(topicsPath, `${JSON.stringify(topics, null, 2)}\n`);

const affiliatePath = path.join(root, 'content/config/affiliates.json');
const affiliates = await readJson(affiliatePath);
const rawLinks = {
  'kantan-chumon-subsidy': '<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+E2NXCQ+3SPO+7XSA36" rel="nofollow">かんたんで便利なPOSレジを補助金でお得に導入【かんたん注文】</a>\n<img border="0" width="1" height="1" src="https://www18.a8.net/0.gif?a8mat=4B84X2+E2NXCQ+3SPO+7XSA36" alt="">',
  'kantan-chumon-short': '<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+E2NXCQ+3SPO+7XSHSY" rel="nofollow">かんたん注文【かんたん注文】</a>\n<img border="0" width="1" height="1" src="https://www14.a8.net/0.gif?a8mat=4B84X2+E2NXCQ+3SPO+7XSHSY" alt="">',
  'kantan-chumon-sales': '<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+E2NXCQ+3SPO+7XSX8I" rel="nofollow">売上、顧客単価UPをサポートするPOSレジ【かんたん注文】</a>\n<img border="0" width="1" height="1" src="https://www10.a8.net/0.gif?a8mat=4B84X2+E2NXCQ+3SPO+7XSX8I" alt="">',
  'kantan-chumon-mobile-order': '<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+E2NXCQ+3SPO+7XT4YA" rel="nofollow">モバイルオーダーで業務削減できるPOSレジ【かんたん注文】</a>\n<img border="0" width="1" height="1" src="https://www11.a8.net/0.gif?a8mat=4B84X2+E2NXCQ+3SPO+7XT4YA" alt="">',
  'kantan-chumon-inbound': '<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+E2NXCQ+3SPO+7XTCO2" rel="nofollow">インバウンド対応にも使えるPOSレジ【かんたん注文】</a>\n<img border="0" width="1" height="1" src="https://www10.a8.net/0.gif?a8mat=4B84X2+E2NXCQ+3SPO+7XTCO2" alt="">',
  'kantan-chumon-analysis': '<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+E2NXCQ+3SPO+7XX7K2" rel="nofollow">細かい項目も分析できるPOSレジ【かんたん注文】</a>\n<img border="0" width="1" height="1" src="https://www15.a8.net/0.gif?a8mat=4B84X2+E2NXCQ+3SPO+7XX7K2" alt="">',
  'kantan-chumon-recommendation': '<a href="https://px.a8.net/svt/ejp?a8mat=4B84X2+E2NXCQ+3SPO+7XXF9U" rel="nofollow">レコメンド機能で客単価を上げるPOSレジ【かんたん注文】</a>\n<img border="0" width="1" height="1" src="https://www10.a8.net/0.gif?a8mat=4B84X2+E2NXCQ+3SPO+7XXF9U" alt="">'
};
for (const [key, rawHtml] of Object.entries(rawLinks)) {
  affiliates.links[key] = {
    type: 'rawHtml', network: 'A8.net', programId: 's00000017718048', language: 'ja',
    destination: OFFICIAL, rawHtml
  };
}
affiliates.links['kantan-chumon-official'] = {
  type: 'official', network: 'Official', language: 'en', destination: OFFICIAL, url: OFFICIAL
};
await writeFile(affiliatePath, `${JSON.stringify(affiliates, null, 2)}\n`);

const articleSpecs = [
  {
    slug: 'kantan-chumon-review', type: 'review', topic: 'restaurant-pos-orders', affiliate: 'kantan-chumon-short',
    ja: {
      title: 'かんたん注文の評判・機能・注意点｜飲食店向けPOSを公式情報で検証',
      description: '飲食店向けタブレット型POSレジ「かんたん注文」を、モバイルオーダー、多言語対応、補助金、導入前の確認事項から検証します。',
      lead: 'かんたん注文は、お客様自身のスマートフォンから注文できるモバイルオーダーを軸にした飲食店向けタブレット型POSレジです。人手不足対策には有力ですが、料金、契約期間、対象機能、補助金対象は問い合わせ前提のため、機能名だけで即決してはいけません。',
      cta: 'かんたん注文の導入条件を確認する',
      sections: [
        ['結論：注文受付の省力化を優先する飲食店向け', ['最大の価値は、注文を取りに行く工程を減らし、スタッフを配膳、会計、接客へ回しやすくする点です。特に少人数営業、ピーク時間の注文集中、外国語対応に課題がある店舗と相性があります。', '一方で、導入効果は客席数、回転率、メニュー構成、通信環境、スタッフ教育で変わります。問い合わせ時には初期費用、月額、端末、決済連携、サポート、解約条件を同じ見積書で確認してください。']],
        ['確認できる主な機能', ['公式ページでは、お客様のスマートフォンからの注文、タブレット型POSレジ、英語・中国語設定が案内されています。注文受付をセルフ化することで、スタッフが配膳や来店客のサポートへ集中しやすくなります。', '広告主の提携メディア向け資料では、売上分析、追加注文を促す通知、注文傾向に基づくおすすめ提案も案内されています。実際に利用できる範囲はプランや設定で異なる可能性があるため、デモ画面で確認します。']],
        ['メリット', ['注文待ちの時間を短縮しやすく、スタッフの移動と聞き間違いを減らせる可能性があります。多言語表示を活用できれば、外国語メニューを紙で別管理する負担も抑えられます。', 'POSと注文情報を一体で扱える場合、時間帯、曜日、商品別の売上を振り返りやすくなります。単なるレジ交換ではなく、注文から会計、分析までの作業設計として評価することが重要です。'], ['お客様のスマートフォンから注文できる', '英語・中国語の設定が案内されている', '注文受付と売上管理をまとめやすい']],
        ['デメリット・注意点', ['料金表が公開ページだけでは確定できず、問い合わせが必要です。補助金利用を前提にすると、交付決定前の契約や支払いが対象外になる制度もあるため、通常導入よりスケジュール管理が重要になります。', 'スマートフォン注文に不慣れな来店客、通信障害、バッテリー切れへの代替手段も必要です。紙メニューやスタッフ注文を完全廃止するのではなく、例外対応を残す方が安全です。'], ['費用と契約条件は個別確認', '補助金は採択を保証しない', '通信障害時の代替手順が必要']],
        ['向いている店舗・向かない店舗', ['向いているのは、注文回数が多い居酒屋、焼肉、カフェ、ファミリー業態、少人数で客席を回す店舗です。追加注文が売上へ直結しやすい業態では、注文導線の短縮が客単価改善につながる余地があります。', '対面での提案自体が価値になる高級店、コース中心で注文回数が少ない店舗、通信環境が不安定な場所では優先度が下がります。店舗体験を壊さないか、実際の客席で試してください。']],
        ['問い合わせ前のチェックリスト', ['見積依頼時は、端末台数、客席数、注文方式、キッチン出力、会計連携、決済端末、商品登録、導入支援、障害対応、解約時のデータ出力を質問します。補助金を使う場合は、対象ツール登録と申請年度も確認します。', '導入判断は「操作が簡単そう」ではなく、ピーク時間の注文待ち、スタッフ歩数、注文ミス、客単価、回転率を導入前後で測れる状態にして行います。']]
      ],
      faqs: [
        ['無料で使えますか？', '公開ページだけでは無料プランや総額を確認できません。初期費用、月額、端末、設定、保守を含む見積を依頼してください。'],
        ['外国語に対応していますか？', '公式ページでは英語と中国語の設定が案内されています。対象画面、翻訳範囲、メニュー登録方法はデモで確認してください。'],
        ['補助金を使えば必ず安くなりますか？', '補助金には対象要件、申請期限、審査、交付決定があります。採択や補助率は保証されないため、通常価格でも成立する投資か確認してください。']]
    },
    en: {
      title: 'Kantan Chumon Review: Mobile Ordering, Restaurant POS Features, and Caveats',
      description: 'Review Kantan Chumon for Japanese restaurants, including mobile ordering, multilingual menus, subsidy considerations, and implementation checks.',
      lead: 'Kantan Chumon is a tablet-based restaurant POS centered on customer smartphone ordering. It may reduce order-taking workload, but pricing, contract terms, integrations, and subsidy eligibility require direct confirmation before a decision.',
      cta: 'Check Kantan Chumon implementation details',
      sections: [
        ['Verdict: best considered for order-taking efficiency', ['The clearest use case is reducing the number of trips staff make solely to take orders. This can free employees for food delivery, checkout, and customer support during busy periods.', 'The product should not be selected from a feature list alone. Request a complete quotation covering setup, monthly charges, devices, integrations, support, data export, and cancellation.']],
        ['Features supported by the public page', ['The provider page describes customer smartphone ordering, a tablet-based POS workflow, and English and Chinese settings. These capabilities target staffing pressure and inbound customer service.', 'Partner materials also describe sales analysis and recommendation-oriented functions. Confirm the exact screens, plan availability, and configuration in a live demonstration before relying on them.']],
        ['Advantages', ['Self-ordering can reduce waiting time and order-entry mistakes when the menu and table workflow are configured correctly. Multilingual display can also reduce reliance on separate printed menus.', 'When order and sales data are connected, managers can review performance by time, day, and item rather than treating the system as a basic cash register.'], ['Customer smartphone ordering', 'English and Chinese settings are advertised', 'Potentially stronger order and sales visibility']],
        ['Caveats', ['Public pricing is not sufficient for a total-cost calculation. Subsidy-supported procurement may also require application and approval before contracting or payment.', 'Restaurants still need a fallback for customers who cannot or do not want to use a smartphone, as well as procedures for network or device failures.'], ['Quotation required', 'Subsidy approval is not guaranteed', 'Offline and assisted-order fallbacks are necessary']],
        ['Best-fit restaurants', ['The product is most relevant to restaurants with repeated ordering, busy service peaks, limited floor staff, or a meaningful inbound customer mix.', 'It may be less important for fixed-course formats, premium service models where staff recommendations are central, or sites with unreliable connectivity.']],
        ['Questions to ask before implementation', ['Ask about device count, kitchen printing, table management, payment integration, menu setup, training, support hours, exports, and cancellation. For subsidy use, verify the registered tool and current application year.', 'Define baseline metrics such as order wait time, staff movement, order errors, average order value, and table turnover before launch.']]
      ],
      faqs: [
        ['Is there a free plan?', 'The public page does not establish a free plan or full total cost. Request a quotation that includes setup, hardware, subscription, and support.'],
        ['Does it support multiple languages?', 'The official page advertises English and Chinese settings. Confirm the exact screens and translation workflow in a demonstration.'],
        ['Does a subsidy guarantee a lower price?', 'No. Subsidies have eligibility, deadlines, review, and grant-decision requirements. Evaluate the investment at normal pricing as well.']]
    }
  },
  {
    slug: 'restaurant-pos-selection-guide', type: 'guide', topic: 'restaurant-pos-orders', affiliate: 'kantan-chumon-analysis',
    ja: {
      title: '飲食店向けPOSレジの選び方｜比較すべき12項目と失敗例',
      description: '飲食店向けPOSレジを、注文方式、会計、キッチン連携、売上分析、サポート、総費用から選ぶ実務チェックリストです。',
      lead: '飲食店向けPOSレジは、月額の安さよりも、注文から会計、締め作業、分析までの一連の流れが店舗に合うかで選ぶべきです。機能数だけで比較すると、現場で使われない高価なシステムになります。',
      cta: '飲食店向けPOSの相談条件を確認する',
      sections: [
        ['最初に決めるのはレジではなく業務課題', ['注文待ち、会計行列、入力ミス、締め作業、原価把握、複数店舗管理のうち、何を改善するかを一つずつ数値化します。課題が曖昧なままデモを見ると、目立つ機能に判断が引っ張られます。', '現場スタッフ、店長、経理、経営者で必要機能が異なるため、利用者別に「毎日使う」「月に一度使う」「不要」を分けます。']],
        ['比較すべき12項目', ['注文方式、テーブル管理、個別会計、キッチン出力、決済連携、商品登録、権限、売上分析、会計連携、複数店舗、障害対応、データ出力を同じ表で比較します。', '料金は初期費用と月額だけでなく、端末、プリンター、工事、設定、研修、決済手数料、保守、解約費用まで含めた3年間総額で確認します。'], ['注文から会計までの操作数', 'ピーク時の処理速度', '必要な周辺機器', 'データの持ち出し可否']],
        ['モバイルオーダーの必要性', ['注文回数が多い業態、人手不足、広い客席では効果が出やすい一方、コース中心や接客提案が重要な店舗では必須ではありません。セルフ注文率を100%前提にせず、スタッフ注文と併用できるか確認します。', '注文画面の見やすさ、売り切れ反映、アレルギー表示、追加注文、会計分割、年齢確認など、実際の例外処理をデモで試します。']],
        ['売上分析は項目より行動につながるか', ['時間帯別、曜日別、商品別、客単価、組み合わせ分析があっても、誰がいつ確認し、何を変更するか決まっていなければ価値は出ません。毎週見る指標を3つに絞ります。', 'かんたん注文の広告主資料では細かな分析機能が案内されています。導入前に、CSV出力、期間指定、店舗比較、権限、会計ソフト連携を確認してください。']],
        ['よくある失敗', ['最安プランで契約して必要機能を追加し、結果的に高くなる失敗があります。逆に多機能プランを選び、現場が従来の紙運用へ戻る例もあります。', '補助金を理由に導入を急ぎ、交付決定前の発注や対象外経費で計画が崩れることもあります。制度に合わせて不要な機能を買うのは本末転倒です。']],
        ['最終選定の進め方', ['候補を3社に絞り、同じ店舗条件と質問票でデモと見積を依頼します。店長だけでなく、実際に注文と会計を行うスタッフに操作してもらいます。', '導入前後のKPI、教育日程、旧レジとの並行期間、障害時の連絡先、データ移行、解約時の出力方法まで決めてから契約します。']]
      ],
      faqs: [['無料POSから始めてもよいですか？', '小規模店舗では有効ですが、注文管理、周辺機器、サポート、データ出力まで必要になると有料機能が増えます。3年間総額で比較してください。'], ['何社比較すべきですか？', '条件を揃えて3社程度を比較すると、確認負担と選択肢のバランスが取りやすくなります。']]
    },
    en: {
      title: 'How to Choose a Restaurant POS: 12 Comparison Criteria and Common Mistakes',
      description: 'A practical restaurant POS checklist covering ordering, checkout, kitchen workflows, analytics, support, and total cost.',
      lead: 'A restaurant POS should be selected around the complete workflow from ordering to checkout, closing, and analysis. Comparing feature counts or headline monthly prices alone often creates an expensive system that staff avoid.',
      cta: 'Review restaurant POS consultation options',
      sections: [
        ['Define the operating problem first', ['Quantify order delays, checkout queues, entry mistakes, closing time, cost visibility, and multi-store reporting before reviewing products.', 'Separate requirements for floor staff, managers, accounting, and owners into daily, occasional, and unnecessary functions.']],
        ['Twelve criteria to compare', ['Compare ordering, tables, split bills, kitchen output, payments, menu setup, permissions, analytics, accounting, multi-store support, incident response, and exports.', 'Model a three-year total including devices, printers, installation, setup, training, payment fees, support, and cancellation.'], ['Steps from order to payment', 'Peak-period handling', 'Required peripherals', 'Data portability']],
        ['When mobile ordering matters', ['It is more valuable for repeated-order formats, staffing shortages, and large dining rooms. It is less essential for fixed-course or recommendation-led service.', 'Test sold-out items, allergens, additional orders, split payment, and age-restricted items instead of only the happy path.']],
        ['Analytics must lead to action', ['Time, day, item, and basket analysis only matters when someone reviews it and changes pricing, staffing, or the menu.', 'Partner material for Kantan Chumon describes detailed analysis. Confirm exports, date filters, store comparisons, permissions, and accounting integration.']],
        ['Common selection failures', ['A low entry price can become expensive after necessary options are added. A feature-heavy plan can also fail when staff return to paper.', 'Subsidy deadlines can push restaurants into premature purchases or ineligible spending. Do not buy unnecessary functions merely because funding may be available.']],
        ['Final selection process', ['Shortlist three products and use the same store scenario, question list, and quotation format. Include the staff who will enter orders and complete checkout.', 'Agree on KPIs, training, parallel operation, incident contacts, migration, and export procedures before signing.']]
      ],
      faqs: [['Can a restaurant start with a free POS?', 'Yes, especially at small scale, but ordering, peripherals, support, and exports may require paid options. Compare the three-year total.'], ['How many vendors should be compared?', 'Three qualified vendors usually provide enough contrast without making the evaluation unmanageable.']]
    }
  },
  {
    slug: 'mobile-order-system-guide', type: 'guide', topic: 'restaurant-pos-orders', affiliate: 'kantan-chumon-mobile-order',
    ja: {
      title: '飲食店のモバイルオーダー導入ガイド｜人手不足を減らす設計と注意点',
      description: '店内モバイルオーダーを導入する手順を、注文導線、メニュー設計、スタッフ運用、障害対応、KPIから解説します。',
      lead: 'モバイルオーダーは、システムを設置するだけでは人手不足を解決しません。来店客が迷わず注文でき、厨房とホールが例外処理できる運用まで設計して初めて効果が出ます。',
      cta: 'モバイルオーダー対応POSを確認する',
      sections: [
        ['導入目的を一つに絞る', ['注文待ち時間の削減、ホール人員の圧縮、客単価向上、多言語対応のうち、最優先を決めます。すべてを同時に狙うと、設定と効果測定が複雑になります。', '導入前にピーク時の注文待ち、スタッフの移動回数、注文ミス、追加注文率を測り、基準値を残します。']],
        ['注文画面の設計', ['カテゴリを増やしすぎず、写真、価格、量、辛さ、アレルギー、売り切れを見やすくします。最初の画面で人気商品と定番商品を選べる構成が基本です。', '追加注文を促す場合も、過度な通知や紛らわしい初期選択は避けます。おすすめは関連性と価格を明確にし、利用者が簡単に閉じられるようにします。']],
        ['店舗オペレーションとの接続', ['注文後にどのプリンターや画面へ届くか、品切れ、注文取消、テーブル移動、個別会計を誰が処理するか決めます。厨房の処理能力を超えて注文だけ早くなると、提供遅延が悪化します。', 'かんたん注文はお客様のスマートフォンから注文できる点を前面に出しています。スタッフ注文も残し、端末を使えない来店客へ同じサービス品質を提供します。']],
        ['通信・障害時の設計', ['店内Wi-Fi、携帯回線、QRコード、バッテリー、プリンターのどこかが止まった場合の手順を用意します。紙伝票、口頭注文、予備端末を準備し、責任者を決めます。', '障害連絡先、受付時間、復旧目安、データ同期、二重注文防止を契約前に確認します。']],
        ['スタッフ教育', ['操作説明だけでなく、来店客への案内文、注文できない場合の対応、取消、返金、売り切れ変更、閉店処理まで練習します。', '導入初週はセルフ注文率より、注文ミスと問い合わせ内容を記録します。問題の多い画面やメニューを修正してから利用率を上げます。']],
        ['効果測定', ['注文待ち時間、ホール歩数、追加注文率、客単価、提供時間、問い合わせ件数を毎週確認します。売上だけ増えて提供遅延や低評価が増えれば成功ではありません。', '30日後に設定、メニュー順、通知、スタッフ配置を見直し、不要な機能やオプションも整理します。']]
      ],
      faqs: [['QRコード注文だけでPOSは不要ですか？', '注文受付だけなら可能ですが、会計、売上、商品、厨房、決済を統合する場合はPOSとの連携が重要です。'], ['高齢者が多い店でも導入できますか？', 'スタッフ注文や紙メニューを残し、利用を強制しない設計なら導入可能です。']]
    },
    en: {
      title: 'Restaurant Mobile Ordering Guide: Workflow Design for Staffing Efficiency',
      description: 'Plan in-store mobile ordering across menu design, staff operations, failure handling, training, and measurable outcomes.',
      lead: 'Mobile ordering does not solve staffing pressure merely by being installed. It needs a clear customer journey, a kitchen workflow, staff exception handling, and measurable operating targets.',
      cta: 'Check a mobile-order-enabled restaurant POS',
      sections: [
        ['Choose one primary objective', ['Prioritize order wait time, floor staffing, average order value, or multilingual service. Trying to optimize everything at once complicates configuration and measurement.', 'Record peak wait time, staff movement, order errors, and additional-order rate before implementation.']],
        ['Design the ordering screen', ['Keep categories manageable and show price, quantity, allergens, availability, and useful images. Popular and standard items should be easy to find.', 'Recommendations should be relevant and dismissible. Avoid excessive notifications or confusing preselected options.']],
        ['Connect ordering to restaurant operations', ['Define kitchen routing, sold-out handling, cancellations, table moves, and split bills. Faster order entry can worsen delays when kitchen capacity is unchanged.', 'Kantan Chumon emphasizes customer smartphone ordering. Retain assisted ordering for customers who cannot use the mobile flow.']],
        ['Prepare for outages', ['Plan for Wi-Fi, mobile network, QR, battery, and printer failures. Keep a paper or verbal fallback and assign responsibility.', 'Confirm incident contacts, support hours, synchronization, recovery, and duplicate-order prevention.']],
        ['Train staff on exceptions', ['Practice customer guidance, cancellations, refunds, sold-out changes, and closing procedures rather than only basic operation.', 'During the first week, record errors and questions before pushing for maximum self-order adoption.']],
        ['Measure outcomes', ['Track wait time, staff movement, additional orders, average order value, service time, and support questions weekly.', 'Review menu order, prompts, staffing, and unused options after the first month.']]
      ],
      faqs: [['Can QR ordering replace a POS?', 'It can collect orders, but POS integration becomes important for checkout, sales, kitchen, menu, and payment workflows.'], ['Can it work with older customers?', 'Yes, when assisted ordering and printed menus remain available and smartphone use is not mandatory.']]
    }
  },
  {
    slug: 'small-restaurant-dx-guide', type: 'guide', topic: 'restaurant-dx-operations', affiliate: 'kantan-chumon-sales',
    ja: {
      title: '小規模飲食店のDX入門｜少人数営業で優先すべき5つの仕組み',
      description: '小規模飲食店がPOS、モバイルオーダー、予約、決済、会計をどの順番で導入すべきか、費用対効果から整理します。',
      lead: '小規模飲食店のDXは、ツールを増やすことではありません。少人数で繰り返している作業を減らし、売上と現金の流れを確認できる仕組みに絞るべきです。',
      cta: '少人数運営向けPOSの導入相談を確認する',
      sections: [
        ['最優先は売上と会計の一元化', ['最初にPOSと決済を整え、日次売上、支払方法、取消、値引きを同じ基準で記録します。数字が一致しない状態で予約や顧客管理を増やしても、経営判断は改善しません。', '閉店後の集計時間と差額を測り、導入後にどれだけ減ったか確認します。']],
        ['注文受付を省力化する', ['客席数と注文回数が多い店舗では、モバイルオーダーがホール負担を減らす候補です。かんたん注文は来店客のスマートフォン注文を案内しており、少人数営業との相性を検討できます。', 'ただし厨房がボトルネックなら、注文受付だけ高速化しても効果は限定的です。提供時間と仕込み工程も同時に見直します。']],
        ['予約と顧客情報をつなぐ', ['予約台帳は電話、Web、SNSの予約を重複なく管理できるものを選びます。顧客情報は再来店施策に必要な最小限へ絞り、目的なく個人情報を集めません。', 'POSと予約が連携しない場合も、共通の店舗名、メニュー名、顧客区分を決め、CSVで突合できるようにします。']],
        ['会計・勤怠への連携', ['売上を会計ソフトへ連携し、手入力を減らします。勤怠やシフトも売上の時間帯と比較できれば、人件費配置の改善につながります。', '連携機能は存在だけでなく、どの項目がどの頻度で同期され、エラー時に誰が直すか確認します。']],
        ['導入順序と予算', ['POS・決済、注文、予約、会計、顧客管理の順で、最も負担が大きい工程から一つずつ導入します。複数ツールを同日に切り替えると、原因切り分けが難しくなります。', '補助金は選択肢ですが、採択されなくても継続できる月額と運用人数で計画します。']],
        ['30日改善サイクル', ['毎週、締め時間、注文待ち、客単価、提供時間、予約ミスを確認します。数値が改善しない場合は、スタッフ教育、画面、メニュー、配置を修正します。', '使われない機能は停止し、現場が続けられる最低限の運用へ戻す判断も必要です。']]
      ],
      faqs: [['最初に何を導入すべきですか？', '売上と会計が正しく記録できていない場合はPOSと決済を優先します。注文待ちが最大課題ならモバイルオーダーを次に検討します。'], ['ツールは一社にまとめるべきですか？', '連携とサポートは簡単になりますが、不要機能や乗り換え制約も増えます。データ出力と解約条件を確認してください。']]
    },
    en: {
      title: 'Small Restaurant DX Guide: Five Systems to Prioritize with a Lean Team',
      description: 'Prioritize POS, mobile ordering, reservations, payments, and accounting for a small restaurant based on operating impact.',
      lead: 'Digital transformation for a small restaurant is not about adding more software. It should remove repetitive work and create reliable visibility into sales and cash movement.',
      cta: 'Review POS options for lean restaurant operations',
      sections: [
        ['Start with sales and checkout data', ['Establish consistent POS and payment records for daily sales, payment methods, voids, and discounts before adding more systems.', 'Measure closing time and reconciliation differences before and after implementation.']],
        ['Reduce order-taking workload', ['Mobile ordering can help where table count and repeat ordering create floor pressure. Kantan Chumon is positioned around customer smartphone ordering.', 'If the kitchen is the bottleneck, faster order entry alone will not improve service. Review preparation and delivery time as well.']],
        ['Connect reservations and customer data', ['Consolidate phone, web, and social reservations without duplicates. Collect only the customer data needed for a defined purpose.', 'Even without direct integration, use consistent store, menu, and customer labels so exports can be reconciled.']],
        ['Link accounting and staffing', ['Send sales data to accounting where practical and compare staffing with hourly sales patterns.', 'Verify exactly which fields synchronize, how often, and who resolves errors.']],
        ['Sequence and budget the rollout', ['Implement POS and payments, ordering, reservations, accounting, and customer management one step at a time based on the largest burden.', 'Use subsidies as an option, not as the foundation of affordability. The normal monthly operating cost must remain sustainable.']],
        ['Run a 30-day improvement cycle', ['Review closing time, order wait, average order value, service time, and reservation errors every week.', 'Disable unused features and simplify the workflow when the team cannot sustain it.']]
      ],
      faqs: [['What should a small restaurant implement first?', 'Prioritize POS and payments when sales records are unreliable. If order waiting is the main problem, review mobile ordering next.'], ['Should every tool come from one vendor?', 'A suite can simplify integration and support, but may increase lock-in and unnecessary functions. Confirm exports and cancellation terms.']]
    }
  },
  {
    slug: 'restaurant-inbound-order-guide', type: 'guide', topic: 'restaurant-dx-operations', affiliate: 'kantan-chumon-inbound',
    ja: {
      title: '飲食店のインバウンド対応｜多言語モバイルオーダー導入チェックリスト',
      description: '英語・中国語の注文画面、アレルギー、決済、スタッフ対応を含む、飲食店の多言語モバイルオーダー導入手順です。',
      lead: 'インバウンド対応は、メニューを翻訳するだけでは不十分です。料理内容、量、辛さ、アレルギー、支払方法、注文後の案内まで一貫して理解できる導線が必要です。',
      cta: '多言語対応の注文システムを確認する',
      sections: [
        ['対応言語と対象画面を確認', ['公式ページでは、かんたん注文の英語・中国語設定が案内されています。メニューだけでなく、注文確認、エラー、売り切れ、会計案内まで翻訳されるか確認します。', '自動翻訳だけに依存せず、商品名、食材、調理法、固有名詞は店舗側で確認します。']],
        ['メニュー情報を標準化', ['料理名、価格、税込表示、量、主な食材、辛さ、写真、提供時間を共通項目で登録します。日本独自の料理は直訳ではなく短い説明を添えます。', '写真と実物の差、セット内容、追加料金を明確にし、注文後の誤解を減らします。']],
        ['アレルギーと食事制限', ['アレルギー対応を保証できない場合は、同一厨房や調理器具での混入可能性を明示します。ハラール、ベジタリアン、ヴィーガンも、店舗が確認できる範囲だけ表示します。', 'スタッフへ確認するボタンや注意書きを設け、システム表示だけで安全を保証しない運用にします。']],
        ['決済と会計案内', ['利用できるカード、コード決済、現金、サービス料、席料、税、分割会計の可否を注文前に示します。会計場所と呼び出し方法も多言語化します。', 'モバイルオーダーと決済が別の場合、注文完了を支払完了と誤解させない表示が必要です。']],
        ['スタッフの例外対応', ['端末が使えない、言語がない、注文を変更したい、領収書が必要などの場面を想定し、指差しシートや定型文を用意します。', '翻訳画面があっても、料理提供や会計で質問は発生します。責任者へ引き継ぐ基準を決めます。']],
        ['効果測定と改善', ['外国語画面の利用率、注文途中の離脱、スタッフ呼び出し、取消、低評価の内容を確認します。単に外国語注文数が増えたかだけでは判断しません。', '観光シーズンや地域の客層に応じて言語、写真、説明を更新し、古い価格やメニューを残さないようにします。']]
      ],
      faqs: [['英語と中国語だけで十分ですか？', '地域と来店客によります。まず実際の来店客データを確認し、利用が多い言語から追加してください。'], ['自動翻訳でアレルギー表示を作れますか？', '誤訳リスクがあるため、食材と注意事項は店舗側で確認し、保証範囲を明示してください。']]
    },
    en: {
      title: 'Inbound Restaurant Ordering: Multilingual Mobile Order Checklist',
      description: 'Plan multilingual restaurant ordering across English and Chinese screens, allergens, payments, and staff exception handling.',
      lead: 'Inbound service requires more than translating a menu. Guests need a consistent path through food descriptions, quantities, allergens, payment, and post-order instructions.',
      cta: 'Check a multilingual restaurant ordering system',
      sections: [
        ['Confirm languages and screen coverage', ['The Kantan Chumon page advertises English and Chinese settings. Confirm whether confirmation, errors, sold-out notices, and checkout guidance are also translated.', 'Review dish names, ingredients, cooking methods, and proper nouns rather than relying entirely on automatic translation.']],
        ['Standardize menu information', ['Use consistent fields for name, tax-inclusive price, portion, ingredients, spice, images, and service time.', 'Explain Japan-specific dishes briefly and make sets and surcharges explicit.']],
        ['Handle allergens and dietary needs', ['When cross-contact cannot be excluded, state that clearly. Only display halal, vegetarian, or vegan claims that the restaurant can verify.', 'Provide a way to ask staff and avoid treating the system as a safety guarantee.']],
        ['Explain payments and checkout', ['Show accepted cards, mobile payments, cash, service charges, seating charges, taxes, and split-bill rules before completion.', 'When ordering and payment are separate, clearly distinguish order completion from payment completion.']],
        ['Prepare staff exceptions', ['Plan for unsupported languages, changes, receipts, and customers who cannot use the device. Use simple reference sheets and escalation rules.', 'Translated ordering does not eliminate questions during food delivery and checkout.']],
        ['Measure and improve', ['Review language usage, abandonment, staff calls, cancellations, and review comments rather than only counting foreign-language orders.', 'Update languages, images, descriptions, and prices as visitor patterns change.']]
      ],
      faqs: [['Are English and Chinese enough?', 'It depends on actual visitor demand. Use customer data to prioritize additional languages.'], ['Can automatic translation create allergen information?', 'Translation errors can be serious. Verify ingredients and warnings internally and state the limits of any guarantee.']]
    }
  },
  {
    slug: 'restaurant-sales-analysis-guide', type: 'guide', topic: 'restaurant-dx-operations', affiliate: 'kantan-chumon-recommendation',
    ja: {
      title: 'POSレジの売上分析入門｜飲食店が毎週見るべき7指標',
      description: '飲食店がPOSデータから時間帯、曜日、商品、客単価、追加注文、回転率を改善するための分析手順を解説します。',
      lead: 'POSレジの分析機能は、画面を見るだけでは利益を生みません。毎週同じ指標を確認し、メニュー、配置、価格、販促の変更へつなげる運用が必要です。',
      cta: '売上分析に対応するPOSを確認する',
      sections: [
        ['最初に見る7指標', ['売上、客数、客単価、商品別数量、時間帯別売上、追加注文率、テーブル回転を基本にします。原価情報がある場合は粗利も加えます。', '指標を増やしすぎると確認が続きません。店長が毎週30分で見られる範囲に絞ります。']],
        ['時間帯と曜日を比較', ['売上だけでなく、客数、客単価、スタッフ数、提供時間を並べます。売上が高くても人員過多や提供遅延があれば改善余地があります。', '天候、イベント、予約、キャンペーンの影響をメモし、単純な前週比較だけで判断しません。']],
        ['商品別に見る', ['販売数、売上、粗利、調理負荷を組み合わせます。人気でも利益が薄い商品、利益が高いのに見つけにくい商品を分けます。', 'メニュー上の位置、写真、説明、セット提案を変更し、2週間単位で結果を確認します。']],
        ['追加注文とレコメンド', ['広告主資料では、かんたん注文に追加注文を促す通知や、よく一緒に注文されるメニューの提案機能が案内されています。機能があるだけで客単価が上がるわけではなく、提案内容、頻度、タイミングが重要です。', '飲み物の追加、主菜と副菜、デザートなど自然な組み合わせに限定し、過度な通知で顧客体験を悪化させないようにします。']],
        ['店舗改善へつなげる', ['一度に変更するのは一つか二つにします。メニュー順とスタッフ配置を同時に大きく変えると、何が効いたか分かりません。', '変更前の期間、対象商品、期待値、結果を簡単な記録表へ残します。']],
        ['データ品質の確認', ['取消、値引き、まかない、テスト注文、返品が正しく区分されているか確認します。入力ルールが店舗ごとに違うと比較できません。', 'CSV出力、期間指定、店舗横断、権限、会計連携の仕様を導入前に確認し、データを自社でも保管します。']]
      ],
      faqs: [['客単価だけ見ればよいですか？', '客単価が上がっても客数や回転率が下がる場合があります。客数、提供時間、粗利と合わせて見てください。'], ['おすすめ通知は多いほど効果がありますか？', 'いいえ。関連性の低い通知は離脱や不満につながります。頻度と内容をテストしてください。']]
    },
    en: {
      title: 'Restaurant POS Sales Analysis: Seven Metrics to Review Every Week',
      description: 'Use restaurant POS data to improve hourly sales, item mix, average order value, additional orders, and table turnover.',
      lead: 'POS analytics do not create profit by themselves. Restaurants need a repeatable weekly review that leads to specific changes in menus, staffing, pricing, and promotions.',
      cta: 'Check a restaurant POS with sales analytics',
      sections: [
        ['Seven starting metrics', ['Track sales, guests, average order value, item quantity, sales by time, additional-order rate, and table turnover. Add gross profit when cost data is reliable.', 'Keep the review small enough for a manager to complete in about thirty minutes each week.']],
        ['Compare time and day', ['Place guests, average order value, staffing, and service time beside sales. High sales can still hide overstaffing or delays.', 'Record weather, events, reservations, and promotions so week-over-week comparisons have context.']],
        ['Review product performance', ['Combine quantity, revenue, margin, and kitchen workload. Separate popular low-margin items from profitable items that are hard to discover.', 'Change menu position, imagery, description, or bundles and review results over a defined period.']],
        ['Additional orders and recommendations', ['Partner materials describe prompts and recommendations based on commonly combined orders. Results depend on relevance, frequency, and timing rather than feature availability alone.', 'Use natural combinations such as drinks, sides, and desserts, and avoid excessive prompts.']],
        ['Turn analysis into experiments', ['Change one or two variables at a time. Large simultaneous changes make attribution impossible.', 'Record the baseline period, target item, expected effect, and result.']],
        ['Protect data quality', ['Classify voids, discounts, staff meals, test orders, and refunds consistently across locations.', 'Confirm exports, date filtering, cross-store reporting, permissions, and accounting integration before purchase.']]
      ],
      faqs: [['Is average order value enough?', 'No. It can rise while guest count or turnover falls. Review it with guests, service time, and margin.'], ['Are more recommendation prompts always better?', 'No. Irrelevant or frequent prompts can reduce trust and completion. Test frequency and relevance.']]
    }
  },
  {
    slug: 'pos-subsidy-2026-guide', type: 'guide', topic: 'digital-subsidies', affiliate: 'kantan-chumon-subsidy',
    ja: {
      title: 'POSレジ導入で使える補助金2026｜申請前に確認すべき条件と手順',
      description: 'デジタル化・AI導入補助金2026を使ってPOSレジを導入する際の対象確認、申請、交付決定、契約時期の注意点を整理します。',
      lead: '2026年は「デジタル化・AI導入補助金2026」が実施されています。ただし、POSレジなら自動的に補助対象になるわけではなく、申請者、ITツール、経費、契約時期、申請枠の要件確認が必要です。',
      cta: '補助金利用を含むかんたん注文の相談を確認する',
      sections: [
        ['2026年制度の位置づけ', ['中小企業庁は、中小企業・小規模事業者等の労働生産性向上を目的に、デジタル化・AI導入補助金2026を案内しています。通常枠では対象ITツールの導入費用の一部を補助します。', '制度名、枠、締切、補助率は年度や条件で変わります。過去年度の記事や広告文だけで判断せず、2026年の公式ページを確認してください。']],
        ['通常枠の補助率', ['2026年通常枠の公式ページでは、補助率は原則2分の1以内、一定要件を満たす場合は3分の2以内と案内されています。補助額はプロセス数などで区分されます。', '広告主ページには購入費用を最大4分の1に抑えられる可能性がある旨の案内がありますが、適用される制度、補助率、対象経費、採択結果を個別に確認する必要があります。']],
        ['申請は支援事業者と共同で進める', ['公式手続きでは、IT導入支援事業者と申請者が商談と事業計画を進め、申請マイページを通じて共同で情報を作成します。申請者自身が最終確認して提出します。', '「補助金が使える」という営業説明だけでなく、登録された支援事業者とITツール、申請枠、見積内容を確認します。']],
        ['交付決定前の契約に注意', ['補助金は申請しただけでは利用確定ではありません。交付決定前の契約、発注、支払いが対象外となる場合があるため、公式公募要領と支援事業者の案内に従います。', '店舗の開業日や旧レジの契約満了が迫っている場合は、補助金を使わない通常導入のスケジュールも比較します。']],
        ['対象経費と自己負担', ['ソフトウェア、クラウド利用料、導入関連費、ハードウェアの扱いは申請枠で異なります。見積書の各項目が対象か、消費税や追加工事を含むか確認します。', '採択されても全額が補助されるわけではありません。自己負担、入金までの資金、対象外費用、運用月額を含む資金計画が必要です。']],
        ['2026年7月時点の確認事項', ['公式スケジュールでは申請回ごとに締切と交付決定予定日が設定されています。締切は更新される可能性があるため、申請直前に公式日程を確認してください。', 'GビズID等の事前手続き、必要書類、事業計画、賃金要件、申請枠を早めに確認し、締切当日の作業を避けます。']]
      ],
      faqs: [['補助金を使えば75%安くなりますか？', '制度と条件によります。2026年通常枠は公式ページで原則1/2以内、一定要件で2/3以内と案内されています。広告表現だけでなく適用枠を確認してください。'], ['申請後すぐ契約できますか？', '交付決定前の契約等が対象外になる場合があります。必ず公式要領と支援事業者の指示を確認してください。'], ['不採択なら費用はどうなりますか？', '補助金は受けられません。通常価格でも導入するか、契約を見送れるかを事前に確認してください。']]
    },
    en: {
      title: '2026 POS Subsidy Guide in Japan: Eligibility, Application, and Timing',
      description: 'Understand Japan’s 2026 Digitalization and AI Implementation Subsidy when evaluating a restaurant POS purchase.',
      lead: 'Japan is operating the Digitalization and AI Implementation Subsidy 2026. A POS purchase is not automatically eligible: the applicant, registered tool, expense category, timing, and application track all matter.',
      cta: 'Review Kantan Chumon consultation and subsidy information',
      sections: [
        ['Purpose of the 2026 program', ['The Small and Medium Enterprise Agency presents the 2026 program as support for productivity-improving digital and AI tools.', 'Program names, tracks, deadlines, and rates change by year. Use the current 2026 official pages rather than older promotional material.']],
        ['Normal-track subsidy rates', ['The official 2026 normal-track page states a rate within one-half, or within two-thirds when specified wage conditions are met.', 'The provider page describes a scenario in which purchase cost may be reduced to one quarter. The applicable program, rate, eligible expenses, and approval must be confirmed individually.']],
        ['Joint application workflow', ['Official procedures require coordination between the applicant and a registered implementation support provider, with final submission by the applicant.', 'Verify the registered provider, registered tool, application track, and exact quotation rather than relying on a general subsidy claim.']],
        ['Do not contract too early', ['An application is not an approval. Contracts, orders, or payments before the grant decision may be ineligible depending on the rules.', 'Compare a normal implementation timeline when opening dates or existing POS contract deadlines cannot wait.']],
        ['Eligible cost and cash planning', ['Treatment of software, cloud use, implementation, and hardware varies by track. Confirm each quotation line and any tax or construction costs.', 'Even after approval, the business must fund its own share, excluded costs, and ongoing subscription. Reimbursement timing also affects cash flow.']],
        ['Current schedule checks', ['The official schedule assigns deadlines and planned grant decisions to each round. Recheck it immediately before application.', 'Complete business identification, documents, plans, wage-condition checks, and account setup early rather than on the deadline.']]
      ],
      faqs: [['Does the subsidy always reduce the price by 75 percent?', 'No. The official 2026 normal track states one-half, or two-thirds under specified conditions. Confirm the actual track and eligibility.'], ['Can a restaurant sign immediately after applying?', 'Contracts or payments before the grant decision may be ineligible. Follow the current official rules and provider instructions.'], ['What happens if the application is rejected?', 'No subsidy is paid. Confirm whether the restaurant will proceed at normal cost or can cancel without charge.']]
    }
  },
  {
    slug: 'restaurant-pos-vs-mobile-order', type: 'comparison', topic: 'restaurant-pos-orders', affiliate: 'kantan-chumon-short',
    ja: {
      title: 'POSレジとモバイルオーダーの違い｜飲食店はどちらから導入すべき？',
      description: 'POSレジとモバイルオーダーの役割、連携、費用、向いている店舗を比較し、導入順序を判断できるように解説します。',
      lead: 'POSレジは売上と会計を管理する基盤、モバイルオーダーは注文受付を効率化する仕組みです。競合する製品ではなく、店舗課題に応じて連携させる関係です。',
      cta: 'POSとモバイルオーダーをまとめて相談する',
      sections: [
        ['役割の違い', ['POSレジは商品、売上、支払方法、取消、締め処理など会計情報を記録します。モバイルオーダーは来店客がスマートフォン等から注文を入力し、厨房やPOSへ届けます。', '注文だけを効率化しても会計集計が手作業なら負担は残ります。逆にPOSだけでは注文待ちを減らせません。']],
        ['POSを先に導入すべき店舗', ['売上集計が合わない、現金差額が多い、商品別売上が分からない、会計が遅い店舗はPOSを優先します。', 'まず正しい売上データを作り、その後に注文データを接続する方が効果を測りやすくなります。']],
        ['モバイルオーダーを優先しやすい店舗', ['既にPOSがあり、注文待ち、人手不足、広い客席、追加注文の取りこぼしが課題ならモバイルオーダーを優先できます。', '既存POSとの連携可否、二重入力、商品マスタ、売り切れ同期を確認します。']],
        ['一体型を選ぶメリット', ['かんたん注文はモバイルオーダーを利用できるタブレット型POSレジとして案内されています。一体型なら注文から会計、分析までのデータをつなげやすい利点があります。', '一方で、特定ベンダーへの依存、周辺機器、決済、データ移行、解約時の出力を確認する必要があります。']],
        ['費用比較', ['POS単体、注文単体、一体型で、初期費用、月額、端末、プリンター、決済、設定、保守を比較します。一体型が必ず安いとは限りません。', '既存機器を流用できるか、店舗追加時の料金、最低契約期間も3年間総額へ含めます。']],
        ['判断フロー', ['会計データが不正確ならPOS、注文待ちが最大課題ならモバイルオーダー、両方を新規導入するなら一体型を比較します。', '最終的には実店舗のピーク時間を再現したデモを行い、スタッフと来店客双方の操作を確認してください。']]
      ],
      faqs: [['モバイルオーダーだけ導入できますか？', '可能なサービスもありますが、既存POSとの連携、二重入力、会計処理を確認してください。'], ['一体型の弱点は何ですか？', '乗り換え時のデータ移行や周辺機器の互換性、特定ベンダーへの依存が大きくなる可能性があります。']]
    },
    en: {
      title: 'Restaurant POS vs Mobile Ordering: Which Should Be Implemented First?',
      description: 'Compare the roles, integration, cost, and best use cases of restaurant POS and mobile ordering systems.',
      lead: 'A POS is the system of record for sales and checkout. Mobile ordering reduces order-entry workload. They are complementary layers, not direct substitutes.',
      cta: 'Review an integrated POS and mobile-order option',
      sections: [
        ['Different roles', ['A POS records items, sales, payment methods, voids, and closing. Mobile ordering lets customers enter orders and sends them to the kitchen or POS.', 'Ordering efficiency does not fix manual accounting, while a POS alone does not reduce order waiting.']],
        ['When POS should come first', ['Prioritize POS when sales do not reconcile, cash differences are frequent, item data is unavailable, or checkout is slow.', 'Reliable sales data makes later order-flow improvements easier to measure.']],
        ['When mobile ordering can lead', ['When a POS already exists and the main issues are waiting, limited floor staff, large dining areas, or missed repeat orders, mobile ordering may lead.', 'Confirm existing POS integration, duplicate entry, menu synchronization, and sold-out updates.']],
        ['Benefits of an integrated system', ['Kantan Chumon is presented as a tablet POS with mobile ordering. Integration can connect ordering, checkout, and analysis.', 'The trade-offs include vendor dependence, peripheral compatibility, payment choices, migration, and export at cancellation.']],
        ['Cost comparison', ['Compare setup, subscription, devices, printers, payments, configuration, and support for POS-only, ordering-only, and integrated options.', 'Include existing hardware reuse, additional-store pricing, and minimum contract periods in a three-year model.']],
        ['Decision flow', ['Choose POS first when sales data is unreliable, mobile ordering first when order waiting dominates, and compare integrated systems when both are new.', 'Run a demonstration that reproduces peak conditions and includes both staff and customer actions.']]
      ],
      faqs: [['Can a restaurant implement mobile ordering without replacing its POS?', 'Some services allow it, but integration, duplicate entry, and checkout workflows must be checked.'], ['What is the main risk of an integrated system?', 'Migration, peripheral compatibility, and dependency on one vendor can become more significant.']]
    }
  }
];

const allRelated = articleSpecs.map(spec => ({
  slug: spec.slug,
  ja: {label: spec.ja.title, description: spec.ja.description},
  en: {label: spec.en.title, description: spec.en.description}
}));

for (const spec of articleSpecs) {
  for (const language of ['ja', 'en']) {
    const content = spec[language];
    const isJa = language === 'ja';
    const sources = [
      {label: isJa ? '株式会社Wiz「かんたん注文」公式ページ' : 'Wiz — Kantan Chumon official page', url: OFFICIAL}
    ];
    if (spec.slug === 'pos-subsidy-2026-guide') {
      sources.push(
        {label: isJa ? 'デジタル化・AI導入補助金2026 通常枠' : 'Digitalization and AI Implementation Subsidy 2026 — Normal Track', url: SUBSIDY_NORMAL},
        {label: isJa ? 'デジタル化・AI導入補助金2026 申請フロー' : 'Digitalization and AI Implementation Subsidy 2026 — Application Flow', url: SUBSIDY_FLOW},
        {label: isJa ? 'デジタル化・AI導入補助金2026 事業スケジュール' : 'Digitalization and AI Implementation Subsidy 2026 — Schedule', url: SUBSIDY_SCHEDULE}
      );
    }
    const article = {
      id: `${spec.slug}-${language}`,
      translationKey: spec.slug,
      language,
      type: spec.type,
      status: 'published',
      slug: spec.slug,
      category: CATEGORY,
      topic: spec.topic,
      badge: isJa ? (spec.type === 'review' ? '広告掲載・公式情報検証' : spec.type === 'comparison' ? '広告掲載・比較ガイド' : '広告掲載・実践ガイド') : (spec.type === 'review' ? 'Official-source review' : spec.type === 'comparison' ? 'Comparison guide' : 'Implementation guide'),
      title: content.title,
      metaTitle: content.title,
      description: content.description,
      lead: content.lead,
      publishedAt: DATE,
      updatedAt: DATE,
      verifiedAt: DATE,
      author: isJa ? 'Luqevora編集部' : 'Luqevora Editorial Team',
      featured: spec.slug === 'kantan-chumon-review' || spec.slug === 'restaurant-pos-vs-mobile-order',
      affiliateDisclosure: isJa,
      ctas: [{
        label: content.cta,
        officialUrl: OFFICIAL,
        affiliateKey: isJa ? spec.affiliate : 'kantan-chumon-official'
      }],
      sources,
      sections: content.sections.map((section, index) => ({
        heading: section[0],
        body: section[1],
        ...(section[2] ? {bullets: section[2]} : {}),
        ...(isJa && index === 0 ? {affiliateMaterialKey: spec.affiliate, affiliateNote: '広告リンクです。料金・対象機能・補助金条件は申込前に公式画面で確認してください。'} : {})
      })),
      faqs: content.faqs.map(([question, answer]) => ({question, answer})),
      relatedLinks: allRelated.filter(item => item.slug !== spec.slug).slice(0, 7).map(item => ({
        label: item[language].label,
        url: `/${language}/${CATEGORY}/${item.slug}/`,
        description: item[language].description
      }))
    };
    const out = path.join(root, `content/articles/${language}/${spec.slug}.json`);
    await writeFile(out, `${JSON.stringify(article, null, 2)}\n`);
  }
}

const profilesPath = path.join(root, 'content/article-batches/product-profiles-expansion.json');
const profiles = await readJson(profilesPath);
profiles['kantan-chumon'] = {
  name: 'かんたん注文',
  affiliateKey: 'kantan-chumon-short',
  sources: [
    {label: '株式会社Wiz — かんたん注文', url: OFFICIAL},
    {label: 'デジタル化・AI導入補助金2026 — 通常枠', url: SUBSIDY_NORMAL}
  ],
  positioning: {
    ja: 'お客様のスマートフォン注文とタブレット型POSを組み合わせる飲食店向けオーダー・店舗運営システム',
    en: 'A restaurant ordering and operations system combining customer smartphone ordering with a tablet-based POS'
  },
  pricing: {
    ja: '料金は問い合わせ。通常プランと補助金プランが案内されている',
    en: 'Contact-based pricing, with standard and subsidy consultation options shown on the provider page'
  },
  pricingDetail: {
    ja: '初期費用、月額、端末、周辺機器、設定、保守、契約期間は公開ページだけでは確定できません。補助金利用時は登録ツール、対象経費、申請年度、交付決定前の契約可否を確認します。',
    en: 'Setup, subscription, devices, peripherals, configuration, support, and term require a quotation. Subsidy use requires confirmation of the registered tool, eligible expenses, application year, and contracting timeline.'
  },
  workflow: {
    ja: '来店客がスマートフォンで注文し、店舗側が注文・会計・売上情報を管理する運用。英語・中国語設定が公式ページで案内されている',
    en: 'Customers place orders from smartphones while the restaurant manages ordering, checkout, and sales information; English and Chinese settings are advertised'
  },
  bestFor: {
    ja: '注文回数が多く、人手不足、注文待ち、多言語対応を改善したい飲食店',
    en: 'Restaurants seeking to reduce order waiting, manage limited floor staffing, and support multilingual ordering'
  },
  strengths: {
    ja: ['お客様のスマートフォン注文', 'タブレット型POS', '英語・中国語設定の案内'],
    en: ['Customer smartphone ordering', 'Tablet-based POS', 'Advertised English and Chinese settings']
  },
  limits: {
    ja: ['総額は問い合わせが必要', '補助金は要件と採択が必要', '通信障害時の代替運用が必要'],
    en: ['Total cost requires a quotation', 'Subsidy eligibility and approval apply', 'Fallback procedures are required for outages']
  }
};
await writeFile(profilesPath, `${JSON.stringify(profiles, null, 2)}\n`);

const sitePath = path.join(root, 'content/config/site.json');
const site = await readJson(sitePath);
site.assetVersion = '5.5.0';
site.defaultVerifiedAt = DATE;
await writeFile(sitePath, `${JSON.stringify(site, null, 2)}\n`);

const homePath = path.join(root, 'content/config/home.json');
const home = await readJson(homePath);
if (!home.featuredReviews.includes('kantan-chumon-review')) {
  home.featuredReviews = ['kantan-chumon-review', ...home.featuredReviews.filter(slug => slug !== 'chatgpt-review')].slice(0, 6);
}
if (!home.featuredComparisons.includes('restaurant-pos-vs-mobile-order')) {
  home.featuredComparisons = ['restaurant-pos-vs-mobile-order', ...home.featuredComparisons].slice(0, 5);
}
await writeFile(homePath, `${JSON.stringify(home, null, 2)}\n`);

const packagePath = path.join(root, 'package.json');
const pkg = await readJson(packagePath);
pkg.version = '3.4.0';
await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

const packageLockPath = path.join(root, 'package-lock.json');
const lock = await readJson(packageLockPath);
lock.version = '3.4.0';
if (lock.packages?.['']) lock.packages[''].version = '3.4.0';
await writeFile(packageLockPath, `${JSON.stringify(lock, null, 2)}\n`);

const docs = `# Store DX v3.4.0\n\n- Added the bilingual Store DX category.\n- Added 8 Japanese and 8 English article pairs covering restaurant POS, mobile ordering, small-store DX, inbound ordering, sales analysis, subsidies, and POS versus mobile ordering.\n- Added seven A8.net Kantan Chumon materials exactly as supplied, including nofollow anchors and tracking pixels.\n- Added Kantan Chumon to the comparison database.\n- Updated category navigation, topics, homepage featured content, official verification date, and release version.\n\n## Affiliate implementation\n\nJapanese pages display a first-view advertising disclosure and use the supplied A8.net material. English pages link to the official provider page without affiliate tracking. Product pricing and subsidy eligibility remain explicitly subject to current official confirmation.\n`;
await writeFile(path.join(root, 'docs/STORE_DX_V3.4.md'), docs);

let readme = await fs.readFile(path.join(root, 'README.md'), 'utf8');
if (!readme.includes('Store DX v3.4.0')) {
  readme = `## Store DX v3.4.0\n\nRestaurant POS and mobile-order content cluster added. See \`docs/STORE_DX_V3.4.md\`.\n\n${readme}`;
  await fs.writeFile(path.join(root, 'README.md'), readme);
}

console.log(`Added Store DX v3.4.0 with ${articleSpecs.length * 2} bilingual article files.`);
