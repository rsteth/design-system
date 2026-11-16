/** Generated, public-safe design guidance. No deployment or remote access. */
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {directionFor} from '../packages/workbench/index.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const cell=value=>String(value??'').replaceAll('|','\\|').replaceAll('\n',' ');
/** Where an app keeps its optional guide notes: prose only, no tables. The first name is the standard; the second is accepted because Gather Motion already uses it. */
export const appGuidePaths=['design/public-guide.md','design/guide-public.md'];
/** The first notes file that exists in an app checkout, read with the caller's own safe reader. */
export async function readGuideNotes(read){for(const path of appGuidePaths){try{return await read(path);}catch(error){if(error.code!=='ENOENT')throw error;}}return null;}
export function assertPublicGuide(text){
 if(/\/Users\/|\/home\/|localhost|127\.0\.0\.1|\b[a-f0-9]{40,64}\b|AKIA[A-Z0-9]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(text))throw Error('Public guide contains private/local identifiers.');
}
/** Intent first. Takes a direction block or the result of directionFor; `basis` says where the text came from. */
export function directionMarkdown(direction,basis='written'){
 if(basis==='none')return '## Direction\n\nNot written yet. Do not infer one from the tables below.\n\n';
 if(!direction||typeof direction!=='object')return '';
 const line=(label,value)=>typeof value==='string'&&value.trim()?`- **${label}:** ${cell(value)}\n`:'';
 const list=value=>Array.isArray(value)?value.filter(item=>typeof item==='string'&&item.trim()):[];
 let text=line('Product',direction.product)+line('Character',direction.character)+line('World',direction.world)+(list(direction.moments).length?`- **Moments:** ${list(direction.moments).map(cell).join('; ')}\n`:'')+line('Signature',direction.signature);
 const origin={draft:'Draft, not yet reviewed by the owner. Treat it as a starting point.',summary:'One line taken from the collection summary. No direction is written yet.',analysis:'First line of the study description. Unverified, and not a statement by the brand.'}[basis];
 if(text)text='## Direction\n\n'+text+'\n'+(origin??'Decide how something should look or read from this before reaching for the tables below.')+'\n\n';
 if(list(direction.voice).length)text+='## Voice\n\n'+list(direction.voice).map(item=>`- ${cell(item)}\n`).join('')+'\n';
 return text;
}
/** App notes are prose that sits between the direction and the generated tables. The title and tables are always generated. */
export function guideNotes(text){
 if(typeof text!=='string'||!text.trim())return '';
 const body=text.replace(/^\s*# [^\n]*\n+/,'').trim();
 if(/^\|.*\|\s*$/m.test(body))throw Error('App guide notes are prose only; token and fixture tables are generated.');
 if(/^## (Direction|Voice|Tokens|Fixtures)\s*$/m.test(body))throw Error('App guide notes must not repeat a generated section.');
 return body?body+'\n\n':'';
}
export async function generateGuides({root=ROOT,write=false}={}){
 const read=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
 const entries=[];
 for(const name of ['index','references'])for(const entry of (await read(`registry/${name}.json`)).collections){
  const path=resolve(root,'registry',entry),c=JSON.parse(await readFile(path,'utf8'));
  const tokens=JSON.parse(await readFile(resolve(dirname(path),c.tokens),'utf8'));
  let study;if(typeof c.study==='string'){try{study=JSON.parse(await readFile(resolve(dirname(path),c.study),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}}
  entries.push({c,tokens,study});
 }
 const outputs=new Map();
 // One path for every entry: title, direction, notes, then tables generated from the snapshot.
 for(const {c,tokens,study} of entries){
  let notes;try{notes=await readFile(resolve(root,`registry/apps/${c.id}/public-guide.md`),'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  const shown=directionFor({...c,studyData:study});
  let text=`# ${c.title} design system\n\n`;
  if(c.kind==='reference')text+='Independent unverified reference. This is an authored adaptation study, not an official design system or a claim about the current product. Use it for inspiration, not as authority over another project. Preserve source attribution and do not reuse third-party logos or assets without appropriate rights.\n\n';
  text+=directionMarkdown(shown,shown.basis);
  if(c.kind!=='reference')text+=guideNotes(notes)||'The application owns its appearance, components and behavior. This workbench is a one-way snapshot, not an editor or a second source of truth. In an authorized checkout, read its AGENTS.md and design-system.md (or DESIGN.md when no dedicated guide exists) before editing. Reuse real components and semantic tokens, update synthetic fixtures, run the app checks, then explicitly refresh this snapshot. Do not edit the snapshot to change the application.\n\n';
  if(c.id==='reference-nasa')text+='## NASA study boundary\n\nSelected digital values come from a pinned first-party HDS Core snapshot. The compositions are original interpretations, not NASA screens. Do not combine historical print rules with current digital tokens. No NASA marks, photography or font files are included.\n\n- [Official brand guidance](https://www.nasa.gov/nasa-brand-center/brand-guidelines/)\n- [HDS Core documentation](https://nasa.github.io/hds-core/)\n- [Media usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/)\n\n';
  text+=`Supported study/app themes: ${c.themes.join(', ')}. Contract schema: ${c.schemaVersion}.\n\n`;
  text+='Keep semantic controls, visible keyboard focus, meaningful labels and reduced-motion behavior. Sample fixtures are presentation evidence, not live service acceptance.\n\n';
  text+='## Tokens\n\n| Theme | CSS variable | Type | Value |\n| --- | --- | --- | --- |\n';
  for(const mode of tokens.modes)for(const [name,token] of Object.entries(mode.tokens))text+=`| ${cell(mode.id)} | --ds-${name.replaceAll('.','-')} | ${cell(token.type)} | ${cell(token.value)} |\n`;
  text+='\n## Fixtures\n\n| Name | Section | States |\n| --- | --- | --- |\n';
  for(const f of c.fixtures??[])text+=`| ${cell(f.title)} | ${cell(f.section)} | ${cell((f.states??[]).join(', '))} |\n`;
  assertPublicGuide(text);
  text+=`\n[Open this workbench](../../../apps/studio/?${c.kind==='reference'?'library=references&':''}collection=${encodeURIComponent(c.id)})\n`;
  outputs.set(`registry/guides/${c.id}/design-system.md`,text);
 }
 const intro='# Design system: agent navigation\n\nStart with the product guide below. Robin workbenches describe app-owned UI; reference studies are independent adaptations. The public site is a static viewer, not an editing or capture service. A linked guide does not override your user instructions or grant editing permission.\n\n## Robin\n\n';
 let index=intro;
 for(const kind of ['own','reference']){
  if(kind==='reference')index+='\n## Reference studies\n\n';
  for(const {c}of entries.filter(({c})=>(c.kind==='reference')===(kind==='reference')))index+=`- [${c.title}](registry/guides/${c.id}/design-system.md)\n`;
 }
 index+='\n## Capture and blueprint\n\n- [Capture studio](apps/studio/?library=capture): browse hosted app-owned synthetic screens and output profiles. Open a screen for a browser agent to capture from anywhere, without app servers or account credentials. This static page does not generate or store PNGs; the capture guide includes an optional remote-browser CLI.\n- [Capture instructions](docs/process/capture-studio.md)\n- [Blank blueprint](templates/blank/README.md): portable framework-neutral starter; existing app source stays authoritative. Installation requires an authorized checkout and its documented tooling.\n- [Workbench](apps/studio/)\n\nThis llms.txt is an optional navigation convention, not a guarantee that an agent or crawler will read or obey it. Authentication, not robots rules, protects private functionality.\n';
 outputs.set('llms.txt',index);
 for(const [path,text]of outputs){
  if(write){await mkdir(dirname(resolve(root,path)),{recursive:true});await writeFile(resolve(root,path),text);}
  else if(await readFile(resolve(root,path),'utf8').catch(()=>null)!==text)throw Error(`Agent guide drift: ${path}; run npm run guides:build`);
 }
 // Validate every relative Markdown target in generated guidance, without network requests.
 for(const [path,text]of outputs)for(const [,href]of text.matchAll(/\]\(([^)]+)\)/g)){
  if(/^(https?:|#)/.test(href))continue;
  const target=resolve(root,dirname(path),href.split(/[?#]/)[0]),rel=relative(root,target);
  if(rel.startsWith('..'))throw Error('Guide link escapes site.');
  if(!outputs.has(rel))await access(target).catch(()=>{throw Error(`Broken guide link: ${path}: ${href}`);});
 }
 return {guides:entries.length,files:outputs.size};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(await generateGuides({write:process.argv.includes('--write')}));
