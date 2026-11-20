// app/api/groups/invite/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { notify } from '@/lib/groups/notify';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const body = await req.json().catch(() => ({}));
    const { target_student_id } = body;

    if (!target_student_id) return fail('معرف الطالب مطلوب');

    // 1. التحقق من القائد والكروب
    const { data: member } = await supabaseAdmin
      .from('sg_members')
      .select('group_id, role')
      .eq('student_id', student.id)
      .maybeSingle();

    if (!member || member.role !== 'leader') return fail('أنت لست قائد كروب');

    const { data: group } = await supabaseAdmin
      .from('sg_groups')
      .select('id, male_count, female_count, target_size, status, name, serial')
      .eq('id', member.group_id)
      .maybeSingle();

    if (!group) return fail('الكروب غير موجود');
    if (group.status !== 'open') return fail('الكروب مغلق حالياً');
    if (group.male_count + group.female_count >= group.target_size) return fail('الكروب مكتمل العدد');

    // 2. التحقق من الطالب المستهدف
    const { data: target } = await supabaseAdmin
      .from('sg_students')
      .select('id, full_name, telegram_username')
      .eq('id', target_student_id)
      .maybeSingle();
      
    if (!target) return fail('الطالب غير موجود');

    const { data: isMember } = await supabaseAdmin
      .from('sg_members')
      .select('id')
      .eq('student_id', target_student_id)
      .maybeSingle();

    if (isMember) return fail('هذا الطالب انضم إلى كروب بالفعل');

    // 3. إرسال الطلب
    const { error } = await supabaseAdmin.from('sg_requests').insert({
      student_id: target_student_id,
      group_id: group.id,
      status: 'pending',
    });

    if (error) {
      if (error.code === '23505') return fail('لديك طلب معلق لهذا الطالب بالفعل');
      throw new Error('فشل إرسال الطلب');
    }

    // 4. إرسال إشعار للطالب
    try {
      await notify(
        target_student_id,
        'group_invite',
        'دعوة للانضمام إلى كروب 🎉',
        `أرسل لك القائد ${student.full_name} دعوة للانضمام إلى ${group.name || 'كروب #' + group.serial}`
      );
    } catch {}

    return ok({ message: 'تم إرسال الدعوة للطالب بنجاح' });
  } catch (err) {
    return handleError(err);
  }
}