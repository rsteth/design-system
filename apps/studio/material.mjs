import {materialChartRegistration, mountMaterialChart} from './material-registration.mjs';
import {materialFraming} from './material-framing.mjs';
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
// No selection means the overview. Explicit legacy views still open plate I.
export function materialIsIndex(href) {
  const params = new URL(href).searchParams;
  return params.get('view') === 'index' || (!params.has('panel') && !params.has('view'));
}
export function materialPageURL(href, item) {
  const url = new URL(href);
  url.searchParams.set('library', 'material');
  for (const key of ['collection', 'section', 'panel', 'view']) url.searchParams.delete(key);
  if (item) { url.searchParams.set('panel', item.id); if (item.svg) url.searchParams.set('view', 'translation'); }
  return url.href;
}
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
  let active;
  const stage = sheet.closest('.material-stage');
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({class:'material-compare-icon', viewBox:'0 0 24 24', width:'20', height:'20', fill:'none', stroke:'currentColor', 'stroke-width':'1.5', 'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true', focusable:'false'})) icon.setAttribute(key, value);
  const arrows = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrows.setAttribute('d', 'M5 5H19M15 1L19 5L15 9M5 5V19M1 15L5 19L9 15M9 5V9H5');
  // Symmetric painted bounds (1..19) are centered in the 24-unit viewport.
  arrows.setAttribute('transform', 'translate(2 2)'); icon.append(arrows);
  const handle = element('div', { class: 'material-compare-handle', role: 'button', tabindex: '0', 'aria-roledescription': 'two-axis comparison control', 'aria-describedby': 'material-compare-help material-keyboard-help', 'aria-keyshortcuts': 'ArrowLeft ArrowRight ArrowUp ArrowDown Home End PageUp PageDown Enter Space Escape' }, element('span', { class: 'material-compare-grip', 'aria-hidden': 'true' }, icon));
  const lines = Object.fromEntries(['x', 'y'].map(axis => [axis, element('span', {class: 'material-compare-line', 'data-axis': axis, 'aria-hidden': 'true'})]));
  sheet.append(lines.x, lines.y);
  sheet.append(handle);
  // Suppress selection/native drags only inside the comparison field. Leave
  // pointer defaults elsewhere intact for focus, swatches, scrolling and copy.
  const preventSelection = event => event.preventDefault();
  sheet.addEventListener('selectstart', preventSelection);
  sheet.addEventListener('dragstart', preventSelection);
  const positionGrips = () => {
    const page = sheet.getBoundingClientRect(), viewport = stage?.getBoundingClientRect();
    if (!viewport || !page.width || !page.height) return;
    const left = Math.max(0, viewport.left + stage.clientLeft - page.left), top = Math.max(0, viewport.top + stage.clientTop - page.top);
    const right = Math.min(page.width, viewport.left + stage.clientLeft + stage.clientWidth - page.left), bottom = Math.min(page.height, viewport.top + stage.clientTop + stage.clientHeight - page.top);
    // A single reachable proxy stays at the nearest visible point when the true
    // intersection is offscreen. Pointer-down never changes the true cuts.
    const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
    sheet.style.setProperty('--compare-grip-x', `${clamp(page.width * values.x / 100, left + 22, right - 22)}px`);
    sheet.style.setProperty('--compare-grip-y', `${clamp(page.height * values.y / 100, top + 22, bottom - 22)}px`);
  };
  const refresh = () => {
    sheet.style.setProperty('--compare-x', `${values.x}%`);
    sheet.style.setProperty('--compare-y', `${values.y}%`);
    // Only mark boundaries shared by Web and the bottom-right Original region.
    // Empty regions and outer page edges have no comparison boundary. Keep
    // these true cuts independent from the reachable, possibly inset proxy.
    const hasOriginal = values.x < 100 && values.y < 100;
    lines.x.hidden = !hasOriginal || values.x === 0;
    lines.y.hidden = !hasOriginal || values.y === 0;
    positionGrips();
    handle.setAttribute('aria-label', `Move comparison dividers. ${Math.round(values.x)}% from left, ${Math.round(values.y)}% from top.`);
    onChange();
  };
  const set = (axis, value) => { values[axis] = Math.max(0, Math.min(100, value)); refresh(); };
  const stop = () => {
    const previous = active; active = undefined; delete sheet.dataset.activeAxis;
    if (previous?.pointerId !== undefined && handle.hasPointerCapture(previous.pointerId)) handle.releasePointerCapture(previous.pointerId);
  };
  const move = event => {
    const rect = sheet.getBoundingClientRect(), dx = event.clientX - active.origin.x, dy = event.clientY - active.origin.y;
    if (!active.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 4) return;
      active.axis = Math.abs(dy) <= Math.abs(dx) * .1 ? 'x' : Math.abs(dx) <= Math.abs(dy) * .1 ? 'y' : 'both';
    }
    if (active.axis !== 'both') {
      const perpendicular = active.axis === 'x' ? dy : dx, along = active.axis === 'x' ? dx : dy;
      // Wider release cone and an 8px minimum prevent jitter. Subtract the
      // dead zone rather than applying it at once, so unlock is continuous.
      const threshold = Math.max(8, Math.abs(along) * .15);
      if (Math.abs(perpendicular) > threshold) {
        active.offset[active.axis === 'x' ? 'y' : 'x'] = Math.sign(perpendicular) * threshold;
        active.axis = 'both';
      }
    }
    sheet.dataset.activeAxis = active.axis;
    for (const [axis, delta, size] of [['x',dx,rect.width],['y',dy,rect.height]]) {
      if (active.axis !== 'both' && active.axis !== axis) continue;
      const movement = delta - active.offset[axis], [low, high] = active.visible[axis];
      // Cropped margins must not be a dead zone: on inward movement an
      // invisible cut starts at the visible edge, never at the inset grip.
      const origin = active.start[axis] < low && movement > 0 ? low : active.start[axis] > high && movement < 0 ? high : active.start[axis];
      values[axis] = Math.max(0, Math.min(100, origin + movement / size * 100));
    }
    refresh();
  };
  handle.addEventListener('pointerdown', event => {
    if (active || !event.isPrimary || event.button !== 0) return;
    event.preventDefault(); handle.focus({preventScroll:true});
    const page = sheet.getBoundingClientRect(), viewport = stage?.getBoundingClientRect();
    const visible = viewport ? {
      x:[Math.max(0,(viewport.left + stage.clientLeft - page.left) / page.width * 100),Math.min(100,(viewport.left + stage.clientLeft + stage.clientWidth - page.left) / page.width * 100)],
      y:[Math.max(0,(viewport.top + stage.clientTop - page.top) / page.height * 100),Math.min(100,(viewport.top + stage.clientTop + stage.clientHeight - page.top) / page.height * 100)]
    } : {x:[0,100],y:[0,100]};
    active = {pointerId:event.pointerId, start:{...values}, visible, origin:{x:event.clientX,y:event.clientY}, offset:{x:0,y:0}};
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', event => { if (active?.pointerId === event.pointerId) move(event); });
  handle.addEventListener('pointerup', event => { if (active?.pointerId === event.pointerId) { move(event); stop(); } });
  for (const type of ['pointercancel','lostpointercapture']) handle.addEventListener(type, event => { if (active?.pointerId === event.pointerId) stop(); });
  handle.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) { event.preventDefault(); Object.assign(values, active.start); stop(); refresh(); return; }
    if (active?.pointerId !== undefined) return;
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown','Enter',' '].includes(event.key)) return;
    event.preventDefault();
    active ??= {start:{...values}};
    const step = event.shiftKey || ['PageUp','PageDown'].includes(event.key) ? 10 : 1;
    if (['Home','End','Enter',' '].includes(event.key)) { values.x = values.y = event.key === 'Home' ? 0 : event.key === 'End' ? 100 : 50; refresh(); }
    else { const axis = ['ArrowLeft','ArrowRight'].includes(event.key) ? 'x' : 'y'; set(axis, values[axis] + (['ArrowLeft','ArrowUp','PageUp'].includes(event.key) ? -step : step)); }
  });
  handle.addEventListener('keyup', () => { if (active?.pointerId === undefined) stop(); });
  handle.addEventListener('blur', stop);
  const visibility = () => { if (document.hidden) stop(); };
  window.addEventListener('blur', stop); document.addEventListener('visibilitychange', visibility);
  stage?.addEventListener('scroll', positionGrips, {passive:true});
  refresh();
  return {
    layout: positionGrips,
    initialize() {
      // Seed once, after framing: 5% into the visible page, not cropped margins.
      const page = sheet.getBoundingClientRect(), viewport = stage.getBoundingClientRect();
      for (const [axis, start, size, edge, length] of [
        ['x', page.left, page.width, viewport.left + stage.clientLeft, stage.clientWidth],
        ['y', page.top, page.height, viewport.top + stage.clientTop, stage.clientHeight]
      ]) {
        const low = Math.max(0, edge - start), high = Math.min(size, edge + length - start);
        values[axis] = (low + Math.min((high - low) / 2, Math.max(22, (high - low) * .05))) / size * 100;
      }
      refresh();
    },
    // Keyboard inspection must not leave the focused swatch hidden by the scan.
    reveal(node) {
      const target = node.getBoundingClientRect(), page = sheet.getBoundingClientRect();
      if (target.right > page.left + page.width * values.x / 100 && target.bottom > page.top + page.height * values.y / 100) set('x', Math.min(100, Math.ceil((target.right - page.left) / page.width * 100) + 1));
    },
    destroy() { stop(); sheet.removeEventListener('selectstart', preventSelection); sheet.removeEventListener('dragstart', preventSelection); stage?.removeEventListener('scroll', positionGrips); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', visibility); }
  };
}
export function mountMaterial(root, material) {
  const initial = materialSelection(material, location.href);
  let showingIndex = materialIsIndex(location.href);
  let current = initial.index, preferredView = initial.view, zoom = 'artwork', alignCharts = true, sequence = 0, destroyed = false, observer, comparison;
  const reveal = { x: 0, y: 0 };
  let revealInitialized = false;
  const main = element('main', { class: 'material-shell' });
  const intro = element('header', { class: 'material-intro' }, element('p', { class: 'material-eyebrow' }, 'MATERIAL / COLOR STUDIES / 1890'), element('h1', {}, material.title), element('p', { class: 'material-author' }, material.author), element('p', {}, '29 chromatic plates, translated into SVG and flat color. Explore the original scans and their web interpretation in the same arrangement.'));
  const content = element('section', { class: 'material-content', 'aria-label': 'Selected material' });
  const credit = element('aside', { class: 'material-credit' }, element('p', {}, material.credit), link('Getty / Internet Archive source ↗', material.sourceURL), document.createTextNode(' · '), link('Source page images · JP2 archive ↗', 'https://archive.org/download/gri_33125012875395/gri_33125012875395_jp2.zip'), element('p', {}, 'archive records source as not in copyright, no copyright is asserted'));
  // Keep native anchor semantics for modified clicks, new tabs and copied links.
  function navigateLink(anchor, action) {
    anchor.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      action();
    });
    return anchor;
  }
  function renderIndex(focusID) {
    const savedSupplements = history.state?.materialIndexSupplementsOpen;
    if (typeof savedSupplements === 'boolean') supplements.open = savedSupplements;
    const heading = element('div', { class: 'material-index-heading' }, element('h2', {}, 'The plates'), element('span', {}, `${material.items.filter(item => item.svg).length} web translations`));
    const grid = element('ol', { class: 'material-index-grid', 'aria-label': 'Chromatic plates' });
    for (const [index, item] of material.items.entries()) {
      const label = `${item.group === 'plate' ? 'Plate ' + item.number + ' · ' : ''}${item.title}`;
      const anchor = element('a', { class: item.svg ? 'material-index-card' : 'material-supplement-link', id: `index-${item.id}`, href: materialPageURL(location.href, item), 'aria-label': `${label}. Open ${item.svg ? 'web translation' : 'original scan'}.` });
      navigateLink(anchor, () => {
        history.replaceState({ ...history.state, materialIndexFocus: item.id, materialIndexScroll: window.scrollY, materialIndexSupplementsOpen: supplements.open }, '', location.href);
        current = index; preferredView = item.svg ? 'translation' : 'original'; showingIndex = false;
        history.pushState(null, '', anchor.href); render('#material-panel-picker');
      });
      if (item.svg) {
        const status = element('span', { class: 'material-thumbnail-status', 'aria-hidden': 'true' }, 'Loading…');
        const image = element('img', { src: assetURL(item.svg), alt: '', width: item.width, height: item.height, loading: 'lazy', decoding: 'async' });
        image.addEventListener('load', () => status.remove());
        image.addEventListener('error', () => { status.textContent = 'Preview unavailable · Open plate'; image.hidden = true; });
        anchor.append(element('span', { class: 'material-index-art', style: `aspect-ratio:${item.width}/${item.height}` }, image, status), element('span', { class: 'material-index-label' }, element('span', { class: 'material-index-number' }, item.number), element('span', { lang: 'fr' }, item.title)));
        grid.append(element('li', {}, anchor));
      } else {
        anchor.textContent = item.title;
        supplementsList.append(element('li', {}, anchor));
      }
    }
    content.append(heading, grid, supplements);
    if (focusID) {
      if (material.items.find(item => item.id === focusID)?.group === 'supplement') supplements.open = true;
      document.getElementById(`index-${focusID}`)?.focus({preventScroll:true});
      const savedScroll = history.state?.materialIndexScroll;
      if (Number.isFinite(savedScroll)) requestAnimationFrame(() => {
        if (!destroyed && showingIndex) window.scrollTo(0, savedScroll);
      });
    }
  }
  const supplementsList = element('ul', { class: 'material-supplement-list' });
  const supplements = element('details', { class: 'material-supplements' }, element('summary', {}, `Supplementary pages · ${material.items.filter(item => item.group === 'supplement').length} original scans`), supplementsList);
  function updateURL() {
    const url = new URL(location.href); url.searchParams.set('library', 'material'); url.searchParams.set('panel', material.items[current].id);
    if (preferredView === 'original') url.searchParams.delete('view'); else url.searchParams.set('view', preferredView);
    if (url.href !== location.href) history.pushState(null, '', url);
  }
  function render(focusSelector, preserveViewport = false) {
    const oldStage = content.querySelector('.material-stage'), oldPage = content.querySelector('.material-sheet');
    let savedCenter;
    if (preserveViewport && oldStage && oldPage) {
      const viewport = oldStage.getBoundingClientRect(), page = oldPage.getBoundingClientRect();
      savedCenter = [(viewport.left + oldStage.clientLeft + oldStage.clientWidth / 2 - page.left) / page.width, (viewport.top + oldStage.clientTop + oldStage.clientHeight / 2 - page.top) / page.height];
    }
    const version = ++sequence; observer?.disconnect(); comparison?.destroy(); comparison = undefined;
    const item = material.items[current], hasSVG = Boolean(item.svg), view = hasSVG ? preferredView : 'original';
    content.replaceChildren();
    if (showingIndex) { supplementsList.replaceChildren(); renderIndex(focusSelector || history.state?.materialIndexFocus); return; }
    const overview = element('a', { class: 'material-back-index', href: materialPageURL(location.href) }, '← All plates');
    navigateLink(overview, () => {
      showingIndex = true;
      history.pushState({ materialIndexFocus: material.items[current].id }, '', overview.href);
      render(material.items[current].id);
      document.getElementById(`index-${material.items[current].id}`)?.scrollIntoView({block:'nearest'});
    });
    content.append(overview);
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
      button.addEventListener('click', () => { preferredView = id; updateURL(); render(`[data-material-view="${id}"]`, true); }); modes.append(button);
    }
    const zoomPicker = element('select', { id: 'material-zoom' }, ...[['artwork','Fit artwork'],[1,'Fit page'],['width','Fit width'],['actual','100% · scan pixels'],[1.5,'150%'],[2,'200%'],[3,'300%']].filter(([value]) => value !== 'artwork' || hasSVG).map(([value,label]) => element('option', { value }, label)));
    const effectiveZoom = () => !hasSVG && zoom === 'artwork' ? '1' : String(zoom);
    zoomPicker.value = effectiveZoom();
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
    let chartPresentation;
    if (materialChartRegistration[item.id] && view !== 'original') {
      const alignment = element('input', { type: 'checkbox', id: 'material-align-chart' });
      alignment.checked = alignCharts;
      alignment.addEventListener('change', () => { alignCharts = alignment.checked; chartPresentation?.set(alignCharts); });
      content.append(element('div', { class: 'material-alignment-control' }, element('label', { for: 'material-align-chart' }, alignment, document.createTextNode('Align chart to scan'))));
    }
    if (!hasSVG) content.append(element('p', { class: 'material-mode-note', role: 'status' }, 'Supplementary page · original scan only. Web translation is available for the 29 numbered plates.'));
    const framingNote = element('p', { class: 'material-mode-note', id: 'material-framing-help' });
    zoomPicker.setAttribute('aria-describedby', 'material-framing-help material-zoom-help');
    const loadStatus = element('div', { class: 'material-load-status' });
    const help = element('details', { class: 'material-help' }, element('summary', {}, 'Viewer controls and fidelity'),
      element('p', { id: 'material-keyboard-help' }, 'Focus the intersection and use arrow keys to move either divider. Shift + arrows take larger steps; Page Up / Down move vertically. Home / End move both to the edges; Enter or Space centers both. Escape cancels a drag. Keyboard color inspection reveals the focused swatch by moving the vertical divider when needed.'),
      element('p', { id: 'material-zoom-help' }, 'Fit artwork enlarges each full page equally and centers the color study. Scroll to see page margins, or select Fit page to reset. Fit width fills the viewer horizontally. 100% is one original scan pixel per CSS pixel; 150%, 200% and 300% use that same basis.'),
      element('p', {}, 'Web geometry is regularized and typography is substituted, so printed details do not align exactly. Align chart to scan applies an approximate, measured correction to the chart, frame and axis labels on plates II–XXII only. Headings, footer and the scan stay unchanged. Turn it off to inspect the original reconstruction. SVG downloads always retain the unchanged source reconstruction.'));
    if (view === 'compare') help.append(element('p', { class: 'material-mode-note', id: 'material-compare-help' }, 'Source is below and right of the dividers; Web fills the rest. Drag the intersection freely, or start nearly straight to move one divider. Pull sideways to release the snap.'));
    content.append(framingNote, loadStatus, stage, inspector, help, caption);
    let viewedCenter;
    function rememberCenter() {
      // Ignore resize-induced scroll events until the observer has reframed.
      if (stage.clientWidth !== stageSize[0] || stage.clientHeight !== stageSize[1]) return;
      const page = sheets.querySelector('.material-sheet')?.getBoundingClientRect(), viewport = stage.getBoundingClientRect();
      if (page?.width && page.height) viewedCenter = [(viewport.left + stage.clientLeft + stage.clientWidth / 2 - page.left) / page.width, (viewport.top + stage.clientTop + stage.clientHeight / 2 - page.top) / page.height];
    }
    function fit(reset = false, centerOverride) {
      const page = sheets.querySelector('.material-sheet');
      if (!page) return;
      const mode = effectiveZoom();
      framingNote.hidden = mode === 'artwork';
      framingNote.textContent = mode === 'artwork' ? '' : mode === '1' ? 'Fit page shows the complete page and its margins.' : mode === 'width' ? 'Fit width fills the viewer. Scroll to see the rest of the page.' : `${mode === 'actual' ? 100 : Number(mode) * 100}% of original scan pixels. Scroll to pan.`;
      const old = page.getBoundingClientRect(), viewport = stage.getBoundingClientRect();
      const viewportCenter = [viewport.left + stage.clientLeft + stage.clientWidth / 2, viewport.top + stage.clientTop + stage.clientHeight / 2];
      const previousCenter = centerOverride || (old.width > 0 && old.height > 0 ? [(viewportCenter[0] - old.left) / old.width, (viewportCenter[1] - old.top) / old.height] : [.5,.5]);
      const frame = materialFraming(item, mode, Math.max(1, stage.clientWidth - 48), Math.max(1, stage.clientHeight - 72));
      sheets.style.setProperty('--sheet-width', `${frame.width}px`);
      for (const image of sheets.querySelectorAll('img')) image.sizes = `${Math.ceil(frame.width)}px`;
      if (reset && ['1','width'].includes(mode)) stage.scrollTo(0,0);
      else {
        const center = reset && frame.center ? frame.center : previousCenter, next = page.getBoundingClientRect();
        stage.scrollTo(stage.scrollLeft + next.left + center[0] * next.width - viewportCenter[0], stage.scrollTop + next.top + center[1] * next.height - viewportCenter[1]);
      }
      comparison?.layout(); rememberCenter();
    }
    zoomPicker.addEventListener('change', () => { zoom = zoomPicker.value; fit(['artwork','1','width'].includes(zoom)); });
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
      } else {
        const slot = element('figure', { class: 'material-sheet-slot', 'data-mode': mode }, element('figcaption', {}, mode === 'original' ? 'Original scan' : 'Web translation · approximate flat colors'));
        sheet = element('div', { class: 'material-sheet', style: `aspect-ratio:${item.width}/${item.height}` }); slot.append(sheet); sheets.append(slot);
      }
      const status = element('p', { class: 'material-image-status', role: 'status' }, mode === 'original' ? 'Loading scan…' : 'Loading web translation…'); loadStatus.append(status);
      const fail = message => { status.textContent = message; status.setAttribute('role','alert'); const retry = element('button', { type: 'button' }, 'Retry'); retry.addEventListener('click', () => render(undefined, true)); status.append(document.createElement('br'), retry); };
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
          chartPresentation = mountMaterialChart(svg, item.id);
          chartPresentation?.set(alignCharts);
          if (materialChartRegistration[item.id] && !chartPresentation) {
            const control = content.querySelector('#material-align-chart');
            if (control) { control.checked = false; control.disabled = true; }
            const note = content.querySelector('.material-alignment-note');
            if (note) note.textContent = 'Chart alignment is unavailable for this asset. Showing the unchanged reconstruction.';
          }
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
      comparison = mountMaterialCompare(compareSheet, reveal);
    }
    let stageSize = [stage.clientWidth, stage.clientHeight];
    observer = new ResizeObserver(() => {
      const nextSize = [stage.clientWidth, stage.clientHeight];
      if (nextSize.every((size,index) => size === stageSize[index])) return;
      const previousCenter = viewedCenter; stageSize = nextSize;
      if (['artwork','1','width'].includes(effectiveZoom())) fit(true);
      else {
        // Saved before resize: browser scroll anchoring may already have moved
        // the old page by the time this callback runs.
        fit(false, previousCenter || [.5,.5]);
      }
    });
    stage.addEventListener('scroll', rememberCenter, {passive:true});
    observer.observe(stage); fit(!savedCenter, savedCenter);
    if (comparison && !revealInitialized) { comparison.initialize(); revealInitialized = true; }
    if (focusSelector) content.querySelector(focusSelector)?.focus();
  }
  main.append(intro, content, credit); root.replaceChildren(main); render();
  return { destroy() { destroyed = true; sequence++; observer?.disconnect(); comparison?.destroy(); main.remove(); } };
}
