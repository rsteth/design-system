const manifestURL = new URL('../../collections/material/lacouture-1890/manifest.json', import.meta.url);
let materialPromise;
const svgCache = new Map();
export function loadMaterial() {
  return materialPromise ??= fetch(manifestURL).then(response => { if (!response.ok) throw Error('Material images are unavailable'); return response.json(); }).catch(error => { materialPromise = undefined; throw error; });
}
const element = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  node.append(...children); return node;
};
const link = (label, href) => element('a', { href, target: '_blank', rel: 'noopener noreferrer' }, label);
const assetURL = path => new URL(path, manifestURL).href;
export const materialView = value => ['translation', 'compare'].includes(value) ? value : 'original';
export function materialSelection(material, href) {
  const params = new URL(href).searchParams;
  const index = material.items.findIndex(item => item.id === params.get('panel'));
  return { index: Math.max(0, index), view: materialView(params.get('view')) };
}
// The distributed assets are hash-checked in tests. Keep imported SVG inert and
// scoped as defense in depth: no document styles, active content, URLs or images.
export function parseMaterialSVG(text, id) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (doc.querySelector('parsererror') || svg.localName !== 'svg') throw Error('The translation file could not be read.');
  const tags = new Set(['svg','g','path','polygon','rect','circle','text','tspan','title','desc']);
  const attrs = new Set(['x','y','cx','cy','r','d','points','width','height','viewBox','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','transform','text-anchor','font-size','font-weight','font-family','letter-spacing','baseline-shift','class','data-color','data-label','id','aria-labelledby']);
  for (const node of [svg, ...svg.querySelectorAll('*')]) {
    if (!tags.has(node.localName)) { node.remove(); continue; }
    for (const attr of [...node.attributes]) {
      if (attr.name === 'style' && attr.value === 'font-family:Arial,Helvetica,sans-serif') node.setAttribute('font-family', 'Arial,Helvetica,sans-serif');
      if (!attrs.has(attr.name) || /url\s*\(|javascript:|https?:|data:/i.test(attr.value)) node.removeAttribute(attr.name);
    }
  }
  const ids = new Map();
  for (const node of svg.querySelectorAll('[id]')) { const old = node.id; node.id = `material-${id}-${old}`; ids.set(old, node.id); }
  for (const node of [svg, ...svg.querySelectorAll('[aria-labelledby]')]) {
    if (node.hasAttribute('aria-labelledby')) node.setAttribute('aria-labelledby', node.getAttribute('aria-labelledby').split(/\s+/).map(key => ids.get(key) || '').filter(Boolean).join(' '));
  }
  svg.removeAttribute('width'); svg.removeAttribute('height');
  svg.setAttribute('role', 'group'); svg.setAttribute('aria-label', 'Web translation. Select a color swatch to inspect its approximate HEX value.');
  return svg;
}
async function fetchSVG(item) {
  if (!svgCache.has(item.svg)) svgCache.set(item.svg, fetch(assetURL(item.svg)).then(async response => { if (!response.ok) throw Error('The web translation could not load.'); return response.text(); }).catch(error => { svgCache.delete(item.svg); throw error; }));
  try { return parseMaterialSVG(await svgCache.get(item.svg), item.id); }
  catch (error) { svgCache.delete(item.svg); throw error; }
}
// Keep both cuts in page-relative percentages so pan, resize and zoom never
// change the chosen reveal. Pointer coordinates are measured afresh per event.
export const materialRevealPercent = (coordinate, start, length) => length > 0 ? Math.max(0, Math.min(100, Math.round((coordinate - start) / length * 100))) : 50;
export function mountMaterialCompare(sheet, values, onChange = () => {}) {
  const handles = new Map();
  let active;
  const refresh = () => {
    sheet.style.setProperty('--compare-x', `${values.x}%`);
    sheet.style.setProperty('--compare-y', `${values.y}%`);
    // Keep each grip clear of the other divider's hit strip. Its own movement
    // never moves its grip along the track during a drag.
    sheet.style.setProperty('--compare-x-grip', values.y >= 50 ? '25%' : '75%');
    sheet.style.setProperty('--compare-y-grip', values.x <= 50 ? '75%' : '25%');
    sheet.dataset.allSource = String(values.x === 0 && values.y === 0);
    for (const [axis, handle] of handles) {
      handle.setAttribute('aria-valuenow', String(values[axis]));
      handle.setAttribute('aria-valuetext', `${values[axis]}% from ${axis === 'x' ? 'left' : 'top'}. Source is below and to the right of both dividers.`);
    }
    onChange();
  };
  const set = (axis, value) => { values[axis] = Math.max(0, Math.min(100, value)); refresh(); };
  const stop = () => {
    const previous = active; active = undefined; delete sheet.dataset.activeAxis;
    if (previous?.pointerId !== undefined && previous.handle.hasPointerCapture(previous.pointerId)) previous.handle.releasePointerCapture(previous.pointerId);
  };
  for (const [axis, label, orientation] of [['x', 'Vertical divider, move left or right', 'horizontal'], ['y', 'Horizontal divider, move up or down', 'vertical']]) {
    const handle = element('div', { class: 'material-compare-handle', 'data-axis': axis, role: 'slider', tabindex: '0', 'aria-label': label, 'aria-orientation': orientation, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-describedby': 'material-compare-help' }, element('span', { class: 'material-compare-grip', 'aria-hidden': 'true' }, axis === 'x' ? '↔' : '↕'));
    handles.set(axis, handle); sheet.append(handle);
    const move = event => {
      const rect = sheet.getBoundingClientRect();
      set(axis, materialRevealPercent(axis === 'x' ? event.clientX : event.clientY, axis === 'x' ? rect.left : rect.top, axis === 'x' ? rect.width : rect.height));
    };
    handle.addEventListener('pointerdown', event => {
      if (active || !event.isPrimary || event.button !== 0) return;
      event.preventDefault(); handle.focus({ preventScroll: true });
      active = { axis, handle, pointerId: event.pointerId, start: values[axis] };
      sheet.dataset.activeAxis = axis; handle.setPointerCapture(event.pointerId); move(event);
    });
    handle.addEventListener('pointermove', event => { if (active?.handle === handle && active.pointerId === event.pointerId) move(event); });
    handle.addEventListener('pointerup', event => { if (active?.handle === handle && active.pointerId === event.pointerId) { move(event); stop(); } });
    for (const type of ['pointercancel', 'lostpointercapture']) handle.addEventListener(type, event => { if (active?.handle === handle && active.pointerId === event.pointerId) stop(); });
    handle.addEventListener('keydown', event => {
      if (event.key === 'Escape' && active?.handle === handle) { event.preventDefault(); set(axis, active.start); stop(); return; }
      const backward = axis === 'x' ? 'ArrowLeft' : 'ArrowUp', forward = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
      if (![backward, forward, 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key) || active?.pointerId !== undefined) return;
      event.preventDefault();
      active ??= { axis, handle, start: values[axis] }; sheet.dataset.activeAxis = axis;
      const step = event.shiftKey || ['PageUp','PageDown'].includes(event.key) ? 10 : 1;
      set(axis, event.key === 'Home' ? 0 : event.key === 'End' ? 100 : values[axis] + ([backward,'PageUp'].includes(event.key) ? -step : step));
    });
    handle.addEventListener('keyup', () => { if (active?.handle === handle && active.pointerId === undefined) stop(); });
    handle.addEventListener('blur', () => { if (active?.handle === handle) stop(); });
  }
  const visibility = () => { if (document.hidden) stop(); };
  window.addEventListener('blur', stop); document.addEventListener('visibilitychange', visibility);
  refresh();
  return {
    // Keyboard inspection must not leave the focused swatch hidden by the scan.
    reveal(node) {
      const target = node.getBoundingClientRect(), page = sheet.getBoundingClientRect();
      if (target.right > page.left + page.width * values.x / 100 && target.bottom > page.top + page.height * values.y / 100) set('x', Math.min(100, Math.ceil((target.right - page.left) / page.width * 100) + 1));
    },
    destroy() { stop(); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', visibility); }
  };
}
export function mountMaterial(root, material) {
  const initial = materialSelection(material, location.href);
  let current = initial.index, preferredView = initial.view, zoom = 1, sequence = 0, destroyed = false, observer, comparison;
  const reveal = { x: 50, y: 50 };
  const main = element('main', { class: 'material-shell' });
  const intro = element('header', { class: 'material-intro' }, element('p', { class: 'material-eyebrow' }, 'MATERIAL / COLOR STUDIES / 1890'), element('h1', {}, material.title), element('p', { class: 'material-author' }, material.author), element('p', {}, '29 chromatic plates, translated into SVG and flat color. Explore the original scans and their web interpretation in the same arrangement.'));
  const content = element('section', { class: 'material-content', 'aria-label': 'Selected material' });
  const credit = element('aside', { class: 'material-credit' }, element('p', {}, material.credit), link('Getty / Internet Archive source ↗', material.sourceURL), document.createTextNode(' · '), link('Source page images · JP2 archive ↗', 'https://archive.org/download/gri_33125012875395/gri_33125012875395_jp2.zip'), element('p', {}, 'Original work by Charles Lacouture, with chromolithographs by G. Severeyns. The SVG reconstruction and this interface are a web interpretation, not the original artwork or a Getty publication. Internet Archive records the source as NOT_IN_COPYRIGHT; no CC0 license is asserted here.'), element('p', {}, 'Flat colors are scan-derived digital approximations, not calibrated measurements of the original inks. Geometry is regularized, typography is substituted, and paper texture, wear and fine ink hatching remain visible only in the scans.'));
  function updateURL() {
    const url = new URL(location.href); url.searchParams.set('library', 'material'); url.searchParams.set('panel', material.items[current].id);
    if (preferredView === 'original') url.searchParams.delete('view'); else url.searchParams.set('view', preferredView);
    if (url.href !== location.href) history.pushState(null, '', url);
  }
  function render(focusSelector) {
    const version = ++sequence; observer?.disconnect(); comparison?.destroy(); comparison = undefined;
    const item = material.items[current], hasSVG = Boolean(item.svg), view = hasSVG ? preferredView : 'original';
    content.replaceChildren();
    const picker = element('select', { id: 'material-panel-picker' });
    const groups = new Map();
    for (const [index, entry] of material.items.entries()) {
      const group = entry.group === 'supplement' ? 'Supplementary pages · 10' : `${entry.sectionTitle || 'Plates'}${entry.section ? ' · Section ' + entry.section : ''}`;
      if (!groups.has(group)) { const optgroup = element('optgroup', { label: group }); groups.set(group, optgroup); picker.append(optgroup); }
      groups.get(group).append(element('option', { value: index }, `${entry.group === 'plate' ? entry.number + ' · ' : ''}${entry.title}`));
    }
    picker.value = String(current);
    const previous = element('button', { type: 'button', 'aria-label': 'Previous panel' }, '←');
    const next = element('button', { type: 'button', 'aria-label': 'Next panel' }, '→');
    previous.disabled = current === 0; next.disabled = current === material.items.length - 1;
    function select(index, focus) { current = index; updateURL(); render(focus); }
    picker.addEventListener('change', () => select(Number(picker.value), '#material-panel-picker'));
    previous.addEventListener('click', () => select(current - 1, current === 1 ? '[aria-label="Next panel"]' : '[aria-label="Previous panel"]'));
    next.addEventListener('click', () => select(current + 1, current === material.items.length - 2 ? '[aria-label="Previous panel"]' : '[aria-label="Next panel"]'));
    const toolbar = element('div', { class: 'material-toolbar' }, element('label', { for: 'material-panel-picker' }, 'Panel'), picker, previous, next, element('span', { class: 'material-count', 'aria-live': 'polite' }, `${current + 1} / ${material.items.length}`));
    const modes = element('div', { class: 'material-tabs', role: 'group', 'aria-label': 'Material view' });
    for (const [id, label] of [['original','Original'],['translation','Web translation'],['compare','Compare']]) {
      const button = element('button', { type: 'button', 'data-material-view': id, 'aria-pressed': view === id }, label);
      button.disabled = !hasSVG && id !== 'original';
      button.addEventListener('click', () => { preferredView = id; updateURL(); render(`[data-material-view="${id}"]`); }); modes.append(button);
    }
    const zoomPicker = element('select', { id: 'material-zoom' }, ...[[1,'Fit'],[1.5,'150%'],[2,'200%'],[3,'300%']].map(([value,label]) => element('option', { value }, label)));
    zoomPicker.value = String(zoom);
    const zoomControl = element('div', { class: 'material-zoom-control' }, element('label', { for: 'material-zoom' }, 'Zoom'), zoomPicker);
    const controls = element('div', { class: 'material-controls' }, modes, zoomControl);
    const stage = element('div', { class: 'material-stage', tabindex: '0', 'aria-label': 'Plate viewer. Scroll to pan when zoomed.' });
    const sheets = element('div', { class: 'material-sheets', 'data-compare': view === 'compare' }); stage.append(sheets);
    const inspectorText = element('span', { class: 'material-inspector-value', 'aria-live': 'polite' }, hasSVG && view !== 'original' ? 'Select a swatch to inspect its approximate HEX value.' : 'Switch to Web translation to inspect colors.');
    const chip = element('span', { class: 'material-chip', 'aria-hidden': 'true' });
    const copy = element('button', { type: 'button' }, 'Copy HEX'); copy.disabled = true;
    const copyStatus = element('span', { class: 'material-copy-status', role: 'status' });
    let selectedColor;
    copy.addEventListener('click', async () => {
      const color = selectedColor;
      try { await navigator.clipboard.writeText(color); if (version === sequence && !destroyed) copyStatus.textContent = `Copied ${color}`; }
      catch { if (version === sequence && !destroyed) copyStatus.textContent = `Copy unavailable. Select and copy ${color} above.`; }
    });
    const inspector = element('div', { class: 'material-inspector', 'aria-label': 'Color inspector' }, chip, inspectorText, copy, copyStatus);
    if (!hasSVG) inspector.hidden = true;
    else if (view === 'original') { chip.hidden = true; copy.hidden = true; }
    const downloads = element('div', { class: 'material-downloads' }, link('Source scan ↗', item.sourceURL), element('a', { href: assetURL(item.file), download: `${item.id}.jpg` }, 'Download original JPEG'));
    if (hasSVG) downloads.append(element('a', { href: assetURL(item.svg), download: `${item.id}.svg` }, 'Download SVG'));
    const caption = element('div', { class: 'material-caption' }, element('h2', { lang: 'fr' }, `${item.group === 'plate' ? 'Plate ' + item.number + ' · ' : ''}${item.title}`), downloads);
    content.append(toolbar, controls);
    if (!hasSVG) content.append(element('p', { class: 'material-mode-note', role: 'status' }, 'Supplementary page · original scan only. Web translation is available for the 29 numbered plates.'));
    if (view === 'compare') content.append(element('p', { class: 'material-mode-note', id: 'material-compare-help' }, 'Drag either divider. Source appears below and to the right; Web fills the rest. Use arrow keys to adjust a focused divider, or Home / End for its edges. Keyboard color inspection reveals the focused swatch by moving the vertical divider when needed.'));
    content.append(stage, inspector, caption);
    function fit() {
      const compare = view === 'compare';
      const availableWidth = stage.clientWidth - (compare ? 48 : 32);
      const fitWidth = Math.max(90, Math.min(availableWidth, (stage.clientHeight - (compare ? 72 : 60)) * item.width / item.height));
      sheets.style.setProperty('--sheet-width', `${Math.floor(fitWidth * zoom)}px`);
      for (const image of sheets.querySelectorAll('img')) image.sizes = `${Math.ceil(fitWidth * zoom)}px`;
    }
    zoomPicker.addEventListener('change', () => { zoom = Number(zoomPicker.value); fit(); if (zoom === 1) stage.scrollTo(0,0); });
    let compareSheet, compareSlot;
    if (view === 'compare') {
      compareSlot = element('figure', { class: 'material-sheet-slot', 'data-mode': 'compare' }, element('figcaption', {}, 'Web translation / Source scan'));
      compareSheet = element('div', { class: 'material-sheet material-compare', style: `aspect-ratio:${item.width}/${item.height}` });
      compareSlot.append(compareSheet); sheets.append(compareSlot);
    }
    const requestedViews = view === 'compare' ? ['translation','original'] : [view];
    for (const mode of requestedViews) {
      let sheet;
      if (compareSheet) {
        sheet = element('div', { class: 'material-compare-layer', 'data-mode': mode }); compareSheet.append(sheet);
        if (mode === 'original') sheet.append(element('span', { class: 'material-compare-label material-compare-source', 'aria-hidden': 'true' }, 'Source'));
      } else {
        const slot = element('figure', { class: 'material-sheet-slot', 'data-mode': mode }, element('figcaption', {}, mode === 'original' ? 'Original scan' : 'Web translation · approximate flat colors'));
        sheet = element('div', { class: 'material-sheet', style: `aspect-ratio:${item.width}/${item.height}` }); slot.append(sheet); sheets.append(slot);
      }
      const status = element('p', { class: 'material-image-status', role: 'status' }, mode === 'original' ? 'Loading scan…' : 'Loading web translation…'); (compareSlot || sheet).append(status);
      const fail = message => { status.textContent = message; status.setAttribute('role','alert'); const retry = element('button', { type: 'button' }, 'Retry'); retry.addEventListener('click', () => render()); status.append(document.createElement('br'), retry); };
      if (mode === 'original') {
        const previews = item.previews || [];
        const src = assetURL(previews.at(-1)?.file || item.file);
        const image = element('img', { src, alt: `${item.group === 'plate' ? 'Plate ' + item.number + ': ' : ''}${item.title}. Original full-page Getty scan of Charles Lacouture’s Répertoire chromatique, 1890.`, width: item.width, height: item.height, decoding: 'async' });
        if (previews.length) { image.srcset = [...previews.map(p => `${assetURL(p.file)} ${p.width}w`), `${assetURL(item.file)} ${item.width}w`].join(', '); image.sizes = '(max-width: 700px) 90vw, 60vw'; }
        image.addEventListener('load', () => status.remove());
        image.addEventListener('error', () => fail('This scan could not load. Retry or use the source scan link below.'));
        sheet.append(image);
      } else {
        fetchSVG(item).then(svg => {
          if (destroyed || version !== sequence) return;
          const swatches = [...svg.querySelectorAll('.swatch')].filter(node => /^#[0-9a-f]{6}$/i.test(node.dataset.color || node.getAttribute('fill') || ''));
          const selectSwatch = (node, focus = false) => {
            for (const swatch of swatches) { swatch.classList.toggle('is-selected', swatch === node); swatch.setAttribute('tabindex', swatch === node ? '0' : '-1'); swatch.setAttribute('aria-pressed', String(swatch === node)); }
            selectedColor = (node.dataset.color || node.getAttribute('fill')).toUpperCase();
            chip.style.background = selectedColor; inspectorText.textContent = `${node.dataset.label || 'Selected swatch'} · ${selectedColor} · approximate sRGB`; copy.disabled = false; copyStatus.textContent = ''; if (focus) node.focus();
          };
          swatches.forEach((node, index) => {
            node.setAttribute('tabindex', index === 0 ? '0' : '-1'); node.setAttribute('role','button'); node.setAttribute('aria-pressed','false'); node.setAttribute('aria-label', `${node.dataset.label || 'Swatch ' + (index + 1)}, ${node.dataset.color || node.getAttribute('fill')}, inspect approximate color`);
            node.addEventListener('click', () => selectSwatch(node));
            node.addEventListener('focus', () => { if (!destroyed && version === sequence) comparison?.reveal(node); });
            node.addEventListener('keydown', event => {
              if (['Enter',' '].includes(event.key)) { event.preventDefault(); selectSwatch(node); }
              else if (['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? swatches.length - 1 : (index + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1) + swatches.length) % swatches.length; selectSwatch(swatches[next], true); }
            });
          });
          status.remove(); sheet.append(svg);
        }).catch(error => { if (!destroyed && version === sequence) fail(`${error.message} Retry or use Original.`); });
      }
    }
    if (compareSheet) {
      compareSheet.append(element('span', { class: 'material-compare-label material-compare-web', 'aria-hidden': 'true' }, 'Web'));
      comparison = mountMaterialCompare(compareSheet, reveal);
    }
    observer = new ResizeObserver(fit); observer.observe(stage); fit();
    if (focusSelector) content.querySelector(focusSelector)?.focus();
  }
  main.append(intro, content, credit); root.replaceChildren(main); render();
  return { destroy() { destroyed = true; sequence++; observer?.disconnect(); comparison?.destroy(); main.remove(); } };
}
