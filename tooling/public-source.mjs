#!/usr/bin/env node
import {assertRegistryFresh} from './registry-freshness.mjs';
/** Clean-tree source export. Does not copy Git history or mutate the working tree. */
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {resolve,join,relative,dirname,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {publicSourcePath,publicRegistry} from './public-collection-scope.mjs';
import {publicMetadataJSON,redactUnverifiedRevisions,publicVersionMetadata} from '../apps/studio/public-sources.mjs';
const ROOT=resolve(fileURLToPath(new URL('../',import.meta.url)));
const json=value=>JSON.stringify(value,null,2)+'\n';
const hash=value=>createHash('sha256').update(value).digest('hex');
export async function buildPublicSource({output,readsRoot,banditRoot}={}){
 if(!output||!readsRoot||!banditRoot)throw Error('An explicit fresh output directory and both application roots are required.');output=resolve(output);
 if(!relative(ROOT,output).startsWith('review/'))throw Error('Output must be a fresh directory under ignored review/.');
 await assertRegistryFresh([readsRoot,banditRoot]);
 const versions={reads:JSON.parse(await readFile(join(readsRoot,'package.json'),'utf8')).version,bandit:JSON.parse(await readFile(join(banditRoot,'package.json'),'utf8')).version};
 let ancestor=dirname(output);while(ancestor!==ROOT){if(dirname(ancestor)===ancestor)throw Error('Output escaped source root.');if((await lstat(ancestor)).isSymbolicLink())throw Error('Output ancestors must not be symlinks.');ancestor=dirname(ancestor);}
 const files=execFileSync('git',['ls-files','-z'],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean).filter(path=>!path.startsWith('tests/workbench/artifacts/')&&publicSourcePath(path));
 await mkdir(output,{recursive:false});const changed=[];
 for(const path of files){if(/(^|\/)(?:\.git|\.env(?:\.[^/]*)?|node_modules|review)(?:\/|$)/.test(path))throw Error('Unexpected private source input: '+path);const src=join(ROOT,path),dst=join(output,path);if((await lstat(src)).isSymbolicLink())throw Error('Symlink source input: '+path);await mkdir(dirname(dst),{recursive:true});
  const bytes=await readFile(src);let result=bytes;
  if(['.json','.md','.html','.mjs','.js','.css','.txt'].includes(extname(path))){let text=bytes.toString();
   if(extname(path)==='.json')text=publicMetadataJSON(text);else if(!['.mjs','.js'].includes(extname(path)))text=redactUnverifiedRevisions(text);
   if(path.startsWith('docs/'))text=text.replace(/\/Users\/[^\s`"']+/g,'/absolute/path/to/playwright/index.mjs');
   if(text!==bytes.toString()){result=Buffer.from(text);changed.push(path);}
  }
  await writeFile(dst,result);
 }
 for(const id of ['focus','great-circle','stethem','reads','bandit']){const path=join(output,`registry/apps/${id}/collection.json`);let collection=JSON.parse(await readFile(path,'utf8'));if(versions[id])collection=publicVersionMetadata(collection,versions[id]);if(collection.inventory&&collection.registrySnapshot)collection.registrySnapshot.inventorySha256=hash(await readFile(join(dirname(path),collection.inventory)));await writeFile(path,json(collection));}
 const registryPath=join(output,'registry/index.json');await writeFile(registryPath,json(publicRegistry(JSON.parse(await readFile(registryPath,'utf8')))));
 const ignorePath=join(output,'.gitignore');const ignore=await readFile(ignorePath,'utf8');if(!ignore.includes('tests/workbench/artifacts/'))await writeFile(ignorePath,ignore+'\ntests/workbench/artifacts/\n');
 const pkg=JSON.parse(await readFile(join(output,'package.json'),'utf8'));
 await writeFile(join(output,'PUBLIC-SOURCE.json'),json({schemaVersion:1,version:pkg.version,scope:'Clean public source tree. Git history, local review artifacts and private revision identifiers are excluded. Application snapshots retain their source terms.',withheldRevisionMetadata:true,excluded:['Git history','Local review artifacts','Private revision identifiers','Local project coverage audit','Unapproved application catalogs'],sanitizedFiles:changed}));
 return {output,version:pkg.version,files:files.length+1,sanitizedFiles:changed};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){const key={'--output':'output','--reads-root':'readsRoot','--bandit-root':'banditRoot'}[args[i]];if(!key||!args[i+1])throw Error('Usage: node tooling/public-source.mjs --output review/new-source --reads-root /path --bandit-root /path');options[key]=args[i+1];}console.log(JSON.stringify(await buildPublicSource(options),null,2));}
