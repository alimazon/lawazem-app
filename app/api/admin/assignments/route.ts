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
    const { data, error } = await supabaseAdmin.from('assignments').select('*, subjects(name)').order('due_date', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignments: data });
  }

  if (action === 'add') {
    const { subject_id, title, description, due_date } = body;
    const { error } = await supabaseAdmin.from('assignments').insert({ subject_id, title, description, due_date: due_date || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'edit') {
    const { id, subject_id, title, description, due_date } = body;
    const { error } = await supabaseAdmin.from('assignments').update({ subject_id, title, description, due_date: due_date || null }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { error } = await supabaseAdmin.from('assignments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
}