/** Mount every generated study through the real isolated engine, including narrow frames. */
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const ownCollectionCount=JSON.parse(await readFile(new URL('../../registry/index.json',import.meta.url),'utf8')).collections.length;
const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const report=JSON.parse(await readFile(resolve(root,'collections/reference-sheets/report.json'),'utf8'));
const server=http.createServer(async(req,res)=>{let path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}if(path.endsWith('/studio'))path+='/index.html';try{const bytes=await readFile(path);res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html'})[extname(path)]??'text/plain');res.setHeader('Access-Control-Allow-Origin','*');res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const out=resolve(root,'tests/workbench/artifacts/reference-sheets'),runs=[],errors=[],external=[];let browser;
try{
 await mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).origin!==base)external.push(r.url());});
 await page.goto(base+'/apps/studio/?library=references&section=components');await page.getByLabel('Collection',{exact:true}).waitFor();
 for(const viewport of ['responsive','mobile']){
  await page.getByLabel('Viewport',{exact:true}).selectOption(viewport);
  for(const study of report.studies){
   await page.getByLabel('Collection',{exact:true}).selectOption(study.id);
   const frame=page.frameLocator('iframe');await frame.locator('html[data-workbench-ready=true]').waitFor();await page.getByText('Theme adapter confirmed: analysis.',{exact:true}).waitFor();
   assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');assert.equal(await frame.locator('.recipe').count(),study.recipeCount);
   const child=page.frames().find(f=>f.parentFrame()===page.mainFrame());assert.equal(await child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,study.id+' overflow '+viewport);if(viewport==='mobile')assert.equal(await child.evaluate(()=>innerWidth),390);
   assert.equal(await frame.locator('iframe,img,form').count(),0);
   const applied=await child.evaluate(()=>Object.fromEntries(['canvas','surface','ink','accent'].map(role=>[role,getComputedStyle(document.documentElement).getPropertyValue('--sheet-'+role).trim()])));
   for(const [role,value]of Object.entries(applied))assert.equal(value,study.sheetPalette.roles[role].value,study.id+' applied palette '+role);
   assert.equal(await page.locator('.wb-shell').evaluate(n=>getComputedStyle(n).getPropertyValue('--wb-paper').trim()),'#101011','Company colors stay inside the sheet');
   const badCSS=await child.evaluate(()=>[...document.querySelectorAll('[style]')].flatMap(node=>(node.getAttribute('style')??'').split(';').filter(Boolean).filter(rule=>{const i=rule.indexOf(':');return !CSS.supports(rule.slice(0,i),rule.slice(i+1));})));assert.deepEqual(badCSS,[],study.id+' invalid CSS');assert.ok(await page.locator('.wb-reference-notice').innerText().then(t=>t.includes('Open original site')));
   await frame.getByLabel('Find a recipe').fill('no-matches-xyz');assert.equal(await frame.locator('.recipe:visible').count(),0);await frame.getByText('No matching recipes. Clear the search or reset filters.').waitFor();await frame.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await frame.locator('.recipe:visible').count(),study.recipeCount);
   if(['reference-stripe','reference-ibm','reference-spotify','reference-runwayml','reference-nintendo-2001'].includes(study.id)){
    for(let repeat=0;repeat<2;repeat++){
     const button=frame.locator('[data-demo]:not(:disabled)').first();if(await button.count()){await button.click();await button.locator('xpath=ancestor::article[contains(@class,"recipe")]').getByText('Local sample action. Nothing sent or saved.',{exact:true}).waitFor();}
     const input=frame.locator('input.sample:not(:disabled)').first();if(await input.count()){await input.fill('Local sample');assert.equal(await input.inputValue(),'Local sample');await input.fill('');}
     const nav=frame.locator('[data-nav]').first();if(await nav.count()){await nav.click();assert.equal(await nav.getAttribute('aria-pressed'),'true');}
     await frame.getByLabel('Sample type').selectOption('button');await frame.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await frame.getByLabel('Find a recipe').evaluate(n=>n===document.activeElement),true);
    }
    await child.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(out,study.id+'-'+viewport+'.png')});
    await frame.locator('#recipes').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(out,study.id+'-recipes-'+viewport+'.png')});
   }
   runs.push({study:study.id,viewport,recipes:study.recipeCount,status:'passed'});
  }
 }
 await page.getByLabel('Collection',{exact:true}).selectOption('reference-stripe');const link=page.locator('.wb-reference-notice a');assert.equal(await link.innerText(),'Open original site ↗');assert.equal(await link.getAttribute('href'),'https://stripe.com/');assert.equal(await link.getAttribute('target'),'_blank');
 await page.getByLabel('Collection',{exact:true}).selectOption('reference-dell-1996');assert.equal(await page.getByRole('button',{name:'Open original site · unavailable',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Robin',exact:true}).click();await page.getByLabel('Collection',{exact:true}).waitFor();assert.equal(await page.getByLabel('Collection',{exact:true}).locator('option').count(),ownCollectionCount);assert.equal(await page.locator('.wb-reference-notice').count(),0);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await writeFile(resolve(out,'results.json'),JSON.stringify({timestamp:new Date().toISOString(),runs,errors,externalRequests:external,scope:'All generated routes through real sandbox at responsive/390px; filtering on all, repeated local controls on selected contrasting studies. Does not certify brand fidelity or comprehensive accessibility.'},null,2)+'\n');
 console.log(`PASS: ${runs.length} study/viewport mounts, no external requests/errors/overflow, source links and original-work separation.`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
