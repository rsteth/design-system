/** Separately dated first-party documentation and page observations; never rewrite source snapshots. */
export const SOURCE_KINDS = ['official-documentation','live-page-text','live-observation','availability-response'];
const labels={'official-documentation':'Official documentation','live-page-text':'Current page text · not visually measured','live-observation':'Rendered website observation','availability-response':'Rendered availability response · no design evidence'};
export function safeEvidenceURL(value) {
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password)throw new Error('Supplement evidence requires HTTPS without credentials');
  return url.href;
}
export function validateSupplement(supplement,study) {
  if(!supplement)return;
  if(supplement.sourceSha256!==study.source.sha256)throw new Error('Supplement source hash mismatch: '+study.id);
  const ids=new Set();
  for(const source of supplement.sources??[]){
    if(!source.id||ids.has(source.id)||!SOURCE_KINDS.includes(source.category))throw new Error('Invalid supplemental source identity');ids.add(source.id);
    safeEvidenceURL(source.url);
    if(!/^\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z)?$/.test(source.observedAt??'')||!source.method||!source.scope)throw new Error('Supplement requires date, method and scope');
    if(['live-observation','availability-response'].includes(source.category)&&(!source.viewport||!source.state))throw new Error('Rendered observation requires viewport and state');
  }
  for(const sample of supplement.specimens??[]){
    if(!/^[a-z][a-z0-9-]*$/.test(sample.id??'')||!sample.evidence?.length||sample.evidence.some(id=>!ids.has(id))||!sample.authored)throw new Error('Supplement specimen requires known evidence and authored choices');
    if(!sample.evidence.some(id=>['official-documentation','live-observation'].includes(supplement.sources.find(s=>s.id===id)?.category)))throw new Error('Supplement specimen needs design evidence, not only text or availability');
    if(!['field','textarea','button','card','navigation','surface'].includes(sample.kind))throw new Error('Unsupported supplemental specimen kind');
    if(sample.state&&!['default','error','warning','disabled','read-only'].includes(sample.state))throw new Error('Unsupported supplemental state');
  }
}
export function renderSupplement(supplement,study,{escapeHTML:e,compileStyle,renderSample}) {
  if(!supplement)return {html:'',specimenCount:0};
  validateSupplement(supplement,study);
  const sourceLink=source=>`<a href="${e(safeEvidenceURL(source.url))}" target="_blank" rel="noopener noreferrer">${e(source.title??source.url)} ↗</a>`;
  const sources=(supplement.sources??[]).map(source=>`<article class="evidence-card" id="evidence-${e(source.id)}"><p class="kind">${e(labels[source.category])}</p><h3>${sourceLink(source)}</h3><p class="fine">Observed ${e(source.observedAt)} · ${e(source.method)}</p><p>${e(source.scope)}</p>${source.version?`<p class="fine">Version context: ${e(source.version)}</p>`:''}${source.updatedAt?`<p class="fine">Page's stated update: ${e(source.updatedAt)}. This is not the observation date.</p>`:''}${source.viewport?`<p class="fine">Viewport: ${e(JSON.stringify(source.viewport))} · state: ${e(source.state)} · theme: ${e(source.theme??'not established')}</p>`:''}<ul>${(source.findings??[]).map(f=>`<li>${e(f)}</li>`).join('')}</ul>${source.limitations?.length?`<p><strong>Not established:</strong> ${e(source.limitations.join(' '))}</p>`:''}</article>`).join('');
  const specimens=(supplement.specimens??[]).map((sample,index)=>{
    const result=compileStyle(sample.properties??{},{});
    if(result.rows.some(row=>row.status.startsWith('Not rendered')||row.status.startsWith('Missing')))throw new Error('Unsupported supplemental property: '+sample.id);
    let preview;
    if(['field','textarea'].includes(sample.kind)){
      const id='supplement-'+sample.id,helper=id+'-helper',state=sample.state??'default';
      const attrs=`id="${e(id)}" class="sample field" style="${e(result.style)}" aria-describedby="${e(helper)}" ${state==='error'?'aria-invalid="true"':''} ${state==='disabled'?'disabled':''} ${state==='read-only'?'readonly':''} autocomplete="off"`;
      const control=sample.kind==='textarea'?`<textarea ${attrs} rows="2">${state==='read-only'?'Example content':''}</textarea>`:`<input type="text" ${attrs} value="${state==='read-only'?'Example content':''}">`;
      preview=`<div class="supplement-field" data-state="${e(state)}"><label for="${e(id)}">${e(sample.label??'Project name')}</label>${control}<small id="${e(helper)}">${state==='error'?'<span aria-hidden="true">!</span> Enter a value for this local example.':state==='warning'?'Check this sample value before continuing.':'Local sample only. Nothing is sent or saved.'}</small></div>`;
    }else preview=renderSample(sample.kind,sample.id,result.style,'supplement-'+index,result.parts);
    return `<article class="supplement-sample"><header><span class="kind">Authored specimen · sourced facts below</span><h3>${e(sample.title)}</h3></header><div class="preview">${preview}</div><p class="local-status" aria-live="polite"></p><div class="supplement-detail"><p>${e(sample.authored)}</p><p><strong>Source-backed properties:</strong> ${result.rows.map(row=>`<code>${e(row.property)}: ${e(row.resolved)}</code>`).join(', ')||'No measured visual properties supplied.'}</p><p>${sample.evidence.map(id=>sourceLink(supplement.sources.find(s=>s.id===id))).join(' · ')}</p></div></article>`;
  }).join('');
  return {html:`<section id="supplements" class="supplements"><div class="section-title"><p>DATED SUPPLEMENTAL EVIDENCE</p><h2>New evidence, separate from the snapshot</h2></div><p>${e(supplement.summary)}</p><p class="fine">Documentation, extracted page text and rendered observations are different evidence. Local markup, neutral content and unspecified visual decisions are authored interpretation. No affiliation, full system equivalence or brand-asset rights are implied.</p>${specimens?`<nav class="jump-links" aria-label="Supplement sections"><a href="#supplement-examples">Specimens</a><a href="#supplement-sources">Source evidence</a></nav><h3 id="supplement-examples">Original supplementary specimens</h3><div class="recipes">${specimens}</div>`:''}<h3 id="supplement-sources">Dated source evidence</h3><div class="evidence-grid">${sources}</div>${supplement.gaps?.length?`<aside class="supplement-gaps"><h3>Still missing</h3><ul>${supplement.gaps.map(g=>`<li>${e(g)}</li>`).join('')}</ul></aside>`:''}</section>`,specimenCount:supplement.specimens?.length??0};
}
