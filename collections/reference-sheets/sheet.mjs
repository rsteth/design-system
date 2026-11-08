import { installThemeAdapter } from '../../packages/workbench/theme-adapter.mjs';
installThemeAdapter(theme => {document.documentElement.dataset.theme=theme;}, {themes:['analysis']});
const search=document.querySelector('#recipe-search'),kind=document.querySelector('#kind-filter'),recipes=[...document.querySelectorAll('.recipe')];
function filter(){let count=0;for(const recipe of recipes){recipe.hidden=!(recipe.dataset.name.includes(search.value.toLowerCase())&&(kind.value==='all'||recipe.dataset.kind===kind.value));if(!recipe.hidden)count++;}document.querySelector('#recipe-count').textContent=`${count} of ${recipes.length} recipes`;document.querySelector('#no-results').hidden=count>0;}
search.addEventListener('input',filter);kind.addEventListener('change',filter);
document.querySelector('#reset-filters').addEventListener('click',()=>{search.value='';kind.value='all';filter();search.focus();});
document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>{button.closest('.recipe, .supplement-sample').querySelector('.local-status').textContent='Local sample action. Nothing sent or saved.';}));
document.querySelectorAll('[data-nav]').forEach(button=>button.addEventListener('click',()=>{button.parentElement.querySelectorAll('button').forEach(peer=>peer.setAttribute('aria-pressed',String(peer===button)));button.closest('.recipe, .supplement-sample').querySelector('.local-status').textContent=`${button.textContent} selected locally.`;}));
filter();document.documentElement.dataset.workbenchReady='true';
