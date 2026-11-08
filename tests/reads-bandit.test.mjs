import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateCollection,validateTokens,validateInventory} from '../packages/tokens/index.mjs';
const load=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
for(const id of ['reads','bandit'])test(`${id}: new app snapshot retains identity, real fixture coverage and honest integration provenance`,async()=>{
 const base=new URL(`../registry/apps/${id}/`,import.meta.url),collection=await load(`../registry/apps/${id}/collection.json`);
 const tokenBytes=await readFile(new URL(collection.tokens,base)),tokens=JSON.parse(tokenBytes);
 assert.deepEqual(validateCollection(collection),[]);assert.deepEqual(validateTokens(tokens),[]);
 assert.equal(collection.kind,'app');assert.equal(collection.id,id);assert.equal(tokens.namespace,id);
 const baseMode=tokens.modes.find(m=>m.selector===':root');assert.ok(baseMode);
 for(const key of ['color.background','color.surface','color.text','color.text.muted','color.accent'])assert.equal(baseMode.tokens[key]?.type,'color');
 assert.equal(collection.registrySnapshot.tokenSha256,createHash('sha256').update(tokenBytes).digest('hex'));
 assert.equal(collection.registrySnapshot.baseRevision,collection.source.revision);
 if(collection.registrySnapshot.integrationRevision===null)assert.equal(collection.registrySnapshot.integrationStatus,'unpublished-local-snapshot');else assert.match(collection.registrySnapshot.integrationRevision,/^[a-f0-9]{40}$/);
 const inventoryBytes=await readFile(new URL(collection.inventory,base)),inventory=JSON.parse(inventoryBytes);
 assert.deepEqual(validateInventory(inventory,collection),[]);assert.equal(collection.registrySnapshot.inventorySha256,createHash('sha256').update(inventoryBytes).digest('hex'));
 const mapped=new Set(inventory.items.flatMap(i=>i.fixtures));
 for(const fixture of collection.fixtures){assert.ok(mapped.has(fixture.id));assert.equal(new URL(fixture.url).hostname,'127.0.0.1');}
 assert.ok(collection.fixtures.some(f=>f.section==='screens'));
});
test('new apps do not displace existing own-work or import references',async()=>{
 const registry=await load('../registry/index.json');assert.equal(new Set(registry.collections).size,registry.collections.length);
 for(const id of ['focus','great-circle','stethem','reads','bandit'])assert.ok(registry.collections.includes(`apps/${id}/collection.json`));
 assert.ok(registry.collections.includes('../collections/original/workbench/collection.json'));
 assert.ok(registry.collections.every(path=>!path.includes('reference')));
});
