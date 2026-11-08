import { compilePatterns } from './reference-patterns.mjs';
import { deriveSheetPalette } from './reference-palette.mjs';
import { renderSupplement } from './reference-supplements.mjs';
/** Compile analysis data into inert, source-linked specimens. Never executes source CSS/HTML. */
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const own = (object, path) => path.split('.').reduce((value, key) => !key || ['__proto__','constructor','prototype'].includes(key) || !record(value) || !Object.hasOwn(value,key) ? undefined : value[key], object);
export function resolveValue(value, analysis, chain = []) {
  if (chain.length > 24) throw new Error('Reference depth limit');
  if (typeof value !== 'string') return value;
  const full = /^\{([^{}]+)\}$/.exec(value);
  const resolve = path => {
    if (chain.includes(path)) throw new Error('Reference cycle: '+path);
    const next = own(analysis,path);
    if (next === undefined) throw new Error('Missing reference: '+path);
    return resolveValue(next,analysis,[...chain,path]);
  };
  if (full) return resolve(full[1]);
  return value.replace(/\{([^{}]+)\}/g, (_, path) => {
    const next=resolve(path);if(typeof next!=='string' && typeof next!=='number')throw new Error('Non-scalar interpolation');return String(next);
  });
}
const color = value => /^(?:#[a-f\d]{3}|#[a-f\d]{4}|#[a-f\d]{6}|#[a-f\d]{8}|transparent|currentColor|black|white|(?:rgb|hsl)a?\([\d\s.,%+-]+\))$/i.test(value);
const length = value => value === '0' || /^-?(?:\d*\.)?\d+(?:px|rem|em|%|vh|vw)$/.test(value) && Number.isFinite(parseFloat(value)) && Math.abs(parseFloat(value))<=100000;
const lengths = value => value.split(/\s+/).length<=4 && value.split(/\s+/).every(length);
const number = (value, min, max) => /^-?(?:\d*\.)?\d+$/.test(value) && +value>=min && +value<=max;
const mapped={backgroundColor:'background-color',textColor:'color',color:'color',borderColor:'border-color',rounded:'border-radius',padding:'padding',height:'height',width:'width',minHeight:'min-height',opacity:'opacity',fontSize:'font-size',fontWeight:'font-weight',lineHeight:'line-height',letterSpacing:'letter-spacing',borderWidth:'border-width',borderStyle:'border-style',textTransform:'text-transform',shadow:'box-shadow','aspect-ratio':'aspect-ratio'};
export function safeDeclaration(key, value) {
  if (!['string','number'].includes(typeof value) || !Number.isFinite(typeof value==='number'?value:0)) return null;
  const v=String(value).trim();
  if (!v || /[;{}<>\\@]|url\s*\(|expression\s*\(|\/\*/i.test(v)) return null;
  if(key==='fontFamily' && !/^[\w\s,'".-]+$/.test(v))return null;
  if(key==='fontFamily')return ['font-family',/mono|courier/i.test(v)?'ui-monospace, monospace':/serif|georgia|times/i.test(v)&&!/sans-serif/i.test(v)?'ui-serif, Georgia, serif':'system-ui, sans-serif'];
  if(['border','borderBottom'].includes(key))return /^(?:0|none)$/.test(v)|| /^\d+(?:\.\d+)?(?:px|rem|em)\s+(?:solid|dashed|dotted)\s+/.test(v)&&color(v.replace(/^\S+\s+\S+\s+/,'')) ? [key==='border'?'border':'border-bottom',v] : null;
  if(key==='fontFeature') {const tags=v.split(',').map(x=>x.trim().replace(/^["']|["']$/g,''));return tags.every(x=>/^[a-z0-9]{4}$/.test(x))?['font-feature-settings',tags.map(x=>'"'+x+'"').join(', ')]:null;}
  const property=mapped[key]; if(!property)return null;
  if(['backgroundColor','textColor','color','borderColor'].includes(key))return color(v)?[property,v]:null;
  if(['padding','rounded','borderWidth'].includes(key))return lengths(v)?[property,v]:null;
  if(key==='letterSpacing' && v==='normal')return [property,v];
  if(key==='opacity')return number(v,0,1)?[property,v]:null;
  if(['fontSize','height','width','minHeight','letterSpacing'].includes(key))return length(v)?[property,v]:null;
  if(key==='fontWeight')return number(v,1,1000)||/^(normal|bold)$/.test(v)?[property,v]:null;
  if(key==='lineHeight')return number(v,0.5,5)||length(v)&&/[a-z%]/.test(v)?[property,v]:null;
  if(key==='borderStyle')return /^(none|solid|dashed|dotted)$/.test(v)?[property,v]:null;
  if(key==='textTransform')return /^(none|uppercase|lowercase|capitalize)$/.test(v)?[property,v]:null;
  if(key==='aspect-ratio')return /^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(v)?[property,v]:null;
  if(key==='shadow' && /^(?:rgba?\([^)]*\)|#[a-f\d]{3,8})\s+/i.test(v)){const match=/^(rgba?\([^)]*\)|#[a-f\d]{3,8})\s+(.+)$/i.exec(v);if(match&&color(match[1])&&match[2].split(/\s+/).length>=2&&lengths(match[2]))return [property,match[2]+' '+match[1]];}
  if(key==='shadow')return v==='none'|| /^(?:inset\s+)?(?:-?\d+(?:\.\d+)?(?:px|rem|em)?\s+){2,4}(?:#[a-f\d]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(v)?[property,v]:null;
  return null;
}
export function compileStyle(recipe, analysis, evidence={}, path='', recoveries={}) {
  const declarations={}, rows=[],parts={};
  function add(key, value, sourcePath) {
    const recovery=recoveries[sourcePath];
    if(recovery){
      if(JSON.stringify(value)!==JSON.stringify(recovery.original))throw new Error('Recovery source value mismatch: '+sourcePath);
      const resolved=resolveValue(recovery.value,analysis),safe=safeDeclaration(recovery.property,resolved);
      if(!safe)throw new Error('Unsafe recovery declaration: '+sourcePath);
      declarations[safe[0]]=safe[1];
      rows.push({property:key,value,resolved,status:'Recovered from pinned source prose; rendered as '+safe[0],line:evidence[sourcePath]?.line,recovery:{classification:recovery.classification,property:recovery.property,supportingLine:recovery.supportingLine,reviewedAt:recovery.reviewedAt,reason:recovery.reason}});
      return;
    }
    let resolved;
    try {resolved=resolveValue(value,analysis);}catch(error){rows.push({property:key,value,status:error.message,line:evidence[sourcePath]?.line});return;}
    if (key==='typography' && record(resolved)) { for(const [k,v] of Object.entries(resolved))add(k,v, /^\{([^{}]+)\}$/.exec(String(value))?.[1]+'.'+k); return; }
    if(key==='description'){rows.push({property:key,value,resolved,status:'Source description; not a CSS property',line:evidence[sourcePath]?.line});return;}
    if(key==='size'){const size=safeDeclaration('width',resolved);if(size){declarations.width=size[1];declarations.height=size[1];rows.push({property:key,value,resolved,status:'Rendered as width and height; authored size interpretation',line:evidence[sourcePath]?.line});return;}}
    if(['item-divider','activeIndicator'].includes(key)&&color(String(resolved))){declarations[key==='item-divider'?'--sample-divider':'--sample-active']=String(resolved);rows.push({property:key,value,resolved,status:'Rendered in authored navigation indicator/divider',line:evidence[sourcePath]?.line});return;}
    const target={headerBackground:['tableHeader','backgroundColor'],headerTypography:['tableHeader','typography'],bodyTypography:['tableBody','typography'],cellPadding:['tableCells','padding'],rowBorder:['tableCells','borderColor'],captionTypography:['tableCaption','typography']}[key];
    if(target){const nested=compileStyle({[target[1]]:value},analysis,evidence);if(nested.style){parts[target[0]]=(parts[target[0]]??'')+nested.style+';';rows.push({property:key,value,resolved,status:'Rendered on '+target[0],line:evidence[sourcePath]?.line});return;}}
    const safe=safeDeclaration(key,resolved);
    rows.push({property:key,value,resolved,status:safe?(key==='fontFamily'?'System-font substitution':'Rendered'):'Not rendered: unsupported or unsafe',line:evidence[sourcePath]?.line});
    if(safe)declarations[safe[0]]=safe[1];
  }
  if(record(recipe))for(const [key,value]of Object.entries(recipe))add(key,value,path?path+'.'+key:key);
  return {style:Object.entries(declarations).map(([k,v])=>k+':'+v).join(';'),rows,parts};
}
export function specimenKind(name) {
  const words=name.toLowerCase().split(/[^a-z0-9]+/);
  const has=(...values)=>values.some(value=>words.includes(value));
  // Asset words describe context, not a reason to discard a semantic control.
  if(has('button','cta'))return 'button';
  if(has('table','datatable'))return 'table';
  if(has('input','search','textfield','textarea','field'))return 'field';
  if(has('badge','tag','chip','pill'))return 'badge';
  if(has('navigation','navbar','nav','tab','tabs','tabbar','menu'))return 'navigation';
  if(has('card','panel'))return 'card';
  return 'surface';
}
/** Exact citations remain inspectable but do not repeat across the visual catalog. */
function sourceLink(study,line,label='Source analysis') {
  if (label !== 'Pinned analysis by VoltAgent') return `<template class="source-evidence" data-source-url="${escapeHTML(study.source.url+(Number.isInteger(line)?'#L'+line:''))}"${Number.isInteger(line)?` data-source-line="${line}"`:''} data-source-label="${escapeHTML(label)}"></template>`;
  return `<a href="${escapeHTML(study.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} ↗</a>`;
}
function evidenceDetails(rows,study){return `<details class="evidence"><summary>Properties &amp; interpretation (${rows.length})</summary><dl>${rows.map(row=>`<div><dt>${escapeHTML(row.property)} ${sourceLink(study,row.line,'Evidence')}</dt><dd><code>${escapeHTML(typeof row.value==='object'?JSON.stringify(row.value):row.value)}</code>${row.resolved!==undefined&&row.resolved!==row.value?` → <code>${escapeHTML(typeof row.resolved==='object'?JSON.stringify(row.resolved):row.resolved)}</code>`:''}<small>${escapeHTML(row.status)}</small>${row.recovery?`<p class="recovery">${sourceLink(study,row.recovery.supportingLine,'Supporting prose')} · reviewed ${escapeHTML(row.recovery.reviewedAt)}<br>${escapeHTML(row.recovery.reason)} Original field remains unchanged.</p>`:''}</dd></div>`).join('')}</dl></details>`;}
function renderSample(kind,name,style,index,parts={}){
  const boundedStyle=style+(/(?:^|;)height:/.test(style)?';min-height:0;max-height:none':'');
  const attrs=`class="sample ${kind}" style="${escapeHTML(boundedStyle)}"`;
  if(kind==='surface' && /logo|avatar|photo|image|illustration|video|icon/.test(name))return `<div ${attrs}>Asset withheld<span class="sample-subtitle">Original placeholder only</span></div>`;
  if(kind==='button')return `<button type="button" ${attrs} data-demo ${/disabled/.test(name)?'disabled':''}>${/disabled/.test(name)?'Unavailable':'Try action'}</button>`;
  if(kind==='field')return `<label class="field-label" for="field-${index}">Example field<input ${attrs} id="field-${index}" autocomplete="off" placeholder="Type a local sample" ${/disabled/.test(name)?'disabled':''} ${/error|invalid/.test(name)?'aria-invalid="true"':''}></label>`;
  if(kind==='badge')return `<span ${attrs}>Example label</span>`;
  if(kind==='navigation')return `<nav aria-label="Sample navigation ${index}" ${attrs}><button type="button" data-nav aria-pressed="true">Overview</button><button type="button" data-nav aria-pressed="false">Details</button></nav>`;
  if(kind==='table'){const cells=`style="${escapeHTML(parts.tableCells??'')}"`;return `<div class="table-wrap"><table ${attrs}><caption style="${escapeHTML(parts.tableCaption??'')}">Invented sample data</caption><thead style="${escapeHTML(parts.tableHeader??'')}"><tr><th ${cells}>Item</th><th ${cells}>Status</th></tr></thead><tbody style="${escapeHTML(parts.tableBody??'')}"><tr><td ${cells}>First example</td><td ${cells}>Ready</td></tr><tr><td ${cells}>Second example</td><td ${cells}>Draft</td></tr></tbody></table></div>`;}
  if(kind==='card')return `<article ${attrs}><strong>Room for an idea</strong><p>Original placeholder content. Study the surface, spacing and type.</p></article>`;
  return `<div ${attrs}>Aa · Sample surface<span class="sample-subtitle">Original structure</span></div>`;
}
export function compileSheet(study, sourceEvidence={}, normalization, sourceRecovery, supplement) {
  if(normalization && normalization.sourceSha256!==study.source.sha256)throw new Error('Prose normalization hash mismatch: '+study.id);
  if(sourceRecovery && sourceRecovery.sourceSha256!==study.source.sha256)throw new Error('Source recovery hash mismatch: '+study.id);
  const recoveries=sourceRecovery?.recoveries??{};
  const analysis=normalization?.analysis??study.analysis, evidence=normalization?.evidence??sourceEvidence;
  const sheetPalette=deriveSheetPalette(analysis,evidence);
  const paletteEvidence=Object.entries(sheetPalette.roles).map(([role,value])=>`<li><strong>${escapeHTML(role)}</strong>: <code>${escapeHTML(value.value)}</code> · ${escapeHTML(value.status)}${value.sourcePath?` · ${escapeHTML(value.sourcePath)} ${sourceLink(study,value.line)}`:""}</li>`).join('');
  const components=Object.entries(analysis.components??{}), reports=[];
  const recipes=components.map(([name,recipe],index)=>{
    const kind=specimenKind(name), result=compileStyle(recipe,analysis,evidence,'components.'+name,recoveries);
    reports.push({name,kind,line:evidence['components.'+name]?.line,properties:result.rows});
    return `<article class="recipe" data-kind="${kind}" data-name="${escapeHTML(name.toLowerCase())}"><header><span class="kind">${kind} · interpreted structure</span><h3>${escapeHTML(name)}</h3>${sourceLink(study,evidence['components.'+name]?.line)}</header><div class="preview">${renderSample(kind,name,result.style,index,result.parts)}</div><p class="local-status" aria-live="polite"></p>${evidenceDetails(result.rows,study)}</article>`;
  }).join('');
  function flatten(value,path='') {return Object.entries(value??{}).flatMap(([k,v])=>record(v)?flatten(v,path+k+'.'):[[path+k,v]]);}
  const palette=flatten(analysis.colors??{}).filter(([,v])=>color(String(v))).map(([name,v])=>`<article class="swatch"><div style="background-color:${escapeHTML(v)}"></div><strong>${escapeHTML(name)}</strong><code>${escapeHTML(v)}</code>${sourceLink(study,evidence['colors.'+name]?.line)}</article>`).join('');
  const type=Object.entries(analysis.typography??{}).map(([name,recipe])=>{const r=compileStyle(recipe,analysis,evidence,'typography.'+name);return `<article class="type-card"><header><strong>${escapeHTML(name)}</strong>${sourceLink(study,evidence['typography.'+name]?.line)}</header><div class="type-preview" style="${escapeHTML(r.style)}">Make space for something good.</div>${evidenceDetails(r.rows,study)}</article>`;}).join('');
  function geometry(field){return flatten(analysis[field]??{}).map(([name,value])=>{const result=safeDeclaration(field==='spacing'?'width':'rounded',value);return `<article class="geometry"><strong>${escapeHTML(name)}</strong><code>${escapeHTML(value)}</code>${result?`<i style="${result[0]}:${escapeHTML(result[1])}" class="${field}"></i>`:'<small>Unsupported value, not rendered</small>'}${sourceLink(study,evidence[field+'.'+name]?.line)}</article>`;}).join('');}
  const recovered=reports.reduce((n,r)=>n+r.properties.filter(p=>p.recovery).length,0);
  const unsupported=reports.reduce((n,r)=>n+r.properties.filter(p=>p.status.startsWith('Not rendered')||p.status.startsWith('Missing')||p.status.startsWith('Reference')).length,0);
  const supplemental=renderSupplement(supplement,study,{escapeHTML,compileStyle,renderSample});
  const patterns=compilePatterns(study,analysis,evidence,sheetPalette,{escapeHTML,safeDeclaration});
  const content=`<!doctype html><html lang="en" data-theme="analysis" style="${escapeHTML(sheetPalette.style)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'"><title>${escapeHTML(study.title)} · independent reference workbench</title><link rel="stylesheet" href="../sheet.css"></head><body><header class="sheet-header"><div class="edition">REFERENCE / INDEPENDENT STUDY</div><h1>${escapeHTML(study.title)}</h1><p class="intro">Unofficial, unverified and incomplete. Original specimens from a secondary analysis.</p><div class="facts"><span>${components.length} recipe specimens</span><span>${normalization?'Manually normalized prose':'Structured source analysis'}</span><span>${unsupported} unsupported properties</span>${recovered?`<span>${recovered} source-prose recoveries</span>`:''}</div><div class="source-links">${sourceLink(study,undefined,'Pinned analysis by VoltAgent')} <a href="../../reference/${escapeHTML(study.id.replace(/^reference-/,''))}/LICENSE" target="_blank">MIT source license ↗</a></div><details class="method"><summary>Interpretation, evidence &amp; missing detail</summary><p>These are authored specimens, not the company’s components. Source values use shared, original markup. System fonts replace named typefaces; logos and other assets are withheld.</p>${normalization?`<p class="normalization">${escapeHTML(normalization.note)}</p>`:''}<p class="fine">Source links can be opened from the standalone sheet. In the isolated workbench, use Sources or Open source fixture. No official homepage is embedded.</p><p><a href="../report.json" target="_blank" rel="noopener noreferrer">Detailed evidence data ↗</a></p><h2>Sheet palette mapping</h2><p>The company palette reported by this analysis is used inside this sheet. Role selection is an authored interpretation, not an official token contract. Neutral or contrast fallbacks are listed explicitly; specimen values remain unchanged.</p><ul class="palette-mapping">${paletteEvidence}</ul></details></header><main><nav class="jump-links" aria-label="Sheet sections"><a href="#palette">Palette</a><a href="#type">Typography</a><a href="#geometry">Geometry</a><a href="#recipes">Recipes</a><a href="patterns.html">Authored patterns ↗</a>${supplement?'<a href="#supplements">New evidence</a>':''}</nav><section id="palette"><div class="section-title"><p>FOUNDATIONS</p><h2>Reported palette</h2></div><div class="palette">${palette||'<p>No normalized palette recorded.</p>'}</div></section><section id="type"><div class="section-title"><p>TYPOGRAPHY</p><h2>Scale &amp; rhythm</h2></div><p class="fine">All font families are substituted with system fonts. Reported metrics do not imply a font license or fidelity.</p><div class="type-grid">${type||'<p>No typography normalized. Consult the source.</p>'}</div></section><section id="geometry"><div class="section-title"><p>GEOMETRY</p><h2>Space &amp; shape</h2></div><h3>Spacing</h3><div class="geometry-grid">${geometry('spacing')||'<p>No spacing normalized.</p>'}</div><h3>Radii</h3><div class="geometry-grid">${geometry('rounded')||'<p>No radii normalized.</p>'}</div></section><section id="recipes"><div class="section-title"><p>COMPONENT INTERPRETATIONS</p><h2>Recipe shelf</h2></div><p>Names and state variants follow the source. Samples use original semantic templates. Click, input, navigation selection, focus outlines and responsive bounds are local authored behavior, not evidence of the original product. Unsupported properties remain visible below.</p><div class="filters"><label>Find a recipe<input id="recipe-search" type="search" placeholder="Name or state…"></label><label>Sample type<select id="kind-filter"><option value="all">All types</option>${['button','field','badge','navigation','card','table','surface'].map(k=>`<option value="${k}">${k}</option>`).join('')}</select></label><button type="button" id="reset-filters">Reset</button><p id="recipe-count" role="status">${components.length} recipes</p></div><div class="recipes">${recipes}</div><p id="no-results" hidden>No matching recipes. Clear the search or reset filters.</p></section>${supplemental.html}</main><footer><strong>Independent reference, not an official design system.</strong><p>Analysis copyright (c) 2026 VoltAgent, MIT. Authored templates and neutral content are separate additions. No affiliation, endorsement, brand-asset rights or production readiness is implied.</p><p>Source revision: <code>${escapeHTML(study.source.revision)}</code><br>SHA-256: <code>${escapeHTML(study.source.sha256)}</code></p><p>Fields absent from the evidence remain absent. Source proportions may be bounded to fit this specimen sheet. Standard patterns are authored compositions from the same tokens. Screens, where available, are separately curated studies.</p></footer><script type="module" src="../sheet.mjs"></script></body></html>\n`;
  return {html:content,patternsHTML:patterns.html,report:{id:study.id,sourceSha256:study.source.sha256,sheetPalette,patterns:patterns.report,normalization:normalization?'manual-prose':'structured',supplementalSpecimens:supplemental.specimenCount,supplementalSources:supplement?.sources??[],recipeCount:components.length,recoveredProperties:recovered,unsupportedProperties:unsupported,recipes:reports}};
}
