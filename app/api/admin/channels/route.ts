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
    const { data, error } = await supabaseAdmin.from('channels').select('*').order('created_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ channels: data });
  }

  if (action === 'add') {
    const { name, stage, description, telegram_link, channel_password } = body;
    const { error } = await supabaseAdmin.from('channels').insert({ name, stage, description, telegram_link, channel_password: channel_password || null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'edit') {
    const { id, name, stage, description, telegram_link, channel_password } = body;
    const { error } = await supabaseAdmin.from('channels').update({ name, stage, description, telegram_link, channel_password: channel_password || null }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { error } = await supabaseAdmin.from('channels').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
}