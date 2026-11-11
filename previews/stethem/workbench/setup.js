// Development-only adapter injected by workbench/serve.mjs, never by published HTML.
// Real HTML/controllers render all fixtures. Only input data and user actions vary.
(() => {
 const id=document.currentScript.dataset.fixture;
 const nativeFetch=window.fetch.bind(window);
 const origin=new URL('../',document.currentScript.src).href.replace(/\/$/,''); const assetOrigin=new URL(origin).origin;
 import(origin+'/vendor/design-system/packages/workbench/theme-adapter.mjs').then(({installThemeAdapter})=>installThemeAdapter(()=>{}, {themes:['light']}));
 const blocked=()=>Promise.reject(new Error('Remote network disabled in deterministic workbench'));
 Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(_ok,fail){fail({code:1});}}});
 window.fetch=(url,options)=>{
  const u=new URL(url,document.baseURI);
  if(u.origin===assetOrigin)return nativeFetch(url,options);
  if(!u.pathname.includes('/manifests/'))return blocked();
  if(id.endsWith('-loading'))return new Promise(()=>{});
  if(id.endsWith('-error')&&!id.endsWith('-image-error'))return blocked();
  if(id.endsWith('-history-fallback')&&u.pathname.endsWith('recent.json'))return blocked();
  const items=id.endsWith('-empty')?[]:Array.from({length:9},(_,i)=>({date:`2026-10-${String(10+Math.floor(i/3)).padStart(2,'0')}`,slot:['open','midday','close'][i%3],weather:'sunny',created_at:`2026-10-${10+Math.floor(i/3)}T${['09','12','16'][i%3]}:00:00Z`,image_url:origin+(id.endsWith('-image-error')?'/workbench/missing-fixture.png':'/placeholder.webp'),market_mood:'risk_on',volatility_mood:'calm',caption:`Deterministic snapshot ${i+1}`,metadata_url:origin+'/workbench/market-metadata.json'}));
  return Promise.resolve({ok:true,status:200,json:async()=>({updated_at:'2026-10-12T16:00:00Z',items})});
 };
 if(id.endsWith('-no-canvas'))HTMLCanvasElement.prototype.getContext=()=>null;
 const click=s=>document.querySelector(s)?.click();
 const change=(s,value,event='change')=>{const e=document.querySelector(s);if(e){e.value=value;e.dispatchEvent(new Event(event,{bubbles:true}));}};
 window.addEventListener('load',async()=>{
  // Native dynamic entry modules can finish after load; wait for actual enabled controls.
  for(let i=0;i<100;i++){if(!document.querySelector('#phase-next:disabled, #context:disabled'))break;await new Promise(r=>setTimeout(r,20));}
  await new Promise(r=>setTimeout(r,150));
  if(id.startsWith('token-stage-')){
   const stage=id.slice('token-stage-'.length);
   if(['pieces','rows','context'].includes(stage)){for(let i=0;i<3-['pieces','rows','context'].indexOf(stage);i++)click('#phase-back');}
   if(stage==='append')click('#choose');
   if(stage==='stop')for(let i=0;i<16;i++)click('#phase-next');
  }
  if(id==='token-selection-selected')click('#token-list [data-piece-index="0"]');
  if(id==='token-selection-word')click('#word-picker button:last-child');
  if(id==='token-config-sample')change('#mode','sample');
  if(id==='token-config-invalid')change('#seed','-1');
  if(id==='token-playground-populated'){click('#pg-draw');click('#pg-draw');}
  if(id==='token-trace-hover')document.querySelector('.live-example .ex-cell')?.dispatchEvent(new Event('pointerenter'));
  if(id==='token-trace-pinned')click('.live-example .ex-cell');
  if(id==='token-trace-expanded')document.querySelectorAll('details').forEach(e=>e.open=true);
  if(id==='attention-growth-minimum')change('#context','1024','input');
  if(id==='attention-growth-maximum')change('#context','262144','input');
  if(id==='attention-growth-tile'){const c=document.querySelector('#growth-canvas'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+35,clientY:r.top+35}));}
  if(id==='attention-layers-converted')click('[name=architecture][value=converted]');
  if(id==='attention-layers-last')change('#layer-focus',document.querySelector('#layer-focus option:last-child')?.value);
  if(id==='attention-recall-populated')for(let i=0;i<3;i++)click('#next');
  if(id==='attention-recall-complete')for(let i=0;i<6;i++)click('#next');
  if(id==='market-carousel-focused'){const rail=document.querySelector('[data-market-river-gallery]');rail?.querySelector('article')?.click();}
  if(id.startsWith('museum-video-')) {
   const video=document.querySelector('video');
   if(id==='museum-video-paused') video.pause();
   if(id==='museum-video-playing') {
    if(video.paused) click('.museum-animation__toggle');
    for(let i=0;i<150&&(video.paused||video.readyState<2);i++)await new Promise(r=>setTimeout(r,20));
    if(video.paused||video.readyState<2)throw new Error('Fixture video did not reach playing state');
   }
   if(id==='museum-video-error') {video.pause();video.dispatchEvent(new Event('error'));}
  }
  if(id.startsWith('manifolds-')&&!id.endsWith('-no-js')&&!id.endsWith('-no-canvas')) {
   const press=(panel,text)=>{const b=[...document.querySelectorAll('#panel-'+panel+' button')].find(b=>b.textContent===text);if(!b)throw new Error('Missing production control: '+text);b.click();};
   if(id==='manifolds-free-adjusted')change('#joint-0','10','input');
   if(id==='manifolds-grasp-unreachable')press(1,'Try unreachable target');
   if(id==='manifolds-grasp-released')press(1,'Release grasp');
   if(id==='manifolds-cost-joint-limit')change('#cost-field','jointLimit');
   if(id==='manifolds-cost-clearance')change('#cost-field','clearanceCost');
   if(id==='manifolds-cost-invalid') {
    const {FIXTURES}=await import(origin+'/learning-machines/manifolds/fixtures.mjs');
    const grid=FIXTURES.landscape,index=grid.cells.findIndex(c=>!c.valid);
    if(index<0)throw new Error('Pinned fixture has no invalid grid cell');
    change('#goal-y',String(index%grid.width),'input');change('#goal-z',String(Math.floor(index/grid.width)),'input');
   }
   if(id==='manifolds-skill-pca')change('#skill-mode','pca');
   if(id==='manifolds-skill-held-out')press(3,'Inspect held-out demonstration');
   if(id==='manifolds-skill-outside')press(3,'Outside the skill dataset');
   if(id==='manifolds-threads-edge')click('[data-view="edge"]');
   if(id==='manifolds-threads-above')click('[data-view="above"]');
   // Real view interpolation lasts 600ms; readiness means its final pose is visible.
   if(id.startsWith('manifolds-threads-'))await new Promise(r=>setTimeout(r,650));
  }
  if(location.hash)document.getElementById(location.hash.slice(1))?.scrollIntoView();
  document.documentElement.dataset.fixtureReady=id;
  document.documentElement.dataset.workbenchReady='true';
 },{once:true});
})();
