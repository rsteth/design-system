/** Existing approved preview families only. Adding a local catalog is not publication approval. */
export const PUBLIC_APP_IDS=Object.freeze(['focus','great-circle','stethem','reads','bandit']);
export function publicRegistryEntry(entry,{includeAppPreviews=true}={}) {
 if(entry==='../collections/original/workbench/collection.json')return true;
 const match=/^apps\/([a-z0-9-]+)\/collection\.json$/.exec(entry);
 return Boolean(match&&PUBLIC_APP_IDS.includes(match[1])&&(includeAppPreviews||!['reads','bandit'].includes(match[1])));
}
export function publicSourcePath(path) {
 if(path==='registry/projects.local.json'||path.startsWith('docs/local/'))return false;
 const match=/^registry\/apps\/([^/]+)(?:\/|$)/.exec(path);
 return !match||PUBLIC_APP_IDS.includes(match[1]);
}
export function publicRegistry(index,options) {
 const {projectCoverage,...rest}=index;
 return {...rest,collections:index.collections.filter(entry=>publicRegistryEntry(entry,options))};
}
