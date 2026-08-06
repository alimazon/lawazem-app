import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  const { password, table, id, action } = await request.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  const allowedTables = ['lecture_notes', 'exam_questions', 'professor_focus_notes'];
  if (!allowedTables.includes(table)) {
    return NextResponse.json({ error: 'جدول غير صالح' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (action === 'approve') {
    const { error } = await supabaseAdmin.from(table).update({ status: 'approved' }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (action === 'reject') {
    const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}