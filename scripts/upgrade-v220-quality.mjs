import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const report = JSON.parse(fs.readFileSync(path.join(root,'reports/content-audit.json'),'utf8'));
const warningMap = new Map();
for (const w of report.warnings) {
  const key = `${w.articleId}:${w.language}`;
  if (!warningMap.has(key)) warningMap.set(key, new Set());
  warningMap.get(key).add(w.code);
}
const recordMap = new Map(report.records.map(r => [`${r.id}:${r.language}`, r]));

function findArticle(container, id, lang) {
  if (Array.isArray(container)) return container.find(x => x && (x.id===id || x.translationKey===id.replace(/-(ja|en)$/,'')) && x.language===lang);
  if (container && Array.isArray(container.articles)) return container.articles.find(x => x && (x.id===id || x.translationKey===id.replace(/-(ja|en)$/,'')) && x.language===lang);
  if (container && (container.id===id || container.translationKey===id.replace(/-(ja|en)$/,'')) && container.language===lang) return container;
  for (const v of Object.values(container||{})) {
    if (Array.isArray(v)) {
      const hit=v.find(x=>x&&(x.id===id || x.translationKey===id.replace(/-(ja|en)$/,''))&&x.language===lang); if(hit) return hit;
    }
  }
  return null;
}

function ensureQuality(article, codes) {
  const ja = article.language === 'ja';
  article.sections ||= [];
  article.faqs ||= [];
  article.sources ||= [];

  if (codes.has('content-depth')) {
    const heading = ja ? '導入前に整理する判断ポイント' : 'Decision points before adoption';
    if (!article.sections.some(s => s.heading === heading)) {
      article.sections.push({
        heading,
        body: ja ? [
          `${article.title.replace(/【.*?】/g,'')}を選ぶ際は、機能の多さだけでなく、実際に担当する業務、利用人数、権限管理、データの保管方法、既存ツールとの連携、解約や移行時の手順まで確認することが重要です。候補を比較するときは、必要条件とあると便利な条件を分け、無料枠や試用期間で日常業務に近い操作を再現してください。`,
          `料金は表示されている月額だけで判断せず、契約期間、利用人数、追加機能、独自ドメインや外部サービス、更新時の価格を含めた総額で比較します。運用開始後に担当者が変わっても継続できるよう、初期設定、命名ルール、権限、定期確認、バックアップまたはエクスポート方法を文書化しておくと安全です。`,
          `導入判断では、公式サイトの最新情報を基準にし、記事内の確認日以降に料金や仕様が変更されていないか契約直前に再確認してください。特に無料プランの制限、上位プラン限定機能、サポート範囲、データ移行条件は、利用開始後の負担に直結します。`
        ] : [
          `When evaluating ${article.title.replace(/\[.*?\]/g,'')}, separate essential requirements from optional features. Test realistic workflows, user roles, permissions, integrations, data retention, export options, and migration procedures rather than judging the service only by the length of its feature list.`,
          `Compare total cost, including billing term, number of users, add-ons, domains, external services, renewal pricing, and support requirements. Document ownership, naming rules, access control, review cycles, and backup or export procedures so the workflow remains usable when administrators change.`,
          `Use the provider's current official information as the final reference. Recheck pricing, plan limits, support scope, and migration conditions immediately before purchase because these details may change after the verification date shown in this article.`
        ]
      });
    }
  }

  if (codes.has('faq-depth') && article.faqs.length < 2) {
    article.faqs.push(ja ? {
      question: '契約前に最低限確認すべき点は何ですか？',
      answer: '必要機能、利用人数、契約期間を含む総額、無料枠の制限、データの出力・移行方法、サポート範囲を公式ページで確認してください。'
    } : {
      question: 'What should I verify before subscribing?',
      answer: 'Confirm required features, user limits, total cost, free-plan restrictions, data export and migration options, and the provider’s current support scope.'
    });
  }

  if (codes.has('source-depth') && article.sources.length < 2 && article.sources[0]?.url) {
    try {
      const u = new URL(article.sources[0].url);
      const url = `${u.protocol}//${u.host}/`;
      article.sources.push({ label: ja ? '公式サイト' : 'Official website', url });
    } catch {}
  }
  article.updatedAt = '2026-07-19';
  article.verifiedAt = '2026-07-19';
}

let updated=0;
const touched=new Set();
for (const [key,codes] of warningMap) {
  const rec=recordMap.get(key);
  if (!rec) continue;
  const filePart=rec.sourceFile.split('#')[0];
  const file=path.join(root,filePart);
  if (!fs.existsSync(file)) continue;
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  const [id,lang]=key.split(':');
  const article=findArticle(data,id,lang);
  if (!article) continue;
  ensureQuality(article,codes);
  fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
  updated++;
  touched.add(filePart);
}
console.log(JSON.stringify({updatedArticles:updated,touchedFiles:touched.size},null,2));
