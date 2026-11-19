// app/api/groups/push/test/route.ts
import * as webpush from 'web-push';
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

  if (!publicKey || !privateKey) return false;

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);

    if (!configureWebPush()) {
      return fail('مفاتيح VAPID غير مهيأة على السيرفر', 500);
    }

    const { data: subs, error } = await supabaseAdmin
      .from('sg_push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('student_id', student.id);

    if (error) throw new Error(error.message);
    if (!subs || subs.length === 0) {
      return fail('لا يوجد اشتراك push لهذا المستخدم');
    }

    const payload = JSON.stringify({
      title: 'إشعار تجريبي 🔔',
      body: 'إن وصلتك هذه الرسالة، فالإشعارات تعمل بنجاح!',
      url: '/g',
    });

    let sent = 0;
    const stale: string[] = [];

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          stale.push(sub.id);
        }
      }
    }

    if (stale.length > 0) {
      await supabaseAdmin.from('sg_push_subscriptions').delete().in('id', stale);
    }

    return ok({
      message: `تم إرسال ${sent} إشعار من أصل ${subs.length}`,
      sent,
      total: subs.length,
      stale_removed: stale.length,
    });
  } catch (err) {
    return handleError(err);
  }
}