/** Local source-audit directory. Public exports deliberately omit the audit data. */
export function validateProjectCoverage(value) {
 const errors=[];
 if(!value||value.schemaVersion!==1||!Array.isArray(value.projects)||!Array.isArray(value.excluded))return ['Invalid project coverage catalog.'];
 const ids=new Set(),statuses=['catalogued','not-yet-catalogued','local-only','scope-review'];
 for(const project of value.projects){
  if(!project||typeof project.id!=='string'||!/^[a-z][a-z0-9-]*$/.test(project.id)||ids.has(project.id))errors.push('Invalid or duplicate project id.');
  ids.add(project?.id);
  for(const key of ['title','category','notes'])if(typeof project?.[key]!=='string'||!project[key].trim())errors.push('Missing project '+key+'.');
  if(!statuses.includes(project?.status))errors.push('Unknown coverage status.');
  if(project?.collection!==undefined&&(typeof project.collection!=='string'||!/^[a-z][a-z0-9-]*$/.test(project.collection)))errors.push('Invalid collection id.');
  if(project?.gaps!==undefined&&(!Array.isArray(project.gaps)||project.gaps.some(x=>typeof x!=='string'||!x.trim())))errors.push('Invalid coverage gaps.');
  if(project?.fixturePrefixes!==undefined&&(!Array.isArray(project.fixturePrefixes)||project.fixturePrefixes.some(x=>typeof x!=='string')))errors.push('Invalid fixture prefixes.');
 }
 for(const item of value.excluded)if(!item||typeof item.title!=='string'||typeof item.reason!=='string')errors.push('Invalid excluded item.');
 return errors;
}
export function projectFixtures(project,collections) {
 const collection=collections.find(item=>item.id===project.collection);
 if(!collection)return [];
 return (collection.fixtures??[]).filter(f=>!project.fixturePrefixes?.length||project.fixturePrefixes.some(prefix=>f.id.startsWith(prefix)));
}
export function projectSearchText(project,collections){return [project.title,project.category,project.notes,...(project.gaps??[]),...projectFixtures(project,collections).flatMap(f=>[f.title,f.id,f.description??'',...(f.states??[])])].join(' ').toLowerCase();}
function el(tag,attrs={},...children){const node=document.createElement(tag);for(const [key,value]of Object.entries(attrs))if(key.startsWith('on'))node.addEventListener(key.slice(2),value);else if(value!==undefined)node.setAttribute(key,value);node.append(...children);return node;}
export function mountProjectCoverage(root,{catalog,collections}) {
 const errors=validateProjectCoverage(catalog);if(errors.length)throw Error(errors.join(' '));
 let query='',filter='all';
 const main=el('main',{class:'pc-main'}),heading=el('h1',{},'Project coverage');
 const summary=el('p',{class:'pc-note'},catalog.scope),privacy=el('p',{class:'pc-note'},catalog.privacy);
 const search=el('input',{type:'search','aria-label':'Search projects',placeholder:'Search projects, components or gaps…',oninput:event=>{query=event.target.value;paint();}});
 const select=el('select',{'aria-label':'Coverage filter',onchange:event=>{filter=event.target.value;paint();}},...[
 ['all','All projects'],['catalogued','In the catalog'],['missing','Needs representation']
 ].map(([value,title])=>el('option',{value},title)));
 const count=el('p',{class:'pc-count','aria-live':'polite'}),grid=el('div',{class:'pc-grid'});
 const exclusions=el('details',{class:'pc-exclusions'},el('summary',{},'Outside this UI catalog'),...catalog.excluded.map(item=>el('p',{},el('strong',{},item.title+': '),item.reason)));
 main.append(heading,el('p',{class:'pc-note'},'Reviewed '+catalog.reviewedAt+'. Counts are registered fixture views, not unique components or a claim that every state is covered.'),summary,privacy,el('div',{class:'pc-controls'},el('label',{},'Find a project',search),el('label',{},'Show',select)),count,grid,exclusions);
 root.replaceChildren(main);
 function paint(){
  const projects=catalog.projects.filter(project=>{
   const available=projectFixtures(project,collections).length>0;
   return (filter==='all'||(filter==='catalogued'?available:!available||Boolean(project.gaps?.length)))&&projectSearchText(project,collections).includes(query.toLowerCase());
  });
  count.textContent=`${projects.length} of ${catalog.projects.length} projects`;
  grid.replaceChildren(...projects.map(project=>{
   const fixtures=projectFixtures(project,collections),collection=collections.find(item=>item.id===project.collection);
   const status=fixtures.length?(collection?.source?.visibility==='local-only'?'Local-only catalogued views':'Catalogued views'):project.status==='local-only'?'Local-only · adapter needed':project.status==='scope-review'?'Scope or asset review needed':'Not yet catalogued';
   const card=el('article',{class:'pc-card','data-project':project.id},el('p',{class:'pc-category'},project.category),el('h2',{},project.title),el('p',{class:'pc-status'},status),el('p',{},project.notes));
   if(project.gaps?.length)card.append(el('p',{class:'pc-note'},el('strong',{},'Not represented: '),project.gaps.join(' ')));
   if(fixtures.length){
    const groups=['components','patterns','screens'].map(section=>[section,fixtures.filter(f=>f.section===section)]).filter(([,items])=>items.length);
    card.append(el('p',{class:'pc-count'},groups.map(([section,items])=>`${items.length} ${section}`).join(' · ')));
    const links=el('div',{class:'pc-links'});
    for(const [section,items] of groups){const url=new URL('./',location.href);url.search='';url.searchParams.set('collection',collection.id);url.searchParams.set('section',section);url.searchParams.set('fixture',items[0].id);links.append(el('a',{href:url.href},'Open '+section));}
    card.append(links,el('details',{},el('summary',{},'Registered views'),el('ul',{},...fixtures.map(f=>{const url=new URL('./',location.href);url.search='';url.searchParams.set('collection',collection.id);url.searchParams.set('section',f.section);url.searchParams.set('fixture',f.id);return el('li',{},el('a',{href:url.href},f.title));}))));
   }else if(project.status==='catalogued')card.append(el('p',{class:'pc-note'},'The adapter is being added; no registered view is available in this snapshot yet.'));
   return card;
  }));
  if(!projects.length)grid.append(el('p',{},'No projects match. Clear the search or change the filter.'));
 }
 paint();return {destroy(){root.replaceChildren();}};
}
