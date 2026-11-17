import {loadWaitlist,updateLandingHeader} from './waitlist-client.js';
const $ = id => document.getElementById(id);
let state = { voices: [], jobs: [] }, estimateVersion = 0, objectUrl, sessionInfo, authMode, admissionOpen = false, savingVoice = false;
const active = new Set(['queued', 'running']);
// People read these; the stored state names stay in data-state for styling and tests.
const stateLabels = { queued: 'Queued', running: 'In progress', completed: 'Ready to listen', failed: 'Failed', cancelled: 'Cancelled', needs_review: 'Needs review' };
const plain = value => String(value ?? '').replaceAll('_', ' ');
const voiceStates = { pending: 'The voice is being checked', ready: 'The voice is ready', failed: 'The voice could not be made', needs_review: 'The voice needs a look from us', remote_deleted: 'The voice has been deleted' };
const voiceStatus = v => v.source === 'sample' ? voiceStates[v.state] || `Voice: ${plain(v.state)}` : 'Recording saved privately';
// Costs are estimates, shown the same way everywhere.
const money = micro => micro > 0 && micro < 10000 ? 'less than $0.01' : `$${((micro || 0) / 1000000).toFixed(2)}`;
const when = value => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
// Resolves true only when the person chooses the named action; Escape and "Keep it" resolve false.
function ask({ title, body, action }) {
  const dialog = $('confirm-dialog'); if (dialog.open) return Promise.resolve(false);
  $('confirm-title').textContent = title; $('confirm-body').textContent = body; $('confirm-yes').textContent = action; dialog.returnValue = '';
  return new Promise(done => { dialog.addEventListener('close', () => done(dialog.returnValue === 'yes'), { once: true }); dialog.showModal(); $('confirm-no').focus(); });
}
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
  if (state.mode === 'disconnected') { $('preflight').textContent = 'Readings and new recordings are paused for now.'; return; }
  if (!admissionOpen) { $('preflight').textContent = 'Reads is resting for a moment. Your words are safe here; try again shortly.'; return; }
  if (!$('text').value.trim()) { $('preflight').textContent = 'Add some words to see how long the reading will be.'; return; }
  $('preflight').textContent = 'Checking these words...';
  try { const p = await api('preflight', 'POST', payload()); if (version !== estimateVersion) return; const minutes = Math.max(1, Math.round(p.estimatedSeconds / 60)); $('preflight').textContent = `About ${minutes} minute${minutes === 1 ? '' : 's'} of listening. ${p.cost}${p.allowance?.enabled ? ` Room for about ${p.allowance.remainingUnits.toLocaleString()} more characters until ${new Date(p.allowance.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.` : ''}`; $('generate').disabled = !admissionOpen; }
  catch (e) { if (version === estimateVersion) $('preflight').textContent = e.message; }
}
function voiceNote() { const v = state.voices.find(v => v.id === $('voice').value); $('voice-note').textContent = v?.provider === 'elevenlabs' ? 'Your words will be read in this voice.' : v?.id === 'demo' ? 'The demo voice plays soft tones, not speech.' : 'This recording is saved. The demo still plays tones.'; }
function button(text, fn) { const b = node('button', text, 'text-button'); b.type = 'button'; b.onclick = async () => { b.disabled = true; try { await fn(); await refresh(); } catch(e) { notify(e); } finally { b.disabled = false; } }; return b; }
function renderVoices() {
  const value = $('voice').value; $('voice').replaceChildren(...state.voices.filter(v=>v.provider === state.mode && (state.mode!=='elevenlabs'||(['available','ready'].includes(v.state)&&(v.source!=='sample'||state.voiceOperations?.narrationEnabled)))).map(v => { const o = node('option', v.provider === 'elevenlabs' ? v.name : `${v.name} (${v.id === 'demo' ? 'tones' : 'recording saved'})`); o.value = v.id; return o; }));
  if ([...$('voice').options].some(v => v.value === value)) $('voice').value = value;
  if($('voice').value!==value)$('provider-consent').checked=false;
  voiceNote(); $('voice-shelf').replaceChildren();
  for (const v of state.voices.filter(v => v.validation)) {
    const row = node('div', '', 'profile'); row.append(node('strong', v.name), node('small', `${Math.round(v.validation.seconds)} seconds. ${voiceStatus(v)}`));
    if(!v.sampleDeletedAt){const audio = node('audio'); audio.controls = true; audio.preload = 'none'; audio.src = "/design-system/previews/reads/assets/synthetic-tone.wav"; audio.setAttribute('aria-label', `The original recording of ${v.name}`); row.append(audio,node('small','The original recording'));
      row.append(button('Delete recording',async()=>{if(await ask({title:'Delete this recording?',body:'It will be removed from Reads. A voice already made from it stays until you delete that too.',action:'Delete recording'}))await api(`voices/${v.id}/sample`,'DELETE');}));
    }else row.append(node('small','The recording has been deleted from Reads.'));
    if(state.mode==='elevenlabs') {
      const ops=state.voiceOperations||{}, operationBody=()=>({approvalId:ops.approvalId});
      if(v.provider==='fake'&&v.state==='demo'&&!v.sampleDeletedAt){
        const details=node('details'),summary=node('summary','Make a voice from this recording'),form=node('form');details.append(summary,form);
        form.append(node('p',`To read in their voice, Reads sends this recording and its name to ElevenLabs, who make the voice and keep it. It needs one to two minutes of clear speech.${ops.createMicroUsd ? ` Making it costs about ${money(ops.createMicroUsd)}.` : ''}`, 'hint'));
        const check=text=>{const label=node('label','','check'),input=node('input');input.type='checkbox';input.required=true;label.append(input,node('span',text));form.append(label);return input;};
        const rights=check('I have their clear permission to recreate their voice and use it for readings.'),clean=check('The recording is one person speaking, with no music or background noise.'),consent=check('Send this recording and its name to ElevenLabs to make the voice. They handle and keep it under their own terms.');
        form.append(node('p','Once submitted, voice creation cannot be cancelled in Reads. Closing this page will not stop it. If the result is uncertain, wait for review before trying again.','hint'));
        const submit=node('button',ops.enabled?'Make their voice':'Making voices is not switched on yet','secondary');submit.type='submit';submit.disabled=!ops.enabled||!admissionOpen;form.append(submit);
        form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{await api(`voices/${v.id}/hosted`,'POST',{...operationBody(),rightsConsent:rights.checked,singleSpeaker:clean.checked,providerConsent:consent.checked,consentVersion:ops.consentVersion});await refresh();}catch(error){notify(error);await refresh();}finally{submit.disabled=!ops.enabled;}};row.append(details);
      }
      if(v.source==='sample'&&['pending','ready','failed'].includes(v.state)) {
        row.append(button('Check if the voice is ready',()=>api(`voices/${v.id}/verify`,'POST',operationBody())));
        row.append(button('Delete voice',async()=>{if(await ask({title:'Delete this voice?',body:'The voice will be removed for good. Readings you have already made stay here, and so does the recording.',action:'Delete voice'}))await api(`voices/${v.id}/provider-delete`,'POST',{...operationBody(),deleteConsent:true});}));
        if(v.state==='ready'&&!ops.narrationEnabled)row.append(node('small','The voice is ready. Readings in it are not switched on yet.'));
      }
      if(v.state==='needs_review')row.append(node('p','We could not confirm whether this voice was made. Please do not make another one yet; we will look into it.','error'));
    }
    row.append(button('Delete profile and readings', async () => { if (await ask({ title: `Delete ${v.name}?`, body: `This removes the recording and every reading made with it from Reads.${v.source === 'sample' ? ' A voice made from it is deleted separately.' : ''}`, action: 'Delete profile' })) await api(`voices/${v.id}`, 'DELETE'); })); $('voice-shelf').append(row);
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
    if (jobNodes.get(j.id)?.signature === signature) { const el = jobNodes.get(j.id).el; const progress = el.querySelector('progress'); if (progress) { progress.value = j.done; progress.setAttribute('aria-label', `${j.done} of ${j.total} parts`); el.querySelector('.progress-label').textContent = `${j.done} of ${j.total} parts ready`; } continue; }
    const card = node('article', '', 'job'); card.dataset.state = j.state; const top = node('div', '', 'job-top'), title = node('div');
    title.append(node('h3', j.text.slice(0, 76) + (j.text.length > 76 ? '...' : '')), node('p', `Read by ${j.voice.name}, ${j.text.length.toLocaleString()} characters, ${j.settings.speed}x pace`, 'hint'));
    top.append(title, node('span', stateLabels[j.state] || plain(j.state), 'badge')); card.append(top); if (j.provider !== 'elevenlabs') card.append(node('p', 'Demo reading: tones, not speech', 'hint'));
    if (active.has(j.state)) { const p = node('progress'); p.max = j.total; p.value = j.done; p.setAttribute('aria-label', `${j.done} of ${j.total} parts`); card.append(p, node('p', `${j.done} of ${j.total} parts ready`, 'hint progress-label')); }
    if (j.error) card.append(node('p', j.error, 'error'));
    const actions = node('div', '', 'actions');
    if (j.state === 'completed') { const audio = node('audio'); audio.controls = true; audio.preload = 'none'; audio.src = "/design-system/previews/reads/assets/synthetic-tone.wav"; audio.setAttribute('aria-label', j.provider === 'elevenlabs' ? 'Listen to this reading' : 'Listen to this demo reading'); card.append(audio); const a = node('a', 'Download'); a.href = "/design-system/previews/reads/assets/synthetic-tone.wav"; a.download = `reads-${j.provider === 'elevenlabs' ? 'narration' : 'demo'}-${j.id}.wav`; a.onclick = e => { if (!admissionOpen) { e.preventDefault(); notify(Error('Downloads are temporarily unavailable. Try again shortly.')); } }; actions.append(a); }
    if (active.has(j.state)) actions.append(button('Cancel', () => api(`jobs/${j.id}/cancel`, 'POST')));
    if (['failed', 'cancelled'].includes(j.state) && !j.retryBlocked) actions.append(button('Retry this read', () => api(`jobs/${j.id}/retry`, 'POST')));
    actions.append(button('Delete', async () => { if (await ask({ title: 'Delete this reading?', body: `The words and the audio will be removed from Reads.${j.provider === 'elevenlabs' ? ' It still counts toward what you have used.' : ''}`, action: 'Delete reading' })) await api(`jobs/${j.id}`, 'DELETE'); }));
    const detail = node('details'), summary = node('summary', 'About this audio'); detail.append(summary, node('p', `${j.provider === 'elevenlabs' ? 'Voice by ElevenLabs' : 'Demo tones'}. Started ${when(j.created)}. WAV, mono 24 kHz.${j.attempts > 1 ? ` Tried ${j.attempts} times.` : ''}`, 'hint'), node('p', j.text, 'hint'));
    if(j.provider === 'elevenlabs') detail.append(node('p', `Estimated cost ${money(j.estimatedMicroUsd)}. Reference ${j.approvalId}.`, 'hint'));
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
    $('provider-consent-label').hidden=true; $('cancellation-note').hidden=true; $('preview').hidden=true;
    $('provider-footer').textContent='Readings are paused';
    $('generation-notice').textContent='Readings, new recordings and saved audio are paused for now.';
    $('generate').textContent='Readings are paused'; $('generate').disabled=true;
    $('output-note').textContent='Reads will be back shortly.'; $('sample-note').textContent='New recordings are paused for now.';
    return;
  }
  const hosted=state.mode === 'elevenlabs';
  $('provider-consent-label').hidden=!hosted; $('cancellation-note').hidden=!hosted; $('provider-consent').required=hosted;
  $('preview').hidden=hosted; $('save-voice').textContent='Save recording';
  $('provider-footer').textContent=hosted?'Voices by ElevenLabs':'Demo: tones, not speech';
  $('generation-notice').textContent=hosted ? 'Your words are read aloud by a voice service outside Reads. You will see the cost and say yes before anything is sent.' : 'This is the demo. You will hear soft tones instead of a voice, and nothing leaves Reads.';
  $('generate').textContent=hosted?'Read this to me':'Make a demo reading';
  $('output-note').textContent=hosted?'One audio file, yours to keep.':'One audio file. Demo readings are tones, not speech.';
  $('sample-note').textContent=hosted?'Save a recording of someone you love, with their permission. It stays in Reads until you choose to make a voice from it.':'Save a recording of someone you love, with their permission. The demo keeps it safe but still plays tones.';
}
async function refresh() {
  const next = await api('state'); const changed = JSON.stringify(next.voices) !== JSON.stringify(state.voices) || JSON.stringify(next.voiceOperations)!==JSON.stringify(state.voiceOperations); const budgetChanged=JSON.stringify(next.allowance)!==JSON.stringify(state.allowance); state = next;
  const wasOpen = admissionOpen; admissionOpen = next.lifecycle?.ready === true && next.mode !== 'disconnected';
  configureProvider(); if (changed) renderVoices(); renderJobs(); $('connection').textContent = state.mode === 'disconnected' ? 'Readings are paused for now.' : admissionOpen ? '' : 'Reads is winding down for a rest. Anything in progress will finish, and new readings can start again shortly.';
  $('preview').disabled = !admissionOpen; $('save-voice').disabled = !admissionOpen || savingVoice;
  for (const link of document.querySelectorAll('.job a')) link.setAttribute('aria-disabled',String(!admissionOpen));
  if (!admissionOpen) $('generate').disabled = true; else if (!wasOpen || budgetChanged || changed) await estimate();
}
function lockStudio(message) {
  document.body.classList.add('signed-out');
  $('auth-status').classList.toggle('sr-only', !/denied|expired|ended|unavailable|unable/i.test(message || ''));
  $('provider-consent').checked = false; if ($('confirm-dialog').open) $('confirm-dialog').close();
  admissionOpen = false; estimateVersion++; sessionInfo = null; state = { voices: [], jobs: [] }; jobNodes.clear(); shownProvider=undefined;
  $('studio').hidden = true; $('logout').hidden = true; $('owner-admin').hidden = true; $('auth-panel').hidden = false;
  $('header-login').href = authMode === 'local' ? '/' : "/design-system/previews/reads/fixture/?fixture=studio-empty";
  requestAnimationFrame(updateLandingHeader);
  void loadWaitlist();
  $('login').hidden = false; $('login').href = authMode === 'local' ? '/' : "/design-system/previews/reads/fixture/?fixture=studio-empty"; $('login').textContent = authMode === 'local' ? 'Open demo' : 'Log in'; $('auth-status').textContent = authMode === 'local' ? 'Your demo session ended. Open the demo to continue.' : message;
  $('jobs').replaceChildren(); $('voice-shelf').replaceChildren(); $('voice').replaceChildren();
  for (const audio of document.querySelectorAll('audio')) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
}
async function poll() { if (!sessionInfo?.authenticated) return; try { await refresh(); } catch { $('connection').textContent = 'Connection lost. Your work is saved.'; } finally { if (sessionInfo?.authenticated) setTimeout(poll, 1000); } }
async function startSession() {
  try {
    sessionInfo = await api('session'); authMode = sessionInfo.auth;
    if (!sessionInfo.authenticated) { lockStudio(new URLSearchParams(location.search).get('auth') === 'failed' ? 'Unable to log in with this account. Try again or join the waiting list.' : 'Log in with Google.'); return; }
    document.body.classList.remove('signed-out');
    $('studio').hidden = false; $('auth-panel').hidden = true; $('logout').hidden = sessionInfo.auth === 'local';
    $('owner-admin').hidden = sessionInfo.admin !== true;
    $('auth-mode').textContent = sessionInfo.auth === 'local' ? 'Demo' : 'Studio';
    await poll();
  } catch { $('auth-status').classList.remove('sr-only'); $('auth-status').textContent = 'Unable to load your account. Try again in a moment.'; const retryPath=location.pathname==='/studio'?'/studio':'/'; $('login').href=retryPath; $('login').textContent='Try again'; $('header-login').href=retryPath; void loadWaitlist(); }
}
$('logout').onclick = () => location.assign("/design-system/previews/reads/fixture/?fixture=landing");
$('reader').onsubmit = async e => { e.preventDefault(); $('generate').disabled = true; notify(); try { await api('jobs', 'POST', payload()); await refresh(); $('jobs').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e) { notify(e); } finally { await estimate(); } };
for (const id of ['text', 'speed']) $(id).oninput = () => { $('provider-consent').checked=false; estimate(); };
$('voice').onchange = () => { $('provider-consent').checked=false; voiceNote(); estimate(); };
$('example').onclick = () => { $('text').value = 'By evening, the garden had grown quiet. A light shone in the kitchen window, and the path home was still warm from the sun.\n\nInside, a book lay open on the table. There was time for a few more pages before the lamps went out.'; estimate(); $('text').focus(); };
$('preview').onclick = async () => { try { const j = await api('jobs', 'POST', { text: 'This is a short demo preview.', voiceId: $('voice').value, delivery: { speed: Number($('speed').value) } }); await refresh(); $('voice-note').textContent = 'A short demo is on its way to your saved listens below.'; $('jobs').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e) { notify(e); } };
$('sample').onchange = () => { if (objectUrl) URL.revokeObjectURL(objectUrl); const file = globalThis.__readsSyntheticRecording; $('sample-preview').hidden = !file; if (file) { objectUrl = URL.createObjectURL(file); $('sample-preview').src = objectUrl; } };
$('voice-form').onsubmit = async e => {
  e.preventDefault(); savingVoice = true; $('save-voice').disabled = true; $('voice-status').textContent = 'Checking the recording and saving it...';
  try { const file = globalThis.__readsSyntheticRecording; if (!file || file.size > 12 * 1024 * 1024) throw Error('Choose a WAV file under 12 MB.');
    const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(Error('Could not read that file.')); reader.readAsDataURL(file); });
    const voice = await api('voices', 'POST', { name: $('name').value, filename: file.name, mime: file.type || 'audio/wav', base64, permission: $('permission').checked, singleSpeaker: $('single').checked });
    await refresh(); if(state.mode !== 'elevenlabs') $('voice').value = voice.id; voiceNote(); estimate(); $('voice-form').reset(); $('sample-preview').hidden = true; if (objectUrl) URL.revokeObjectURL(objectUrl); $('voice-status').textContent = state.mode === 'elevenlabs' ? 'Recording saved. It stays here until you choose to make a voice from it.' : 'Recording saved. The demo still plays tones.';
  } catch(e) { $('voice-status').textContent = e.message; } finally { savingVoice = false; $('save-voice').disabled = !admissionOpen; }
};
await startSession();
$('sample').disabled = true;
