#!/usr/bin/env node
import {readFile,writeFile,mkdir,readdir,lstat,realpath} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
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
 const metadata=JSON.parse(await readFile(join(source,'package.json'),'utf8'));
 const head=spawnSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}),status=spawnSync('git',['status','--porcelain'],{cwd:source,encoding:'utf8'});
 const revision=head.status===0?head.stdout.trim():null;
 const dirty=status.status!==0||!!status.stdout.trim();
 const lock={schemaVersion:1,blueprint:'workbench',blueprintVersion:1,packageVersion:metadata.version,source:'https://github.com/rsteth/design-system',sourceHead:revision,status:revision&&!dirty?'unpublished-local-commit':'unpublished-local-snapshot',direction:'app-to-workbench',files:Object.fromEntries([...files].sort(([a],[b])=>a.localeCompare(b)).map(([name,bytes])=>[name,sha256(bytes)]))};
 files.set('blueprint-lock.json',Buffer.from(JSON.stringify(lock,null,2)+'\n'));
 if(!check){
  // Exclusive directory creation and exclusive writes: no force/overwrite mode.
  await mkdir(destination);
  for(const [name,bytes]of files){await mkdir(dirname(join(destination,name)),{recursive:true});await writeFile(join(destination,name),bytes,{flag:'wx'});}
 }
 return {destination,files:files.size,check,status:lock.status};
}
export async function main(args=process.argv.slice(2)){
 if(args.includes('--help')){console.log('Usage: node tooling/blueprint.mjs [--check] /absolute/project/path\nAdds a new workbench/ directory from templates/blank plus blueprints/workbench.\n--check previews validation without writing. Existing workbench directories are refused.\nNo root files, dependencies, source app, Git remotes or deployment are changed.');return;}
 if(args.some(arg=>arg.startsWith('--')&&arg!=='--check')||args.filter(arg=>!arg.startsWith('--')).length!==1)throw new Error('Expected one target path and optional --check. Use --help.');
 const result=await installBlueprint(args.find(arg=>!arg.startsWith('--')),{check:args.includes('--check')});
 console.log(`${result.check?'Would add':'Added'} ${result.files} files in ${result.destination} (${result.status}). Read workbench/README.md to adapt the empty catalog.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
