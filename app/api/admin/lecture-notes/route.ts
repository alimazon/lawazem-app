// app/api/admin/lecture-notes/route.ts
import { NextResponse } from 'next/server';
import { adminGuard, jsonError, safeOptionalString, safeString } from '@/lib/api-server';
import type { Track } from '@/lib/types';

function parseLectureNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function parseTrack(value: unknown): Track | null {
  if (value === 'نظري' || value === 'عملي') return value;
  return null;
}

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
        .from('lecture_notes')
        .select('*, subjects(name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('lecture-notes list error:', error.message);
        return jsonError('فشل تحميل الملازم', 500);
      }
      return NextResponse.json({ materials: data ?? [] });
    }

    case 'add': {
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const lecture_number = parseLectureNumber(body.lecture_number);
      const track = parseTrack(body.track);
      const file_path = safeString(body.file_path, 2000);

      if (!subject_id) return jsonError('اختر المادة');
      if (!title) return jsonError('عنوان الملزمة مطلوب');
      if (!track) return jsonError('اختر نظري أو عملي');
      if (!file_path) return jsonError('رابط الملف مطلوب');

      const { error } = await supabaseAdmin.from('lecture_notes').insert({
        subject_id,
        title,
        professor_name,
        lecture_number,
        track,
        file_path,
        status: 'approved',
      });

      if (error) {
        console.error('lecture-notes add error:', error.message);
        return jsonError('فشل إضافة الملزمة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'edit': {
      const id = safeString(body.id, 100);
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const lecture_number = parseLectureNumber(body.lecture_number);
      const track = parseTrack(body.track);
      const file_path = safeString(body.file_path, 2000);

      if (!id) return jsonError('id مطلوب');
      if (!subject_id) return jsonError('اختر المادة');
      if (!title) return jsonError('عنوان الملزمة مطلوب');
      if (!track) return jsonError('اختر نظري أو عملي');
      if (!file_path) return jsonError('رابط الملف مطلوب');

      const { error } = await supabaseAdmin
        .from('lecture_notes')
        .update({
          subject_id,
          title,
          professor_name,
          lecture_number,
          track,
          file_path,
        })
        .eq('id', id);

      if (error) {
        console.error('lecture-notes edit error:', error.message);
        return jsonError('فشل تعديل الملزمة', 500);
      }
      return NextResponse.json({ success: true });
    }

    case 'delete': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const { error } = await supabaseAdmin
        .from('lecture_notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('lecture-notes delete error:', error.message);
        return jsonError('فشل حذف الملزمة', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}