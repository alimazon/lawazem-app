// app/api/groups/kick/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const body = await req.json().catch(() => ({}));
    const { group_id, student_id } = body;

    if (!group_id || !student_id) return fail('بيانات ناقصة');

    const { error } = await supabaseAdmin.rpc('sg_kick_member', {
      p_group_id: group_id,
      p_leader_id: student.id,
      p_student_id: student_id,
    });

    if (error) throw new Error(error.message);
    return ok({ message: 'تم طرد الطالب بنجاح' });
  } catch (err) {
    return handleError(err);
  }
}