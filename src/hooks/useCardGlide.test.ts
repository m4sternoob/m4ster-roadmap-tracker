import { describe, it, expect } from 'vitest';
import { flipDelta, prefersReducedMotion } from './useCardGlide';

describe('flipDelta', () => {
  it('returns null for sub-pixel noise', () => {
    expect(flipDelta({ left: 0, top: 0 }, { left: 3, top: -3 })).toBeNull();
  });

  it('returns the inverted offset for a real move', () => {
    expect(flipDelta({ left: 100, top: 200 }, { left: 300, top: 240 })).toEqual({
      dx: -200,
      dy: -40,
    });
  });

  it('rounds offsets to whole pixels', () => {
    expect(flipDelta({ left: 0.2, top: 0 }, { left: 10.6, top: 0 })).toEqual({
      dx: -10,
      dy: 0,
    });
  });

  it('treats one axis over the threshold as a move', () => {
    expect(flipDelta({ left: 0, top: 0 }, { left: 0, top: 50 })).toEqual({
      dx: 0,
      dy: -50,
    });
  });
});

describe('prefersReducedMotion', () => {
  it('is false when matchMedia is unavailable', () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
