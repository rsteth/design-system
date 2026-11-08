/** Read-only audit of imported evidence, not a renderer or fidelity certification. */
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function ownPath(object, path) {
  const parts = path.split('.');
  if (parts.some(part => !part || ['__proto__', 'prototype', 'constructor'].includes(part))) return undefined;
  return parts.reduce((value, key) => record(value) && Object.hasOwn(value, key) ? value[key] : undefined, object);
}
export function inspectStudy(study, collection) {
  const analysis = study.analysis ?? {};
  const components = analysis.components ?? {};
  let referenceCount = 0;
  const missingReferences = [];
  function inspect(value, path) {
    if (Array.isArray(value)) return value.forEach((child, index) => inspect(child, `${path}.${index}`));
    if (record(value)) return Object.entries(value).forEach(([key, child]) => inspect(child, `${path}.${key}`));
    if (typeof value !== 'string') return;
    for (const match of value.matchAll(/\{([^{}]+)\}/g)) {
      referenceCount++;
      if (ownPath(analysis, match[1]) === undefined) missingReferences.push({ path, reference: match[1] });
    }
  }
  inspect(components, 'components');
  const componentCount = Object.keys(components).length;
  return {
    id: study.id,
    title: study.title,
    source: study.source.url,
    sourceSha256: study.source.sha256,
    extractedValues: study.tokens.length,
    componentRecipes: componentCount,
    componentReferences: referenceCount,
    missingReferences,
    existingFixtures: collection.fixtures.length,
    nextStep: componentCount ? 'Compile source-linked visual specimens; review inferred structure and unsupported properties.' : 'Manually normalize the prose with line-level evidence before creating component specimens.',
  };
}
export async function auditReferences(directory = root) {
  const base = join(directory, 'collections/reference');
  const studies = [];
  for (const name of (await readdir(base)).sort()) {
    const study = JSON.parse(await readFile(join(base, name, 'study.json'), 'utf8'));
    const collection = JSON.parse(await readFile(join(base, name, 'collection.json'), 'utf8'));
    const raw = await readFile(join(base, name, 'DESIGN.md'));
    if (createHash('sha256').update(raw).digest('hex') !== study.source.sha256) throw new Error(`Source hash mismatch: ${name}`);
    studies.push(inspectStudy(study, collection));
  }
  return {
    schemaVersion: 1,
    purpose: 'Implementation planning only. Recipe counts include state variants, style-only blocks and asset-dependent descriptions. They are not counts of runnable or official components.',
    limitations: ['Reference resolution checks existence only, not CSS validity, complete behavior, accessibility, visual fidelity or rights to brand assets.', 'No source values, app collections, shared tokens or specimen runtime are modified.'],
    totals: {
      studies: studies.length,
      withStructuredRecipes: studies.filter(study => study.componentRecipes > 0).length,
      requiringManualNormalization: studies.filter(study => !study.componentRecipes).length,
      extractedValues: studies.reduce((n, study) => n + study.extractedValues, 0),
      componentRecipes: studies.reduce((n, study) => n + study.componentRecipes, 0),
      componentReferences: studies.reduce((n, study) => n + study.componentReferences, 0),
      missingReferences: studies.reduce((n, study) => n + study.missingReferences.length, 0),
      studiesWithFixtures: studies.filter(study => study.existingFixtures > 0).length,
      existingFixtures: studies.reduce((n, study) => n + study.existingFixtures, 0),
    },
    studies,
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  auditReferences().then(report => console.log(JSON.stringify(report, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
