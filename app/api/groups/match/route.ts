// app/api/groups/match/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const body = await req.json().catch(() => ({}));

    if (body.action === 'join') {
      // التأكد من عدم وجوده في كروب
      const { data: member } = await supabaseAdmin.from('sg_members').select('id').eq('student_id', student.id).maybeSingle();
      if (member) return fail('أنت في كروب بالفعل');

      await supabaseAdmin.from('sg_match_queue').upsert({
        student_id: student.id,
        status: 'waiting',
        joined_at: new Date().toISOString()
      });
      return ok({ message: 'تم الانضمام لقائمة الانتظار' });
    }

    if (body.action === 'leave') {
      await supabaseAdmin.from('sg_match_queue').delete().eq('student_id', student.id);
      return ok({ message: 'تم الخروج من قائمة الانتظار' });
    }

    // جلب الحالة
    const { data: queue } = await supabaseAdmin.from('sg_match_queue').select('*').eq('student_id', student.id).maybeSingle();
    return ok({ inQueue: queue?.status === 'waiting' });
  } catch (err) {
    return handleError(err);
  }
}