// Original orthographic 3D illustration. Geometry comes only from the pinned FK rig.
export const project=([x,y,z])=>[320+200*(-.88*x-.48*y),385+200*(-.26*x+.48*y-.84*z)];
// Front-facing illustration: a 180° yaw, not a change to physical +Y = forward.
// Negative cross(screen-right, screen-down) points toward the camera; nearer depth is larger.
export const depth=([x,y,z])=>-.4032*x+.7392*y+.5472*z;
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const transform=(r,p)=>r.map(row=>row.reduce((s,v,i)=>s+v*p[i],0));
// Shared with static artwork: the camera sees the +Y front, -X side and +Z top.
export function visibleBoxFaces(x,y,z,w,d,h){
 const a=[x-w/2,y-d/2,z],b=[x+w/2,y-d/2,z],c=[x+w/2,y+d/2,z],d0=[x-w/2,y+d/2,z],up=p=>add(p,[0,0,h]);
 return [{points:[d0,c,up(c),up(d0)],fill:'#a8aa9b'},{points:[a,d0,up(d0),up(a)],fill:'#8c9284'},{points:[up(a),up(b),up(c),up(d0)],fill:'#c6c8b8'}];
}
export function paintRobot(canvas,fk,ball,{ghost=null,trails=[]}={}){
 const c=canvas.getContext('2d');c.clearRect(0,0,640,440);c.fillStyle='#edeadf';c.fillRect(0,0,640,440);
 const line=(a,b,color,width=1,dash=[])=>{c.beginPath();c.setLineDash(dash);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.moveTo(...project(a));c.lineTo(...project(b));c.stroke();c.setLineDash([]);};
 for(let k=-4;k<=4;k++){line([k*.15,-.25,0],[k*.15,.95,0],'#dcd8cd');line([-.6,k*.15+.35,0],[.6,k*.15+.35,0],'#dcd8cd');}
 const poly=(ps,fill,stroke='#827f72')=>{c.beginPath();ps.forEach((p,i)=>c[i?'lineTo':'moveTo'](...project(p)));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=stroke;c.lineWidth=1;c.stroke();};
 const box=(...args)=>visibleBoxFaces(...args).forEach(({points,fill})=>poly(points,fill));
 box(0,-.03,.58,.40,.18,.67);box(0,-.03,1.32,.17,.16,.17);
 for(const trail of trails){for(let i=1;i<trail.length;i++)line(trail[i-1],trail[i],'#bdb6a5',1,[3,4]);}
 const arms=[fk.left,fk.right].sort((a,b)=>depth(a.position)-depth(b.position));
 for(const arm of arms){const pts=arm.points;for(let j=1;j<pts.length;j++){line(pts[j-1],pts[j],'#716f62',19);line(pts[j-1],pts[j],'#c3c6b4',14);line(add(pts[j-1],[0,0,.015]),add(pts[j],[0,0,.015]),'#dde0d0',3);}for(const p of pts){const [x,y]=project(p);c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fillStyle='#f5f2e8';c.fill();c.strokeStyle='#757466';c.lineWidth=2;c.stroke();}
 const corners=[[0,-.045,-.045],[0,.045,-.045],[0,.045,.045],[0,-.045,.045]].map(p=>add(arm.position,transform(arm.rotation,p)));poly(corners,'#b9a586','#6d6557');
 for(let j=0;j<3;j++){const v=[0,0,0];v[j]=.09;line(arm.position,add(arm.position,transform(arm.rotation,v)),['#9c523d','#586e51','#536d83'][j],2);}
 }
 function sphere(pose,outline=false){const p=pose.position,[x,y]=project(p),radius=22; c.save();if(outline){c.setLineDash([5,4]);c.strokeStyle='#9c523d';c.lineWidth=2;c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.stroke();c.restore();return;}c.fillStyle='#dbc791';c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();c.strokeStyle='#706957';c.lineWidth=1.5;c.stroke();c.beginPath();c.arc(x,y,radius-1,0,Math.PI*2);c.clip();for(let axis=0;axis<3;axis++){c.beginPath();for(let k=0;k<=64;k++){const t=k*Math.PI/32,v=[0,0,0];v[(axis+1)%3]=.11*Math.cos(t);v[(axis+2)%3]=.11*Math.sin(t);const pp=project(add(p,transform(pose.rotation,v)));c[k?'lineTo':'moveTo'](...pp);}c.strokeStyle=axis===0?'#9c523d':'#8f805f';c.lineWidth=axis===0?2.5:1;c.stroke();}const marker=project(add(p,transform(pose.rotation,[.07,.07,.05])));c.fillStyle='#9c523d';c.fillRect(marker[0]-3,marker[1]-3,6,6);c.restore();}
 if(ball)sphere(ball);if(ghost)sphere(ghost,true);
 c.fillStyle='#6b695f';c.font='12px monospace';c.fillText('FIXED TORSO / 3D KINEMATICS',20,25);const origin=[-.60,.1,.02];[['x',[.16,0,0]],['y',[0,.16,0]],['z',[0,0,.16]]].forEach(([s,d])=>{line(origin,add(origin,d),'#8d8778');c.fillText(s,...project(add(origin,d)));});
}
