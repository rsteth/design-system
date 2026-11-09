/** Exact Material copy, attribution and accessible alignment at phone/desktop widths. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(process.env.MATERIAL_TEST_ROOT||'.'),output=resolve(process.env.MATERIAL_TEST_OUTPUT||'review/material-copy-qa');
const manifest=JSON.parse(await readFile(join(root,'collections/material/lacouture-1890/manifest.json'),'utf8'));
const rights='archive records source as not in copyright, no copyright is asserted';
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{try{
 let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(relative(root,file).startsWith('..'))throw Error('Outside root');
 if((await stat(file)).isDirectory())file=join(file,'index.html');
 res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(file));
}catch{res.writeHead(404).end('Not found');}});
// An explicit URL supports the same read-only checks against an approved live viewer.
if(!process.env.MATERIAL_TEST_URL)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=new URL(process.env.MATERIAL_TEST_URL||`http://127.0.0.1:${server.address().port}/apps/studio/?library=material`);
base.searchParams.set('library','material');base.searchParams.delete('panel');base.searchParams.delete('view');
const origin=base.origin,url=base.href;
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
const errors=[],external=[],results=[];
await mkdir(output,{recursive:true});
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},hasTouch:width<500,isMobile:width<500,reducedMotion:'reduce'});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const view of ['index','original','translation','compare']){
   await page.goto(url+(view==='index'?'':`&panel=plate-ii&view=${view}`));
   const credit=page.locator('.material-credit');await credit.waitFor();
   assert.deepEqual(await credit.locator('p').allTextContents(),[manifest.credit,rights]);
   assert.deepEqual(await credit.locator('a').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,href:n.href}))),[
    {text:'Getty / Internet Archive source ↗',href:manifest.sourceURL},
    {text:'Source page images · JP2 archive ↗',href:'https://archive.org/download/gri_33125012875395/gri_33125012875395_jp2.zip'}
   ]);
   assert.equal(await page.locator('.material-alignment-note').count(),0);
   assert.doesNotMatch(await page.locator('.material-shell').textContent(),/Approximate alignment\. Original SVG unchanged\./);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} ${view} page overflow`);
   assert.equal(await credit.evaluate(n=>n.scrollWidth<=n.clientWidth),true,`${width} ${view} footer overflow`);
   const toggle=page.getByRole('checkbox',{name:'Align chart to scan',exact:true});
   if(['translation','compare'].includes(view)){
    await page.locator('.material-chart').waitFor();
    assert.equal(await toggle.count(),1);assert.equal(await toggle.isChecked(),true);
    const chart=page.locator('.material-chart'),transform=await chart.getAttribute('transform');assert.ok(transform);
    await toggle.focus();await page.keyboard.press('Space');
    assert.equal(await toggle.isChecked(),false);assert.equal(await chart.getAttribute('transform'),null);
    const label=page.locator('label[for=material-align-chart]');
    if(width<500)await label.tap();else await label.click();
    assert.equal(await toggle.isChecked(),true);assert.equal(await chart.getAttribute('transform'),transform);
    const layout=await label.evaluate(n=>{
     const input=n.querySelector('input').getBoundingClientRect(),range=document.createRange();range.selectNode(n.lastChild);
     const text=range.getBoundingClientRect(),label=n.getBoundingClientRect();
     return {gap:text.left-input.right,textRight:text.right,labelRight:label.right,height:label.height};
    });
    assert.ok(layout.gap>=7&&layout.textRight<=layout.labelRight+.1&&layout.height>=44,`${width} separated usable checkbox label`);
    await page.getByText('Viewer controls and fidelity',{exact:true}).click();
    assert.match(await page.locator('.material-help').innerText(),/approximate, measured correction/);
    assert.match(await page.locator('.material-help').innerText(),/SVG downloads always retain the unchanged source reconstruction\./);
    await page.getByText('Viewer controls and fidelity',{exact:true}).click();
    if(view==='translation')await page.locator('.material-alignment-control').screenshot({path:join(output,`alignment-${width}.png`)});
    if(view==='compare'){
     await page.locator('.material-sheet img').evaluate(n=>n.decode());
     await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:join(output,`compare-${width}.png`),fullPage:true});
    }
   }else assert.equal(await toggle.count(),0);
   if(view==='index')await credit.screenshot({path:join(output,`index-footer-${width}.png`)});
   results.push({width,view,copy:'exact',sourceCreditAndLinks:'unchanged',overflow:false,alignment:['translation','compare'].includes(view)?'accessible keyboard and pointer/touch toggle passed':'not applicable'});
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={status:'passed',executedAt:new Date().toISOString(),browser:browser.version(),rights,results,errors,external};
 await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();if(server.listening)await new Promise(r=>server.close(r));}
