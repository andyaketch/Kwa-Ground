// geo.js: pure helpers for map geometry. No DOM, no Leaflet import,
// so they are easy to test with a fake "bounds" object.

// Leaflet bounds -> Geoapify rect string.
// Geoapify wants LONGITUDE first: "west,south,east,north".
export function boundsToRect(bounds) {
  const west = bounds.getWest();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const north = bounds.getNorth();
  return [west, south, east, north].map((n) => n.toFixed(5)).join(',');
}

// Refuse to import a huge area in one go (about 0.6 degrees is roughly 65 km).
export function isAreaTooLarge(bounds, maxSpanDegrees = 0.6) {
  const width = bounds.getEast() - bounds.getWest();
  const height = bounds.getNorth() - bounds.getSouth();
  return width > maxSpanDegrees || height > maxSpanDegrees;
}

export function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}
