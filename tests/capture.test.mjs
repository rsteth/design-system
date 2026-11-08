import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {SCENES,sceneById,sceneURL,validateManifest,artifactURL,FRAME,CARD,verifyPNG,PROFILES,profileById,captureCatalog} from '../packages/capture/scenes.mjs';
import {parseArgs,capturePlan,mergeLatest,validateFrameMeasurement} from '../tooling/capture.mjs';
import {sourceProvenance,assertWithin} from '../tooling/capture/provenance.mjs';
const manifest={id:'focus-reader',version:'1.1.0',profiles:Object.fromEntries(PROFILES.map(p=>[p.id,{...p.viewport,deviceScaleFactor:p.deviceScaleFactor,output:p.output}])),dimensions:FRAME,route:'/focus-speed-reader/capture/',sourceFiles:['capture/main.tsx']};
test('only declared scene routes, themes and CLI options can be captured',()=>{
 assert.equal(SCENES.length,2);assert.equal(FRAME.width/FRAME.height,4/3);assert.equal(CARD.width/CARD.height,4/3);
 assert.equal(sceneURL('focus-reader','dark'),'http://127.0.0.1:5186/focus-speed-reader/capture/?theme=dark');
 assert.throws(()=>sceneById('https://example.com'));assert.throws(()=>sceneURL('focus-reader','automatic'));
 for(const args of [['--url','http://evil'],['--scene','unknown'],['--theme','automatic'],['--scene'],['--output','/tmp']])assert.throws(()=>parseArgs(args));
 assert.deepEqual(parseArgs(['--scene','great-circle-route','--theme','both']),{scene:'great-circle-route',theme:'both',profile:'stethem-thumb'});
});
test('scene identity, framing and source paths are validated',()=>{
 assert.equal(validateManifest(manifest,SCENES[0]),manifest);
 for(const invalid of [{...manifest,id:'other'},{...manifest,version:'2.0.0'},{...manifest,dimensions:{width:390,height:844}},{...manifest,route:'https://example.com'},...['../secret','/absolute','.env','src/../file','src\\..\\file'].map(path=>({...manifest,sourceFiles:[path]}))])assert.throws(()=>validateManifest(invalid,SCENES[0]));
});
test('review downloads cannot escape to other files, websites or schemes',()=>{
 const base='http://127.0.0.1:4310/apps/studio/capture-studio.mjs';
 assert.equal(artifactURL('review/captures/run-1/focus-reader-light/card.png',base),'http://127.0.0.1:4310/review/captures/run-1/focus-reader-light/card.png');
 for(const invalid of ['https://example.com/a.png','review/captures/../secret','review/captures/x/unknown-light/card.png','review/captures/x/focus-reader-light/provenance.json','javascript:alert(1)'])assert.throws(()=>artifactURL(invalid,base));
 assert.throws(()=>assertWithin('/tmp/review','/tmp/review-other/file'));assert.throws(()=>assertWithin('/tmp/review','/tmp/review'));assert.equal(assertWithin('/tmp/review','/tmp/review/run'),'//tmp/review/run'.slice(1));
});
test('provenance records source and excludes secrets, personal state and dependency folders',async()=>{
 const root=await mkdtemp(join(tmpdir(),'capture-source-'));
 try {
  execFileSync('git',['init','-q',root]);execFileSync('git',['-C',root,'-c','user.name=Capture Test','-c','user.email=capture@example.invalid','commit','--allow-empty','-qm','Fixture']);
  await mkdir(join(root,'capture'));await writeFile(join(root,'capture/main.tsx'),'export const scene = 1;');await writeFile(join(root,'.env'),'SECRET=not-read');await mkdir(join(root,'node_modules'));await writeFile(join(root,'node_modules/private.json'),'private');
  const first=await sourceProvenance(root,manifest);assert.equal(first.dirty,true);assert.deepEqual(Object.keys(first.files),['capture/main.tsx']);
  await writeFile(join(root,'capture/main.tsx'),'export const scene = 2;');const next=await sourceProvenance(root,manifest);assert.notEqual(first.treeSha256,next.treeSha256);
  await symlink(join(root,'.env'),join(root,'capture/unsafe.txt'));await assert.rejects(sourceProvenance(root,manifest),/symlink/);
 } finally {await rm(root,{recursive:true,force:true});}
});
test('capture UI is a separate module and never changes iframe privileges or invokes a shell endpoint',async()=>{
 const ui=await readFile(new URL('../apps/studio/capture-studio.mjs',import.meta.url),'utf8');
 assert.match(ui,/sandbox: 'allow-scripts'/);assert.doesNotMatch(ui,/allow-same-origin|allow-downloads|fetch\(.+method:\s*['"]POST/);assert.match(ui,/No publication or website replacement/);
});

test('export bytes must match recorded PNG dimensions and SHA-256',async()=>{
 const bytes=new Uint8Array(32);bytes.set([137,80,78,71,13,10,26,10]);const header=new DataView(bytes.buffer);header.setUint32(16,800);header.setUint32(20,600);
 const artifact={...CARD,sha256:createHash('sha256').update(bytes).digest('hex')};await verifyPNG(bytes,artifact,CARD);
 await assert.rejects(verifyPNG(new Uint8Array(32),artifact,CARD),/PNG/);await assert.rejects(verifyPNG(bytes,artifact,FRAME),/dimensions/);
 bytes[31]=1;await assert.rejects(verifyPNG(bytes,artifact,CARD),/hash/);header.setUint32(16,801);await assert.rejects(verifyPNG(bytes,artifact,CARD),/dimensions/);
});

test('all seven profiles render at explicit viewport density, never upsample existing raster',()=>{
 assert.equal(PROFILES.length,7);
 for(const profile of PROFILES){assert.equal(profile.output.width,profile.viewport.width*profile.deviceScaleFactor);assert.equal(profile.output.height,profile.viewport.height*profile.deviceScaleFactor);}
 assert.deepEqual(profileById('app-store-iphone-6-3').output,{width:1206,height:2622});
 assert.deepEqual(profileById('app-store-iphone-6-9').output,{width:1320,height:2868});
 assert.deepEqual(profileById('app-store-ipad-13').output,{width:2064,height:2752});
 assert.deepEqual(profileById('app-store-mac').output,{width:2880,height:1800});
 for(const p of PROFILES.filter(p=>p.appStore))assert.equal(p.appStore.nativeCapture,false);
 assert.throws(()=>profileById('../anything'));assert.throws(()=>parseArgs(['--profile','arbitrary']));assert.throws(()=>sceneURL('focus-reader','light','../mobile'));
 assert.match(sceneURL('focus-reader','dark','mobile'),/theme=dark&profile=mobile$/);
 assert.throws(()=>validateManifest({...manifest,profiles:{}},SCENES[0]),/profile/);
 const modified=structuredClone(manifest);modified.profiles.mobile.deviceScaleFactor=1;assert.throws(()=>validateManifest(modified,SCENES[0]),/profile/);
});
test('catalog and no-browser plan expose a complete bounded matrix',async()=>{
 assert.deepEqual(JSON.parse(await readFile(new URL('../packages/capture/catalog.json',import.meta.url),'utf8')),captureCatalog());
 const all=capturePlan(parseArgs(['--profile','all','--theme','both','--plan']));assert.equal(all.count,28);assert.equal(new Set(all.captures.map(c=>`${c.sceneId}/${c.profileId}/${c.theme}`)).size,28);
 const single=capturePlan(parseArgs(['--scene','focus-reader','--profile','mobile','--theme','dark']));assert.equal(single.count,1);assert.equal(single.captures[0].output.width,1170);
 const json=JSON.parse(execFileSync(process.execPath,['tooling/capture.mjs','--list'],{encoding:'utf8'}));assert.equal(json.runnerVersion,'1.1.0');
});
test('subset successes retain prior exports with legacy metadata normalized',()=>{
 const before={schemaVersion:1,createdAt:'first',captures:[{sceneId:'focus-reader',theme:'light'},{sceneId:'great-circle-route',theme:'dark'}]};
 const report={schemaVersion:2,createdAt:'next',captures:[{sceneId:'focus-reader',theme:'light',profileId:'mobile',capturedAt:'next',viewport:profileById('mobile').viewport,deviceScaleFactor:3}]};
 const merged=mergeLatest(before,report);assert.equal(merged.captures.length,3);assert.equal(merged.captures[0].capturedAt,'first');assert.equal(merged.captures[0].profileId,'stethem-thumb');assert.deepEqual(merged.captures[0].viewport,FRAME);assert.equal(merged.captures[0].deviceScaleFactor,1);
 const again=mergeLatest(merged,report);assert.deepEqual(again,merged);
});
test('profile paths are bounded, including backward-compatible thumbnail paths',()=>{
 const base='http://127.0.0.1:4310/apps/studio/capture-studio.mjs';
 for(const p of PROFILES) assert.match(artifactURL(`review/captures/run-2/focus-reader-light-${p.id}/original.png`,base),/original.png$/);
 for(const invalid of ['review/captures/x/focus-reader-light-unknown/original.png','review/captures/x/focus-reader-light-mobile/../../secret','review/captures/x/focus-reader-light-mobile/original.png?x=1'])assert.throws(()=>artifactURL(invalid,base));
});

test('frame checks reject app-root clipping concealed by document overflow hidden',()=>{
 const profile=profileById('mobile');const measurement={width:390,height:844,scrollWidth:390,scrollHeight:844,theme:'light',profile:'mobile',bodyText:40,root:{scrollWidth:390,scrollHeight:844},contentBounds:[{left:0,top:0,right:390,bottom:844}]};
 validateFrameMeasurement(measurement,profile,'light');
 assert.throws(()=>validateFrameMeasurement({...measurement,root:{scrollWidth:390,scrollHeight:900}},profile,'light'),/content/);
 assert.throws(()=>validateFrameMeasurement({...measurement,contentBounds:[{left:0,top:0,right:390,bottom:900}]},profile,'light'),/content/);
 assert.throws(()=>validateFrameMeasurement({...measurement,contentBounds:[]},profile,'light'),/content/);
});
