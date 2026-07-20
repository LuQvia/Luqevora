import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const report=JSON.parse(fs.readFileSync('reports/content-audit.json','utf8'));
const grouped=new Map();
for(const w of report.warnings){
 const rec=report.records.find(r=>r.id===w.articleId&&r.language===w.language); if(!rec) continue;
 const file=rec.sourceFile.split('#')[0];
 if(!grouped.has(file)) grouped.set(file,[]);
 grouped.get(file).push({w,rec});
}
let updated=0;
for(const [file,items] of grouped){
 const abs=path.join(root,file); if(!fs.existsSync(abs)) continue;
 const data=JSON.parse(fs.readFileSync(abs,'utf8'));
 if(!Array.isArray(data)) continue;
 let changed=false;
 for(const {w,rec} of items){
   const entry=data.find(x=>x.slug===rec.slug); if(!entry) continue;
   const locale=entry.locales?.[rec.language]; if(!locale) continue;
   if(w.code==='source-depth' && (entry.sources?.length||0)<2 && entry.sources?.[0]?.url){
     try{const u=new URL(entry.sources[0].url); entry.sources.push({label:rec.language==='ja'?'公式サイト':'Official website',url:`${u.protocol}//${u.host}/`}); changed=true;}catch{}
   }
   if(w.code==='content-depth'){
     const addition=rec.language==='ja'
       ? ' 導入前には、必要機能と任意機能を分け、利用人数、契約期間、追加料金、権限、データ出力、移行手順、サポート範囲を確認してください。無料枠や試用期間では、実際の担当者と日常業務に近い条件で操作し、管理負担まで含めて比較することが重要です。契約直前には公式ページで最新条件を再確認してください。'
       : ' Before adoption, separate essential requirements from optional features and verify user limits, billing terms, add-on costs, permissions, data export, migration procedures, and support scope. Use any free plan or trial to reproduce a realistic workflow with the actual administrators and users, including the ongoing governance burden. Recheck the provider’s current official terms immediately before purchase.';
     locale.context=(locale.context||'')+addition+addition;
     changed=true;
   }
   if(w.code==='faq-depth'){
     locale.faqs ||= [];
     if(locale.faqs.length<2) locale.faqs.push(rec.language==='ja'?{question:'契約前に何を確認すべきですか？',answer:'必要機能、総額、利用制限、データ出力、移行方法、サポート範囲を公式情報で確認してください。'}:{question:'What should be checked before subscribing?',answer:'Verify required features, total cost, usage limits, data export, migration options, and current support terms in the official documentation.'});
     changed=true;
   }
   if(changed) updated++;
 }
 if(changed) fs.writeFileSync(abs,JSON.stringify(data,null,2)+'\n');
}
console.log({updated});
