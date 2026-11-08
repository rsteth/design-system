import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path,root),'utf8');
test('three independent studies register nine local specimens with explicit provenance',async()=>{
 const manifest=JSON.parse(await read('collections/reference-specimens/manifest.json'));
 assert.equal(manifest.studies.length,3);
 for(const study of manifest.studies){
  assert.equal(study.fixtures.length,3);
  assert.equal(study.provenance.sourceCommit,'fcc70284932276d085f01ef9f83edde90b1258cb');
  assert.ok(study.provenance.evidence.length>100);assert.ok(study.provenance.inferred.length>100);
  assert.deepEqual(study.fixtures.map(f=>f.kind),['components','patterns','screens']);
  for(const f of study.fixtures){assert.match(f.id,/^[a-z0-9-]+$/);assert.ok(f.route.startsWith('/collections/reference-specimens/'));}
  const html=await read(`collections/reference-specimens/${study.sourceSlug}/index.html`);
  assert.ok(html.includes('Independent study • original specimen • not official'));
  assert.ok(html.includes('Source-referenced, unverified:'));
  assert.ok(html.includes('Inferred / authored:'));
  assert.ok(html.includes(`data-theme="${study.theme}"`));
  assert.equal((html.match(/data-view=/g)||[]).length,3);
  assert.doesNotMatch(html,/<img|<iframe|https?:\/\/|@font-face/);
 }
});
test('specimens reuse the theme adapter without persistence or live network actions',async()=>{
 const script=await read('collections/reference-specimens/specimen.mjs');
 assert.ok(script.includes("../../packages/workbench/theme-adapter.mjs"));
 assert.ok(script.includes("root.dataset.workbenchReady = 'true'"));
 assert.doesNotMatch(script,/localStorage|sessionStorage|\bfetch\(|XMLHttpRequest|sendBeacon/);
});
