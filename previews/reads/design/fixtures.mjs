// Synthetic state only. Production markup, CSS and rendering stay in public/.
export const fixtureIds = ['landing','waitlist','studio-empty','studio-ready','studio-progress','studio-failed','studio-draining','studio-disconnected','voice-sample','hosted-consent','hosted-review'];
export const sampleText = 'By evening, the garden had grown quiet. A light shone in the kitchen window, and there was time for a few more pages.';
export function fixtureState(id) {
  if (!fixtureIds.includes(id)) throw Error('Unknown Reads fixture.');
  const hosted = id.startsWith('hosted-');
  const voice = {id:hosted?'approved':'demo',name:hosted?'Approved sample voice':'Studio demo',provider:hosted?'elevenlabs':'fake',state:'available'};
  const state = {mode: id === 'studio-disconnected' ? 'disconnected' : hosted ? 'elevenlabs' : 'fake', voices:[voice],jobs:[],lifecycle:{ready:id!=='studio-draining'}};
  if (['studio-ready','studio-progress','studio-failed','studio-draining','hosted-review'].includes(id)) state.jobs.push({id:'sample-read',text:sampleText,voice,settings:{speed:1},provider:voice.provider,model:hosted?'synthetic-hosted':'fake',state:id==='studio-progress'?'running':id==='studio-failed'?'failed':id==='hosted-review'?'needs_review':'completed',done:1,total:3,created:1794045600000,attempts:1,error:id==='studio-failed'?'Synthetic interruption. Your saved work is available to retry.':id==='hosted-review'?'Provider outcome is uncertain. Operator review is required.':undefined,retryBlocked:hosted,approvalId:'synthetic-fixture',estimatedMicroUsd:12300});
  if (id==='voice-sample') state.voices.push({id:'sample-voice',name:'Evening storyteller',provider:'fake',state:'demo',validation:{seconds:65},verification:'pending'});
  if(hosted) state.voiceOperations={enabled:false,narrationEnabled:false,createMicroUsd:0,approvalId:'synthetic-fixture',consentVersion:'fixture-only'};
  return state;
}
export function createFixtureTransport(id) {
  const state=fixtureState(id); let counter=0;
  const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
  return async (input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,'https://fixture.invalid');
    const method=options.method||'GET'; const body=options.body?JSON.parse(options.body):{};
    if(url.origin!=='https://fixture.invalid') throw Error('Fixtures never contact external services.');
    if(url.pathname==='/fixture-data/session')return response({authenticated:!['landing','waitlist'].includes(id),auth:'auth0',csrf:'synthetic-only'});
    if(url.pathname==='/fixture-data/state')return response(structuredClone(state));
    if(url.pathname==='/fixture-data/waitlist')return response(method==='GET'?{enabled:id==='waitlist',token:'synthetic-only',consentVersion:'fixture-only'}:{ok:true});
    if(url.pathname==='/fixture-data/preflight')return response({characters:body.text?.length||0,chunks:1,estimatedSeconds:90,cost:state.mode==='elevenlabs'?'Synthetic estimate: $0.01230. No provider is connected.':'Free local demo.'});
    if(url.pathname==='/fixture-data/jobs'&&method==='POST'){
      if(state.mode==='elevenlabs'&&!body.providerConsent)return response({error:'Explicit narration consent is required.'},400);
      const job={id:`fixture-read-${++counter}`,text:body.text,voice:state.voices.find(v=>v.id===body.voiceId)||state.voices[0],settings:body.delivery,provider:state.mode,model:'synthetic-fixture',state:'completed',done:1,total:1,created:1794045600000,attempts:1,approvalId:'synthetic-fixture',estimatedMicroUsd:12300};state.jobs.unshift(job);return response(job);
    }
    const jobRoute=url.pathname.match(/^\/fixture-data\/jobs\/([^/]+)(?:\/(cancel|retry))?$/);
    if(jobRoute){const job=state.jobs.find(j=>j.id===jobRoute[1]);if(!job)return response({error:'Fixture job not found.'},404);if(method==='DELETE')state.jobs.splice(state.jobs.indexOf(job),1);else if(jobRoute[2]==='cancel')job.state='cancelled';else if(jobRoute[2]==='retry'&&!job.retryBlocked){job.state='completed';delete job.error;}else return response({error:'Fixture operation unavailable.'},400);return response({ok:true});}
    if(url.pathname==='/fixture-data/logout')return response({ok:true});
    return response({error:'This fixture previews appearance only. This operation is not connected.'},400);
  };
}
