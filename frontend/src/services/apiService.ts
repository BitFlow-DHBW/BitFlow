import type { ApiResult } from '../types/domain';

export class ApiService {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string): Promise<ApiResult<T>> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async put<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    return this.request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<ApiResult<T>> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  private async request<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    const data = (await response.json()) as T;
    return { data, status: response.status };
  }
}

export const apiService = new ApiService('/api');
