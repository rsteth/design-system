/** Actual scene preview, export review, and interrupted workspace navigation. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile,realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const artifacts=resolve(root,'review/capture-studio-qa');
const { PROFILES } = await import('../../packages/capture/scenes.mjs');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const server=createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.split('/').some(part=>part.startsWith('.')||part==='node_modules'))throw new Error('Private path');
  let file=resolve(root,'.'+pathname);if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  file=await realpath(file);if(!file.startsWith(root+sep))throw new Error('Traversal');
  res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[extname(file)]??'application/octet-stream');res.setHeader('Access-Control-Allow-Origin','*');res.end(await readFile(file));
 } catch{res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try {
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 // Opaque preview sandboxes prohibit service workers themselves. Playwright's block injection
 // reads navigator.serviceWorker in that opaque context and creates a spurious SecurityError.
 const context=await browser.newContext({viewport:{width:1440,height:1450}});
 const errors=[],external=[];const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(['data:','blob:'].includes(url.protocol)||[base,'http://127.0.0.1:5186','http://127.0.0.1:5187'].includes(url.origin))return route.continue();external.push(url.origin+url.pathname);return route.abort();});
 const ready=()=>page.locator('.cs-status[data-state=ready]').waitFor({timeout:20000});
 await page.goto(base+'/apps/studio/?library=capture&capture=local');await ready();
 assert.equal(await page.locator('.cs-shell').count(),1);assert.equal(await page.locator('.wb-shell').count(),0);assert.equal(await page.locator('[data-library=own]').innerText(),'Robin');assert.match(await page.locator('.studio-identity').innerText(),/^Design system \d+\.\d+\.\d+$/);
 assert.equal(await page.locator('.cs-stage iframe').getAttribute('sandbox'),'allow-scripts');
 for(const scene of ['focus-reader','great-circle-route'])for(const theme of ['light','dark']){
  await page.getByLabel('Capture scene',{exact:true}).selectOption(scene);await page.getByLabel('Capture theme',{exact:true}).selectOption(theme);await ready();
  const preview=page.frameLocator('.cs-stage iframe');
  assert.equal(await preview.locator('html').getAttribute('data-capture-scene'),scene);assert.equal(await preview.locator('html').getAttribute('data-theme'),theme);
  const box=await page.locator('.cs-stage').boundingBox();assert.ok(Math.abs(box.width/box.height-4/3)<.002);
  await page.getByRole('button',{name:'Reset preview',exact:true}).click();await ready();assert.equal(await page.locator('.cs-stage iframe').count(),1);
 }
 await page.getByLabel('Capture theme',{exact:true}).selectOption('light');await ready();
 await page.getByRole('button',{name:'Refresh exports',exact:true}).click();await page.getByRole('link',{name:'Save 800 × 600 PNG',exact:true}).waitFor();
 assert.equal(await page.locator('.cs-card-proof img').evaluate(image=>image.complete && image.naturalWidth===800 && image.naturalHeight===600),true);
 await context.route('**/great-circle-route-light-stethem-thumb/original.png',route=>route.fulfill({status:404,body:'Missing'}));
 await page.getByRole('button',{name:'Refresh exports',exact:true}).click();await page.getByRole('alert').filter({hasText:'The local export could not be verified'}).waitFor();assert.equal(await page.getByRole('link',{name:'Save original PNG',exact:true}).count(),0);
 await context.unroute('**/great-circle-route-light-stethem-thumb/original.png');
 await context.route('**/great-circle-route-light-stethem-thumb/card.png',async route=>{const response=await route.fetch();const body=await response.body();body[body.length-1]^=1;await route.fulfill({response,body});});
 await page.getByRole('button',{name:'Refresh exports',exact:true}).click();await page.getByRole('alert').filter({hasText:'The local export could not be verified'}).waitFor();assert.equal(await page.getByRole('link',{name:'Save 800 × 600 PNG',exact:true}).count(),0);
 await context.unroute('**/great-circle-route-light-stethem-thumb/card.png');await page.getByRole('button',{name:'Refresh exports',exact:true}).click();await page.getByRole('link',{name:'Save 800 × 600 PNG',exact:true}).waitFor();

 await mkdir(artifacts,{recursive:true});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);await page.screenshot({path:resolve(artifacts,'capture-studio-desktop.png'),fullPage:true});
 await page.getByRole('button',{name:'Reference studies',exact:true}).click();await page.getByLabel('Search reference studies',{exact:true}).waitFor();assert.equal(await page.locator('.cs-shell').count(),0);
 await page.getByRole('button',{name:'Robin',exact:true}).click();await page.getByLabel('Collection',{exact:true}).waitFor();assert.equal(await page.getByLabel('Collection',{exact:true}).locator('option').count(),4);
 await page.goBack();await page.getByLabel('Search reference studies',{exact:true}).waitFor();await page.goBack();await ready();
 await page.goForward();await page.getByLabel('Search reference studies',{exact:true}).waitFor();
 await page.evaluate(()=>{for(const library of ['capture','references','capture','own','capture'])document.querySelector(`[data-library="${library}"]`).click();});await ready();assert.equal(await page.locator('.cs-shell').count(),1);assert.equal(await page.locator('.wb-shell').count(),0);assert.equal(await page.locator('[data-library=own]').innerText(),'Robin');assert.match(await page.locator('.studio-identity').innerText(),/^Design system \d+\.\d+\.\d+$/);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:resolve(artifacts,'capture-studio-mobile.png'),fullPage:true});
 await page.getByLabel('Capture scene',{exact:true}).selectOption('focus-reader');await ready();
 await context.route('http://127.0.0.1:5186/**',route=>route.abort());await page.getByRole('button',{name:'Reset preview',exact:true}).click();await page.locator('.cs-status[data-state=unavailable]').waitFor({timeout:18000});
 assert.equal(await page.locator('.cs-status').getAttribute('data-state'),'unavailable');
 await context.unroute('http://127.0.0.1:5186/**');await page.getByRole('button',{name:'Reset preview',exact:true}).click();await ready();
 const report=JSON.parse(await readFile(resolve(root,'review/captures/latest.json'),'utf8'));assert.equal(report.captures.length,4*PROFILES.length);
 for(const capture of report.captures)for(const key of ['original',...(capture.card?['card']:[])]){
  const image=await readFile(resolve(root,capture[key].path));assert.equal(createHash('sha256').update(image).digest('hex'),capture[key].sha256);
  assert.equal(image.readUInt32BE(16),capture[key].width);assert.equal(image.readUInt32BE(20),capture[key].height);const profile=PROFILES.find(item=>item.id===capture.profileId);const expected=key==='card'?profile.derivative:profile.output;assert.equal(capture[key].width,expected.width);assert.equal(capture[key].height,expected.height);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await writeFile(resolve(artifacts,'results.json'),JSON.stringify({timestamp:new Date().toISOString(),cases:['four real scenes/themes','opaque sandbox handshake','intentional 4:3 scaling','repeated reset','exports and PNG dimensions/hashes','missing file and mismatched-hash refusal','workspace separation','Back/Forward','interrupted navigation','390px no overflow','missing-server error/retry'],errors,externalRequests:external},null,2)+'\n');
 console.log('Capture studio browser checks passed: scenes, exports, navigation/history/races, mobile, missing server/retry.');
} finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
