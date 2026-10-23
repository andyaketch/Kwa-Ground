// api.js: talks to the PUBLIC data source (Geoapify Places).
// It takes the key as an argument, so the key never lives in this file
// and the tests don't need a config.js.

const ENDPOINT = 'https://api.geoapify.com/v2/places';

export function buildPlacesUrl(rect, apiKey, { category = 'building.commercial', limit = 100 } = {}) {
  const params = new URLSearchParams({
    categories: category,
    filter: `rect:${rect}`,
    limit: String(limit),
    apiKey,
  });
  return `${ENDPOINT}?${params}`;
}

// One GeoJSON feature -> a small flat object, or null if unusable.
export function normaliseFeature(feature) {
  const p = feature?.properties;
  if (!p || p.place_id == null) return null;

  const [geoLon, geoLat] = feature.geometry?.coordinates ?? [];
  const lat = Number.isFinite(p.lat) ? p.lat : geoLat;
  const lon = Number.isFinite(p.lon) ? p.lon : geoLon;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    placeId: p.place_id,
    name: (p.name || p.address_line1 || 'Unnamed building').trim(),
    address: (p.address_line2 || p.formatted || '').trim(),
    lat,
    lon,
  };
}

// Shape of a record as stored in JSON Server. We keep BOTH positions.
export function placeToRecord(place) {
  return {
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    originalLat: place.lat,
    originalLon: place.lon,
    lat: place.lat,
    lon: place.lon,
    status: 'unchecked',
    note: '',
  };
}

export async function fetchPlaces(rect, apiKey, options = {}) {
  const fetchFn = options.fetchFn ?? ((...args) => fetch(...args));

  if (!apiKey || apiKey.startsWith('YOUR_')) {
    throw new Error('Add your Geoapify API key to config.js first.');
  }

  let response;
  try {
    response = await fetchFn(buildPlacesUrl(rect, apiKey, options));
  } catch {
    throw new Error('Could not reach Geoapify. Check your connection.');
  }

  // fetch() does NOT reject on 401 or 429, so check response.ok ourselves.
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Geoapify rejected the API key (check its restrictions).');
    }
    if (response.status === 429) {
      throw new Error('Geoapify daily limit reached. Try again later.');
    }
    throw new Error(`Geoapify error ${response.status}.`);
  }

  const data = await response.json();
  return (data.features ?? []).map(normaliseFeature).filter(Boolean);
}
