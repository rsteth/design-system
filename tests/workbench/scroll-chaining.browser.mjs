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
  await page.goto(base+'/apps/studio/?collection=workbench&section=components');
  const frame=page.locator('iframe').first();await frame.waitFor();
  await frame.evaluate(n=>{n.removeAttribute('src');n.srcdoc='<button onclick="this.textContent=String(Number(this.textContent)+1)">0</button><div style="height:2000px">Scrollable preview</div>';});
  await page.evaluate(()=>{const footer=document.createElement('div');footer.style.height='1800px';document.body.append(footer)});
  await frame.scrollIntoViewIfNeeded();await page.waitForTimeout(150);
  const child=page.frameLocator('iframe');await child.locator('button').waitFor();await child.locator('body').evaluate(()=>scrollTo(0,500));
  const box=await frame.boundingBox(),before=await page.evaluate(()=>scrollY);await page.mouse.move(box.x+100,Math.min(box.y+200,650));await page.mouse.wheel(0,250);await page.waitForTimeout(200);
  assert.ok(await page.evaluate(()=>scrollY)>before+50,'Page moves immediately over mid-scroll iframe');assert.equal(await child.locator('body').evaluate(()=>scrollY),500,'Inactive iframe position unchanged');
  await page.getByRole('button',{name:'Interact with preview',exact:true}).click();await child.locator('button').click();assert.equal(await child.locator('button').innerText(),'1');
  await frame.scrollIntoViewIfNeeded();const active=await frame.boundingBox();await page.mouse.move(active.x+100,Math.min(active.y+150,650));await page.mouse.wheel(0,120);await page.waitForTimeout(200);assert.ok(await child.locator('body').evaluate(()=>scrollY)>0,'Active preview scrolls');
  await page.getByRole('button',{name:'Done interacting',exact:true}).click();assert.equal(await frame.evaluate(n=>n.inert),true);
  await frame.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
  if(width===390){const b=await frame.boundingBox(),y=await page.evaluate(()=>scrollY),cdp=await page.context().newCDPSession(page);await cdp.send('Input.synthesizeScrollGesture',{x:Math.round(b.x+100),y:Math.round(Math.min(b.y+200,650)),yDistance:-200,gestureSourceType:'touch',speed:500});await page.waitForTimeout(200);assert.ok(await page.evaluate(()=>scrollY)>y+50,'Touch pans page over inactive iframe');await cdp.detach();}
  const toggle=page.getByRole('button',{name:'Interact with preview',exact:true});await toggle.focus();await page.keyboard.press('Enter');assert.equal(await frame.evaluate(n=>n.inert),false);await page.keyboard.press('Enter');assert.equal(await frame.evaluate(n=>n.inert),true);
  console.log('PASS',width,'page-first wheel, click, active scroll, keyboard and touch');await page.close();
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
