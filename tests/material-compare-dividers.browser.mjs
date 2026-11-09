import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assertInitialCompare,assertCompareDividers} from './material-compare-geometry.mjs';

const root=resolve(process.env.MATERIAL_TEST_ROOT||'.'),output=resolve(process.env.MATERIAL_TEST_OUTPUT||'review/material-compare-dividers-qa');
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(relative(root,file).startsWith('..'))throw Error('Outside root');
  if((await stat(file)).isDirectory())file=join(file,'index.html');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(file));
 }catch{res.writeHead(404).end('Not found');}
});
// Default to an isolated loopback server. An explicit URL permits the same
// read-only geometry checks against a separately approved published viewer.
if(!process.env.MATERIAL_TEST_URL)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=process.env.MATERIAL_TEST_URL||`http://127.0.0.1:${server.address().port}/apps/studio/?library=material&panel=plate-ii&view=compare`;
const origin=new URL(url).origin;
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
const errors=[],external=[],results=[];
await mkdir(output,{recursive:true});
const settle=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},hasTouch:width<500,isMobile:width<500,reducedMotion:'reduce'});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  const sheet=page.locator('.material-compare'),stage=page.locator('.material-stage'),handle=page.locator('.material-compare-handle');
  await sheet.locator('svg:not(.material-compare-icon)').waitFor();await sheet.locator('img').evaluate(n=>n.decode());await settle(page);
  await assertInitialCompare(page);await stage.scrollIntoViewIfNeeded();
  await page.screenshot({path:join(output,`initial-${width}.png`)});
  const check=async state=>{
   await settle(page);const g=await assertCompareDividers(page);
   assert.equal(await handle.count(),1);
   assert.ok(g.handle.x>=g.stage.x-.08&&g.handle.y>=g.stage.y-.08&&g.handle.right<=g.stage.right+.08&&g.handle.bottom<=g.stage.bottom+.08,`${state}: unreachable proxy`);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   results.push({width,state,values:g.values,visibleLines:g.lines.filter(l=>!l.hidden).map(l=>l.axis),cut:g.cut,proxy:{x:g.handle.x+22,y:g.handle.y+22}});
   return g;
  };
  const position=async(x,y)=>{
   await handle.focus();await page.keyboard.press('Enter');
   for(const [value,negative,positive] of [[x,'ArrowLeft','ArrowRight'],[y,'ArrowUp','ArrowDown']]){
    const direction=value<50?negative:positive,steps=Math.abs(value-50);
    for(let i=0;i<Math.floor(steps/10);i++)await page.keyboard.press('Shift+'+direction);
    for(let i=0;i<steps%10;i++)await page.keyboard.press(direction);
   }
  };
  await check('initial-artwork');
  await page.getByLabel('Zoom',{exact:true}).selectOption('1');await stage.scrollIntoViewIfNeeded();
  // Every corner and edge midpoint: only shared internal boundaries are drawn.
  for(const x of [0,50,100])for(const y of [0,50,100]){
   await position(x,y);const g=await check(`edge-${x}-${y}`);assert.deepEqual(g.values,[x,y]);
   await page.screenshot({path:join(output,`edge-${x}-${y}-${width}.png`)});
  }
  // Nonzero slivers still have boundaries; exact zero never leaves a shadow dot.
  for(const [x,y] of [[1,1],[99,99],[100,99],[99,100]]){await position(x,y);await check(`sliver-${x}-${y}`);}
  await position(50,50);await page.getByLabel('Zoom',{exact:true}).selectOption('3');await stage.scrollIntoViewIfNeeded();
  for(const [name,fx,fy] of [['above-left',-.2,-.2],['above',.5,-.2],['left',-.2,.5],['below-right',1.2,1.2],['below',.5,1.2],['right',1.2,.5]]){
   await stage.evaluate((n,{fx,fy})=>{
    const sheet=n.querySelector('.material-compare'),p=sheet.getBoundingClientRect(),s=n.getBoundingClientRect();
    const x=parseFloat(sheet.style.getPropertyValue('--compare-x'))/100,y=parseFloat(sheet.style.getPropertyValue('--compare-y'))/100;
    n.scrollBy(p.left+p.width*x-(s.left+n.clientLeft+n.clientWidth*fx),p.top+p.height*y-(s.top+n.clientTop+n.clientHeight*fy));
   },{fx,fy});
   const g=await check(`offscreen-${name}`);assert.deepEqual(g.values,[50,50]);
   const lineVisible=line=>!line.hidden&&line.rect.right>g.stage.x&&line.rect.x<g.stage.right&&line.rect.bottom>g.stage.y&&line.rect.y<g.stage.bottom;
   const expected=name==='above'?['x']:name==='left'?['y']:[];
   assert.deepEqual(g.lines.filter(lineVisible).map(l=>l.axis),expected,`phantom line at proxy: ${name}`);
   await page.screenshot({path:join(output,`offscreen-${name}-${width}.png`)});
   // Grabbing the proxy must not move a cut to the proxy's inset coordinates.
   await handle.click();await check(`proxy-click-${name}`);
   assert.deepEqual((await assertCompareDividers(page)).values,[50,50]);
  }
  await page.getByLabel('Zoom',{exact:true}).selectOption('1');await stage.scrollIntoViewIfNeeded();await position(50,50);
  const drag=async(dx,dy)=>{
   const r=await handle.boundingBox(),p={x:r.x+22,y:r.y+22};await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+dx,p.y+dy);return p;
  };
  let p=await drag(35,2);assert.equal(await sheet.getAttribute('data-active-axis'),'x');await check('horizontal-snap');
  await page.mouse.move(p.x+35,p.y+20);assert.equal(await sheet.getAttribute('data-active-axis'),'both');await check('snap-release');
  await page.keyboard.press('Escape');await page.mouse.up();await check('escape-restores-center');
  assert.deepEqual((await assertCompareDividers(page)).values,[50,50]);
  p=await drag(2,35);assert.equal(await sheet.getAttribute('data-active-axis'),'y');await check('vertical-snap');await page.mouse.up();
  if(width<500){
   await position(100,100);const b=await handle.boundingBox(),point={x:b.x+22,y:b.y+22},cdp=await context.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x-30,y:point.y-30}]});
   await check('touch-from-bottom-right');assert.equal(await sheet.getAttribute('data-active-axis'),'both');
   assert.ok((await assertCompareDividers(page)).values.every(v=>v<100));
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }
  await position(50,50);await page.getByLabel('Align chart to scan',{exact:true}).uncheck();await check('unaligned');
  await page.getByLabel('Align chart to scan',{exact:true}).check();await check('aligned');
  await page.setViewportSize({width:width===1440?390:1440,height:844});await check('resize');
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={status:'passed',executedAt:new Date().toISOString(),browser:browser.version(),cases:results.length,errors,external,results};
 await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();if(server.listening)await new Promise(r=>server.close(r));}
