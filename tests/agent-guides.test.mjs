import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateGuides,assertPublicGuide,directionMarkdown,guideNotes} from '../tooling/agent-guides.mjs';

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
test('a direction block leads the generated guide, ahead of the token table',async t=>{
 assert.equal(directionMarkdown(undefined),'');assert.equal(directionMarkdown({}),'');
 const text=directionMarkdown({product:'Reads a letter aloud.',character:'hushed, careful',moments:['the listener','the finished listen'],voice:['Say what will happen.']});
 assert.match(text,/^## Direction\n\n- \*\*Product:\*\* Reads a letter aloud\.\n- \*\*Character:\*\* hushed, careful\n- \*\*Moments:\*\* the listener; the finished listen\n/);assert.match(text,/## Voice\n\n- Say what will happen\.\n/);assert.doesNotMatch(text,/World|Signature/);
 const root=await mkdtemp(join(tmpdir(),'agent-guides-direction-'));t.after(()=>rm(root,{recursive:true,force:true}));
 for(const dir of ['registry/apps/example','apps/studio','templates/blank','docs/process'])await mkdir(join(root,dir),{recursive:true});
 for(const file of ['templates/blank/README.md','docs/process/capture-studio.md'])await writeFile(join(root,file),'Guide');
 const save=async(path,value)=>writeFile(join(root,path),JSON.stringify(value));
 await save('registry/index.json',{collections:['apps/example/collection.json']});await save('registry/references.json',{collections:[]});
 await save('registry/apps/example/collection.json',{id:'example',title:'Example',kind:'app',schemaVersion:1,themes:['dark'],tokens:'tokens.json',direction:{product:'Reads a letter aloud.',signature:'A slow sway.'},fixtures:[]});
 await save('registry/apps/example/tokens.json',{modes:[{id:'dark',tokens:{'color.text':{type:'color',value:'#fff'}}}]});
 await generateGuides({root,write:true});const guide=await readFile(join(root,'registry/guides/example/design-system.md'),'utf8');
 assert.ok(guide.indexOf('## Direction')>0&&guide.indexOf('## Direction')<guide.indexOf('## Tokens'));assert.match(guide,/\*\*Signature:\*\* A slow sway\./);
});
test('every guide takes one path: direction, app notes, then generated tables',async t=>{
 assert.equal(guideNotes(undefined),'');assert.equal(guideNotes('# Title\n\nProse.\n'),'Prose.\n\n');
 assert.throws(()=>guideNotes('# T\n\n| a | b |\n| --- | --- |\n'),/prose only/);assert.throws(()=>guideNotes('# T\n\n## Tokens\n'),/generated section/);
 assert.match(directionMarkdown({},'none'),/Not written yet/);assert.match(directionMarkdown({product:'A line.'},'draft'),/Draft, not yet reviewed/);assert.match(directionMarkdown({product:'A line.'},'analysis'),/not a statement by the brand/);
 const root=await mkdtemp(join(tmpdir(),'agent-guides-path-'));t.after(()=>rm(root,{recursive:true,force:true}));
 for(const dir of ['registry/apps/example','collections/reference/study','apps/studio','templates/blank','docs/process'])await mkdir(join(root,dir),{recursive:true});
 for(const file of ['templates/blank/README.md','docs/process/capture-studio.md'])await writeFile(join(root,file),'Guide');
 const save=async(path,value)=>writeFile(join(root,path),JSON.stringify(value));
 await save('registry/index.json',{collections:['apps/example/collection.json']});await save('registry/references.json',{collections:['../collections/reference/study/collection.json']});
 await save('registry/apps/example/collection.json',{id:'example',title:'Example',summary:'Shows one thing. And another.',kind:'app',schemaVersion:1,themes:['dark'],tokens:'tokens.json',fixtures:[]});
 await save('registry/apps/example/tokens.json',{modes:[{id:'dark',tokens:{'color.text':{type:'color',value:'#fff'}}}]});
 await writeFile(join(root,'registry/apps/example/public-guide.md'),'# Example\n\nNotes from the app.\n');
 await save('collections/reference/study/collection.json',{id:'reference-study',title:'Study',summary:'Independent unverified reference',kind:'reference',schemaVersion:1,themes:['analysis'],tokens:'tokens.json',study:'study.json',fixtures:[]});
 await save('collections/reference/study/tokens.json',{modes:[{id:'analysis',tokens:{}}]});await save('collections/reference/study/study.json',{description:'A **calm** editorial canvas. More detail follows.'});
 await generateGuides({root,write:true});
 const app=await readFile(join(root,'registry/guides/example/design-system.md'),'utf8'),study=await readFile(join(root,'registry/guides/reference-study/design-system.md'),'utf8');
 assert.match(app,/^# Example design system\n\n## Direction\n\n- \*\*Product:\*\* Shows one thing\.\n\nOne line taken from the collection summary/);
 assert.ok(app.indexOf('Notes from the app.')>app.indexOf('## Direction')&&app.indexOf('Notes from the app.')<app.indexOf('## Tokens'));assert.equal(app.match(/^# /gm).length,1);
 assert.match(study,/Independent unverified reference\.[^]*## Direction\n\n- \*\*Product:\*\* A calm editorial canvas\.\n\nFirst line of the study description/);
});
test('current registry guidance is deterministic and all local links resolve',async()=>{assert.equal((await generateGuides()).guides,92);});
test('public navigation documents do not contain local user paths',async()=>{
 for(const path of ['docs/process/capture-studio.md','templates/blank/README.md'])assert.doesNotMatch(await readFile(new URL('../'+path,import.meta.url),'utf8'),/\/Users\/|\/home\//);
});
