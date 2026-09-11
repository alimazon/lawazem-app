// app/api/admin/channels/route.ts
import { NextResponse } from 'next/server';
import { adminGuard, jsonError, safeOptionalString, safeString } from '@/lib/api-server';

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
        .from('channels')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('channels list error:', error.message);
        return jsonError('فشل تحميل القنوات', 500);
      }
      return NextResponse.json({ channels: data ?? [] });
    }

    case 'add': {
      const name = safeString(body.name, 200);
      const stage = safeString(body.stage, 100);
      const description = safeOptionalString(body.description, 1000);
      const telegram_link = safeString(body.telegram_link, 500);
      const channel_password = safeOptionalString(body.channel_password, 200);

      if (!name) return jsonError('اسم القناة مطلوب');
      if (!stage) return jsonError('المرحلة مطلوبة');
      if (!telegram_link) return jsonError('رابط تليكرام مطلوب');

      const { error } = await supabaseAdmin.from('channels').insert({
        name,
        stage,
        description,
        telegram_link,
        channel_password,
      });

      if (error) {
        console.error('channels add error:', error.message);
        return jsonError('فشل إضافة القناة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'edit': {
      const id = safeString(body.id, 100);
      const name = safeString(body.name, 200);
      const stage = safeString(body.stage, 100);
      const description = safeOptionalString(body.description, 1000);
      const telegram_link = safeString(body.telegram_link, 500);
      const channel_password = safeOptionalString(body.channel_password, 200);

      if (!id) return jsonError('id مطلوب');
      if (!name) return jsonError('اسم القناة مطلوب');
      if (!stage) return jsonError('المرحلة مطلوبة');
      if (!telegram_link) return jsonError('رابط تليكرام مطلوب');

      const { error } = await supabaseAdmin
        .from('channels')
        .update({
          name,
          stage,
          description,
          telegram_link,
          channel_password,
        })
        .eq('id', id);

      if (error) {
        console.error('channels edit error:', error.message);
        return jsonError('فشل تعديل القناة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'delete': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const { error } = await supabaseAdmin.from('channels').delete().eq('id', id);

      if (error) {
        console.error('channels delete error:', error.message);
        return jsonError('فشل حذف القناة', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}