#!/usr/bin/env node
import {readFile,writeFile,mkdir,readdir,lstat,realpath,rename,rm} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const sourceRoot=fileURLToPath(new URL('../',import.meta.url));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const within=(root,path)=>{const rel=relative(root,path);return !rel||rel!=='..'&&!rel.startsWith('../')&&!isAbsolute(rel);};
async function filesIn(root,prefix=''){
 const files=[];
 for(const entry of await readdir(join(root,prefix),{withFileTypes:true})){
  const name=prefix+entry.name;
  if(entry.isSymbolicLink())throw new Error(`Blueprint source must not contain symlinks: ${name}`);
  if(entry.isDirectory())files.push(...await filesIn(root,name+'/'));
  else if(entry.isFile())files.push([name,await readFile(join(root,name))]);
  else throw new Error(`Unsupported blueprint source: ${name}`);
 }
 return files;
}
/** Add an empty self-contained workbench; never merge into or replace an existing one. */
export async function installBlueprint(target,{source=sourceRoot,check=false}={}){
 if(!target)throw new Error('Provide an existing target project directory.');
 const requested=resolve(target),actual=await realpath(requested);source=await realpath(source);
 if((await lstat(requested)).isSymbolicLink()||actual!==requested)throw new Error('Target path must be canonical and must not use symlinks.');
 if(!(await lstat(actual)).isDirectory())throw new Error('Target must be an existing project directory.');
 if(within(source,actual)||within(actual,source))throw new Error('Target must be separate from the design-system source checkout.');
 const destination=join(actual,'workbench');
 try{await lstat(destination);throw new Error('Target workbench already exists. Review and adapt it manually; nothing was overwritten.');}catch(error){if(error.code!=='ENOENT')throw error;}
 const files=new Map(await filesIn(join(source,'templates/blank')));
 for(const [name,bytes]of await filesIn(join(source,'blueprints/workbench')))files.set(name,bytes);
 const pin=await sourcePin(source);
 const lock={schemaVersion:1,blueprint:'workbench',blueprintVersion:1,packageVersion:pin.packageVersion,source:'https://github.com/rsteth/design-system',sourceHead:pin.sourceHead,status:pin.status,direction:'app-to-workbench',files:Object.fromEntries([...files].sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>[name,sha256(bytes)]))};
 files.set('blueprint-lock.json',Buffer.from(JSON.stringify(lock,null,2)+'\n'));
 if(!check){
  // Exclusive directory creation and exclusive writes: no force/overwrite mode.
  await mkdir(destination);
  for(const [name,bytes]of files){await mkdir(dirname(join(destination,name)),{recursive:true});await writeFile(join(destination,name),bytes,{flag:'wx'});}
 }
 return {destination,files:files.size,check,status:lock.status};
}
async function sourcePin(source){
 const metadata=JSON.parse(await readFile(join(source,'package.json'),'utf8'));
 const head=spawnSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}),status=spawnSync('git',['status','--porcelain'],{cwd:source,encoding:'utf8'});
 const revision=head.status===0?head.stdout.trim():null,dirty=status.status!==0||!!status.stdout.trim();
 return {packageVersion:metadata.version,sourceHead:revision,status:revision&&!dirty?'unpublished-local-commit':'unpublished-local-snapshot'};
}
/** Existing regular file bytes, null when absent. Symlinks and anything else are refused. */
async function existing(root,name){
 let path=root;
 for(const part of name.split('/')){
  path=join(path,part);
  let info;try{info=await lstat(path);}catch(error){if(error.code==='ENOENT')return null;throw error;}
  if(info.isSymbolicLink())throw new Error(`Upgrade refuses symlinks: ${name}`);
 }
 if(!(await lstat(path)).isFile())throw new Error(`Expected a file: ${name}`);
 return readFile(path);
}
async function replaceFile(path,bytes){await mkdir(dirname(path),{recursive:true});const temporary=`${path}.${randomUUID()}.tmp`;await writeFile(temporary,bytes,{flag:'wx'});await rename(temporary,path);}
/**
 * Upgrade a workbench that this tool installed. Files the app left exactly as installed are replaced;
 * files the app adapted are kept and reported; vendor files must be untouched. Nothing outside the
 * lock is read or written, except the optional single-file token validator named by its own pin.
 * Everything is validated before the first write.
 */
export async function upgradeBlueprint(target,{source=sourceRoot,check=false,tokenPin='design/vendor/pin.json'}={}){
 if(!target)throw new Error('Provide an existing target project directory.');
 const requested=resolve(target),actual=await realpath(requested);source=await realpath(source);
 if((await lstat(requested)).isSymbolicLink()||actual!==requested)throw new Error('Target path must be canonical and must not use symlinks.');
 if(within(source,actual)||within(actual,source))throw new Error('Target must be separate from the design-system source checkout.');
 const destination=join(actual,'workbench');
 const lockBytes=await existing(destination,'blueprint-lock.json');
 if(!lockBytes)throw new Error('No workbench/blueprint-lock.json found. Upgrade only applies to a workbench this tool installed; use it without --upgrade to install.');
 const previous=JSON.parse(lockBytes);
 if(previous.schemaVersion!==1||previous.blueprint!=='workbench'||!previous.files||typeof previous.files!=='object')throw new Error('Unrecognized blueprint lock; nothing was changed.');
 const next=new Map(await filesIn(join(source,'templates/blank')));
 for(const [name,bytes]of await filesIn(join(source,'blueprints/workbench')))next.set(name,bytes);
 const pin=await sourcePin(source);
 const replaced=[],added=[],unchanged=[],kept=[],removed=[],writes=[],removals=[];
 for(const [name,bytes]of next){
  const current=await existing(destination,name),installed=previous.files[name];
  if(installed===undefined){
   if(current&&!current.equals(bytes))throw new Error(`The app already has workbench/${name}, which this blueprint version adds. Move or reconcile it first; nothing was changed.`);
   if(current)unchanged.push(name);else{added.push(name);writes.push([join(destination,name),bytes]);}
  }else if(current&&sha256(current)===installed){
   if(current.equals(bytes))unchanged.push(name);else{replaced.push(name);writes.push([join(destination,name),bytes]);}
  }else{
   if(name.startsWith('vendor/'))throw new Error(`workbench/${name} ${current?'was edited':'is missing'}. Vendor files must match the lock before an upgrade; nothing was changed.`);
   kept.push({name,missing:!current,upstreamChanged:sha256(bytes)!==installed});
  }
 }
 for(const [name,installed]of Object.entries(previous.files)){
  if(next.has(name))continue;
  const current=await existing(destination,name);
  if(current&&sha256(current)===installed){removed.push(name);removals.push(join(destination,name));}
  else if(current)kept.push({name,missing:false,upstreamChanged:true,withdrawn:true});
 }
 const lock={schemaVersion:1,blueprint:'workbench',blueprintVersion:1,packageVersion:pin.packageVersion,source:'https://github.com/rsteth/design-system',sourceHead:pin.sourceHead,status:pin.status,direction:'app-to-workbench',upgradedFrom:previous.packageVersion??null,adapted:kept.filter(item=>!item.withdrawn).map(item=>item.name).sort(),files:Object.fromEntries([...next].sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>[name,sha256(bytes)]))};
 let tokens=null;
 const pinBytes=tokenPin?await existing(actual,tokenPin):null;
 if(pinBytes){
  const tokenLock=JSON.parse(pinBytes),local=join(dirname(tokenPin),'tokens.mjs'),copy=await existing(actual,local);
  if(tokenLock.path!=='packages/tokens/index.mjs'||typeof tokenLock.sha256!=='string')throw new Error(`Unrecognized token validator pin at ${tokenPin}; nothing was changed.`);
  if(!copy||sha256(copy)!==tokenLock.sha256)throw new Error(`${local} does not match its pin. Restore it before an upgrade; nothing was changed.`);
  const bytes=await readFile(join(source,'packages/tokens/index.mjs'));
  tokens={path:local,changed:!copy.equals(bytes)};
  if(tokens.changed){writes.push([join(actual,local),bytes]);writes.push([join(actual,tokenPin),Buffer.from(JSON.stringify({...tokenLock,sourceHead:pin.sourceHead,status:pin.status,sha256:sha256(bytes)},null,2)+'\n')]);}
 }
 const current=!replaced.length&&!added.length&&!removed.length&&!tokens?.changed&&previous.packageVersion===pin.packageVersion;
 if(!check&&!current){
  for(const [path,bytes]of writes)await replaceFile(path,bytes);
  for(const path of removals)await rm(path);
  // The lock is written last, so an interrupted upgrade still fails the app's vendor check.
  await replaceFile(join(destination,'blueprint-lock.json'),Buffer.from(JSON.stringify(lock,null,2)+'\n'));
 }
 return {destination,check,current,status:pin.status,sourceHead:pin.sourceHead,from:previous.packageVersion??null,to:pin.packageVersion,replaced,added,removed,unchanged,kept,tokens};
}
export async function main(args=process.argv.slice(2)){
 if(args.includes('--help')){console.log('Usage: node tooling/blueprint.mjs [--check] /absolute/project/path\nAdds a new workbench/ directory from templates/blank plus blueprints/workbench.\n--check previews validation without writing. Existing workbench directories are refused.\nNo root files, dependencies, source app, Git remotes or deployment are changed.\n\nUsage: node tooling/blueprint.mjs --upgrade [--check] /absolute/project/path\nUpgrades a workbench this tool installed. Files left as installed are replaced, files the app adapted are kept and listed, and edited vendor files are refused. Also refreshes design/vendor/tokens.mjs when design/vendor/pin.json pins it. Added files can include the workbench\'s own MIT LICENSE and LICENSING.md, which cover the copied workbench only. Review the result and run the app\'s own checks; nothing is committed.');return;}
 if(args.some(arg=>arg.startsWith('--')&&!['--check','--upgrade'].includes(arg))||args.filter(arg=>!arg.startsWith('--')).length!==1)throw new Error('Expected one target path and optional --check or --upgrade. Use --help.');
 const path=args.find(arg=>!arg.startsWith('--')),check=args.includes('--check');
 if(!args.includes('--upgrade')){
  const result=await installBlueprint(path,{check});
  console.log(`${result.check?'Would add':'Added'} ${result.files} files in ${result.destination} (${result.status}). Read workbench/README.md to adapt the empty catalog.`);
  return;
 }
 const result=await upgradeBlueprint(path,{check});
 if(result.current){console.log(`Already at ${result.to}; nothing to change in ${result.destination}.`);}
 else{
  console.log(`${check?'Would upgrade':'Upgraded'} ${result.destination} from ${result.from??'an unrecorded version'} to ${result.to} (${result.status}).`);
  for(const [done,planned,names]of [['Replaced','Would replace',result.replaced],['Added','Would add',result.added],['Removed','Would remove',result.removed]])if(names.length)console.log(`${check?planned:done}: ${names.join(', ')}`);
  if(result.tokens)console.log(result.tokens.changed?`Token validator: ${result.tokens.path} ${check?'would be replaced and its pin updated':'replaced and its pin updated'}.`:`Token validator: ${result.tokens.path} already current.`);
  else console.log('Token validator: no design/vendor/pin.json found, so none was upgraded.');
 }
 for(const item of result.kept)console.log(`Kept the app's ${item.name}${item.missing?' (absent in the app)':''}: ${item.withdrawn?'the blueprint no longer ships this file.':item.upstreamChanged?'the blueprint version CHANGED since it was installed, so compare the two by hand.':'the blueprint version has not changed, so there is nothing to merge.'}`);
 if(result.status==='unpublished-local-snapshot')console.log('The design-system checkout has uncommitted changes, so the lock records a snapshot and not a commit.');
 else console.log(`Source pin: commit ${result.sourceHead}. The lock does not check that this commit is pushed or kept; upgrade from one the owner intends to keep.`);
 if(!result.current)console.log(check?'Nothing was written.':'Review the changes and run the app\'s own checks. Nothing was committed.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
