// Run with both app-owned fixture servers already started. Missing servers fail.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
const ownCollectionCount=JSON.parse(await readFile(new URL('../../registry/index.json',import.meta.url),'utf8')).collections.length;
const root=fileURLToPath(new URL('../../',import.meta.url)),out=resolve(root,'review/reads-bandit-qa');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),path=resolve(root,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));assert.ok(!relative(root,path).startsWith('..'));res.writeHead(200,{'Access-Control-Allow-Origin':'*','Content-Type':({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(path)]||'application/octet-stream'}).end(await readFile(path));}catch{res.writeHead(404).end();}});
let browser;const errors=[],external=[],cases=[];
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 await mkdir(out,{recursive:true});
 for(const [label,width,height]of [['desktop',1440,1000],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>{if(!['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)){external.push(route.request().url());return route.abort();}return route.continue();});
  for(const id of ['reads','bandit']){
   const collection=JSON.parse(await readFile(resolve(root,`registry/apps/${id}/collection.json`),'utf8'));
   await page.goto(`${base}/apps/studio/?collection=${id}&section=screens`);await page.getByLabel('Collection',{exact:true}).waitFor();assert.equal(await page.getByLabel('Collection',{exact:true}).inputValue(),id);assert.equal(await page.getByLabel('Collection',{exact:true}).locator('option').count(),ownCollectionCount);
   await page.getByText(`Theme adapter confirmed: ${collection.themes[0]}.`,{exact:true}).first().waitFor({timeout:20000});
   assert.equal(await page.locator('iframe').first().getAttribute('sandbox'),'allow-scripts');
   const element=page.locator('iframe').first();await element.scrollIntoViewIfNeeded();
   const inner=await (await element.elementHandle()).contentFrame();
   await inner.evaluate(async()=>{await document.fonts.ready;for(const image of document.images)image.loading='eager';await Promise.all([...document.images].map(image=>image.complete?Promise.resolve():new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Fixture image did not load')),10000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(Error('Fixture image failed'));};})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
   await page.waitForTimeout(350);
   const dimensions=await inner.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,text:document.body.innerText.length}));
   assert.ok(dimensions.text>80);assert.ok(dimensions.scroll<=dimensions.width,`${id} inner overflow`);
   await element.screenshot({path:resolve(out,`${id}-${label}-fixture.png`)});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:resolve(out,`${id}-${label}.png`),fullPage:true});cases.push({id,viewport:label,theme:collection.themes[0],fixture:collection.fixtures.find(f=>f.section==='screens').id,sourceBase:collection.source.revision,tokenSha256:collection.registrySnapshot.tokenSha256,fixtureImageSha256:createHash('sha256').update(await readFile(resolve(out,`${id}-${label}-fixture.png`))).digest('hex')});
   for(const section of ['Sources','Foundations','Screens'])await page.getByRole('button',{name:section,exact:true}).click();await page.getByText(`Theme adapter confirmed: ${collection.themes[0]}.`,{exact:true}).first().waitFor();
  }
  await page.goto(base+'/apps/studio/?collection=workbench&section=screens');const nested=page.frameLocator('iframe').first();await nested.getByLabel('Collection',{exact:true}).waitFor();assert.equal(await nested.getByLabel('Collection',{exact:true}).locator('option').count(),ownCollectionCount-1);
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);const result={status:'passed',cases,scope:'Central registry selection, real sandboxed first screen and theme handshake, desktop/mobile, repeated navigation, current registry and nonrecursive app-only nested self-viewer. Detailed state behavior is app-owned.',timestamp:new Date().toISOString()};await writeFile(resolve(out,'receipt.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
