import path from 'node:path';
import {root, readJson, writeFile, esc} from './lib.mjs';
import {loadArticleEntries} from './load-articles.mjs';

const site = await readJson(path.join(root, 'content/config/site.json'));
const affiliates = await readJson(path.join(root, 'content/config/affiliates.json'));
const catalog = await readJson(path.join(root, 'content/products/catalog.json'));
const entries = await loadArticleEntries();
const articles = entries.map(x=>x.article).filter(x=>x.status==='published');
const configured = affiliates.links || affiliates || {};
const productByAffiliate = new Map((catalog.products||[]).filter(p=>p.affiliateKey).map(p=>[p.affiliateKey,p]));
const intentWeight = {review:35, comparison:30, guide:12, news:4};
const placements=[];
for(const article of articles){
  const seen=new Set();
  for(const cta of article.ctas||[]){
    const key=cta.affiliateKey||''; if(!key||seen.has(`cta:${key}`)) continue; seen.add(`cta:${key}`);
    const isConfigured=Boolean(configured[key]);
    placements.push({articleId:article.id,title:article.title,language:article.language,type:article.type,category:article.category,url:`/${article.language}/${article.category}/${article.slug}/`,affiliateKey:key,placement:'article-cta',configured:isConfigured,product:productByAffiliate.get(key)?.name||'',officialUrl:cta.officialUrl||'',priority:(intentWeight[article.type]||8)+(article.featured?15:0)+(isConfigured?25:-10)});
  }
  (article.sections||[]).forEach((section,index)=>{
    const key=section.affiliateMaterialKey||''; if(!key||seen.has(`section:${key}:${index}`)) return;
    seen.add(`section:${key}:${index}`);
    const isConfigured=Boolean(configured[key]);
    placements.push({articleId:article.id,title:article.title,language:article.language,type:article.type,category:article.category,url:`/${article.language}/${article.category}/${article.slug}/`,affiliateKey:key,placement:`section-${index+1}`,configured:isConfigured,product:productByAffiliate.get(key)?.name||'',officialUrl:'',priority:(intentWeight[article.type]||8)+(article.featured?15:0)+(isConfigured?28:-10)+5});
  });
}
placements.sort((a,b)=>b.priority-a.priority||a.title.localeCompare(b.title));
const byKey={};
for(const p of placements){const r=byKey[p.affiliateKey]||{affiliateKey:p.affiliateKey,configured:p.configured,product:p.product,placements:0,articles:new Set(),languages:new Set(),types:{}};r.placements++;r.articles.add(p.articleId);r.languages.add(p.language);r.types[p.type]=(r.types[p.type]||0)+1;byKey[p.affiliateKey]=r;}
const programs=Object.values(byKey).map(r=>({...r,articles:r.articles.size,languages:[...r.languages].sort()})).sort((a,b)=>b.articles-a.articles||a.affiliateKey.localeCompare(b.affiliateKey));
const articleMap=new Map();
for(const p of placements){const row=articleMap.get(p.articleId)||{articleId:p.articleId,title:p.title,language:p.language,type:p.type,category:p.category,url:p.url,placements:0,configuredPlacements:0,affiliateKeys:new Set(),priority:0};row.placements++;if(p.configured)row.configuredPlacements++;row.affiliateKeys.add(p.affiliateKey);row.priority=Math.max(row.priority,p.priority);articleMap.set(p.articleId,row);}
const articleQueue=[...articleMap.values()].map(r=>({...r,affiliateKeys:[...r.affiliateKeys]})).sort((a,b)=>b.priority-a.priority||b.configuredPlacements-a.configuredPlacements||a.title.localeCompare(b.title));
const summary={generatedAt:new Date().toISOString(),referenceDate:site.defaultVerifiedAt,publishedArticles:articles.length,articlesWithCommercialCta:articleQueue.length,configuredAffiliateArticles:articleQueue.filter(x=>x.configuredPlacements>0).length,totalTrackedPlacements:placements.length,configuredPlacements:placements.filter(x=>x.configured).length,unconfiguredPlacements:placements.filter(x=>!x.configured).length,affiliatePrograms:programs.filter(x=>x.configured).length,measurementStatus:'instrumented-no-performance-import'};
const eventSchema={version:'1.0.0',events:[
{name:'affiliate_click',required:['affiliate_product','affiliate_key','link_position','content_type','content_category','page_language'],purpose:'Measure outbound affiliate intent by program and placement.'},
{name:'official_link_click',required:['product_name','link_position','content_type','content_category','page_language'],purpose:'Measure official-site exits where no affiliate program is configured.'},
{name:'cta_impression',required:['affiliate_key','link_position','content_type','page_language'],purpose:'Measure whether a CTA entered the viewport.'},
{name:'diagnosis_complete',required:['result_count','goal','budget','priority'],purpose:'Measure product-finder completion.'},
{name:'product_click',required:['product_id','link_position','page_language'],purpose:'Measure movement from product hubs or comparison pages.'}
]};
const report={schemaVersion:'1.0.0',summary,eventSchema,programs,articleQueue,placements};
await writeFile(path.join(root,'reports','revenue-optimization.json'),`${JSON.stringify(report,null,2)}\n`);
const csv=['article_id,language,type,category,priority,configured_placements,total_placements,affiliate_keys,url,title',...articleQueue.map(r=>[r.articleId,r.language,r.type,r.category,r.priority,r.configuredPlacements,r.placements,r.affiliateKeys.join('|'),r.url,`"${String(r.title).replaceAll('"','""')}"`].join(','))].join('\n')+'\n';
await writeFile(path.join(root,'reports','revenue-optimization.csv'),csv);
const metric=(label,value)=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
const queueRows=articleQueue.slice(0,250).map(r=>`<tr><td>${r.priority}</td><td>${esc(r.language.toUpperCase())}</td><td>${esc(r.type)}</td><td><a href="${esc(r.url)}">${esc(r.title)}</a></td><td>${r.configuredPlacements}/${r.placements}</td><td>${esc(r.affiliateKeys.join(', '))}</td></tr>`).join('');
const programRows=programs.map(r=>`<tr><td>${r.configured?'Configured':'Reference only'}</td><td>${esc(r.affiliateKey)}</td><td>${esc(r.product||'—')}</td><td>${r.articles}</td><td>${r.placements}</td><td>${esc(r.languages.join(', '))}</td></tr>`).join('');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Luqevora.com Revenue Optimization</title><style>body{font-family:system-ui,sans-serif;margin:0;background:#f4f6f8;color:#17202a}main{max-width:1440px;margin:auto;padding:32px}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.metric,.panel{background:#fff;border:1px solid #d9e0e6;border-radius:12px;padding:18px}.metric span{display:block;color:#667085;font-size:13px}.metric strong{font-size:28px}.panel{margin-top:20px;overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;padding:10px;border-bottom:1px solid #e8edf1}td:nth-child(4){min-width:340px}a{color:#175cd3}.note{border-left:4px solid #175cd3;padding:12px 16px;background:#eef4ff}.muted{color:#667085}code{background:#eef2f5;padding:2px 5px;border-radius:4px}</style></head><body><main><h1>Luqevora.com Revenue Optimization Dashboard</h1><p class="muted">Generated ${esc(summary.generatedAt)} · Internal report. Performance metrics are not estimated.</p><p class="note"><strong>Measurement status:</strong> tracking is instrumented, but GA4/A8 performance exports are not imported. CTR, CVR, EPC and revenue are intentionally omitted until real data is supplied.</p><section class="metrics">${metric('Published articles',summary.publishedArticles)}${metric('Commercial CTA articles',summary.articlesWithCommercialCta)}${metric('Configured affiliate articles',summary.configuredAffiliateArticles)}${metric('Tracked CTA placements',summary.totalTrackedPlacements)}${metric('Configured placements',summary.configuredPlacements)}${metric('Reference-only placements',summary.unconfiguredPlacements)}${metric('Configured programs',summary.affiliatePrograms)}</section><section class="panel"><h2>Optimization queue</h2><p>Priority uses content intent, featured status, configured affiliate availability and CTA position. It is not a revenue prediction.</p><table><thead><tr><th>Priority</th><th>Lang</th><th>Type</th><th>Article</th><th>Configured/All</th><th>Keys</th></tr></thead><tbody>${queueRows}</tbody></table></section><section class="panel"><h2>Affiliate program coverage</h2><table><thead><tr><th>Status</th><th>Key</th><th>Product</th><th>Articles</th><th>Placements</th><th>Languages</th></tr></thead><tbody>${programRows}</tbody></table></section><section class="panel"><h2>Measurement contract</h2><p>Events are documented in <code>reports/revenue-optimization.json</code>. Import actual GA4 and affiliate-network exports before calculating CTR, CVR, EPC or revenue per article.</p></section></main></body></html>`;
await writeFile(path.join(root,'reports','revenue-optimization.html'),html);
console.log(`Generated revenue dashboard: ${articleQueue.length} commercial articles, ${placements.length} placements.`);
