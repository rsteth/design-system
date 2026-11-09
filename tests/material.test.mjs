import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {publicSourceMetadata,redactUnverifiedRevisions,PUBLIC_SOURCE_REVISIONS,publicMetadataJSON,publicVersionMetadata} from '../apps/studio/public-sources.mjs';
const read = file => readFile(new URL('../'+file,import.meta.url),'utf8');
test('all 29 plates and 10 supplements retain exact acquired bytes and source pages', async () => {
 const manifest=JSON.parse(await read('collections/material/lacouture-1890/manifest.json'));
 assert.equal(manifest.items.filter(item=>item.group==='plate').length,29);
 assert.equal(manifest.items.filter(item=>item.group==='supplement').length,10);
 assert.equal(new Set(manifest.items.map(item=>item.id)).size,39);
 for(const item of manifest.items){assert.match(item.file,/^scans\/[a-z0-9-]+\.jpg$/);const image=await readFile(new URL('../collections/material/lacouture-1890/'+item.file,import.meta.url));assert.equal(createHash('sha256').update(image).digest('hex'),item.sha256);assert.equal(item.height,3000);assert.match(item.sourceURL,/^https:\/\/archive\.org\/details\/gri_33125012875395\/page\/n\d+\/mode\/1up$/);}
 assert.match(manifest.credit,/Getty Research Institute/);assert.match(manifest.rights,/NOT_IN_COPYRIGHT/);
 assert.equal(manifest.translationURL,undefined); assert.equal(manifest.translationAccess,undefined); assert.equal(manifest.items.filter(item=>item.svg).length,29);
});
test('Material is separate from app and reference registries with a native labelled dropdown',async()=>{
 const html=await read('apps/studio/index.html'), main=await read('apps/studio/main.mjs');
 assert.match(html,/>Production</);assert.match(html,/<label[^>]*for="material-navigation">Material<\/label>/);
 assert.match(html,/<select id="material-navigation">/);assert.match(main,/library==='material'/);
 for(const file of ['registry/index.json','registry/references.json'])assert.doesNotMatch(await read(file),/lacouture/);
 assert.match(html,/data-attribution-link>Attribution/);assert.doesNotMatch(html,/Static release scope and attribution|Independent design studies/);
 assert.match(main,/library === 'references' \? 'Independent design studies/);
 const material=await read('apps/studio/material.mjs');assert.doesNotMatch(material,/<iframe|createElement\('iframe'\)|fetch\(material.translationURL/);
});
test('only verified public commit identifiers survive display and public-output redaction',()=>{
 const unknown='0123456789abcdef0123456789abcdef01234567';
 const sha256='0123456789abcdef'.repeat(4);
 const input={source:{revision:unknown},nested:[{baseRevision:unknown,link:'https://example.com/'+unknown}],sha256};
 const output=publicSourceMetadata(input);
 assert.equal(output.source.revision,null);assert.deepEqual(output.source.withheldRevisions,['revision']);assert.equal(output.nested[0].baseRevision,null);assert.equal(output.sha256,sha256);assert.equal(input.source.revision,unknown);
 for(const revision of Object.keys(PUBLIC_SOURCE_REVISIONS))assert.equal(redactUnverifiedRevisions(revision),revision);
 assert.doesNotMatch(JSON.stringify(output),new RegExp('\\b'+unknown+'\\b'));
});
test('public packaging keeps attribution reachable and excludes private app snapshot directories',async()=>{
 const source=await read('tooling/public-release.mjs');
 assert.doesNotMatch(source,/Static release scope and attribution/);assert.match(source,/data-attribution-link/);
 assert.match(source,/redactUnverifiedRevisions\(original\)/);assert.match(source,/source:publicSourceMetadata\(sources\)/);
 assert.match(source,/reads\|bandit/);assert.match(source,/publicRegistry.collections.filter/);
 assert.match(await read('tooling/build.mjs'),/'LICENSE','LICENSING.md','THIRD_PARTY_NOTICES.md'/);
});

test('redacted collections and inventories retain valid explicit public provenance',async()=>{
 const {validateCollection,validateInventory}=await import('../packages/tokens/index.mjs');
 for(const id of ['focus','great-circle','stethem','reads','bandit']){
  const collection=JSON.parse(publicMetadataJSON(await read(`registry/apps/${id}/collection.json`)));
  const inventory=JSON.parse(publicMetadataJSON(await read(`registry/apps/${id}/inventory.json`)));
  assert.deepEqual(validateCollection(collection),[]);assert.deepEqual(validateInventory(inventory,collection),[]);
  if(inventory.reviewedRevision===null){assert.ok(inventory.withheldRevisions.includes('reviewedRevision'));assert.ok(validateInventory({...inventory,withheldRevisions:[]},collection).length);}
  const tokens=await read(`registry/apps/${id}/tokens.json`);assert.equal(publicMetadataJSON(tokens),tokens);
 }
 const own=publicSourceMetadata(JSON.parse(await read('collections/original/workbench/collection.json')));assert.deepEqual(validateCollection(own),[]);assert.equal(own.source.revision,null);
});

test('public version helper requires an explicit package version and withholds commit fields',()=>{
 const revision=Object.keys(PUBLIC_SOURCE_REVISIONS)[0];const original={source:{repository:'https://example.com',revision},registrySnapshot:{baseRevision:revision}};
 const output=publicVersionMetadata(original,'0.1.0');assert.equal(output.source.publicVersion,'0.1.0');assert.equal(output.source.revision,null);assert.equal(output.registrySnapshot.baseRevision,null);assert.equal(original.source.revision,revision);
 for(const bad of [undefined,'','latest','1.0','<script>'])assert.throws(()=>publicVersionMetadata(original,bad));
});

test('public metadata sanitizer preserves JSON schema property definitions',()=>{const schema={properties:{withheldRevisions:{type:'array',items:{type:'string'}}}};assert.deepEqual(publicSourceMetadata(schema),schema);assert.equal(publicMetadataJSON(JSON.stringify(schema)),JSON.stringify(schema));});

test('responsive scan derivatives and all existing translation assets retain verified hashes',async()=>{
 const manifest=JSON.parse(await read('collections/material/lacouture-1890/manifest.json'));
 const bytes=async file=>readFile(new URL('../collections/material/lacouture-1890/'+file,import.meta.url));
 const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
 for(const item of manifest.items){
  assert.deepEqual(item.previews.map(p=>p.height),[750,1500]);
  for(const p of item.previews){const b=await bytes(p.file);assert.equal(b.length,p.bytes);assert.equal(hash(b),p.sha256);assert.ok(Math.abs(p.width-item.width*p.height/item.height)<=1);}
  if(item.group==='plate'){assert.equal(hash(await bytes(item.svg)),item.svgSha256);assert.ok(item.swatchCount>0);}else assert.equal(item.svg,undefined);
 }
 assert.equal(manifest.translation.assets.filter(a=>a.file.endsWith('.svg')).length,29);
 for(const asset of manifest.translation.assets){const b=await bytes(asset.file);assert.equal(hash(b),asset.sha256);assert.equal(b.length,asset.bytes);if(asset.file.endsWith('.svg')){const svg=b.toString();assert.doesNotMatch(svg,/<(?:script|foreignObject|image|animate)\b|\son\w+=|@import|url\([^#]/i);assert.match(svg,/Getty Research Institute/);assert.match(svg,/approximate|not calibrated/i);}}
 assert.equal(manifest.items.reduce((sum,item)=>sum+(item.swatchCount||0),0),1695);
});

test('Material deep links normalize old panel mode and invalid values without inventing translations',async()=>{
 const {materialSelection,materialView}=await import('../apps/studio/material.mjs');
 const m={items:[{id:'plate-i'},{id:'title-page'}]};
 assert.deepEqual(materialSelection(m,'https://example.test/?panel=title-page&view=translation'),{index:1,view:'translation'});
 assert.deepEqual(materialSelection(m,'https://example.test/?panel=missing&view=other'),{index:0,view:'original'});
 assert.equal(materialView('panels'),'original');assert.equal(materialView('compare'),'compare');
});


test('comparison coordinates use the current page rectangle and clamp at both edges', async()=>{
 const {materialRevealPercent}=await import('../apps/studio/material.mjs');
 assert.equal(materialRevealPercent(350,100,500),50);
 assert.equal(materialRevealPercent(400,100,1000),30);
 assert.equal(materialRevealPercent(-100,100,500),0);
 assert.equal(materialRevealPercent(900,100,500),100);
 assert.equal(materialRevealPercent(100,100,0),50);
 assert.equal(materialRevealPercent(100,-200,600),50);
});

test('Compare uses aligned source and translation layers without modifying source assets',async()=>{
 const code=await read('apps/studio/material.mjs'),css=await read('apps/studio/material.css');
 assert.match(code,/\['translation','original'\]/);
 assert.match(css,/clip-path:inset\(var\(--compare-y,50%\) 0 0 var\(--compare-x,50%\)\)/);
 assert.match(code,/role: 'button'/);assert.match(code,/two-axis comparison control/);
 assert.match(code,/const reveal = \{ x: 0, y: 0 \}/);
 assert.doesNotMatch(code,/Fit artwork shows the color study|Web geometry is approximate|material-compare-label/);
 assert.match(code,/pointercancel/);assert.match(code,/lostpointercapture/);
 assert.doesNotMatch(code,/data-stacked|translation sits below/);
});

test('Material artwork framing uses exact page coordinates and honest scan-pixel zoom',async()=>{
 const {materialArtworkBounds,materialFraming}=await import('../apps/studio/material-framing.mjs');
 const manifest=JSON.parse(await read('collections/material/lacouture-1890/manifest.json'));
 assert.deepEqual(Object.keys(materialArtworkBounds),manifest.items.filter(i=>i.svg).map(i=>i.id));
 for(const item of manifest.items){
  const page=materialFraming(item,'1',800,600),art=materialFraming(item,'artwork',800,600);
  assert.ok(page.width<=800&&page.width/item.width*item.height<=600.00001);
  assert.ok(Math.abs(materialFraming(item,'width',800,600).width-800)<1e-9);
  assert.equal(materialFraming(item,'actual',800,600).width,item.width);
  assert.equal(materialFraming(item,'2',800,600).width,item.width*2);
  assert.ok(art.width>=page.width);
  if(item.svg){const [x1,y1,x2,y2]=materialArtworkBounds[item.id];assert.ok(x1>=0&&x1<x2&&x2<=item.width&&y1>=0&&y1<y2&&y2<=item.height);assert.deepEqual(art.center,[(x1+x2)/2/item.width,(y1+y2)/2/item.height]);}
  else assert.deepEqual(art,page);
 }
});

test('reviewed chart registration improves all 21 pinned frame landmarks without touching source assets',async()=>{
 const {materialChartRegistration}=await import('../apps/studio/material-registration.mjs');
 const manifest=JSON.parse(await read('collections/material/lacouture-1890/manifest.json'));
 const landmarks=JSON.parse(await read('tests/fixtures/material-frame-landmarks.json'));
 assert.deepEqual(Object.keys(materialChartRegistration),manifest.items.slice(2,23).map(i=>i.id));
 for(const item of landmarks){
  const source=manifest.items.find(i=>i.id===item.id),c=materialChartRegistration[item.id];
  assert.equal(c.svgSha256,source.svgSha256);assert.equal(item.scanSha256,source.sha256);
  const angle=c.rotation*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  const before=item.svgFrame.map(([x,y],i)=>Math.hypot(x-item.scanFrame[i][0],y-item.scanFrame[i][1]));
  const after=item.svgFrame.map(([x,y],i)=>{const dx=x-c.center[0],dy=y-c.center[1];return Math.hypot(c.center[0]+c.translate[0]+c.scale*(cos*dx-sin*dy)-item.scanFrame[i][0],c.center[1]+c.translate[1]+c.scale*(sin*dx+cos*dy)-item.scanFrame[i][1]);});
  assert.ok(after.reduce((a,b)=>a+b)<before.reduce((a,b)=>a+b)/3,item.id);assert.ok(Math.max(...after)<3.6,item.id);
 }
});


test('Material index has distinct routes without breaking legacy viewer links',async()=>{
 const {materialIsIndex,materialPageURL}=await import('../apps/studio/material.mjs');
 assert.equal(materialIsIndex('https://example.test/?library=material'),true);
 assert.equal(materialIsIndex('https://example.test/?library=material&view=index'),true);
 for(const query of ['panel=plate-i','panel=missing','view=compare','view=translation','view=panels','view=original'])assert.equal(materialIsIndex('https://example.test/?'+query),false);
 const manifest=JSON.parse(await read('collections/material/lacouture-1890/manifest.json'));
 const urls=manifest.items.map(item=>new URL(materialPageURL('https://example.test/?collection=old&section=sources&panel=old&view=compare',item)));
 assert.equal(new Set(urls.map(url=>url.href)).size,39);
 urls.forEach((url,index)=>{assert.equal(url.searchParams.get('panel'),manifest.items[index].id);assert.equal(url.searchParams.get('view'),manifest.items[index].svg?'translation':null);assert.equal(url.searchParams.has('collection'),false);assert.equal(url.searchParams.has('section'),false);});
 assert.equal(materialPageURL('https://example.test/?panel=plate-i&view=compare'),'https://example.test/?library=material');
});
