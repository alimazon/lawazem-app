// app/api/groups/register/route.ts
import { getAccessToken, getSettings, isRegistrationOpen } from '@/lib/groups/access';
import { createSession } from '@/lib/groups/session';
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { slug, telegram_username, full_name, gender } = body || {};

    // 1) تحقق من الرابط
    if (!slug || typeof slug !== 'string') return fail('رابط غير صالح');
    const access = await getAccessToken(slug);
    if (!access) return fail('هذا الرابط غير متاح أو منتهي الصلاحية', 403);

    // 2) تحقق من حالة التسجيل
    const settings = await getSettings();
    if (!isRegistrationOpen(settings)) return fail('التسجيل مغلق حالياً', 403);

    // 3) تحقق من المدخلات
    if (typeof full_name !== 'string' || full_name.trim().length < 5) {
      return fail('الاسم يجب أن يكون 5 أحرف على الأقل');
    }
    if (full_name.trim().length > 100) return fail('الاسم طويل جداً (الحد 100)');

    if (typeof telegram_username !== 'string') return fail('معرف التليكرام مطلوب');
    const cleanUsername = telegram_username.trim().replace(/^@+/, '');
    if (!/^[A-Za-z0-9_]{5,32}$/.test(cleanUsername)) {
      return fail('معرف التليكرام يجب أن يكون 5-32 حرفاً إنجليزياً أو رقماً أو _');
    }

    if (gender !== 'male' && gender !== 'female') {
      return fail('الجنس يجب أن يكون male أو female');
    }

    // 4) منع التكرار
    const { data: existing } = await supabaseAdmin
      .from('sg_students')
      .select('id')
      .ilike('telegram_username', cleanUsername)
      .maybeSingle();
    if (existing) {
      return fail('هذا المعرف مسجل مسبقاً. إذا كنت أنت، استخدم نفس المتصفح الذي سجلت منه');
    }

    // 5) إنشاء الطالب
    const { data: student, error } = await supabaseAdmin
      .from('sg_students')
      .insert({
        telegram_username: cleanUsername,
        full_name: full_name.trim(),
        gender,
        study_year: access.study_year,
      })
      .select('*')
      .single();

    if (error || !student) return fail('فشل التسجيل: ' + (error?.message || 'خطأ غير معروف'));

    // 6) إنشاء جلسة
    const token = await createSession(student.id);

    return ok({ token, student });
  } catch (err) {
    return handleError(err);
  }
}