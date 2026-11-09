import assert from 'node:assert/strict';
// Validate the real cut, target, and painted SVG bounds, not a clamped proxy.
export async function assertInitialCompare(page) {
 const g=await page.locator('.material-compare').evaluate(sheet=>{
  const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
  const stage=sheet.closest('.material-stage'),s=rect(stage),p=rect(sheet),handle=sheet.querySelector('.material-compare-handle'),icon=handle.querySelector('svg'),path=icon.querySelector('path');
  return {page:p,visible:{x:Math.max(p.x,s.x+stage.clientLeft),y:Math.max(p.y,s.y+stage.clientTop),right:Math.min(p.x+p.width,s.x+stage.clientLeft+stage.clientWidth),bottom:Math.min(p.y+p.height,s.y+stage.clientTop+stage.clientHeight)},handle:rect(handle),icon:rect(icon),ink:rect(path),values:['x','y'].map(a=>parseFloat(sheet.style.getPropertyValue('--compare-'+a))),hidden:icon.getAttribute('aria-hidden'),focusable:icon.getAttribute('focusable')};
 });
 const close=(a,b)=>assert.ok(Math.abs(a-b)<.06,`${a} != ${b}`);
 for(const [i,axis,size,end] of [[0,'x','width','right'],[1,'y','height','bottom']]){
  const extent=g.visible[end]-g.visible[axis],expected=g.visible[axis]+Math.max(22,extent*.05),center=g.handle[axis]+22;
  close(center,expected);close(g.page[axis]+g.page[size]*g.values[i]/100,center);
  close(g.icon[axis]+g.icon[size]/2,center);close(g.ink[axis]+g.ink[size]/2,center);
  assert.ok(g.handle[axis]>=g.visible[axis]-.06&&g.handle[axis]+44<=g.visible[end]+.06);
 }
 assert.equal(g.hidden,'true');assert.equal(g.focusable,'false');assert.equal(g.handle.width,44);assert.equal(g.handle.height,44);
 await assertCompareDividers(page);
 return g;
}

// Painted segments follow the true clip, including when the handle is a proxy.
export async function assertCompareDividers(page) {
 const g=await page.locator('.material-compare').evaluate(sheet=>{
  const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const stage=sheet.closest('.material-stage'),s=rect(stage),p=rect(sheet);
  return {page:p,stage:{x:s.x+stage.clientLeft,y:s.y+stage.clientTop,right:s.x+stage.clientLeft+stage.clientWidth,bottom:s.y+stage.clientTop+stage.clientHeight},values:['x','y'].map(a=>parseFloat(sheet.style.getPropertyValue('--compare-'+a))),clip:getComputedStyle(sheet.querySelector('[data-mode=original]')).clipPath,handle:rect(sheet.querySelector('.material-compare-handle')),lines:[...sheet.querySelectorAll('.material-compare-line')].map(n=>({axis:n.dataset.axis,hidden:n.hidden,display:getComputedStyle(n).display,rect:rect(n),ariaHidden:n.getAttribute('aria-hidden'),pointerEvents:getComputedStyle(n).pointerEvents}))};
 });
 const close=(a,b)=>assert.ok(Math.abs(a-b)<.08,`${a} != ${b}`);
 const [x,y]=g.values,p=g.page,cut={x:p.x+p.width*x/100,y:p.y+p.height*y/100};
 const clip=g.clip.match(/^inset\(([-\d.]+)(?:%|px) 0px 0px ([-\d.]+)(?:%|px)\)$/);
 assert.ok(clip,`Unexpected Original clip: ${g.clip}`);close(Number(clip[1]),y);close(Number(clip[2]),x);
 assert.equal(g.lines.length,2);
 for(const line of g.lines){
  const visible=x<100&&y<100&&(line.axis==='x'?x>0:y>0);
  assert.equal(line.ariaHidden,'true');assert.equal(line.pointerEvents,'none');
  assert.equal(line.hidden,!visible,`${line.axis} visibility at ${x},${y}`);
  assert.equal(line.display==='none',!visible);
  if(!visible){assert.equal(line.rect.width,0);assert.equal(line.rect.height,0);continue;}
  close(line.rect.x,cut.x);close(line.rect.y,cut.y);
  if(line.axis==='x'){close(line.rect.width,1);close(line.rect.bottom,p.bottom);}
  else{close(line.rect.height,1);close(line.rect.right,p.right);}
 }
 return {...g,cut};
}
