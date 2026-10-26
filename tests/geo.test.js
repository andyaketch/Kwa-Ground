import { describe, it, expect } from 'vitest';
import { boundsToRect, isAreaTooLarge, round6 } from '../geo.js';

const fakeBounds = (w, s, e, n) => ({
  getWest: () => w,
  getSouth: () => s,
  getEast: () => e,
  getNorth: () => n,
});

describe('boundsToRect', () => {
  it('puts longitude first: west,south,east,north', () => {
    expect(boundsToRect(fakeBounds(36.8, -1.3, 36.9, -1.2))).toBe(
      '36.80000,-1.30000,36.90000,-1.20000'
    );
  });
});

describe('isAreaTooLarge', () => {
  it('accepts a city-sized box', () => {
    expect(isAreaTooLarge(fakeBounds(36.8, -1.3, 36.9, -1.2))).toBe(false);
  });
  it('rejects a box that is too wide', () => {
    expect(isAreaTooLarge(fakeBounds(36.0, -1.3, 37.0, -1.2))).toBe(true);
  });
  it('rejects a box that is too tall', () => {
    expect(isAreaTooLarge(fakeBounds(36.8, -2.0, 36.9, -1.2))).toBe(true);
  });
});

describe('round6', () => {
  it('rounds to six decimals', () => {
    expect(round6(1.23456789)).toBe(1.234568);
  });
});
