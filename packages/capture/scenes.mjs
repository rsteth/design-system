/** Allowlisted app-owned presentation scenes. Never an arbitrary-URL capture service. */
export const CAPTURE_VERSION = '1.1.0';
export const FRAME = Object.freeze({ width: 1200, height: 900 });
export const CARD = Object.freeze({ width: 800, height: 600 });
export const SCENES = Object.freeze([
  Object.freeze({ id: 'focus-reader', app: 'focus', title: 'Focus', subtitle: 'A quiet moment of focus', description: 'The real reader, paused on authored sample text. No saved books or account data.', version: '1.1.0', origin: 'http://127.0.0.1:5186', path: '/focus-speed-reader/capture/', checkout: 'focus-speed-reader', repository: 'https://github.com/rsteth/focus-speed-reader', license: 'App-owned UI and authored sample text. Existing repository terms apply.' }),
  Object.freeze({ id: 'great-circle-route', app: 'great-circle', title: 'Great Circle', subtitle: 'An illustrated loop', description: 'The real planner with a synthetic route and original schematic map. Not navigation or live provider imagery.', version: '1.1.0', origin: 'http://127.0.0.1:5187', path: '/capture/', checkout: 'great_circle', repository: 'https://github.com/rsteth/great_circle', license: 'Original schematic map; no third-party map tiles. Leaflet and app notices remain in force.' }),
]);

export const APP_STORE_STANDARD = Object.freeze({
  verifiedAt: '2026-11-07',
  specification: 'https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications',
  reviewGuidelines: 'https://developer.apple.com/app-store/review/guidelines/#accurate-metadata',
  formats: ['png', 'jpg', 'jpeg'], minImages: 1, maxImagesPerDeviceSize: 10, alphaAllowed: false,
  requirements: 'Apple currently requires iPhone Dynamic Island medium and iPad 13-inch when iPadOS is supported. Additional device/localization requirements must be checked in the target App Store Connect listing.',
  limitation: 'Dimension-matched web renders only. No native iOS, iPadOS or macOS binary or device/simulator capture is registered. Exact pixels do not establish App Store eligibility or App Review acceptance.'
});
const profile = (id,title,group,width,height,deviceScaleFactor,description,extra={}) => Object.freeze({id,title,group,viewport:Object.freeze({width,height}),deviceScaleFactor,output:Object.freeze({width:width*deviceScaleFactor,height:height*deviceScaleFactor}),description,...extra});
export const PROFILES = Object.freeze([
  profile('stethem-thumb','stethem.com thumbnail','Website',1200,900,1,'Intentional 4:3 scene. Original plus 800 × 600 downsample, never cropped.',{derivative:CARD}),
  profile('desktop','Desktop','Web',1440,900,1,'Responsive desktop app scene at 1440 × 900 CSS pixels.'),
  profile('mobile','Mobile','Web',390,844,3,'Responsive mobile web scene at 390 × 844 CSS pixels, rendered at 3× density.'),
  profile('app-store-iphone-6-3','iPhone · medium Dynamic Island','App Store dimensions',402,874,3,'1206 × 2622 portrait. Required iPhone display class in the verified Apple specification.',{appStore:{platform:'iOS',deviceClass:'iPhone with Dynamic Island (medium display)',nativeCapture:false}}),
  profile('app-store-iphone-6-9','iPhone · large Dynamic Island','App Store dimensions',440,956,3,'1320 × 2868 portrait. Additional large-display iPhone coverage.',{appStore:{platform:'iOS',deviceClass:'iPhone with Dynamic Island (large display)',nativeCapture:false}}),
  profile('app-store-ipad-13','iPad · 13-inch','App Store dimensions',1032,1376,2,'2064 × 2752 portrait. Required when the app supports iPadOS.',{appStore:{platform:'iPadOS',deviceClass:'iPad 13-inch',nativeCapture:false}}),
  profile('app-store-mac','Mac · 16:10','App Store dimensions',1440,900,2,'2880 × 1800 landscape. For Mac app metadata, not a native Mac app capture.',{appStore:{platform:'macOS',deviceClass:'Mac',nativeCapture:false}}),
]);
export function profileById(id) {
  const item = PROFILES.find(item => item.id === id);
  if (!item) throw new Error(`Unknown capture profile: ${id}`);
  return item;
}
export function captureCatalog() {
  return {schemaVersion:2,runnerVersion:CAPTURE_VERSION,entrypoint:'/apps/studio/?library=capture',documentation:'/docs/process/capture-studio.md',cli:'npm run capture -- --scene all --profile all --theme both',plan:'npm run capture -- --scene all --profile all --theme both --plan',scope:'Allowlisted local scenes only; static browser UI cannot execute captures. CLI requires this checkout and existing app dependencies/browser. No publication.',mcp:false,workflow:{task:'Grab new thumbs for app X on my personal site',steps:['Discover the app scene in this catalog','Plan and capture with --profile stethem-thumb','Inspect the 800 × 600 card and provenance','Export or stage in review/captures; report files, never silently replace site assets or publish'],command:'npm run capture -- --scene <scene-id> --profile stethem-thumb --theme both',missingScene:'Report the missing approved adapter; do not fabricate screenshots or use private data'},defaultProfile:'stethem-thumb',scenes:SCENES.map(({id,title,version,repository,path})=>({id,title,version,repository,path,profiles:PROFILES.map(p=>p.id)})),profiles:PROFILES,appStore:APP_STORE_STANDARD};
}

export function sceneById(id) {
  const scene = SCENES.find(item => item.id === id);
  if (!scene) throw new Error(`Unknown capture scene: ${id}`);
  return scene;
}
export function sceneURL(id, theme = 'light', profile = 'stethem-thumb') {
  if (!['light', 'dark'].includes(theme)) throw new Error('Capture theme must be light or dark');
  const scene = sceneById(id), url = new URL(scene.path, scene.origin);
  url.searchParams.set('theme', theme);
  profileById(profile);
  if (profile !== 'stethem-thumb') url.searchParams.set('profile', profileById(profile).id);
  return url.href;
}
export function validateManifest(manifest, scene) {
  if (!manifest || manifest.id !== scene.id || manifest.version !== scene.version) throw new Error('Scene manifest identity/version does not match the approved recipe');
  if (manifest.dimensions?.width !== FRAME.width || manifest.dimensions?.height !== FRAME.height) throw new Error('Scene must declare the intentional 1200 × 900 frame');
  for (const profile of PROFILES) {
    const declared = manifest.profiles?.[profile.id];
    if (!declared || declared.width !== profile.viewport.width || declared.height !== profile.viewport.height || declared.deviceScaleFactor !== profile.deviceScaleFactor || declared.output?.width !== profile.output.width || declared.output?.height !== profile.output.height) throw new Error(`Scene does not support approved profile: ${profile.id}`);
  }
  if (manifest.route !== scene.path) throw new Error('Scene manifest route does not match the approved local route');
  if (!Array.isArray(manifest.sourceFiles) || !manifest.sourceFiles.length || manifest.sourceFiles.some(path => typeof path !== 'string' || path.startsWith('/') || path.split(/[\\/]/).some(part => !part || part === '..' || part.startsWith('.')))) throw new Error('Scene sourceFiles must contain safe relative paths');
  return manifest;
}
/** Export links are restricted to this studio's local review directory. */
export function artifactURL(path, base) {
  if (typeof path !== 'string' || !/^review\/captures\/[a-zA-Z0-9_-]+\/(?:focus-reader|great-circle-route)-(?:light|dark)(?:-(?:stethem-thumb|desktop|mobile|app-store-iphone-6-3|app-store-iphone-6-9|app-store-ipad-13|app-store-mac))?\/(?:original|card)\.png$/.test(path)) throw new Error('Invalid capture artifact path');
  const url = new URL('../../' + path, base);
  if (url.origin !== new URL(base).origin) throw new Error('Capture artifacts must be local');
  return url.href;
}
/** Verify downloaded pixels before presenting a local export as reviewable. */
export async function verifyPNG(bytes, artifact, dimensions) {
  const data = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  if (!artifact || artifact.width !== dimensions.width || artifact.height !== dimensions.height || !/^[a-f0-9]{64}$/.test(artifact.sha256)) throw new Error('Invalid export dimensions or hash');
  if (data.length < 24 || ![137,80,78,71,13,10,26,10].every((value,index) => data[index] === value)) throw new Error('Export is not a PNG');
  const header = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (header.getUint32(16) !== dimensions.width || header.getUint32(20) !== dimensions.height) throw new Error('PNG dimensions do not match the recorded export');
  const digest = [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', data))].map(value => value.toString(16).padStart(2,'0')).join('');
  if (digest !== artifact.sha256) throw new Error('PNG hash does not match the recorded export');
}
