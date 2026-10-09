// app/api/reports/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeOptionalString, safeString } from '@/lib/api-server';

// ==================== Helpers ====================
function parseReason(v: unknown): 'dead_link' | 'outdated' | null {
  if (v === 'dead_link' || v === 'outdated') return v;
  return null;
}

// hash خفيف للحد من البلاغات المكرّرة من نفس الجهاز
function hashReporter(payload: string): string {
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ==================== Route ====================
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const supabaseAdmin = getSupabaseAdmin();

  switch (action) {
    // ==================== create (public) ====================
    case 'create': {
      const lecture_note_id = safeString(body.lecture_note_id, 100);
      const reason = parseReason(body.reason);
      const note = safeOptionalString(body.note, 300);
      const fingerprint = safeString(body.fingerprint, 200);

      if (!lecture_note_id) return jsonError('لم يُحدد المصدر');
      if (!reason) return jsonError('اختر سبباً صالحاً');

      // تحقق من وجود الملزمة
      const { data: noteExists } = await supabaseAdmin
        .from('lecture_notes')
        .select('id')
        .eq('id', lecture_note_id)
        .maybeSingle();

      if (!noteExists) return jsonError('الملزمة غير موجودة', 404);

      const reporter_hash = fingerprint ? hashReporter(fingerprint) : null;

      // منع التكرار: نفس الجهاز + نفس الملزمة + نفس السبب (خلال 24 ساعة)
      if (reporter_hash) {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recent } = await supabaseAdmin
          .from('lecture_note_reports')
          .select('id')
          .eq('lecture_note_id', lecture_note_id)
          .eq('reason', reason)
          .eq('reporter_hash', reporter_hash)
          .gte('created_at', cutoff)
          .maybeSingle();

        if (recent) {
          return NextResponse.json({ success: true, duplicate: true });
        }
      }

      const { error } = await supabaseAdmin
        .from('lecture_note_reports')
        .insert({
          lecture_note_id,
          reason,
          note,
          reporter_hash,
        });

      if (error) {
        console.error('report create error:', error.message);
        return jsonError('فشل إرسال البلاغ', 500);
      }

      return NextResponse.json({ success: true, duplicate: false });
    }

    // ==================== counts (public) ====================
    // يرجع عدد البلاغات لكل ملزمة (للاستخدام في الشارات)
    case 'counts': {
      const ids = Array.isArray(body.lecture_note_ids)
        ? body.lecture_note_ids.filter((id): id is string => typeof id === 'string').slice(0, 200)
        : [];

      if (ids.length === 0) {
        return NextResponse.json({ counts: {} });
      }

      const { data, error } = await supabaseAdmin
        .from('lecture_note_report_counts')
        .select('lecture_note_id, unresolved_count')
        .in('lecture_note_id', ids);

      if (error) {
        console.error('report counts error:', error.message);
        return jsonError('فشل تحميل البلاغات', 500);
      }

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        counts[row.lecture_note_id] = row.unresolved_count;
      }

      return NextResponse.json({ counts });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}