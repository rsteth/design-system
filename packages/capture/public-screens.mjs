/** Public screens reuse the release registry. Never accept arbitrary capture URLs. */
export function publicScreenURL(value, collectionURL, rootURL) {
  const root = new URL(rootURL), url = new URL(value, collectionURL);
  if (url.origin !== root.origin || url.username || url.password ||
      ![`${root.pathname}previews/`, `${root.pathname}collections/original/workbench/fixtures/`].some(prefix => url.pathname.startsWith(prefix))) return null;
  return url.href;
}
export async function loadPublicScreens(rootURL, fetcher = fetch) {
  const root = new URL(rootURL);
  const read = async url => { const response = await fetcher(url); if (!response.ok) throw Error('Public screen catalog unavailable'); return response.json(); };
  const indexURL = new URL('registry/index.json', root), index = await read(indexURL);
  const apps = await Promise.all(index.collections.map(async path => {
    const collectionURL = new URL(path, indexURL);
    if (collectionURL.origin !== root.origin || !collectionURL.pathname.startsWith(root.pathname)) throw Error('Collection outside release');
    const collection = await read(collectionURL);
    if (collection.kind === 'reference') return null;
    const screens = (collection.fixtures ?? []).filter(f => ['screens', 'patterns'].includes(f.section)).map(f => ({id:f.id,title:f.title,section:f.section,description:f.description ?? '',url:publicScreenURL(f.url,collectionURL,root)}));
    return {id:collection.id,title:collection.title,themes:collection.themes ?? ['light'],screens};
  }));
  return apps.filter(Boolean).sort((a,b) => a.title.localeCompare(b.title));
}
