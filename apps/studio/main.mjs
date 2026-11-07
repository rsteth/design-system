import { VERSION, mountWorkbench, loadCollections } from '../../packages/workbench/index.mjs';
document.querySelector('[data-design-system-version]').textContent = VERSION;
const root = document.querySelector('#workbench');
const navigation = document.querySelector('#library-navigation');
const notice = document.querySelector('#library-status');
const cache = new Map(), selections = new Map();
let workbench, generation = 0;
const libraryFromURL = () => ['references','capture'].includes(new URL(location.href).searchParams.get('library')) ? new URL(location.href).searchParams.get('library') : 'own';
function remember(library, id) {
 selections.set(library, id);
 const url = new URL(location.href);
 if (library !== 'own') url.searchParams.set('library', library); else url.searchParams.delete('library');
 if (id) url.searchParams.set('collection', id); else url.searchParams.delete('collection');
 history.replaceState(null, '', url);
}
async function show(library, requested) {
 const version = ++generation;
 for (const button of navigation.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.library === library));
 const label=library==='capture'?'Capture studio':library==='references'?'Reference studies':'Robin';
 notice.removeAttribute('role');
 notice.textContent = `${label} · Loading…`;
 workbench?.destroy(); workbench=undefined; root.replaceChildren(); root.setAttribute('aria-busy', 'true');
 try {
  if(library==='capture') {
   const {mountCaptureStudio}=await import('./capture-studio.mjs');
   if(version!==generation)return;
   workbench=mountCaptureStudio(root);
   notice.textContent='Capture studio · Scenes and deterministic local export. Separate from collection workbenches.';
   return;
  }
  if (!cache.has(library)) cache.set(library, loadCollections(library === 'references' ? '../../registry/references.json' : '../../registry/index.json', { base: import.meta.url }).then(collections => collections.filter(item => library === 'references' ? item.kind === 'reference' : item.kind !== 'reference')).catch(error => { cache.delete(library); throw error; }));
  const collections = await cache.get(library);
  if (version !== generation) return;
  const initialCollection = requested ?? selections.get(library);
  workbench = mountWorkbench(root, { skin: 'workbench', title: library === 'references' ? 'Reference examples' : 'Robin', collections, initialCollection: collections.some(item => item.id === initialCollection) ? initialCollection : collections[0]?.id, initialSection: new URL(location.href).searchParams.get('section') ?? (library==='references'?'components':'foundations'), searchCollections: library === 'references', onCollectionChange: id => remember(library, id) });
  notice.textContent = '';
 } catch (error) {
  if (version !== generation) return;
  notice.setAttribute('role', 'alert');
  notice.textContent = `${label} could not load: ${error.message}. Select the workspace again to retry.`;
 } finally { if (version === generation) root.removeAttribute('aria-busy'); }
}
for (const button of navigation.querySelectorAll('button')) button.addEventListener('click', () => {
 const library = button.dataset.library;
 if(library===libraryFromURL()){show(library,new URL(location.href).searchParams.get('collection'));return;}
 const url = new URL(location.href);
 if (library !== 'own') url.searchParams.set('library', library); else url.searchParams.delete('library');
 if (selections.get(library)) url.searchParams.set('collection', selections.get(library)); else url.searchParams.delete('collection');
 url.searchParams.delete('section');
 history.pushState(null, '', url);
 show(library);
});
addEventListener('popstate', () => show(libraryFromURL(), new URL(location.href).searchParams.get('collection')));
show(libraryFromURL(), new URL(location.href).searchParams.get('collection'));
