/** Exact recovered properties and separately documented input-state examples. */
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const recoveries=JSON.parse(await readFile(resolve(root,'tooling/reference-source-recoveries.json'),'utf8'));
const server=http.createServer(async(req,res)=>{let path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}if(path.endsWith('/studio'))path+='/index.html';try{const bytes=await readFile(path);res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html'})[extname(path)]??'text/plain');res.setHeader('Access-Control-Allow-Origin','*');res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const out=resolve(root,'tests/workbench/artifacts/reference-evidence'),runs=[],errors=[],external=[];let browser;
try{
 await mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==base)external.push(r.url());});
 await page.goto(base+'/apps/studio/?library=references&section=components');await page.getByLabel('Collection',{exact:true}).waitFor();
 for(const viewport of ['responsive','mobile']){
  await page.getByLabel('Viewport',{exact:true}).selectOption(viewport);
  for(const [slug,entry]of Object.entries(recoveries.studies)){
   await page.getByLabel('Collection',{exact:true}).selectOption('reference-'+slug);const frame=page.frameLocator('iframe');await frame.locator('html[data-workbench-ready=true]').waitFor();
   for(const [path,recovery]of Object.entries(entry.recoveries)){
    const name=path.split('.')[1],recipe=frame.locator(`.recipe[data-name="${name}"]`),sample=recipe.locator('.sample').first();
    if(recovery.property==='height')assert.equal(await sample.evaluate(e=>getComputedStyle(e).height),recovery.value,slug+'/'+name);
    else {assert.equal(await sample.evaluate(e=>getComputedStyle(e).borderBottomWidth),recovery.value.split(' ')[0],slug+'/'+name);assert.equal(await sample.evaluate(e=>getComputedStyle(e).borderBottomStyle),'solid');}
    await recipe.locator('summary').click();await recipe.getByText('Supporting prose · L'+recovery.supportingLine+' ↗',{exact:true}).waitFor();await recipe.locator('summary').click();runs.push({slug,name,viewport,status:'passed'});
   }
  }
  await page.getByLabel('Collection',{exact:true}).selectOption('reference-ibm');let frame=page.frameLocator('iframe');await frame.locator('html[data-workbench-ready=true]').waitFor();
  for(const [size,height]of [['xs','24px'],['sm','32px'],['md','40px'],['lg','48px']])assert.equal(await frame.locator('#supplement-documented-input-'+size).evaluate(e=>getComputedStyle(e).height),height);
  const error=frame.locator('#supplement-documented-input-error');assert.equal(await error.getAttribute('aria-invalid'),'true');assert.ok(await frame.locator('#'+await error.getAttribute('aria-describedby')).innerText());await error.fill('Local example');assert.equal(await error.inputValue(),'Local example');await error.fill('');
  assert.equal(await frame.locator('#supplement-documented-input-disabled').isDisabled(),true);assert.equal(await frame.locator('#supplement-documented-input-read-only').evaluate(e=>e.readOnly),true);
  assert.equal(await frame.locator('#supplement-documented-textarea').evaluate(e=>getComputedStyle(e).minHeight),'40px');
  await frame.locator('#supplement-documented-input-xs').focus();await page.keyboard.press('Tab');assert.equal(await frame.locator('#supplement-documented-input-xs').evaluate(e=>document.activeElement!==e),true);
  for(const slug of ['ibm','sap','runwayml']){
   await page.getByLabel('Collection',{exact:true}).selectOption('reference-'+slug);frame=page.frameLocator('iframe');await frame.locator('html[data-workbench-ready=true]').waitFor();
   if(['sap','runwayml'].includes(slug)){const cta=frame.locator('.supplement-sample button[data-demo]');assert.equal(await cta.evaluate(e=>getComputedStyle(e).height),slug==='sap'?'42px':'40px');for(let repeat=0;repeat<2;repeat++){await cta.click();await frame.locator('.supplement-sample .local-status').getByText('Local sample action. Nothing sent or saved.',{exact:true}).waitFor();}}
   const child=page.frames().find(f=>f.parentFrame()===page.mainFrame());assert.equal(await child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await frame.locator('#supplements').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:resolve(out,slug+'-supplements-'+viewport+'.png')});
   if(slug==='ibm'){await frame.locator('#supplement-examples').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:resolve(out,slug+'-documented-inputs-'+viewport+'.png')});}
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.equal(runs.length,48);
 await writeFile(resolve(out,'results.json'),JSON.stringify({timestamp:new Date().toISOString(),runs,documentedInputExamples:9,observedDesktopCTAExamples:2,errors,externalRequests:external,scope:'Local rendered overlays and neutral documentation specimens only. Not observation of brand sites.'},null,2)+'\n');
 console.log('PASS: 48 recovered-property/viewport cases; documented sizing, static states, keyboard focus and provenance at desktop/mobile. No external requests/errors/overflow.');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
