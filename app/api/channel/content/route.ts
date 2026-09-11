// app/api/channel/content/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeOptionalString, safeString } from '@/lib/api-server';
import { CONTENT_TYPES } from '@/lib/constants';
import type { ContentType, FileEntry } from '@/lib/types';

// ==================== Types ====================

interface ChannelRow {
  id: string;
  name: string;
  stage: string;
  description: string | null;
  telegram_link: string;
  channel_password: string | null;
  image_url: string | null;
  views: number | null;
}

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

// ==================== Helpers ====================

function parseFileUrls(value: unknown): FileEntry[] {
  if (!Array.isArray(value)) return [];

  const result: FileEntry[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const url = safeString(e.url, 2000);
    if (!url) continue;
    const label = safeOptionalString(e.label, 200);
    result.push({ url, label });
  }
  return result;
}

function parseContentType(value: unknown): ContentType | null {
  if (typeof value !== 'string') return null;
  return (CONTENT_TYPES as readonly string[]).includes(value)
    ? (value as ContentType)
    : null;
}

function parseDueDate(value: unknown): string | null {
  const s = safeOptionalString(value, 20);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return s;
}

async function verifyChannel(
  supabaseAdmin: SupabaseAdmin,
  channelId: string,
  password: string
): Promise<ChannelRow | null> {
  if (!channelId || !password) return null;

  const { data, error } = await supabaseAdmin
    .from('channels')
    .select('id, name, stage, description, telegram_link, channel_password, image_url, views')
    .eq('id', channelId)
    .maybeSingle<ChannelRow>();

  if (error || !data) return null;
  if (!data.channel_password) return null;
  if (data.channel_password !== password) return null;
  return data;
}

async function assertContentOwnership(
  supabaseAdmin: SupabaseAdmin,
  contentId: string,
  channelId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('channel_content')
    .select('channel_id')
    .eq('id', contentId)
    .maybeSingle<{ channel_id: string }>();

  if (error || !data) return false;
  return data.channel_id === channelId;
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
  const channel_id = safeString(body.channel_id, 100);
  const password = safeString(body.password, 200);

  const supabaseAdmin = getSupabaseAdmin();

  const channel = await verifyChannel(supabaseAdmin, channel_id, password);
  if (!channel) {
    return jsonError('كلمة المرور غير صحيحة', 401);
  }

  switch (action) {
    // ==================== login ====================
    case 'login': {
      return NextResponse.json({
        channel: {
          id: channel.id,
          name: channel.name,
          stage: channel.stage,
          description: channel.description,
          telegram_link: channel.telegram_link,
          image_url: channel.image_url,
          views: channel.views ?? 0,
        },
      });
    }

    // ==================== list ====================
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('channel_content')
        .select('*')
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('channel content list error:', error.message);
        return jsonError('فشل تحميل المحتوى', 500);
      }
      return NextResponse.json({ items: data ?? [] });
    }

    // ==================== add ====================
    case 'add': {
      const content_type = parseContentType(body.content_type);
      const title = safeString(body.title, 300);
      const description = safeOptionalString(body.description, 2000);
      const due_date = parseDueDate(body.due_date);
      const folder = safeOptionalString(body.folder, 200);
      const file_urls = parseFileUrls(body.file_urls);
      const pinned = !!body.pinned;

      if (!content_type) return jsonError('نوع المحتوى غير صالح');
      if (!title) return jsonError('العنوان مطلوب');

      const { error } = await supabaseAdmin.from('channel_content').insert({
        channel_id: channel.id,
        content_type,
        title,
        description,
        due_date,
        folder,
        file_urls,
        pinned,
      });

      if (error) {
        console.error('channel content add error:', error.message);
        return jsonError('فشل إضافة المحتوى', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== edit ====================
    case 'edit': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const owns = await assertContentOwnership(supabaseAdmin, id, channel.id);
      if (!owns) return jsonError('غير مصرح', 403);

      const content_type = parseContentType(body.content_type);
      const title = safeString(body.title, 300);
      const description = safeOptionalString(body.description, 2000);
      const due_date = parseDueDate(body.due_date);
      const folder = safeOptionalString(body.folder, 200);
      const file_urls = parseFileUrls(body.file_urls);
      const pinned = !!body.pinned;

      if (!content_type) return jsonError('نوع المحتوى غير صالح');
      if (!title) return jsonError('العنوان مطلوب');

      const { error } = await supabaseAdmin
        .from('channel_content')
        .update({
          content_type,
          title,
          description,
          due_date,
          folder,
          file_urls,
          pinned,
        })
        .eq('id', id);

      if (error) {
        console.error('channel content edit error:', error.message);
        return jsonError('فشل تعديل المحتوى', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== toggle_pin ====================
    case 'toggle_pin': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('channel_content')
        .select('channel_id, pinned')
        .eq('id', id)
        .maybeSingle<{ channel_id: string; pinned: boolean }>();

      if (fetchError || !existing || existing.channel_id !== channel.id) {
        return jsonError('غير مصرح', 403);
      }

      const { error } = await supabaseAdmin
        .from('channel_content')
        .update({ pinned: !existing.pinned })
        .eq('id', id);

      if (error) {
        console.error('channel content toggle_pin error:', error.message);
        return jsonError('فشل تحديث التثبيت', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== delete ====================
    case 'delete': {
      const id = safeString(body.id, 100);
      if (!id) return jsonError('id مطلوب');

      const owns = await assertContentOwnership(supabaseAdmin, id, channel.id);
      if (!owns) return jsonError('غير مصرح', 403);

      const { error } = await supabaseAdmin
        .from('channel_content')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('channel content delete error:', error.message);
        return jsonError('فشل حذف المحتوى', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== update_channel ====================
    case 'update_channel': {
      const description = safeOptionalString(body.description, 2000);
      const image_url = safeOptionalString(body.image_url, 2000);

      const { error } = await supabaseAdmin
        .from('channels')
        .update({ description, image_url })
        .eq('id', channel.id);

      if (error) {
        console.error('channel update error:', error.message);
        return jsonError('فشل تحديث بيانات القناة', 500);
      }
      return NextResponse.json({ success: true });
    }

    // ==================== change_password ====================
    case 'change_password': {
      const new_password = safeString(body.new_password, 200);

      if (!new_password) return jsonError('كلمة المرور الجديدة مطلوبة');
      if (new_password.length < 4) {
        return jsonError('كلمة المرور الجديدة قصيرة جدًا (4 أحرف على الأقل)');
      }

      const { error } = await supabaseAdmin
        .from('channels')
        .update({ channel_password: new_password })
        .eq('id', channel.id);

      if (error) {
        console.error('channel change_password error:', error.message);
        return jsonError('فشل تغيير كلمة المرور', 500);
      }
      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}