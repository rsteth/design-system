// A pale casing and dark ink keep both routes legible on the entire cost palette.
// Shortest route is dashed; weighted least-cost route is solid. No color-only key.
export function routeSVG(points,{shortest=false}={}) {
 const p=points.map(pair=>pair.join(',')).join(' '),dash=shortest?'7 5':'';
 return `<polyline points="${p}" fill="none" stroke="#fff9ef" stroke-width="7" stroke-linejoin="round"/><polyline points="${p}" fill="none" stroke="#302e28" stroke-width="3" stroke-linejoin="round" stroke-dasharray="${dash}"/>`;
}
export function sameRoute(a,b) {return a.ok&&b.ok&&a.path.length===b.path.length&&a.path.every((v,i)=>v===b.path[i]);}
