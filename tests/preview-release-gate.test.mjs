import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePreviewReport,assertSameFingerprint,assertBrowserAvailable} from '../tooling/preview-release-gate.mjs';
const catalogs={reads:[{id:'landing'}],bandit:[{id:'landing'}]};
function report(){const results=[];for(const app of Object.keys(catalogs))for(const width of [1440,390])for(const sandbox of [false,true])results.push({app,fixture:'landing',width,sandbox,passed:true});return {status:'passed',cases:results.length,results,browser:'test',runtimeErrors:[],externalRequests:[],backendRequests:[],failedResponses:[]};}
test('release browser gate requires every fixture and both viewports/frame modes',()=>{
 assert.equal(validatePreviewReport(report(),catalogs).cases,8);
 for(const mutate of [r=>r.results.pop(),r=>r.results.push(r.results[0]),r=>r.results[0].passed=false,r=>r.cases=1,r=>r.status='failed']){const r=report();mutate(r);assert.throws(()=>validatePreviewReport(r,catalogs));}
 assert.throws(()=>validatePreviewReport(report(),{...catalogs,reads:[...catalogs.reads,{id:'new-screen'}]}));
});
test('runtime, network and asset failures block release',()=>{for(const field of ['runtimeErrors','externalRequests','backendRequests','failedResponses']){const r=report();r[field]=['failure'];assert.throws(()=>validatePreviewReport(r,catalogs));}});
test('source and packaged artifact changes invalidate prior checks',()=>{assertSameFingerprint({a:'hash'},{a:'hash'},'source');for(const after of [{a:'other'},{},{a:'hash',b:'new'}])assert.throws(()=>assertSameFingerprint({a:'hash'},after,'source'));});
test('missing browser configuration fails closed',async()=>{await assert.rejects(assertBrowserAvailable(''),/PLAYWRIGHT_MODULE/);await assert.rejects(assertBrowserAvailable('/missing/playwright-module.mjs'));});
test('release builder cannot issue final manifest before packaged verification',async()=>{
 const source=await readFile(new URL('../tooling/public-release.mjs',import.meta.url),'utf8');
 assert.ok(source.indexOf('await verifyPackagedPreviews(')<source.indexOf("await writeFile(join(output,'release.json')"));
 const gate=await readFile(new URL('../tooling/preview-release-gate.mjs',import.meta.url),'utf8');assert.match(gate,/delete env.PUBLIC_PREVIEW_FIXTURES/);assert.match(gate,/run.status!==0/);
 const publicSource=await readFile(new URL('../tooling/public-source.mjs',import.meta.url),'utf8');assert.match(publicSource,/await assertRegistryFresh\(\[readsRoot,banditRoot\]\)/);
});
