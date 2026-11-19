// app/api/groups/push/subscribe/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const body = await req.json().catch(() => ({}));
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) return fail('بيانات الاشتراك غير صالحة');

    const { error } = await supabaseAdmin.from('sg_push_subscriptions').upsert({
      student_id: student.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, { onConflict: 'endpoint' });

    if (error) throw new Error(error.message);
    return ok({ message: 'تم حفظ الاشتراك' });
  } catch (err) {
    return handleError(err);
  }
}