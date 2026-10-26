import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../store.js';

const BASE = 'http://x';
const ok = (body, status = 200) => ({ ok: true, status, json: async () => body });

function setup(response = ok({})) {
  const fetchFn = vi.fn().mockResolvedValue(response);
  return { fetchFn, store: createStore(BASE, fetchFn) };
}

describe('store: the five HTTP methods', () => {
  it('GET list', async () => {
    const { store, fetchFn } = setup(ok([{ id: 1 }]));
    expect(await store.list()).toEqual([{ id: 1 }]);
    expect(fetchFn).toHaveBeenCalledWith(`${BASE}/places`, expect.objectContaining({ method: 'GET', body: undefined }));
  });
  it('POST create', async () => {
    const { store, fetchFn } = setup();
    await store.create({ name: 'A' });
    const [url, opts] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE}/places`);
    expect(opts.method).toBe('POST');
    expect(opts.body).toBe('{"name":"A"}');
    expect(opts.headers['Content-Type']).toBe('application/json');
  });
  it('PUT replace', async () => {
    const { store, fetchFn } = setup();
    await store.replace(3, { name: 'B' });
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/places/3`);
    expect(fetchFn.mock.calls[0][1].method).toBe('PUT');
  });
  it('PATCH patch', async () => {
    const { store, fetchFn } = setup();
    await store.patch(3, { lat: 1 });
    expect(fetchFn.mock.calls[0][1].method).toBe('PATCH');
  });
  it('DELETE remove', async () => {
    const { store, fetchFn } = setup();
    await store.remove(3);
    expect(fetchFn.mock.calls[0][1].method).toBe('DELETE');
  });
});

describe('store: errors', () => {
  it('returns null on 204', async () => {
    const { store } = setup({ ok: true, status: 204 });
    expect(await store.remove(1)).toBeNull();
  });
  it('throws on a non-ok response', async () => {
    const { store } = setup({ ok: false, status: 404 });
    await expect(store.list()).rejects.toThrow(/404/);
  });
  it('throws a friendly error when the server is unreachable', async () => {
    const store = createStore(BASE, async () => { throw new TypeError('x'); });
    await expect(store.list()).rejects.toThrow(/Is it running/);
  });
});
