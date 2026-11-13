import { mountPublicCapture } from './public-capture.mjs';
import { SCENES, PROFILES, CAPTURE_VERSION, sceneURL, artifactURL, verifyPNG } from '../../packages/capture/scenes.mjs';
const node = (tag, attrs = {}, ...children) => {
  const result = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (name.startsWith('on')) result.addEventListener(name.slice(2), value);
    else if (value != null) result.setAttribute(name, String(value));
  }
  result.append(...children.filter(child => child != null));
  return result;
};
export function mountCaptureStudio(container, options = {}) {
  const params = new URL(location.href).searchParams;
  if (params.get('capture') !== 'local' && !params.has('scene')) return mountPublicCapture(container);
  let profile = PROFILES.find(item => item.id === params.get('profile')) ?? PROFILES[0];
  let disposed = false, scene = SCENES.find(item => item.id === params.get('scene')) ?? SCENES[0], theme = params.get('theme') === 'dark' ? 'dark' : 'light', refreshGeneration = 0, copyGeneration = 0, report, frame, probe, timeout, resize, exportGeneration = 0, exportURLs = [];
  const base = options.base ?? import.meta.url;
  const root = node('main', { class: 'cs-shell', 'data-capture-studio': '', 'data-wb-skin': options.skin ?? 'workbench' });
  const status = node('p', { class: 'cs-status', role: 'status', 'aria-live': 'polite' });
  const stage = node('div', { class: 'cs-stage', 'aria-label': 'Intentional 4:3 scene preview' });
  const details = node('div', { class: 'cs-details' });
  const exports = node('section', { class: 'cs-exports', 'aria-label': 'Local review exports' });
  const command = node('code', { class: 'cs-command' });
  const selector = node('select', { 'aria-label': 'Capture scene', onchange: event => { scene = SCENES.find(item => item.id === event.target.value); show(); } }, ...SCENES.map(item => node('option', { value: item.id }, item.title)));
  const themeSelector = node('select', { 'aria-label': 'Capture theme', onchange: event => { theme = event.target.value; show(); } }, ...['light', 'dark'].map(value => node('option', { value }, value[0].toUpperCase() + value.slice(1))));
  const profileSelector = node('select', { 'aria-label': 'Capture profile', onchange: event => { profile = PROFILES.find(item => item.id === event.target.value); show(); } }, ...[...new Set(PROFILES.map(item => item.group))].map(group => node('optgroup', { label: group }, ...PROFILES.filter(item => item.group === group).map(item => node('option', { value: item.id }, `${item.title} · ${item.output.width} × ${item.output.height}`)))));
  selector.value = scene.id; themeSelector.value = theme; profileSelector.value = profile.id;
  const frameLabel = node('span', { class: 'cs-frame-label' });
  const copyStatus = node('p', { class: 'cs-copy-status', role: 'status', 'aria-live': 'polite' });
  const batchSelect = (label, choices) => node('select', { 'aria-label': label, onchange: updateCommand }, ...choices.map(([value, title]) => node('option', { value }, title)));
  const batchScene = batchSelect('Command scenes', [['selected','Selected scene'],['all','All scenes']]);
  const batchProfile = batchSelect('Command profiles', [['selected','Selected format'],['all','All formats']]);
  const batchTheme = batchSelect('Command themes', [['selected','Selected theme'],['both','Both themes']]);
  function updateCommand() {
    command.textContent = `npm run capture -- --scene ${batchScene.value === 'all' ? 'all' : scene.id} --profile ${batchProfile.value === 'all' ? 'all' : profile.id} --theme ${batchTheme.value === 'both' ? 'both' : theme}`;
    copyGeneration++; copyStatus.textContent = '';
  }
  async function copy(text, label) {
    const generation = ++copyGeneration;
    try { await navigator.clipboard.writeText(text); if (!disposed && generation === copyGeneration) copyStatus.textContent = `${label} copied.`; }
    catch { if (!disposed && generation === copyGeneration) copyStatus.textContent = `Clipboard unavailable. Select and copy the ${label.toLowerCase()} manually.`; }
  }
  const message = event => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== 'null') return;
    const data = event.data;
    if (data?.type !== 'capture:ready' || data.sceneId !== scene.id || data.version !== scene.version || data.theme !== theme || data.profile !== profile.id) return;
    clearInterval(probe); clearTimeout(timeout);
    status.textContent = `Scene ready · local app-owned web preview · ${profile.viewport.width} × ${profile.viewport.height} CSS px`;
    status.dataset.state = 'ready';
  };
  addEventListener('message', message);
  function stopPreview() { clearInterval(probe); clearTimeout(timeout); resize?.disconnect(); frame?.remove(); frame = null; }
  async function renderExports() {
    const version = ++exportGeneration;
    exportURLs.forEach(url => URL.revokeObjectURL(url)); exportURLs = [];
    exports.replaceChildren(node('h2', {}, 'Review before promotion'));
    const entry = report?.captures?.find(item => item.sceneId === scene.id && item.theme === theme && (item.profileId ?? 'stethem-thumb') === profile.id);
    if (!entry) {
      exports.append(node('p', {}, 'No local export loaded for this scene, theme and format. Run the command below, then refresh exports. Missing output is never treated as a successful capture.'));
      return;
    }
    try {
      const loading = node('p', { role: 'status' }, 'Verifying local export files and hashes…'); exports.append(loading);
      const selectedProfile = profile;
      if (report.schemaVersion === 2 && (entry.viewport?.width !== profile.viewport.width || entry.viewport?.height !== profile.viewport.height || entry.deviceScaleFactor !== profile.deviceScaleFactor)) throw new Error('Profile mismatch');
      const artifacts = [['original', selectedProfile.output]];
      if (selectedProfile.derivative) artifacts.push(['card', selectedProfile.derivative]);
      const buffers = await Promise.all(artifacts.map(async ([key, dimensions]) => {
        const response = await fetch(artifactURL(entry[key].path, base), { cache: 'no-store', credentials: 'omit' });
        if (!response.ok) throw new Error('Missing export file');
        const bytes = await response.arrayBuffer(); await verifyPNG(bytes, entry[key], dimensions);
        // Decode too: a plausible PNG header alone does not establish valid pixels.
        const blob = new Blob([bytes], { type: 'image/png' }); const bitmap = await createImageBitmap(blob); const valid = bitmap.width === dimensions.width && bitmap.height === dimensions.height; bitmap.close(); if (!valid) throw new Error('Decoded dimensions mismatch');
        return blob;
      }));
      if (disposed || version !== exportGeneration) return;
      loading.remove();
      const urls = buffers.map(blob => URL.createObjectURL(blob)); exportURLs = [...urls];
      const provenanceURL = URL.createObjectURL(new Blob([JSON.stringify(entry, null, 2) + '\n'], { type: 'application/json' })); exportURLs.push(provenanceURL);
      const proofSize = selectedProfile.derivative ?? selectedProfile.output;
      exports.append(node('p', { class: 'cs-export-note' }, `Recorded ${entry.capturedAt ?? report.createdAt} · scene ${entry.sceneVersion} · ${entry.source.dirty ? 'local modifications present' : 'clean source'} · ${entry.source.revision.slice(0, 12)}`));
      exports.append(node('p', {}, 'This is a dated local export, not a live source check, native app screenshot or deployed-release claim. Regenerate after changing app source.'));
      const image = node('img', { src: urls[urls.length - 1], alt: `${scene.title} reviewed-format capture, ${theme} theme`, width: proofSize.width, height: proofSize.height, loading: 'lazy' });
      exports.append(node('figure', { class: 'cs-card-proof' }, image, node('figcaption', {}, `Verified PNG · ${proofSize.width} × ${proofSize.height} · complete frame, no cropping`)));
      exports.append(node('div', { class: 'cs-actions' }, ...artifacts.map(([key, dimensions], index) => node('a', { href: urls[index], download: `${scene.id}-${theme}-${profile.id}-${key}.png` }, key === 'original' ? 'Save original PNG' : `Save ${dimensions.width} × ${dimensions.height} PNG`)), node('a', { href: provenanceURL, download: `${scene.id}-${theme}-${profile.id}-provenance.json` }, 'Save provenance JSON')));
      const provenance = node('details', { class: 'cs-provenance' }, node('summary', {}, 'Source and export provenance'), node('pre', {}, JSON.stringify(entry, null, 2)));
      exports.append(provenance);
    } catch {
      if (disposed || version !== exportGeneration) return;
      exports.replaceChildren(node('h2', {}, 'Review before promotion'), node('p', { role: 'alert' }, 'The local export could not be verified. Files are missing, damaged, or do not match their recorded hashes. Regenerate before using the image.'));
    }
  }
  function show() {
    if (disposed) return;
    stopPreview();
    const url = new URL(location.href); url.searchParams.set('library', 'capture'); url.searchParams.set('scene', scene.id); url.searchParams.set('theme', theme); url.searchParams.set('profile', profile.id);
    history.replaceState(history.state, '', url);
    frameLabel.textContent = `${profile.output.width} × ${profile.output.height} PNG · ${profile.deviceScaleFactor}×`;
    stage.style.aspectRatio = `${profile.viewport.width} / ${profile.viewport.height}`;
    stage.style.maxWidth = profile.viewport.width < profile.viewport.height ? '440px' : 'none';
    stage.setAttribute('aria-label', `${profile.title} complete scene preview`);
    status.textContent = 'Waiting for the local capture scene…'; status.dataset.state = 'loading';
    details.replaceChildren(node('p', { class: 'cs-eyebrow' }, `${scene.title} / scene ${scene.version}`), node('h2', {}, scene.subtitle), node('p', {}, scene.description), node('p', { class: 'cs-license' }, scene.license));
    details.append(node('h3', {}, profile.title), node('p', {}, profile.description), node('p', { class: 'cs-format-spec' }, `${profile.viewport.width} × ${profile.viewport.height} CSS px × ${profile.deviceScaleFactor} = ${profile.output.width} × ${profile.output.height} image px.`));
    if (profile.appStore) details.append(node('p', { class: 'cs-platform-warning' }, 'App Store pixel-size preset only. This browser-rendered web scene is not a native device or simulator screenshot. Native platform UI, app behavior and store acceptance still need separate validation. This is not upload-ready certification.'));
    updateCommand();
    frame = node('iframe', { title: `${scene.title} capture scene`, src: sceneURL(scene.id, theme, profile.id), sandbox: 'allow-scripts', referrerpolicy: 'no-referrer', width: profile.viewport.width, height: profile.viewport.height });
    stage.replaceChildren(frame);
    const fit = () => { if (frame) frame.style.transform = `scale(${stage.clientWidth / profile.viewport.width})`; };
    resize = new ResizeObserver(fit); resize.observe(stage); fit();
    probe = setInterval(() => frame?.contentWindow?.postMessage({ type: 'capture:ping', sceneId: scene.id, profile: profile.id }, '*'), 250);
    timeout = setTimeout(() => { clearInterval(probe); status.textContent = 'Scene unavailable or incompatible. Start this app’s capture server, then retry. The preview is not an export.'; status.dataset.state = 'unavailable'; }, 12000);
    renderExports();
  }
  async function refresh() {
    const generation = ++refreshGeneration;
    try {
      const response = await fetch(new URL('../../review/captures/latest.json', base), { cache: 'no-store' });
      if (!response.ok) throw new Error('Missing report');
      const data = await response.json();
      if (![1, 2].includes(data.schemaVersion) || !Array.isArray(data.captures)) throw new Error('Invalid report');
      if (disposed || generation !== refreshGeneration) return;
      report = data;
      if (!disposed) renderExports();
    } catch { if (!disposed && generation === refreshGeneration) { report = undefined; renderExports(); } }
  }
  root.append(
    node('header', { class: 'cs-intro' }, node('p', { class: 'cs-eyebrow' }, 'Design system / Capture studio'), node('h1', {}, 'One scene. Every format.'), node('p', {}, 'Compose app-owned scenes for desktop, mobile, App Store-sized review and stethem.com’s 4:3 thumbnails. Preview here, capture locally, verify before use.')),
    node('div', { class: 'cs-controls' }, node('label', {}, 'Scene', selector), node('label', {}, 'Theme', themeSelector), node('label', {}, 'Output format', profileSelector), frameLabel, node('button', { type: 'button', onclick: show }, 'Reset preview')),
    node('div', { class: 'cs-layout' }, node('section', { class: 'cs-preview' }, stage, status), details),
    node('section', { class: 'cs-runner' }, node('h2', {}, 'Capture one or capture all'), node('p', {}, 'This address is a browser-only preview and review workspace, not a capture execution endpoint. Copy a command for your terminal or coding agent in the design-system checkout. The runner starts its own local app servers, uses a fresh browser, validates the scene and writes local review files only. For the live preview above, run npm run workbench -- --strictPort in the app’s feature checkout.'), node('div', { class: 'cs-batch-controls' }, node('label', {}, 'Scenes', batchScene), node('label', {}, 'Formats', batchProfile), node('label', {}, 'Themes', batchTheme)), command,
      node('div', { class: 'cs-actions cs-command-actions' }, node('button', { type: 'button', onclick: () => copy(command.textContent, 'Command') }, 'Copy command'), node('button', { type: 'button', onclick: () => { batchScene.value = 'all'; batchProfile.value = 'all'; batchTheme.value = 'both'; updateCommand(); } }, 'Select all scenes, formats & themes'), node('button', { type: 'button', onclick: () => copy(location.href, 'Preview address') }, 'Copy preview address')), copyStatus,
      node('p', {}, 'Setup: npm run capture:help. Playwright and a browser must already be installed; nothing is downloaded automatically.'), node('div', { class: 'cs-actions' }, node('button', { type: 'button', onclick: refresh }, 'Refresh exports'), node('a', { href: new URL('../../packages/capture/catalog.json', base).href, target: '_blank', rel: 'noopener noreferrer' }, 'Agent catalog (JSON)'), node('a', { href: new URL('../../docs/process/capture-studio.md', base).href, target: '_blank', rel: 'noopener noreferrer' }, 'Runner setup and limits'))),
    exports,
    node('footer', { class: 'cs-footer' }, `Capture studio ${CAPTURE_VERSION} · Mock data only · No signed-in profiles · No publication or website replacement`),
  );
  container.replaceChildren(root); show(); void refresh();
  return { destroy() { disposed = true; exportGeneration++; refreshGeneration++; copyGeneration++; exportURLs.forEach(url => URL.revokeObjectURL(url)); stopPreview(); removeEventListener('message', message); root.remove(); } };
}
