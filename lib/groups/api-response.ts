// lib/groups/api-response.ts

import { NextResponse } from 'next/server';

export function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function handleError(err: unknown) {
  const e = err as { message?: string; status?: number };
  const message = e?.message || 'حدث خطأ غير متوقع';
  const status = e?.status || 500;
  return fail(message, status);
}