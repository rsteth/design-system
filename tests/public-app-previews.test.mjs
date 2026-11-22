import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {READS_SOURCES,BANDIT_SOURCES,BANDIT_ASSETS,PREVIEW_CSP,syntheticAudio,adaptReadsApp,adaptReadsWaitlist,adaptBanditWaitlist,buildPublicAppPreviews,assertPublicPreviewText} from '../tooling/public-app-previews.mjs';
test('preview source allowlists contain frontend presentation only',()=>{
 assert.equal(READS_SOURCES.length,10);assert.equal(BANDIT_SOURCES.length,53);assert.equal(BANDIT_ASSETS.length,10);
 for(const path of [...READS_SOURCES,...BANDIT_SOURCES,...BANDIT_ASSETS])assert.doesNotMatch(path,/(^|\/)(\.env|src|api|auth|backend|infra|node_modules|\.git)(\/|$)|\.map$/);
 assert.ok(BANDIT_ASSETS.every(path=>/^(fonts|images|illustrations)\//.test(path)));
 assert.equal(BANDIT_ASSETS.filter(path=>path.endsWith('.png')).length,0);
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
test('Gather Motion preview titles use the current public brand',async()=>{
 const source=await readFile(new URL('../tooling/public-bandit-preview.mjs',import.meta.url),'utf8');
 assert.match(source,/<title>Gather Motion \| Synthetic design preview<\/title>/);
 assert.match(source,/<title>Gather Motion previews<\/title><h1>Gather Motion synthetic previews<\/h1>/);
 assert.doesNotMatch(source,/<(?:title|h1)>Bandit/);
});

test('director fixture routes are inert and their presentation dependencies are explicit',async()=>{
 const {adaptBanditSource}=await import('../tooling/public-bandit-preview.mjs');
 for(const file of ['director-panel','director-hosted-controls','director-connections'])assert.ok(BANDIT_SOURCES.includes(`apps/web/app/productions/[id]/${file}.tsx`));
 const input='const route = "/api/v1/director/productions/{identity}/context";';
 const output=adaptBanditSource('fixture.tsx',input);
 assert.match(output,/fixture-data\/v1\/director\/production/);
 assert.doesNotMatch(output,/\/(?:api|productions)\//);
});

test('public previews neutralize absolute product login URLs',async()=>{
 const {adaptBanditSource}=await import('../tooling/public-bandit-preview.mjs');
 for(const host of ['bandit.stethem.com','gathermotion.io']){
  const output=adaptBanditSource('landing.tsx',`const url = "https://${host}/auth/login";`);
  assert.match(output,/#preview-navigation/);assert.doesNotMatch(output,/https:|\/auth\//);
 }
});


test('Gather redesign allowlist excludes retired art and includes delivery presentation',()=>{
 for(const name of ['brand-mark','theme-switch','sequence-strip'])assert.ok(BANDIT_SOURCES.includes(`apps/web/app/${name}.tsx`));
 for(const name of ['media','production-frame','deliver/deliver-room'])assert.ok(BANDIT_SOURCES.includes(`apps/web/app/productions/[id]/${name}.tsx`));
 assert.ok(!BANDIT_SOURCES.some(p=>p.includes('texture-control')));
 assert.ok(BANDIT_ASSETS.every(p=>p.startsWith('fonts/')));
});
test('Gather public manifest exposes only fixture labels, theme controls use no storage, downloads fail closed',async()=>{
 const {adaptBanditSource}=await import('../tooling/public-bandit-preview.mjs');
 assert.deepEqual(JSON.parse(adaptBanditSource('design/collection.json',JSON.stringify({source:{root:'/private'},fixtures:[{id:'one',title:'One',url:'http://localhost'}]}))),{fixtures:[{id:'one',title:'One'}]});
 const theme=adaptBanditSource('apps/web/app/theme-switch.tsx','const stored=localStorage.getItem(key); localStorage.removeItem(key); localStorage.setItem(key, next); document.documentElement.setAttribute("data-theme", next);');
 assert.doesNotMatch(theme,/localStorage/);assert.match(theme,/setAttribute/);
 assert.throws(()=>adaptBanditSource('apps/web/app/theme-switch.tsx','unexpected'),/Source adapter drift/);
 const media=adaptBanditSource('apps/web/app/productions/[id]/media.tsx','            const link = document.createElement("a"); link.href="x";            link.click();');
 assert.doesNotMatch(media,/createElement|link.click/);assert.match(media,/Downloads are unavailable/);
 assert.throws(()=>adaptBanditSource('apps/web/app/productions/[id]/media.tsx','unexpected'),/Source adapter drift/);
});

test("Gather Settings and cut drafts stay synthetic and reload-safe",async()=>{
 const {adaptBanditSource}=await import("../tooling/public-bandit-preview.mjs");
 const settings="import { DirectorConnections } from \"../productions/[id]/director-connections\";\n            {capability.local_preview && (<code>SB_DIRECTOR_MODEL_ENABLED</code>)}\n            {capability.hosted_connections_enabled && <DirectorConnections />}\n          </>";
 const publicSettings=adaptBanditSource("apps/web/app/settings/page.tsx",settings);
 assert.doesNotMatch(publicSettings,/DirectorConnections|SB_DIRECTOR_MODEL_ENABLED/);
 assert.match(publicSettings,/cannot connect an account or run a model/);
 assert.throws(()=>adaptBanditSource("apps/web/app/settings/page.tsx","unexpected"),/Source adapter drift/);
 for(const [file,key] of [["cut-trims.ts","storageKey"],["deliver/audio-lanes.tsx","key"]]){
  const path="apps/web/app/productions/[id]/"+file;
  const before="const draft=localStorage.getItem("+key+"); localStorage.setItem("+key+", JSON.stringify(next)); setDraft(next);";
  const after=adaptBanditSource(path,before);
  assert.doesNotMatch(after,/localStorage/);assert.match(after,/setDraft/);
  assert.throws(()=>adaptBanditSource(path,"unexpected"),/Source adapter drift/);
 }
});

test("Gather audio previews only the generated two-second fixture tone",async()=>{
 const {adaptBanditSource}=await import("../tooling/public-bandit-preview.mjs");
 const fixture="      if (path.endsWith(\"/download-url\")) return ok({ url: sampleImage });";
 const path="design/preview/fixture-state.ts";
 const fixtureAudioUrl="/design-system/previews/bandit/assets/synthetic-tone.wav";
 const adapted=adaptBanditSource(path,fixture,{fixtureAudioUrl});
 assert.match(adapted,/identity === "fixture-audio"/);
 assert.ok(adapted.includes(fixtureAudioUrl));
 assert.ok(adapted.includes("url: sampleImage"));
 assert.throws(()=>adaptBanditSource(path,fixture,{fixtureAudioUrl:"https://example.test/private.wav"}),/packaged synthetic asset/);
 assert.throws(()=>adaptBanditSource(path,"unexpected",{fixtureAudioUrl}),/Source adapter drift/);
 assert.equal(syntheticAudio(2).readUInt32LE(40),96000);
});
