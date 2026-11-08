#!/usr/bin/env node
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
const root=resolve(process.argv[2] ?? 'vendor/design-system');
const pin=JSON.parse(await readFile(join(root,'pin.json'),'utf8'));
const found=[];
async function walk(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){const relative=prefix+entry.name;if(entry.isDirectory())await walk(join(dir,entry.name),relative+'/');else if(relative!=='pin.json')found.push(relative);}}
await walk(root);
if(found.length!==Object.keys(pin.sha256).length)throw new Error('Vendor file set changed.');
for(const file of found){const hash=createHash('sha256').update(await readFile(join(root,file))).digest('hex');if(hash!==pin.sha256[file])throw new Error(`Vendor integrity mismatch: ${file}`);}
console.log(`Verified ${found.length} vendored source hashes (${pin.status}).`);
