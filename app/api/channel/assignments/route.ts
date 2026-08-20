import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

async function verifyChannel(supabaseAdmin: any, channel_id: string, password: string) {
  const { data, error } = await supabaseAdmin.from('channels').select('*').eq('id', channel_id).single();
  if (error || !data) return null;
  if (!data.channel_password || data.channel_password !== password) return null;
  return data;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, channel_id, password } = body;

  const supabaseAdmin = getSupabaseAdmin();

  const channel = await verifyChannel(supabaseAdmin, channel_id, password);
  if (!channel) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  if (action === 'login') {
    return NextResponse.json({ channel: { id: channel.id, name: channel.name, subject_id: channel.subject_id, description: channel.description, telegram_link: channel.telegram_link } });
  }

  if (action === 'list') {
    const { data, error } = await supabaseAdmin.from('assignments').select('*').eq('channel_id', channel_id).order('due_date', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignments: data });
  }

  if (action === 'add') {
    const { title, description, due_date } = body;
    const { error } = await supabaseAdmin.from('assignments').insert({
      subject_id: channel.subject_id,
      channel_id: channel.id,
      title,
      description,
      due_date: due_date || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'edit') {
    const { id, title, description, due_date } = body;
    const { data: existing } = await supabaseAdmin.from('assignments').select('channel_id').eq('id', id).single();
    if (!existing || existing.channel_id !== channel.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const { error } = await supabaseAdmin.from('assignments').update({ title, description, due_date: due_date || null }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'delete') {
    const { id } = body;
    const { data: existing } = await supabaseAdmin.from('assignments').select('channel_id').eq('id', id).single();
    if (!existing || existing.channel_id !== channel.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const { error } = await supabaseAdmin.from('assignments').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'update_channel') {
    const { name, description, telegram_link } = body;
    const { error } = await supabaseAdmin.from('channels').update({ name, description, telegram_link }).eq('id', channel.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === 'change_password') {
    const { new_password } = body;
    if (!new_password || new_password.length < 4) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة قصيرة جدًا' }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from('channels').update({ channel_password: new_password }).eq('id', channel.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
}