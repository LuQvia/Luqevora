import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './lib.mjs';

const checks=[];
const check=(name,ok,detail='')=>checks.push({name,ok:Boolean(ok),detail:String(detail||'')});
const read=rel=>fs.readFile(path.join(root,rel),'utf8');
const json=async rel=>JSON.parse(await read(rel));

const pkg=await json('package.json');
const config=await json('content/config/luqvia-service.json');
check('package version supports LuQvia v4.2+', Number(pkg.version.split('.')[0])>4 || (Number(pkg.version.split('.')[0])===4 && Number(pkg.version.split('.')[1])>=2),pkg.version);
check('LuQvia service config version supports v4.2+', Number(config.version.split('.')[0])>4 || (Number(config.version.split('.')[0])===4 && Number(config.version.split('.')[1])>=2),config.version);
check('LuQvia service integration enabled',config.enabled===true);
check('at least twenty conversion-focused comparison articles configured',(config.targetArticles||[]).length>=20,(config.targetArticles||[]).length);
check('production price retained',config.pricing?.productionValue==='1ページ 11,000円 × ページ数',config.pricing?.productionValue);
check('monthly price retained',config.pricing?.monthlyValue==='月額 11,000円',config.pricing?.monthlyValue);
check('official website configured',config.urls?.website==='https://www.luqvia.com/',config.urls?.website);
check('free diagnosis configured',config.urls?.diagnosis==='https://forms.gle/LFzrDn36osnjPEd6A',config.urls?.diagnosis);
check('official LINE configured',config.urls?.line==='https://lin.ee/nTfIJLT',config.urls?.line);

for(const target of config.targetArticles||[]){
  const sourceRel=`content/articles/ja/${target.slug}.json`;
  let article=null;
  try{article=await json(sourceRel);}catch{}
  check(`source exists: ${target.slug}`,Boolean(article),sourceRel);
  if(!article) continue;
  check(`source is intended comparison: ${target.slug}`,article.language==='ja'&&article.type==='comparison'&&article.category===target.category,`${article.language}/${article.type}/${article.category}`);
  check(`source updated date: ${target.slug}`,article.updatedAt==='2026-07-20',article.updatedAt);
  const publicRel=`public/ja/${target.category}/${target.slug}/index.html`;
  let html='';
  try{html=await read(publicRel);}catch{}
  check(`public page exists: ${target.slug}`,Boolean(html),publicRel);
  if(!html) continue;
  const panel=html.match(/<section class="luqvia-service-panel"[\s\S]*?<\/section>/)?.[0]||'';
  check(`single LuQvia panel: ${target.slug}`,(html.match(/id="luqvia-service"/g)||[]).length===1,(html.match(/id="luqvia-service"/g)||[]).length);
  check(`operator relationship disclosed: ${target.slug}`,panel.includes('記事内の比較評価とは区別して掲載します'));
  check(`production pricing visible: ${target.slug}`,panel.includes('1ページ 11,000円 × ページ数'));
  check(`monthly pricing visible: ${target.slug}`,panel.includes('月額 11,000円'));
  check(`website CTA with source attribution: ${target.slug}`,panel.includes('data-track-event="luqvia_website_open"')&&panel.includes(`utm_content=${target.slug}`));
  check(`diagnosis CTA: ${target.slug}`,panel.includes('data-track-event="luqvia_diagnosis_open"')&&panel.includes('https://forms.gle/LFzrDn36osnjPEd6A'));
  check(`LINE CTA: ${target.slug}`,panel.includes('data-track-event="luqvia_line_open"')&&panel.includes('https://lin.ee/nTfIJLT'));
  check(`operator panel is not affiliate marked: ${target.slug}`,!panel.includes('sponsored')&&!panel.includes('data-affiliate-link'));
  check(`table of contents link: ${target.slug}`,html.includes('<a href="#luqvia-service">LuQviaのHP制作</a>'));
  const jsonLd=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
  check(`Service structured data: ${target.slug}`,JSON.stringify(jsonLd).includes('luqvia-website-production'));
}

const control=await read('public/ja/ai-tools/chatgpt-vs-claude/index.html');
check('unrelated comparison does not show LuQvia panel',!control.includes('id="luqvia-service"'));
const validation=await json('reports/validation.json');
const audit=await json('reports/content-audit.json');
check('public validation errors are zero',validation.errorCount===0,validation.errorCount);
check('public validation warnings are zero',validation.warningCount===0,validation.warningCount);
check('content audit errors are zero',audit.summary?.errorCount===0,audit.summary?.errorCount);
check('content audit warnings are zero',audit.summary?.warningCount===0,audit.summary?.warningCount);

const failures=checks.filter(item=>!item.ok);
const report={version:'4.2.0',generatedAt:new Date().toISOString(),targetArticles:(config.targetArticles||[]).length,total:checks.length,passed:checks.length-failures.length,failed:failures.length,checks};
await fs.writeFile(path.join(root,'reports/v4.2-luqvia-website-production-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`LuQvia website-production v4.2 QA: ${report.passed}/${report.total} passed.`);
if(failures.length){for(const item of failures) console.error(`FAIL: ${item.name}${item.detail?` — ${item.detail}`:''}`);process.exitCode=1;}
