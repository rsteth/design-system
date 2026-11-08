import {realpath,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {isLocalPath} from '../packages/tokens/index.mjs';
/** Verify root-relative references and reject symlink escapes without executing evidence. */
export async function validateInventoryFiles(inventory, root) {
 const errors=[]; const base=await realpath(root);
 const paths=[...(inventory.items??[]).flatMap(item=>item.source??[]),...(inventory.checks??[]).flatMap(check=>check.evidence?[check.evidence]:[])];
 for(const path of new Set(paths)) {
  if(!isLocalPath(path)){errors.push(`Unsafe inventory path: ${path}`);continue;}
  try {const resolved=await realpath(resolve(base,path));if(!resolved.startsWith(base+sep))errors.push(`Inventory path escapes app root: ${path}`);else if(!(await stat(resolved)).isFile())errors.push(`Inventory source/evidence is not a file: ${path}`);}
  catch {errors.push(`Missing inventory source/evidence: ${path}`);}
 }
 return errors;
}
