import json
from pathlib import Path

ROOT = Path('/mnt/data/luqevora_v36/Luqevora.com-auto-platform-v3.5.0-funfo-Store-DX-github')
DATE = '2026-07-20'
POS_LP = 'https://emeao.jp/pos-lp2/'
GUIDE = 'https://emeao.jp/guide/pos/'
HOME = 'https://emeao.jp/'

A8 = {
    'emeao-pos-fit': {
        'url': 'https://px.a8.net/svt/ejp?a8mat=4B84X2+EFRGNU+2LHA+HVFKY',
        'text': 'あなたにぴったりのPOSレジ・システム会社がわずか1分でさがせる！',
        'pixel': 'https://www14.a8.net/0.gif?a8mat=4B84X2+EFRGNU+2LHA+HVFKY',
    },
    'emeao-pos-quality': {
        'url': 'https://px.a8.net/svt/ejp?a8mat=4B84X2+EFRGNU+2LHA+HVNAQ',
        'text': 'POSレジ・システムの業者探しは【簡単・無料・厳選優良業者】のEMEAO!',
        'pixel': 'https://www12.a8.net/0.gif?a8mat=4B84X2+EFRGNU+2LHA+HVNAQ',
    },
    'emeao-pos-free': {
        'url': 'https://px.a8.net/svt/ejp?a8mat=4B84X2+EFRGNU+2LHA+HVV0I',
        'text': 'POSレジ・システム業者を完全無料でご紹介します！【EMEAO!】',
        'pixel': 'https://www17.a8.net/0.gif?a8mat=4B84X2+EFRGNU+2LHA+HVV0I',
    },
    'emeao-pos-company': {
        'url': 'https://px.a8.net/svt/ejp?a8mat=4B84X2+EFRGNU+2LHA+I35CY',
        'text': '【POSレジ・システム業者探しならEMEAO!】ご希望にあった優良企業を無料で紹介します',
        'pixel': 'https://www18.a8.net/0.gif?a8mat=4B84X2+EFRGNU+2LHA+I35CY',
    },
}


def load(rel):
    return json.loads((ROOT / rel).read_text(encoding='utf-8'))


def save(rel, data):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


# Register the four exact A8 materials supplied by the user.
aff = load('content/config/affiliates.json')
for key, item in A8.items():
    aff['links'][key] = {
        'type': 'rawHtml',
        'network': 'A8.net',
        'programId': 's00000012115003',
        'language': 'ja',
        'destination': POS_LP,
        'rawHtml': f'<a href="{item["url"]}" rel="nofollow">{item["text"]}</a>\n<img border="0" width="1" height="1" src="{item["pixel"]}" alt="">',
    }
aff['links']['emeao-pos-official'] = {
    'type': 'official', 'network': 'Official', 'language': 'en', 'destination': POS_LP, 'url': POS_LP
}
save('content/config/affiliates.json', aff)

sources_ja = [
    {'label': 'EMEAO! POSレジ・システム業者紹介 公式ページ', 'url': POS_LP},
    {'label': 'EMEAO! POSレジ・システム業者選定ガイド', 'url': GUIDE},
    {'label': 'EMEAO! 公式サイト', 'url': HOME},
]
sources_en = [
    {'label': 'EMEAO! official POS vendor matching page (Japanese)', 'url': POS_LP},
    {'label': 'EMEAO! POS vendor selection guide (Japanese)', 'url': GUIDE},
    {'label': 'EMEAO! official website (Japanese)', 'url': HOME},
]

ja_review = {
    'id': 'emeao-pos-review-ja',
    'translationKey': 'emeao-pos-review',
    'language': 'ja',
    'type': 'review',
    'status': 'published',
    'slug': 'emeao-pos-review',
    'category': 'store-dx',
    'topic': 'restaurant-pos-orders',
    'badge': '広告掲載・公式情報検証',
    'title': 'EMEAO!の評判・仕組み・注意点｜POSレジ業者を無料比較する方法',
    'metaTitle': 'EMEAO!の評判と注意点｜POSレジ業者を無料比較【2026年】',
    'description': 'POSレジ・システム業者紹介サービスEMEAO!を、仕組み、無料の範囲、最大紹介社数、ヒアリング、メリット、注意点から公式情報で検証します。',
    'lead': 'EMEAO!はPOSレジのメーカーや販売会社ではなく、店舗・法人の条件をヒアリングして対応可能な業者を紹介するコンシェルジュ型サービスです。製品が決まっていない段階で複数提案を集めたい場合に有効ですが、問い合わせ後の電話ヒアリングと各社の提案対応まで含めて利用を判断します。',
    'publishedAt': DATE,
    'updatedAt': DATE,
    'verifiedAt': DATE,
    'author': 'Luqevora.com編集部',
    'featured': True,
    'affiliateDisclosure': True,
    'ctas': [
        {'label': 'EMEAO!でPOSレジ業者の候補を確認する', 'officialUrl': POS_LP, 'affiliateKey': 'emeao-pos-fit'}
    ],
    'sources': sources_ja,
    'sections': [
        {
            'heading': '結論：製品名より先に要件を整理したい事業者向け',
            'body': [
                'EMEAO!の価値は、POSレジを直接販売することではなく、予算、業種、必要機能、導入時期などを整理し、条件に対応できる業者候補を絞る点にあります。公式POSページでは、独自審査を通過した登録業者から最大8社まで紹介すると案内しています。',
                '一方、funfoのように無料アプリをすぐ試したい店舗や、かんたん注文のように特定サービスを検討している店舗は、まず直接確認した方が速い場合があります。複数業者の価格・機能・保守条件を横並びにしたいときにEMEAO!を使うのが合理的です。'
            ],
            'affiliateMaterialKey': 'emeao-pos-fit',
            'affiliateNote': '広告リンクです。法人・個人事業主が実際にPOSレジ・システムを探している場合に利用し、問い合わせ後のヒアリングへ正確に回答してください。'
        },
        {
            'heading': 'EMEAO!の仕組みと利用の流れ',
            'body': [
                '公式サイトでは、問い合わせ後にコンシェルジュが条件・要望・納期などをヒアリングし、その内容を対応可能な業者へ共有する流れが案内されています。利用者は紹介された業者から提案や見積もりを受け、契約先を比較します。',
                'POSレジ専用ページでは最大8社までの紹介、利用者側の紹介手数料は無料、難しい案件を除き平均3営業日以内の紹介を目安として案内しています。実際の紹介社数と所要日数は、地域、業種、予算、要件、導入期限で変わります。'
            ],
            'table': {
                'headers': ['段階', '実施内容', '準備する情報'],
                'rows': [
                    ['問い合わせ', 'フォームから概要を送信', '法人・店舗情報、連絡先、検討内容'],
                    ['ヒアリング', '担当者へ条件・課題を説明', '予算、希望時期、必要機能、店舗数'],
                    ['業者紹介', '条件に対応できる候補から連絡・提案', '比較表、質問事項、デモ希望'],
                    ['比較・判断', '見積もりと契約条件を比較', '総額、保守、解約、データ移行条件']
                ]
            }
        },
        {
            'heading': 'メリット',
            'body': [
                '複数会社へ同じ説明を繰り返す前に、コンシェルジュへ要件をまとめて伝えられる点が最大の利点です。POSレジの種類や相場に詳しくない事業者でも、業種、店舗規模、決済、在庫、モバイルオーダーなどの条件から候補を整理しやすくなります。',
                '公式ページでは、登録業者を独自審査し、要件に合う業者を最大8社まで選定するとしています。検索結果から無差別に問い合わせるより、比較対象を絞るための時間を削減しやすい設計です。'
            ],
            'bullets': [
                '利用者側の紹介手数料は無料',
                '一度のヒアリングで条件を整理できる',
                '複数業者の提案・見積もりを比較できる',
                '製品名が決まっていない段階でも相談しやすい',
                '導入期限や地域などの条件を先に共有できる'
            ]
        },
        {
            'heading': '注意点・デメリット',
            'body': [
                'EMEAO!への問い合わせだけで比較が完結するわけではありません。紹介後は各業者から連絡を受け、デモ、見積もり、現地確認、契約条件の確認が必要です。提案数を増やしすぎると対応工数も増えるため、比較する社数と連絡可能時間をヒアリング時に伝えてください。',
                'また、無料なのは業者紹介サービスの利用料です。POSレジ本体、タブレット、周辺機器、決済、設置、設定、保守、回線などの導入費用が無料になるわけではありません。「最安値」だけで決めず、必要機能、障害対応、契約期間、データ持ち出しまで確認します。'
            ],
            'bullets': [
                '問い合わせ後に電話ヒアリングがある',
                '紹介業者から提案連絡を受ける必要がある',
                '紹介サービス無料とPOS導入無料は別',
                '希望条件によって紹介社数・速度は変わる',
                '最終的な業者・製品選定は利用者自身が行う'
            ]
        },
        {
            'heading': '直接問い合わせとの違い',
            'body': ['候補製品が決まっているか、要件整理から必要かで使い分けます。'],
            'table': {
                'headers': ['探し方', '向いている状況', '弱点'],
                'rows': [
                    ['製品へ直接問い合わせ', 'funfoやかんたん注文など候補が決まっている', '他社条件との横比較を自分で行う'],
                    ['EMEAO!で業者紹介', '候補が未定で複数提案を集めたい', 'ヒアリングと複数社対応が必要'],
                    ['自力でWeb検索', '市場全体を広く調査したい', '要件外業者の除外と各社説明に時間がかかる']
                ]
            }
        },
        {
            'heading': '問い合わせ前に準備する要件',
            'body': [
                '問い合わせ内容が曖昧なままだと、紹介後の提案も広すぎて比較できません。最低限、次の項目を一枚にまとめてから相談します。'
            ],
            'bullets': [
                '業種、店舗数、レジ台数、客席数',
                '新規導入か既存POSからの入れ替えか',
                '月額・初期費用の予算上限',
                '会計、在庫、予約、モバイルオーダー、勤怠の必要範囲',
                '決済端末・会計ソフト・ECとの連携',
                '導入希望日と店舗休業可能時間',
                'データ移行、研修、保守、障害対応の条件',
                '契約期間、解約金、データ出力の要件'
            ],
            'affiliateMaterialKey': 'emeao-pos-quality',
            'affiliateNote': '広告リンクです。条件を具体化してから相談すると、紹介候補と見積もりを比較しやすくなります。'
        },
        {
            'heading': '向いている事業者・向かない事業者',
            'body': [
                '向いているのは、POSレジの候補が決まっていない法人・個人事業主、複数店舗や特殊要件があり一社ずつ探す時間を減らしたい事業者、見積価格の妥当性を比較したい事業者です。',
                '向かないのは、情報収集だけで導入意思がない場合、すでに契約先が決まっている場合、電話ヒアリングや業者からの提案対応が難しい場合です。具体的な導入計画がある段階で利用してください。'
            ]
        }
    ],
    'faqs': [
        {'question': 'EMEAO!の利用料金は本当に無料ですか？', 'answer': '公式サイトでは、利用者側の相談・業者紹介手数料は無料と案内されています。ただし、紹介先と契約するPOSレジ、機器、設定、保守などの費用は別途発生します。'},
        {'question': '何社紹介されますか？', 'answer': '公式POSページでは最大8社までと案内されています。案件条件や対応可能業者の状況により、実際の紹介社数は変わります。'},
        {'question': '問い合わせ後は何が必要ですか？', 'answer': 'コンシェルジュによる電話ヒアリングへ対応し、その後、紹介業者からの提案・見積もりを比較します。予算、必要機能、導入時期を事前に整理してください。'},
        {'question': '飲食店以外でも使えますか？', 'answer': 'POSレジ・システムを探す法人・個人事業主が対象です。小売、サロン、医療なども候補ですが、対応可否は業種・地域・要件によります。'}
    ]
}

ja_compare = {
    'id': 'restaurant-pos-three-way-comparison-ja',
    'translationKey': 'restaurant-pos-three-way-comparison',
    'language': 'ja',
    'type': 'comparison',
    'status': 'published',
    'slug': 'restaurant-pos-three-way-comparison',
    'category': 'store-dx',
    'topic': 'restaurant-pos-orders',
    'badge': '広告掲載・公式情報比較',
    'title': 'funfo・かんたん注文・EMEAO!を比較｜飲食店POSの探し方',
    'metaTitle': 'funfo・かんたん注文・EMEAO!比較｜飲食店POSの選び方【2026年】',
    'description': '飲食店向けPOSのfunfo、かんたん注文、業者紹介サービスEMEAO!を、無料試用、個別提案、複数社比較、料金、導入方法から比較します。',
    'lead': '3サービスは同じPOS案件ではありません。funfoは無料から自店で試すアプリ、かんたん注文は特定サービスへ相談する方式、EMEAO!は複数のPOS業者候補を紹介してもらう方式です。現在地に合う探し方を選ぶことが先です。',
    'publishedAt': DATE,
    'updatedAt': DATE,
    'verifiedAt': DATE,
    'author': 'Luqevora.com編集部',
    'featured': True,
    'affiliateDisclosure': True,
    'ctas': [
        {'label': 'funfoを無料プランから確認', 'officialUrl': 'https://www.funfo.jp/', 'affiliateKey': 'funfo-short'},
        {'label': 'かんたん注文の導入条件を確認', 'officialUrl': 'https://f.012grp.co.jp/wiz_kantanchumon_hojyokin', 'affiliateKey': 'kantan-chumon-short'},
        {'label': 'EMEAO!で複数のPOS業者候補を確認', 'officialUrl': POS_LP, 'affiliateKey': 'emeao-pos-free'},
    ],
    'sources': sources_ja + [
        {'label': 'funfo 公式サイト', 'url': 'https://www.funfo.jp/'},
        {'label': 'funfo 料金プラン', 'url': 'https://www.funfo.jp/index.php/pricing/'},
        {'label': '株式会社Wiz「かんたん注文」公式ページ', 'url': 'https://f.012grp.co.jp/wiz_kantanchumon_hojyokin'},
    ],
    'sections': [
        {
            'heading': '結論：試す・相談する・比較するのどこから始めるか',
            'body': [
                'iPadがあり、小規模店舗でまずQR注文とPOSを試したいならfunfoが分かりやすい入口です。料金と機能を自分で確認しながら段階的に導入できます。',
                '補助金や導入支援を含めて特定サービスへ相談したいならかんたん注文、候補製品が決まっておらず複数業者から提案を集めたいならEMEAO!が適しています。比較の起点が異なるため、単純な機能ランキングにはしません。'
            ]
        },
        {
            'heading': '3サービスの役割を比較',
            'body': ['公開情報と導入方式を同じ軸に整理します。'],
            'table': {
                'headers': ['比較項目', 'funfo', 'かんたん注文', 'EMEAO!'],
                'rows': [
                    ['サービスの役割', 'POS・モバイルオーダーアプリ', '飲食店向けPOS・注文サービス', 'POS業者紹介・比較支援'],
                    ['開始方法', 'アプリを無料で試す', '問い合わせ・デモ・見積もり', '要件をヒアリング後、業者候補を紹介'],
                    ['料金の見え方', 'Freeと有料プランを公式公開', '個別見積もり', '紹介料は無料、導入費用は各業者見積もり'],
                    ['比較範囲', 'funfo単体を検証', 'かんたん注文単体を検証', '条件に合う複数業者を比較'],
                    ['向く段階', 'まず実機テストしたい', '特定候補へ相談したい', '候補未定で市場比較したい']
                ]
            }
        },
        {
            'heading': '費用の比較方法',
            'body': [
                'funfoの月額0円はFreeプランの利用料であり、iPad、プリンター、決済手数料などは別に確認します。かんたん注文は初期費用、月額、機器、保守、契約期間を見積書で確認します。',
                'EMEAO!は業者紹介の利用料が無料です。紹介先とのPOS契約費用まで無料になるわけではないため、各社へ同じ要件を送り、初年度総額と更新後総額を比較してください。'
            ],
            'affiliateMaterialKey': 'emeao-pos-free',
            'affiliateNote': 'EMEAO!の広告リンクです。無料なのは業者紹介サービスであり、POSレジ導入費用は紹介先ごとの見積もりです。'
        },
        {
            'heading': '導入スピードと手間',
            'body': [
                'funfoはアプリを使ったテストを早く始めやすい反面、自店で商品登録や運用確認を行います。かんたん注文は営業・導入担当者との調整が必要ですが、要件を相談しながら進められます。',
                'EMEAO!は候補探しの時間を短縮しやすい一方、コンシェルジュのヒアリングと、紹介後の複数業者対応が発生します。導入期限がある場合は、希望日だけでなく機器設置、決済審査、データ移行、スタッフ研修の期限も伝えます。'
            ]
        },
        {
            'heading': '店舗別のおすすめ',
            'body': ['店舗の状況から選びます。'],
            'bullets': [
                '個人店・小規模店でまず無料検証：funfo',
                '飲食店向け機能と補助金相談を重視：かんたん注文',
                '複数店舗・特殊要件・候補未定：EMEAO!',
                '比較精度を上げたい店舗：funfoを試し、実運用の要件を固めた上で直接見積もりまたはEMEAO!を利用',
                '急ぎの店舗：希望納期と必須機能を最初に明示し、対応可能な選択肢だけに絞る'
            ]
        },
        {
            'heading': '同じ要件表で比較する',
            'body': [
                'どの経路を選んでも、要件が違えば見積もりを比較できません。客席数、レジ台数、ピーク注文数、現金・カード・QR決済、キッチン出力、予約、在庫、会計連携、障害対応を同じ表にします。',
                '価格は初期費用と月額だけでなく、端末、プリンター、決済手数料、保守、契約期間、解約、データ移行、追加店舗まで含めて比較します。'
            ]
        },
        {
            'heading': '最終判断',
            'body': [
                '製品を触って判断したいならfunfo、特定サービスの提案を受けたいならかんたん注文、市場から複数候補を探したいならEMEAO!です。最も危険なのは、無料、補助金、最安値など一つの言葉だけで選ぶことです。',
                '少なくとも2候補を同じ要件と同じ期間で比較し、デモでは取消、返品、割り勘、品切れ、通信障害、締め処理など日常の例外操作を試してください。'
            ]
        }
    ],
    'faqs': [
        {'question': '一番安いのはどれですか？', 'answer': 'funfoは月額0円のFreeプランがありますが、機器や決済費用は別です。かんたん注文は個別見積もり、EMEAO!は紹介料無料で導入費用は各業者の見積もりです。総額で比較してください。'},
        {'question': '製品が決まっていない場合はどうすればよいですか？', 'answer': '必要機能と予算を整理してEMEAO!のような業者紹介サービスを使うか、代表的なPOSを2〜3製品に絞って直接デモを依頼します。'},
        {'question': '小規模飲食店が最初に試すなら？', 'answer': 'iPadがある場合はfunfoの無料版で注文から会計までテストし、不足機能を要件表にして他社見積もりへ進む方法が現実的です。'}
    ]
}

en_review = {
    'id': 'emeao-pos-review-en',
    'translationKey': 'emeao-pos-review',
    'language': 'en',
    'type': 'review',
    'status': 'published',
    'slug': 'emeao-pos-review',
    'category': 'store-dx',
    'topic': 'restaurant-pos-orders',
    'badge': 'Official-source review',
    'title': 'EMEAO! POS Vendor Matching Review: Process, Benefits, and Caveats',
    'metaTitle': 'EMEAO! POS Vendor Matching Review for Businesses in Japan (2026)',
    'description': 'Review EMEAO!, a Japan-focused POS vendor matching service, including its concierge workflow, free referral model, vendor proposals, comparison benefits, and caveats.',
    'lead': 'EMEAO! is not a POS product. It is a Japanese concierge service that interviews a business about requirements and introduces eligible POS vendors. It can reduce vendor-search work when the product shortlist is not fixed, but the business must still handle the interview, proposals, demonstrations, and contract review.',
    'publishedAt': DATE,
    'updatedAt': DATE,
    'verifiedAt': DATE,
    'author': 'Luqevora.com Editorial Team',
    'featured': True,
    'affiliateDisclosure': False,
    'ctas': [{'label': 'Check the official EMEAO! POS matching page', 'officialUrl': POS_LP, 'affiliateKey': 'emeao-pos-official'}],
    'sources': sources_en,
    'sections': [
        {'heading': 'Verdict: useful when requirements are clearer than the product shortlist', 'body': [
            'EMEAO! positions itself as a concierge rather than an automated quote form. Its official POS page says that staff organize requirements and select up to eight vetted vendors that may fit the project.',
            'A restaurant that already wants funfo or Kantan Chumon should normally contact that provider directly. EMEAO! is more relevant when the business wants several proposals across vendors, hardware configurations, support levels, or multi-location requirements.'
        ]},
        {'heading': 'How the service works', 'body': [
            'The business submits an inquiry, answers a follow-up interview about budget, timing, functions, and constraints, and then receives contact or proposals from selected vendors. The official page describes the matching service as free to the buyer.',
            'Free matching does not mean free POS implementation. Hardware, software, payment processing, setup, training, connectivity, and support are priced by the introduced vendors.'
        ], 'table': {'headers': ['Stage', 'Action', 'Prepare'], 'rows': [
            ['Inquiry', 'Submit project outline', 'Business details and contact information'],
            ['Interview', 'Explain requirements and schedule', 'Budget, functions, locations, target date'],
            ['Introductions', 'Receive vendor proposals', 'Common comparison sheet and demo scenarios'],
            ['Decision', 'Compare and negotiate', 'Total cost, support, term, exit and export terms']
        ]}},
        {'heading': 'Benefits', 'body': [
            'The concierge can reduce repeated vendor discovery and initial explanation work. It is particularly useful when the business knows the operational problem but does not know which POS architecture or supplier fits it.',
            'The official POS page states that vendors are selected from a screened network and that up to eight may be introduced. Actual availability depends on the project, location, budget, and timetable.'
        ], 'bullets': ['No buyer-side matching fee', 'One requirements interview before vendor introductions', 'Ability to compare multiple proposals', 'Useful before a product shortlist exists', 'Can communicate regional and deadline constraints early']},
        {'heading': 'Caveats', 'body': [
            'The inquiry does not eliminate sales work. The business still needs to respond to introduced vendors, review demonstrations and quotations, and decide which company to contract with.',
            'Use a common requirements sheet. Without it, proposals may use different device counts, support scopes, processing assumptions, and contract periods, making the cheapest headline price misleading.'
        ], 'bullets': ['Japanese-language, Japan-market workflow', 'Telephone or direct follow-up is part of the process', 'Several vendor contacts may require time', 'Matching is free, implementation is not', 'The buyer remains responsible for final selection']},
        {'heading': 'Direct provider inquiry versus vendor matching', 'body': ['Choose the path based on shortlist maturity.'], 'table': {'headers': ['Path', 'Best when', 'Trade-off'], 'rows': [
            ['Direct inquiry', 'A specific product is already shortlisted', 'The buyer performs cross-vendor comparison'],
            ['EMEAO! matching', 'Requirements exist but vendors are not fixed', 'Interview and multiple proposal follow-up'],
            ['Independent web research', 'The buyer wants broad market discovery', 'Higher filtering and repeated explanation work']
        ]}},
        {'heading': 'Requirements checklist', 'body': ['Prepare the same facts before the concierge interview and vendor calls.'], 'bullets': [
            'Business type, number of stores, terminals, and seats', 'New installation or replacement', 'Initial and recurring budget', 'Checkout, inventory, ordering, reservations, and workforce scope', 'Payments, accounting, ecommerce, and API integrations', 'Target deployment date', 'Migration, training, support, and outage requirements', 'Contract term, termination, and data export'
        ]},
        {'heading': 'Who should use it', 'body': [
            'It fits Japanese businesses and sole proprietors that genuinely plan to source a POS system, want several proposals, and can participate in follow-up calls. It is less useful for casual research, projects with a final vendor already selected, or teams unable to respond to introductions.'
        ]}
    ],
    'faqs': [
        {'question': 'Is EMEAO! free?', 'answer': 'The official site describes the buyer-side consultation and matching service as free. POS products, devices, implementation, processing, and support from the selected vendor are separate costs.'},
        {'question': 'How many vendors are introduced?', 'answer': 'The official POS page says up to eight. Actual introductions depend on the requirements and vendor availability.'},
        {'question': 'Is it available outside Japan?', 'answer': 'The service pages and workflow are Japanese and focused on Japanese vendor sourcing. Confirm location coverage directly for any non-standard requirement.'}
    ]
}

en_compare = {
    'id': 'restaurant-pos-three-way-comparison-en',
    'translationKey': 'restaurant-pos-three-way-comparison',
    'language': 'en',
    'type': 'comparison',
    'status': 'published',
    'slug': 'restaurant-pos-three-way-comparison',
    'category': 'store-dx',
    'topic': 'restaurant-pos-orders',
    'badge': 'Official-source comparison',
    'title': 'funfo vs Kantan Chumon vs EMEAO!: Three Ways to Source a Restaurant POS',
    'metaTitle': 'funfo vs Kantan Chumon vs EMEAO! for Restaurant POS in Japan',
    'description': 'Compare self-service testing with funfo, provider consultation with Kantan Chumon, and multi-vendor matching through EMEAO! for restaurant POS sourcing in Japan.',
    'lead': 'These are not three equivalent POS products. funfo is a restaurant app that can be tested directly, Kantan Chumon is a specific consultation-led restaurant POS and ordering option, and EMEAO! is a vendor-matching service. Select the sourcing route before comparing features.',
    'publishedAt': DATE,
    'updatedAt': DATE,
    'verifiedAt': DATE,
    'author': 'Luqevora.com Editorial Team',
    'featured': True,
    'affiliateDisclosure': False,
    'ctas': [
        {'label': 'Check funfo officially', 'officialUrl': 'https://www.funfo.jp/', 'affiliateKey': 'funfo-official'},
        {'label': 'Check Kantan Chumon officially', 'officialUrl': 'https://f.012grp.co.jp/wiz_kantanchumon_hojyokin', 'affiliateKey': 'kantan-chumon-official'},
        {'label': 'Check EMEAO! POS matching officially', 'officialUrl': POS_LP, 'affiliateKey': 'emeao-pos-official'}
    ],
    'sources': sources_en + [
        {'label': 'funfo official website', 'url': 'https://www.funfo.jp/'},
        {'label': 'funfo official pricing', 'url': 'https://www.funfo.jp/index.php/pricing/'},
        {'label': 'Kantan Chumon official provider page', 'url': 'https://f.012grp.co.jp/wiz_kantanchumon_hojyokin'}
    ],
    'sections': [
        {'heading': 'Verdict: test, consult, or source multiple vendors', 'body': [
            'Use funfo when a small restaurant can test an iPad-based POS and mobile-order workflow directly. Use Kantan Chumon when the restaurant wants to discuss one named product and possible implementation support. Use EMEAO! when the shortlist is not fixed and the business wants proposals from several eligible vendors.',
            'The correct choice depends on sourcing maturity, not a universal feature score.'
        ]},
        {'heading': 'Role comparison', 'body': ['Compare what each option actually provides.'], 'table': {'headers': ['Criterion', 'funfo', 'Kantan Chumon', 'EMEAO!'], 'rows': [
            ['Role', 'Restaurant POS and mobile-order app', 'Named restaurant POS and ordering service', 'POS vendor matching service'],
            ['Starting point', 'Download and test', 'Inquiry, demo, and quotation', 'Requirements interview and vendor introductions'],
            ['Pricing visibility', 'Free and paid tiers published', 'Quotation required', 'Matching free; vendor implementation quoted'],
            ['Comparison scope', 'One product', 'One product', 'Several potential vendors'],
            ['Best stage', 'Early hands-on test', 'Named-product evaluation', 'Pre-shortlist market sourcing']
        ]}},
        {'heading': 'Cost comparison', 'body': [
            'funfo has a zero-fee starting tier but hardware, payment processing, and paid functions may add cost. Kantan Chumon requires a quotation for devices, subscription, support, term, and implementation.',
            'EMEAO! does not charge the buyer for matching according to its official page, but each introduced vendor prices its POS solution separately. Compare first-year and renewal totals using identical device and service assumptions.'
        ]},
        {'heading': 'Time and workload', 'body': [
            'funfo can be tested quickly but requires self-configuration. Kantan Chumon adds provider-led coordination. EMEAO! can reduce market search time but adds a concierge interview and follow-up with several vendors.',
            'For a deadline, provide deployment date, payment approval, hardware installation, data migration, and training milestones rather than a single launch date.'
        ]},
        {'heading': 'Best fit by situation', 'body': ['Use the route that matches the project.'], 'bullets': [
            'Small restaurant and immediate low-cost test: funfo',
            'Named restaurant product and implementation consultation: Kantan Chumon',
            'Multiple stores, unusual requirements, or no shortlist: EMEAO!',
            'Higher-confidence process: test a representative app first, convert findings into requirements, then request comparable proposals'
        ]},
        {'heading': 'Use one comparison sheet', 'body': [
            'Keep store count, device count, peak order volume, payments, printers, ordering, inventory, reservations, integrations, support, and outage procedures constant across quotations.',
            'Compare hardware, processing fees, setup, support, contract term, termination, data migration, and additional-store costs—not only the monthly subscription.'
        ]},
        {'heading': 'Final recommendation', 'body': [
            'funfo is the direct testing route, Kantan Chumon is the named-provider consultation route, and EMEAO! is the multi-vendor sourcing route. Avoid selecting solely on “free,” “subsidy,” or “lowest price.” Validate exception workflows such as refunds, split bills, sold-out items, network outages, and end-of-day reconciliation.'
        ]}
    ],
    'faqs': [
        {'question': 'Which option is cheapest?', 'answer': 'There is no reliable single answer. funfo has a free tier, Kantan Chumon requires a quotation, and EMEAO! matching is free while the introduced POS solutions are priced separately.'},
        {'question': 'What if the product shortlist is empty?', 'answer': 'Prepare requirements and use a vendor-matching route such as EMEAO!, or independently shortlist two or three representative POS products for comparable demos.'},
        {'question': 'What should a small restaurant test first?', 'answer': 'If an iPad is available, a hands-on free test can reveal workflow requirements before requesting broader quotations.'}
    ]
}

related_ja = [
    {'label': ja_review['title'], 'url': '/ja/store-dx/emeao-pos-review/', 'description': ja_review['description']},
    {'label': ja_compare['title'], 'url': '/ja/store-dx/restaurant-pos-three-way-comparison/', 'description': ja_compare['description']},
    {'label': 'funfoの評判・料金・機能を検証｜無料POSレジとモバイルオーダーの注意点', 'url': '/ja/store-dx/funfo-review/', 'description': '無料プランから試せるPOS・モバイルオーダーを確認します。'},
    {'label': 'かんたん注文の評判・機能・注意点｜飲食店向けPOSを公式情報で検証', 'url': '/ja/store-dx/kantan-chumon-review/', 'description': '問い合わせ型POS・モバイルオーダーの機能と注意点を確認します。'},
    {'label': '飲食店向けPOSレジの選び方｜比較すべき12項目と失敗例', 'url': '/ja/store-dx/restaurant-pos-selection-guide/', 'description': '料金だけでなく注文、会計、分析、サポートを同じ条件で比較します。'},
    {'label': 'funfoとかんたん注文を比較｜無料POSか補助金相談型か、飲食店向けに検証', 'url': '/ja/store-dx/funfo-vs-kantan-chumon/', 'description': '直接導入する2サービスの違いを詳しく比較します。'}
]
related_en = [
    {'label': en_review['title'], 'url': '/en/store-dx/emeao-pos-review/', 'description': en_review['description']},
    {'label': en_compare['title'], 'url': '/en/store-dx/restaurant-pos-three-way-comparison/', 'description': en_compare['description']},
    {'label': 'funfo Review: Free Restaurant POS, Mobile Ordering, Pricing, and Caveats', 'url': '/en/store-dx/funfo-review/', 'description': 'Review the direct self-testing POS and mobile-order route.'},
    {'label': 'Kantan Chumon Review: Mobile Ordering, Restaurant POS Features, and Caveats', 'url': '/en/store-dx/kantan-chumon-review/', 'description': 'Review the named provider consultation route.'},
    {'label': 'How to Choose a Restaurant POS: 12 Comparison Criteria and Common Mistakes', 'url': '/en/store-dx/restaurant-pos-selection-guide/', 'description': 'Use a consistent POS requirements and cost framework.'},
    {'label': 'funfo vs Kantan Chumon: Free Self-Testing or Consultation-Led Restaurant POS?', 'url': '/en/store-dx/funfo-vs-kantan-chumon/', 'description': 'Compare the two direct product evaluation routes.'}
]

for a in [ja_review, ja_compare]:
    a['relatedLinks'] = [x for x in related_ja if x['url'] != f'/ja/store-dx/{a["slug"]}/']
for a in [en_review, en_compare]:
    a['relatedLinks'] = [x for x in related_en if x['url'] != f'/en/store-dx/{a["slug"]}/']

for lang, articles in [('ja', [ja_review, ja_compare]), ('en', [en_review, en_compare])]:
    for article in articles:
        save(f'content/articles/{lang}/{article["slug"]}.json', article)

# Add new related routes to the Store DX cluster, retaining a bounded list.
for lang in ['ja', 'en']:
    folder = ROOT / f'content/articles/{lang}'
    additions = related_ja[:2] if lang == 'ja' else related_en[:2]
    for p in folder.glob('*.json'):
        d = json.loads(p.read_text(encoding='utf-8'))
        if d.get('category') != 'store-dx' or d.get('slug') in {'emeao-pos-review', 'restaurant-pos-three-way-comparison'}:
            continue
        links = d.setdefault('relatedLinks', [])
        merged, seen = [], set()
        for item in additions + links:
            url = item.get('url')
            if url and url not in seen:
                merged.append(item)
                seen.add(url)
            if len(merged) >= 10:
                break
        d['relatedLinks'] = merged
        d['updatedAt'] = DATE
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Contextual high-intent placements. Do not overwrite existing section ad material.
placements = {
    'restaurant-pos-selection-guide': ('emeao-pos-company', 'EMEAO!で複数のPOSレジ業者候補を比較する'),
    'funfo-vs-kantan-chumon': ('emeao-pos-free', '候補が決まらない場合はEMEAO!で複数業者を比較する'),
}
for slug, (key, label) in placements.items():
    p = ROOT / f'content/articles/ja/{slug}.json'
    d = json.loads(p.read_text(encoding='utf-8'))
    d['affiliateDisclosure'] = True
    ctas = d.setdefault('ctas', [])
    if not any(c.get('affiliateKey', '').startswith('emeao-pos') for c in ctas):
        ctas.append({'label': label, 'officialUrl': POS_LP, 'affiliateKey': key})
    d['updatedAt'] = DATE
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Product profile source for the canonical comparison catalog.
profiles = load('content/article-batches/product-profiles-expansion.json')
profiles['emeao-pos'] = {
    'name': 'EMEAO! POSレジ・システム業者紹介',
    'affiliateKey': 'emeao-pos-fit',
    'sources': sources_ja,
    'positioning': {
        'ja': 'POS製品そのものではなく、要件をヒアリングして対応可能なPOSレジ・システム業者を紹介するコンシェルジュ型サービス',
        'en': 'A Japan-focused concierge that matches a business with eligible POS vendors rather than selling a POS product itself'
    },
    'pricing': {
        'ja': '利用者側の相談・業者紹介手数料は無料。POS導入費用は紹介先ごとの見積もり',
        'en': 'Buyer-side consultation and matching are described as free; POS implementation is quoted by introduced vendors'
    },
    'pricingDetail': {
        'ja': 'POS本体、ソフトウェア、端末、プリンター、決済、設定、研修、保守、回線等は紹介先の見積もりを比較します。',
        'en': 'Compare vendor quotations for POS software, devices, printers, payment processing, setup, training, support, connectivity, and contract terms.'
    },
    'workflow': {
        'ja': 'フォーム問い合わせ後、コンシェルジュが予算・機能・納期等をヒアリングし、条件に対応可能な業者を最大8社まで紹介',
        'en': 'After an inquiry, a concierge interviews the business about budget, functions, and timing, then introduces up to eight eligible vendors'
    },
    'bestFor': {
        'ja': 'POSレジの候補が決まっておらず、複数業者の提案と見積もりを同じ要件で比較したい法人・個人事業主',
        'en': 'Japanese businesses and sole proprietors without a fixed POS shortlist that want comparable proposals from several vendors'
    },
    'strengths': {
        'ja': ['利用者側の紹介手数料が無料', '要件ヒアリング後に候補業者を選定', '最大8社の提案を比較可能'],
        'en': ['No buyer-side matching fee', 'Concierge-led requirements matching', 'Potential comparison of up to eight vendors']
    },
    'limits': {
        'ja': ['問い合わせ後の電話ヒアリングが必要', '紹介後は複数業者への対応が発生', 'POS導入費用自体は無料ではない'],
        'en': ['Follow-up interview required', 'Multiple vendor contacts may require time', 'POS implementation itself is not free']
    }
}
save('content/article-batches/product-profiles-expansion.json', profiles)

# Priority indexing and catalog inclusion.
seo = load('content/config/seo.json')
new_sources = [
    'content/articles/ja/emeao-pos-review.json',
    'content/articles/ja/restaurant-pos-three-way-comparison.json',
    'content/articles/en/emeao-pos-review.json',
    'content/articles/en/restaurant-pos-three-way-comparison.json',
]
for source in new_sources:
    if source not in seo['indexing']['includeSourceFiles']:
        seo['indexing']['includeSourceFiles'].append(source)
if 'emeao-pos' not in seo['indexing']['priorityProducts']:
    seo['indexing']['priorityProducts'].append('emeao-pos')
save('content/config/seo.json', seo)

# Version and documentation.
pkg = load('package.json')
pkg['version'] = '3.6.0'
save('package.json', pkg)
lock = load('package-lock.json')
lock['version'] = '3.6.0'
if 'packages' in lock and '' in lock['packages']:
    lock['packages']['']['version'] = '3.6.0'
save('package-lock.json', lock)

script_dst = ROOT / 'scripts/add-emeao-v360.py'
script_dst.write_text(Path('/tmp/add_emeao_v360.py').read_text(encoding='utf-8'), encoding='utf-8')

readme = (ROOT / 'README.md').read_text(encoding='utf-8')
header = '## Store DX v3.6.0\n\nEMEAO! POS vendor-matching content and monetization routes added. See `docs/STORE_DX_EMEAO_V3.6.md`.\n\n'
if not readme.startswith('## Store DX v3.6.0'):
    (ROOT / 'README.md').write_text(header + readme, encoding='utf-8')

(ROOT / 'docs/STORE_DX_EMEAO_V3.6.md').write_text('''# Store DX EMEAO! expansion v3.6.0

- Added Japanese and English EMEAO! POS vendor-matching reviews.
- Added Japanese and English three-way sourcing comparisons: funfo, Kantan Chumon, and EMEAO!.
- Registered the four exact user-supplied A8.net materials for program `s00000012115003`.
- Added contextual EMEAO! placements to the Japanese restaurant POS selection guide and funfo-vs-Kantan-Chumon comparison.
- Added EMEAO! to the product comparison catalog source.
- Japanese pages use A8.net materials with first-view advertising disclosure; English pages use official links only.
- Official information checked on 2026-07-20.
''', encoding='utf-8')

print('EMEAO! v3.6.0 source updates completed')
