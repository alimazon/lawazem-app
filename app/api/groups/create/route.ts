// app/api/groups/create/route.ts
import { requireStudent } from '@/lib/groups/session';
import { getSettings } from '@/lib/groups/access';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export async function POST(req: Request) {
  try {
    const student = await requireStudent(req);
    const settings = await getSettings();

    if (!settings.allow_create) return fail('إنشاء الكروبات متوقف حالياً');

    // 1. التأكد من عدم وجوده في كروب مسبقاً
    const { data: existingMember } = await supabaseAdmin
      .from('sg_members')
      .select('id')
      .eq('student_id', student.id)
      .maybeSingle();

    if (existingMember) return fail('أنت عضو في كروب بالفعل. يجب مغادرته أولاً');

    // 2. إنشاء الكود
    let code = generateCode();
    let isUnique = false;
    while (!isUnique) {
      const { data } = await supabaseAdmin.from('sg_groups').select('id').eq('code', code).maybeSingle();
      if (!data) isUnique = true;
      else code = generateCode();
    }

    // 3. استقبال البيانات
    const body = await req.json().catch(() => ({}));
    const groupName = typeof body.name === 'string' ? body.name.trim().slice(0, 50) : null;
    
    // 👈 جديد: التحقق من المجموعة العملية
    let practicalGroup = typeof body.practical_group === 'string' ? body.practical_group.toUpperCase() : null;
    const validPracticalGroups = ['A','B','C','D','E','F','G','H'];
    if (practicalGroup && !validPracticalGroups.includes(practicalGroup)) {
      practicalGroup = null; // تجاهل القيمة إذا كانت غير صالحة
    }

    // 4. إنشاء الكروب
    const { data: newGroup, error: groupError } = await supabaseAdmin
      .from('sg_groups')
      .insert({
        code,
        name: groupName || null,
        practical_group: practicalGroup, // 👈 حفظها هنا
        leader_id: student.id,
        target_size: settings.target_size,
        male_count: student.gender === 'male' ? 1 : 0,
        female_count: student.gender === 'female' ? 1 : 0,
        study_year: student.study_year,
      })
      .select('*')
      .single();

    if (groupError || !newGroup) throw new Error('فشل إنشاء الكروب');

    // 5. إضافة الطالب كقائد
    const { error: memberError } = await supabaseAdmin.from('sg_members').insert({
      group_id: newGroup.id,
      student_id: student.id,
      role: 'leader',
    });

    if (memberError) {
      await supabaseAdmin.from('sg_groups').delete().eq('id', newGroup.id);
      throw new Error('فشل تعيينك كقائد. حاول مجدداً');
    }

    return ok({ group: newGroup });
  } catch (err) {
    return handleError(err);
  }
}