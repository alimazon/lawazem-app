// app/api/admin/schedules/route.ts
import { NextResponse } from 'next/server';
import { adminGuard, jsonError, safeString } from '@/lib/api-server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const guard = adminGuard(body.password);
  if (!guard.ok) return guard.response;
  const { supabaseAdmin } = guard;

  const action = typeof body.action === 'string' ? body.action : '';

  switch (action) {
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('schedules')
        .select('*')
        .order('stage');

      if (error) {
        console.error('schedules list error:', error.message);
        return jsonError('فشل تحميل الجداول', 500);
      }
      return NextResponse.json({ schedules: data ?? [] });
    }

    case 'update': {
      const stage = safeString(body.stage, 100);
      const image_url = safeString(body.image_url, 2000);

      if (!stage) return jsonError('المرحلة مطلوبة');
      if (!image_url) return jsonError('رابط الصورة مطلوب');

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('schedules')
        .select('stage')
        .eq('stage', stage)
        .maybeSingle();

      if (fetchError) {
        console.error('schedules fetch error:', fetchError.message);
        return jsonError('فشل التحقق من الجدول', 500);
      }

      const payload = { image_url, updated_at: new Date().toISOString() };

      const { error } = existing
        ? await supabaseAdmin.from('schedules').update(payload).eq('stage', stage)
        : await supabaseAdmin.from('schedules').insert({ stage, ...payload });

      if (error) {
        console.error('schedules update error:', error.message);
        return jsonError('فشل تحديث الجدول', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}