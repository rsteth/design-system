/** Every registered app fixture through the real central shell and its unchanged sandbox. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const studio=process.env.STUDIO_URL ?? 'http://127.0.0.1:4310/apps/studio/';
const results=[],errors=[],externalRequests=[];
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
try {
 for(const id of ['focus','great-circle','stethem']){
  const manifest=JSON.parse(await readFile(new URL(`../../registry/apps/${id}/collection.json`,import.meta.url),'utf8'));
  for(const viewport of ['responsive','mobile']){
   const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'reduce'});
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push({application:id,viewport,message:error.message}));
   await context.route(/^https?:\/\//,route=>{const url=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(url.hostname)){externalRequests.push({application:id,url:url.origin+url.pathname});return route.abort();}return route.continue();});
   await page.goto(studio);
   await page.getByLabel('Collection',{exact:true}).selectOption(id);
   await page.getByLabel('Viewport',{exact:true}).selectOption(viewport);
   for(const fixture of manifest.fixtures){
    const start=Date.now();
    try {
     await page.getByRole('button',{name:fixture.section[0].toUpperCase()+fixture.section.slice(1),exact:true}).click();
     await page.getByLabel('Fixture',{exact:true}).selectOption(fixture.id);
     assert.equal(await page.locator('iframe').count(),1);
     assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');
     const frame=page.frameLocator('iframe');
     await frame.locator('html[data-workbench-ready="true"]').waitFor({timeout:20000});
     if(id==='focus' && fixture.id.startsWith('word-')) {
      await frame.locator('[data-testid="word"]').waitFor(); // Empty/short words are intentional production primitive states.
     } else {const body=await frame.locator('body').innerText();assert.ok(body.trim().length>12,'Nonempty real fixture content');}
     const actual=page.frames().find(frame=>frame.parentFrame()===page.mainFrame());
     if(viewport==='mobile')assert.equal(await actual.evaluate(()=>innerWidth),390);
     results.push({application:id,fixture:fixture.id,viewport,status:'passed',durationMs:Date.now()-start});
     console.log(`PASS ${id} ${fixture.id} ${viewport}`);
    }catch(error){console.error(`FAIL ${id} ${fixture.id} ${viewport}: ${error.message}`);results.push({application:id,fixture:fixture.id,viewport,status:'failed',error:error.message,durationMs:Date.now()-start});}
   }
   await page.getByRole('button',{name:'Checks',exact:true}).click();
   await page.getByRole('heading',{name:'Recorded inventory coverage',exact:true}).waitFor();
   await page.getByText('Reviewed revision:',{exact:false}).waitFor();
   await context.close();
  }
 }
 const directory=new URL('./artifacts/',import.meta.url);await mkdir(directory,{recursive:true});
 await writeFile(new URL('catalog-smoke-results.json',directory),JSON.stringify({timestamp:new Date().toISOString(),scope:'Actual source fixture mounting, mobile frame width, sandbox and recorded inventory only. App-owned suites separately verify interactions and visual parity.',results,errors,externalRequests},null,2)+'\n');
 console.log(JSON.stringify({runs:results.length,passed:results.filter(row=>row.status==='passed').length,failed:results.filter(row=>row.status==='failed'),errors,externalRequests},null,2));
 assert.equal(results.filter(row=>row.status==='failed').length,0,'Every fixture mounts in the central sandbox');
 assert.deepEqual(errors,[],'No uncaught frame errors');
 assert.deepEqual(externalRequests,[],'Deterministic fixtures make no external requests');
}finally{await browser.close();}
