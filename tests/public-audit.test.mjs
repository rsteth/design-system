import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {auditPublicRelease} from '../tooling/audit-public-release.mjs';
async function fixture(t,text){
 const dir=await mkdtemp(join(tmpdir(),'public-audit-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 await mkdir(join(dir,'registry/apps'),{recursive:true});
 const artifacts=[];
 for(const [path,content] of [['index.html',text],['registry/index.json',JSON.stringify({schemaVersion:1,collections:[]})]]){const bytes=Buffer.from(content);await writeFile(join(dir,path),bytes);artifacts.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
 await writeFile(join(dir,'release.json'),JSON.stringify({licenseGaps:[],artifacts}));return dir;
}
test('public audit verifies a bounded candidate without claiming full security certification',async t=>{const result=await auditPublicRelease(await fixture(t,'<h1>Synthetic preview</h1>'));assert.equal(result.status,'passed');assert.ok(result.limitations.length);});
test('public audit detects tampering and unexpected files',async t=>{const dir=await fixture(t,'ok');await writeFile(join(dir,'index.html'),'changed');await writeFile(join(dir,'.env.local'),'EXAMPLE=synthetic');const result=await auditPublicRelease(dir);assert.equal(result.status,'blocked');assert.ok(result.findings.some(f=>f.issue.includes('integrity')));assert.ok(result.findings.some(f=>f.issue==='Prohibited file or directory'));});
test('public audit flags non-public revisions and local paths without reporting credential values',async t=>{const unknown='f'.repeat(40),key='ghp_'+'A'.repeat(30);const result=await auditPublicRelease(await fixture(t,unknown+' /Users/example/private '+key));assert.equal(result.status,'blocked');assert.ok(result.findings.some(f=>f.issue==='Non-public revision identifier'));assert.ok(result.findings.some(f=>f.issue==='Local filesystem path'));assert.ok(result.findings.some(f=>f.issue.startsWith('Possible credential')));assert.ok(!JSON.stringify(result).includes(key));});

test('public audit rejects deferred projects and local coverage data',async t=>{
 const dir=await fixture(t,'safe');await mkdir(join(dir,'registry/apps/deferred-example'));
 await writeFile(join(dir,'registry/index.json'),JSON.stringify({schemaVersion:1,projectCoverage:'projects.local.json',collections:['apps/deferred-example/collection.json']}));
 await writeFile(join(dir,'registry/projects.local.json'),'{}');
 const result=await auditPublicRelease(dir);assert.equal(result.status,'blocked');
 for(const issue of ['Unapproved project catalog','Unapproved project registration','Local project directory is not approved for publication','Local coverage data is not approved for publication'])assert.ok(result.findings.some(f=>f.issue===issue),issue);
});
