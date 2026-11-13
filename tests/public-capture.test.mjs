import test from 'node:test';
import assert from 'node:assert/strict';
import {publicScreenURL,loadPublicScreens} from '../packages/capture/public-screens.mjs';
const root='https://stethem.com/design-system/', collection=root+'registry/apps/reads/collection.json';
test('only packaged, same-origin fixtures can be previewed',()=>{
 assert.equal(publicScreenURL('../../../previews/reads/fixture/?fixture=landing',collection,root),root+'previews/reads/fixture/?fixture=landing');
 for(const url of ['http://127.0.0.1:3148/fixture','https://reads.sh/','../../../previews/../secrets','https://evil.test/previews/x','https://a:b@stethem.com/design-system/previews/x'])assert.equal(publicScreenURL(url,collection,root),null);
});
test('catalog inherits current registry, screens and patterns without adding projects',async()=>{
 const docs={[root+'registry/index.json']:{collections:['apps/reads/collection.json']},[collection]:{id:'reads',title:'Reads',themes:['dark'],fixtures:[{id:'landing',title:'Landing',section:'screens',url:'../../../previews/reads/fixture/'},{id:'dialog',title:'Dialog',section:'patterns',url:'http://127.0.0.1:1234/'},{id:'button',section:'components',url:'x'}]}};
 const apps=await loadPublicScreens(root,async url=>({ok:!!docs[url],json:async()=>docs[url]}));
 assert.equal(apps.length,1);assert.equal(apps[0].screens.length,2);assert.equal(apps[0].screens[1].url,null);assert.deepEqual(apps[0].themes,['dark']);
});
