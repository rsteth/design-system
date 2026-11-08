import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const text=html=>html.replace(/<template\b[^>]*>[\s\S]*?<\/template>/g,'').replace(/<[^>]+>/g,' ');
test('all study summaries are concise while evidence stays in non-rendered metadata',async()=>{
 const report=JSON.parse(await read('collections/reference-sheets/report.json'));assert.equal(report.studies.length,84);
 for(const study of report.studies){
  const slug=study.id.replace(/^reference-/,''),manifest=JSON.parse(await read(`collections/reference/${slug}/collection.json`));assert.equal(manifest.summary,'Independent unverified reference');
  for(const file of ['index.html','patterns.html']){
   const html=await read(`collections/reference-sheets/${slug}/${file}`);assert.ok(html.includes(study.sourceSha256));assert.match(html,/<template class="source-evidence"/);assert.match(html,/Detailed evidence data/);assert.doesNotMatch(text(html),/\b0[1-5] \/ (?:FOUNDATIONS|TYPOGRAPHY|GEOMETRY|COMPONENT|OVERVIEW|SEARCH|EDIT|DATED)/);assert.doesNotMatch(text(html),/(?:Source analysis|Evidence|Supporting prose)\s*·\s*L\d+|source line \d+/i);
  }
  for(const recipe of study.recipes)assert.ok(Number.isInteger(recipe.line)&&recipe.line>0,'Exact recipe lines remain in machine-readable report');
 }
});
test('reference chrome keeps only the requested short copy and original-site action',async()=>{
 const engine=await read('packages/workbench/index.mjs'),studio=await read('apps/studio/main.mjs');
 assert.match(engine,/'Independent reference study'/);assert.match(engine,/'Open original site ↗'/);assert.match(engine,/'data-source-line'/);
 assert.doesNotMatch(engine,/Independent reference study · authored specimens|Theme names describe this study only|Current site identity checked|Independent chrome\. Collection-owned palettes|wb-nav-index/);
 assert.doesNotMatch(studio,/independent studies · Source-derived palettes/);
});
