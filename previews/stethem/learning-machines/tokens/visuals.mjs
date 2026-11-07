// Presentation only: matrix values and token sequences come from the pinned toy.
const PALETTES={sage:['#c0c7ac','#7f8b6e','#66745f','#dde1c9'],terra:['#db9672','#b16c4f','#874d3a','#f1c19a'],ochre:['#d9c48d','#ae9560','#8a774e','#efe2ba']};
export function context2d(canvas) {try{return canvas?.getContext('2d')??null;}catch{return null;}}
function poly(c,p,color){c.fillStyle=color;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function slab(c,x,y,w,h,depth,palette){
 const [top,left,right,hi]=palette;
 poly(c,[[x-w,y],[x,y+h],[x,y+h+depth],[x-w,y+depth]],left);
 poly(c,[[x,y+h],[x+w,y],[x+w,y+depth],[x,y+h+depth]],right);
 poly(c,[[x,y-h],[x+w,y],[x,y+h],[x-w,y]],top);
 c.fillStyle=hi;for(let px=x-w+2;px<x+w;px++)for(let py=y-h+1;py<y+h;py++)if(Math.abs(px-x)/w+Math.abs(py-y)/h<.9&&px%4===0&&py%4===0)c.fillRect(px,py,1,1);
}
function clear(c,width,height){c.canvas.width=width;c.canvas.height=height;c.fillStyle='#f6f3eb';c.fillRect(0,0,width,height);}
export function paintTokens(c,ids,selected=-1,narrow=false,generated=0){
 const cols=narrow?3:5,rows=Math.ceil(ids.length/cols),width=narrow?246:466;
 clear(c,width,rows*90+15);
 ids.forEach((id,i)=>{const x=width/cols*(i%cols+.5),y=43+Math.floor(i/cols)*90;slab(c,Math.round(x),y,narrow?29:36,16,9,PALETTES[i>=ids.length-generated?'terra':'sage']);if(i===selected){c.strokeStyle='#9c523d';c.lineWidth=1;c.strokeRect(Math.round(x)-39,y-24,78,59);}});
}
function matrix(c,values,x,y,scale=1,selected=-1){
 values.forEach((row,r)=>row.forEach((v,col)=>{slab(c,Math.round(x+col*18*scale-r*5*scale),Math.round(y+r*16*scale+col*5*scale),Math.max(5,Math.round(8*scale)),Math.max(3,Math.round(4*scale)),3,PALETTES[v<0?'ochre':r===selected?'terra':'sage']);}));
}
export function paintEmbedding(c,values,selected,narrow=false){clear(c,narrow?246:466,values.length*17+110);matrix(c,values,narrow?65:170,28,1.3,selected);}
export function paintLayers(c,input,contextual,narrow=false){
 clear(c,narrow?246:466,narrow?450:220);
 if(narrow){matrix(c,input,70,15,.9);for(let i=0;i<4;i++)slab(c,123,273-i*22,35,17,7,PALETTES[i===3?'terra':'sage']);matrix(c,contextual,70,315,.9);}
 else{matrix(c,input,40,70,.85);for(let i=0;i<4;i++)slab(c,233,170-i*23,35,17,7,PALETTES[i===3?'terra':'sage']);matrix(c,contextual,350,70,.85);}
}
