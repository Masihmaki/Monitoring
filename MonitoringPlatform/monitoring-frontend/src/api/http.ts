import { API_BASE_URL } from '../config/app';

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

type RequestOptions = RequestInit & {
  token?: string;
};

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message[0] : body.message;
    throw new Error(message || 'Request failed');
  }

  return body as T;
}
