import {coverage, signedOutFixture} from './coverage.mjs';
// Synthetic state only. Production markup, CSS and rendering stay in public/.
export const fixtureIds = ['landing','waitlist','studio-empty','studio-ready','studio-progress','studio-failed','studio-draining','studio-disconnected','voice-sample','hosted-consent','hosted-review', ...Object.keys(coverage)];
export const sampleText = 'By evening, the garden had grown quiet. A light shone in the kitchen window, and there was time for a few more pages.';
export function fixtureState(id) {
  if (!fixtureIds.includes(id)) throw Error('Unknown Reads fixture.');
  const hosted = id.startsWith('hosted-') || id==='job-hosted';
  const voice = {id:hosted?'approved':'demo',name:hosted?'Approved sample voice':'Studio demo',provider:hosted?'elevenlabs':'fake',state:'available'};
  const state = {mode: id === 'studio-disconnected' ? 'disconnected' : hosted ? 'elevenlabs' : 'fake', voices:[voice],jobs:[],lifecycle:{ready:id!=='studio-draining'}};
  if (['studio-ready','studio-progress','studio-failed','studio-draining','hosted-review'].includes(id)) state.jobs.push({id:'sample-read',text:sampleText,voice,settings:{speed:1},provider:voice.provider,model:hosted?'synthetic-hosted':'fake',state:id==='studio-progress'?'running':id==='studio-failed'?'failed':id==='hosted-review'?'needs_review':'completed',done:1,total:3,created:1794045600000,attempts:1,error:id==='studio-failed'?'Synthetic interruption. Your saved work is available to retry.':id==='hosted-review'?'Provider outcome is uncertain. Operator review is required.':undefined,retryBlocked:hosted,approvalId:'synthetic-fixture',estimatedMicroUsd:12300});
  if (id==='voice-sample') state.voices.push({id:'sample-voice',name:'Evening storyteller',provider:'fake',state:'demo',validation:{seconds:65},verification:'pending'});
  if(hosted) state.voiceOperations={enabled:false,narrationEnabled:false,createMicroUsd:0,approvalId:'synthetic-fixture',consentVersion:'fixture-only'};
  const job = (status,index=0) => ({id:`sample-read-${index}`,text:sampleText,voice,settings:{speed:1},provider:voice.provider,model:'synthetic-fixture',state:status,done:status==='queued'?0:1,total:3,created:1794045600000,attempts:1,approvalId:'synthetic-fixture',estimatedMicroUsd:12300,...(status==='failed'?{error:'Synthetic interruption. Your saved work is available.'}:{})});
  const jobStates={'job-queued':'queued','job-running':'running','job-completed':'completed','job-cancelled':'cancelled','job-failed':'failed','job-blocked':'failed','job-hosted':'completed'};
  if(jobStates[id])state.jobs=[{...job(jobStates[id]),retryBlocked:id==='job-blocked'}];
  if(id==='studio-mixed')state.jobs=['queued','running','completed','failed','cancelled'].map(job);
  if(id==='voice-deleted')state.voices.push({id:'sample-voice',name:'Evening storyteller',provider:'fake',state:'demo',validation:{seconds:65},verification:'pending',sampleDeletedAt:1794045600000});
  if(['hosted-create','hosted-pending','hosted-ready','hosted-failed','hosted-uncertain'].includes(id)) {
    const status={'hosted-create':'demo','hosted-pending':'pending','hosted-ready':'ready','hosted-failed':'failed','hosted-uncertain':'needs_review'}[id];
    state.voices.push({id:'sample-voice',name:'Evening storyteller',provider:status==='demo'?'fake':'elevenlabs',state:status,...(status==='demo'?{}:{source:'sample'}),validation:{seconds:65},verification:status==='ready'?'verified':'pending'});
    state.voiceOperations.enabled=true;
  }
  if(id==='hosted-allowance')state.allowance={enabled:true,approvalId:'synthetic-fixture',remainingUnits:5000,remainingCalls:8,expiresAt:1794052800000};
  return state;
}
export function createFixtureTransport(id) {
  const state=fixtureState(id); let counter=0;
  const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
  return async (input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,'https://fixture.invalid');
    const method=options.method||'GET'; const body=options.body?JSON.parse(options.body):{};
    if(url.origin!=='https://fixture.invalid') throw Error('Fixtures never contact external services.');
    if(url.pathname==='/fixture-data/session'){if(id==='account-unavailable')throw Error('Synthetic account unavailable');return response({authenticated:!signedOutFixture(id)||id==='account-expired',auth:'auth0',csrf:'synthetic-only'});}
    if(url.pathname==='/fixture-data/state'){if(id==='account-expired')return response({error:'Your session expired. Log in again to continue.'},401);if(id==='studio-offline')throw Error('Synthetic connection lost');return response(structuredClone(state));}
    if(url.pathname==='/fixture-data/waitlist'){
      if((id==='waitlist-preparing'&&method==='GET')||(id==='waitlist-saving'&&method==='POST'))return new Promise(()=>{});
      if(id==='waitlist-error'&&method==='POST')return response({error:'Synthetic interruption. Reopen the form and try again.'},503);
      return response(method==='GET'?{enabled:id==='waitlist'||['waitlist-saving','waitlist-error'].includes(id),token:'synthetic-only',consentVersion:'fixture-only'}:{ok:true});
    }
    if(url.pathname==='/fixture-data/preflight'&&id==='reader-preflight-pending')return new Promise(()=>{});
    if(url.pathname==='/fixture-data/preflight'&&id==='reader-preflight-error')return response({error:'Synthetic estimate unavailable. Try again shortly.'},503);
    if(url.pathname==='/fixture-data/preflight')return response({characters:body.text?.length||0,chunks:1,estimatedSeconds:90,allowance:state.allowance,cost:state.mode==='elevenlabs'?'Synthetic estimate: $0.01230. No provider is connected.':'Free local demo.'});
    if(url.pathname==='/fixture-data/jobs'&&method==='POST'){
      if(state.mode==='elevenlabs'&&!body.providerConsent)return response({error:'Explicit narration consent is required.'},400);
      const job={id:`fixture-read-${++counter}`,text:body.text,voice:state.voices.find(v=>v.id===body.voiceId)||state.voices[0],settings:body.delivery,provider:state.mode,model:'synthetic-fixture',state:'completed',done:1,total:1,created:1794045600000,attempts:1,approvalId:'synthetic-fixture',estimatedMicroUsd:12300};state.jobs.unshift(job);return response(job);
    }
    const jobRoute=url.pathname.match(/^\/fixture-data\/jobs\/([^/]+)(?:\/(cancel|retry))?$/);
    if(jobRoute){const job=state.jobs.find(j=>j.id===jobRoute[1]);if(!job)return response({error:'Fixture job not found.'},404);if(method==='DELETE')state.jobs.splice(state.jobs.indexOf(job),1);else if(jobRoute[2]==='cancel')job.state='cancelled';else if(jobRoute[2]==='retry'&&!job.retryBlocked){job.state='completed';delete job.error;}else return response({error:'Fixture operation unavailable.'},400);return response({ok:true});}
    if(url.pathname==='/fixture-data/voices'&&method==='POST'&&['recording-form','recording-error','recording-saving'].includes(id)){
      if(id==='recording-saving')return new Promise(()=>{});
      if(id==='recording-error')return response({error:'Synthetic validation: use one clean speaker with no clipping.'},400);
      if(!body.permission||!body.singleSpeaker)return response({error:'Recording permission and one speaker are required.'},400);
      const saved={id:`fixture-voice-${++counter}`,name:body.name,provider:'fake',state:'demo',validation:{seconds:65},verification:'pending'};state.voices.push(saved);return response(saved);
    }
    const voiceRoute=url.pathname.match(/^\/fixture-data\/voices\/([^/]+)(?:\/(sample|hosted|verify|provider-delete))?$/);
    if(voiceRoute&&Object.hasOwn(coverage,id)){
      const v=state.voices.find(v=>v.id===voiceRoute[1]);if(!v)return response({error:'Fixture voice not found.'},404);
      const operation=voiceRoute[2];
      if(operation==='sample'&&method==='DELETE')v.sampleDeletedAt=1794045600000;
      else if(!operation&&method==='DELETE')state.voices.splice(state.voices.indexOf(v),1);
      else if(operation==='hosted'&&method==='POST'&&body.rightsConsent&&body.singleSpeaker&&body.providerConsent&&v.state==='demo')Object.assign(v,{source:'sample',provider:'elevenlabs',state:'pending'});
      else if(operation==='verify'&&method==='POST'&&['pending','ready','failed'].includes(v.state))Object.assign(v,{state:'ready',verification:'verified'});
      else if(operation==='provider-delete'&&method==='POST'&&body.deleteConsent)v.state='deleted';
      else return response({error:'Fixture operation unavailable.'},400);
      return response({ok:true});
    }
    if(url.pathname==='/fixture-data/logout')return response({ok:true});
    return response({error:'This fixture previews appearance only. This operation is not connected.'},400);
  };
}
