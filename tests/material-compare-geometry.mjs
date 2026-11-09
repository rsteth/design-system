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
 return g;
}
