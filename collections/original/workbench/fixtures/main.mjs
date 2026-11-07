import {mountWorkbench,loadCollections} from '../../../../packages/workbench/index.mjs';
import {installThemeAdapter} from '../../../../packages/workbench/theme-adapter.mjs';
const view=new URL(location.href).searchParams.get('view') ?? 'components';
const root=document.querySelector('#workbench');
const [own]=await loadCollections('../registry.json',{base:import.meta.url});
// These are real engine instances, not duplicated component markup. Removing
// self fixtures bounds the tree before the nested workbench receives any data.
const finite={...own,fixtures:[],summary:'Live production workbench controls and tokens. This self-preview deliberately has no child fixtures.'};
let handle;
if(view==='studio'){
 const collections=await loadCollections('../../../../registry/index.json',{base:import.meta.url});
 handle=mountWorkbench(root,{skin:'workbench',title:'Design workbench',collections:collections.filter(collection=>collection.id!=='workbench')});
}else{
 handle=mountWorkbench(root,{skin:'workbench',title:'Design workbench',collections:view==='patterns'?[]:[finite]});
 if(view==='patterns'){
  const controls=document.querySelector('#fixture-controls');controls.className='fixture-states';
  const note=document.createElement('p');note.textContent='Switch real engine states. These controls call the same public setCollections API used by the studio.';controls.append(note);
  for(const [id,title,collections] of [['empty','Empty collection list',[]],['loaded','Loaded token collection',[finite]]]){
   const button=document.createElement('button');button.type='button';button.textContent=title;button.dataset.state=id;button.setAttribute('aria-pressed',String(id==='empty'));
   button.addEventListener('click',()=>{handle.setCollections(collections);for(const other of controls.querySelectorAll('button'))other.setAttribute('aria-pressed',String(other===button));});controls.append(button);
  }
 }
}
installThemeAdapter(theme=>{handle.setSkin(theme);},{themes:['workbench']});
window.addEventListener('pagehide',()=>handle.destroy(),{once:true});
