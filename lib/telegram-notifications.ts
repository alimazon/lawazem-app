// lib/telegram-notifications.ts
import { getSupabaseAdmin } from './supabaseAdmin';
import { sendMessage, escapeHtml, type InlineKeyboardMarkup } from './telegram';

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
}

export interface NewNoteInfo {
  id: string;
  title: string;
  subject_name: string;
  professor_name: string | null;
  stage: string;
}

// ==================== Batching Helper ====================
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== Notify: New Note ====================
/**
 * يُستدعى بعد إضافة ملزمة جديدة.
 * Fire-and-forget — لا يوقف الرد على المشرف.
 */
export async function notifyNewLectureNote(info: NewNoteInfo): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  // 1. اجلب كل المشتركين لهذه المرحلة
  const { data: subs, error } = await supabaseAdmin
    .from('telegram_subscribers')
    .select('chat_id, stage, subjects')
    .eq('stage', info.stage)
    .eq('notify_new_note', true);

  if (error) {
    console.error('[notify] fetch subscribers error:', error.message);
    return;
  }

  if (!subs || subs.length === 0) return;

  // 2. فلترة حسب المواد (إذا المستخدم اختار مواد معينة)
  const subscribers = (subs as SubscriberLite[]).filter((s) => {
    if (!s.subjects || s.subjects.length === 0) return true; // الكل
    return s.subjects.includes(info.subject_name);
  });

  if (subscribers.length === 0) return;

  // 3. جهّز الرسالة
  const baseUrl = getBaseUrl();
  const lines: string[] = [];
  lines.push('📚 <b>ملزمة جديدة!</b>');
  lines.push('');
  lines.push(`📘 ${escapeHtml(info.subject_name)}`);
  lines.push(`📝 <b>${escapeHtml(info.title)}</b>`);

  if (info.professor_name) {
    lines.push(`👨‍🏫 د. ${escapeHtml(info.professor_name)}`);
  }

  const text = lines.join('\n');

  // 4. أرسل على دفعات
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

    // انتظر بين الدفعات لتجنب rate limit
    if (i + BATCH_SIZE < subscribers.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  console.log(`[notify] sent to ${subscribers.length} subscribers`);
}

// ==================== Morning Digest ====================
/**
 * موجز صباحي — يُشغَّل من cron كل يوم 7 صباحاً.
 * يرسل ملخص الملازم المضافة خلال آخر 24 ساعة.
 */
export async function sendMorningDigest(): Promise<{ sent: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const baseUrl = getBaseUrl();

  // 1. الملازم المضافة خلال آخر 24 ساعة، مجمّعة حسب المرحلة
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: notes, error: notesErr } = await supabaseAdmin
    .from('lecture_notes')
    .select('id, title, professor_name, created_at, subjects!inner(name, stage)')
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

  // 2. رتّب حسب المرحلة
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

  const byStage: Record<string, { title: string; subject: string }[]> = {};
  for (const n of notes as Array<{
    id: string;
    title: string;
    professor_name: string | null;
    subjects: unknown;
  }>) {
    const rel = pickRelation(n.subjects);
    if (!rel.stage) continue;
    if (!byStage[rel.stage]) byStage[rel.stage] = [];
    byStage[rel.stage].push({ title: n.title, subject: rel.name });
  }

  // 3. اجلب المشتركين
  const { data: subs, error: subsErr } = await supabaseAdmin
    .from('telegram_subscribers')
    .select('chat_id, stage, subjects')
    .eq('notify_morning', true)
    .not('stage', 'is', null);

  if (subsErr) {
    console.error('[morning] fetch subscribers error:', subsErr.message);
    return { sent: 0 };
  }

  if (!subs || subs.length === 0) return { sent: 0 };

  // 4. أرسل لكل مشترك
  let sent = 0;
  const subscribers = subs as SubscriberLite[];

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (sub) => {
        if (!sub.stage) return;
        const stageNotes = byStage[sub.stage] ?? [];
        if (stageNotes.length === 0) return;

        // فلترة حسب المواد
        const filtered =
          sub.subjects && sub.subjects.length > 0
            ? stageNotes.filter((n) => sub.subjects.includes(n.subject))
            : stageNotes;

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
          lines.push(`• <b>${escapeHtml(n.subject)}</b>: ${escapeHtml(n.title)}`);
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
/**
 * تنبيه مسائي — يُشغَّل من cron كل يوم 9 مساءً.
 * يُذكّر المشتركين اللي عندهم ستريك ولا زالوا ما فتحوا اليوم.
 */
export async function sendStreakReminder(): Promise<{ sent: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const baseUrl = getBaseUrl();

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 1. اجلب المشتركين اللي:
  //    - عندهم تنبيه الستريك مفعّل
  //    - عندهم ستريك > 0
  //    - ما فتحوا ملزمة اليوم
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

  // 2. أرسل التذكيرات
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
            [{ text: '🔥 عرض سلسلتي', url: 'https://t.me/' }], // سيُستبدل بـusername البوت
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

// ==================== Stats (للمشرف) ====================
export async function getBotStats(): Promise<{
  total: number;
  byStage: Record<string, number>;
  streaks: { avg: number; max: number; active: number };
}> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data } = await supabaseAdmin
    .from('telegram_subscribers')
    .select('stage, streak_count');

  const subs = (data ?? []) as Array<{ stage: string | null; streak_count: number }>;

  const byStage: Record<string, number> = {};
  let totalStreak = 0;
  let maxStreak = 0;
  let activeStreaks = 0;

  for (const s of subs) {
    const stage = s.stage ?? 'غير محدد';
    byStage[stage] = (byStage[stage] ?? 0) + 1;
    const st = s.streak_count ?? 0;
    totalStreak += st;
    if (st > maxStreak) maxStreak = st;
    if (st > 0) activeStreaks++;
  }

  return {
    total: subs.length,
    byStage,
    streaks: {
      avg: subs.length > 0 ? Math.round((totalStreak / subs.length) * 10) / 10 : 0,
      max: maxStreak,
      active: activeStreaks,
    },
  };
}