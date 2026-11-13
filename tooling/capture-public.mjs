/** Capture already-public fixture URLs. No source app servers or credentials needed. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {loadPublicScreens} from '../packages/capture/public-screens.mjs';
import {PROFILES} from '../packages/capture/scenes.mjs';
const args=process.argv.slice(2),value=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const base='https://stethem.com/design-system/';
const appID=value('--app','all'),screenID=value('--screen','all'),profileID=value('--profile','desktop');
const apps=await loadPublicScreens(base),profiles=PROFILES.filter(p=>profileID==='all'||p.id===profileID);
if(!profiles.length||!apps.some(a=>appID==='all'||a.id===appID))throw Error('Unknown app or profile');
const jobs=apps.filter(a=>appID==='all'||a.id===appID).flatMap(app=>app.screens.filter(s=>s.url&&(screenID==='all'||s.id===screenID)).flatMap(screen=>profiles.map(profile=>({app,screen,profile}))));
if(!jobs.length)throw Error('No hosted screens matched');
if(args.includes('--plan')){console.log(JSON.stringify(jobs.map(({app,screen,profile})=>({app:app.id,screen:screen.id,url:screen.url,profile:profile.id,viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor})),null,2));process.exit(0);}
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const output=resolve('review/captures/public-'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const results=[];
try{for(const {app,screen,profile} of jobs){
 const context=await browser.newContext({viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor,locale:'en-US',timezoneId:'UTC',reducedMotion:'reduce',serviceWorkers:'block'});
 try{
  await context.route('**/*',route=>{const url=new URL(route.request().url());return url.origin===new URL(base).origin&&url.pathname.startsWith(new URL(base).pathname)&&['GET','HEAD'].includes(route.request().method())?route.continue():route.abort();});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=new URL(screen.url);url.searchParams.set('theme',app.themes[0]);
  const response=await page.goto(url.href,{waitUntil:'networkidle'});if(!response?.ok())throw Error('Screen unavailable');
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.currentSrc).map(i=>i.decode()));});
  if(errors.length)throw Error(errors.join('; '));
  const name=`${app.id}-${screen.id}-${profile.id}`;if(!/^[a-z0-9_-]+$/.test(name))throw Error('Unsafe artifact name');
  const file=name+'.png',bytes=await page.screenshot({path:resolve(output,file),animations:'disabled',fullPage:args.includes('--full-page')});
  results.push({app:app.id,screen:screen.id,url:url.href,theme:app.themes[0],profile:profile.id,viewport:profile.viewport,deviceScaleFactor:profile.deviceScaleFactor,fullPage:args.includes('--full-page'),file,sha256:createHash('sha256').update(bytes).digest('hex'),capturedAt:new Date().toISOString(),kind:'public-synthetic-fixture',nativeDevice:false});
  await writeFile(resolve(output,'report.json'),JSON.stringify({schemaVersion:1,complete:false,captures:results},null,2)+'\n');
 }finally{await context.close();}
}
await writeFile(resolve(output,'report.json'),JSON.stringify({schemaVersion:1,complete:true,captures:results},null,2)+'\n');console.log(output);
}finally{await browser.close();}
