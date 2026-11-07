import {growth, architecture, illustrate, EVENTS} from '../../../learning-machines/attention-and-memory/mechanics.mjs';
import {arrowNode} from '../../../learning-machines/arrows.mjs?v=20261105-arrows';
import {context2d,paintGrowth,paintLayers,paintToy,contains,layerStrip,groupOf,tileAt} from '../../../learning-machines/attention-and-memory/visuals.mjs';
const reducedMotion=window.matchMedia('(prefers-reduced-motion:reduce)');
const $ = id => document.getElementById(id);
const growthContext=context2d($('growth-canvas')),layerContext=context2d($('layer-canvas')),toyContext=context2d($('toy-canvas'));
let selectedLayer=3,layerHits=[];
const narrow=window.matchMedia('(max-width:540px)');
const names={attention:'Full attention',gdn:'Original GDN',converted:'Converted to GDN',adapted:'Original GDN, later adapted'};
const format = n => n.toLocaleString('en-US', {maximumFractionDigits:2});
// Tiles ease to the new count (instant with reduced motion). Redraws only during the transition.
let shown=null,frame=null,target=null;
function animateGrowth(data){
 target=data;if(frame)cancelAnimationFrame(frame);
 if(!shown||reducedMotion.matches){shown=data;paintGrowth(growthContext,data);return;}
 const from=shown,start=performance.now(),mix=t=>Object.fromEntries(['full','hybrid','recurrent'].map(k=>[k,from[k]+(data[k]-from[k])*t]));
 const tick=now=>{const t=Math.min(1,(now-start)/320),e=1-(1-t)**3;shown=mix(e);paintGrowth(growthContext,shown);frame=t<1?requestAnimationFrame(tick):null;};
 frame=requestAnimationFrame(tick);
}
// What a tile stands for. "Reaches tile k at" searches the pinned growth() rather than inverting it.
const KIND={full:'Full attention',hybrid:'Qwen hybrid',recurrent:'All recurrent'};
function reaches(kind,k){for(let n=1024;n<=262144;n+=1024)if(growth(n)[kind]/64>=k-1e-9)return n;return null;}
function readTile(event){
 if(!target)return;const canvas=$('growth-canvas'),rect=canvas.getBoundingClientRect();
 const hit=tileAt(target,(event.clientX-rect.left)/rect.width*canvas.width,(event.clientY-rect.top)/rect.height*canvas.height);
 if(!hit){$('tile-readout').textContent='';return;}
 const at=reaches(hit.kind,hit.number);
 $('tile-readout').textContent=hit.filled?KIND[hit.kind]+' · tile '+hit.number+(hit.partial?' (partly filled)':'')+' — one more copy of the whole stack’s state at 1,024 tokens. Now '+format(hit.value)+' tiles.'
  :at?KIND[hit.kind]+' fills tile '+hit.number+' at '+format(at)+' tokens.':KIND[hit.kind]+(hit.kind==='recurrent'?' never needs tile '+hit.number+': its state stays one tile at any length.':' does not reach tile '+hit.number+' within 262,144 tokens.');
}
function updateGrowth() {
 const tokens=Number($('context').value), data=growth(tokens);
 $('tokens').value=format(tokens)+' tokens';
 for(const name of ['full','hybrid','recurrent']) $(name+'-value').textContent=format(data[name]/64)+'× baseline';
 const x=30+(tokens-1024)/(262144-1024)*550;
 for(const name of ['full','hybrid','recurrent']) {
  const y=value=>170-(value/64)/256*160;
  const start=growth(1024)[name],end=growth(262144)[name];
  document.querySelector('.'+name+'-line').setAttribute('d',`M30 ${y(start)}L580 ${y(end)}`);
  $(name+'-dot').setAttribute('cx',x);$(name+'-dot').setAttribute('cy',y(data[name]));
 }
 $('cursor').setAttribute('x1',x);$('cursor').setAttribute('x2',x);
 if(growthContext){animateGrowth(data);if($('growth-art').hidden)$('linear-growth').open=false;$('growth-art').hidden=false;}
}
function updateLayers() {
 const converted=document.querySelector('[name=architecture]:checked').value==='converted';
 const layers=architecture(converted);
 $('layers').replaceChildren(...layers.map(({index,kind})=>{
  const el=document.createElement('span');el.className='layer '+kind;
  const mark=document.createElement('span');mark.textContent={attention:'A',gdn:'G',converted:'C',adapted:'D'}[kind];
  const num=document.createElement('small');num.textContent=index+1;el.append(mark,num);return el;
 }));
 $('layer-summary').textContent=converted?'All 64 layers are GDN: 16 converted (C), 48 original GDN later adapted (D).':'48 original GDN layers (G), 16 full-attention layers (A). Pattern: G G G A, repeated 16 times.';
 if(layerContext){
  const compact=narrow.matches,canvas=$('layer-canvas'),group=groupOf(selectedLayer),code={attention:'A',gdn:'G',converted:'C',adapted:'D'};
  canvas.width=compact?246:466;canvas.height=compact?390:270;
  layerHits=paintLayers(layerContext,layers,selectedLayer,compact);$('layer-art').hidden=false;$('layers').hidden=true;
  // HTML labels sit over the pixel strip: layer numbers at each row's ends, the zoomed block's range under the inset.
  const bars=layerStrip(layers,compact),label=(text,x,y,cls)=>{const span=document.createElement('span');span.textContent=text;span.className=cls;span.style.left=(x/canvas.width*100)+'%';span.style.top=(y/canvas.height*100)+'%';return span;};
  const ends=compact?[0,31,32,63]:[0,15,31,47,63];
  $('layer-ranges').replaceChildren(...ends.map(i=>label(String(i+1),bars[i].x+2.5,bars[i].top+65,'strip-tick')),
   label('Layers '+(group[0]+1)+'–'+(group[3]+1)+' · '+group.map(i=>code[layers[i].kind]).join(' ')+' · bottom to top',canvas.width/2,canvas.height-2,'inset-label'));
  $('layer-focus').replaceChildren(...layers.map(({index,kind})=>{const option=document.createElement('option');option.value=index;option.textContent='Layer '+(index+1)+' · '+names[kind];return option;}));
  $('layer-focus').value=String(selectedLayer);
  $('selected-layer').textContent='Layer '+(selectedLayer+1)+' · '+names[layers[selectedLayer].kind]+'. The viewfinder zooms into layers '+(group[0]+1)+'–'+(group[3]+1)+'.';
 }

}
let step=0;
function updateToy() {
 const {history,state}=illustrate(step);
 if(toyContext){paintToy(toyContext,history,state);$('toy-art').hidden=false;}
 $('step-status').value=step+' / '+EVENTS.length+' updates';
 $('history').replaceChildren(...history.map(({key,value})=>{const li=document.createElement('li');li.append(key+' ',arrowNode('e',{label:'to'}),' '+value);return li;}));
 if(!history.length){const li=document.createElement('li');li.textContent='No updates yet';$('history').append(li);}
 $('state').replaceChildren(...['door','cup'].map(key=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=state[key]??'—';div.append(dt,dd);return div;}));
 $('previous').disabled=step===0;$('next').disabled=step===EVENTS.length;
 const firstDoor=history.find(event=>event.key==='door')?.value;
 $('recall-log').textContent=firstDoor??'—';
 $('recall-state').textContent=state.door===undefined?'—':state.door===firstDoor?state.door:state.door+' — only the latest survives';
 $('recall-card').dataset.outcome=state.door===undefined?'empty':state.door===firstDoor?'both':'lost';
 $('recall').textContent=step>=3?'The first door colour was blue. The log still contains it; the latest-state dictionary has overwritten it.':step?'The first door colour is blue. Both representations still retain it.':'Start with an empty log and two empty state slots.';
}
$('layer-focus').addEventListener('change',()=>{selectedLayer=Number($('layer-focus').value);updateLayers();});
$('layer-canvas').addEventListener('click',event=>{
 const rect=$('layer-canvas').getBoundingClientRect();
 const point=[(event.clientX-rect.left)/rect.width*$('layer-canvas').width,(event.clientY-rect.top)/rect.height*$('layer-canvas').height];
 const hit=[...layerHits].reverse().find(hit=>contains(point,hit.polygon));
 if(hit){selectedLayer=hit.index;updateLayers();}
});
$('context').addEventListener('input',updateGrowth);
$('growth-canvas').addEventListener('pointermove',readTile);$('growth-canvas').addEventListener('pointerdown',readTile);$('growth-canvas').addEventListener('pointerleave',()=>{$('tile-readout').textContent='';});
document.querySelectorAll('[name=architecture]').forEach(input=>input.addEventListener('change',updateLayers));
$('next').addEventListener('click',()=>{step=Math.min(EVENTS.length,step+1);updateToy();});
$('previous').addEventListener('click',()=>{step=Math.max(0,step-1);updateToy();});
narrow.addEventListener('change',updateLayers);
document.querySelectorAll('#experiment input,#experiment button,#experiment select').forEach(control=>control.disabled=false);
updateGrowth();updateLayers();updateToy();$('experiment').hidden=false;
