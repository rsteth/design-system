import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {nasaReference,NASA_REVISION} from '../tooling/nasa-reference.mjs';
import {validateCollection,validateTokens} from '../packages/tokens/index.mjs';
const root=new URL('../',import.meta.url).pathname;
test('NASA source-backed study is independent and deterministic',async()=>{
 const {output,collection}=await nasaReference(root);
 assert.equal(collection,'../collections/authored-reference/nasa/collection.json');
 const c=JSON.parse(output.get('collections/authored-reference/nasa/collection.json'));
 assert.deepEqual(validateCollection(c),[]);assert.equal(c.source.revision,NASA_REVISION);assert.equal(c.kind,'reference');
 const tokens=JSON.parse(output.get('collections/authored-reference/nasa/tokens.json'));assert.deepEqual(validateTokens(tokens),[]);
 assert.equal(tokens.modes[0].tokens['color.nasared'].value,'#f64137');
 assert.equal(tokens.modes[0].tokens['border.radius.default'].value,'0px');
 for(const [path,text]of output)assert.equal(await readFile(new URL('../'+path,import.meta.url),'utf8'),text,path);
 const html=output.get('collections/authored-reference/nasa/index.html');
 assert.doesNotMatch(html,/<img|<iframe|<svg|@font-face|NASA-approved/i);
 assert.match(html,/January 1976/);assert.match(html,/not NASA screens/);assert.match(html,/Open original site/);
 assert.ok(c.fixtures.every(f=>f.section!=='screens'));
});

test('public source export preserves the verified NASA source revision', async () => {
 const {publicMetadataJSON}=await import('../apps/studio/public-sources.mjs');
 const text=await readFile(new URL('../collections/authored-reference/nasa/collection.json',import.meta.url),'utf8');
 assert.equal(publicMetadataJSON(text),text);
});
