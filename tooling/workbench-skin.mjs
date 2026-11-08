import {readFile,writeFile} from 'node:fs/promises';
import {compileTokens} from '../packages/tokens/index.mjs';
for (const name of ['stethem','workbench']) {
 const input=new URL(`../packages/workbench/skins/${name}.tokens.json`,import.meta.url);
 const output=new URL(`../packages/workbench/skins/${name}.css`,import.meta.url);
 const css=compileTokens(JSON.parse(await readFile(input,'utf8'))).replace('design/tokens.json',`packages/workbench/skins/${name}.tokens.json`);
 if(process.argv[2]==='build')await writeFile(output,css);
 else if(await readFile(output,'utf8')!==css)throw new Error(`Workbench skin ${name} is stale. Run npm run skin:build.`);
}
console.log(process.argv[2]==='build'?'Generated scoped workbench skins.':'Workbench skins match their authoritative tokens.');
