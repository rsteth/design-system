const $ = id => document.getElementById(id);
let waitlistFormConfig = null, waitlistSubmitting = false, waitlistOpener = null;
export async function loadWaitlist() {
 waitlistFormConfig = new URLSearchParams(location.search).get('fixture') === 'waitlist' ? {enabled:true} : null;
 $('waiting-list-availability').textContent = waitlistFormConfig ? 'Synthetic dialog only. Nothing is saved or sent.' : 'Waiting list not open yet.';
 return waitlistFormConfig;
}
async function openWaitlist(trigger) {
  if (waitlistSubmitting) return;
  trigger.disabled = true;
  const config = await loadWaitlist(); trigger.disabled = false; trigger.focus({ preventScroll: true });
  if (!config) {
    const note = trigger.id === 'signup' ? $('signup-note') : $('waitlist-note');
    note.hidden = !note.hidden; trigger.setAttribute('aria-expanded', String(!note.hidden)); return;
  }
  $('waitlist-form').reset(); $('waitlist-form').hidden = false; $('waitlist-result').textContent = '';
  $('waitlist-submit').disabled = false; trigger.setAttribute('aria-expanded', 'true');
  waitlistOpener = trigger; $('waitlist-dialog').showModal(); $('waitlist-email').focus();
}
$('waitlist').onclick = () => openWaitlist($('waitlist'));
$('waitlist').onkeydown = event => { if (event.key === 'Escape') { $('waitlist-note').hidden = true; $('waitlist').setAttribute('aria-expanded', 'false'); } };
$('waitlist-close').onclick = () => $('waitlist-dialog').close();
$('waitlist-dialog').onclose = () => { $('waitlist').setAttribute('aria-expanded', 'false'); $('signup').setAttribute('aria-expanded', 'false'); $('waitlist-email').value = ''; waitlistOpener?.focus({ preventScroll: true }); };
$('waitlist-form').onsubmit = event => {
 event.preventDefault(); if (!waitlistFormConfig) return;
 $('waitlist-form').hidden = true; $('waitlist-form').reset();
 $('waitlist-result').textContent = 'Synthetic preview complete. Nothing was saved. No email has been sent.';
 $('waitlist-result').focus();
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
  document.body.classList.toggle('landing-scrolled', compact);
  document.querySelector('.landing-nav').inert = !compact;
  if (!compact) { $('signup-note').hidden = true; $('signup').setAttribute('aria-expanded', 'false'); }
}
function queueLandingHeader() { if (!headerFrame) { headerFrame = true; requestAnimationFrame(updateLandingHeader); } }
addEventListener('scroll', queueLandingHeader, { passive: true });
addEventListener('resize', queueLandingHeader);
reducedMotion.addEventListener('change', queueLandingHeader);
$('signup').onclick = () => openWaitlist($('signup'));
$('signup').onkeydown = event => { if (event.key === 'Escape') { $('signup-note').hidden = true; $('signup').setAttribute('aria-expanded', 'false'); } };
queueLandingHeader();
