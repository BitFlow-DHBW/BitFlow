import { describe, expect, it } from 'vitest';
import { readStorage, removeStorage, writeStorage } from './localStorage';

describe('localStorage helpers', () => {
  it('writes, reads and removes structured values', () => {
    writeStorage('bitflow.test', { gates: 2 });

    expect(readStorage('bitflow.test', { gates: 0 })).toEqual({ gates: 2 });

    removeStorage('bitflow.test');
    expect(readStorage('bitflow.test', { gates: 0 })).toEqual({ gates: 0 });
  });

  it('returns the fallback for missing or invalid JSON data', () => {
    window.localStorage.setItem('bitflow.invalid', '{broken');

    expect(readStorage('bitflow.missing', ['fallback'])).toEqual(['fallback']);
    expect(readStorage('bitflow.invalid', ['fallback'])).toEqual(['fallback']);
  });
});
