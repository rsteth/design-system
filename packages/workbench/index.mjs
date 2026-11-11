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
export function mountWorkbench(container, options = {}) {
  if (!container?.replaceChildren) throw new TypeError('A DOM container is required');
  let collections = options.collections ?? [];
  let skin = skinName(options.skin);
  let selected = options.initialCollection ?? collections[0]?.id, section = SECTIONS.includes(options.initialSection) ? options.initialSection : 'foundations', theme = 'light', viewport = 'responsive', comparison = false, fixtureID;
  let tokenFilter = '', collectionFilter = '', disposed = false;
  let cleanup = [];
  const clear = () => { cleanup.forEach(fn => fn()); cleanup = []; };
  const current = () => collections.find(item => item.id === selected);
  const note = (text, kind = '') => element('p', { class: `wb-note ${kind}` }, text);
  function select(label, values, value, change) {
    return element('label', { class: 'wb-control' }, element('span', {}, label === 'Theme' ? 'Preview theme' : label), element('select', { 'aria-label': label, onchange: event => change(event.target.value) }, ...values.map(item => {
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
    const card = row => {
      const group = groupFor(row), value = String(row.value), evidence = studyTokens.get(row.name);
      const label = element('code', { class: 'wb-token-name', title: row.name }, group === 'color' ? row.name.replace(/^colors?\./, '') : row.name);
      const metadata = element('div', { class: 'wb-token-meta' }, label, element('code', { class: 'wb-token-value', title: value }, group === 'color' ? hexLabel(value) : value));
      if (group === 'other') metadata.append(element('span', { class: 'wb-token-type' }, row.type ?? 'unknown'));
      let preview;
      if (group === 'color') {
        const swatch = element('span', { class: 'wb-swatch', 'aria-hidden': 'true' });
        // Setting one validated property cannot introduce remote CSS or markup.
        if (CSS.supports('color', value)) swatch.style.backgroundColor = value;
        preview = element('div', { class: 'wb-color-preview', 'aria-hidden': 'true' }, swatch);
      } else if (group === 'dimensions') {
        const radius = /(?:^|\.)(?:radius|radii|rounded)(?:\.|$)|borderradius/i.test(row.name);
        preview = element('div', { class: 'wb-dimension-preview', 'aria-hidden': 'true' }, element('span', { class: radius ? 'wb-radius-diagram' : 'wb-length-diagram' }));
      } else if (group === 'fonts') {
        preview = element('div', { class: 'wb-font-preview' }, element('span', { class: 'wb-font-monogram', 'aria-hidden': 'true' }, 'Aa'), element('p', {}, 'The quick brown fox jumps over the lazy dog.'), element('span', { class: 'wb-font-characters' }, '0123456789 · Aa Bb Cc'));
        if (CSS.supports('font-family', value)) preview.style.fontFamily = value;
      }
      return element('li', { class: `wb-token-card wb-token-${group}`, 'data-token-name': row.name, 'data-source-path': evidence?.sourcePath, 'data-source-line': evidence?.evidence?.line }, preview, metadata);
    };
    const paint = () => {
      const query = tokenFilter.toLowerCase();
      const filtered = rows.filter(row => `${row.name} ${row.value} ${row.type === 'color' ? hexLabel(row.value) : ''}`.toLowerCase().includes(query));
      sections.replaceChildren();
      for (const [id, title] of [['color', 'Color'], ['dimensions', 'Dimensions'], ['fonts', 'Fonts'], ['other', 'Other tokens']]) {
        const tokens = filtered.filter(row => groupFor(row) === id);
        if (!tokens.length) continue;
        const heading = element('h3', {}, title);
        const group = element('section', { class: `wb-foundation-group wb-foundation-${id}`, 'aria-label': title }, heading);
        if (id === 'dimensions') group.append(note('Diagrams are not to scale.'));
        if (id === 'fonts') group.append(note('Uses fonts available on this device. Missing families fall back.'));
        group.append(element('ul', { class: 'wb-token-grid' }, ...tokens.map(card)));
        sections.append(group);
      }
      status.textContent = `${filtered.length} ${filtered.length === 1 ? 'token' : 'tokens'} shown.`;
      if (!filtered.length) sections.append(note(rows.length ? 'No matching tokens.' : 'No tokens in this collection.'));
    };
    if (collection.kind === 'reference' && collection.fixtures?.some(f => f.id.endsWith('-recipe-sheet'))) panel.append(element('div', { class: 'wb-panel-heading' }, note('Explore visual foundations and source-linked component interpretations.'), element('button', { type: 'button', onclick: () => { section = 'components'; fixtureID = collection.fixtures.find(f => f.id.endsWith('-recipe-sheet')).id; render(); } }, 'Open visual workbench')));
    panel.append(element('div', { class: 'wb-panel-heading' }, element('div', {}, element('h2', {}, 'Token inspector'), rows.length ? element('span', { class: 'wb-token-mode' }, `Mode: ${rows[0].mode}`) : null), element('input', { type: 'search', placeholder: 'Filter tokens…', value: tokenFilter, 'aria-label': 'Filter tokens', oninput: event => { tokenFilter = event.target.value; paint(); } })));
    paint(); panel.append(status, sections);
    const aliases = Object.entries(collection.tokensData?.aliases ?? {});
    if (aliases.length) panel.append(element('details', {}, element('summary', {}, `Compatibility aliases (${aliases.length})`), element('pre', {}, aliases.map(([alias, token]) => `${alias} → ${token}`).join('\n'))));
    if (collection.kind === 'reference') panel.append(studyPanel(collection));
    return panel;
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
    const stage = element('div', { class: 'wb-stage', 'data-viewport': viewport }, frame);
    return element('article', { class: 'wb-fixture' }, element('div', { class: 'wb-panel-heading' }, element('h3', {}, titleCase(chosenTheme)), sourceLink('Open source fixture ↗', fixture.url)), stage, status,
      note('Isolated preview: storage, same-origin access, popups, forms, and top navigation are disabled. A blank preview may mean the app is offline, blocks embedding, or needs capabilities disabled here.'));
  }
  function fixtures(collection) {
    const items = (collection.fixtures ?? []).filter(item => item.section === section);
    if (!items.length && collection.kind === 'reference') return element('div', { class: 'wb-empty' }, element('h2', {}, `Analysis only · no ${section} specimens`), note('This independent study is incomplete. No runnable specimen is registered for this section; imported prose is not a working UI.'));
    if (!items.length) return element('div', { class: 'wb-empty' }, element('h2', {}, `No ${section} yet`), note('Add an app-owned fixture URL to this collection. The engine does not generate substitute UI.'));
    const fixture = items.find(item => item.id === fixtureID) ?? items[0];
    fixtureID = fixture.id;
    const panel = element('div', {}, select('Fixture', items.map(item => [item.id, item.title]), fixture.id, value => { fixtureID = value; render(); }));
    if (fixture.description) panel.append(note(fixture.description));
    if (fixture.states?.length) panel.append(note(`Recorded fixture states: ${fixture.states.join(', ')}. These are authored examples, not verified test results.`));
    panel.append(element('div', { class: `wb-previews${comparison ? ' wb-compare' : ''}` }, fixturePanel(fixture, theme), ...(comparison ? [fixturePanel(fixture, (collection.themes ?? []).find(item => item !== theme) ?? theme)] : [])));
    return panel;
  }
  function sources(collection) {
    const data = element('dl', { class: 'wb-metadata' });
    for (const [name, value] of Object.entries({ Kind: collection.kind, Renderer: collection.renderer, ...(collection.source?.publicVersion ? {Version: collection.source.publicVersion} : {Revision: collection.source?.revision ?? (collection.source?.withheldRevisions?.includes('revision') ? 'Not publicly verified (withheld)' : undefined)}), Path: collection.source?.path, Provenance: collection.provenance?.status, ...(collection.publicRelease?.status ? {Preview: collection.publicRelease.status} : {}), License: collection.license?.spdx })) data.append(element('dt', {}, name), element('dd', {}, String(value ?? 'Not recorded')));
    return element('article', { class: 'wb-panel' }, element('h2', {}, 'Source & provenance'), note('The source app remains the authority for its UI. Reference collections must not imply authorship or redistribution rights.'), data,
      collection.source?.repository ? sourceLink('Source repository ↗', collection.source.repository) : note('No source repository recorded.'),
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
  function render() {
    if (disposed) return;
    clear();
    const collection = current();
    const hasScreens = (collection?.fixtures ?? []).some(item => item.section === 'screens');
    if (collection?.kind === 'reference' && section === 'screens' && !hasScreens) section = 'components';
    if ((collection?.themes?.length ?? 0) < 2) comparison = false;
    if (collection && !(collection.themes ?? ['light']).includes(theme)) theme = collection.themes?.[0] ?? 'light';
    const shell = element('div', { class: 'wb-shell', 'data-wb-skin': skin });
    const sidebar = element('aside', { class: 'wb-sidebar' }, element('div', { class: 'wb-brand' }, element('div', {}, element('strong', {}, options.title ?? 'Design workbench'))));
    const collectionPicker = element('div');
    function paintCollections() {
      const matches = collections.filter(item => `${item.title} ${item.id} ${item.summary ?? ''}`.toLowerCase().includes(collectionFilter.toLowerCase()));
      const control = select('Collection', matches.length ? matches.map(item => [item.id, item.title]) : [['', options.searchCollections ? 'No matching studies' : 'No collections']], matches.some(item => item.id === selected) ? selected : '', value => { selected = value; fixtureID = undefined; tokenFilter = ''; options.onCollectionChange?.(value); render(); });
      const picker = control.querySelector('select');
      if (matches.length && !matches.some(item => item.id === selected)) picker.prepend(element('option', { value: '', selected: '', disabled: '' }, 'Choose a matching study'));
      picker.disabled = !matches.length;
      collectionPicker.replaceChildren(control);
      if (options.searchCollections) collectionPicker.append(note(`${matches.length} of ${collections.length} studies${matches.length ? '' : ' · No matching studies. Clear the search to try again.'}`));
    }
    if (options.searchCollections) sidebar.append(element('label', { class: 'wb-control' }, element('span', {}, 'Search reference studies'), element('input', { type: 'search', 'aria-label': 'Search reference studies', placeholder: 'Name or keyword…', value: collectionFilter, oninput: event => { collectionFilter = event.target.value; paintCollections(); } })));
    paintCollections(); sidebar.append(collectionPicker);
    sidebar.append(element('nav', { 'aria-label': 'Workbench sections' }, ...SECTIONS.map(item => {
      const unavailable = item === 'screens' && collection?.kind === 'reference' && !hasScreens;
      return element('button', { type: 'button', class: section === item ? 'wb-active' : '', 'aria-current': section === item ? 'page' : null, disabled: unavailable ? '' : null, 'aria-disabled': unavailable ? 'true' : null, title: unavailable ? 'No screens are registered for this study.' : null, onclick: () => { if (unavailable) return; section = item; fixtureID = undefined; render(); } }, element('span', {class:'wb-nav-label'}, titleCase(item)));
    })));
    const main = element('main', { class: 'wb-main' });
    const controls = element('div', { class: 'wb-controls' }, select('Theme', collection?.themes?.length ? collection.themes : ['light'], theme, value => { theme = value; render(); }), select('Viewport', [['responsive', 'Responsive'], ['mobile', 'Mobile · 390'], ['tablet', 'Tablet · 768'], ['desktop', 'Desktop · 1280']], viewport, value => { viewport = value; render(); }), element('label', { class: 'wb-compare-control' }, element('input', { type: 'checkbox', ...(comparison ? { checked: '' } : {}), onchange: event => { comparison = event.target.checked; render(); } }), 'Compare themes'));
    main.append(element('header', { class: 'wb-header' }, element('div', {}, element('p', { class: 'wb-eyebrow' }, collection?.title ?? 'Your workspace'), element('h1', {}, titleCase(section)), note(collection?.summary ?? 'A clean starting point, ready for your first collection.')), controls));
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
  }
  render();
  return { setSkin(next) { if (disposed) return; skin = skinName(next); const shell = container.querySelector('.wb-shell'); if (shell) shell.dataset.wbSkin = skin; }, destroy() { clear(); disposed = true; container.replaceChildren(); }, setCollections(next) { collections = next; if (!current()) selected = collections[0]?.id; render(); } };
}
