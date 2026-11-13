/** Literal CSS dimensions and accessible duration previews. */
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(root, 'review/literal-dimensions');
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
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], external = [], runs = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:\/\//, route => {
    if (new URL(route.request().url()).origin !== base) { external.push(route.request().url()); return route.abort(); }
    return route.continue();
  });
  await mkdir(output, { recursive: true });
  const nearly = (a, b) => assert.ok(Math.abs(a - b) < 0.05, `${a} != ${b}`);
  await page.goto(base + '/apps/studio/?collection=reads&section=foundations');
  await page.locator('[data-token-name="motion.duration"] .wb-motion-preview').waitFor();
  const projects=await page.getByLabel('Collection',{exact:true}).locator('option').allTextContents();assert.deepEqual(projects,[...projects].sort((a,b)=>a.localeCompare(b,'en',{sensitivity:'base',numeric:true})));assert.ok(projects.includes('Stethem'));
  for (const [name, radius] of [['control',17],['field',14],['panel',26],['panel.mobile',23]]) {
    const measured = await page.locator(`[data-token-name="radius.${name}"] .wb-radius-diagram`).evaluate(n => ({ radius: getComputedStyle(n).borderTopLeftRadius, width:n.getBoundingClientRect().width, height:n.getBoundingClientRect().height }));
    assert.equal(measured.radius, radius + 'px'); nearly(measured.width, radius + 16); nearly(measured.height, radius + 16);
  }
  nearly(await page.locator('[data-token-name="space.panel"] .wb-length-diagram').evaluate(n => n.getBoundingClientRect().width),28);
  const motion = page.locator('[data-token-name="motion.duration"] .wb-motion-preview'), dot = motion.locator('.wb-motion-dot');
  const position = () => dot.evaluate(n => parseFloat(getComputedStyle(n).left));
  nearly(await position(),0);
  assert.equal(await motion.locator('.wb-motion-track').evaluate(n => getComputedStyle(n,'::before').content),'none');
  await motion.hover();
  const timing = await dot.evaluate(n => { const a=n.getAnimations()[0];a.pause();a.currentTime=100;return a.effect.getTiming(); });
  assert.equal(timing.duration,200);assert.equal(timing.easing,'linear');
  nearly(await position(),48);
  await page.locator('.wb-foundation-dimensions').evaluate(n => n.scrollIntoView({block:'start'}));
  await page.waitForTimeout(500);await page.screenshot({path:resolve(output,'reads-motion-midpoint-desktop.png')});
  await page.mouse.move(0,0);nearly(await position(),0);assert.equal(await dot.evaluate(n=>n.getAnimations().length),0);
  await motion.hover();await page.waitForTimeout(240);nearly(await position(),96);
  await page.mouse.move(0,0);nearly(await position(),0);
  // Keyboard focus and activation can replay without a pointer.
  await page.keyboard.press('Tab');await motion.focus();assert.equal(await motion.evaluate(n=>n.matches(':focus-visible')),true);
  assert.equal(await dot.evaluate(n=>n.getAnimations().length),1);
  await dot.evaluate(n=>{const a=n.getAnimations()[0];a.pause();a.currentTime=200;});
  await page.keyboard.press('Enter');assert.equal(await dot.evaluate(n=>n.getAnimations()[0].playState),'running');
  await motion.evaluate(n=>n.blur());nearly(await position(),0);
  await motion.dispatchEvent('pointerenter');assert.equal(await dot.evaluate(n=>n.getAnimations().length),1);await motion.dispatchEvent('pointercancel');nearly(await position(),0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-token-name="motion.duration"]').getByText('Reduced motion: static preview',{exact:true}).waitFor();
  await motion.hover();await motion.focus();await motion.click();assert.equal(await dot.evaluate(n=>n.getAnimations().length),0);nearly(await position(),0);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('[data-token-name="motion.duration"]').getByText('Hover, focus or press to play',{exact:true}).waitFor();
  await page.mouse.move(0,0);await motion.hover();assert.equal(await dot.evaluate(n=>n.getAnimations().length),1);
  // Filtering destroys running animations; clearing the filter returns to rest.
  await page.getByRole('searchbox',{name:'Filter tokens'}).fill('radius');assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.wb-motion-dot')].reduce((count, dot) => count + dot.getAnimations().length, 0)),0);
  await page.getByRole('searchbox',{name:'Filter tokens'}).fill('');nearly(await page.locator('[data-token-name="motion.duration"] .wb-motion-dot').evaluate(n=>parseFloat(getComputedStyle(n).left)),0);
  await page.evaluate(async () => {
    const {mountWorkbench}=await import('/packages/workbench/index.mjs');
    window.dimensionQA=mountWorkbench(document.querySelector('#workbench'),{collections:[{id:'dimensions',title:'Dimension QA',themes:['light'],tokensData:{modes:[{id:'light',tokens:{
      'font.mono':{type:'fontFamily',value:'monospace'},'font.body':{type:'fontFamily',value:'Georgia, serif'},
      'font.size.large':{type:'dimension',value:'48px'},'font-size.small':{type:'dimension',value:'12px'},'type.size.relative':{type:'dimension',value:'2rem'},
      'space.small':{type:'dimension',value:'8px'},'space.zero':{type:'dimension',value:'0px'},'space.large':{type:'dimension',value:'192px'},'space.negative':{type:'dimension',value:'-1.4px'},'space.relative':{type:'dimension',value:'2rem'},
      'radius.none':{type:'dimension',value:'0px'},'radius.zero.decimal':{type:'dimension',value:'0.0'},'radius.zero.fraction':{type:'dimension',value:'.0'},'radius.zero.negative':{type:'dimension',value:'-0'},'radius.tiny':{type:'dimension',value:'1px'},'radius.pill':{type:'dimension',value:'9999px'},
      'space.percent':{type:'dimension',value:'50%'},'space.calc':{type:'dimension',value:'calc(10px + 1em)'},'space.composite':{type:'dimension',value:'10px 20px'},'radius.negative':{type:'dimension',value:'-4px'},'space.unsafe':{type:'dimension',value:'url(https://example.com/track)'},'space.unitless':{type:'dimension',value:'12'},
      'motion.zero':{type:'dimension',value:'0ms'},'motion.ms':{type:'dimension',value:'120ms'}
    }}]}}]});
  });
  for(const width of [1440,390,320]) {
    await page.setViewportSize({width,height:1000});
    const names = await page.locator('.wb-foundation-dimensions .wb-token-card').evaluateAll(nodes => nodes.map(n => n.dataset.tokenName));
    assert.deepEqual(names, [...names].sort((a,b) => a.localeCompare(b, 'en', {sensitivity:'base',numeric:true})));
    for (const [name, size] of [['font.size.large',48],['font-size.small',12],['type.size.relative',32]]) {
      const sample = page.locator(`[data-token-name="${name}"] .wb-font-size-diagram`);
      assert.equal(await sample.textContent(),'Aa');
      const style = await sample.evaluate(n => ({size:parseFloat(getComputedStyle(n).fontSize),family:getComputedStyle(n).fontFamily}));
      nearly(style.size,size); assert.equal(style.family,'Georgia, serif');
      assert.equal(await sample.locator('.wb-length-diagram').count(),0);
    }
    nearly(await page.locator('[data-token-name="space.small"] .wb-length-diagram').evaluate(n=>n.getBoundingClientRect().width),8);
    nearly(await page.locator('[data-token-name="space.zero"] .wb-length-diagram').evaluate(n=>n.getBoundingClientRect().width),0);
    nearly(await page.locator('[data-token-name="space.large"] .wb-length-diagram').evaluate(n=>parseFloat(getComputedStyle(n).width)),192);
    nearly(await page.locator('[data-token-name="space.negative"] .wb-length-diagram').evaluate(n=>n.getBoundingClientRect().width),1.4);
    await page.locator('[data-token-name="space.negative"] .wb-token-detail').filter({hasText:'Negative value: magnitude shown'}).waitFor();
    nearly(await page.locator('[data-token-name="radius.none"] .wb-radius-diagram').evaluate(n=>parseFloat(getComputedStyle(n).borderTopLeftRadius)),0);
    nearly(await page.locator('[data-token-name="radius.tiny"] .wb-radius-diagram').evaluate(n=>parseFloat(getComputedStyle(n).borderTopLeftRadius)),1);
    for(const variant of ['decimal','fraction','negative']) nearly(await page.locator(`[data-token-name="radius.zero.${variant}"] .wb-radius-diagram`).evaluate(n=>n.getBoundingClientRect().width),16);
    const big=page.locator('[data-token-name="radius.pill"] .wb-dimension-preview');
    await page.waitForFunction(()=>Number(document.querySelector('[data-token-name="radius.pill"] .wb-dimension-preview').dataset.scale)<1);
    const geometry=await big.evaluate(n=>({client:n.clientWidth,scroll:n.scrollWidth,left:n.scrollLeft}));assert.ok(geometry.client<400);assert.equal(geometry.left,0);assert.equal(await big.evaluate(n=>getComputedStyle(n).overflow),'clip');
    nearly(await big.locator('.wb-radius-diagram').evaluate(n=>parseFloat(getComputedStyle(n).borderTopLeftRadius)),9999);
    assert.equal(await page.locator('[data-dimension-kind="unsupported"]').count(),6);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    runs.push({width,exactLengths:true,exactRadii:true,oversizeContained:true});
  }
  await page.evaluate(()=>document.documentElement.style.fontSize='20px');
  nearly(await page.locator('[data-token-name="type.size.relative"] .wb-font-size-diagram').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)),40);
  nearly(await page.locator('[data-token-name="space.relative"] .wb-length-diagram').evaluate(n=>n.getBoundingClientRect().width),40);
  await page.evaluate(()=>document.documentElement.style.fontSize='');
  const zero=page.locator('[data-token-name="motion.zero"] .wb-motion-preview');await zero.hover();await page.waitForTimeout(30);
  nearly(await zero.locator('.wb-motion-dot').evaluate(n=>parseFloat(getComputedStyle(n).left)),await zero.locator('.wb-motion-track').evaluate(n=>n.getBoundingClientRect().width));
  await page.mouse.move(0,0);nearly(await zero.locator('.wb-motion-dot').evaluate(n=>parseFloat(getComputedStyle(n).left)),0);
  await page.evaluate(()=>window.dimensionQA.setSkin('stethem'));nearly(await page.locator('[data-token-name="space.small"] .wb-length-diagram').evaluate(n=>n.getBoundingClientRect().width),8);
  const ms=page.locator('[data-token-name="motion.ms"] .wb-motion-preview');await ms.hover();assert.equal(await ms.locator('.wb-motion-dot').evaluate(n=>n.getAnimations()[0].effect.getTiming().duration),120);
  await page.evaluate(()=>window.dimensionQA.destroy());assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.wb-motion-dot')].reduce((count, dot) => count + dot.getAnimations().length, 0)),0);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  await page.goto(base+'/apps/studio/?collection=reads&section=foundations');await page.locator('[data-token-name="motion.duration"] .wb-motion-preview').waitFor();await page.locator('.wb-foundation-dimensions').evaluate(n=>n.scrollIntoView({block:'start'}));await page.waitForTimeout(500);await page.screenshot({path:resolve(output,'reads-dimensions-mobile.png')});
  await writeFile(resolve(output,'results.json'),JSON.stringify({status:'passed',browser:browser.version(),runs,errors,external,checks:['Literal CSS length/radius, zero and negative lengths','Oversize scroll and keyboard access','Hover, focus, Enter, cancel, replay and reset','Token timing in seconds and milliseconds','Live reduced-motion preference and zero duration','Filter/destroy cleanup','Unsupported contextual/composite values','Alternate skin and relative font context']},null,2)+'\n');
  console.log('PASS: actual-size dimensions, responsive overflow, motion timing/replay/reset, reduced motion and cleanup.');
} finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
