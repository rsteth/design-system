/** Real runner failure atomicity, subset retention and repeat pixel identity. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,lstat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const latest=new URL('../../review/captures/latest.json',import.meta.url);
const beforeBytes=await readFile(latest), before=JSON.parse(beforeBytes);
assert.equal(before.captures.length,28,'Generate full matrix before running this test');
async function capture(args) {
 const child=spawn(process.execPath,['tooling/capture.mjs',...args],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
 return {code,output};
}
const server=createServer((req,res)=>res.end('Wrong server, never capture me'));
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(5196,'127.0.0.1',resolve);});
try {
 const failed=await capture(['--scene','focus-reader','--profile','mobile','--theme','light']);
 assert.notEqual(failed.code,0);assert.match(failed.output,/port|exited/i);
 assert.deepEqual(await readFile(latest),beforeBytes,'A failed run must not change latest');
 await assert.rejects(lstat(new URL('../../review/captures/.capture.lock',import.meta.url)),{code:'ENOENT'});
} finally {await new Promise(resolve=>server.close(resolve));}
const next=await capture(['--scene','focus-reader','--profile','mobile','--theme','light']);
assert.equal(next.code,0,next.output);
const after=JSON.parse(await readFile(latest));assert.equal(after.captures.length,28);
const key=c=>[c.sceneId,c.theme,c.profileId].join('/');
for(const original of before.captures) {
 const fresh=after.captures.find(c=>key(c)===key(original));assert.ok(fresh);
 assert.equal(fresh.original.sha256,original.original.sha256,'Repeated scene pixels must be identical');
 if(key(original)==='focus-reader/light/mobile') {
  assert.notEqual(fresh.original.path,original.original.path);assert.equal(fresh.browser.engine,'chromium');assert.ok(fresh.runnerSources['tooling/capture.mjs']);
 } else assert.deepEqual(fresh,original,'Subset must retain other exports exactly');
}
await assert.rejects(lstat(new URL('../../review/captures/.capture.lock',import.meta.url)),{code:'ENOENT'});
console.log('Runner passed: wrong-port refusal, failed-run latest preservation, cleanup, subset retention and repeat image hash.');
