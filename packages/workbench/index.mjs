/** Framework-independent collection workbench. Public API version 0.4.0. */
export const VERSION = '0.4.0';
export function skinName(value = 'workbench') {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]*$/.test(value)) throw new TypeError('Skin must be a kebab-case name');
  return value;
}
export const SECTIONS = ['foundations', 'components', 'patterns', 'screens', 'checks', 'sources'];
export function safeURL(value, base = globalThis.location?.href ?? 'http://localhost/') {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('A nonempty URL string is required');
  const url = new URL(value, base);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Only HTTP(S) URLs without credentials are supported');
  return url;
}
export function fixtureURL(value, { theme = 'light', base } = {}) {
  const url = safeURL(value, base);
  url.searchParams.set('workbenchTheme', theme);
  return url.href;
}
export function tokenRows(document, mode) {
  const selected = document?.modes?.find(item => item.id === mode) ?? document?.modes?.[0];
  return Object.entries(selected?.tokens ?? {}).map(([name, token]) => ({ name, ...token, mode: selected.id }));
}
/** Imported study prose is inert text, never interpreted as HTML. */
export function validateStudy(study) {
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const errors = [];
  if (!record(study) || study.schemaVersion !== 1) return ['Study schemaVersion must be 1.'];
  for (const key of ['id', 'title']) if (typeof study[key] !== 'string' || !study[key].trim()) errors.push(`Study ${key} is required.`);
  for (const key of ['source', 'analysis', 'homepage', 'completeness', 'provenance']) if (study[key] !== undefined && !record(study[key])) errors.push(`Study ${key} must be an object.`);
  for (const key of ['sections', 'tokens']) if (study[key] !== undefined && (!Array.isArray(study[key]) || study[key].some(item => !record(item)))) errors.push(`Study ${key} must contain objects.`);
  if (Array.isArray(study.sections) && study.sections.some(item => !record(item) || typeof item.heading !== 'string' || typeof item.text !== 'string')) errors.push('Study sections require heading and text.');
  if (Array.isArray(study.tokens) && study.tokens.some(item => !record(item) || typeof item.path !== 'string' || (item.evidence !== undefined && !record(item.evidence)))) errors.push('Study tokens require path and object evidence.');
  if (record(study.homepage) && study.homepage.candidates !== undefined && (!Array.isArray(study.homepage.candidates) || study.homepage.candidates.some(item => !record(item) || typeof item.url !== 'string'))) errors.push('Study homepage candidates require URLs.');
  if (record(study.completeness)) for (const key of ['presentFields', 'missingFields']) if (study.completeness[key] !== undefined && (!Array.isArray(study.completeness[key]) || study.completeness[key].some(item => typeof item !== 'string'))) errors.push(`Study ${key} must contain strings.`);
  if (record(study.homepage) && study.homepage.verification !== undefined && (!record(study.homepage.verification) || !['verified', 'unverified', 'missing', 'blocked'].includes(study.homepage.verification.status) || (study.homepage.verification.url !== undefined && typeof study.homepage.verification.url !== 'string'))) errors.push('Study homepage verification is invalid.');
  if (study.limitations !== undefined && (!Array.isArray(study.limitations) || study.limitations.some(item => typeof item !== 'string'))) errors.push('Study limitations must contain strings.');
  return errors;
}
export async function loadCollections(registryURL, { fetcher = globalThis.fetch, base } = {}) {
  const registry = safeURL(registryURL, base);
  async function json(url) {
    const response = await fetcher(url.href);
    if (!response.ok) throw new Error(`Unable to load ${url.pathname} (${response.status})`);
    return response.json();
  }
  const data = await json(registry);
  const entries = Array.isArray(data) ? data : data.collections;
  if (!Array.isArray(entries)) throw new Error('Registry must contain a collections array');
  return Promise.all(entries.map(async entry => {
    const manifestURL = typeof entry === 'string' ? safeURL(entry, registry) : registry;
    const collection = typeof entry === 'string' ? await json(manifestURL) : entry;
    if (!collection || collection.schemaVersion !== 1 || !collection.id || !collection.title) throw new Error('Invalid collection manifest');
    const tokensData = collection.tokensData ?? (collection.tokens ? await json(safeURL(collection.tokens, manifestURL)) : undefined);
    const inventoryData = collection.inventoryData ?? (collection.inventory ? await json(safeURL(collection.inventory, manifestURL)) : undefined);
    if (inventoryData !== undefined && (!inventoryData || inventoryData.schemaVersion !== 1 || !Array.isArray(inventoryData.items) || !Array.isArray(inventoryData.checks) || inventoryData.items.some(item => !item || typeof item !== 'object' || !Array.isArray(item.source) || !Array.isArray(item.fixtures) || !Array.isArray(item.states)) || inventoryData.checks.some(check => !check || typeof check !== 'object'))) throw new Error('Invalid inventory document');
    const studyData = collection.studyData ?? (collection.study ? await json(safeURL(collection.study, manifestURL)) : undefined);
    if (studyData !== undefined) {
      const errors = validateStudy(studyData);
      if (studyData?.id !== collection.id) errors.push('Study id must match collection id.');
      if (errors.length) throw new Error(`Invalid study document: ${errors.join(' ')}`);
    }
    return { ...collection, tokensData, inventoryData, studyData, manifestURL: manifestURL.href,
      fixtures: (collection.fixtures ?? []).map(fixture => ({ ...fixture, url: safeURL(fixture.url, manifestURL).href })) };
  }));
}
function element(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value != null) node.setAttribute(key, String(value));
  }
  node.append(...children.filter(value => value != null).map(value => typeof value === 'string' ? document.createTextNode(value) : value));
  return node;
}
const titleCase = value => value[0].toUpperCase() + value.slice(1);
// Any CSS colour → 8-bit sRGB, resolved by the browser so every notation a token may use is covered.
let colorContext;
const resolvedColors = new Map();
function resolveColor(value) {
  value = String(value).trim();
  if (resolvedColors.has(value)) return resolvedColors.get(value);
  if (typeof document === 'undefined') return null;
  colorContext ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  let rgb = null;
  colorContext.fillStyle = '#010203';
  colorContext.fillStyle = value;
  // An unparsable value leaves the sentinel in place.
  if (colorContext.fillStyle !== '#010203' || /^#010203$/i.test(value)) {
    colorContext.clearRect(0, 0, 1, 1); colorContext.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = colorContext.getImageData(0, 0, 1, 1).data;
    if (a) rgb = [r, g, b, Math.round(a / 2.55) / 100];
  }
  resolvedColors.set(value, rgb);
  return rgb;
}
const linearChannel = channel => (channel /= 255) <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
const relativeLuminance = ([r, g, b]) => .2126 * linearChannel(r) + .7152 * linearChannel(g) + .0722 * linearChannel(b);
const contrastRatio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
function toOKLCH([r, g, b]) {
  const R = linearChannel(r), G = linearChannel(g), B = linearChannel(b);
  const l = Math.cbrt(.4122214708 * R + .5363325363 * G + .0514459929 * B), m = Math.cbrt(.2119034982 * R + .6806995451 * G + .1073969566 * B), s = Math.cbrt(.0883024619 * R + .2817188376 * G + .6299787005 * B);
  const L = .2104542553 * l + .793617785 * m - .0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, K = .0259040371 * l + .7827717662 * m - .808675766 * s;
  return { lightness: L, chroma: Math.hypot(A, K), hue: (Math.atan2(K, A) * 180 / Math.PI + 360) % 360 };
}
const signatureCache = new WeakMap();
/** A collection's unique colour tokens in reading order: neutrals dark to light, then hues from
 *  red round to magenta, each 20° band alternating direction so neighbours meet at similar lightness.
 *  Browser only; returns an empty list where no canvas is available. */
export function colorSignature(tokensData, mode) {
  if (!tokensData || typeof tokensData !== 'object') return [];
  const modes = signatureCache.get(tokensData) ?? signatureCache.set(tokensData, new Map()).get(tokensData);
  if (modes.has(mode)) return modes.get(mode);
  const seen = new Set(), colors = [];
  for (const row of tokenRows(tokensData, mode)) {
    if (row.type !== 'color') continue;
    const rgb = resolveColor(row.value);
    if (!rgb || seen.has(rgb.join())) continue;
    seen.add(rgb.join());
    const [r, g, b, a] = rgb;
    colors.push({ name: row.name.replace(/^colors?\./, ''), value: String(row.value), css: `rgb(${r} ${g} ${b} / ${a})`,
      hex: '#' + [r, g, b, ...(a < 1 ? [Math.round(a * 255)] : [])].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase(), ...toOKLCH(rgb) });
  }
  const neutral = item => item.chroma < .03, band = item => Math.floor(((item.hue + 15) % 360) / 20);
  colors.sort((a, b) => neutral(a) !== neutral(b) ? (neutral(a) ? -1 : 1) : neutral(a) ? a.lightness - b.lightness
    : band(a) - band(b) || (band(a) % 2 ? b.lightness - a.lightness : a.lightness - b.lightness));
  if (typeof document !== 'undefined') modes.set(mode, colors);
  return colors;
}
/** Hard-stopped gradient for a signature, usable as a background-image. */
export function signatureGradient(colors) {
  return colors.length ? `linear-gradient(90deg,${colors.map((item, index) => `${item.css} ${index / colors.length * 100}% ${(index + 1) / colors.length * 100}%`).join(',')})` : 'none';
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
export function mountWorkbench(container, options = {}) {
  if (!container?.replaceChildren) throw new TypeError('A DOM container is required');
  let collections = options.collections ?? [];
  let skin = skinName(options.skin);
  let selected = options.initialCollection ?? collections[0]?.id, section = SECTIONS.includes(options.initialSection) ? options.initialSection : 'foundations', theme = 'light', viewport = 'responsive', comparison = false, fixtureID = options.initialFixture;
  let tokenFilter = '', collectionFilter = '', disposed = false;
  let cleanup = [], drawnSignature = '', entered;
  const clear = () => { cleanup.forEach(fn => fn()); cleanup = []; };
  /** Apply a state change and re-render at once. A re-render replaces the control that caused it,
   *  so that control gets focus back. Updates stay synchronous: hosts and tests may read the result immediately. */
  function update(change, focusKey) {
    if (disposed) return;
    const restore = focusKey && container.contains(document.activeElement) ? focusKey : undefined;
    change(); render(restore);
  }
  const current = () => collections.find(item => item.id === selected);
  const note = (text, kind = '') => element('p', { class: `wb-note ${kind}` }, text);
  function select(label, values, value, change) {
    return element('label', { class: 'wb-control' }, element('span', {}, label === 'Theme' ? 'Preview theme' : label), element('select', { 'aria-label': label, 'data-wb-focus': `select:${label}`, onchange: event => { const next = event.target.value; update(() => change(next), `select:${label}`); } }, ...values.map(item => {
      const [id, text] = Array.isArray(item) ? item : [item, titleCase(item)];
      return element('option', { value: id, ...(value === id ? { selected: '' } : {}) }, text);
    })));
  }
  function sourceLink(text, value) {
    try { return element('a', { href: safeURL(value).href, target: '_blank', rel: 'noopener noreferrer' }, text); }
    catch { return element('span', {}, `${text}: unavailable`); }
  }
  function foundations(collection) {
    const rows = tokenRows(collection.tokensData, theme);
    const fontRows = rows.filter(row => row.type === 'fontFamily');
    const primaryFont = ['primary', 'body', 'sans', 'ui', 'heading', 'display'].map(role => fontRows.find(row => row.name.split(/[.-]/).at(-1) === role)).find(Boolean) ?? fontRows[0];
    const studyTokens = new Map((collection.studyData?.tokens ?? []).map(token => [token.path, token]));
    const panel = element('div', { class: `wb-panel${collection.kind === 'reference' ? ' wb-reference-foundations' : ''}` });
    const sections = element('div', { class: 'wb-foundation-sections' });
    const status = element('p', { class: 'wb-sr-only', role: 'status', 'aria-live': 'polite' });
    // Preserve authored token values. This label only expands supported sRGB notation.
    const hexLabel = value => {
      const hex = String(value).match(/^#([a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i);
      if (hex) return '#' + (hex[1].length < 5 ? [...hex[1]].map(char => char + char).join('') : hex[1]).toUpperCase();
      const rgb = String(value).match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(0?\.\d+|[01]))?\s*\)$/i);
      if (rgb && rgb.slice(1, 4).every(channel => Number(channel) <= 255)) {
        const channels = rgb.slice(1, 4).map(Number);
        if (rgb[4] !== undefined && Number(rgb[4]) < 1) channels.push(Number(rgb[4]) * 255);
        return '#' + channels.map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('').toUpperCase();
      }
      return String(value);
    };
    const groupFor = row => row.type === 'color' ? 'color' : row.type === 'dimension' ? 'dimensions' : row.type === 'fontFamily' ? 'fonts' : 'other';
    let previewCleanup = [];
    const clearPreviews = () => { previewCleanup.forEach(fn => fn()); previewCleanup = []; };
    cleanup.push(clearPreviews);
    const dimensionPreview = (row, metadata) => {
      const value = String(row.value).trim();
      const fontSize = /(?:^|[.-])font[.-]?size(?:[.-]|$)|(?:^|[.-])type(?:ography)?[.-]size(?:[.-]|$)/i.test(row.name);
      const radius = /(?:^|\.)(?:radius|radii|rounded)(?:\.|$)|borderradius/i.test(row.name);
      const time = value.match(/^(\d+(?:\.\d+)?|\.\d+)(ms|s)$/i);
      const detail = element('span', { class: 'wb-token-detail' });
      metadata.append(detail);
      if (time && Number.isFinite(Number(time[1]) * (time[2].toLowerCase() === 's' ? 1000 : 1))) {
        const duration = Number(time[1]) * (time[2].toLowerCase() === 's' ? 1000 : 1);
        const dot = element('span', { class: 'wb-motion-dot' });
        const track = element('span', { class: 'wb-motion-track', 'aria-hidden': 'true' }, dot);
        const reduced = matchMedia('(prefers-reduced-motion: reduce)');
        let animation;
        const reset = () => { animation?.cancel(); animation = undefined; };
        const play = () => {
          reset();
          if (!reduced.matches) animation = dot.animate([{ left: '0%' }, { left: '100%' }], { duration, easing: 'linear', fill: 'forwards' });
        };
        const preview = element('button', { type: 'button', class: 'wb-motion-preview', 'data-dimension-kind': 'motion',
          onpointerenter: play, onpointerleave: () => { if (!preview.matches(':focus-visible')) reset(); }, onpointercancel: reset,
          onfocus: () => { if (preview.matches(':focus-visible')) play(); }, onblur: () => { if (!preview.matches(':hover')) reset(); }, onclick: play }, track);
        const preferenceChanged = () => {
          reset();
          detail.textContent = reduced.matches ? 'Reduced motion: static preview' : 'Hover, focus or press to play';
          preview.setAttribute('aria-label', `${row.name}, ${value}. ${reduced.matches ? 'Static preview for reduced motion.' : 'Play a left-to-right motion preview.'}`);
        };
        preferenceChanged(); reduced.addEventListener('change', preferenceChanged);
        previewCleanup.push(() => { reset(); reduced.removeEventListener('change', preferenceChanged); });
        return preview;
      }
      const length = value.match(/^(-?(?:\d+(?:\.\d+)?|\.\d+))(px|rem|em|ch|ex|cm|mm|q|in|pt|pc)?$/i);
      const numeric = Number(length?.[1]);
      const supported = length && Number.isFinite(numeric) && (length[2] || numeric === 0) && Math.abs(numeric) <= 10000 && (!(radius || fontSize) || numeric >= 0);
      if (!supported) {
        detail.textContent = /%|v[wh]|var\(|calc\(/i.test(value) ? 'Needs its original layout context' : 'No single length or duration to render';
        return element('div', { class: 'wb-dimension-preview wb-dimension-unavailable', 'data-dimension-kind': 'unsupported' }, element('span', {}, 'Preview unavailable'));
      }
      const magnitude = `${Math.abs(numeric)}${length[2] || 'px'}`;
      const glyph = element('span', { class: fontSize ? 'wb-font-size-diagram' : radius ? 'wb-radius-diagram' : 'wb-length-diagram', 'aria-hidden': 'true' }, fontSize ? 'Aa' : null);
      if (fontSize) {
        glyph.style.fontSize = value;
        if (primaryFont && CSS.supports('font-family', String(primaryFont.value))) glyph.style.fontFamily = String(primaryFont.value);
      } else if (radius) {
        // A native CSS corner: exact radius, plus short straight edges to show zero/small radii.
        glyph.style.width = `calc(${magnitude} + 16px)`;
        glyph.style.height = `calc(${magnitude} + 16px)`;
        glyph.style.borderTopLeftRadius = value;
      } else glyph.style.width = magnitude;
      const canvas = element('div', { class: 'wb-dimension-canvas' }, glyph);
      const preview = element('div', { class: 'wb-dimension-preview', 'data-dimension-kind': fontSize ? 'font-size' : radius ? 'radius' : 'length' }, canvas);
      const context = numeric < 0 ? 'Negative value: magnitude shown' : /^(rem|em|ch|ex)$/i.test(length[2] || '') ? 'Relative to workbench typography' : '';
      let initialized = false;
      const observer = new ResizeObserver(() => {
        if (!preview.isConnected || !preview.clientWidth) return;
        const overflow = preview.scrollWidth > preview.clientWidth + 1 || preview.scrollHeight > preview.clientHeight + 1;
        detail.textContent = [context, overflow ? 'Actual size: focus or click to inspect' : ''].filter(Boolean).join(' · ');
        if (overflow) {
          preview.setAttribute('tabindex', '0'); preview.setAttribute('role', 'region');
          preview.setAttribute('aria-label', `${row.name}, ${value}, actual-size preview. Focus or click to scroll; Tab to leave.`);
          // Start oversized corners at the visible top endpoint instead of empty space inside the arc.
          if (!initialized && radius) preview.scrollLeft = preview.scrollWidth;
          initialized = true;
        } else { preview.removeAttribute('tabindex'); preview.removeAttribute('role'); preview.removeAttribute('aria-label'); }
      });
      observer.observe(preview); observer.observe(canvas); previewCleanup.push(() => observer.disconnect());
      return preview;
    };

    const card = row => {
      const group = groupFor(row), value = String(row.value), evidence = studyTokens.get(row.name);
      const label = element('code', { class: 'wb-token-name', title: row.name }, group === 'color' ? row.name.replace(/^colors?\./, '') : row.name);
      const shown = element('code', { class: 'wb-token-value', title: value }, group === 'color' ? hexLabel(value) : value);
      const metadata = element('div', { class: 'wb-token-meta' }, label, shown);
      if (group === 'other') metadata.append(element('span', { class: 'wb-token-type' }, row.type ?? 'unknown'));
      let preview;
      if (group === 'color') {
        const swatch = element('span', { class: 'wb-swatch', 'aria-hidden': 'true' });
        // Setting one validated property cannot introduce remote CSS or markup.
        if (CSS.supports('color', value)) swatch.style.backgroundColor = value;
        preview = element('div', { class: 'wb-color-preview', 'aria-hidden': 'true', title: 'Copy value' }, swatch);
        const rgb = resolveColor(value);
        // White and black set on the colour itself, with the WCAG ratio each would achieve.
        if (rgb?.[3] === 1) {
          const luminance = relativeLuminance(rgb);
          preview.append(element('span', { class: 'wb-contrast' }, ...[['#fff', contrastRatio(1, luminance)], ['#000', contrastRatio(luminance, 0)]].map(([ink, ratio]) => {
            const sample = element('span', { 'data-wb-fail': ratio < 4.5 ? '' : null }, `Aa ${ratio.toFixed(1)}`);
            sample.style.color = ink;
            return sample;
          })));
        }
        let restoring;
        preview.addEventListener('click', async () => {
          if (!await copyText(value)) return;
          const item = preview.closest('.wb-token-card');
          clearTimeout(restoring);
          item?.setAttribute('data-wb-copied', ''); shown.textContent = 'Copied'; status.textContent = `Copied ${row.name}, ${value}.`;
          restoring = setTimeout(() => { item?.removeAttribute('data-wb-copied'); shown.textContent = hexLabel(value); }, 1000);
        });
        previewCleanup.push(() => clearTimeout(restoring));
      } else if (group === 'dimensions') {
        preview = dimensionPreview(row, metadata);
      } else if (group === 'fonts') {
        preview = element('div', { class: 'wb-font-preview' }, element('span', { class: 'wb-font-monogram', 'aria-hidden': 'true' }, 'Aa'), element('p', {}, 'The quick brown fox jumps over the lazy dog.'), element('span', { class: 'wb-font-characters' }, '0123456789 · Aa Bb Cc'));
        if (CSS.supports('font-family', value)) preview.style.fontFamily = value;
      }
      return element('li', { class: `wb-token-card wb-token-${group}`, 'data-token-name': row.name, 'data-source-path': evidence?.sourcePath, 'data-source-line': evidence?.evidence?.line }, preview, metadata);
    };
    const paint = () => {
      clearPreviews();
      const query = tokenFilter.toLowerCase();
      const filtered = rows.filter(row => `${row.name} ${row.value} ${row.type === 'color' ? hexLabel(row.value) : ''}`.toLowerCase().includes(query));
      sections.replaceChildren();
      for (const [id, title] of [['color', 'Color'], ['dimensions', 'Dimensions'], ['fonts', 'Fonts'], ['other', 'Other tokens']]) {
        const tokens = filtered.filter(row => groupFor(row) === id);
        if (id === 'dimensions') tokens.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }));
        if (!tokens.length) continue;
        const heading = element('h3', {}, title);
        const group = element('section', { class: `wb-foundation-group wb-foundation-${id}`, 'aria-label': title }, heading);
        if (id === 'dimensions') group.append(note('Rendered at actual CSS size. Oversized samples scroll.'));
        if (id === 'fonts') group.append(note('Uses fonts available on this device. Missing families fall back.'));
        group.append(element('ul', { class: 'wb-token-grid' }, ...tokens.map(card)));
        sections.append(group);
      }
      status.textContent = `${filtered.length} ${filtered.length === 1 ? 'token' : 'tokens'} shown.`;
      if (!filtered.length) sections.append(note(rows.length ? 'No matching tokens.' : 'No tokens in this collection.'));
    };
    if (collection.kind === 'reference' && collection.fixtures?.some(f => f.id.endsWith('-recipe-sheet'))) panel.append(element('div', { class: 'wb-panel-heading' }, note('Explore visual foundations and source-linked component interpretations.'), element('button', { type: 'button', onclick: () => update(() => { section = 'components'; fixtureID = collection.fixtures.find(f => f.id.endsWith('-recipe-sheet')).id; }, 'section:components') }, 'Open visual workbench')));
    panel.append(element('div', { class: 'wb-panel-heading' }, element('div', {}, element('h2', {}, 'Token inspector'), rows.length ? element('span', { class: 'wb-token-mode' }, `Mode: ${rows[0].mode}`) : null), element('input', { type: 'search', placeholder: 'Filter tokens…', value: tokenFilter, 'aria-label': 'Filter tokens', oninput: event => { tokenFilter = event.target.value; paint(); } })));
    paint(); panel.append(status, sections);
    const aliases = Object.entries(collection.tokensData?.aliases ?? {});
    if (aliases.length) panel.append(element('details', {}, element('summary', {}, `Compatibility aliases (${aliases.length})`), element('pre', {}, aliases.map(([alias, token]) => `${alias} → ${token}`).join('\n'))));
    if (collection.kind === 'reference') panel.append(studyPanel(collection));
    return panel;
  }
  /** Every colour token in the collection as one band, read with the pointer or the arrow keys. */
  function signaturePanel(collection) {
    const colors = colorSignature(collection.tokensData, theme);
    if (!colors.length) return null;
    const rows = tokenRows(collection.tokensData, theme);
    const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;
    const others = [['fontFamily', 'type family', 'type families'], ['dimension', 'dimension', 'dimensions']]
      .map(([type, one, many]) => [rows.filter(row => row.type === type).length, one, many]).filter(([count]) => count).map(item => ` · ${plural(...item)}`).join('');
    const order = 'Ordered in OKLCH · neutrals by lightness, then hue';
    const caret = element('span', { class: 'wb-signature-caret', 'aria-hidden': 'true' });
    const band = element('div', { class: 'wb-signature-band', tabindex: '0', role: 'slider', 'aria-label': `${collection.title} colour signature`, 'aria-orientation': 'horizontal', 'aria-valuemin': '1', 'aria-valuemax': String(colors.length), 'aria-valuenow': '1' }, caret);
    band.style.backgroundImage = signatureGradient(colors);
    const reading = element('span'), legend = element('span', {}, order);
    const rest = () => reading.replaceChildren(element('span', { class: 'wb-signature-name' }, plural(colors.length, 'colour', 'colours')), others);
    let active = 0, restoring;
    const point = index => {
      active = Math.max(0, Math.min(colors.length - 1, index));
      const item = colors[active], dot = element('span', { class: 'wb-signature-dot' });
      dot.style.background = item.css;
      caret.style.left = `${active / colors.length * 100}%`;
      caret.style.width = `max(${100 / colors.length}%, 5px)`;
      reading.replaceChildren(dot, element('span', { class: 'wb-signature-name' }, item.name), `  ${item.hex}  oklch(${(item.lightness * 100).toFixed(1)}% ${item.chroma.toFixed(3)} ${item.chroma < .003 ? 0 : item.hue.toFixed(0)})`);
      band.setAttribute('aria-valuenow', String(active + 1));
      band.setAttribute('aria-valuetext', `${item.name}, ${item.hex}`);
    };
    const take = async () => {
      if (!await copyText(colors[active].hex)) return;
      clearTimeout(restoring);
      legend.textContent = `Copied ${colors[active].hex}`;
      restoring = setTimeout(() => { legend.textContent = order; }, 1400);
    };
    cleanup.push(() => clearTimeout(restoring));
    band.addEventListener('pointermove', event => { const box = band.getBoundingClientRect(); point(Math.floor((event.clientX - box.left) / box.width * colors.length)); });
    band.addEventListener('pointerleave', () => { if (document.activeElement !== band) rest(); });
    band.addEventListener('focus', () => point(active));
    band.addEventListener('blur', rest);
    band.addEventListener('click', take);
    band.addEventListener('keydown', event => {
      const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
      if (step) point(active + step); else if (event.key === 'Home') point(0); else if (event.key === 'End') point(colors.length - 1);
      else if (event.key === 'Enter' || event.key === ' ') take(); else return;
      event.preventDefault();
    });
    rest();
    // Draw the band in only when the collection or mode changes, not on every section change.
    const key = `${collection.id}/${theme}`;
    if (key !== drawnSignature) band.setAttribute('data-wb-draw', '');
    drawnSignature = key;
    return element('figure', { class: 'wb-signature' }, band, element('figcaption', { class: 'wb-signature-readout' }, reading, legend));
  }
  function fixturePanel(fixture, chosenTheme) {
    const status = note('Preview and theme are unverified. Waiting for the fixture adapter; an iframe load alone does not confirm availability.', 'wb-status');
    let src;
    try { src = fixtureURL(fixture.url, { theme: chosenTheme }); }
    catch (error) { return note(error.message, 'wb-error'); }
    const frame = element('iframe', { title: `${fixture.title} · ${chosenTheme}`, src, sandbox: 'allow-scripts', referrerpolicy: 'no-referrer', loading: 'lazy' });
    // A sandboxed origin is opaque. Verify the exact frame window plus a fresh nonce,
    // never trust a message solely because its origin is "null".
    const requestId = crypto.randomUUID();
    const timeout = setTimeout(() => { status.textContent = 'Preview and theme remain unverified. The fixture may be offline, blocked, or missing a theme adapter. Open the source fixture to inspect it.'; }, 8000);
    cleanup.push(() => clearTimeout(timeout));
    const requestTheme = () => frame.contentWindow?.postMessage({ type: 'workbench:set-theme', theme: chosenTheme, requestId }, '*');
    const onMessage = event => {
      if (event.source === frame.contentWindow && event.data?.type === 'workbench:theme-ready') { requestTheme(); return; }
      if (event.source !== frame.contentWindow || event.data?.type !== 'workbench:theme-applied' || event.data?.requestId !== requestId || event.data?.theme !== chosenTheme) return;
      clearTimeout(timeout);
      status.textContent = `Theme adapter confirmed: ${chosenTheme}.`;
    };
    window.addEventListener('message', onMessage);
    cleanup.push(() => window.removeEventListener('message', onMessage));
    frame.addEventListener('error', () => {
      clearTimeout(timeout);
      status.textContent = 'Preview failed to load. Check that the app server is running and permits embedded fixtures.';
    });
    frame.addEventListener('load', () => {
      requestTheme();
    });
    const stage = element('div', { class: 'wb-stage', 'data-viewport': viewport, 'data-interactive': 'false' }, frame);
    const interaction = element('button', { type: 'button', class: 'wb-interaction-toggle', 'aria-pressed': 'false' }, 'Interact with preview');
    const setInteractive = active => {
      stage.dataset.interactive = String(active);
      frame.inert = !active;
      interaction.setAttribute('aria-pressed', String(active));
      interaction.textContent = active ? 'Done interacting' : 'Interact with preview';
    };
    setInteractive(false);
    interaction.addEventListener('click', () => setInteractive(stage.dataset.interactive !== 'true'));
    // Keep the opaque sandbox intact. An explicit mode lets the page own gestures
    // without intercepting or synthesizing events inside application documents.
    const exitOnOutsideClick = event => {
      if (!stage.contains(event.target) && event.target !== interaction) setInteractive(false);
    };
    document.addEventListener('pointerdown', exitOnOutsideClick);
    cleanup.push(() => document.removeEventListener('pointerdown', exitOnOutsideClick));
    return element('article', { class: 'wb-fixture' }, element('div', { class: 'wb-panel-heading' }, element('h3', {}, titleCase(chosenTheme)), sourceLink('Open source fixture ↗', fixture.url)), interaction, stage, status,
      note('Isolated preview: storage, same-origin access, popups, forms, and top navigation are disabled. A blank preview may mean the app is offline, blocks embedding, or needs capabilities disabled here.'));
  }
  function fixtures(collection) {
    const items = (collection.fixtures ?? []).filter(item => item.section === section);
    if (!items.length && collection.kind === 'reference') return element('div', { class: 'wb-empty' }, element('h2', {}, `Analysis only · no ${section} specimens`), note('This independent study is incomplete. No runnable specimen is registered for this section; imported prose is not a working UI.'));
    if (!items.length) return element('div', { class: 'wb-empty' }, element('h2', {}, `No ${section} yet`), note('Add an app-owned fixture URL to this collection. The engine does not generate substitute UI.'));
    const fixture = items.find(item => item.id === fixtureID) ?? items[0];
    fixtureID = fixture.id;
    const panel = element('div', {}, select('Fixture', items.map(item => [item.id, item.title]), fixture.id, value => { fixtureID = value; }));
    if (fixture.description) panel.append(note(fixture.description));
    if (fixture.states?.length) panel.append(note(`Recorded fixture states: ${fixture.states.join(', ')}. These are authored examples, not verified test results.`));
    panel.append(element('div', { class: `wb-previews${comparison ? ' wb-compare' : ''}` }, fixturePanel(fixture, theme), ...(comparison ? [fixturePanel(fixture, (collection.themes ?? []).find(item => item !== theme) ?? theme)] : [])));
    return panel;
  }
  function sources(collection) {
    const data = element('dl', { class: 'wb-metadata' });
    for (const [name, value] of Object.entries({ Kind: collection.kind, Renderer: collection.renderer, ...(collection.source?.publicVersion ? {Version: collection.source.publicVersion} : {Revision: collection.source?.revision ?? (collection.source?.withheldRevisions?.includes('revision') ? 'Not publicly verified (withheld)' : undefined)}), Path: collection.source?.path, Provenance: collection.provenance?.status, ...(collection.publicRelease?.status ? {Preview: collection.publicRelease.status} : {}), License: collection.license?.spdx })) data.append(element('dt', {}, name), element('dd', {}, String(value ?? 'Not recorded')));
    return element('article', { class: 'wb-panel' }, element('h2', {}, 'Source & provenance'), note('The source app remains the authority for its UI. Reference collections must not imply authorship or redistribution rights.'), data,
      collection.source?.visibility==='local-only' ? note('Local-only source: '+collection.id+'. No public repository or redistribution permission is implied.') : collection.source?.repository ? sourceLink('Source repository ↗', collection.source.repository) : note('No source repository recorded.'),
      note(collection.license?.note ?? 'No license note recorded.'), element('h3', {}, 'Reference sources'), ...(collection.provenance?.sources ?? []).map(source => typeof source === 'string' ? sourceLink(source, source) : sourceLink(source.title ?? source.url ?? 'Source', source.url)),
      ...(collection.kind === 'reference' ? [studyPanel(collection)] : []),
      element('details', {}, element('summary', {}, 'Manifest data'), element('pre', {}, JSON.stringify({ ...collection, tokensData: undefined }, null, 2))));
  }
  function studyPanel(collection) {
    const study = collection.studyData;
    const panel = element('section', { class: 'wb-study' }, element('h2', {}, 'Independent reference analysis'));
    panel.append(note('Not official. Imported observations and inferred tokens are unverified and incomplete. No endorsement, live-site verification, or asset license is implied.'));
    if (!study) { panel.append(note('No study document recorded. Provenance, homepage, and completeness are unknown.')); return panel; }
    panel.append(note(`Source: ${study.source?.path ?? 'Not recorded'} · revision ${study.source?.revision ?? 'Not recorded'}`));
    if (study.source?.sha256) panel.append(note(`Analysis SHA-256: ${study.source.sha256}`));
    if (study.sourceName) panel.append(note(`Original source name: ${study.sourceName}. Display title may be normalized or inferred; it is not a first-party attribution.`));
    if (study.source?.url) panel.append(sourceLink('Read pinned analysis source ↗', study.source.url));
    panel.append(note(`Homepage candidates in imported source: ${study.homepage?.status ?? 'Not recorded'}. A source-mentioned URL is not proof of a verified or current homepage.`));
    const verification = study.homepage?.verification;
    if (verification) {
      panel.append(note(`Supplemental homepage check: ${verification.status ?? 'unknown'}${verification.checkedAt ? ` · ${verification.checkedAt}` : ''}. This does not verify design fidelity or token values.`));
      if (verification.status === 'verified' && verification.url) panel.append(sourceLink('Verified official homepage ↗', verification.url));
      if (verification.notes) panel.append(note(typeof verification.notes === 'string' ? verification.notes : JSON.stringify(verification.notes)));
    }
    for (const candidate of study.homepage?.candidates ?? []) panel.append(element('p', {}, sourceLink('Source-mentioned homepage candidate ↗', candidate.url)));
    panel.append(note(`Missing fields: ${study.completeness?.missingFields ? (study.completeness.missingFields.join(', ') || 'None listed; completeness is not established') : 'Not recorded'}. Token roles: ${study.completeness?.tokenRoles ?? 'unknown'}.`));
    if (study.limitations?.length) panel.append(element('ul', {}, ...study.limitations.map(text => element('li', {}, text))));
    panel.append(element('h3', {}, 'Extracted analysis sections'));
    for (const item of study.sections ?? []) panel.append(element('details', { 'data-source-line': item.line }, element('summary', {}, item.heading), element('pre', {}, item.text)));
    if (!study.sections?.length) panel.append(note('No narrative sections recorded.'));
    if (study.analysis) panel.append(element('details', {}, element('summary', {}, 'Imported structured analysis (unverified)'), element('pre', {}, JSON.stringify(study.analysis, null, 2))));
    return panel;
  }
  function inventoryPanel(collection) {
    const inventory = collection.inventoryData;
    const panel = element('section', { class: 'wb-panel wb-inventory' }, element('h2', {}, 'Recorded inventory coverage'));
    panel.append(note('Authored coverage and recorded evidence only. This view does not run checks or certify completeness, accessibility, visual fidelity, or live success.'));
    if (!inventory) { panel.append(note('No inventory recorded. Coverage is unknown.')); return panel; }
    const items = inventory.items ?? [];
    if(inventory.sourceSnapshot)panel.append(note(`Unversioned source: ${inventory.sourceSnapshot.files.length} source files pinned by SHA-256. These are file identities, not a Git commit.`));
    panel.append(note(collection.source?.publicVersion ? `Preview version: ${collection.source.publicVersion}` : `Reviewed revision: ${inventory.reviewedRevision ?? (inventory.withheldRevisions?.includes('reviewedRevision') ? 'Not publicly verified (withheld)' : 'Not recorded')}`));
    panel.append(note(items.length ? `${items.length} recorded items · ${['covered','partial','excluded','blocked'].map(status => `${items.filter(item => item.coverage === status).length} ${status}`).join(' · ')}` : 'Empty inventory. Coverage is unknown, not complete.'));
    function table(headers, rows) {
      return element('div', { class: 'wb-table-scroll' }, element('table', { class: 'wb-tokens' }, element('thead', {}, element('tr', {}, ...headers.map(label => element('th', { scope: 'col' }, label)))), element('tbody', {}, ...rows.map(row => element('tr', {}, ...row.map(text => element('td', {}, String(text ?? 'Not recorded'))))))));
    }
    if (items.length) panel.append(table(['Item / kind','Source paths','Fixture references','Recorded states','Coverage','Notes'], items.map(item => [ `${item.title} (${item.id}) · ${item.kind}`, (item.source ?? []).join('\n'), (item.fixtures ?? []).join(', ') || 'None', (item.states ?? []).join(', ') || 'None recorded', item.coverage, item.notes || 'None'])));
    panel.append(element('h3', {}, 'Recorded checks'), note('Statuses below are historical assertions from the inventory, not checks executed by this workbench. Scope limits each result.'));
    if (inventory.checks?.length) panel.append(table(['Check','Recorded status','Command','Scope','Evidence path'], inventory.checks.map(check => [check.label, `Recorded: ${check.status}`, check.command, check.scope, check.evidence ?? 'None recorded'])));
    else panel.append(note('No check results recorded.'));
    return panel;
  }
  function checks(collection) {
    const checks = [ ['Schema version', collection.schemaVersion === 1], [collection.source?.publicVersion ? 'Source version recorded' : 'Source revision recorded', Boolean(collection.source?.publicVersion ?? collection.source?.revision)], ['License recorded', Boolean(collection.license?.spdx)], ['Provenance recorded', Boolean(collection.provenance?.status)], ['Tokens loaded', Boolean(collection.tokensData)], ['Fixture URLs use HTTP(S)', (collection.fixtures ?? []).every(fixture => { try { safeURL(fixture.url); return true; } catch { return false; } })] ];
    return element('article', { class: 'wb-panel' }, element('h2', {}, 'Collection checks'), note('Metadata checks only. These do not certify accessibility, visual fidelity, licensing, or whether a remote fixture is reachable.'), element('ul', { class: 'wb-checks' }, ...checks.map(([label, pass]) => element('li', {}, element('span', { class: pass ? 'wb-pass' : 'wb-warning' }, pass ? 'Recorded' : 'Needs attention'), label))), inventoryPanel(collection));
  }
  function render(focusKey) {
    if (disposed) return;
    clear();
    const collection = current();
    const hasScreens = (collection?.fixtures ?? []).some(item => item.section === 'screens');
    if (collection?.kind === 'reference' && section === 'screens' && !hasScreens) section = 'components';
    if ((collection?.themes?.length ?? 0) < 2) comparison = false;
    if (collection && !(collection.themes ?? ['light']).includes(theme)) theme = collection.themes?.[0] ?? 'light';
    const indicatorWas = container.querySelector('.wb-nav-current')?.getBoundingClientRect();
    // What changed since the last render, so a skin can animate only that: 'collection', 'section' or 'refresh'.
    const enter = !entered || entered.selected !== selected ? 'collection' : entered.section !== section ? 'section' : 'refresh';
    entered = { selected, section };
    const shell = element('div', { class: 'wb-shell', 'data-wb-skin': skin, 'data-wb-section': section, 'data-wb-enter': enter });
    const sidebar = element('aside', { class: 'wb-sidebar' }, element('div', { class: 'wb-brand' }, element('div', {}, element('strong', {}, options.title ?? 'Design workbench'))));
    const collectionPicker = element('div');
    function paintCollections() {
      const matches = collections.filter(item => `${item.title} ${item.id} ${item.summary ?? ''}`.toLowerCase().includes(collectionFilter.toLowerCase()));
      const control = select('Collection', matches.length ? matches.map(item => [item.id, item.title]) : [['', 'No matching '+(options.collectionNoun??'studies')]], matches.some(item => item.id === selected) ? selected : '', value => { selected = value; fixtureID = undefined; tokenFilter = ''; options.onCollectionChange?.(value); });
      const picker = control.querySelector('select');
      if (matches.length && !matches.some(item => item.id === selected)) picker.prepend(element('option', { value: '', selected: '', disabled: '' }, 'Choose a matching collection'));
      picker.disabled = !matches.length;
      collectionPicker.replaceChildren(control);
      if (options.searchCollections) collectionPicker.append(note(`${matches.length} of ${collections.length} ${options.collectionNoun??'studies'}${matches.length ? '' : ' · No matches. Clear the search to try again.'}`));
    }
    if (options.searchCollections) sidebar.append(element('label', { class: 'wb-control' }, element('span', {}, options.searchLabel??'Search reference studies'), element('input', { type: 'search', 'aria-label': options.searchLabel??'Search reference studies', placeholder: 'Name or keyword…', value: collectionFilter, oninput: event => { collectionFilter = event.target.value; paintCollections(); } })));
    paintCollections(); sidebar.append(collectionPicker);
    sidebar.append(element('nav', { 'aria-label': 'Workbench sections' }, ...SECTIONS.map(item => {
      const unavailable = item === 'screens' && collection?.kind === 'reference' && !hasScreens;
      return element('button', { type: 'button', class: section === item ? 'wb-active' : '', 'aria-current': section === item ? 'page' : null, disabled: unavailable ? '' : null, 'aria-disabled': unavailable ? 'true' : null, title: unavailable ? 'No screens are registered for this study.' : null, 'data-wb-focus': `section:${item}`, onclick: () => { if (unavailable || section === item) return; update(() => { section = item; fixtureID = undefined; }, `section:${item}`); } }, element('span', {class:'wb-nav-label'}, titleCase(item)), section === item ? element('span', { class: 'wb-nav-current', 'aria-hidden': 'true' }) : null);
    })));
    const main = element('main', { class: 'wb-main' });
    const controls = element('div', { class: 'wb-controls' }, select('Theme', collection?.themes?.length ? collection.themes : ['light'], theme, value => { theme = value; }), select('Viewport', [['responsive', 'Responsive'], ['mobile', 'Mobile · 390'], ['tablet', 'Tablet · 768'], ['desktop', 'Desktop · 1280']], viewport, value => { viewport = value; }), element('label', { class: 'wb-compare-control' }, element('input', { type: 'checkbox', ...(comparison ? { checked: '' } : {}), 'data-wb-focus': 'compare', onchange: event => { const next = event.target.checked; update(() => { comparison = next; }, 'compare'); } }), 'Compare themes'));
    main.append(element('header', { class: 'wb-header' }, element('div', {}, element('p', { class: 'wb-eyebrow' }, collection?.title ?? 'Your workspace'), element('h1', {}, titleCase(section)), note(collection?.summary ?? 'A clean starting point, ready for your first collection.')), controls));
    const signature = collection && signaturePanel(collection);
    if (signature) main.append(signature);
    if (collection?.kind === 'reference') {
      const homepage = collection.studyData?.homepage?.verification;
      const original = homepage?.url ? sourceLink('Open original site ↗', homepage.url) : element('button', { type: 'button', disabled: '', title: 'Original site is not reliably identified in the available evidence.' }, 'Open original site · unavailable');
      if (homepage?.url) original.classList.add('wb-action');
      main.append(element('aside', { class: 'wb-reference-notice', 'data-provenance-status': collection.provenance?.status, 'data-homepage-status': homepage?.status ?? 'unknown' }, element('strong', {}, 'Independent reference study'), original));
    }
    if (!collection) main.append(element('section', { class: 'wb-empty' }, element('h2', {}, 'Make room for your system'), note('No collections are installed. Add your own manifest and tokens, then register it in collections.json.'), note('Bring DOM, React, or any app that can expose a fixture URL. Your app keeps control of its own rendering.')));
    else main.append(section === 'foundations' ? foundations(collection) : section === 'sources' ? sources(collection) : section === 'checks' ? checks(collection) : fixtures(collection));
    if (collection?.kind === 'reference' && (collection.themes?.length ?? 0) < 2) controls.querySelector('input[type=checkbox]').disabled = true;
    shell.append(sidebar, main); container.replaceChildren(shell);
    const indicator = shell.querySelector('.wb-nav-current'), indicatorNow = indicator?.getBoundingClientRect();
    // Distance from the previous section's indicator, for a skin that slides it into place.
    if (indicatorWas?.height && indicatorNow?.height) indicator.style.setProperty('--wb-nav-shift', `${indicatorWas.top - indicatorNow.top}px`);
    if (focusKey) [...shell.querySelectorAll('[data-wb-focus]')].find(node => node.dataset.wbFocus === focusKey && !node.disabled)?.focus({ preventScroll: true });
  }
  render();
  return { setSkin(next) { if (disposed) return; skin = skinName(next); const shell = container.querySelector('.wb-shell'); if (shell) shell.dataset.wbSkin = skin; }, destroy() { clear(); disposed = true; container.replaceChildren(); }, setCollections(next) { collections = next; if (!current()) selected = collections[0]?.id; render(); },
    showCollection(id) { if (disposed || id === selected || !collections.some(item => item.id === id)) return; update(() => { selected = id; fixtureID = undefined; tokenFilter = ''; collectionFilter = ''; options.onCollectionChange?.(id); }); } };
}
