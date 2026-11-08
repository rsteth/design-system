/** Run with PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/workbench/browser.mjs */
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (pathname === '/__fixture') {
    response.setHeader('Content-Type','text/html');
    response.end(`<!doctype html><html><body><button>Fixture action</button><script>addEventListener('message',event=>{if(event.source!==parent || event.data.type!=='workbench:set-theme')return;document.body.dataset.theme=event.data.theme;document.body.style.background=event.data.theme==='dark'?'#17251c':'#fff';parent.postMessage({type:'workbench:theme-applied',theme:event.data.theme,requestId:event.data.requestId},'*')})</script></body></html>`); return;
  }
  const path = resolve(root, '.' + decodeURIComponent(pathname));
  if (!path.startsWith(resolve(root) + sep)) {response.writeHead(403).end();return;}
  try {
    const content = await readFile(path.endsWith(sep) ? path+'index.html' : path);
    response.setHeader('Content-Type', ({'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[extname(path)] ?? 'application/octet-stream');
    response.end(content);
  } catch {response.writeHead(404).end('Not found');}
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/templates/blank/index.html');
  await page.getByRole('heading',{name:'Make room for your system'}).waitFor();
  assert.equal(await page.locator('iframe').count(),0);
  assert.equal(await page.getByRole('alert').count(),0);
  for(const section of ['Components','Patterns','Screens','Checks','Sources','Foundations']) {
    await page.getByRole('button',{name:section,exact:true}).click();
    await page.getByRole('heading',{name:section,exact:true}).waitFor();
    assert.equal(await page.locator('nav [aria-current="page"]').count(),1);
  }
  await mkdir(new URL('./artifacts/',import.meta.url),{recursive:true});
  await page.screenshot({path:fileURLToPath(new URL('./artifacts/blank-desktop.png',import.meta.url)),fullPage:true});
  await page.evaluate(async base=>{
    const {mountWorkbench} = await import('/packages/workbench/index.mjs');
    window.testApp=mountWorkbench(document.querySelector('#workbench'),{collections:[{
      schemaVersion:1,id:'test',title:'QA collection',kind:'original',renderer:'dom',summary:'Synthetic test collection, not app UI.',themes:['light','dark'],
      source:{repository:'https://example.com/source',revision:'test',path:'.'},provenance:{status:'author-owned',sources:[]},license:{spdx:'UNLICENSED',note:'QA only'},
      tokensData:{modes:[{id:'light',tokens:{'color.background':{type:'color',value:'#fff'},'space.small':{type:'dimension',value:'8px'},'<img src=x onerror=alert(1)>':{type:'string',value:'<b>text only</b>'}}},{id:'dark',tokens:{'color.background':{type:'color',value:'#17251c'}}}]},
      fixtures:[{id:'button',title:'Test fixture',section:'components',url:base+'/__fixture'}]
    }]});
  },base);
  assert.equal(await page.locator('tbody tr').count(),3);
  assert.equal(await page.locator('td img, td b').count(),0);
  await page.getByRole('searchbox').fill('space');
  assert.equal(await page.locator('tbody tr').count(),1);
  assert.equal(await page.locator('tbody').innerText().then(text=>text.includes('space.small')),true);
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button',{name:'Components',exact:true}).click();
  await page.getByText('Theme adapter confirmed: light.',{exact:true}).waitFor();
  assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');
  await page.getByLabel('Compare themes',{exact:true}).check();
  assert.equal(await page.locator('iframe').count(),2);
  await page.getByText('Theme adapter confirmed: dark.',{exact:true}).waitFor();
  await page.getByLabel('Viewport',{exact:true}).selectOption('mobile');
  assert.equal(await page.locator('iframe').first().evaluate(frame=>getComputedStyle(frame).width),'390px');
  await page.getByLabel('Theme',{exact:true}).selectOption('dark');
  await page.getByText('Theme adapter confirmed: dark.',{exact:true}).waitFor();
  await page.getByLabel('Compare themes',{exact:true}).uncheck();
  assert.equal(await page.locator('iframe').count(),1);
  await page.getByRole('button',{name:'Sources',exact:true}).click();
  assert.equal(await page.locator('iframe').count(),0);
  await page.getByRole('heading',{name:'Source & provenance'}).waitFor();
  await page.getByRole('button',{name:'Foundations',exact:true}).click();
  assert.equal(await page.locator('tbody tr').count(),1);
  await page.getByLabel('Theme',{exact:true}).selectOption('light');
  await page.screenshot({path:fileURLToPath(new URL('./artifacts/tokens-desktop.png',import.meta.url)),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
  await page.evaluate(()=>scrollTo(0,0));
  await page.waitForTimeout(200);
  await page.screenshot({path:fileURLToPath(new URL('./artifacts/tokens-mobile.png',import.meta.url)),fullPage:true});
  await page.evaluate(base=>window.testApp.setCollections([{schemaVersion:1,id:'unavailable',title:'Unavailable fixture',themes:['light'],fixtures:[{id:'missing',title:'Missing fixture',section:'components',url:base+'/__missing-fixture'}]}]),base);
  await page.getByRole('button',{name:'Components',exact:true}).click();
  await page.waitForTimeout(8200);
  assert.match(await page.locator('.wb-status').innerText(),/unverified|failed/);
  assert.doesNotMatch(await page.locator('.wb-status').innerText(),/confirmed/);
  await page.evaluate(base=>window.testApp.setCollections([{
    schemaVersion:1,id:'focus',title:'Inventory QA',themes:['light'],fixtures:[{id:'button',title:'Button states',section:'components',url:base+'/__fixture',description:'Real authored fixture description',states:['disabled','loading']}],
    inventoryData:{schemaVersion:1,application:'focus',reviewedRevision:'a'.repeat(40),items:[
      {id:'button',title:'Button',kind:'component',source:['src/button.tsx'],fixtures:['button'],states:['disabled'],coverage:'covered',notes:''},
      {id:'form',title:'Form',kind:'pattern',source:['src/form.tsx'],fixtures:[],states:[],coverage:'partial',notes:'Validation states pending'},
      {id:'service',title:'Service',kind:'domain',source:['src/service.ts'],fixtures:[],states:[],coverage:'excluded',notes:'No browser surface'},
      {id:'provider',title:'Provider',kind:'external',source:['src/provider.ts'],fixtures:[],states:[],coverage:'blocked',notes:'Credentials unavailable'}
    ],checks:[{id:'unit',label:'Unit tests',status:'passed',command:'npm test',scope:'Button only',evidence:'evidence/unit.txt'},{id:'visual',label:'Visual comparison',status:'not-run',command:'npm run visual',scope:'Full app'}]}
  }]),base);
  await page.getByText('Real authored fixture description',{exact:true}).waitFor();
  await page.getByText(/Recorded fixture states: disabled, loading/).waitFor();
  await page.getByRole('button',{name:'Checks',exact:true}).click();
  const inventory=page.locator('.wb-inventory');
  assert.match(await inventory.innerText(),/4 recorded items · 1 covered · 1 partial · 1 excluded · 1 blocked/);
  for(const text of ['src/button.tsx','Validation states pending','No browser surface','Credentials unavailable','Recorded: passed','Recorded: not-run','npm test','Button only','evidence/unit.txt','does not run checks','not checks executed'])assert.ok((await inventory.innerText()).includes(text),text);
  assert.equal(await page.locator('iframe').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
  await page.screenshot({path:fileURLToPath(new URL('./artifacts/inventory-mobile.png',import.meta.url)),fullPage:true});
  await page.evaluate(()=>window.testApp.setCollections([{schemaVersion:1,id:'focus',title:'Empty inventory',inventoryData:{items:[],checks:[]}}]));
  await page.getByText('Empty inventory. Coverage is unknown, not complete.',{exact:true}).waitFor();
  await page.evaluate(()=>window.testApp.setCollections([{schemaVersion:1,id:'focus',title:'No inventory'}]));
  await page.getByText('No inventory recorded. Coverage is unknown.',{exact:true}).waitFor();
  await page.evaluate(()=>window.testApp.setCollections([]));
  await page.getByRole('heading',{name:'Make room for your system'}).waitFor();
  await page.evaluate(()=>window.testApp.destroy());
  assert.equal(await page.locator('#workbench').innerHTML(),'');
  assert.deepEqual(errors,[]);
  console.log('PASS: blank starter, all sections, tokens/filter/text escaping, isolated fixtures, theme handshake, comparison, exact viewport, navigation cleanup, mobile overflow, missing-fixture remains unverified, setCollections and destroy. Recorded inventory counts, partial/excluded/blocked reasons, scoped historical checks, fixture descriptions/states, empty/absent inventory honesty. No page errors.');
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
