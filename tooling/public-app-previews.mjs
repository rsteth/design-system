/** Release-only synthetic app adapters. Source checkouts are read-only inputs. */
import {readFile,writeFile,mkdir,readdir,lstat,realpath,mkdtemp,rm} from 'node:fs/promises';
import {resolve,join,dirname,relative,isAbsolute,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {assertRegistryFresh} from './registry-freshness.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
export const PREVIEW_NOTICE='Synthetic design preview. No account, backend, provider, or live waiting list is connected. Nothing is saved or sent.';
export const READS_SOURCES=Object.freeze(['public/index.html','public/style.css','public/app.js','public/waitlist-client.js','design/fixtures.mjs','design/fixture-entry.mjs','workbench/vendor/workbench/theme-adapter.mjs']);
export const BANDIT_SOURCES=Object.freeze(['apps/web/app/globals.css','apps/web/app/design-tokens.css','apps/web/app/river-landing.tsx','apps/web/app/river-landing.module.css','apps/web/app/waitlist-dialog.tsx','apps/web/app/studio-overview.tsx','apps/web/app/texture-control.tsx','design/preview/app/[fixture]/page.tsx','design/preview/app/preview-boundary.tsx','design/preview/app/preview.css','design/preview/samples.ts','workbench/vendor/workbench/theme-adapter.mjs']);
export const BANDIT_ASSETS=Object.freeze(['fonts/inter-latin.woff2','fonts/space-grotesk-latin.woff2','fonts/space-mono-latin.woff2','fonts/inter-OFL.txt','fonts/space-grotesk-OFL.txt','fonts/space-mono-OFL.txt','fonts/README.md','fonts/sources.json','illustrations/storyboard-stack.svg','images/bandit-glacier-backdrop-v1.png','images/bandit-grain-v1.svg']);
export const PREVIEW_CSP="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self' blob:; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
function safeBase(base){if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base))throw Error('Preview base must be a safe absolute path with trailing slash.');return base;}
function inside(root,path){const rel=relative(root,path);return rel!==''&&!rel.startsWith('..')&&!isAbsolute(rel);}
async function input(root,path){if(!inside(root,resolve(root,path)))throw Error('Unsafe preview input.');let current=root;for(const part of path.split('/')){current=join(current,part);if((await lstat(current)).isSymbolicLink())throw Error(`Symlink in preview input: ${path}`);}return readFile(current);}
async function output(root,path,bytes){const target=resolve(root,path);if(!inside(root,target))throw Error('Unsafe preview output.');await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);}
async function list(root){const result=[];for(const entry of await readdir(root,{withFileTypes:true})){if(entry.isSymbolicLink())throw Error('Symlink in generated previews.');const path=join(root,entry.name);if(entry.isDirectory())result.push(...await list(path));else if(entry.isFile())result.push(path);}return result.sort();}
function replaceOnce(source,pattern,replacement,label){const next=source.replace(pattern,replacement);if(next===source)throw Error(`Source adapter drift: ${label}`);return next;}
function replaceSection(source,start,end,replacement,label){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);if(a<0||b<0||source.indexOf(start,a+start.length)!==-1)throw Error(`Source adapter drift: ${label}`);return source.slice(0,a)+replacement+source.slice(b);}
async function signature(root,paths){const status=execFileSync('git',['-C',root,'status','--porcelain'],{encoding:'utf8'});const values=await Promise.all(paths.map(async path=>[path,hash(await input(root,path))]));return hash(json({status,values}));}
export function syntheticAudio(){const samples=24000,bytes=Buffer.alloc(44+samples*2);bytes.write('RIFF');bytes.writeUInt32LE(36+samples*2,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(24000,24);bytes.writeUInt32LE(48000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)bytes.writeInt16LE(Math.round(Math.sin(i/24)*1400),44+i*2);return bytes;}

export function adaptReadsApp(source,prefix){
 source=replaceOnce(source,/\bfetch\(/g,'globalThis.__readsFixtureFetch(','Reads in-memory calls');
 source=replaceOnce(source,'`/api/voices/${v.id}/sample`',JSON.stringify(prefix+'assets/synthetic-tone.wav'),'Reads sample audio');
 source=replaceOnce(source,'`/api/jobs/${j.id}/audio`',JSON.stringify(prefix+'assets/synthetic-tone.wav'),'Reads job audio');
 source=replaceOnce(source,'`/api/jobs/${j.id}/audio?download=1`',JSON.stringify(prefix+'assets/synthetic-tone.wav'),'Reads audio download');
 source=replaceSection(source,"$('logout').onclick =", "$('reader').onsubmit", `$('logout').onclick = () => location.assign(${JSON.stringify(prefix+'fixture/?fixture=landing')});\n`,'Reads logout');
 source=replaceSection(source,"$('sample').onchange =",'await startSession();',`$('sample').disabled = true;\n$('voice-form').onsubmit = event => { event.preventDefault(); $('voice-status').textContent = 'Recordings are unavailable in this synthetic preview. Nothing is uploaded.'; };\n`,'Reads recording upload');
 source=replaceOnce(source,'await startSession();',"await startSession();\n$('sample').disabled = true;",'Reads disabled upload');
 // Route-like strings below are only keys in the in-memory fixture adapter.
 return source.replaceAll('/api/','/fixture-data/').replaceAll("'/auth/login'",JSON.stringify(prefix+'fixture/?fixture=studio-empty')).replaceAll("location.assign('/')",`location.assign(${JSON.stringify(prefix+'fixture/?fixture=landing')})`);
}
export function adaptReadsWaitlist(source){
 source=replaceSection(source,'export async function loadWaitlist() {','async function openWaitlist',`export async function loadWaitlist() {\n waitlistFormConfig = new URLSearchParams(location.search).get('fixture') === 'waitlist' ? {enabled:true} : null;\n $('waiting-list-availability').textContent = waitlistFormConfig ? 'Synthetic dialog only. Nothing is saved or sent.' : 'Waiting list not open yet.';\n return waitlistFormConfig;\n}\n`,'Reads waitlist configuration');
 return replaceSection(source,"$('waitlist-form').onsubmit =",'const reducedMotion =',`$('waitlist-form').onsubmit = event => {\n event.preventDefault(); if (!waitlistFormConfig) return;\n $('waitlist-form').hidden = true; $('waitlist-form').reset();\n $('waitlist-result').textContent = 'Synthetic preview complete. Nothing was saved. No email has been sent.';\n $('waitlist-result').focus();\n};\n`,'Reads waitlist submit');
}
export function adaptBanditWaitlist(source){
 source=replaceSection(source,'  async function load() {','  function clear()', '  async function load() { setState({ kind: "unavailable" }); }\n\n','Bandit waitlist load');
 source=replaceSection(source,'  async function submit() {','  const available =','  async function submit() { setState({ kind: "unavailable" }); }\n\n','Bandit waitlist submit');
 return source.replace('<button>Close</button>','<button type="button" onClick={() => dialog.current?.close()}>Close</button>');
}
async function buildReads({root,out,base,collection}){
 const prefix=base+'previews/reads/';
 let html=(await input(root,'public/index.html')).toString();
 html=replaceOnce(html,'href="/style.css"',`href="${prefix}style.css"`,'Reads stylesheet');
 html=replaceOnce(html,'src="/app.js"',`src="${prefix}design/fixture-entry.mjs" crossorigin="anonymous"`,'Reads entry');
 html=html.replace(/href="(?:\/|\/auth\/login)"/g,`href="${prefix}fixture/?fixture=studio-empty"`);
 html=replaceOnce(html,'</head>',`<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}"><style>.design-fixture-notice{position:relative;z-index:10;margin:0;padding:8px 16px;background:#111;color:#ddd;font:11px/1.6 system-ui;text-align:center}</style></head>`,'Reads CSP');
 await output(out,'fixture/index.html',html);
 await output(out,'style.css',await input(root,'public/style.css'));
 await output(out,'app.js',adaptReadsApp((await input(root,'public/app.js')).toString(),prefix));
 await output(out,'waitlist-client.js',adaptReadsWaitlist((await input(root,'public/waitlist-client.js')).toString()));
 let fixtures=(await input(root,'design/fixtures.mjs')).toString().replaceAll('http://127.0.0.1:3148','https://fixture.invalid').replaceAll('/api/','/fixture-data/').replaceAll('\\/api\\/','\\/fixture-data\\/').replaceAll('/auth/logout','/fixture-data/logout');
 await output(out,'design/fixtures.mjs',fixtures);
 let entry=(await input(root,'design/fixture-entry.mjs')).toString();
 entry=replaceOnce(entry,"from '/workbench/vendor/workbench/theme-adapter.mjs'","from '../theme-adapter.mjs'",'Reads theme adapter');
 entry=replaceOnce(entry,'globalThis.fetch=createFixtureTransport(id);','globalThis.__readsFixtureFetch=createFixtureTransport(id);','Reads transport');
 entry=replaceOnce(entry,"await import('/app.js')","await import('../app.js')",'Reads product entry');
 entry=entry.replaceAll("'/fixture?fixture=",`'${prefix}fixture/?fixture=`).replaceAll("'Design preview | Synthetic data only | Nothing is saved or sent'",JSON.stringify(PREVIEW_NOTICE));
 // Match the packaged link paths too, including the original home-link intent.
 entry=replaceOnce(entry,"document.querySelectorAll('a[href=\"/\"],a[href=\"/auth/login\"]')","document.querySelectorAll('.wordmark,#header-login,#login')",'Reads fixture navigation');
 entry += `
// Opaque frames deliberately lack allow-forms. Synthetic handlers are clicks, not submissions.
for (const form of document.forms) {
 const submit = [...form.querySelectorAll('button')].find(button => button.type === 'submit');
 if (!submit || !form.onsubmit) continue;
 submit.type = 'button';
 submit.onclick = event => { event.preventDefault(); if (form.reportValidity()) form.onsubmit(event); };
 form.addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.matches('input:not([type=file])')) { event.preventDefault(); if (!submit.disabled) submit.click(); } });
}
`;
 await output(out,'design/fixture-entry.mjs',entry);
 await output(out,'theme-adapter.mjs',await input(root,'workbench/vendor/workbench/theme-adapter.mjs'));
 await output(out,'assets/synthetic-tone.wav',syntheticAudio());
 return {fixtures:collection.fixtures.map(({id})=>({id,url:'../../../previews/reads/fixture/?fixture='+encodeURIComponent(id)})),version:JSON.parse((await input(root,'package.json')).toString()).version,status:'synthetic-preview',sourceFiles:READS_SOURCES,adapters:['Product markup, styles and renderer; only in-memory fixture requests.','Live waitlist submission, file reading/upload and authentication navigation removed.','A generated one-second tone replaces every original audio route.'],excluded:['src/ (server, authentication, providers, persistence)','launcher/','infra/','environment files','source maps','account data','real audio or voice recordings']};
}
async function dependencyNotices(modulePaths,outputRoot){
 const notices=[],licenseGaps=[];
 for(const path of modulePaths){let dir=dirname(path),pkg;
  while(dir!==dirname(dir)&&dir.includes('node_modules')){try{const p=JSON.parse(await readFile(join(dir,'package.json'),'utf8'));if(p.name&&p.version){pkg=p;break;}}catch{}dir=dirname(dir);}
  if(!pkg)continue;if(!['react','react-dom','scheduler'].includes(pkg.name))throw Error(`Unexpected bundled dependency: ${pkg.name}`);
  const id=pkg.name+'@'+pkg.version;if(notices.some(n=>n.id===id))continue;
  const names=(await readdir(dir)).filter(name=>/^(licen[sc]e|copying|notice)(\.|$)/i.test(name));
  if(!names.length)licenseGaps.push(id);
  const paths=[];for(const name of names){const path='licenses/'+id+'/'+name;await output(outputRoot,path,await readFile(join(dir,name)));paths.push(path);}
  notices.push({id,license:pkg.license??'Not declared',files:paths});
 }
 return {notices:notices.sort((a,b)=>a.id.localeCompare(b.id)),licenseGaps};
}
async function buildBandit({root,out,base,collection,outputRoot}){
 const prefix=base+'previews/bandit/',stage=await mkdtemp(join(ROOT,'review/app-preview-build-'));
 const inputFiles=[];const dependencyModules=new Set();
 try{
  for(const path of BANDIT_SOURCES){let text=(await input(root,path)).toString();
   if(path==='apps/web/app/waitlist-dialog.tsx')text=adaptBanditWaitlist(text);
   if(path.endsWith('.tsx'))text=text.replaceAll('href="/auth/login"','href="#preview-navigation"').replaceAll('href="/productions/new"','href="#preview-navigation"').replaceAll('href={`/productions/${production.id}`}','href="#preview-navigation"').replace(/^"use client";\s*/, '');
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
  await output(stage,'release-next.tsx',`import React from 'react';\nexport function Image({fill,unoptimized,sizes,src,style,...props}:any){return <img {...props} src={src.startsWith('/')?${JSON.stringify(prefix)}+src.slice(1):src} sizes={sizes} style={fill?{position:'absolute',height:'100%',width:'100%',inset:0,...style}:style}/>;}\nexport function Link({prefetch,replace,scroll,...props}:any){return <a {...props}/>;}\nexport function notFound(){throw Error('Unknown Bandit fixture.');}\n`);
  await output(stage,'entry.tsx',`import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport Fixture from './design/preview/app/[fixture]/page';\nimport {PreviewBoundary} from './design/preview/app/preview-boundary';\nimport './apps/web/app/globals.css';\nimport './design/preview/app/preview.css';\nconst fixture=location.pathname.split('/').filter(Boolean).at(-1);\nif(!${JSON.stringify(collection.fixtures.map(f=>f.id))}.includes(fixture))throw Error('Unknown Bandit fixture.');\ncreateRoot(document.getElementById('root')!).render(<><aside style={{padding:'8px 16px',background:'#111',color:'#ddd',font:'11px/1.6 system-ui',textAlign:'center'}}>${PREVIEW_NOTICE}</aside><PreviewBoundary><Fixture params={{fixture:fixture!}}/></PreviewBoundary></>);\n`);
  await output(stage,'index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}"><title>Bandit | Synthetic design preview</title></head><body><div id="root"></div><script type="module" src="/entry.tsx"></script></body></html>`);
  const {build}=await import(pathToFileURL(require.resolve('vite')));
  await build({root:stage,configFile:false,envDir:false,publicDir:false,base:prefix,mode:'production',css:{postcss:{plugins:[]}},resolve:{alias:aliases},oxc:{jsx:{runtime:'automatic'}},plugins:[{name:'synthetic-only-boundary',enforce:'pre',resolveId(id){if(['next/image','next/link','next/navigation'].includes(id))return '\0preview-'+id;},load(id){if(id==='\0preview-next/image')return `export {Image as default} from ${JSON.stringify(shim)};`;if(id==='\0preview-next/link')return `export {Link as default} from ${JSON.stringify(shim)};`;if(id==='\0preview-next/navigation')return `export {notFound} from ${JSON.stringify(shim)};`;},generateBundle(){for(const id of this.getModuleIds())if(id.includes('/node_modules/'))dependencyModules.add(id.split('?')[0]);}}],build:{outDir:out,emptyOutDir:false,sourcemap:false,modulePreload:{polyfill:false},minify:true,reportCompressedSize:false}});
  const html=await readFile(join(out,'index.html'));
  for(const fixture of collection.fixtures)await output(out,fixture.id+'/index.html',html);
  // A root index is informational only, not an extra unregistered fixture.
  await output(out,'index.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Bandit previews</title><h1>Bandit synthetic previews</h1><p>${PREVIEW_NOTICE}</p><ul>${collection.fixtures.map(f=>`<li><a href="./${f.id}/">${f.id}</a></li>`).join('')}</ul></html>`);
  for(const path of BANDIT_ASSETS)await output(out,path,await input(root,'apps/web/public/'+path));
  const licenses=await dependencyNotices(dependencyModules,outputRoot);
  const fonts=JSON.parse((await input(root,'apps/web/public/fonts/sources.json')).toString());
  for(const font of fonts.fonts){const bytes=await input(root,'apps/web/public/fonts/'+font.file);if(hash(bytes)!==font.sha256)throw Error('Bandit font hash mismatch.');licenses.notices.push({id:font.family+' font',license:'OFL-1.1',files:['previews/bandit/fonts/'+font.file.replace('-latin.woff2','-OFL.txt')]});}
  return {...licenses,app:{fixtures:collection.fixtures.map(({id})=>({id,url:'../../../previews/bandit/'+id+'/'})),version:JSON.parse((await input(root,'package.json')).toString()).version,status:'synthetic-preview',sourceFiles:[...BANDIT_SOURCES,...BANDIT_ASSETS.map(p=>'apps/web/public/'+p)],adapters:['Original product React components and styles with authored synthetic fixture data.','Native image/link substitutes remove the Next runtime, optimizer, router and server.','Waitlist load/submit replaced with an unavailable local state; navigation remains guarded.'],excluded:['Next server and runtime','studio-context.tsx (type-only import)','authenticated shell, auth and API handlers','backend/','infra/','environment files','source maps','real productions/profiles','unused artwork']}};
 }finally{await rm(stage,{recursive:true,force:true});}
}
export function assertPublicPreviewText(name,text){
 if(/\.(?:m?js|css|html|json|md|txt)$/.test(name)&&/\/Users\/|\/home\/|127\.0\.0\.1|localhost|sourceMappingURL|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|(?:github_pat_|ghp_)[A-Za-z0-9_]{20,}|(?:OPENAI_API_KEY|ELEVENLABS_API_KEY|AWS_SECRET_ACCESS_KEY|NEXT_PUBLIC_)/.test(text))throw Error(`Private/local metadata in preview: ${name}`);
 if(/\.m?js$/.test(name)&&/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|serviceWorker|\/(?:api|auth|productions)\//.test(text))throw Error(`Live network or private route code in preview: ${name}`);
}
export async function buildPublicAppPreviews({outputRoot,base='/design-system/',readsRoot,banditRoot}={}){
 if(!outputRoot||!readsRoot||!banditRoot)throw Error('Explicit outputRoot, readsRoot and banditRoot are required.');
 base=safeBase(base);outputRoot=resolve(outputRoot);
 if(!relative(ROOT,outputRoot).startsWith('review/'))throw Error('Preview output must be inside the assembly checkout review/.');
 let current=ROOT;for(const segment of relative(ROOT,outputRoot).split('/')){current=join(current,segment);try{if((await lstat(current)).isSymbolicLink())throw Error('Preview output ancestors cannot be symlinks.');}catch(error){if(error.code!=='ENOENT')throw error;}}
 const roots={reads:await realpath(readsRoot),bandit:await realpath(banditRoot)},collections={},before={};
 await assertRegistryFresh(Object.values(roots));
 const sources={reads:[...READS_SOURCES,'design/collection.json','package.json'],bandit:[...BANDIT_SOURCES,...BANDIT_ASSETS.map(p=>'apps/web/public/'+p),'design/collection.json','package.json']};
 for(const id of ['reads','bandit']){collections[id]=JSON.parse((await input(roots[id],'design/collection.json')).toString());if(collections[id].id!==id)throw Error('Incorrect app input.');sources[id].push('design/'+collections[id].tokens,...(collections[id].inventory?['design/'+collections[id].inventory]:[]));for(const fixture of collections[id].fixtures)if(!/^[a-z0-9-]+$/.test(fixture.id))throw Error('Unsafe fixture identifier.');before[id]=await signature(roots[id],sources[id]);for(const path of [join(outputRoot,'previews'),join(outputRoot,'previews',id)]){try{if((await lstat(path)).isSymbolicLink())throw Error('Preview output cannot contain symlinks.');}catch(error){if(error.code!=='ENOENT')throw error;}}await mkdir(join(outputRoot,'previews',id),{recursive:true});if((await readdir(join(outputRoot,'previews',id))).length)throw Error('App preview output must be empty.');}
 const reads=await buildReads({root:roots.reads,out:join(outputRoot,'previews/reads'),base,collection:collections.reads});
 const bandit=await buildBandit({root:roots.bandit,out:join(outputRoot,'previews/bandit'),base,collection:collections.bandit,outputRoot});
 const apps={reads,bandit:bandit.app};
 for(const id of ['reads','bandit']){const pkg=JSON.parse((await input(roots[id],'package.json')).toString());if(pkg.version!==apps[id].version)throw Error('App package version drift.');if(before[id]!==await signature(roots[id],sources[id]))throw Error(`Source changed during app preview packaging: ${id}`);}
 const files=[];for(const id of ['reads','bandit'])for(const path of await list(join(outputRoot,'previews',id))){const bytes=await readFile(path),name=relative(outputRoot,path);assertPublicPreviewText(name,bytes.toString());files.push({path:name,bytes:bytes.length,sha256:hash(bytes)});}
 return {apps,notices:bandit.notices,licenseGaps:bandit.licenseGaps,files,sourceUnchanged:true,sourceVerification:'Allowlisted source bytes and git working-tree status matched before and after. Ignored app outputs are not hashed.',limitations:['Synthetic previews only; production authentication, services and private data are not included.','Original-work ownership remains unchanged. Frontend code and listed design assets are inspectable by visitors.','Hosting must supply Access-Control-Allow-Origin: * for opaque allow-scripts-only frames.','No source maps, credentials, environment loading, private commit revisions or public network requests.']};
}
