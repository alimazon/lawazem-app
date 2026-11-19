// app/api/groups/me/route.ts
import { getStudentFromRequest } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';
import type {
  MeResponse,
  MemberWithStudent,
  Group,
  Member,
} from '@/lib/types/groups';

export async function POST(req: Request) {
  try {
    const student = await getStudentFromRequest(req);
    if (!student) return fail('يجب تسجيل الدخول', 401);

    // عضوية الطالب (إن وجدت)
    const { data: membershipRaw } = await supabaseAdmin
      .from('sg_members')
      .select('*')
      .eq('student_id', student.id)
      .maybeSingle();

    const membership = (membershipRaw as Member) || null;

    let group: Group | null = null;
    let members: MemberWithStudent[] = [];
    let isLeader = false;
    let pendingRequests = 0;

    if (membership) {
      const { data: g } = await supabaseAdmin
        .from('sg_groups')
        .select('*')
        .eq('id', membership.group_id)
        .maybeSingle();
      group = (g as Group) || null;
      isLeader = membership.role === 'leader';

      const { data: mems } = await supabaseAdmin
        .from('sg_members')
        .select('*, student:sg_students(*)')
        .eq('group_id', membership.group_id)
        .order('joined_at', { ascending: true });

      members = (mems || []) as MemberWithStudent[];

      if (isLeader) {
        const { count } = await supabaseAdmin
          .from('sg_requests')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', membership.group_id)
          .eq('status', 'pending');
        pendingRequests = count || 0;
      }
    }

    const response: MeResponse = {
      student,
      group,
      membership,
      members,
      isLeader,
      pendingRequests,
    };
    return ok(response);
  } catch (err) {
    return handleError(err);
  }
}