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
  const localSource=input.kind==='app'&&input.source?.visibility==='local-only'&&input.source?.repository===`local:${input.id}`;
  if (!record(input.source) || (!/^https:\/\//.test(input.source.repository ?? '')&&!localSource) || !(input.source.revision === null || /^[a-f0-9]{40}$/.test(input.source.revision ?? ''))) errors.push('Source requires an HTTPS repository or exact local:<id> with local-only visibility, plus a full commit SHA or null.');
  if(input.source?.visibility!==undefined&&!['local-only','public'].includes(input.source.visibility))errors.push('Invalid source visibility.');
  if (!['author-owned','independent-analysis','adapted'].includes(input.provenance?.status) || !Array.isArray(input.provenance?.sources)) errors.push('Explicit provenance required.');
  if (!input.license?.spdx || !input.license?.note) errors.push('License declaration and note required.');
  if (input.direction !== undefined) errors.push(...validateDirection(input.direction));
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

const directionFields = ['product','character','world','signature'];
/** Optional, public statement of intent. Every field is optional; present fields must be short plain text. */
function validateDirection(input) {
  if (!record(input)) return ['direction must be an object.'];
  const errors = [], text = value => typeof value === 'string' && !!value.trim() && value.length <= 400 && !/[<>]/.test(value);
  for (const key of Object.keys(input)) if (![...directionFields,'moments','voice','status'].includes(key)) errors.push(`Unknown direction field: ${key}`);
  if (input.status !== undefined && input.status !== 'draft') errors.push('direction.status may only be "draft"; remove it once the owner has reviewed the text.');
  for (const field of directionFields) if (input[field] !== undefined && !text(input[field])) errors.push(`direction.${field} must be short plain text.`);
  for (const field of ['moments','voice']) if (input[field] !== undefined && !(Array.isArray(input[field]) && input[field].length > 0 && input[field].length <= 12 && input[field].every(text))) errors.push(`direction.${field} must be a short list of plain text.`);
  return errors;
}

// Advice thresholds: more distinct steps than this usually means values were recorded, not chosen.
const scaleLimits = {'font.size': 12, 'space': 16, 'radius': 8, 'font.weight': 4, 'line.height': 5, 'font.tracking': 4};
const hexChannels = value => { const hex = /^#([0-9a-f]{6})$/i.exec(String(value).trim()); return hex ? [0, 2, 4].map(index => parseInt(hex[1].slice(index, index + 2), 16)) : null; };
/**
 * Plain-language notes about a token document. Advice only: it never fails validation,
 * and an app may have good reasons to keep what a note describes.
 */
export function adviseTokens(input) {
  if (validateTokens(input).length) return [];
  const notes = [];
  for (const mode of input.modes) {
    const entries = Object.entries(mode.tokens), label = input.modes.length > 1 ? ` (${mode.id})` : '';
    for (const [prefix, limit] of Object.entries(scaleLimits)) {
      const group = entries.filter(([path, token]) => (path === prefix || path.startsWith(prefix + '.')) && ['dimension','number'].includes(token.type));
      const values = new Set(group.map(([, token]) => String(token.value).trim()));
      if (values.size <= limit) continue;
      // A step named after its value is fine on a chosen scale; it is a sign of recorded literals only when there are this many.
      const valueNamed = group.filter(([path]) => /^v(?:minus)?\d+(?:p\d+)?(?:px|em|rem)?$/.test(path.split('.').pop())).map(([path]) => path);
      notes.push(`${prefix} has ${values.size} distinct values${label}. A scale usually needs ${limit} or fewer; check whether some are one-offs.${valueNamed.length ? ` ${valueNamed.length} ${valueNamed.length === 1 ? 'is' : 'are'} named after their value, for example ${valueNamed[0]}, which records a literal rather than a decision.` : ''}`);
    }
    // Compare colors only within one role family, such as color.text.*. Close surface steps are how dark themes show depth.
    const colors = entries.map(([path, token]) => [path, token.type === 'color' ? hexChannels(token.value) : null]).filter(([, channels]) => channels);
    const family = path => path.split('.').slice(0, 2).join('.');
    // Interaction states sit close to their base on purpose.
    const state = path => /^(hover|active|pressed|focus|disabled|selected)$/.test(path.split('.').pop());
    const close = [];
    for (let a = 0; a < colors.length; a++) for (let b = a + 1; b < colors.length; b++) {
      if (family(colors[a][0]) !== family(colors[b][0]) || state(colors[a][0]) || state(colors[b][0])) continue;
      const distance = Math.max(...colors[a][1].map((channel, index) => Math.abs(channel - colors[b][1][index])));
      if (distance > 0 && distance <= 6) close.push(`${colors[a][0]} and ${colors[b][0]}`);
    }
    if (close.length) notes.push(`${close.length} pair${close.length === 1 ? '' : 's'} of colors in the same role family are nearly identical${label}, for example ${close[0]}. If people cannot tell them apart, one role is enough.`);
    const platformOnly = new Map();
    for (const [path, token] of entries) {
      if (token.type !== 'fontFamily') continue;
      const first = String(token.value).split(',')[0].trim().replace(/^['"]|['"]$/g, '');
      if (/^ui-/.test(first)) platformOnly.set(first, [...(platformOnly.get(first) ?? []), path]);
    }
    for (const [keyword, paths] of platformOnly) notes.push(`${paths.length === 1 ? `${paths[0]} leads` : `${paths.slice(0, -1).join(', ')} and ${paths.at(-1)} lead`} with ${keyword}${label}, which not every browser resolves. Check what renders in each engine; a named, shipped family is the only way to get the same face everywhere.`);
  }
  return notes;
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
  const snapshot=input.sourceSnapshot;
  const validSnapshot=record(snapshot)&&snapshot.algorithm==='sha256'&&Array.isArray(snapshot.files)&&snapshot.files.length>0&&snapshot.files.every(file=>record(file)&&isLocalPath(file.path)&&/^[a-f0-9]{64}$/.test(file.sha256??''))&&new Set(snapshot.files.map(file=>file.path)).size===snapshot.files.length;
  if(snapshot!==undefined&&!validSnapshot)errors.push('Invalid immutable sourceSnapshot files.');
  if (!(/^[a-f0-9]{40}$/.test(input.reviewedRevision ?? '') || (input.reviewedRevision === null && ((Array.isArray(input.withheldRevisions) && input.withheldRevisions.includes('reviewedRevision'))||validSnapshot)))) errors.push('Inventory requires a full commit SHA, explicitly withheld public revision, or hash-pinned unversioned sourceSnapshot.');
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
