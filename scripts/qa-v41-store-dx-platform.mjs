import fs from 'node:fs/promises';
import path from 'node:path';
import {root, walk} from './lib.mjs';

const checks=[];
const pass=(name,detail='')=>checks.push({name,ok:true,detail});
const fail=(name,detail='')=>checks.push({name,ok:false,detail});
async function exists(file){try{await fs.access(file);return true;}catch{return false;}}
async function read(rel){return fs.readFile(path.join(root,rel),'utf8');}
async function json(rel){return JSON.parse(await read(rel));}
function check(name,condition,detail=''){condition?pass(name,detail):fail(name,detail);}

const pkg=await json('package.json');
check('package version supports Store DX v4.1+', Number(pkg.version.split('.')[0])>4 || (Number(pkg.version.split('.')[0])===4 && Number(pkg.version.split('.')[1])>=1), pkg.version);
const platform=await json('content/config/store-dx-platform.json');
check('platform config version',platform.version==='4.1.0',platform.version);
check('platform has five solution groups',['pos','payments','reservations','retention','accounting'].every(k=>Array.isArray(platform.productGroups[k])&&platform.productGroups[k].length>0));

const slugs=['store-dx-implementation-roadmap','store-dx-stack-comparison','salon-store-dx-guide','retail-store-dx-guide'];
for(const lang of ['ja','en']){
  for(const slug of slugs){
    const rel=`content/articles/${lang}/${slug}.json`;
    check(`${lang} article exists: ${slug}`,await exists(path.join(root,rel)));
    if(await exists(path.join(root,rel))){const a=await json(rel);check(`${lang} article published: ${slug}`,a.status==='published'&&a.category==='store-dx'&&a.translationKey===slug);}
  }
}

const catalog=await json('content/products/catalog.json');
const productIds=new Set((catalog.products||[]).map(p=>p.id));
for(const id of ['stores-reservation','line-official-account','freee-accounting','moneyforward-cloud-accounting']) check(`catalog includes ${id}`,productIds.has(id));

const affiliates=await json('content/config/affiliates.json');
for(const key of ['stores-reservation-official','line-official-account-official','freee-accounting-official','moneyforward-accounting-official','luqevora-store-dx-diagnosis','luqevora-store-dx-diagnosis-en','luqvia-store-dx-line']){
  check(`official CTA configured: ${key}`,affiliates.links?.[key]?.type==='official');
}

for(const lang of ['ja','en']){
  const hubRel=`public/${lang}/store-dx/index.html`;
  const diagRel=`public/${lang}/store-dx-assessment/index.html`;
  check(`${lang} Store DX hub generated`,await exists(path.join(root,hubRel)));
  check(`${lang} Store DX diagnosis generated`,await exists(path.join(root,diagRel)));
  if(await exists(path.join(root,hubRel))){
    const html=await read(hubRel);
    check(`${lang} hub canonical`,html.includes(`rel="canonical" href="https://luqevora.com/${lang}/store-dx/"`));
    check(`${lang} hub diagnosis CTA`,html.includes(`/${lang}/store-dx-assessment/`));
    check(`${lang} hub structured data`,/<script type="application\/ld\+json">/.test(html));
    check(`${lang} hub consultation route`,html.includes('https://lin.ee/nTfIJLT'));
    for(const id of ['air-regi','square-pos','stores-reservation','line-official-account','freee-accounting','moneyforward-cloud-accounting']) check(`${lang} hub links product ${id}`,html.includes(`/${lang}/products/${id}/`));
  }
  if(await exists(path.join(root,diagRel))){
    const html=await read(diagRel);
    check(`${lang} diagnosis canonical`,html.includes(`rel="canonical" href="https://luqevora.com/${lang}/store-dx-assessment/"`));
    check(`${lang} diagnosis JavaScript`,html.includes('/assets/js/store-dx-diagnosis-v4.1.0.js'));
    check(`${lang} diagnosis has industry options`,['restaurant','salon','retail','service'].every(v=>html.includes(`value="${v}"`)));
    check(`${lang} diagnosis has pain options`,['checkout','booking','orders','inventory','retention','accounting','website','staffing'].every(v=>html.includes(`value="${v}"`)));
    check(`${lang} diagnosis privacy copy`,lang==='ja'?html.includes('入力内容は送信されません'):html.includes('Inputs are not submitted'));
    const ld=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>m[1]);
    let valid=true;try{ld.forEach(x=>JSON.parse(x));}catch{valid=false;}
    check(`${lang} diagnosis JSON-LD valid`,valid&&ld.length>0);
  }
}

check('diagnosis asset copied',await exists(path.join(root,'public/assets/js/store-dx-diagnosis-v4.1.0.js')));
const sitemapPages=await read('public/sitemaps/pages.xml');
for(const lang of ['ja','en']) check(`${lang} diagnosis in sitemap`,sitemapPages.includes(`https://luqevora.com/${lang}/store-dx-assessment/`));
for(const lang of ['ja','en']){
  const sitemap=await read(`public/sitemaps/articles-${lang}.xml`);
  for(const slug of slugs) check(`${lang} sitemap article ${slug}`,sitemap.includes(`https://luqevora.com/${lang}/store-dx/${slug}/`));
}
const search=await json('public/search-index.json');
for(const lang of ['ja','en']) for(const slug of slugs) check(`${lang} search article ${slug}`,search.some(x=>x.url===`/${lang}/store-dx/${slug}/`));

const publicFiles=await walk(path.join(root,'public'));
check('public HTML count remains substantial',publicFiles.filter(f=>f.endsWith('.html')).length>950,String(publicFiles.filter(f=>f.endsWith('.html')).length));
const failures=checks.filter(x=>!x.ok);
const report={version:'4.1.0',generatedAt:new Date().toISOString(),total:checks.length,passed:checks.length-failures.length,failed:failures.length,checks};
await fs.writeFile(path.join(root,'reports/v4.1-store-dx-platform-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Store DX v4.1 QA: ${report.passed}/${report.total} passed.`);
if(failures.length){for(const item of failures)console.error(`FAIL: ${item.name}${item.detail?` — ${item.detail}`:''}`);process.exitCode=1;}
