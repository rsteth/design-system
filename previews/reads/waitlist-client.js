const $=id=>document.getElementById(id);
let waitlistFormConfig=null,waitlistLoad=null,formValidUntil=0,formReadyAfter=0,waitlistOpener=null,dialogGeneration=0,submission=null,shownSubmission=null;
const formControls=enabled=>{for(const el of $('waitlist-form').querySelectorAll('input,button[type="submit"],button[data-preview-submit]'))el.disabled=!enabled;};
function invalidateForm(){waitlistFormConfig=null;formValidUntil=0;formReadyAfter=0;}
export function loadWaitlist({force=false}={}) {
  if(waitlistLoad)return waitlistLoad;
  if(!force&&waitlistFormConfig&&performance.now()<formValidUntil)return Promise.resolve(waitlistFormConfig);
  const started=performance.now();
  waitlistLoad=(async()=>{
    try {
      const response=await globalThis.__readsFixtureFetch('/fixture-data/waitlist',{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Unavailable');
      const value=await response.json();
      if(value.enabled===true&&typeof value.token==='string'&&typeof value.consentVersion==='string') {
        waitlistFormConfig=value;
        // Conservative monotonic bounds: server tokens last30min; reuse for5min,
        // and wait1.5sec after receipt without trusting the visitor's wall clock.
        formValidUntil=started+300000;formReadyAfter=performance.now()+1500;
      } else invalidateForm();
      $('waiting-list-availability').textContent=waitlistFormConfig?'One invitation by email. No newsletter, no subscription.':'The waiting list is closed for now.';
    } catch {invalidateForm();$('waiting-list-availability').textContent='The waiting list is temporarily unavailable.';}
    return waitlistFormConfig;
  })().finally(()=>{waitlistLoad=null;});
  return waitlistLoad;
}
async function prepareDialog(generation,force=false) {
  $('waitlist-form').setAttribute('aria-busy','true');$('waitlist-retry').hidden=true;
  const config=await loadWaitlist({force});
  if(generation!==dialogGeneration||!$('waitlist-dialog').open||submission)return;
  $('waitlist-form').setAttribute('aria-busy','false');
  $('waitlist-result').textContent=config?'':'Waiting list is temporarily unavailable. Please try again.';
  $('waitlist-retry').hidden=!!config;$('waitlist-submit').disabled=!config;
}
function cancelPreparation(){if(submission?.stage==='preparing'){submission.cancelled=true;submission=null;}}
function openWaitlist(trigger) {
  if($('waitlist-dialog').open)return;
  cancelPreparation();
  const generation=++dialogGeneration;waitlistOpener=trigger;trigger.setAttribute('aria-expanded','true');
  $('waitlist-form').reset();$('waitlist-form').hidden=false;$('waitlist-retry').hidden=true;
  $('waitlist-dialog').showModal();
  if(submission?.stage==='sending') {
    shownSubmission=submission;formControls(false);$('waitlist-result').textContent='Your previous request is still finishing. Please wait.';$('waitlist-result').focus();return;
  }
  shownSubmission=null;formControls(true);$('waitlist-result').textContent='Preparing the form. You can enter your email now.';$('waitlist-email').focus();
  void prepareDialog(generation);
}
$('waitlist').onclick=()=>openWaitlist($('waitlist'));
$('waitlist').onkeydown=event=>{if(event.key==='Escape'){$('waitlist-note').hidden=true;$('waitlist').setAttribute('aria-expanded','false');}};
$('waitlist-retry').onclick=()=>{if(submission)return;formControls(true);$('waitlist-result').textContent='Preparing the form. You can enter your email now.';void prepareDialog(dialogGeneration,true);};
$('waitlist-close').onclick=()=>{cancelPreparation();$('waitlist-dialog').close();};
$('waitlist-dialog').addEventListener('cancel',cancelPreparation);
$('waitlist-dialog').onclose=()=>{
  if($('waitlist-dialog').open)return;
  dialogGeneration++;shownSubmission=null;
  cancelPreparation();
  $('waitlist-form').reset();$('waitlist').setAttribute('aria-expanded','false');$('signup').setAttribute('aria-expanded','false');
  if(waitlistOpener)$(document.body.classList.contains('landing-scrolled')?'signup':'waitlist').focus({preventScroll:true});
};
$('waitlist-form').onsubmit=async event=>{
  event.preventDefault();
  if(submission||!$('waitlist-dialog').open||!$('waitlist-form').reportValidity()||!$('waitlist-consent').checked)return;
  const attempt={stage:'preparing',cancelled:false,generation:dialogGeneration};submission=attempt;shownSubmission=attempt;
  // The single intended request remains in this closure only; never persistent storage.
  const value={email:'preview@example.test',consent:$('waitlist-consent').checked,website:''};
  formControls(false);$('waitlist-retry').hidden=true;$('waitlist-form').setAttribute('aria-busy','true');$('waitlist-result').textContent='Preparing your request...';$('waitlist-result').focus();
  let message='',accepted=false;
  try {
    const config=await loadWaitlist();
    if(attempt.cancelled||submission!==attempt||attempt.generation!==dialogGeneration||!$('waitlist-dialog').open)return;
    if(!config)throw Error('Waiting list is temporarily unavailable. Please try again.');
    const wait=Math.max(0,formReadyAfter-performance.now());if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
    if(attempt.cancelled||submission!==attempt||attempt.generation!==dialogGeneration||!$('waitlist-dialog').open)return;
    if(performance.now()>=formValidUntil)throw Error('Reopen the form and try again.');
    const body=JSON.stringify({...value,consentVersion:config.consentVersion});
    const hash='synthetic-only';
    attempt.stage='sending';if(shownSubmission===attempt&&$('waitlist-dialog').open)$('waitlist-result').textContent='Saving your request...';
    const response=await globalThis.__readsFixtureFetch('/fixture-data/waitlist',{signal:AbortSignal.timeout(12000),method:'POST',headers:{'Content-Type':'application/json','X-Vocai-Waitlist':config.token,'x-amz-content-sha256':hash},body});
    const result=await response.json();if(!response.ok)throw Error(result.error||'Could not save your request. Try again.');
    accepted=true;message='Synthetic preview complete. Nothing was saved. No email has been sent.';
  } catch(error) {
    invalidateForm();message=['TypeError','TimeoutError','AbortError'].includes(error.name)?'The connection dropped. Reopen the form and try again; asking twice will not add you twice.':error.message||'The connection dropped. Reopen the form and try again; asking twice will not add you twice.';
  } finally {
    if(submission===attempt)submission=null;
    if(!attempt.cancelled&&shownSubmission===attempt&&$('waitlist-dialog').open) {
      formControls(true);$('waitlist-form').setAttribute('aria-busy','false');$('waitlist-result').textContent=message;
      if(accepted){$('waitlist-form').hidden=true;$('waitlist-form').reset();}
      else $('waitlist-retry').hidden=false;
      if([$('waitlist-submit'),$('waitlist-result')].includes(document.activeElement))$('waitlist-result').focus();
    }
  }
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let headerFrame = false;
export function updateLandingHeader() {
  headerFrame = false;
  if (!document.body.classList.contains('signed-out')) return;
  const brand = document.querySelector('.wordmark');
  const slot = document.querySelector('.brand-slot');
  const hero = document.querySelector('.landing');
  const endX = innerWidth <= 600 ? 26 : 40;
  const endY = innerWidth <= 600 ? 22 : 21;
  const endScale = innerWidth <= 600 ? .60 : .58;
  const progress = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * .40)));
  const compact = progress >= .96;
  const t = reducedMotion.matches ? (compact ? 1 : 0) : progress * progress * (3 - 2 * progress);
  const startX = (innerWidth - brand.offsetWidth) / 2;
  const startY = slot.getBoundingClientRect().top;
  brand.style.setProperty('--brand-x', `${startX + (endX - startX) * t}px`);
  brand.style.setProperty('--brand-y', `${Math.max(endY, startY + (endY - startY) * t)}px`);
  brand.style.setProperty('--brand-scale', `${1 + (endScale - 1) * t}`);
  const active = document.activeElement;
  document.body.classList.toggle('landing-scrolled', compact);
  document.querySelector('.landing-nav').inert = !compact;
  document.querySelector('.landing-actions').inert = compact;
  // Keep the same action focused when its hero/header counterpart takes over.
  const counterpart = compact ? { waitlist: 'signup', login: 'header-login' } : { signup: 'waitlist', 'header-login': 'login' };
  if (counterpart[active?.id]) requestAnimationFrame(() => {
    if (document.body.classList.contains('landing-scrolled') === compact && !$('waitlist-dialog').open && [active, document.body].includes(document.activeElement)) $(counterpart[active.id]).focus({ preventScroll: true });
  });
  if (compact) { $('waitlist-note').hidden = true; $('waitlist').setAttribute('aria-expanded', 'false'); }
  if (!compact) { $('signup-note').hidden = true; $('signup').setAttribute('aria-expanded', 'false'); }
}
function queueLandingHeader() { if (!headerFrame) { headerFrame = true; requestAnimationFrame(updateLandingHeader); } }
addEventListener('scroll', queueLandingHeader, { passive: true });
addEventListener('resize', queueLandingHeader);
reducedMotion.addEventListener('change', queueLandingHeader);
$('signup').onclick = () => openWaitlist($('signup'));
$('signup').onkeydown = event => { if (event.key === 'Escape') { $('signup-note').hidden = true; $('signup').setAttribute('aria-expanded', 'false'); } };
queueLandingHeader();
