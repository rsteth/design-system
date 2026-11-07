import {decode,matricesFor,traceFor,distributionFor,chooseToken,createState,step,PHASES,FIXTURE} from './mechanics.mjs?v=20261101-tokenmath4';
import {arrowNode} from '../arrows.mjs?v=20261105-arrows';
// Presentation for the scroll story. No values are produced here: pieces, rows, weights,
// probabilities, draws and choices all come from the pinned mechanics.
export function describeFlow(state,selected=1,previous=null){
 const selectedIndex=Math.max(0,Math.min(selected,state.ids.length-1)),matrices=matricesFor(state),last=state.ids.length-1;
 return {phase:state.phase,stage:PHASES.indexOf(state.phase)+1,context:state.text,
 pieces:state.ids.map((id,index)=>({id,index,text:decode([id]),label:decode([id]).replaceAll(' ','·'),input:matrices.input[index],contextual:matrices.contextual[index],generated:index>=state.ids.length-state.generated})),
 trace:traceFor(state,selectedIndex),selectedIndex,lastIndex:last,distribution:distributionFor(previous??state),selection:state.selection,generated:state.generated,stopped:state.stopped,stopReason:state.stopReason,mode:state.mode};
}

/* ---------- Scrubber: one position = a cycle, its chosen result (if any) and a phase 0–4 ---------- */
export const STOPS=['tokens','embedding','layers','distribution','append'];
const toAppend=s=>{let t=s;while(t.phase!=='append'&&!t.stopped)t=step(t);return t;};
export function startPosition(state=createState()){return {cycle:state,result:null,phase:3};}
/** Forward one stop. 03 → 04 chooses a token; 04 → 00 starts the next cycle (or stops at the demo limit). */
export function forward(pos){
 if(pos.result?.stopped||pos.cycle.stopped)return pos;
 if(pos.phase<3)return {...pos,phase:pos.phase+1};
 if(pos.phase===3)return {...pos,result:toAppend(pos.cycle),phase:4};
 const next=step(pos.result);
 return next.stopped?{...pos,result:next}:{cycle:next,result:null,phase:0};
}
export const canForward=pos=>!(pos.result?.stopped||pos.cycle.stopped);

/* ---------- Sampling playground: the pinned sampler, many times ---------- */
export const PLAYGROUND_DISTRIBUTION=distributionFor(createState());
/** Where one seed's draw lands. chooseToken returns the advanced seed; draw = that seed / 2^32. */
export function preview(seed,distribution=PLAYGROUND_DISTRIBUTION){
 const pick=chooseToken(distribution,{mode:'sample',seed});return {pick,draw:pick.seed/4294967296};
}
/** n draws in a row, each starting from the seed the previous draw returned. */
export function drawMany(seed,n,distribution=PLAYGROUND_DISTRIBUTION){
 const counts=distribution.map(()=>0);let s=seed;
 for(let i=0;i<n;i++){const pick=chooseToken(distribution,{mode:'sample',seed:s});counts[distribution.findIndex(d=>d.aggregate?pick.aggregate:d.id===pick.id)]++;s=pick.seed;}
 return {counts,seed:s};
}

/* ---------- Word picker: real cl100k_base splits from the fixture ---------- */
// Every multi-piece example in the fixture appears; add one upstream, sync, and it shows up here.
export const WORDS=FIXTURE.examples.filter(e=>e.ids.length>1).map(e=>({text:e.text,pieces:e.pieces.map((p,i)=>({id:e.ids[i],label:p.replaceAll(' ','·')}))}));
/** Pieces that read as the same word but are different tokens (case or a leading space), found in the fixture. */
export const SAME_WORD=(()=>{const seen=new Map();for(const e of FIXTURE.examples)e.pieces.forEach((p,i)=>{const key=p.trim().toLowerCase(),ids=seen.get(key)??new Map();ids.set(e.ids[i],p.replaceAll(' ','·'));seen.set(key,ids);});
 return [...seen.values()].filter(ids=>ids.size>1).map(ids=>[...ids].map(([id,label])=>({id,label})));})();

/* ---------- DOM renderers ---------- */
function node(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
const SLAB={sage:['#7f8b6e','#66745f','#c0c7ac','#dde1c9'],terra:['#b16c4f','#874d3a','#db9672','#f1c19a']};
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function slabArt(kind){
 const art=document.createElementNS('http://www.w3.org/2000/svg','svg');art.setAttribute('viewBox','0 0 80 58');art.setAttribute('class','flow-slab');art.setAttribute('aria-hidden','true');art.setAttribute('shape-rendering','crispEdges');
 const [left,right,top,dot]=SLAB[kind];
 for(const [points,fill] of [['4,22 40,40 40,50 4,32',left],['40,40 76,22 76,32 40,50',right],['4,22 40,4 76,22 40,40',top]]){const p=document.createElementNS('http://www.w3.org/2000/svg','polygon');p.setAttribute('points',points);p.setAttribute('fill',fill);art.append(p);}
 // Ordered dither on the top face: lighter toward the back corner.
 for(let x=6;x<74;x+=2)for(let y=6;y<38;y+=2){const d=Math.abs(x-40)/36+Math.abs(y-22)/18;if(d<.92&&BAYER[(y/2)&3][(x/2)&3]<Math.round(9-(y-4)/4)){const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width','1.4');r.setAttribute('height','1.4');r.setAttribute('fill',dot);art.append(r);}}
 return art;
}
/** Piece tiles. With onSelect they are toggle buttons (aria-pressed); without, a plain list. */
export function renderPieces(view,onSelect=null,{highlight=-1}={}){
 return view.pieces.map((piece,index)=>{
  const li=node('li','piece'+(piece.generated?' generated':'')+(index===highlight?' appended':''));
  const body=onSelect?node('button','flow-piece'+(index===view.selectedIndex?' selected':'')):node('span','flow-piece');
  if(onSelect){body.type='button';body.dataset.pieceIndex=index;body.setAttribute('aria-pressed',String(index===view.selectedIndex));body.setAttribute('aria-label',piece.label+', token ID '+piece.id);body.addEventListener('click',()=>onSelect(index));}
  body.append(slabArt(piece.generated?'terra':'sage'),node('strong','',piece.label),node('small','','ID '+piece.id));li.append(body);return li;
 });
}
const LABEL=item=>item.aggregate?'all other tokens':decode([item.id]).replaceAll(' ','·');
const same=(item,chosen)=>!!chosen&&(item.aggregate?!!chosen.aggregate:item.id===chosen.id);
/** One 0–100% strip. Optional needle at a draw; optional chosen segment; pending = outlines only. */
export function renderRibbon(ribbon,distribution,{chosen=null,draw=null,pending=false}={}){
 ribbon.classList.toggle('pending',pending);
 ribbon.replaceChildren(...distribution.map((item,i)=>{const seg=node('span','ribbon-seg seg-'+i+(same(item,chosen)?' chosen':''));seg.style.flexBasis=item.probability*100+'%';if(item.probability>=.12)seg.append(node('b','',LABEL(item)),node('small','',Math.round(item.probability*100)+'%'));return seg;}));
 if(draw!==null){const needle=node('span','ribbon-needle');needle.style.left=draw*100+'%';needle.append(node('small','','draw '+draw.toFixed(3)));ribbon.append(needle);}
}
export function renderDistribution(view,result,{pending=false}={}){
 const $=id=>document.getElementById(id),chosen=result?.selection,draw=chosen&&result.mode==='sample'?chosen.seed/4294967296:null;
 renderRibbon($('ribbon'),view.distribution,{chosen,draw,pending});
 const dl=$('distribution');dl.replaceChildren(...view.distribution.map(item=>{const div=node('div',same(item,chosen)?'chosen':''),dt=node('dt','',LABEL(item)),dd=node('dd'),bar=node('span');bar.style.setProperty('--probability',item.probability*100+'%');bar.setAttribute('aria-hidden','true');dd.append(bar,Math.round(item.probability*100)+'%');if(same(item,chosen)){const em=node('em','',result.mode==='sample'?' sampled':' greedy pick');em.prepend(' ',arrowNode('w'));dd.append(em);};div.append(dt,dd);return div;}));
 const last=view.pieces[view.lastIndex];$('last-position').textContent='Scored from the last position · '+last.label+' / ID '+last.id+'.';
 return view.generated===1?'This second cycle scripts a period at 100%. It is not model output.':'Illustrative probabilities. Probability is not truth confidence.';
}
/** Histogram rows: one dot per draw, plus the count the probability would lead you to expect. */
export function renderHistogram(dl,counts,distribution=PLAYGROUND_DISTRIBUTION){
 const total=counts.reduce((a,b)=>a+b,0);
 dl.replaceChildren(...distribution.map((item,i)=>{const div=node('div','seg-'+i),dt=node('dt','',LABEL(item)),dots=node('span','pg-dots'),dd=node('dd');dots.style.setProperty('--n',counts[i]);dots.setAttribute('aria-hidden','true');dd.append(dots,node('b','',String(counts[i])),node('small','',total?' expected ≈ '+Math.round(item.probability*total):''));div.append(dt,dd);return div;}));
}
/** The appended piece, its ID decoded, and the longer text that becomes the next cycle's input. */
export function renderAppend(view){
 const wrap=node('div','append-live');
 if(view.selection?.aggregate){wrap.append(node('p','text-box','All other tokens'),node('p','','This group has no single token ID. The small fixture stops here without inventing text.'));return wrap;}
 const last=view.pieces.at(-1),list=node('ol','token-list piece-row');list.append(...renderPieces(view,null,{highlight:view.pieces.length-1}));
 const decodeRow=node('p','append-decode');decodeRow.append(node('span','flow-id','ID '+last.id),(()=>{const s=node('span','flow-arrow',' decode ');s.prepend(arrowNode('e'));s.append(arrowNode('e'));return s;})(),node('span','flow-decoded',last.label));
 const out=node('p','text-box');out.append(view.pieces.slice(0,-1).map(p=>p.text).join(''));out.append(node('mark','',last.text));
 wrap.append(list,decodeRow,out);return wrap;
}
export const STATUS={'outside-fixture':'Stopped: choice outside this fixture. No token was invented.','demo-limit':'Stopped at the two-token demo limit. No model was run.'};
