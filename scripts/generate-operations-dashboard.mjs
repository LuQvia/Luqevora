import fs from 'node:fs/promises';
import path from 'node:path';
import {root, readJson, writeFile, esc} from './lib.mjs';
import {loadArticleEntries} from './load-articles.mjs';

const site = await readJson(path.join(root, 'content/config/site.json'));
const catalog = await readJson(path.join(root, 'content/products/catalog.json'));
const affiliates = await readJson(path.join(root, 'content/config/affiliates.json'));
const entries = await loadArticleEntries();
const articles = entries.map(x => x.article).filter(x => x.status === 'published');
const today = new Date(`${site.defaultVerifiedAt}T00:00:00Z`);
const cadence = {review:30, comparison:45, guide:90, news:14};
const addDays=(d,n)=>new Date(d.getTime()+n*86400000);
const iso=d=>d.toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((b-a)/86400000);
const affiliateKeys = new Set(Object.keys(affiliates?.links || affiliates || {}));

const articleRows = articles.map(a=>{
  const verified = new Date(`${a.verifiedAt || a.updatedAt || a.publishedAt}T00:00:00Z`);
  const interval = cadence[a.type] || 90;
  const nextReview = addDays(verified, interval);
  const daysRemaining = daysBetween(today,nextReview);
  const usedKeys = [...new Set((a.ctas||[]).map(c=>c.affiliateKey).filter(Boolean))];
  const configuredAffiliateKeys = usedKeys.filter(k=>affiliateKeys.has(k));
  const referenceKeys = usedKeys.filter(k=>!affiliateKeys.has(k));
  const sourceCount=(a.sources||[]).length;
  let status='current';
  if(daysRemaining<0) status='overdue'; else if(daysRemaining<=14) status='due-soon';
  const priority=(status==='overdue'?100:status==='due-soon'?60:0)+(a.featured?15:0)+(usedKeys.length?10:0)+(sourceCount<2?20:0);
  return {id:a.id,language:a.language,type:a.type,title:a.title,url:`/${a.language}/${a.category}/${a.slug}/`,category:a.category,verifiedAt:iso(verified),nextReview:iso(nextReview),daysRemaining,status,sourceCount,affiliateKeys:configuredAffiliateKeys,referenceKeys,priority};
}).sort((a,b)=>b.priority-a.priority || a.daysRemaining-b.daysRemaining || a.title.localeCompare(b.title));

const productRows=(catalog.products||[]).map(p=>{
  const verified=new Date(`${p.lastVerified||catalog.lastVerified||site.defaultVerifiedAt}T00:00:00Z`);
  const nextReview=addDays(verified,45);
  const daysRemaining=daysBetween(today,nextReview);
  const status=daysRemaining<0?'overdue':daysRemaining<=14?'due-soon':'current';
  return {id:p.id,name:p.name,category:p.category,pricingModel:p.pricingModel,lastVerified:iso(verified),nextReview:iso(nextReview),daysRemaining,status,sourceCount:(p.sources||[]).length,relatedArticleCount:(p.relatedArticles||[]).length,affiliateKey:p.affiliateKey||'',affiliateConfigured:!p.affiliateKey||affiliateKeys.has(p.affiliateKey)};
});

const sourceMap=new Map();
for(const a of articles) for(const s of a.sources||[]){ if(!s.url) continue; const item=sourceMap.get(s.url)||{url:s.url,count:0,articles:[]}; item.count++; item.articles.push(a.id); sourceMap.set(s.url,item); }
for(const p of catalog.products||[]) for(const s of p.sources||[]){ if(!s.url) continue; const item=sourceMap.get(s.url)||{url:s.url,count:0,articles:[]}; item.count++; item.articles.push(`product:${p.id}`); sourceMap.set(s.url,item); }
const sources=[...sourceMap.values()].sort((a,b)=>b.count-a.count || a.url.localeCompare(b.url));
const invalidSources=sources.filter(s=>!/^https:\/\//i.test(s.url));
const duplicateSources=sources.filter(s=>s.count>=8);
const summary={generatedAt:new Date().toISOString(),referenceDate:site.defaultVerifiedAt,articles:articles.length,products:productRows.length,overdueArticles:articleRows.filter(x=>x.status==='overdue').length,dueSoonArticles:articleRows.filter(x=>x.status==='due-soon').length,overdueProducts:productRows.filter(x=>x.status==='overdue').length,dueSoonProducts:productRows.filter(x=>x.status==='due-soon').length,articlesWithAffiliate:articleRows.filter(x=>x.affiliateKeys.length).length,nonAffiliateCtaReferences:articleRows.reduce((n,x)=>n+x.referenceKeys.length,0),missingAffiliateConfigurations:productRows.filter(x=>!x.affiliateConfigured).length,uniqueOfficialSources:sources.length,invalidSourceUrls:invalidSources.length,highReuseSourceUrls:duplicateSources.length};
const report={schemaVersion:'1.0.0',summary,cadenceDays:cadence,articles:articleRows,products:productRows,sourceIntegrity:{invalid:invalidSources,highReuse:duplicateSources.slice(0,100)}};
await writeFile(path.join(root,'reports','operations-dashboard.json'),`${JSON.stringify(report,null,2)}\n`);

const statusLabel={current:'Current','due-soon':'Due soon',overdue:'Overdue'};
const metric=(label,value)=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
const rows=articleRows.slice(0,200).map(r=>`<tr><td><span class="status ${r.status}">${statusLabel[r.status]}</span></td><td>${esc(r.nextReview)}</td><td>${esc(r.language.toUpperCase())}</td><td>${esc(r.type)}</td><td><a href="${esc(r.url)}">${esc(r.title)}</a></td><td>${r.sourceCount}</td><td>${esc(r.affiliateKeys.join(', ')||'—')}</td></tr>`).join('');
const productTable=productRows.sort((a,b)=>a.daysRemaining-b.daysRemaining||a.name.localeCompare(b.name)).map(r=>`<tr><td><span class="status ${r.status}">${statusLabel[r.status]}</span></td><td>${esc(r.nextReview)}</td><td>${esc(r.name)}</td><td>${esc(r.category)}</td><td>${r.sourceCount}</td><td>${r.relatedArticleCount}</td><td>${r.affiliateConfigured?'OK':'Missing'}</td></tr>`).join('');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Luqevora.com Operations Dashboard</title><style>body{font-family:system-ui,sans-serif;margin:0;background:#f4f6f8;color:#17202a}main{max-width:1440px;margin:auto;padding:32px}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.metric{background:#fff;border:1px solid #d9e0e6;border-radius:12px;padding:16px}.metric span{display:block;color:#667085;font-size:13px}.metric strong{font-size:28px}.panel{background:#fff;border:1px solid #d9e0e6;border-radius:12px;padding:20px;margin-top:20px;overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;padding:10px;border-bottom:1px solid #e8edf1;white-space:nowrap}td:nth-child(5){white-space:normal;min-width:320px}.status{padding:4px 8px;border-radius:999px;font-weight:700}.current{background:#e8f7ee;color:#176b3a}.due-soon{background:#fff4d6;color:#825b00}.overdue{background:#fde8e8;color:#9b1c1c}code{background:#eef2f5;padding:2px 5px;border-radius:4px}a{color:#175cd3}h1{margin-bottom:4px}.muted{color:#667085}</style></head><body><main><h1>Luqevora.com Operations Dashboard</h1><p class="muted">Generated ${esc(summary.generatedAt)} · Reference date ${esc(summary.referenceDate)} · Internal report, not published to the website.</p><section class="metrics">${metric('Published articles',summary.articles)}${metric('Catalog products',summary.products)}${metric('Articles due soon',summary.dueSoonArticles)}${metric('Articles overdue',summary.overdueArticles)}${metric('Products due soon',summary.dueSoonProducts)}${metric('Affiliate articles',summary.articlesWithAffiliate)}${metric('Unique official sources',summary.uniqueOfficialSources)}${metric('Configuration issues',summary.missingAffiliateConfigurations+summary.invalidSourceUrls)}</section><section class="panel"><h2>Article review queue</h2><p>Cadence: review 30 days, comparison 45 days, guide 90 days. Showing the top 200 priority records.</p><table><thead><tr><th>Status</th><th>Next review</th><th>Lang</th><th>Type</th><th>Article</th><th>Sources</th><th>Affiliate keys</th></tr></thead><tbody>${rows}</tbody></table></section><section class="panel"><h2>Product catalog review queue</h2><table><thead><tr><th>Status</th><th>Next review</th><th>Product</th><th>Category</th><th>Sources</th><th>Articles</th><th>Affiliate config</th></tr></thead><tbody>${productTable}</tbody></table></section><section class="panel"><h2>Automated checks</h2><p>Invalid official-source URLs: <strong>${summary.invalidSourceUrls}</strong></p><p>Missing affiliate configurations: <strong>${summary.missingAffiliateConfigurations}</strong></p><p>Highly reused source URLs (8+ references): <strong>${summary.highReuseSourceUrls}</strong>. These are review signals, not errors.</p><p>Machine-readable report: <code>reports/operations-dashboard.json</code></p></section></main></body></html>`;
await writeFile(path.join(root,'reports','operations-dashboard.html'),html);
console.log(`Generated operations dashboard: ${articles.length} articles, ${productRows.length} products.`);
