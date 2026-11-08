import { VERSION, mountWorkbench, loadCollections } from '../../packages/workbench/index.mjs';
import { publicSourceMetadata } from './public-sources.mjs';
document.querySelector('[data-design-system-version]').textContent = VERSION;
const root = document.querySelector('#workbench');
const navigation = document.querySelector('#library-navigation');
const materialNavigation = document.querySelector('#material-navigation');
const notice = document.querySelector('#library-status');
const cache = new Map(), selections = new Map();
let workbench, generation = 0;
const libraryFromURL = () => ['references','capture','material'].includes(new URL(location.href).searchParams.get('library')) ? new URL(location.href).searchParams.get('library') : 'own';
function remember(library, id) {
 selections.set(library, id);
 const url = new URL(location.href);
 if (library !== 'own') url.searchParams.set('library', library); else url.searchParams.delete('library');
 if (id) url.searchParams.set('collection', id); else url.searchParams.delete('collection');
 history.replaceState(null, '', url);
}
async function show(library, requested) {
 const version = ++generation;
 materialNavigation.value = library === 'material' ? 'lacouture-1890' : '';
 for (const button of navigation.querySelectorAll('button[data-library]')) button.setAttribute('aria-pressed', String(button.dataset.library === library));
 const label=library==='material'?'Material':library==='capture'?'Capture studio':library==='references'?'Reference studies':'Robin';
 notice.removeAttribute('role');
 notice.textContent = `${label} · Loading…`;
 workbench?.destroy(); workbench=undefined; root.replaceChildren(); root.setAttribute('aria-busy', 'true');
 try {
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
  if (!cache.has(library)) cache.set(library, loadCollections(library === 'references' ? '../../registry/references.json' : '../../registry/index.json', { base: import.meta.url }).then(collections => collections.map(publicSourceMetadata).filter(item => library === 'references' ? item.kind === 'reference' : item.kind !== 'reference')).catch(error => { cache.delete(library); throw error; }));
  const collections = await cache.get(library);
  if (version !== generation) return;
  const initialCollection = requested ?? selections.get(library);
  workbench = mountWorkbench(root, { skin: 'workbench', title: library === 'references' ? 'Reference examples' : 'Robin', collections, initialCollection: collections.some(item => item.id === initialCollection) ? initialCollection : collections[0]?.id, initialSection: new URL(location.href).searchParams.get('section') ?? (library==='references'?'components':'foundations'), searchCollections: library === 'references', onCollectionChange: id => remember(library, id) });
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
 url.searchParams.delete('panel');
 url.searchParams.delete('view');
 history.pushState(null, '', url);
 show(library);
}
for (const button of navigation.querySelectorAll('button[data-library]')) button.addEventListener('click', () => navigate(button.dataset.library));
materialNavigation.addEventListener('change', () => { if(materialNavigation.value) navigate('material'); });
addEventListener('popstate', () => show(libraryFromURL(), new URL(location.href).searchParams.get('collection')));
show(libraryFromURL(), new URL(location.href).searchParams.get('collection'));
