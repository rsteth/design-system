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
const reads=JSON.parse(await readFile(join(root,'previews/reads/fixture-catalog.json'),'utf8'));
const bandit=JSON.parse(await readFile(join(root,'previews/bandit/fixture-catalog.json'),'utf8'));
assert.equal(reads.length,43,'Reads release includes every source-owned fixture');
assert.equal(bandit.length,57,'Bandit release includes every source-owned fixture');
const banditLegacy=new Set(['landing','overview','empty','controls','status']);
const allFixtures=[...reads.map(({id})=>({app:'reads',id,path:`previews/reads/fixture/?fixture=${id}${id==='account-denied'?'&auth=failed':''}`,theme:'dark'})),...bandit.flatMap(({id})=>['light','dark'].map(theme=>({app:'bandit',id,path:`previews/bandit/${id}/?workbenchTheme=${theme}`,theme})))];
const selected=process.env.PUBLIC_PREVIEW_FIXTURES?.split(',');
if(selected)for(const id of selected)assert.ok(allFixtures.some(f=>`${f.app}/${f.id}`===id),'Unknown selected fixture: '+id);
const fixtures=selected?allFixtures.filter(f=>selected.includes(`${f.app}/${f.id}`)):allFixtures;
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname===base+'harness.html'){
   const match=fixtures.find(f=>f.app===url.searchParams.get('app')&&f.id===url.searchParams.get('fixture')&&f.theme===url.searchParams.get('theme'));if(!match)throw Error('Unknown fixture');
   res.writeHead(200,{'Content-Type':'text/html'}).end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%}iframe{width:100%;height:100%;border:0}</style><iframe sandbox="allow-scripts" src="${base+match.path}" title="Synthetic preview"></iframe><script>window.addEventListener('message',event=>{if(event.source!==document.querySelector('iframe').contentWindow)return;if(event.data?.type==='workbench:theme-ready')event.source.postMessage({type:'workbench:set-theme',theme:'${match.theme}',requestId:'preview-qa'},'*');if(event.data?.type==='workbench:theme-applied'&&event.data.requestId==='preview-qa')document.documentElement.dataset.confirmed=event.data.theme;});</script></html>`);return;
  }
  if(!url.pathname.startsWith(base))throw Error('Wrong prefix');let file=resolve(root,decodeURIComponent(url.pathname.slice(base.length)));const rel=relative(root,file);if(rel.startsWith('..')||isAbsolute(rel))throw Error('Invalid path');if((await stat(file)).isDirectory())file=join(file,'index.html');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'text/plain','Access-Control-Allow-Origin':'*','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(bytes);
 }catch{res.writeHead(404).end('Not found');}
});
await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
const origin=`http://127.0.0.1:${server.address().port}`,errors=[],external=[],operations=[],failures=[],results=[],banditPresentation=[];
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
    await page.goto(origin+base+(framed?`harness.html?app=${fixture.app}&fixture=${fixture.id}&theme=${fixture.theme}`:fixture.path),{waitUntil:'domcontentloaded'});
    const target=framed?page.frameLocator('iframe'):page;
    if(fixture.app==='reads')await expect(target.locator('html')).toHaveAttribute('data-fixture-ready',fixture.id);
    else {await expect(target.locator('html')).toHaveAttribute('data-preview-ready','true');if(!banditLegacy.has(fixture.id))await expect(target.locator('html')).toHaveAttribute('data-fixture-ready',fixture.id);}
    if(framed){await expect(page.locator('html')).toHaveAttribute('data-confirmed',fixture.theme);assert.equal(await page.locator('iframe').getAttribute('sandbox'),'allow-scripts');}
    if(fixture.app==='bandit'){
     await expect(target.locator('html')).toHaveAttribute('data-theme',fixture.theme);
     await expect(target.locator('body')).toHaveCSS('background-color',fixture.theme==='dark'?'rgb(15, 18, 24)':'rgb(237, 236, 229)');
     await expect(target.getByLabel('Grain intensity')).toHaveCount(0);
     assert.equal(await target.locator('body').evaluate(()=>[...document.querySelectorAll('*')].some(el=>/glacier|grain\.(png|webp)|river-art/i.test([el.getAttribute('src'),getComputedStyle(el).backgroundImage].join(' ')))),false,'Retired artwork must not return');
    }
    await target.locator('body').evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.fonts].map(font=>document.fonts.load('16px '+JSON.stringify(font.family))));await Promise.all([...document.images].map(image=>{image.loading='eager';return image.complete?Promise.resolve():new Promise(r=>{image.onload=r;image.onerror=r;});}));});
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
      if(fixture.id==='studio-progress'){await target.getByRole('button',{name:'Cancel',exact:true}).click();await expect(target.locator('.badge')).toHaveText('Cancelled');}
      await target.getByRole('button',{name:'Retry this read'}).click();await expect(target.locator('.badge')).toHaveText('Ready to listen');
     }
     if(fixture.id==='studio-ready'){const audio=target.locator('.job audio');await audio.evaluate(a=>a.load());await expect.poll(()=>audio.evaluate(a=>a.readyState)).toBeGreaterThanOrEqual(1);}
     if(['studio-draining','studio-disconnected'].includes(fixture.id))await expect(target.locator('#generate')).toBeDisabled();
     if(fixture.id==='hosted-consent'){await expect(target.locator('#provider-consent')).toBeVisible();await target.locator('#generate').click();await expect(target.locator('.job')).toHaveCount(0);await target.locator('#provider-consent').check();await target.locator('#generate').click();await expect(target.locator('.job .badge')).toHaveText('Ready to listen');}
     if(fixture.id==='hosted-review')await expect(target.getByRole('button',{name:'Retry this read'})).toHaveCount(0);
     await expect(target.locator('#sample')).toBeDisabled();
     if(fixture.id==='reader-controls') {await target.locator('#speed').focus();await page.keyboard.press('ArrowRight');await expect(target.locator('#speed-value')).toHaveText('1.1x');}
     if(fixture.id==='reader-preflight-pending')await expect(target.locator('#preflight')).toHaveText('Checking these words...');
     if(fixture.id==='reader-preflight-error')await expect(target.locator('#preflight')).toContainText('Synthetic estimate unavailable');
     if(fixture.id==='hosted-allowance'){await expect(target.locator('#preflight')).toContainText('Room for about 5,000 more characters');await target.locator('#provider-consent').check();await target.locator('#text').fill('Changed words');await expect(target.locator('#provider-consent')).not.toBeChecked();}
     if(fixture.id==='studio-mixed')await expect(target.locator('.job')).toHaveCount(5);
     if(fixture.id==='job-blocked')await expect(target.getByRole('button',{name:'Retry this read'})).toHaveCount(0);
     if(fixture.id==='hosted-pending'){await target.getByRole('button',{name:'Check if the voice is ready'}).click();await expect(target.locator('#voice-shelf')).toContainText('The voice is ready');}
     if(fixture.id==='hosted-create'){
      // Force a production renderVoices refresh while leaving the earlier reader
      // and recording forms adapted. This must also adapt the replacement form.
      await target.locator('body').evaluate(()=>{
       globalThis.__readsOldHostedForm=document.querySelector('#voice-shelf form');
       const previous=globalThis.__readsFixtureFetch;
       globalThis.__readsFixtureFetch=async (...args)=>{
        const response=await previous(...args);
        if(args[0]==='/fixture-data/state'){
         const state=await response.json();state.voices=state.voices.map(voice=>({...voice,fixtureRerender:'repeat'}));
         return new Response(JSON.stringify(state),{headers:{'Content-Type':'application/json'}});
        }
        return response;
       };
      });
      await expect(target.locator('#voice-shelf form')).toHaveAttribute('data-preview-adapted','true');
      // Wait for a real poll to replace the form, then ensure its submit is safe
      // in the opaque frame and still invokes the actual production handler.
      await expect.poll(()=>target.locator('#voice-shelf form').evaluate(form=>{
       return form!==globalThis.__readsOldHostedForm;
      })).toBe(true);
      await expect(target.locator('#voice-shelf form button')).toHaveAttribute('type','button');
      await target.getByText('Make a voice from this recording',{exact:true}).click();const form=target.locator('#voice-shelf form');for(const box of await form.locator('input[type=checkbox]').all())await box.check();await form.getByRole('button',{name:'Make their voice'}).click();await expect(target.locator('#voice-shelf')).toContainText('The voice is being checked');
     }
     if(fixture.id.startsWith('recording-')){
      await target.locator('#name').fill('Synthetic recording');await target.locator('#permission').check();await target.locator('#single').check();await target.locator('#save-voice').click();
      await expect(target.locator('#voice-status')).toContainText(fixture.id==='recording-form'?'Recording saved':fixture.id==='recording-error'?'Synthetic validation':'Checking the recording');
     }
     if(fixture.id.startsWith('waitlist-')){
      if(['waitlist-saving','waitlist-error'].includes(fixture.id)){await target.locator('#waitlist-email').fill('preview@example.test');await target.locator('#waitlist-consent').check();await target.locator('#waitlist-submit').click();await expect(target.locator('#waitlist-result')).toContainText(fixture.id==='waitlist-saving'?'Saving your request':'Synthetic interruption');}
      await page.keyboard.press('Escape');await expect(target.locator('#waitlist-dialog')).not.toBeVisible();await target.locator('#waitlist').press('Enter');await expect(target.locator('#waitlist-dialog')).toBeVisible();
      if(fixture.id==='waitlist-saving'){await expect(target.locator('#waitlist-result')).toContainText('previous request is still finishing');await expect(target.locator('#waitlist-submit')).toBeDisabled();}
     }

    }else{
     if(fixture.id==='landing'){
      let palette;
      const colors=fixture.theme==='dark'?{cta:'rgb(124, 151, 255)',hover:'rgb(157, 177, 255)',scrim:'rgba(0, 0, 0, 0.7)',shadow:'rgba(0, 0, 0, 0.4) 0px 20px 70px 0px',border:'rgb(207, 213, 227)'}:{cta:'rgb(33, 72, 230)',hover:'rgb(24, 54, 184)',scrim:'rgba(20, 22, 27, 0.6)',shadow:'rgba(20, 22, 27, 0.267) 0px 20px 70px 0px',border:'rgb(20, 22, 27)'};
      for(const close of ['Close','Escape','Close']){
       await target.getByRole('button',{name:'Join waiting list',exact:true}).first().click();await expect(target.getByRole('heading',{name:"Join the waiting list"})).toBeVisible();
       const dialog=target.locator('dialog'),google=dialog.getByRole('link',{name:'Log in with Google',exact:true});
       await page.mouse.move(0,0);await expect(google).toHaveCSS('background-color',colors.cta);
       palette=await dialog.evaluate(el=>({scrim:getComputedStyle(el,'::backdrop').backgroundColor,shadow:getComputedStyle(el).boxShadow,border:getComputedStyle(el).borderColor}));
       assert.equal(palette.scrim,colors.scrim);assert.equal(palette.shadow,colors.shadow);assert.equal(palette.border,colors.border);
       await google.hover();await expect(google).toHaveCSS('background-color',colors.hover);
       assert.equal(await google.getAttribute('href'),'#preview-navigation');await google.click();await expect(target.getByRole('status')).toContainText('navigation are disabled');await expect(dialog).toBeVisible();await expect(dialog.locator('input')).toHaveCount(0);
       if(close==='Escape')await page.keyboard.press('Escape');else await dialog.getByRole('button',{name:'Close',exact:true}).click();await expect(dialog).not.toBeVisible();await target.getByRole('button',{name:'Dismiss',exact:true}).click();
      }
      banditPresentation.push({width:viewport.width,sandbox:framed,theme:fixture.theme,cta:colors.cta,hover:colors.hover,...palette});
      await target.getByRole('button',{name:'Join waiting list',exact:true}).first().click();if(!framed)await page.screenshot({path:join(evidence,`bandit-dialog-${viewport.width}-${fixture.theme}.png`)});await page.keyboard.press('Escape');
      await target.locator('footer').scrollIntoViewIfNeeded();if(!framed)await page.screenshot({path:join(evidence,`bandit-footer-${viewport.width}-${fixture.theme}.png`)});await target.locator('header').scrollIntoViewIfNeeded();
      await target.getByRole('link',{name:'Log in',exact:true}).first().click();await expect(target.getByRole('status')).toContainText('navigation are disabled');await target.getByRole('button',{name:'Dismiss',exact:true}).click();
     }
     if(fixture.id==='overview'){await expect(target.locator('.production-card')).toHaveCount(2);await target.getByRole('link',{name:/New production/}).click();await expect(target.getByRole('status')).toBeVisible();await target.getByRole('button',{name:'Dismiss'}).click();}
     if(fixture.id==='empty')await expect(target.getByRole('link',{name:/New production/})).toHaveCount(0);
     if(fixture.id==='controls'){assert.ok((await target.getByRole('button',{name:'Primary action'}).boundingBox()).height>=44);await target.getByLabel('Production name').fill('A local synthetic edit');}
     if(fixture.id==='project-editor'){
      await target.getByLabel('Project title',{exact:true}).fill('Local draft');await target.getByRole('button',{name:'Close',exact:true}).press('Enter');
      for(let i=0;i<2;i++){await target.getByRole('button',{name:'Edit project',exact:true}).click();await expect(target.getByLabel('Project title',{exact:true})).toHaveValue('Quiet mornings');await target.getByRole('button',{name:'Close',exact:true}).click();}
      await target.getByRole('button',{name:'New project',exact:true}).click();await target.getByLabel('Project title',{exact:true}).fill('Local only');await target.getByLabel('Slug',{exact:true}).fill('local-only');await target.getByRole('button',{name:'Save project',exact:true}).click();await expect(target.getByRole('alert')).toContainText('Nothing was saved or sent');
     }
     if(fixture.id==='profile-import'){await target.getByLabel('Profile JSON',{exact:true}).fill('{');await target.getByRole('button',{name:'Import as draft',exact:true}).click();await expect(target.locator('.error[role=alert]')).toBeVisible();}
     if(fixture.id==='production-new-plan'){
      await expect(target.getByLabel('Production title')).toHaveValue('The morning cup');
      await target.getByRole('button',{name:'Start with your clips',exact:true}).click();
      await expect(target.getByRole('alert')).toContainText('Nothing was saved or sent');
      await expect(target.getByLabel('Production title')).toHaveValue('The morning cup');
     }
     if(fixture.id==='settings-connections'){
      await expect(target.getByRole('heading',{name:'Personal AI Connections',exact:true})).toBeVisible();
      await expect(target.locator('.connection-status dd')).toHaveText(['Off','Not connected','Off']);
      await expect(target.getByText('This preview shows example availability only.',{exact:false})).toBeVisible();
      await expect(target.locator('input, button:has-text("Refresh connection status")')).toHaveCount(0);
     }
     if(fixture.id==='shot-editor'){await target.getByRole('button',{name:'Close shot editor',exact:true}).click();await target.getByRole('button',{name:'Edit shot',exact:true}).first().click();await expect(target.getByLabel('Shot editor',{exact:true})).toBeVisible();}
     if(fixture.id==='review-populated'){
      await target.locator('h1').click();await page.keyboard.press('k');await expect(target.locator('.shot-navigation button[aria-current="step"]')).toContainText('A quiet detail');await page.keyboard.press('j');await expect(target.locator('.shot-navigation button[aria-current="step"]')).toContainText('Morning light');
     }
     if(fixture.id==='memory-populated'){await target.getByRole('button',{name:'Skip for this shot',exact:true}).click();await target.getByRole('button',{name:'Show skipped preferences',exact:true}).click();await expect(target.getByRole('button',{name:'Skip for this shot',exact:true})).toBeVisible();}
     if(fixture.id==='asset-expired')for(let i=0;i<2;i++){await target.getByRole('button',{name:'Refresh preview',exact:true}).click();await expect(target.getByRole('button',{name:'Refresh preview',exact:true})).toBeVisible();}
     if(fixture.id.startsWith('deliver-')){
      await expect(target.locator('[data-stage="deliver"]')).toBeVisible();
      await expect(target.getByRole('heading',{name:'Cuts',exact:true})).toBeVisible();
      const assemble=target.getByRole('button',{name:'Assemble selected takes',exact:true});
      if(fixture.id==='deliver-empty'){
       await expect(target.getByRole('heading',{name:'No cuts yet',exact:true})).toBeVisible();
       await expect(assemble).toBeDisabled();
      }else{
       await expect(target.locator('.export-card')).toHaveCount(3);
       const lanes=target.getByRole('region',{name:'Audio lanes'});
       const tray=lanes.getByRole('region',{name:'Available audio',exact:true});
       await tray.getByRole('button',{name:'Add synthetic-tone.wav',exact:true}).click();
       const inspector=lanes.getByRole('group',{name:'synthetic-tone.wav',exact:true});
       await inspector.getByRole('slider',{name:'Source trim end',exact:true}).press('ArrowLeft');
       await expect(inspector.getByText('1.99s kept',{exact:true})).toBeVisible();
       const source=inspector.getByLabel('Source in (seconds)',{exact:true});
       await source.fill('0.25');await source.press('Enter');
       await expect(inspector.getByText('1.74s kept',{exact:true})).toBeVisible();
       await inspector.getByRole('button',{name:'Play trimmed audio',exact:true}).click();
       const audio=lanes.locator('audio');
       await expect.poll(()=>audio.evaluate(a=>a.readyState>=1&&a.currentTime>=0.25)).toBe(true);
       assert.equal(new URL(await audio.evaluate(a=>a.currentSrc)).pathname,base+'previews/bandit/assets/synthetic-tone.wav');
       await inspector.getByRole('button',{name:'Remove audio clip',exact:true}).click();
       await expect(inspector).toHaveCount(0);
       await target.getByText('Shot trims',{exact:true}).click();
       const durations=target.getByLabel('Use duration (seconds)',{exact:true});
       await expect(durations.first()).toHaveValue('5');
       await expect(assemble).toBeDisabled();
       await durations.nth(0).fill('4');
       await durations.nth(1).fill('6');
       await assemble.click();
       await expect(target.getByRole('alert').filter({hasText:'Nothing was saved or sent'})).toHaveCount(1);
       await tray.getByRole('button',{name:'Add synthetic-tone.wav',exact:true}).click();
       await expect(inspector).toBeVisible();
      }
     }
     if(fixture.id==='projects-viewer')await expect(target.getByRole('button',{name:'Edit project',exact:true})).toHaveCount(0);
     await expect(target.locator('[data-setup-error]')).toHaveCount(0);

    }
    if(!framed&&['landing','studio-ready','overview'].includes(fixture.id)){await target.locator('body').evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.mouse.move(0,0);await page.screenshot({path:join(evidence,`${fixture.app}-${fixture.id}-${viewport.width}-${fixture.theme}.png`),fullPage:true});}
    await page.reload({waitUntil:'domcontentloaded'});
    if(fixture.app==='reads'){await expect(target.locator('html')).toHaveAttribute('data-fixture-ready',fixture.id);if(fixture.id==='studio-empty')await expect(target.locator('.job')).toHaveCount(0);if(fixture.id==='studio-progress')await expect(target.locator('.badge')).toHaveText('In progress');if(fixture.id==='reader-controls')await expect(target.locator('#speed-value')).toHaveText('1.0x');if(fixture.id.startsWith('recording-'))await expect(target.locator('#voice-status')).toHaveText('');if(fixture.id==='hosted-pending')await expect(target.locator('#voice-shelf')).toContainText('The voice is being checked');}
    else{await expect(target.locator('html')).toHaveAttribute('data-preview-ready','true');if(!banditLegacy.has(fixture.id))await expect(target.locator('html')).toHaveAttribute('data-fixture-ready',fixture.id);if(fixture.id==='profile-import')await expect(target.getByLabel('Profile JSON',{exact:true})).toHaveValue('');if(fixture.id==='controls')await expect(target.getByLabel('Production name')).toHaveValue('A quiet morning');if(fixture.id==='deliver-populated'){await expect(target.getByRole('group',{name:'synthetic-tone.wav',exact:true})).toHaveCount(0);await target.getByText('Shot trims',{exact:true}).click();await expect(target.getByLabel('Use duration (seconds)',{exact:true}).first()).toHaveValue('5');}}
    console.log('Passed',fixture.app,fixture.id,viewport.width,framed?'opaque':'standalone');
    results.push({app:fixture.app,fixture:fixture.id,width:viewport.width,theme:fixture.theme,sandbox:framed,passed:true});
   }
  }
  await context.close();
 }
 assert.deepEqual(external,[]);assert.deepEqual(operations,[]);assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
 const report={status:'passed',scope:selected||'all'+fixtures.length,cases:results.length,results,banditPresentation,browser:browser.version(),runtimeErrors:errors,externalRequests:external,backendRequests:operations,failedResponses:failures,limits:['Synthetic-only interaction; production acceptance and live providers not tested.','Screenshots must be visually inspected separately.']};
 await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{if(errors.length||external.length||operations.length||failures.length)console.error(JSON.stringify({errors,external,operations,failures}));await browser?.close();await new Promise(r=>server.close(r));}
