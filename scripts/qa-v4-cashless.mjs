import fs from 'node:fs';
import path from 'node:path';
import {root} from './lib.mjs';
const routes=['air-regi-review','airpay-review','square-pos-review','paycas-mobile-review','airpay-vs-square','square-vs-paycas-mobile','air-regi-vs-square-pos','pos-register-vs-cashless-payment'];
const sitemap=['public/sitemap.xml','public/sitemaps/articles-ja.xml','public/sitemaps/articles-en.xml','public/sitemaps/pages.xml','public/sitemaps/topics-ja.xml','public/sitemaps/topics-en.xml'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const feeds={ja:fs.readFileSync(path.join(root,'public/feed-ja.xml'),'utf8'),en:fs.readFileSync(path.join(root,'public/feed-en.xml'),'utf8')};
const search=JSON.parse(fs.readFileSync(path.join(root,'public/search-index.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'content/products/catalog.json'),'utf8'));
const checks=[];
const push=(name,pass,detail='')=>checks.push({name,pass,detail});
for(const lang of ['ja','en']){
 push(`${lang} category page`,fs.existsSync(path.join(root,`public/${lang}/cashless-payments/index.html`)));
 for(const topic of ['cashless-payment-services','pos-payment-integration']) push(`${lang} topic ${topic}`,fs.existsSync(path.join(root,`public/${lang}/topics/${topic}/index.html`)));
 for(const slug of routes){
  const route=`/${lang}/cashless-payments/${slug}/`;
  const file=path.join(root,`public/${lang}/cashless-payments/${slug}/index.html`);
  const html=fs.readFileSync(file,'utf8');
  const jsonLd=[...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>JSON.parse(m[1]));
  const types=JSON.stringify(jsonLd);
  push(`${route} file`,true);
  push(`${route} sitemap`,sitemap.includes(route));
  push(`${route} RSS`,feeds[lang].includes(route));
  push(`${route} search`,search.some(x=>x.url===route));
  push(`${route} Article schema`,types.includes('Article')||types.includes('BlogPosting'));
  push(`${route} FAQ schema`,types.includes('FAQPage'));
  push(`${route} internal related links`,(html.match(/class=["'][^"']*related-article-card/g)||[]).length>=3,`${(html.match(/class=["'][^"']*related-article-card/g)||[]).length}`);
 }
}
for(const id of ['air-regi','airpay','square-pos','paycas-mobile']){
 const product=catalog.products.find(x=>x.id===id);
 push(`catalog ${id}`,Boolean(product));
 push(`catalog category ${id}`,product?.category==='cashless-payments',product?.category||'missing');
 push(`catalog sources ${id}`,(product?.sources||[]).length>=2,`${product?.sources?.length||0}`);
}
for(const item of [
 ['ja/air-regi-vs-square-pos','emeao-pos-free'],
 ['ja/pos-register-vs-cashless-payment','kantan-chumon-short']
]){
 const html=fs.readFileSync(path.join(root,`public/${item[0].split("/")[0]}/cashless-payments/${item[0].split("/")[1]}/index.html`),'utf8');
 push(`${item[0]} A8 key`,html.includes(`data-affiliate-key="${item[1]}"`));
 push(`${item[0]} A8 click URL`,html.includes('https://px.a8.net/svt/ejp?'));
 push(`${item[0]} A8 pixel`,/https:\/\/www\d+\.a8\.net\/0\.gif\?/i.test(html));
 push(`${item[0]} first-view disclosure`,html.includes('hero-affiliate-disclosure'));
}
for(const route of ['ja/air-regi-review','ja/airpay-review','ja/square-pos-review','ja/paycas-mobile-review','en/air-regi-review','en/airpay-review','en/square-pos-review','en/paycas-mobile-review']){
 const html=fs.readFileSync(path.join(root,`public/${route.split("/")[0]}/cashless-payments/${route.split("/")[1]}/index.html`),'utf8');
 push(`${route} official CTA`,html.includes('data-official-link="true"'));
 push(`${route} no fabricated A8`,!html.includes('https://px.a8.net/svt/ejp?'));
}
const validation=JSON.parse(fs.readFileSync(path.join(root,'reports/validation.json'),'utf8'));
const audit=JSON.parse(fs.readFileSync(path.join(root,'reports/content-audit.json'),'utf8'));
push('site validation errors',validation.errorCount===0,`${validation.errorCount}`);
push('site validation warnings',validation.warningCount===0,`${validation.warningCount}`);
push('content audit errors',audit.summary.errorCount===0,`${audit.summary.errorCount}`);
push('content audit warnings',audit.summary.warningCount===0,`${audit.summary.warningCount}`);
const failed=checks.filter(x=>!x.pass);
const report={generatedAt:new Date().toISOString(),scope:'Luqevora v4.0 cashless payments',routes:routes.length*2,checks:checks.length,passed:checks.length-failed.length,failed:failed.length,failures:failed,checksDetail:checks};
fs.writeFileSync(path.join(root,'reports/v4-cashless-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checks:report.checks,passed:report.passed,failed:report.failed},null,2));
if(failed.length) process.exit(1);
