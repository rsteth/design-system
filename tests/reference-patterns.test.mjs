import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileSheet} from '../tooling/reference-sheets.mjs';
import {paletteContrast} from '../tooling/reference-palette.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('all 84 studies register the same three original patterns with source tokens and explicit fallbacks',async()=>{
 const report=JSON.parse(await read('collections/reference-sheets/report.json'));let total=0;
 for(const study of report.studies){
  const slug=study.id.replace('reference-',''),html=await read(`collections/reference-sheets/${slug}/patterns.html`),manifest=JSON.parse(await read(`collections/reference/${slug}/collection.json`));
  assert.equal(study.patterns.patternCount,3);total+=study.patterns.patternCount;
  assert.equal(study.patterns.sourceSha256,study.sourceSha256);assert.match(html,/Original illustrative layouts and invented content, not official or copied/);assert.ok(html.includes(study.sourceSha256));
  assert.doesNotMatch(html,/<iframe|<img|@font-face|<form|https?:[^"']+\.(?:js|css)/);
  for(const id of ['overview','browse','preferences'])assert.ok(html.includes(`id="${id}"`));
  for(const role of Object.values(study.patterns.roles))assert.ok(role.status&&role.value);
  assert.ok(paletteContrast(study.sheetPalette.roles.accent.value,study.patterns.roles['on-accent'].value)>=4.5);
  assert.ok(manifest.fixtures.some(f=>f.section==='patterns'&&f.url.endsWith('/patterns.html')));
 }
 assert.equal(total,252);
});
test('pattern values are bounded and source text is escaped without executing styles or markup',()=>{
 const study={id:'reference-test',title:'<script>bad()</script>',source:{url:'https://example.test/source',sha256:'source-hash',revision:'test'},analysis:{rounded:{md:'99999px',lg:'url(https://bad.test)'},spacing:{md:'1px;color:red'},typography:{'body-md':{fontFamily:'</style><script>bad()</script>'}},colors:{primary:'#f60'}}};
 const result=compileSheet(study);assert.equal(result.report.patterns.roles.radius.value,'8px');assert.equal(result.report.patterns.roles.space.value,'16px');assert.equal(result.report.patterns.roles['body-font'].value,'system-ui, sans-serif');assert.doesNotMatch(result.patternsHTML,/<script>bad|url\(https:\/\/bad/);assert.match(result.patternsHTML,/&lt;script&gt;/);
});
