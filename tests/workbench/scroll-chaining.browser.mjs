/** Native scroll chaining for real preview styles and opaque sandbox frames. */
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const artifacts = new URL('./artifacts/', import.meta.url);
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
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:800},hasTouch:width===390});
  await page.goto(base+'/apps/studio/');
  await page.setContent(`<link rel="stylesheet" href="${base}/packages/workbench/style.css"><link rel="stylesheet" href="${base}/apps/studio/material.css"><div style="height:500px"></div><div class="wb-dimension-preview" style="width:300px"><div style="height:600px;width:600px">Large literal dimension</div></div><div class="material-stage" style="height:200px;min-height:0;width:300px"><div style="height:700px">Material</div></div><iframe sandbox="allow-scripts" style="width:300px;height:200px" srcdoc="<button onclick=&quot;this.textContent='Clicked'&quot;>Test interaction</button><div style='height:1000px'>Preview</div>"></iframe><div style="height:1500px"></div>`);
  for(const selector of ['.wb-dimension-preview','.material-stage','iframe']){
   const target=page.locator(selector);await target.scrollIntoViewIfNeeded();
   if(selector==='iframe')await page.frameLocator('iframe').locator('body').evaluate(n=>window.scrollTo(0,document.documentElement.scrollHeight));
   else await target.evaluate(n=>n.scrollTop=n.scrollHeight);
   await page.waitForTimeout(100);const before=await page.evaluate(()=>scrollY);const box=await target.boundingBox();await page.mouse.move(box.x+100,box.y+60);await page.mouse.wheel(0,350);await page.waitForTimeout(300);
   const after=await page.evaluate(()=>scrollY);assert.ok(after>before+50,`${width} ${selector} must chain to page at lower boundary: ${before} -> ${after}`);
   console.log('PASS',width,selector,'wheel boundary');
  }
  const sample=page.locator('.wb-dimension-preview');await sample.scrollIntoViewIfNeeded();await sample.evaluate(n=>n.scrollTop=0);await sample.hover();await page.mouse.wheel(0,80);await page.waitForTimeout(200);assert.equal(await sample.evaluate(n=>n.scrollTop),0,'Foundations never acquire an internal scroll offset');
  if(width===390){
   await sample.evaluate(n=>n.scrollTop=n.scrollHeight);await page.evaluate(()=>scrollTo(0,350));await page.waitForTimeout(100);const box=await sample.boundingBox(),before=await page.evaluate(()=>scrollY);const cdp=await page.context().newCDPSession(page);
   await cdp.send('Input.synthesizeScrollGesture',{x:Math.round(box.x+100),y:Math.round(box.y+60),yDistance:-250,gestureSourceType:'touch',speed:500});await page.waitForTimeout(200);assert.ok(await page.evaluate(()=>scrollY)>before+50,'Touch scroll chains at the sample boundary');await cdp.detach();console.log('PASS mobile touch boundary');
  }
  const frame=page.frameLocator('iframe');await frame.locator('button').click();assert.equal(await frame.locator('button').innerText(),'Clicked');
  await page.close();
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
