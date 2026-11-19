// app/api/groups/notifications/route.ts
import { getStudentFromRequest } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

interface NotifBody {
  mark_read?: string;
  mark_all?: boolean;
}

export async function POST(req: Request) {
  try {
    const student = await getStudentFromRequest(req);
    if (!student) return fail('يجب تسجيل الدخول', 401);

    const body: NotifBody = await req.json().catch(() => ({}));

    if (body.mark_read) {
      await supabaseAdmin
        .from('sg_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', body.mark_read)
        .eq('student_id', student.id);
    }

    if (body.mark_all) {
      await supabaseAdmin
        .from('sg_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('student_id', student.id)
        .is('read_at', null);
    }

    const { data: list } = await supabaseAdmin
      .from('sg_notifications')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const unread = (list || []).filter((n) => !n.read_at).length;

    return ok({ list: list || [], unread });
  } catch (err) {
    return handleError(err);
  }
}