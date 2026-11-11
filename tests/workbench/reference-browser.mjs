/** Reference library separation, navigation, inert analysis, and responsive QA. */
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const ownCollectionCount=JSON.parse(await readFile(new URL('../../registry/index.json',import.meta.url),'utf8')).collections.length;
const root = fileURLToPath(new URL('../../', import.meta.url));
const artifacts = new URL('../../review/reference-library/', import.meta.url);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const path = resolve(root, '.' + decodeURIComponent(pathname));
  if (!path.startsWith(resolve(root) + sep)) { response.writeHead(403).end(); return; }
  const file = path + (pathname.endsWith('/') ? '/index.html' : '');
  try {
    const content = await readFile(file);
    response.setHeader('Content-Type', ({'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[extname(file)] ?? 'application/octet-stream');
    // Sandboxed fixtures have opaque origins, but still import the actual shared modules.
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.end(content);
  } catch { response.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await mkdir(artifacts,{recursive:true});
  await page.goto(base+'/apps/studio/');
  const picker=page.getByLabel('Collection',{exact:true});
  await picker.waitFor();assert.equal(await picker.locator('option').count(),ownCollectionCount);
  assert.equal(await page.getByLabel('Search reference studies',{exact:true}).count(),0);
  const palette=await page.locator('.wb-shell').evaluate(node=>getComputedStyle(node).getPropertyValue('--wb-accent'));
  for(let repeat=0;repeat<3;repeat++){
    await page.getByRole('button',{name:'Reference studies',exact:true}).click();
    await page.getByLabel('Search reference studies',{exact:true}).waitFor();
    assert.equal(await picker.locator('option').count(),84);
    const search=page.getByLabel('Search reference studies',{exact:true});
    await search.fill('definitely no match zzz');
    assert.equal(await picker.isDisabled(),true);
    await page.getByText(/No matches. Clear the search/).waitFor();
    await search.fill('stripe');await picker.selectOption('reference-stripe');
    assert.equal(await picker.inputValue(),'reference-stripe');
    await page.getByRole('button',{name:'Foundations',exact:true}).click();
    await page.getByRole('heading',{name:'Independent reference analysis',exact:true}).waitFor();
    assert.equal(await page.locator('.wb-shell').evaluate(node=>getComputedStyle(node).getPropertyValue('--wb-accent')),palette);
    await search.fill('');assert.equal(await picker.locator('option').count(),84);
    await picker.selectOption('reference-airbnb');
    await page.getByRole('button',{name:'Components',exact:true}).click();
    await page.frameLocator('iframe').locator('html[data-workbench-ready=true]').waitFor();
    assert.equal(await page.locator('iframe').count(),1);
    await page.getByRole('button',{name:'Patterns',exact:true}).click();
    await page.frameLocator('iframe').locator('html[data-workbench-ready=true]').waitFor();
    assert.equal(await page.frameLocator('iframe').locator('.pattern-study').count(),3);
    await page.getByRole('button',{name:'Robin',exact:true}).click();
    await picker.waitFor();assert.equal(await picker.locator('option').count(),ownCollectionCount);
  }
  // Rapid interrupted library transitions must not let an earlier load overwrite the latest choice.
  await page.evaluate(()=>{for(const group of ['references','own','references','own'])document.querySelector(`[data-library="${group}"]`).click();});
  await picker.waitFor();assert.equal(await picker.locator('option').count(),ownCollectionCount);
  await page.getByRole('button',{name:'Reference studies',exact:true}).click();
  await page.getByLabel('Search reference studies',{exact:true}).waitFor();
  await picker.selectOption('reference-stripe');
  await page.screenshot({path:fileURLToPath(new URL('reference-library-desktop.png',artifacts)),fullPage:true});
  await page.goBack();await picker.waitFor();assert.equal(await picker.locator('option').count(),ownCollectionCount);
  await page.goForward();await page.getByLabel('Search reference studies',{exact:true}).waitFor();
  assert.equal(await picker.inputValue(),'reference-stripe');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const mobile=await browser.newPage({viewport:{width:390,height:844}});
  await mobile.goto(base+'/apps/studio/?library=references&collection=reference-stripe&section=foundations');
  await mobile.getByRole('heading',{name:'Token inspector',exact:true}).waitFor();
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mobile.screenshot({path:fileURLToPath(new URL('reference-library-mobile.png',artifacts)),fullPage:false});
  await mobile.locator('.wb-study').scrollIntoViewIfNeeded();
  await mobile.screenshot({path:fileURLToPath(new URL('reference-provenance-mobile.png',artifacts)),fullPage:false});
  await mobile.close();
  // Every authored specimen must also mount through its generated registry URL in the real shell.
  const central=await browser.newPage({viewport:{width:1440,height:1000}});
  const specimenRuns=[],outside=[];
  central.on('pageerror',error=>errors.push(error.message));
  await central.route(/^https?:\/\//,route=>{if(new URL(route.request().url()).origin!==base){outside.push(route.request().url());return route.abort();}return route.continue();});
  await central.goto(base+'/apps/studio/?library=references&collection=reference-stripe');
  for(const viewport of ['responsive','mobile']) for(const id of ['stripe','linear-app','dell-1996']) {
    await central.getByLabel('Collection',{exact:true}).selectOption('reference-'+id);
    await central.getByLabel('Viewport',{exact:true}).selectOption(viewport);
    for(const section of ['components','patterns','screens']) {
      await central.getByRole('button',{name:section[0].toUpperCase()+section.slice(1),exact:true}).click();
      if(section!=='screens')await central.getByLabel('Fixture',{exact:true}).selectOption(id+'-'+section);
      assert.equal(await central.locator('iframe').getAttribute('sandbox'),'allow-scripts');
      await central.frameLocator('iframe').locator('html[data-workbench-ready="true"]').waitFor();
      await central.getByText('Theme adapter confirmed: analysis.',{exact:true}).waitFor();
      if(viewport==='mobile')assert.equal(await central.frames()[1].evaluate(()=>innerWidth),390);
      if(section==='screens'&&viewport==='responsive')await central.screenshot({path:fileURLToPath(new URL('reference-'+id+'-integrated.png',artifacts)),fullPage:false});
      specimenRuns.push({study:id,section,viewport,status:'passed'});
    }
  }
  assert.deepEqual(outside,[],'Reference specimens make no outside requests');
  await writeFile(new URL('reference-integration-results.json',artifacts),JSON.stringify({timestamp:new Date().toISOString(),specimenRuns,errors,externalRequests:outside},null,2)+'\n');
  await central.close();
  await page.evaluate(async()=>{
    const {mountWorkbench}=await import('/packages/workbench/index.mjs');
    const hostile='<img src=x onerror="window.executed=true"><script>window.executed=true</script>';
    window.safeStudy=mountWorkbench(document.querySelector('#workbench'),{collections:[{schemaVersion:1,id:'hostile',title:hostile,kind:'reference',themes:['analysis'],fixtures:[],studyData:{schemaVersion:1,id:'hostile',title:hostile,sections:[{heading:hostile,text:hostile}],analysis:{payload:hostile},homepage:{status:'unverified',candidates:[{url:'javascript:window.executed=true'}]},source:{url:'data:text/html,unsafe'}}}]});
  });
  assert.equal(await page.locator('#workbench img, #workbench script').count(),0);
  assert.equal(await page.evaluate(()=>window.executed),undefined);
  assert.equal(await page.locator('#workbench a[href^="javascript:"], #workbench a[href^="data:"]').count(),0);
  assert.ok((await page.locator('#workbench').innerText()).includes('<img src=x'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.getByLabel('Compare themes',{exact:true}).isDisabled(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: separate 84-study library, repeated search/selection/no matches, Robin default, race-safe transitions, history, inert hostile text, safe URLs, mobile layout, unchanged shell palette.');
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
