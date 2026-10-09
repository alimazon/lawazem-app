// lib/telegram-notifications.ts
import { getSupabaseAdmin } from './supabaseAdmin';
import { sendMessage, escapeHtml, type InlineKeyboardMarkup } from './telegram';
import { listSuperAdmins } from './telegram-admins';
import type { Group } from './types';

// ==================== Base URL ====================
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://lawazem.vercel.app';
}

// ==================== Types ====================
interface SubscriberLite {
  chat_id: number;
  stage: string | null;
  subjects: string[];
  group_name: Group | null;
}

export interface NewNoteInfo {
  id: string;
  title: string;
  subject_name: string;
  professor_name: string | null;
  stage: string;
  group_name: Group | null; // ← جديد
}

// ==================== Batching ====================
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function groupLabel(g: Group): string {
  return g === 'A' ? 'كروب A' : 'كروب B';
}

// ==================== Notify: New Note ====================
export async function notifyNewLectureNote(info: NewNoteInfo): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: subs, error } = await supabaseAdmin
    .from('telegram_subscribers')
    .select('chat_id, stage, subjects, group_name')
    .eq('stage', info.stage)
    .eq('notify_new_note', true);

  if (error) {
    console.error('[notify] fetch subscribers error:', error.message);
    return;
  }

  if (!subs || subs.length === 0) return;

  const subscribers = (subs as SubscriberLite[]).filter((s) => {
    // فلترة الكروب: إن كانت الملزمة محددة لكروب معيّن، نرسلها لأصحابه فقط
    if (info.group_name !== null) {
      if (s.group_name !== info.group_name) return false;
    }
    // فلترة المادة
    if (!s.subjects || s.subjects.length === 0) return true;
    return s.subjects.includes(info.subject_name);
  });

  if (subscribers.length === 0) return;

  const baseUrl = getBaseUrl();
  const lines: string[] = [];
  lines.push('📚 <b>ملزمة جديدة!</b>');
  lines.push('');
  lines.push(`📘 ${escapeHtml(info.subject_name)}`);
  lines.push(`📝 <b>${escapeHtml(info.title)}</b>`);

  if (info.professor_name) {
    lines.push(`👨‍🏫 د. ${escapeHtml(info.professor_name)}`);
  }

  if (info.group_name) {
    lines.push(`👥 ${groupLabel(info.group_name)}`);
  }

  const text = lines.join('\n');

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map((sub) => {
        const keyboard: InlineKeyboardMarkup = {
          inline_keyboard: [
            [
              {
                text: '📖 افتح الملزمة',
                url: `${baseUrl}/api/telegram/go?n=${info.id}&c=${sub.chat_id}`,
              },
            ],
            [{ text: '🌐 كل الملازم', url: `${baseUrl}/lawazem` }],
          ],
        };
        return sendMessage(sub.chat_id, text, { reply_markup: keyboard });
      })
    );

    if (i + BATCH_SIZE < subscribers.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(`[notify] sent to ${subscribers.length} subscribers`);
}

// ==================== Morning Digest ====================
export async function sendMorningDigest(): Promise<{ sent: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const baseUrl = getBaseUrl();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: notes, error: notesErr } = await supabaseAdmin
    .from('lecture_notes')
    .select('id, title, professor_name, created_at, group_name, subjects!inner(name, stage)')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50);

  if (notesErr) {
    console.error('[morning] fetch notes error:', notesErr.message);
    return { sent: 0 };
  }

  if (!notes || notes.length === 0) {
    console.log('[morning] no new notes in last 24h');
    return { sent: 0 };
  }

  function pickRelation(rel: unknown): { name: string; stage: string } {
    if (Array.isArray(rel) && rel[0]) {
      const first = rel[0] as { name?: unknown; stage?: unknown };
      return {
        name: typeof first.name === 'string' ? first.name : '',
        stage: typeof first.stage === 'string' ? first.stage : '',
      };
    }
    if (rel && typeof rel === 'object') {
      const obj = rel as { name?: unknown; stage?: unknown };
      return {
        name: typeof obj.name === 'string' ? obj.name : '',
        stage: typeof obj.stage === 'string' ? obj.stage : '',
      };
    }
    return { name: '', stage: '' };
  }

  // نبني فهرساً حسب المرحلة + الكروب
  const byStageGroup: Record<string, { title: string; subject: string; group: Group | null }[]> = {};
  for (const n of notes as Array<{
    id: string;
    title: string;
    professor_name: string | null;
    group_name: Group | null;
    subjects: unknown;
  }>) {
    const rel = pickRelation(n.subjects);
    if (!rel.stage) continue;
    if (!byStageGroup[rel.stage]) byStageGroup[rel.stage] = [];
    byStageGroup[rel.stage].push({
      title: n.title,
      subject: rel.name,
      group: n.group_name,
    });
  }

  const { data: subs, error: subsErr } = await supabaseAdmin
    .from('telegram_subscribers')
    .select('chat_id, stage, subjects, group_name')
    .eq('notify_morning', true)
    .not('stage', 'is', null);

  if (subsErr) {
    console.error('[morning] fetch subscribers error:', subsErr.message);
    return { sent: 0 };
  }

  if (!subs || subs.length === 0) return { sent: 0 };

  let sent = 0;
  const subscribers = subs as SubscriberLite[];

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (sub) => {
        if (!sub.stage) return;
        const stageNotes = byStageGroup[sub.stage] ?? [];

        // فلترة حسب الكروب أولاً
        const groupFiltered = stageNotes.filter((n) => {
          if (n.group === null) return true; // للكل
          return n.group === sub.group_name;
        });

        if (groupFiltered.length === 0) return;

        const filtered =
          sub.subjects && sub.subjects.length > 0
            ? groupFiltered.filter((n) => sub.subjects.includes(n.subject))
            : groupFiltered;

        if (filtered.length === 0) return;

        const preview = filtered.slice(0, 5);
        const extra = filtered.length - preview.length;

        const lines: string[] = [];
        lines.push('🌅 <b>صباح الخير</b>');
        lines.push('');
        lines.push(
          `أمس أُضيفت <b>${filtered.length}</b> ${
            filtered.length === 1 ? 'ملزمة' : 'ملازم'
          } لمرحلتك:`
        );
        lines.push('');

        for (const n of preview) {
          const g = n.group ? ` <i>(${groupLabel(n.group)})</i>` : '';
          lines.push(`• <b>${escapeHtml(n.subject)}</b>: ${escapeHtml(n.title)}${g}`);
        }

        if (extra > 0) {
          lines.push(`<i>+ ${extra} أخرى...</i>`);
        }

        const keyboard: InlineKeyboardMarkup = {
          inline_keyboard: [
            [{ text: '🌐 تصفح الكل', url: `${baseUrl}/lawazem` }],
          ],
        };

        const ok = await sendMessage(sub.chat_id, lines.join('\n'), {
          reply_markup: keyboard,
        });
        if (ok) sent++;
      })
    );

    if (i + BATCH_SIZE < subscribers.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(`[morning] sent to ${sent} subscribers`);
  return { sent };
}

// ==================== Streak Reminder ====================
export async function sendStreakReminder(): Promise<{ sent: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const baseUrl = getBaseUrl();

  const today = new Date().toISOString().split('T')[0];

  const { data: subs, error } = await supabaseAdmin
    .from('telegram_subscribers')
    .select('chat_id, streak_count, last_streak_date, stage')
    .eq('notify_streak', true)
    .gt('streak_count', 0)
    .neq('last_streak_date', today)
    .not('stage', 'is', null);

  if (error) {
    console.error('[streak] fetch subscribers error:', error.message);
    return { sent: 0 };
  }

  if (!subs || subs.length === 0) return { sent: 0 };

  let sent = 0;
  const subscribers = subs as Array<{
    chat_id: number;
    streak_count: number;
    stage: string | null;
  }>;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (sub) => {
        const lines: string[] = [];
        lines.push('🔥 <b>لا تكسر سلسلتك!</b>');
        lines.push('');
        lines.push(
          `لديك <b>${sub.streak_count}</b> ${
            sub.streak_count === 1 ? 'يوم متتالي' : 'أيام متتالية'
          } — لا تخسرها اليوم.`
        );
        lines.push('');
        lines.push('افتح أي ملزمة للحفاظ عليها:');

        const keyboard: InlineKeyboardMarkup = {
          inline_keyboard: [
            [{ text: '📚 تصفح الملازم', url: `${baseUrl}/lawazem` }],
          ],
        };

        const ok = await sendMessage(sub.chat_id, lines.join('\n'), {
          reply_markup: keyboard,
        });
        if (ok) sent++;
      })
    );

    if (i + BATCH_SIZE < subscribers.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(`[streak] sent to ${sent} subscribers`);
  return { sent };
}

// ==================== Stats ====================
export async function getBotStats(): Promise<{
  total: number;
  byStage: Record<string, number>;
  byGroup: Record<string, number>;
  streaks: { avg: number; max: number; active: number };
}> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data } = await supabaseAdmin
    .from('telegram_subscribers')
    .select('stage, group_name, streak_count');

  const subs = (data ?? []) as Array<{
    stage: string | null;
    group_name: Group | null;
    streak_count: number;
  }>;

  const byStage: Record<string, number> = {};
  const byGroup: Record<string, number> = { A: 0, B: 0, 'غير محدد': 0 };
  let totalStreak = 0;
  let maxStreak = 0;
  let activeStreaks = 0;

  for (const s of subs) {
    const stage = s.stage ?? 'غير محدد';
    byStage[stage] = (byStage[stage] ?? 0) + 1;

    const g = s.group_name ?? 'غير محدد';
    byGroup[g] = (byGroup[g] ?? 0) + 1;

    const st = s.streak_count ?? 0;
    totalStreak += st;
    if (st > maxStreak) maxStreak = st;
    if (st > 0) activeStreaks++;
  }

  return {
    total: subs.length,
    byStage,
    byGroup,
    streaks: {
      avg: subs.length > 0 ? Math.round((totalStreak / subs.length) * 10) / 10 : 0,
      max: maxStreak,
      active: activeStreaks,
    },
  };
}

// ==================== Announcements ====================
export interface AnnouncementResult {
  sent: number;
  failed: number;
  error?: string;
}

export async function sendAnnouncement(
  announcementId: string
): Promise<AnnouncementResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const baseUrl = getBaseUrl();

  const { data: ann, error: fetchError } = await supabaseAdmin
    .from('telegram_announcements')
    .select('id, title, body, stage, link_url, link_label')
    .eq('id', announcementId)
    .maybeSingle<{
      id: string;
      title: string;
      body: string;
      stage: string | null;
      link_url: string | null;
      link_label: string | null;
    }>();

  if (fetchError || !ann) {
    return { sent: 0, failed: 0, error: 'التبليغ غير موجود' };
  }

  let query = supabaseAdmin
    .from('telegram_subscribers')
    .select('chat_id')
    .eq('notify_announcements', true);

  if (ann.stage) {
    query = query.eq('stage', ann.stage);
  }

  const { data: subs, error: subsError } = await query;

  if (subsError) {
    return { sent: 0, failed: 0, error: subsError.message };
  }

  const subscribers = (subs ?? []) as Array<{ chat_id: number }>;
  if (subscribers.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const lines: string[] = [];
  lines.push('📢 <b>تبليغ إداري</b>');
  lines.push('');
  lines.push(`<b>${escapeHtml(ann.title)}</b>`);
  lines.push('');
  lines.push(escapeHtml(ann.body));

  const text = lines.join('\n');

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [],
  };

  if (ann.link_url) {
    keyboard.inline_keyboard.push([
      {
        text: ann.link_label?.trim() || 'المزيد',
        url: ann.link_url,
      },
    ]);
  }

  keyboard.inline_keyboard.push([
    { text: '🌐 فتح المنصة', url: baseUrl },
  ]);

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((sub) =>
        sendMessage(sub.chat_id, text, { reply_markup: keyboard })
      )
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value === true) sent++;
      else failed++;
    }

    if (i + BATCH_SIZE < subscribers.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(
    `[announcement] id=${announcementId} sent=${sent} failed=${failed}`
  );
  return { sent, failed };
}
// ==================== Notify Super Admins (new announcement) ====================
export async function notifySuperAdminsNewAnnouncement(info: {
  id: string;
  title: string;
  body: string;
  stage: string | null;
  created_by: string;
}): Promise<void> {
  const supers = await listSuperAdmins();
  if (supers.length === 0) return;

  const lines: string[] = [];
  lines.push('📢 <b>تبليغ جديد بانتظار المراجعة</b>');
  lines.push('');
  lines.push(`👤 من: ${escapeHtml(info.created_by)}`);
  lines.push(`🎯 ${info.stage ? escapeHtml(info.stage) : 'كل المراحل'}`);
  lines.push('');
  lines.push(`<b>${escapeHtml(info.title)}</b>`);
  lines.push('');
  lines.push(escapeHtml(info.body));

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '✅ موافقة وإرسال', callback_data: `ann_approve:${info.id}` },
        { text: '❌ رفض', callback_data: `ann_reject:${info.id}` },
      ],
      [{ text: '🗑 حذف', callback_data: `ann_delete:${info.id}` }],
    ],
  };

  for (const s of supers) {
    try {
      await sendMessage(s.chat_id, lines.join('\n'), { reply_markup: keyboard });
    } catch {
      /* تجاهل */
    }
  }
}
