import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {syncRegistry} from '../tooling/sync-registry.mjs';
import {assertRegistryFresh} from '../tooling/registry-freshness.mjs';
import {publicSourceMetadata,publicVersionMetadata} from '../apps/studio/public-sources.mjs';
const json=value=>JSON.stringify(value,null,2)+'\n';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function setup(t){
 const dir=await mkdtemp(join(tmpdir(),'release-freshness-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const root=join(dir,'central'),app=join(dir,'app');await mkdir(join(root,'registry'),{recursive:true});await mkdir(join(app,'design'),{recursive:true});
 await writeFile(join(root,'registry/index.json'),json({schemaVersion:1,collections:[]}));
 await writeFile(join(app,'design/collection.json'),json({schemaVersion:1,id:'example',title:'Example',summary:'Synthetic example',kind:'app',renderer:'dom',tokens:'palette.json',inventory:'coverage.json',themes:['light'],source:{repository:'https://example.test/app',revision:'a'.repeat(40)},provenance:{status:'author-owned',sources:[]},license:{spdx:'UNLICENSED',note:'Test only'},fixtures:[{id:'landing',title:'Landing',section:'screens',url:'http://127.0.0.1:4318/landing',states:['default']}]}));
 await writeFile(join(app,'design/palette.json'),json({schemaVersion:1,namespace:'example',modes:[{id:'light',selector:':root',tokens:{'color.background':{type:'color',value:'#fff'}}}]}));
 await writeFile(join(app,'design/coverage.json'),json({schemaVersion:1,application:'example',reviewedRevision:'a'.repeat(40),items:[],checks:[]}));
 await syncRegistry([app],{root});return {dir,root,app,snapshot:join(root,'registry/apps/example')};
}
test('freshness is read-only and accepts normalized manifest paths and current snapshots',async t=>{
 const {root,app,snapshot}=await setup(t),before=await readFile(join(snapshot,'collection.json'));
 assert.deepEqual(await assertRegistryFresh([app],{root}),['example']);assert.deepEqual(await readFile(join(snapshot,'collection.json')),before);
});
test('token-only edits fail despite unchanged fixture IDs; explicit refresh repairs them',async t=>{
 const {root,app}=await setup(t),path=join(app,'design/palette.json'),tokens=await read(path);tokens.modes[0].tokens['color.background'].value='#000';await writeFile(path,json(tokens));
 await assert.rejects(assertRegistryFresh([app],{root}),/example \(tokens\).*refresh explicitly/);
 await syncRegistry([app],{root});await assertRegistryFresh([app],{root});
});
test('inventory coverage drift is detected independently of tokens and fixture IDs',async t=>{
 const {root,app}=await setup(t),path=join(app,'design/coverage.json'),inventory=await read(path);inventory.checks=[{command:'npm test',status:'passed',notes:'Recorded locally'}];await writeFile(path,json(inventory));
 await assert.rejects(assertRegistryFresh([app],{root}),/\(inventory\)/);
});
test('full fixture definitions and manifest metadata must match, not just IDs',async t=>{
 const {root,app}=await setup(t),path=join(app,'design/collection.json'),original=await read(path);
 for(const change of [data=>data.fixtures[0].states.push('dialog-open'),data=>data.fixtures[0].url+='?state=changed',data=>data.summary='Changed',data=>delete data.inventory]){const data=structuredClone(original);change(data);await writeFile(path,json(data));await assert.rejects(assertRegistryFresh([app],{root}),/manifest\/fixtures/);}
});
test('missing or corrupted distributed digest is rejected even when source content matches',async t=>{
 const {root,app,snapshot}=await setup(t),path=join(snapshot,'collection.json'),original=await read(path);
 for(const key of ['tokenSha256','inventorySha256']){const data=structuredClone(original);delete data.registrySnapshot[key];await writeFile(path,json(data));await assert.rejects(assertRegistryFresh([app],{root}),new RegExp(key==='tokenSha256'?'tokens':'inventory'));}
});
test('clean public export redaction and version labels do not create false content drift',async t=>{
 const {root,app,snapshot}=await setup(t),path=join(snapshot,'collection.json');
 const inventory=json(publicSourceMetadata(await read(join(snapshot,'inventory.json'))));await writeFile(join(snapshot,'inventory.json'),inventory);
 const collection=publicVersionMetadata(await read(path),'0.0.1');collection.registrySnapshot.inventorySha256=hash(inventory);await writeFile(path,json(collection));
 await assertRegistryFresh([app],{root});
 const data=await read(join(snapshot,'inventory.json'));data.checks=[{command:'other',status:'blocked'}];await writeFile(join(snapshot,'inventory.json'),json(data));await assert.rejects(assertRegistryFresh([app],{root}),/inventory/);
});
test('missing snapshots, duplicate app IDs and escaped inputs fail closed',async t=>{
 const {dir,root,app,snapshot}=await setup(t);await assert.rejects(assertRegistryFresh([app,app],{root}),/duplicate/);
 const path=join(app,'design/collection.json'),data=await read(path);data.tokens='../outside.json';await writeFile(path,json(data));await assert.rejects(assertRegistryFresh([app],{root}),/Unsafe/);
 data.tokens='escape.json';await writeFile(path,json(data));await writeFile(join(dir,'outside.json'),'{}');await symlink(join(dir,'outside.json'),join(app,'design/escape.json'));await assert.rejects(assertRegistryFresh([app],{root}),/escapes/);
 await rm(join(snapshot,'collection.json'));await assert.rejects(assertRegistryFresh([app],{root}),/ENOENT/);
});
test('both release entry points run freshness preflight before writing preview output',async()=>{
 const release=await readFile(new URL('../tooling/public-release.mjs',import.meta.url),'utf8'),previews=await readFile(new URL('../tooling/public-app-previews.mjs',import.meta.url),'utf8');
 assert.ok(release.indexOf('await assertRegistryFresh(')<release.indexOf('await mkdir(output,{recursive:false})'));
 assert.ok(previews.indexOf('await assertRegistryFresh(')<previews.indexOf("await mkdir(join(outputRoot,'previews',id)"));
 assert.match(previews,/sources\[id\]\.push\('design\/'.*\.tokens.*\.inventory/);
});
test('app-owned public guidance participates in explicit sync and release freshness',async t=>{
 const {root,app}=await setup(t);
 for(const [file,key]of [['design/collection.json','id'],['design/palette.json','namespace'],['design/coverage.json','application']]){const path=join(app,file),data=await read(path);data[key]='reads';await writeFile(path,json(data));}
 await mkdir(join(app,'public'));await writeFile(join(app,'public/design-system.md'),'# Reads\nPublic design guide.\n');
 await syncRegistry([app],{root});await assertRegistryFresh([app],{root});
 await writeFile(join(app,'public/design-system.md'),'# Reads\nUpdated guidance.\n');await assert.rejects(assertRegistryFresh([app],{root}),/public guide/);
 await syncRegistry([app],{root});await assertRegistryFresh([app],{root});
 await writeFile(join(app,'public/design-system.md'),'# Reads\n/Users/private/path');await assert.rejects(syncRegistry([app],{root}),/private\/local/);
});
