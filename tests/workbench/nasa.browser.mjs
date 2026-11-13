/** Foundations cards, themes, safe values, responsive geometry and filtering. */
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clickInPreview } from './preview-input.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(root, 'review/nasa-research');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const path = resolve(root, '.' + decodeURIComponent(pathname));
  if (!path.startsWith(resolve(root) + sep)) return response.writeHead(403).end();
  const file = path + (pathname.endsWith('/') ? '/index.html' : '');
  try {
    response.setHeader('Content-Type', ({ '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' })[extname(file)] ?? 'application/octet-stream');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});
 const page=await browser.newPage(),errors=[],external=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route(/^https?:\/\//,route=>new URL(route.request().url()).origin===base?route.continue():(external.push(route.request().url()),route.abort()));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  await page.goto(base+'/apps/studio/?library=references&collection=reference-nasa&section=components');
  const frame=page.frameLocator('iframe').first();
  await frame.getByRole('heading',{name:'NASA',exact:true}).waitFor();
  assert.equal(await frame.locator('body').evaluate(e=>e.scrollWidth<=window.innerWidth),true);
  const child=await (await page.locator('iframe').first().elementHandle()).contentFrame();
  await clickInPreview(page,child,frame.getByText('Show reading details',{exact:true}));
  await frame.getByText('Invented values for this independent study.',{exact:false}).waitFor();
  await clickInPreview(page,child,frame.getByText('Show reading details',{exact:true}));
  await frame.locator('body').evaluate(()=>window.scrollTo(0,0));
  await mkdir(output,{recursive:true});
  await page.screenshot({path:resolve(output,`nasa-${width}.png`),fullPage:true});
  await page.getByRole('button',{name:'Foundations',exact:true}).click();
  await page.getByText('#f64137',{exact:false}).first().waitFor();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await writeFile(resolve(output,'browser-result.json'),JSON.stringify({widths:[1440,390],errors,external,scope:'NASA studio registration, sandbox specimen, foundations, repeated details, overflow'},null,2));
 console.log('NASA desktop/mobile browser checks passed');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
