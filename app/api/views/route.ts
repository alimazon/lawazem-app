// app/api/views/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeString } from '@/lib/api-server';

// ==================== Types ====================
interface TopNote {
  id: string;
  title: string;
  professor_name: string | null;
  subject_name: string;
  file_path: string;
  week_views: number;
  views: number;
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

  // ==================== increment ====================
  if (action === 'increment') {
    const note_id = safeString(body.note_id, 100);
    if (!note_id) return jsonError('id مطلوب');

    const { error } = await supabaseAdmin.rpc('increment_note_views', {
      p_note_id: note_id,
    });

    if (error) {
      console.error('increment_note_views error:', error.message);
      return jsonError('فشل تحديث العدّاد', 500);
    }

    return NextResponse.json({ success: true });
  }

  // ==================== top ====================
  if (action === 'top') {
    const stage = safeString(body.stage, 100);
    if (!stage) return jsonError('المرحلة مطلوبة');

    // نجلب top 5 لهذه المرحلة فقط
    const { data, error } = await supabaseAdmin
      .from('lecture_notes')
      .select(
        'id, title, professor_name, file_path, week_views, views, subjects!inner(name, stage)'
      )
      .eq('subjects.stage', stage)
      .gt('week_views', 0)
      .order('week_views', { ascending: false })
      .limit(5);

    if (error) {
      console.error('top notes error:', error.message);
      return jsonError('فشل تحميل الأكثر إقبالاً', 500);
    }

    // نحوّل العلاقة إلى اسم مادة
    function pickName(rel: unknown): string {
      if (!rel) return '';
      if (Array.isArray(rel)) {
        const first = rel[0] as { name?: unknown } | undefined;
        return typeof first?.name === 'string' ? first.name : '';
      }
      if (typeof rel === 'object') {
        const name = (rel as { name?: unknown }).name;
        return typeof name === 'string' ? name : '';
      }
      return '';
    }

    const items: TopNote[] = (data ?? []).map((n) => {
      const row = n as {
        id: string;
        title: string;
        professor_name: string | null;
        file_path: string;
        week_views: number;
        views: number;
        subjects: unknown;
      };
      return {
        id: row.id,
        title: row.title,
        professor_name: row.professor_name,
        subject_name: pickName(row.subjects),
        file_path: row.file_path,
        week_views: row.week_views,
        views: row.views,
      };
    });

    return NextResponse.json({ items });
  }

  return jsonError('إجراء غير معروف');
}