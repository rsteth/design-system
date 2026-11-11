// Presentation only. Every plotted value is computed from the pinned fixture with the pinned PCA mechanics.
// Axes: PC1, PC2 and the Euclidean joint-space distance from the fitted two-component plane, all in radians at one scale.
export const VIEWS=Object.freeze({quarter:[-.5,.56],edge:[0,0],above:[0,Math.PI/2]});
const RAMP=[[127,139,110],[174,149,96],[177,108,79]],TAU=Math.PI*2,RMS_DEG=180/Math.PI/Math.sqrt(14);
export function threadColor(t){
 const k=Math.min(1.999,Math.max(0,t)*2),i=Math.floor(k),f=k-i;
 return 'rgb('+RAMP[i].map((v,j)=>Math.round(v+(RAMP[i+1][j]-v)*f)).join(',')+')';
}
export const rmsDegrees=distance=>distance*RMS_DEG;
export function threadData(F,M){
 const locate=q=>{const z=M.encodePCA(q,F.pca),d=M.decodePCA(z,F.pca);return [z[0],z[1],Math.hypot(...q.map((v,i)=>v-d[i]))];};
 const groups=new Map();
 for(const [hold,list] of [[false,F.demonstrations.train],[true,F.demonstrations.holdout]])for(const sample of list){
  if(!groups.has(sample.trajectory))groups.set(sample.trajectory,{id:sample.trajectory,hold,samples:[]});
  groups.get(sample.trajectory).samples[sample.step]=sample;
 }
 const threads=[...groups.values()].sort((a,b)=>a.id-b.id).map(g=>({...g,present:Math.max(...g.samples.map(s=>s.present)),points:g.samples.map(s=>locate(s.q))}));
 const outside=locate(F.outsideSkill.q),all=[...threads.flatMap(t=>t.points),outside];
 const span=k=>{const v=all.map(p=>p[k]);return [Math.floor((Math.min(...v)-.03)*10)/10,Math.ceil((Math.max(...v)+.03)*10)/10];};
 const [x0,x1]=span(0),[y0,y1]=span(1),present=threads.map(t=>t.present);
 // The hand-designed Reach / Present lines, solved with the pinned IK and located in the same fitted coordinates.
 const solve=(reach,present,q)=>{const r=M.solveGrasp({...M.encodeTaskCoordinates(reach,present),initialQ:q});return r.ok?r.q:null;};
 const line=at=>{
  const mid=solve(...at(0),F.canonical.q);if(!mid)return [];
  const half=dir=>{const points=[];let q=mid;for(let i=1;i<=8;i++){q=solve(...at(dir*i/8),q);if(!q)break;points.push(locate(q));}return points;};
  return [...half(-1).reverse(),locate(mid),...half(1)];
 };
 const levels=[-1,-.5,0,.5,1],designed=[...levels.map(v=>line(s=>[v,s])),...levels.map(v=>line(s=>[s,v]))];
 return {threads,outside,locate,designed,bounds:{x0,x1,y0,y1},presentRange:[Math.min(...present),Math.max(...present)],centre:[(x0+x1)/2,(y0+y1)/2,outside[2]*.35]};
}
// Orthographic camera: yaw about the off-plane axis, then elevation above the sheet. Third value = nearness.
export function projector(W,H,view,data){
 const cy=Math.cos(view.yaw),sy=Math.sin(view.yaw),ce=Math.cos(view.el),se=Math.sin(view.el),s=view.scale,c=data.centre;
 return p=>{const x=p[0]-c[0],y=p[1]-c[1],z=p[2]-c[2],xr=x*cy-y*sy,yr=x*sy+y*cy;return [W*.47+s*xr,H*.54-s*(yr*se+z*ce),-yr*ce+z*se];};
}
export function paintThreads(c,W,H,data,view,style={}){
 const {ink='#302e28',muted='#6b695f',font='monospace'}=style,{x0,x1,y0,y1}=data.bounds,P=projector(W,H,view,data),hits=[];
 const seg=(a,b)=>{c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();};
 const dot=(p,r)=>{c.beginPath();c.arc(p[0],p[1],r,0,TAU);};
 const length=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
 c.clearRect(0,0,W,H);c.lineCap='round';c.lineJoin='round';c.setLineDash([]);c.strokeStyle=ink;c.lineWidth=1;
 c.globalAlpha=.1;
 for(let i=0,n=Math.round((x1-x0)*10);i<=n;i++)seg(P([x0+i/10,y0,0]),P([x0+i/10,y1,0]));
 for(let j=0,n=Math.round((y1-y0)*10);j<=n;j++)seg(P([x0,y0+j/10,0]),P([x1,y0+j/10,0]));
 c.globalAlpha=.45;c.beginPath();[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].forEach(([x,y],i)=>{const p=P([x,y,0]);c[i?'lineTo':'moveTo'](p[0],p[1]);});c.closePath();c.stroke();
 if(view.designed){
  c.globalAlpha=.6;c.lineWidth=1.3;c.setLineDash([1,4]);
  for(const points of data.designed){if(points.length<2)continue;c.beginPath();points.map(P).forEach((p,i)=>c[i?'lineTo':'moveTo'](p[0],p[1]));c.stroke();}
  c.setLineDash([]);c.lineWidth=1;
 }
 const [lo,hi]=data.presentRange,mid=Math.floor(data.threads[0].points.length/2);
 const order=data.threads.map((thread,index)=>{const pts=thread.points.map(P);return {thread,index,pts,near:pts[mid][2]};}).sort((a,b)=>a.near-b.near);
 for(const {thread,index,pts} of order){
  const on=view.hot===index,colour=threadColor((thread.present-lo)/Math.max(1e-12,hi-lo));
  c.globalAlpha=view.hot!=null&&!on?.18:on?1:.85;c.strokeStyle=colour;c.fillStyle=colour;c.lineWidth=on?2.6:1.5;c.setLineDash(thread.hold?[5,4]:[]);
  c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length-1;i++)c.quadraticCurveTo(pts[i][0],pts[i][1],(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2);
  c.lineTo(pts.at(-1)[0],pts.at(-1)[1]);c.stroke();c.setLineDash([]);
  pts.forEach((p,step)=>{dot(p,on?2.4:1.5);c.fill();hits.push([p[0],p[1],index,step]);});
 }
 c.font='12px '+font;c.textBaseline='middle';
 const note=(p,lines)=>{
  const width=Math.max(...lines.map(text=>c.measureText(text).width)),left=p[0]+12+width>W-4;
  c.textAlign=left?'right':'left';lines.forEach((text,i)=>{c.fillStyle=i?muted:ink;c.fillText(text,p[0]+(left?-12:12),p[1]-7+16*i);});
 };
 const foot=P([data.outside[0],data.outside[1],0]),top=P(data.outside),drop=length(foot,top);
 c.globalAlpha=view.hot!=null&&view.hot!==-1?.3:1;c.strokeStyle=ink;c.lineWidth=1;
 if(drop>8){const k=(drop-7)/drop;c.setLineDash([3,4]);seg(foot,[foot[0]+(top[0]-foot[0])*k,foot[1]+(top[1]-foot[1])*k]);c.setLineDash([]);}
 seg([foot[0]-5,foot[1]],[foot[0]+5,foot[1]]);seg([foot[0],foot[1]-5],[foot[0],foot[1]+5]);
 c.lineWidth=2;dot(top,6);c.stroke();c.fillStyle=ink;dot(top,2);c.fill();hits.push([top[0],top[1],-1,0]);
 note(top,['sideward presentation',drop>30?rmsDegrees(data.outside[2]).toFixed(1)+'° off the sheet':'its height is hidden from above']);
 if(view.current){
  const p=P(view.current);c.globalAlpha=1;c.strokeStyle=ink;c.lineWidth=1.5;dot(p,8);c.stroke();
  seg([p[0]-12,p[1]],[p[0]-8,p[1]]);seg([p[0]+8,p[1]],[p[0]+12,p[1]]);seg([p[0],p[1]-12],[p[0],p[1]-8]);seg([p[0],p[1]+8],[p[0],p[1]+12]);
 }
 c.globalAlpha=1;c.fillStyle=muted;c.textAlign='center';
 // Axis names run along their edge; the arrow is drawn, pointing toward increasing score.
 const along=(text,a,b,at,offset)=>{
  if(length(a,b)<120)return;
  let angle=Math.atan2(b[1]-a[1],b[0]-a[0]);const dir=Math.cos(angle)<0?-1:1;if(dir<0)angle+=Math.PI;
  const half=c.measureText(text).width/2,from=dir*(half-6),tip=dir*(half+16);
  c.save();c.translate(at[0],at[1]);c.rotate(angle);c.fillText(text,-dir*14,offset);
  c.strokeStyle=muted;c.lineWidth=1;c.beginPath();c.moveTo(from,offset);c.lineTo(tip,offset);c.moveTo(tip-dir*5,offset-3.5);c.lineTo(tip,offset);c.lineTo(tip-dir*5,offset+3.5);c.stroke();c.restore();
 };
 const a=P([x0,y0,0]),low=view.designed?Math.min(y0,...data.designed.flat().map(p=>p[1])):y0;
 along('PC1 · farther forward',a,P([x1,y0,0]),P([(x0+x1)/2,low,0]),16);
 along('PC2 · higher',a,P([x0,y1,0]),P([x0,(y0+y1)/2,0]),-12);
 return hits;
}
// Live figure: view buttons, drag or arrow keys to turn, hover to read a handoff, click a pose to load it.
export function threadFigure(data,{onPick=()=>{}}={}){
 const make=(tag,name,html='')=>{const node=document.createElement(tag);node.className=name;node.innerHTML=html;return node;};
 const stage=make('div','thread-stage','<canvas class="thread-figure" tabindex="0" role="img" aria-label="Synthetic handoffs drawn as threads lying almost flat on the fitted two-component plane, with the sideward presentation well above it. Arrow keys turn the view; the sliders move the pose."></canvas>');
 const views=make('div','toolbar thread-views','<span>View</span><button type="button" data-view="quarter">Three-quarter</button><button type="button" data-view="edge">Edge-on</button><button type="button" data-view="above">From above</button>');
 const readout=make('p','thread-readout'),legend=make('p','map-legend','Solid = training handoff · dashed = held-out handoff · colour = peak Present, low (sage) to high (terracotta) · ring = current pose · dotted grid (hand-designed controller) = Reach and Present at -1, -0.5, 0, 0.5 and 1. Height = joint-space distance from the fitted plane, drawn at the same scale as PC1 and PC2. PCA signs are a display convention.');
 const canvas=stage.querySelector('canvas'),c=canvas.getContext('2d');
 const view={yaw:VIEWS.quarter[0],el:VIEWS.quarter[1],scale:275,hot:null,current:null,designed:false},still=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let hits=[],hotStep=0,W=640,H=420,frame=0,drag=null;
 const clampEl=v=>Math.max(0,Math.min(Math.PI/2,v));
 function paint(){
  const ratio=devicePixelRatio||1;W=canvas.clientWidth||640;H=Math.round(Math.max(250,Math.min(440,W*.7)));canvas.style.height=H+'px';
  if(canvas.width!==Math.round(W*ratio)||canvas.height!==Math.round(H*ratio)){canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);}
  c.setTransform(ratio,0,0,ratio,0,0);view.scale=Math.min(300,W*.405);
  hits=paintThreads(c,W,H,data,view,{font:getComputedStyle(canvas).fontFamily||'monospace'});
 }
 function say(){
  const pose=view.current?`\nCurrent pose: PC1 ${view.current[0].toFixed(3)}, PC2 ${view.current[1].toFixed(3)}, ${rmsDegrees(view.current[2]).toFixed(2)}° RMS per joint off the plane.`:'';
  if(view.hot==null)readout.textContent=`${data.threads.length} synthetic handoffs, ${data.threads[0].points.length} poses each. Drag to turn the view; point at a thread, or click a pose to load it.`+pose;
  else if(view.hot===-1)readout.textContent=`Sideward presentation, outside the skill dataset: ${rmsDegrees(data.outside[2]).toFixed(3)}° RMS per joint off the plane. Click to load it.`+pose;
  else{const t=data.threads[view.hot];readout.textContent=`Handoff ${t.id+1} of ${data.threads.length} · ${t.hold?'held out':'training'} · peak Present ${t.present.toFixed(2)} · stays within ${rmsDegrees(Math.max(...t.points.map(p=>p[2]))).toFixed(2)}° RMS of the plane. Click to load pose ${hotStep+1}.`+pose;}
 }
 function turnTo(name){
  const from=[view.yaw,view.el],to=VIEWS[name];cancelAnimationFrame(frame);
  if(still){view.yaw=to[0];view.el=to[1];paint();return;}
  const start=performance.now(),step=now=>{const u=Math.min(1,(now-start)/600),e=u*u*(3-2*u);view.yaw=from[0]+(to[0]-from[0])*e;view.el=from[1]+(to[1]-from[1])*e;paint();if(u<1)frame=requestAnimationFrame(step);};
  step(start);
 }
 function pick(event){
  const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;let best=null,nearest=16*16;
  for(const hit of hits){const d=(hit[0]-x)**2+(hit[1]-y)**2;if(d<nearest){nearest=d;best=hit;}}
  const hot=best?best[2]:null,step=best?best[3]:0;
  if(hot!==view.hot||step!==hotStep){view.hot=hot;hotStep=step;paint();say();}
 }
 views.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>turnTo(b.dataset.view)));
 canvas.addEventListener('pointerdown',event=>{cancelAnimationFrame(frame);pick(event);drag={x:event.clientX,y:event.clientY,yaw:view.yaw,el:view.el,moved:false};canvas.setPointerCapture?.(event.pointerId);});
 canvas.addEventListener('pointermove',event=>{
  if(!drag){pick(event);return;}
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;
  drag.moved=true;view.yaw=drag.yaw-dx*.008;view.el=clampEl(drag.el+dy*.008);paint();
 });
 canvas.addEventListener('pointerup',()=>{
  const clicked=drag&&!drag.moved;drag=null;if(!clicked||view.hot==null)return;
  if(view.hot===-1)onPick({outside:true});else{const t=data.threads[view.hot];onPick({sample:t.samples[hotStep],hold:t.hold});}
 });
 canvas.addEventListener('pointercancel',()=>{drag=null;});
 canvas.addEventListener('pointerleave',()=>{if(!drag&&view.hot!=null){view.hot=null;paint();say();}});
 canvas.addEventListener('keydown',event=>{
  const turn={ArrowLeft:[.1,0],ArrowRight:[-.1,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[event.key];if(!turn)return;
  event.preventDefault();cancelAnimationFrame(frame);view.yaw+=turn[0];view.el=clampEl(view.el+turn[1]);paint();
 });
 if(typeof ResizeObserver==='function')new ResizeObserver(paint).observe(canvas);else addEventListener('resize',paint);
 paint();say();
 return {
  stage,views,readout,legend,
  setPose(q,designed=false){view.current=data.locate(q);view.designed=designed;paint();say();},
  reset(){cancelAnimationFrame(frame);view.yaw=VIEWS.quarter[0];view.el=VIEWS.quarter[1];view.hot=null;paint();say();}
 };
}
