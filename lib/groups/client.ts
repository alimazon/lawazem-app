// lib/groups/client.ts
'use client';

const TOKEN_KEY = 'sg_token';

export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiBody {
  ok?: boolean;
  error?: string;
  data?: unknown;
}

export async function groupsFetch<T = unknown>(
  endpoint: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const json: ApiBody = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.error || `فشل الاتصال (${res.status})`);
  }
  if (json?.ok === false) {
    throw new Error(json?.error || 'حدث خطأ');
  }
  return (json?.data ?? json) as T;
}