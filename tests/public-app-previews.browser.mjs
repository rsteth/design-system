// Local static previews only. Never starts either source application's server.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(process.env.PUBLIC_PREVIEW_ROOT||'review/apps-preview-20261108a');
const evidence=resolve(process.env.PUBLIC_PREVIEW_EVIDENCE||'review/app-previews-qa');
const base=process.env.PUBLIC_PREVIEW_BASE||'/design-system/';
const module=process.env.PLAYWRIGHT_MODULE;
if(!module)throw Error('Set PLAYWRIGHT_MODULE to an existing installed Playwright module.');
const {chromium,expect}=await import(pathToFileURL(module));
const reads=['landing','waitlist','studio-empty','studio-ready','studio-progress','studio-failed','studio-draining','studio-disconnected','voice-sample','hosted-consent','hosted-review'];
const bandit=['landing','overview','empty','controls','status'];
const fixtures=[...reads.map(id=>({app:'reads',id,path:`previews/reads/fixture/?fixture=${id}`,theme:'dark'})),...bandit.map(id=>({app:'bandit',id,path:`previews/bandit/${id}/`,theme:'light'}))];
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname===base+'harness.html'){
   const match=fixtures.find(f=>f.app===url.searchParams.get('app')&&f.id===url.searchParams.get('fixture'));if(!match)throw Error('Unknown fixture');
   res.writeHead(200,{'Content-Type':'text/html'}).end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%}iframe{width:100%;height:100%;border:0}</style><iframe sandbox="allow-scripts" src="${base+match.path}" title="Synthetic preview"></iframe><script>window.addEventListener('message',event=>{if(event.source!==document.querySelector('iframe').contentWindow)return;if(event.data?.type==='workbench:theme-ready')event.source.postMessage({type:'workbench:set-theme',theme:'${match.theme}',requestId:'preview-qa'},'*');if(event.data?.type==='workbench:theme-applied'&&event.data.requestId==='preview-qa')document.documentElement.dataset.confirmed=event.data.theme;});</script></html>`);return;
  }
  if(!url.pathname.startsWith(base))throw Error('Wrong prefix');let file=resolve(root,decodeURIComponent(url.pathname.slice(base.length)));const rel=relative(root,file);if(rel.startsWith('..')||isAbsolute(rel))throw Error('Invalid path');if((await stat(file)).isDirectory())file=join(file,'index.html');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'text/plain','Access-Control-Allow-Origin':'*','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(bytes);
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
const origin=`http://127.0.0.1:${server.address().port}`,errors=[],external=[],operations=[],failures=[],results=[];
let browser;
await mkdir(evidence,{recursive:true});
try{
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{})});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',timezoneId:'UTC',locale:'en-US'});
  await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());if(url.origin!==origin){external.push(url.href);return route.abort();}if(/\/(api|auth|fixture-data)\//.test(url.pathname)||req.method()!=='GET'){operations.push({url:url.href,method:req.method()});return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
  for(const fixture of fixtures){
   for(const framed of [false,true]){
    await page.goto(origin+base+(framed?`harness.html?app=${fixture.app}&fixture=${fixture.id}`:fixture.path),{waitUntil:'domcontentloaded'});
    const target=framed?page.frameLocator('iframe'):page;
    if(fixture.app==='reads')await expect(target.locator('html')).toHaveAttribute('data-fixture-ready',fixture.id);
    else await expect(target.locator('html')).toHaveAttribute('data-preview-ready','true');
    if(framed){await expect(page.locator('html')).toHaveAttribute('data-confirmed',fixture.theme);assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');}
    await target.locator('body').evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.fonts].map(font=>document.fonts.load('16px '+JSON.stringify(font.family))));await Promise.all([...document.images].map(image=>image.complete?Promise.resolve():new Promise(r=>{image.onload=r;image.onerror=r;})));});
    assert.equal(await target.locator('html').evaluate(el=>el.scrollWidth<=innerWidth),true,`${fixture.app}/${fixture.id} ${viewport.width} ${framed?'sandbox':'standalone'} overflow`);
    assert.equal(await target.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true,'images');
    const fontStates=await target.locator('html').evaluate(()=>[...document.fonts].map(f=>({family:f.family,status:f.status})));assert.ok(fontStates.every(f=>f.status==='loaded'),`${fixture.app}/${fixture.id} ${viewport.width} sandbox=${framed}: ${JSON.stringify(fontStates)}`);
    if(fixture.app==='reads'){
     if(fixture.id==='waitlist'){
      await expect(target.locator('#waitlist-dialog')).toBeVisible();await target.locator('#waitlist-close').click();await expect(target.locator('#waitlist-dialog')).not.toBeVisible();await target.locator('#waitlist').click();await target.locator('#waitlist-email').fill('preview@example.test');await target.locator('#waitlist-consent').check();await target.locator('#waitlist-submit').click();await expect(target.locator('#waitlist-result')).toContainText('Nothing was saved');await page.keyboard.press('Escape');await expect(target.locator('#waitlist-dialog')).not.toBeVisible();await target.locator('#waitlist').click();await expect(target.locator('#waitlist-email')).toHaveValue('');await target.locator('#waitlist-close').click();
     }
     if(fixture.id==='studio-empty'){
      await target.locator('#example').click();await expect(target.locator('#generate')).toBeEnabled();await target.locator('#generate').click();await expect(target.locator('.job .badge')).toHaveText('Ready to listen');
     }
     if(['studio-progress','studio-failed'].includes(fixture.id)){
      if(fixture.id==='studio-progress'){await target.getByRole('button',{name:'Cancel',exact:true}).click();await expect(target.locator('.badge')).toHaveText('cancelled');}
      await target.getByRole('button',{name:'Retry this read'}).click();await expect(target.locator('.badge')).toHaveText('Ready to listen');
     }
     if(fixture.id==='studio-ready'){const audio=target.locator('.job audio');await audio.evaluate(a=>a.load());await expect.poll(()=>audio.evaluate(a=>a.readyState)).toBeGreaterThanOrEqual(1);}
     if(['studio-draining','studio-disconnected'].includes(fixture.id))await expect(target.locator('#generate')).toBeDisabled();
     if(fixture.id==='hosted-consent'){await expect(target.locator('#provider-consent')).toBeVisible();await target.locator('#generate').click();await expect(target.locator('.job')).toHaveCount(0);await target.locator('#provider-consent').check();await target.locator('#generate').click();await expect(target.locator('.job .badge')).toHaveText('Ready to listen');}
     if(fixture.id==='hosted-review')await expect(target.getByRole('button',{name:'Retry this read'})).toHaveCount(0);
     if(fixture.id==='voice-sample')await expect(target.locator('#sample')).toBeDisabled();
    }else{
     if(fixture.id==='landing'){
      for(const close of ['Close','Escape','Close']){await target.getByRole('button',{name:'Join waiting list',exact:true}).first().click();await expect(target.getByRole('heading',{name:"The waiting list isn't open yet."})).toBeVisible();if(close==='Escape')await page.keyboard.press('Escape');else await target.getByRole('button',{name:'Close',exact:true}).click();await expect(target.locator('dialog')).not.toBeVisible();}
      await target.getByRole('link',{name:'Sign in',exact:true}).first().click();await expect(target.getByRole('status')).toContainText('navigation are disabled');await target.getByRole('button',{name:'Dismiss',exact:true}).click();
     }
     if(fixture.id==='overview'){await expect(target.locator('.production-card')).toHaveCount(2);await target.getByLabel('Grain intensity').fill('0');await expect(target.locator('.texture-value')).toHaveText('Off');await target.getByRole('link',{name:/New production/}).click();await expect(target.getByRole('status')).toBeVisible();await target.getByRole('button',{name:'Dismiss'}).click();}
     if(fixture.id==='empty')await expect(target.getByRole('link',{name:/New production/})).toHaveCount(0);
     if(fixture.id==='controls'){assert.ok((await target.getByRole('button',{name:'Primary action'}).boundingBox()).height>=44);await target.getByLabel('Production name').fill('A local synthetic edit');}
    }
    if(!framed&&['landing','studio-ready','overview'].includes(fixture.id))await page.screenshot({path:join(evidence,`${fixture.app}-${fixture.id}-${viewport.width}.png`),fullPage:true});
    await page.reload({waitUntil:'domcontentloaded'});
    if(fixture.app==='reads'){await expect(target.locator('html')).toHaveAttribute('data-fixture-ready',fixture.id);if(fixture.id==='studio-empty')await expect(target.locator('.job')).toHaveCount(0);if(fixture.id==='studio-progress')await expect(target.locator('.badge')).toHaveText('running');}
    else{await expect(target.locator('html')).toHaveAttribute('data-preview-ready','true');if(fixture.id==='overview')await expect(target.getByLabel('Grain intensity')).toHaveValue('12');if(fixture.id==='controls')await expect(target.getByLabel('Production name')).toHaveValue('A quiet morning');}
    results.push({app:fixture.app,fixture:fixture.id,width:viewport.width,sandbox:framed,passed:true});
   }
  }
  await context.close();
 }
 assert.deepEqual(external,[]);assert.deepEqual(operations,[]);assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
 const report={status:'passed',cases:results.length,results,browser:browser.version(),runtimeErrors:errors,externalRequests:external,backendRequests:operations,failedResponses:failures,limits:['Synthetic-only interaction; production acceptance and live providers not tested.','Screenshots must be visually inspected separately.']};
 await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
