// app/api/cron/morning/route.ts
import { NextResponse } from 'next/server';
import { sendMorningDigest } from '@/lib/telegram-notifications';

// Vercel Cron يرسل هذا الـheader تلقائياً
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // لو ما ضبطت CRON_SECRET، نسمح فقط من Vercel Cron
    // في الإنتاج لازم تضبطه
    return process.env.NODE_ENV !== 'production';
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendMorningDigest();
    return NextResponse.json({
      ok: true,
      sent: result.sent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/morning] error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 }
    );
  }
}