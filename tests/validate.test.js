import { describe, it, expect } from 'vitest';
import { validateRecord, STATUSES } from '../validate.js';

const good = { name: 'Total Station', address: 'Mombasa Rd', lat: '-1.3', lon: '36.8', status: 'confirmed', note: '' };

describe('validateRecord', () => {
  it('accepts a good record and converts coordinates to numbers', () => {
    const r = validateRecord(good);
    expect(r.valid).toBe(true);
    expect(r.value.lat).toBe(-1.3);
    expect(r.value.lon).toBe(36.8);
  });

  it('trims text fields', () => {
    expect(validateRecord({ ...good, name: '  Abc  ' }).value.name).toBe('Abc');
  });

  it('rejects a short or missing name', () => {
    expect(validateRecord({ ...good, name: 'A' }).valid).toBe(false);
    expect(validateRecord({ ...good, name: undefined }).valid).toBe(false);
  });

  it('rejects over-long fields', () => {
    expect(validateRecord({ ...good, name: 'x'.repeat(101) }).valid).toBe(false);
    expect(validateRecord({ ...good, address: 'x'.repeat(201) }).valid).toBe(false);
    expect(validateRecord({ ...good, note: 'x'.repeat(281) }).valid).toBe(false);
  });

  it('rejects empty, non-numeric and out-of-range coordinates', () => {
    expect(validateRecord({ ...good, lat: '' }).valid).toBe(false);
    expect(validateRecord({ ...good, lon: 'abc' }).valid).toBe(false);
    expect(validateRecord({ ...good, lat: 91 }).valid).toBe(false);
    expect(validateRecord({ ...good, lon: -181 }).valid).toBe(false);
    expect(validateRecord({ ...good, lat: null }).valid).toBe(false);
  });

  it('rejects an unknown status', () => {
    expect(validateRecord({ ...good, status: 'weird' }).valid).toBe(false);
  });

  it('lists every error, not just the first', () => {
    const r = validateRecord({ name: '', lat: '', lon: '', status: 'x' });
    expect(r.errors.length).toBe(4);
  });

  it('knows four statuses', () => {
    expect(STATUSES).toHaveLength(4);
  });
});
