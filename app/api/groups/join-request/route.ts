// app/api/groups/join-request/route.ts
import { requireStudent } from '@/lib/groups/session';
import { getSettings } from '@/lib/groups/access';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { notify } from '@/lib/groups/notify';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);

    // ✅ التعديل 2: التحقق من أن الانضمام مسموح
    const settings = await getSettings();
    if (!settings.allow_join) {
      return fail('الانضمام إلى الكروبات متوقف حالياً', 403);
    }

    const body = await req.json().catch(() => ({}));
    const { group_id } = body;

    if (!group_id) return fail('معرف الكروب مطلوب');

    // 1. التأكد من عدم وجوده في كروب
    const { data: existingMember } = await supabaseAdmin
      .from('sg_members')
      .select('id')
      .eq('student_id', student.id)
      .maybeSingle();

    if (existingMember) return fail('أنت عضو في كروب بالفعل');

    // 2. التأكد من أن الكروب مفتوح + جلب leader_id للإشعار
    const { data: group } = await supabaseAdmin
      .from('sg_groups')
      .select('status, leader_id')
      .eq('id', group_id)
      .maybeSingle();

    if (!group || group.status !== 'open') {
      return fail('هذا الكروب لا يقبل طلبات جديدة');
    }

    // 3. إرسال الطلب
    const { error } = await supabaseAdmin.from('sg_requests').insert({
      student_id: student.id,
      group_id,
      status: 'pending',
    });

    if (error) {
      if (error.code === '23505') return fail('لديك طلب معلق بالفعل لهذا الكروب');
      throw new Error('فشل إرسال الطلب');
    }

    // ✅ التعديل 3 (جزء السيرفر): إشعار القائد
    if (group.leader_id) {
      try {
        await notify(
          group.leader_id,
          'join_request',
          'طلب انضمام جديد 🎉',
          `${student.full_name} (@${student.telegram_username}) يريد الانضمام إلى كروبك`
        );
      } catch {
        // لا نُفشل الطلب لو فشل الإشعار
      }
    }

    return ok({ message: 'تم إرسال طلب الانضمام بنجاح' });
  } catch (err) {
    return handleError(err);
  }
}