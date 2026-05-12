import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from './apiService';

describe('ApiService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('wraps GET, POST, PUT and DELETE responses with data and status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      json: vi.fn().mockResolvedValue({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const api = new ApiService('/api');

    await expect(api.get('/projects')).resolves.toEqual({ data: { ok: true }, status: 201 });
    await api.post('/projects', { name: 'ALU' });
    await api.put('/projects/1', { name: 'CPU' });
    await api.delete('/projects/1');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/projects', { method: 'GET' });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'ALU' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'CPU' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/projects/1', { method: 'DELETE' });
  });
});
