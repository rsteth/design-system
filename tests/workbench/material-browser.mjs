/** Local Material UI regression; all network activity is restricted to synthetic loopback preview. */
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicVersionMetadata} from '../../apps/studio/public-sources.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)), artifacts=resolve(root,'review/material-qa');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const server=http.createServer(async(req,res)=>{try{let pathname=new URL(req.url,'http://localhost').pathname;const path=resolve(root,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/')?'index.html':''));if(!path.startsWith(root)||pathname.includes('..'))throw Error('Unsafe path');const bytes=await readFile(path);res.writeHead(200,{'Content-Type':({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.svg':'image/svg+xml'})[extname(path)]??'text/plain','Access-Control-Allow-Origin':'*'}).end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}), errors=[],external=[],unavailableLocal=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>{if(new URL(route.request().url()).origin!==base){const url=new URL(route.request().url());(url.hostname==='127.0.0.1'?unavailableLocal:external).push(url.href);route.abort();}else route.continue();});
 await mkdir(artifacts,{recursive:true});
 await page.goto(base+'/apps/studio/');await page.getByLabel('Collection',{exact:true}).waitFor();
 assert.equal(await page.locator('#library-status').innerText(),'');
 await page.getByLabel('Material',{exact:true}).selectOption('lacouture-1890');
 await page.getByRole('heading',{name:'Répertoire chromatique',exact:true}).waitFor();
 const picker=page.getByLabel('Panel',{exact:true});assert.equal(await picker.locator('option').count(),39);
 const manifest=JSON.parse(await readFile(resolve(root,'collections/material/lacouture-1890/manifest.json')));
 for(let index=0;index<manifest.items.length;index++){
  await picker.selectOption(String(index));const src='/'+manifest.items[index].file.split('/').at(-1);
  await page.waitForFunction(src=>{const img=document.querySelector('.material-sheet img');return img?.src.endsWith(src)&&img.complete&&img.naturalWidth>0;},src);
  assert.equal(await page.locator('.material-sheet img').getAttribute('height'),'3000');
 }
 await picker.selectOption('0');await page.waitForFunction(()=>document.querySelector('.material-sheet img')?.complete);
 assert.equal(await page.getByRole('button',{name:'Previous panel',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Next panel',exact:true}).click();assert.equal(await picker.inputValue(),'1');
 await page.getByRole('button',{name:'Previous panel',exact:true}).click();assert.equal(await picker.inputValue(),'0');
 await page.locator('.material-sheet img').evaluate(image=>image.decode());
 await page.screenshot({path:resolve(artifacts,'material-desktop.png'),fullPage:true});
 for(let i=0;i<3;i++){
  await page.getByRole('button',{name:'Web translation',exact:true}).click();
  await page.locator('.material-sheet svg').waitFor();
  assert.equal(await page.locator('.material-sheet .swatch').count(),manifest.items[0].swatchCount);
  assert.equal(await page.locator('iframe').count(),0);
  await page.goBack();await picker.waitFor();assert.equal(await picker.inputValue(),'0');
  await page.goForward();await page.locator('.material-sheet svg').waitFor();
  await page.getByRole('button',{name:'Original',exact:true}).click();await picker.waitFor();
 }
 await page.getByRole('button',{name:'Capture studio',exact:true}).click();await page.locator('.cs-shell').waitFor();assert.equal(await page.locator('#library-status').innerText(),'');
 await page.getByRole('button',{name:'Reference studies',exact:true}).click();await page.getByLabel('Search reference studies',{exact:true}).waitFor();assert.match(await page.locator('#library-status').innerText(),/Independent design studies/);
 await page.getByRole('button',{name:'Robin',exact:true}).click();await page.getByLabel('Collection',{exact:true}).waitFor();assert.equal(await page.locator('#library-status').innerText(),'');
 await page.getByRole('button',{name:'Sources',exact:true}).click();await page.getByRole('heading',{name:'Source & provenance',exact:true}).waitFor();assert.match(await page.locator('.wb-panel').first().innerText(),/Not publicly verified \(withheld\)/);
 assert.doesNotMatch(await page.locator('#workbench').innerText(),/\b[0-9a-f]{40}\b/i);
 await page.getByLabel('Collection',{exact:true}).selectOption('reads');await page.getByRole('heading',{name:'Source & provenance',exact:true}).waitFor();assert.doesNotMatch(await page.locator('#workbench').innerText(),/\b[0-9a-f]{40}\b/i);
 await page.getByLabel('Collection',{exact:true}).selectOption('focus');assert.match(await page.locator('#workbench').innerText(),/eaa95bf1316f5e5fcd8a7e9600eafaa2e52665f0/);
 await page.evaluate(()=>{for(const library of ['references','own','capture','own'])document.querySelector(`[data-library="${library}"]`).click();const select=document.querySelector('#material-navigation');select.value='lacouture-1890';select.dispatchEvent(new Event('change'));});await picker.waitFor();
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('.material-sheet img').evaluate(image=>image.decode());
 await page.screenshot({path:resolve(artifacts,'material-mobile.png'),fullPage:true});
 await page.getByRole('button',{name:'Web translation',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:resolve(artifacts,'translation-mobile.png'),fullPage:true});
 await page.goto(base+'/apps/studio/?library=material&panel=plate-ii');await picker.waitFor();assert.equal(await picker.inputValue(),'2');
 await page.goto(base+'/apps/studio/?library=material&panel=invalid');await picker.waitFor();assert.equal(await picker.inputValue(),'0');
 await page.getByRole('link',{name:'Attribution',exact:true}).click();await page.getByRole('heading',{name:'Attribution',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.goBack();await picker.waitFor();
 const versionPage=await browser.newPage();await versionPage.route('**/registry/apps/focus/collection.json',async route=>{const value=JSON.parse(await readFile(resolve(root,'registry/apps/focus/collection.json'),'utf8'));await route.fulfill({json:publicVersionMetadata(value,'0.1.0')});});
 await versionPage.goto(base+'/apps/studio/?collection=focus&section=sources');await versionPage.getByRole('heading',{name:'Source & provenance',exact:true}).waitFor();assert.match(await versionPage.locator('.wb-metadata').innerText(),/Version\s+0\.1\.0/);assert.doesNotMatch(await versionPage.locator('.wb-metadata').innerText(),/Revision/);await versionPage.close();
 const retryPage=await browser.newPage();let fail=true;await retryPage.route('**/lacouture-1890/manifest.json',route=>fail?route.abort():route.continue());
 await retryPage.goto(base+'/apps/studio/?library=material');await retryPage.locator('#library-status[role=alert]').waitFor();assert.equal(await retryPage.getByLabel('Material',{exact:true}).inputValue(),'');
 fail=false;await retryPage.getByLabel('Material',{exact:true}).selectOption('lacouture-1890');await retryPage.getByLabel('Panel',{exact:true}).waitFor();await retryPage.close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const result={status:'passed',scansLoaded:39,viewports:[1440,390],externalRequests:external,blockedOtherLocalPreviews:unavailableLocal,uncaughtErrors:errors,coverage:['native material dropdown','all original scans','previous/next boundaries','repeated tabs','back/forward','rapid workspace changes','direct/fallback links','attribution','source metadata redaction','native translation toggles without private atlas access','failed manifest and retry','explicit public version label']};
 await writeFile(resolve(artifacts,'results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
