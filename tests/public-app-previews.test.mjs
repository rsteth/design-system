import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {READS_SOURCES,BANDIT_SOURCES,BANDIT_ASSETS,PREVIEW_CSP,syntheticAudio,adaptReadsApp,adaptReadsWaitlist,adaptBanditWaitlist,buildPublicAppPreviews,assertPublicPreviewText} from '../tooling/public-app-previews.mjs';
test('preview source allowlists contain frontend presentation only',()=>{
 assert.equal(READS_SOURCES.length,7);assert.equal(BANDIT_SOURCES.length,12);assert.equal(BANDIT_ASSETS.length,11);
 for(const path of [...READS_SOURCES,...BANDIT_SOURCES,...BANDIT_ASSETS])assert.doesNotMatch(path,/(^|\/)(\.env|src|api|auth|backend|infra|node_modules|\.git)(\/|$)|\.map$/);
 assert.ok(BANDIT_ASSETS.every(path=>/^(fonts|images|illustrations)\//.test(path)));
 assert.equal(BANDIT_ASSETS.filter(path=>path.endsWith('.png')).length,1);
});
test('static previews deny connections and preserve the opaque frame boundary',()=>{
 for(const directive of ["connect-src 'none'","form-action 'none'","object-src 'none'","frame-src 'none'","base-uri 'none'"])assert.ok(PREVIEW_CSP.includes(directive));
 assert.doesNotMatch(PREVIEW_CSP,/unsafe-eval|https:|\*/);
});
test('synthetic audio is deterministic mono 24kHz PCM, not an uploaded recording',()=>{
 const a=syntheticAudio(),b=syntheticAudio();assert.deepEqual(a,b);assert.equal(a.length,48044);assert.equal(a.toString('ascii',0,4),'RIFF');assert.equal(a.toString('ascii',8,12),'WAVE');assert.equal(a.readUInt32LE(24),24000);assert.equal(a.readUInt16LE(22),1);assert.equal(a.readUInt16LE(34),16);
});
test('release-only adapters fail closed on source drift',()=>{
 for(const fn of [adaptReadsApp,adaptReadsWaitlist,adaptBanditWaitlist])assert.throws(()=>fn('unexpected source','/design-system/previews/reads/'),/Source adapter drift/);
});
test('Bandit waiting-list adapter strips both network operation bodies',()=>{
 const source='  async function load() { fetch("/private-api"); }\n  function clear() {}\n  async function submit() { fetch("/private-api", {method:"POST"}); }\n  const available = false;';
 const result=adaptBanditWaitlist(source);assert.doesNotMatch(result,/fetch|private-api|POST/);assert.equal((result.match(/kind: "unavailable"/g)||[]).length,2);
});
test('Reads waiting-list adapter does not collect, hash, or transmit contact information',()=>{
 const source='export async function loadWaitlist() { fetch("/live"); }\nasync function openWaitlist() {}\n$(\'waitlist-form\').onsubmit = () => { crypto.subtle.digest("SHA-256",email); fetch("/live"); };\nconst reducedMotion = null;';
 const result=adaptReadsWaitlist(source);assert.doesNotMatch(result,/fetch|crypto|digest|\/live/);assert.match(result,/Nothing was saved/);
});
test('app preview packaging requires explicit inputs and ignored local output',async()=>{
 await assert.rejects(buildPublicAppPreviews({}),/Explicit/);
 await assert.rejects(buildPublicAppPreviews({outputRoot:'/tmp/previews',readsRoot:'/tmp',banditRoot:'/tmp'}),/review/);
 await assert.rejects(buildPublicAppPreviews({outputRoot:'review/test',readsRoot:'/tmp',banditRoot:'/tmp',base:'https://example.com/'}),/safe absolute path/);
});
test('builder disables config/env ingestion and source maps, and verifies inputs after packaging',async()=>{
 const source=await readFile(new URL('../tooling/public-app-previews.mjs',import.meta.url),'utf8');
 for(const pattern of [/configFile:false/,/envDir:false/,/publicDir:false/,/sourcemap:false/,/Source changed during app preview packaging/,/Unexpected bundled dependency/,/sourceUnchanged:true/])assert.match(source,pattern);
 assert.doesNotMatch(source,/process\.env|(?:git push|git commit)|next build|npm install/);
});

test('public text audit rejects sensitive metadata and live network machinery',()=>{
 for(const text of ['fetch("/private")','new WebSocket("wss://example.test")','/auth/login','/api/jobs','/productions/private','sourceMappingURL=private.map','/Users/test/private','localhost','AWS_SECRET_ACCESS_KEY','ghp_'+'x'.repeat(36)])assert.throws(()=>assertPublicPreviewText('assets/app.js',text));
 assert.doesNotThrow(()=>assertPublicPreviewText('assets/app.js','const route="/fixture-data/state"; const help="https://react.dev/errors/";'));
});
