import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseAnalysis,parsePinnedAnalysis,normalizeTokens,safeToken,homepageCandidates,normalizeSpecimenRoute,generate,REVISION} from '../tooling/import-references.mjs';
import {validateCollection,validateTokens} from '../packages/tokens/index.mjs';
test('safe YAML supports nested mappings, arrays, inline structures and multiline strings',()=>{
 const r=parseAnalysis('---\nname: Study\ncolors: {primary: "#aabbcc"}\ncomponents:\n  card:\n    states: [hover, focus]\n    children:\n      - name: badge\n        values: {size: 4}\ndescription: |\n  First line\n  Second line\n---\n# Body');
 assert.equal(r.analysis.components.card.children[0].values.size,4);assert.deepEqual(r.analysis.components.card.states,['hover','focus']);assert.match(r.analysis.description,/First line\nSecond line/);assert.equal(r.evidence['colors.primary'].line,3);
});
test('malformed and hostile YAML fails closed',()=>{
 for(const yaml of ['name: a\nname: b','name: !custom test','a: &x [1]\nb: *x','__proto__: {polluted: true}','a: {constructor: x}','a: [unterminated','description: prose: invalid','? [a,b]\n: value'])assert.throws(()=>parseAnalysis(`---\n${yaml}\n---\n`));
 assert.throws(()=>parseAnalysis('---\nname: x'));assert.throws(()=>parseAnalysis('---\n- array\n---'));assert.equal({}.polluted,undefined);
});
test('three pinned source repairs preserve exact text and provenance',async()=>{
 for(const slug of ['elevenlabs','raycast','supabase']){
  const raw=await readFile(new URL(`../collections/reference/${slug}/DESIGN.md`,import.meta.url),'utf8');assert.throws(()=>parseAnalysis(raw));const r=parsePinnedAnalysis(raw,slug);assert.equal(r.repairs.length,1);const repair=r.repairs[0];assert.equal(raw.split('\n')[repair.line-1],repair.original);assert.equal(repair.status,'inferred-parser-repair');assert.equal(Object.values(r.analysis).some(v=>v===repair.original.slice(repair.original.indexOf(': ')+2)),true);
 }
 assert.throws(()=>parsePinnedAnalysis('---\ndescription: broken: yaml\n---','other'));
 assert.throws(()=>parsePinnedAnalysis('---\ndescription: broken: yaml\n---','elevenlabs'),/hash mismatch/);
});
test('unsafe and unsupported CSS stays out of generated values',()=>{
 for(const value of ['url(https://bad.test)','1px; color:red','</style>','red\\3b evil','expression(alert(1))','{colors.primary}',null,Infinity,NaN,{},false])assert.equal(safeToken(value,'colors.x'),null);
 const n=normalizeTokens({colors:{'a-b':'#aabbcc',ab:'#ddeeff'},typography:{fontSize:null}}, {}, '');assert.equal(n.tokens.length,2);assert.notEqual(n.tokens[0].path,n.tokens[1].path);assert.equal(n.rejected.length,1);
});
test('prose values carry evidence, no synthesized missing fields or roles',()=>{
 const p=parseAnalysis('# Example\nColor #aabbcc.');assert.deepEqual(p.analysis,{});const n=normalizeTokens(p.analysis,{},'# Example\nColor #aabbcc.');assert.equal(n.tokens[0].path,'reported.color1');assert.equal(n.tokens[0].evidence.line,2);assert.equal(n.tokens[0].status,'unverified');
});
test('homepage extraction is evidence-only and excludes hosted analysis links',()=>{
 assert.deepEqual(homepageCandidates('Brand Name').candidates,[]);assert.equal(homepageCandidates('https://getdesign.io/study https://github.com/a/b javascript:alert(1)').candidates.length,0);const h=homepageCandidates('Read https://example.com/about.');assert.equal(h.candidates[0].url,'https://example.com/about');assert.equal(h.candidates[0].evidence.line,1);assert.equal(h.status,'unverified');
});
test('all 84 independent collections validate with full source identity and notices',async()=>{
 const registry=JSON.parse(await readFile(new URL('../registry/references.json',import.meta.url)));assert.equal(registry.collections.length,85);
 for(const path of registry.collections.filter(path=>!path.includes('/nasa/'))){const url=new URL('../registry/'+path,import.meta.url);const collection=JSON.parse(await readFile(url));assert.deepEqual(validateCollection(collection),[]);assert.equal(collection.kind,'reference');assert.equal(collection.source.revision,REVISION);assert.match(collection.source.sha256,/^[a-f0-9]{64}$/);assert.deepEqual(validateTokens(JSON.parse(await readFile(new URL('tokens.json',url)))),[]);assert.match(await readFile(new URL('LICENSE',url),'utf8'),/Copyright \(c\) 2026 VoltAgent/);const study=JSON.parse(await readFile(new URL('study.json',url)));assert.equal(study.completeness.tokenRoles,'incomplete');assert.equal(study.classification,'independent-unverified-analysis');}
});
test('snapshot regeneration deterministic and check rejects missing, stale and extra files',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'references-'));try{
  assert.equal((await generate({destination:dir})).collections,85);await generate({destination:dir,check:true});
  const file=join(dir,'collections/reference/stripe/tokens.css');await writeFile(file,'stale');await assert.rejects(generate({destination:dir,check:true}),/Stale or missing/);await generate({destination:dir});await rm(file);await assert.rejects(generate({destination:dir,check:true}),/Stale or missing/);await generate({destination:dir});await writeFile(join(dir,'collections/reference/stripe/extra.txt'),'extra');await assert.rejects(generate({destination:dir,check:true}),/Unexpected generated/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('hex CSS colors accept only exact supported lengths',()=>{
 for(const value of ['#abc','#abcd','#aabbcc','#aabbccdd'])assert.equal(safeToken(value,'colors.x').type,'color');
 for(const value of ['#ab','#abcde','#abcdefg','#abcdefa','#aabbccddee'])assert.equal(safeToken(value,'colors.x'),null);
});
test('specimen config routes are confined and mount-relative',()=>{
 const relative=normalizeSpecimenRoute('/collections/reference-specimens/linear.app/index.html?view=components');
 assert.equal(relative,'../../reference-specimens/linear.app/index.html?view=components');
 assert.equal(new URL(relative,'https://example.test/nested/collections/reference/linear-app/collection.json').href,'https://example.test/nested/collections/reference-specimens/linear.app/index.html?view=components');
 for(const route of ['https://evil.test/collections/reference-specimens/a/index.html?view=components','//evil.test/a','/collections/original/a/index.html?view=components','/collections/reference-specimens/../a/index.html?view=components','/collections/reference-specimens/%2e%2e/index.html?view=components','/collections/reference-specimens/a/index.html?view=components&redirect=https://evil.test','/collections/reference-specimens/a/index.html?view=components#bad',null])assert.throws(()=>normalizeSpecimenRoute(route),/Unsafe specimen route/);
});

test('token paths preserve readable names and safely prefix numeric or empty segments',()=>{
 const n=normalizeTokens({colors:{primary:'#aabbcc','500':'#ddeeff','-':'#123456'}},{},'');
 assert.ok(n.tokens.some(t=>t.path==='colors.primary'&&t.sourcePath==='colors.primary'));
 assert.ok(n.tokens.some(t=>t.path==='colors.v500'&&t.sourcePath==='colors.500'));
 assert.ok(n.tokens.some(t=>t.path==='colors.v'&&t.sourcePath==='colors.-'));
});
