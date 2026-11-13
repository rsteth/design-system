import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parseDocument, isAlias, isMap, isSeq, LineCounter } from 'yaml';
import { nasaReference } from './nasa-reference.mjs';
import { compileTokens } from '../packages/tokens/index.mjs';
import { compileSheet } from './reference-sheets.mjs';
export const REVISION = 'fcc70284932276d085f01ef9f83edde90b1258cb';
export const REPOSITORY = 'https://github.com/VoltAgent/awesome-design-md';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = text => createHash('sha256').update(text).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
export const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const segment = value => {const cleaned=value.toLowerCase().replace(/[^a-z0-9]/g, '');return /^[a-z]/.test(cleaned)?cleaned:'v'+cleaned;};
const fields = ['colors','typography','rounded','spacing','components'];
/** Parse only data. No custom tags, aliases, implicit dates, duplicate keys or executable templates. */
export function parseAnalysis(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0] !== '---') return { analysis: {}, body: text, bodyLine: 1, evidence: {} };
  const end = lines.findIndex((line, i) => i > 0 && line === '---');
  if (end < 0) throw new Error('Unterminated YAML frontmatter');
  const counter = new LineCounter();
  const doc = parseDocument(lines.slice(1,end).join('\n'), {schema:'core',uniqueKeys:true,strict:true,lineCounter:counter});
  if (doc.errors.length || doc.warnings.length) throw new Error([...doc.errors,...doc.warnings].map(e=>e.message).join('; '));
  const evidence = {};
  function inspect(node,path=[]) {
    if (!node) return;
    if (isAlias(node) || node.tag) throw new Error('YAML aliases and explicit tags are prohibited');
    if (node.range) evidence[path.join('.')] = {line: counter.linePos(node.range[0]).line + 1,sourcePath:path.join('.')};
    if (isMap(node)) for (const pair of node.items) {
      const key = pair.key?.value;
      if(typeof key !== 'string' || ['__proto__','prototype','constructor','<<'].includes(key)) throw new Error('Unsafe or non-string YAML key');
      inspect(pair.key); inspect(pair.value,[...path,key]);
    }
    if (isSeq(node)) node.items.forEach((v,i)=>inspect(v,[...path,String(i)]));
  }
  inspect(doc.contents);
  const analysis = doc.toJS({maxAliasCount:0});
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) throw new Error('Frontmatter must be a mapping');
  return {analysis,body:lines.slice(end+1).join('\n'),bodyLine:end+2,evidence};
}
/** Three pinned upstream descriptions contain unquoted colon-space text. Repairs never alter raw evidence. */
export function parsePinnedAnalysis(text, sourceSlug) {
  const repairKeys = {elevenlabs:'description',raycast:'属于',supabase:'description'};
  const repairHashes={"elevenlabs": "3b359acfaafadbb499c7ed3eebe813a76e0be497a7157b77de207fe275068a66", "raycast": "6e2c5137e4d914b70996d589688374a801b6f29a35c9c019c22abb5e0170bda3", "supabase": "f57287d7f44d59e8169dc4b4304ff03c1a2efb37f5433b9c04460caae7710880"};
  const key=repairKeys[sourceSlug];
  if(!key)return {...parseAnalysis(text),repairs:[]};
  if(hash(text)!==repairHashes[sourceSlug])throw new Error('Pinned repair source hash mismatch');
  const lines=text.split('\n');const index=lines.findIndex(line=>line.startsWith(key+': '));
  if(index<0)throw new Error('Pinned repair target missing');
  const original=lines[index];lines[index]=key+': '+JSON.stringify(original.slice(key.length+2));
  return {...parseAnalysis(lines.join('\n')),repairs:[{line:index+1,original,normalized:lines[index],status:'inferred-parser-repair',reason:'Quote an invalid upstream plain scalar containing colon-space; no content or field-name correction.'}]};
}
export function sectionsFrom(body, firstLine) {
  const sections=[];let current=null;let fenced=false;
  for(const [i,line] of body.split('\n').entries()) {
    if(/^\s*(```|~~~)/.test(line)) fenced=!fenced;
    const heading=!fenced && /^(#{1,6})\s+(.+)$/.exec(line);
    if(heading) {current={heading:heading[2],level:heading[1].length,text:'',line:firstLine+i};sections.push(current);}
    else {if(!current){current={heading:'Analysis',level:1,text:'',line:firstLine+i};sections.push(current);}current.text+=line+'\n';}
  }
  return sections.filter(s=>s.text.trim() || s.heading!=='Analysis').map(s=>({...s,text:s.text.trim()}));
}
export function safeToken(value, path) {
  if(typeof value==='number')return Number.isFinite(value)?{type:'number',value}:null;
  if(typeof value!=='string' || !value.trim() || /[;{}<>\\]|url\s*\(|@|\/\*|expression\s*\(/i.test(value)) return null;
  if (/^#(?:[a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(value) || /^(?:rgb|hsl)a?\([\d\s.,%+-]+\)$/i.test(value)) return {type:'color',value};
  if (/^-?(?:\d*\.)?\d+(?:px|rem|em|%|vh|vw|s|ms)$/.test(value))return {type:'dimension',value};
  if (/fontfamily$/i.test(path) && /^[\w\s,'".-]+$/.test(value))return {type:'fontFamily',value};
  return null;
}
export function normalizeTokens(analysis,evidence,text) {
  const tokens=[];const paths=new Set();const rejected=[];
  function visit(value, parts) {
    if(value && typeof value==='object') {for(const [k,v] of Object.entries(value))visit(v,[...parts,k]);return;}
    const sourcePath=parts.join('.');const token=safeToken(value,sourcePath);
    if(!token){rejected.push({sourcePath,value,reason:'Not a supported safe CSS literal; preserved in analysis'});return;}
    let path=parts.map(segment).join('.');
    if(paths.has(path))path+='.'+segment(hash(sourcePath).slice(0,10));
    paths.add(path);tokens.push({path,sourcePath,...token,status:'unverified',evidence:evidence[sourcePath]??{sourcePath}});
  }
  for(const field of fields.filter(f=>f!=='components'))if(analysis[field])visit(analysis[field],[field]);
  // Prose-only documents retain reported hex values without inferring semantic roles.
  if(!tokens.length)for(const [i,line] of text.split('\n').entries())for(const match of line.matchAll(/#[a-fA-F0-9]{6}\b/g)) {
    if(tokens.some(t=>t.value.toLowerCase()===match[0].toLowerCase()))continue;
    tokens.push({path:`reported.color${tokens.length+1}`,sourcePath:`line:${i+1}`,...safeToken(match[0],''),status:'unverified',evidence:{line:i+1,text:line}});
  }
  return {tokens,rejected};
}
export function homepageCandidates(text) {
  const candidates=[];
  for(const [i,line] of text.split('\n').entries())for(const match of line.matchAll(/https?:\/\/[^\s<>"'`\])]+/g)) {
    const raw=match[0].replace(/[.,;:]+$/,'');let url;try{url=new URL(raw);}catch{continue;}
    if(/(^|\.)(getdesign\.(?:io|dev)|github\.com|githubusercontent\.com)$/i.test(url.hostname) || /getdesign/i.test(url.hostname))continue;
    if(candidates.some(c=>c.url===url.href))continue;
    candidates.push({url:url.href,evidence:{line:i+1,text:line},status:'unverified-source-candidate'});
  }
  return {status:candidates.length?'unverified':'missing',candidates};
}
/** Config routes are confined to neutral specimen documents, then made mount-relative. */
export function normalizeSpecimenRoute(route) {
  if(typeof route !== 'string' || !/^\/collections\/reference-specimens\/[a-z0-9]+(?:[.-][a-z0-9]+)*\/index\.html\?view=(?:components|patterns|screens)$/.test(route))throw new Error('Unsafe specimen route');
  return '../../reference-specimens/' + route.slice('/collections/reference-specimens/'.length);
}
async function optional(file,fallback){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
async function walk(dir){let result=[];for(const e of await readdir(dir,{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;})){const p=join(dir,e.name);result.push(...(e.isDirectory()?await walk(p):[p]));}return result;}
export async function generate({source,check=false,destination=root}={}) {
  const output=new Map();const add=(path,value)=>output.set(join(destination,path),value);
  const pins=JSON.parse(await readFile(join(root,'tooling/reference-sources.json'),'utf8'));
  let names=Object.keys(pins.files).sort(),license,readSource;
  if(source){
    const sourceRoot=resolve(source);
    const git=(...args)=>execFileSync('git',['-C',sourceRoot,...args],{encoding:'utf8',maxBuffer:20*1024*1024});
    if(git('rev-parse','HEAD').trim()!==REVISION)throw new Error('Source HEAD does not match pinned revision');
    if(git('status','--porcelain').trim())throw new Error('Source checkout must be clean');
    names=git('ls-tree','-r','--name-only',REVISION,'design-md').trim().split('\n').filter(p=>/^design-md\/[^/]+\/DESIGN\.md$/.test(p)).sort();
    license=git('show',`${REVISION}:LICENSE`);readSource=async path=>git('show',`${REVISION}:${path}`);
  }else{
    license=await readFile(join(root,'collections/reference/stripe/LICENSE'),'utf8');
    readSource=path=>readFile(join(root,'collections/reference',slugify(path.split('/')[1]),'DESIGN.md'),'utf8');
  }
  if(names.length!==84)throw new Error(`Expected 84 analyses, found ${names.length}`);
  if(hash(license)!==pins.licenseSha256)throw new Error('Upstream license hash mismatch');
  const specimens=await optional(join(destination,'collections/reference-specimens/manifest.json'),{studies:[]});
  const homepages=await optional(join(destination,'registry/reference-homepages.json'),{});
  const prose=await optional(join(root,'tooling/reference-prose-normalizations.json'),{studies:{}});
  const recoveries=await optional(join(root,'tooling/reference-source-recoveries.json'),{studies:{}});
  const supplements=await optional(join(root,'registry/reference-supplements.json'),{studies:{}});
  const sheetReports=[];
  const collections=[];
  for(const sourcePath of names) {
    const sourceSlug=sourcePath.split('/')[1],slug=slugify(sourceSlug),id='reference-'+slug,base=`collections/reference/${slug}`;
    const text=await readSource(sourcePath);
    if(hash(text)!==pins.files[sourcePath])throw new Error(`Pinned source hash mismatch: ${sourcePath}`);
    const parsed=parsePinnedAnalysis(text,sourceSlug);
    const sourceInfo={repository:REPOSITORY,fork:'https://github.com/rsteth/awesome-design-md-p',revision:REVISION,path:sourcePath,sha256:hash(text),url:`${REPOSITORY}/blob/${REVISION}/${sourcePath}`};
    const title=sourceSlug.split(/[-.]/).map(s=>s[0].toUpperCase()+s.slice(1)).join(' ');
    const normalized=normalizeTokens(parsed.analysis,parsed.evidence,text);
    const provenance={status:'independent-analysis',sources:[{title:'VoltAgent awesome-design-md independent analysis',url:sourceInfo.url}],verification:'unverified-secondary-analysis'};
    const study={schemaVersion:1,id,title,classification:'independent-unverified-analysis',source:sourceInfo,...(parsed.analysis.name?{sourceName:parsed.analysis.name}:{}),titleProvenance:{status:'inferred',basis:'Source directory label, normalized for navigation; original source name is retained without correction.',sourceValue:sourceSlug,...(parsed.analysis.name?{originalName:parsed.analysis.name}:{})},...(parsed.analysis.description?{description:parsed.analysis.description}:{}),analysis:parsed.analysis,normalizationRepairs:parsed.repairs,sections:sectionsFrom(parsed.body,parsed.bodyLine),tokens:normalized.tokens,rejectedTokens:normalized.rejected,homepage:homepageCandidates(text),completeness:{presentFields:fields.filter(f=>Object.hasOwn(parsed.analysis,f)),missingFields:fields.filter(f=>!Object.hasOwn(parsed.analysis,f)),tokenRoles:'incomplete',note:'Missing fields are not reconstructed. Prose-only colors have no inferred semantic role.'},provenance,limitations:['Independent secondary analysis, not an official brand system; all reported values are unverified.','No brand assets, logos, font binaries or screenshots copied. Font names are documentary, not font licenses.','Safe CSS literals are extracted without claiming complete roles, state coverage or visual fidelity.','Markdown is retained as inert evidence, never executed or rendered as raw HTML.']};
    const verified=homepages.entries?.[id];
    if(verified && homepages.sourceRevision===REVISION)study.homepage.verification=verified;
    const specimen=specimens.studies?.find(s=>s.sourceSlug===sourceSlug);
    const fixtures=(specimen?.fixtures??[]).map(f=>({id:slugify(f.id),title:f.title,section:f.kind,url:normalizeSpecimenRoute(f.route),description:'Original neutral specimen inferred from unverified secondary analysis; not a branded reproduction.'}));
    const recovery=recoveries.studies[slug];
    if(recovery)for(const [path,item]of Object.entries(recovery.recoveries)){if(!Number.isInteger(item.supportingLine)||item.supportingLine<1||!item.supportingText||item.classification!=='secondary-source-recovery'||text.split('\n')[item.supportingLine-1]!==item.supportingText)throw new Error('Recovery supporting text mismatch: '+slug+'/'+path);}
    const sheet=compileSheet(study,parsed.evidence,prose.studies[slug],recovery,supplements.studies[slug]);
    add(`collections/reference-sheets/${slug}/index.html`,sheet.html);
    add(`collections/reference-sheets/${slug}/patterns.html`,sheet.patternsHTML);
    sheetReports.push(sheet.report);
    fixtures.unshift({id:'reference-'+slug+'-recipe-sheet',title:'Source-linked recipe sheet · authored interpretation',section:'components',url:`../../reference-sheets/${slug}/index.html`,description:'Generated visual foundations and component interpretations. Unofficial; neutral authored structure and system fonts, not original product components.'});
    fixtures.unshift({id:'reference-'+slug+'-standard-patterns',title:'Standard patterns · original compositions',section:'patterns',url:`../../reference-sheets/${slug}/patterns.html`,description:'Three original illustrative patterns composed from the study tokens: overview, search and selection, and editable preferences. Not official or copied site UI.',states:['default','completed','filtered','empty','selected','invalid','saved locally','canceled']});
    if(specimen)study.specimenProvenance=specimen.provenance;
    const manifest={schemaVersion:1,id,title,kind:'reference',renderer:'dom',summary:'Independent unverified reference',tokens:'tokens.json',study:'study.json',themes:['analysis'],source:sourceInfo,provenance,license:{spdx:'MIT',file:'LICENSE',note:'Upstream analysis copyright (c) 2026 VoltAgent, MIT. Brand names belong to their respective owners; no affiliation or asset/font license is implied.'},fixtures,verification:{status:'unverified-secondary-analysis',note:'Source values have not been verified against the brand website.'},...(specimen?{specimenProvenance:specimen.provenance}:{})};
    const tokens={schemaVersion:1,namespace:id,modes:[{id:'analysis',selector:':root',tokens:Object.fromEntries(normalized.tokens.map(t=>[t.path,{type:t.type,value:t.value,provenance:{status:t.status,sourcePath:t.sourcePath,evidence:t.evidence}}]))}]};
    if(!normalized.tokens.length)throw new Error(`${id}: no safe extracted tokens; empty token contract requires explicit handling`);
    for(const [file,contents] of [['collection.json',json(manifest)],['study.json',json(study)],['tokens.json',json(tokens)],['tokens.css',compileTokens(tokens)],['DESIGN.md',text],['LICENSE',license],['ATTRIBUTION.md',`# Independent reference analysis\n\nCopyright (c) 2026 VoltAgent. Original analysis licensed under the accompanying MIT LICENSE.\n\nSource: ${sourceInfo.url}\n\nSHA-256: ${sourceInfo.sha256}\n\nUnverified secondary analysis, not an official brand system. Original neutral specimens, where registered, are inferred additions. No logos, images or font files are copied.\n`]])add(`${base}/${file}`,contents);
    collections.push(`../${base}/collection.json`);
  }
  add('collections/reference-sheets/report.json',json({schemaVersion:1,studies:sheetReports}));
  const nasa=await nasaReference(root);for(const [path,value]of nasa.output)add(path,value);collections.push(nasa.collection);
  add('registry/references.json',json({schemaVersion:1,source:{repository:REPOSITORY,revision:REVISION},collections}));
  const extras=(await walk(join(destination,'collections/reference'))).filter(p=>!output.has(p));
  if(extras.length)throw new Error(`Unexpected generated reference files: ${extras.join(', ')}`);
  const authoredSheetFiles=new Set(['sheet.css','sheet.mjs','patterns.css','patterns.mjs','README.md'].map(file=>join(destination,'collections/reference-sheets',file)));
  const extraSheets=(await walk(join(destination,'collections/reference-sheets'))).filter(path=>!output.has(path)&&!authoredSheetFiles.has(path));
  if(extraSheets.length)throw new Error(`Unexpected generated sheet files: ${extraSheets.join(', ')}`);
  const stale=[];for(const [path,contents] of output){if(check){if(await readFile(path,'utf8').catch(()=>null)!==contents)stale.push(path);}else{await mkdir(dirname(path),{recursive:true});await writeFile(path,contents);}}
  if(stale.length)throw new Error(`Stale or missing imports (${stale.length}): ${stale.join(', ')}`);
  return {collections:collections.length,files:output.size};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2);const sourceIndex=args.indexOf('--source');
  generate({check:args.includes('--check'),source:sourceIndex<0?undefined:args[sourceIndex+1]}).then(result=>console.log(`Reference import ${args.includes('--check')?'verified':'generated'}: ${result.collections} analyses, ${result.files} files.`)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
