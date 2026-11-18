/** Explicit catalog-only public registration. Never copies or runs the app. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {assertRegistryFresh} from './registry-freshness.mjs';
import {publicVersionMetadata} from '../apps/studio/public-sources.mjs';
export const COMPASS_CATALOG_STATUS='foundations-and-guide-only';
export const COMPASS_PUBLIC_SITE='https://compass-public-preview.robin-stethem.workers.dev/';
export const COMPASS_CATALOG_NOTICE='This viewer contains Compass tokens, direction and guide only. Its app-owned screens are not packaged here. Open the public Compass site for the product; hosted MCP remains unavailable.';
export function isCompassCatalog(collection,source){
 const ids=collection?.publicRelease?.omittedFixtureIds;
 return collection?.id==='compass'&&collection.kind==='app'&&Array.isArray(collection.fixtures)&&collection.fixtures.length===0&&!collection.inventory&&collection.publicRelease?.status===COMPASS_CATALOG_STATUS&&collection.publicRelease?.limitation===COMPASS_CATALOG_NOTICE&&collection.publicRelease?.publicSite===COMPASS_PUBLIC_SITE&&source?.status===COMPASS_CATALOG_STATUS&&Array.isArray(ids)&&ids.length>0&&ids.every(id=>typeof id==='string'&&/^[a-z0-9-]+$/.test(id))&&new Set(ids).size===ids.length&&source.omittedFixtureCount===ids.length;
}
export async function packageCompassCatalog({root,sourceRoot,output}){
 const checked=await assertRegistryFresh([sourceRoot],{root});if(checked[0]!=='compass')throw Error('Expected the app-owned Compass snapshot.');
 const directory=join(root,'registry/apps/compass'),collection=JSON.parse(await readFile(join(directory,'collection.json'),'utf8'));
 if(collection.inventory)throw Error('Compass catalog inventory needs separate publication review.');
 const version=JSON.parse(await readFile(join(sourceRoot,'public-index/package.json'),'utf8')).version;
 const omittedFixtureIds=collection.fixtures.map(f=>f.id),source={repository:collection.source.repository,version,status:COMPASS_CATALOG_STATUS,omittedFixtureCount:omittedFixtureIds.length};
 collection.fixtures=[];collection.summary+=' '+COMPASS_CATALOG_NOTICE;
 collection.publicRelease={status:COMPASS_CATALOG_STATUS,omittedFixtureIds,publicSite:COMPASS_PUBLIC_SITE,limitation:COMPASS_CATALOG_NOTICE};
 const exported=publicVersionMetadata(collection,version);if(!isCompassCatalog(exported,source))throw Error('Invalid Compass catalog-only scope.');
 const dest=join(output,'registry/apps/compass');await mkdir(dest,{recursive:true});
 await writeFile(join(dest,'tokens.json'),await readFile(join(directory,collection.tokens)));
 await writeFile(join(dest,'collection.json'),JSON.stringify(exported,null,2)+'\n');
 const notes=await readFile(join(directory,'public-guide.md'),'utf8').catch(error=>{if(error.code==='ENOENT')return '';throw error;});
 await writeFile(join(dest,'public-guide.md'),notes+'\n## Hosted catalog scope\n\n'+COMPASS_CATALOG_NOTICE+'\n\n[Open Compass]('+COMPASS_PUBLIC_SITE+'). No app backend, private inventory, local capture server or screen adapter is distributed by this registration.\n');
 return source;
}
