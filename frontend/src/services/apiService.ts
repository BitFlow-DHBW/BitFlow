import type { ApiResult } from '../types/domain';
import { readSessionToken } from './sessionStore';

type TokenProvider = () => string | null;

interface ErrorPayload {
  title?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiService {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider = () => null,
  ) {}

  async get<T>(path: string): Promise<ApiResult<T>> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    return this.request<T>(path, {
      method: 'POST',
      ...(body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
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
    const response = await fetch(`${this.baseUrl}${path}`, this.withAuth(init));
    const data = (await parseResponseBody(response)) as T;

    if (!response.ok) {
      throw new ApiError(errorMessage(data, response.status), response.status, data);
    }

    return { data, status: response.status };
  }

  private withAuth(init: RequestInit): RequestInit {
    const headers = new Headers(init.headers);
    const token = this.tokenProvider();

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const nextInit = { ...init };
    if ([...headers.keys()].length > 0) {
      nextInit.headers = Object.fromEntries(headers.entries());
    } else {
      delete nextInit.headers;
    }

    return nextInit;
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object') {
    const { title, message } = payload as ErrorPayload;
    if (title) return title;
    if (message) return message;
  }

  return `Anfrage fehlgeschlagen (${status}).`;
}

export const apiService = new ApiService('/api', readSessionToken);
