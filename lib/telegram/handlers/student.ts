// lib/telegram/handlers/student.ts
import {
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  escapeHtml,
  STAGE_MAP,
  type InlineKeyboardMarkup,
} from '../../telegram';
import { getSupabaseAdmin } from '../../supabaseAdmin';
import { STAGES } from '../../constants';
import {
  getSubscriber,
  upsertSubscriber,
  isFullyOnboarded,
  groupLabel,
  groupEmoji,
} from '../subscribers';
import {
  STUDENT_MENU,
  STUDENT_MENU_TEXTS,
} from './menus';
import type {
  Subscriber,
  TelegramMessage,
  TelegramCallbackQuery,
  NotifyToggleKey,
} from '../types';
import { NOTIFY_TOGGLE_LABELS } from '../types';

// ==================== Keyboards ====================
function stageKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '📘 المرحلة الأولى', callback_data: 'stage:1' }],
      [{ text: '📗 المرحلة الثانية', callback_data: 'stage:2' }],
      [{ text: '📙 المرحلة الثالثة', callback_data: 'stage:3' }],
    ],
  };
}

function groupKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '🔵 كروب A', callback_data: 'group:A' }],
      [{ text: '🟡 كروب B', callback_data: 'group:B' }],
    ],
  };
}

function startKeyboard(baseUrl: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '⚙️ الإعدادات', callback_data: 'settings:show' }],
      [{ text: '🔄 تحديث التسجيل', callback_data: 'onboarding:restart' }],
      [{ text: '🌐 افتح المنصة', url: baseUrl }],
    ],
  };
}

// ==================== Public Menu (Reply Keyboard) ====================
/**
 * أرسل القائمة الثابتة للطالب.
 * تُستدعى عند أول /start أو عندما يطلبها.
 */
export async function sendStudentMenu(
  chatId: number,
  intro: string,
): Promise<boolean> {
  return sendMessage(chatId, intro, {
    reply_markup: STUDENT_MENU,
  });
}

// ==================== /start ====================
export async function handleStart(
  msg: TelegramMessage,
  baseUrl: string,
): Promise<void> {
  if (!msg.from) return;
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name ?? '';

  const existing = await getSubscriber(chatId);

  // ✅ مسجّل بالكامل — لا تطلب منه المرحلة من جديد
  if (isFullyOnboarded(existing) && existing) {
    const subjectCount = existing.subjects.length;
    const groupLine = `${groupEmoji(existing.group_name!)} <b>${groupLabel(
      existing.group_name!,
    )}</b>`;

    const lines: string[] = [];
    lines.push(
      `👋 <b>أهلاً من جديد${firstName ? `، ${escapeHtml(firstName)}` : ''}!</b>`,
    );
    lines.push('');
    lines.push(`📌 مرحلتك: <b>${escapeHtml(existing.stage!)}</b>`);
    lines.push(`👥 كروبك: ${groupLine}`);
    lines.push(
      `📚 موادك: <b>${subjectCount > 0 ? `${subjectCount} مادة` : 'الكل'}</b>`,
    );
    lines.push('');
    lines.push('👇 استخدم الأزرار بالأسفل للتنقل.');

    await sendMessage(chatId, lines.join('\n'), {
      reply_markup: STUDENT_MENU,
    });
    return;
  }

  // ===== مسجّل جزئياً أو جديد → ابدأ التسجيل =====
  await upsertSubscriber(msg.from, { onboarding_step: 'choosing_stage' });

  const greeting = firstName ? `، ${escapeHtml(firstName)}` : '';
  const text = existing
    ? `👋 أهلاً من جديد${greeting}!\n\nاختر مرحلتك الدراسية:`
    : `👋 أهلاً${greeting}!\n\nأنا <b>بوت لوازم</b> — سأخبرك بالجديد في مرحلتك مباشرة.\n\nاختر مرحلتك الدراسية:`;

  await sendMessage(chatId, text, { reply_markup: stageKeyboard() });
}

// ==================== Stage Selection ====================
export async function handleStageSelection(
  cb: TelegramCallbackQuery,
  code: string,
): Promise<void> {
  if (!cb.message) return;
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;

  const stage = STAGE_MAP[code];
  if (!stage) {
    await answerCallbackQuery(cb.id, 'مرحلة غير معروفة');
    return;
  }

  await upsertSubscriber(cb.from, {
    stage,
    group_name: null,
    subjects: [],
    onboarding_step: 'choosing_group',
  });

  await answerCallbackQuery(cb.id, `تم اختيار ${stage}`);
  await editMessageText(
    chatId,
    messageId,
    `📚 <b>${escapeHtml(stage)}</b>\n\nالآن اختر كروبك النظري:`,
    { reply_markup: groupKeyboard() },
  );
}

// ==================== Group Selection ====================
export async function handleGroupSelection(
  cb: TelegramCallbackQuery,
  code: string,
  baseUrl: string,
): Promise<void> {
  if (!cb.message) return;
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;

  if (code !== 'A' && code !== 'B') {
    await answerCallbackQuery(cb.id, 'كروب غير معروف');
    return;
  }

  const before = await getSubscriber(chatId);
  const fromSettings = before?.onboarding_step === 'choosing_group_from_settings';

  if (fromSettings) {
    await upsertSubscriber(cb.from, {
      group_name: code,
      onboarding_step: 'idle',
    });
    await answerCallbackQuery(cb.id, `تم اختيار ${groupLabel(code)}`);
    await sendSettings(chatId, messageId);
  } else {
    await upsertSubscriber(cb.from, {
      group_name: code,
      onboarding_step: 'choosing_subjects',
    });
    await answerCallbackQuery(cb.id, `تم اختيار ${groupLabel(code)}`);
    await sendSubjectsKeyboard(chatId, messageId, before?.stage ?? '');
  }
}

// ==================== Subject Toggle ====================
export async function handleSubjectToggle(
  cb: TelegramCallbackQuery,
  subjectName: string,
): Promise<void> {
  if (!cb.message) return;
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;

  const sub = await getSubscriber(chatId);
  if (!sub) {
    await answerCallbackQuery(cb.id, 'حدث خطأ، أعد /start');
    return;
  }

  const current = new Set(sub.subjects ?? []);
  if (current.has(subjectName)) {
    current.delete(subjectName);
    await answerCallbackQuery(cb.id, `تم إلغاء ${subjectName}`);
  } else {
    current.add(subjectName);
    await answerCallbackQuery(cb.id, `تم إضافة ${subjectName}`);
  }

  await upsertSubscriber(cb.from, { subjects: Array.from(current) });
  await sendSubjectsKeyboard(chatId, messageId, sub.stage ?? '');
}

// ==================== Subjects Keyboard ====================
export async function sendSubjectsKeyboard(
  chatId: number,
  messageId: number,
  stage: string,
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

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

اضغط على المواد التي تريد متابعتها فقط.
إذا لم تختر أي مادة → ستصلك تحديثات <b>كل المواد</b>.

المحددة حالياً: <b>${
    selected.size > 0 ? `${selected.size} مادة` : 'كل المواد'
  }</b>`;

  const rows: { text: string; callback_data: string }[][] = [];
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

// ==================== Subjects Done ====================
export async function handleSubjectsDone(
  cb: TelegramCallbackQuery,
  baseUrl: string,
): Promise<void> {
  if (!cb.message) return;
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;

  const wasOnboarding = (await getSubscriber(chatId))?.onboarding_step === 'choosing_subjects';

  await upsertSubscriber(cb.from, { onboarding_step: 'idle' });

  const sub = await getSubscriber(chatId);

  // ✅ إشعار السوبر أدمن فقط بتسجيل طالب جديد
  if (wasOnboarding && sub) {
    const { notifySuperAdminsNewSubscriber } = await import('../notify-admins');
    void notifySuperAdminsNewSubscriber(sub);
  }

  // ✅ إشعار السوبر أدمن بتسجيل طالب جديد
  if (wasOnboarding && sub) {
    const { notifySuperAdminsNewSubscriber } = await import('../notify-admins');
    void notifySuperAdminsNewSubscriber(sub);
  }
  const subjectCount = sub?.subjects.length ?? 0;
  const groupLine = sub?.group_name
    ? `${groupEmoji(sub.group_name)} <b>${groupLabel(sub.group_name)}</b>`
    : '⚠️ غير محدد';

  const text = `✅ <b>تم التسجيل!</b>

📌 المرحلة: <b>${escapeHtml(sub?.stage ?? '')}</b>
👥 الكروب: ${groupLine}
📚 المواد: <b>${subjectCount > 0 ? `${subjectCount} مادة` : 'الكل'}</b>

من الآن، سأخبرك بالجديد المناسب لك مباشرة. 🎯

استخدم الأزرار بالأسفل للتنقل.`;

  await answerCallbackQuery(cb.id, 'تم التسجيل بنجاح!');
  await editMessageText(chatId, messageId, text, {
    reply_markup: { inline_keyboard: [[{ text: '🌐 افتح المنصة', url: baseUrl }]] },
  });

  // بعد لحظة، أرسل الـReply Keyboard
  if (wasOnboarding) {
    setTimeout(() => {
      void sendMessage(chatId, '👇 <b>قائمتك الجديدة:</b>', {
        reply_markup: STUDENT_MENU,
      });
    }, 800);
  }
}

// ==================== /help ====================
export async function sendHelp(chatId: number, baseUrl: string): Promise<void> {
  const lines: string[] = [];
  lines.push('🧭 <b>قائمة الأوامر</b>');
  lines.push('');
  lines.push('<b>⚙️ للمشتركين</b>');
  lines.push('<code>/start</code> — التسجيل / تعديل الإعدادات');
  lines.push('<code>/settings</code> — الإشعارات والكروب');
  lines.push('<code>/streak</code> — سلسلة أيامك');
  lines.push('<code>/ask</code> — إرسال استفسار للإدارة');
  lines.push('<code>/stop</code> — إلغاء الاشتراك');
  lines.push('');
  lines.push('💡 يمكنك أيضاً استخدام الأزرار بالأسفل 👇');
  lines.push('');
  lines.push(`<a href="${baseUrl}">🌐 افتح المنصة</a>`);

  await sendMessage(chatId, lines.join('\n'), {
    reply_markup: STUDENT_MENU,
  });
}

// ==================== /streak ====================
export async function sendStreak(chatId: number): Promise<void> {
  const sub = await getSubscriber(chatId);
  if (!sub || !sub.stage) {
    await sendMessage(chatId, `أنت غير مشترك بعد.\nاكتب /start للتسجيل.`);
    return;
  }

  const streak = sub.streak_count ?? 0;
  const total = sub.total_opens ?? 0;

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

  await sendMessage(chatId, lines.join('\n'), {
    reply_markup: STUDENT_MENU,
  });
}

// ==================== /settings ====================
export async function sendSettings(
  chatId: number,
  messageId?: number,
): Promise<void> {
  const sub = await getSubscriber(chatId);
  if (!sub || !sub.stage) {
    await sendMessage(chatId, `اكتب /start للتسجيل أولاً.`);
    return;
  }

  const groupLine = sub.group_name
    ? `${groupEmoji(sub.group_name)} <b>${groupLabel(sub.group_name)}</b>`
    : '⚠️ <i>لم تُحدد بعد</i>';

  const text = `⚙️ <b>الإعدادات</b>

المرحلة: <b>${escapeHtml(sub.stage)}</b>
الكروب: ${groupLine}
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
      [
        { text: `${check(sub.notify_trending)} محتوى رائج`, callback_data: 'tog:trending' },
      ],
      [
        { text: `${check(sub.notify_announcements)} 📢 تبليغات إدارية`, callback_data: 'tog:announcements' },
      ],
      [
        { text: '👥 تغيير الكروب', callback_data: 'settings:group' },
        { text: '📚 تغيير المواد', callback_data: 'settings:subjects' },
      ],
      [{ text: '🔄 تغيير المرحلة', callback_data: 'settings:stage' }],
    ],
  };

  if (messageId) {
    await editMessageText(chatId, messageId, text, { reply_markup: keyboard });
  } else {
    await sendMessage(chatId, text, { reply_markup: keyboard });
  }
}

// ==================== Toggle Notification ====================
const TOGGLE_MAP: Record<string, NotifyToggleKey> = {
  new_note: 'notify_new_note',
  morning: 'notify_morning',
  streak: 'notify_streak',
  weekly: 'notify_weekly',
  trending: 'notify_trending',
  announcements: 'notify_announcements',
};

export async function handleToggleNotification(
  cb: TelegramCallbackQuery,
  key: string,
): Promise<void> {
  if (!cb.message) return;
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;

  const column = TOGGLE_MAP[key];
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
}

// ==================== Settings Navigation ====================
export async function handleSettingsNavigation(
  cb: TelegramCallbackQuery,
  action: string,
): Promise<void> {
  if (!cb.message) return;
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;

  const sub = await getSubscriber(chatId);
  if (!sub || !sub.stage) {
    await answerCallbackQuery(cb.id, 'حدد المرحلة أولاً');
    return;
  }

  if (action === 'stage') {
    await upsertSubscriber(cb.from, { onboarding_step: 'choosing_stage' });
    await answerCallbackQuery(cb.id);
    await editMessageText(chatId, messageId, 'اختر مرحلتك:', {
      reply_markup: stageKeyboard(),
    });
    return;
  }

  if (action === 'group') {
    await upsertSubscriber(cb.from, {
      onboarding_step: 'choosing_group_from_settings',
    });
    await answerCallbackQuery(cb.id);
    await editMessageText(
      chatId,
      messageId,
      `📚 <b>${escapeHtml(sub.stage)}</b>\n\nاختر كروبك الجديد:`,
      { reply_markup: groupKeyboard() },
    );
    return;
  }

  if (action === 'subjects') {
    await upsertSubscriber(cb.from, { onboarding_step: 'choosing_subjects' });
    await answerCallbackQuery(cb.id);
    await sendSubjectsKeyboard(chatId, messageId, sub.stage);
    return;
  }

  if (action === 'show') {
    await answerCallbackQuery(cb.id);
    await sendSettings(chatId);
    return;
  }

  if (action === 'restart') {
    await upsertSubscriber(cb.from, {
      stage: null,
      group_name: null,
      subjects: [],
      onboarding_step: 'choosing_stage',
    });
    await answerCallbackQuery(cb.id, 'اختر مرحلتك من جديد');
    await editMessageText(
      chatId,
      messageId,
      '🔄 <b>إعادة التسجيل</b>\n\nاختر مرحلتك الدراسية:',
      { reply_markup: stageKeyboard() },
    );
    return;
  }
}

// ==================== /stop ====================
export async function handleStop(chatId: number): Promise<void> {
  const { deleteSubscriber } = await import('../subscribers');
  await deleteSubscriber(chatId);

  await sendMessage(
    chatId,
    `👋 <b>تم إلغاء اشتراكك</b>\n\nلن تصلك إشعارات بعد الآن.\nيمكنك العودة في أي وقت بـ /start`,
    { reply_markup: { remove_keyboard: true } },
  );
}

// ==================== Menu Buttons ====================
/**
 * يتعامل مع أزرار الـReply Keyboard الخاصة بالطالب.
 * يُرجع true إذا تعامل مع الزر، false إذا لا.
 */
export async function handleStudentMenuButton(
  chatId: number,
  text: string,
  baseUrl: string,
): Promise<boolean> {
  if (text === STUDENT_MENU_TEXTS.lawazem) {
    await sendMessage(chatId, `📚 <b>الملازم</b>\n\nاضغط الزر لفتحها:`, {
      reply_markup: {
        inline_keyboard: [[{ text: '🌐 فتح الملازم', url: `${baseUrl}/lawazem` }]],
      },
    });
    return true;
  }

  if (text === STUDENT_MENU_TEXTS.dictionary) {
    await sendMessage(chatId, `🔍 <b>القاموس الطبي</b>\n\nاضغط الزر لفتحه:`, {
      reply_markup: {
        inline_keyboard: [[{ text: '🌐 فتح القاموس', url: `${baseUrl}/dictionary` }]],
      },
    });
    return true;
  }

  if (text === STUDENT_MENU_TEXTS.streak) {
    await sendStreak(chatId);
    return true;
  }

  if (text === STUDENT_MENU_TEXTS.settings) {
    await sendSettings(chatId);
    return true;
  }

  if (text === STUDENT_MENU_TEXTS.help) {
    await sendHelp(chatId, baseUrl);
    return true;
  }

  // 📮 استفسار → يُعالج في inquiries.ts
  return false;
}