import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,realpath,readdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {installBlueprint,upgradeBlueprint} from '../tooling/blueprint.mjs';
const source=fileURLToPath(new URL('../',import.meta.url));
async function target(t){const root=await realpath(await mkdtemp(join(tmpdir(),'workbench-blueprint-')));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
test('dry run leaves destination unchanged and install creates only a self-contained empty workbench',async t=>{
 const root=await target(t);await writeFile(join(root,'README.md'),'Existing project\n');await writeFile(join(root,'package.json'),'{}\n');
 const preview=await installBlueprint(root,{check:true});assert.ok(preview.files>10);assert.deepEqual((await readdir(root)).sort(),['README.md','package.json']);
 const result=await installBlueprint(root);assert.equal(result.destination,join(root,'workbench'));assert.deepEqual((await readdir(root)).sort(),['README.md','package.json','workbench']);assert.equal(await readFile(join(root,'README.md'),'utf8'),'Existing project\n');
 const catalog=JSON.parse(await readFile(join(result.destination,'collections.json'),'utf8'));assert.deepEqual(catalog,{schemaVersion:1,collections:[]});
 const engine=await import(pathToFileURL(join(result.destination,'vendor/workbench/index.mjs')));assert.equal(typeof engine.mountWorkbench,'function');assert.equal(typeof engine.loadCollections,'function');
 assert.match(await readFile(join(result.destination,'AGENTS.md'),'utf8'),/one-way/);assert.match(await readFile(join(result.destination,'DESIGN.md'),'utf8'),/Static|static/);
 const lock=JSON.parse(await readFile(join(result.destination,'blueprint-lock.json'),'utf8'));
 assert.equal(lock.direction,'app-to-workbench');assert.equal(lock.source,'https://github.com/rsteth/design-system');
 for(const [name,expected]of Object.entries(lock.files)){const actual=createHash('sha256').update(await readFile(join(result.destination,name))).digest('hex');assert.equal(actual,expected,name);}
 assert.ok(!Object.keys(lock.files).some(name=>name.startsWith('registry/')||name.startsWith('review/')||name.startsWith('collections/reference')));
});
test('existing workbench is refused without modifying any file',async t=>{
 const root=await target(t);await mkdir(join(root,'workbench'));await writeFile(join(root,'workbench/index.html'),'existing');await assert.rejects(installBlueprint(root),/already exists/);assert.equal(await readFile(join(root,'workbench/index.html'),'utf8'),'existing');assert.deepEqual(await readdir(join(root,'workbench')),['index.html']);
});
test('missing target, source overlap and symlink targets are refused',async t=>{
 const root=await target(t);await assert.rejects(installBlueprint(),/Provide an existing/);await assert.rejects(installBlueprint(join(root,'missing')),/ENOENT/);await assert.rejects(installBlueprint(source),/separate/);
 const real=join(root,'real'),link=join(root,'link');await mkdir(real);await symlink(real,link);await assert.rejects(installBlueprint(link),/symlink/);assert.deepEqual(await readdir(real),[]);
});

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
/** An installed workbench made to look like an older version: one stale file, one adapted file, one not yet shipped, one since withdrawn. */
async function older(t){
 const root=await target(t);await installBlueprint(root);const bench=join(root,'workbench'),lockPath=join(bench,'blueprint-lock.json'),lock=JSON.parse(await readFile(lockPath,'utf8'));
 await writeFile(join(bench,'AGENTS.md'),'old agents\n');lock.files['AGENTS.md']=sha('old agents\n');
 await writeFile(join(bench,'collections.json'),'{"schemaVersion":1,"collections":["./collections/app/collection.json"]}\n');
 await mkdir(join(bench,'collections/app'),{recursive:true});await writeFile(join(bench,'collections/app/collection.json'),'app-owned\n');
 await rm(join(bench,'APP-DESIGN.template.md'));delete lock.files['APP-DESIGN.template.md'];
 await writeFile(join(bench,'retired.md'),'retired\n');lock.files['retired.md']=sha('retired\n');
 lock.packageVersion='0.0.1';await writeFile(lockPath,JSON.stringify(lock,null,2)+'\n');
 await mkdir(join(root,'design/vendor'),{recursive:true});await writeFile(join(root,'design/vendor/tokens.mjs'),'export const old=true;\n');
 await writeFile(join(root,'design/vendor/pin.json'),JSON.stringify({source:'https://github.com/rsteth/design-system',sourceHead:null,status:'unpublished-local-snapshot',path:'packages/tokens/index.mjs',sha256:sha('export const old=true;\n')},null,2)+'\n');
 return {root,bench,lockPath};
}
test('upgrade replaces untouched files, keeps adapted ones, and previews without writing',async t=>{
 const {root,bench,lockPath}=await older(t),before=await readFile(lockPath,'utf8');
 const preview=await upgradeBlueprint(root,{check:true});
 assert.deepEqual([preview.from,preview.replaced,preview.added,preview.removed,preview.kept.map(item=>item.name),preview.tokens],['0.0.1',['AGENTS.md'],['APP-DESIGN.template.md'],['retired.md'],['collections.json'],{path:'design/vendor/tokens.mjs',changed:true}]);
 assert.equal(await readFile(lockPath,'utf8'),before);assert.equal(await readFile(join(bench,'AGENTS.md'),'utf8'),'old agents\n');assert.ok((await readdir(bench)).includes('retired.md'));
 const result=await upgradeBlueprint(root);assert.equal(result.current,false);
 assert.deepEqual(await readFile(join(bench,'AGENTS.md')),await readFile(join(source,'blueprints/workbench/AGENTS.md')));
 assert.deepEqual(await readFile(join(bench,'APP-DESIGN.template.md')),await readFile(join(source,'blueprints/workbench/APP-DESIGN.template.md')));
 assert.match(await readFile(join(bench,'collections.json'),'utf8'),/collections\/app/);assert.equal(await readFile(join(bench,'collections/app/collection.json'),'utf8'),'app-owned\n');
 assert.ok(!(await readdir(bench)).includes('retired.md'));assert.ok(!(await readdir(bench)).some(name=>name.endsWith('.tmp')));
 const lock=JSON.parse(await readFile(lockPath,'utf8')),version=JSON.parse(await readFile(join(source,'package.json'),'utf8')).version;
 assert.deepEqual([lock.packageVersion,lock.upgradedFrom,lock.adapted],[version,'0.0.1',['collections.json']]);assert.ok(!('retired.md' in lock.files));
 for(const [name,expected]of Object.entries(lock.files).filter(([name])=>name!=='collections.json'))assert.equal(sha(await readFile(join(bench,name))),expected,name);
 const tokens=await readFile(join(root,'design/vendor/tokens.mjs'));assert.deepEqual(tokens,await readFile(join(source,'packages/tokens/index.mjs')));
 const pin=JSON.parse(await readFile(join(root,'design/vendor/pin.json'),'utf8'));assert.deepEqual([pin.sha256,pin.path],[sha(tokens),'packages/tokens/index.mjs']);
 const again=await upgradeBlueprint(root);assert.equal(again.current,true);assert.deepEqual(again.kept.map(item=>item.name),['collections.json']);
});
test('upgrade refuses edited vendor files, clashing new files, a stale token copy and a missing lock, changing nothing',async t=>{
 for(const [damage,message]of [
  [async ({bench})=>writeFile(join(bench,'vendor/workbench/index.mjs'),'edited'),/Vendor files must match/],
  [async ({bench})=>writeFile(join(bench,'APP-DESIGN.template.md'),'the app wrote its own'),/already has workbench\/APP-DESIGN/],
  [async ({root})=>writeFile(join(root,'design/vendor/tokens.mjs'),'edited'),/does not match its pin/],
  [async ({lockPath})=>rm(lockPath),/No workbench\/blueprint-lock\.json/],
 ]){
  const state=await older(t);await damage(state);
  await assert.rejects(upgradeBlueprint(state.root),message);
  assert.equal(await readFile(join(state.bench,'AGENTS.md'),'utf8'),'old agents\n');assert.ok((await readdir(state.bench)).includes('retired.md'));
 }
 const root=await target(t);await assert.rejects(upgradeBlueprint(root),/No workbench\/blueprint-lock\.json/);await assert.rejects(upgradeBlueprint(source),/separate/);
});
