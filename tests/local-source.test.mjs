import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {validateCollection,validateInventory} from '../packages/tokens/index.mjs';
import {validateInventoryFiles} from '../tooling/inventory-files.mjs';
const collection={schemaVersion:1,id:'private-example',title:'Private example',kind:'app',renderer:'dom',summary:'Local fictional preview.',tokens:'tokens.json',themes:['light'],source:{repository:'local:private-example',visibility:'local-only',revision:null,path:'.'},provenance:{status:'author-owned',sources:[]},license:{spdx:'UNLICENSED',note:'Local only.'},fixtures:[]};
test('local source identity cannot masquerade as a public or unrelated repository',()=>{
 assert.deepEqual(validateCollection(collection),[]);
 for(const source of [{...collection.source,visibility:undefined},{...collection.source,repository:'local:other'},{...collection.source,repository:'file:///private'},{...collection.source,repository:'javascript:alert(1)'}])assert.ok(validateCollection({...collection,source}).length);
 assert.ok(validateCollection({...collection,kind:'reference'}).length);
});
test('unversioned inventory needs immutable source hashes rather than a fabricated commit',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'design-source-'));try{
  const bytes='export const sample = true;\n';await writeFile(join(dir,'sample.mjs'),bytes);
  const snapshot={algorithm:'sha256',files:[{path:'sample.mjs',sha256:createHash('sha256').update(bytes).digest('hex')}]};
  const inventory={schemaVersion:1,application:collection.id,reviewedRevision:null,sourceSnapshot:snapshot,items:[],checks:[]};
  assert.deepEqual(validateInventory(inventory,collection),[]);assert.deepEqual(await validateInventoryFiles(inventory,dir),[]);
  assert.ok(validateInventory({...inventory,sourceSnapshot:undefined}).length);
  assert.ok(validateInventory({...inventory,sourceSnapshot:{...snapshot,files:[snapshot.files[0],snapshot.files[0]]}}).length);
  const missing={...inventory,sourceSnapshot:{algorithm:'sha256',files:[{path:'missing.mjs',sha256:snapshot.files[0].sha256}]}};assert.match((await validateInventoryFiles(missing,dir)).join(' '),/Missing|Cannot verify/);
  await symlink('../outside-source.mjs',join(dir,'escape.mjs'));const escaped={...inventory,sourceSnapshot:{algorithm:'sha256',files:[{path:'escape.mjs',sha256:snapshot.files[0].sha256}]}};assert.ok((await validateInventoryFiles(escaped,dir)).length);
  await writeFile(join(dir,'sample.mjs'),'changed');assert.match((await validateInventoryFiles(inventory,dir)).join(' '),/hash mismatch/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
