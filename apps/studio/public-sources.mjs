/** Public commit evidence checked against GitHub; NASA added 2026-11-12. Source snapshots stay unchanged. */
export const PUBLIC_SOURCE_REVISIONS = Object.freeze({
  '17b2929e8ec5b8e3ac9cda5d4c0c3c65f28169de': 'https://github.com/nasa/hds-core/commit/17b2929e8ec5b8e3ac9cda5d4c0c3c65f28169de',
  eaa95bf1316f5e5fcd8a7e9600eafaa2e52665f0: 'https://github.com/rsteth/focus-speed-reader/commit/eaa95bf1316f5e5fcd8a7e9600eafaa2e52665f0',
  f84c7f80dbd115da710fca04e3267e4c96709442: 'https://github.com/rsteth/great_circle/commit/f84c7f80dbd115da710fca04e3267e4c96709442',
  '3ea81c22d0101f2fc537e7e4338010bc981479d5': 'https://github.com/rsteth/rsteth.github.io/commit/3ea81c22d0101f2fc537e7e4338010bc981479d5',
  fcc70284932276d085f01ef9f83edde90b1258cb: 'https://github.com/VoltAgent/awesome-design-md/commit/fcc70284932276d085f01ef9f83edde90b1258cb'
});
export function redactUnverifiedRevisions(text) {
  return text.replace(/\b[0-9a-f]{40}\b/gi, revision => Object.hasOwn(PUBLIC_SOURCE_REVISIONS, revision.toLowerCase()) ? revision : 'revision-not-publicly-verified');
}
export function publicSourceMetadata(value, { withholdAllRevisions = false } = {}) {
  if (typeof value === 'string') return redactUnverifiedRevisions(value);
  if (Array.isArray(value)) return value.map(child => publicSourceMetadata(child, {withholdAllRevisions}));
  if (value && typeof value === 'object') {
    const output = {}, withheld = new Set(Array.isArray(value.withheldRevisions) ? value.withheldRevisions : []);
    for (const [key, child] of Object.entries(value)) {
      if (/revision$/i.test(key) && typeof child === 'string' && /^[a-f0-9]{40}$/i.test(child) && (withholdAllRevisions || !Object.hasOwn(PUBLIC_SOURCE_REVISIONS, child.toLowerCase()))) {
        output[key] = null; withheld.add(key);
      } else output[key] = publicSourceMetadata(child, {withholdAllRevisions});
    }
    if (withheld.size) output.withheldRevisions = [...withheld].sort();
    return output;
  }
  return value;
}
/** Keep unchanged JSON bytes, including token documents and their recorded digests, exact. */
export function publicMetadataJSON(text) {
  const original = JSON.parse(text), redacted = publicSourceMetadata(original);
  return JSON.stringify(original) === JSON.stringify(redacted) ? text : JSON.stringify(redacted, null, 2) + '\n';
}

/** Caller must supply a version read from the actual application package, never infer one. */
export function publicVersionMetadata(collection, version) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) throw new TypeError('An actual recorded package version is required');
  const output = publicSourceMetadata(collection, {withholdAllRevisions: true});
  if (!output.source) throw new TypeError('Collection source metadata is required');
  output.source.publicVersion = version;
  return output;
}
