/** Current curated project scope, hidden optional directory and removed-catalog absence. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url)),port=4393,base=`http://127.0.0.1:${port}`;
const out=resolve(root,'review/existing-app-coverage-20261111');
const expected=['workbench','focus','great-circle','stethem','reads','bandit'];
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const server=spawn(process.execPath,['tooling/serve.mjs','.',String(port)],{cwd:root,stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Server exited '+code)));});
 await mkdir(out,{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const page=await browser.newPage(),errors=[],external=[],runs=[];let auditRequests=0;
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().includes('projects.local.json'))auditRequests++;});
 await page.route(/^https?:\/\//,route=>{if(new URL(route.request().url()).origin===base)return route.continue();external.push(route.request().url());return route.abort();});
 const registry=JSON.parse(await readFile(resolve(root,'registry/index.json')));assert.equal(registry.projectCoverage,undefined);
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:1000});await page.goto(base+'/apps/studio/');
  const picker=page.getByLabel('Collection',{exact:true});await picker.waitFor();
  assert.deepEqual(await picker.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value)),expected);
  assert.equal(await page.getByRole('button',{name:'Project coverage',exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'viewer overflow '+width);
  await picker.selectOption('reads');await page.getByRole('heading',{name:'Color',exact:true}).waitFor();
  await page.screenshot({path:resolve(out,`existing-apps-${width}.png`),fullPage:false});runs.push({width,status:'passed'});
 }
 await page.goto(base+'/apps/studio/?library=coverage');await page.getByRole('alert').waitFor();
 assert.match(await page.getByRole('alert').textContent(),/No local project coverage catalog/);assert.equal(auditRequests,0);
 await page.getByRole('button',{name:'Robin',exact:true}).click();await page.getByLabel('Collection',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Reference studies',exact:true}).click();await page.getByRole('searchbox',{name:'Search reference studies'}).waitFor();
 assert.equal(await page.getByLabel('Collection',{exact:true}).locator('option').count(),85);
 await page.goBack();await page.getByRole('searchbox',{name:'Search your work'}).waitFor();
 assert.deepEqual(await page.getByLabel('Collection',{exact:true}).locator('option').evaluateAll(nodes=>nodes.map(n=>n.value)),expected);
 for(const id of ['deferred-example'])assert.equal((await page.request.get(`${base}/registry/apps/${id}/collection.json`)).status(),404,id+' removed from active static source');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await writeFile(resolve(out,'scope-browser-results.json'),JSON.stringify({status:'passed',activeCollections:expected,runs,hiddenDirectory:true,unregisteredExampleAbsent:true,auditRequests,errors,external},null,2)+'\n');
 console.log('PASS: same five apps, four widths, hidden directory, unregistered catalog unavailable, references and history unchanged.');
}finally{await browser?.close();server.kill();}
