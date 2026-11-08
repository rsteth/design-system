import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateInventory,isLocalPath,validateCollection} from '../packages/tokens/index.mjs';
import {validateInventoryFiles} from '../tooling/inventory-files.mjs';
const collection={id:'focus',fixtures:[{id:'button'}]};
const inventory=()=>({schemaVersion:1,application:'focus',reviewedRevision:'a'.repeat(40),items:[{id:'button',title:'Button',kind:'component',source:['src/button.tsx'],fixtures:['button'],states:['default','disabled'],coverage:'covered',notes:''}],checks:[{id:'unit',label:'Unit tests',command:'npm test',status:'passed',scope:'Button unit tests only',evidence:'evidence/unit.txt'}]});
test('inventory accepts recorded coverage and checks without asserting live success',()=>assert.deepEqual(validateInventory(inventory(),collection),[]));
test('empty inventory is valid but not a completion assertion',()=>assert.deepEqual(validateInventory({...inventory(),items:[],checks:[]},collection),[]));
test('inventory rejects duplicates, bad revision, wrong application and missing fixture references',()=>{
 for(const mutate of [v=>v.items.push(v.items[0]),v=>v.checks.push(v.checks[0]),v=>v.reviewedRevision='HEAD',v=>v.application='stethem',v=>v.items[0].fixtures=['unknown'],v=>v.items[0].fixtures=[]]){const v=inventory();mutate(v);assert.ok(validateInventory(v,collection).length);}
});
test('domain coverage does not demand UI fixtures; partial/excluded/blocked require reasons',()=>{
 const v=inventory();v.items[0].kind='domain';v.items[0].fixtures=[];assert.deepEqual(validateInventory(v,collection),[]);
 for(const coverage of ['partial','excluded','blocked']){v.items[0].coverage=coverage;v.items[0].notes='';assert.ok(validateInventory(v,collection).length);v.items[0].notes='Not a browser surface';assert.deepEqual(validateInventory(v,collection),[]);}
});
test('source, inventory and evidence paths cannot traverse or name remote resources',()=>{
 for(const path of ['/etc/passwd','../secret','src/../../secret','a//b','a/./b','file:///tmp/x','https://example.com/x','a\\b','a%2fb','a?x','a#x','a\u0000b']){
  assert.equal(isLocalPath(path),false,path);const v=inventory();v.items[0].source=[path];v.checks[0].evidence=path;assert.ok(validateInventory(v,collection).length);
  assert.ok(validateCollection({inventory:path}).some(error=>error.includes('inventory')));
 }
 assert.equal(isLocalPath('src/views/button.tsx'),true);
});
test('malformed inventory entries report errors instead of throwing',()=>{
 for(const mutate of [v=>v.items=[null],v=>v.checks=[null],v=>v.items[0].notes=2,v=>v.items[0].source='file',v=>v.items[0].states=[null],v=>v.checks[0].status='verified']){const v=inventory();mutate(v);assert.ok(validateInventory(v,collection).length);}
});
test('file validation checks existence and prevents symlink escape',async()=>{
 const root=await mkdtemp(join(tmpdir(),'inventory-test-'));
 try{await writeFile(join(root,'source.js'),'');await symlink('/etc/hosts',join(root,'escape'));
 const v={items:[{source:['source.js']}],checks:[]};assert.deepEqual(await validateInventoryFiles(v,root),[]);
 v.items[0].source=['missing','escape'];const errors=await validateInventoryFiles(v,root);assert.equal(errors.length,2);assert.ok(errors.some(e=>e.includes('escapes')));assert.ok(errors.some(e=>e.includes('Missing')));
 }finally{await rm(root,{recursive:true,force:true});}
});

test('inventory contract supports future apps and the Workbench itself',()=>{
 for(const id of ['future-app','workbench'])assert.deepEqual(validateInventory({...inventory(),application:id},{...collection,id}),[]);
 const v=inventory();v.application='Bad Application';assert.ok(validateInventory(v).length);
});
