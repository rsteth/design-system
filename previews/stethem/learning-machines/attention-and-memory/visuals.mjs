// Presentation only. The pinned experiment remains the source of all values.
export const PALETTES = Object.freeze({
 gdn:['#c0c7ac','#7f8b6e','#66745f','#dde1c9'],
 attention:['#db9672','#b16c4f','#874d3a','#f1c19a'],
 adapted:['#b7c4af','#778c78','#5f7565','#dce6d4'],
 converted:['#d9c48d','#ae9560','#8a774e','#efe2ba'],
 hybrid:['#d9c48d','#ae9560','#8a774e','#efe2ba']
});
export const COLORS=Object.freeze({blue:'#6d91ad',red:'#bd7664',green:'#8caa7a',white:'#e1ddcc',yellow:'#c9ad58',black:'#454841'});
// One tile = the whole 64-layer stack's state at 1,024 tokens (1× baseline). Linear, countable.
export const TILE_COLUMNS=16,TILE=9;
export function growthTiles(data) {
 return ['full','hybrid','recurrent'].map((kind,index)=>{
  const value=data[kind]/64,whole=Math.floor(value+1e-9);
  return {kind,index,x:12+index*155,value,whole,fraction:Math.max(0,value-whole),rows:Math.ceil(value/TILE_COLUMNS-1e-9)};
 });
}
// All 64 layers in one strip: groups of four (G G G A), wide = one row, compact = two rows of 32.
export function layerStrip(layers,compact=false) {
 if(layers.length!==64) throw new RangeError('Expected 64 layers');
 const perRow=compact?32:64,width=compact?246:466,offset=(width-(perRow/4)*26)/2+1;
 return layers.map(({index,kind})=>{
  const row=Math.floor(index/perRow),j=index%perRow,tall=kind==='attention'||kind==='converted';
  const x=offset+Math.floor(j/4)*26+(j%4)*6,top=14+row*84;
  return {index,kind,row,x,y:top+(tall?0:6),w:5,h:tall?62:56,top};
 });
}
export function groupOf(index) {const start=Math.floor(index/4)*4;return [start,start+1,start+2,start+3];}
export function toyTiles(history,state) {
 return {history:history.map(({key,value},index)=>({key,value,index,color:COLORS[value]})),state:['door','cup'].map(key=>({key,value:state[key]??null,color:COLORS[state[key]]??null}))};
}
export function contains(point,polygon) {
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
  const a=polygon[i],b=polygon[j];
  if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
function polygon(ctx,points,color) {ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function slab(ctx,x,y,w,h,depth,palette) {
 const [top,left,right,highlight]=palette;
 const face=[[x,y-h],[x+w,y],[x,y+h],[x-w,y]];
 polygon(ctx,[face[3],face[2],[x,y+h+depth],[x-w,y+depth]],left);
 polygon(ctx,[face[2],face[1],[x+w,y+depth],[x,y+h+depth]],right);
 polygon(ctx,face,top);
 // Ordered (Bayer 4×4) dither, denser toward the back corner: deterministic grain, no random noise.
 ctx.fillStyle=highlight;
 for(let px=Math.ceil(x-w+2);px<x+w-1;px++)for(let py=Math.ceil(y-h+1);py<y+h;py++) {
  const level=Math.round(6-4*(py-(y-h))/(2*h));
  if(Math.abs(px-x)/w+Math.abs(py-y)/h<.9&&BAYER[py&3][px&3]<level)ctx.fillRect(px,py,1,1);
 }
 return [...face,[x,y+h+depth]];
}
function ground(ctx,width,height) {
 ctx.fillStyle='#f6f3eb';ctx.fillRect(0,0,width,height);ctx.fillStyle='#ddd8cb';
 for(let x=8;x<width;x+=8)for(let y=height-40;y<height-4;y+=8)ctx.fillRect(x,y,1,1);
}
export function context2d(canvas) {
 try {return canvas?.getContext('2d')??null;}catch{return null;}
}
function paper(ctx,width,height) {ctx.fillStyle='#f6f3eb';ctx.fillRect(0,0,width,height);}
function corners(ctx,x0,y0,x1,y1,len,color) {
 ctx.fillStyle=color;
 for(const [x,y,dx,dy] of [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]]) {
  ctx.fillRect(dx>0?x:x-len+1,y,len,1);ctx.fillRect(x,dy>0?y:y-len+1,1,len);
 }
}
function tile(ctx,x,y,width,palette) {
 const [top,left,right,highlight]=palette;
 ctx.fillStyle=right;ctx.fillRect(x,y,width,TILE-1);
 ctx.fillStyle=top;ctx.fillRect(x,y,Math.max(1,width-1),TILE-2);
 ctx.fillStyle=highlight;for(let r=0;r<TILE-2;r++)for(let c=0;c<width-1;c++)if(BAYER[(y+r)&3][(x+c)&3]<5-r)ctx.fillRect(x+c,y+r,1,1);
}
/** Which growth tile sits under a canvas point: 1-based tile number, and whether it is filled yet. */
export function tileAt(data,px,py) {
 const floor=170,row=Math.floor((floor-py)/TILE);
 for(const col of growthTiles(data)) {
  const c=Math.floor((px-col.x)/TILE);
  if(c<0||c>=TILE_COLUMNS||row<0||row>=TILE_COLUMNS||py>floor)continue;
  const number=row*TILE_COLUMNS+c+1;
  return {kind:col.kind,number,filled:number<=Math.ceil(col.value-1e-9),partial:number===Math.ceil(col.value-1e-9)&&col.fraction>0,value:col.value};
 }
 return null;
}
export function paintGrowth(ctx,data) {
 const width=466,height=188,floor=170;paper(ctx,width,height);
 for(const {kind,x,whole,fraction} of growthTiles(data)) {
  const palette=PALETTES[{full:'attention',hybrid:'hybrid',recurrent:'gdn'}[kind]];
  // Ghost grid: the 256-tile capacity at 262,144 tokens, so empty space is countable too.
  ctx.fillStyle='#ddd8cb';
  for(let i=0;i<256;i++)ctx.fillRect(x+(i%TILE_COLUMNS)*TILE+3,floor-(Math.floor(i/TILE_COLUMNS)+1)*TILE+3,2,2);
  for(let i=0;i<whole+(fraction>0?1:0);i++) {
   const w=i<whole?TILE:Math.max(2,Math.round(TILE*fraction));
   tile(ctx,x+(i%TILE_COLUMNS)*TILE,floor-(Math.floor(i/TILE_COLUMNS)+1)*TILE,w,palette);
  }
  ctx.fillStyle='#c5bfb2';ctx.fillRect(x-2,floor+2,TILE_COLUMNS*TILE+3,1);
 }
}
export function paintLayers(ctx,layers,selected,compact=false) {
 const width=compact?246:466,height=compact?390:270;paper(ctx,width,height);
 const bars=layerStrip(layers,compact),group=groupOf(selected),hits=[];
 for(const bar of bars) {
  const [top,left,,highlight]=PALETTES[bar.kind],inGroup=group.includes(bar.index);
  ctx.fillStyle=inGroup?left:top;ctx.fillRect(bar.x,bar.y,bar.w,bar.h);
  ctx.fillStyle=highlight;for(let py=bar.y+3;py<bar.y+bar.h-2;py+=4)ctx.fillRect(bar.x+1+(py>>2)%2*2,py,1,1);
  if(bar.kind==='adapted'){ctx.fillStyle='#f6f3eb';for(let py=bar.y;py<bar.y+bar.h;py+=6)ctx.fillRect(bar.x+bar.w-1,py,1,3);}
  hits.push({index:bar.index,polygon:[[bar.x-1,bar.top],[bar.x+bar.w,bar.top],[bar.x+bar.w,bar.top+62],[bar.x-1,bar.top+62]]});
 }
 const chosen=bars[selected];corners(ctx,chosen.x-3,chosen.top-4,chosen.x+chosen.w+2,chosen.top+65,4,'#9c523d');
 // Viewfinder: the selected block of four, zoomed below as an isometric stack.
 // Connectors start below the last strip row so they never cross a bar or a layer-number label.
 const first=bars[group[0]],last=bars[group[3]],below=bars[63].top+82,cx=width/2,base=height-54,frame=[cx-64,base-112,cx+64,height-22];
 ctx.fillStyle='#b9b2a3';
 const from=[[first.x,below],[last.x+last.w,below]],to=[[frame[0],frame[1]],[frame[2],frame[1]]];
 from.forEach(([x0,y0],k)=>{const [x1,y1]=to[k],n=Math.ceil(Math.hypot(x1-x0,y1-y0)/3);for(let i=0;i<=n;i++)ctx.fillRect(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),1,1);});
 corners(ctx,...frame,8,'#302e28');
 group.forEach((index,level)=>{
  const y=base-level*22,face=slab(ctx,cx,y,40,20,8,PALETTES[layers[index].kind]);
  if(index===selected){ctx.fillStyle='#9c523d';ctx.fillRect(cx-46,y-4,1,20);ctx.fillRect(cx-46,y+15,10,1);ctx.fillRect(cx+45,y-4,1,20);ctx.fillRect(cx+36,y+15,10,1);}
  hits.push({index,polygon:face.slice(0,4),inset:true});
 });
 return hits;
}
export function paintToy(ctx,history,state) {
 ground(ctx,466,210);const tiles=toyTiles(history,state);
 tiles.history.forEach(({index,color})=>slab(ctx,45+index%2*70,35+Math.floor(index/2)*54,27,13,5,[color,'#999681','#6b6d5e','#eee4c6']));
 tiles.state.forEach(({color},i)=>{
  slab(ctx,305+i*100,141,37,18,8,PALETTES.gdn);
  if(color)slab(ctx,305+i*100,130,22,10,7,[color,'#8d8e78','#626957','#e1dcc7']);
 });
}
