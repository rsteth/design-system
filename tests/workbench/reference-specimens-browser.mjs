/** Run explicitly with PLAYWRIGHT_MODULE and optional PLAYWRIGHT_CHANNEL. */
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const manifest=JSON.parse(await readFile(resolve(root,'collections/reference-specimens/manifest.json'),'utf8'));
const server=http.createServer(async(req,res)=>{
 if(req.url==='/__specimen_qa__'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en"><title>Specimen QA</title><body></body></html>');return;}
 const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!path.startsWith(root+sep)&&path!==root){res.writeHead(403).end();return;}
 try{const body=await readFile(path);res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[extname(path)]??'text/plain');res.setHeader('Access-Control-Allow-Origin','*');res.end(body);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;const errors=[],results=[];
const out=resolve(root,'tests/workbench/artifacts/reference-specimens');
try{
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 for(const width of [1200,390])for(const study of manifest.studies)for(const fixture of study.fixtures){
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  const outside=[];page.on('request',r=>{if(!r.url().startsWith(base))outside.push(r.url());});
  await page.goto(base+'/__specimen_qa__');
  await page.evaluate(({url,theme})=>{
   document.body.innerHTML='';document.body.style.margin='0';
   window.themeConfirmed=false;
   window.addEventListener('message',event=>{if(event.data?.type==='workbench:theme-ready')event.source.postMessage({type:'workbench:set-theme',theme,requestId:'qa'},'*');if(event.data?.type==='workbench:theme-applied'&&event.data.requestId==='qa')window.themeConfirmed=true;});
   const frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');frame.title='Independent reference specimen';frame.style.cssText='width:100%;height:880px;border:0';frame.src=url;document.body.append(frame);
  },{url:base+fixture.route,theme:study.theme});
  const frame=page.frameLocator('iframe');
  await frame.locator('html[data-workbench-ready=true]').waitFor();
  await page.waitForFunction(()=>window.themeConfirmed);
  const child=page.frames().find(f=>f.parentFrame()===page.mainFrame());
  assert.equal(await child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,fixture.id+' overflow '+width);
  assert.equal(await frame.locator('section[data-view]:not([hidden])').getAttribute('data-view'),fixture.kind);
  assert.equal(await frame.locator('iframe').count(),0);
  if(fixture.kind==='patterns'){
   const buttons=frame.locator('section[data-view]:not([hidden]) [data-filter]');
   for(let repeat=0;repeat<2;repeat++){
    await buttons.nth(1).click();assert.equal(await frame.locator('section[data-view]:not([hidden]) [data-category]:visible').count(),2);
    await buttons.nth(2).click();assert.equal(await frame.locator('section[data-view]:not([hidden]) [data-category]:visible').count(),1);
    await buttons.nth(0).click();assert.equal(await frame.locator('section[data-view]:not([hidden]) [data-category]:visible').count(),3);
   }
  }
  for(let repeat=0;repeat<2;repeat++){
   const opener=frame.locator('section[data-view]:not([hidden]) [data-open]');await opener.click();
   await frame.getByRole('button',{name:'Prepare',exact:true}).click();
   assert.equal(await frame.getByLabel('Draft title').getAttribute('aria-invalid'),'true');
   await frame.getByLabel('Draft title').fill('Sample draft');
   await frame.getByRole('button',{name:'Prepare',exact:true}).click();
   await frame.getByText('Local draft prepared. Nothing has been sent or saved.',{exact:true}).waitFor();
   await frame.getByRole('button',{name:'Cancel',exact:true}).click();
   assert.equal(await opener.evaluate(e=>document.activeElement===e),true);
   await opener.click();assert.equal(await frame.getByLabel('Draft title').inputValue(),'');
   await page.keyboard.press('Escape');assert.equal(await frame.locator('dialog').evaluate(e=>e.open),false);
  }
  await page.locator('iframe').evaluate((e,height)=>e.style.height=height+'px',await child.evaluate(()=>document.documentElement.scrollHeight));
  await child.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:resolve(out,fixture.id+'-'+width+'.png'),fullPage:true});
  assert.deepEqual(outside,[],'No outside requests');
  results.push({id:fixture.id,width,theme:study.theme,passed:true});await page.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(resolve(out,'results.json'),JSON.stringify({results,errors},null,2)+'\n');
 console.log(`PASS ${results.length} sandboxed specimen cases: desktop/mobile, themes, filters, validation, reset, Escape and focus return; no external requests.`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
