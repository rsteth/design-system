import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProjectCoverage,projectFixtures,projectSearchText} from '../apps/studio/project-coverage.mjs';
import {PUBLIC_APP_IDS,publicRegistryEntry,publicSourcePath,publicRegistry} from '../tooling/public-collection-scope.mjs';
const catalog={schemaVersion:1,scope:'A source map, not a completeness assertion.',projects:[{id:'one',title:'One',category:'Tools',notes:'Real source.',status:'local-only'},{id:'two',title:'Two',category:'Tools',notes:'Adapter needed.',status:'not-yet-catalogued'}],excluded:[{title:'Duplicate',reason:'Another checkout.'}]};
test('source audit is explicit about incomplete, private and duplicate work',()=>{
 assert.deepEqual(validateProjectCoverage(catalog),[]);
 assert.ok(catalog.projects.some(p=>p.status==='local-only'));
 assert.ok(catalog.projects.some(p=>p.status==='not-yet-catalogued'));
 assert.ok(catalog.excluded.length);
 assert.match(catalog.scope,/not a completeness/);
});
test('project views count actual matching registrations, never invented components',()=>{
 const project={collection:'site',fixturePrefixes:['learning-']};
 const collections=[{id:'site',fixtures:[{id:'learning-index'},{id:'portfolio'}]}];
 assert.deepEqual(projectFixtures(project,collections),[{id:'learning-index'}]);
 assert.deepEqual(projectFixtures({collection:'missing'},collections),[]);
 assert.equal(projectFixtures({collection:'site'},collections).length,2);
});
test('coverage schema rejects duplicate ids and unsafe collection identifiers',()=>{
 assert.ok(validateProjectCoverage({...catalog,projects:[catalog.projects[0],catalog.projects[0]]}).length);
 assert.ok(validateProjectCoverage({...catalog,projects:[{...catalog.projects[0],collection:'../private'}]}).length);
});
test('local catalog additions cannot silently expand public publication scope',()=>{
 assert.equal(PUBLIC_APP_IDS.length,5);
 for(const id of ['private-example','new-example','unapproved']){
  assert.equal(publicSourcePath(`registry/apps/${id}/collection.json`),false);
  assert.equal(publicRegistryEntry(`apps/${id}/collection.json`),false);
 }
 assert.equal(publicSourcePath('registry/projects.local.json'),false);
 assert.equal(publicSourcePath('docs/local/audit.md'),false);
 assert.equal(publicSourcePath('packages/workbench/index.mjs'),true);
 assert.equal(publicRegistryEntry('apps/reads/collection.json',{includeAppPreviews:false}),false);
 const source={schemaVersion:1,projectCoverage:'projects.local.json',collections:['../collections/original/workbench/collection.json','apps/focus/collection.json','apps/private-example/collection.json']};
 assert.deepEqual(publicRegistry(source),{schemaVersion:1,collections:['../collections/original/workbench/collection.json','apps/focus/collection.json']});
 assert.equal(source.collections.length,3);
});

test('project search includes registered component titles, ids and states',()=>{const project={title:'Example',category:'Tools',notes:'Source UI',gaps:['Unrepresented state'],collection:'demo'};const collections=[{id:'demo',fixtures:[{id:'unique-fixture',title:'Needle component',states:['invalid-value']}]}];const haystack=projectSearchText(project,collections);for(const term of ['needle component','unique-fixture','invalid-value','unrepresented state'])assert.ok(haystack.includes(term));});

test('explicit missing state notes are validated',()=>{assert.ok(validateProjectCoverage({...catalog,projects:[{...catalog.projects[0],gaps:[null]}]}).length);assert.deepEqual(validateProjectCoverage({...catalog,projects:[{...catalog.projects[0],gaps:['Full authenticated chat']}] }),[]);});
