import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolveValue,safeDeclaration,compileStyle,compileSheet,specimenKind} from '../tooling/reference-sheets.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('typed compiler resolves references and rejects cycles, missing/prototype paths and injections',()=>{
 const analysis={colors:{ink:'#121212'},space:'4px',alias:'{space}',a:'{b}',b:'{a}'};
 assert.equal(resolveValue('1px solid {colors.ink}',analysis),'1px solid #121212');assert.equal(resolveValue('{alias}',analysis),'4px');
 for(const value of ['{missing}','{constructor.name}','{a}'])assert.throws(()=>resolveValue(value,analysis));
 for(const key of ['backgroundColor','padding','border','shadow','fontFamily'])for(const value of ['url(https://bad.test)','1px;color:red','</style>','expression(1)','var(--attack)','@import x','red\\3b background'])assert.equal(safeDeclaration(key,value),null);
 assert.equal(safeDeclaration('position','fixed'),null);assert.equal(safeDeclaration('width','12'),null);assert.equal(safeDeclaration('width','0')[1],'0');
 assert.deepEqual(safeDeclaration('fontFamily','Proprietary Sans'),['font-family','system-ui, sans-serif']);
 const result=compileStyle({backgroundColor:'{colors.ink}',bad:'x',width:'{missing}'},analysis);assert.equal(result.style,'background-color:#121212');assert.equal(result.rows.length,3);assert.match(result.rows[2].status,/Missing reference/);
});
test('all 84 sheets exist, preserve source hashes, avoid assets/embedding, and register separately',async()=>{
 const report=JSON.parse(await read('collections/reference-sheets/report.json'));assert.equal(report.studies.length,84);assert.equal(report.studies.filter(s=>s.normalization==='manual-prose').length,10);assert.equal(report.studies.reduce((n,s)=>n+s.recipeCount,0),2135);
 for(const row of report.studies){const slug=row.id.replace(/^reference-/,'');const study=JSON.parse(await read(`collections/reference/${slug}/study.json`));const html=await read(`collections/reference-sheets/${slug}/index.html`);assert.equal(row.sourceSha256,study.source.sha256);assert.ok(html.includes(study.source.sha256));assert.match(html,/Unofficial, unverified and incomplete/);assert.doesNotMatch(html,/<iframe|<img|@font-face|<form/);assert.equal((html.match(/class="recipe"/g)??[]).length,row.recipeCount);assert.ok(row.recipeCount>0);for(const recipe of row.recipes)assert.ok(recipe.line>0,`${slug}/${recipe.name} evidence`);}
});
test('manual prose normalization is separately hash locked and completely line linked',async()=>{
 const data=JSON.parse(await read('tooling/reference-prose-normalizations.json'));assert.equal(Object.keys(data.studies).length,10);
 for(const [slug,normalization]of Object.entries(data.studies)){const raw=await read(`collections/reference/${slug}/DESIGN.md`);assert.equal(normalization.sourceSha256,createHash('sha256').update(raw).digest('hex'));const lines=raw.split('\n');for(const [path,ev]of Object.entries(normalization.evidence)){assert.ok(Number.isInteger(ev.line)&&ev.line>0&&ev.line<=lines.length,path);assert.ok(lines[ev.line-1].trim(),path);}const original=JSON.parse(await read(`collections/reference/${slug}/study.json`));assert.deepEqual(original.analysis,{});}
});
test('hostile text stays escaped, assets remain placeholders, stale normalization fails closed',()=>{
 const study={id:'reference-test',title:'<script>alert(1)</script>',source:{url:'https://example.test/source',revision:'test',sha256:'abc'},analysis:{components:{'logo-example':{backgroundColor:'url(https://bad.test)'},'button-x':{textColor:'</style><script>alert(1)</script>'}}}};
 const {html}=compileSheet(study);assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('Asset withheld'));assert.doesNotMatch(html,/<script>alert|style="[^\"]*url\(/);assert.equal(specimenKind('logo-example'),'surface');assert.throws(()=>compileSheet(study,{}, {sourceSha256:'wrong'}),/hash mismatch/);
});

test('semantic classification keeps tables and controls despite misleading asset substrings',()=>{
 for(const name of ['research-table','comparison-table','data-table'])assert.equal(specimenKind(name),'table');
 for(const name of ['button-outline-on-image','button-pill-on-image','button-icon-circular'])assert.equal(specimenKind(name),'button');
 assert.equal(specimenKind('image-card'),'card');assert.equal(specimenKind('search-input'),'field');assert.equal(specimenKind('tab-active'),'navigation');
});

test('24 recoveries are hash locked, quote exact supporting prose, and leave ten unresolved',async()=>{
 const recoveries=JSON.parse(await read('tooling/reference-source-recoveries.json'));
 let count=0;
 for(const [slug,entry]of Object.entries(recoveries.studies)){
  const study=JSON.parse(await read(`collections/reference/${slug}/study.json`));const raw=await read(`collections/reference/${slug}/DESIGN.md`);assert.equal(entry.sourceSha256,study.source.sha256);
  for(const [path,recovery]of Object.entries(entry.recoveries)){const [category,name,key]=path.split('.');assert.equal(category,'components');assert.deepEqual(study.analysis.components[name][key],recovery.original);assert.equal(raw.split('\n')[recovery.supportingLine-1],recovery.supportingText);assert.equal(recovery.classification,'secondary-source-recovery');assert.ok(recovery.supportingText.includes(key==='border'?'bottom border':'px'));count++;}
 }
 assert.equal(count,24);
 const report=JSON.parse(await read('collections/reference-sheets/report.json'));assert.equal(report.studies.reduce((n,s)=>n+s.recoveredProperties,0),24);assert.equal(report.studies.reduce((n,s)=>n+s.unsupportedProperties,0),10);
 const recovery={original:60,property:'height',value:'60px',supportingLine:1};
 assert.equal(compileStyle({height:60},{},{},'components.nav',{'components.nav.height':recovery}).style,'height:60px');
 assert.throws(()=>compileStyle({height:61},{},{},'components.nav',{'components.nav.height':recovery}),/source value mismatch/);
 assert.throws(()=>compileStyle({height:60},{},{},'components.nav',{'components.nav.height':{...recovery,value:'url(https://bad.test)'}}),/Unsafe recovery/);
});
