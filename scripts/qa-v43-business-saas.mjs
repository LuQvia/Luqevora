import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './lib.mjs';

const prospects = JSON.parse(await fs.readFile(path.join(root,'content/config/affiliate-prospects.json'),'utf8'));
const affiliates = JSON.parse(await fs.readFile(path.join(root,'content/config/affiliates.json'),'utf8'));
const seo = JSON.parse(await fs.readFile(path.join(root,'content/config/seo.json'),'utf8'));
const slugs = [
'monday-work-management-plans-comparison','monday-crm-vs-hubspot-crm','monday-multiple-store-operations','monday-web-production-project-management','monday-implementation-checklist',
'google-workspace-pricing-small-business','google-workspace-vs-microsoft-365-small-business','gmail-vs-google-workspace-business-email','google-workspace-domain-email-setup',
'shopify-pricing-total-cost-japan','shopify-vs-base-small-business','shopify-vs-stores-small-business','shopify-launch-checklist-small-store',
'hubspot-free-crm-review-small-business','hubspot-free-vs-starter','hubspot-vs-salesforce-small-business','crm-comparison-small-business-japan',
'hostinger-pricing-renewal-cost-japan','hostinger-vs-xserver-small-business','hostinger-overseas-website-guide'
];
const categories = {
'monday-work-management-plans-comparison':'business-software','monday-crm-vs-hubspot-crm':'business-software','monday-multiple-store-operations':'store-dx','monday-web-production-project-management':'business-software','monday-implementation-checklist':'business-software',
'google-workspace-pricing-small-business':'business-software','google-workspace-vs-microsoft-365-small-business':'business-software','gmail-vs-google-workspace-business-email':'business-software','google-workspace-domain-email-setup':'business-software',
'shopify-pricing-total-cost-japan':'website-builders','shopify-vs-base-small-business':'website-builders','shopify-vs-stores-small-business':'website-builders','shopify-launch-checklist-small-store':'website-builders',
'hubspot-free-crm-review-small-business':'business-software','hubspot-free-vs-starter':'business-software','hubspot-vs-salesforce-small-business':'business-software','crm-comparison-small-business-japan':'business-software',
'hostinger-pricing-renewal-cost-japan':'hosting-security','hostinger-vs-xserver-small-business':'hosting-security','hostinger-overseas-website-guide':'hosting-security'};
const results=[];
const check=(name,pass,detail='')=>results.push({name,pass:Boolean(pass),detail});
check('release has 20 article pairs',slugs.length===20,slugs.length);
check('five prospect programs configured',prospects.programs?.length===5,prospects.programs?.length);
for(const program of prospects.programs){
  check(`unapproved tracking URL absent: ${program.key}`,!affiliates.links?.[program.key],JSON.stringify(affiliates.links?.[program.key]||null));
}
const sitemap = await fs.readFile(path.join(root,'public/sitemap.xml'),'utf8');
const searchData = JSON.parse(await fs.readFile(path.join(root,'public/search-index.json'),'utf8'));
for(const slug of slugs){
  for(const lang of ['ja','en']){
    const category=categories[slug];
    const source=`content/articles/${lang}/${slug}.json`;
    const article=JSON.parse(await fs.readFile(path.join(root,source),'utf8'));
    const file=path.join(root,'public',lang,category,slug,'index.html');
    const html=await fs.readFile(file,'utf8');
    const route=`/${lang}/${category}/${slug}/`;
    check(`source indexed: ${lang}/${slug}`,seo.indexing.includeSourceFiles.includes(source));
    check(`translation key: ${lang}/${slug}`,article.translationKey===slug,article.translationKey);
    check(`official disclosure before approval: ${lang}/${slug}`,html.includes(lang==='ja'?'公開時点でアフィリエイトリンクを含みません':'No affiliate links are included as of publication'));
    check(`official CTA only: ${lang}/${slug}`,html.includes('data-official-link="true"')&&!html.includes('data-affiliate-link="true"'));
    check(`article JSON-LD: ${lang}/${slug}`,html.includes('application/ld+json')&&(html.includes('"Article"')||html.includes('"BlogPosting"')));
    check(`FAQ JSON-LD: ${lang}/${slug}`,html.includes('FAQPage'));
    check(`canonical route: ${lang}/${slug}`,html.includes(`https://luqevora.com${route}`));
    check(`search data: ${lang}/${slug}`,searchData.some(item=>item.url===route));
    const sitemapFiles=['public/sitemaps/articles-ja.xml','public/sitemaps/articles-en.xml'];
    const articleSitemap=await fs.readFile(path.join(root,sitemapFiles[lang==='ja'?0:1]),'utf8');
    check(`article sitemap: ${lang}/${slug}`,articleSitemap.includes(`https://luqevora.com${route}`));
  }
}
check('sitemap index exists',sitemap.includes('/sitemaps/articles-ja.xml')&&sitemap.includes('/sitemaps/articles-en.xml'));
const failed=results.filter(x=>!x.pass);
const report={version:'4.3.0',generatedAt:new Date().toISOString(),total:results.length,passed:results.length-failed.length,failed:failed.length,results};
await fs.writeFile(path.join(root,'reports/v4.3-business-saas-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`v4.3 QA: ${report.passed}/${report.total} passed`);
if(failed.length){for(const item of failed.slice(0,30)) console.error(`FAIL ${item.name}: ${item.detail}`);process.exitCode=1;}
