import fs from 'node:fs/promises';
import path from 'node:path';
import {root,walk,writeFile} from './lib.mjs';
const legacy=path.join(root,'legacy');
const files=await walk(legacy).catch(()=>[]);
const rows=[];
for(const file of files){
  const rel=path.relative(legacy,file).replaceAll('\\','/');
  const stat=await fs.stat(file);
  rows.push({path:rel,extension:path.extname(file).toLowerCase(),bytes:stat.size});
}
await writeFile(path.join(root,'reports','legacy-inventory.json'),JSON.stringify({generatedAt:new Date().toISOString(),count:rows.length,files:rows},null,2));
console.log(`Inventory: ${rows.length} files`);
