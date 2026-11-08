/** Profile controls, real opaque preview handshake, command scopes and verified downloads. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PROFILES, SCENES } from '../../packages/capture/scenes.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.split('/').some(part => part.startsWith('.') || part === 'node_modules')) throw new Error('Private');
    let path = resolve(root, '.' + pathname); if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    path = await realpath(path); if (!path.startsWith(root + sep)) throw new Error('Traversal');
    res.setHeader('Content-Type', ({ '.html':'text/html', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png' })[extname(path)] ?? 'application/octet-stream');
    res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
  const context = await browser.newContext({viewport:{width:1440,height:1100}});
  const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
  const base = `http://127.0.0.1:${server.address().port}`;
  const ready = async () => { await page.locator('.cs-stage').scrollIntoViewIfNeeded(); try { await page.locator('.cs-status[data-state=ready]').waitFor({timeout:20000}); } catch(error) { console.error('Preview failure', page.url(), await page.locator('.cs-status').innerText(), errors); throw error; } };
  await page.goto(base + '/apps/studio/?library=capture&scene=great-circle-route&theme=dark&profile=mobile'); await ready();
  assert.equal(await page.getByLabel('Capture scene',{exact:true}).inputValue(), 'great-circle-route');
  assert.equal(await page.getByLabel('Capture theme',{exact:true}).inputValue(), 'dark');
  assert.equal(await page.getByLabel('Capture profile',{exact:true}).inputValue(), 'mobile');
  assert.equal(await page.getByLabel('Capture profile',{exact:true}).locator('option').count(), PROFILES.length);
  for (const profile of PROFILES) {
    await page.getByLabel('Capture profile',{exact:true}).selectOption(profile.id); await ready();
    assert.equal(new URL(page.url()).searchParams.get('profile'), profile.id);
    const box = await page.locator('.cs-stage').boundingBox(); assert.ok(Math.abs(box.width / box.height - profile.viewport.width / profile.viewport.height) < .003);
    assert.equal(await page.locator('.cs-stage iframe').getAttribute('sandbox'), 'allow-scripts');
    assert.match(await page.locator('.cs-command').innerText(), new RegExp(`--profile ${profile.id}`));
    assert.equal(await page.locator('.cs-platform-warning').count(), profile.appStore ? 1 : 0);
    await page.getByRole('button',{name:'Reset preview',exact:true}).click(); await ready();
    // Real latest exports must contain every profile from the full runner pass.
    await page.getByRole('button',{name:'Refresh exports',exact:true}).click();
    await page.getByRole('link',{name:'Save original PNG',exact:true}).waitFor();
    await page.waitForFunction(width => { const image=document.querySelector('.cs-card-proof img'); return image?.complete && image.naturalWidth === width; }, (profile.derivative ?? profile.output).width);
  }
  await page.getByRole('button',{name:'Select all scenes, formats & themes',exact:true}).click();
  assert.equal(await page.locator('.cs-command').innerText(), 'npm run capture -- --scene all --profile all --theme both');
  await page.getByLabel('Command scenes',{exact:true}).selectOption('selected');
  assert.match(await page.locator('.cs-command').innerText(), /--scene great-circle-route --profile all --theme both/);
  await page.getByRole('button',{name:'Copy command',exact:true}).click();
  await page.waitForFunction(() => document.querySelector('.cs-copy-status').textContent.length > 0);
  // Synthetic known PNG exercises verification and failure paths, not app visual evidence.
  const png = Buffer.from(await page.evaluate(() => { const canvas=document.createElement('canvas'); canvas.width=1440; canvas.height=900; canvas.getContext('2d').fillRect(0,0,1440,900); return canvas.toDataURL('image/png').split(',')[1]; }), 'base64');
  const artifact = {path:'review/captures/test-ui/great-circle-route-dark-desktop/original.png',width:1440,height:900,sha256:createHash('sha256').update(png).digest('hex')};
  const entry = {sceneId:'great-circle-route',sceneVersion:SCENES[1].version,theme:'dark',profileId:'desktop',viewport:{width:1440,height:900},deviceScaleFactor:1,capturedAt:new Date().toISOString(),source:{dirty:true,revision:'12345678901234567890'},original:artifact};
  await context.route('**/review/captures/latest.json', route => route.fulfill({json:{schemaVersion:2,createdAt:entry.capturedAt,captures:[entry]}}));
  await context.route('**/test-ui/**/original.png', route => route.fulfill({contentType:'image/png',body:png}));
  await page.getByLabel('Capture profile',{exact:true}).selectOption('desktop'); await ready();
  await page.getByRole('button',{name:'Refresh exports',exact:true}).click();
  await page.getByRole('link',{name:'Save original PNG',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Save 800 × 600 PNG',exact:true}).count(),0);
  assert.equal(await page.getByRole('link',{name:'Save provenance JSON',exact:true}).count(),1);
  await page.locator('.cs-card-proof img').evaluate(image => image.decode());
  assert.equal(await page.locator('.cs-card-proof img').evaluate(image => image.naturalWidth),1440);
  await context.unroute('**/test-ui/**/original.png');
  await context.route('**/test-ui/**/original.png', route => route.fulfill({status:404,body:'Missing'}));
  await page.getByRole('button',{name:'Refresh exports',exact:true}).click(); await page.getByRole('alert').filter({hasText:'could not be verified'}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Save original PNG',exact:true}).count(),0);
  await page.getByRole('button',{name:'Robin',exact:true}).click(); await page.getByLabel('Collection',{exact:true}).waitFor();
  await page.goBack(); await ready(); assert.equal(await page.getByLabel('Capture profile',{exact:true}).inputValue(),'desktop');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
  await page.getByLabel('Capture profile',{exact:true}).selectOption('app-store-iphone-6-3'); await ready();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
  await page.evaluate(() => { for (const id of ['references','capture','own','capture']) document.querySelector(`[data-library="${id}"]`).click(); }); await ready();
  assert.equal(await page.locator('.cs-shell').count(),1); assert.deepEqual(errors,[]);
  console.log('Profile UI passed: seven real profile handshakes, ratios, deep links, batch scopes, clipboard feedback, verified original/provenance, missing-image rejection, navigation/races and mobile overflow.');
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
