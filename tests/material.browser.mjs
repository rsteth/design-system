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
 const sheet=page.locator('.material-compare'),handle=page.locator('.material-compare-handle');
 await sheet.locator('svg').waitFor();await sheet.locator('img').evaluate(n=>n.decode());
 const values=()=>sheet.evaluate(n=>['x','y'].map(a=>parseFloat(n.style.getPropertyValue('--compare-'+a))));
 const near=async(expected)=>{const actual=await values();actual.forEach((n,i)=>assert.ok(Math.abs(n-expected[i])<.05,`${actual} != ${expected}`));};
 const reset=async()=>{await handle.focus();await page.keyboard.press('Enter');};
 const reachable=async()=>{await page.locator('.material-stage').scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const b=await handle.boundingBox();assert.equal(b.width,44);assert.equal(b.height,44);assert.equal(await handle.evaluate(n=>{const r=n.getBoundingClientRect();return document.elementFromPoint(r.x+22,r.y+22)===n;}),true);};
 const start=async()=>{const b=await handle.boundingBox();const p={x:b.x+22,y:b.y+22};await page.mouse.move(p.x,p.y);await page.mouse.down();return p;};
 const move=async(p,dx,dy)=>page.mouse.move(p.x+dx,p.y+dy);
 await near([0,0]);await reachable();
 assert.equal(await page.locator('#material-framing-help').isVisible(),false);
 const initial=await start();await page.mouse.up();await near([0,0]);
 const artwork=await sheet.boundingBox(),edge=await page.locator('.material-stage').evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x+n.clientLeft,y:r.y+n.clientTop};});
 const visibleOrigin=[Math.max(0,(edge.x-artwork.x)/artwork.width*100),Math.max(0,(edge.y-artwork.y)/artwork.height*100)];
 for(const [dx,dy] of [[40,40],[40,0],[0,40]]){
  await handle.focus();await page.keyboard.press('Home');const initialGrip=await handle.boundingBox(),initialDrag=await start();await move(initialDrag,dx,dy);await page.mouse.up();
  await near([dx?visibleOrigin[0]+dx/artwork.width*100:0,dy?visibleOrigin[1]+dy/artwork.height*100:0]);
  const movedGrip=await handle.boundingBox();if(dx)assert.ok(movedGrip.x-initialGrip.x>15);if(dy)assert.ok(movedGrip.y-initialGrip.y>15);
  if(dx&&dy)await page.screenshot({path:join(output,`compare-artwork-initial-drag-${width}.png`),fullPage:true});
  const cut=await values();if(dx)assert.ok(artwork.x+artwork.width*cut[0]/100>=edge.x+39);if(dy)assert.ok(artwork.y+artwork.height*cut[1]/100>=edge.y+39);
 }

 await handle.focus();await page.keyboard.press('Home');
 await page.getByLabel('Zoom',{exact:true}).selectOption('1');await sheet.scrollIntoViewIfNeeded();
 await near([0,0]);assert.equal(await handle.count(),1);assert.equal(await page.locator('.material-compare-label').count(),0);await reachable();
 assert.equal(await handle.getAttribute('role'),'button');assert.match(await handle.getAttribute('aria-label'),/0% from left, 0% from top/);
 assert.doesNotMatch(await page.locator('.material-content').innerText(),/Fit artwork shows the color study|Web geometry is approximate/);
 await page.screenshot({path:join(output,`compare-default-${width}.png`),fullPage:true});
 await reset();
 const geometry=await sheet.evaluate(n=>{const r=n.getBoundingClientRect(),source=n.querySelector('[data-mode=original]'),image=source.querySelector('img'),svg=n.querySelector('svg');return {clip:getComputedStyle(source).clipPath,source:[image.getBoundingClientRect().width,image.getBoundingClientRect().height],web:[svg.getBoundingClientRect().width,svg.getBoundingClientRect().height],quadrants:[[.2,.2],[.8,.2],[.2,.8],[.8,.8]].map(([x,y])=>document.elementFromPoint(r.left+r.width*x,r.top+r.height*y)?.closest('.material-compare-layer')?.dataset.mode)};});
 assert.equal(geometry.clip,'inset(50% 0px 0px 50%)');assert.deepEqual(geometry.source,geometry.web);assert.deepEqual(geometry.quadrants,['translation','translation','translation','original']);
 const r=await sheet.boundingBox();
 // Both signs of both locks, just inside the 10% intent cone, release and no re-lock.
 for(const axis of ['x','y'])for(const sign of [-1,1]){
  await reset();const p=await start(),delta=sign*40;
  await move(p,axis==='x'?delta:3,axis==='y'?delta:3);
  assert.equal(await sheet.getAttribute('data-active-axis'),axis);
  await near(axis==='x'?[50+delta/r.width*100,50]:[50,50+delta/r.height*100]);
  await move(p,axis==='x'?delta:7.9,axis==='y'?delta:7.9);assert.equal(await sheet.getAttribute('data-active-axis'),axis);
  await move(p,axis==='x'?delta:8.1,axis==='y'?delta:8.1);assert.equal(await sheet.getAttribute('data-active-axis'),'both');
  const unlocked=await values();assert.ok(Math.abs(unlocked[axis==='x'?1:0]-50)<.1,'continuous release');
  await move(p,axis==='x'?delta:20,axis==='y'?delta:20);
  await near(axis==='x'?[50+delta/r.width*100,50+12/r.height*100]:[50+12/r.width*100,50+delta/r.height*100]);
  await page.mouse.up();assert.equal(await sheet.getAttribute('data-active-axis'),null);
 }
 for(const [dx,dy] of [[30,30],[-30,30],[30,-30],[-30,-30],[40,5]]){
  await reset();const p=await start();await move(p,dx,dy);assert.equal(await sheet.getAttribute('data-active-axis'),'both');await near([50+dx/r.width*100,50+dy/r.height*100]);await page.mouse.up();
 }
 await reset();let p=await start();await move(p,40,30);await page.keyboard.press('Escape');await page.mouse.up();await near([50,50]);
 for(const type of ['pointercancel','lostpointercapture','blur']){
  p=await start();await move(p,15,0);const kept=await values();
  if(type==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));else if(type==='lostpointercapture')await handle.evaluate(n=>n.releasePointerCapture(1));else await handle.dispatchEvent(type,{pointerId:1});
  await move(p,40,40);assert.equal(await sheet.getAttribute('data-active-axis'),null);await page.mouse.up();await near(kept);
 }
 await reset();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Shift+ArrowDown');await near([49,60]);await page.keyboard.press('PageUp');await near([49,50]);
 await page.keyboard.down('ArrowRight');await page.keyboard.press('Escape');await page.keyboard.up('ArrowRight');await near([49,50]);
 for(const key of ['Home','End']){
  await page.keyboard.press(key);await near(key==='Home'?[0,0]:[100,100]);await reachable();
  // Proxy at edge can be grabbed without changing the value or jumping.
  p=await start();await page.mouse.up();await near(key==='Home'?[0,0]:[100,100]);
  p=await start();const d=key==='Home'?10:-10;await move(p,d,d);await page.mouse.up();await near(key==='Home'?[10/r.width*100,10/r.height*100]:[100-10/r.width*100,100-10/r.height*100]);
 }
 await reset();await page.getByLabel('Zoom',{exact:true}).selectOption('3');await near([50,50]);
 await page.locator('.material-stage').evaluate(n=>n.scrollTo(0,0));await reachable();
 p=await start();const big=await sheet.boundingBox();await move(p,30,30);await page.mouse.up();await near([50+30/big.width*100,50+30/big.height*100]);const saved=await values();
 await page.setViewportSize({width:width===1440?1000:360,height:740});await near(saved);await reachable();
 await page.getByLabel('Zoom',{exact:true}).selectOption('1');await sheet.scrollIntoViewIfNeeded();
 for(let i=0;i<3;i++){await page.getByRole('button',{name:'Original',exact:true}).click();assert.equal(await handle.count(),0);await page.getByRole('button',{name:'Compare',exact:true}).click();await sheet.locator('svg').waitFor();await near(saved);}
 await page.getByLabel('Panel',{exact:true}).selectOption('29');assert.equal(await handle.count(),0);await page.getByLabel('Panel',{exact:true}).selectOption('2');await sheet.locator('svg').waitFor();await near(saved);
 await handle.focus();await page.keyboard.press('Home');const swatch=sheet.locator('.swatch').first();await swatch.focus();await page.keyboard.press('Enter');assert.ok((await values())[0]>0);assert.match(await page.locator('.material-inspector-value').innerText(),/#[0-9A-F]{6}/);
 await page.setViewportSize({width,height:width===1440?1000:844});await sheet.scrollIntoViewIfNeeded();await reset();
 if(width===390){
  const cdp=await context.newCDPSession(page);
  for(const [dx,dy] of [[30,2],[2,30],[-20,-20]]){
   await reset();const b=await handle.boundingBox(),t={x:b.x+22,y:b.y+22};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[t]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:t.x+dx,y:t.y+dy}]});await page.waitForTimeout(50);assert.equal(await sheet.getAttribute('data-active-axis'),dx===30?'x':dy===30?'y':'both');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:t.x+30,y:t.y+30}]});await page.waitForTimeout(50);assert.equal(await sheet.getAttribute('data-active-axis'),'both');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal(await sheet.getAttribute('data-active-axis'),null);
  }await cdp.detach();
 }
 await reset();await page.screenshot({path:join(output,`compare-intersection-${width}.png`),fullPage:true});
 p=await start();await move(p,20,0);await page.getByRole('button',{name:'Original',exact:true}).evaluate(n=>n.click());await page.mouse.up();assert.equal(await handle.count(),0);await page.getByRole('button',{name:'Compare',exact:true}).click();await sheet.locator('svg').waitFor();assert.equal(await sheet.getAttribute('data-active-axis'),null);
 await sheet.scrollIntoViewIfNeeded();p=await start();await move(p,20,0);await page.getByRole('button',{name:'Reference studies',exact:true}).evaluate(n=>n.click());await page.mouse.up();await page.goBack();await sheet.locator('svg').waitFor();await near([0,0]);
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
     assert.equal(await page.locator('.material-sheet').count(),1);assert.equal(await page.locator('.material-compare-handle').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
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
 const report={status:'passed',executedAt:new Date().toISOString(),browser:browser.version(),cases:results.length,translationViews:58,originalViews:78,errors,external,flows:['Original/Web translation/two-axis overlay Compare','single intersection mouse/keyboard/touch reveal, directional snap/release and bottom-right source geometry','pointer cancel/lost capture/Escape/blur/teardown','percentage preservation on zoom, resize, mode and panel changes','all 39 panels at desktop/mobile','1,695 swatches and roving keyboard selection','zoom with contained scrolling','supplement fallback and mode restoration','download links','Back/Forward and workspace cleanup','copy success and denied fallback','SVG retry and stale-response protection','inert scoped SVG sanitization'],results};await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
