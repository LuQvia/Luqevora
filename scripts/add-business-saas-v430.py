import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-07-20'

PRODUCTS = {
    'monday': {
        'name': 'monday.com', 'key': 'monday-com',
        'url_ja': 'https://monday.com/lang/ja/work-management/pricing',
        'url_en': 'https://monday.com/pricing',
        'sources': [
            ('monday.com Work Management pricing', 'https://monday.com/lang/ja/work-management/pricing'),
            ('monday.com plans and pricing support', 'https://support.monday.com/hc/en-us/articles/4405633151634-Plans-and-pricing-for-monday-com'),
        ],
    },
    'workspace': {
        'name': 'Google Workspace', 'key': 'google-workspace',
        'url_ja': 'https://workspace.google.com/pricing?hl=ja',
        'url_en': 'https://workspace.google.com/pricing',
        'sources': [
            ('Google Workspace pricing', 'https://workspace.google.com/pricing?hl=ja'),
            ('Google Workspace for business', 'https://workspace.google.com/intl/ja/business/'),
        ],
    },
    'shopify': {
        'name': 'Shopify', 'key': 'shopify',
        'url_ja': 'https://www.shopify.com/jp/pricing',
        'url_en': 'https://www.shopify.com/pricing',
        'sources': [
            ('Shopify Japan pricing', 'https://www.shopify.com/jp/pricing'),
            ('Shopify plan features', 'https://help.shopify.com/ja/manual/intro-to-shopify/pricing-plans/plans-features'),
        ],
    },
    'hubspot': {
        'name': 'HubSpot CRM', 'key': 'hubspot-crm',
        'url_ja': 'https://www.hubspot.jp/products/crm',
        'url_en': 'https://www.hubspot.com/products/crm?software=crm',
        'sources': [
            ('HubSpot CRM Japan', 'https://www.hubspot.jp/products/crm'),
            ('HubSpot Starter Customer Platform', 'https://www.hubspot.jp/products/crm/starter'),
        ],
    },
    'hostinger': {
        'name': 'Hostinger', 'key': 'hostinger',
        'url_ja': 'https://www.hostinger.com/jp/pricing',
        'url_en': 'https://www.hostinger.com/pricing',
        'sources': [
            ('Hostinger Japan pricing', 'https://www.hostinger.com/jp/pricing'),
            ('Hostinger web hosting', 'https://www.hostinger.com/jp/web-hosting'),
        ],
    },
}

RECORDS = [
    {
        'slug':'monday-work-management-plans-comparison','category':'business-software','topic':'project-management','type':'guide','product':'monday',
        'ja_title':'monday.comの料金プラン比較｜Free・Basic・Standard・Proの選び方',
        'en_title':'monday.com Plan Comparison: Free, Basic, Standard, and Pro',
        'ja_desc':'monday.com Work Managementの料金体系、年間契約、席数、ビュー、自動化、連携上限を整理し、小規模事業者向けの選び方を解説します。',
        'en_desc':'Compare monday.com Work Management plans by billing term, seat rules, views, automations, integrations, and small-business fit.',
        'ja_summary':'無料版は検証用、Basicは単純な進捗共有、Standardはタイムラインや自動化を使うチーム、Proは複雑な横断管理を行う組織向けです。料金は製品・席数・請求期間で変わるため、必要機能を先に固定します。',
        'en_summary':'Use Free for validation, Basic for simple tracking, Standard for timeline and automation workflows, and Pro for more advanced cross-team operations. Final cost depends on product, seats, and billing cadence.',
        'ja_cost':'Work ManagementにはFreeと複数の有料プランがあります。公式サポートでは年払いが月払いより割引になること、他のmonday製品は別料金体系であることが案内されています。',
        'en_cost':'Work Management includes a Free option and several paid tiers. Official support notes that annual billing is discounted compared with monthly billing and that other monday products have separate pricing.',
        'ja_workflow':'同じ案件を試用環境に作り、担当者、期限、依存関係、ダッシュボード、自動化、外部連携を順に再現します。使えない機能が出た時点で必要プランを判断します。',
        'en_workflow':'Recreate one real project and test owners, dates, dependencies, dashboards, automation, and integrations. The first required feature that is unavailable identifies the minimum viable tier.',
        'ja_best':'店舗展開、制作案件、営業案件など、状態・担当・期限を視覚的に共有したいチーム。',
        'en_best':'Teams that need visual ownership, status, and deadlines across store openings, client projects, or sales work.',
        'ja_caution':'最低席数、ゲスト扱い、自動化・連携回数、AIクレジット、製品ごとの契約を確認してください。',
        'en_caution':'Confirm minimum seat blocks, guest rules, automation and integration quotas, AI credits, and product-specific subscriptions.',
        'table_ja':[['確認項目','判断基準'],['無料版','少人数で基本ボードを試す'],['Basic','担当・期限・状態の共有が中心'],['Standard','タイムライン、カレンダー、自動化、連携を使う'],['Pro','複数ボードの横断管理や高度な運用'],['Enterprise','統制、セキュリティ、個別見積もり']],
        'table_en':[['Check','Decision rule'],['Free','Validate basic boards with a very small team'],['Basic','Focus on owners, dates, and status'],['Standard','Need timeline, calendar, automation, or integrations'],['Pro','Need advanced cross-board operations'],['Enterprise','Need governance, security, and negotiated terms']],
    },
    {
        'slug':'monday-crm-vs-hubspot-crm','category':'business-software','topic':'project-management','type':'comparison','product':'monday','second':'hubspot',
        'ja_title':'monday CRMとHubSpot CRMを比較｜案件管理か顧客基盤か',
        'en_title':'monday CRM vs HubSpot CRM: Pipeline Flexibility or Customer Platform?',
        'ja_desc':'monday CRMとHubSpot CRMを、無料利用、案件パイプライン、メール、マーケティング、権限、拡張性から比較します。',
        'en_desc':'Compare monday CRM and HubSpot CRM across free access, pipelines, email, marketing, permissions, and expansion paths.',
        'ja_summary':'営業プロセスを柔軟なボードとして設計したい場合はmonday CRM、マーケティング・営業・サポートの顧客データを統合したい場合はHubSpot CRMが候補です。',
        'en_summary':'Choose monday CRM when you want a highly configurable sales workflow. Choose HubSpot CRM when unified customer data across marketing, sales, and service is the priority.',
        'ja_cost':'両サービスとも無料または試用から始められる範囲がありますが、有料化後は席数、機能ハブ、自動化、マーケティング連絡先など課金単位が異なります。',
        'en_cost':'Both offer a free or trial entry point, but paid cost drivers differ: seats, product hubs, automation, and marketing contacts must be separated in the estimate.',
        'ja_workflow':'同じ見込み客10件を登録し、問い合わせ受付、担当割当、商談更新、メール記録、見積後の追客、失注理由の集計まで再現します。',
        'en_workflow':'Load the same ten sample leads and reproduce intake, assignment, stage updates, email logging, follow-up, and lost-reason reporting.',
        'ja_best':'独自の案件フローを作るならmonday CRM、Webフォーム・メール・マーケティングを含む顧客基盤ならHubSpot CRM。',
        'en_best':'monday CRM fits custom deal processes; HubSpot CRM fits a broader customer platform spanning forms, email, marketing, and service.',
        'ja_caution':'アフィリエイト経由の一般読者紹介と、顧客への個別導入支援では各社のパートナー制度が異なります。',
        'en_caution':'Affiliate content referrals and one-to-one implementation services may be governed by different partner programs.',
        'table_ja':[['比較軸','monday CRM','HubSpot CRM'],['中心設計','柔軟なボード型営業管理','顧客データを中心としたCRM基盤'],['無料入口','試用・製品条件を確認','期限なしの無料CRMを案内'],['拡張','Work Management等と組み合わせ','Marketing・Sales・Service等へ拡張'],['向く企業','営業工程を独自設計したい','顧客接点を一体管理したい']],
        'table_en':[['Axis','monday CRM','HubSpot CRM'],['Core design','Configurable board-based sales workflow','Customer-data-centered CRM platform'],['Free entry','Check current trial and product terms','Free CRM with no trial expiration'],['Expansion','Combine with other monday products','Expand into Marketing, Sales, and Service'],['Best fit','Custom sales process design','Unified customer interactions']],
        'extra_sources':[('HubSpot free CRM','https://www.hubspot.com/products/crm?software=crm')],
    },
    {
        'slug':'monday-multiple-store-operations','category':'store-dx','topic':'store-operations','type':'guide','product':'monday',
        'ja_title':'複数店舗の業務管理にmonday.comを使う方法｜本部と店舗を可視化',
        'en_title':'How to Use monday.com for Multi-Location Store Operations',
        'ja_desc':'複数店舗の開店準備、設備点検、販促、シフト外タスク、障害報告をmonday.comで管理する設計例を解説します。',
        'en_desc':'Design monday.com boards for store openings, equipment checks, campaigns, operational tasks, and incident reporting across locations.',
        'ja_summary':'店舗ごとに別ボードを乱立させるのではなく、共通項目を持つ運用台帳と本部ダッシュボードを組み合わせることが重要です。',
        'en_summary':'Avoid isolated boards for every location. Use a shared operational schema and a headquarters dashboard with clear location ownership.',
        'ja_cost':'店舗数ではなく、実際に編集するユーザー数と必要な自動化・ダッシュボード機能でプランを見積もります。閲覧だけの関係者の扱いも確認します。',
        'en_cost':'Estimate by active editors and required automation or dashboard features rather than store count alone. Confirm how view-only stakeholders are licensed.',
        'ja_workflow':'店舗、タスク種別、担当、期限、証跡、承認、緊急度を共通列にし、期限超過と未承認だけを本部へ集約します。',
        'en_workflow':'Standardize location, task type, owner, due date, evidence, approval, and urgency, then roll only overdue and unapproved items into headquarters views.',
        'ja_best':'3店舗以上を運営し、チャットだけでは依頼の進捗や完了証跡を追えない事業者。',
        'en_best':'Operators with three or more locations who can no longer track requests and proof of completion through chat alone.',
        'ja_caution':'勤怠、予約、POSの代替ではありません。各専門システムから発生する改善タスクを管理する位置づけが適切です。',
        'en_caution':'It is not a replacement for timekeeping, reservations, or POS. Use it to manage operational actions generated by those systems.',
        'table_ja':[['ボード','主な項目'],['店舗運用','店舗・担当・期限・状態・証跡'],['設備点検','機器・点検日・異常・対応期限'],['販促','対象店舗・素材・公開日・結果'],['障害報告','緊急度・影響・一次対応・再発防止']],
        'table_en':[['Board','Core fields'],['Store operations','Location, owner, due date, status, evidence'],['Equipment checks','Asset, check date, issue, resolution due date'],['Campaigns','Locations, assets, launch date, result'],['Incidents','Severity, impact, first response, prevention']],
    },
    {
        'slug':'monday-web-production-project-management','category':'business-software','topic':'project-management','type':'guide','product':'monday',
        'ja_title':'Web制作案件をmonday.comで管理する方法｜要件・素材・公開を一元化',
        'en_title':'How to Manage Website Production Projects in monday.com',
        'ja_desc':'Web制作の要件整理、素材回収、デザイン確認、実装、公開、保守引継ぎをmonday.comで管理する方法を整理します。',
        'en_desc':'Manage requirements, asset collection, design approval, implementation, launch, and maintenance handoff in monday.com.',
        'ja_summary':'制作工程だけでなく、顧客確認待ちと素材不足を独立した状態として可視化すると、納期遅延の原因を判断しやすくなります。',
        'en_summary':'Track client approval and missing assets as explicit states, not hidden notes, so schedule risk is visible before launch.',
        'ja_cost':'社内制作者だけでなく、外注・顧客をどの権限で参加させるかにより必要席数が変わります。ゲストと共有範囲を試用時に確認します。',
        'en_cost':'Required seats depend on how employees, contractors, and clients participate. Test guest access and sharing boundaries before selecting a plan.',
        'ja_workflow':'案件テンプレートへ要件、ページ一覧、素材、担当、期限、確認者、公開条件、保守開始日を登録し、案件ごとに複製します。',
        'en_workflow':'Create a reusable project template with requirements, page inventory, assets, owners, dates, approvers, launch criteria, and maintenance start date.',
        'ja_best':'複数案件を同時進行し、素材回収や確認待ちの抜け漏れを減らしたい制作会社・社内Web担当。',
        'en_best':'Agencies and internal web teams managing multiple concurrent projects with approval and asset dependencies.',
        'ja_caution':'ファイルの最終保管場所、契約書、パスワード、個人情報は専用の保管ルールを定め、ボードへ無制限に集約しないでください。',
        'en_caution':'Define separate storage rules for final files, contracts, passwords, and personal data instead of placing everything on the board.',
        'table_ja':[['工程','完了条件'],['要件定義','目的・対象・ページ・機能が確定'],['素材回収','使用許諾と不足素材が確認済み'],['制作','PC・スマホ表示と導線を確認'],['公開','ドメイン・計測・フォームを検証'],['保守移行','更新担当と受付範囲を文書化']],
        'table_en':[['Stage','Completion criterion'],['Requirements','Goals, audience, pages, and features approved'],['Assets','Usage rights and missing assets resolved'],['Production','Desktop, mobile, and journeys checked'],['Launch','Domain, analytics, and forms verified'],['Maintenance','Owner and support scope documented']],
    },
    {
        'slug':'monday-implementation-checklist','category':'business-software','topic':'project-management','type':'guide','product':'monday',
        'ja_title':'monday.com導入チェックリスト｜初期設定で決める15項目',
        'en_title':'monday.com Implementation Checklist: 15 Decisions Before Rollout',
        'ja_desc':'monday.com導入前に決める管理者、ボード構成、命名、権限、自動化、通知、保存、退職者対応をチェックリスト化します。',
        'en_desc':'A rollout checklist for administrators, board architecture, naming, permissions, automation, notifications, retention, and offboarding.',
        'ja_summary':'ツールの操作説明より先に、誰が設計を変更できるか、完了の定義、通知の基準、データの保管先を決めることが定着の条件です。',
        'en_summary':'Adoption depends less on feature training than on design ownership, completion definitions, notification rules, and data governance.',
        'ja_cost':'本番展開前に2週間程度の検証ボードを作り、利用人数と必要機能を確定してから契約します。最初から全社展開すると不要な席や複雑な設計が増えます。',
        'en_cost':'Run a limited pilot before full rollout to determine real seat and feature requirements. Starting company-wide can create unnecessary seats and overbuilt workflows.',
        'ja_workflow':'一つの定型業務を選び、入力、担当、期限、承認、完了、集計までを再現し、利用者と管理者の両方から改善点を回収します。',
        'en_workflow':'Select one repeatable process and test intake, ownership, dates, approval, completion, and reporting with both users and administrators.',
        'ja_best':'monday.comを契約したが、ボードが増え過ぎることや担当者依存を防ぎたい組織。',
        'en_best':'Organizations that want to prevent board sprawl and dependence on a single administrator.',
        'ja_caution':'個人情報、機密情報、削除権限、エクスポート、退職時の所有権移管を社内規程と合わせます。',
        'en_caution':'Align personal data, confidential information, deletion rights, export, and offboarding ownership with internal policy.',
        'table_ja':[['分類','決定事項'],['管理','管理責任者・変更権限・命名規則'],['運用','状態・完了条件・期限超過時の対応'],['通知','誰に何をいつ通知するか'],['データ','添付・個人情報・書き出し・削除'],['改善','月次レビューと不要ボードの整理']],
        'table_en':[['Area','Decision'],['Governance','Owner, change rights, naming'],['Operations','Status, completion, overdue response'],['Notifications','Who receives which alert and when'],['Data','Attachments, personal data, export, deletion'],['Improvement','Monthly review and board cleanup']],
    },
    {
        'slug':'google-workspace-pricing-small-business','category':'business-software','topic':'google-workspace','type':'guide','product':'workspace',
        'ja_title':'Google Workspaceの料金比較｜小規模企業はどのプランを選ぶ？',
        'en_title':'Google Workspace Pricing for Small Businesses: Which Plan Fits?',
        'ja_desc':'Google WorkspaceのStarter、Standard、Plusを、ストレージ、Meet、管理、セキュリティ、年間契約から比較します。',
        'en_desc':'Compare Google Workspace Starter, Standard, and Plus by storage, Meet, administration, security, and annual commitment.',
        'ja_summary':'少人数で独自ドメインメールと基本的な共同編集を始めるならStarter、容量・会議・共有運用を強化するならStandard、保持・高度な管理が必要ならPlusを検討します。',
        'en_summary':'Starter fits basic domain email and collaboration; Standard fits higher storage and meeting needs; Plus is for stronger retention and administration requirements.',
        'ja_cost':'日本向け公式ページでは年間プランと柔軟プランの価格が表示されます。ユーザー単位の月額だけでなく、退職者、共有アカウント、追加ストレージ、移行支援を含めて見積もります。',
        'en_cost':'Official pricing shows annual and flexible billing. Estimate not only monthly user fees but also leavers, shared identities, additional storage, and migration work.',
        'ja_workflow':'必要なメールアドレス数、Drive容量、会議人数、録画、保持、端末管理を一覧化し、各要件が含まれる最小プランを選びます。',
        'en_workflow':'List required mailboxes, Drive capacity, meeting size, recording, retention, and device controls, then select the lowest tier covering every mandatory requirement.',
        'ja_best':'独自ドメインGmail、Drive、Meet、カレンダー、ドキュメントを一つの管理画面で運用したい小規模企業。',
        'en_best':'Small businesses that want domain Gmail, Drive, Meet, Calendar, and documents under one administration console.',
        'ja_caution':'1人が複数アドレスを使う場合は、ユーザー、エイリアス、グループのどれで作るかにより費用と管理が変わります。',
        'en_caution':'Multiple addresses for one person may be users, aliases, or groups, with different cost and administration implications.',
        'table_ja':[['プラン','主な判断'],['Starter','独自ドメインメールと基本共同編集'],['Standard','容量・会議・共有運用を強化'],['Plus','保持・セキュリティ・高度な管理'],['Enterprise','大規模統制と個別要件']],
        'table_en':[['Plan','Primary decision'],['Starter','Domain email and core collaboration'],['Standard','More storage, meetings, and shared operations'],['Plus','Retention, security, and stronger administration'],['Enterprise','Large-scale governance and negotiated requirements']],
    },
    {
        'slug':'google-workspace-vs-microsoft-365-small-business','category':'business-software','topic':'productivity-suite','type':'comparison','product':'workspace',
        'ja_title':'Google WorkspaceとMicrosoft 365を比較｜小規模企業の選び方',
        'en_title':'Google Workspace vs Microsoft 365 for Small Businesses',
        'ja_desc':'Google WorkspaceとMicrosoft 365を、メール、共同編集、デスクトップアプリ、会議、ストレージ、管理から比較します。',
        'en_desc':'Compare Google Workspace and Microsoft 365 across email, collaboration, desktop apps, meetings, storage, and administration.',
        'ja_summary':'ブラウザ中心で共同編集を標準化するならGoogle Workspace、Excel・Word・PowerPointのデスクトップ運用と既存Office資産を重視するならMicrosoft 365が候補です。',
        'en_summary':'Google Workspace favors browser-first collaboration. Microsoft 365 favors desktop Office workflows and compatibility with existing Office assets.',
        'ja_cost':'ユーザー単価だけでなく、必要なOfficeアプリ、メール容量、会議、端末管理、既存データ移行、社内教育を含む3年間総額で比較します。',
        'en_cost':'Compare three-year total cost including desktop apps, mailbox capacity, meetings, device management, migration, and training—not only user price.',
        'ja_workflow':'同じ見積書、売上表、会議資料を両環境で共同編集し、外部共有、版管理、スマートフォン、オフライン利用を確認します。',
        'en_workflow':'Co-edit the same proposal, spreadsheet, and presentation, then test external sharing, version history, mobile use, and offline work.',
        'ja_best':'Googleはクラウド共同編集、MicrosoftはOfficeファイル互換とデスクトップ作業を優先する企業。',
        'en_best':'Google fits cloud-native collaboration; Microsoft fits organizations prioritizing Office file compatibility and desktop workflows.',
        'ja_caution':'両方を重複契約すると管理者、ID、ストレージ、情報共有ルールが二重化します。利用目的を分ける場合も責任範囲を定義します。',
        'en_caution':'Running both can duplicate identity, administration, storage, and sharing policy. Define ownership even when each suite has a separate role.',
        'table_ja':[['比較軸','Google Workspace','Microsoft 365'],['中心','ブラウザ共同編集','デスクトップOfficeとクラウド'],['メール','Gmail','Exchange Online・Outlook'],['会議','Google Meet','Microsoft Teams'],['向く運用','リンク共有と同時編集','Office形式と社内標準']],
        'table_en':[['Axis','Google Workspace','Microsoft 365'],['Center','Browser collaboration','Desktop Office plus cloud'],['Email','Gmail','Exchange Online and Outlook'],['Meetings','Google Meet','Microsoft Teams'],['Best fit','Link sharing and live coauthoring','Office formats and internal standards']],
        'extra_sources':[('Microsoft 365 business plan comparison','https://www.microsoft.com/ja-jp/microsoft-365/business/compare-all-microsoft-365-business-products')],
    },
    {
        'slug':'gmail-vs-google-workspace-business-email','category':'business-software','topic':'business-email','type':'comparison','product':'workspace',
        'ja_title':'無料GmailとGoogle Workspaceの違い｜会社メールはどちら？',
        'en_title':'Free Gmail vs Google Workspace for Business Email',
        'ja_desc':'無料GmailとGoogle Workspaceを、独自ドメイン、管理者、退職者対応、共有、セキュリティ、費用から比較します。',
        'en_desc':'Compare free Gmail and Google Workspace by custom domain, administration, offboarding, sharing, security, and cost.',
        'ja_summary':'個人のメール利用なら無料Gmail、会社名の独自ドメイン、管理者による発行・停止、組織データの管理が必要ならGoogle Workspaceが適しています。',
        'en_summary':'Free Gmail fits personal use. Google Workspace fits company-domain email, centralized provisioning, offboarding, and organizational data control.',
        'ja_cost':'Google Workspaceはユーザー単位の有料サービスです。infoや採用窓口は、別ユーザーにするかグループ・エイリアスにするかを整理すると過剰契約を防げます。',
        'en_cost':'Google Workspace is licensed per user. Decide whether addresses such as info or recruiting should be users, groups, or aliases to avoid unnecessary licenses.',
        'ja_workflow':'入社、異動、退職、パスワード紛失、共有ファイル所有者変更を想定し、管理者がどこまで操作できるかを確認します。',
        'en_workflow':'Test onboarding, role changes, offboarding, password recovery, and transfer of shared-file ownership from the administrator perspective.',
        'ja_best':'従業員や業務委託者へ会社管理のメールを発行し、退職時に停止・引継ぎを行いたい事業者。',
        'en_best':'Businesses that issue managed company email to employees or contractors and need controlled offboarding.',
        'ja_caution':'個人Gmailを業務利用すると、退職後のデータ回収、共有権限、本人確認、会社資産の所有権が曖昧になる場合があります。',
        'en_caution':'Personal Gmail use can complicate data recovery, sharing permissions, identity verification, and ownership of company information.',
        'table_ja':[['項目','無料Gmail','Google Workspace'],['ドメイン','gmail.com','会社の独自ドメイン'],['管理者','個人が管理','組織管理コンソール'],['退職者対応','本人依存','停止・データ移管を管理'],['用途','個人利用','会社・チーム運用']],
        'table_en':[['Item','Free Gmail','Google Workspace'],['Domain','gmail.com','Company custom domain'],['Administrator','Individual control','Organization admin console'],['Offboarding','Depends on the individual','Managed suspension and data transfer'],['Use','Personal','Company and team operations']],
    },
    {
        'slug':'google-workspace-domain-email-setup','category':'business-software','topic':'business-email','type':'guide','product':'workspace',
        'ja_title':'Google Workspaceで独自ドメインメールを設定する手順',
        'en_title':'How to Set Up Custom-Domain Email with Google Workspace',
        'ja_desc':'Google Workspace申込み、ドメイン所有権確認、MX、SPF、DKIM、DMARC、ユーザー作成、移行、テストの順序を解説します。',
        'en_desc':'A deployment sequence for signup, domain verification, MX, SPF, DKIM, DMARC, users, migration, and testing.',
        'ja_summary':'メール停止を避けるため、既存メールの確認、ユーザー一覧、DNS変更、受信テスト、送信認証、旧環境の停止を順序立てて進めます。',
        'en_summary':'Avoid mail disruption by sequencing current-system review, user inventory, DNS changes, receipt tests, authentication, and retirement of the old service.',
        'ja_cost':'ライセンス費用に加え、ドメイン管理、既存メール移行、初期設定、利用者教育、必要に応じた専門家支援を見積もります。',
        'en_cost':'Budget for licenses, domain administration, mailbox migration, setup, user training, and specialist support where required.',
        'ja_workflow':'切替前に全アドレスと転送設定を一覧化し、低リスクな時間帯にMXを変更します。SPF、DKIM、DMARCは送信元を確認して段階設定します。',
        'en_workflow':'Inventory every address and forward before changing MX in a low-risk window. Configure SPF, DKIM, and DMARC after identifying every legitimate sender.',
        'ja_best':'独自ドメインメールを新設する事業者、またはレンタルサーバーのメールから組織管理へ移行したい企業。',
        'en_best':'Businesses creating company email or migrating from hosting-provider mail to centralized administration.',
        'ja_caution':'DNSを誤ると受信できなくなる可能性があります。既存設定を保存し、切替前後の送受信テストと復旧手順を準備してください。',
        'en_caution':'Incorrect DNS can interrupt mail. Save the old configuration and prepare pre-change, post-change, and rollback tests.',
        'table_ja':[['順番','作業'],['1','現行メールとユーザーの棚卸し'],['2','申込みとドメイン所有権確認'],['3','ユーザー・グループ・エイリアス作成'],['4','MXと送信認証設定'],['5','外部・内部の送受信テスト'],['6','データ移行と旧環境停止']],
        'table_en':[['Order','Task'],['1','Inventory current mail and users'],['2','Subscribe and verify the domain'],['3','Create users, groups, and aliases'],['4','Configure MX and sender authentication'],['5','Test internal and external mail'],['6','Migrate data and retire the old system']],
        'extra_sources':[('Google Workspace Admin Help','https://support.google.com/a/answer/140034')],
    },
    {
        'slug':'shopify-pricing-total-cost-japan','category':'website-builders','topic':'ecommerce-platform','type':'guide','product':'shopify',
        'ja_title':'Shopifyの料金総額｜月額・決済・アプリ・テーマを計算',
        'en_title':'Shopify Total Cost: Plans, Payments, Apps, and Themes',
        'ja_desc':'Shopifyの月額、年払い、カード料率、外部決済手数料、アプリ、テーマ、POSを含む運用総額の考え方を解説します。',
        'en_desc':'Estimate Shopify total cost across plan fees, annual billing, card rates, third-party transaction fees, apps, themes, and POS.',
        'ja_summary':'公式の月額だけでは総額を判断できません。販売額に連動する決済費用と、固定費になるアプリ・テーマ・POS・制作保守を分けて計算します。',
        'en_summary':'The headline subscription is not the full cost. Separate variable payment costs from fixed apps, themes, POS, implementation, and maintenance.',
        'ja_cost':'日本向け公式ページではBasic、Grow、Advanced等の月払い・年払いと決済条件が案内されています。キャンペーン価格は終了する可能性があるため通常料金と更新条件を基準にします。',
        'en_cost':'Official Japan pricing lists monthly and annual options and payment conditions for core plans. Treat promotional pricing as temporary and budget using normal ongoing terms.',
        'ja_workflow':'月間売上、注文件数、平均客単価、海外カード比率、外部決済利用、必要アプリ、スタッフ数を入力し、12か月総額を試算します。',
        'en_workflow':'Model monthly revenue, order count, average order value, international-card mix, external payments, required apps, and staff accounts over twelve months.',
        'ja_best':'ECを事業の中心に置き、商品・注文・在庫・決済を一つの管理画面で拡張したい事業者。',
        'en_best':'Businesses that make commerce central and need scalable catalog, order, inventory, and payment operations.',
        'ja_caution':'アプリを追加するたびに固定費と運用依存が増えます。標準機能で代替できるか、解約時にデータを取り出せるか確認します。',
        'en_caution':'Each app adds recurring cost and operational dependency. Confirm whether native features are enough and how data can be exported when an app is removed.',
        'table_ja':[['費用','確認方法'],['プラン','月払い・年払い・通常料金'],['決済','国内・海外カードと外部決済条件'],['アプリ','必須と任意を分けて月額集計'],['テーマ','無料・有料と制作費'],['実店舗','POS Proや端末費用'],['運用','商品登録・改善・保守の工数']],
        'table_en':[['Cost','How to verify'],['Plan','Monthly, annual, and normal ongoing rate'],['Payments','Domestic, international, and external payment terms'],['Apps','Separate required and optional recurring fees'],['Theme','Free or paid theme plus implementation'],['Retail','POS Pro and hardware'],['Operations','Catalog work, optimization, and maintenance']],
    },
    {
        'slug':'shopify-vs-base-small-business','category':'website-builders','topic':'ecommerce-platform','type':'comparison','product':'shopify',
        'ja_title':'ShopifyとBASEを比較｜小規模ネットショップはどちら？',
        'en_title':'Shopify vs BASE for a Small Online Store',
        'ja_desc':'ShopifyとBASEを、初期費用、月額、販売手数料、決済、デザイン、拡張、海外販売から比較します。',
        'en_desc':'Compare Shopify and BASE by startup cost, subscription, sales fees, payments, design, extensibility, and international selling.',
        'ja_summary':'固定費を抑えて国内販売を小さく試すならBASE、本格的な在庫・販路・アプリ・海外販売まで拡張するならShopifyが候補です。',
        'en_summary':'BASE fits a low-fixed-cost domestic launch. Shopify fits a store expected to scale through inventory, channels, apps, and international commerce.',
        'ja_cost':'BASEはプランにより固定費と販売時の費用配分が異なり、Shopifyは月額プランと決済・外部決済・アプリ費用を組み合わせます。同じ売上条件で総額を比較します。',
        'en_cost':'BASE shifts cost between subscriptions and sale-related charges by plan. Shopify combines subscriptions, payments, third-party transaction conditions, and apps. Compare under the same sales scenario.',
        'ja_workflow':'商品30点を登録し、注文、在庫、クーポン、配送、返品、顧客連絡、売上集計までを両方で試します。',
        'en_workflow':'Load thirty sample products and test order handling, inventory, discounts, shipping, returns, customer communication, and reporting.',
        'ja_best':'BASEは個人・小規模の国内販売、Shopifyは成長前提のEC運用と複数チャネル販売。',
        'en_best':'BASE fits individual and small domestic sellers; Shopify fits growth-oriented commerce and multichannel operations.',
        'ja_caution':'無料または低固定費でも、売上に連動する手数料が総額へ与える影響を確認してください。',
        'en_caution':'A free or low-fixed-cost plan can still become expensive through sale-linked fees. Model realistic revenue before deciding.',
        'table_ja':[['比較軸','Shopify','BASE'],['開始','有料プラン前提の本格EC','低固定費で始めやすい'],['拡張','アプリ・販路・海外販売','国内の小規模販売を簡単に開始'],['費用','月額＋決済＋アプリ等','プラン別固定費＋販売関連費用'],['向く段階','成長・運用標準化','検証・小規模販売']],
        'table_en':[['Axis','Shopify','BASE'],['Start','Full commerce with a paid plan','Easy low-fixed-cost launch'],['Expansion','Apps, channels, international selling','Simple domestic small-store launch'],['Cost','Plan, payments, apps, and add-ons','Plan-specific fixed and sale-related fees'],['Stage','Growth and operational standardization','Validation and small-scale sales']],
        'extra_sources':[('BASE pricing','https://thebase.com/price/')],
    },
    {
        'slug':'shopify-vs-stores-small-business','category':'website-builders','topic':'ecommerce-platform','type':'comparison','product':'shopify',
        'ja_title':'ShopifyとSTORESを比較｜ECと店舗連携で選ぶ',
        'en_title':'Shopify vs STORES: Ecommerce Scale or Japanese Store Operations?',
        'ja_desc':'ShopifyとSTORESを、ネットショップ、決済、POS、予約、国内運用、拡張性から比較します。',
        'en_desc':'Compare Shopify and STORES across ecommerce, payments, POS, reservations, Japanese operations, and extensibility.',
        'ja_summary':'ECを中心に国内外へ拡張するならShopify、ネットショップと決済・POS・予約など国内店舗サービスをまとめて検討するならSTORESが候補です。',
        'en_summary':'Shopify fits commerce-led domestic and international growth. STORES fits Japanese operators evaluating ecommerce alongside payments, POS, and reservations.',
        'ja_cost':'STORESは利用するサービスごとに料金体系が分かれるため、ネットショップだけでなく決済・POS・予約の契約を含めて確認します。ShopifyもPOSやアプリを加えた総額で比較します。',
        'en_cost':'STORES pricing is separated by service, so include ecommerce, payments, POS, and reservations as applicable. Compare Shopify with POS and app costs included.',
        'ja_workflow':'オンライン注文、店頭在庫、店舗受取、顧客情報、予約または来店導線を一連の顧客体験として試します。',
        'en_workflow':'Test online ordering, store inventory, pickup, customer data, and reservation or visit journeys as one customer experience.',
        'ja_best':'ShopifyはEC成長、STORESは国内の小規模店舗が複数サービスを段階導入するケース。',
        'en_best':'Shopify fits commerce growth; STORES fits small Japanese stores adopting several local-business services in stages.',
        'ja_caution':'ブランド名が同じでも、STORESの各サービスは契約・データ・機能が完全に一体とは限りません。連携範囲を確認します。',
        'en_caution':'Products under the STORES brand may still have separate contracts, data, and feature boundaries. Verify actual integration coverage.',
        'table_ja':[['比較軸','Shopify','STORES'],['中心','ECプラットフォーム','国内店舗向け複数サービス'],['販売','国内外・複数チャネル','国内小規模事業者が始めやすい'],['店舗連携','Shopify POSを追加','決済・POS・予約を個別検討'],['拡張','アプリとAPI','日本向けサービスの分かりやすさ']],
        'table_en':[['Axis','Shopify','STORES'],['Center','Commerce platform','Multiple services for Japanese stores'],['Selling','Domestic, international, multichannel','Accessible for small Japanese businesses'],['Store operations','Add Shopify POS','Evaluate payments, POS, and booking services'],['Expansion','Apps and APIs','Straightforward Japan-focused services']],
        'extra_sources':[('STORES ecommerce pricing','https://stores.fun/ec/pricing')],
    },
    {
        'slug':'shopify-launch-checklist-small-store','category':'website-builders','topic':'ecommerce-platform','type':'guide','product':'shopify',
        'ja_title':'小規模店舗のShopify開設チェックリスト｜公開前に確認する項目',
        'en_title':'Shopify Launch Checklist for a Small Store',
        'ja_desc':'Shopify公開前に必要な商品、決済、配送、税、返品、ドメイン、法定表示、計測、テスト注文を整理します。',
        'en_desc':'A pre-launch checklist for catalog, payments, shipping, tax, returns, domain, legal pages, analytics, and test orders.',
        'ja_summary':'デザイン完成を公開条件にせず、テスト注文から返金まで一度通し、顧客へ表示される送料・納期・連絡先・返品条件を確認します。',
        'en_summary':'Do not treat design completion as launch readiness. Run a full test order through refund and verify customer-facing shipping, delivery, contact, and return terms.',
        'ja_cost':'月額だけでなく、決済、ドメイン、テーマ、アプリ、商品撮影、登録代行、配送資材、保守を初年度予算へ含めます。',
        'en_cost':'Include payments, domain, theme, apps, product photography, catalog work, packaging, and maintenance in the first-year budget.',
        'ja_workflow':'公開前チェックを商品、注文、配送、法務、集客、運用の6領域に分け、担当者と確認日を記録します。',
        'en_workflow':'Divide launch readiness into catalog, orders, shipping, legal, acquisition, and operations, with an owner and verification date for each item.',
        'ja_best':'初めてネットショップを公開する店舗、または担当者変更後も再現可能な運用手順を残したい事業者。',
        'en_best':'First-time online sellers and businesses that need repeatable operations after staff changes.',
        'ja_caution':'特定商取引法、プライバシー、返品、税務、表示義務は事業内容で異なります。必要に応じて専門家へ確認してください。',
        'en_caution':'Legal disclosures, privacy, returns, tax, and display obligations vary by business and jurisdiction. Obtain professional advice where needed.',
        'table_ja':[['領域','公開前確認'],['商品','価格・在庫・画像・説明・バリエーション'],['決済','利用手段・テスト注文・返金'],['配送','送料・地域・納期・追跡'],['法務','運営者情報・返品・プライバシー'],['集客','SEO・計測・SNS・メール'],['運用','受注担当・問い合わせ・障害対応']],
        'table_en':[['Area','Pre-launch check'],['Catalog','Price, inventory, images, descriptions, variants'],['Payments','Methods, test order, refund'],['Shipping','Rates, regions, delivery times, tracking'],['Legal','Operator, returns, privacy'],['Acquisition','SEO, analytics, social, email'],['Operations','Order owner, support, incident response']],
    },
    {
        'slug':'hubspot-free-crm-review-small-business','category':'business-software','topic':'crm','type':'review','product':'hubspot',
        'ja_title':'HubSpot無料CRMの評判・機能｜小規模企業で使える範囲',
        'en_title':'HubSpot Free CRM Review for Small Businesses',
        'ja_desc':'HubSpot無料CRMの顧客、会社、取引、タスク、メール、会議、フォーム、レポートと有料化判断を解説します。',
        'en_desc':'Review HubSpot Free CRM for contacts, companies, deals, tasks, email, meetings, forms, reporting, and upgrade decisions.',
        'ja_summary':'顧客・会社・取引をスプレッドシートから移し、営業履歴を共有する入口として有力です。高度な権限、自動化、重複管理、カスタムレポートが必要になった段階で有料版を検討します。',
        'en_summary':'It is a strong entry point for replacing sales spreadsheets with shared contact, company, and deal records. Upgrade when permissions, automation, deduplication, or custom reporting become mandatory.',
        'ja_cost':'無料CRMは有効期限のない無料利用として案内されていますが、機能・ユーザー・連絡先等の最新上限は公式画面で確認します。有料版は製品とシート、追加機能で総額が変わります。',
        'en_cost':'The free CRM is presented as free without trial expiration, but current limits must be checked. Paid cost depends on products, seats, and additional capabilities.',
        'ja_workflow':'既存顧客を少量インポートし、重複、担当、商談、メール記録、次回行動、レポートを1か月試します。',
        'en_workflow':'Import a small customer sample and test duplicates, ownership, deals, email logging, next actions, and reporting for one month.',
        'ja_best':'顧客台帳が複数ファイルに分散し、問い合わせから商談までの状況を共有できていない小規模企業。',
        'en_best':'Small businesses with fragmented customer spreadsheets and no shared view from inquiry to deal.',
        'ja_caution':'無料で始めても、将来必要な自動化やマーケティング連絡先の費用構造を確認し、データ設計を複雑にし過ぎないでください。',
        'en_caution':'Even when starting free, review future automation and marketing-contact cost drivers and avoid overcomplicating the data model.',
        'table_ja':[['領域','無料版で確認すること'],['顧客管理','コンタクト・会社・担当'],['営業','取引パイプライン・タスク・活動'],['連絡','メール記録・テンプレート・会議'],['集客','フォーム・チャット等の対象範囲'],['分析','標準レポートと必要な追加機能']],
        'table_en':[['Area','What to validate in Free'],['Customer data','Contacts, companies, ownership'],['Sales','Deal pipeline, tasks, activities'],['Communication','Email logging, templates, meetings'],['Acquisition','Available forms and chat'],['Analytics','Standard reports and missing advanced needs']],
    },
    {
        'slug':'hubspot-free-vs-starter','category':'business-software','topic':'crm','type':'comparison','product':'hubspot',
        'ja_title':'HubSpot無料版とStarterを比較｜有料化するタイミング',
        'en_title':'HubSpot Free vs Starter: When Is It Time to Upgrade?',
        'ja_desc':'HubSpot無料CRMとStarter Customer Platformを、ブランド表示、権限、複数通貨、必須項目、サポート、費用から比較します。',
        'en_desc':'Compare HubSpot Free and Starter by branding, permissions, currencies, required fields, support, and cost.',
        'ja_summary':'無料版で顧客台帳と商談管理を定着させ、ブランド表示の削除、権限、必須項目、複数通貨などが業務上必要になった時点でStarterを検討します。',
        'en_summary':'Establish CRM habits in Free, then consider Starter when branding removal, permissions, required fields, currencies, or broader tools become operational requirements.',
        'ja_cost':'Starterはキャンペーン価格が表示される場合があります。割引終了後、年間・月間の請求、必要シート、追加製品を含む通常総額で判断します。',
        'en_cost':'Starter may display promotional pricing. Decide using the normal ongoing total across annual or monthly billing, required seats, and any additional products.',
        'ja_workflow':'無料版で不足した機能を一覧化し、Starterへ上げることで削減できる作業時間と追加費用を比較します。',
        'en_workflow':'Document limitations encountered in Free and compare the operational time saved by Starter against its incremental cost.',
        'ja_best':'無料CRMが定着し、管理ルールや顧客対応の品質を一段上げたい小規模企業。',
        'en_best':'Small businesses with established CRM usage that now need stronger governance and customer-facing professionalism.',
        'ja_caution':'有料化しても上位エディション限定の自動化・レポートがあります。必要機能がStarterに含まれるか契約直前に確認します。',
        'en_caution':'Some automation and reporting remain limited to higher editions. Verify that Starter includes every required feature before purchase.',
        'table_ja':[['項目','無料','Starter'],['顧客・取引管理','基本機能を利用','無料機能を基盤に拡張'],['ブランド表示','対象機能で表示あり','削除対象を確認'],['権限・必須項目','制限あり','業務統制を強化'],['判断','まず定着を検証','不足機能が明確なら移行']],
        'table_en':[['Item','Free','Starter'],['Contacts and deals','Core capabilities','Builds on Free capabilities'],['Branding','Present in applicable tools','Check removal coverage'],['Permissions and required fields','Limited','Stronger workflow governance'],['Decision','Validate adoption first','Upgrade for clearly identified gaps']],
    },
    {
        'slug':'hubspot-vs-salesforce-small-business','category':'business-software','topic':'crm','type':'comparison','product':'hubspot',
        'ja_title':'HubSpotとSalesforceを比較｜小規模企業のCRM選び',
        'en_title':'HubSpot vs Salesforce for Small Businesses',
        'ja_desc':'HubSpotとSalesforceを、導入難易度、無料利用、営業管理、マーケティング、カスタマイズ、運用体制から比較します。',
        'en_desc':'Compare HubSpot and Salesforce by implementation effort, free entry, sales management, marketing, customization, and operating model.',
        'ja_summary':'早く顧客管理を始め、マーケティング・営業・サポートを段階拡張したい小規模企業はHubSpot、複雑な営業要件を専門体制で設計する企業はSalesforceが候補です。',
        'en_summary':'HubSpot fits small businesses seeking a faster start and staged expansion. Salesforce fits organizations prepared to design complex sales requirements with specialist administration.',
        'ja_cost':'ライセンス単価だけでなく、初期設計、移行、管理者、外部支援、追加製品、改修の費用を含めます。高機能なCRMほど運用設計コストが重要です。',
        'en_cost':'Include implementation, migration, administration, external support, add-on products, and change work—not only license price.',
        'ja_workflow':'同じ顧客項目、商談工程、承認、レポートを試作し、管理者が変更する手順と利用者が入力する負担を比較します。',
        'en_workflow':'Prototype the same customer fields, deal stages, approvals, and reports, then compare administrator change effort and user data-entry burden.',
        'ja_best':'HubSpotは小規模から段階導入、Salesforceは複雑な営業組織と高度なカスタマイズ。',
        'en_best':'HubSpot fits staged adoption from a small base; Salesforce fits complex sales organizations and advanced customization.',
        'ja_caution':'製品名だけで決めず、導入を維持する管理者と予算を確保できるか確認します。',
        'en_caution':'Do not select on brand recognition alone. Confirm the administrator capacity and budget required to sustain the implementation.',
        'table_ja':[['比較軸','HubSpot','Salesforce'],['開始','無料CRMから始めやすい','有料導入を前提に要件設計'],['操作','統一された画面で段階拡張','高い柔軟性と設定範囲'],['体制','少人数で始めやすい','管理者・パートナー体制が重要'],['向く企業','成長中の中小企業','複雑な営業・大規模組織']],
        'table_en':[['Axis','HubSpot','Salesforce'],['Start','Accessible from free CRM','Requirements-led paid implementation'],['Operation','Unified interface with staged expansion','High flexibility and configuration range'],['Team','Easier for a small initial team','Dedicated admin or partner is important'],['Best fit','Growing small and midsize businesses','Complex sales and larger organizations']],
        'extra_sources':[('Salesforce Sales Cloud pricing','https://www.salesforce.com/jp/sales/pricing/')],
    },
    {
        'slug':'crm-comparison-small-business-japan','category':'business-software','topic':'crm','type':'comparison','product':'hubspot',
        'ja_title':'中小企業向けCRM比較｜HubSpot・monday CRM・Salesforceの選び方',
        'en_title':'CRM Comparison for Small Businesses: HubSpot, monday CRM, and Salesforce',
        'ja_desc':'中小企業向けCRMを、無料入口、案件管理、マーケティング、カスタマイズ、導入体制、費用から比較します。',
        'en_desc':'Compare small-business CRM options by free entry, pipeline management, marketing, customization, implementation capacity, and cost.',
        'ja_summary':'顧客接点を一体化するHubSpot、柔軟な営業ボードを作るmonday CRM、高度な要件を専門体制で実装するSalesforceという役割の違いから選びます。',
        'en_summary':'Choose by operating model: HubSpot for unified customer interactions, monday CRM for configurable sales boards, and Salesforce for specialist-led complex requirements.',
        'ja_cost':'同じユーザー数だけでなく、マーケティング連絡先、外部支援、移行、カスタム開発、管理者工数を含む年間総額を比較します。',
        'en_cost':'Compare annual total cost including marketing contacts, external services, migration, customization, and administrator time—not only user count.',
        'ja_workflow':'問い合わせから成約、継続対応までの標準フローを図にし、必要な入力項目、通知、承認、分析を候補製品で再現します。',
        'en_workflow':'Map the standard journey from inquiry through sale and retention, then reproduce required fields, alerts, approvals, and reporting in each candidate.',
        'ja_best':'CRMを初めて導入し、製品機能より自社の営業・顧客対応プロセスを先に整理したい企業。',
        'en_best':'Businesses selecting their first CRM and willing to define sales and customer-service processes before choosing software.',
        'ja_caution':'CRMは入力されなければ機能しません。項目数を絞り、責任者と週次確認を決めてから全社展開します。',
        'en_caution':'A CRM has no value without consistent data entry. Limit fields, assign ownership, and establish weekly review before broad rollout.',
        'table_ja':[['製品','主な適性','導入時の重点'],['HubSpot CRM','顧客接点の一体管理','データ設計とハブ拡張'],['monday CRM','柔軟な案件フロー','ボード統制と運用ルール'],['Salesforce','複雑な営業要件','専門管理者と設計予算']],
        'table_en':[['Product','Primary fit','Implementation focus'],['HubSpot CRM','Unified customer interactions','Data model and hub expansion'],['monday CRM','Flexible pipeline workflows','Board governance and operating rules'],['Salesforce','Complex sales requirements','Specialist administration and design budget']],
        'extra_sources':[('monday CRM','https://monday.com/crm'),('Salesforce Sales Cloud pricing','https://www.salesforce.com/jp/sales/pricing/')],
    },
    {
        'slug':'hostinger-pricing-renewal-cost-japan','category':'hosting-security','topic':'web-hosting','type':'guide','product':'hostinger',
        'ja_title':'Hostingerの料金と更新費用｜長期契約の総額を確認',
        'en_title':'Hostinger Pricing and Renewal Cost: Calculate the Full Commitment',
        'ja_desc':'Hostingerの初回割引、48か月前払い、更新価格、サイト数、容量、バックアップ、ドメイン、メールを整理します。',
        'en_desc':'Review Hostinger introductory discounts, multi-year prepayment, renewal prices, sites, storage, backups, domain, and email.',
        'ja_summary':'表示される月額換算は長期前払いの初回割引である場合があります。契約時の一括総額、更新単価、無料特典の対象期間を分けて確認します。',
        'en_summary':'The displayed monthly equivalent may be an introductory multi-year rate. Separate upfront total, renewal rate, and the duration of free benefits.',
        'ja_cost':'日本向け公式料金では契約期間ごとの割引と更新価格が案内されています。月額換算だけでなく、初回一括額と次回更新額を並べて予算化します。',
        'en_cost':'Official Japan pricing shows term-based discounts and renewal rates. Budget the upfront payment and the next renewal amount side by side.',
        'ja_workflow':'必要サイト数、容量、バックアップ頻度、メール、データセンター、WordPress移行を整理し、過剰な長期契約を避けます。',
        'en_workflow':'Define site count, storage, backup frequency, email, data center, and WordPress migration needs before accepting a long commitment.',
        'ja_best':'低い初回費用で複数のWeb機能をまとめ、長期運用の更新費用も管理できる個人・小規模事業。',
        'en_best':'Individuals and small businesses that value a low introductory rate and can manage renewal planning for a long-term site.',
        'ja_caution':'無料ドメインやメール等は対象期間・プランが限定される場合があります。解約・返金対象外も含め公式条件を確認します。',
        'en_caution':'Free domain or email benefits may be limited by plan and duration. Confirm refund exclusions and cancellation terms.',
        'table_ja':[['費用項目','確認'],['初回価格','割引率と契約月数'],['支払額','月額換算ではなく一括総額'],['更新価格','次回更新時の月額・総額'],['特典','ドメイン・メールの無料期間'],['運用','バックアップ・移行・サポート']],
        'table_en':[['Cost item','Check'],['Introductory price','Discount and commitment length'],['Payment','Upfront total, not only monthly equivalent'],['Renewal','Next-term monthly rate and total'],['Benefits','Free domain and email duration'],['Operations','Backups, migration, and support']],
    },
    {
        'slug':'hostinger-vs-xserver-small-business','category':'hosting-security','topic':'web-hosting','type':'comparison','product':'hostinger',
        'ja_title':'Hostingerとエックスサーバーを比較｜小規模事業のサーバー選び',
        'en_title':'Hostinger vs XServer for a Small Business Website',
        'ja_desc':'Hostingerとエックスサーバーを、初回・更新料金、管理画面、国内サポート、WordPress、バックアップ、海外配信から比較します。',
        'en_desc':'Compare Hostinger and XServer by introductory and renewal pricing, control panel, Japanese support, WordPress, backups, and international delivery.',
        'ja_summary':'低い初回価格と海外拠点を含む柔軟な構成を重視するならHostinger、日本語運用と国内向けWordPressサイトの実績・サポートを重視するならエックスサーバーが候補です。',
        'en_summary':'Hostinger fits buyers prioritizing low introductory cost and international infrastructure. XServer fits Japan-focused WordPress operations and Japanese administration.',
        'ja_cost':'Hostingerは長期前払いと更新価格、エックスサーバーは契約期間別料金とキャンペーンを分け、3年または4年の総額で比較します。',
        'en_cost':'Separate Hostinger multi-year introductory and renewal pricing from XServer term pricing and campaigns, then compare over three or four years.',
        'ja_workflow':'同じWordPressサイトを想定し、初期設定、SSL、メール、バックアップ復元、移行、問い合わせを比較します。',
        'en_workflow':'Use the same WordPress workload to compare setup, SSL, email, backup restoration, migration, and support contact.',
        'ja_best':'Hostingerは海外向け・価格重視、エックスサーバーは日本語サポートと国内事業サイト重視。',
        'en_best':'Hostinger fits international and price-sensitive projects; XServer fits Japan-focused business sites and Japanese support.',
        'ja_caution':'速度はサイト構成、地域、キャッシュ、画像、プラグインで変わります。広告上の速度表現だけで判断せず、実サイトを測定します。',
        'en_caution':'Performance depends on region, caching, images, plugins, and application design. Test a representative site instead of relying on headline speed claims.',
        'table_ja':[['比較軸','Hostinger','エックスサーバー'],['料金','長期初回割引と更新差を確認','契約期間・キャンペーンを確認'],['管理','hPanel','サーバーパネル'],['地域','海外展開も検討しやすい','国内向け運用と日本語支援'],['向く用途','価格重視・海外向け','国内法人・店舗サイト']],
        'table_en':[['Axis','Hostinger','XServer'],['Pricing','Check long introductory term and renewal gap','Check term pricing and campaigns'],['Control','hPanel','Server Panel'],['Region','Convenient for international projects','Japan-focused operations and support'],['Best fit','Price-sensitive or international','Japanese business and local-store sites']],
        'extra_sources':[('XServer pricing','https://www.xserver.ne.jp/price/')],
    },
    {
        'slug':'hostinger-overseas-website-guide','category':'hosting-security','topic':'web-hosting','type':'guide','product':'hostinger',
        'ja_title':'海外向けWebサイトにHostingerを使う判断ポイント',
        'en_title':'Using Hostinger for an International Website: Decision Guide',
        'ja_desc':'海外向けサイトでHostingerを選ぶ際のデータセンター、CDN、言語、ドメイン、メール、バックアップ、サポートを解説します。',
        'en_desc':'Evaluate Hostinger for an international site by data center, CDN, language, domain, email, backups, and support.',
        'ja_summary':'海外向けだから海外サーバーが必ず最適とは限りません。主な訪問地域、管理者の言語、決済・法務、障害対応、データ移行を含めて判断します。',
        'en_summary':'An international audience does not automatically make overseas hosting the best choice. Evaluate visitor regions, administrator language, legal needs, incident response, and migration.',
        'ja_cost':'長期割引に加え、多言語制作、翻訳、CDN、メール、ドメイン、監視、保守の費用を含めます。サーバー料金は海外展開費用の一部です。',
        'en_cost':'Include localization, translation, CDN, email, domain, monitoring, and maintenance. Hosting is only one component of international expansion cost.',
        'ja_workflow':'対象国ごとに表示速度、問い合わせ、時差、個人情報、決済、検索エンジン、バックアップ復元を検証します。',
        'en_workflow':'Test performance, inquiries, time-zone operations, personal data, payments, search visibility, and recovery for each target region.',
        'ja_best':'日本以外の顧客を対象に、多言語サイトや海外向けサービスページを小さく検証したい事業者。',
        'en_best':'Businesses validating multilingual pages or services for customers outside Japan.',
        'ja_caution':'データ保管場所や個人情報規制は対象地域と業種で異なります。必要に応じて法務・セキュリティの専門家へ確認します。',
        'en_caution':'Data-location and privacy obligations vary by region and industry. Seek legal or security advice where necessary.',
        'table_ja':[['項目','確認内容'],['訪問地域','主な国と遅延'],['運用言語','管理画面・サポート・担当者'],['データ','保管地域・バックアップ・復旧'],['集客','hreflang・地域ドメイン・検索意図'],['顧客対応','時差・フォーム・メール・障害連絡']],
        'table_en':[['Item','Check'],['Audience region','Primary countries and latency'],['Operating language','Control panel, support, administrators'],['Data','Location, backups, recovery'],['Acquisition','hreflang, regional domains, search intent'],['Customer support','Time zones, forms, email, incidents']],
    },
]


def sources_for(record, language):
    p = PRODUCTS[record['product']]
    sources = [{'label': label, 'url': url} for label, url in p['sources']]
    if record.get('second'):
        sources += [{'label': label, 'url': url} for label, url in PRODUCTS[record['second']]['sources']]
    sources += [{'label': label, 'url': url} for label, url in record.get('extra_sources', [])]
    out=[]; seen=set()
    for s in sources:
        if s['url'] not in seen:
            seen.add(s['url']); out.append(s)
    return out


def make_article(record, lang):
    ja = lang == 'ja'
    title = record['ja_title'] if ja else record['en_title']
    desc = record['ja_desc'] if ja else record['en_desc']
    summary = record['ja_summary'] if ja else record['en_summary']
    cost = record['ja_cost'] if ja else record['en_cost']
    workflow = record['ja_workflow'] if ja else record['en_workflow']
    best = record['ja_best'] if ja else record['en_best']
    caution = record['ja_caution'] if ja else record['en_caution']
    table = record['table_ja'] if ja else record['table_en']
    p = PRODUCTS[record['product']]
    ctas=[{
        'label': (f"{p['name']}の公式料金・機能を確認" if ja else f"Check {p['name']} pricing and features"),
        'officialUrl': p['url_ja'] if ja else p['url_en'],
        'affiliateKey': p['key'],
    }]
    if record.get('second'):
        p2=PRODUCTS[record['second']]
        ctas.append({
            'label': (f"{p2['name']}の公式情報を確認" if ja else f"Check {p2['name']} official information"),
            'officialUrl': p2['url_ja'] if ja else p2['url_en'],
            'affiliateKey': p2['key'],
        })
    sections = [
        {
            'heading': '結論' if ja else 'Bottom line',
            'body': [summary,
                ('選定では知名度や表示価格だけでなく、実際の利用人数、日常業務、管理者の負担、データ移行、解約時の取り出しまで同じ条件で確認してください。' if ja else 'Do not decide on brand recognition or headline price alone. Compare real users, daily workflows, administrator effort, migration, and exit or export requirements under the same conditions.')],
            'callout': ('公式条件は変更されるため、申込み直前に料金画面と利用規約を再確認してください。' if ja else 'Terms can change. Recheck the official pricing page and agreement immediately before purchase.'),
        },
        {
            'heading': '料金と契約条件' if ja else 'Pricing and contract terms',
            'body': [cost,
                ('初回割引がある場合は割引期間と通常料金を分け、月額換算ではなく請求時の総額を記録します。アプリ、外部連携、移行、制作、保守などの付帯費用も別行で管理すると比較しやすくなります。' if ja else 'When introductory pricing applies, separate the promotional period from normal pricing and record the actual invoiced total. Track apps, integrations, migration, implementation, and maintenance as separate cost lines.')],
            'table': {'headers': table[0], 'rows': table[1:]},
        },
        {
            'heading': '実際の業務で試す方法' if ja else 'How to test with real work',
            'body': [workflow,
                ('試用ではサンプル画面を見るだけでなく、入力から完了、修正、承認、書き出しまで一度通します。担当者と管理者の双方で操作し、迷った箇所と追加設定に必要な時間を記録してください。' if ja else 'Do more than view sample screens. Complete the full path from input through completion, revision, approval, and export. Test as both an end user and administrator and record confusion points and setup time.')],
            'bullets': ([
                '同じ利用人数とデータ件数で候補を試す',
                '必須機能と便利機能を分ける',
                '通知・権限・自動化を実際に設定する',
                'CSV等の書き出しと解約手順を確認する',
                '年間総額と担当者工数を記録する',
            ] if ja else [
                'Use the same user and data volume for every candidate',
                'Separate mandatory from optional capabilities',
                'Configure notifications, permissions, and automation',
                'Test CSV or other export and cancellation procedures',
                'Record annual total cost and staff effort',
            ]),
        },
        {
            'heading': '向いている事業者' if ja else 'Best fit',
            'body': [best,
                ('一方、業務フローが未整理のまま高機能なサービスを導入すると、入力項目や通知が増え、定着しない場合があります。先に現状の手順と責任者を一枚に整理してから設定してください。' if ja else 'A feature-rich service can fail when the underlying process is undefined. Map the current workflow and ownership on one page before configuring the product.')],
        },
        {
            'heading': '注意点と失敗を防ぐ方法' if ja else 'Cautions and failure prevention',
            'body': [caution,
                ('個人情報や顧客データを扱う場合は、アクセス権、二要素認証、退職者対応、保存期間、削除、バックアップを運用ルールに含めます。担当者が変わっても継続できるよう、設定理由と定期確認日を残してください。' if ja else 'When customer or personal data is involved, include access control, multifactor authentication, offboarding, retention, deletion, and backup in the operating policy. Document design decisions and review dates so the system survives staff changes.')],
        },
        {
            'heading': '導入手順' if ja else 'Implementation sequence',
            'body': [
                ('最初に対象業務、利用者、責任者、成功条件を決めます。次に小さな検証環境を作り、2週間から1か月運用してから、不要項目を削除し、本番データを移行します。' if ja else 'Define the target workflow, users, owner, and success criteria first. Build a small pilot, run it for two to four weeks, remove unnecessary fields, and only then migrate production data.'),
                ('本番開始後は、30日後に利用状況、未入力、重複作業、通知過多、費用を確認します。契約更新の60日以上前にも同じ確認を行い、継続、プラン変更、代替サービスへの移行を判断します。' if ja else 'After launch, review usage, missing data, duplicated work, excessive notifications, and cost after 30 days. Repeat at least 60 days before renewal to decide whether to continue, change tier, or migrate.')
            ],
            'bullets': ([
                '目的と対象業務を一つに絞る',
                '必要データと権限を定義する',
                '少人数で試用する',
                '費用・工数・成果を記録する',
                '本番移行後に定期レビューする',
            ] if ja else [
                'Limit the initial objective and workflow',
                'Define required data and permissions',
                'Pilot with a small group',
                'Record cost, effort, and outcome',
                'Review regularly after production launch',
            ]),
        },
    ]
    faqs = [
        {
            'question': ('審査前でも公式リンクで記事を公開できますか？' if ja else 'Can this article be published before affiliate approval?'),
            'answer': ('はい。現在は公式サイトへの通常リンクとして公開し、提携承認後に設定ファイルへ正式な広告リンクを登録する構成です。承認前に広告提携済みと誤認させる表示は行いません。' if ja else 'Yes. The page uses a normal official link until approval. After approval, the verified affiliate URL can be added to the central configuration without claiming a relationship beforehand.'),
        },
        {
            'question': ('料金は記事の表示だけで判断できますか？' if ja else 'Can I decide using the price shown in the article?'),
            'answer': ('できません。料金、割引、機能、契約期間、税、対象地域は変更されるため、契約直前に公式料金画面と申込み画面を確認してください。' if ja else 'No. Pricing, promotions, features, billing terms, tax, and regional availability change. Verify the official pricing and checkout pages immediately before purchase.'),
        },
        {
            'question': ('導入で最も重要なことは何ですか？' if ja else 'What matters most during implementation?'),
            'answer': ('ツールの機能数ではなく、対象業務、入力責任者、完了条件、権限、定期確認を明文化し、小さな試用で再現することです。' if ja else 'Define the workflow, data owner, completion criteria, permissions, and review process, then reproduce them in a small pilot instead of choosing by feature count.'),
        },
    ]
    return {
        'id': f"{record['slug']}-{lang}",
        'translationKey': record['slug'],
        'language': lang,
        'type': record['type'],
        'status': 'published',
        'slug': record['slug'],
        'category': record['category'],
        'topic': record['topic'],
        'badge': '公式情報ガイド' if ja else 'Official-source guide',
        'title': title,
        'metaTitle': title,
        'description': desc,
        'lead': summary,
        'publishedAt': DATE,
        'updatedAt': DATE,
        'verifiedAt': DATE,
        'author': 'Luqevora.com編集部' if ja else 'Luqevora.com Editorial Team',
        'featured': False,
        'affiliateDisclosure': False,
        'ctas': ctas,
        'sources': sources_for(record, lang),
        'sections': sections,
        'faqs': faqs,
    }

for rec in RECORDS:
    for lang in ('ja','en'):
        out = ROOT / 'content' / 'articles' / lang / f"{rec['slug']}.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(make_article(rec, lang), ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# Add missing product profiles for the comparison database.
profile_path = ROOT / 'content/article-batches/product-profiles-expansion.json'
profiles = json.loads(profile_path.read_text(encoding='utf-8'))
profiles['google-workspace'] = {
    'name':'Google Workspace','affiliateKey':'google-workspace','category':'business-software','topic':'google-workspace',
    'sources':[{'label':'Google Workspace pricing','url':'https://workspace.google.com/pricing?hl=ja'},{'label':'Google Workspace business','url':'https://workspace.google.com/intl/ja/business/'}],
    'positioning':{'ja':'独自ドメインGmail、Drive、Meet、カレンダー、共同編集、管理を統合する業務スイート','en':'A business suite combining domain Gmail, Drive, Meet, Calendar, collaboration, and administration'},
    'pricing':{'ja':'ユーザー単位。Starter、Standard、Plus等を年間・柔軟プランで比較','en':'Per-user pricing across Starter, Standard, Plus, and other editions with annual or flexible billing'},
    'pricingDetail':{'ja':'必要ユーザー、ストレージ、会議、保持、管理機能に加え、移行と退職者データの運用を含めて総額を確認します。','en':'Estimate users, storage, meetings, retention, administration, migration, and offboarding operations together.'},
    'workflow':{'ja':'組織アカウントでメール、ファイル、会議、予定、文書を共有し、管理者が発行・停止・権限を管理します。','en':'Organization accounts share email, files, meetings, calendars, and documents while administrators manage provisioning and access.'},
    'bestFor':{'ja':'独自ドメインメールとクラウド共同編集を一つの管理基盤へまとめたい組織','en':'Organizations centralizing domain email and cloud collaboration'},
    'strengths':{'ja':['Gmailと共同編集','一元的なアカウント管理','Meet・Drive・カレンダー連携'],'en':['Gmail and live collaboration','Centralized account administration','Integrated Meet, Drive, and Calendar']},
    'limits':{'ja':['ユーザー単位課金','DNS・移行の初期設定','退職者と共有データの運用が必要'],'en':['Per-user licensing','DNS and migration setup','Offboarding and shared-data governance required']},
}
profiles['hubspot-crm'] = {
    'name':'HubSpot CRM','affiliateKey':'hubspot-crm','category':'business-software','topic':'crm',
    'sources':[{'label':'HubSpot CRM Japan','url':'https://www.hubspot.jp/products/crm'},{'label':'HubSpot free CRM','url':'https://www.hubspot.com/products/crm?software=crm'}],
    'positioning':{'ja':'顧客、会社、取引、マーケティング、営業、サポートのデータをつなぐCRM基盤','en':'A CRM platform connecting contacts, companies, deals, marketing, sales, and service data'},
    'pricing':{'ja':'無料CRMから開始し、Starter、Professional、Enterprise等へ機能拡張','en':'Start with free CRM and expand into Starter, Professional, Enterprise, and additional products'},
    'pricingDetail':{'ja':'シート、製品、マーケティング連絡先、追加機能、導入支援を分けて見積もります。','en':'Estimate seats, products, marketing contacts, add-ons, and implementation services separately.'},
    'workflow':{'ja':'問い合わせから顧客・会社・商談・活動を一つの履歴へ集約し、マーケティング・営業・サポートへ引き継ぎます。','en':'Centralize inquiries, contacts, companies, deals, and activities, then connect marketing, sales, and service workflows.'},
    'bestFor':{'ja':'顧客情報と営業活動をスプレッドシートから移し、段階的に機能を拡張したい企業','en':'Businesses replacing sales spreadsheets and expanding customer operations in stages'},
    'strengths':{'ja':['期限なしの無料CRM入口','顧客データ中心の統合','段階的な製品拡張'],'en':['Free CRM entry point','Customer-data-centered integration','Staged product expansion']},
    'limits':{'ja':['上位機能の費用構造','マーケティング連絡先等の課金確認','導入支援は別パートナー制度を確認'],'en':['Higher-tier cost structure','Marketing contact and other billing drivers','Client implementation may require a different partner program']},
}
profile_path.write_text(json.dumps(profiles, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# Affiliate application and link-switch registry. No unapproved tracking URL is stored.
prospects = {
    'version':'4.3.0','verifiedAt':DATE,
    'policy':'Before approval, articles use official links. Add only network-issued tracking URLs after approval and retain the disclosure and sponsored rel attributes.',
    'programs':[
        {'key':'monday-com','name':'monday.com','status':'application-pending','officialProgram':'https://monday.com/affiliate-program','network':'PartnerStack','articleCount':5},
        {'key':'google-workspace','name':'Google Workspace','status':'not-applied','officialProgram':'https://workspace.google.com/intl/ja/referral-program/','network':'Google referral program','articleCount':4},
        {'key':'shopify','name':'Shopify','status':'not-applied','officialProgram':'https://www.shopify.com/jp/affiliates','network':'Impact','articleCount':4},
        {'key':'hubspot-crm','name':'HubSpot','status':'not-applied','officialProgram':'https://www.hubspot.com/partners/affiliates','network':'Impact','articleCount':4},
        {'key':'hostinger','name':'Hostinger','status':'not-applied','officialProgram':'https://www.hostinger.com/jp/affiliates','network':'Hostinger affiliate platform','articleCount':3},
    ],
    'switchExample': {'key':'monday-com','entry':{'type':'url','network':'PartnerStack','url':'PASTE_NETWORK_ISSUED_HTTPS_URL_HERE'}}
}
(ROOT/'content/config/affiliate-prospects.json').write_text(json.dumps(prospects, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')

# Make all 40 pages explicitly indexable.
seo_path=ROOT/'content/config/seo.json'
seo=json.loads(seo_path.read_text(encoding='utf-8'))
include=seo['indexing']['includeSourceFiles']
for rec in RECORDS:
    for lang in ('ja','en'):
        rel=f"content/articles/{lang}/{rec['slug']}.json"
        if rel not in include: include.append(rel)
seo_path.write_text(json.dumps(seo, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')

# Show LuQvia only on relevant Japanese comparison pages.
luq_path=ROOT/'content/config/luqvia-service.json'
luq=json.loads(luq_path.read_text(encoding='utf-8'))
luq['version']='4.3.0'
existing={(x['category'],x['slug']) for x in luq['targetArticles']}
for rec in RECORDS:
    if rec['type']=='comparison':
        key=(rec['category'],rec['slug'])
        if key not in existing:
            luq['targetArticles'].append({'category':rec['category'],'slug':rec['slug']}); existing.add(key)
luq_path.write_text(json.dumps(luq, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')

# Version metadata.
site_path=ROOT/'content/config/site.json'
site=json.loads(site_path.read_text(encoding='utf-8')); site['assetVersion']='6.3.0'; site['defaultVerifiedAt']=DATE
site_path.write_text(json.dumps(site, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
pkg_path=ROOT/'package.json'; pkg=json.loads(pkg_path.read_text(encoding='utf-8')); pkg['version']='4.3.0'; pkg['scripts']['qa:v43']='node scripts/qa-v43-business-saas.mjs'; pkg['scripts']['check']=pkg['scripts']['check']+' && npm run qa:v43'
pkg_path.write_text(json.dumps(pkg, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')

# Release article map.
lines=['# Business SaaS Affiliate Expansion v4.3','',f'Verified: {DATE}','',
       'These pages use official links until each affiliate or referral application is approved. No unapproved tracking URL is included.','',
       '| Program | Japanese URL | English URL |','|---|---|---|']
for rec in RECORDS:
    name=PRODUCTS[rec['product']]['name']
    lines.append(f"| {name} | https://luqevora.com/ja/{rec['category']}/{rec['slug']}/ | https://luqevora.com/en/{rec['category']}/{rec['slug']}/ |")
lines += ['', '## Approval workflow','',
          '1. Publish the official-link version and submit the most relevant URLs with the application.',
          '2. After approval, copy the exact network-issued HTTPS tracking URL.',
          '3. Add a URL entry under the matching key in `content/config/affiliates.json`.',
          '4. Run `npm run check`; the page then renders disclosure and sponsored link attributes automatically.',
          '5. Record the placement URL in the network dashboard when requested.','']
(ROOT/'docs/BUSINESS_SAAS_AFFILIATE_V4.3.md').write_text('\n'.join(lines),encoding='utf-8')

# README release note.
readme=ROOT/'README.md'; old=readme.read_text(encoding='utf-8')
header='''## Business SaaS Affiliate Expansion v4.3.0\n\nv4.3.0 adds 20 high-intent bilingual article pairs for monday.com, Google Workspace, Shopify, HubSpot CRM, and Hostinger. All pages publish with official links before approval and can switch to verified affiliate URLs through the central affiliate configuration. The release also adds Google Workspace and HubSpot CRM product profiles, an application-status registry, explicit indexing, LuQvia integration on relevant comparison pages, and release-specific QA. See `docs/BUSINESS_SAAS_AFFILIATE_V4.3.md`.\n\n'''
readme.write_text(header+old,encoding='utf-8')

print(f'Created {len(RECORDS)} bilingual article pairs ({len(RECORDS)*2} files).')
