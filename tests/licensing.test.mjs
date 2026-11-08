import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,readdir,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {installBlueprint} from '../tooling/blueprint.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const text=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const json=async path=>JSON.parse(await text(path));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('MIT covers the original package and workbench without changing application license metadata',async()=>{
 const license=await text('LICENSE');
 assert.match(license,/MIT License/);assert.match(license,/Copyright \(c\) 2026 Robin Stethem/);
 assert.match(license,/Permission is hereby granted, free of charge/);assert.match(license,/THE SOFTWARE IS PROVIDED "AS IS"/);
 assert.equal((await json('package.json')).license,'MIT');assert.equal((await json('package.json')).private,true);
 assert.equal((await json('package-lock.json')).packages[''].license,'MIT');
 assert.equal((await json('collections/original/workbench/collection.json')).license.spdx,'MIT');
 for(const id of ['focus','great-circle','stethem','reads','bandit'])assert.equal((await json('registry/apps/'+id+'/collection.json')).license.spdx,'UNLICENSED',id);
 const scope=await text('LICENSING.md');
 for(const marker of ['registry/apps/','previews/','collections/reference/','trademarks','fonts','images','Public-domain']){
  assert.ok(scope.includes(marker),marker);
 }
 assert.match(scope,/does not relicense Focus, Great Circle, stethem, Reads, Bandit/);
});

test('all upstream MIT notices retain exact pinned bytes and remain distinct from Robin copyright',async()=>{
 const expected=(await json('tooling/reference-sources.json')).licenseSha256;
 const upstream=await text('collections/reference/stripe/LICENSE');
 assert.match(upstream,/Copyright \(c\) 2026 VoltAgent/);
 const dirs=await readdir(new URL('../collections/reference/',import.meta.url),{withFileTypes:true});
 const studies=dirs.filter(x=>x.isDirectory());assert.equal(studies.length,84);
 for(const {name}of studies)assert.equal(hash(await text('collections/reference/'+name+'/LICENSE')),expected,name);
 assert.ok((await text('THIRD_PARTY_NOTICES.md')).includes(upstream),'Full upstream notice accompanies vendored derived tooling');
});

test('direct starter and installed blueprint carry MIT notice and explicit host-app exclusions',async t=>{
 assert.equal(await text('templates/blank/LICENSE'),await text('LICENSE'));
 const target=await realpath(await mkdtemp(join(tmpdir(),'design-license-blueprint-')));t.after(()=>rm(target,{recursive:true,force:true}));
 const result=await installBlueprint(target);
 assert.equal(await readFile(join(result.destination,'LICENSE'),'utf8'),await text('LICENSE'));
 const scope=await readFile(join(result.destination,'LICENSING.md'),'utf8');assert.match(scope,/does not relicense the host application/);
 const lock=JSON.parse(await readFile(join(result.destination,'blueprint-lock.json'),'utf8'));
 for(const file of ['LICENSE','LICENSING.md'])assert.equal(lock.files[file],hash(await readFile(join(result.destination,file))));
});

test('vendored package carries original and upstream notices in its integrity pin',async t=>{
 const target=await mkdtemp(join(tmpdir(),'design-license-vendor-'));t.after(()=>rm(target,{recursive:true,force:true}));
 execFileSync(process.execPath,[join(root,'tooling/sync-consumer.mjs'),target],{cwd:root});
 const vendor=join(target,'vendor/design-system');const pin=JSON.parse(await readFile(join(vendor,'pin.json'),'utf8'));
 for(const file of ['LICENSE','LICENSING.md','THIRD_PARTY_NOTICES.md']){const bytes=await readFile(join(vendor,file));assert.equal(bytes.toString(),await text(file));assert.equal(pin.sha256[file],hash(bytes));}
 execFileSync(process.execPath,[join(root,'tooling/verify-vendor.mjs'),vendor],{cwd:root});
});

test('static and public packagers retain license scope instead of claiming a blanket MIT app grant',async()=>{
 for(const file of ['tooling/build.mjs','tooling/public-release.mjs']){
  const source=await text(file);for(const notice of ["'LICENSE'","'LICENSING.md'","'THIRD_PARTY_NOTICES.md'"])assert.ok(source.includes(notice),file+' '+notice);
 }
 const source=await text('tooling/public-release.mjs');assert.match(source,/Application source, snapshots and packaged app previews retain their own terms/);
 assert.doesNotMatch(source,/No open-source license has been chosen|No original-work redistribution license selected/);
 assert.match(source,/href="LICENSE"/);assert.match(source,/href="LICENSING.md"/);
});
