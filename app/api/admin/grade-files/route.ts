// app/api/admin/grade-files/route.ts
import { NextResponse } from 'next/server';
import { adminGuard, jsonError, safeOptionalString, safeString } from '@/lib/api-server';
import { GRADE_TYPES, type GradeType } from '@/lib/constants';

// ==================== Parsers ====================
function parseGradeType(v: unknown): GradeType | null {
  if (typeof v !== 'string') return null;
  return (GRADE_TYPES as readonly string[]).includes(v) ? (v as GradeType) : null;
}

function parseYear(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < 1990 || n > 2100) return null;
  return Math.floor(n);
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
    // ═══ list (لجميع المواد) ═══
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('grade_files')
        .select('*, subjects(name, stage)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('grade-files list error:', error.message);
        return jsonError('فشل تحميل الدرجات', 500);
      }
      return NextResponse.json({ items: data ?? [] });
    }

    // ═══ add ═══
    case 'add': {
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const grade_type = parseGradeType(body.grade_type);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const year = parseYear(body.year);
      const notes = safeOptionalString(body.notes, 500);
      const file_path = safeString(body.file_path, 2000);

      if (!subject_id) return jsonError('اختر المادة');
      if (!title) return jsonError('العنوان مطلوب');
      if (!grade_type) return jsonError('نوع الدرجة غير صالح');
      if (!file_path) return jsonError('رابط الملف مطلوب');

      const { error } = await supabaseAdmin.from('grade_files').insert({
        subject_id,
        title,
        grade_type,
        professor_name,
        year,
        notes,
        file_path,
      });

      if (error) {
        console.error('grade-files add error:', error.message);
        return jsonError('فشل الإضافة', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ═══ edit ═══
    case 'edit': {
      const id = safeString(body.id, 100);
      const subject_id = safeString(body.subject_id, 100);
      const title = safeString(body.title, 300);
      const grade_type = parseGradeType(body.grade_type);
      const professor_name = safeOptionalString(body.professor_name, 200);
      const year = parseYear(body.year);
      const notes = safeOptionalString(body.notes, 500);
      const file_path = safeString(body.file_path, 2000);

      if (!id) return jsonError('id مطلوب');
      if (!subject_id) return jsonError('اختر المادة');
      if (!title) return jsonError('العنوان مطلوب');
      if (!grade_type) return jsonError('نوع الدرجة غير صالح');
      if (!file_path) return jsonError('رابط الملف مطلوب');

      const { error } = await supabaseAdmin
        .from('grade_files')
        .update({
          subject_id,
          title,
          grade_type,
          professor_name,
          year,
          notes,
          file_path,
        })
        .eq('id', id);

      if (error) {
        console.error('grade-files edit error:', error.message);
        return jsonError('فشل التعديل', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ═══ delete ═══
    case 'delete': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const { error } = await supabaseAdmin
        .from('grade_files')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('grade-files delete error:', error.message);
        return jsonError('فشل الحذف', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}