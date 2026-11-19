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
      .select(`*, leader:sg_students!sg_groups_leader_id_fkey(full_name)`)
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (!g) return fail('هذا الكروب غير موجود أو تم حذفه', 404);

    // ✅ التعديل 1: رفض الكروب المغلق أو الملغى
    if (g.status === 'closed') {
      return fail('هذا الكروب مغلق ولا يقبل طلبات جديدة', 403);
    }
    if (g.status === 'cancelled') {
      return fail('هذا الكروب أُلغي', 403);
    }

    const total = g.male_count + g.female_count;
    const spotsLeft = Math.max(0, g.target_size - total);

    // ✅ رفض الكروب المكتمل
    if (g.status === 'full' || spotsLeft === 0) {
      return fail('هذا الكروب مكتمل العدد', 403);
    }

    const formatted: PublicGroup = {
      ...g,
      leader_name: g.leader?.full_name || null,
      leader_username: null,
      spots_left: spotsLeft,
    };

    return ok({ group: formatted });
  } catch (err) {
    return handleError(err);
  }
}