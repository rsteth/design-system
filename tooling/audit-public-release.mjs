#!/usr/bin/env node
/** Targeted pre-publication audit. This is not a general secret-detector certification. */
import {readFile,readdir} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PUBLIC_APP_IDS} from './public-collection-scope.mjs';
import {PUBLIC_SOURCE_REVISIONS} from '../apps/studio/public-sources.mjs';
const textExtensions=new Set(['.html','.js','.mjs','.cjs','.json','.css','.md','.txt','.svg','.yml','.yaml']);
const privateFile=/(^|\/)(?:\.git|\.env(?:\.[^/]*)?|\.aws|\.ssh|node_modules|test-results|diagnostics|terraform|cdk\.out)(?:\/|$)|\.(?:map|pem|p12|key)$/i;
const credentialPatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\b(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}\b/,/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,/\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/];
async function walk(root){const out=[];for(const entry of await readdir(root,{withFileTypes:true})){const path=join(root,entry.name);if(entry.isSymbolicLink())throw Error('Symlink in publication candidate: '+path);if(entry.isDirectory())out.push(...await walk(path));else if(entry.isFile())out.push(path);}return out;}
export async function auditPublicRelease(root){
 root=resolve(root);const report=JSON.parse(await readFile(join(root,'release.json'),'utf8'));const expected=new Map(report.artifacts.map(item=>[item.path,item]));const findings=[],all=await walk(root);let textFiles=0;
 const registry=JSON.parse(await readFile(join(root,'registry/index.json'),'utf8'));
 if(registry.projectCoverage)findings.push({path:'registry/index.json',issue:'Local project directory is not approved for publication'});
 for(const app of await readdir(join(root,'registry/apps')))if(!PUBLIC_APP_IDS.includes(app))findings.push({path:'registry/apps/'+app,issue:'Unapproved project catalog'});
 for(const entry of registry.collections){const match=/^apps\/([^/]+)\//.exec(entry);if(match&&!PUBLIC_APP_IDS.includes(match[1]))findings.push({path:'registry/index.json',issue:'Unapproved project registration'});}
 if(report.licenseGaps?.length)findings.push({path:'release.json',issue:'Unresolved dependency license notices'});
 for(const file of all){const path=relative(root,file);if(path==='registry/projects.local.json')findings.push({path,issue:'Local coverage data is not approved for publication'});if(privateFile.test(path))findings.push({path,issue:'Prohibited file or directory'});const bytes=await readFile(file);
  if(path!=='release.json'){const item=expected.get(path);if(!item)findings.push({path,issue:'Unlisted release file'});else{if(item.bytes!==bytes.length||item.sha256!==createHash('sha256').update(bytes).digest('hex'))findings.push({path,issue:'Release manifest integrity mismatch'});expected.delete(path);}}
  if(!textExtensions.has(extname(path)))continue;textFiles++;const text=bytes.toString();
  if(/\/Users\/|\/home\/|file:\/\/\//.test(text))findings.push({path,issue:'Local filesystem path'});
  if(credentialPatterns.some(pattern=>pattern.test(text)))findings.push({path,issue:'Possible credential marker (value intentionally not logged)'});
  if([...text.matchAll(/\b[0-9a-f]{40}\b/gi)].some(([revision])=>!Object.hasOwn(PUBLIC_SOURCE_REVISIONS,revision.toLowerCase())))findings.push({path,issue:'Non-public revision identifier'});
  if(/sourceMappingURL\s*=/.test(text))findings.push({path,issue:'Source map reference'});
 }
 for(const path of expected.keys())findings.push({path,issue:'Manifest file missing'});
 for(const id of ['reads','bandit']){let collection;try{collection=JSON.parse(await readFile(join(root,`registry/apps/${id}/collection.json`),'utf8'));}catch(error){if(error.code==='ENOENT')continue;throw error;}
  if(collection.source?.revision!==null)findings.push({path:`registry/apps/${id}/collection.json`,issue:'Private application revision must be withheld'});
 }
 return {status:findings.length?'blocked':'passed',files:all.length,textFiles,checks:['Approved project scope','Manifest integrity','Credential-pattern scan','Private paths and revision identifiers','No source maps','Dependency notice gaps'],limitations:['Pattern-based static review is not a complete secret-detection certification.','Browser isolation and outbound-network behavior require separate tests.'],findings};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){if(!process.argv[2])throw Error('Usage: node tooling/audit-public-release.mjs /absolute/release-directory');const result=await auditPublicRelease(process.argv[2]);console.log(JSON.stringify(result,null,2));if(result.status!=='passed')process.exitCode=1;}
