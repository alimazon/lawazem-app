// lib/api-server.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T extends object>(data: T) {
  return NextResponse.json(data);
}

export function requireAdminPassword(password: unknown): boolean {
  return typeof password === 'string' && password === process.env.ADMIN_PASSWORD;
}

type AdminGuardResult =
  | { ok: true; supabaseAdmin: ReturnType<typeof getSupabaseAdmin> }
  | { ok: false; response: NextResponse };

export function adminGuard(password: unknown): AdminGuardResult {
  if (!requireAdminPassword(password)) {
    return { ok: false, response: jsonError('كلمة المرور غير صحيحة', 401) };
  }
  return { ok: true, supabaseAdmin: getSupabaseAdmin() };
}

export function safeString(value: unknown, max = 5000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function safeOptionalString(value: unknown, max = 5000): string | null {
  const s = safeString(value, max);
  return s === '' ? null : s;
}