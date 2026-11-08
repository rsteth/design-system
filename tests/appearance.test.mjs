import test from 'node:test';
import assert from 'node:assert/strict';
import {createAppearanceController,appearancePalettes} from '../packages/appearance/index.mjs';
function fixture({dataset={},matches=false,values={},blocked=false}={}) {
  const root={dataset:{...dataset}}, stored=new Map(Object.entries(values));
  const handlers=new Set();
  const mediaQuery={matches,addEventListener(_event,fn){handlers.add(fn)},removeEventListener(_event,fn){handlers.delete(fn)}};
  const storage={getItem(key){if(blocked)throw new Error();return stored.get(key)??null},setItem(key,value){if(blocked)throw new Error();stored.set(key,value)},removeItem(key){if(blocked)throw new Error();stored.delete(key)}};
  const controller=createAppearanceController({themeKey:'app.theme',paletteKey:'app.palette',root,mediaQuery,storage});
  return {controller,root,stored,handlers,change(value){mediaQuery.matches=value;for(const handler of handlers)handler()}};
}
test('four declared palettes preserve existing values',()=>assert.deepEqual(appearancePalettes.map(([id])=>id),['standard','red-green','blue-yellow','high-contrast']));
test('requires explicit storage ownership',()=>assert.throws(()=>createAppearanceController({}),/storage keys/));
test('starts from existing bootstrap datasets',()=>{const f=fixture({dataset:{theme:'dark',palette:'red-green',themeExplicit:'true'}});assert.deepEqual(f.controller.getSnapshot(),{theme:'dark',palette:'red-green',explicitTheme:true});});
test('can initialize DOM adapter from storage without bootstrap',()=>{const f=fixture({values:{'app.theme':'dark','app.palette':'high-contrast'}});assert.equal(f.controller.getSnapshot().theme,'dark');assert.equal(f.controller.getSnapshot().explicitTheme,true);});
test('ignores invalid saved values',()=>{const f=fixture({values:{'app.theme':'bogus','app.palette':'bogus'},matches:true});assert.deepEqual(f.controller.getSnapshot(),{theme:'dark',palette:'standard',explicitTheme:false});});
test('follows system until user chooses a theme',()=>{const f=fixture();f.controller.connect();f.change(true);assert.equal(f.root.dataset.theme,'dark');f.controller.chooseTheme('light');f.change(true);assert.equal(f.root.dataset.theme,'light');assert.equal(f.stored.get('app.theme'),'light');});
test('device theme removes explicit preference without touching palette',()=>{const f=fixture();f.controller.connect();f.controller.choosePalette('blue-yellow');f.controller.chooseTheme('dark');f.controller.useDeviceTheme();assert.equal(f.stored.has('app.theme'),false);assert.equal(f.root.dataset.themeExplicit,'false');assert.equal(f.stored.get('app.palette'),'blue-yellow');f.change(true);assert.equal(f.root.dataset.theme,'dark');});
test('blocked storage is nonfatal and settings still apply',()=>{const f=fixture({blocked:true});f.controller.connect();f.controller.chooseTheme('dark');f.controller.choosePalette('red-green');f.controller.useDeviceTheme();assert.equal(f.root.dataset.palette,'red-green');});
test('subscribe snapshot is stable until a real state change',()=>{const f=fixture();let calls=0;const stop=f.controller.subscribe(()=>calls++), first=f.controller.getSnapshot();f.controller.choosePalette('standard');assert.equal(f.controller.getSnapshot(),first);assert.equal(calls,0);f.controller.toggleTheme();assert.equal(calls,1);stop();f.controller.toggleTheme();assert.equal(calls,1);});
test('disconnect and remount remove/reinstall exactly one listener',()=>{const f=fixture();const disconnect=f.controller.connect();f.controller.connect();assert.equal(f.handlers.size,1);disconnect();assert.equal(f.handlers.size,0);f.controller.connect();assert.equal(f.handlers.size,1);});
test('invalid choices are rejected before writing',()=>{const f=fixture();assert.throws(()=>f.controller.chooseTheme('neon'));assert.throws(()=>f.controller.choosePalette('neon'));assert.equal(f.stored.size,0);});
test('palette does not change current theme',()=>{const f=fixture({dataset:{theme:'dark',themeExplicit:'true'}});f.controller.choosePalette('high-contrast');assert.equal(f.controller.getSnapshot().theme,'dark');});
