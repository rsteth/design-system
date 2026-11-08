/** A source-derived palette for the sheet, never for the parent workbench.
 * Role selection is an authored interpretation. Literal source colors stay unchanged.
 * Only opaque sRGB literals are mapped so contrast can be checked deterministically. */
function rgb(value) {
 if(typeof value!=='string')return null;
 if(value==='black')return [0,0,0];if(value==='white')return [255,255,255];
 const short=/^#([a-f\d]{3})$/i.exec(value),long=/^#([a-f\d]{6})$/i.exec(value);
 const hex=short?short[1].split('').map(x=>x+x).join(''):long?.[1];
 return hex?[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)):null;
}
function luminance(value) {const c=rgb(value);if(!c)return null;return c.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);}
export function paletteContrast(a,b) {const x=luminance(a),y=luminance(b);return x===null||y===null?0:(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function deriveSheetPalette(analysis={},evidence={}) {
 const colors=analysis.colors??{},roles={};
 const pick=(names,fallback,reason,test=()=>true)=>{
  for(const name of names)if(rgb(colors[name])&&test(colors[name]))return {value:colors[name],sourcePath:'colors.'+name,line:evidence['colors.'+name]?.line,status:'Source value; authored role mapping'};
  return {value:fallback,sourcePath:null,status:reason};
 };
 roles.canvas=pick(['canvas','canvas-dark','canvas-night','surface-canvas-dark','canvas-light','surface-canvas-light','background','background-primary','background.default'],'#ffffff','Authored neutral fallback: no usable source canvas');
 const dark=luminance(roles.canvas.value)<.18;
 roles.surface=pick((dark?['surface-1','surface','surface-dark-card','surface-card-dark','surface-dark-elevated','canvas-night-elevated','surface-night']:['surface-card','surface-1','surface','surface-soft','surface-soft-light','canvas-soft','chrome']),roles.canvas.value,'Uses the sheet canvas; no separate source surface');
 // Pick legible annotation text against both source surfaces. This never rewrites a sample's inline source values.
 const surfaces=[roles.canvas.value,roles.surface.value];
 const readable=v=>surfaces.every(bg=>paletteContrast(v,bg)>=4.5);
 const neutral=paletteContrast('#ffffff',roles.canvas.value)>paletteContrast('#111111',roles.canvas.value)?'#ffffff':'#111111';
 roles.ink=pick(['ink','text','text-primary','body','on-dark'],neutral,'Authored contrast fallback for sheet labels',readable);
 if(!readable(roles.ink.value)) {roles.surface={...roles.canvas,status:'Uses canvas to keep sheet labels readable'};surfaces[1]=roles.surface.value;roles.ink=pick(['ink','text','text-primary','body','on-dark'],neutral,'Authored contrast fallback for sheet labels',readable);}
 roles.muted=pick(['ink-muted','ink-mute','muted','ink-secondary','body','ink-body'],roles.ink.value,'Uses primary text for readable annotations',readable);
 roles.accent=pick(['primary','accent','brand','link'],roles.ink.value,'Uses primary text; no usable source accent');
 roles.link=pick(['link','primary','primary-deep','primary-press','primary-hover','primary-active'],roles.ink.value,'Uses primary text because source accents lack label contrast',readable);
 roles.line=pick((dark?['hairline','border','hairline-on-dark','hairline-dark','hairline-violet','hairline-strong']:['hairline','border','hairline-on-light','hairline-light','hairline-strong','border-strong']),dark?'#454549':'#c8c8cc','Authored neutral divider: no usable source border');
 roles.focus={...roles.link,status:roles.link.sourcePath?'Source color mapped to authored focus outline':'Authored readable focus outline'};
 return {scheme:dark?'dark':'light',roles,style:'color-scheme:'+(dark?'dark':'light')+';'+Object.entries(roles).map(([role,item])=>'--sheet-'+role+':'+item.value).join(';')};
}
