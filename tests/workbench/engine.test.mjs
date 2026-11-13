import test from 'node:test';
import assert from 'node:assert/strict';
import { safeURL, fixtureURL, tokenRows, loadCollections, skinName, VERSION } from '../../packages/workbench/index.mjs';
import { readFile } from 'node:fs/promises';
test('only HTTP(S) fixture protocols without credentials', () => {
  for (const bad of [undefined, null, '', 'javascript:alert(1)', 'data:text/html,hi', 'file:///etc/passwd', 'https://user:pass@example.com']) assert.throws(() => safeURL(bad));
  assert.equal(safeURL('/x', 'http://localhost:4100/').href, 'http://localhost:4100/x');
});
test('theme query preserves existing fixture path and query', () => {
  const url = new URL(fixtureURL('http://localhost:4100/fixture?a=1#x', { theme: 'dark' }));
  assert.equal(url.searchParams.get('a'), '1'); assert.equal(url.searchParams.get('workbenchTheme'), 'dark'); assert.equal(url.hash, '#x');
});
test('tokens remain authored and mode fallback is explicit', () => {
  const doc = {modes:[{id:'light', tokens:{'color.background':{type:'color', value:'#fff'}}}]};
  assert.deepEqual(tokenRows(doc, 'dark'), [{name:'color.background',type:'color',value:'#fff',mode:'light'}]);
  assert.deepEqual(tokenRows(undefined, 'light'), []);
});
test('loader resolves manifest, tokens, and fixtures against containing URL', async () => {
  const fixtures = new Map([
    ['http://localhost/registry.json', {collections:['./a/collection.json']}],
    ['http://localhost/a/collection.json', {schemaVersion:1,id:'a',title:'A',tokens:'tokens.json',fixtures:[{id:'x',url:'./fixture'}]}],
    ['http://localhost/a/tokens.json', {modes:[]}]
  ]);
  const result = await loadCollections('http://localhost/registry.json', {fetcher: async url => ({ok:fixtures.has(url),status:404,json:async()=>fixtures.get(url)})});
  assert.equal(result[0].fixtures[0].url, 'http://localhost/a/fixture'); assert.deepEqual(result[0].tokensData, {modes:[]});
});
test('empty registry and errors are honest', async () => {
  assert.deepEqual(await loadCollections('http://localhost/registry.json', {fetcher:async()=>({ok:true,json:async()=>({collections:[]})})}), []);
  await assert.rejects(loadCollections('http://localhost/registry.json', {fetcher:async()=>({ok:false,status:404})}), /404/);
  await assert.rejects(loadCollections('http://localhost/registry.json', {fetcher:async()=>({ok:true,json:async()=>({})})}), /collections array/);
});
test('blank starter uses exact pinned distribution and no installed collections', async () => {
  for (const file of ['index.mjs', 'style.css', 'theme-adapter.mjs', 'index.d.mts', 'theme-adapter.d.mts', 'skins/stethem.css', 'skins/stethem.tokens.json', 'skins/workbench.css', 'skins/workbench.tokens.json']) assert.equal(await readFile(new URL(`../../packages/workbench/${file}`, import.meta.url),'utf8'), await readFile(new URL(`../../templates/blank/vendor/workbench/${file}`, import.meta.url),'utf8'));
  const lock = JSON.parse(await readFile(new URL('../../templates/blank/engine-lock.json', import.meta.url)));
  assert.equal(lock.version, VERSION);
  assert.deepEqual(JSON.parse(await readFile(new URL('../../templates/blank/collections.json', import.meta.url))).collections, []);
});

test('skin names are validated without allowing selector injection', () => {
  assert.equal(skinName(), 'workbench');
  assert.equal(skinName('future-skin-2'), 'future-skin-2');
  for (const bad of [null, '', 'Stethem', 'a b', 'x\" ]', '<style>', 1]) assert.throws(() => skinName(bad));
});
test('generated skin CSS exactly matches authoritative palette tokens', async () => {
  const {compileTokens} = await import('../../packages/tokens/index.mjs');
  const tokens = JSON.parse(await readFile(new URL('../../packages/workbench/skins/stethem.tokens.json',import.meta.url)));
  const expected = compileTokens(tokens).replace('design/tokens.json','packages/workbench/skins/stethem.tokens.json');
  assert.equal(await readFile(new URL('../../packages/workbench/skins/stethem.css',import.meta.url),'utf8'),expected);
});

test('loader resolves optional adjacent inventory and reports missing inventory honestly', async () => {
 const inventory={schemaVersion:1,application:'focus',items:[],checks:[]};
 const data=new Map([['http://localhost/registry.json',{collections:['focus/collection.json']}],['http://localhost/focus/collection.json',{schemaVersion:1,id:'focus',title:'Focus',inventory:'inventory.json',fixtures:[]}],['http://localhost/focus/inventory.json',inventory]]);
 const fetcher=async url=>({ok:data.has(url),status:404,json:async()=>data.get(url)});
 assert.deepEqual((await loadCollections('http://localhost/registry.json',{fetcher}))[0].inventoryData,inventory);
 data.delete('http://localhost/focus/inventory.json');await assert.rejects(loadCollections('http://localhost/registry.json',{fetcher}),/inventory.json.*404/);
});

test('loader rejects malformed inventory documents before checks rendering', async () => {
 for(const inventoryData of [null,{}, {schemaVersion:2,items:[],checks:[]}, {schemaVersion:1,items:null,checks:[]}, {schemaVersion:1,items:[null],checks:[]}, {schemaVersion:1,items:[],checks:[null]}]) {
  const fetcher=async()=>({ok:true,json:async()=>({collections:[{schemaVersion:1,id:'future-app',title:'Future app',inventoryData}]})});
  // Null is absence for inline data; external declared null is invalid.
  if(inventoryData===null) await assert.rejects(loadCollections('http://localhost/registry.json',{fetcher:async url=>({ok:true,json:async()=>url.endsWith('inventory.json')?null:{collections:[{schemaVersion:1,id:'future-app',title:'Future app',inventory:'inventory.json'}]}})}),/Invalid inventory/);
  else await assert.rejects(loadCollections('http://localhost/registry.json',{fetcher}),/Invalid inventory/);
 }
});

test('default dark workbench skin is separate from the optional personal-site skin',async()=>{
 const {compileTokens}=await import('../../packages/tokens/index.mjs');
 const tokens=JSON.parse(await readFile(new URL('../../packages/workbench/skins/workbench.tokens.json',import.meta.url)));
 assert.equal(tokens.modes[0].id,'workbench');
 assert.equal(tokens.modes[0].tokens['color.background'].value,'#060609');
 assert.equal(tokens.modes[0].tokens['color.accent'].value,'#ebe8df');
 assert.equal(await readFile(new URL('../../packages/workbench/skins/workbench.css',import.meta.url),'utf8'),compileTokens(tokens).replace('design/tokens.json','packages/workbench/skins/workbench.tokens.json'));
 const legacy=JSON.parse(await readFile(new URL('../../packages/workbench/skins/stethem.tokens.json',import.meta.url)));
 assert.equal(legacy.modes[0].selector,'.wb-shell[data-wb-skin="stethem"]');
});
