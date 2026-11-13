import { VERSION, mountWorkbench, loadCollections } from '../../packages/workbench/index.mjs';
import { publicSourceMetadata } from './public-sources.mjs';
import { mountChrome } from './chrome.mjs';
document.querySelector('[data-design-system-version]').textContent = VERSION;
const root = document.querySelector('#workbench');
const navigation = document.querySelector('#library-navigation');
const materialNavigation = document.querySelector('#material-navigation');
const notice = document.querySelector('#library-status');
const cache = new Map(), loaded = new Map(), selections = new Map();
const registryMetadata=fetch(new URL('../../registry/index.json',import.meta.url)).then(response=>{if(!response.ok)throw Error('Registry unavailable');return response.json();});
registryMetadata.then(data=>{document.querySelector('[data-library=coverage]').hidden=!data.projectCoverage;}).catch(()=>{});
let workbench, generation = 0, shownLibrary;
// One shared read per library, for the workbench and the jump palette alike.
function collectionsFor(library) {
 if (!cache.has(library)) cache.set(library, loadCollections(library === 'references' ? '../../registry/references.json' : '../../registry/index.json', { base: import.meta.url }).then(collections => { const kept = collections.map(publicSourceMetadata).filter(item => library === 'references' ? item.kind === 'reference' : item.kind !== 'reference'); loaded.set(library, kept); return kept; }).catch(error => { cache.delete(library); throw error; }));
 return cache.get(library);
}
const libraryFromURL = () => ['references','capture','material','coverage'].includes(new URL(location.href).searchParams.get('library')) ? new URL(location.href).searchParams.get('library') : 'own';
function updateGuide(library,id){
 const link=document.querySelector('#implementation-guide');
 link.hidden=!id||!['own','references'].includes(library);
 link.href=id?`../../registry/guides/${encodeURIComponent(id)}/design-system.md`:'../../llms.txt';
 link.textContent=library==='references'?'Study adaptation guide':'Implementation guide';
}
function remember(library, id) {
 updateGuide(library,id);
 selections.set(library, id);
 const url = new URL(location.href);
 if (library !== 'own') url.searchParams.set('library', library); else url.searchParams.delete('library');
 if (id) url.searchParams.set('collection', id); else url.searchParams.delete('collection');
 history.replaceState(null, '', url);
}
async function show(library, requested) {
 const version = ++generation;
 updateGuide(library,null);
 materialNavigation.value = library === 'material' ? 'lacouture-1890' : '';
 for (const button of navigation.querySelectorAll('button[data-library]')) button.setAttribute('aria-pressed', String(button.dataset.library === library));
 const label=library==='coverage'?'Project coverage':library==='material'?'Material':library==='capture'?'Capture studio':library==='references'?'Reference studies':'Robin';
 notice.removeAttribute('role');
 notice.textContent = `${label} · Loading…`;
 workbench?.destroy(); workbench=undefined; shownLibrary=undefined; root.replaceChildren(); root.setAttribute('aria-busy', 'true');
 try {
  if(library==='coverage') {
   const registry=await registryMetadata;
   if(!registry.projectCoverage)throw Error('No local project coverage catalog is supplied in this distribution.');
   if(registry.projectCoverage!=='projects.local.json')throw Error('Unexpected project coverage source.');
   const response=await fetch(new URL('../../registry/projects.local.json',import.meta.url));
   if(!response.ok)throw Error('Project coverage could not be loaded.');
   const [catalog,collections,{mountProjectCoverage}]=await Promise.all([response.json(),loadCollections('../../registry/index.json',{base:import.meta.url}),import('./project-coverage.mjs')]);
   if(version!==generation)return;
   workbench=mountProjectCoverage(root,{catalog,collections});notice.textContent='';return;
  }
  if(library==='material') {
   const { loadMaterial, mountMaterial } = await import('./material.mjs');
   const material = await loadMaterial();
   if(version!==generation)return;
   workbench=mountMaterial(root, material);
   notice.textContent='';
   return;
  }
  if(library==='capture') {
   const {mountCaptureStudio}=await import('./capture-studio.mjs');
   if(version!==generation)return;
   workbench=mountCaptureStudio(root);
   notice.textContent='';
   return;
  }
  const collections = await collectionsFor(library);
  if (version !== generation) return;
  const initialCollection = requested ?? selections.get(library);
  workbench = mountWorkbench(root, { skin: 'workbench', title: library === 'references' ? 'Reference examples' : 'Robin', collections, initialCollection: collections.some(item => item.id === initialCollection) ? initialCollection : collections[0]?.id, initialSection: new URL(location.href).searchParams.get('section') ?? (library==='references'?'components':'foundations'), initialFixture: new URL(location.href).searchParams.get('fixture') ?? undefined, searchCollections: true, searchLabel: library === 'references' ? 'Search reference studies' : 'Search your work', collectionNoun: library === 'references' ? 'studies' : 'collections', onCollectionChange: id => remember(library, id) });
  shownLibrary = library;
  updateGuide(library,collections.some(item=>item.id===initialCollection)?initialCollection:collections[0]?.id);
  notice.textContent = library === 'references' ? 'Independent design studies. Not affiliated with, endorsed by, or sponsored by the referenced companies.' : '';
 } catch (error) {
  if (version !== generation) return;
  if(library==='material') materialNavigation.value='';
  notice.setAttribute('role', 'alert');
  notice.textContent = `${label} could not load: ${error.message}. Select the workspace again to retry.`;
 } finally { if (version === generation) root.removeAttribute('aria-busy'); }
}
function navigate(library) {
 if(library===libraryFromURL()){show(library,new URL(location.href).searchParams.get('collection'));return;}
 const url = new URL(location.href);
 if (library !== 'own') url.searchParams.set('library', library); else url.searchParams.delete('library');
 if (selections.get(library)) url.searchParams.set('collection', selections.get(library)); else url.searchParams.delete('collection');
 url.searchParams.delete('section');
 url.searchParams.delete('fixture');
 url.searchParams.delete('panel');
 url.searchParams.delete('view');
 history.pushState(null, '', url);
 show(library);
}
// Jump straight to one collection. Within the workspace on screen the section is kept.
function openCollection(library, id) {
 if (library === shownLibrary && typeof workbench?.showCollection === 'function') { workbench.showCollection(id); return; }
 const url = new URL(location.href);
 if (library !== 'own') url.searchParams.set('library', library); else url.searchParams.delete('library');
 url.searchParams.set('collection', id);
 for (const key of ['section', 'fixture', 'panel', 'view']) url.searchParams.delete(key);
 history.pushState(null, '', url);
 show(library, id);
}
mountChrome({ navigation, collectionsFor, loaded, open: openCollection });
for (const button of navigation.querySelectorAll('button[data-library]')) button.addEventListener('click', () => navigate(button.dataset.library));
materialNavigation.addEventListener('change', () => { if(materialNavigation.value) navigate('material'); });
addEventListener('popstate', () => show(libraryFromURL(), new URL(location.href).searchParams.get('collection')));
show(libraryFromURL(), new URL(location.href).searchParams.get('collection'));
