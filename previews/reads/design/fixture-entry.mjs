import {installThemeAdapter} from '../theme-adapter.mjs';
import {createFixtureTransport,fixtureIds,sampleText} from './fixtures.mjs';
const id=new URLSearchParams(location.search).get('fixture')||'studio-empty';
if(!fixtureIds.includes(id))throw Error('Unknown Reads fixture.');
// Install before production modules. No server/account/provider is imported.
globalThis.__readsFixtureFetch=createFixtureTransport(id);
await import('../app.js');
const banner=document.createElement('p');banner.className='design-fixture-notice';banner.textContent="Synthetic design preview. No account, backend, provider, or live waiting list is connected. Nothing is saved or sent.";document.body.prepend(banner);
document.querySelectorAll('.wordmark,#header-login,#login').forEach(link=>{link.href='/design-system/previews/reads/fixture/?fixture='+(['landing','waitlist'].includes(id)?'studio-empty':'landing');});
document.getElementById('logout').onclick=()=>location.assign('/design-system/previews/reads/fixture/?fixture=landing');
if(id==='waitlist')document.getElementById('waitlist').click();
if(id==='voice-sample')document.getElementById('voice-details').open=true;
if(id==='hosted-consent'){const field=document.getElementById('text');field.value=sampleText;field.dispatchEvent(new Event('input'));}
document.documentElement.dataset.fixtureReady=id;
const disposeTheme=installThemeAdapter(theme=>{document.documentElement.dataset.theme=theme;if(getComputedStyle(document.documentElement).getPropertyValue('--ds-color-background').trim()!=='#1d1b1a')throw Error('Reads palette unavailable');},{themes:['dark']});
addEventListener('pagehide',disposeTheme,{once:true});

// Opaque frames deliberately lack allow-forms. Synthetic handlers are clicks, not submissions.
for (const form of document.forms) {
 const submit = [...form.querySelectorAll('button')].find(button => button.type === 'submit');
 if (!submit || !form.onsubmit) continue;
 submit.type = 'button';
 submit.onclick = event => { event.preventDefault(); if (form.reportValidity()) form.onsubmit(event); };
 form.addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.matches('input:not([type=file])')) { event.preventDefault(); if (!submit.disabled) submit.click(); } });
}
