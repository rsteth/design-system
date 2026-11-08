import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateSupplement,safeEvidenceURL} from '../tooling/reference-supplements.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('three dated supplements preserve category, method, scope and original snapshots',async()=>{
 const config=JSON.parse(await read('registry/reference-supplements.json'));
 assert.deepEqual(Object.keys(config.studies).sort(),['ibm','runwayml','sap']);
 for(const [slug,supplement]of Object.entries(config.studies)){
  const study=JSON.parse(await read(`collections/reference/${slug}/study.json`));validateSupplement(supplement,study);assert.equal(supplement.sourceSha256,study.source.sha256);
  const html=await read(`collections/reference-sheets/${slug}/index.html`);assert.match(html,/New evidence, separate from the snapshot/);assert.match(html,/Current page text · not visually measured/);assert.match(html,/Official documentation/);assert.doesNotMatch(html,/<iframe|<img|@font-face/);
 }
 assert.equal(config.studies.ibm.specimens.length,9);assert.equal(config.studies.sap.specimens.length,1);assert.equal(config.studies.runwayml.specimens.length,1);
 const html=await read('collections/reference-sheets/ibm/index.html');assert.equal((html.match(/class="supplement-sample"/g)??[]).length,9);assert.match(html,/not evidence that the IBM marketing site uses/);
});
test('supplement rejects unsafe URLs, stale hashes, unknown source categories and unsupported observation claims',()=>{
 for(const url of ['javascript:alert(1)','http://example.com/','https://user:pass@example.com/'])assert.throws(()=>safeEvidenceURL(url));
 const study={id:'reference-test',source:{sha256:'abc'}},base={sourceSha256:'abc',sources:[{id:'s',url:'https://example.com/',category:'official-documentation',observedAt:'2026-11-07',method:'Text read',scope:'Product docs'}],specimens:[]};
 validateSupplement(base,study);assert.throws(()=>validateSupplement({...base,sourceSha256:'stale'},study),/hash mismatch/);
 assert.throws(()=>validateSupplement({...base,sources:[{...base.sources[0],category:'official-guarantee'}]},study),/source identity/);
 assert.throws(()=>validateSupplement({...base,sources:[{...base.sources[0],category:'live-observation'}]},study),/viewport and state/);
 assert.throws(()=>validateSupplement({...base,specimens:[{id:'x',kind:'field',evidence:['unknown'],authored:'Neutral'}]},study),/known evidence/);
});
