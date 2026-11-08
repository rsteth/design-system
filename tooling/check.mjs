import {readFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join,dirname} from 'node:path';
import {validateCollection,validateTokens,validateInventory} from '../packages/tokens/index.mjs';
const errors=[]; let count=0;
async function walk(dir) {
  let entries; try {entries=await readdir(dir,{withFileTypes:true});} catch(error){if(error.code==='ENOENT')return;throw error;}
  for(const entry of entries){const file=join(dir,entry.name);if(entry.isDirectory())await walk(file);else {
    if(file.endsWith('.mjs')) { const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status)errors.push(`${file}: ${result.stderr}`);count++; }
    if(file.endsWith('.json')) { try {const value=JSON.parse(await readFile(file,'utf8'));if(entry.name==='collection.json'){ const collectionErrors=validateCollection(value); errors.push(...collectionErrors.map(e=>`${file}: ${e}`)); if(value.inventory&&!collectionErrors.length){const inventory=JSON.parse(await readFile(join(dirname(file),value.inventory),'utf8'));errors.push(...validateInventory(inventory,value).map(e=>`${file}: ${e}`));}} if(entry.name==='inventory.json')errors.push(...validateInventory(value).map(e=>`${file}: ${e}`));if(entry.name==='tokens.json')errors.push(...validateTokens(value).map(e=>`${file}: ${e}`));count++;}catch(error){errors.push(`${file}: ${error.message}`);} }
  }}
}
for(const dir of ['packages','tooling','tests','apps','templates','registry','collections'])await walk(dir);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Validated ${count} JavaScript/JSON files. Core is plain JS; declarations are exercised by consumer TypeScript builds.`);
