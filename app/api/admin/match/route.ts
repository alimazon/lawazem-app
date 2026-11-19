// app/api/admin/match/route.ts
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

type QueueRow = {
  student_id: string;
  joined_at: string;
  status: string;
  student: {
    id: string;
    full_name: string;
    telegram_username: string;
    gender: string;
    study_year?: string;
  } | null;
};

function checkPwd(password: unknown): boolean {
  return password === process.env.ADMIN_PASSWORD;
}

function generateProposedGroups(males: QueueRow[], females: QueueRow[]): QueueRow[][] {
  const groups: QueueRow[][] = [];
  const mCopy = [...males];
  const fCopy = [...females];

  while (mCopy.length + fCopy.length >= 10) {
    const group: QueueRow[] = [];
    for (let i = 0; i < 5; i++) {
      if (mCopy.length > 0) group.push(mCopy.shift()!);
      if (fCopy.length > 0) group.push(fCopy.shift()!);
    }
    while (group.length < 10) {
      if (mCopy.length > 0) group.push(mCopy.shift()!);
      else if (fCopy.length > 0) group.push(fCopy.shift()!);
      else break;
    }
    groups.push(group);
  }
  return groups;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!checkPwd(body.password)) return fail('كلمة المرور غير صحيحة', 401);

    const action = body.action;

    // ============ 1) قائمة الانتظار ============
    if (action === 'queue') {
      const { data, error } = await supabaseAdmin
        .from('sg_match_queue')
        .select(
          'student_id, joined_at, status, student:sg_students(id, full_name, telegram_username, gender, study_year)'
        )
        .eq('status', 'waiting')
        .order('joined_at', { ascending: true });

      if (error) throw new Error(error.message);
      return ok({ queue: (data || []) as unknown as QueueRow[] });
    }

    // ============ 2) معاينة الراندوم ============
    if (action === 'preview') {
      const { data: queue } = await supabaseAdmin
        .from('sg_match_queue')
        .select('student_id, student:sg_students(id, full_name, telegram_username, gender)')
        .eq('status', 'waiting')
        .order('joined_at', { ascending: true });

      if (!queue) return fail('خطأ في قراءة القائمة');

      const rows = queue as unknown as QueueRow[];
      const males = rows.filter((q) => q.student?.gender === 'male');
      const females = rows.filter((q) => q.student?.gender === 'female');
      const proposed = generateProposedGroups(males, females);

      return ok({
        males: males.length,
        females: females.length,
        total: males.length + females.length,
        proposedGroups: proposed.map((g) => ({
          size: g.length,
          males: g.filter((s) => s.student?.gender === 'male').length,
          females: g.filter((s) => s.student?.gender === 'female').length,
          students: g.map((s) => s.student),
        })),
      });
    }

    // ============ 3) تنفيذ الراندوم ============
    if (action === 'run') {
      const { data: queue } = await supabaseAdmin
        .from('sg_match_queue')
        .select('student_id, student:sg_students(id, full_name, gender)')
        .eq('status', 'waiting')
        .order('joined_at', { ascending: true });

      if (!queue) return fail('خطأ في قراءة القائمة');

      const rows = queue as unknown as QueueRow[];
      const males = rows.filter((q) => q.student?.gender === 'male');
      const females = rows.filter((q) => q.student?.gender === 'female');
      const proposed = generateProposedGroups(males, females);

      let created = 0;
      const errors: string[] = [];

      for (const group of proposed) {
        if (group.length !== 10) continue;
        const ids = group.map((g) => g.student_id);
        const { error } = await supabaseAdmin.rpc('sg_create_auto_group', {
          p_student_ids: ids,
        });
        if (error) {
          errors.push(error.message);
          continue;
        }
        created++;
        await supabaseAdmin.from('sg_match_queue').delete().in('student_id', ids);
      }

      if (created === 0 && errors.length > 0) {
        return fail('فشل الإنشاء: ' + errors[0]);
      }
      return ok({
        message: `تم إنشاء ${created} كروب بنجاح`,
        created,
        warnings: errors,
      });
    }

    // ============ 4) قائمة الكروبات مع الأعضاء والطلبات ============
    if (action === 'list-groups') {
      const { data, error } = await supabaseAdmin
        .from('sg_groups')
        .select(
          `*,
           leader:sg_students!sg_groups_leader_id_fkey(id, full_name, telegram_username),
           members:sg_members(id, role, student_id, student:sg_students(id, full_name, telegram_username, gender)),
           requests:sg_requests(id, status, created_at, student:sg_students(id, full_name, telegram_username, gender))`
        )
        .order('serial', { ascending: false });

      if (error) throw new Error(error.message);

      // تصفية الطلبات لتشمل فقط المعلقة (pending)
      const formatted = (data || []).map((g: any) => ({
        ...g,
        requests: (g.requests || []).filter((r: any) => r.status === 'pending'),
      }));

      return ok({ groups: formatted });
    }

    // ============ 5) معالجة طلب انضمام من الأدمن ============
    if (action === 'admin-handle-request') {
      const { request_id, action: reqAction } = body;
      if (!request_id || !['accept', 'reject'].includes(reqAction)) {
        return fail('بيانات غير صالحة');
      }

      // جلب الكروب المرتبط بالطلب لمعرفة القائد
      const { data: reqData } = await supabaseAdmin
        .from('sg_requests')
        .select('group_id')
        .eq('id', request_id)
        .maybeSingle();

      if (!reqData) return fail('الطلب غير موجود');

      const { data: group } = await supabaseAdmin
        .from('sg_groups')
        .select('leader_id')
        .eq('id', reqData.group_id)
        .maybeSingle();

      if (!group?.leader_id) return fail('الكروب ليس له قائد (خطأ في البيانات)');

      if (reqAction === 'accept') {
        const { error } = await supabaseAdmin.rpc('sg_accept_request', {
          p_request_id: request_id,
          p_leader_id: group.leader_id,
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabaseAdmin.rpc('sg_reject_request', {
          p_request_id: request_id,
          p_leader_id: group.leader_id,
        });
        if (error) throw new Error(error.message);
      }

      return ok({ message: 'تمت معالجة الطلب بنجاح' });
    }

    // ============ 6) حذف الكروبات الملغية تلقائياً ============
    if (action === 'cleanup-cancelled') {
      // 1. جلب الكروبات الملغية
      const { data: cancelledGroups } = await supabaseAdmin
        .from('sg_groups')
        .select('id')
        .eq('status', 'cancelled');

      if (!cancelledGroups || cancelledGroups.length === 0) {
        return ok({ message: 'لا توجد كروبات ملغية للحذف.' });
      }

      const ids = cancelledGroups.map((g) => g.id);

      // 2. حذف الأعضاء والطلبات المرتبطة بهذه الكروبات
      await supabaseAdmin.from('sg_members').delete().in('group_id', ids);
      await supabaseAdmin.from('sg_requests').delete().in('group_id', ids);

      // 3. حذف الكروبات نفسها
      const { error } = await supabaseAdmin.from('sg_groups').delete().in('id', ids);
      if (error) throw new Error(error.message);

      return ok({ message: `تم حذف ${ids.length} كروب ملغى بنجاح.` });
    }

    // ============ 7) تعديل خصائص كروب ============
    if (action === 'edit-group') {
      const { group_id, name, target_size, status } = body;
      if (!group_id) return fail('معرف الكروب مطلوب');

      const updates: Record<string, unknown> = {};
      if (typeof name === 'string') updates.name = name.trim() || null;
      if (typeof target_size === 'number' && target_size > 0) updates.target_size = target_size;
      if (typeof status === 'string' && ['open', 'full', 'closed', 'cancelled'].includes(status)) {
        updates.status = status;
      }
      if (Object.keys(updates).length === 0) return fail('لا يوجد تعديل');

      const { error } = await supabaseAdmin.from('sg_groups').update(updates).eq('id', group_id);
      if (error) throw new Error(error.message);
      return ok({ message: 'تم التعديل' });
    }

    // ============ 8) حذف كروب ============
    if (action === 'delete-group') {
      const { group_id } = body;
      if (!group_id) return fail('معرف الكروب مطلوب');

      await supabaseAdmin.from('sg_members').delete().eq('group_id', group_id);
      await supabaseAdmin.from('sg_requests').delete().eq('group_id', group_id);
      const { error } = await supabaseAdmin.from('sg_groups').delete().eq('id', group_id);
      if (error) throw new Error(error.message);
      return ok({ message: 'تم حذف الكروب' });
    }

    // ============ 9) إزالة عضو ============
    if (action === 'remove-member') {
      const { group_id, student_id } = body;
      if (!group_id || !student_id) return fail('بيانات ناقصة');

      const { data: student } = await supabaseAdmin
        .from('sg_students')
        .select('gender')
        .eq('id', student_id)
        .maybeSingle();
      const { data: group } = await supabaseAdmin
        .from('sg_groups')
        .select('male_count, female_count, leader_id')
        .eq('id', group_id)
        .maybeSingle();
      if (!student || !group) return fail('غير موجود');

      const { error } = await supabaseAdmin
        .from('sg_members')
        .delete()
        .eq('group_id', group_id)
        .eq('student_id', student_id);
      if (error) throw new Error(error.message);

      const updates: Record<string, unknown> = {};
      if (student.gender === 'male') updates.male_count = Math.max(0, group.male_count - 1);
      else updates.female_count = Math.max(0, group.female_count - 1);
      if (group.leader_id === student_id) updates.leader_id = null;

      await supabaseAdmin.from('sg_groups').update(updates).eq('id', group_id);
      return ok({ message: 'تم إزالة العضو' });
    }

    // ============ 10) تغيير قائد الكروب ============
    if (action === 'change-leader') {
      const { group_id, student_id } = body;
      if (!group_id || !student_id) return fail('بيانات ناقصة');

      const { data: member } = await supabaseAdmin
        .from('sg_members')
        .select('role')
        .eq('group_id', group_id)
        .eq('student_id', student_id)
        .maybeSingle();
      if (!member) return fail('الطالب ليس عضواً في هذا الكروب');

      await supabaseAdmin
        .from('sg_members')
        .update({ role: 'member' })
        .eq('group_id', group_id)
        .eq('role', 'leader');
      await supabaseAdmin
        .from('sg_members')
        .update({ role: 'leader' })
        .eq('group_id', group_id)
        .eq('student_id', student_id);
      await supabaseAdmin
        .from('sg_groups')
        .update({ leader_id: student_id })
        .eq('id', group_id);
      return ok({ message: 'تم تغيير القائد' });
    }

    // ============ 11) إضافة عضو من قائمة الانتظار ============
    if (action === 'add-member') {
      const { group_id, student_id } = body;
      if (!group_id || !student_id) return fail('بيانات ناقصة');

      const { data: existing } = await supabaseAdmin
        .from('sg_members')
        .select('id')
        .eq('student_id', student_id)
        .maybeSingle();
      if (existing) return fail('الطالب في كروب بالفعل');

      const { data: student } = await supabaseAdmin
        .from('sg_students')
        .select('gender')
        .eq('id', student_id)
        .maybeSingle();
      const { data: group } = await supabaseAdmin
        .from('sg_groups')
        .select('male_count, female_count, target_size, status')
        .eq('id', group_id)
        .maybeSingle();
      if (!student || !group) return fail('غير موجود');

      if (group.status === 'cancelled') return fail('الكروب ملغى');
      if (group.male_count + group.female_count >= group.target_size) {
        return fail('الكروب مكتمل');
      }

      const { error } = await supabaseAdmin
        .from('sg_members')
        .insert({ group_id, student_id, role: 'member' });
      if (error) throw new Error(error.message);

      const updates: Record<string, unknown> = {};
      if (student.gender === 'male') updates.male_count = group.male_count + 1;
      else updates.female_count = group.female_count + 1;
      await supabaseAdmin.from('sg_groups').update(updates).eq('id', group_id);

      await supabaseAdmin.from('sg_match_queue').delete().eq('student_id', student_id);

      return ok({ message: 'تم إضافة العضو' });
    }

    return fail('إجراء غير معروف');
  } catch (err) {
    return handleError(err);
  }
}