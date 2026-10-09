// app/api/telegram/go/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { safeString } from '@/lib/api-server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const noteId = safeString(url.searchParams.get('n'), 100);
  const chatIdStr = safeString(url.searchParams.get('c'), 30);
  const chatId = chatIdStr ? Number(chatIdStr) : NaN;

  if (!noteId || !Number.isFinite(chatId)) {
    return NextResponse.redirect(new URL('/', url.origin), 302);
  }

  const supabaseAdmin = getSupabaseAdmin();

  // 1. اجلب الملزمة
  const { data: note } = await supabaseAdmin
    .from('lecture_notes')
    .select('id, file_path')
    .eq('id', noteId)
    .maybeSingle<{ id: string; file_path: string }>();

  if (!note) {
    return NextResponse.redirect(new URL('/', url.origin), 302);
  }

  // 2. سجّل الفتح + حدّث الستريك
  try {
    await supabaseAdmin.from('telegram_opens').insert({
      chat_id: chatId,
      note_id: note.id,
    });

    await supabaseAdmin.rpc('update_telegram_streak', { p_chat_id: chatId });
  } catch (err) {
    console.error('[tg/go] tracking error:', err);
    // نستمر بالتوجيه حتى لو فشل التسجيل
  }

  // 3. وجّه للرابط الفعلي
  return NextResponse.redirect(note.file_path, 302);
}