#!/usr/bin/env node
import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const source = resolve(dirname(fileURLToPath(import.meta.url)),'..');
const metadata=JSON.parse(await readFile(join(source,'package.json'),'utf8'));
const target = resolve(process.argv[2] ?? '');
if (!process.argv[2] || target === source) throw new Error('Provide an app checkout path, never the source repository.');
const dest = join(target,'vendor/design-system');
await mkdir(dest,{recursive:true});
for (const dir of ['packages','tooling']) { await rm(join(dest,dir),{recursive:true,force:true}); await cp(join(source,dir),join(dest,dir),{recursive:true}); }
for (const file of ['package.json','README.md','LICENSE','LICENSING.md','THIRD_PARTY_NOTICES.md']) await cp(join(source,file),join(dest,file));
const hashes = {};
async function visit(dir,prefix='') { for (const item of await readdir(dir,{withFileTypes:true})) { const path = join(dir,item.name), name = prefix + item.name; if(item.isDirectory()) await visit(path,name+'/'); else if (name !== 'pin.json') hashes[name]=createHash('sha256').update(await readFile(path)).digest('hex'); } }
await visit(dest);
const head=spawnSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'});
const status=spawnSync('git',['status','--porcelain'],{cwd:source,encoding:'utf8'});
const revision=head.status===0 ? head.stdout.trim() : null;
const clean=Boolean(revision && status.status===0 && !status.stdout.trim());
await writeFile(join(dest,'pin.json'),JSON.stringify({package:'@rsteth/design-system',version:metadata.version,source:'https://github.com/rsteth/design-system',revision:clean ? revision : null,status:clean ? 'unpublished-local-commit' : 'unpublished-local-snapshot',sha256:hashes},null,2)+'\n');
console.log(`Synced explicit local package snapshot to ${dest}. Not published; do not edit vendor files.`);
