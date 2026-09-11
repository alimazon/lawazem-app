// app/api/admin/subjects/route.ts
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
        .from('subjects')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('subjects list error:', error.message);
        return jsonError('فشل تحميل المواد', 500);
      }
      return NextResponse.json({ subjects: data ?? [] });
    }

    case 'add': {
      const name = safeString(body.name, 200);
      const stage = safeString(body.stage, 100);

      if (!name) return jsonError('اسم المادة مطلوب');
      if (!stage) return jsonError('المرحلة مطلوبة');

      const { error } = await supabaseAdmin
        .from('subjects')
        .insert({ name, stage });

      if (error) {
        console.error('subjects add error:', error.message);
        return jsonError('فشل إضافة المادة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'edit': {
      const id = safeString(body.id, 100);
      const name = safeString(body.name, 200);
      const stage = safeString(body.stage, 100);

      if (!id) return jsonError('id مطلوب');
      if (!name) return jsonError('اسم المادة مطلوب');
      if (!stage) return jsonError('المرحلة مطلوبة');

      const { error } = await supabaseAdmin
        .from('subjects')
        .update({ name, stage })
        .eq('id', id);

      if (error) {
        console.error('subjects edit error:', error.message);
        return jsonError('فشل تعديل المادة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'delete': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const { error } = await supabaseAdmin.from('subjects').delete().eq('id', id);

      if (error) {
        console.error('subjects delete error:', error.message);
        return jsonError('فشل حذف المادة', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}