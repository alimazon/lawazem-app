// lib/api-server.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';

export type AdminLevel = 'super' | 'admin';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T extends object>(data: T) {
  return NextResponse.json(data);
}

export function resolveAdminLevel(password: unknown): AdminLevel | null {
  if (typeof password !== 'string' || password === '') return null;

  const superPw = process.env.SUPER_ADMIN_PASSWORD;
  if (superPw && password === superPw) return 'super';

  const adminPw = process.env.ADMIN_PASSWORD;
  if (adminPw && password === adminPw) return 'admin';

  return null;
}

export function requireAdminPassword(password: unknown): boolean {
  return resolveAdminLevel(password) !== null;
}

type AdminGuardResult =
  | { ok: true; supabaseAdmin: ReturnType<typeof getSupabaseAdmin>; level: AdminLevel }
  | { ok: false; response: NextResponse };

export function adminGuard(password: unknown): AdminGuardResult {
  const level = resolveAdminLevel(password);
  if (!level) {
    return { ok: false, response: jsonError('كلمة المرور غير صحيحة', 401) };
  }
  return { ok: true, supabaseAdmin: getSupabaseAdmin(), level };
}

export function safeString(value: unknown, max = 5000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function safeOptionalString(value: unknown, max = 5000): string | null {
  const s = safeString(value, max);
  return s === '' ? null : s;
}