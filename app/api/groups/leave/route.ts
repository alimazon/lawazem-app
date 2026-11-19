// app/api/groups/leave/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    
    const { error } = await supabaseAdmin.rpc('sg_leave_group', {
      p_student_id: student.id,
    });
    
    if (error) throw new Error(error.message);
    return ok({ message: 'تمت المغادرة بنجاح' });
  } catch (err) {
    return handleError(err);
  }
}