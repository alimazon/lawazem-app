// app/api/groups/by-code/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';
import type { PublicGroup } from '@/lib/types/groups';

export async function POST(req: Request) {
  try {
    await requireStudent(req); // يجب أن يكون مسجلاً
    const body = await req.json().catch(() => ({}));
    const { code } = body;

    if (!code) return fail('كود الكروب مطلوب');

    const { data: g } = await supabaseAdmin
      .from('sg_groups')
      .select(`
        *,
        leader:sg_students!sg_groups_leader_id_fkey(full_name),
        members:sg_members(
          role,
          student:sg_students(id, full_name, telegram_username, gender)
        )
      `)
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (!g) return fail('هذا الكروب غير موجود أو تم حذفه', 404);

    // رفض الكروب المغلق أو الملغى فقط. (المكتمل نعرضه لكي يرى الطلاب الأعضاء)
    if (g.status === 'closed' || g.status === 'cancelled') {
      return fail('هذا الكروب مغلق أو أُلغي ولا يمكن عرضه', 403);
    }

    const total = g.male_count + g.female_count;
    const spotsLeft = Math.max(0, g.target_size - total);

    // تنسيق الأعضاء
    const formattedMembers = (g.members || []).map((m: any) => ({
      id: m.student?.id,
      full_name: m.student?.full_name || '—',
      telegram_username: m.student?.telegram_username || '',
      gender: m.student?.gender || '',
      role: m.role,
    }));

    const formatted: PublicGroup = {
      ...g,
      leader_name: g.leader?.full_name || null,
      leader_username: null,
      spots_left: spotsLeft,
      members: formattedMembers,
    };

    return ok({ group: formatted });
  } catch (err) {
    return handleError(err);
  }
}