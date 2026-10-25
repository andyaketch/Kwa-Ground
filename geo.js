// is helpers for map geometry especially to do with bounding boxes

// Geoapify wants LONGITUDE first: "west,south,east,north"

export function boundsToRect(bounds) {
  const west = bounds.getWest();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const north = bounds.getNorth();
  return [west, south, east, north].map((n) => n.toFixed(5)).join(',');
//with exactly five decimals,
}
//importing a huge area in one go
export function isAreaTooLarge(bounds, maxSpanDegrees = 0.6) {
  const width = bounds.getEast() - bounds.getWest();
  const height = bounds.getNorth() - bounds.getSouth();
  return width > maxSpanDegrees || height > maxSpanDegrees;
}

export function round6(n) {
  return Math.round(n * 1e6) / 1e6;
//1e6 to mean 1 times 10 to the power of 6
}
