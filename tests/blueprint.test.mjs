import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,realpath,readdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {installBlueprint} from '../tooling/blueprint.mjs';
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
