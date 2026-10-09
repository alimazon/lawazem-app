// app/api/telegram/setup/route.ts
import { NextResponse } from 'next/server';
import { setWebhook, deleteWebhook, getWebhookSecret } from '@/lib/telegram';
import { jsonError, requireAdminPassword, safeString } from '@/lib/api-server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const password = safeString(body.password, 200);
  if (!requireAdminPassword(password)) {
    return jsonError('كلمة المرور غير صحيحة', 401);
  }

  const action = typeof body.action === 'string' ? body.action : 'set';

  if (action === 'delete') {
    const ok = await deleteWebhook();
    return NextResponse.json({
      ok,
      message: ok ? 'تم حذف الـwebhook' : 'فشل الحذف',
    });
  }

  const webhookUrl = safeString(body.webhook_url, 500);
  if (!webhookUrl || !webhookUrl.startsWith('https://')) {
    return jsonError('يجب إرسال webhook_url صحيح يبدأ بـ https://');
  }

  const secret = getWebhookSecret();
  const result = await setWebhook(webhookUrl, secret);

  return NextResponse.json({
    ok: result.ok,
    description: result.description,
    secret_configured: !!secret,
  });
}