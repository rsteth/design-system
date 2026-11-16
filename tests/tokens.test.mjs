import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTokens,validateTokens,validateCollection,tokenVariable,adviseTokens} from '../packages/tokens/index.mjs';
const tokenDoc=()=>({schemaVersion:1,namespace:'sample',modes:[{id:'light',selector:':root',tokens:{'color.text':{type:'color',value:'#24211f'},'font.body':{type:'fontFamily',value:'"Inter", "Arial", sans-serif'}}},{id:'dark',selector:':root[data-theme="dark"]',tokens:{'color.text':{type:'color',value:'#fff'}}}],aliases:{'--ink':'color.text'}});
const collection=()=>({schemaVersion:1,id:'sample',title:'Sample',kind:'app',renderer:'dom',summary:'Existing app',tokens:'tokens.json',themes:['light','dark'],source:{repository:'https://github.com/rsteth/example',revision:'a'.repeat(40),path:'.'},provenance:{status:'author-owned',sources:[]},license:{spdx:'UNLICENSED',note:'Existing terms apply.'},fixtures:[{id:'button',title:'Actual button',section:'components',url:'http://127.0.0.1:4320/workbench/'}]});
test('contract accepts real app modes and deterministic aliases',()=>{const doc=tokenDoc();assert.deepEqual(validateTokens(doc),[]);const css=compileTokens(doc);assert.match(css,/--ds-color-text: #24211f;/);assert.match(css,/--ink: var\(--ds-color-text\);/);assert.equal(compileTokens(doc),css);});
test('token path names compile predictably',()=>assert.equal(tokenVariable('color.background'),'--ds-color-background'));
test('invalid token path is rejected',()=>{const doc=tokenDoc();doc.modes[0].tokens['bad-name']={type:'color',value:'red'};assert.ok(validateTokens(doc).length);});
test('duplicate mode ids rejected',()=>{const doc=tokenDoc();doc.modes[1].id='light';assert.ok(validateTokens(doc).some(e=>e.includes('duplicate')));});
test('missing alias target rejected',()=>{const doc=tokenDoc();doc.aliases['--missing']='color.absent';assert.throws(()=>compileTokens(doc),/missing/);});
test('CSS declaration escape rejected',()=>{const doc=tokenDoc();doc.modes[0].tokens['color.text'].value='red; background:url(https://evil.test)';assert.throws(()=>compileTokens(doc),/Unsafe/);});
test('CSS selector escape rejected',()=>{const doc=tokenDoc();doc.modes[0].selector=':root {} @import';assert.throws(()=>compileTokens(doc),/selector/);});
test('infinite numbers rejected',()=>{const doc=tokenDoc();doc.modes[0].tokens['motion.scale']={type:'number',value:Infinity};assert.ok(validateTokens(doc).length);});
test('collection records source and provenance',()=>assert.deepEqual(validateCollection(collection()),[]));
test('javascript fixture URL rejected',()=>{const doc=collection();doc.fixtures[0].url='javascript:alert(1)';assert.ok(validateCollection(doc).some(e=>e.includes('Unsafe')));});
test('moving branch source rejected',()=>{const doc=collection();doc.source.revision='main';assert.ok(validateCollection(doc).some(e=>e.includes('Source')));});
test('reference collection requires explicit provenance',()=>{const doc=collection();doc.kind='reference';delete doc.provenance;assert.ok(validateCollection(doc).some(e=>e.includes('provenance')));});

test('study documents are local and remain independent of app collections',()=>{const doc=collection();doc.kind='reference';doc.study='study.json';assert.deepEqual(validateCollection(doc),[]);for(const path of ['../study.json','https://example.com/study.json','/study.json','a%2fb','a\\b']) {doc.study=path;assert.ok(validateCollection(doc).some(e=>e.includes('study')));}doc.study='study.json';doc.kind='app';assert.ok(validateCollection(doc).some(e=>e.includes('reserved')));});

test('direction is optional, public plain text and rejects unknown or oversized fields',()=>{
 const doc=collection();assert.deepEqual(validateCollection(doc),[]);
 doc.direction={product:'Reads a letter aloud in a familiar voice.',character:'hushed, tender, careful',world:'A bedside at night.',moments:['the listener'],signature:'A slow sway.',voice:['Say what will happen.']};assert.deepEqual(validateCollection(doc),[]);
 doc.direction={};assert.deepEqual(validateCollection(doc),[]);
 doc.direction={status:'draft',product:'A drafted line.'};assert.deepEqual(validateCollection(doc),[]);doc.direction={status:'final'};assert.ok(validateCollection(doc).length);
 for(const bad of ['words',{mood:'calm'},{product:''},{product:'<b>bold</b>'},{product:'x'.repeat(401)},{moments:'the listener'},{moments:[]},{voice:['ok',3]},{voice:Array(13).fill('rule')}]){doc.direction=bad;assert.ok(validateCollection(doc).some(error=>error.includes('direction')),JSON.stringify(bad).slice(0,60));}
});
const adviceDoc=tokens=>({schemaVersion:1,namespace:'sample',modes:[{id:'dark',selector:':root',tokens}]});
test('token advice is quiet for a deliberate scale',()=>{
 const tokens={'color.text':{type:'color',value:'#f4f4e9'},'color.text.muted':{type:'color',value:'#bdb1a3'},'color.background':{type:'color',value:'#1d1b1a'},'color.field':{type:'color',value:'#211e1c'},'color.surface':{type:'color',value:'#292522'},'color.surface.raised':{type:'color',value:'#302c29'},'font.body':{type:'fontFamily',value:'Nunito,ui-rounded,system-ui,sans-serif'},'radius.control':{type:'dimension',value:'16px'},'radius.badge':{type:'dimension',value:'12px'},'radius.field':{type:'dimension',value:'12px'}};
 for(const step of [2,4,8,12,16,20,24,28,32,40,48,56,72,80,96])tokens[`space.v${step}px`]={type:'dimension',value:`${step}px`};
 assert.deepEqual(adviseTokens(adviceDoc(tokens)),[]);
});
test('token advice describes recorded literals, near-identical colors and platform-only type',()=>{
 const tokens={'color.text.label':{type:'color',value:'#e7ded2'},'color.text.art':{type:'color',value:'#e9dfd2'},'color.text':{type:'color',value:'#f4f4e9'},'font.body':{type:'fontFamily',value:'ui-rounded,system-ui,sans-serif'},'font.heading':{type:'fontFamily',value:"ui-rounded,'Arial Rounded MT Bold',sans-serif"},'color.secondary':{type:'color',value:'#39312c'},'color.secondary.hover':{type:'color',value:'#3e3630'},'radius.v14px':{type:'dimension',value:'14px'},'font.system':{type:'fontFamily',value:'system-ui,sans-serif'},'font.weight.a':{type:'number',value:400}};
 for(let step=1;step<=17;step++)tokens[`space.v${step}px`]={type:'dimension',value:`${step}px`};
 for(const size of [8,9,10,11,12,13,14,15,16,17,20,21,22])tokens[`font.size.v${size}px`]={type:'dimension',value:`${size}px`};
 tokens['font.tracking.vminus2p3px']={type:'dimension',value:'-2.3px'};
 const notes=adviseTokens(adviceDoc(tokens));
 assert.ok(notes.some(note=>note.startsWith('space has 17 distinct values')&&note.includes('17 are named after their value, for example space.v1px')),notes.join('|'));assert.ok(notes.some(note=>note.startsWith('font.size has 13 distinct values')));
 assert.ok(!notes.some(note=>note.startsWith('font.tracking')));
 assert.ok(notes.some(note=>note.startsWith('1 pair of colors in the same role family are nearly identical, for example color.text.label and color.text.art')));
 assert.equal(notes.filter(note=>note.includes('ui-rounded')).length,1);assert.ok(notes.some(note=>note.startsWith('font.body and font.heading lead with ui-rounded')));assert.ok(!notes.some(note=>note.includes('font.system')));
 assert.ok(!notes.some(note=>note.includes('color.secondary')));
 assert.ok(!notes.some(note=>note.startsWith('radius')||note.startsWith('font.weight')));
});
test('token advice never stands in for validation and labels modes when there are several',()=>{
 assert.deepEqual(adviseTokens({schemaVersion:2}),[]);assert.deepEqual(adviseTokens(null),[]);
 const doc=tokenDoc();doc.modes[0].tokens['font.body']={type:'fontFamily',value:'ui-serif, serif'};
 assert.ok(adviseTokens(doc).some(note=>note.includes('font.body leads with ui-serif (light)')));assert.deepEqual(validateTokens(doc),[]);
});
