import { installThemeAdapter } from '../../packages/workbench/theme-adapter.mjs';
const root = document.documentElement;
installThemeAdapter(theme => { root.dataset.theme = theme; }, { themes: [root.dataset.theme] });
const view = new URL(location.href).searchParams.get('view') || 'screens';
const activeView = ['components','patterns','screens'].includes(view) ? view : 'screens';
root.dataset.view = activeView;
document.querySelectorAll('section[data-view]').forEach(section => { section.hidden = section.dataset.view !== activeView; });
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const group = button.closest('[data-filter-group]');
  group.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  group.querySelectorAll('[data-category]').forEach(row => { row.hidden = button.dataset.filter !== 'all' && row.dataset.category !== button.dataset.filter; });
  group.querySelector('[role=status]').textContent = `${group.querySelectorAll('[data-category]:not([hidden])').length} items shown`;
}));
const dialog = document.querySelector('dialog');
let opener;
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => {
  opener = button; dialog.querySelector('form').reset(); dialog.querySelector('[role=status]').textContent = ''; dialog.querySelector('input').removeAttribute('aria-invalid'); dialog.showModal();
}));
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => opener?.focus());
function prepareDraft(event) {
  event.preventDefault(); const input = dialog.querySelector('input');
  if (!input.value.trim()) { input.setAttribute('aria-invalid','true'); dialog.querySelector('[role=status]').textContent = 'Enter a title to create a local draft.'; input.focus(); return; }
  input.removeAttribute('aria-invalid'); dialog.querySelector('[role=status]').textContent = 'Local draft prepared. Nothing has been sent or saved.';
}
dialog.querySelector('[data-prepare]').addEventListener('click', prepareDraft);
dialog.querySelector('form').addEventListener('submit', event => event.preventDefault());
dialog.querySelector('input').addEventListener('keydown', event => { if (event.key === 'Enter') prepareDraft(event); });
root.dataset.workbenchReady = 'true';
