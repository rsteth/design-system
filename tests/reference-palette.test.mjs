import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {deriveSheetPalette,paletteContrast} from '../tooling/reference-palette.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('source colors map only inside the sheet and retain evidence',()=>{
 const palette=deriveSheetPalette({colors:{canvas:'#010102',ink:'#f7f8f8','surface-1':'#0f1011',primary:'#5e6ad2'}},{'colors.canvas':{line:8},'colors.primary':{line:3}});
 assert.equal(palette.roles.canvas.value,'#010102');assert.equal(palette.roles.canvas.line,8);assert.equal(palette.roles.accent.value,'#5e6ad2');assert.equal(palette.scheme,'dark');assert.equal(palette.roles.ink.sourcePath,'colors.ink');
 assert.ok(paletteContrast(palette.roles.link.value,palette.roles.surface.value)>=4.5);
 assert.doesNotMatch(palette.style,/--wb-|url\(|[{}<>]/);
});
test('unsafe or absent palette values use disclosed neutral fallback',()=>{
 const palette=deriveSheetPalette({colors:{canvas:'url(https://bad.test)',ink:'#fff;position:fixed',primary:'</style><script>x</script>'}});
 assert.equal(palette.roles.canvas.value,'#ffffff');assert.equal(palette.roles.canvas.sourcePath,null);assert.match(palette.roles.canvas.status,/fallback/);assert.doesNotMatch(palette.style,/url\(|position|script/);
});
test('every generated sheet has independent, readable source-derived palette roles',async()=>{
 const report=JSON.parse(await read('collections/reference-sheets/report.json'));
 for(const sheet of report.studies){
  const {roles}=sheet.sheetPalette;
  assert.ok(roles.canvas.sourcePath,`${sheet.id} canvas source`);
  assert.ok(roles.accent.sourcePath||roles.accent.status.includes('no usable source accent'),`${sheet.id} explicit accent source or fallback`);
  for(const role of ['ink','muted','link'])for(const bg of ['canvas','surface'])assert.ok(paletteContrast(roles[role].value,roles[bg].value)>=4.5,`${sheet.id} ${role}/${bg}`);
  const html=await read(`collections/reference-sheets/${sheet.id.replace(/^reference-/,'')}/index.html`);
  assert.match(html,/Sheet palette mapping/);assert.ok(html.includes(`--sheet-canvas:${roles.canvas.value}`));assert.doesNotMatch(html,/--wb-paper|stethem.css/);
 }
 const stripe=report.studies.find(s=>s.id==='reference-stripe').sheetPalette;
 const linear=report.studies.find(s=>s.id==='reference-linear-app').sheetPalette;
 assert.equal(stripe.roles.canvas.value,'#ffffff');assert.equal(stripe.roles.accent.value,'#533afd');assert.equal(linear.roles.canvas.value,'#010102');assert.equal(linear.roles.accent.value,'#5e6ad2');
});
