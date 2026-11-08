import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(process.env.MATERIAL_TEST_ROOT||'.'), output=resolve('review/lacouture-qa');
const manifest=JSON.parse(await readFile(join(root,'collections/material/lacouture-1890/manifest.json'),'utf8'));
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(relative(root,file).startsWith('..'))throw Error('Outside root');if((await stat(file)).isDirectory())file=join(file,'index.html');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(file));}catch{res.writeHead(404).end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,url=origin+'/apps/studio/?library=material';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
const errors=[],external=[],results=[];await mkdir(output,{recursive:true});
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.getByLabel('Panel',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Previous panel',exact:true}).isDisabled(),true);
  for(const [index,item] of manifest.items.entries()){
   await page.getByLabel('Panel',{exact:true}).selectOption(String(index));
   await page.getByRole('button',{name:'Original',exact:true}).click();
   await page.locator('.material-sheet img').evaluate(async img=>{if(!img.complete)await new Promise((y,n)=>{img.onload=y;img.onerror=n;});if(!img.naturalWidth)throw Error('Broken scan');});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`page overflow ${width} ${item.id}`);
   assert.equal(new URL(page.url()).searchParams.get('panel'),item.id);
   if(item.svg){
    await page.getByRole('button',{name:'Web translation',exact:true}).click();await page.locator('.material-sheet svg').waitFor();
    assert.equal(await page.locator('.material-sheet .swatch').count(),item.swatchCount);
    assert.equal(await page.locator('.material-sheet .swatch[tabindex="0"]').count(),1);
    const first=page.locator('.material-sheet .swatch').first();await first.focus();await page.keyboard.press('Enter');
    assert.match(await page.locator('.material-inspector-value').innerText(),/#[0-9A-F]{6}/);
    assert.equal(await page.getByRole('button',{name:'Copy HEX',exact:true}).isDisabled(),false);
    await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.material-sheet .swatch').nth(1).evaluate(n=>n===document.activeElement),true);
    await page.getByLabel('Zoom',{exact:true}).selectOption('2');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.ok(await page.locator('.material-stage').evaluate(n=>n.scrollHeight>n.clientHeight));
    await page.getByLabel('Zoom',{exact:true}).selectOption('1');
    const svgHref=await page.getByRole('link',{name:'Download SVG',exact:true}).getAttribute('href');assert.ok(svgHref.endsWith(item.svg));
    if(['plate-i','plate-ii','plate-xiv','plate-xxiii'].includes(item.id)){
     await page.getByRole('button',{name:'Compare',exact:true}).click();await page.locator('.material-sheet svg').waitFor();await page.locator('.material-sheet img').waitFor();
     assert.equal(await page.locator('.material-sheet').count(),2);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
     await page.locator('.material-controls').scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`${item.id}-compare-${width}.png`),fullPage:true});
    }
   }else{
    assert.equal(await page.getByRole('button',{name:'Web translation',exact:true}).isDisabled(),true);
    assert.equal(await page.getByRole('link',{name:'Download SVG',exact:true}).count(),0);
   }
   results.push({width,panel:item.id,original:'passed',translation:item.svg?'passed':'not applicable'});
  }
  assert.equal(await page.getByRole('button',{name:'Next panel',exact:true}).isDisabled(),true);
  // Repeated toggles and Back/Forward preserve the selected panel and mode.
  await page.goto(url+'&panel=plate-ii&view=translation');await page.locator('.material-sheet svg').waitFor();
  await page.getByRole('button',{name:'Original',exact:true}).click();await page.goBack();await page.locator('.material-sheet svg').waitFor();assert.equal(await page.getByLabel('Panel',{exact:true}).inputValue(),'2');
  await page.goForward();await page.locator('.material-sheet img').waitFor();
  await page.getByRole('button',{name:'Web translation',exact:true}).click();await page.locator('.material-sheet svg').waitFor();
  await page.getByLabel('Panel',{exact:true}).selectOption('29');assert.equal(await page.getByRole('button',{name:'Original',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByLabel('Panel',{exact:true}).selectOption('2');await page.locator('.material-sheet svg').waitFor();
  await page.locator('.material-sheet .swatch').first().dispatchEvent('click');
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Unavailable');}}}));
  await page.getByRole('button',{name:'Copy HEX',exact:true}).click();assert.match(await page.locator('.material-copy-status').innerText(),/Copy unavailable/);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedHEX=text;}}}));
  await page.getByRole('button',{name:'Copy HEX',exact:true}).click();assert.match(await page.locator('.material-copy-status').innerText(),/Copied/);
  await page.getByRole('button',{name:'Reference studies',exact:true}).click();await page.getByLabel('Collection',{exact:true}).waitFor();assert.equal(await page.locator('.material-shell').count(),0);await page.goBack();await page.locator('.material-sheet svg').waitFor();
  await page.setViewportSize({width:360,height:740});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await context.close();
 }
 // A failed SVG load can be retried; late responses cannot overwrite a newer selection.
 const context=await browser.newContext({viewport:{width:1000,height:800}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));let fail=true;
 await page.route('**/translation/plates/plate-i.svg',route=>fail?route.fulfill({status:503,body:'unavailable'}):route.continue());
 await page.goto(url+'&view=translation');await page.getByRole('alert').filter({hasText:'could not load'}).waitFor();fail=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await page.locator('.material-sheet svg').waitFor();
 await page.route('**/translation/plates/plate-iii.svg',async route=>{await new Promise(r=>setTimeout(r,500));await route.continue();});
 await page.getByLabel('Panel',{exact:true}).selectOption('3');await page.getByLabel('Panel',{exact:true}).selectOption('4');await page.locator('.material-sheet svg').waitFor();await page.waitForTimeout(650);assert.match(await page.locator('.material-sheet svg title').first().textContent(),/IV/);
 const safety=await page.evaluate(async()=>{const {parseMaterialSVG}=await import('./material.mjs');const n=parseMaterialSVG('<svg xmlns="http://www.w3.org/2000/svg"><style>body{display:none}</style><script>window.bad=true</script><foreignObject><div>no</div></foreignObject><image href="https://example.test/image"/><path onload="bad()" fill="url(https://example.test/x)"/><text style="color:red">safe</text></svg>','test');return {active:n.querySelectorAll('script,style,foreignObject,image').length,event:n.querySelector('[onload]')!==null,url:n.querySelector('[fill]')!==null};});assert.deepEqual(safety,{active:0,event:false,url:false});
 // A malformed HTTP-200 SVG is also evicted before Retry.
 await page.route('**/translation/plates/plate-x.svg',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg><broken'}));
 await page.getByLabel('Panel',{exact:true}).selectOption('10');await page.getByRole('alert').filter({hasText:'could not be read'}).waitFor();
 await page.unroute('**/translation/plates/plate-x.svg');await page.getByRole('button',{name:'Retry',exact:true}).click();await page.locator('.material-sheet svg').waitFor();
 const fonts=await page.locator('.material-sheet svg text:not([font-family^="Arial"])').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).fontFamily));assert.ok(fonts.length>0);assert.ok(fonts.every(font=>font.includes('Times')));
 await context.close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={status:'passed',cases:results.length,translationViews:58,originalViews:78,errors,external,flows:['Original/Web translation/Compare','all 39 panels at desktop/mobile','1,695 swatches and roving keyboard selection','zoom with contained scrolling','supplement fallback and mode restoration','download links','Back/Forward and workspace cleanup','copy success and denied fallback','SVG retry and stale-response protection','inert scoped SVG sanitization'],results};await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
