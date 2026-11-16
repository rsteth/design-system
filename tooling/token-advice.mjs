#!/usr/bin/env node
/** Print advisory notes for token documents. Advice only: the exit code is always 0 for readable input. */
import {readFile,readdir} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {adviseTokens,validateTokens} from '../packages/tokens/index.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
/** With no paths, review the registered application snapshots. Reference studies are not reviewed by default. */
export async function tokenAdvice(paths=[],{root=ROOT}={}){
 if(!paths.length){
  const apps=resolve(root,'registry/apps');
  for(const entry of await readdir(apps,{withFileTypes:true}).catch(()=>[]))if(entry.isDirectory())paths.push(join(apps,entry.name,'tokens.json'));
 }
 const results=[];
 for(const path of paths.map(path=>resolve(path)).sort()){
  let document;try{document=JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code==='ENOENT')continue;throw error;}
  if(validateTokens(document).length)throw Error(`Not a valid token document: ${path}`);
  results.push({path,notes:adviseTokens(document)});
 }
 return results;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const results=await tokenAdvice(process.argv.slice(2));
 for(const {path,notes}of results){
  console.log(`${relative(process.cwd(),path)||path}: ${notes.length?`${notes.length} note${notes.length===1?'':'s'}`:'no notes'}`);
  for(const note of notes)console.log(`  - ${note}`);
 }
 console.log('These notes are advice. They do not fail any check.');
}
