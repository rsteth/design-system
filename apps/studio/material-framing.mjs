// Bounds of the existing SVG swatch geometry, in unchanged full-page scan coordinates.
// These define a shared viewing frame, not a registration transform or a crop.
// Browser regression checks compare every entry with the rendered SVG getBBox().
export const materialArtworkBounds = {
  "plate-i": [
    512,
    943,
    1594,
    2025
  ],
  "plate-i-bis": [
    146.14,
    636.64,
    1952.2,
    2293.9
  ],
  "plate-ii": [
    551.19,
    1045.68,
    1481.65,
    1972.32
  ],
  "plate-iii": [
    565.96,
    1039.69,
    1498.96,
    1969.31
  ],
  "plate-iv": [
    556.94,
    1048.69,
    1486.97,
    1978.31
  ],
  "plate-v": [
    550.96,
    1045.69,
    1483.96,
    1975.31
  ],
  "plate-vi": [
    604.97,
    1039.68,
    1534.99,
    1966.32
  ],
  "plate-vii": [
    532.95,
    1045.69,
    1465.95,
    1975.31
  ],
  "plate-viii": [
    571.98,
    1033.71,
    1507.95,
    1966.29
  ],
  "plate-ix": [
    583.97,
    1048.69,
    1516.97,
    1978.31
  ],
  "plate-x": [
    529.93,
    1009.7,
    1459.96,
    1939.31
  ],
  "plate-xi": [
    463.94,
    1021.73,
    1399.92,
    1957.28
  ],
  "plate-xii": [
    536.19,
    1000.73,
    1466.66,
    1936.28
  ],
  "plate-xiii": [
    520.96,
    997.68,
    1456.94,
    1924.32
  ],
  "plate-xiv": [
    335.66,
    838.26,
    1663.54,
    2165.53
  ],
  "plate-xv": [
    342.03,
    834.02,
    1669.9,
    2161.29
  ],
  "plate-xvi": [
    352.62,
    855.21,
    1676.29,
    2178.28
  ],
  "plate-xvii": [
    377.91,
    848.85,
    1700.98,
    2171.91
  ],
  "plate-xviii": [
    327.17,
    838.26,
    1655.05,
    2165.53
  ],
  "plate-xix": [
    327.32,
    859.47,
    1655.82,
    2186.74
  ],
  "plate-xx": [
    312.46,
    904.02,
    1640.95,
    2231.29
  ],
  "plate-xxi": [
    326.98,
    770.34,
    1645.85,
    2089.2
  ],
  "plate-xxii": [
    331.45,
    808.59,
    1665.63,
    2142.16
  ],
  "plate-xxiii": [
    576,
    1058.01,
    1375,
    1857.05
  ],
  "plate-xxiv": [
    587,
    1046.01,
    1388,
    1849.09
  ],
  "plate-xxv": [
    596,
    1058.01,
    1388,
    1862.25
  ],
  "plate-xxvi": [
    601,
    1049.01,
    1392,
    1852.09
  ],
  "plate-xxvii": [
    584,
    1052.01,
    1375,
    1854.52
  ],
  "plate-xxviii": [
    611,
    1028.01,
    1412,
    1827.05
  ]
};

export function materialFraming(item, mode, availableWidth, availableHeight) {
  const pageScale = Math.max(1, Math.min(availableWidth, availableHeight * item.width / item.height)) / item.width;
  const bounds = materialArtworkBounds[item.id];
  let scale = pageScale, center;
  if (mode === 'artwork' && bounds) {
    const [left, top, right, bottom] = bounds;
    const width = right - left, height = bottom - top;
    // Room for the printed frame and nearby labels, while retaining all page pixels.
    const padX = Math.max(32, width * .08), padY = Math.max(32, height * .08);
    scale = Math.min(availableWidth / (width + 2 * padX), availableHeight / (height + 2 * padY));
    center = [(left + right) / 2 / item.width, (top + bottom) / 2 / item.height];
  } else if (mode === 'width') scale = availableWidth / item.width;
  else if (mode === 'actual') scale = 1;
  else if (['1.5','2','3'].includes(String(mode))) scale = Number(mode);
  return { width: Math.max(1, item.width * scale), scale, center };
}
