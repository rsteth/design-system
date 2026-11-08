import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,realpath,symlink,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {syncRegistry} from '../tooling/sync-registry.mjs';
const json=value=>JSON.stringify(value,null,2)+'\n';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
async function setup(t){
 const dir=await realpath(await mkdtemp(join(tmpdir(),'registry-sync-')));t.after(()=>rm(dir,{recursive:true,force:true}));
 const root=join(dir,'central');await mkdir(join(root,'registry'),{recursive:true});
 await writeFile(join(root,'registry/index.json'),json({schemaVersion:1,note:'preserve metadata',collections:['../collections/original/workbench/collection.json']}));
 return {dir,root};
}
async function app(dir,id){
 const root=join(dir,id);await mkdir(join(root,'design'),{recursive:true});
 const manifest={schemaVersion:1,id,title:id,summary:'Test app',kind:'app',renderer:'dom',tokens:'tokens.json',themes:['light'],source:{repository:`https://example.com/${id}`,revision:'a'.repeat(40),path:'.'},provenance:{status:'author-owned',sources:[]},license:{spdx:'UNLICENSED',note:'Test only'},fixtures:[]};
 await writeFile(join(root,'design/collection.json'),json(manifest));
 await writeFile(join(root,'design/tokens.json'),json({schemaVersion:1,namespace:id,modes:[{id:'light',selector:':root',tokens:{'color.background':{type:'color',value:'#fff'}}}]}));
 return root;
}
test('refreshing one app retains other app snapshots, order, original collections and index metadata',async t=>{
 const {dir,root}=await setup(t),a=await app(dir,'alpha'),b=await app(dir,'beta');
 await syncRegistry([a,b],{root});
 const before=await readFile(join(root,'registry/apps/beta/collection.json'),'utf8');
 const source=await read(join(a,'design/collection.json'));source.title='Updated alpha';await writeFile(join(a,'design/collection.json'),json(source));
 await syncRegistry([a],{root});
 const index=await read(join(root,'registry/index.json'));
 assert.deepEqual(index.collections,['../collections/original/workbench/collection.json','apps/alpha/collection.json','apps/beta/collection.json']);
 assert.equal(index.note,'preserve metadata');assert.equal(await readFile(join(root,'registry/apps/beta/collection.json'),'utf8'),before);
 assert.equal((await read(join(a,'design/collection.json'))).title,'Updated alpha');
});
test('identical app content retains reviewed integration revision; changed tokens invalidate it',async t=>{
 const {dir,root}=await setup(t),a=await app(dir,'alpha');await syncRegistry([a],{root});
 const path=join(root,'registry/apps/alpha/collection.json'),snapshot=await read(path);
 snapshot.registrySnapshot.integrationRevision='b'.repeat(40);snapshot.registrySnapshot.integrationStatus='unpublished-local-feature-commit';await writeFile(path,json(snapshot));
 const result=await syncRegistry([a],{root});assert.deepEqual(result.changed,[]);
 assert.equal((await read(path)).registrySnapshot.integrationRevision,'b'.repeat(40));
 const tokens=await read(join(a,'design/tokens.json'));tokens.modes[0].tokens['color.background'].value='#000';await writeFile(join(a,'design/tokens.json'),json(tokens));
 await syncRegistry([a],{root});const changed=await read(path);
 assert.equal(changed.registrySnapshot.integrationRevision,null);assert.equal(changed.registrySnapshot.integrationStatus,'unpublished-local-snapshot');assert.equal(changed.registrySnapshot.baseRevision,'a'.repeat(40));
});
test('an unchanged snapshot preserves formatting and escaped Unicode byte for byte',async t=>{
 const {dir,root}=await setup(t),a=await app(dir,'alpha');await syncRegistry([a],{root});
 const path=join(root,'registry/apps/alpha/collection.json'),snapshot=await read(path);snapshot.title='A · title';
 const manifest=await read(join(a,'design/collection.json'));manifest.title=snapshot.title;await writeFile(join(a,'design/collection.json'),json(manifest));
 const bytes=JSON.stringify(snapshot).replace('·','\\u00b7');await writeFile(path,bytes);
 assert.deepEqual((await syncRegistry([a],{root,check:true})).changed,[]);await syncRegistry([a],{root});assert.equal(await readFile(path,'utf8'),bytes);
});
test('manifest edits invalidate revision even when token bytes match; app-supplied snapshot claims are ignored',async t=>{
 const {dir,root}=await setup(t),a=await app(dir,'alpha');await syncRegistry([a],{root});
 const path=join(root,'registry/apps/alpha/collection.json'),snapshot=await read(path);snapshot.registrySnapshot.integrationRevision='b'.repeat(40);await writeFile(path,json(snapshot));
 const manifest=await read(join(a,'design/collection.json'));manifest.title='Changed';manifest.registrySnapshot={integrationRevision:'c'.repeat(40)};await writeFile(join(a,'design/collection.json'),json(manifest));
 await syncRegistry([a],{root});assert.equal((await read(path)).registrySnapshot.integrationRevision,null);
});
test('--check reports drift without writes, then is clean after explicit refresh',async t=>{
 const {dir,root}=await setup(t),a=await app(dir,'alpha');const before=await readFile(join(root,'registry/index.json'),'utf8');
 const drift=await syncRegistry([a],{root,check:true});assert.equal(drift.changed.length,3);assert.equal(await readFile(join(root,'registry/index.json'),'utf8'),before);await assert.rejects(readFile(join(root,'registry/apps/alpha/collection.json')),/ENOENT/);
 await syncRegistry([a],{root});assert.deepEqual((await syncRegistry([a],{root,check:true})).changed,[]);
});
test('invalid batch and duplicate ids fail before any registry writes',async t=>{
 const {dir,root}=await setup(t),a=await app(dir,'alpha'),b=await app(dir,'beta');
 const tokens=await read(join(b,'design/tokens.json'));tokens.namespace='wrong';await writeFile(join(b,'design/tokens.json'),json(tokens));
 await assert.rejects(syncRegistry([a,b],{root}),/namespace/);await assert.rejects(syncRegistry([a,a],{root}),/Duplicate app id/);assert.deepEqual(await readdir(join(root,'registry')),['index.json']);
});
test('changed or removed inventories invalidate old revision and declared inventory path is normalized',async t=>{
 const {dir,root}=await setup(t),a=await app(dir,'alpha'),manifest=await read(join(a,'design/collection.json'));
 manifest.inventory='coverage.json';await writeFile(join(a,'design/collection.json'),json(manifest));
 await writeFile(join(a,'design/coverage.json'),json({schemaVersion:1,application:'alpha',reviewedRevision:'a'.repeat(40),items:[],checks:[]}));await syncRegistry([a],{root});
 const path=join(root,'registry/apps/alpha/collection.json'),snapshot=await read(path);assert.equal(snapshot.inventory,'inventory.json');snapshot.registrySnapshot.integrationRevision='b'.repeat(40);await writeFile(path,json(snapshot));
 const inventory=await read(join(a,'design/coverage.json'));inventory.reviewedRevision='c'.repeat(40);await writeFile(join(a,'design/coverage.json'),json(inventory));await syncRegistry([a],{root});assert.equal((await read(path)).registrySnapshot.integrationRevision,null);
 delete manifest.inventory;await writeFile(join(a,'design/collection.json'),json(manifest));await syncRegistry([a],{root});assert.equal((await read(path)).inventory,undefined);
});
test('unsafe source paths and symlinked registry output are rejected',async t=>{
 const {dir,root}=await setup(t),a=await app(dir,'alpha'),manifest=await read(join(a,'design/collection.json'));
 manifest.tokens='../outside.json';await writeFile(join(a,'design/collection.json'),json(manifest));await assert.rejects(syncRegistry([a],{root}),/Unsafe app-owned path/);
 manifest.tokens='tokens.json';await writeFile(join(a,'design/collection.json'),json(manifest));
 await mkdir(join(root,'registry/apps'));await symlink(a,join(root,'registry/apps/alpha'));await assert.rejects(syncRegistry([a],{root}),/must not be a symlink/);assert.deepEqual(await readdir(a),['design']);
});
test('malformed index is never silently replaced',async t=>{
 const {dir,root}=await setup(t),a=await app(dir,'alpha');await writeFile(join(root,'registry/index.json'),json({schemaVersion:1,collections:[null]}));await assert.rejects(syncRegistry([a],{root}),/Invalid registry index/);assert.deepEqual((await read(join(root,'registry/index.json'))).collections,[null]);
});
