// app/api/groups/list/route.ts
import { getStudentFromRequest } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';
import type { PublicGroup } from '@/lib/types/groups';

export async function POST(req: Request) {
  try {
    const student = await getStudentFromRequest(req);
    if (!student) return fail('يجب تسجيل الدخول', 401);

    // جلب الكروبات المفتوحة
    const { data: groups, error } = await supabaseAdmin
      .from('sg_groups')
      .select(`
        *,
        leader:sg_students!sg_groups_leader_id_fkey(full_name, telegram_username)
      `)
      .eq('status', 'open')
      .eq('study_year', student.study_year)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const formattedGroups: PublicGroup[] = (groups || []).map((g) => {
      const total = g.male_count + g.female_count;
      return {
        ...g,
        leader_name: g.leader?.full_name || null,
        leader_username: g.leader?.telegram_username || null,
        spots_left: Math.max(0, g.target_size - total),
      };
    });

    return ok({ groups: formattedGroups });
  } catch (err) {
    return handleError(err);
  }
}