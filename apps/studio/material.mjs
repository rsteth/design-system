const manifestURL = new URL('../../collections/material/lacouture-1890/manifest.json', import.meta.url);
let materialPromise;
export function loadMaterial() {
  return materialPromise ??= fetch(manifestURL).then(response => { if (!response.ok) throw Error('Material images are unavailable'); return response.json(); }).catch(error => { materialPromise = undefined; throw error; });
}
const element = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  node.append(...children);
  return node;
};
const link = (label, href) => element('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label);
export function mountMaterial(root, material) {
  let current = material.items.findIndex(item => item.id === new URL(location.href).searchParams.get('panel'));
  if (current < 0) current = 0;
  let view = new URL(location.href).searchParams.get('view') === 'translation' ? 'translation' : 'panels';
  const main = element('main', { class: 'material-shell' });
  const intro = element('header', { class: 'material-intro' }, element('p', { class: 'material-eyebrow' }, 'COLOR STUDIES / 1890'), element('h1', {}, material.title), element('p', { class: 'material-author' }, material.author), element('p', {}, '29 chromatic plates and 10 supplementary pages, alongside our web translation.'));
  const tabs = element('div', { class: 'material-tabs', role: 'group', 'aria-label': 'Material view' });
  const content = element('section', { class: 'material-content', 'aria-label': 'Selected material' });
  const credit = element('aside', { class: 'material-credit' }, element('p', {}, material.credit), link('Getty scan collection ↗', material.sourceURL), document.createTextNode(' · '), link('Public-domain record ↗', material.rightsURL), element('p', {}, material.note));
  const buttons = new Map();
  for (const [id, label] of [['panels', 'Original panels'], ['translation', 'Web translation']]) {
    const button = element('button', { type: 'button' }, label);
    button.addEventListener('click', () => { view = id; updateURL(true); render(); });
    tabs.append(button); buttons.set(id, button);
  }
  function updateURL(push = false) {
    const url = new URL(location.href); url.searchParams.set('library', 'material');
    url.searchParams.set('panel', material.items[current].id);
    if(view === 'translation') url.searchParams.set('view', view); else url.searchParams.delete('view');
    history[push ? 'pushState' : 'replaceState'](null, '', url);
  }
  function render() {
    for (const [id, button] of buttons) button.setAttribute('aria-pressed', String(view === id));
    content.replaceChildren();
    if (view === 'translation') {
      content.append(element('article', { class: 'material-translation' }, element('p', { class: 'material-eyebrow' }, 'DIGITAL INTERPRETATION'), element('h2', {}, 'An atlas for the web'), element('p', {}, 'Explore the existing interactive atlas: original scans paired with editable reconstructions of all 29 plates.'), link('Open web translation ↗', material.translationURL), element('p', { class: 'material-access' }, 'Private to Robin. Opens separately and may require sign-in. Its sharing settings are unchanged.'), element('p', {}, 'The reconstruction is an authored interpretation, not a color-calibrated facsimile or a Getty publication.')));
      return;
    }
    const item = material.items[current];
    const picker = element('select', { id: 'material-panel-picker' });
    for (const [group, name] of [['plate','Plates · 29'], ['supplement','Supplementary pages · 10']]) {
      const options = element('optgroup', { label: name });
      for (const [index, entry] of material.items.entries()) if (entry.group === group) options.append(element('option', { value: index }, `${entry.group === 'plate' ? entry.number + ' · ' : ''}${entry.title}`));
      picker.append(options);
    }
    picker.value = String(current);
    const previous = element('button', { type: 'button', 'aria-label': 'Previous panel' }, '←');
    const next = element('button', { type: 'button', 'aria-label': 'Next panel' }, '→');
    previous.disabled = current === 0; next.disabled = current === material.items.length - 1;
    function select(index, focus) { current = index; updateURL(); render(); if(focus) content.querySelector(focus)?.focus(); }
    picker.addEventListener('change', () => select(Number(picker.value), '#material-panel-picker'));
    previous.addEventListener('click', () => select(current - 1, current === 1 ? '[aria-label="Next panel"]' : '[aria-label="Previous panel"]'));
    next.addEventListener('click', () => select(current + 1, current === material.items.length - 2 ? '[aria-label="Previous panel"]' : '[aria-label="Next panel"]'));
    const toolbar = element('div', { class: 'material-toolbar' }, element('label', { for: 'material-panel-picker' }, 'Panel'), picker, previous, next, element('span', { class: 'material-count', 'aria-live': 'polite' }, `${current + 1} / ${material.items.length}`));
    const src = new URL(item.file, manifestURL).href;
    const image = element('img', { src, alt: `${item.group === 'plate' ? 'Plate ' + item.number + ': ' : ''}${item.title}. Original scanned page from Charles Lacouture’s Répertoire chromatique, 1890.`, width: item.width, height: item.height, decoding: 'async' });
    const imageStatus = element('p', { class: 'material-image-status', 'aria-live': 'polite' }, 'Loading scan…');
    image.addEventListener('load', () => imageStatus.remove());
    image.addEventListener('error', () => { imageStatus.textContent = 'This scan could not load. Use the source scan link below.'; imageStatus.setAttribute('role','alert'); });
    content.append(toolbar, element('figure', { class: 'material-figure' }, imageStatus, image, element('figcaption', {}, element('span', {}, `${item.group === 'plate' ? item.number + ' · ' : ''}${item.title}`), link('Full-resolution JPEG ↗', src), link('Source scan ↗', item.sourceURL))));
  }
  main.append(intro, tabs, content, credit); root.replaceChildren(main); render();
  return { destroy() { main.remove(); } };
}
