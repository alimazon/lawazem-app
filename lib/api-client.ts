// lib/api-client.ts
import { supabase } from './supabaseClient';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function postJson<TResponse = unknown, TBody = unknown>(
  url: string,
  body: TBody,
  init?: RequestInit
): Promise<TResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...init,
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* response wasn't JSON */
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : null) || `فشل الطلب (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as TResponse;
}

export async function uploadToStorage(
  bucket: string,
  filePath: string,
  file: File | Blob,
  options?: { upsert?: boolean }
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, options);
  if (error) throw new ApiError(`فشل رفع الملف: ${error.message}`, 500);
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

export function buildStoragePath(prefix: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return `${prefix}/${Date.now()}-${safeName}`;
}