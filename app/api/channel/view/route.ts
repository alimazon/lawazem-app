// app/api/channel/view/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError } from '@/lib/api-server';

/**
 * زيادة عدّاد الزيارات باستخدام RPC atomic.
 * يتطلب دالة SQL على Supabase اسمها increment_channel_views(channel_id uuid)
 * (شوف الملاحظة تحت).
 */
export async function POST(request: Request) {
  let body: { channel_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const channelId = typeof body.channel_id === 'string' ? body.channel_id : '';
  if (!channelId) return jsonError('channel_id مطلوب', 400);

  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.rpc('increment_channel_views', {
    p_channel_id: channelId,
  });

  if (error) {
    console.error('increment_channel_views error:', error.message);
    // نرجّع 404 لو القناة ما موجودة، وإلا 500
    if (error.code === 'P0002' /* no_data_found */) {
      return jsonError('قناة غير موجودة', 404);
    }
    return jsonError('فشل تحديث العدّاد', 500);
  }

  return NextResponse.json({ success: true, views: data });
}