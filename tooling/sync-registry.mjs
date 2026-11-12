#!/usr/bin/env node
import {appGuidePath,assertPublicGuide} from './agent-guides.mjs';
import {readFile,writeFile,mkdir,rename,lstat,realpath} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {validateCollection,validateTokens,validateInventory,isLocalPath} from '../packages/tokens/index.mjs';
import {validateInventoryFiles} from './inventory-files.mjs';
const defaultRoot=fileURLToPath(new URL('../',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
const canonical=value=>JSON.stringify(value,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const withoutSnapshot=({registrySnapshot,...manifest})=>manifest;
async function optionalJSON(path){try{return JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
async function appFile(workspace,path){
 if(!isLocalPath(path))throw new Error(`Unsafe app-owned path: ${path}`);
 const resolved=await realpath(join(workspace,path)),rel=relative(workspace,resolved);
 if(rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw new Error(`App-owned file escapes checkout: ${path}`);
 return readFile(resolved);
}
async function noSymlinks(root,path){
 for(const part of relative(root,path).split('/')){
  root=join(root,part);
  try{if((await lstat(root)).isSymbolicLink())throw new Error(`Registry output must not be a symlink: ${root}`);}
  catch(error){if(error.code!=='ENOENT')throw error;}
 }
}
async function atomicWrite(path,bytes){const temporary=`${path}.${randomUUID()}.tmp`;await writeFile(temporary,bytes,{flag:'wx'});await rename(temporary,path);}
/** Explicit app -> registry refresh. Unmentioned apps are retained; no app files are written. */
export async function syncRegistry(workspaces,{root=defaultRoot,check=false}={}){
 if(!workspaces.length)throw new Error('Provide explicit app checkout paths.');
 root=await realpath(root);
 const indexPath=join(root,'registry/index.json');
 await noSymlinks(root,indexPath);
 const current=await optionalJSON(indexPath)??{schemaVersion:1,collections:[]};
 if(current.schemaVersion!==1||!Array.isArray(current.collections)||current.collections.some(entry=>typeof entry!=='string')||new Set(current.collections).size!==current.collections.length)throw new Error('Invalid registry index; refusing to replace it.');
 const entries=[...current.collections],plans=[],ids=new Set();
 // Prepare and validate the entire requested batch before changing any files.
 for(const workspacePath of workspaces){
  const workspace=await realpath(resolve(workspacePath));
  const manifest=JSON.parse(await appFile(workspace,'design/collection.json'));
  const tokenBytes=await appFile(workspace,`design/${manifest.tokens}`),tokens=JSON.parse(tokenBytes);
  const errors=[...validateCollection(manifest),...validateTokens(tokens)];
  if(manifest.kind!=='app')errors.push('Registry sync accepts app collections only.');
  if(tokens.namespace!==manifest.id)errors.push('Token namespace must match collection id.');
  if(errors.length)throw new Error(errors.join('\n'));
  if(ids.has(manifest.id))throw new Error(`Duplicate app id in requested batch: ${manifest.id}`);
  ids.add(manifest.id);
  let inventoryBytes;
  if(manifest.inventory){
   inventoryBytes=await appFile(workspace,`design/${manifest.inventory}`);
   const inventory=JSON.parse(inventoryBytes),errors=validateInventory(inventory,manifest);
   if(!errors.length)errors.push(...await validateInventoryFiles(inventory,workspace));
   if(errors.length)throw new Error(errors.join('\n'));
  }
  const dest=join(root,'registry/apps',manifest.id);
  for(const name of ['collection.json','tokens.json','inventory.json','public-guide.md'])await noSymlinks(root,join(dest,name));
  const previous=await optionalJSON(join(dest,'collection.json'));
  const normalized={...withoutSnapshot(manifest),tokens:'tokens.json',...(inventoryBytes?{inventory:'inventory.json'}:{})};
  const tokenSha256=hash(tokenBytes),inventorySha256=inventoryBytes?hash(inventoryBytes):undefined;
  const unchanged=previous&&canonical(withoutSnapshot(previous))===canonical(normalized)&&previous.registrySnapshot?.tokenSha256===tokenSha256&&previous.registrySnapshot?.inventorySha256===inventorySha256;
  const priorRevision=unchanged&&previous.registrySnapshot?.integrationRevision;
  const integrationRevision=typeof priorRevision==='string'&&/^[a-f0-9]{40}$/.test(priorRevision)?priorRevision:null;
  const snapshot={...normalized,registrySnapshot:{authority:'App-owned design collection, tokens and optional inventory',baseRevision:manifest.source.revision,...(inventoryBytes?{inventorySha256}:{}),tokenSha256,integrationStatus:integrationRevision?(previous.registrySnapshot.integrationStatus??'unpublished-local-feature-commit'):'unpublished-local-snapshot',integrationRevision}};
  // Preserve byte-for-byte formatting for a semantically unchanged snapshot.
  const snapshotBytes=previous&&canonical(previous)===canonical(snapshot)?await readFile(join(dest,'collection.json')):Buffer.from(json(snapshot));
  let guideBytes; const guidePath=appGuidePath(manifest.id);
  if(guidePath){try{guideBytes=await appFile(workspace,guidePath);assertPublicGuide(guideBytes.toString());}catch(error){if(error.code!=='ENOENT')throw error;}}
  const files=[...(guideBytes?[['public-guide.md',guideBytes]]:[]),['tokens.json',tokenBytes],...(inventoryBytes?[['inventory.json',inventoryBytes]]:[]),['collection.json',snapshotBytes]];
  const entry=`apps/${manifest.id}/collection.json`;if(!entries.includes(entry))entries.push(entry);
  plans.push({dest,files});
 }
 const indexBytes=Buffer.from(json({...current,collections:entries}));
 const changes=[];
 for(const plan of plans)for(const [name,bytes]of plan.files){const path=join(plan.dest,name);let old;try{old=await readFile(path);}catch(error){if(error.code!=='ENOENT')throw error;}if(!old?.equals(bytes))changes.push({path,bytes});}
 if(!(await readFile(indexPath).catch(error=>{if(error.code==='ENOENT')return Buffer.alloc(0);throw error;})).equals(indexBytes))changes.push({path:indexPath,bytes:indexBytes});
 if(!check){for(const {path,bytes}of changes){await mkdir(resolve(path,'..'),{recursive:true});await atomicWrite(path,bytes);}}
 return {apps:plans.length,changed:changes.map(item=>relative(root,item.path)),check};
}
export async function main(args=process.argv.slice(2)){
 if(args.includes('--help')){console.log('Usage: node tooling/sync-registry.mjs [--check] /absolute/app/path [...]\nRefresh only named app snapshots; retain other apps and original collections.\n--check reports drift without writes. No source app, deployment or remote is changed.');return;}
 const unknown=args.find(arg=>arg.startsWith('--')&&arg!=='--check');if(unknown)throw new Error(`Unknown option: ${unknown}`);
 const result=await syncRegistry(args.filter(arg=>arg!=='--check'),{check:args.includes('--check')});
 console.log(`${result.check?'Checked':'Refreshed'} ${result.apps} app-owned registry snapshots; ${result.changed.length} ${result.check?'stale':'changed'} files.`);
 if(result.check&&result.changed.length){console.error(result.changed.join('\n'));process.exitCode=1;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
