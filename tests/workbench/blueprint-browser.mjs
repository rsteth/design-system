/** Portable output smoke test: no parent files or app servers are available to the browser. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,realpath,readFile,writeFile,mkdir,rm,stat} from 'node:fs/promises';
import {join,resolve,relative,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {installBlueprint} from '../../tooling/blueprint.mjs';
const root=await realpath(await mkdtemp(join(tmpdir(),'portable-workbench-browser-')));
const output=fileURLToPath(new URL('../../review/blueprint-qa/',import.meta.url));
let server,browser;
try{
 const installed=await installBlueprint(root),webRoot=installed.destination;
 const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
 server=createServer(async(req,res)=>{try{
  let path=resolve(webRoot,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(relative(webRoot,path).startsWith('..'))throw new Error('Outside blueprint');
  if((await stat(path)).isDirectory())path=join(path,'index.html');
  res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream'}).end(await readFile(path));
 }catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],external=[],failed=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)failed.push(response.url());});
 await page.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
 await page.goto(origin+'/');await page.getByRole('heading',{name:'Make room for your system'}).waitFor();
 assert.equal(await page.locator('.wb-mark,.wb-empty-symbol,.wb-brand small').count(),0);assert.equal(await page.locator('.wb-empty').count(),1);assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.getByRole('alert').count(),0);
 assert.equal(await page.locator('.wb-shell').evaluate(node=>node.getBoundingClientRect().height>=innerHeight),true);
 for(const section of ['Components','Patterns','Screens','Checks','Sources','Foundations']){
  await page.getByRole('button',{name:section,exact:true}).click();
  await page.getByRole('heading',{name:section,exact:true}).waitFor();
  assert.equal(await page.locator('nav [aria-current="page"]').count(),1);
 }
 await page.reload();await page.getByRole('heading',{name:'Make room for your system'}).waitFor();
 await mkdir(output,{recursive:true});await page.screenshot({path:join(output,'desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.reload();await page.getByRole('heading',{name:'Make room for your system'}).waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await page.locator('.wb-shell').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:join(output,'mobile.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(failed,[]);
 const report={passed:true,scope:'Installed blueprint served alone from a temporary target. Empty state, all six sections, reload, desktop/mobile bounds, no frames, missing resources, external requests or runtime errors.',viewports:[{width:1440,height:1000},{width:390,height:844}],sourceStatus:installed.status};
 await writeFile(join(output,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
