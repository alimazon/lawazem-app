// app/api/cron/streak/route.ts
import { NextResponse } from 'next/server';
import { sendStreakReminder } from '@/lib/telegram-notifications';

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
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
    const result = await sendStreakReminder();
    return NextResponse.json({
      ok: true,
      sent: result.sent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[cron/streak] error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'unknown',
      },
      { status: 500 }
    );
  }
}