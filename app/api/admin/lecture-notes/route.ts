// app/api/admin/lecture-notes/route.ts
import { NextResponse } from 'next/server';
import { adminGuard, jsonError, safeOptionalString, safeString } from '@/lib/api-server';
import { notifyNewLectureNote } from '@/lib/telegram-notifications';
import type { Group, Track } from '@/lib/types';

// ==================== Parsers ====================
function parseLectureNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

function parseYear(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 1990 || n > 2100) return null;
  return Math.floor(n);
}

function parseTrack(value: unknown): Track | null {
  if (value === 'نظري' || value === 'عملي') return value;
  return null;
}

function parseGroup(value: unknown): Group | null {
  if (value === null || value === undefined || value === '') return null;
  if (value === 'A' || value === 'B') return value;
  return null;
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 50)
    .slice(0, 10);
  return Array.from(new Set(cleaned));
}

// ==================== Route ====================
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
    // ==================== list ====================
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

    // ==================== add ====================
    case 'add': {
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const lecture_number = parseLectureNumber(body.lecture_number);
      const track = parseTrack(body.track);
      const tags = parseTags(body.tags);
      const year = parseYear(body.year);
      const group_name = parseGroup(body.group_name);
      const file_path = safeString(body.file_path, 2000);

      if (!subject_id) return jsonError('اختر المادة');
      if (!title) return jsonError('عنوان الملزمة مطلوب');
      if (!track) return jsonError('اختر نظري أو عملي');
      if (!file_path) return jsonError('رابط الملف مطلوب');

      const { data: inserted, error } = await supabaseAdmin
        .from('lecture_notes')
        .insert({
          subject_id,
          title,
          professor_name,
          lecture_number,
          track,
          tags,
          year,
          group_name,
          file_path,
          status: 'approved',
        })
        .select('id')
        .single<{ id: string }>();

      if (error || !inserted) {
        console.error('lecture-notes add error:', error?.message);
        return jsonError('فشل إضافة الملزمة', 500);
      }

      // 🔔 إشعار المشتركين — fire-and-forget
      void (async () => {
        try {
          const { data: subject } = await supabaseAdmin
            .from('subjects')
            .select('name, stage')
            .eq('id', subject_id)
            .maybeSingle<{ name: string; stage: string }>();

          if (subject) {
            await notifyNewLectureNote({
              id: inserted.id,
              title,
              subject_name: subject.name,
              professor_name,
              stage: subject.stage,
              group_name,
            });
          }
        } catch (err) {
          console.error('[notify] add notification error:', err);
        }
      })();

      return NextResponse.json({ success: true, id: inserted.id });
    }

    // ==================== edit ====================
    case 'edit': {
      const id = safeString(body.id, 100);
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const lecture_number = parseLectureNumber(body.lecture_number);
      const track = parseTrack(body.track);
      const tags = parseTags(body.tags);
      const year = parseYear(body.year);
      const group_name = parseGroup(body.group_name);
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
          tags,
          year,
          group_name,
          file_path,
        })
        .eq('id', id);

      if (error) {
        console.error('lecture-notes edit error:', error.message);
        return jsonError('فشل تعديل الملزمة', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== delete ====================
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

    // ==================== reports_list ====================
    case 'reports_list': {
      const { data, error } = await supabaseAdmin
        .from('lecture_note_reports')
        .select(`
          id,
          lecture_note_id,
          reason,
          note,
          created_at,
          resolved_at,
          resolved_action,
          lecture_notes(
            id,
            title,
            subject_id,
            professor_name,
            year,
            file_path,
            subjects(name)
          )
        `)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('reports_list error:', error.message);
        return jsonError('فشل تحميل البلاغات', 500);
      }
      return NextResponse.json({ reports: data ?? [] });
    }

    // ==================== report_resolve ====================
    case 'report_resolve': {
      const id = safeString(body.id, 100);
      const resolved_action = body.resolved_action === 'deleted' ? 'deleted' : 'ignored';

      if (!id) return jsonError('id مطلوب');

      const { error } = await supabaseAdmin
        .from('lecture_note_reports')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_action,
        })
        .eq('id', id);

      if (error) {
        console.error('report_resolve error:', error.message);
        return jsonError('فشل معالجة البلاغ', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== reports_resolve_all_for_note ====================
    case 'reports_resolve_all_for_note': {
      const lecture_note_id = safeString(body.lecture_note_id, 100);
      const resolved_action = body.resolved_action === 'deleted' ? 'deleted' : 'ignored';

      if (!lecture_note_id) return jsonError('lecture_note_id مطلوب');

      const { error } = await supabaseAdmin
        .from('lecture_note_reports')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_action,
        })
        .eq('lecture_note_id', lecture_note_id)
        .is('resolved_at', null);

      if (error) {
        console.error('reports_resolve_all_for_note error:', error.message);
        return jsonError('فشل معالجة البلاغات', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}