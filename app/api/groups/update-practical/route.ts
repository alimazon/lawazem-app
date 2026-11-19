// app/api/groups/update-practical/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const body = await req.json().catch(() => ({}));
    const { practical_group } = body;

    const valid = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    if (!valid.includes(practical_group)) return fail('مجموعة غير صالحة');

    const { data: member } = await supabaseAdmin
      .from('sg_members')
      .select('group_id, role')
      .eq('student_id', student.id)
      .maybeSingle();

    if (!member || member.role !== 'leader') return fail('أنت لست قائد كروب');

    const { error } = await supabaseAdmin
      .from('sg_groups')
      .update({ practical_group })
      .eq('id', member.group_id);

    if (error) throw new Error(error.message);
    return ok({ message: 'تم تحديث المجموعة العملية' });
  } catch (err) {
    return handleError(err);
  }
}