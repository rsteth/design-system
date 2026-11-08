/** Shared behavior only. Apps own markup, icons, copy and CSS. */
export const appearancePalettes = Object.freeze([
  Object.freeze(['standard', 'Standard']),
  Object.freeze(['red-green', 'Red–green friendly (protan/deutan)']),
  Object.freeze(['blue-yellow', 'Blue–yellow friendly (tritan)']),
  Object.freeze(['high-contrast', 'High contrast']),
]);
const paletteIds = new Set(appearancePalettes.map(([id]) => id));
const themes = new Set(['light', 'dark']);

export function createAppearanceController(options) {
  if (!options?.themeKey || !options?.paletteKey) throw new TypeError('Explicit app storage keys are required.');
  const root = options.root ?? globalThis.document?.documentElement;
  let storage = options.storage;
  if (storage === undefined) { try { storage = globalThis.localStorage; } catch { storage = null; } }
  const media = options.mediaQuery ?? globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  const read = key => { try { return storage?.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { if (value === null) storage?.removeItem(key); else storage?.setItem(key, value); } catch { /* This visit still works. */ } };
  const dataset = root?.dataset ?? {};
  const storedTheme = read(options.themeKey);
  const theme = themes.has(dataset.theme) ? dataset.theme : themes.has(storedTheme) ? storedTheme : media?.matches ? 'dark' : 'light';
  const storedPalette = read(options.paletteKey);
  let state = Object.freeze({
    theme,
    palette: paletteIds.has(dataset.palette) ? dataset.palette : paletteIds.has(storedPalette) ? storedPalette : 'standard',
    explicitTheme: dataset.themeExplicit !== undefined ? dataset.themeExplicit === 'true' : themes.has(storedTheme),
  });
  const listeners = new Set();
  let connected = false;
  function apply() {
    if (root) {
      root.dataset.theme = state.theme;
      root.dataset.palette = state.palette;
      root.dataset.themeExplicit = String(state.explicitTheme);
    }
  }
  function update(patch) {
    if (Object.entries(patch).every(([key,value]) => state[key] === value)) { apply(); return; }
    state = Object.freeze({...state, ...patch}); apply();
    for (const listener of [...listeners]) listener();
  }
  function followSystem() { if (!state.explicitTheme) update({theme: media?.matches ? 'dark' : 'light'}); }
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    connect() {
      if (!connected) { connected = true; media?.addEventListener?.('change', followSystem); followSystem(); apply(); }
      return () => { if (connected) { media?.removeEventListener?.('change', followSystem); connected = false; } };
    },
    chooseTheme(next) { if (!themes.has(next)) throw new TypeError(`Unknown theme: ${next}`); save(options.themeKey, next); update({theme: next, explicitTheme: true}); },
    toggleTheme() { this.chooseTheme(state.theme === 'dark' ? 'light' : 'dark'); },
    choosePalette(next) { if (!paletteIds.has(next)) throw new TypeError(`Unknown palette: ${next}`); save(options.paletteKey, next); update({palette: next}); },
    useDeviceTheme() { save(options.themeKey, null); update({theme: media?.matches ? 'dark' : 'light', explicitTheme: false}); },
  };
}
