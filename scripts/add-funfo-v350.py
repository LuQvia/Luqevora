import json, os
from pathlib import Path

ROOT=Path('/mnt/data/luqevora_v35/Luqevora-auto-platform-v3.4.0-Store-DX-github')
DATE='2026-07-20'
OFFICIAL='https://www.funfo.jp/'
PRICING='https://www.funfo.jp/index.php/pricing/'
QA='https://www.funfo.jp/index.php/qa/'
A8_1='https://px.a8.net/svt/ejp?a8mat=4B84X2+EC6V16+5RGM+5YJRM'
A8_2='https://px.a8.net/svt/ejp?a8mat=4B84X2+EC6V16+5RGM+5YRHE'

def load(rel):
    return json.loads((ROOT/rel).read_text(encoding='utf-8'))

def save(rel,data):
    p=ROOT/rel; p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Affiliate materials exactly as supplied by the user.
aff=load('content/config/affiliates.json')
aff['links']['funfo-short']={
    'type':'rawHtml','network':'A8.net','programId':'s00000026887001','language':'ja','destination':OFFICIAL,
    'rawHtml':f'<a href="{A8_1}" rel="nofollow">funfo</a>\n<img border="0" width="1" height="1" src="https://www11.a8.net/0.gif?a8mat=4B84X2+EC6V16+5RGM+5YJRM" alt="">'
}
aff['links']['funfo-bracket']={
    'type':'rawHtml','network':'A8.net','programId':'s00000026887001','language':'ja','destination':OFFICIAL,
    'rawHtml':f'<a href="{A8_2}" rel="nofollow">【funfo】</a>\n<img border="0" width="1" height="1" src="https://www17.a8.net/0.gif?a8mat=4B84X2+EC6V16+5RGM+5YRHE" alt="">'
}
aff['links']['funfo-official']={'type':'official','network':'Official','language':'en','destination':OFFICIAL,'url':OFFICIAL}
save('content/config/affiliates.json',aff)

common_sources=[
    {'label':'funfo 公式サイト','url':OFFICIAL},
    {'label':'funfo 料金プラン','url':PRICING},
    {'label':'funfo よくある質問','url':QA},
]

ja_review={
  'id':'funfo-review-ja','translationKey':'funfo-review','language':'ja','type':'review','status':'published','slug':'funfo-review',
  'category':'store-dx','topic':'restaurant-pos-orders','badge':'広告掲載・公式情報検証',
  'title':'funfoの評判・料金・機能を検証｜無料POSレジとモバイルオーダーの注意点',
  'metaTitle':'funfoの評判・料金・機能｜無料POS・モバイルオーダーを検証【2026年】',
  'description':'飲食店向けPOSレジ・モバイルオーダーアプリfunfoを、無料プラン、有料料金、LINE連携、多言語、導入設備、注意点から公式情報で検証します。',
  'lead':'funfoは、iPad向けPOSレジと店内・店外モバイルオーダーを一つのサービスで扱える飲食店向けアプリです。月額0円のFreeプランは強い入口ですが、本運用では同時ログイン台数、キッチンプリンター、分析、LINE顧客管理、決済手数料まで含めて判断する必要があります。',
  'publishedAt':DATE,'updatedAt':DATE,'verifiedAt':DATE,'author':'Luqevora編集部','featured':True,'affiliateDisclosure':True,
  'ctas':[{'label':'funfoの資料・導入条件を確認する','officialUrl':OFFICIAL,'affiliateKey':'funfo-short'}],
  'sources':common_sources,
  'sections':[
    {'heading':'結論：無料で試してから有料プランを判断したい小規模飲食店に強い','body':[
      'funfoの強みは、POSレジ、店内モバイルオーダー、店外モバイルオーダー、商品管理、LINE連携をFreeプランから試せる点です。iPadと来店客のスマートフォンを使うため、専用注文端末を各テーブルへ置く方式より初期検証を始めやすい設計です。',
      'ただし「月額無料」は店舗運営に必要な費用がすべてゼロという意味ではありません。iPad、プリンター、キャッシュドロア、決済手数料、初期設定支援などは店舗の運用に応じて別途発生します。無料版だけでピーク時間を回せるか、実店舗でテストしてから契約してください。'
    ],'affiliateMaterialKey':'funfo-short','affiliateNote':'広告リンクです。問い合わせ・資料ダウンロード後の導入条件や料金は公式画面で再確認してください。'},
    {'heading':'funfoの料金プラン','body':['公式料金ページでは、無料プランと3つの有料プランが案内されています。表示額は年額一括払いの月額換算を含むため、月払いと年払いの総額を分けて比較します。'],
     'table':{'headers':['プラン','公式掲載の料金','同時ログインの目安','主な位置づけ'],
       'rows':[
        ['Free','0円','最大1台','POS・店内外モバイルオーダーを試す入口'],
        ['Lite','年払い換算 月額4,950円／月払い5,550円','最大3台','小規模店舗向け'],
        ['Business','年払い換算 月額9,900円／月払い11,000円','最大10台','中規模店舗向け'],
        ['Business Plus','年払い換算 月額14,850円／月払い16,500円','最大10台','高度なLINE顧客管理を使う店舗向け']
       ]},
     'callout':'モバイルオーダー決済を利用する場合、公式サイトでは決済手数料3.35〜3.95％が案内されています。端末・周辺機器・サポート費も含めて総額を確認してください。'},
    {'heading':'主な機能','body':[
      'POSレジ、店内モバイルオーダー、店外モバイルオーダー、モバイルオーダー決済、商品管理、LINE連携、売上分析を一つのサービスで扱えます。iPhoneをハンディとして使えるため、混雑時だけスタッフ注文を併用する設計も可能です。',
      '公式サイトでは多言語自動翻訳、動画メニュー、食べ飲み放題、セット・コース、在庫や商品別統計なども案内されています。すべての機能が無料プランに含まれるとは限らないため、必要機能を料金表とデモ画面で照合します。'
    ],'bullets':['iPadをPOSレジとして利用','QRコードによる店内モバイルオーダー','テイクアウト・店外注文','LINE友だち獲得と上位プランの顧客管理','売上・客単価・商品別データの確認','多言語表示とモバイル決済']},
    {'heading':'メリット','body':[
      '無料版でメニュー登録からスマートフォン注文まで試せるため、導入前にスタッフが操作できるか、客席でQRコードが読みやすいか、キッチンへの伝達が詰まらないかを確認できます。見積契約を済ませてから初めて触るサービスより、失敗コストを抑えやすい点は明確な利点です。',
      'POSと注文、LINE連携を一体で扱えるため、会計だけでなく再来店施策までつなげやすい構成です。単に注文係を減らすだけでなく、顧客接点と売上データを残す仕組みとして評価できます。'
    ],'bullets':['無料プランから検証できる','工事不要でiPadから開始できる','モバイルオーダーとPOSを一体化','ハンディとの併用が可能','LINE施策へつなげられる']},
    {'heading':'デメリット・導入前の注意点','body':[
      'funfoはiPad専用アプリのため、AndroidタブレットやWindows端末を前提にしている店舗には合いません。レシート・キッチンプリンター、キャッシュドロア、決済端末との互換性は、既存機器の型番単位で確認する必要があります。',
      'LINE連携の本格運用には2〜3週間、オンライン決済は審査状況により1〜2か月かかる場合があると公式FAQで案内されています。「アプリを入れれば全機能が即日完成」と考えず、無料試用、機器設定、スタッフ研修、顧客案内を分けて進めてください。'
    ],'bullets':['iPadが必須','無料版は同時ログイン台数などに制限','周辺機器と決済費用が別途発生し得る','LINE・決済連携は準備期間が必要','通信障害時の代替注文方法が必要']},
    {'heading':'向いている店舗・向かない店舗','body':[
      '向いているのは、初期費用を抑えてモバイルオーダーを試したいカフェ、居酒屋、定食店、小規模レストランです。注文回数が多く、スタッフが注文受付に取られている店舗ほど効果を検証しやすくなります。',
      '向かない可能性があるのは、iPadを使わない方針の店舗、対面説明そのものが商品価値になる高級店、通信環境が不安定な店舗です。複雑な本部管理や既存基幹システム連携が必須の場合も、要件表を作って個別相談してください。'
    ]},
    {'heading':'導入前チェックリスト','body':['無料版の使いやすさだけで決めず、本番環境を想定して次を確認します。'],
     'bullets':['客席数とピーク時の同時注文数','必要なiPad・iPhone台数','キッチン・レシートプリンターの型番','現金・カード・QR決済の会計手順','商品登録・トッピング・食べ放題設定','LINE友だち追加を必須にするか','障害時の紙注文・手入力手順','無料版から有料版へ上げる条件と年間総額']}
  ],
  'faqs':[
    {'question':'funfoは本当に月額無料ですか？','answer':'Freeプランは月額0円で、POSレジやモバイルオーダー等を試せます。ただしiPad、周辺機器、決済手数料、設定支援などは別途必要になる場合があります。'},
    {'question':'Androidタブレットでも使えますか？','answer':'公式FAQではiPad専用アプリと案内されています。店舗側端末はiPadを前提に準備してください。'},
    {'question':'導入した当日から使えますか？','answer':'基本機能はアプリをダウンロードして試せます。LINEミニアプリ連携やオンライン決済は準備・審査期間がかかる場合があります。'},
    {'question':'無料版と有料版の違いは何ですか？','answer':'同時ログイン台数、キッチンプリンター、分析、管理機能、LINE顧客管理などに差があります。最新の料金表で必要機能を確認してください。'}
  ]
}

ja_compare={
  'id':'funfo-vs-kantan-chumon-ja','translationKey':'funfo-vs-kantan-chumon','language':'ja','type':'comparison','status':'published','slug':'funfo-vs-kantan-chumon',
  'category':'store-dx','topic':'restaurant-pos-orders','badge':'広告掲載・公式情報比較',
  'title':'funfoとかんたん注文を比較｜無料POSか補助金相談型か、飲食店向けに検証',
  'metaTitle':'funfoとかんたん注文を比較｜料金・POS・モバイルオーダーの違い【2026年】',
  'description':'飲食店向けPOS・モバイルオーダーのfunfoとかんたん注文を、料金公開、無料試用、導入方法、LINE、多言語、補助金、向く店舗から比較します。',
  'lead':'funfoは月額0円から自分で試せるアプリ型、かんたん注文は問い合わせと導入相談を前提にしたPOS・モバイルオーダー型です。どちらが上かではなく、無料検証を優先するか、補助金を含む個別提案を優先するかで選びます。',
  'publishedAt':DATE,'updatedAt':DATE,'verifiedAt':DATE,'author':'Luqevora編集部','featured':True,'affiliateDisclosure':True,
  'ctas':[
    {'label':'funfoの資料・導入条件を確認','officialUrl':OFFICIAL,'affiliateKey':'funfo-bracket'},
    {'label':'かんたん注文の導入条件を確認','officialUrl':'https://f.012grp.co.jp/wiz_kantanchumon_hojyokin','affiliateKey':'kantan-chumon-short'}
  ],
  'sources':common_sources+[
    {'label':'株式会社Wiz「かんたん注文」公式ページ','url':'https://f.012grp.co.jp/wiz_kantanchumon_hojyokin'}
  ],
  'sections':[
    {'heading':'結論：低コストで自店検証ならfunfo、個別相談と補助金検討ならかんたん注文','body':[
      'funfoは公式料金が公開され、Freeプランから店舗側で試せます。まず1店舗で注文導線を検証し、必要になった段階でLite、Business、Business Plusへ上げたい店舗に向きます。',
      'かんたん注文は料金が問い合わせ制で、補助金を含めた導入相談を前提に比較するサービスです。自社だけで設定を進めるより、見積・導入条件・補助金対象を相談しながら進めたい店舗の候補になります。'
    ]},
    {'heading':'funfoとかんたん注文の違い','body':['公開情報と導入方式を基準に比較します。かんたん注文の料金・契約内容は個別見積で確定してください。'],
     'table':{'headers':['比較項目','funfo','かんたん注文'], 'rows':[
       ['料金公開','Free 0円、Lite・Business等の料金を公式掲載','問い合わせ制'],
       ['試し方','iPadアプリをダウンロードして無料検証','問い合わせ・デモ・見積で確認'],
       ['POS・注文','POS、店内外モバイルオーダー、ハンディ','タブレット型POSとスマートフォン注文'],
       ['顧客施策','LINE友だち獲得、上位プランで顧客管理・自動配信','追加注文通知やレコメンドを広告主資料で案内'],
       ['多言語','多言語自動翻訳・4か国語対応を公式案内','英語・中国語設定を公式ページで案内'],
       ['補助金','通常導入を基本に、対象制度は個別確認','補助金活用を前面に案内'],
       ['向く店舗','自分で試し、段階的に有料化したい店舗','相談しながら導入条件を固めたい店舗']
     ]}},
    {'heading':'料金・総コストの比較','body':[
      'funfoは月額0円から始められますが、iPad、プリンター、キャッシュドロア、決済手数料、サポートなどを含めた総額で判断します。有料プランは同時ログイン台数やLINE顧客管理などで段階が分かれます。',
      'かんたん注文は公開ページだけで総額が確定しません。初期費用、月額、端末、設定、保守、契約期間、解約、補助金不採択時の通常価格を一つの見積書で確認してください。'
    ],'affiliateMaterialKey':'funfo-bracket','affiliateNote':'funfoの広告リンクです。無料範囲と有料機能、周辺機器費用を公式料金ページで確認してください。'},
    {'heading':'注文・会計オペレーション','body':[
      'funfoはモバイルオーダーとスタッフ用ハンディを併用でき、混雑度や客層に応じて注文方法を切り替えやすい設計です。Freeプランで実際のメニューと客席を登録し、キッチン伝達まで再現できる点が比較上の強みです。',
      'かんたん注文もお客様のスマートフォン注文を中心に、スタッフの注文受付負担を減らす狙いがあります。問い合わせ時はキッチン出力、会計訂正、割り勘、食べ放題、品切れ、テーブル移動など自店固有の操作をデモで試します。'
    ]},
    {'heading':'集客・売上分析・インバウンド','body':[
      'LINE公式アカウントを軸に友だち獲得、アンケート、自動配信、顧客管理まで進めたい店舗はfunfoの上位プランを詳しく確認する価値があります。POS売上と顧客施策を同じサービスでつなげたい場合に分かりやすい構成です。',
      'かんたん注文は売上分析、追加注文通知、AIによるおすすめ提案が広告主資料で案内されています。機能が契約プランに含まれるか、利用実績をどのように測るかをデモと見積で確認してください。'
    ]},
    {'heading':'どちらが向いているか','body':['店舗の予算と導入体制で選びます。'],
     'bullets':['funfo向き：月額0円で試したい、iPadがある、小規模から段階的に導入したい、LINE施策を重視','かんたん注文向き：問い合わせで要件整理したい、補助金利用を相談したい、導入支援を重視','両方比較すべき店舗：居酒屋・焼肉・カフェなど追加注文が多く、モバイルオーダー導入効果を数値で検証したい']},
    {'heading':'商談・問い合わせ前に同じ条件で確認する項目','body':['広告のキャッチコピーではなく、同じ要件表と同じKPIで比較します。'],
     'bullets':['初年度と2年目以降の総額','iPad・プリンター・決済端末の必要台数','ピーク時の同時注文・同時ログイン','商品登録・トッピング・コース設定','会計取消・返品・割り勘・テーブル移動','多言語の対象画面と翻訳修正','LINE・CRM・会計ソフト等の連携','障害時サポートとデータ出力','導入前後で測る注文待ち時間、客単価、回転率、注文ミス']}
  ],
  'faqs':[
    {'question':'価格が安いのはどちらですか？','answer':'公開料金だけならfunfoは0円から試せます。ただし周辺機器や決済費用を含む総額で比較してください。かんたん注文は個別見積が必要です。'},
    {'question':'補助金を使いたい場合はどちらですか？','answer':'かんたん注文は補助金相談を前面に出しています。ただし対象制度、申請要件、交付決定、対象経費は年度ごとに確認が必要です。funfoも制度対象になるかは販売元と支援事業者へ確認してください。'},
    {'question':'最初に試すならどちらですか？','answer':'iPadがあり自店で設定できるならfunfoの無料版で実運用に近いテストができます。個別支援を受けたい場合は両社へ同じ要件で問い合わせてください。'}
  ]
}

# English equivalents use official links only; A8 program is Japanese and the supplied materials are Japanese.
en_review={
  'id':'funfo-review-en','translationKey':'funfo-review','language':'en','type':'review','status':'published','slug':'funfo-review',
  'category':'store-dx','topic':'restaurant-pos-orders','badge':'Official-source review',
  'title':'funfo Review: Free Restaurant POS, Mobile Ordering, Pricing, and Caveats',
  'metaTitle':'funfo Review: Free POS, Mobile Ordering, Pricing, and Limits (2026)',
  'description':'Review funfo restaurant POS and mobile ordering, including the free plan, paid tiers, LINE integration, multilingual support, required hardware, and operational caveats.',
  'lead':'funfo combines an iPad restaurant POS with dine-in and off-premise mobile ordering. The free tier is a strong way to test the workflow, but restaurants should still budget for hardware, payment fees, device limits, support, and advanced customer-management functions.',
  'publishedAt':DATE,'updatedAt':DATE,'verifiedAt':DATE,'author':'Luqevora Editorial Team','featured':True,'affiliateDisclosure':False,
  'sources':[
    {'label':'funfo official website','url':OFFICIAL},{'label':'funfo pricing','url':PRICING},{'label':'funfo FAQ','url':QA}
  ],
  'sections':[
    {'heading':'Verdict: a strong option for restaurants that want to test before paying','body':['funfo offers POS, dine-in mobile ordering, off-premise ordering, product management, and LINE integration in a zero-monthly-fee Free tier. This makes it practical for a small restaurant to test menus, table QR codes, and staff workflows before committing to a paid plan.','Free does not mean every operating cost is zero. An iPad, printers, cash drawer, payment processing, implementation help, and other peripherals may still be required. Test the complete order-to-kitchen-to-payment flow during a busy service period.']},
    {'heading':'Plans and published pricing','body':['The official pricing page lists a Free tier and three paid tiers. Some displayed amounts are monthly equivalents for annual billing, so compare the annual commitment with monthly billing.'],
     'table':{'headers':['Plan','Published price','Concurrent devices','Positioning'], 'rows':[
       ['Free','JPY 0','Up to 1','Test POS and mobile ordering'],['Lite','JPY 4,950 monthly equivalent annually / JPY 5,550 monthly','Up to 3','Small restaurants'],['Business','JPY 9,900 annually / JPY 11,000 monthly','Up to 10','Mid-sized restaurants'],['Business Plus','JPY 14,850 annually / JPY 16,500 monthly','Up to 10','Advanced LINE customer management']
     ]},'callout':'The official site also lists mobile-order payment processing fees of 3.35% to 3.95%. Confirm peripherals, onboarding, and support in the total cost.'},
    {'heading':'Core capabilities','body':['funfo combines an iPad POS, customer QR ordering, off-premise ordering, payment, product management, smartphone handheld operation, LINE integration, and sales analytics.','The provider also describes multilingual translation, video menus, set and course functions, all-you-can-eat workflows, and item-level statistics. Verify which tier includes each function.'],'bullets':['iPad restaurant POS','Dine-in and off-premise mobile ordering','iPhone handheld workflow','LINE acquisition and customer functions','Sales and item analytics','Multilingual menus and mobile payment']},
    {'heading':'Advantages','body':['Restaurants can test real menus and smartphone ordering before buying a paid plan. This reduces the risk of discovering basic usability or kitchen-routing issues only after a contract.','The combination of ordering, POS, and LINE can connect operational efficiency with repeat-customer activity rather than treating the POS as a checkout-only tool.']},
    {'heading':'Caveats','body':['The store-side app requires an iPad. Confirm printer, cash drawer, and payment-terminal compatibility by exact model number.','The official FAQ says LINE mini-app implementation may take two to three weeks and online payment approval may take one to two months. Keep a fallback ordering and payment procedure for outages.'],'bullets':['iPad required','Free-tier device and feature limits','Hardware and processing fees may apply','Some integrations require lead time','Fallback workflow needed']},
    {'heading':'Implementation checklist','body':['Test the system against the restaurant’s real service pattern.'],'bullets':['Peak concurrent orders','Number of iPads and handheld phones','Kitchen and receipt printers','Cash, card, and QR payment flow','Modifiers, courses, and all-you-can-eat rules','LINE opt-in design','Outage and manual-order procedure','Annual cost at the required paid tier']}
  ],
  'faqs':[
    {'question':'Is funfo really free?','answer':'The Free tier has a JPY 0 monthly fee and includes POS and mobile-order functions. Hardware, payment processing, support, and advanced functions may still add cost.'},
    {'question':'Can the store use an Android tablet?','answer':'The official FAQ describes funfo as an iPad app for the store side.'},
    {'question':'Can a restaurant launch all functions immediately?','answer':'Basic app testing can start quickly, but LINE and online-payment integrations may require setup and approval time.'}
  ]
}

en_compare={
  'id':'funfo-vs-kantan-chumon-en','translationKey':'funfo-vs-kantan-chumon','language':'en','type':'comparison','status':'published','slug':'funfo-vs-kantan-chumon',
  'category':'store-dx','topic':'restaurant-pos-orders','badge':'Official-source comparison',
  'title':'funfo vs Kantan Chumon: Free Self-Testing or Consultation-Led Restaurant POS?',
  'metaTitle':'funfo vs Kantan Chumon: Restaurant POS and Mobile Ordering Compared (2026)',
  'description':'Compare funfo and Kantan Chumon by published pricing, free testing, POS and mobile ordering, multilingual service, customer marketing, subsidies, and implementation model.',
  'lead':'funfo is an app-led product with a published free tier, while Kantan Chumon uses a consultation and quotation-led implementation model. The choice depends on whether the restaurant prioritizes self-testing or guided procurement and subsidy discussion.',
  'publishedAt':DATE,'updatedAt':DATE,'verifiedAt':DATE,'author':'Luqevora Editorial Team','featured':True,'affiliateDisclosure':False,
  'sources':[
    {'label':'funfo official website','url':OFFICIAL},{'label':'funfo pricing','url':PRICING},{'label':'funfo FAQ','url':QA},{'label':'Wiz — Kantan Chumon','url':'https://f.012grp.co.jp/wiz_kantanchumon_hojyokin'}
  ],
  'sections':[
    {'heading':'Verdict: funfo for low-cost testing, Kantan Chumon for consultation-led procurement','body':['funfo publishes a zero-fee Free tier and lets a restaurant test the iPad and smartphone-order workflow directly. It fits operators that want to validate one location before moving to a paid tier.','Kantan Chumon requires a quotation and presents subsidy-oriented consultation. It is a candidate when the restaurant wants support defining hardware, implementation, and procurement conditions.']},
    {'heading':'Key differences','body':['Compare the implementation model rather than treating both products as identical POS packages.'],
     'table':{'headers':['Criterion','funfo','Kantan Chumon'],'rows':[
       ['Pricing visibility','Free and paid pricing published','Quotation required'],['Testing','Download and test on iPad','Consultation, demo, and quotation'],['Ordering','POS, dine-in/off-premise ordering, handheld','Tablet POS and customer smartphone ordering'],['Customer marketing','LINE acquisition and advanced customer functions','Recommendation and repeat-order functions described in partner materials'],['Languages','Automatic multilingual functions advertised','English and Chinese settings advertised'],['Subsidy approach','Confirm program eligibility separately','Subsidy consultation is emphasized'],['Best fit','Self-testing and staged rollout','Guided implementation and procurement']
     ]}},
    {'heading':'Cost and rollout','body':['With funfo, add the iPad, printers, payment fees, support, and the paid tier needed for concurrent devices or customer management.','For Kantan Chumon, request a single quotation covering setup, subscription, hardware, support, contract term, cancellation, and the non-subsidized price if an application is unsuccessful.']},
    {'heading':'Operations and customer growth','body':['funfo is differentiated by the visible LINE and customer-management path, especially in the higher tier. It is worth testing when the restaurant wants ordering data to support repeat-customer communication.','Kantan Chumon emphasizes smartphone ordering, sales analysis, and recommendation-related functions. Confirm exact plan availability and reporting screens in a demonstration.']},
    {'heading':'Which should a restaurant choose?','body':['Use the restaurant’s implementation capability and commercial requirements.'],'bullets':['Choose funfo to test at zero monthly fee, use an existing iPad, and roll out in stages','Consider Kantan Chumon for guided requirements definition and subsidy discussion','Compare both for high-order-frequency formats such as izakaya, yakiniku, cafés, and casual dining']},
    {'heading':'Common evaluation checklist','body':['Send both providers the same requirement sheet.'],'bullets':['First-year and renewal total cost','Required devices and printers','Peak concurrent orders and logins','Menu modifiers, courses, and table movement','Multilingual scope','Payment and accounting integrations','Support and outage procedures','Data export and termination terms','KPIs: waiting time, average check, table turns, and order errors']}
  ],
  'faqs':[
    {'question':'Which product is cheaper?','answer':'funfo publishes a zero-fee starting tier, but total cost depends on hardware, processing, support, and required paid functions. Kantan Chumon requires a quotation.'},
    {'question':'Which is easier to test?','answer':'A restaurant with an iPad can test funfo directly. Kantan Chumon is evaluated through inquiry, demonstration, and quotation.'},
    {'question':'Which is better for subsidies?','answer':'Kantan Chumon emphasizes subsidy consultation. Eligibility, approval, eligible expenses, and contracting timing still require current program verification.'}
  ]
}

# Related links shared by all four new pages.
related_ja=[
 {'label':ja_review['title'],'url':'/ja/store-dx/funfo-review/','description':ja_review['description']},
 {'label':ja_compare['title'],'url':'/ja/store-dx/funfo-vs-kantan-chumon/','description':ja_compare['description']},
 {'label':'かんたん注文の評判・機能・注意点｜飲食店向けPOSを公式情報で検証','url':'/ja/store-dx/kantan-chumon-review/','description':'問い合わせ型POS・モバイルオーダーの機能と注意点を確認します。'},
 {'label':'飲食店向けPOSレジの選び方｜比較すべき12項目と失敗例','url':'/ja/store-dx/restaurant-pos-selection-guide/','description':'料金だけでなく注文、会計、分析、サポートを同じ条件で比較します。'},
 {'label':'飲食店のモバイルオーダー導入ガイド｜人手不足を減らす設計と注意点','url':'/ja/store-dx/mobile-order-system-guide/','description':'QR注文の導線、スタッフ運用、障害対応、KPIを整理します。'},
 {'label':'POSレジとモバイルオーダーの違い｜飲食店はどちらから導入すべき？','url':'/ja/store-dx/restaurant-pos-vs-mobile-order/','description':'POSと注文システムの役割と導入順序を確認します。'}
]
related_en=[
 {'label':en_review['title'],'url':'/en/store-dx/funfo-review/','description':en_review['description']},
 {'label':en_compare['title'],'url':'/en/store-dx/funfo-vs-kantan-chumon/','description':en_compare['description']},
 {'label':'Kantan Chumon Review: Mobile Ordering, Restaurant POS Features, and Caveats','url':'/en/store-dx/kantan-chumon-review/','description':'Review the quotation-led restaurant POS and ordering option.'},
 {'label':'How to Choose a Restaurant POS: 12 Criteria and Common Mistakes','url':'/en/store-dx/restaurant-pos-selection-guide/','description':'Compare ordering, checkout, analytics, support, and total cost.'},
 {'label':'Restaurant Mobile Ordering Implementation Guide','url':'/en/store-dx/mobile-order-system-guide/','description':'Plan QR ordering, staff workflows, fallback procedures, and KPIs.'},
 {'label':'Restaurant POS vs Mobile Ordering: Which Comes First?','url':'/en/store-dx/restaurant-pos-vs-mobile-order/','description':'Understand the roles, integration, and implementation sequence.'}
]
for a in [ja_review,ja_compare]:
    a['relatedLinks']=[x for x in related_ja if x['url']!=f"/ja/store-dx/{a['slug']}/"]
for a in [en_review,en_compare]:
    a['relatedLinks']=[x for x in related_en if x['url']!=f"/en/store-dx/{a['slug']}/"]

for lang, articles in [('ja',[ja_review,ja_compare]),('en',[en_review,en_compare])]:
    for article in articles:
        save(f"content/articles/{lang}/{article['slug']}.json",article)

# Add funfo articles to the existing Store DX cluster.
for lang in ['ja','en']:
    folder=ROOT/f'content/articles/{lang}'
    additions=related_ja[:2] if lang=='ja' else related_en[:2]
    for p in folder.glob('*.json'):
        d=json.loads(p.read_text(encoding='utf-8'))
        if d.get('category')!='store-dx' or d.get('slug') in {'funfo-review','funfo-vs-kantan-chumon'}:
            continue
        links=d.setdefault('relatedLinks',[])
        urls={x.get('url') for x in links}
        changed=False
        for item in additions:
            if item['url'] not in urls:
                links.append(item); urls.add(item['url']); changed=True
        # Keep a useful but bounded related-link list.
        if len(links)>10:
            # preserve original first items and ensure additions remain
            kept=[]; seen=set()
            for item in additions+links:
                if item.get('url') not in seen:
                    kept.append(item); seen.add(item.get('url'))
                if len(kept)>=10: break
            d['relatedLinks']=kept
        d['updatedAt']=DATE
        if changed: p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Add diversified placements to three high-intent Japanese guides.
placement_map={
  'restaurant-pos-selection-guide':'funfo-short',
  'mobile-order-system-guide':'funfo-bracket',
  'small-restaurant-dx-guide':'funfo-short'
}
for slug,key in placement_map.items():
    p=ROOT/f'content/articles/ja/{slug}.json'; d=json.loads(p.read_text(encoding='utf-8'))
    d['affiliateDisclosure']=True
    ctas=d.setdefault('ctas',[])
    if not any(c.get('affiliateKey','').startswith('funfo') for c in ctas):
        ctas.append({'label':'funfoを無料プランから確認する','officialUrl':OFFICIAL,'affiliateKey':key})
    # Place one contextual material after a relevant section without duplicating on every section.
    target=0
    for i,s in enumerate(d.get('sections',[])):
        if any(term in s.get('heading','') for term in ['比較','モバイル','導入','結論']): target=i; break
    sec=d['sections'][target]
    if not sec.get('affiliateMaterialKey'):
        sec['affiliateMaterialKey']=key
        sec['affiliateNote']='funfoの広告リンクです。無料版の範囲、有料プラン、周辺機器費用は公式料金ページで確認してください。'
    d['updatedAt']=DATE
    p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Product comparison profile (catalog is regenerated by npm check).
profiles=load('content/article-batches/product-profiles-expansion.json')
profiles['funfo']={
  'name':'funfo','affiliateKey':'funfo-short','sources':common_sources,
  'positioning':{'ja':'iPad向けPOSレジ、店内外モバイルオーダー、ハンディ、LINE連携を一体で扱う飲食店向けアプリ','en':'A restaurant app combining iPad POS, dine-in and off-premise mobile ordering, handheld operation, and LINE integration'},
  'pricing':{'ja':'Freeは月額0円。Liteは年払い換算月額4,950円、Businessは9,900円、Business Plusは14,850円','en':'Free is JPY 0. Annual-billing monthly equivalents are JPY 4,950 for Lite, JPY 9,900 for Business, and JPY 14,850 for Business Plus'},
  'pricingDetail':{'ja':'月払いはLite 5,550円、Business 11,000円、Business Plus 16,500円。iPad、周辺機器、決済手数料、導入支援等は別途確認します。','en':'Monthly billing is JPY 5,550 for Lite, JPY 11,000 for Business, and JPY 16,500 for Business Plus. Budget for iPad hardware, peripherals, payment processing, and implementation support.'},
  'workflow':{'ja':'来店客がQRコードから注文し、店舗はiPad POSとiPhoneハンディで注文・会計を管理。LINE連携と売上分析も利用可能','en':'Customers order through QR codes while the store manages orders and checkout with an iPad POS and iPhone handheld workflow, with LINE and analytics options'},
  'bestFor':{'ja':'無料からモバイルオーダーを試し、店舗規模やLINE施策に応じて有料プランへ段階移行したい飲食店','en':'Restaurants that want to test mobile ordering for free and scale into paid tiers for more devices and customer management'},
  'strengths':{'ja':['月額0円のFreeプラン','POSと店内外モバイルオーダーを一体化','LINE連携と上位プランの顧客管理'],'en':['Zero-monthly-fee Free tier','Integrated POS and dine-in/off-premise ordering','LINE integration and advanced customer functions']},
  'limits':{'ja':['店舗側はiPadが必要','無料版は同時ログイン等に制限','周辺機器・決済手数料・連携準備を別途確認'],'en':['iPad required on the store side','Free tier has device and feature limits','Hardware, processing fees, and integration lead time require separate planning']}
}
save('content/article-batches/product-profiles-expansion.json',profiles)

# Version and release documentation.
pkg=load('package.json'); pkg['version']='3.5.0'; save('package.json',pkg)
lock=load('package-lock.json'); lock['version']='3.5.0';
if 'packages' in lock and '' in lock['packages']: lock['packages']['']['version']='3.5.0'
save('package-lock.json',lock)

script_path=ROOT/'scripts/add-funfo-v350.py'
script_path.write_text(Path('/tmp/add_funfo_v350.py').read_text(encoding='utf-8'),encoding='utf-8')

(ROOT/'docs/STORE_DX_FUNFO_V3.5.md').write_text('''# Store DX funfo expansion v3.5.0\n\n- Added Japanese and English funfo reviews.\n- Added Japanese and English funfo vs Kantan Chumon comparisons.\n- Added A8.net program s00000026887001 using the two exact supplied ad materials.\n- Added contextual placements to the Japanese POS selection, mobile-order, and small-restaurant DX guides.\n- Added funfo to the product comparison catalog source.\n- Official information checked on 2026-07-20.\n- Japanese publication URLs using the A8 program must be submitted through A8.net advertising URL management after deployment.\n''',encoding='utf-8')
print('funfo v3.5.0 source updates completed')
