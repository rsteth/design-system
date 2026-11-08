import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');
test('studio and workbench omit decorative marks and their empty badge containers',async()=>{
 const html=await read('apps/studio/index.html'),engine=await read('packages/workbench/index.mjs');
 assert.doesNotMatch(html+engine,/◈|＋|studio-symbol|wb-mark|wb-empty-symbol/);
 assert.doesNotMatch(await read('apps/studio/style.css')+await read('packages/workbench/style.css'),/studio-symbol|wb-mark|wb-empty-symbol/);
 assert.match(html,/>Capture studio<\/button>/);
 assert.match(html,/aria-label="Design system home"/);
 assert.match(engine,/Make room for your system/);
 assert.match(engine,/Open original site ↗/);
 assert.match(engine,/wb-swatch/);
});
