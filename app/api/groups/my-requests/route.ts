// app/api/groups/my-requests/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const body = await req.json().catch(() => ({}));

    // إلغاء طلب
    if (body.action === 'cancel' && body.request_id) {
      const { error } = await supabaseAdmin
        .from('sg_requests')
        .update({ status: 'cancelled', processed_at: new Date().toISOString() })
        .eq('id', body.request_id)
        .eq('student_id', student.id)
        .eq('status', 'pending'); // لا يمكن إلغاء طلب تمت معالجته

      if (error) throw new Error('فشل إلغاء الطلب');
      return ok({ message: 'تم إلغاء الطلب' });
    }

    // جلب الطلبات المعلقة
    const { data: requests } = await supabaseAdmin
      .from('sg_requests')
      .select('*, group:sg_groups(name, serial)')
      .eq('student_id', student.id)
      .eq('status', 'pending');

    return ok({ requests: requests || [] });
  } catch (err) {
    return handleError(err);
  }
}