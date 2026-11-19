// app/api/groups/requests/handle/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const body = await req.json().catch(() => ({}));
    const { request_id, action } = body;

    if (!request_id || !['accept', 'reject'].includes(action)) {
      return fail('بيانات غير صالحة');
    }

    if (action === 'accept') {
      const { error } = await supabaseAdmin.rpc('sg_accept_request', {
        p_request_id: request_id,
        p_leader_id: student.id,
      });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.rpc('sg_reject_request', {
        p_request_id: request_id,
        p_leader_id: student.id,
      });
      if (error) throw new Error(error.message);
    }

    return ok({ message: 'تمت المعالجة بنجاح' });
  } catch (err) {
    return handleError(err);
  }
}