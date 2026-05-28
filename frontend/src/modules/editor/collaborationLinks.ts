export function buildInviteLink(sessionId: string, origin = window.location.origin): string {
  return `${origin}/session/${encodeURIComponent(sessionId)}`;
}

export function readSessionIdFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get('session');
  return value && value.trim() ? value.trim() : null;
}

