import { loadCollections, mountWorkbench } from './vendor/workbench/index.mjs';
const root = document.querySelector('#workbench');
const app = mountWorkbench(root, { title: 'Your workbench' });
try { app.setCollections(await loadCollections('./collections.json', { base: import.meta.url })); }
catch (error) {
  const notice = document.createElement('p');
  notice.setAttribute('role', 'alert'); notice.textContent = `Collection loading failed: ${error.message}`;
  root.before(notice);
}
