import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {READS_SOURCES,BANDIT_SOURCES,BANDIT_ASSETS,PREVIEW_CSP,syntheticAudio,adaptReadsApp,adaptReadsWaitlist,adaptBanditWaitlist,buildPublicAppPreviews,assertPublicPreviewText} from '../tooling/public-app-previews.mjs';
test('preview source allowlists contain frontend presentation only',()=>{
 assert.equal(READS_SOURCES.length,8);assert.equal(BANDIT_SOURCES.length,27);assert.equal(BANDIT_ASSETS.length,13);
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
 const source=`const formControls = 'input,button[type="submit"]';
export function loadWaitlist({force=false}={}) { fetch('/api/waitlist'); }
const value={email:$('waitlist-email').value,consent:$('waitlist-consent').checked,website:$('waitlist-website').value};
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));
    const hash='private';
    attempt.stage='sending';
fetch('/api/waitlist');
'Thank you. You are on the list. No email has been sent; when Reads writes, it will be with your invitation.';`;
 const result=adaptReadsWaitlist(source);assert.doesNotMatch(result,/\bfetch\(|crypto|digest|\/api\/|waitlist-email/);assert.match(result,/Nothing was saved/);assert.match(result,/preview@example.test/);assert.match(result,/__readsFixtureFetch/);assert.match(result,/button\[data-preview-submit\]/);
});
test('app preview packaging requires explicit inputs and ignored local output',async()=>{
 await assert.rejects(buildPublicAppPreviews({}),/Explicit/);
 await assert.rejects(buildPublicAppPreviews({outputRoot:'/tmp/previews',readsRoot:'/tmp',banditRoot:'/tmp'}),/review/);
 await assert.rejects(buildPublicAppPreviews({outputRoot:'review/test',readsRoot:'/tmp',banditRoot:'/tmp',base:'https://example.com/'}),/safe absolute path/);
});
test('builder disables config/env ingestion and source maps, and verifies inputs after packaging',async()=>{
 const source=await readFile(new URL('../tooling/public-app-previews.mjs',import.meta.url),'utf8')+await readFile(new URL('../tooling/public-bandit-preview.mjs',import.meta.url),'utf8');
 for(const pattern of [/configFile:false/,/envDir:false/,/publicDir:false/,/sourcemap:false/,/Source changed during app preview packaging/,/Unexpected bundled dependency/,/sourceUnchanged:true/])assert.match(source,pattern);
 assert.doesNotMatch(source,/process\.env|(?:git push|git commit)|next build|npm install/);
});

test('public text audit rejects sensitive metadata and live network machinery',()=>{
 for(const text of ['fetch("/private")','new WebSocket("wss://example.test")','/auth/login','/api/jobs','/productions/private','sourceMappingURL=private.map','/Users/test/private','localhost','AWS_SECRET_ACCESS_KEY','ghp_'+'x'.repeat(36)])assert.throws(()=>assertPublicPreviewText('assets/app.js',text));
 assert.doesNotThrow(()=>assertPublicPreviewText('assets/app.js','const route="/fixture-data/state"; const help="https://react.dev/errors/";'));
});

test('expanded Bandit adapter extracts production context helpers without live provider imports',async()=>{
 const {extractBanditContext,adaptBanditSource}=await import('../tooling/public-bandit-preview.mjs');
 const source='import {secretClient} from "private-sdk"; export function unwrap<T>() {return null;} export const StudioContext = createContext(null); const empty: Catalog = {}; export function StudioProvider() {fetch("/api/private");}';
 const pure=extractBanditContext(source);assert.match(pure,/export const StudioContext/);assert.doesNotMatch(pure,/secretClient|private-sdk|StudioProvider|fetch|\/api\//);
 assert.throws(()=>extractBanditContext('unexpected source'),/Source adapter drift/);
 const coverage=adaptBanditSource('design/preview/coverage.json',JSON.stringify([{id:'one',source:['private/source.tsx'],route:'projects',state:'empty',setup:[]}]));
 assert.deepEqual(JSON.parse(coverage),[{id:'one',route:'projects',state:'empty',setup:[]}]);
});
test('public adapter includes all new dependencies and font license pairs',()=>{
 assert.ok(READS_SOURCES.includes('design/coverage.mjs'));
 for(const path of ['design/preview/coverage.json','design/preview/fixture-state.ts','design/preview/app/studio-fixture.tsx','apps/web/app/productions/[id]/review/review-room.tsx'])assert.ok(BANDIT_SOURCES.includes(path));
 for(const path of BANDIT_ASSETS.filter(p=>p.endsWith('-latin.woff2')))assert.ok(BANDIT_ASSETS.includes(path.replace('-latin.woff2','-OFL.txt')));
});

test('dynamic Reads form adaptation skips prior forms instead of abandoning the pass',async()=>{
 const source=await readFile(new URL('../tooling/public-app-previews.mjs',import.meta.url),'utf8');
 assert.match(source,/if\(form\.dataset\.previewAdapted\)continue;/);
 assert.doesNotMatch(source,/if\(form\.dataset\.previewAdapted\)return;/);
});
