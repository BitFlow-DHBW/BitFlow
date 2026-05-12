import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId, nowIso } from './id';

describe('id utilities', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses crypto.randomUUID when available', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000201');

    expect(createId('gate')).toBe('gate_00000000-0000-4000-8000-000000000201');
  });

  it('returns ISO timestamps for persistence metadata', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-12T10:15:30.000Z'));

    expect(nowIso()).toBe('2026-05-12T10:15:30.000Z');
  });
});
