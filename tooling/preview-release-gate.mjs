/** Mandatory packaged-preview gate. No publishing or source mutation. */
import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {READS_SOURCES} from './public-app-previews.mjs';
import {BANDIT_SOURCES,BANDIT_ASSETS} from './public-bandit-preview.mjs';
import {assertRegistryFresh} from './registry-freshness.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function appSourceFingerprint({readsRoot,banditRoot}) {
 const roots={reads:readsRoot,bandit:banditRoot}, result={};
 for(const id of ['reads','bandit']) {
  const paths=[...(id==='reads'?READS_SOURCES:[...BANDIT_SOURCES,...BANDIT_ASSETS.map(p=>'apps/web/public/'+p)]),'package.json','design/collection.json','design/tokens.json','design/inventory.json'];
  result[id]=Object.fromEntries(await Promise.all([...new Set(paths)].sort().map(async p=>[p,digest(await readFile(join(roots[id],p)))])));
 }
 return result;
}
export function assertSameFingerprint(before,after,label) {assert.deepEqual(after,before,`${label} changed during verification; rebuild the candidate.`);}
export function validatePreviewReport(report,catalogs) {
 assert.equal(report.status,'passed','Preview browser checks must pass.');
 for(const field of ['runtimeErrors','externalRequests','backendRequests','failedResponses'])assert.deepEqual(report[field],[],`Preview ${field} must be empty.`);
 const expected=[];
 for(const [app,fixtures] of Object.entries(catalogs))for(const {id}of fixtures)for(const width of [1440,390])for(const sandbox of [false,true])expected.push(`${app}/${id}/${width}/${sandbox}`);
 const actual=report.results?.map(r=>{assert.equal(r.passed,true);return `${r.app}/${r.fixture}/${r.width}/${r.sandbox}`;});
 assert.deepEqual(actual?.sort(),expected.sort(),'Every fixture needs desktop/mobile, standalone and opaque-frame coverage exactly once.');
 assert.equal(report.cases,expected.length);
 return {status:'passed',cases:expected.length,browser:report.browser};
}
export async function assertBrowserAvailable(module) {
 if(!module)throw Error('Packaged preview release requires PLAYWRIGHT_MODULE pointing to an installed Playwright module.');
 await readFile(resolve(module));
}
async function artifactFingerprint(root) {
 const result={};
 async function walk(path,prefix=''){for(const entry of await readdir(path,{withFileTypes:true})){const name=prefix+entry.name;if(entry.isSymbolicLink())throw Error('Symlink in preview artifact.');if(entry.isDirectory())await walk(join(path,entry.name),name+'/');else result[name]=digest(await readFile(join(path,entry.name)));}}
 await walk(join(root,'previews/reads'),'reads/');await walk(join(root,'previews/bandit'),'bandit/');return result;
}
export async function verifyPackagedPreviews({output,base,readsRoot,banditRoot,sourceFingerprint,playwrightModule=process.env.PLAYWRIGHT_MODULE}) {
 await assertBrowserAvailable(playwrightModule);
 await assertRegistryFresh([readsRoot,banditRoot]);
 assertSameFingerprint(sourceFingerprint,await appSourceFingerprint({readsRoot,banditRoot}),'App source');
 const artifacts=await artifactFingerprint(output),evidence=resolve(output+'-browser-evidence');
 await mkdir(evidence,{recursive:false});
 const env={...process.env,PLAYWRIGHT_MODULE:resolve(playwrightModule),PUBLIC_PREVIEW_ROOT:resolve(output),PUBLIC_PREVIEW_EVIDENCE:evidence,PUBLIC_PREVIEW_BASE:base};
 delete env.PUBLIC_PREVIEW_FIXTURES;
 const run=spawnSync(process.execPath,[join(ROOT,'tests/public-app-previews.browser.mjs')],{cwd:ROOT,env,encoding:'utf8',timeout:600000,maxBuffer:16*1024*1024});
 await writeFile(join(evidence,'runner.log'),(run.stdout||'')+(run.stderr||''));
 if(run.error||run.status!==0)throw Error(`Packaged preview browser gate failed: ${run.error?.message||'exit '+run.status}. See ${evidence}/runner.log`);
 const catalogs=Object.fromEntries(await Promise.all(['reads','bandit'].map(async id=>[id,JSON.parse(await readFile(join(output,'previews',id,'fixture-catalog.json'),'utf8'))])));
 const result=validatePreviewReport(JSON.parse(await readFile(join(evidence,'result.json'),'utf8')),catalogs);
 await assertRegistryFresh([readsRoot,banditRoot]);
 assertSameFingerprint(sourceFingerprint,await appSourceFingerprint({readsRoot,banditRoot}),'App source');
 assertSameFingerprint(artifacts,await artifactFingerprint(output),'Packaged preview');
 return result;
}
