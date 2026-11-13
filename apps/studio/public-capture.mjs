import {loadPublicScreens} from '../../packages/capture/public-screens.mjs';
import {PROFILES} from '../../packages/capture/scenes.mjs';
const el=(tag,attrs={},...children)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else n.setAttribute(k,v);}n.append(...children);return n;};
export function mountPublicCapture(container, {allowLocal = true} = {}) {
  let disposed=false,observer,apps=[],app,screen,frame;
  const params=new URL(location.href).searchParams;
  let profile=PROFILES.find(p=>p.id===params.get('profile'))??PROFILES[0];
  const root=el('main',{class:'cs-shell','data-public-capture':''});
  const status=el('p',{role:'status'},'Loading public screens…');
  const appSelect=el('select',{'aria-label':'Application',onchange:()=>{app=apps.find(a=>a.id===appSelect.value);screen=app.screens[0];populate();}});
  const screenSelect=el('select',{'aria-label':'Screen',onchange:()=>{screen=app.screens.find(s=>s.id===screenSelect.value);show();}});
  const profileSelect=el('select',{'aria-label':'Output format',onchange:()=>{profile=PROFILES.find(p=>p.id===profileSelect.value);show();}},...PROFILES.map(p=>el('option',{value:p.id},p.title)));
  profileSelect.value=profile.id;
  const stage=el('div',{class:'cs-stage'}),details=el('div',{class:'cs-details'}),actions=el('div',{class:'cs-actions'});
  const copy=el('button',{type:'button',onclick:async()=>{try{await navigator.clipboard.writeText(location.href);status.textContent='Capture address copied.';}catch{status.textContent='Copy the address from your browser.';}}},'Copy capture address');
  root.append(el('header',{class:'cs-intro'},el('p',{class:'cs-eyebrow'},'Production / Capture studio'),el('h1',{},'Every app. Every format.'),el('p',{},'Public, app-owned screens with synthetic data. Choose a screen and size, then open it for capture from any browser.')),
    el('div',{class:'cs-controls'},el('label',{},'Application',appSelect),el('label',{},'Screen',screenSelect),el('label',{},'Output format',profileSelect)),
    el('div',{class:'cs-layout'},el('section',{},stage,status),details),actions,
    el('section',{class:'cs-runner'},el('h2',{},'Capture from anywhere'),el('p',{},'Open the screen in a new tab and capture at the selected viewport and pixel density. This preview is scaled to fit; screenshot the opened screen, not this frame. Full-page captures may be taller than the preset. Images are not generated or stored by this static page.'),el('p',{},'Agents: read the public registry and screen guide. Capture one screen or iterate every listed screen using a fresh browser context, synthetic data and no account cookies. Inspect the result before replacing a website image.'),el('div',{class:'cs-actions'},el('a',{href:'../../docs/process/capture-studio.md'},'Capture guide'),el('a',{href:'../../registry/index.json'},'Application registry'),...(allowLocal?[el('a',{href:'?library=capture&capture=local'},'Local validated exports')]:[]))));
  container.replaceChildren(root);
  function populate(){screenSelect.replaceChildren(...app.screens.map(s=>el('option',{value:s.id},`${s.title}${s.section==='patterns'?' · pattern':''}`)));screenSelect.value=screen?.id??'';show();}
  function show(){
    observer?.disconnect();stage.replaceChildren();actions.replaceChildren(copy);details.replaceChildren();
    const url=new URL(location.href);url.searchParams.set('library','capture');url.searchParams.set('app',app.id);url.searchParams.set('screen',screen?.id??'');url.searchParams.set('profile',profile.id);history.replaceState(null,'',url);
    details.append(el('h2',{},screen?.title??app.title),el('p',{},screen?.description||'App-owned presentation fixture.'),el('p',{},`${profile.viewport.width} × ${profile.viewport.height} CSS pixels · ${profile.deviceScaleFactor}× density · ${profile.output.width} × ${profile.output.height} image pixels`),el('p',{},'Presentation fixture, not a live account or production backend.'));
    if(profile.appStore)details.append(el('p',{class:'cs-platform-warning'},'App Store dimensions only, not a native-device screenshot or submission certification.'));
    if(!screen?.url){status.textContent='No hosted fixture in this checkout. Build the public release to publish this screen; local app servers are not contacted.';return;}
    const target=new URL(screen.url);target.searchParams.set('theme',app.themes[0]);
    actions.prepend(el('a',{href:target.href,target:'_blank',rel:'noopener noreferrer'},'Open screen for capture'));
    status.textContent='Public fixture preview. Open the screen to capture at full resolution.';
    frame=el('iframe',{src:target.href,title:`${app.title}: ${screen.title}`,sandbox:'allow-scripts',referrerpolicy:'no-referrer',width:profile.viewport.width,height:profile.viewport.height});
    stage.style.aspectRatio=`${profile.viewport.width}/${profile.viewport.height}`;stage.style.maxWidth=profile.viewport.width<profile.viewport.height?'440px':'none';stage.append(frame);
    const fit=()=>{frame.style.transform=`scale(${stage.clientWidth/profile.viewport.width})`;};observer=new ResizeObserver(fit);observer.observe(stage);fit();
  }
  loadPublicScreens(new URL('../../',import.meta.url)).then(data=>{if(disposed)return;apps=data;app=apps.find(a=>a.id===params.get('app'))??apps[0];if(!app)throw Error('No public apps');appSelect.replaceChildren(...apps.map(a=>el('option',{value:a.id},a.title)));appSelect.value=app.id;screen=app.screens.find(s=>s.id===params.get('screen'))??app.screens[0];populate();}).catch(()=>{if(!disposed)status.textContent='Public screen catalog could not load. Reload to retry.';});
  return {destroy(){disposed=true;observer?.disconnect();root.remove();}};
}
