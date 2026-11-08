import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadCollections,validateStudy} from '../packages/workbench/index.mjs';
const study={schemaVersion:1,id:'reference-test',title:'Test',sections:[{heading:'Unsafe prose',text:'<script>throw 1</script> [click](javascript:alert(1))',line:9}],tokens:[]};
function fixture(studyData=study) {
 const documents=new Map([['http://localhost/registry.json',{collections:['refs/collection.json']}],['http://localhost/refs/collection.json',{schemaVersion:1,id:'reference-test',title:'Test',kind:'reference',study:'study.json'}],['http://localhost/refs/study.json',studyData]]);
 return async url=>({ok:documents.has(url),status:404,json:async()=>documents.get(url)});
}
test('optional study loads adjacent data with inert prose and empty fixtures',async()=>{
 const [collection]=await loadCollections('http://localhost/registry.json',{fetcher:fixture()});
 assert.deepEqual(collection.studyData,study);assert.deepEqual(collection.fixtures,[]);
});
test('missing optional metadata remains unknown, malformed envelopes reject',async()=>{
 assert.deepEqual(validateStudy({schemaVersion:1,id:'x',title:'X'}),[]);
 for(const value of [null,{}, {...study,schemaVersion:2},{...study,id:4},{...study,sections:[null]},{...study,sections:[{heading:'x',text:{html:'x'}}]},{...study,tokens:[{path:'x',evidence:[]} ]},{...study,homepage:{candidates:[null]}},{...study,limitations:'hi'},{...study,completeness:{missingFields:[1]}},{...study,source:[]},{...study,homepage:{verification:{status:'official'}}}]) {
  assert.ok(validateStudy(value).length);await assert.rejects(loadCollections('http://localhost/registry.json',{fetcher:fixture(value)}),/Invalid study document/);
 }
 await assert.rejects(loadCollections('http://localhost/registry.json',{fetcher:fixture({...study,id:'wrong'})}),/match collection/);
});
test('all 84 references stay separate from default app registry and load valid studies',async()=>{
 const root=new URL('../',import.meta.url);
 const fetcher=async url=>{try{return {ok:true,json:async()=>JSON.parse(await readFile(new URL(new URL(url).pathname.slice(1),root),'utf8'))}}catch{return {ok:false,status:404}}};
 const refs=await loadCollections('http://localhost/registry/references.json',{fetcher});
 const own=await loadCollections('http://localhost/registry/index.json',{fetcher});
 assert.equal(refs.length,84);assert.ok(refs.every(item=>item.kind==='reference'&&item.studyData));
 assert.ok(own.every(item=>item.kind!=='reference'));assert.equal(own.length,JSON.parse(await readFile(new URL('registry/index.json',root),'utf8')).collections.length);
 assert.equal(new Set(refs.map(item=>item.id)).size,84);
});

test('generated reference fixtures keep their mount prefix through loadCollections',async()=>{
 const root=new URL('../',import.meta.url),prefix='/nested/preview/';
 const fetcher=async url=>{
  const requested=new URL(url);assert.ok(requested.pathname.startsWith(prefix));
  const file=new URL(requested.pathname.slice(prefix.length),root);
  try {const text=await readFile(file,'utf8');return {ok:true,json:async()=>JSON.parse(text)};}catch{return {ok:false,status:404};}
 };
 const refs=await loadCollections('https://example.test'+prefix+'registry/references.json',{fetcher});
 const fixtures=refs.flatMap(c=>c.fixtures);assert.equal(fixtures.length,177);
 for(const fixture of fixtures){const url=new URL(fixture.url);assert.equal(url.origin,'https://example.test');assert.ok(url.pathname.startsWith(prefix+'collections/reference-specimens/')||url.pathname.startsWith(prefix+'collections/reference-sheets/'));if(url.pathname.includes('/reference-specimens/'))assert.ok(['components','patterns','screens'].includes(url.searchParams.get('view')));await readFile(new URL(url.pathname.slice(prefix.length),root));}
});
