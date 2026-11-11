/** Foundations cards, themes, safe values, responsive geometry and filtering. */
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(root, 'review/foundations');
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
  await page.goto(base + '/apps/studio/?collection=bandit&section=foundations');
  await page.getByRole('heading', { name: 'Color', exact: true }).waitFor();
  const chrome = await page.locator('.wb-shell').evaluate(n => getComputedStyle(n).getPropertyValue('--wb-accent'));
  // Mount every actual app/reference mode in the same engine, without fixture requests.
  const catalog = await page.evaluate(async () => {
    const { loadCollections } = await import('/packages/workbench/index.mjs');
    window.foundationCatalog = [...await loadCollections('/registry/index.json'), ...await loadCollections('/registry/references.json')];
    return window.foundationCatalog.map(c => ({ id: c.id, modes: c.tokensData?.modes?.map(m => ({ id: m.id, count: Object.keys(m.tokens).length })) ?? [] }));
  });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const collection of catalog) for (const mode of collection.modes) {
      await page.evaluate(async ({ id, mode }) => {
        window.foundationQA?.destroy();
        const { mountWorkbench } = await import('/packages/workbench/index.mjs');
        window.foundationQA = mountWorkbench(document.querySelector('#workbench'), { collections: [{ ...window.foundationCatalog.find(c => c.id === id), themes: window.foundationCatalog.find(c => c.id === id).tokensData.modes.map(m => m.id) }] });
        const select = document.querySelector('select[aria-label="Theme"]');
        select.value = mode; select.dispatchEvent(new Event('change'));
      }, { id: collection.id, mode: mode.id });
      assert.equal(await page.locator('.wb-token-card').count(), mode.count, collection.id + ':' + mode.id);
      assert.equal(await page.locator('.wb-shell').evaluate(n => getComputedStyle(n).getPropertyValue('--wb-accent')), chrome);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'overflow: ' + collection.id + ' ' + width);
      const badGeometry = await page.locator('.wb-token-card').evaluateAll(cards => cards.some(card => card.scrollWidth > card.clientWidth + 1));
      assert.equal(badGeometry, false, 'card overflow: ' + collection.id + ' ' + width);
      runs.push({ collection: collection.id, mode: mode.id, width, tokens: mode.count });
    }
  }
  // Restore the actual studio and inspect representative layouts.
  for (const [id, width] of [['reads', 1440], ['bandit', 390], ['workbench', 1440], ['reference-stripe', 1440]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + '/apps/studio/?section=foundations&collection=' + id + (id.startsWith('reference-') ? '&library=references' : ''));
    await page.getByRole('heading', { name: 'Color', exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Color', exact: true }).count(), 1);
    if (id === 'reads') { assert.equal(await page.locator('.wb-radius-diagram').count(), 4); assert.equal(await page.locator('.wb-length-diagram').count(), 2); }
    if (id === 'bandit') {
      assert.equal(await page.locator('.wb-font-preview').count(), 3);
      assert.match(await page.locator('.wb-font-preview').nth(1).evaluate(n => getComputedStyle(n).fontFamily), /Space Grotesk/);
    }
    await page.screenshot({ path: resolve(output, id + '-' + width + '.png'), fullPage: true });
    if (id === 'reads') {
      await page.screenshot({ path: resolve(output, 'colors-desktop.png') });
      await page.locator('.wb-foundation-dimensions').evaluate(n => n.scrollIntoView({ block: 'start' }));
      await page.screenshot({ path: resolve(output, 'dimensions-fonts-desktop.png') });
    }
  }
  const filter = page.getByRole('searchbox', { name: 'Filter tokens' });
  await filter.fill('rounded');
  assert.equal(await page.locator('.wb-foundation-group').count(), 1);
  assert.ok(await page.locator('.wb-radius-diagram').count() > 0);
  await filter.fill('unmatched-token-xyz');
  await page.getByText('No matching tokens.', { exact: true }).waitFor();
  assert.equal(await page.locator('.wb-foundation-group').count(), 0);
  await filter.fill('');
  assert.ok(await page.locator('[data-source-path][data-source-line]').count() > 0);
  assert.equal(await filter.evaluate(n => n === document.activeElement), true);
  // Safety and formatting cases not necessarily present in the current catalogs.
  await page.evaluate(async () => {
    const { mountWorkbench } = await import('/packages/workbench/index.mjs');
    window.foundationQA = mountWorkbench(document.querySelector('#workbench'), { collections: [{ id: 'qa', title: 'QA', kind: 'original', themes: ['light'], tokensData: { modes: [{ id: 'light', tokens: {
      'color.short': { type: 'color', value: '#abcd' },
      'color.alpha': { type: 'color', value: 'rgba(255,255,255,0.7)' },
      'color.bad': { type: 'color', value: 'url(https://example.com/tracker)' },
      'font.safe': { type: 'fontFamily', value: 'serif' },
      'font.bad': { type: 'fontFamily', value: 'serif; background: url(https://example.com/tracker)' },
      '<img src=x onerror=alert(1)>': { type: 'string', value: '<b>inert</b>' }
    } }] } }] });
  });
  assert.equal(await page.locator('[data-token-name="color.short"] .wb-token-value').innerText(), '#AABBCCDD');
  assert.equal(await page.locator('[data-token-name="color.alpha"] .wb-token-value').innerText(), '#FFFFFFB3');
  assert.equal(await page.locator('[data-token-name="color.bad"] .wb-swatch').getAttribute('style'), null);
  assert.equal(await page.locator('[data-token-name="font.bad"] .wb-font-preview').getAttribute('style'), null);
  assert.equal(await page.locator('.wb-token-card img, .wb-token-card b').count(), 0);
  assert.match(await page.locator('[data-token-name="font.safe"] .wb-font-preview').evaluate(n => getComputedStyle(n).fontFamily), /^serif$/);
  await page.getByRole('searchbox', { name: 'Filter tokens' }).fill('#FFFFFFB3');
  assert.equal(await page.locator('.wb-token-card').count(), 1);
  await page.evaluate(() => window.foundationQA.setCollections([{ id: 'empty', title: 'Empty', themes: ['light'] }]));
  await page.getByRole('searchbox', { name: 'Filter tokens' }).fill('');
  await page.getByText('No tokens in this collection.', { exact: true }).waitFor();
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  const report = { status: 'passed', browser: browser.version(), timestamp: new Date().toISOString(), collectionCount: catalog.length, runs, errors, externalRequests: external };
  await writeFile(resolve(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`PASS: ${runs.length} collection/mode/viewport cases across ${catalog.length} collections, safe values and filtering; no overflow, errors or external requests.`);
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
