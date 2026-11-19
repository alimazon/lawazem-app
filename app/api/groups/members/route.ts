// app/api/groups/members/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    // التأكد من أن الطالب مسجل دخول
    await requireStudent(req);
    
    const body = await req.json().catch(() => ({}));
    const { group_id } = body;

    if (!group_id) return fail('معرف الكروب مطلوب');

    // جلب أعضاء الكروب
    const { data, error } = await supabaseAdmin
      .from('sg_members')
      .select(`
        role,
        student:sg_students(id, full_name, telegram_username, gender)
      `)
      .eq('group_id', group_id);

    if (error) throw new Error(error.message);

    // تنسيق البيانات
    const formatted = (data || []).map((m: any) => ({
      id: m.student?.id,
      full_name: m.student?.full_name || '—',
      telegram_username: m.student?.telegram_username || '',
      gender: m.student?.gender || '',
      role: m.role,
    }));

    return ok({ members: formatted });
  } catch (err) {
    return handleError(err);
  }
}