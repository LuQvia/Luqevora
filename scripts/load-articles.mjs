import path from 'node:path';
import {root, readJson, walk} from './lib.mjs';

const expansionRoot = path.join(root, 'content/article-batches');
const site = await readJson(path.join(root, 'content/config/site.json'));
const defaultVerifiedAt = site.defaultVerifiedAt;

function choose(language, japanese, english) {
  return language === 'ja' ? japanese : english;
}

function englishTitleCase(value) {
  const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
  return String(value).split(' ').map((word, index) => {
    if (index > 0 && minorWords.has(word.toLowerCase())) return word.toLowerCase();
    return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
  }).join(' ');
}

function englishSentenceFragment(value) {
  const text = String(value);
  const firstWord = (text.match(/^[A-Za-z-]+/) || [''])[0];
  if (/[A-Z]/.test(firstWord.slice(1))) return text;
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function verificationDateLabel(date, language) {
  const [year, month, day] = String(date).split('-').map(Number);
  if (!year || !month || !day) return date;
  if (language === 'ja') return `${year}年${month}月${day}日`;
  return new Intl.DateTimeFormat('en', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'})
    .format(new Date(Date.UTC(year, month - 1, day)));
}

function uniqueSources(sources) {
  const seen = new Set();
  return sources.filter(source => {
    if (!source?.url || seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

function relatedLinks(routes = [], language) {
  return routes.map(route => ({
    label: route.label?.[language] || route.label?.en || route.slug,
    url: `/${language}/${route.category}/${route.slug}/`,
    description: route.description?.[language] || route.description?.en || ''
  }));
}

function comparisonPlanChecks(category, language) {
  const checks = {
    'ai-tools': {
      ja: ['月払い・年払いとAIクレジットの総額', 'モデル、メッセージ、ファイル処理の利用上限', '入力データの学習利用、保持期間、管理設定', 'API、外部連携、チーム機能の追加料金'],
      en: ['Monthly and annual totals, including AI credits', 'Model, message, and file-processing limits', 'Training use, retention, and controls for submitted data', 'Extra charges for APIs, integrations, and team features']
    },
    'website-builders': {
      ja: ['初回・更新料金と決済手数料の総額', 'サイト数、商品数、容量、通信量の上限', '独自ドメイン、テーマ、アプリの追加費用', 'コンテンツ・商品・顧客データの書き出し範囲'],
      en: ['Introductory and renewal totals, including transaction fees', 'Limits for sites, products, storage, and traffic', 'Extra costs for domains, themes, and apps', 'Export coverage for content, products, and customer data']
    },
    'seo-marketing': {
      ja: ['月払い・年払いと追加機能の総額', 'プロジェクト、キーワード、クロール、送信数の上限', 'データ更新頻度、履歴、地域データの範囲', 'ユーザー追加、レポート、API、書き出し条件'],
      en: ['Monthly and annual totals, including add-ons', 'Limits for projects, keywords, crawls, and sends', 'Data refresh frequency, history, and regional coverage', 'Terms for extra users, reports, APIs, and exports']
    },
    'business-software': {
      ja: ['月払い・年払いと最低契約席数', 'メンバー、ゲスト、容量、自動化の上限', '権限、監査、SSOなど管理機能のプラン差', '連携、書き出し、解約後のデータ保持条件'],
      en: ['Monthly and annual totals, including minimum seat commitments', 'Limits for members, guests, storage, and automations', 'Plan differences for permissions, audit controls, and SSO', 'Integration, export, and post-cancellation retention terms']
    },
    'hosting-security': {
      ja: ['初回・更新料金と契約期間の総額', 'サイト、容量、通信量、端末、ユーザーの上限', 'バックアップ、復元、移行の対象範囲', 'セキュリティ機能、超過料金、サポート条件'],
      en: ['Introductory and renewal totals for the full commitment', 'Limits for sites, storage, traffic, devices, or users', 'Coverage for backups, restoration, and migration', 'Security features, overage charges, and support terms']
    }
  };
  return checks[category]?.[language] || checks['business-software'][language];
}

function comparisonTrialChecks(category, language) {
  const checks = {
    'ai-tools': {
      ja: ['機密情報を除いた同じプロンプト・ファイルで試す', '出典、計算、固有名詞を原典と照合する', '履歴、共有、削除、学習利用の設定を確認する', '必要なモデルと機能の利用上限を記録する', '管理者と一般利用者の両方で操作する'],
      en: ['Use the same non-sensitive prompts and files in both products', 'Verify citations, calculations, and named entities against primary sources', 'Test history, sharing, deletion, and training-use controls', 'Record limits for every required model and feature', 'Test both administrator and everyday-user workflows']
    },
    'website-builders': {
      ja: ['同じページ構成または商品数で試作する', 'スマートフォン表示と公開作業を確認する', '独自ドメイン、フォーム、決済を一つずつ試す', 'バックアップ、複製、書き出しを実行する', '初回・更新・追加機能の総額を保存する'],
      en: ['Build the same page structure or sample catalog in both products', 'Check mobile rendering and the publishing workflow', 'Test the required domain, form, and payment setup', 'Perform a backup, duplicate, and export test', 'Record introductory, renewal, and add-on totals']
    },
    'seo-marketing': {
      ja: ['同じサイト、キーワード、連絡先サンプルで試す', 'データ更新日と取得範囲を確認する', 'レポート、CSV、共有権限を実際に試す', '必要な連携と計測設定を一つずつ確認する', '月間上限と超過時の運用を記録する'],
      en: ['Use the same site, keyword set, or contact sample in both products', 'Check data timestamps and collection coverage', 'Test reports, CSV exports, and sharing permissions', 'Verify every required integration and tracking setup', 'Record monthly limits and the process when a limit is reached']
    },
    'business-software': {
      ja: ['同じプロジェクトまたは業務フローを再現する', '管理者・担当者・ゲストの権限を確認する', '通知、自動化、外部連携を一つずつ試す', '履歴、添付ファイル、データを書き出す', '席数、請求単位、更新日を記録する'],
      en: ['Reproduce the same project or business workflow in both products', 'Test administrator, contributor, and guest permissions', 'Verify notifications, automations, and required integrations', 'Export history, attachments, and core records', 'Record seat rules, billing units, and renewal dates']
    },
    'hosting-security': {
      ja: ['検証用サイト、保管庫、端末で同じ作業を試す', '移行または初期設定に必要な時間を記録する', 'バックアップからの復元・復旧を実行する', '権限、共有、セキュリティ通知を確認する', '更新料金、超過、解約時の条件を保存する'],
      en: ['Use the same test site, vault, or devices in both products', 'Record the time required for migration or initial setup', 'Perform a backup restore or account-recovery test', 'Verify permissions, sharing, and security notifications', 'Save renewal, overage, and cancellation terms']
    }
  };
  return checks[category]?.[language] || checks['business-software'][language];
}

const topicRelatedRoutes = {
  'generative-ai': {category: 'ai-tools', slug: 'ai-writing-tools-small-business', label: {ja: '生成AIツールの選び方', en: 'AI writing tools guide'}, description: {ja: '用途・料金・検証方法を整理', en: 'Review use cases, pricing, and evaluation steps'}},
  'ai-meeting-notes': {category: 'ai-tools', slug: 'ai-meeting-notes-tools', label: {ja: 'AI議事録ツールの選び方', en: 'AI meeting-notes tools guide'}, description: {ja: '録音・同意・保持条件も確認', en: 'Review capture, consent, and retention requirements'}},
  'website-builder': {category: 'website-builders', slug: 'small-business-website-builders', label: {ja: 'ホームページ作成サービス比較', en: 'Website builders for small business'}, description: {ja: '公開後の運用まで含めて比較', en: 'Compare building and post-launch operations'}},
  'ecommerce-platform': {category: 'website-builders', slug: 'shopify-vs-wix', label: {ja: 'ECサイト作成サービス比較', en: 'Ecommerce website builder comparison'}, description: {ja: '販売・決済・運用コストを確認', en: 'Review selling, payments, and operating cost'}},
  'seo-tools': {category: 'seo-marketing', slug: 'seo-tools-small-business', label: {ja: 'SEOツールの選び方', en: 'SEO tools for small business'}, description: {ja: 'キーワード・競合・監査機能を整理', en: 'Review keywords, competitors, and auditing'}},
  'email-marketing': {category: 'seo-marketing', slug: 'email-marketing-tools-small-business', label: {ja: 'メール配信ツール比較', en: 'Email marketing tools guide'}, description: {ja: '連絡先・送信数・自動化を確認', en: 'Review contacts, sends, and automation'}},
  'project-management': {category: 'business-software', slug: 'project-management-tools-small-business', label: {ja: 'プロジェクト管理ツール比較', en: 'Project management tools guide'}, description: {ja: 'タスク・権限・横断管理を確認', en: 'Review tasks, permissions, and portfolio work'}},
  'video-meetings': {category: 'business-software', slug: 'business-chat-tools-comparison', label: {ja: 'ビジネスコミュニケーションツール比較', en: 'Business communication tools guide'}, description: {ja: '会議・チャット・管理機能を整理', en: 'Review meetings, chat, and administration'}},
  'web-hosting': {category: 'hosting-security', slug: 'web-hosting-small-business', label: {ja: 'レンタルサーバーの選び方', en: 'Web hosting for small business'}, description: {ja: '速度・移行・更新費用を確認', en: 'Review performance, migration, and renewal cost'}},
  'password-managers': {category: 'hosting-security', slug: 'password-managers-small-business', label: {ja: 'パスワード管理ツール比較', en: 'Password managers for small business'}, description: {ja: '共有・復旧・管理機能を確認', en: 'Review sharing, recovery, and administration'}},
  'vpn-services': {category: 'hosting-security', slug: 'password-managers-small-business', label: {ja: '業務セキュリティの確認項目', en: 'Small-business security guide'}, description: {ja: '端末・権限・復旧を含めて整理', en: 'Review devices, access, and recovery controls'}}
};

function expandCompactComparison(record, profiles) {
  const first = profiles[record.products[0]];
  const second = profiles[record.products[1]];
  const alternative = profiles[record.alternativeProduct];
  if (!first || !second || !alternative) throw new Error(`Incomplete compact comparison record: ${record.slug}`);
  const locales = {};
  for (const language of ['ja', 'en']) {
    const japanese = language === 'ja';
    const angle = record.angle[language];
    const axis = record.axis[language];
    locales[language] = {
      title: japanese ? `${first.name}と${second.name}を比較｜${angle.replaceAll('比較', '比べる')}` : `${first.name} vs ${second.name}: ${angle}`,
      description: japanese
        ? `${first.name}と${second.name}の料金、無料利用、機能、利用上限、連携、データ管理を公式情報で比較します。判断軸は${axis}です。`
        : `Compare ${first.name} and ${second.name} using official sources for pricing, free access, features, limits, integrations, and data handling. Focus on ${axis}.`,
      lead: record.verdict[language],
      verdictHeading: japanese ? `結論：${axis}で選ぶ` : `Bottom line: choose by ${axis}`,
      verdict: record.verdict[language],
      context: japanese
        ? `表示価格だけで決めず、${axis}を同じサンプルと完了条件で再現し、年間総額と運用負荷を確認します。`
        : `Do not decide on headline price alone. Reproduce ${axis} with the same sample and completion criteria, then compare annual cost and operating effort.`,
      choiceIntro: japanese
        ? `${axis}に関わる代表作業を両方で試し、完了時間、修正回数、管理者の設定量を記録します。`
        : `Run one representative workflow centered on ${axis} in both products, then record completion time, revisions, and administrator setup.`,
      chooseFirst: japanese ? `${first.name}向き：${first.bestFor.ja}` : `Choose ${first.name}: ${first.bestFor.en}`,
      chooseSecond: japanese ? `${second.name}向き：${second.bestFor.ja}` : `Choose ${second.name}: ${second.bestFor.en}`,
      chooseAlternative: japanese ? `別案：${alternative.name}も加え、「${alternative.bestFor.ja}」という条件で比較する` : `Also test ${alternative.name} for this requirement: ${alternative.bestFor.en}`,
      beginnerAnswer: japanese
        ? `「${first.bestFor.ja}」なら${first.name}、「${second.bestFor.ja}」なら${second.name}が候補です。同じ無料枠または試用条件で、日常的な作業を一つずつ比べてください。`
        : `Best fit for ${first.name}: ${first.bestFor.en}. Best fit for ${second.name}: ${second.bestFor.en}. Compare both under the same free or trial conditions.`
    };
  }
  return {
    ...record,
    featured: false,
    locales,
    relatedRoutes: record.relatedRoutes || [topicRelatedRoutes[record.topic]].filter(Boolean)
  };
}

function profileAffiliateKey(profile, language) {
  return profile.affiliateKeyByLanguage?.[language] || profile.affiliateKey;
}

function profileCtaUrl(profile, language) {
  return profile.ctaUrlByLanguage?.[language] || profile.ctaUrl || profile.sources[0].url;
}

function comparisonArticle(record, profiles, language) {
  const first = profiles[record.products[0]];
  const second = profiles[record.products[1]];
  const copy = record.locales[language];
  if (!first || !second || !copy) throw new Error(`Incomplete comparison batch record: ${record.slug}:${language}`);
  const firstStrengths = first.strengths[language];
  const secondStrengths = second.strengths[language];
  const firstLimits = first.limits[language];
  const secondLimits = second.limits[language];
  const sourceList = uniqueSources([...first.sources, ...second.sources]);
  const articleVerifiedAt = record.verifiedAt || defaultVerifiedAt;
  const planChecks = comparisonPlanChecks(record.category, language);
  const trialChecks = comparisonTrialChecks(record.category, language);
  return {
    id: `${record.slug}-${language}`,
    translationKey: record.slug,
    language,
    type: 'comparison',
    status: 'published',
    slug: record.slug,
    category: record.category,
    topic: record.topic,
    badge: choose(language, '公式情報比較', 'Official-source comparison'),
    title: copy.title,
    metaTitle: copy.metaTitle || copy.title,
    description: copy.description,
    lead: copy.lead,
    publishedAt: record.publishedAt || articleVerifiedAt,
    updatedAt: record.updatedAt || articleVerifiedAt,
    verifiedAt: articleVerifiedAt,
    author: choose(language, 'Luqevora.com編集部', 'Luqevora.com Editorial Team'),
    featured: record.featured ?? true,
    affiliateDisclosure: false,
    ctas: [first, second].map(profile => ({
      label: choose(language, `${profile.name}の公式プランを確認`, `Check ${profile.name} official plans`),
      officialUrl: profileCtaUrl(profile, language),
      affiliateKey: profileAffiliateKey(profile, language)
    })),
    sources: sourceList,
    sections: [
      {
        heading: copy.verdictHeading,
        body: [copy.verdict, copy.context],
        callout: choose(
          language,
          '結論は一般的な用途を前提にしています。実際の判断では、必要な機能を無料版または試用期間で再現できるか確認してください。',
          'This verdict assumes a typical use case. Reproduce your required workflow in a free plan or trial before committing.'
        )
      },
      {
        heading: choose(language, `${first.name}と${second.name}の違い`, `How ${first.name} and ${second.name} differ`),
        body: [choose(language, `${first.name}と${second.name}について${verificationDateLabel(articleVerifiedAt, language)}に確認した公式情報を、購入判断に必要な項目へ絞って整理します。`, `For ${first.name} and ${second.name}, the table condenses provider-owned information checked on ${verificationDateLabel(articleVerifiedAt, language)} into the factors most relevant to a purchase decision.`)],
        table: {
          headers: choose(language, ['比較項目', first.name, second.name], ['Factor', first.name, second.name]),
          rows: [
            [choose(language, 'サービスの中心', 'Core positioning'), first.positioning[language], second.positioning[language]],
            [choose(language, '料金の考え方', 'Pricing model'), first.pricing[language], second.pricing[language]],
            [choose(language, '主な強み', 'Primary strengths'), firstStrengths.join(choose(language, '、', '; ')), secondStrengths.join(choose(language, '、', '; '))],
            [choose(language, '確認したい制約', 'Constraints to verify'), firstLimits.join(choose(language, '、', '; ')), secondLimits.join(choose(language, '、', '; '))],
            [choose(language, '向いている用途', 'Best fit'), first.bestFor[language], second.bestFor[language]]
          ]
        }
      },
      {
        heading: choose(language, '料金とプラン上限の比べ方', 'How to compare price and plan limits'),
        body: [first.pricingDetail[language], second.pricingDetail[language], choose(language, `${first.name}と${second.name}は表示価格だけでなく、必要な上限を満たす最小プランの年間総額で比較します。`, `Compare ${first.name} and ${second.name} by the annual total of the lowest plan that meets every required limit, not the headline price alone.`)],
        bullets: [...planChecks, ...(copy.planChecks || [])]
      },
      {
        heading: choose(language, '機能と日常ワークフロー', 'Features and day-to-day workflow'),
        body: [first.workflow[language], second.workflow[language]],
        bullets: [
          ...firstStrengths.map(item => `${first.name}: ${item}`),
          ...secondStrengths.map(item => `${second.name}: ${item}`)
        ]
      },
      {
        heading: choose(language, 'どちらを選ぶべきか', 'Which one should you choose?'),
        body: [copy.choiceIntro],
        bullets: [copy.chooseFirst, copy.chooseSecond, copy.chooseAlternative]
      },
      {
        heading: choose(language, '契約前の試用チェックリスト', 'Pre-purchase trial checklist'),
        body: [choose(language, '同じサンプル案件を両方で試し、操作時間と追加費用を記録すると判断しやすくなります。', 'Run the same sample project in both products and record task time, friction, and extra cost.')],
        bullets: [...trialChecks, ...(copy.trialChecks || [])]
      }
    ],
    faqs: [
      {
        question: choose(language, `${first.name}と${second.name}はどちらが初心者向きですか？`, `Which is easier for beginners, ${first.name} or ${second.name}?`),
        answer: copy.beginnerAnswer
      },
      {
        question: choose(language, '無料版だけで比較できますか？', 'Can I compare them using free plans?'),
        answer: choose(language, `${first.name}と${second.name}の無料版や試用版で基本操作は確認できますが、必要な上限、管理機能、書き出し、サポートは有料プランの公式比較表も確認してください。`, `A ${first.name} or ${second.name} free plan or trial can reveal the core workflow, but also check paid-plan limits, administration, export, and support on their official comparison pages.`)
      },
      {
        question: choose(language, '移行前に確認すべきことは何ですか？', 'What should I verify before migrating?'),
        answer: choose(language, `${first.name}と${second.name}でデータの書き出し形式、履歴や添付ファイルの移行範囲、権限の再設定、連携の再認証、旧サービスの解約時期を確認します。`, `For ${first.name} and ${second.name}, verify export formats, history and attachment coverage, permission mapping, integration reauthorization, and the cancellation date for the old service.`)
      }
    ],
    relatedLinks: relatedLinks(record.relatedRoutes, language)
  };
}

function profileReviewArticle(record, profiles, language) {
  const profile = profiles[record.product];
  if (!profile) throw new Error(`Unknown review product: ${record.product}`);
  const japanese = language === 'ja';
  const articleVerifiedAt = record.verifiedAt || defaultVerifiedAt;
  const planChecks = comparisonPlanChecks(record.category, language);
  const trialChecks = comparisonTrialChecks(record.category, language);
  const strengths = profile.strengths[language];
  const limits = profile.limits[language];
  const sourceList = uniqueSources(profile.sources);
  const title = japanese
    ? `${profile.name}レビュー｜料金・機能・向いている用途を公式情報で確認`
    : `${profile.name} Review: Pricing, Features, Best-Fit Uses, and Limitations`;
  return {
    id: `${record.slug}-${language}`,
    translationKey: record.slug,
    language,
    type: 'review',
    status: 'published',
    slug: record.slug,
    category: record.category,
    topic: record.topic,
    badge: choose(language, '公式情報レビュー', 'Official-source review'),
    title,
    metaTitle: title,
    description: japanese
      ? `${profile.name}の料金体系、主な機能、強み、制約、向いている用途を公式情報で整理。導入前に確認したい利用上限、データ管理、書き出し条件も解説します。`
      : `Review ${profile.name} using official information on pricing, core features, strengths, limitations, best-fit uses, data controls, and pre-purchase checks.`,
    lead: japanese
      ? `${profile.name}は、${profile.positioning.ja}です。本記事では公式情報を基に、日常業務で再現できるかという視点から料金、機能、制約、導入前の確認事項を整理します。`
      : `This review evaluates ${profile.name} through its official positioning, pricing model, workflow, strengths, and constraints. The goal is to determine whether it can reproduce a real workflow before purchase.`,
    publishedAt: record.publishedAt || articleVerifiedAt,
    updatedAt: record.updatedAt || articleVerifiedAt,
    verifiedAt: articleVerifiedAt,
    author: choose(language, 'Luqevora.com編集部', 'Luqevora.com Editorial Team'),
    featured: false,
    affiliateDisclosure: false,
    ctas: [{
      label: choose(language, `${profile.name}の公式プランを確認`, `Check ${profile.name} official plans`),
      officialUrl: profileCtaUrl(profile, language),
      affiliateKey: profileAffiliateKey(profile, language)
    }],
    sources: sourceList,
    sections: [
      {
        heading: choose(language, '結論：向いている用途と判断基準', 'Bottom line: best-fit uses and decision criteria'),
        body: [
          japanese ? `${profile.name}が特に向いているのは、${profile.bestFor.ja}です。` : `${profile.name} is best suited to ${profile.bestFor.en}.`,
          choose(language, `サービスの中心：${profile.positioning.ja}。`, `Core positioning: ${profile.positioning.en}.`),
          choose(
            language,
            '採用可否は機能数ではなく、最も頻繁な作業を必要な権限とデータで完了できるか、契約期間全体の費用が予算に収まるか、終了時に必要なデータを取り出せるかで判断します。',
            'Judge fit by whether the most frequent task can be completed with the required permissions and data, whether full-term cost fits the budget, and whether essential records can be exported when the service is no longer used.'
          )
        ],
        callout: choose(
          language,
          '料金、無料枠、上限、キャンペーンは変わります。契約直前に公式料金ページと申込画面を再確認してください。',
          'Pricing, free access, limits, and promotions can change. Recheck the official pricing and checkout screens immediately before purchase.'
        )
      },
      {
        heading: choose(language, '主な機能と日常ワークフロー', 'Core capabilities and day-to-day workflow'),
        body: [
          profile.workflow[language],
          choose(
            language,
            '評価では、機能一覧を見るだけでなく、入力、共同作業、承認、公開または書き出しまでを一つの流れとして試します。担当者が迷う箇所、管理者だけが変更できる設定、外部サービスへの再ログインも記録すると、導入後の負担を予測できます。',
            'Do more than inspect a feature list. Test one complete sequence from input through collaboration, approval, and publishing or export. Record points that confuse operators, settings restricted to administrators, and integrations that require reauthentication so rollout effort is visible.'
          )
        ],
        bullets: strengths.map(item => choose(language, `主な強み：${item}`, `Core strength: ${item}`))
      },
      {
        heading: choose(language, '料金体系とプラン上限', 'Pricing model and plan limits'),
        body: [
          profile.pricing[language],
          profile.pricingDetail[language],
          choose(
            language,
            '最安プランではなく、必要な機能と上限をすべて満たす最小プランを特定します。初回料金と更新料金、人数や利用量の増加、追加機能、移行や教育にかかる時間を同じ期間へ換算して比較してください。',
            'Identify the lowest tier that meets every required capability and limit, rather than choosing the cheapest headline plan. Normalize introductory and renewal pricing, growth in seats or usage, add-ons, migration, and training to the same evaluation period.'
          )
        ],
        bullets: planChecks
      },
      {
        heading: choose(language, '強みと注意したい制約', 'Strengths and trade-offs to verify'),
        body: [
          choose(
            language,
            `${profile.name}の強みは、対象業務との適合度が高いほど導入効果へつながります。一方、制約は契約後に初めて気付くと移行や追加費用の原因になるため、試用中に実データへ近いサンプルで確認します。`,
            `${profile.name}'s strengths create value when they match the actual operating model. Constraints discovered only after purchase can create migration work or added cost, so test them during the evaluation with a realistic but non-sensitive sample.`
          )
        ],
        bullets: [
          ...strengths.map(item => choose(language, `強み：${item}`, `Strength: ${item}`)),
          ...limits.map(item => choose(language, `確認事項：${item}`, `Verify: ${item}`))
        ]
      },
      {
        heading: choose(language, '向いている利用者・見送りを検討する条件', 'Who it suits and when to consider another option'),
        body: [
          japanese ? `有力候補になるのは、${profile.bestFor.ja}です。` : `It is a strong candidate for ${profile.bestFor.en}.`,
          choose(
            language,
            '反対に、注意事項のいずれかが必須要件と衝突する場合は、価格差だけで妥協せず別製品も同じチェックリストで試してください。利用人数やデータ量が増えた一年後の状態でも、管理と請求が無理なく続くかを確認します。',
            'If any trade-off conflicts with a mandatory requirement, test another product with the same checklist instead of accepting the gap for a lower price. Also model the account one year later, after users and data have grown, to confirm administration and billing remain manageable.'
          )
        ],
        bullets: [
          choose(language, `適合条件：${profile.bestFor.ja}`, `Fit condition: ${profile.bestFor.en}`),
          ...limits.map(item => choose(language, `別案も試す条件：${item}`, `Test an alternative when: ${item}`))
        ]
      },
      {
        heading: choose(language, '導入前の試用チェックリスト', 'Pre-purchase trial checklist'),
        body: [
          choose(
            language,
            '検証用の小さな案件を用意し、成功条件、担当者、期限を決めて試します。各項目を「確認済み・未確認・要追加費用」に分け、判断根拠と確認した公式ページを保存すると、契約後も条件変更を追いやすくなります。',
            'Run a small pilot with defined success criteria, an owner, and a deadline. Mark each requirement as verified, unverified, or requiring added cost, and save both the decision evidence and the official page checked so later plan changes are easier to review.'
          )
        ],
        bullets: trialChecks
      }
    ],
    faqs: [
      {
        question: choose(language, `${profile.name}は無料で試せますか？`, `Can I try ${profile.name} for free?`),
        answer: choose(language, '無料プランや試用期間の有無、対象機能、地域、支払情報の要否は変わる場合があります。公式料金ページと申込画面で現在の条件を確認し、自動更新日も記録してください。', 'Free-plan or trial availability, included capabilities, regional terms, and payment requirements can change. Confirm the current official pricing and signup screens and record any automatic renewal date.')
      },
      {
        question: choose(language, `${profile.name}はどのような利用者に向いていますか？`, `Who is ${profile.name} best for?`),
        answer: japanese ? `${profile.bestFor.ja}に向いています。ただし、最も頻繁な作業を実際の運用に近い権限とサンプルで完了できるか確認してから判断してください。` : `It is best for ${profile.bestFor.en}. Confirm that the most frequent workflow can be completed with realistic roles and sample data before committing.`
      },
      {
        question: choose(language, '契約前に何を確認すべきですか？', 'What should I verify before subscribing?'),
        answer: japanese ? `公式情報では、特に「${limits.join('」「')}」を確認してください。あわせて更新料金、利用上限、権限、データの書き出し、解約後の保持条件も確認します。` : `Pay particular attention to these trade-offs: ${limits.join('; ')}. Also verify renewal pricing, usage limits, permissions, data export, and post-cancellation retention in official documentation.`
      }
    ],
    relatedLinks: relatedLinks(record.relatedRoutes || [topicRelatedRoutes[record.topic]].filter(Boolean), language)
  };
}

function profileIntentArticle(record, profiles, language) {
  const profile = profiles[record.product];
  const alternatives = (record.alternatives || []).map(key => profiles[key]);
  if (!profile || alternatives.some(item => !item)) throw new Error(`Incomplete affiliate-intent record: ${record.slug}`);
  const japanese = language === 'ja';
  const articleVerifiedAt = record.verifiedAt || defaultVerifiedAt;
  const planChecks = comparisonPlanChecks(record.category, language);
  const trialChecks = comparisonTrialChecks(record.category, language);
  const candidateProfiles = record.intent === 'pricing' ? [profile] : [profile, ...alternatives];
  const sourceList = uniqueSources(candidateProfiles.flatMap(item => item.sources));
  const defaultAudience = record.intent === 'pricing'
    ? choose(language, '導入を検討している利用者', 'prospective buyers')
    : record.intent === 'alternatives'
      ? choose(language, '乗り換えを検討しているチーム', 'teams considering a switch')
      : choose(language, '小規模事業者', 'small businesses');
  const audience = record.audience?.[language] || defaultAudience;
  const audienceTitle = japanese ? audience : englishTitleCase(audience);
  const defaultUseCase = record.intent === 'pricing'
    ? choose(language, '必要な日常業務を契約予定プランで完了すること', 'completing the required daily workflow on the intended plan')
    : record.intent === 'alternatives'
      ? choose(language, '現在の業務を候補サービスで再現して移行条件を確認すること', 'reproducing the current workflow and verifying migration conditions')
      : profile.bestFor[language];
  const useCase = record.useCase?.[language] || defaultUseCase;
  const bestForEnglish = englishSentenceFragment(profile.bestFor.en);
  const intentCopy = {
    pricing: {
      badge: choose(language, '料金・プランガイド', 'Pricing and plans guide'),
      title: choose(language, `${profile.name}の料金・プラン選び方｜契約前に確認したい費用と上限`, `${profile.name} Pricing Guide: Plans, Limits, and Total Cost`),
      description: choose(language, `${profile.name}の料金体系、プラン上限、更新費用、追加料金を公式情報で整理。必要機能を満たす最小プランと契約前に試す項目を解説します。`, `Understand ${profile.name} pricing, plan limits, renewal cost, add-ons, and the checks needed to identify the lowest tier that supports a real workflow.`),
      lead: choose(language, `${profile.name}の表示価格だけでなく、必要な上限を満たすプラン、契約期間、追加機能、移行・運用時間を含む総額で判断するためのガイドです。`, `This guide evaluates ${profile.name} beyond its headline price, including the tier required for real limits, billing term, add-ons, migration, and operating time.`),
      verdictHeading: choose(language, '結論：必要条件を満たす最小プランで選ぶ', 'Bottom line: choose the lowest plan that meets every requirement'),
      verdict: choose(language, `${profile.name}は「${profile.bestFor.ja}」という用途に合う場合に有力です。最安プランではなく、日常業務、権限、書き出し、サポートを満たす最小プランの総額で判断します。`, `${profile.name} is a strong candidate for ${bestForEnglish}. Base the decision on the total cost of the lowest plan that supports the required workflow, permissions, exports, and support—not the cheapest advertised tier.`)
    },
    alternatives: {
      badge: choose(language, '代替サービス比較', 'Alternatives comparison'),
      title: choose(language, `${profile.name}の代替サービス${alternatives.length}選｜用途・料金・移行条件を比較`, `${profile.name} Alternatives: Compare Pricing, Workflows, and Migration`),
      description: choose(language, `${profile.name}と代替候補${alternatives.map(item => item.name).join('、')}を公式情報で比較。用途、料金体系、強み、制約、移行前の試用項目を整理します。`, `Compare ${profile.name} with ${alternatives.map(item => item.name).join(', ')} using official information on fit, pricing, strengths, constraints, and migration checks.`),
      lead: choose(language, `${profile.name}が合わない場合に、価格だけでなく業務フロー、管理機能、利用上限、データ移行を同じ条件で比べるための代替サービスガイドです。`, `This alternatives guide compares workflow, administration, usage limits, and migration under the same conditions instead of treating price as the only reason to replace ${profile.name}.`),
      verdictHeading: choose(language, '結論：代替候補は不足条件から選ぶ', 'Bottom line: choose an alternative by the requirement that is missing'),
      verdict: choose(language, `${profile.name}は「${profile.bestFor.ja}」なら有力です。${profile.limits.ja.join('、')}のいずれかが必須要件と衝突する場合に、代替候補を同じサンプル案件で試します。`, `${profile.name} remains a strong fit for ${bestForEnglish}. Test alternatives when any of these constraints conflicts with a mandatory requirement: ${profile.limits.en.join('; ')}.`)
    },
    'use-case': {
      badge: choose(language, '用途別レビュー', 'Use-case review'),
      title: choose(language, `${profile.name}は${audience}に向く？料金・機能・導入条件を確認`, `Is ${profile.name} Right for ${audienceTitle}? Cost, Features, and Fit`),
      description: choose(language, `${profile.name}が${audience}の「${useCase}」に向くかを公式情報で検証。料金、機能、制約、代替候補、導入前チェックを整理します。`, `Assess whether ${profile.name} fits ${audience} for ${useCase}, including official pricing, capabilities, constraints, alternatives, and pilot checks.`),
      lead: choose(language, `${audience}が${profile.name}を選ぶ際に、導入目的「${useCase}」を実際の業務で再現し、費用と運用負荷を判断するためのガイドです。`, `This guide helps ${audience} test ${profile.name} against one concrete objective—${useCase}—and evaluate both cost and operating effort.`),
      verdictHeading: choose(language, `結論：${audience}との適合条件`, `Bottom line: fit for ${audience}`),
      verdict: choose(language, `${profile.name}は「${profile.bestFor.ja}」という条件と、今回の目的「${useCase}」が重なる場合に有力です。試用では担当者と管理者の両方が同じ作業を完了できるか確認します。`, `${profile.name} is a strong candidate when its core fit—${bestForEnglish}—overlaps with the objective here: ${useCase}. During the pilot, both an operator and an administrator should complete the same representative workflow.`)
    }
  }[record.intent];
  if (!intentCopy) throw new Error(`Unknown affiliate intent: ${record.intent}`);

  const comparisonTable = record.intent === 'pricing'
    ? {
        headers: choose(language, ['確認項目', '公式情報の要点', '契約前の判断'], ['Factor', 'What official sources indicate', 'Pre-purchase decision']),
        rows: [
          [choose(language, '料金体系', 'Pricing model'), profile.pricing[language], planChecks[0]],
          [choose(language, '必要プラン', 'Required tier'), profile.pricingDetail[language], planChecks[1]],
          [choose(language, '主な強み', 'Core value'), profile.strengths[language].join(choose(language, '、', '; ')), planChecks[2]],
          [choose(language, '制約', 'Constraints'), profile.limits[language].join(choose(language, '、', '; ')), planChecks[3]]
        ]
      }
    : {
        headers: choose(language, ['候補', '向いている用途', '料金体系', '確認したい制約'], ['Option', 'Best fit', 'Pricing model', 'Constraint to verify']),
        rows: candidateProfiles.map(item => [item.name, item.bestFor[language], item.pricing[language], item.limits[language].join(choose(language, '、', '; '))])
      };

  const primaryReviewRoute = {
    category: record.category,
    slug: `${record.product}-review`,
    label: {ja: `${profile.name}レビュー`, en: `${profile.name} review`},
    description: {ja: '機能・料金・制約を公式情報で確認', en: 'Review capabilities, pricing, and constraints'}
  };
  return {
    id: `${record.slug}-${language}`,
    translationKey: record.slug,
    language,
    type: record.intent === 'alternatives' ? 'comparison' : record.intent === 'use-case' ? 'review' : 'guide',
    status: 'published',
    slug: record.slug,
    category: record.category,
    topic: record.topic,
    badge: intentCopy.badge,
    title: intentCopy.title,
    metaTitle: intentCopy.title,
    description: intentCopy.description,
    lead: intentCopy.lead,
    publishedAt: record.publishedAt || articleVerifiedAt,
    updatedAt: record.updatedAt || articleVerifiedAt,
    verifiedAt: articleVerifiedAt,
    author: choose(language, 'Luqevora.com編集部', 'Luqevora.com Editorial Team'),
    featured: false,
    affiliateDisclosure: false,
    ctas: candidateProfiles.map(item => ({
      label: choose(language, `${item.name}の公式プランを確認`, `Check ${item.name} official plans`),
      officialUrl: item.ctaUrl || item.sources[0].url,
      affiliateKey: item.affiliateKey
    })),
    sources: sourceList,
    sections: [
      {
        heading: intentCopy.verdictHeading,
        body: [
          intentCopy.verdict,
          choose(language, `${profile.name}の判断では、目的「${useCase}」を同じ人数、データ量、期間、完了条件で試します。料金表の機能名だけで決めず、無料版または試用環境で代表作業を最後まで再現してください。`, `For ${profile.name}, test the objective—${useCase}—with consistent users, data volume, evaluation period, and completion criteria. Reproduce a representative task from start to finish instead of deciding from feature names alone.`),
          choose(language, `この記事は${profile.name}の公式情報を購入判断向けに整理しています。契約直前には提供元の料金ページ、申込画面、利用規約を再確認します。`, `This guide organizes provider-owned information about ${profile.name} for a purchase decision. Recheck its pricing page, checkout screen, and terms immediately before subscribing.`)
        ],
        callout: choose(language, '追跡リンクの有無にかかわらず、判断基準と注意点は同じ条件で掲載します。', 'The same decision criteria and caveats apply whether a link is tracked or not.')
      },
      {
        heading: choose(language, 'サービスの位置付けと日常業務', 'Product positioning and day-to-day workflow'),
        body: [
          choose(language, `${profile.name}の中心は、${profile.positioning.ja}です。`, `Core positioning for ${profile.name}: ${profile.positioning.en}.`),
          profile.workflow[language],
          choose(language, `${profile.name}の導入目的は「${useCase}」まで具体化し、開始から完了までに必要な入力、権限、連携、承認、書き出しを洗い出します。`, `For ${profile.name}, define the objective as ${useCase}, then map the inputs, permissions, integrations, approvals, and exports required from start to completion.`)
        ],
        bullets: profile.strengths[language].map(item => choose(language, `強み：${item}`, `Strength: ${item}`))
      },
      {
        heading: record.intent === 'pricing' ? choose(language, '料金・上限の判断表', 'Pricing and limits decision table') : choose(language, '候補サービスの適合条件', 'Fit across the candidate products'),
        body: [
          choose(language, `${profile.name}について${verificationDateLabel(articleVerifiedAt, language)}に確認した公式情報を、購入判断に必要な項目へ整理しています。`, `For ${profile.name}, this table condenses provider-owned information checked on ${verificationDateLabel(articleVerifiedAt, language)} into purchase-decision factors.`),
          choose(language, `${profile.name}の表は固定価格を保証するものではありません。地域、通貨、税、契約期間、キャンペーン、利用量による差を申込画面で確認してください。`, `The ${profile.name} table does not guarantee a fixed price. Verify regional availability, currency, tax, billing term, promotions, and usage-based differences at checkout.`)
        ],
        table: comparisonTable
      },
      {
        heading: choose(language, '総額に含める費用とプラン条件', 'Costs and plan conditions to include'),
        body: [
          profile.pricingDetail[language],
          choose(language, `${profile.name}は月額換算だけでなく、契約時の支払総額、更新額、必要な追加機能、人数・利用量の増加、移行・教育・管理時間を同じ期間へ換算します。`, `For ${profile.name}, normalize the initial payment, renewal amount, required add-ons, user or usage growth, migration, training, and administration to the same period instead of relying on a monthly equivalent.`),
          choose(language, `${profile.name}の無料枠や試用期間では、有料プラン限定の権限、履歴、書き出し、サポートも公式比較表で確認します。`, `A ${profile.name} free tier or trial may omit paid-plan permissions, history, export, or support, so verify those differences in the official comparison.` )
        ],
        bullets: planChecks
      },
      {
        heading: choose(language, '選ぶ条件・見送る条件', 'Reasons to choose it or keep looking'),
        body: [
          choose(language, `${profile.name}を選ぶ軸は「${profile.bestFor.ja}」です。次の制約が必須要件と衝突する場合は、代替候補を同じ条件で試します。`, `The core reason to choose ${profile.name} is this fit: ${bestForEnglish}. If the constraints below conflict with a mandatory requirement, test an alternative under the same conditions.`),
          record.intent === 'alternatives'
            ? choose(language, `代替候補は${alternatives.map(item => `${item.name}（${item.bestFor.ja}）`).join('、')}です。`, `The alternatives are ${alternatives.map(item => `${item.name} for ${englishSentenceFragment(item.bestFor.en)}`).join('; ')}.`)
            : choose(language, `今回の対象である${audience}は、${profile.name}で目的「${useCase}」を最小構成で試し、担当者の操作時間と管理者の設定時間を分けて記録します。`, `For ${audience}, pilot ${profile.name} against the objective—${useCase}—at minimum scope and record operator task time separately from administrator setup time.`)
        ],
        bullets: [
          ...profile.strengths[language].map(item => choose(language, `選ぶ理由：${item}`, `Reason to choose: ${item}`)),
          ...profile.limits[language].map(item => choose(language, `見送る前に確認：${item}`, `Verify before committing: ${item}`))
        ]
      },
      {
        heading: choose(language, '申込前の試用・移行チェックリスト', 'Trial and migration checklist before signup'),
        body: [
          choose(language, `${profile.name}の検証用に小さな案件を用意し、成功条件と期限を決めます。結果は「確認済み・未確認・追加費用あり」に分け、スクリーンショット、書き出しファイル、確認した公式URLを保存してください。`, `Run a small ${profile.name} pilot with a success condition and deadline. Classify each result as verified, unverified, or requiring added cost, and save screenshots, export files, and the official URLs checked.`),
          choose(language, `${profile.name}へ移行する場合は、旧サービスを解約する前にデータ件数、履歴、添付ファイル、権限、連携、復旧手順が一致するか確認します。`, `Before cancelling an existing service for ${profile.name}, verify record counts, history, attachments, permissions, integrations, and recovery steps after migration.`)
        ],
        bullets: trialChecks
      }
    ],
    faqs: [
      {
        question: record.intent === 'pricing'
          ? choose(language, `${profile.name}の最安プランで十分ですか？`, `Is the cheapest ${profile.name} plan sufficient?`)
          : record.intent === 'alternatives'
            ? choose(language, '無料版や試用版だけで代替候補を比べられますか？', 'Can I compare the alternatives using free plans or trials?')
            : choose(language, `${profile.name}は契約前に試せますか？`, `Can I pilot ${profile.name} before subscribing?`),
        answer: record.intent === 'pricing'
          ? choose(language, `${profile.name}の最安プランで基本操作を試せても、必要な上限、権限、履歴、書き出し、連携、サポートが含まれるとは限りません。必要条件を満たす最小プランで総額を計算してください。`, `Even when the cheapest ${profile.name} plan supports basic testing, it may not include the required limits, permissions, history, exports, integrations, or support. Price the lowest tier that meets every mandatory requirement.`)
          : choose(language, `${profile.name}の無料版や試用版で基本操作を確認できても、有料プランの上限、権限、履歴、書き出し、連携、サポートは公式比較表で確認してください。`, `A ${profile.name} free plan or trial can reveal the core workflow, but paid-plan limits, permissions, history, exports, integrations, and support still need to be checked in official documentation.`)
      },
      {
        question: record.intent === 'pricing'
          ? choose(language, `${profile.name}はどのような利用者に向いていますか？`, `Who is ${profile.name} best for?`)
          : record.intent === 'alternatives'
            ? choose(language, `${profile.name}からの乗り換えはいつ検討すべきですか？`, `When should I consider replacing ${profile.name}?`)
            : choose(language, `${profile.name}は${audience}に向いていますか？`, `Is ${profile.name} suitable for ${audience}?`),
        answer: record.intent === 'alternatives'
          ? choose(language, `${profile.limits.ja.join('、')}のいずれかが必須要件と衝突するときに検討します。現在の業務を候補サービスで再現し、書き出しと移行範囲も確認してください。`, `Consider switching when a mandatory requirement conflicts with these constraints: ${profile.limits.en.join('; ')}. Reproduce the current workflow in each candidate and verify export and migration coverage.`)
          : choose(language, `${profile.bestFor.ja}には有力です。目的「${useCase}」を実際のデータに近いサンプルと必要な権限で完了できるか確認してください。`, `It is a strong candidate for ${bestForEnglish}. Verify that the objective—${useCase}—can be completed with realistic sample data and the required permissions.`)
      },
      {
        question: choose(language, '契約前に最も重要な確認項目は何ですか？', 'What is the most important pre-purchase check?'),
        answer: choose(language, `公式情報では「${profile.limits.ja.join('」「')}」を確認します。あわせて更新料金、解約日、データの書き出し範囲も記録してください。`, `Verify these constraints in official documentation: ${profile.limits.en.join('; ')}. Also record renewal pricing, cancellation timing, and export coverage.`)
      }
    ],
    relatedLinks: relatedLinks([primaryReviewRoute, topicRelatedRoutes[record.topic]].filter(Boolean), language)
  };
}

function templatedArticle(record, language) {
  const copy = record.locales[language];
  if (!copy) throw new Error(`Missing locale for article batch record: ${record.slug}:${language}`);
  const comparisonRows = (copy.comparisonRows || []).length ? {
    headers: choose(language, ['確認項目', '判断のポイント'], ['Factor', 'What to decide']),
    rows: copy.comparisonRows
  } : undefined;
  const pricingChecks = choose(
    language,
    ['初回価格と更新価格を分けて記録する', '月払い・年払い・長期前払いの総額を比較する', '人数、容量、サイト数、送信数などの上限を確認する', '返金、解約、データ保持の条件を確認する'],
    ['Record introductory and renewal pricing separately', 'Compare monthly, annual, and longer-term totals', 'Check limits for seats, storage, sites, sends, or usage', 'Review refund, cancellation, and data-retention terms']
  );
  const setupChecks = choose(
    language,
    ['目的と完了条件を一文で定義する', '無料版または試用版で代表的な作業を再現する', '管理者・担当者・閲覧者の権限を確認する', 'バックアップまたは書き出しを実際に試す', '更新日と担当者を運用メモへ残す'],
    ['Define the objective and completion criteria in one sentence', 'Reproduce a representative task in a free plan or trial', 'Test administrator, contributor, and viewer permissions', 'Perform a real backup or export test', 'Record the renewal date and internal owner']
  );
  const sourceList = uniqueSources(record.sources);
  const articleVerifiedAt = record.verifiedAt || defaultVerifiedAt;
  return {
    id: `${record.slug}-${language}`,
    translationKey: record.slug,
    language,
    type: record.type,
    status: 'published',
    slug: record.slug,
    category: record.category,
    topic: record.topic,
    badge: choose(language, record.type === 'comparison' ? '公式情報比較' : record.type === 'guide' ? '実践ガイド' : '公式情報レビュー', record.type === 'comparison' ? 'Official-source comparison' : record.type === 'guide' ? 'Practical guide' : 'Official-source review'),
    title: copy.title,
    metaTitle: copy.metaTitle || copy.title,
    description: copy.description,
    lead: copy.lead,
    publishedAt: record.publishedAt || articleVerifiedAt,
    updatedAt: record.updatedAt || articleVerifiedAt,
    verifiedAt: articleVerifiedAt,
    author: choose(language, 'Luqevora.com編集部', 'Luqevora.com Editorial Team'),
    featured: false,
    affiliateDisclosure: false,
    ctas: (record.ctas || []).map(cta => ({
      label: cta.label?.[language] || cta.label?.en,
      officialUrl: cta.officialUrl,
      affiliateKey: cta.affiliateKey
    })),
    sources: sourceList,
    sections: [
      {
        heading: choose(language, '結論', 'Bottom line'),
        body: [copy.verdict, copy.context],
        callout: choose(language, '料金・機能・キャンペーンは変更されるため、契約直前に公式画面で再確認してください。', 'Pricing, features, and promotions can change; recheck the provider screen immediately before purchase.')
      },
      ...(record.workspaceUsPromoOffer && language === 'en' ? [{
        heading: 'US referral link and first-year promotion codes',
        body: [
          'The Google Workspace signup button on this page uses a United States referral link issued to the operator of Luqevora.com. If an eligible new customer starts a trial through the link and meets the program conditions, the operator may receive a referral reward.',
          'A limited number of promotion codes may be available for eligible new United States customers. Each code can be used by one customer account only, so codes are not published on this website. Request a code before entering billing information and completing the 14-day trial signup.'
        ],
        bullets: [
          'Use the United States referral link before starting the trial',
          'Available only to eligible new Google Workspace customers',
          'A promotion code can provide 10% off per user for the first year where eligible',
          'United States customers must enter the code with billing information before completing trial signup',
          'Code availability and successful application are not guaranteed'
        ],
        callout: 'Promotion codes are limited, region-specific, and single-use. Confirm the discount in the Google Workspace billing summary before completing signup.'
      }] : []),
      {
        heading: copy.overviewHeading || choose(language, '主な機能と使い方', 'Core capabilities and workflow'),
        body: [copy.overview],
        bullets: copy.capabilities,
        ...(comparisonRows ? {table: comparisonRows} : {})
      },
      {
        heading: choose(language, '料金とプラン上限', 'Pricing and plan limits'),
        body: [copy.pricing, choose(language, `${copy.subject}では必要機能が含まれる最小プランを特定し、請求期間全体の総額で比較します。`, `For ${copy.subject}, identify the lowest plan containing every required feature and compare the total for the full billing period.`)],
        bullets: [...pricingChecks, ...(copy.planChecks || [])]
      },
      {
        heading: choose(language, '強みと注意点', 'Strengths and trade-offs'),
        body: [copy.tradeoff],
        bullets: [
          ...copy.strengths.map(item => choose(language, `強み：${item}`, `Strength: ${item}`)),
          ...copy.caveats.map(item => choose(language, `確認：${item}`, `Verify: ${item}`))
        ]
      },
      {
        heading: choose(language, '向いている利用者', 'Who it suits'),
        body: [copy.fitIntro],
        bullets: copy.bestFor
      },
      {
        heading: choose(language, '導入前チェックリスト', 'Implementation checklist'),
        body: [choose(language, `${copy.subject}を小さな範囲で試し、費用・操作・移行・管理の4点を記録してから本導入します。`, `Pilot ${copy.subject} in a small scope and document cost, workflow, migration, and administration before rollout.`)],
        bullets: [...setupChecks, ...(copy.checklist || [])]
      }
    ],
    faqs: [
      ...(copy.faqs || [
        {
          question: choose(language, `${copy.subject}は無料で試せますか？`, `Can I try ${copy.subject} for free?`),
          answer: choose(language, `${copy.subject}の無料プランや試用期間は地域・時期によって変わる場合があります。公式料金ページと申込画面で最新条件を確認してください。`, `Free-plan and trial availability for ${copy.subject} can vary by region and date. Check the current official pricing and checkout screens.`)
        },
        {
          question: choose(language, '導入前に最も重要な確認項目は何ですか？', 'What is the most important pre-purchase check?'),
          answer: choose(language, `${copy.subject}の試用環境で日常の主要作業を再現し、必要な権限、上限、書き出し、サポートが契約予定プランに含まれるか確認します。`, `Reproduce your most frequent ${copy.subject} workflow and confirm that the intended plan includes the required permissions, limits, export, and support.`)
        }
      ]),
      ...(record.workspaceUsPromoOffer && language === 'en' ? [{
        question: 'How can I request a Google Workspace promotion code for the United States?',
        answer: 'Use the promotion-code request button before starting or completing signup. Codes are sent individually because each code can be redeemed by one eligible customer account only. Availability, plan eligibility, and successful application are not guaranteed; confirm the discount in the Google Workspace billing summary.'
      }] : [])
    ],
    relatedLinks: relatedLinks(record.relatedRoutes, language)
  };
}

export async function loadArticleEntries() {
  const entries = [];
  const articleFiles = (await walk(path.join(root, 'content/articles')))
    .filter(file => file.endsWith('.json') && !file.endsWith('_example.json'));
  for (const file of articleFiles) {
    entries.push({article: await readJson(file), source: path.relative(root, file).replaceAll('\\', '/'), generated: false});
  }

  const profiles = {
    ...await readJson(path.join(expansionRoot, 'product-profiles.json')),
    ...await readJson(path.join(expansionRoot, 'product-profiles-expansion.json'))
  };
  const comparisons = await readJson(path.join(expansionRoot, 'bilingual-comparisons.json'));
  for (const record of comparisons) {
    for (const language of ['ja', 'en']) {
      entries.push({article: comparisonArticle(record, profiles, language), source: `content/article-batches/bilingual-comparisons.json#${record.slug}:${language}`, generated: true});
    }
  }

  const comparisonExpansion = await readJson(path.join(expansionRoot, 'bilingual-comparison-expansion.json'));
  for (const compactRecord of comparisonExpansion) {
    const record = expandCompactComparison(compactRecord, profiles);
    for (const language of ['ja', 'en']) {
      entries.push({article: comparisonArticle(record, profiles, language), source: `content/article-batches/bilingual-comparison-expansion.json#${record.slug}:${language}`, generated: true});
    }
  }

  const comparisonExpansion2 = await readJson(path.join(expansionRoot, 'bilingual-comparison-expansion-2.json'));
  for (const compactRecord of comparisonExpansion2) {
    const record = expandCompactComparison(compactRecord, profiles);
    for (const language of ['ja', 'en']) {
      entries.push({article: comparisonArticle(record, profiles, language), source: `content/article-batches/bilingual-comparison-expansion-2.json#${record.slug}:${language}`, generated: true});
    }
  }

  const comparisonExpansion3 = await readJson(path.join(expansionRoot, 'bilingual-comparison-expansion-3.json'));
  for (const compactRecord of comparisonExpansion3) {
    const record = expandCompactComparison(compactRecord, profiles);
    for (const language of ['ja', 'en']) {
      entries.push({article: comparisonArticle(record, profiles, language), source: `content/article-batches/bilingual-comparison-expansion-3.json#${record.slug}:${language}`, generated: true});
    }
  }

  const reviewExpansion = await readJson(path.join(expansionRoot, 'bilingual-review-expansion.json'));
  for (const record of reviewExpansion) {
    for (const language of ['ja', 'en']) {
      entries.push({article: profileReviewArticle(record, profiles, language), source: `content/article-batches/bilingual-review-expansion.json#${record.slug}:${language}`, generated: true});
    }
  }

  const affiliateIntents = await readJson(path.join(expansionRoot, 'bilingual-affiliate-intents.json'));
  for (const record of affiliateIntents) {
    for (const language of ['ja', 'en']) {
      entries.push({article: profileIntentArticle(record, profiles, language), source: `content/article-batches/bilingual-affiliate-intents.json#${record.slug}:${language}`, generated: true});
    }
  }

  const migrations = await readJson(path.join(expansionRoot, 'legacy-migrations.json'));
  for (const record of migrations) {
    for (const language of ['ja', 'en']) {
      entries.push({article: templatedArticle(record, language), source: `content/article-batches/legacy-migrations.json#${record.slug}:${language}`, generated: true});
    }
  }

  const translations = await readJson(path.join(expansionRoot, 'english-translations.json'));
  for (const record of translations) {
    entries.push({article: templatedArticle(record, 'en'), source: `content/article-batches/english-translations.json#${record.slug}:en`, generated: true});
  }
  return entries;
}
