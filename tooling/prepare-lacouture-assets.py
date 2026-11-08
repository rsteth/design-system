#!/usr/bin/env python3
"""Prepare full-page previews and exact SVG/data copies. macOS sips is required.

Run with --check for read-only integrity verification of committed assets.
Regeneration requires the original exported web/dist supplied with --source.
No scan is ever rewritten. No color correction or crop is performed.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
COLLECTION = ROOT / 'collections/material/lacouture-1890'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def describe(path):
    return {'file': path.relative_to(COLLECTION).as_posix(),
            'sha256': digest(path), 'bytes': path.stat().st_size}


def dimensions(path):
    result = subprocess.check_output(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path)], text=True)
    return {name: int(re.search(r'pixel' + name.title() + r': (\d+)', result).group(1))
            for name in ('width', 'height')}


def inspect_svg(path):
    raw = path.read_text()
    if re.search(r'<!DOCTYPE|<!ENTITY|<\?xml-stylesheet', raw, re.I):
        raise ValueError(f'Unexpected XML declaration in {path.name}')
    root = ET.fromstring(raw)
    for element in root.iter():
        tag = element.tag.rsplit('}', 1)[-1].lower()
        if tag in ('script', 'foreignobject', 'image', 'feimage', 'animate', 'animatetransform', 'set'):
            raise ValueError(f'Active or raster SVG element {tag} in {path.name}')
        for key, value in element.attrib.items():
            key = key.rsplit('}', 1)[-1].lower()
            if key.startswith('on') or (key in ('href', 'src') and not value.startswith('#')):
                raise ValueError(f'Active or external SVG attribute {key} in {path.name}')
    # URLs in provenance/title text are fine; CSS URLs must be local fragment references.
    for target in re.findall(r'url\(\s*[\"\x27]?([^\)\"\x27]+)', raw, re.I):
        if not target.startswith('#'):
            raise ValueError(f'External SVG CSS reference in {path.name}')
    if re.search(r'@import|javascript:|data:image', raw, re.I):
        raise ValueError(f'External or embedded SVG content in {path.name}')


def validate(manifest):
    assert len(manifest['items']) == 39
    for item in manifest['items']:
        scan = COLLECTION / item['file']
        assert digest(scan) == item['sha256'], f'Changed scan: {scan}'
        assert dimensions(scan) == {k: item[k] for k in ('width', 'height')}
        assert [p['height'] for p in item['previews']] == [750, 1500]
        for preview in item['previews']:
            path = COLLECTION / preview['file']
            assert describe(path) == {k: preview[k] for k in ('file', 'sha256', 'bytes')}
            assert dimensions(path) == {k: preview[k] for k in ('width', 'height')}
            assert abs(preview['width'] - item['width'] * preview['height'] / item['height']) <= 1
            assert preview['bytes'] < scan.stat().st_size
    assets = manifest['translation']['assets']
    assert len([a for a in assets if a['file'].endswith('.svg')]) == 29
    for asset in assets:
        path = COLLECTION / asset['file']
        assert describe(path) == asset
        if path.suffix == '.svg':
            inspect_svg(path)
    print(json.dumps({'scansUnchanged': 39, 'previews': 78,
          'scanBytes': sum((COLLECTION / i['file']).stat().st_size for i in manifest['items']),
          'previewBytesByHeight': {h: sum(p['bytes'] for i in manifest['items'] for p in i['previews'] if p['height'] == h) for h in (750, 1500)},
          'svgFiles': 29, 'translationFiles': len(assets),
          'translationBytes': sum(a['bytes'] for a in assets),
          'svgInspection': 'No scripts, event handlers, external resource references, embedded rasters or foreign objects found.'}, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'review/lacouture-port-inputs/web/dist')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    manifest_path = COLLECTION / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    if args.check:
        validate(manifest)
        return
    source = args.source.resolve()
    source_manifest = source / 'data/manifest.json'
    imported = json.loads(source_manifest.read_text())
    entries = {item['slug']: item for item in imported['plates'] + imported['extras']}
    assert set(entries) == {item['id'] for item in manifest['items']}
    svgs = sorted((source / 'plates').glob('*.svg'))
    assert len(svgs) == 29
    data = [source_manifest, source / 'data/swatches.json'] + sorted((source / 'data').glob('plate-*.json'))
    # Validate every input before copying or producing previews.
    for svg in svgs:
        inspect_svg(svg)
    for path in data:
        json.loads(path.read_text())
    for item in manifest['items']:
        assert digest(COLLECTION / item['file']) == item['sha256'], f'Changed scan: {item["id"]}'
    assets = []
    for source_path in svgs + data:
        relative = source_path.relative_to(source)
        destination = COLLECTION / 'translation' / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source_path, destination)
        assert digest(destination) == digest(source_path)
        assets.append(describe(destination))
    for item in manifest['items']:
        entry = entries[item['id']]
        for key in ('section', 'sectionTitle', 'kind', 'swatchCount'):
            if key in entry:
                item[key] = entry[key]
        if entry.get('svg'):
            svg = COLLECTION / 'translation' / entry['svg']
            item.update(svg=svg.relative_to(COLLECTION).as_posix(), svgSha256=digest(svg), svgBytes=svg.stat().st_size)
        data_path = COLLECTION / 'translation/data' / (item['id'] + '.json')
        if data_path.exists():
            item.update(data=data_path.relative_to(COLLECTION).as_posix(), dataSha256=digest(data_path), dataBytes=data_path.stat().st_size)
        item['previews'] = []
        scan = COLLECTION / item['file']
        for height in (750, 1500):
            preview = COLLECTION / 'previews' / str(height) / (item['id'] + '.jpg')
            preview.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(['sips', '--resampleHeight', str(height), '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', str(scan), '--out', str(preview)], check=True, stdout=subprocess.DEVNULL)
            item['previews'].append({**describe(preview), **dimensions(preview)})
    manifest['previewGeneration'] = {
        'tool': 'macOS sips', 'heights': [750, 1500], 'jpegQuality': 80,
        'method': 'Proportional full-page resize from the unchanged 3000px JPEG scans; no crop or color correction.'}
    manifest['translation'] = {
        'label': 'SVG and flat-color translation',
        'credit': manifest['credit'],
        'provenance': 'Exact SVG and JSON assets from the prior Lacouture web translation export; adapted into this viewer without importing the original application or hosting configuration.',
        'approximation': 'Scan-derived screen sRGB approximations, not calibrated measurements of the original inks. Paper, aging and scanning influence the colors. SVG geometry and typography are a reconstruction; paper wear and fine lithographic texture are omitted.',
        'rights': 'The historical work is recorded NOT_IN_COPYRIGHT by the source catalog. This translation is distinct from Lacouture’s original and the Getty digitization; no additional license is asserted here.',
        'sourceManifest': 'translation/data/manifest.json',
        'sourceManifestSha256': digest(source_manifest),
        'swatches': 'translation/data/swatches.json',
        'swatchesSha256': digest(source / 'data/swatches.json'),
        'assets': assets,
        'svgInspection': 'All 29 SVGs checked: no scripts, event handlers, external resource references, embedded rasters or foreign objects.'}
    validate(manifest)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
