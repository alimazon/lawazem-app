// app/api/feed/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeString } from '@/lib/api-server';

// ==================== Types ====================
type FeedType = 'lecture_note' | 'channel' | 'subject' | 'channel_content';

interface FeedItem {
  id: string;
  type: FeedType;
  title: string;
  context: string;
  created_at: string;
  link: string | null;
}

// ==================== Helpers ====================
/**
 * Supabase قد يُرجِع العلاقة كمصفوفة (شكل افتراضي لأنواعه المولّدة)
 * أو ككائن (لو كانت العلاقة 1-to-1). هذه الدالة تتعامل مع الشكلين.
 */
function pickRelationName(rel: unknown): string {
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

// ==================== Route ====================
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const stage = safeString(body.stage, 100);
  if (!stage) return jsonError('المرحلة مطلوبة');

  const supabaseAdmin = getSupabaseAdmin();
  const items: FeedItem[] = [];

  // ==================== 1. lecture_notes ====================
  const { data: notes } = await supabaseAdmin
    .from('lecture_notes')
    .select('id, title, file_path, created_at, subjects!inner(name, stage)')
    .eq('subjects.stage', stage)
    .order('created_at', { ascending: false })
    .limit(8);

  if (notes) {
    for (const n of notes as Array<{
      id: string;
      title: string;
      file_path: string | null;
      created_at: string;
      subjects: unknown;
    }>) {
      if (!n.created_at) continue;
      items.push({
        id: n.id,
        type: 'lecture_note',
        title: n.title,
        context: pickRelationName(n.subjects),
        created_at: n.created_at,
        link: n.file_path ?? null,
      });
    }
  }

  // ==================== 2. channels ====================
  const { data: channels } = await supabaseAdmin
    .from('channels')
    .select('id, name, description, telegram_link, created_at')
    .eq('stage', stage)
    .order('created_at', { ascending: false })
    .limit(5);

  if (channels) {
    for (const c of channels as Array<{
      id: string;
      name: string;
      description: string | null;
      telegram_link: string | null;
      created_at: string;
    }>) {
      if (!c.created_at) continue;
      items.push({
        id: c.id,
        type: 'channel',
        title: c.name,
        context: c.description?.trim() || 'قناة جديدة',
        created_at: c.created_at,
        link: c.telegram_link ?? null,
      });
    }
  }

  // ==================== 3. subjects ====================
  const { data: subjects } = await supabaseAdmin
    .from('subjects')
    .select('id, name, created_at')
    .eq('stage', stage)
    .order('created_at', { ascending: false })
    .limit(3);

  if (subjects) {
    for (const s of subjects as Array<{
      id: string;
      name: string;
      created_at: string | null;
    }>) {
      if (!s.created_at) continue;
      items.push({
        id: s.id,
        type: 'subject',
        title: s.name,
        context: 'مادة جديدة',
        created_at: s.created_at,
        link: null,
      });
    }
  }

  // ==================== 4. channel_content ====================
  const { data: content } = await supabaseAdmin
    .from('channel_content')
    .select('id, title, file_urls, created_at, channels!inner(name, stage)')
    .eq('channels.stage', stage)
    .order('created_at', { ascending: false })
    .limit(5);

  if (content) {
    for (const c of content as Array<{
      id: string;
      title: string;
      file_urls: unknown;
      created_at: string;
      channels: unknown;
    }>) {
      if (!c.created_at) continue;
      const files = Array.isArray(c.file_urls) ? c.file_urls : [];
      const first = files[0] as { url?: unknown } | undefined;
      const firstUrl = typeof first?.url === 'string' ? first.url : null;
      items.push({
        id: c.id,
        type: 'channel_content',
        title: c.title,
        context: pickRelationName(c.channels),
        created_at: c.created_at,
        link: firstUrl,
      });
    }
  }

  // ==================== Merge & Sort ====================
  items.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const top = items.slice(0, 12);

  return NextResponse.json({ items: top });
}