import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateGuides,assertPublicGuide} from '../tooling/agent-guides.mjs';

test('public guide screening rejects local identity and credential patterns',()=>{
 for(const text of ['/Users/robin/work','http://127.0.0.1:1234','a'.repeat(40),'-----BEGIN PRIVATE KEY-----'])assert.throws(()=>assertPublicGuide(text));
 assert.doesNotThrow(()=>assertPublicGuide('# Guide\n--ds-color-text: #abcdef;'));
});
test('guide generation uses selected fields, detects drift and checks links',async t=>{
 const root=await mkdtemp(join(tmpdir(),'agent-guides-'));t.after(()=>rm(root,{recursive:true,force:true}));
 for(const dir of ['registry/apps/example','apps/studio','templates/blank','docs/process'])await mkdir(join(root,dir),{recursive:true});
 for(const file of ['templates/blank/README.md','docs/process/capture-studio.md'])await writeFile(join(root,file),'Guide');
 const save=async(path,value)=>writeFile(join(root,path),JSON.stringify(value));
 await save('registry/index.json',{collections:['apps/example/collection.json']});await save('registry/references.json',{collections:[]});
 await save('registry/apps/example/collection.json',{id:'example',title:'Example',kind:'app',schemaVersion:1,themes:['dark'],tokens:'tokens.json',source:{repository:'private',revision:'a'.repeat(40)},fixtures:[{title:'Button',section:'components',states:['idle'],url:'http://127.0.0.1:3'}]});
 await save('registry/apps/example/tokens.json',{modes:[{id:'dark',tokens:{'color.text':{type:'color',value:'#fff'}}}]});
 assert.deepEqual(await generateGuides({root,write:true}),{guides:1,files:2});await generateGuides({root});
 const path=join(root,'registry/guides/example/design-system.md'),guide=await readFile(path,'utf8');assert.match(guide,/--ds-color-text/);assert.doesNotMatch(guide,/private|127\.0\.0\.1|aaaaaa/);
 await writeFile(path,'stale');await assert.rejects(generateGuides({root}),/drift/);await generateGuides({root,write:true});
 await writeFile(join(root,'registry/apps/example/public-guide.md'),'# Guide\n[Broken](missing.md)');await assert.rejects(generateGuides({root,write:true}),/Broken guide link/);
});
test('current registry guidance is deterministic and all local links resolve',async()=>{assert.equal((await generateGuides()).guides,91);});
test('public navigation documents do not contain local user paths',async()=>{
 for(const path of ['docs/process/capture-studio.md','templates/blank/README.md'])assert.doesNotMatch(await readFile(new URL('../'+path,import.meta.url),'utf8'),/\/Users\/|\/home\//);
});
