import {mountWorkbench,loadCollections} from '../../../../packages/workbench/index.mjs';
import {mountChrome} from '../../../../apps/studio/chrome.mjs';
import {installThemeAdapter} from '../../../../packages/workbench/theme-adapter.mjs';
const root=document.querySelector('#workbench'),navigation=document.querySelector('#library-navigation');
const loaded=new Map();let handle;
async function collectionsFor(library){
 if(!loaded.has(library)){
  const path=library==='references'?'../../../../registry/references.json':'../../../../registry/index.json';
  const collections=await loadCollections(path,{base:import.meta.url});
  loaded.set(library,collections.map(collection=>({...collection,fixtures:[]})));
 }
 return loaded.get(library);
}
async function open(library,id){
 const collections=await collectionsFor(library);
 handle?.destroy();handle=mountWorkbench(root,{skin:'workbench',title:library==='own'?'Robin':'Reference studies',collections,initialCollection:id});
 for(const button of navigation.querySelectorAll('button[data-library]'))button.setAttribute('aria-pressed',String(button.dataset.library===library));
}
await open('own','workbench');
mountChrome({navigation,collectionsFor,loaded,open});
for(const button of navigation.querySelectorAll('button[data-library]'))button.addEventListener('click',()=>open(button.dataset.library));
installThemeAdapter(theme=>handle.setSkin(theme),{themes:['workbench']});
window.addEventListener('pagehide',()=>handle?.destroy(),{once:true});
