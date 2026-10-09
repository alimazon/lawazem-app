// app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  escapeHtml,
  getWebhookSecret,
  stageLabel,
  STAGE_MAP,
  STAGE_REVERSE,
  type InlineKeyboardMarkup,
} from '@/lib/telegram';

// ==================== Types ====================
interface TelegramUser {
  id: number;
  first_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string };
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: {
    message_id: number;
    chat: { id: number };
  };
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface Subscriber {
  chat_id: number;
  first_name: string | null;
  stage: string | null;
  subjects: string[];
  notify_new_note: boolean;
  notify_morning: boolean;
  notify_streak: boolean;
  notify_weekly: boolean;
  notify_trending: boolean;
  onboarding_step: string;
  streak_count: number;
  last_streak_date: string | null;
  total_opens: number;
}

// ==================== Route ====================
export async function POST(request: Request) {
  // التحقق من السر
  const secret = getWebhookSecret();
  if (secret) {
    const incoming = request.headers.get('x-telegram-bot-api-secret-token');
    if (incoming !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const baseUrl = `${new URL(request.url).protocol}//${new URL(request.url).host}`;

  try {
    if (update.message) {
      await handleMessage(update.message, baseUrl);
    } else if (update.callback_query) {
      await handleCallback(update.callback_query, baseUrl);
    }
  } catch (err) {
    console.error('[tg webhook] error:', err);
  }

  return NextResponse.json({ ok: true });
}

// ==================== Subscriber Helpers ====================
async function getSubscriber(chatId: number): Promise<Subscriber | null> {
  const { data } = await getSupabaseAdmin()
    .from('telegram_subscribers')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle<Subscriber>();
  return data ?? null;
}

async function upsertSubscriber(
  user: TelegramUser,
  patch: Partial<Subscriber>
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const existing = await getSubscriber(user.id);

  if (existing) {
    await supabaseAdmin
      .from('telegram_subscribers')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('chat_id', user.id);
  } else {
    await supabaseAdmin.from('telegram_subscribers').insert({
      chat_id: user.id,
      first_name: user.first_name ?? null,
      username: user.username ?? null,
      ...patch,
    });
  }
}

// ==================== Message Handler ====================
async function handleMessage(msg: TelegramMessage, baseUrl: string) {
  if (!msg.text || !msg.from) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const lower = text.toLowerCase();

  // /start
  if (lower === '/start' || lower.startsWith('/start ')) {
    await handleStart(msg);
    return;
  }

  // /help
  if (lower === '/help') {
    await sendHelp(chatId, baseUrl);
    return;
  }

  // /streak
  if (lower === '/streak') {
    await sendStreak(chatId);
    return;
  }

  // /settings
  if (lower === '/settings') {
    await sendSettings(chatId);
    return;
  }

  // /stop
  if (lower === '/stop') {
    await handleStop(chatId);
    return;
  }

  // افتراضي — طلب غير معروف
  await sendMessage(
    chatId,
    `🤔 لم أفهم هذا الأمر.\n\nاكتب /help لرؤية القائمة، أو /start للتسجيل.`
  );
}

// ==================== /start ====================
async function handleStart(msg: TelegramMessage) {
  if (!msg.from) return;
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name ?? '';

  const existing = await getSubscriber(chatId);

  // مستخدم جديد أو أعاد البدء — نبدأ onboarding من جديد
  await upsertSubscriber(msg.from, { onboarding_step: 'choosing_stage' });

  const greeting = firstName ? `، ${escapeHtml(firstName)}` : '';
  const text = existing
    ? `👋 أهلاً من جديد${greeting}!\n\nاختر مرحلتك الدراسية:`
    : `👋 أهلاً${greeting}!\n\nأنا <b>بوت لوازم</b> — سأخبرك بالجديد في مرحلتك مباشرة.\n\nاختر مرحلتك الدراسية:`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [{ text: '📘 المرحلة الأولى', callback_data: 'stage:1' }],
      [{ text: '📗 المرحلة الثانية', callback_data: 'stage:2' }],
      [{ text: '📙 المرحلة الثالثة', callback_data: 'stage:3' }],
    ],
  };

  await sendMessage(chatId, text, { reply_markup: keyboard });
}

// ==================== /help ====================
async function sendHelp(chatId: number, baseUrl: string) {
  const text = `🧭 <b>قائمة الأوامر</b>

<b>⚙️ الإعدادات</b>
<code>/settings</code> — تحكم في الإشعارات

<b>🔥 نشاطك</b>
<code>/streak</code> — سلسلة أيامك وإنجازاتك

<b>🚀 إعادة البدء</b>
<code>/start</code> — تغيير المرحلة أو المواد

<b>🔕 إيقاف</b>
<code>/stop</code> — إلغاء الاشتراك

<a href="${baseUrl}">🌐 افتح المنصة</a>`;

  await sendMessage(chatId, text);
}

// ==================== /streak ====================
async function sendStreak(chatId: number) {
  const sub = await getSubscriber(chatId);
  if (!sub || !sub.stage) {
    await sendMessage(
      chatId,
      `أنت غير مشترك بعد.\nاكتب /start للتسجيل.`
    );
    return;
  }

  const streak = sub.streak_count ?? 0;
  const total = sub.total_opens ?? 0;

  // شارات
  const badges: string[] = [];
  if (total >= 1) badges.push('🌱 بداية الرحلة');
  if (total >= 10) badges.push('📚 قارئ');
  if (total >= 50) badges.push('💪 مذاكر جدي');
  if (total >= 100) badges.push('🏆 أسطورة');
  if (streak >= 3) badges.push(`🔥 ${streak} أيام متتالية`);
  if (streak >= 7) badges.push('⚡ أسبوع كامل');
  if (streak >= 30) badges.push('👑 شهر كامل');

  const lines: string[] = [];
  lines.push(`🔥 <b>سلسلتك</b>\n`);
  lines.push(`📅 <b>${streak}</b> ${streak === 1 ? 'يوم متتالي' : 'أيام متتالية'}`);
  lines.push(`📖 <b>${total}</b> ملزمة فتحتها من البوت`);

  if (badges.length > 0) {
    lines.push('\n<b>شاراتك:</b>');
    badges.forEach((b) => lines.push(b));
  } else {
    lines.push('\n💡 افتح ملزمة اليوم لتبدأ سلسلتك!');
  }

  await sendMessage(chatId, lines.join('\n'));
}

// ==================== /settings ====================
async function sendSettings(chatId: number, messageId?: number) {
  const sub = await getSubscriber(chatId);
  if (!sub || !sub.stage) {
    await sendMessage(chatId, `اكتب /start للتسجيل أولاً.`);
    return;
  }

  const text = `⚙️ <b>الإعدادات</b>

المرحلة: <b>${escapeHtml(sub.stage)}</b>
المواد: <b>${sub.subjects.length > 0 ? sub.subjects.length : 'الكل'}</b>

اختر ما تريد استقباله:`;

  const check = (v: boolean) => (v ? '✅' : '⬜');

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: `${check(sub.notify_new_note)} ملزمة جديدة`, callback_data: 'tog:new_note' },
        { text: `${check(sub.notify_morning)} موجز صباحي`, callback_data: 'tog:morning' },
      ],
      [
        { text: `${check(sub.notify_streak)} تنبيه الستريك`, callback_data: 'tog:streak' },
        { text: `${check(sub.notify_weekly)} ملخص أسبوعي`, callback_data: 'tog:weekly' },
      ],
      [{ text: `${check(sub.notify_trending)} محتوى رائج`, callback_data: 'tog:trending' }],
      [
        { text: '📚 تغيير المواد', callback_data: 'settings:subjects' },
        { text: '🔄 تغيير المرحلة', callback_data: 'settings:stage' },
      ],
    ],
  };

  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard });
  } else {
    await sendMessage(chatId, text, { reply_markup: keyboard });
  }
}

// ==================== /stop ====================
async function handleStop(chatId: number) {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from('telegram_subscribers').delete().eq('chat_id', chatId);

  await sendMessage(
    chatId,
    `👋 <b>تم إلغاء اشتراكك</b>\n\nلن تصلك إشعارات بعد الآن.\nيمكنك العودة في أي وقت بـ /start`
  );
}

// ==================== Callback Handler ====================
async function handleCallback(cb: TelegramCallbackQuery, baseUrl: string) {
  if (!cb.data || !cb.message) return;

  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;

  // ========== اختيار المرحلة ==========
  if (cb.data.startsWith('stage:')) {
    const code = cb.data.slice(6);
    const stage = STAGE_MAP[code];
    if (!stage) {
      await answerCallbackQuery(cb.id, 'مرحلة غير معروفة');
      return;
    }

    // حدّث المرحلة وانتقل لاختيار المواد
    await upsertSubscriber(cb.from, {
      stage,
      subjects: [],
      onboarding_step: 'choosing_subjects',
    });

    await answerCallbackQuery(cb.id, `تم اختيار ${stage}`);
    await sendSubjectsKeyboard(chatId, messageId, cb.from.id, stage);
    return;
  }

  // ========== تبديل مادة ==========
  if (cb.data.startsWith('subj:')) {
    const subjectName = cb.data.slice(5);
    const sub = await getSubscriber(chatId);
    if (!sub) {
      await answerCallbackQuery(cb.id, 'حدث خطأ، أعد /start');
      return;
    }

    const current = new Set(sub.subjects);
    if (current.has(subjectName)) {
      current.delete(subjectName);
      await answerCallbackQuery(cb.id, `تم إلغاء ${subjectName}`);
    } else {
      current.add(subjectName);
      await answerCallbackQuery(cb.id, `تم إضافة ${subjectName}`);
    }

    await upsertSubscriber(cb.from, { subjects: Array.from(current) });
    await sendSubjectsKeyboard(chatId, messageId, cb.from.id, sub.stage ?? '');
    return;
  }

  // ========== تم اختيار المواد ==========
  if (cb.data === 'subj_done') {
    await upsertSubscriber(cb.from, { onboarding_step: 'idle' });

    const sub = await getSubscriber(chatId);
    const subjectCount = sub?.subjects.length ?? 0;

    const text = `✅ <b>تم التسجيل!</b>

📌 المرحلة: <b>${escapeHtml(sub?.stage ?? '')}</b>
📚 المواد: <b>${subjectCount > 0 ? `${subjectCount} مادة` : 'الكل'}</b>

من الآن، سأخبرك بالجديد في مرحلتك مباشرة. 🎯

استخدم:
<code>/settings</code> — لتعديل الإشعارات
<code>/streak</code> — لمتابعة سلسلتك
<code>/help</code> — قائمة الأوامر`;

    await answerCallbackQuery(cb.id, 'تم التسجيل بنجاح!');
    await editMessageText(chatId, messageId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 افتح المنصة', url: baseUrl }],
        ],
      },
    });
    return;
  }

  // ========== تبديل إشعار ==========
  if (cb.data.startsWith('tog:')) {
    const key = cb.data.slice(4);
    const columnMap: Record<string, keyof Subscriber> = {
      new_note: 'notify_new_note',
      morning: 'notify_morning',
      streak: 'notify_streak',
      weekly: 'notify_weekly',
      trending: 'notify_trending',
    };
    const column = columnMap[key];
    if (!column) {
      await answerCallbackQuery(cb.id, 'خيار غير معروف');
      return;
    }

    const sub = await getSubscriber(chatId);
    if (!sub) {
      await answerCallbackQuery(cb.id, 'حدث خطأ');
      return;
    }

    const current = sub[column] as boolean;
    await upsertSubscriber(cb.from, { [column]: !current } as Partial<Subscriber>);

    await answerCallbackQuery(cb.id, !current ? 'تم التفعيل' : 'تم الإلغاء');
    await sendSettings(chatId, messageId);
    return;
  }

  // ========== تغيير المرحلة من الإعدادات ==========
  if (cb.data === 'settings:stage') {
    await upsertSubscriber(cb.from, { onboarding_step: 'choosing_stage' });
    await answerCallbackQuery(cb.id);
    await editMessageText(chatId, messageId, 'اختر مرحلتك:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📘 المرحلة الأولى', callback_data: 'stage:1' }],
          [{ text: '📗 المرحلة الثانية', callback_data: 'stage:2' }],
          [{ text: '📙 المرحلة الثالثة', callback_data: 'stage:3' }],
        ],
      },
    });
    return;
  }

  // ========== تغيير المواد من الإعدادات ==========
  if (cb.data === 'settings:subjects') {
    const sub = await getSubscriber(chatId);
    if (!sub || !sub.stage) {
      await answerCallbackQuery(cb.id, 'حدد المرحلة أولاً');
      return;
    }
    await upsertSubscriber(cb.from, { onboarding_step: 'choosing_subjects' });
    await answerCallbackQuery(cb.id);
    await sendSubjectsKeyboard(chatId, messageId, cb.from.id, sub.stage);
    return;
  }

  await answerCallbackQuery(cb.id);
}

// ==================== Subjects Keyboard ====================
async function sendSubjectsKeyboard(
  chatId: number,
  messageId: number,
  _userId: number,
  stage: string
) {
  const supabaseAdmin = getSupabaseAdmin();

  // اجلب المواد لهذه المرحلة
  const { data } = await supabaseAdmin
    .from('subjects')
    .select('name')
    .eq('stage', stage)
    .order('name');

  const subjectNames = (data ?? []).map((s: { name: string }) => s.name);

  const sub = await getSubscriber(chatId);
  const selected = new Set(sub?.subjects ?? []);

  const text = `📚 <b>اختر موادك</b>

المرحلة: <b>${escapeHtml(stage)}</b>

اختر المواد التي تريد متابعتها، أو اضغط "تم" لمتابعة كل المواد.

المحددة: <b>${selected.size > 0 ? selected.size : 'الكل'}</b>`;

  const rows: { text: string; callback_data: string }[][] = [];
  // كل صف فيه مادة واحدة (لأن الأسماء قد تكون طويلة)
  subjectNames.slice(0, 20).forEach((name) => {
    const isSelected = selected.has(name);
    rows.push([
      {
        text: `${isSelected ? '✅' : '⬜'} ${name}`,
        callback_data: `subj:${name.slice(0, 40)}`,
      },
    ]);
  });

  rows.push([{ text: '🎯 تم', callback_data: 'subj_done' }]);

  await editMessageText(chatId, messageId, text, {
    reply_markup: { inline_keyboard: rows },
  });
}