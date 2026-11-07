// Arrows drawn as SVG so phones show the same thin glyph as desktop instead of a colour emoji.
// Shapes are traced from the site fonts' fallback arrows; sizing lives in styles.css (.arrow-*).
export const ARROWS=Object.freeze({
 w:{viewBox:'0 0 24 11',d:'M24 5.5H1.2M6 1 1.2 5.5 6 10'},
 e:{viewBox:'0 0 24 11',d:'M0 5.5h22.8M18 1l4.8 4.5L18 10'},
 n:{viewBox:'0 0 16 24',d:'M8 24V1.8M1.4 8.4 8 1.8l6.6 6.6'},
 s:{viewBox:'0 0 16 24',d:'M8 0v22.2M1.4 15.6 8 22.2l6.6-6.6'},
 ne:{viewBox:'0 0 24 24',d:'M2.2 21.8 20.6 3.4M6.4 3.4h14.2v14.2'},
 ccw:{viewBox:'0 0 22 26',d:'M11.4 5.4A9.6 9.6 0 1 1 2.7 10.2',head:'M5 4.6 12.6 0 12.6 10.6Z'}
});
const GLYPH={w:'←',e:'→',n:'↑',s:'↓',ne:'↗',ccw:'↺'};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/** SVG markup. Decorative by default; pass label (e.g. 'to') when the arrow carries meaning in a sentence. */
export function arrowSVG(dir,{label=null,className=''}={}){
 const a=ARROWS[dir];if(!a)throw new RangeError('Unknown arrow '+dir);
 const aria=label?`role="img" aria-label="${esc(label)}"`:'aria-hidden="true"';
 return `<svg class="arrow arrow-${dir}${className?' '+className:''}" viewBox="${a.viewBox}" ${aria} focusable="false"><path d="${a.d}"/>${a.head?`<path class="arrow-head" d="${a.head}"/>`:''}</svg>`;
}
/** Same arrow as a DOM node. */
export function arrowNode(dir,options){const t=document.createElement('template');t.innerHTML=arrowSVG(dir,options);return t.content.firstChild;}
/** Build a node list from text, replacing each arrow glyph with its SVG. Text stays text (no HTML parsing). */
export function withArrows(text,{label=null}={}){
 const out=[],re=/[←→↑↓↗↺]/g;let last=0,m;
 while((m=re.exec(text))){if(m.index>last)out.push(document.createTextNode(text.slice(last,m.index)));
  const dir=Object.keys(GLYPH).find(k=>GLYPH[k]===m[0]);out.push(arrowNode(dir,{label}));last=re.lastIndex;}
 if(last<text.length)out.push(document.createTextNode(text.slice(last)));return out;
}
