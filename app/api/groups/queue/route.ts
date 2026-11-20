// app/api/groups/queue/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);

    // التحقق من أن الطالب قائد كروب
    const { data: member } = await supabaseAdmin
      .from('sg_members')
      .select('group_id, role')
      .eq('student_id', student.id)
      .maybeSingle();

    if (!member || member.role !== 'leader') return fail('أنت لست قائد كروب');

    // جلب قائمة الانتظار (مع استبعاد من تم إرسال طلب لهم من قبل هذا الكروب)
    const { data: queue, error } = await supabaseAdmin
      .from('sg_match_queue')
      .select(`
        student_id,
        joined_at,
        student:sg_students(id, full_name, telegram_username, gender)
      `)
      .eq('status', 'waiting')
      .order('joined_at', { ascending: true });

    if (error) throw new Error(error.message);

    // جلب الطلبات المعلقة التي أرسلها هذا الكروب لتجنب تكرارها
    const { data: existingRequests } = await supabaseAdmin
      .from('sg_requests')
      .select('student_id')
      .eq('group_id', member.group_id)
      .eq('status', 'pending');

    const requestedIds = new Set((existingRequests || []).map(r => r.student_id));

    // تصفية القائمة
    const filteredQueue = (queue || []).filter(
      (q: any) => q.student && !requestedIds.has(q.student_id)
    );

    return ok({ queue: filteredQueue });
  } catch (err) {
    return handleError(err);
  }
}