// app/api/groups/update-telegram/route.ts
import { requireStudent } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const body = await req.json().catch(() => ({}));
    const { telegram_link } = body;

    const { data: member } = await supabaseAdmin
      .from('sg_members')
      .select('group_id, role')
      .eq('student_id', student.id)
      .maybeSingle();

    if (!member || member.role !== 'leader') return fail('أنت لست قائد كروب');

    let cleanLink = typeof telegram_link === 'string' ? telegram_link.trim() : null;
    if (cleanLink && !cleanLink.startsWith('http')) {
      return fail('الرابط يجب أن يبدأ بـ http أو https');
    }

    const { error } = await supabaseAdmin
      .from('sg_groups')
      .update({ telegram_link: cleanLink || null })
      .eq('id', member.group_id);

    if (error) throw new Error(error.message);
    return ok({ message: 'تم تحديث رابط التليكرام' });
  } catch (err) {
    return handleError(err);
  }
}