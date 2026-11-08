import test from 'node:test';
import assert from 'node:assert/strict';
import { auditReferences, inspectStudy } from '../tooling/reference-readiness.mjs';
const study = analysis => ({ id: 'reference-test', title: 'Test', source: { url: 'https://example.com/source', sha256: 'test' }, tokens: [], analysis });
test('readiness reports exact pinned coverage without calling recipes runnable components', async () => {
  const report = await auditReferences();
  assert.deepEqual(report.totals, { studies: 84, withStructuredRecipes: 74, requiringManualNormalization: 10, extractedValues: 8029, componentRecipes: 2086, componentReferences: 8151, missingReferences: 0, studiesWithFixtures: 84, existingFixtures: 177 });
  assert.match(report.purpose, /not counts of runnable or official components/);
  assert.equal(report.studies.find(s => s.id === 'reference-spotify').componentRecipes, 0);
  assert.equal(report.studies.find(s => s.id === 'reference-stripe').existingFixtures, 5);
});
test('audit resolves own properties, including composite strings, and reports missing or unsafe paths', () => {
  const row = inspectStudy(study({ colors: { ink: '#111111' }, spacing: { zero: 0 }, components: { card: { border: '1px solid {colors.ink}', padding: '{spacing.zero} {spacing.missing}', invalid: '{constructor.name}', nested: [{ color: '{colors.ink}' }] } } }), { fixtures: [] });
  assert.equal(row.componentReferences, 5);
  assert.deepEqual(row.missingReferences.map(r => r.reference), ['spacing.missing', 'constructor.name']);
});
test('prose-only studies remain unnormalized and have no invented component definitions', () => {
  const row = inspectStudy(study({}), { fixtures: [] });
  assert.equal(row.componentRecipes, 0);
  assert.match(row.nextStep, /Manually normalize the prose/);
});
