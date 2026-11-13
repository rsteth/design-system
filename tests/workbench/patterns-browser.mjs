/** Exercise authored standard patterns through the sandbox, desktop and actual mobile shells. */
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {clickInPreview} from './preview-input.mjs';
const ownCollectionCount=JSON.parse(await readFile(new URL('../../registry/index.json',import.meta.url),'utf8')).collections.length;
const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const report=JSON.parse(await readFile(resolve(root,'collections/reference-sheets/report.json'),'utf8'));
const server=http.createServer(async(req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;let path=resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html'})[extname(path)]??'text/plain');res.setHeader('Access-Control-Allow-Origin','*');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const out=resolve(root,'tests/workbench/artifacts/warp-patterns'),runs=[],errors=[],external=[];let browser;
try{
 await mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==base)external.push(r.url());});
 for(const [viewport,width]of [['desktop',1440],['mobile',390]]){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/apps/studio/?library=references&section=patterns');await page.getByLabel('Collection',{exact:true}).waitFor();
  for(const study of report.studies){
   await page.getByLabel('Collection',{exact:true}).selectOption(study.id);
   const frame=page.frameLocator('iframe');await frame.locator('html[data-workbench-ready=true]').waitFor();await page.getByText('Theme adapter confirmed: analysis.',{exact:true}).waitFor();
   assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');assert.equal(await frame.locator('.pattern-study').count(),3);
   const child=page.frames().find(f=>f.parentFrame()===page.mainFrame());assert.equal(await child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,study.id+' iframe overflow '+viewport);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'shell overflow '+viewport);
   assert.equal(await page.getByRole('button',{name:/^Screens/}).isDisabled(),!['reference-stripe','reference-linear-app','reference-dell-1996'].includes(study.id));
   const styles=await child.evaluate(()=>Object.fromEntries(['canvas','surface','ink','accent'].map(role=>[role,getComputedStyle(document.documentElement).getPropertyValue('--sheet-'+role).trim()])));for(const [role,value]of Object.entries(styles))assert.equal(value,study.sheetPalette.roles[role].value);
   assert.equal(await page.locator('.wb-shell').evaluate(n=>getComputedStyle(n).getPropertyValue('--wb-paper').trim()),'#060609');
   const badCSS=await child.evaluate(()=>[...document.querySelectorAll('[style]')].flatMap(n=>(n.getAttribute('style')??'').split(';').filter(Boolean).filter(rule=>{const i=rule.indexOf(':');return !CSS.supports(rule.slice(0,i),rule.slice(i+1));})));assert.deepEqual(badCSS,[]);
   if(['reference-warp','reference-stripe','reference-linear-app','reference-dell-1996','reference-ibm','reference-spotify'].includes(study.id)){
    console.log('Checking interactions:', study.id, viewport);
    for(let repeat=0;repeat<2;repeat++){
     await clickInPreview(page,child,frame.getByRole('button',{name:'Mark done',exact:true}));await frame.getByRole('button',{name:'Undo',exact:true}).waitFor();assert.equal(await frame.getByRole('progressbar').getAttribute('aria-valuenow'),'3');await clickInPreview(page,child,frame.getByRole('button',{name:'Undo',exact:true}));await frame.getByRole('button',{name:'Mark done',exact:true}).waitFor();assert.equal(await frame.getByRole('progressbar').getAttribute('aria-valuenow'),'2');
     await frame.getByLabel('Search notes',{exact:true}).fill('nothing-matches');await frame.getByText('No matching notes. Try another search or clear filters.',{exact:true}).waitFor();assert.equal(await frame.locator('.note-detail:visible').count(),0);await clickInPreview(page,child,frame.getByRole('button',{name:'Clear',exact:true}));assert.equal(await frame.getByLabel('Search notes',{exact:true}).evaluate(n=>n===document.activeElement),true);
     await clickInPreview(page,child,frame.getByRole('button',{name:'Saved',exact:true}));assert.equal(await frame.locator('[data-note]:visible').count(),2);await clickInPreview(page,child,frame.getByRole('button',{name:'All',exact:true}));await clickInPreview(page,child,frame.locator('[data-note="Small discoveries"]'));assert.equal(await frame.locator('[data-detail-title]').innerText(),'Small discoveries');
     await frame.getByLabel('Collection name',{exact:true}).fill('');await clickInPreview(page,child,frame.getByRole('button',{name:'Save example',exact:true}));assert.equal(await frame.getByLabel('Collection name',{exact:true}).getAttribute('aria-invalid'),'true');await frame.getByLabel('Collection name',{exact:true}).fill('Local example');await clickInPreview(page,child,frame.getByRole('button',{name:'Save example',exact:true}));await frame.getByText('“Local example” applied in this preview only. Nothing sent or stored.',{exact:true}).waitFor();await frame.getByLabel('Collection name',{exact:true}).fill('Discard');await clickInPreview(page,child,frame.getByRole('button',{name:'Cancel changes',exact:true}));assert.equal(await frame.getByLabel('Collection name',{exact:true}).inputValue(),'Local example');
    }
    await child.evaluate(()=>scrollTo(0,0));await page.evaluate(()=>scrollTo(0,0));await page.locator('iframe').scrollIntoViewIfNeeded();await child.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:resolve(out,study.id+'-'+viewport+'.png'),fullPage:true});
    const standalone=await browser.newPage({viewport:{width:viewport==='mobile'?390:1280,height:1000}});standalone.on('pageerror',e=>errors.push(e.message));standalone.on('request',r=>{if(new URL(r.url()).origin!==base)external.push(r.url());});await standalone.goto(base+`/collections/reference-sheets/${study.id.replace('reference-','')}/patterns.html`);await standalone.locator('html[data-workbench-ready=true]').waitFor();await standalone.screenshot({path:resolve(out,study.id+'-patterns-'+viewport+'.png'),fullPage:true});await standalone.close();
   }
   runs.push({study:study.id,viewport,status:'passed',patterns:3});
  }
 }
 // Empty deep-linked Screens falls back to components and remains visibly disabled.
 await page.goto(base+'/apps/studio/?library=references&collection=reference-warp&section=screens');await page.getByRole('heading',{name:'Components',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/^Screens/}).isDisabled(),true);
 // New collection, old section, repeated navigation and actual history preserve isolation.
 await page.getByLabel('Collection',{exact:true}).selectOption('reference-stripe');await page.getByRole('button',{name:/^Screens/}).click();await page.getByRole('heading',{name:'Screens',exact:true}).waitFor();await page.getByLabel('Collection',{exact:true}).selectOption('reference-warp');await page.getByRole('heading',{name:'Components',exact:true}).waitFor();
 await page.getByRole('button',{name:'Robin',exact:true}).click();await page.getByLabel('Collection',{exact:true}).waitFor();assert.equal(await page.getByLabel('Collection',{exact:true}).locator('option').count(),ownCollectionCount);assert.equal(await page.locator('.wb-reference-notice').count(),0);await page.goBack();await page.getByLabel('Search reference studies',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await writeFile(resolve(out,'results.json'),JSON.stringify({timestamp:new Date().toISOString(),runs,errors,externalRequests:external,scope:'All 84 standard pattern sets at desktop/mobile through sandbox; repeated controls on six contrasting studies, empty Screens, collection changes, back navigation. Not a brand-fidelity or comprehensive accessibility certification.'},null,2)+'\n');
 console.log(`PASS: ${runs.length} pattern mounts, no overflow, external requests or page errors; repeated action/search/save/cancel and Screens navigation passed.`);
}catch(error){if(browser){const p=browser.contexts()[0]?.pages()[0];if(p){console.error('Failure URL:',p.url());await p.screenshot({path:resolve(out,'failure.png'),fullPage:true});}}throw error;}finally{await browser?.close();await new Promise(r=>server.close(r));}
