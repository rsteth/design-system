/** Studio chrome that sits around the workbench: the underline that follows the current
 *  workspace, and the jump palette across every collection. Reads collections; never edits them. */
import { colorSignature, signatureGradient } from '../../packages/workbench/index.mjs';

const h = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) if (value != null) node.setAttribute(key, String(value));
  node.append(...children.filter(child => child != null));
  return node;
};
const LIBRARIES = [['own', 'Robin'], ['references', 'Study']];

export function mountChrome({ navigation, collectionsFor, loaded, open }) {
  const bar = navigation.closest('header');

  // ── Underline for the current workspace ──────────────────────────────────
  const current = h('span', { class: 'studio-current', 'aria-hidden': 'true' });
  navigation.append(current);
  const place = () => {
    const pressed = navigation.querySelector('button[aria-pressed=true]:not([hidden])');
    if (!pressed) { current.style.opacity = '0'; return; }
    const frame = navigation.getBoundingClientRect(), box = pressed.getBoundingClientRect();
    current.style.transform = `translateX(${box.left - frame.left + 11}px) scaleX(${Math.max(box.width - 22, 1)})`;
    current.style.opacity = '1';
  };
  new MutationObserver(place).observe(navigation, { attributes: true, subtree: true, attributeFilter: ['aria-pressed', 'hidden'] });
  new ResizeObserver(place).observe(bar);

  // ── Jump palette ─────────────────────────────────────────────────────────
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  const trigger = h('button', { type: 'button', class: 'studio-jump', 'aria-haspopup': 'dialog' }, 'Jump to', h('kbd', {}, mac ? '⌘K' : 'Ctrl K'));
  bar.append(trigger);
  const field = h('input', { type: 'text', id: 'jump-field', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'jump-list', 'aria-autocomplete': 'list', 'aria-label': 'Jump to a collection', placeholder: 'Jump to a collection…', autocomplete: 'off', spellcheck: 'false' });
  const list = h('ul', { id: 'jump-list', role: 'listbox', 'aria-label': 'Collections' });
  const tally = h('span', { 'aria-live': 'polite' });
  const palette = h('dialog', { class: 'studio-palette', 'aria-label': 'Jump to a collection' }, field, list,
    h('footer', {}, h('span', {}, h('kbd', {}, '↑↓'), 'move', h('kbd', {}, '↵'), 'open', h('kbd', {}, 'esc'), 'close'), tally));
  document.body.append(palette);
  let entries = [], shown = [], cursor = 0, failed = false;
  const sample = (items, limit) => items.length <= limit ? items : Array.from({ length: limit }, (_, index) => items[Math.round(index * (items.length - 1) / (limit - 1))]);
  const choose = entry => { palette.close(); open(entry.library, entry.collection.id); };
  const mark = index => {
    cursor = Math.max(0, Math.min(shown.length - 1, index));
    list.querySelectorAll('[role=option]').forEach((row, position) => {
      row.setAttribute('aria-selected', String(position === cursor));
      if (position === cursor) { row.scrollIntoView({ block: 'nearest' }); field.setAttribute('aria-activedescendant', row.id); }
    });
  };
  function paint() {
    const query = field.value.trim().toLowerCase();
    const rank = title => {
      const at = title.indexOf(query);
      return !query || at === 0 ? 0 : at < 0 ? -1 : /[\s·-]/.test(title[at - 1]) ? 1 : 2;
    };
    shown = entries.map((entry, order) => ({ ...entry, order, rank: rank(entry.collection.title.toLowerCase()) }))
      .filter(entry => entry.rank >= 0).sort((a, b) => a.rank - b.rank || a.order - b.order);
    list.replaceChildren(...shown.map((entry, index) => {
      const title = entry.collection.title, at = query ? title.toLowerCase().indexOf(query) : -1;
      const name = at < 0 ? h('span', {}, title) : h('span', {}, title.slice(0, at), h('mark', {}, title.slice(at, at + query.length)), title.slice(at + query.length));
      const strip = h('span', { class: 'studio-palette-strip', 'aria-hidden': 'true' });
      const colors = sample(colorSignature(entry.collection.tokensData, entry.collection.tokensData?.modes?.[0]?.id), 26);
      if (colors.length) strip.style.backgroundImage = signatureGradient(colors); else strip.style.visibility = 'hidden';
      const row = h('li', { role: 'option', id: `jump-option-${index}`, 'aria-selected': 'false' }, name, h('small', {}, entry.label), strip);
      row.addEventListener('click', () => choose(entry));
      row.addEventListener('pointermove', () => { if (cursor !== index) mark(index); });
      return row;
    }));
    if (shown.length) mark(0);
    else {
      list.append(h('li', { class: 'studio-palette-empty' }, entries.length ? 'No collection matches that.' : failed ? 'Collections could not be loaded. Close and try again.' : 'Loading collections…'));
      field.removeAttribute('aria-activedescendant');
    }
    tally.textContent = entries.length ? `${shown.length} of ${entries.length}` : '';
  }
  function gather() {
    entries = LIBRARIES.flatMap(([library, label]) => (loaded.get(library) ?? []).map(collection => ({ library, label, collection })));
    if (palette.open) paint();
  }
  function toggle() {
    if (palette.open) { palette.close(); return; }
    field.value = ''; failed = false;
    gather();
    palette.showModal();
    paint();
    for (const [library] of LIBRARIES) if (!loaded.has(library)) collectionsFor(library).then(gather, () => { failed = true; gather(); });
  }
  field.addEventListener('input', paint);
  field.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') mark(cursor + 1 >= shown.length ? 0 : cursor + 1);
    else if (event.key === 'ArrowUp') mark(cursor - 1 < 0 ? shown.length - 1 : cursor - 1);
    else if (event.key === 'Enter' && shown[cursor]) choose(shown[cursor]);
    else return;
    event.preventDefault();
  });
  palette.addEventListener('click', event => { if (event.target === palette) palette.close(); });
  trigger.addEventListener('click', toggle);
  // Warm the larger library when the pointer first approaches, so the list is ready on open.
  trigger.addEventListener('pointerenter', () => { collectionsFor('references').catch(() => {}); }, { once: true });
  addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') { event.preventDefault(); toggle(); }
  });
}
