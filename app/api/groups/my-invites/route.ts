// app/api/groups/my-invites/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const body = await req.json().catch(() => ({}));

    // --- جلب الدعوات ---
    if (!body.action) {
      const { data, error } = await supabaseAdmin
        .from('sg_requests')
        .select(`
          id, created_at,
          group:sg_groups(id, code, serial, name, male_count, female_count, target_size, practical_group, leader:sg_students(full_name))
        `)
        .eq('student_id', student.id)
        .eq('status', 'pending');

      if (error) throw new Error(error.message);
      return ok({ invites: data || [] });
    }

    // --- قبول أو رفض الدعوة ---
    const { request_id, action } = body;
    if (!request_id || !['accept', 'reject'].includes(action)) return fail('بيانات غير صالحة');

    // التحقق من الطلب
    const { data: request } = await supabaseAdmin
      .from('sg_requests')
      .select('id, group_id, status')
      .eq('id', request_id)
      .eq('student_id', student.id)
      .maybeSingle();

    if (!request || request.status !== 'pending') return fail('هذه الدعوة غير متاحة');

    if (action === 'reject') {
      await supabaseAdmin.from('sg_requests').update({ status: 'rejected' }).eq('id', request_id);
      return ok({ message: 'تم رفض الدعوة' });
    }

    // --- حالة القبول ---
    // 1. التأكد أن الطالب ليس في كروب
    const { data: existingMember } = await supabaseAdmin.from('sg_members').select('id').eq('student_id', student.id).maybeSingle();
    if (existingMember) {
      await supabaseAdmin.from('sg_requests').update({ status: 'cancelled' }).eq('id', request_id);
      return fail('أنت عضو في كروب بالفعل');
    }

    // 2. التأكد من الكروب
    const { data: group } = await supabaseAdmin.from('sg_groups').select('male_count, female_count, target_size, status').eq('id', request.group_id).maybeSingle();
    if (!group || group.status !== 'open') return fail('هذا الكروب لم يعد يقبل أعضاء');
    if (group.male_count + group.female_count >= group.target_size) return fail('عذراً، الكروب اكتمل');

    // 3. إضافة الطالب للكروب
    await supabaseAdmin.from('sg_members').insert({
      group_id: request.group_id,
      student_id: student.id,
      role: 'member',
    });

    // 4. تحديث العدادات
    const updates: any = {};
    if (student.gender === 'male') updates.male_count = group.male_count + 1;
    else updates.female_count = group.female_count + 1;
    await supabaseAdmin.from('sg_groups').update(updates).eq('id', request.group_id);

    // 5. تحديث حالة الطلب وإخراجه من قائمة الانتظار
    await supabaseAdmin.from('sg_requests').update({ status: 'accepted' }).eq('id', request_id);
    await supabaseAdmin.from('sg_match_queue').delete().eq('student_id', student.id);

    return ok({ message: 'تم قبول الدعوة والانضمام للكروب' });
  } catch (err) {
    return handleError(err);
  }
}