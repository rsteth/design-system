import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {VERSION} from '../../packages/workbench/index.mjs';
const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');
test('studio shows the actual package version and Robin while preserving stable routing',async()=>{
 const metadata=JSON.parse(await read('package.json'));
 assert.equal(VERSION,metadata.version,'Studio version must match the design-system package');
 const html=await read('apps/studio/index.html'),main=await read('apps/studio/main.mjs');
 assert.match(html,/Design system <span class="studio-version" data-design-system-version>/);
 assert.match(main,/\[data-design-system-version\]'\)\.textContent = VERSION/);
 assert.match(html,/data-library="own"[^>]*>Robin<\/button>/);
 assert.match(main,/\? 'Reference examples' : 'Robin'/);
 assert.match(main,/: 'own';/);
 assert.doesNotMatch(html+main,/Own work|Own workbenches|App-owned interfaces and the workbench\. Application appearance is unchanged/);
});
test('every shared engine removes its version subtitle, including skin changes and starter copies',async()=>{
 const engine=await read('packages/workbench/index.mjs');
 assert.doesNotMatch(engine,/Engine \$\{VERSION\}|wb-brand small/);
 assert.equal(await read('templates/blank/vendor/workbench/index.mjs'),engine);
 assert.match(engine,/export const VERSION =/);
});
