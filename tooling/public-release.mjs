#!/usr/bin/env node
/** Additive public packaging. Never modifies app sources, local manifests, or dist. */
import {readFile,writeFile,mkdir,cp,readdir,lstat,realpath} from 'node:fs/promises';
import {resolve,join,relative,dirname,extname,basename} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {redactUnverifiedRevisions,publicSourceMetadata,publicMetadataJSON,publicVersionMetadata} from '../apps/studio/public-sources.mjs';
import {buildPublicAppPreviews} from './public-app-previews.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const json=x=>JSON.stringify(x,null,2)+'\n';
const hash=x=>createHash('sha256').update(x).digest('hex');
const escape=x=>x.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export const EPUB_FIXTURE_NOTICE = 'Public fixture preview: EPUB states use authored sample text. Real EPUB parsing is not included; uploaded files are not parsed by this preview.';
export const EPUB_FIXTURE_ONLY_SOURCE = `export async function extractTextFromEpub() { throw new Error(${JSON.stringify(EPUB_FIXTURE_NOTICE)}); }\n`;
export function focusEpubMode(value='full') { if(!['full','fixture-only'].includes(value))throw Error('Focus EPUB mode must be full or fixture-only.');return value; }
export function publicBase(value='/') {
 if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(value))throw Error('Base must be / or a path with safe segments and a trailing slash.');
 return value;
}
async function files(root){const out=[];for(const item of await readdir(root,{withFileTypes:true})){const path=join(root,item.name);if(item.isSymbolicLink())throw Error(`Symlink in public inputs: ${path}`);if(item.isDirectory())out.push(...await files(path));else if(item.isFile())out.push(path);}return out;}
export function isPrivatePath(name){return (name!=='.nojekyll'&&name.split('/').some(part=>part.startsWith('.')||['node_modules','test','tests','__tests__'].includes(part)))||/\.(?:pem|key|p12|pfx|map)$/i.test(name);}
async function assertOutputPath(output){let path=ROOT;for(const segment of relative(ROOT,dirname(output)).split('/')){path=join(path,segment);try{if((await lstat(path)).isSymbolicLink())throw Error('Output ancestors must not be symlinks.');}catch(error){if(error.code!=='ENOENT')throw error;}}}
async function copy(source,destination,{exclude=()=>false}={}){await mkdir(dirname(destination),{recursive:true});await cp(source,destination,{recursive:true,filter:async path=>{if(exclude(path))return false;if(isPrivatePath(basename(path)))throw Error(`Private file in public input: ${path}`);if((await lstat(path)).isSymbolicLink())throw Error(`Symlink in public input: ${path}`);return true;}});}
function git(root,args){return execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();}
async function identity(root){return {revision:git(root,['rev-parse','HEAD']),dirty:Boolean(git(root,['status','--porcelain']))};}
async function signature(root){const paths=git(root,['ls-files','--cached','--others','--exclude-standard','-z']).split('\0').filter(Boolean).sort();const h=createHash('sha256');for(const path of paths){try{h.update(path+'\0');h.update(await readFile(join(root,path)));}catch(error){if(!['ENOENT','EISDIR'].includes(error.code))throw error;h.update(error.code);}}return h.digest('hex');}
export async function buildPublicRelease({output,base='/',focusRoot,greatCircleRoot,stethemRoot,focusEpub='full',readsRoot,banditRoot}={}) {
 base=publicBase(base);focusEpub=focusEpubMode(focusEpub);if(Boolean(readsRoot)!==Boolean(banditRoot))throw Error('Both Reads and Bandit source roots are required together.');const includeAppPreviews=Boolean(readsRoot&&banditRoot);if(!output||![focusRoot,greatCircleRoot,stethemRoot].every(Boolean))throw Error('Explicit fresh output and all three app checkout paths are required.');
 output=resolve(output);if(output===ROOT||!relative(ROOT,output).startsWith('review/'))throw Error('Output must be a new directory under this checkout’s ignored review/.');
 await assertOutputPath(output);
 const inputs=[['focus',await realpath(focusRoot)],['great-circle',await realpath(greatCircleRoot)],['stethem',await realpath(stethemRoot)]];
 let fixtureCount=0;for(const [id,path]of inputs){const actual=JSON.parse(await readFile(join(path,'design/collection.json'),'utf8')),snapshot=JSON.parse(await readFile(join(ROOT,`registry/apps/${id}/collection.json`),'utf8'));if(actual.id!==id||JSON.stringify(actual.fixtures)!==JSON.stringify(snapshot.fixtures))throw Error(`App snapshot mismatch: ${id}; refresh explicitly before packaging.`);fixtureCount+=snapshot.fixtures.length;}
 const before=new Map(await Promise.all(inputs.map(async([id,path])=>[id,await signature(path)])));
 await mkdir(output,{recursive:false});
 const version=async path=>JSON.parse(await readFile(join(path,'package.json'),'utf8')).version;
 const sources={designSystem:{repository:git(ROOT,['remote','get-url','origin']),version:await version(ROOT)}};
 for(const [id,path]of inputs)sources[id]={repository:git(path,['remote','get-url','origin']),version:await version(path),status:'synthetic-preview'};
 for(const path of ['apps/studio','packages/workbench','packages/tokens','packages/appearance','packages/react','collections','registry','LICENSE','LICENSING.md','THIRD_PARTY_NOTICES.md'])await copy(join(ROOT,path),join(output,path),{exclude:input=>!includeAppPreviews&&path==='registry'&&/^apps\/(?:reads|bandit)(?:\/|$)/.test(relative(join(ROOT,'registry'),input))});
 const publicRegistry=JSON.parse(await readFile(join(output,'registry/index.json'),'utf8'));publicRegistry.collections=publicRegistry.collections.filter(path=>includeAppPreviews||!/^apps\/(?:reads|bandit)\//.test(path));await writeFile(join(output,'registry/index.json'),json(publicRegistry));
 // A public read-only viewer is deliberately separate from the local capture runner.
 await writeFile(join(output,'apps/studio/capture-studio.mjs'),`export function mountCaptureStudio(root){const main=document.createElement('main');main.className='cs-shell';const h=document.createElement('h1');h.textContent='Local capture tools';const p=document.createElement('p');p.textContent='Capture generation runs only in the local source checkout. This public viewer has no capture server, terminal access, local exports, or connection to your computer.';const a=document.createElement('a');a.href='../../RELEASE-NOTES.html';a.textContent='Attribution';main.append(h,p,a);root.replaceChildren(main);return{destroy(){root.replaceChildren();}};}\n`);
 const emittedModules=new Map();
 for(const [id,appRoot]of inputs.filter(([id])=>id!=='stethem')) {
  const {build}=await import(pathToFileURL(join(appRoot,'node_modules/vite/dist/node/index.js')));
  const react=(await import(pathToFileURL(join(appRoot,'node_modules/@vitejs/plugin-react/dist/index.js')))).default;
  const appOutput=join(output,'previews',id),moduleIDs=new Set();
  const priorCwd=process.cwd();process.chdir(appRoot);
  try { await build({root:appRoot,configFile:false,envDir:false,base:'./',publicDir:false,mode:'public-release',plugins:[react(),{name:'release-provenance-and-local-url-removal',enforce:'pre',transform(code,path){if(id==='focus'&&focusEpub==='fixture-only'&&path===join(appRoot,'src/domain/epub.ts'))return {code:EPUB_FIXTURE_ONLY_SOURCE,map:null};if(path===join(appRoot,'design/collection.json')){const data=JSON.parse(code);data.fixtures=data.fixtures.map(f=>({...f,url:'?fixture='+encodeURIComponent(f.id)}));return {code:JSON.stringify(data),map:null};}},generateBundle(){for(const id of this.getModuleIds())if(id.includes('/node_modules/'))moduleIDs.add(id.split('?')[0]);}}],build:{outDir:appOutput,emptyOutDir:false,sourcemap:false,rollupOptions:{input:{workbench:join(appRoot,'workbench/index.html')}}}}); } finally { process.chdir(priorCwd); }
  if(id==='focus'&&focusEpub==='fixture-only'&&[...moduleIDs].some(path=>/\/node_modules\/(?:epubjs|marks-pane|path-webpack)\//.test(path)))throw Error('EPUB implementation entered a fixture-only module graph.');
  // Tailwind’s CSS preflight is inlined by PostCSS, outside Rollup’s JS module graph.
  if(id==='focus')moduleIDs.add(join(appRoot,'node_modules/tailwindcss/index.css'));
  emittedModules.set(id,{appRoot,moduleIDs});
  if(id==='focus'&&focusEpub==='fixture-only'){const file=join(appOutput,'workbench/index.html');let html=await readFile(file,'utf8');html=html.replace('<body>','<body><aside data-public-fixture-disclosure role="note" style="padding:12px 16px;border-bottom:1px solid currentColor;font:13px/1.5 system-ui">'+escape(EPUB_FIXTURE_NOTICE)+'</aside>');await writeFile(file,html);}
  if(id==='focus')await copy(join(appRoot,'public/favicon.png'),join(appOutput,'favicon.png'));
  else await copy(join(appRoot,'public/circle.svg'),join(appOutput,'workbench/circle.svg'));
  const collection=JSON.parse(await readFile(join(output,`registry/apps/${id}/collection.json`),'utf8'));
  for(const fixture of collection.fixtures){const original=new URL(fixture.url);fixture.url=`../../../previews/${id}/workbench/${original.search}${original.hash}`;}
  collection.publicRelease={status:'static-app-owned-fixtures',source:sources[id],...(id==='focus'?{epubMode:focusEpub,...(focusEpub==='fixture-only'?{limitation:EPUB_FIXTURE_NOTICE,excludedDependencies:['epubjs','marks-pane','path-webpack']}: {})}:{})};
  if(id==='focus'&&focusEpub==='fixture-only'){collection.summary+=' '+EPUB_FIXTURE_NOTICE;for(const fixture of collection.fixtures)fixture.description=(fixture.description?fixture.description+' ':'')+EPUB_FIXTURE_NOTICE;}
  await writeFile(join(output,`registry/apps/${id}/collection.json`),json(collection));
 }
 const siteCollection=JSON.parse(await readFile(join(output,'registry/apps/stethem/collection.json'),'utf8'));const pageFixtures=new Map();for(const fixture of siteCollection.fixtures)if(!pageFixtures.has(fixture.scenario.page))pageFixtures.set(fixture.scenario.page,fixture.id);
 const site=inputs.find(([id])=>id==='stethem')[1],siteOut=join(output,'previews/stethem'),prefix=base+'previews/stethem/';
 // Allowlisted public assets only. No git metadata, tests, local reports, credentials, or private source trees.
 for(const path of ['app','ui','features','domain','styles','fonts','images','learning-machines','objects','market-river','index.html','404.html','sitemap.xml','styles.css','script.js','museum-video.js','favicon.png','placeholder.webp','museum-poster.jpg','museum.mp4','museum.webp','image.gif','design/tokens.css','workbench/market-metadata.json','vendor/design-system/packages/workbench/theme-adapter.mjs'])await copy(join(site,path),join(siteOut,path));
 for(const path of await files(siteOut))if(extname(path)==='.html'){
  let html=await readFile(path,'utf8');
  const sourcePage='https://stethem.com/'+relative(siteOut,path).replace(/index\.html$/,'');
  html=html.replace(/(<a\b[^>]*\bhref=)(['"])([^'"]*)\2/g,(match,start,quote,value)=>{if(!value||value.startsWith('#')||/^[a-z]+:|^\/\//i.test(value))return match;const target=new URL(value,sourcePage),fixture=pageFixtures.get(target.pathname);return start+quote+(fixture?prefix+'fixtures/'+fixture+'.html'+target.hash:target.href)+quote;});
  html=html.replace(/\b(src|href)=(['"])\/(?!\/)([^'"\s]*)\2/g,(_m,attr,q,path)=>`${attr}=${q}${path.startsWith(prefix.slice(1))?'/'+path:prefix+path}${q}`);
  await writeFile(path,html);
 }
 let setup=await readFile(join(site,'workbench/setup.js'),'utf8');
 setup=setup.replace("const origin=new URL(document.currentScript.src).origin;","const origin=new URL('../',document.currentScript.src).href.replace(/\\/$/,''); const assetOrigin=new URL(origin).origin;")
  .replace("new URL(url,origin)","new URL(url,document.baseURI)").replace("u.origin===origin","u.origin===assetOrigin");
 await writeFile(join(siteOut,'workbench/setup.js'),setup);
 const collection=JSON.parse(await readFile(join(output,'registry/apps/stethem/collection.json'),'utf8'));
 for(const fixture of collection.fixtures){
  const original=new URL(fixture.url),page=fixture.scenario.page,pageFile=page.endsWith('/')?page+'index.html':page;
  let html=await readFile(join(siteOut,pageFile.slice(1)),'utf8');
  if(fixture.scenario.state==='no-js')html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<noscript\b[^>]*>([\s\S]*?)<\/noscript>/gi,'$1');
  const pageDir=page.endsWith('/')?page:page.slice(0,page.lastIndexOf('/')+1);
  html=html.replace(/<head>/i,`<head><base href="${escape(prefix+pageDir.slice(1))}"><script src="${prefix}workbench/setup.js" data-fixture="${escape(fixture.id)}"></script>`);
  await mkdir(join(siteOut,'fixtures'),{recursive:true});await writeFile(join(siteOut,`fixtures/${fixture.id}.html`),html);
  fixture.url=`../../../previews/stethem/fixtures/${fixture.id}.html${original.hash}`;
 }
 collection.publicRelease={status:'static-app-owned-fixtures',source:sources.stethem,adapter:'Original HTML plus deterministic workbench setup. No-JS variants remain labeled simulations.'};
 await writeFile(join(output,'registry/apps/stethem/collection.json'),json(collection));
 // Retain complete licenses of every dependency contributing bundled code.
 let appPreviews=null;
 if(includeAppPreviews){appPreviews=await buildPublicAppPreviews({outputRoot:output,base,readsRoot,banditRoot});for(const id of ['reads','bandit']){const app=appPreviews.apps[id],path=join(output,`registry/apps/${id}/collection.json`);let data=JSON.parse(await readFile(path,'utf8'));const urls=new Map(app.fixtures.map(f=>[f.id,f.url]));if(data.fixtures.length!==urls.size||data.fixtures.some(f=>!urls.has(f.id)))throw Error('Private app snapshot mismatch: '+id);data=publicVersionMetadata(data,app.version);data.fixtures=data.fixtures.map(f=>({...f,url:urls.get(f.id)}));data.publicRelease={status:'synthetic-preview',version:app.version,limitations:appPreviews.limitations};await writeFile(path,json(data));fixtureCount+=data.fixtures.length;sources[id]={version:app.version,status:'synthetic-preview'};}}
 const notices=[...(appPreviews?.notices??[])],licenseGaps=[...(appPreviews?.licenseGaps??[])];
 for(const [app,{appRoot,moduleIDs}]of emittedModules)for(const id of moduleIDs){
  let dir=dirname(id),found;
  while(dir!==dirname(dir)&&dir.includes('node_modules')){try{const pkg=JSON.parse(await readFile(join(dir,'package.json'),'utf8'));if(pkg.name&&pkg.version){found={dir,pkg};break;}}catch{}dir=dirname(dir);}
  if(!found)continue;const key=found.pkg.name+'@'+found.pkg.version;if(notices.some(x=>x.id===key))continue;
  const licenseFiles=(await readdir(found.dir)).filter(name=>/^(licen[sc]e|copying|notice)(\.|$)/i.test(name));
  if(!licenseFiles.length&&found.pkg.name!=='@rsteth/design-system'){licenseGaps.push(key);await copy(join(found.dir,'package.json'),join(output,'licenses',key.replaceAll('/','__'),'package.json'));}
  for(const file of licenseFiles)await copy(join(found.dir,file),join(output,'licenses',key.replaceAll('/','__'),file));
  notices.push({id:key,license:found.pkg.license??'Not declared',files:licenseFiles.map(file=>'licenses/'+key.replaceAll('/','__')+'/'+file)});
 }
 await writeFile(join(output,'BUNDLED-DEPENDENCIES.json'),json(notices));
 const studioPath=join(output,'apps/studio/index.html');let studioHTML=await readFile(studioPath,'utf8');studioHTML=studioHTML.replace('href="./attribution.html" data-attribution-link','href="../../RELEASE-NOTES.html" data-attribution-link');await writeFile(studioPath,studioHTML);
 const notes=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Public release notes</title><body style="max-width:72ch;margin:3rem auto;padding:1rem;font:17px/1.6 system-ui"><h1>Design system · public viewer</h1>${licenseGaps.length?'<p><strong>Local candidate only. Publication is blocked pending complete dependency notices for '+licenseGaps.join(', ')+'.</strong></p>':''}<p>${fixtureCount} real app-owned fixtures from ${includeAppPreviews?'Focus, Great Circle, stethem, Reads and Bandit':'Focus, Great Circle and stethem'} are packaged as static, isolated previews. The surrounding viewer and 84 independent reference studies retain their own styles. Fixture data is deterministic; this is not a live-service or production-health claim.</p>${focusEpub==='fixture-only'?'<p><strong>'+EPUB_FIXTURE_NOTICE+'</strong> The release-only adapter rejects unexpected parser calls. Original app source and registered fixture loaders remain unchanged; epubjs and its dependencies are not distributed in the Focus bundle.</p>':''}<p>Capture generation and local review exports are intentionally excluded. Use the local checkout for capture tools. Source app files have not been changed.</p><p>Robin Stethem’s original design-system code, documentation and neutral authored specimens are MIT licensed. Application source, snapshots and packaged app previews retain their own terms. Reference studies retain their upstream MIT licenses and attribution. Third-party trademarks, logos, fonts, images and other assets are excluded from Robin’s grant; included fonts retain their OFL notices in previews/stethem/fonts.</p><ul><li><a href="LICENSE">MIT license for original design-system work</a></li><li><a href="LICENSING.md">License scope and exclusions</a></li><li><a href="apps/studio/attribution.html">Material and reference attribution</a></li><li><a href="THIRD_PARTY_NOTICES.md">Third-party notices</a></li><li><a href="BUNDLED-DEPENDENCIES.json">Bundled dependency notices</a></li><li><a href="release.json">Source identities and artifact hashes</a></li><li><a href="apps/studio/">Open viewer</a></li></ul><p>Hosted deployments must send Access-Control-Allow-Origin: * for these public static files. Previews retain sandbox="allow-scripts", without same-origin, top-navigation, storage, popup or form privileges. Existing fixture browser/OS limitations still apply.</p></body></html>`;
 await writeFile(join(output,'RELEASE-NOTES.html'),notes);
 await writeFile(join(output,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Design system</title><script>location.replace('./apps/studio/'+location.search+location.hash)</script><a href="./apps/studio/">Open design system</a></html>`);
 await writeFile(join(output,'.nojekyll'),'');
 await writeFile(join(output,'_headers'),`${base}*\n  Access-Control-Allow-Origin: *\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n`);
 // Sanitize exported metadata only, then refresh hashes of any redacted inventories.
 for(const path of await files(output))if(extname(path)==='.json'){const original=await readFile(path,'utf8'),redacted=publicMetadataJSON(original);if(redacted!==original)await writeFile(path,redacted);}
 for(const id of ['focus','great-circle','stethem',...(includeAppPreviews?['reads','bandit']:[])]){const path=join(output,`registry/apps/${id}/collection.json`),data=publicVersionMetadata(JSON.parse(await readFile(path,'utf8')),sources[id].version);if(data.inventory&&data.registrySnapshot){data.registrySnapshot.inventorySha256=hash(await readFile(join(dirname(path),data.inventory)));await writeFile(path,json(data));}}
 const selfPath=join(output,'collections/original/workbench/collection.json');await writeFile(selfPath,json(publicVersionMetadata(JSON.parse(await readFile(selfPath,'utf8')),sources.designSystem.version)));
 const artifacts=[];
 for(const path of await files(output)){
  const name=relative(output,path);if(isPrivatePath(name))throw Error(`Private file in release: ${name}`);
  let bytes=await readFile(path);if(/\.(?:html|mjs|js|css|md)$/.test(name)){const original=bytes.toString(),redacted=redactUnverifiedRevisions(original);if(redacted!==original){await writeFile(path,redacted);bytes=Buffer.from(redacted);}}if(/\.(?:html|mjs|js|json|css|md)$/.test(name)&&/\/Users\/|\/home\//.test(bytes.toString()))throw Error(`Local path in public output: ${name}`);
  artifacts.push({path:name,bytes:bytes.length,sha256:hash(bytes)});
 }
 for(const [id,path]of inputs)if(await signature(path)!==before.get(id))throw Error(`Source changed during release: ${id}; output is not verified.`);
 const report={schemaVersion:1,createdAt:new Date().toISOString(),status:licenseGaps.length?'local-candidate-license-review-required':'local-candidate-not-published',licenseGaps,focusEpub,base,fixtureCount,source:publicSourceMetadata(sources),limitations:['No public deployment or permission change performed.','Fixture packaging and browser checks are separate from application production CI.','MIT covers original design-system work only; applications and third-party material retain their own terms.','Opaque sandbox requires CORS for static assets.'],artifacts};
 await writeFile(join(output,'release.json'),json(report));return {output,base,focusEpub,fixtureCount,licenseGaps,files:artifacts.length,bytes:artifacts.reduce((n,x)=>n+x.bytes,0),source:sources};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){const key={'--output':'output','--base':'base','--focus-root':'focusRoot','--great-circle-root':'greatCircleRoot','--stethem-root':'stethemRoot','--focus-epub':'focusEpub','--reads-root':'readsRoot','--bandit-root':'banditRoot'}[args[i]];if(!key||!args[i+1])throw Error('Usage: node tooling/public-release.mjs --output review/new-release --base /design-system/ --focus-root /path --great-circle-root /path --stethem-root /path [--focus-epub full|fixture-only] [--reads-root /path --bandit-root /path]');options[key]=args[i+1];}console.log(JSON.stringify(await buildPublicRelease(options),null,2));}
