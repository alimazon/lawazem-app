// app/api/groups/requests/list/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    await req.json().catch(() => ({}));
    const student = await requireStudent(req);

    const { data: membership, error: memError } = await supabaseAdmin
      .from('sg_members')
      .select('group_id, role')
      .eq('student_id', student.id)
      .maybeSingle();

    if (memError) throw new Error(memError.message);

    if (!membership || membership.role !== 'leader') {
      return fail('غير مصرح لك برؤية هذه الطلبات', 403);
    }

    const { data: requests, error } = await supabaseAdmin
      .from('sg_requests')
      .select('*, student:sg_students(*)')
      .eq('group_id', membership.group_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return ok({ requests: requests || [] });
  } catch (err) {
    return handleError(err);
  }
}