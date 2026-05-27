import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, ApiService } from './apiService';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
}

describe('ApiService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('wraps GET, POST, PUT and DELETE responses with data and status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true }, { status: 201 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const api = new ApiService('/api');

    await expect(api.get('/projects')).resolves.toEqual({ data: { ok: true }, status: 201 });
    await api.post('/projects', { name: 'ALU' });
    await api.put('/projects/1', { name: 'CPU' });
    await api.delete('/projects/1');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/projects', { method: 'GET' });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'ALU' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/projects/1', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'CPU' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/projects/1', { method: 'DELETE' });
  });

  it('adds bearer auth when a token exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const api = new ApiService('/api', () => 'session_token');
    await api.get('/projects');

    expect(fetchMock).toHaveBeenCalledWith('/api/projects', {
      method: 'GET',
      headers: { authorization: 'Bearer session_token' },
    });
  });

  it('throws API errors with problem detail titles', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ title: 'Projekt wurde nicht gefunden.' }, { status: 404 })),
    );

    const api = new ApiService('/api');
    const request = api.get('/projects/missing');

    await expect(request).rejects.toThrow(ApiError);
    await expect(request).rejects.toThrow('Projekt wurde nicht gefunden.');
  });
});
