/** Standalone output QA: only the release directory is served; app servers are unavailable. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat,realpath} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
const root=await realpath(resolve(process.argv[2]??'review/public-release-2026-11-07-v3'));
const release=JSON.parse(await readFile(join(root,'release.json'),'utf8')),base=release.base;
if(release.focusEpub==='fixture-only'){const dependencies=JSON.parse(await readFile(join(root,'BUNDLED-DEPENDENCIES.json'),'utf8'));assert.deepEqual(dependencies.filter(item=>/^(epubjs|path-webpack|marks-pane)@/.test(item.id)),[]);assert.deepEqual(release.licenseGaps,[]);}
const output=resolve(root+'-qa');await mkdir(output,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.gif':'image/gif','.mp4':'video/mp4','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!pathname.startsWith(base))throw Error('Outside base');let path=resolve(root,pathname.slice(base.length));if(relative(root,path).startsWith('..'))throw Error('Outside output');if((await stat(path)).isDirectory())path=join(path,'index.html');res.writeHead(200,{'Content-Type':mime[extname(path)]??'text/plain','Access-Control-Allow-Origin':'*','Cache-Control':'no-store'}).end(await readFile(path));}catch{res.writeHead(404,{'Access-Control-Allow-Origin':'*'}).end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,studio=origin+base+'apps/studio/';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
const focusedFlows=[];
const results=[],errors=[],external=[],failed=[],consoleErrors=[],knownSourceErrors=[];let activeFixture;
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light',reducedMotion:'reduce'}),page=await context.newPage();
 page.on('pageerror',error=>{const record={url:page.url(),...activeFixture,message:error.message};if(activeFixture?.app==='stethem'&&activeFixture.fixture==='manifolds-study-no-canvas'&&error.message==="Cannot read properties of null (reading 'setTransform')")knownSourceErrors.push(record);else errors.push(record);});
 page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text());});
 page.on('response',response=>{if(response.status()>=400&&!response.url().endsWith('/workbench/missing-fixture.png'))failed.push(response.url());});
 await context.route(/^https?:\/\//,route=>{const url=new URL(route.request().url());if(url.origin!==origin){external.push(url.href);return route.abort();}return route.continue();});
 await page.goto(origin+base+'?collection=focus&section=screens');await page.getByLabel('Collection',{exact:true}).waitFor();assert.equal(await page.getByLabel('Collection',{exact:true}).inputValue(),'focus');
 for(const id of ['focus','great-circle','stethem','reads','bandit'].filter(id=>release.source[id])){
  const manifest=JSON.parse(await readFile(join(root,`registry/apps/${id}/collection.json`),'utf8'));
  for(const viewport of ['responsive','mobile']){
   await page.setViewportSize(viewport==='mobile'?{width:390,height:844}:{width:1440,height:1000});
   await page.goto(studio+`?collection=${id}`);await page.getByLabel('Collection',{exact:true}).selectOption(id);
   await page.getByLabel('Viewport',{exact:true}).selectOption(viewport);
   for(const fixture of manifest.fixtures){activeFixture={app:id,fixture:fixture.id,viewport};const start=Date.now();try{
    await page.getByRole('button',{name:fixture.section[0].toUpperCase()+fixture.section.slice(1),exact:true}).click();
    await page.getByLabel('Fixture',{exact:true}).selectOption(fixture.id);
    assert.equal(await page.locator('iframe').count(),1);assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');
    assert.ok((await page.locator('iframe').getAttribute('src')).startsWith(origin+base+'previews/'));
    await page.locator('iframe').scrollIntoViewIfNeeded();
    await page.frameLocator('iframe').locator(id==='reads'?'html[data-fixture-ready]':id==='bandit'?'html[data-preview-ready="true"]':'html[data-workbench-ready="true"]').waitFor({state:'attached',timeout:15000});
    if(id==='focus'&&release.focusEpub==='fixture-only')await page.frameLocator('iframe').getByRole('note').filter({hasText:'Real EPUB parsing is not included'}).waitFor();
    // Every active fixture, including native Great Circle primitives, must acknowledge the current theme.
    await page.locator('.wb-status').filter({hasText:'Theme adapter confirmed:'}).waitFor({timeout:10000});
    const themeStatus=await page.locator('.wb-status').innerText();
    if(!(id==='focus'&&fixture.id.startsWith('word-')))assert.ok((await page.frameLocator('iframe').locator('body').innerText()).trim().length>12,'Real fixture content is present');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Page does not overflow');
    if(id==='focus'&&fixture.id==='library-populated')assert.equal(await page.frameLocator('iframe').locator('h1').evaluate(el=>getComputedStyle(el).fontSize),viewport==='mobile'?'24px':'30px','Production Tailwind classes are present');
    if(['library-populated','route','portfolio','landing'].includes(fixture.id)){await page.locator('iframe').scrollIntoViewIfNeeded();await page.waitForTimeout(300);await page.screenshot({path:join(output,`${id}-${viewport}.png`),fullPage:true});}
    results.push({app:id,fixture:fixture.id,viewport,passed:true,themeConfirmed:themeStatus.includes('Theme adapter confirmed:'),ms:Date.now()-start});
   }catch(error){results.push({app:id,fixture:fixture.id,viewport,passed:false,error:error.message});console.error('FAIL',id,fixture.id,viewport,error.message);}}
   console.log('Finished',id,viewport,results.filter(x=>!x.passed).length,'failures');
  }
 }
 if(release.focusEpub==='fixture-only')for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.goto(studio+'?collection=focus&section=screens');
  await page.getByLabel('Fixture',{exact:true}).selectOption('reader-epub');const frame=page.frameLocator('iframe');
  await frame.getByTestId('word').waitFor();assert.match(await frame.getByTestId('position').innerText(),/of 128/);
  await frame.getByRole('button',{name:'Play',exact:true}).click();await frame.getByRole('button',{name:'Pause',exact:true}).waitFor();await page.waitForTimeout(350);await frame.getByRole('button',{name:'Pause',exact:true}).click();
  await frame.getByRole('button',{name:'Close reader',exact:true}).click();await frame.getByRole('button',{name:'Reopen reader fixture',exact:true}).click();await frame.getByTestId('word').waitFor();
  for(const fixture of ['reader-error','reader-loading']){await page.getByLabel('Fixture',{exact:true}).selectOption(fixture);await frame.getByRole('status').waitFor();assert.equal(await frame.getByRole('button',{name:'Play',exact:true}).isDisabled(),true);await frame.getByRole('button',{name:'Close reader',exact:true}).click();await frame.getByRole('button',{name:'Reopen reader fixture',exact:true}).click();await frame.getByRole('status').waitFor();}
  await page.getByLabel('Fixture',{exact:true}).selectOption('library-populated');await frame.getByRole('group',{name:'Open An EPUB in progress',exact:true}).click();await frame.getByTestId('word').waitFor();assert.match(await frame.getByTestId('position').innerText(),/of 128/);await frame.getByRole('button',{name:'Close reader',exact:true}).click();await frame.getByRole('group',{name:'Open An EPUB in progress',exact:true}).waitFor();
  focusedFlows.push({viewport,epubSampleReader:'passed',playPauseCloseReopen:'passed',loadingErrorInterruption:'passed',libraryEpubSample:'passed',realEpubParsing:'not included'});
 }
 await page.goto(studio+'?library=references&collection=reference-stripe&section=components');await page.getByLabel('Collection',{exact:true}).waitFor();
 const referenceIds=await page.getByLabel('Collection',{exact:true}).locator('option').evaluateAll(options=>options.map(o=>o.value));
 assert.equal(referenceIds.length,85);
 for(const id of referenceIds){await page.getByLabel('Collection',{exact:true}).selectOption(id);await page.getByRole('button',{name:'Components',exact:true}).click();await page.locator('.wb-status').filter({hasText:'Theme adapter confirmed:'}).waitFor({timeout:10000});}
 await page.screenshot({path:join(output,'reference-mobile.png'),fullPage:true});
 await page.getByRole('button',{name:'Capture studio',exact:true}).click();await page.getByRole('heading',{name:'Local capture tools',exact:true}).waitFor();assert.equal(await page.locator('iframe').count(),0);
 await page.goBack();await page.getByLabel('Collection',{exact:true}).waitFor();await page.goForward();await page.getByRole('heading',{name:'Local capture tools',exact:true}).waitFor();
 await page.goto(studio+'?collection=workbench&section=components');await page.locator('.wb-status').filter({hasText:'Theme adapter confirmed:'}).waitFor({timeout:10000});
 const report={timestamp:new Date().toISOString(),base,focusedFlows,fixtureRuns:results.length,passed:results.filter(x=>x.passed).length,references:referenceIds.length,errors,external,failed,consoleErrors,knownSourceErrors,results,limitations:'Mount/theme handshake, opaque iframe, base paths, responsive bounds, reference loading, capture exclusion and navigation. Not full application interaction or production CI.'};
 await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({runs:results.length,passed:report.passed,references:referenceIds.length,errors,external,failed},null,2));
 assert.equal(report.passed,release.fixtureCount*2);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(failed,[]);
}finally{await browser.close();await new Promise(r=>server.close(r));}
