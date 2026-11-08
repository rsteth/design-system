import {installThemeAdapter} from '../../packages/workbench/theme-adapter.mjs';
installThemeAdapter(theme=>{document.documentElement.dataset.theme=theme;},{themes:['analysis']});
const $=selector=>document.querySelector(selector);
const status=(node,message)=>node.closest('.composition').querySelector('.local-status').textContent=message;
$('[data-open-project]').addEventListener('click',()=>{$('#browse').scrollIntoView({block:'start'});$('#pattern-search').focus();});
$('[data-complete]').addEventListener('click',event=>{
 const button=event.currentTarget,done=button.getAttribute('aria-pressed')!=='true';
 button.setAttribute('aria-pressed',String(done));button.textContent=done?'Undo':'Mark done';
 $('[data-progress-count]').textContent=done?'3 / 3':'2 / 3';$('.progress-track').setAttribute('aria-valuenow',done?'3':'2');$('.progress-track>span').style.width=done?'100%':'66.666%';
 status(button,done?'Step completed in this preview. Undo is available.':'Step restored. Nothing is stored.');
});
const notes=[...document.querySelectorAll('[data-note]')];let filter='all';
function filterNotes(){
 const query=$('#pattern-search').value.toLowerCase().trim();let count=0;
 for(const note of notes){note.hidden=!(note.dataset.note.toLowerCase().includes(query)&&(filter==='all'||note.dataset.saved==='true'));if(!note.hidden)count++;}
 $('[data-result-count]').textContent=`${count} ${count===1?'note':'notes'}`;$('.empty-results').hidden=count>0;
 const selected=notes.find(note=>!note.hidden&&note.getAttribute('aria-pressed')==='true');
 if(!selected&&count)selectNote(notes.find(note=>!note.hidden));
 $('.note-detail').hidden=!count;
}
const copy=['Space to think, a short walk, and one good idea to carry into the day.','A collection of small observations, unexpected connections, and things to try.','A few places worth returning to, with room to add your own discoveries.'];
function selectNote(note){notes.forEach(item=>item.setAttribute('aria-pressed',String(item===note)));$('[data-detail-title]').textContent=note.dataset.note;$('[data-detail-copy]').textContent=copy[notes.indexOf(note)];}
notes.forEach(note=>note.addEventListener('click',()=>{selectNote(note);status(note,`${note.dataset.note} selected locally.`);}));
$('#pattern-search').addEventListener('input',filterNotes);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));filterNotes();status(button,filter==='all'?'Showing all notes.':'Showing saved notes.');}));
$('[data-clear]').addEventListener('click',()=>{$('#pattern-search').value='';filter='all';document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.filter==='all')));filterNotes();status($('[data-clear]'),'Filters cleared.');$('#pattern-search').focus();});
let saved={name:'Field notes',layout:'list',details:true};
$('[data-save]').addEventListener('click',event=>{
 const name=$('#workspace-name').value.trim();if(!name){$('#workspace-name').setAttribute('aria-invalid','true');status(event.currentTarget,'Enter a collection name before saving this example.');$('#workspace-name').focus();return;}
 $('#workspace-name').removeAttribute('aria-invalid');saved={name,layout:$('#workspace-layout').value,details:$('#show-details').checked};status(event.currentTarget,`“${name}” applied in this preview only. Nothing sent or stored.`);
});
$('#workspace-name').addEventListener('input',()=>$('#workspace-name').removeAttribute('aria-invalid'));
$('[data-cancel]').addEventListener('click',event=>{$('#workspace-name').value=saved.name;$('#workspace-layout').value=saved.layout;$('#show-details').checked=saved.details;$('#workspace-name').removeAttribute('aria-invalid');status(event.currentTarget,'Changes canceled. Last local example restored.');});
document.documentElement.dataset.workbenchReady='true';
