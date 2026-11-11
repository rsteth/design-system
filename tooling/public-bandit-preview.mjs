/** Static public Bandit presentation adapter. App checkout remains read-only. */
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

export const BANDIT_SOURCES=Object.freeze([
 'apps/web/app/globals.css','apps/web/app/design-tokens.css',
 'apps/web/app/river-landing.tsx','apps/web/app/river-landing.module.css','apps/web/app/waitlist-dialog.tsx',
 'apps/web/app/studio-overview.tsx','apps/web/app/texture-control.tsx','apps/web/app/studio-context.tsx',
 'apps/web/app/projects/page.tsx','apps/web/app/profiles/page.tsx','apps/web/app/library/page.tsx',
 'apps/web/app/productions/new/page.tsx','apps/web/app/productions/[id]/production-board.tsx',
 'apps/web/app/productions/[id]/advanced-controls.tsx','apps/web/app/productions/[id]/review/review-room.tsx',
 'apps/web/app/productions/[id]/review/advanced-review.tsx','apps/web/app/asset-preview.tsx','apps/web/app/creative-memory.tsx',
 'design/tokens.json','design/preview/coverage.json','design/preview/fixture-state.ts','design/preview/app/studio-fixture.tsx',
 'design/preview/app/[fixture]/page.tsx','design/preview/app/preview-boundary.tsx','design/preview/app/preview.css',
 'design/preview/samples.ts','workbench/vendor/workbench/theme-adapter.mjs'
]);
export const BANDIT_ASSETS=Object.freeze([
 'fonts/inter-latin.woff2','fonts/space-grotesk-latin.woff2','fonts/space-mono-latin.woff2','fonts/jost-latin.woff2',
 'fonts/inter-OFL.txt','fonts/space-grotesk-OFL.txt','fonts/space-mono-OFL.txt','fonts/jost-OFL.txt','fonts/README.md','fonts/sources.json',
 'illustrations/storyboard-stack.svg','images/bandit-glacier-backdrop-v1.png','images/bandit-grain-v1.svg'
]);
function localReplaceOnce(source,pattern,replacement,label){const next=source.replace(pattern,replacement);if(next===source)throw Error(`Source adapter drift: ${label}`);return next;}
function localReplaceSection(source,start,end,replacement,label){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);if(a<0||b<0||source.indexOf(start,a+start.length)!==-1)throw Error(`Source adapter drift: ${label}`);return source.slice(0,a)+replacement+source.slice(b);}
export function adaptBanditWaitlist(source,{replaceSection=localReplaceSection}={}){
 if(source.includes('import bundledNotice from ')){
  source=source.replace(/import bundledNotice from [^;]+;/,'const bundledNotice = {notice_version:"synthetic",consent_text:"No information is collected.",privacy_template:"This synthetic preview never saves or sends information."};');
  source=source.replace('kind: "ready",\n    notice: initialNotice,','kind: "unavailable",');
  source=source.replaceAll('setState({ kind: "ready", notice: initialNotice });','setState({ kind: "unavailable" });');
 }
 source=replaceSection(source,'  async function load() {','  function clear()', '  async function load() { setState({ kind: "unavailable" }); }\n\n','Bandit waitlist load');
 source=replaceSection(source,'  async function submit() {','  const available =','  async function submit() { setState({ kind: "unavailable" }); }\n\n','Bandit waitlist submit');
 return source.replace('<button>Close</button>','<button type="button" onClick={() => dialog.current?.close()}>Close</button>');
}
export function extractBanditContext(source){
 const start=source.indexOf('export function unwrap<T>'),end=source.indexOf('const empty: Catalog =');
 if(start<0||end<=start||!source.includes('export function StudioProvider(')||!source.slice(start,end).includes('export const StudioContext'))throw Error('Source adapter drift: Bandit pure context boundary');
 return 'import {createContext,useContext,useState} from "react";\nexport type Model<T extends string> = any;\nexport type Api = any;\n'+source.slice(start,end);
}
export function adaptBanditSource(path,source,{replaceOnce=localReplaceOnce,replaceSection=localReplaceSection}={}){
 if(path==='apps/web/app/studio-context.tsx')source=extractBanditContext(source);
 if(path==='apps/web/app/waitlist-dialog.tsx')source=adaptBanditWaitlist(source,{replaceSection});
 if(path==='design/preview/coverage.json')return JSON.stringify(JSON.parse(source).map(({source,...fixture})=>fixture));
 if(path==='apps/web/app/library/page.tsx'){
  source=replaceSection(source,'  const upload = (file: File) =>','  return (\n    <>', '  const upload = (_file: File) => action.run(async () => { throw Error("Uploads are unavailable in this synthetic preview. Nothing was read or sent."); });\n','Bandit file upload');
  source=replaceOnce(source,'disabled={action.busy}\n            onChange={(e) => {\n              const file', 'disabled={true}\n            onChange={(e) => {\n              const file','Bandit disabled file picker');
 }
 if(path==='apps/web/app/profiles/page.tsx')source=replaceSection(source,'  const exportFile = async','  return (', '  const exportFile = async (_format: "yaml" | "json") => { await action.run(async () => { throw Error("Downloads are unavailable in this synthetic preview."); }); };\n','Bandit profile export');
 if(path==='apps/web/app/creative-memory.tsx'){
  source=replaceSection(source,'              const url = URL.createObjectURL(', '              URL.revokeObjectURL(url);', '              throw Error("Downloads are unavailable in this synthetic preview.");\n','Bandit memory download').replace('              URL.revokeObjectURL(url);','');
 }
 if(path==='apps/web/app/productions/[id]/review/review-room.tsx'){
  source=replaceOnce(source,'import { ComfyGeneration } from "./comfy-generation";','', 'Bandit provider intent module');
  source=replaceSection(source,'                <ComfyGeneration','              ) : (','                null\n','Bandit provider widget');
  source=replaceSection(source,'            const link = document.createElement("a");','            link.click();', '            throw Error("Downloads are unavailable in this synthetic preview.");\n','Bandit cut download').replace('            link.click();','');
 }
 if(/\.(?:tsx?|mjs)$/.test(path)){
  source=source.replace(/^"use client";\s*/, '');
  // API strings are only keys consumed by the in-memory adapter, never URLs.
  source=source.replaceAll('/api/v1/productions','/fixture-data/v1/production').replaceAll('/api/','/fixture-data/');
  source=source.replace(/(["'`])\/(?:auth|productions)\/[^"'`]*\1/g,'"#preview-navigation"');
  // JSX form handlers remain production code; native submission is blocked in opaque frames.
  if(source.includes('<form'))source='import {PreviewForm} from "release-form";\n'+source.replace(/<form(?=[\s>])/g,'<PreviewForm').replaceAll('</form>','</PreviewForm>');
 }
 return source;
}
export async function buildBandit({root,out,base,collection,outputRoot}, helpers){
 const {ROOT,input,output,replaceOnce,replaceSection,dependencyNotices,PREVIEW_CSP,PREVIEW_NOTICE,hash}=helpers;
 const prefix=base+'previews/bandit/',stage=await mkdtemp(join(ROOT,'review/app-preview-build-'));
 const inputFiles=[];const dependencyModules=new Set();
 try{
  for(const path of BANDIT_SOURCES){let text=(await input(root,path)).toString();
   text=adaptBanditSource(path,text,{replaceOnce,replaceSection});
   if(path==='design/preview/app/preview-boundary.tsx')text=replaceOnce(text,'anchor && !anchor.getAttribute("href")?.startsWith("#")','anchor && (anchor.getAttribute("href") === "#preview-navigation" || !anchor.getAttribute("href")?.startsWith("#"))','Bandit inert navigation');
   if(path==='design/preview/app/[fixture]/page.tsx'){
    text=replaceOnce(text,'export default async function Fixture','export default function Fixture','Bandit synchronous fixture');
    text=replaceOnce(text,'params: Promise<{ fixture: string }>','params: { fixture: string }','Bandit static params');
    text=replaceOnce(text,'const { fixture } = await params;','const { fixture } = params;','Bandit resolved params');
   }
   // Native image adapter preserves original app assets without Next routes.
   if(path.endsWith('.css'))text=text.replace(/url\((['"])\/(fonts|images|illustrations)\//g,`url($1${prefix}$2/`);
   await output(stage,path,text);inputFiles.push(path);
  }
  const require=createRequire(join(root,'package.json'));
  const aliases=['react','react-dom'].map(name=>({find:new RegExp('^'+name+'(?=/|$)'),replacement:dirname(require.resolve(name+'/package.json'))}));
  const shim=join(stage,'release-next.tsx');
  await output(stage,'release-next.tsx',`import React from 'react';
export function Image({fill,unoptimized,sizes,src,style,...props}:any){return <img {...props} src={src.startsWith('/')?${JSON.stringify(prefix)}+src.slice(1):src} sizes={sizes} style={fill?{position:'absolute',height:'100%',width:'100%',inset:0,...style}:style}/>;}
export function Link({prefetch,replace,scroll,href,...props}:any){return <a {...props} href={typeof href==='string'&&href.startsWith('#')?href:'#preview-navigation'}/>;}
export function notFound(){throw Error('Unknown Bandit fixture.');}
export function useRouter(){return {push(){},replace(){},back(){},refresh(){},prefetch(){}};}
export function usePathname(){return '/fixture-data/preview';}
`);
  await output(stage,'release-form.tsx',`import React from 'react';
export function PreviewForm({onSubmit,onClickCapture,onKeyDown,...props}:any){
 const run=(event:any)=>{event.preventDefault();const form=event.currentTarget;if(form.reportValidity())onSubmit?.({preventDefault(){},currentTarget:form,target:form});};
 return <form {...props} onSubmit={(event:any)=>event.preventDefault()} onClickCapture={(event:any)=>{onClickCapture?.(event);const button=event.target.closest('button');if(button&&button.form===event.currentTarget&&button.type==='submit'&&!button.disabled)run(event);}} onKeyDown={(event:any)=>{onKeyDown?.(event);if(event.key==='Enter'&&event.target.matches('input:not([type=file])')){const submit=Array.from(event.currentTarget.querySelectorAll('button')).find((button:any)=>button.type==='submit') as HTMLButtonElement|undefined;if(submit&&!submit.disabled)run(event);}}}/>;
}
`);
  await output(stage,'entry.tsx',`import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport Fixture from './design/preview/app/[fixture]/page';\nimport {PreviewBoundary} from './design/preview/app/preview-boundary';\nimport './apps/web/app/globals.css';\nimport './design/preview/app/preview.css';\nconst fixture=location.pathname.split('/').filter(Boolean).at(-1);\nif(!${JSON.stringify(collection.fixtures.map(f=>f.id))}.includes(fixture))throw Error('Unknown Bandit fixture.');\ncreateRoot(document.getElementById('root')!).render(<><aside style={{padding:'8px 16px',background:'#111',color:'#ddd',font:'11px/1.6 system-ui',textAlign:'center'}}>${PREVIEW_NOTICE}</aside><PreviewBoundary><Fixture params={{fixture:fixture!}}/></PreviewBoundary></>);\n`);
  await output(stage,'index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}"><title>Bandit | Synthetic design preview</title></head><body><div id="root"></div><script type="module" src="/entry.tsx"></script></body></html>`);
  const {build}=await import(pathToFileURL(require.resolve('vite')));
  await build({root:stage,configFile:false,envDir:false,publicDir:false,base:prefix,mode:'production',css:{postcss:{plugins:[]}},resolve:{alias:aliases},oxc:{jsx:{runtime:'automatic'}},plugins:[{name:'synthetic-only-boundary',enforce:'pre',resolveId(id){if(id==='release-form')return '\0preview-form';if(['next/image','next/link','next/navigation'].includes(id))return '\0preview-'+id;},load(id){if(id==='\0preview-form')return `export {PreviewForm} from ${JSON.stringify(join(stage,'release-form.tsx'))};`;if(id==='\0preview-next/image')return `export {Image as default} from ${JSON.stringify(shim)};`;if(id==='\0preview-next/link')return `export {Link as default} from ${JSON.stringify(shim)};`;if(id==='\0preview-next/navigation')return `export {notFound,useRouter,usePathname} from ${JSON.stringify(shim)};`;},generateBundle(){for(const id of this.getModuleIds())if(id.includes('/node_modules/'))dependencyModules.add(id.split('?')[0]);}}],build:{outDir:out,emptyOutDir:false,sourcemap:false,modulePreload:{polyfill:false},minify:true,reportCompressedSize:false}});
  const html=await readFile(join(out,'index.html'));
  for(const fixture of collection.fixtures)await output(out,fixture.id+'/index.html',html);
  // A root index is informational only, not an extra unregistered fixture.
  await output(out,'index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Bandit previews</title><h1>Bandit synthetic previews</h1><p>${PREVIEW_NOTICE}</p><ul>${collection.fixtures.map(f=>`<li><a href="./${f.id}/">${f.id}</a></li>`).join('')}</ul></html>`);
  for(const path of BANDIT_ASSETS)await output(out,path,await input(root,'apps/web/public/'+path));
  const licenses=await dependencyNotices(dependencyModules,outputRoot);
  const fonts=JSON.parse((await input(root,'apps/web/public/fonts/sources.json')).toString());
  for(const font of fonts.fonts){const bytes=await input(root,'apps/web/public/fonts/'+font.file);if(hash(bytes)!==font.sha256)throw Error('Bandit font hash mismatch.');licenses.notices.push({id:font.family+' font',license:'OFL-1.1',files:['previews/bandit/fonts/'+font.file.replace('-latin.woff2','-OFL.txt')]});}
  return {...licenses,app:{fixtures:collection.fixtures.map(({id})=>({id,url:'../../../previews/bandit/'+id+'/'})),version:JSON.parse((await input(root,'package.json')).toString()).version,status:'synthetic-preview',sourceFiles:[...BANDIT_SOURCES,...BANDIT_ASSETS.map(p=>'apps/web/public/'+p)],adapters:['Original product React components and styles with authored synthetic fixture data.','Native image/link substitutes remove the Next runtime, optimizer, router and server.','Waitlist, uploads and downloads are unavailable; navigation remains guarded.', 'Pure production context helpers are extracted before StudioProvider; 52 source-owned fixtures use the original in-memory data adapter.', 'Opaque-frame form clicks invoke production validation and handlers without native submission.'],excluded:['Next server and runtime','StudioProvider, owner presence, contracts SDK and provider runtime','authenticated shell, auth and API handlers','backend/','infra/','environment files','source maps','real productions/profiles','unused artwork']}};
 }finally{await rm(stage,{recursive:true,force:true});}
}
