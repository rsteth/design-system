import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,cp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {packageCompassCatalog,isCompassCatalog} from '../tooling/public-compass-catalog.mjs';
import {validateCollection} from '../packages/tokens/index.mjs';
test('Compass publication retains app-owned values and withholds unbundled screens and private source identities',async t=>{
 const root=await mkdtemp(join(tmpdir(),'compass-catalog-'));t.after(()=>rm(root,{recursive:true,force:true}));const app=join(root,'app'),output=join(root,'out');
 await mkdir(join(app,'design'),{recursive:true});await mkdir(join(app,'public-index'));
 const source=new URL('../registry/apps/compass/',import.meta.url);await mkdir(join(root,'registry/apps/compass'),{recursive:true});
 const collection=JSON.parse(await readFile(new URL('collection.json',source),'utf8'));const {registrySnapshot,...actual}=collection;
 for(const [path,data]of [[join(app,'design/collection.json'),JSON.stringify(actual)],[join(app,'public-index/package.json'),JSON.stringify({version:'0.1.0'})],[join(root,'registry/apps/compass/collection.json'),JSON.stringify(collection)]])await writeFile(path,data);
 for(const path of [join(app,'design/tokens.json'),join(root,'registry/apps/compass/tokens.json')])await writeFile(path,await readFile(new URL('tokens.json',source)));
 const before=await readFile(join(app,'design/collection.json'));const scope=await packageCompassCatalog({root,sourceRoot:app,output});const exported=JSON.parse(await readFile(join(output,'registry/apps/compass/collection.json'),'utf8'));
 assert.deepEqual(validateCollection(exported),[]);assert.equal(isCompassCatalog(exported,scope),true);assert.deepEqual(exported.fixtures,[]);assert.equal(scope.omittedFixtureCount,actual.fixtures.length);assert.deepEqual(exported.publicRelease.omittedFixtureIds,actual.fixtures.map(f=>f.id));assert.equal(exported.source.revision,null);
 assert.match(exported.summary,/screens are not packaged/);assert.match(await readFile(join(output,'registry/apps/compass/public-guide.md'),'utf8'),/hosted MCP remains unavailable/);
 assert.ok((await readFile(join(output,'registry/apps/compass/tokens.json'))).equals(await readFile(join(app,'design/tokens.json'))));assert.ok((await readFile(join(app,'design/collection.json'))).equals(before));
 assert.equal(isCompassCatalog({...exported,fixtures:[actual.fixtures[0]]},scope),false);assert.equal(isCompassCatalog(exported,undefined),false);assert.equal(isCompassCatalog({...exported,id:'unapproved'},scope),false);
 await writeFile(join(app,'design/tokens.json'),'{}');await assert.rejects(packageCompassCatalog({root,sourceRoot:app,output:join(root,'stale')}),/snapshot mismatch/);
});
