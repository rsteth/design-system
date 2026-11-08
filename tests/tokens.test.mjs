import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTokens,validateTokens,validateCollection,tokenVariable} from '../packages/tokens/index.mjs';
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
