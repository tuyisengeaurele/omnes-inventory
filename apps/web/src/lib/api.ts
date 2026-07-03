const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  tenantId: string;
};

export type Session = {
  user: SessionUser;
  tenant: { id: string; name: string };
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// access token lives in memory only, the refresh token stays in an
// httpOnly cookie the js never sees
let accessToken: string | null = null;

export function clearAccessToken() {
  accessToken = null;
}

type Options = { method?: string; body?: unknown };

export async function api<T = unknown>(path: string, opts: Options = {}, retry = true): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
  });

  // expired access token: refresh once, then replay the request
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    const refreshed = await refreshSession();
    if (refreshed) return api<T>(path, opts, false);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, (body as { error?: string })?.error ?? 'request failed', body);
  }
  return body as T;
}

type SessionResponse = Session & { accessToken: string };

function adopt(body: SessionResponse): Session {
  accessToken = body.accessToken;
  return { user: body.user, tenant: body.tenant };
}

export async function refreshSession(): Promise<Session | null> {
  const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!res.ok) {
    accessToken = null;
    return null;
  }
  return adopt((await res.json()) as SessionResponse);
}

export async function authRequest(path: string, body: unknown): Promise<Session> {
  const result = await api<SessionResponse>(path, { body });
  return adopt(result);
}
