import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {materialArtworkBounds,materialFraming} from '../apps/studio/material-framing.mjs';
import {materialChartRegistration} from '../apps/studio/material-registration.mjs';
const root=resolve(process.env.MATERIAL_TEST_ROOT||'.'),output=resolve('review/material-framing-qa');
const manifest=JSON.parse(await readFile(join(root,'collections/material/lacouture-1890/manifest.json'),'utf8'));
const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(relative(root,file).startsWith('..'))throw Error('Outside root');if((await stat(file)).isDirectory())file=join(file,'index.html');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(file));}catch{res.writeHead(404).end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,url=origin+'/apps/studio/?library=material';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
const results=[],errors=[],external=[];await mkdir(output,{recursive:true});
const close=(actual,expected,epsilon=.05)=>assert.ok(Math.abs(actual-expected)<=epsilon,`${actual} ≠ ${expected} ± ${epsilon}`);
const geometry=page=>page.locator('.material-sheet').evaluate(n=>{
 const r=x=>{const b=x.getBoundingClientRect();return [b.x,b.y,b.width,b.height];},svg=n.querySelector('svg'),img=n.querySelector('img'),stage=document.querySelector('.material-stage'),b=stage.getBoundingClientRect(),sr=n.getBoundingClientRect();
 const swatches=svg?[...svg.querySelectorAll('.swatch')].flatMap(s=>{const q=s.getBBox(),m=svg.getScreenCTM().inverse().multiply(s.getScreenCTM());return [[q.x,q.y],[q.x+q.width,q.y],[q.x,q.y+q.height],[q.x+q.width,q.y+q.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));}):[];
 return {sheet:r(n),image:img?r(img):null,svg:svg?r(svg):null,stage:[b.x+stage.clientLeft,b.y+stage.clientTop,stage.clientWidth,stage.clientHeight],viewBox:svg?[svg.viewBox.baseVal.width,svg.viewBox.baseVal.height]:null,bounds:swatches.length?[Math.min(...swatches.map(p=>p.x)),Math.min(...swatches.map(p=>p.y)),Math.max(...swatches.map(p=>p.x)),Math.max(...swatches.map(p=>p.y))]:null,scroll:[stage.scrollLeft,stage.scrollTop],center:[(b.x+stage.clientLeft+stage.clientWidth/2-sr.x)/sr.width,(b.y+stage.clientTop+stage.clientHeight/2-sr.y)/sr.height]};
});
const wait=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
try{
 for(const width of [1440,390,360]){
  const height=width===1440?1000:844,context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500,deviceScaleFactor:width<500?2:1,reducedMotion:'reduce'});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const item of manifest.items.filter(i=>i.svg)){
   await page.goto(url+`&panel=${item.id}&view=compare`);await page.locator('.material-sheet svg').waitFor();await page.locator('.material-sheet img').evaluate(n=>n.decode());await wait(page);
   assert.equal(await page.getByLabel('Zoom',{exact:true}).inputValue(),'artwork');
   const a=await geometry(page),bounds=materialArtworkBounds[item.id];
   assert.deepEqual(a.image,a.svg);assert.deepEqual(a.viewBox,[item.width,item.height]);
   if(materialChartRegistration[item.id]){
    const toggle=page.getByLabel('Align chart to scan',{exact:true});assert.equal(await toggle.isChecked(),true);
    const unchanged=()=>page.locator('.material-sheet svg').evaluate(svg=>[...svg.querySelector('.material-chart').parentElement.children].filter(n=>!n.classList.contains('material-chart')).map(n=>({html:n.outerHTML,matrix:[n.getScreenCTM().a,n.getScreenCTM().b,n.getScreenCTM().c,n.getScreenCTM().d,n.getScreenCTM().e,n.getScreenCTM().f]})));
    const headers=await unchanged();await toggle.uncheck();const unaligned=await geometry(page);unaligned.bounds.forEach((v,i)=>close(v,bounds[i],.02));assert.deepEqual(await unchanged(),headers);await toggle.check();assert.deepEqual(await unchanged(),headers);
    const group=page.locator('.material-chart');assert.equal(await group.locator(':scope > *').count(),62);assert.equal(await group.locator('.swatch').count(),49);
    const matrix=await group.evaluate(g=>{const m=g.transform.baseVal.consolidate().matrix;return [m.a,m.b,m.c,m.d,m.e,m.f];}),c=materialChartRegistration[item.id],angle=c.rotation*Math.PI/180,cos=c.scale*Math.cos(angle),sin=c.scale*Math.sin(angle);
    [cos,sin,-sin,cos,c.center[0]+c.translate[0]-cos*c.center[0]+sin*c.center[1],c.center[1]+c.translate[1]-sin*c.center[0]-cos*c.center[1]].forEach((v,i)=>close(matrix[i],v,.001));
   }else{assert.equal(await page.getByLabel('Align chart to scan',{exact:true}).count(),0);a.bounds.forEach((v,i)=>close(v,bounds[i],.02));}

   const scale=a.sheet[2]/item.width;
   close(a.sheet[3],item.height*scale);
   const ink=[a.sheet[0]+bounds[0]*scale,a.sheet[1]+bounds[1]*scale,a.sheet[0]+bounds[2]*scale,a.sheet[1]+bounds[3]*scale];
   assert.ok(ink[0]>=a.stage[0]+20&&ink[1]>=a.stage[1]+20&&ink[2]<=a.stage[0]+a.stage[2]-20&&ink[3]<=a.stage[1]+a.stage[3]-20,`${width} ${item.id} artwork outside shared frame: ${JSON.stringify({ink,stage:a.stage})}`);
   if(a.sheet[2]>a.stage[2])close(a.center[0],(bounds[0]+bounds[2])/2/item.width,.003);
   if(a.sheet[3]>a.stage[3])close(a.center[1],(bounds[1]+bounds[3])/2/item.height,.003);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   for(const grip of await page.locator('.material-compare-grip').all()){const r=await grip.boundingBox();assert.ok(r.x>=a.stage[0]&&r.y>=a.stage[1]&&r.x+r.width<=a.stage[0]+a.stage[2]&&r.y+r.height<=a.stage[1]+a.stage[3],`${item.id} grip outside framed viewport`);}
   const representative=['plate-i','plate-i-bis','plate-ii','plate-xiv','plate-xxiii','plate-xxviii'].includes(item.id);
   if(representative){await page.locator('.material-stage').scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`${item.id}-artwork-${width}.png`)});}
   await page.getByLabel('Zoom',{exact:true}).selectOption('1');await wait(page);const p=await geometry(page);
   assert.deepEqual(p.scroll,[0,0]);assert.ok(p.sheet[0]>=p.stage[0]&&p.sheet[1]>=p.stage[1]&&p.sheet[0]+p.sheet[2]<=p.stage[0]+p.stage[2]&&p.sheet[1]+p.sheet[3]<=p.stage[1]+p.stage[3]);
   const pageWidth=p.sheet[2];
   for(const mode of ['Original','Web translation','Compare']){
    await page.getByRole('button',{name:mode,exact:true}).click();if(mode!=='Original')await page.locator('.material-sheet svg').waitFor();await wait(page);close((await geometry(page)).sheet[2],pageWidth);
   }
   if(representative){await page.locator('.material-stage').scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`${item.id}-page-${width}.png`)});}
   // Force the narrowest derivative: its rounded native aspect cannot change the page box.
   await page.locator('.material-sheet img').evaluate((img,src)=>{img.removeAttribute('srcset');img.src=src;},`${origin}/collections/material/lacouture-1890/${item.previews[0].file}`);await page.locator('.material-sheet img').evaluate(n=>n.decode());const preview=await geometry(page);assert.deepEqual(preview.image,preview.svg);
   results.push({width,id:item.id,artworkPageWidth:a.sheet[2],fullPageWidth:pageWidth,artworkWidth:(a.bounds[2]-a.bounds[0])*scale,gain:a.sheet[2]/pageWidth,boxDelta:a.image.map((v,i)=>v-a.svg[i])});
  }
  await page.goto(url+'&panel=plate-ii&view=compare');await page.locator('.material-sheet svg').waitFor();await wait(page);
  for(const mode of ['width','artwork','1','artwork']){await page.getByLabel('Zoom',{exact:true}).selectOption(mode);await wait(page);const g=await geometry(page);if(mode==='width')close(g.sheet[2],g.stage[2]-48);if(mode==='1')assert.deepEqual(g.scroll,[0,0]);}
  // Reapply explicit Fit semantics in both resize directions, including rotation.
  for(const viewport of [{width:390,height:844},{width:1440,height:1000},{width:844,height:390},{width,height}]){
   await page.setViewportSize(viewport);await wait(page);const g=await geometry(page),b=materialArtworkBounds['plate-ii'],scale=g.sheet[2]/2207;
   assert.ok(g.sheet[0]+b[0]*scale>=g.stage[0]&&g.sheet[0]+b[2]*scale<=g.stage[0]+g.stage[2]);
   assert.ok(g.sheet[1]+b[1]*scale>=g.stage[1]&&g.sheet[1]+b[3]*scale<=g.stage[1]+g.stage[3]);
  }
  await page.getByLabel('Zoom',{exact:true}).selectOption('actual');await wait(page);close((await geometry(page)).sheet[2],2207);
  await page.locator('.material-stage').evaluate(n=>n.scrollTo(n.scrollLeft+80,n.scrollTop+100));const initialCenter=(await geometry(page)).center;
  for(const mode of ['1.5','2','3','actual']){await page.getByLabel('Zoom',{exact:true}).selectOption(mode);await wait(page);const g=await geometry(page);close(g.sheet[2],2207*(mode==='actual'?1:Number(mode)));g.center.forEach((v,i)=>close(v,initialCenter[i],.002));}
  const preResize=await geometry(page);
  for(const viewport of [{width:390,height:844},{width:1440,height:1000},{width,height}]){await page.setViewportSize(viewport);await wait(page);(await geometry(page)).center.forEach((v,i)=>close(v,preResize.center[i],.002));}
  const saved=await geometry(page);
  for(const mode of ['Original','Web translation','Compare']){await page.getByRole('button',{name:mode,exact:true}).click();if(mode!=='Original')await page.locator('.material-sheet svg').waitFor();await wait(page);const g=await geometry(page);g.center.forEach((v,i)=>close(v,saved.center[i],.002));}
  const toggle=page.getByLabel('Align chart to scan',{exact:true});await toggle.uncheck();await page.getByRole('button',{name:'Web translation',exact:true}).click();await page.locator('.material-sheet svg').waitFor();assert.equal(await toggle.isChecked(),false);assert.equal(await page.locator('.material-chart').getAttribute('transform'),null);
  await page.getByLabel('Panel',{exact:true}).selectOption('23');await page.locator('.material-sheet svg').waitFor();assert.equal(await toggle.count(),0);await page.getByLabel('Panel',{exact:true}).selectOption('2');await page.locator('.material-sheet svg').waitFor();assert.equal(await toggle.isChecked(),false);await toggle.check();
  await page.getByLabel('Zoom',{exact:true}).selectOption('artwork');await wait(page);await page.locator('.material-stage').evaluate(n=>n.scrollTo(1e5,1e5));await page.getByLabel('Zoom',{exact:true}).selectOption('1');await wait(page);assert.deepEqual((await geometry(page)).scroll,[0,0]);
  await page.getByLabel('Zoom',{exact:true}).selectOption('artwork');await page.getByLabel('Panel',{exact:true}).selectOption('29');await wait(page);assert.equal(await page.getByLabel('Zoom',{exact:true}).inputValue(),'1');assert.equal(await page.locator('#material-zoom option[value=artwork]').count(),0);await page.getByLabel('Panel',{exact:true}).selectOption('2');await page.locator('.material-sheet svg').waitFor();await wait(page);assert.equal(await page.getByLabel('Zoom',{exact:true}).inputValue(),'artwork');
  await context.close();
 }
 // Original framing is local metadata, so a failed/delayed translation cannot block it.
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();let requested=0;
 await page.route('**/translation/plates/*.svg',route=>{requested++;return route.fulfill({status:503,body:'unavailable'});});
 await page.goto(url+'&panel=plate-ii');await page.locator('.material-sheet img').evaluate(n=>n.decode());await wait(page);assert.equal(requested,0);assert.equal(await page.getByLabel('Zoom',{exact:true}).inputValue(),'artwork');
 await page.getByRole('button',{name:'Compare',exact:true}).click();const alert=page.getByRole('alert');await alert.waitFor();assert.ok(await alert.isVisible());assert.equal(await page.locator('.material-load-status').locator('[role=alert]').count(),1);
 await page.getByLabel('Zoom',{exact:true}).selectOption('3');assert.ok(await alert.isVisible());await page.unroute('**/translation/plates/*.svg');await page.getByRole('button',{name:'Retry',exact:true}).click();await page.locator('.material-sheet svg').waitFor();assert.equal(await page.getByRole('alert').count(),0);await context.close();
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={status:'passed',browser:browser.version(),cases:results.length,errors,external,results};await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
