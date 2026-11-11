/** Cross-app integration smoke. App-owned suites own exhaustive state/interaction fidelity. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=resolve(root,'review/own-work-coverage-20261111');
const base=process.env.STUDIO_URL??'http://127.0.0.1:4387/apps/studio/';
const registry=JSON.parse(await readFile(resolve(root,'registry/index.json')));
const filter=process.env.COLLECTIONS?.split(',');
const collections=(await Promise.all(registry.collections.filter(path=>path.startsWith('apps/')).map(async path=>JSON.parse(await readFile(resolve(root,'registry',path)))))).filter(c=>!filter||filter.includes(c.id));
for(const collection of collections){const url=collection.fixtures[0]?.url;if(!url)continue;const response=await fetch(url,{signal:AbortSignal.timeout(5000)}).catch(error=>{throw Error(`Fixture server unavailable for ${collection.id}: ${error.message}`);});if(!response.ok)throw Error(`Fixture server unavailable for ${collection.id}: ${response.status}`);}
const reportName=process.env.REPORT_NAME??'integration-results';if(!/^[a-z0-9-]+$/.test(reportName))throw Error('Unsafe report name');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[],errors=[],external=[],known=[],failed=[];let active;
try{
 await mkdir(out,{recursive:true});
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',error=>{
   const record={...active,message:error.message};
   if(active?.id==='stethem'&&active.fixture==='manifolds-study-no-canvas'&&error.message==="Cannot read properties of null (reading 'setTransform')")known.push(record);else errors.push(record);
  });
  await context.route(/^https?:\/\//,route=>{
   const url=new URL(route.request().url());
   if(!['127.0.0.1','localhost'].includes(url.hostname)){external.push({...active,url:url.origin+url.pathname});return route.abort();}
   return route.continue();
  });
  for(const collection of collections){
   const chosen=new Map();
   for(const section of ['components','patterns','screens']){const items=collection.fixtures.filter(f=>f.section===section);for(const fixture of [items[0],items.at(-1)].filter(Boolean))chosen.set(fixture.id,fixture);}
   if(collection.id==='stethem'){const f=collection.fixtures.find(f=>f.id==='manifolds-study-no-canvas');if(f)chosen.set(f.id,f);}
   for(const fixture of chosen.values()){
    active={id:collection.id,fixture:fixture.id,width};
    try{
     const url=new URL(base);url.searchParams.set('collection',collection.id);url.searchParams.set('section',fixture.section);url.searchParams.set('fixture',fixture.id);
     await page.goto(url.href);await page.getByLabel('Fixture',{exact:true}).waitFor();
     assert.equal(await page.getByLabel('Fixture',{exact:true}).inputValue(),fixture.id);
     await page.getByLabel('Theme',{exact:true}).selectOption(collection.themes[0]);
     const iframe=page.locator('.wb-previews iframe').first();await iframe.scrollIntoViewIfNeeded();
     assert.equal(await iframe.getAttribute('sandbox'),'allow-scripts');
     await page.getByText(`Theme adapter confirmed: ${collection.themes[0]}.`,{exact:true}).first().waitFor({timeout:45000});
     const frame=await (await iframe.elementHandle()).contentFrame();
     await frame.waitForFunction(()=>document.body&&document.body.children.length>0);
     const content=await frame.evaluate(()=>({text:document.body.innerText.trim().length,canvas:document.querySelectorAll('canvas').length,width:innerWidth,ready:document.documentElement.dataset.fixtureReady??document.documentElement.dataset.workbenchReady??null}));
     assert.ok(content.text>0||content.canvas>0||fixture.id==='word-empty','Actual fixture content');
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Central shell overflow');
     await page.waitForTimeout(150);
     const status=fixture.id==='manifolds-study-no-canvas'?'known-source-limitation':'passed';
     results.push({...active,status,content,theme:collection.themes[0]});
     if(fixture===chosen.values().next().value)await iframe.screenshot({path:resolve(out,`embedded-${collection.id}-${width}.png`)});
     console.log(status.toUpperCase(),collection.id,fixture.id,width);
    }catch(error){failed.push({...active,error:error.message});console.log('FAIL',collection.id,fixture.id,width,error.message);}
   }
   // Sources must remain usable even for an app with no public repository.
   await page.getByRole('button',{name:'Sources',exact:true}).click();
   await page.getByRole('heading',{name:'Source & provenance',exact:true}).waitFor();
   if(collection.source.visibility==='local-only'){
    assert.ok(await page.getByText('Local-only source:',{exact:false}).count());
    assert.equal(await page.locator('a[href^="local:"]').count(),0);
   }
  }
  await context.close();
 }
 const report={status:failed.length||errors.length||external.length?'failed':known.length?'passed-with-recorded-source-limitation':'passed',collections:collections.length,registeredFixtures:collections.reduce((n,c)=>n+c.fixtures.length,0),scope:'First and last real fixture of each section at desktop/mobile, central deep links, opaque sandbox, native theme handshake, source view. Exhaustive fixture state and visual fidelity are app-owned tests, not this smoke.',results,known,failed,errors,external};
 await writeFile(resolve(out,reportName+'.json'),JSON.stringify(report,null,2)+'\n');
 assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 console.log(JSON.stringify({status:report.status,cases:results.length,collections:collections.length,known:known.length}));
}finally{await browser.close();}
