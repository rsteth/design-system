/** Self-contained browser QA for the real Workbench collection and replaceable shell skin. */
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
const palette = {'--wb-ink':'#ebe8df','--wb-muted':'#85837e','--wb-accent':'#ebe8df','--wb-accent-hover':'#f9f7f1','--wb-paper':'#060609','--wb-wash':'#0c0e11'};
let browser;
const results = [];
try {
  browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
  const page = await browser.newPage({viewport:{width:1440,height:1100}});
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await mkdir(artifacts, {recursive:true});
  await page.goto(base + '/apps/studio/');
  await page.getByLabel('Collection', {exact:true}).selectOption('workbench');
  await page.getByRole('heading', {name:'Token inspector', exact:true}).waitFor();
  assert.equal(await page.locator('.studio-symbol,.wb-mark,.wb-empty-symbol,.wb-brand small').count(),0);assert.equal(await page.locator('.wb-brand strong').innerText(),'Robin');assert.equal(await page.locator('#library-status').innerText(),'');
  assert.equal(await page.locator('.wb-shell').getAttribute('data-wb-skin'), 'workbench');
  assert.deepEqual(await page.locator('.wb-shell').evaluate((shell, names) => Object.fromEntries(names.map(name => [name,getComputedStyle(shell).getPropertyValue(name).trim()])), Object.keys(palette)), palette);
  const collection = JSON.parse(await readFile(new URL('../../collections/original/workbench/collection.json', import.meta.url)));
  assert.equal(collection.kind, 'original');
  assert.deepEqual(collection.themes, ['workbench']);
  for (const color of Object.values(palette)) assert.ok((await page.locator('tbody').innerText()).includes(color), `Authored tokens include ${color}`);
  await page.screenshot({path:fileURLToPath(new URL('workbench-self-desktop.png',artifacts)),fullPage:true});
  const mobile = await browser.newPage({viewport:{width:390,height:844}});
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(base + '/apps/studio/');
  await mobile.getByLabel('Collection',{exact:true}).selectOption('workbench');
  await mobile.getByRole('heading',{name:'Token inspector',exact:true}).waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
  await mobile.screenshot({path:fileURLToPath(new URL('workbench-self-mobile.png',artifacts)),fullPage:true});
  await mobile.getByRole('button',{name:'Components',exact:true}).click();
  await mobile.frameLocator('iframe').locator('.wb-shell').waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);

  await mobile.close();
  results.push('Exact monochrome dark shell palette and authored token values; desktop/mobile without page overflow');
  for (const fixture of collection.fixtures) {
    await page.getByRole('button', {name:fixture.section[0].toUpperCase()+fixture.section.slice(1),exact:true}).click();
    const picker = page.getByLabel('Fixture', {exact:true});
    if (await picker.count() && await picker.inputValue() !== fixture.id) await picker.selectOption(fixture.id);
    await page.locator('iframe').waitFor();
    assert.equal(await page.locator('iframe').count(),1);
    assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');
    const inner = page.frameLocator('iframe');
    await inner.locator('.wb-shell').first().waitFor();
    await page.getByText('Theme adapter confirmed: workbench.',{exact:true}).waitFor();
    assert.equal(await inner.locator('iframe').count(),0, 'Self fixtures start without recursive frames');
    assert.equal(await inner.locator('.wb-mark,.wb-empty-symbol,.wb-brand small').count(),0);
    const frame = page.frames().find(frame => frame.parentFrame() === page.mainFrame());
    assert.ok(frame);
    const imports = await frame.evaluate(() => performance.getEntriesByType('resource').map(entry => new URL(entry.name).pathname));
    assert.ok(imports.includes('/packages/workbench/index.mjs'), 'Fixture executes the shared real workbench engine');
    assert.ok(imports.includes('/packages/workbench/style.css'), 'Fixture uses shared real workbench stylesheet');

    if (new URL(fixture.url, base).searchParams.get('view') === 'studio') {
      assert.equal(await inner.getByLabel('Collection',{exact:true}).locator('option[value="workbench"]').count(),0, 'Nested studio excludes itself');
      assert.equal(await inner.getByLabel('Collection',{exact:true}).locator('option').count(),5);
    } else {
      if (new URL(fixture.url, base).searchParams.get('view') === 'patterns') {
        for (let repeat=0;repeat<2;repeat++) {
          await inner.getByRole('button',{name:'Loaded token collection',exact:true}).click();
          await inner.getByRole('heading',{name:'Token inspector',exact:true}).waitFor();
          assert.equal(await inner.locator('iframe').count(),0);
          await inner.getByRole('button',{name:'Empty collection list',exact:true}).click();
          await inner.getByRole('heading',{name:'Make room for your system',exact:true}).waitFor();
        }
      }
      for (const section of ['Components','Patterns','Screens','Checks','Sources','Foundations']) {
        const button = inner.getByRole('button',{name:section,exact:true}).first();
        if (await button.count()) await button.click();
        assert.equal(await inner.locator('iframe').count(),0, 'Stripped self collection cannot create another iframe');
      }
    }
    await page.waitForTimeout(300);
    assert.equal(page.frames().length,2, 'One parent and one fixture frame, no recursion');
    assert.equal(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,'Self fixture has no page overflow');

    results.push(`${fixture.id}: real shared engine, theme acknowledgment, isolated sandbox and bounded iframe tree`);
  }
  // Fresh contexts avoid Chromium's stale iframe raster after earlier full-page captures.
  for (const [section,filename,width,height] of [
    ['components','workbench-self-controls-desktop',1440,1100],
    ['patterns','workbench-self-states-desktop',1440,1100],
    ['screens','workbench-self-studio-desktop',1440,1100],
    ['components','workbench-self-controls-mobile',390,844]
  ]) {
    const context=await browser.newContext({viewport:{width,height}});
    const capture=await context.newPage();
    await capture.goto(base + `/apps/studio/?collection=workbench&section=${section}`);
    await capture.frameLocator('iframe').locator('.wb-shell').waitFor();
    await capture.getByText('Theme adapter confirmed: workbench.',{exact:true}).waitFor();
    await capture.waitForTimeout(500);
    assert.equal(await capture.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    await capture.screenshot({path:fileURLToPath(new URL(`${filename}.png`,artifacts)),fullPage:true});
    await context.close();
  }
  // Replacing the skin is an engine concern, separate from fixture theme selection.
  await page.evaluate(async () => {
    const {mountWorkbench} = await import('/packages/workbench/index.mjs');
    const {loadCollections} = await import('/packages/workbench/index.mjs');
    const collections = await loadCollections('/registry/index.json');
    window.skinTest = mountWorkbench(document.querySelector('#workbench'),{collections,initialCollection:'workbench',initialSection:'components'});
    window.originalFixture = document.querySelector('iframe');
    window.skinTest.setSkin('test-alternate');
  });
  assert.equal(await page.locator('.wb-shell').getAttribute('data-wb-skin'),'test-alternate');
  assert.equal(await page.evaluate(() => document.querySelector('iframe') === window.originalFixture),true,'Skin update preserves mounted fixture');
  await page.evaluate(() => window.skinTest.setSkin('workbench'));assert.equal(await page.locator('.wb-brand small').count(),0);
  assert.deepEqual(await page.locator('.wb-shell').evaluate((shell,names) => Object.fromEntries(names.map(name=>[name,getComputedStyle(shell).getPropertyValue(name).trim()])), Object.keys(palette)), palette);
  await page.goto(base + '/templates/blank/index.html');
  await page.getByRole('heading',{name:'Make room for your system',exact:true}).waitFor();
  assert.equal(await page.locator('iframe').count(),0);
  assert.equal(await page.getByRole('alert').count(),0);
  assert.equal(await page.locator('.wb-shell').getAttribute('data-wb-skin'),'workbench');
  assert.deepEqual(errors,[]);
  results.push('Replaceable shell skin; standalone empty starter; zero uncaught page errors');
  console.log('PASS: ' + results.join('; '));
  await writeFile(new URL('self-collection-results.json',artifacts),JSON.stringify({timestamp:new Date().toISOString(),results,errors},null,2)+'\n');
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
