#!/usr/bin/env node
import {readFile,mkdir,writeFile,rename,realpath,lstat,open,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {SCENES,CAPTURE_VERSION,sceneById,sceneURL,validateManifest,PROFILES,profileById,captureCatalog,verifyPNG,APP_STORE_STANDARD} from '../packages/capture/scenes.mjs';
import {sha256,sourceProvenance,assertWithin} from './capture/provenance.mjs';
const root = fileURLToPath(new URL('../',import.meta.url));
export function parseArgs(args) {
  const result = {scene:'all',theme:'light',profile:'stethem-thumb'};
  for (let i=0;i<args.length;i++) {
    if (['--help','--list','--plan'].includes(args[i])) {result[args[i].slice(2)]=true;continue;}
    const name = args[i].slice(2);
    if (!args[i].startsWith('--') || !['scene','theme','profile','focus-root','great-circle-root'].includes(name) || !args[i+1] || args[i+1].startsWith('--')) throw new Error(`Unsupported or incomplete option: ${args[i]}`);
    result[name]=args[++i];
  }
  if (result.profile !== 'all') profileById(result.profile);
  if (result.scene !== 'all') sceneById(result.scene);
  if (!['light','dark','both'].includes(result.theme)) throw new Error('Theme must be light, dark or both');
  return result;
}
const help = `Local capture studio ${CAPTURE_VERSION}

Agent entrypoint: /apps/studio/?library=capture
Catalog: /packages/capture/catalog.json (same data as --list)
  npm run capture -- --list
  npm run capture -- --scene all --profile all --theme both --plan
  npm run capture -- --scene focus-reader --profile mobile --theme light
  npm run capture -- --scene all --profile all --theme both

Profiles: ${PROFILES.map(p=>p.id).join(', ')}
Defaults: all scenes, stethem-thumb profile, light theme. --plan does not launch
browsers or write outputs. --list prints the machine-readable catalog.

App defaults: ../design-foundation-work/focus-speed-reader and great_circle.
Override with --focus-root /absolute/checkout or --great-circle-root /absolute/checkout.
Only declared capture routes/profiles are allowed. Export servers use loopback
5196/5197 with strictPort. Preview servers: 5186/5187, npm run workbench -- --strictPort.
Requires existing Playwright/browser; set PLAYWRIGHT_MODULE to an absolute index.mjs
and optionally PLAYWRIGHT_CHANNEL=chrome. No installation occurs.

Outputs: review/captures/<run>/<scene>-<theme>-<profile>/original.png + provenance.json.
Only stethem-thumb includes card.png (800 × 600). Pixels render at profile density;
no raster upscaling. App Store profiles match dimensions only, not native capture
or App Review acceptance. All exports are local review only; no publication.
`;
export function capturePlan(options) {
  const scenes = options.scene === 'all' ? SCENES : [sceneById(options.scene)];
  const profiles = options.profile === 'all' ? PROFILES : [profileById(options.profile ?? 'stethem-thumb')];
  const themes = options.theme === 'both' ? ['light','dark'] : [options.theme];
  return {schemaVersion:2,publication:'local-review-only',count:scenes.length*profiles.length*themes.length,captures:scenes.flatMap(scene=>profiles.flatMap(profile=>themes.map(theme=>({sceneId:scene.id,profileId:profile.id,theme,viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor,output:profile.output,appStore:profile.appStore?{...profile.appStore,acceptance:'unverified-web-render'}:null}))))};
}
export function validateFrameMeasurement(measurement,profile,theme) {
  const {width,height}=profile.viewport;
  if(measurement.width!==width || measurement.height!==height || measurement.scrollWidth>width || measurement.scrollHeight>height || measurement.theme!==theme || measurement.profile!==profile.id || measurement.bodyText<30) throw new Error('Scene readiness/frame/theme validation failed: '+JSON.stringify(measurement));
  // html overflow:hidden can conceal clipping. Inspect the app-owned root as well.
  // The legacy thumbnail has an intentionally transformed desktop composition;
  // use its physical painted bounds rather than untransformed layout scroll size.
  if(!measurement.root || !measurement.contentBounds?.length || (profile.id!=='stethem-thumb' && (measurement.root.scrollWidth>width || measurement.root.scrollHeight>height)) || measurement.contentBounds.some(b=>b.left < -1 || b.top < -1 || b.right > width+1 || b.bottom > height+1)) throw new Error('App content exceeds the capture viewport: '+JSON.stringify(measurement));
}
export function mergeLatest(previous,report) {
  const key = item => `${item.sceneId}/${item.theme}/${item.profileId ?? 'stethem-thumb'}`;
  const current = new Set(report.captures.map(key));
  const retained = [1,2].includes(previous?.schemaVersion) && Array.isArray(previous.captures) ? previous.captures.filter(item=>!current.has(key(item))).map(item=>({...item,profileId:item.profileId??'stethem-thumb',capturedAt:item.capturedAt??previous.createdAt,viewport:item.viewport??profileById('stethem-thumb').viewport,deviceScaleFactor:item.deviceScaleFactor??1,browser:item.browser??previous.browser,runnerVersion:item.runnerVersion??previous.runnerVersion,runnerSources:item.runnerSources??previous.runnerSources})) : [];
  return {...report,captures:[...retained,...report.captures]};
}
async function loadPlaywright() {
  const module = process.env.PLAYWRIGHT_MODULE;
  if (module) return import(module.startsWith('/') ? pathToFileURL(module).href : module);
  try {return await import('playwright');}
  catch {throw new Error('Playwright is not available. Set PLAYWRIGHT_MODULE to an existing local Playwright index.mjs; no package was installed.');}
}
async function ensureOutputDirectory(path) {
  // Do not follow a pre-existing review symlink into a website or another checkout.
  for (const part of [join(root,'review'),join(root,'review/captures')]) {
    try {if ((await lstat(part)).isSymbolicLink()) throw new Error('Review output directories must not be symlinks');}
    catch(error) {if(error.code !== 'ENOENT') throw error;}
  }
  await mkdir(path,{recursive:true});
  const actualRoot=await realpath(root),actual=await realpath(path);
  assertWithin(actualRoot,actual);
}
async function startAppServer(appRoot, scene, registerCleanup = () => {}) {
  const port=scene.app==='focus'?5196:5197, origin=`http://127.0.0.1:${port}`;
  const executable=join(appRoot,'node_modules/vite/bin/vite.js');
  await readFile(executable); // Existing installed Vite only. No install or package script.
  const child=spawn(process.execPath,[executable,'--host','127.0.0.1','--port',String(port),'--strictPort','--mode','workbench','--clearScreen','false'],{cwd:appRoot,stdio:['ignore','pipe','pipe']});
  let output='';
  const stop=async()=>{if(child.exitCode!==null || child.signalCode!==null)return;child.kill('SIGTERM');await Promise.race([new Promise(resolve=>child.once('exit',resolve)),new Promise(resolve=>setTimeout(resolve,2500))]);if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');};
  registerCleanup(stop);
  try {
    await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(new Error(`Capture server did not start for ${scene.title}: ${output.slice(-1200)}`)),20000);
      const finished=fn=>value=>{clearTimeout(timeout);fn(value);};
      child.once('error',finished(reject));child.once('exit',finished(()=>reject(new Error(`Capture server exited for ${scene.title}: ${output.slice(-1200)}`))));
      const consume=chunk=>{output=(output+chunk.toString()).slice(-6000);if(output.replace(/\x1b\[[0-9;]*m/g,'').includes(origin))finished(resolve)();};
      child.stdout.on('data',consume);child.stderr.on('data',consume);
    });
    return {origin,stop};
  } catch(error){await stop();throw error;}
}
export async function runCapture(options) {
  const scenes = options.scene === 'all' ? SCENES : [sceneById(options.scene)];
  const themes = options.theme === 'both' ? ['light','dark'] : [options.theme];
  const profiles = options.profile === 'all' ? PROFILES : [profileById(options.profile ?? 'stethem-thumb')];
  const configured = [];
  for (const scene of scenes) {
    const appRoot=resolve(options[`${scene.app}-root`] ?? join(root,'../design-foundation-work',scene.checkout));
    const manifest=validateManifest(JSON.parse(await readFile(join(appRoot,'capture/scene.json'),'utf8')),scene);
    configured.push({scene,appRoot,manifest,source:await sourceProvenance(appRoot,manifest)});
  }
  // A single writer preserves latest entries during subset runs; never overwrite a concurrent run.
  await ensureOutputDirectory(join(root,'review/captures'));
  const lockPath=join(root,'review/captures/.capture.lock');
  let lock;
  try {lock=await open(lockPath,'wx');await lock.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()})+'\n');}
  catch(error){if(error.code==='EEXIST')throw new Error('Another capture owns review/captures/.capture.lock. Wait for it; remove a stale lock only after verifying its process is no longer running.');throw error;}
  try {
  const {chromium}=await loadPlaywright();
  const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
  const serverCleanups=new Set();
  let interrupted=false;
  const interrupt=async signal=>{if(interrupted)return;interrupted=true;await Promise.allSettled([...serverCleanups].map(stop=>stop()));await browser.close().catch(()=>{});await lock.close();await unlink(lockPath).catch(()=>{});process.exit(signal==='SIGINT'?130:143);};
  const onInterrupt=()=>{void interrupt('SIGINT');},onTerminate=()=>{void interrupt('SIGTERM');};
  process.once('SIGINT',onInterrupt);process.once('SIGTERM',onTerminate);
  const createdAt=new Date().toISOString(),run=createdAt.replace(/[:.]/g,'-');
  const directory=join(root,'review/captures',run);
  const report={schemaVersion:2,runnerVersion:CAPTURE_VERSION,createdAt,run,publication:'local-review-only',requested:{scene:options.scene,profile:options.profile??'stethem-thumb',theme:options.theme},browser:{engine:'chromium',version:browser.version()},captures:[]};
  const runnerFiles=['tooling/capture.mjs','tooling/capture/provenance.mjs','packages/capture/scenes.mjs'];
  report.runnerSources=Object.fromEntries(await Promise.all(runnerFiles.map(async path=>[path,sha256(await readFile(join(root,path)))])));
  try {
    await ensureOutputDirectory(directory);
    for (const {scene,appRoot,manifest,source} of configured) {
      const server=await startAppServer(appRoot,scene,stop=>serverCleanups.add(stop));
      try {for (const profile of profiles) for (const theme of themes) {
      const context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor,colorScheme:theme,reducedMotion:'reduce',locale:'en-US',timezoneId:'UTC',serviceWorkers:'block',acceptDownloads:false});
      try {
        const outside=[],failures=[],errors=[];
        await context.route('**/*',route=>{
          const url=new URL(route.request().url());
          if ((url.protocol==='http:' && url.origin===server.origin) || ['data:','blob:'].includes(url.protocol)) return route.continue();
          outside.push(url.origin+url.pathname);return route.abort('blockedbyclient');
        });
        if (context.routeWebSocket) await context.routeWebSocket('**/*',socket=>socket.close());
        const page=await context.newPage();
        page.on('pageerror',error=>errors.push(error.message));
        page.on('response',response=>{if(response.status()>=400)failures.push(`${response.status()} ${new URL(response.url()).pathname}`);});
        page.on('requestfailed',request=>{if(!request.url().startsWith('data:'))failures.push(new URL(request.url()).pathname+': '+request.failure()?.errorText);});
        const captureURL=new URL(sceneURL(scene.id,theme,profile.id));captureURL.port=new URL(server.origin).port;
        const response=await page.goto(captureURL.href,{waitUntil:'networkidle',timeout:30000});
        if (!response?.ok()) throw new Error(`${scene.title} capture route is unavailable. Check the app-owned capture route in its checkout.`);
        await page.locator(`html[data-capture-ready="true"][data-capture-scene="${scene.id}"][data-capture-version="${scene.version}"][data-capture-profile="${profile.id}"]`).waitFor({timeout:15000});
        await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));});
        await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}'});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const measurement=await page.evaluate(()=>{
          const root=document.getElementById('root');
          return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,theme:document.documentElement.dataset.theme,scene:document.documentElement.dataset.captureScene,profile:document.documentElement.dataset.captureProfile,bodyText:document.body.innerText.trim().length,root:root?{scrollWidth:root.scrollWidth,scrollHeight:root.scrollHeight}:null,contentBounds:root?[...root.children].map(element=>element.getBoundingClientRect()).filter(box=>box.width&&box.height).map(({left,top,right,bottom})=>({left,top,right,bottom})):[]};
        });
        validateFrameMeasurement(measurement,profile,theme);
        if (outside.length || failures.length || errors.length) throw new Error('Capture blocked by network/assets/runtime failures: '+JSON.stringify({outside,failures,errors}));
        const original=await page.screenshot({type:'png',animations:'disabled',fullPage:false});
        await verifyPNG(original,{...profile.output,sha256:sha256(original)},profile.output);
        if (profile.appStore && original[25] !== 2) throw new Error('App Store PNG must use RGB without an alpha channel');
        const card=profile.derivative ? Buffer.from(await page.evaluate(async({data,width,height})=>{
          const image=new Image();image.src=data;await image.decode();
          const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
          const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,width,height);
          return canvas.toDataURL('image/png').split(',')[1];
        },{data:'data:image/png;base64,'+original.toString('base64'),...profile.derivative}),'base64') : undefined;
        const after=await sourceProvenance(appRoot,manifest);
        if (after.treeSha256!==source.treeSha256 || after.revision!==source.revision || after.dirty!==source.dirty) throw new Error('App source changed during capture. Retry after edits settle.');
        const subdirectory=`${scene.id}-${theme}-${profile.id}`,output=assertWithin(directory,join(directory,subdirectory));
        await mkdir(output,{recursive:false});
        const prefix=`review/captures/${run}/${subdirectory}`;
        const entry={sceneId:scene.id,sceneVersion:scene.version,profileId:profile.id,capturedAt:createdAt,browser:report.browser,runnerVersion:report.runnerVersion,runnerSources:report.runnerSources,theme,viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor,rendering:'Fresh Chromium web render at target device pixel density; no raster enlargement',appStore:profile.appStore?{...profile.appStore,dimensionMatch:true,alphaChannel:false,acceptance:'unverified-web-render',standard:APP_STORE_STANDARD}:null,fixtureClock:'App-owned fixed sample data; browser clock is not overridden',framing:profile.id==='stethem-thumb'?'Intentional 4:3 viewport, no crop':'Responsive viewport, no crop',data:manifest.dataNotes ?? scene.description,license:manifest.license ?? scene.license,source:{repository:scene.repository,...source},original:{path:`${prefix}/original.png`,...profile.output,sha256:sha256(original)},...(card?{card:{path:`${prefix}/card.png`,...profile.derivative,sha256:sha256(card)}}:{}),validation:{externalRequests:outside,assetFailures:failures,runtimeErrors:errors,measurement}};
        await writeFile(join(output,'original.png'),original,{flag:'wx'});if(card)await writeFile(join(output,'card.png'),card,{flag:'wx'});await writeFile(join(output,'provenance.json'),JSON.stringify(entry,null,2)+'\n',{flag:'wx'});
        report.captures.push(entry);console.log(`Captured ${scene.title} / ${theme} / ${profile.id}: ${prefix}/original.png`);
      } finally {await context.close();}
      }} finally {await server.stop();serverCleanups.delete(server.stop);}
    }
    await writeFile(join(directory,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    const temporary=join(root,'review/captures',`.latest-${run}.json`);
    let previous;
    try {const latest=join(root,'review/captures/latest.json');const info=await lstat(latest);if(info.isSymbolicLink()||info.size>16*1024*1024)throw new Error('Unsafe capture index');previous=JSON.parse(await readFile(latest,'utf8'));}catch(error){if(error.code!=='ENOENT')throw new Error('Existing latest.json is unreadable; refusing to overwrite it.');}
    await writeFile(temporary,JSON.stringify(mergeLatest(previous,report),null,2)+'\n',{flag:'wx'});
    await rename(temporary,join(root,'review/captures/latest.json'));
    console.log(`${report.captures.length} captures ready for local review. No website image was replaced or published.`);
    return report;
  } finally {process.removeListener('SIGINT',onInterrupt);process.removeListener('SIGTERM',onTerminate);await Promise.allSettled([...serverCleanups].map(stop=>stop()));await browser.close();}
  } finally {await lock.close();await unlink(lockPath);}
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const options=parseArgs(process.argv.slice(2));if(options.help)console.log(help);else if(options.list)console.log(JSON.stringify(captureCatalog(),null,2));else if(options.plan)console.log(JSON.stringify(capturePlan(options),null,2));else await runCapture(options);}
  catch(error){console.error(`Capture failed: ${error.message}`);process.exitCode=1;}
}
