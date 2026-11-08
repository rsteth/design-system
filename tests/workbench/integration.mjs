/** Requires running central studio plus the app servers declared in registry/index.json. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})});
const page = await browser.newPage({viewport:{width:1440,height:1100}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const results=[];
const artifacts=new URL('./artifacts/',import.meta.url);await mkdir(artifacts,{recursive:true});
async function assertShellIsolation() {
 const frame = page.frames().find(frame => frame.parentFrame() === page.mainFrame());
 assert.ok(frame, 'Actual app fixture is loaded');
 const sample = () => [document.documentElement, document.body, document.querySelector('button')].filter(Boolean).map(node => {
  const style = getComputedStyle(node);
  return [style.color, style.backgroundColor, style.fontFamily, style.getPropertyValue('--wb-accent').trim()];
 });
 const before = await frame.evaluate(sample);
 await page.locator('.wb-shell').evaluate(shell => {
  shell.style.setProperty('--wb-accent', '#010203');
  shell.style.setProperty('--wb-ink', '#040506');
  shell.style.setProperty('--wb-paper', '#070809');
 });
 assert.deepEqual(await frame.evaluate(sample), before, 'Changing shell skin must not alter actual app styles');
 await page.locator('.wb-shell').evaluate(shell => ['--wb-accent', '--wb-ink', '--wb-paper'].forEach(token => shell.style.removeProperty(token)));
}
async function check(name, callback){try{await callback();results.push({name,status:'passed'});}catch(error){results.push({name,status:'failed',message:error.message});}}
try {
 await page.goto(process.env.STUDIO_URL ?? 'http://127.0.0.1:4310/apps/studio/');
 await page.getByLabel('Collection',{exact:true}).selectOption('focus');
 for(const id of ['focus','great-circle']) await check(`${id}: production appearance interactions in isolated frame`,async()=>{
  await page.getByLabel('Collection',{exact:true}).selectOption(id);
  await page.getByRole('button',{name:'Components',exact:true}).click();
  const frame=page.frameLocator('iframe');
  await frame.getByRole('button',{name:'Dark mode',exact:true}).waitFor({timeout:10000});
  await page.getByText('Theme adapter confirmed: light.',{exact:true}).waitFor({timeout:10000});
  assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');
  await assertShellIsolation();
  await frame.getByRole('button',{name:'Dark mode',exact:true}).click();
  await frame.locator('html[data-theme="dark"]').waitFor();
  await frame.getByRole('button',{name:'Dark mode',exact:true}).click();
  await frame.locator('html[data-theme="light"]').waitFor();
  for(let repeat=0;repeat<2;repeat++){
   await frame.getByRole('button',{name:'Accessibility',exact:true}).click();
   await frame.getByRole('dialog').waitFor();
   await frame.getByRole('radio').last().check();
   assert.equal(await frame.locator('html').getAttribute('data-palette'),'high-contrast');
   await frame.getByRole('button',{name:'Close accessibility',exact:true}).click();
   await frame.getByRole('dialog').waitFor({state:'hidden'});
  }
  await page.getByLabel('Theme',{exact:true}).selectOption('dark');
  await page.getByText('Theme adapter confirmed: dark.',{exact:true}).waitFor();
  await page.frameLocator('iframe').locator('html[data-theme="dark"]').waitFor();
  await page.getByLabel('Compare themes',{exact:true}).check();
  assert.equal(await page.locator('iframe').count(),2);
  await page.getByText('Theme adapter confirmed: light.',{exact:true}).waitFor();
  await page.frameLocator('iframe').nth(1).locator('html[data-theme="light"]').waitFor();
  await page.screenshot({path:fileURLToPath(new URL(`${id}-integrated.png`,artifacts)),fullPage:true});
  await page.getByLabel('Compare themes',{exact:true}).uncheck();
  await page.getByLabel('Theme',{exact:true}).selectOption('light');
 });
 await check('stethem: native attention controls inside isolated frame',async()=>{
  await page.getByLabel('Collection',{exact:true}).selectOption('stethem');
  await page.getByRole('button',{name:'Components',exact:true}).click();
  await page.getByLabel('Fixture',{exact:true}).selectOption('attention-growth-minimum');
  const frame=page.frameLocator('iframe');
  await frame.locator('html[data-workbench-ready="true"]').waitFor();
  await frame.locator('#next:enabled').waitFor();
  await assertShellIsolation();
  assert.equal(await frame.locator('#step-status').innerText(),'0 / 6 updates');
  await frame.locator('#next').click();
  assert.equal(await frame.locator('#step-status').innerText(),'1 / 6 updates');
  await frame.locator('#previous').click();
  assert.equal(await frame.locator('#step-status').innerText(),'0 / 6 updates');
  await frame.locator('#context').fill('32768');
  assert.equal(await frame.locator('#tokens').innerText(),'32,768 tokens');
  await frame.locator('#layer-focus').selectOption({index:3});
  assert.match(await frame.locator('#selected-layer').innerText(),/Layer 4/);
  await page.getByText('Theme adapter confirmed: light.',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Theme',{exact:true}).locator('option').count(),1,'Static fixtures declare light only');
  await page.screenshot({path:fileURLToPath(new URL('stethem-integrated.png',artifacts)),fullPage:true});
 });
 await check('stethem: real portfolio screen',async()=>{
  await page.getByRole('button',{name:'Screens',exact:true}).click();
  await page.getByLabel('Fixture',{exact:true}).selectOption('portfolio');
  const frame=page.frameLocator('iframe');await frame.locator('body').waitFor();
  await frame.getByRole('link').first().waitFor();
  assert.ok(await frame.getByRole('link').count()>5);
  await page.getByText('Theme adapter confirmed: light.',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Theme',{exact:true}).locator('option').count(),1,'Static fixtures declare light only');
 });
 await check('workbench: nested real studio reaches Focus without self recursion',async()=>{
  await page.getByLabel('Collection',{exact:true}).selectOption('workbench');
  await page.getByRole('button',{name:'Screens',exact:true}).click();
  const studio=page.frameLocator('iframe');
  await studio.getByLabel('Collection',{exact:true}).selectOption('focus');
  assert.equal(await studio.getByLabel('Collection',{exact:true}).locator('option[value="workbench"]').count(),0);
  await studio.getByRole('button',{name:'Components',exact:true}).click();
  const app=studio.frameLocator('iframe');
  await app.getByRole('button',{name:'Dark mode',exact:true}).waitFor();
  await studio.getByText('Theme adapter confirmed: light.',{exact:true}).waitFor();
  await app.getByRole('button',{name:'Dark mode',exact:true}).click();
  await app.locator('html[data-theme="dark"]').waitFor();
  await studio.getByLabel('Theme',{exact:true}).selectOption('dark');
  await studio.getByText('Theme adapter confirmed: dark.',{exact:true}).waitFor();
  await app.locator('html[data-theme="dark"]').waitFor();
  assert.equal(await page.locator('iframe').count(),1);
  assert.equal(await studio.locator('iframe').count(),1);
  assert.equal(await app.locator('iframe').count(),0);
  assert.equal(page.frames().length,3,'Outer workbench, nested studio, and actual app only');
 });
 results.push({name:'Uncaught page errors',status:errors.length?'failed':'passed',errors});
} finally {
 await browser.close();
 await writeFile(new URL('integration-results.json',artifacts),JSON.stringify({timestamp:new Date().toISOString(),results},null,2)+'\n');
}
console.log(JSON.stringify(results,null,2));
if(results.some(result=>result.status==='failed'))process.exitCode=1;
