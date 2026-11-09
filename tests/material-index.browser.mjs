/** Index navigation, real assets, responsive geometry and interrupted loads. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(process.env.MATERIAL_TEST_ROOT||'.'),output=resolve('review/material-index-qa');
const manifest=JSON.parse(await readFile(join(root,'collections/material/lacouture-1890/manifest.json'),'utf8'));
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(relative(root,file).startsWith('..'))throw Error('Outside root');if((await stat(file)).isDirectory())file=join(file,'index.html');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(file));}catch{res.writeHead(404).end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,url=origin+'/apps/studio/?library=material';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
const errors=[],external=[],results=[];await mkdir(output,{recursive:true});
const overflow=async page=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},hasTouch:width!==1440,isMobile:width!==1440});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('.material-index-grid').waitFor();await overflow(page);
  assert.equal(await page.locator('.material-index-card').count(),29);assert.equal(await page.locator('.material-supplement-link').count(),10);
  assert.equal(await page.locator('.material-stage').count(),0);
  const links=await page.locator('.material-index-card').evaluateAll(nodes=>nodes.map(n=>({href:n.href,src:n.querySelector('img').src,name:n.getAttribute('aria-label')})));
  assert.equal(new Set(links.map(x=>x.href)).size,29);
  assert.deepEqual(links.map(x=>new URL(x.href).searchParams.get('panel')),manifest.items.filter(i=>i.svg).map(i=>i.id));
  for(const [index,item] of manifest.items.filter(i=>i.svg).entries()){
   assert.ok(links[index].src.endsWith('/'+item.svg));assert.equal(new URL(links[index].href).searchParams.get('view'),'translation');assert.ok(links[index].name.includes(item.number)&&links[index].name.includes(item.title));
   const card=page.locator('#index-'+item.id);await card.scrollIntoViewIfNeeded();
   await card.locator('img').evaluate(n=>n.decode());
   const b=await card.boundingBox();assert.ok(b.width>=44&&b.height>=44);
   await card.click();await page.locator('.material-sheet svg').waitFor();
   assert.equal(new URL(page.url()).searchParams.get('panel'),item.id);assert.equal(await page.locator('.material-sheet .swatch').count(),item.swatchCount);
   await page.getByRole('link',{name:'← All plates',exact:true}).click();
   assert.equal(await card.evaluate(n=>n===document.activeElement),true);
   await overflow(page);
  }
  // Full-page captures include every SVG after explicit decoding, not placeholders.
  await page.locator('.material-index-card img').evaluateAll(async images=>{for(const image of images)image.loading='eager';await Promise.all(images.map(image=>image.decode()));});
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:join(output,`index-${width}.png`),fullPage:true});
  await page.locator('.material-supplements summary').click();
  for(const item of manifest.items.filter(i=>!i.svg)){
   const card=page.locator('#index-'+item.id);await card.click();await page.locator('.material-sheet img').evaluate(n=>n.decode());
   assert.equal(new URL(page.url()).searchParams.get('panel'),item.id);assert.equal(await page.getByRole('button',{name:'Web translation',exact:true}).isDisabled(),true);
   await page.getByRole('link',{name:'← All plates',exact:true}).click();assert.equal(await card.evaluate(n=>n===document.activeElement),true);
  }
  // Back restores the gallery position as well as its focused link.
  const last=page.locator('#index-plate-xxviii');await last.scrollIntoViewIfNeeded();const savedY=await page.evaluate(()=>scrollY);await last.click();await page.locator('.material-sheet svg').waitFor();await page.goBack();await last.waitFor();await page.waitForTimeout(100);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-savedY)<2);
  // Keyboard activation, visible focus, reload, Back/Forward and native new-tab links.
  const card=page.locator('#index-plate-ii');await card.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
  assert.notEqual(await card.evaluate(n=>getComputedStyle(n).outlineStyle),'none');
  await page.keyboard.press('Enter');await page.locator('.material-sheet svg').waitFor();assert.equal(await page.getByLabel('Panel',{exact:true}).inputValue(),'2');
  await page.reload();await page.locator('.material-sheet svg').waitFor();
  await page.goBack();await card.waitFor();assert.equal(await card.evaluate(n=>n===document.activeElement),true);
  await page.goForward();await page.locator('.material-sheet svg').waitFor();
  await page.getByRole('link',{name:'← All plates',exact:true}).click();await page.reload();await card.waitFor();
  const newTab=await context.newPage();await newTab.goto(await card.getAttribute('href'));await newTab.locator('.material-sheet svg').waitFor();assert.equal(await newTab.getByLabel('Panel',{exact:true}).inputValue(),'2');await newTab.close();
  for(const [suffix,mode] of [['&view=compare','compare'],['&view=translation','translation'],['&view=panels','original'],['&panel=plate-x&view=compare','compare'],['&panel=plate-x','original']]){
   await page.goto(url+suffix);await page.locator('.material-stage').waitFor();
   assert.equal(await page.locator(`[data-material-view=${mode}]`).getAttribute('aria-pressed'),'true');
   if(mode==='compare'){await page.locator('.material-sheet svg').waitFor();assert.equal(await page.locator('.material-compare-handle').count(),1);}
  }
  await page.getByRole('button',{name:'Reference studies',exact:true}).click();await page.getByLabel('Collection',{exact:true}).waitFor();
  await page.getByLabel('Material',{exact:true}).selectOption('lacouture-1890');await page.locator('.material-index-grid').waitFor();
  await page.goBack();await page.getByLabel('Collection',{exact:true}).waitFor();await page.goForward();await page.locator('.material-index-grid').waitFor();
  assert.match(await page.locator('.material-credit').innerText(),/Getty Research Institute/);
  results.push({width,plateLinks:29,supplementLinks:10,history:'passed',keyboard:'passed'});await context.close();
 }
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/translation/plates/plate-i.svg',route=>route.fulfill({status:503,body:'unavailable'}));
 await page.goto(url);await page.locator('#index-plate-i .material-thumbnail-status').filter({hasText:'Preview unavailable'}).waitFor();
 assert.equal(await page.locator('#index-plate-i').isVisible(),true);
 await page.locator('#index-plate-i').click();await page.getByRole('alert').filter({hasText:'could not load'}).waitFor();
 await page.unroute('**/translation/plates/plate-i.svg');await page.getByRole('button',{name:'Retry',exact:true}).click();await page.locator('.material-sheet svg').waitFor();
 await page.getByRole('link',{name:'← All plates',exact:true}).click();
 await page.route('**/translation/plates/plate-iii.svg',async route=>{await new Promise(r=>setTimeout(r,400));await route.continue();});
 await page.locator('#index-plate-iii').click();await page.getByRole('link',{name:'← All plates',exact:true}).click();await page.locator('#index-plate-iv').click();await page.locator('.material-sheet svg').waitFor();await page.waitForTimeout(550);
 assert.equal(new URL(page.url()).searchParams.get('panel'),'plate-iv');assert.match(await page.locator('.material-sheet svg title').first().textContent(),/IV/);
 // A late SVG load cannot repopulate the overview after return.
 await page.getByRole('link',{name:'← All plates',exact:true}).click();await page.waitForTimeout(450);assert.equal(await page.locator('.material-sheet').count(),0);assert.equal(await page.locator('.material-index-card').count(),29);
 await page.close();assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={status:'passed',results,errors,external,flows:['all 29 exact SVG thumbnails and unique plate destinations','all 10 original-only supplementary links','keyboard, focus return, Back/Forward/reload and direct links','legacy view-only links','workspace return','thumbnail failure, viewer retry and rapid navigation']};await writeFile(join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
