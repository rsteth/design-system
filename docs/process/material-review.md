# Material: Lacouture (1890)

Reviewed locally on 2026-11-08. The Material dropdown is separate from Robin, Reference studies and Production. `/apps/studio/?library=material` opens the historical panels; `&view=translation` opens the existing atlas link. `&panel=plate-ii` selects a scan directly.

## Evidence and preservation

- 29 distinct plates (I, I bis, II–XXVIII) plus 10 supplementary pages. The opening rose frontispiece is a duplicate, not a thirtieth plate.
- Credit: Charles Lacouture, *Répertoire chromatique* (1890), chromolithographs by G. Severeyns, digitized by the Getty Research Institute via Internet Archive.
- [Internet Archive source](https://archive.org/details/gri_33125012875395) identifies Getty Research Institute, scanner `gri-digital-services`, and `NOT_IN_COPYRIGHT`. [Commons](https://commons.wikimedia.org/wiki/File:Getty_Research_Institute_(IA_gri_33125012875395).pdf) documents public-domain status.
- Every acquired 3000px-high JPEG is copied byte-for-byte. Per-file hashes, dimensions and source leaf URLs are in `collections/material/lacouture-1890/manifest.json`; the original README and CSV are retained unchanged. No cropping or color correction. These derivatives are not calibrated historic ink measurements.
- The existing web atlas remains private to Robin and opens separately. Its source and private assets are not copied, its access is unchanged, and it is not embedded or fetched by the viewer.

## Attribution and source privacy

The top release banner is replaced with a quiet footer Attribution link. Reference-specific non-affiliation copy appears only in Reference studies, not Robin or Capture studio. Full third-party notices and the MIT notice for imported reference analyses remain accessible.

GitHub verification found public source commits for Focus, Great Circle, stethem and VoltAgent's reference analyses. The workbench's recorded source revision did not resolve publicly, and Reads/Bandit repositories are private. A commit hash does not grant repository access, but unverified revision identifiers are withheld from displayed source metadata and public packaging. Authoritative local snapshots stay intact. Redacted collection and inventory revisions are null with an explicit `withheldRevisions` list; the inventory contract permits this only when marked. The public builder recomputes inventory hashes after export redaction and preserves unchanged token bytes. `publicVersionMetadata(collection, actualPackageVersion)` supports a separately verified version label while withholding commit fields. The public source allowlist records the four verified canonical commit URLs and the check date. File SHA-256 evidence is retained.

The baseline public packager still supports only Focus, Great Circle and stethem. It excludes Reads/Bandit registry directories and entries instead of accidentally distributing private snapshots or broken local fixture links. Adding authorized public previews for these apps is a separate explicit release integration.

## Validation

- `npm run check`: passed, including all 122 tests, deterministic regeneration of 84 reference analyses/758 files, generated skin integrity and static build.
- `tests/workbench/material-browser.mjs`: passed in fresh Chrome at 1440×1000 and 390×844. All 39 images loaded, previous/next boundaries, repeated tabs, Back/Forward, rapid workspace changes, deep links, invalid-panel fallback, failed-manifest retry, attribution links and revision suppression passed.
- No external network requests or uncaught errors during the focused browser run. Capture studio's unrelated localhost fixture preview was blocked and not assessed; this is not a full app-fixture pass.
- Desktop/mobile screenshots were visually inspected. Evidence lives under ignored `review/material-qa/` and is not a publication input.
- Source checkout and both original stash entries remain unchanged. No push or deployment was performed by this task.
