/** QA a release's real packaged fixtures with current Capture Studio source. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const source=process.cwd(),release=process.env.PUBLIC_RELEASE_ROOT;
if(!release)throw Error('PUBLIC_RELEASE_ROOT must name a generated public release.');
const server=createServer(async(req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const base=/^\/(registry|previews|collections)\//.test(path)?release:source;
 let file=resolve(base,'.'+path);if(!file.startsWith(resolve(base)+sep))throw Error('outside');if((await stat(file)).isDirectory())file=resolve(file,'index.html');
 res.setHeader('Content-Type',({'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));
}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/apps/studio/?library=capture`);
 await page.getByRole('link',{name:'Open screen for capture'}).waitFor();
 const ids=await page.getByLabel('Application',{exact:true}).locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));assert.deepEqual(ids.sort(),['bandit','focus','great-circle','reads','stethem','workbench']);
 const counts={};for(const id of ids){await page.getByLabel('Application',{exact:true}).selectOption(id);counts[id]=await page.getByLabel('Screen',{exact:true}).locator('option').count();assert.ok(counts[id]>0);await page.getByRole('link',{name:'Open screen for capture'}).waitFor();assert.equal(await page.locator('.cs-stage iframe').getAttribute('sandbox'),'allow-scripts');}
 await page.getByLabel('Application',{exact:true}).selectOption('reads');await page.getByLabel('Output format',{exact:true}).selectOption('mobile');await page.setViewportSize({width:390,height:844});
 assert.equal(await page.locator('.cs-stage iframe').getAttribute('width'),'390');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({apps:counts,mobile:true,errors},null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
