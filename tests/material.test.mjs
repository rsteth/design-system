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
