const types = new Set(['color','dimension','fontFamily','number','string']);
const pathPattern = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/;
const variablePattern = /^--[a-zA-Z][a-zA-Z0-9_-]*$/;
const idPattern = /^[a-z][a-z0-9-]*$/;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export function tokenVariable(path) { return `--ds-${path.replaceAll('.', '-')}`; }
export function validateTokens(input) {
  const errors = [];
  if (!record(input)) return ['Token document must be an object.'];
  if (input.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!idPattern.test(input.namespace ?? '')) errors.push('namespace must be a kebab-case identifier.');
  if (!Array.isArray(input.modes) || !input.modes.length) return [...errors, 'At least one token mode is required.'];
  const ids = new Set(), allPaths = new Set();
  for (const mode of input.modes) {
    if (!record(mode)) { errors.push('Each mode must be an object.'); continue; }
    if (!idPattern.test(mode.id ?? '') || ids.has(mode.id)) errors.push(`Invalid/duplicate mode: ${mode.id}`);
    ids.add(mode.id);
    if (typeof mode.selector !== 'string' || !mode.selector.trim() || /[{};<>@\\]/.test(mode.selector) || !/^[\w\s:#.\[\]="'(),>*+~|-]+$/.test(mode.selector)) errors.push(`Unsafe selector in ${mode.id}.`);
    if (!record(mode.tokens) || !Object.keys(mode.tokens).length) { errors.push(`No tokens in ${mode.id}.`); continue; }
    const cssNames = new Set();
    for (const [path, token] of Object.entries(mode.tokens)) {
      if (!pathPattern.test(path)) errors.push(`Invalid token path: ${path}`);
      const name = tokenVariable(path); if (cssNames.has(name)) errors.push(`CSS variable collision: ${path}`); cssNames.add(name); allPaths.add(path);
      if (!record(token) || !types.has(token.type)) { errors.push(`Invalid type for ${path}.`); continue; }
      if (token.type === 'number') { if (typeof token.value !== 'number' || !Number.isFinite(token.value)) errors.push(`Non-finite number: ${path}`); }
      else if (typeof token.value !== 'string' || !token.value.trim() || /[;{}<>]|url\s*\(|@import|\/\*/i.test(token.value)) errors.push(`Unsafe/empty value: ${path}`);
    }
  }
  if (input.aliases !== undefined && !record(input.aliases)) errors.push('aliases must be an object.');
  else for (const [alias,path] of Object.entries(input.aliases ?? {})) {
    if (!variablePattern.test(alias) || alias.startsWith('--ds-')) errors.push(`Invalid legacy alias: ${alias}`);
    if (!allPaths.has(path)) errors.push(`Alias ${alias} references missing ${path}.`);
  }
  return errors;
}
export function compileTokens(input) {
  const errors = validateTokens(input); if (errors.length) throw new TypeError(errors.join('\n'));
  const blocks = input.modes.map(mode => {
    const lines = Object.entries(mode.tokens).map(([path, token]) => `  ${tokenVariable(path)}: ${token.value};`);
    for (const [alias, path] of Object.entries(input.aliases ?? {})) if (Object.hasOwn(mode.tokens, path)) lines.push(`  ${alias}: var(${tokenVariable(path)});`);
    return `${mode.selector} {\n${lines.join('\n')}\n}`;
  });
  return `/* Generated from design/tokens.json. Do not edit. Contract v1; ${input.namespace}. */\n${blocks.join('\n\n')}\n`;
}
export function validateCollection(input) {
  const errors = [];
  if (!record(input)) return ['Collection must be an object.'];
  if (input.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!idPattern.test(input.id ?? '')) errors.push('Invalid collection id.');
  for (const field of ['title','summary','tokens']) if (typeof input[field] !== 'string' || !input[field].trim()) errors.push(`Missing ${field}.`);
  if (input.inventory !== undefined && !isLocalPath(input.inventory)) errors.push('inventory must be a local relative path without traversal.');
  if (input.study !== undefined && !isLocalPath(input.study)) errors.push('study must be a local relative path without traversal.');
  if (input.study !== undefined && input.kind !== 'reference') errors.push('study metadata is reserved for reference collections.');
  if (!['app','original','reference'].includes(input.kind)) errors.push('Invalid collection kind.');
  if (!['dom','react'].includes(input.renderer)) errors.push('Invalid renderer.');
  if (!Array.isArray(input.themes) || !input.themes.length || input.themes.some(theme => !idPattern.test(theme))) errors.push('Invalid themes.');
  if (!record(input.source) || !/^https:\/\//.test(input.source.repository ?? '') || !(input.source.revision === null || /^[a-f0-9]{40}$/.test(input.source.revision ?? ''))) errors.push('Source requires HTTPS repository and full commit SHA (or null for unreleased work).');
  if (!['author-owned','independent-analysis','adapted'].includes(input.provenance?.status) || !Array.isArray(input.provenance?.sources)) errors.push('Explicit provenance required.');
  if (!input.license?.spdx || !input.license?.note) errors.push('License declaration and note required.');
  if (!Array.isArray(input.fixtures)) errors.push('fixtures must be an array.');
  else {
    const ids = new Set();
    for (const fixture of input.fixtures) {
      if (!record(fixture)) { errors.push('Fixture must be an object.'); continue; }
      if (fixture.description !== undefined && typeof fixture.description !== 'string') errors.push('Fixture description must be a string.');
      if (fixture.states !== undefined && !stringArray(fixture.states)) errors.push('Fixture states must be nonempty strings.');
      if (!idPattern.test(fixture.id ?? '') || ids.has(fixture.id)) errors.push(`Invalid/duplicate fixture id: ${fixture.id}`); ids.add(fixture.id);
      if (!fixture.title || !['components','patterns','screens'].includes(fixture.section)) errors.push(`Invalid fixture metadata: ${fixture.id}`);
      try { const url = new URL(fixture.url, 'http://localhost'); if (!['http:','https:'].includes(url.protocol)) throw new Error(); } catch { errors.push(`Unsafe fixture URL: ${fixture.id}`); }
    }
  }
  return errors;
}

/** Repository-relative file paths only; never URLs, encoded paths, or traversal. */
export function isLocalPath(value) {
  return typeof value === 'string' && !!value.trim() && !/[\\:%?#\x00-\x1f]/.test(value) && !value.startsWith('/') && value.split('/').every(part => part && part !== '.' && part !== '..');
}
const stringArray = value => Array.isArray(value) && value.every(item => typeof item === 'string' && !!item.trim());
export function validateInventory(input, collection) {
  const errors = [];
  if (!record(input)) return ['Inventory must be an object.'];
  if (input.schemaVersion !== 1) errors.push('Inventory schemaVersion must be 1.');
  if (!idPattern.test(input.application ?? '')) errors.push('Invalid inventory application.');
  if (collection && input.application !== collection.id) errors.push('Inventory application must match collection id.');
  if (!/^[a-f0-9]{40}$/.test(input.reviewedRevision ?? '')) errors.push('Inventory reviewedRevision must be a full commit SHA.');
  const fixtures = new Set((collection?.fixtures ?? []).map(item => item.id));
  for (const group of ['items','checks']) {
    if (!Array.isArray(input[group])) { errors.push(`Inventory ${group} must be an array.`); continue; }
    const ids = new Set();
    for (const item of input[group]) {
      if (!record(item)) { errors.push(`Inventory ${group} entry must be an object.`); continue; }
      if (!idPattern.test(item.id ?? '') || ids.has(item.id)) errors.push(`Invalid/duplicate inventory ${group} id: ${item.id}`);
      ids.add(item.id);
      for (const field of group === 'items' ? ['title','notes'] : ['label','command','scope']) if (typeof item[field] !== 'string' || (field !== 'notes' && !item[field].trim())) errors.push(`Invalid ${field}: ${item.id}`);
      if (group === 'checks') {
        if (!['passed','failed','not-run'].includes(item.status)) errors.push(`Invalid recorded check status: ${item.id}`);
        if (item.evidence !== undefined && !isLocalPath(item.evidence)) errors.push(`Unsafe evidence path: ${item.id}`);
        continue;
      }
      if (!['component','pattern','screen','domain','external'].includes(item.kind)) errors.push(`Invalid inventory kind: ${item.id}`);
      if (!['covered','partial','excluded','blocked'].includes(item.coverage)) errors.push(`Invalid coverage: ${item.id}`);
      if (!Array.isArray(item.source) || !item.source.length || !item.source.every(isLocalPath)) errors.push(`Unsafe/missing source paths: ${item.id}`);
      if (!stringArray(item.states)) errors.push(`Invalid states: ${item.id}`);
      if (!stringArray(item.fixtures)) errors.push(`Invalid fixture references: ${item.id}`);
      else {
        if (collection) for (const id of item.fixtures) if (!fixtures.has(id)) errors.push(`Unknown fixture ${id}: ${item.id}`);
        if (item.coverage === 'covered' && ['component','pattern','screen'].includes(item.kind) && !item.fixtures.length) errors.push(`Covered UI item needs fixture references: ${item.id}`);
      }
      if (item.coverage !== 'covered' && (typeof item.notes !== 'string' || !item.notes.trim())) errors.push(`Coverage reason required: ${item.id}`);
    }
  }
  return errors;
}
