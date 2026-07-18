import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function readJson(file){return JSON.parse(await fs.readFile(file,'utf8'));}
export async function writeFile(file,data){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,data);}
export async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);e.isDirectory()?out.push(...await walk(p)):out.push(p);}return out;}
export function esc(v=''){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
export function render(tpl,data){return tpl.replace(/{{([A-Za-z0-9_]+)}}/g,(_,k)=>data[k]??'');}
export function urlPath(lang,category,slug){return `/${lang}/${category}/${slug}/`;}
