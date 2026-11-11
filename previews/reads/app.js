import {loadWaitlist,updateLandingHeader} from './waitlist-client.js';
const $ = id => document.getElementById(id);
let state = { voices: [], jobs: [] }, estimateVersion = 0, objectUrl, sessionInfo, authMode, admissionOpen = false, savingVoice = false;
const active = new Set(['queued', 'running']);
function node(tag, text, cls) { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
async function api(path, method = 'GET', body) {
  const r = await globalThis.__readsFixtureFetch(`/fixture-data/${path}`, { ...(path === 'session' ? {signal:AbortSignal.timeout(12000)} : {}), method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-Vocai-CSRF': sessionInfo?.csrf || '' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const value = await r.json(); if (!r.ok) { if (r.status === 401) lockStudio('Your session expired. Log in again to continue.'); throw Error(value.error || 'Request failed.'); } return value;
}
function notify(e) { $('message').textContent = e?.message || ''; if (e) $('message').focus(); }
function payload() { return { ...(state.mode === 'elevenlabs' ? {providerConsent:$('provider-consent').checked,approvalId:state.allowance?.approvalId,requestId:crypto.randomUUID()} : {}), text: $('text').value, voiceId: $('voice').value, delivery: { speed: Number($('speed').value) } }; }
async function estimate() {
  const version = ++estimateVersion; $('generate').disabled = true;
  $('count').textContent = `${$('text').value.length.toLocaleString()} characters`;
  $('speed-value').textContent = `${Number($('speed').value).toFixed(1)}x`;
  if (state.mode === 'disconnected') { $('preflight').textContent = 'Audio generation and recording uploads are temporarily unavailable.'; return; }
  if (!admissionOpen) { $('preflight').textContent = 'Audio generation is temporarily unavailable. Your words stay here; try again shortly.'; return; }
  if (!$('text').value.trim()) { $('preflight').textContent = 'Add the words you would like read to see an estimate.'; return; }
  $('preflight').textContent = 'Checking these words...';
  try { const p = await api('preflight', 'POST', payload()); if (version !== estimateVersion) return; $('preflight').textContent = `${p.characters.toLocaleString()} characters | ${p.chunks} chunk${p.chunks === 1 ? '' : 's'} | ~${Math.max(1, Math.round(p.estimatedSeconds / 60))} min of speech with a hosted voice. ${p.cost}${p.allowance?.enabled ? ` Remaining: ${p.allowance.remainingUnits} units / ${p.allowance.remainingCalls} calls until ${new Date(p.allowance.expiresAt).toLocaleTimeString()}.` : ''}`; $('generate').disabled = !admissionOpen; }
  catch (e) { if (version === estimateVersion) $('preflight').textContent = e.message; }
}
function voiceNote() { const v = state.voices.find(v => v.id === $('voice').value); $('voice-note').textContent = v?.provider === 'elevenlabs' ? 'ElevenLabs narration | Your text and audio are processed by ElevenLabs.' : v?.id === 'demo' ? 'Demo voice | Audio uses tones, not speech.' : 'Saved recording | Demo audio uses tones. This recording has not been used to create a reading voice.'; }
function button(text, fn) { const b = node('button', text, 'text-button'); b.type = 'button'; b.onclick = async () => { b.disabled = true; try { await fn(); await refresh(); } catch(e) { notify(e); } finally { b.disabled = false; } }; return b; }
function renderVoices() {
  const value = $('voice').value; $('voice').replaceChildren(...state.voices.filter(v=>v.provider === state.mode && (state.mode!=='elevenlabs'||(['available','ready'].includes(v.state)&&(v.source!=='sample'||state.voiceOperations?.narrationEnabled)))).map(v => { const o = node('option', `${v.name} | ${v.provider === 'elevenlabs' ? 'ElevenLabs narration' : v.id === 'demo' ? 'Demo tones' : 'Sample saved / demo'}`); o.value = v.id; return o; }));
  if ([...$('voice').options].some(v => v.value === value)) $('voice').value = value;
  if($('voice').value!==value)$('provider-consent').checked=false;
  voiceNote(); $('voice-shelf').replaceChildren();
  for (const v of state.voices.filter(v => v.validation)) {
    const row = node('div', '', 'profile'); row.append(node('strong', v.name), node('small', `${Math.round(v.validation.seconds)} sec | ${v.source==='sample'?'ElevenLabs voice: '+v.state:'Original sample saved privately'} | verification: ${v.verification}`));
    if(!v.sampleDeletedAt){const audio = node('audio'); audio.controls = true; audio.preload = 'none'; audio.src = "/design-system/previews/reads/assets/synthetic-tone.wav"; audio.setAttribute('aria-label', `Original sample for ${v.name}`); row.append(audio,node('small','Original recording - not generated speech.'));
      row.append(button('Delete original sample',async()=>{if(confirm('Delete the original recording from Reads? Any created provider voice and previously downloaded/backup copies are separate.'))await api(`voices/${v.id}/sample`,'DELETE');}));
    }else row.append(node('small','Original sample deleted from Reads. Provider retention is separate.'));
    if(state.mode==='elevenlabs') {
      const ops=state.voiceOperations||{}, operationBody=()=>({approvalId:ops.approvalId});
      if(v.provider==='fake'&&v.state==='demo'&&!v.sampleDeletedAt){
        const details=node('details'),summary=node('summary','Create a reading voice with ElevenLabs'),form=node('form');details.append(summary,form);
        form.append(node('p',`This sends the original recording and profile name to ElevenLabs to create an Instant Voice Clone in the connected workspace. It uses a voice slot. Approved creation estimate: $${((ops.createMicroUsd||0)/1000000).toFixed(2)}; existing plan fees are separate. Provider retention and verification apply. Reads requires 60-120 seconds of clean speech. No automatic retry.`, 'hint'));
        const check=text=>{const label=node('label','','check'),input=node('input');input.type='checkbox';input.required=true;label.append(input,node('span',text));form.append(label);return input;};
        const rights=check('I have the speaker\'s explicit permission and the rights to clone and reuse this voice.'),clean=check('I reviewed this recording: one clean speaker, no music or background noise.'),consent=check('Send this sample and profile name to ElevenLabs to create a voice. I understand provider processing, retention and verification are separate.');
        const submit=node('button',ops.enabled?'Send sample & create voice':'Hosted creation not activated','secondary');submit.type='submit';submit.disabled=!ops.enabled||!admissionOpen;form.append(submit);
        form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{await api(`voices/${v.id}/hosted`,'POST',{...operationBody(),rightsConsent:rights.checked,singleSpeaker:clean.checked,providerConsent:consent.checked,consentVersion:ops.consentVersion});await refresh();}catch(error){notify(error);await refresh();}finally{submit.disabled=!ops.enabled;}};row.append(details);
      }
      if(v.source==='sample'&&['pending','ready','failed'].includes(v.state)) {
        row.append(button('Check provider verification',()=>api(`voices/${v.id}/verify`,'POST',operationBody())));
        row.append(button('Delete voice from ElevenLabs',async()=>{if(confirm('Permanently delete this voice from ElevenLabs? Existing narration files and original samples stay in Reads until separately deleted. No automatic retry on an uncertain result.'))await api(`voices/${v.id}/provider-delete`,'POST',{...operationBody(),deleteConsent:true});}));
        if(v.state==='ready'&&!ops.narrationEnabled)row.append(node('small','Provider verification passed. Narration with created voices still requires its own approved allowance.'));
      }
      if(v.state==='needs_review')row.append(node('p','Provider outcome is uncertain. Do not create another voice. Operator reconciliation is required; deleting this profile does not clear the hold.','error'));
    }
    row.append(button('Delete voice profile & its audio', async () => { if (confirm('Delete this profile, its original sample and all its jobs/files from Reads? This does not delete any ElevenLabs voice or history. Opaque operation records remain to prevent duplicate creation.')) await api(`voices/${v.id}`, 'DELETE'); })); $('voice-shelf').append(row);
  }
}
const jobNodes = new Map();
function renderJobs() {
  $('job-count').textContent = `${state.jobs.length} listen${state.jobs.length === 1 ? '' : 's'}`;
  if (!state.jobs.length) { if (jobNodes.size) $('jobs').replaceChildren(node('div', 'No saved listens yet. Add the words you would like read to begin.', 'empty')); jobNodes.clear(); return; }
  for (const [id, entry] of jobNodes) if (!state.jobs.some(j => j.id === id)) { entry.el.remove(); jobNodes.delete(id); }
  if (!jobNodes.size) $('jobs').replaceChildren();
  for (const j of state.jobs) {
    const signature = JSON.stringify([j.state, j.error]);
    if (jobNodes.get(j.id)?.signature === signature) { const el = jobNodes.get(j.id).el; const progress = el.querySelector('progress'); if (progress) { progress.value = j.done; progress.setAttribute('aria-label', `${j.done} of ${j.total} chunks`); el.querySelector('.progress-label').textContent = `${j.done} of ${j.total} chunks saved`; } continue; }
    const card = node('article', '', 'job'); card.dataset.state = j.state; const top = node('div', '', 'job-top'), title = node('div');
    title.append(node('h3', j.text.slice(0, 76) + (j.text.length > 76 ? '...' : '')), node('p', `${j.voice.name} | ${j.text.length.toLocaleString()} characters | ${j.settings.speed}x pace`, 'hint'));
    top.append(title, node('span', j.state === 'completed' ? 'Ready to listen' : j.state, 'badge')); card.append(top, node('p', j.provider === 'elevenlabs' ? 'ELEVENLABS NARRATION | private text processed by provider' : 'DEMO AUDIO | synthetic tones, not speech or a cloned voice', 'hint'));
    if (active.has(j.state)) { const p = node('progress'); p.max = j.total; p.value = j.done; p.setAttribute('aria-label', `${j.done} of ${j.total} chunks`); card.append(p, node('p', `${j.done} of ${j.total} chunks saved`, 'hint progress-label')); }
    if (j.error) card.append(node('p', j.error, 'error'));
    const actions = node('div', '', 'actions');
    if (j.state === 'completed') { const audio = node('audio'); audio.controls = true; audio.preload = 'none'; audio.src = "/design-system/previews/reads/assets/synthetic-tone.wav"; audio.setAttribute('aria-label', j.provider === 'elevenlabs' ? 'Generated narration' : 'Generated demo audio'); card.append(audio); const a = node('a', 'Download WAV'); a.href = "/design-system/previews/reads/assets/synthetic-tone.wav"; a.download = `reads-${j.provider === 'elevenlabs' ? 'narration' : 'demo'}-${j.id}.wav`; a.onclick = e => { if (!admissionOpen) { e.preventDefault(); notify(Error('Downloads are temporarily unavailable. Try again shortly.')); } }; actions.append(a); }
    if (active.has(j.state)) actions.append(button('Cancel', () => api(`jobs/${j.id}/cancel`, 'POST')));
    if (['failed', 'cancelled'].includes(j.state) && !j.retryBlocked) actions.append(button('Retry this read', () => api(`jobs/${j.id}/retry`, 'POST')));
    actions.append(button('Delete', async () => { if (confirm(j.provider === 'elevenlabs' ? 'Delete this job, text and audio? Opaque provider-attempt and budget records remain to prevent repeat charges. Provider history is separate.' : 'Delete this job, text, saved chunks and audio?')) await api(`jobs/${j.id}`, 'DELETE'); }));
    const detail = node('details'), summary = node('summary', 'About this audio'); detail.append(summary, node('p', `Provider: ${j.provider} | Model: ${j.model} | Format: mono 24 kHz / 16-bit PCM WAV | Started: ${new Date(j.created).toLocaleString()} | Attempts: ${j.attempts}`, 'hint'), node('p', j.text, 'hint'));
    if(j.provider === 'elevenlabs') detail.append(node('p', `Reference: ${j.approvalId} | Reserved estimate: $${(j.estimatedMicroUsd / 1000000).toFixed(5)} | Identical submissions reuse this job; uncertain calls never retry automatically.`, 'hint'));
    card.append(actions, detail);
    if (jobNodes.has(j.id)) { const old = jobNodes.get(j.id).el; const hadFocus = old.contains(document.activeElement); old.replaceWith(card); if (hadFocus) { card.tabIndex = -1; card.focus({ preventScroll: true }); } } else $('jobs').insertBefore(card, $('jobs').children[state.jobs.indexOf(j)] || null);
    jobNodes.set(j.id, { el: card, signature });
  }
}
let shownProvider;
function configureProvider() {
  if(shownProvider === state.mode) return; shownProvider=state.mode;
  const disconnected=state.mode === 'disconnected';
  for (const control of document.querySelectorAll('#reader button, #reader input, #reader textarea, #reader select, #voice-form input, #voice-form button')) control.disabled=disconnected;
  if(disconnected) {
    $('provider-consent-label').hidden=true; $('preview').hidden=true;
    $('provider-footer').textContent='Reads | Generation unavailable';
    $('generation-notice').textContent='Audio generation, uploads and saved audio are temporarily unavailable.';
    $('generate').textContent='Generation unavailable'; $('generate').disabled=true;
    $('output-note').textContent='Audio generation is unavailable'; $('sample-note').textContent='Recording uploads are temporarily unavailable.';
    return;
  }
  const hosted=state.mode === 'elevenlabs';
  $('provider-consent-label').hidden=!hosted; $('provider-consent').required=hosted;
  $('preview').hidden=hosted; $('save-voice').textContent=hosted?'Save recording':'Save recording';
  $('provider-footer').textContent=hosted?'Reads | ElevenLabs narration':'Reads | Demo audio';
  $('generation-notice').textContent=hosted ? 'Your text is sent to ElevenLabs to create audio. The estimate is reserved before generation. Cancelled requests may still be charged; a request with an uncertain outcome will pause further generation.' : 'Demo audio uses tones rather than speech. Your text and recordings stay in Reads; no paid provider call is made.';
  $('generate').textContent=hosted?'Read this to me':'Generate demo audio';
  $('output-note').textContent=hosted?'One WAV file | mono 24 kHz / 16-bit':'One WAV file | Demo audio: tones, not speech';
  $('sample-note').textContent=hosted?'Save a recording with the speaker’s permission. Saving keeps it in Reads; sending it to ElevenLabs requires a separate confirmation.':'Save a recording with the speaker’s permission. This demo uses tones, not the recorded voice.';
}
async function refresh() {
  const next = await api('state'); const changed = JSON.stringify(next.voices) !== JSON.stringify(state.voices) || JSON.stringify(next.voiceOperations)!==JSON.stringify(state.voiceOperations); const budgetChanged=JSON.stringify(next.allowance)!==JSON.stringify(state.allowance); state = next;
  const wasOpen = admissionOpen; admissionOpen = next.lifecycle?.ready === true && next.mode !== 'disconnected';
  configureProvider(); if (changed) renderVoices(); renderJobs(); $('connection').textContent = state.mode === 'disconnected' ? 'Audio services are temporarily unavailable.' : admissionOpen ? '' : 'Reads is temporarily unavailable for new requests and downloads. Existing work can finish.';
  $('preview').disabled = !admissionOpen; $('save-voice').disabled = !admissionOpen || savingVoice;
  for (const link of document.querySelectorAll('.job a')) link.setAttribute('aria-disabled',String(!admissionOpen));
  if (!admissionOpen) $('generate').disabled = true; else if (!wasOpen || budgetChanged || changed) await estimate();
}
function lockStudio(message) {
  document.body.classList.add('signed-out');
  $('auth-status').classList.toggle('sr-only', !/denied|expired|ended|unavailable|unable/i.test(message || ''));
  $('provider-consent').checked = false;
  admissionOpen = false; estimateVersion++; sessionInfo = null; state = { voices: [], jobs: [] }; jobNodes.clear(); shownProvider=undefined;
  $('studio').hidden = true; $('logout').hidden = true; $('auth-panel').hidden = false;
  $('header-login').href = authMode === 'local' ? '/' : "/design-system/previews/reads/fixture/?fixture=studio-empty";
  requestAnimationFrame(updateLandingHeader);
  void loadWaitlist();
  $('login').hidden = false; $('login').href = authMode === 'local' ? '/' : "/design-system/previews/reads/fixture/?fixture=studio-empty"; $('login').textContent = authMode === 'local' ? 'Open demo' : 'Log in'; $('auth-status').textContent = authMode === 'local' ? 'Your demo session ended. Open the demo to continue.' : message;
  $('jobs').replaceChildren(); $('voice-shelf').replaceChildren(); $('voice').replaceChildren();
  for (const audio of document.querySelectorAll('audio')) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
}
async function poll() { if (!sessionInfo?.authenticated) return; try { await refresh(); } catch { $('connection').textContent = 'Connection lost. Your work is saved. Log in again if prompted.'; } finally { if (sessionInfo?.authenticated) setTimeout(poll, 1000); } }
async function startSession() {
  try {
    sessionInfo = await api('session'); authMode = sessionInfo.auth;
    if (!sessionInfo.authenticated) { lockStudio(new URLSearchParams(location.search).get('auth') === 'failed' ? 'Unable to log in with this account. Try again or join the waiting list.' : 'Log in with Google.'); return; }
    document.body.classList.remove('signed-out');
    $('studio').hidden = false; $('auth-panel').hidden = true; $('logout').hidden = sessionInfo.auth === 'local';
    $('auth-mode').textContent = sessionInfo.auth === 'local' ? 'DEMO' : 'STUDIO';
    await poll();
  } catch { $('auth-status').classList.remove('sr-only'); $('auth-status').textContent = 'Unable to load your account. Try again in a moment.'; const retryPath=location.pathname==='/studio'?'/studio':'/'; $('login').href=retryPath; $('login').textContent='Try again'; $('header-login').href=retryPath; void loadWaitlist(); }
}
$('logout').onclick = () => location.assign("/design-system/previews/reads/fixture/?fixture=landing");
$('reader').onsubmit = async e => { e.preventDefault(); $('generate').disabled = true; notify(); try { await api('jobs', 'POST', payload()); await refresh(); $('jobs').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e) { notify(e); } finally { await estimate(); } };
for (const id of ['text', 'speed']) $(id).oninput = () => { $('provider-consent').checked=false; estimate(); };
$('voice').onchange = () => { $('provider-consent').checked=false; voiceNote(); estimate(); };
$('example').onclick = () => { $('text').value = 'By evening, the garden had grown quiet. A light shone in the kitchen window, and the path home was still warm from the sun.\n\nInside, a book lay open on the table. There was time for a few more pages before the lamps went out.'; estimate(); $('text').focus(); };
$('preview').onclick = async () => { try { const j = await api('jobs', 'POST', { text: 'This is a short demo preview.', voiceId: $('voice').value, delivery: { speed: Number($('speed').value) } }); await refresh(); $('voice-note').textContent = 'Demo preview queued in Your saved listens below. It produces tones, not speech.'; $('jobs').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e) { notify(e); } };
$('sample').onchange = () => { if (objectUrl) URL.revokeObjectURL(objectUrl); const file = globalThis.__readsSyntheticRecording; $('sample-preview').hidden = !file; if (file) { objectUrl = URL.createObjectURL(file); $('sample-preview').src = objectUrl; } };
$('voice-form').onsubmit = async e => {
  e.preventDefault(); savingVoice = true; $('save-voice').disabled = true; $('voice-status').textContent = 'Checking recording and saving locally...';
  try { const file = globalThis.__readsSyntheticRecording; if (!file || file.size > 12 * 1024 * 1024) throw Error('Choose a WAV file under 12 MB.');
    const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(Error('Could not read sample.')); reader.readAsDataURL(file); });
    const voice = await api('voices', 'POST', { name: $('name').value, filename: file.name, mime: file.type || 'audio/wav', base64, permission: $('permission').checked, singleSpeaker: $('single').checked });
    await refresh(); if(state.mode !== 'elevenlabs') $('voice').value = voice.id; voiceNote(); estimate(); $('voice-form').reset(); $('sample-preview').hidden = true; if (objectUrl) URL.revokeObjectURL(objectUrl); $('voice-status').textContent = state.mode === 'elevenlabs' ? 'Recording saved. Sending it to ElevenLabs requires a separate confirmation.' : 'Recording saved. Demo audio uses tones, not the recorded voice.';
  } catch(e) { $('voice-status').textContent = e.message; } finally { savingVoice = false; $('save-voice').disabled = !admissionOpen; }
};
await startSession();
$('sample').disabled = true;
