/** Release-only synthetic app adapters. Source checkouts are read-only inputs. */
import {readFile,writeFile,mkdir,readdir,lstat,realpath} from 'node:fs/promises';
import {resolve,join,dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {assertRegistryFresh} from './registry-freshness.mjs';
import {BANDIT_SOURCES,BANDIT_ASSETS,adaptBanditWaitlist,buildBandit} from './public-bandit-preview.mjs';
export {BANDIT_SOURCES,BANDIT_ASSETS,adaptBanditWaitlist};
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=value=>JSON.stringify(value,null,2)+'\n';
export const PREVIEW_NOTICE='Synthetic design preview. No account, backend, provider, or live waiting list is connected. Nothing is saved or sent.';
export const READS_SOURCES=Object.freeze(['public/index.html','public/style.css','public/app.js','public/waitlist-client.js','design/fixtures.mjs','design/coverage.mjs','design/fixture-entry.mjs','workbench/vendor/workbench/theme-adapter.mjs']);
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
 // Keep the actual recording handlers, but feed only a generated fixture File.
 source=replaceOnce(source,"$('sample').files[0]",'globalThis.__readsSyntheticRecording','Reads sample selection');
 source=replaceOnce(source,"$('sample').files[0]",'globalThis.__readsSyntheticRecording','Reads recording submission');
 source=replaceOnce(source,'await startSession();',"await startSession();\n$('sample').disabled = true;",'Reads disabled upload');
 // Route-like strings below are only keys in the in-memory fixture adapter.
 return source.replaceAll('/api/','/fixture-data/').replaceAll("'/auth/login'",JSON.stringify(prefix+'fixture/?fixture=studio-empty')).replaceAll("location.assign('/')",`location.assign(${JSON.stringify(prefix+'fixture/?fixture=landing')})`);
}
export function adaptReadsWaitlist(source){
 if(!source.includes('export function loadWaitlist({force=false}={})'))throw Error('Source adapter drift: Reads waitlist configuration');
 source=replaceOnce(source,/\bfetch\(/g,'globalThis.__readsFixtureFetch(','Reads synthetic waitlist calls');
 source=replaceOnce(source,'input,button[type="submit"]','input,button[type="submit"],button[data-preview-submit]','Reads adapted submit busy state');
 source=replaceOnce(source,"const value={email:$('waitlist-email').value,consent:$('waitlist-consent').checked,website:$('waitlist-website').value};", "const value={email:'preview@example.test',consent:$('waitlist-consent').checked,website:''};",'Reads synthetic contact');
 source=replaceSection(source,"    const digest=await crypto.subtle.digest", "    attempt.stage='sending';", "    const hash='synthetic-only';\n",'Reads unnecessary private digest');
 source=replaceOnce(source,'Thank you. You are on the list. No email has been sent; when Reads writes, it will be with your invitation.','Synthetic preview complete. Nothing was saved. No email has been sent.','Reads synthetic success');
 return source.replaceAll('/api/','/fixture-data/');
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
 await output(out,'design/coverage.mjs',await input(root,'design/coverage.mjs'));

 let entry=(await input(root,'design/fixture-entry.mjs')).toString();
 entry=replaceOnce(entry,"from '/workbench/vendor/workbench/theme-adapter.mjs'","from '../theme-adapter.mjs'",'Reads theme adapter');
 entry=replaceOnce(entry,'globalThis.fetch=createFixtureTransport(id);','globalThis.__readsFixtureFetch=createFixtureTransport(id);','Reads transport');
 entry=replaceOnce(entry,"await import('/app.js')",`globalThis.__readsSyntheticRecording = new File([Uint8Array.from(atob(${JSON.stringify(syntheticAudio().toString('base64'))}),c=>c.charCodeAt(0))],'synthetic-tone.wav',{type:'audio/wav'});\nawait import('../app.js')`,'Reads product entry');

 entry=entry.replaceAll("'/fixture?fixture=",`'${prefix}fixture/?fixture=`).replaceAll("'Design preview | Synthetic data only | Nothing is saved or sent'",JSON.stringify(PREVIEW_NOTICE));
 // Match the packaged link paths too, including the original home-link intent.
 entry=replaceOnce(entry,"document.querySelectorAll('a[href=\"/\"],a[href=\"/auth/login\"]')","document.querySelectorAll('.wordmark,#header-login,#login')",'Reads fixture navigation');
 entry += `
// No user file is read: recording fixtures display only the generated sample.
const sampleInput=document.getElementById('sample');
if(id.startsWith('recording-')){
 const files=new DataTransfer();files.items.add(globalThis.__readsSyntheticRecording);sampleInput.files=files.files;
 sampleInput.dispatchEvent(new Event('change'));
}
// Opaque frames deliberately lack allow-forms. Keep real handlers but invoke them
// with a local event; the observer also handles hosted voice forms added on rerender.
function adaptForms(){for (const form of document.forms) {
 if(form.dataset.previewAdapted)continue;

 const submit = [...form.querySelectorAll('button')].find(button => button.type === 'submit');
 if (!submit || !form.onsubmit) continue;
 form.dataset.previewAdapted='true';
 submit.dataset.previewSubmit='true';
 submit.type = 'button';
 submit.onclick = event => { event.preventDefault(); if (form.reportValidity()) form.onsubmit(event); };
 form.addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.matches('input:not([type=file])')) { event.preventDefault(); if (!submit.disabled) submit.click(); } });
}}
adaptForms();new MutationObserver(adaptForms).observe(document.body,{childList:true,subtree:true});
`;
 await output(out,'design/fixture-entry.mjs',entry);
 await output(out,'theme-adapter.mjs',await input(root,'workbench/vendor/workbench/theme-adapter.mjs'));
 await output(out,'assets/synthetic-tone.wav',syntheticAudio());
 return {fixtures:collection.fixtures.map(({id})=>({id,url:'../../../previews/reads/fixture/?fixture='+encodeURIComponent(id)+(id==='account-denied'?'&auth=failed':'')})),version:JSON.parse((await input(root,'package.json')).toString()).version,status:'synthetic-preview',sourceFiles:READS_SOURCES,adapters:['Product markup, styles and renderer; only in-memory fixture requests.','Waitlist runs against synthetic in-memory responses; contact details replaced before handling. User file selection disabled; recording handlers receive generated audio only. Authentication navigation removed.','A generated one-second tone replaces every original audio route.'],excluded:['src/ (server, authentication, providers, persistence)','launcher/','infra/','environment files','source maps','account data','real audio or voice recordings']};
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
 const bandit=await buildBandit({root:roots.bandit,out:join(outputRoot,'previews/bandit'),base,collection:collections.bandit,outputRoot},{ROOT,input,output,replaceOnce,replaceSection,dependencyNotices,PREVIEW_CSP,PREVIEW_NOTICE,hash});
 const apps={reads,bandit:bandit.app};
 for(const id of ['reads','bandit'])await output(outputRoot,'previews/'+id+'/fixture-catalog.json',json(collections[id].fixtures.map(({id,title,section,states})=>({id,title,section,states}))));
 for(const id of ['reads','bandit']){const pkg=JSON.parse((await input(roots[id],'package.json')).toString());if(pkg.version!==apps[id].version)throw Error('App package version drift.');if(before[id]!==await signature(roots[id],sources[id]))throw Error(`Source changed during app preview packaging: ${id}`);}
 const files=[];for(const id of ['reads','bandit'])for(const path of await list(join(outputRoot,'previews',id))){const bytes=await readFile(path),name=relative(outputRoot,path);assertPublicPreviewText(name,bytes.toString());files.push({path:name,bytes:bytes.length,sha256:hash(bytes)});}
 return {apps,notices:bandit.notices,licenseGaps:bandit.licenseGaps,files,sourceUnchanged:true,sourceVerification:'Allowlisted source bytes and git working-tree status matched before and after. Ignored app outputs are not hashed.',limitations:['Synthetic previews only; production authentication, services and private data are not included.','Original-work ownership remains unchanged. Frontend code and listed design assets are inspectable by visitors.','Hosting must supply Access-Control-Allow-Origin: * for opaque allow-scripts-only frames.','No source maps, credentials, environment loading, private commit revisions or public network requests.']};
}
