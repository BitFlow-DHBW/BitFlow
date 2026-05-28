import { describe, expect, it } from 'vitest';
import { buildInviteLink, readSessionIdFromSearch } from './collaborationLinks';

describe('collaborationLinks', () => {
  it('builds local invite links for session routes', () => {
    expect(buildInviteLink('session_abc', 'http://localhost:5173')).toBe('http://localhost:5173/session/session_abc');
  });

  it('reads session ids from legacy search links', () => {
    expect(readSessionIdFromSearch('?session=session_abc')).toBe('session_abc');
    expect(readSessionIdFromSearch('?project=demo')).toBeNull();
  });
});

