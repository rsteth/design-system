import {appGuidePath,assertPublicGuide} from './agent-guides.mjs';
/** Offline release preflight. Compares app-owned content, not private Git ancestry. */
import {readFile,realpath} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isLocalPath} from '../packages/tokens/index.mjs';
import {publicSourceMetadata} from '../apps/studio/public-sources.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
// Public exports intentionally withhold revision identities. They do not withhold
// fixture definitions, values, coverage, or the hashes of distributed snapshots.
function comparable(value){
 const clean=value=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>key!=='withheldRevisions').map(([key,child])=>[key,clean(child)])):value;
 return canonical(clean(publicSourceMetadata(value,{withholdAllRevisions:true})));
}
function manifest(value){const {registrySnapshot,...rest}=value;const {publicVersion,...source}=rest.source;return {...rest,source,tokens:'tokens.json',...(rest.inventory?{inventory:'inventory.json'}:{})};}
async function localFile(root,path){
 if(!isLocalPath(path))throw Error('Unsafe snapshot input path.');
 const file=await realpath(join(root,path)),rel=relative(root,file);
 if(rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw Error('Snapshot input escapes its root.');
 return readFile(file);
}
/** No writes, network, app execution, or reliance on public revision identifiers. */
export async function assertRegistryFresh(workspaces,{root=ROOT}={}){
 root=await realpath(root);
 const checked=[],ids=new Set();
 for(const workspace of workspaces){
  const app=await realpath(resolve(workspace)),actual=JSON.parse(await localFile(app,'design/collection.json'));
  const id=actual.id;if(typeof id!=='string'||! /^[a-z0-9-]+$/.test(id)||ids.has(id))throw Error('Invalid or duplicate snapshot app id.');ids.add(id);
  const directory=await realpath(join(root,'registry/apps',id));
  if(!relative(root,directory).startsWith('registry/apps/'))throw Error('Snapshot directory escapes registry.');
  const snapshot=JSON.parse(await localFile(directory,'collection.json'));
  const fail=part=>{throw Error(`App snapshot mismatch: ${id} (${part}); refresh explicitly with tooling/sync-registry.mjs before packaging.`);};
  if(comparable(manifest(actual))!==comparable(manifest(snapshot)))fail('manifest/fixtures');
  const tokens=await localFile(app,`design/${actual.tokens}`),savedTokens=await localFile(directory,snapshot.tokens);
  if(!tokens.equals(savedTokens)||snapshot.registrySnapshot?.tokenSha256!==hash(savedTokens))fail('tokens');
  if(actual.inventory){
   const inventory=await localFile(app,`design/${actual.inventory}`),savedInventory=await localFile(directory,snapshot.inventory);
   if(comparable(JSON.parse(inventory))!==comparable(JSON.parse(savedInventory))||snapshot.registrySnapshot?.inventorySha256!==hash(savedInventory))fail('inventory');
  }else if(snapshot.registrySnapshot?.inventorySha256)fail('unexpected inventory hash');
  const guidePath=appGuidePath(id);
  if(guidePath){
   const current=await localFile(app,guidePath).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
   const saved=await localFile(directory,'public-guide.md').catch(error=>{if(error.code==='ENOENT')return null;throw error;});
   if(current||saved){if(!current||!saved||!current.equals(saved))fail('public guide');assertPublicGuide(saved.toString());}
  }
  checked.push(id);
 }
 return checked;
}
