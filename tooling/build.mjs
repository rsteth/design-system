import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true}); await mkdir('dist');
for (const dir of ['apps','packages','registry','collections','templates']) await cp(dir,`dist/${dir}`,{recursive:true});
for (const file of ['LICENSE','LICENSING.md','THIRD_PARTY_NOTICES.md','llms.txt']) await cp(file,`dist/${file}`);
await mkdir('dist/docs/process',{recursive:true});
await cp('docs/process/capture-studio.md','dist/docs/process/capture-studio.md');
console.log('Built static workbench into dist. No publication performed.');
