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

async function checkCompare(page,width,context){
 await page.goto(url+'&panel=plate-ii&view=compare');
 const sheet=page.locator('.material-compare'),x=page.getByRole('slider',{name:'Vertical divider, move left or right',exact:true}),y=page.getByRole('slider',{name:'Horizontal divider, move up or down',exact:true});
 await sheet.locator('svg').waitFor();await sheet.locator('img').evaluate(async img=>{await img.decode();});
 await sheet.scrollIntoViewIfNeeded();
 const values=async()=>[Number(await x.getAttribute('aria-valuenow')),Number(await y.getAttribute('aria-valuenow'))];
 assert.deepEqual(await values(),[50,50]);
 assert.match(await page.locator('#material-compare-help').innerText(),/Keyboard color inspection reveals the focused swatch/);
 assert.equal(await x.getAttribute('aria-orientation'),'horizontal');assert.equal(await y.getAttribute('aria-orientation'),'vertical');
 assert.match(await y.getAttribute('aria-valuetext'),/50% from top/);
 const geometry=await sheet.evaluate(n=>{
  const r=n.getBoundingClientRect(),source=n.querySelector('[data-mode=original]'),image=source.querySelector('img'),svg=n.querySelector('svg');
  return {clip:getComputedStyle(source).clipPath,source:[image.getBoundingClientRect().width,image.getBoundingClientRect().height],web:[svg.getBoundingClientRect().width,svg.getBoundingClientRect().height],quadrants:[[.2,.2],[.8,.2],[.2,.8],[.8,.8]].map(([x,y])=>document.elementFromPoint(r.left+r.width*x,r.top+r.height*y)?.closest('.material-compare-layer')?.dataset.mode)};
 });
 assert.equal(geometry.clip,'inset(50% 0px 0px 50%)');assert.deepEqual(geometry.source,geometry.web);assert.deepEqual(geometry.quadrants,['translation','translation','translation','original']);
 await page.screenshot({path:join(output,`compare-default-${width}.png`),fullPage:true});
 const drag=async(axis,percent,{finish=true}={})=>{
  const handle=axis==='x'?x:y,grip=await handle.locator('.material-compare-grip').boundingBox(),r=await sheet.boundingBox();
  await page.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await page.mouse.down();
  await page.mouse.move(axis==='x'?r.x+r.width*percent/100:grip.x+grip.width/2,axis==='y'?r.y+r.height*percent/100:grip.y+grip.height/2,{steps:6});
  if(finish)await page.mouse.up();
 };
 await drag('x',35,{finish:false});assert.deepEqual(await values(),[35,50]);assert.equal(await sheet.getAttribute('data-active-axis'),'x');assert.ok(Number(await y.evaluate(n=>getComputedStyle(n).opacity))<.5);
 await page.screenshot({path:join(output,`compare-drag-x-${width}.png`),fullPage:true});await page.mouse.up();assert.equal(await sheet.getAttribute('data-active-axis'),null);
 await drag('y',70,{finish:false});assert.deepEqual(await values(),[35,70]);assert.ok(Number(await x.evaluate(n=>getComputedStyle(n).opacity))<.5);
 await page.screenshot({path:join(output,`compare-drag-y-${width}.png`),fullPage:true});await page.keyboard.press('Escape');await page.mouse.up();assert.deepEqual(await values(),[35,50]);
 // Crossing either grip's old position must still leave both grips hit-testable.
 await drag('x',75);await drag('y',25);assert.deepEqual(await values(),[75,25]);
 for(const h of [x,y]){await h.locator('.material-compare-grip').scrollIntoViewIfNeeded();const hit=await h.locator('.material-compare-grip').evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {correct:hit===n.parentElement,hit:hit?.outerHTML.slice(0,250),rect:r.toJSON(),viewport:[innerWidth,innerHeight]};});assert.equal(hit.correct,true,JSON.stringify(hit));}
 await drag('x',35);await drag('y',65);assert.deepEqual(await values(),[35,65]);
 // Pointer cancellation and lost capture keep the last value but never stick the drag state.
 for(const type of ['pointercancel','lostpointercapture']){
  await drag('x',40,{finish:false});
  if(type==='lostpointercapture')await x.evaluate(n=>n.releasePointerCapture(1));else await x.dispatchEvent(type,{pointerId:1});
  await page.mouse.move(1,1);assert.equal(await sheet.getAttribute('data-active-axis'),null,type);await page.mouse.up();
  assert.deepEqual(await values(),[40,65]);
 }
 await drag('y',60,{finish:false});await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await sheet.getAttribute('data-active-axis'),null);await page.mouse.up();
 await x.focus();await page.keyboard.press('Home');assert.deepEqual(await values(),[0,60]);await page.keyboard.press('ArrowRight');assert.deepEqual(await values(),[1,60]);await page.keyboard.press('Shift+ArrowRight');assert.deepEqual(await values(),[11,60]);await page.keyboard.press('End');assert.deepEqual(await values(),[100,60]);await page.keyboard.press('ArrowRight');assert.deepEqual(await values(),[100,60]);
 await y.focus();await page.keyboard.press('Home');assert.deepEqual(await values(),[100,0]);await page.keyboard.press('ArrowDown');assert.deepEqual(await values(),[100,1]);await page.keyboard.press('ArrowUp');assert.deepEqual(await values(),[100,0]);await page.keyboard.press('End');assert.deepEqual(await values(),[100,100]);
 await page.keyboard.press('PageUp');assert.deepEqual(await values(),[100,90]);
 await x.focus();await page.keyboard.press('Home');await y.focus();await page.keyboard.press('Home');assert.deepEqual(await values(),[0,0]);
 assert.equal(await sheet.locator('.material-compare-web').isVisible(),false);
 const covered=await sheet.locator('.swatch').first().boundingBox();await page.mouse.click(covered.x+covered.width/2,covered.y+covered.height/2);assert.equal(await page.getByRole('button',{name:'Copy HEX',exact:true}).isDisabled(),true);
 // Exact edges retain complete 44px hit targets in the viewer's padding.
 for(const h of [x,y]){await h.locator('.material-compare-grip').scrollIntoViewIfNeeded();const hit=await h.locator('.material-compare-grip').evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {correct:hit===n.parentElement,hit:hit?.outerHTML.slice(0,250),rect:r.toJSON(),viewport:[innerWidth,innerHeight]};});assert.equal(hit.correct,true,JSON.stringify(hit));}
 await drag('x',100);await drag('y',100);assert.deepEqual(await values(),[100,100]);
 for(const h of [x,y]){await h.locator('.material-compare-grip').scrollIntoViewIfNeeded();const hit=await h.locator('.material-compare-grip').evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {correct:hit===n.parentElement,hit:hit?.outerHTML.slice(0,250),rect:r.toJSON(),viewport:[innerWidth,innerHeight]};});assert.equal(hit.correct,true,JSON.stringify(hit));}
 await x.focus();await page.keyboard.press('Home');await y.focus();await page.keyboard.press('Home');
 // A keyboard swatch may be under the scan; focusing it reveals its full bounds.
 const swatch=sheet.locator('.swatch').first();await swatch.focus();await page.keyboard.press('Enter');assert.ok((await values())[0]>0);assert.match(await page.locator('.material-inspector-value').innerText(),/#[0-9A-F]{6}/);
 await page.keyboard.press('ArrowRight');assert.equal(await sheet.locator('.swatch').nth(1).evaluate(n=>n===document.activeElement),true);
 // Restore a useful cut, then exercise resize/zoom and repeated mode/panel transitions.
 await x.focus();await page.keyboard.press('Home');for(let i=0;i<5;i++)await page.keyboard.press('Shift+ArrowRight');
 await y.focus();for(let i=0;i<5;i++)await page.keyboard.press('Shift+ArrowDown');assert.deepEqual(await values(),[50,50]);
 await page.getByLabel('Zoom',{exact:true}).selectOption('3');assert.deepEqual(await values(),[50,50]);assert.ok(await page.locator('.material-stage').evaluate(n=>n.scrollWidth>n.clientWidth&&n.scrollHeight>n.clientHeight));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 // The whole focused track remains distinct even when its grip is panned out of view.
 await x.focus();await page.keyboard.press('Home');await y.focus();await page.keyboard.press('Home');
 await page.locator('.material-stage').evaluate(n=>n.scrollTo(0,0));
 await x.evaluate(n=>n.focus({preventScroll:true}));await page.keyboard.press('ArrowRight');
 assert.equal(await x.evaluate(n=>getComputedStyle(n,'::before').width),'3px');
 await y.evaluate(n=>n.focus({preventScroll:true}));await page.keyboard.press('ArrowDown');
 assert.equal(await y.evaluate(n=>getComputedStyle(n,'::before').height),'3px');
 await x.focus();await page.keyboard.press('Home');for(let i=0;i<5;i++)await page.keyboard.press('Shift+ArrowRight');
 await y.focus();await page.keyboard.press('Home');for(let i=0;i<5;i++)await page.keyboard.press('Shift+ArrowDown');
 // Drag with real pan offsets at 300%, then retain the same percentages on resize.
 await x.locator('.material-compare-grip').scrollIntoViewIfNeeded();await drag('x',55);assert.deepEqual(await values(),[55,50]);
 await page.setViewportSize({width:width===1440?1000:360,height:width===1440?850:740});assert.deepEqual(await values(),[55,50]);
 await page.getByLabel('Zoom',{exact:true}).selectOption('1');await sheet.scrollIntoViewIfNeeded();await drag('x',30);assert.deepEqual(await values(),[30,50]);
 for(let i=0;i<3;i++){await page.getByRole('button',{name:'Original',exact:true}).click();assert.equal(await page.getByRole('slider').count(),0);await page.getByRole('button',{name:'Compare',exact:true}).click();await sheet.locator('svg').waitFor();assert.deepEqual(await values(),[30,50]);}
 await page.getByLabel('Panel',{exact:true}).selectOption('29');assert.equal(await page.getByRole('slider').count(),0);await page.getByLabel('Panel',{exact:true}).selectOption('2');await sheet.locator('svg').waitFor();assert.deepEqual(await values(),[30,50]);
 // Touch input goes through the browser's real pointer capture and scrolling machinery.
 await page.setViewportSize({width,height:width===1440?1000:844});
 if(width===390){
  await sheet.scrollIntoViewIfNeeded();const cdp=await context.newCDPSession(page),r=await sheet.boundingBox(),grip=await x.locator('.material-compare-grip').boundingBox(),start={x:grip.x+grip.width/2,y:grip.y+grip.height/2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.width*.6,y:start.y}]});assert.deepEqual(await values(),[60,50]);assert.equal(await sheet.getAttribute('data-active-axis'),'x');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await sheet.getAttribute('data-active-axis'),null);
  const horizontal=await y.locator('.material-compare-grip').boundingBox(),touchY={x:horizontal.x+horizontal.width/2,y:horizontal.y+horizontal.height/2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchY]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchY.x,y:r.y+r.height*.65}]});assert.deepEqual(await values(),[60,65]);assert.equal(await sheet.getAttribute('data-active-axis'),'y');await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await sheet.getAttribute('data-active-axis'),null);
  await page.screenshot({path:join(output,'compare-touch-390.png'),fullPage:true});await cdp.detach();await y.focus();await page.keyboard.press('Home');for(let i=0;i<5;i++)await page.keyboard.press('Shift+ArrowDown');
 }
 // Re-render and workspace teardown during capture must remove every active listener.
 await sheet.scrollIntoViewIfNeeded();await drag('x',45,{finish:false});await page.getByRole('button',{name:'Original',exact:true}).evaluate(n=>n.click());await page.mouse.up();assert.equal(await page.getByRole('slider').count(),0);await page.getByRole('button',{name:'Compare',exact:true}).click();await sheet.locator('svg').waitFor();assert.equal(await sheet.getAttribute('data-active-axis'),null);assert.deepEqual(await values(),[45,50]);
 await sheet.scrollIntoViewIfNeeded();await drag('x',55,{finish:false});await page.getByRole('button',{name:'Reference studies',exact:true}).evaluate(n=>n.click());await page.mouse.up();assert.equal(await page.locator('.material-shell').count(),0);await page.goBack();await sheet.locator('svg').waitFor();assert.deepEqual(await values(),[50,50]);
 await page.setViewportSize({width,height:width===1440?1000:844});
}

try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce',hasTouch:width===390,isMobile:width===390});
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
     assert.equal(await page.locator('.material-sheet').count(),1);assert.equal(await page.getByRole('slider').count(),2);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
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
  await checkCompare(page,width,context);
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
 const report={status:'passed',executedAt:new Date().toISOString(),browser:browser.version(),cases:results.length,translationViews:58,originalViews:78,errors,external,flows:['Original/Web translation/two-axis overlay Compare','independent mouse/keyboard/touch reveal and bottom-right source geometry','pointer cancel/lost capture/Escape/blur/teardown','percentage preservation on zoom, resize, mode and panel changes','all 39 panels at desktop/mobile','1,695 swatches and roving keyboard selection','zoom with contained scrolling','supplement fallback and mode restoration','download links','Back/Forward and workspace cleanup','copy success and denied fallback','SVG retry and stale-response protection','inert scoped SVG sanitization'],results};await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
