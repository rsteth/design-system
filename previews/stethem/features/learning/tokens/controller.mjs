import {describeFlow,renderPieces,renderDistribution,renderAppend,renderRibbon,renderHistogram,STATUS,STOPS,startPosition,forward,canForward,PLAYGROUND_DISTRIBUTION,preview,drawMany,WORDS,SAME_WORD} from '../../../learning-machines/tokens/flow.mjs?v=20261105-arrows';
import {createState} from '../../../learning-machines/tokens/mechanics.mjs?v=20261101-tokenmath4';
import {renderLookup,renderTrace} from '../../../learning-machines/tokens/explanation.mjs?v=20261105-arrows';
import {arrowNode} from '../../../learning-machines/arrows.mjs?v=20261105-arrows';
// One scroll story. `pos` = {cycle, result, phase}: the text being processed, its chosen token (if any)
// and which of the five stops the reader has reached. History makes every step reversible.
const $=id=>document.getElementById(id);
const reduced=window.matchMedia('(prefers-reduced-motion:reduce)');
const NAMES=['pieces','rows','context','scores','append'];
let pos=startPosition(),history=[],selected=1,configValid=true,traced=null,pinned=false;
const fmt=v=>Number(v.toFixed(3)).toFixed(1).replace(/^-0\.0$/,'0.0');
const go=(next,{scroll=false}={})=>{if(next===pos)return;history.push(pos);pos=next;render();if(scroll)$('stage-'+STOPS[pos.phase]).scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});};
function select(index){selected=index;render();document.querySelector('#token-list [data-piece-index="'+index+'"]')?.focus({preventScroll:true});}

/* Trace one component: the same position lights up in every row, mixture and update. */
function applyTrace(){
 for(const cell of document.querySelectorAll('.live-example .ex-cell')){cell.classList.toggle('traced',traced!==null&&Number(cell.dataset.componentIndex)===traced);}
 document.body.classList.toggle('tracing',traced!==null);
 $('trace-status').textContent=traced===null?'Hover or tap a column to trace one component.':'Tracing component '+(traced+1)+(pinned?' · tap again to release':'')+'.';
}
function wireTrace(root){
 for(const cell of root.querySelectorAll('.ex-cell')){
  const c=Number(cell.dataset.componentIndex);cell.tabIndex=0;cell.setAttribute('role','button');
  cell.addEventListener('pointerenter',()=>{if(!pinned){traced=c;applyTrace();}});
  cell.addEventListener('pointerleave',()=>{if(!pinned){traced=null;applyTrace();}});
  const toggle=()=>{pinned=!(pinned&&traced===c);traced=pinned?c:null;applyTrace();
   if(pinned){const detail=$('live-layers').querySelectorAll('.ex-component-detail')[c];if(detail){detail.closest('.ex-details').open=true;detail.open=true;}}};
  cell.addEventListener('click',toggle);cell.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
 }
}

function render(){
 const {cycle,result,phase}=pos,view=describeFlow(cycle,selected),piece=view.pieces[view.selectedIndex];selected=view.selectedIndex;
 for(const id of ['prompt','pipeline-text','prediction-context'])$(id).textContent=cycle.text;
 // Pipeline: stops behind you are done, the current one is lit, the rest wait.
 document.querySelectorAll('.pipeline li').forEach((li,i)=>li.dataset.state=i<phase?'done':i===phase?'current':'ahead');
 STOPS.forEach((stop,i)=>$('stage-'+stop).classList.toggle('ahead',i>phase));
 $('phase-back').disabled=!history.length&&(phase===0||!!result);$('phase-next').disabled=!canForward(pos);
 $('phase-label').textContent=String(phase).padStart(2,'0')+' · '+NAMES[phase];
 // 00 · pieces
 $('token-list').replaceChildren(...renderPieces(view,select));
 $('piece-hint').textContent='Following '+piece.label+' / ID '+piece.id+'. Pick another piece; every section follows it.';
 // 01 · lookup and 02 · context, both live and traceable
 $('embedding-value').replaceChildren(piece.label+' / '+piece.id+' ',arrowNode('e',{label:'to'}),' ['+piece.input.map(fmt).join(', ')+']');
 $('live-embedding').innerHTML=renderLookup(view,{selectedIndex:view.selectedIndex,interactive:true});
 for(const b of $('live-embedding').querySelectorAll('[data-piece-index]'))b.addEventListener('click',()=>select(Number(b.dataset.pieceIndex)));
 $('live-layers').innerHTML=renderTrace(view,{selectedIndex:view.selectedIndex,includeCaveats:false});
 wireTrace($('live-embedding'));wireTrace($('live-layers'));applyTrace();
 for(const id of ['embedding','layers'])$('live-'+id+'-caption').textContent='Live · following '+piece.label+' / ID '+piece.id+' in “'+cycle.text+'”.';
 // 03 · scores: the strip stays empty until you reach this stop
 $('distribution-note').textContent=view.distribution.length?renderDistribution(view,result,{pending:phase<3}):'';
 // 04 · append
 if(result){$('live-output').replaceChildren(renderAppend(describeFlow(result,selected)));$('live-output').hidden=false;$('static-output').hidden=true;}
 else{$('live-output').hidden=true;$('static-output').hidden=false;}
 for(const id of ['chosen','output'])$(id).hidden=!!result;
 const stopped=result?.stopped||cycle.stopped;
 $('choose').disabled=!!result||cycle.stopped||!configValid;
 $('choose').textContent=phase<3?'Skip to choosing':'Choose the next piece';
 $('next-cycle').disabled=!result||stopped;
 $('next-cycle').replaceChildren(...(result&&result.generated>=2?['Finish']:['Run the next cycle ',arrowNode('ccw')]));
 $('status').textContent=!configValid?'Enter a valid whole-number seed, or Reset, to continue.':stopped?STATUS[(result??cycle).stopReason]:result?'Appended “'+describeFlow(result).pieces.at(-1).label+'” — see 04, then run the next cycle.':(cycle.generated?'Cycle '+(cycle.generated+1)+' · the text now ends in '+view.pieces.at(-1).label+'.':'Cycle 1 · choose the next piece.');
}

/* Scrubber controls: buttons, and arrow keys while focus is in the pipeline. */
// If a scrub button disables itself while focused, keep focus on the scrubber so the arrow keys keep working.
const keepFocus=()=>{const a=document.activeElement;if(a===document.body||a?.disabled){const target=[$('phase-next'),$('phase-back')].find(b=>!b.disabled);target?.focus({preventScroll:true});}};
$('phase-next').addEventListener('click',()=>{go(forward(pos),{scroll:true});keepFocus();});
// Back undoes the last step; before any step it simply moves to the previous stop.
$('phase-back').addEventListener('click',()=>{if(history.length)pos=history.pop();else if(pos.phase>0&&!pos.result)pos={...pos,phase:pos.phase-1};else return;render();keepFocus();$('stage-'+STOPS[pos.phase]).scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});});
document.querySelector('.pipeline').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();$('phase-next').click();}if(e.key==='ArrowLeft'){e.preventDefault();$('phase-back').click();}});
document.querySelectorAll('.pipeline a').forEach((a,i)=>a.addEventListener('click',()=>{if(i<=3&&!pos.result&&i!==pos.phase)go({...pos,phase:i});}));
$('choose').addEventListener('click',()=>{if(pos.result||!configValid)return;go(forward({...pos,phase:3}));});
$('next-cycle').addEventListener('click',()=>{if(!pos.result||pos.result.stopped)return;const next=forward(pos);go(next,{scroll:next.phase===0});});
function restart(state){history=[];pos=startPosition(state);render();}
$('reset').addEventListener('click',()=>{configValid=true;$('seed').setCustomValidity('');$('seed').value=pos.cycle.initialSeed;$('mode').value=pos.cycle.mode;restart(createState({mode:pos.cycle.mode,seed:pos.cycle.initialSeed}));selected=1;});
function configure(){const seed=Number($('seed').value);if($('seed').value===''||!Number.isInteger(seed)||seed<0||seed>0xffffffff){$('seed').setCustomValidity('Enter a whole number from 0 to 4294967295.');$('seed').reportValidity();configValid=false;render();return;}configValid=true;$('seed').setCustomValidity('');restart(createState({mode:$('mode').value,seed}));}
$('mode').addEventListener('change',configure);$('seed').addEventListener('change',configure);

/* Sampling playground: same distribution, the pinned sampler, as many seeds as you like. */
let counts=PLAYGROUND_DISTRIBUTION.map(()=>0),chain=null,chainStart=null;
function renderPlayground(){
 const seed=Number($('pg-seed').value),{pick,draw}=preview(seed);
 $('pg-seed-out').value=seed;renderRibbon($('pg-ribbon'),PLAYGROUND_DISTRIBUTION,{chosen:pick,draw});
 $('pg-pick').replaceChildren('Seed '+seed+' draws '+draw.toFixed(3)+' ',arrowNode('e',{label:'to'}),' '+(pick.aggregate?'all other tokens (outside this fixture)':pick.piece.replaceAll(' ','·'))+'.');
 const total=counts.reduce((a,b)=>a+b,0);renderHistogram($('pg-hist'),counts);$('pg-total').textContent=total+' draws';
 // The same draws from the terminal: run.mjs in the pinned learning-machines commit.
 $('pg-cmd').textContent='node experiments/tokens/run.mjs '+(total?'--seed '+chainStart+' --draws '+total:'--sample --seed '+seed);
}
$('pg-seed').addEventListener('input',()=>{chain=null;if(!counts.some(Boolean))chainStart=null;renderPlayground();});
$('pg-draw').addEventListener('click',()=>{if(chain===null){counts=counts.map(()=>0);chainStart=Number($('pg-seed').value);}const r=drawMany(chain??chainStart,100);r.counts.forEach((n,i)=>counts[i]+=n);chain=r.seed;renderPlayground();});
$('pg-clear').addEventListener('click',()=>{counts=counts.map(()=>0);chain=null;chainStart=null;renderPlayground();});
$('pg-use').addEventListener('click',()=>{$('mode').value='sample';$('seed').value=$('pg-seed').value;configure();$('experiment-controls').scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'center'});});

/* Word picker: real splits from the same tokenizer fixture. */
function showWord(i){
 const word=WORDS[i];$('split-word').textContent=word.text;
 $('split-pieces').replaceChildren(...renderPieces({pieces:word.pieces.map(p=>({...p,generated:false})),selectedIndex:-1}));
 $('split-caption').textContent='Real cl100k_base split · '+word.pieces.length+' pieces.';
 document.querySelectorAll('#word-picker button').forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
}
if(SAME_WORD.length)$('same-word').textContent='Same word, different token: '+SAME_WORD.map(group=>group.map(p=>p.label+' = '+p.id).join(' vs ')).join('; ')+'. Case and a leading space each change the ID.';
$('word-picker').replaceChildren(...WORDS.map((w,i)=>{const b=document.createElement('button');b.type='button';b.textContent=w.text;b.addEventListener('click',()=>showWord(i));return b;}));

for(const id of ['choose','reset','mode','seed','pg-seed','pg-draw','pg-clear','pg-use'])$(id).disabled=false;
$('playground').hidden=false;$('word-picker').hidden=false;
document.body.classList.add('flow-ready');showWord(Math.max(0,WORDS.findIndex(w=>w.text==='unhappiness')));render();renderPlayground();
