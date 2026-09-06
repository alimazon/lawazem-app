import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  const body = await request.json();
  const { password, action } = body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (action === 'list') {
    const { data, error } = await supabaseAdmin.from('lecture_notes').select('*, subjects(name)').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ materials: data });
  }

  if (action === 'add') {
    const { subject_id, title, professor_name, lecture_number, file_path } = body;
    const { error } = await supabaseAdmin.from('lecture_notes').insert({
      subject_id,
      title,
      professor_name: professor_name || null,
      lecture_number: lecture_number || null,
      file_path,
      status: 'approved',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'edit') {
    const { id, subject_id, title, professor_name, lecture_number, file_path } = body;
    const { error } = await supabaseAdmin.from('lecture_notes').update({
      subject_id,
      title,
      professor_name: professor_name || null,
      lecture_number: lecture_number || null,
      file_path,
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { error } = await supabaseAdmin.from('lecture_notes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
}