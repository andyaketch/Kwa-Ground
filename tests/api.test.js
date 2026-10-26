import { describe, it, expect, vi } from 'vitest';
import { buildPlacesUrl, normaliseFeature, placeToRecord, fetchPlaces } from '../api.js';

const feature = {
  properties: { place_id: 'abc', name: ' Shop ', address_line2: 'Moi Ave', lat: -1.28, lon: 36.82 },
  geometry: { coordinates: [36.82, -1.28] },
};

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });
const failResponse = (status) => ({ ok: false, status, json: async () => ({}) });

describe('buildPlacesUrl', () => {
  it('includes category, rect, limit and key', () => {
    const url = buildPlacesUrl('1,2,3,4', 'KEY');
    expect(url).toContain('categories=building.commercial');
    expect(url).toContain('rect%3A1%2C2%2C3%2C4');
    expect(url).toContain('limit=100');
    expect(url).toContain('apiKey=KEY');
  });
  it('accepts overrides', () => {
    expect(buildPlacesUrl('r', 'K', { category: 'catering.restaurant', limit: 5 })).toContain('limit=5');
  });
});

describe('normaliseFeature', () => {
  it('flattens a feature', () => {
    expect(normaliseFeature(feature)).toEqual({
      placeId: 'abc', name: 'Shop', address: 'Moi Ave', lat: -1.28, lon: 36.82,
    });
  });
  it('falls back to geometry and a default name', () => {
    const f = { properties: { place_id: 1 }, geometry: { coordinates: [36, -1] } };
    const n = normaliseFeature(f);
    expect(n.lat).toBe(-1);
    expect(n.lon).toBe(36);
    expect(n.name).toBe('Unnamed building');
  });
  it('returns null for unusable features', () => {
    expect(normaliseFeature(null)).toBeNull();
    expect(normaliseFeature({ properties: {} })).toBeNull();
    expect(normaliseFeature({ properties: { place_id: 1 } })).toBeNull();
  });
});

describe('placeToRecord', () => {
  it('keeps original and current positions', () => {
    const r = placeToRecord({ placeId: 'a', name: 'N', address: 'A', lat: 1, lon: 2 });
    expect(r).toMatchObject({ originalLat: 1, originalLon: 2, lat: 1, lon: 2, status: 'unchecked' });
  });
});

describe('fetchPlaces', () => {
  it('returns normalised places', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse({ features: [feature, { properties: {} }] }));
    const places = await fetchPlaces('r', 'KEY', { fetchFn });
    expect(places).toHaveLength(1);
    expect(fetchFn).toHaveBeenCalledOnce();
  });
  it('handles a response without features', async () => {
    const fetchFn = vi.fn().mockResolvedValue(okResponse({}));
    expect(await fetchPlaces('r', 'KEY', { fetchFn })).toEqual([]);
  });
  it('refuses to run with the placeholder key', async () => {
    const fetchFn = vi.fn();
    await expect(fetchPlaces('r', 'YOUR_GEOAPIFY_KEY', { fetchFn })).rejects.toThrow(/API key/);
    await expect(fetchPlaces('r', '', { fetchFn })).rejects.toThrow(/API key/);
    expect(fetchFn).not.toHaveBeenCalled();
  });
  it('gives clear errors for 401, 429 and other statuses', async () => {
    const run = (status) => fetchPlaces('r', 'KEY', { fetchFn: async () => failResponse(status) });
    await expect(run(401)).rejects.toThrow(/rejected/);
    await expect(run(403)).rejects.toThrow(/rejected/);
    await expect(run(429)).rejects.toThrow(/limit/);
    await expect(run(500)).rejects.toThrow(/500/);
  });
  it('reports network failure', async () => {
    const fetchFn = async () => { throw new TypeError('fail'); };
    await expect(fetchPlaces('r', 'KEY', { fetchFn })).rejects.toThrow(/Could not reach/);
  });
});
