#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {compileTokens,validateTokens,validateCollection,validateInventory} from '../packages/tokens/index.mjs';
const [command='check',input='design/tokens.json',output='src/styles/tokens.css'] = process.argv.slice(2);
const tokens = JSON.parse(await readFile(resolve(input),'utf8'));
const errors = validateTokens(tokens);
const collectionPath = resolve(dirname(input), 'collection.json');
const collection = JSON.parse(await readFile(collectionPath,'utf8'));
errors.push(...validateCollection(collection));
if (collection.inventory && !validateCollection(collection).length) {
  const inventory = JSON.parse(await readFile(resolve(dirname(collectionPath),collection.inventory),'utf8'));
  errors.push(...validateInventory(inventory,collection));
  if (!errors.length) { const {validateInventoryFiles}=await import('./inventory-files.mjs'); errors.push(...await validateInventoryFiles(inventory,resolve(dirname(collectionPath),'..'))); }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const css = compileTokens(tokens);
if (command === 'build') { await writeFile(output,css); console.log(`Generated ${output}`); }
else if (command === 'check') { if (await readFile(output,'utf8') !== css) { console.error(`${output} is stale; regenerate with design.mjs build.`); process.exit(1); } console.log(`Valid collection and matching token CSS: ${collection.id}`); }
else { console.error('Usage: design.mjs [build|check] [tokens.json] [tokens.css]'); process.exit(1); }
