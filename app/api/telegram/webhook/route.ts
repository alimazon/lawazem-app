// app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import {
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  escapeHtml,
  getWebhookSecret,
  STAGE_MAP,
  type InlineKeyboardButton,
  type InlineKeyboardMarkup,
} from '@/lib/telegram';
import {
  getAdmin,
  listAdmins,
  listSuperAdmins,
  hasAnySuperAdmin,
  registerAdmin,
  deactivateAdmin,
  roleLabel,
  type AdminRole,
  type TelegramAdmin,
} from '@/lib/telegram-admins';
import { sendAnnouncement } from '@/lib/telegram-notifications';
import type { Group } from '@/lib/types';
import { STAGES } from '@/lib/constants';

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

type OnboardingStep =
  | 'choosing_stage'
  | 'choosing_group'
  | 'choosing_group_from_settings'
  | 'choosing_subjects'
  | 'idle';

interface Subscriber {
  chat_id: number;
  first_name: string | null;
  stage: string | null;
  group_name: Group | null;
  subjects: string[];
  notify_new_note: boolean;
  notify_morning: boolean;
  notify_streak: boolean;
  notify_weekly: boolean;
  notify_trending: boolean;
  notify_announcements: boolean;
  onboarding_step: OnboardingStep;
  streak_count: number;
  last_streak_date: string | null;
  total_opens: number;
}

interface AnnouncementDraft {
  title: string | null;
  body: string | null;
  stage: string | null;
  link_url: string | null;
  link_label: string | null;
}

interface AdminSession {
  chat_id: number;
  flow:
    | { type: 'idle' }
    | { type: 'announce'; step: 'title' | 'body' | 'stage' | 'link'; draft: AnnouncementDraft }
    | { type: 'add_admin'; step: 'chat_id' | 'role'; targetChatId?: number }
    | { type: 'reject'; announcementId: string; title: string };
  updated_at: number;
}

// ==================== Helpers ====================
function groupLabel(g: Group): string {
  return g === 'A' ? 'كروب A' : 'كروب B';
}
function groupEmoji(g: Group): string {
  return g === 'A' ? '🔵' : '🟡';
}

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

function stageListKeyboard(): InlineKeyboardMarkup {
  const rows: InlineKeyboardButton[][] = STAGES.map((s, i) => [
    { text: s, callback_data: `ann_stage:${i + 1}` },
  ]);
  rows.push([{ text: '🌐 كل المراحل', callback_data: 'ann_stage:all' }]);
  return { inline_keyboard: rows };
}

function skipLinkKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: '⏭️ تخطّي الرابط', callback_data: 'ann_skip_link' }]],
  };
}

function announceActionsKeyboard(id: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ موافقة وإرسال', callback_data: `ann_approve:${id}` },
        { text: '❌ رفض', callback_data: `ann_reject:${id}` },
      ],
      [{ text: '🗑 حذف', callback_data: `ann_delete:${id}` }],
    ],
  };
}

function pendingItemKeyboard(id: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ إرسال', callback_data: `ann_approve:${id}` },
        { text: '❌ رفض', callback_data: `ann_reject:${id}` },
      ],
    ],
  };
}

function roleKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '👑 مشرف أعلى', callback_data: 'addadmin_role:super_admin' }],
      [{ text: '🛡 مشرف', callback_data: 'addadmin_role:admin' }],
      [{ text: '✍️ ناشر', callback_data: 'addadmin_role:publisher' }],
    ],
  };
}

function announcementPreviewText(d: AnnouncementDraft, creator: string): string {
  const lines: string[] = [];
  lines.push('📢 <b>تبليغ جديد بانتظار المراجعة</b>');
  lines.push('');
  lines.push(`👤 من: ${escapeHtml(creator)}`);
  lines.push(`🎯 المرحلة: ${d.stage ? escapeHtml(d.stage) : 'كل المراحل'}`);
  lines.push('');
  lines.push(`<b>${escapeHtml(d.title ?? '')}</b>`);
  lines.push('');
  lines.push(escapeHtml(d.body ?? ''));
  if (d.link_url) {
    lines.push('');
    lines.push(`🔗 ${escapeHtml(d.link_label || d.link_url)}`);
  }
  return lines.join('\n');
}

// ==================== Session storage ====================
const sessions = new Map<number, AdminSession>();

function getSession(chatId: number): AdminSession {
  const existing = sessions.get(chatId);
  if (existing) return existing;
  const fresh: AdminSession = { chat_id: chatId, flow: { type: 'idle' }, updated_at: Date.now() };
  sessions.set(chatId, fresh);
  return fresh;
}

function setFlow(chatId: number, flow: AdminSession['flow']) {
  const s = getSession(chatId);
  s.flow = flow;
  s.updated_at = Date.now();
}

function resetFlow(chatId: number) {
  setFlow(chatId, { type: 'idle' });
}

// ==================== Route ====================
export async function POST(request: Request) {
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
  patch: Partial<Subscriber>,
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

  // === أوامر عامة ===
  if (lower === '/start' || lower.startsWith('/start ')) {
    await handleStart(msg, baseUrl);
    return;
  }
  if (lower === '/help') {
    await sendHelp(chatId, baseUrl);
    return;
  }
  if (lower === '/streak') {
    await sendStreak(chatId);
    return;
  }
  if (lower === '/settings') {
    await sendSettings(chatId);
    return;
  }
  if (lower === '/stop') {
    await handleStop(chatId);
    return;
  }

  const admin = await getAdmin(chatId);

  // === /register (فقط أول مشرف) ===
  if (lower === '/register') {
    await handleRegister(msg);
    return;
  }

  // === أوامر المشرف ===
  if (admin) {
    // /admin_help
    if (
      lower === '/admin_help' ||
      lower === '/guide' ||
      lower === '/help_admin'
    ) {
      await sendAdminHelp(chatId, admin);
      return;
    }

    // /admins
    if (lower === '/admins') {
      if (admin.role !== 'super_admin') {
        await sendMessage(chatId, '❌ هذا الأمر للمشرف الأعلى فقط.');
        return;
      }
      await handleListAdmins(chatId);
      return;
    }

    // /add_admin
    if (lower === '/add_admin' || lower.startsWith('/add_admin ')) {
      if (admin.role !== 'super_admin') {
        await sendMessage(chatId, '❌ هذا الأمر للمشرف الأعلى فقط.');
        return;
      }
      await handleAddAdminCommand(chatId, text);
      return;
    }

    // /remove_admin
    if (lower === '/remove_admin' || lower.startsWith('/remove_admin ')) {
      if (admin.role !== 'super_admin') {
        await sendMessage(chatId, '❌ هذا الأمر للمشرف الأعلى فقط.');
        return;
      }
      await handleRemoveAdmin(chatId, text);
      return;
    }

    // /announce
    if (lower === '/announce') {
      resetFlow(chatId);
      setFlow(chatId, {
        type: 'announce',
        step: 'title',
        draft: { title: null, body: null, stage: null, link_url: null, link_label: null },
      });
      await sendMessage(chatId, '📝 <b>إنشاء تبليغ جديد</b>\n\nاكتب <b>عنوان</b> التبليغ:', {
        reply_markup: { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'ann_cancel' }]] },
      });
      return;
    }

    // /pending
    if (lower === '/pending') {
      if (admin.role !== 'super_admin') {
        await sendMessage(chatId, '❌ هذا الأمر للمشرف الأعلى فقط.');
        return;
      }
      await handlePendingList(chatId);
      return;
    }

    // /history
    if (lower === '/history') {
      if (admin.role !== 'super_admin') {
        await sendMessage(chatId, '❌ هذا الأمر للمشرف الأعلى فقط.');
        return;
      }
      await handleHistory(chatId);
      return;
    }

    // /stats
    if (lower === '/stats') {
      if (admin.role !== 'super_admin') {
        await sendMessage(chatId, '❌ هذا الأمر للمشرف الأعلى فقط.');
        return;
      }
      await handleStats(chatId);
      return;
    }

    // /cancel
    if (lower === '/cancel') {
      resetFlow(chatId);
      await sendMessage(chatId, '✅ تم الإلغاء.');
      return;
    }

    // === Flow (wizard) ===
    const session = getSession(chatId);

    if (session.flow.type === 'announce') {
      await handleAnnounceFlow(chatId, text, admin, session.flow);
      return;
    }

    if (session.flow.type === 'add_admin') {
      await handleAddAdminFlow(chatId, text, admin, session.flow);
      return;
    }

    if (session.flow.type === 'reject') {
      await handleRejectFlow(chatId, text, admin, session.flow);
      return;
    }
  }

  await sendMessage(
    chatId,
    `🤔 لم أفهم هذا الأمر.\n\nاكتب /help لرؤية القائمة، أو /start للتسجيل.`,
  );
}

// ==================== /register ====================
async function handleRegister(msg: TelegramMessage) {
  if (!msg.from) return;
  const chatId = msg.chat.id;

  const already = await hasAnySuperAdmin();
  if (already) {
    await sendMessage(
      chatId,
      '❌ يوجد مشرف أعلى مسجّل بالفعل.\nاطلب منه إضافتك عبر <code>/add_admin</code>.',
    );
    return;
  }

  const result = await registerAdmin({
    chatId,
    username: msg.from.username ?? null,
    firstName: msg.from.first_name ?? 'Super Admin',
    role: 'super_admin',
    addedBy: null,
  });

  if (!result.ok) {
    await sendMessage(chatId, `❌ فشل التسجيل: ${escapeHtml(result.error ?? '')}`);
    return;
  }

  await sendMessage(
    chatId,
    `👑 <b>تم تسجيلك كمشرف أعلى!</b>\n\nيمكنك الآن:\n` +
      `• <code>/announce</code> — إنشاء تبليغ\n` +
      `• <code>/pending</code> — مراجعة التبليغات\n` +
      `• <code>/add_admin</code> — إضافة مشرفين\n` +
      `• <code>/admins</code> — قائمة المشرفين\n` +
      `• <code>/stats</code> — إحصائيات\n` +
      `• <code>/admin_help</code> — دليل المشرف الكامل\n` +
      `• <code>/help</code> — كل الأوامر`,
  );
}

// ==================== /help ====================
async function sendHelp(chatId: number, baseUrl: string) {
  const admin = await getAdmin(chatId);

  const lines: string[] = [];
  lines.push('🧭 <b>قائمة الأوامر</b>');
  lines.push('');
  lines.push('<b>⚙️ للمشتركين</b>');
  lines.push('<code>/start</code> — التسجيل / تعديل الإعدادات');
  lines.push('<code>/settings</code> — الإشعارات والكروب');
  lines.push('<code>/streak</code> — سلسلة أيامك');
  lines.push('<code>/stop</code> — إلغاء الاشتراك');

  if (admin) {
    lines.push('');
    lines.push('<b>📢 للتبليغات</b>');
    lines.push('<code>/announce</code> — إنشاء تبليغ جديد');

    if (admin.role === 'super_admin') {
      lines.push('<code>/pending</code> — التبليغات قيد المراجعة');
      lines.push('<code>/history</code> — آخر التبليغات');
      lines.push('');
      lines.push('<b>👥 إدارة المشرفين</b>');
      lines.push('<code>/add_admin</code> — إضافة مشرف');
      lines.push('<code>/remove_admin</code> — حذف مشرف');
      lines.push('<code>/admins</code> — القائمة');
      lines.push('');
      lines.push('<b>📊 عام</b>');
      lines.push('<code>/stats</code> — إحصائيات البوت');
    }

    lines.push('');
    lines.push('💡 <b>هل تحتاج شرحاً مفصلاً؟</b>');
    lines.push('اكتب <code>/admin_help</code> لعرض دليل المشرف الكامل بخطوات عملية.');
  }

  lines.push('');
  lines.push(`<a href="${baseUrl}">🌐 افتح المنصة</a>`);

  await sendMessage(chatId, lines.join('\n'));
}

// ==================== /admin_help ====================
async function sendAdminHelp(chatId: number, admin: TelegramAdmin) {
  const isSuper = admin.role === 'super_admin';
  const lines: string[] = [];

  lines.push(`📖 <b>دليل ${isSuper ? 'المشرف الأعلى' : 'المشرف'}</b>`);
  lines.push('');
  lines.push(`👤 دورك: <b>${roleLabel(admin.role)}</b>`);
  lines.push('');
  lines.push(
    'هذا الدليل مقسّم حسب المهام اليومية — كل قسم يشرح أمراً واحداً بخطوات عملية واضحة.',
  );
  lines.push('');

  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push('🗺️ <b>المحتويات</b>');
  lines.push('━━━━━━━━━━━━━━━━━━━');
  if (isSuper) {
    lines.push('1️⃣ مراجعة التبليغات');
    lines.push('2️⃣ إنشاء تبليغ جديد');
    lines.push('3️⃣ إدارة المشرفين');
    lines.push('4️⃣ السجل والإحصائيات');
    lines.push('5️⃣ أدوات مساعدة');
  } else {
    lines.push('1️⃣ إنشاء تبليغ جديد');
    lines.push('2️⃣ أدوات مساعدة');
  }
  lines.push('');

  if (isSuper) {
    lines.push('━━━━━━━━━━━━━━━━━━━');
    lines.push('1️⃣ <b>مراجعة التبليغات</b>');
    lines.push('━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('<b>متى؟</b> عندما يصلك إشعار بتبليغ جديد، أو لتفقّد المعلق منها.');
    lines.push('<b>الأمر:</b> <code>/pending</code>');
    lines.push('');
    lines.push('<b>ماذا يحدث؟</b>');
    lines.push('• يظهر كل تبليغ قيد المراجعة مع زرّين:');
    lines.push('   ✅ <b>إرسال</b> — موافقة فورية + إرسال لكل المشتركين');
    lines.push('   ❌ <b>رفض</b> — يطلب منك سبباً (أو <code>-</code> بدون سبب)');
    lines.push('');
    lines.push('💡 <b>نصيحة:</b> إن كانت المرحلة محدّدة في التبليغ، يُرسل لمشتركيها فقط.');
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push(`${isSuper ? '2️⃣' : '1️⃣'} <b>إنشاء تبليغ جديد</b>`);
  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('<b>متى؟</b> لإرسال إعلان لمشتركي مرحلة معينة أو للكل.');
  lines.push('<b>الأمر:</b> <code>/announce</code>');
  lines.push('');
  lines.push('<b>الخطوات:</b>');
  lines.push('1. اكتب <code>/announce</code>');
  lines.push('2. اكتب <b>العنوان</b> (3 إلى 200 حرف)');
  lines.push('3. اكتب <b>النص</b> (5 إلى 2000 حرف)');
  lines.push('4. اختر <b>المرحلة</b> من الأزرار (أو «كل المراحل»)');
  lines.push('5. أرسل <b>رابطاً</b> (اختياري) أو اضغط «تخطّي الرابط»');
  lines.push('');
  if (isSuper) {
    lines.push('✅ يُحفظ التبليغ بحالة «قيد المراجعة»، ثم توافق عليه من <code>/pending</code>.');
  } else {
    lines.push('✅ يُحفظ التبليغ بحالة «قيد المراجعة»، وينتظر موافقة المشرف الأعلى.');
  }
  lines.push('');
  lines.push('💡 لإلغاء أي خطوة في أي وقت: <code>/cancel</code>');
  lines.push('');

  if (isSuper) {
    lines.push('━━━━━━━━━━━━━━━━━━━');
    lines.push('3️⃣ <b>إدارة المشرفين</b>');
    lines.push('━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('<b>📋 عرض القائمة</b>');
    lines.push('<b>الأمر:</b> <code>/admins</code> — يعرض الاسم واليوزر والـChat ID والدور.');
    lines.push('');
    lines.push('<b>➕ إضافة مشرف</b>');
    lines.push('<b>الأمر:</b> <code>/add_admin</code>');
    lines.push('');
    lines.push('• <b>سريع:</b> <code>/add_admin 123456789 admin</code>');
    lines.push('• <b>تفاعلي:</b> اكتب <code>/add_admin</code> ثم اتبع التعليمات');
    lines.push('');
    lines.push('<b>الأدوار الثلاثة:</b>');
    lines.push('');
    lines.push('👑 <b>مشرف أعلى</b> (<code>super_admin</code>)');
    lines.push('   كل الصلاحيات: موافقة، إرسال، إدارة مشرفين، إحصائيات.');
    lines.push('');
    lines.push('🛡 <b>مشرف</b> (<code>admin</code>)');
    lines.push('   إنشاء تبليغات + عرض المعلقة. لا يوافق على الإرسال.');
    lines.push('');
    lines.push('✍️ <b>ناشر</b> (<code>publisher</code>)');
    lines.push('   إنشاء تبليغات فقط. لا يرى المعلقة.');
    lines.push('');
    lines.push('⚠️ <b>شرط مهم:</b> المشرف الجديد يجب أن يبدأ محادثة مع البوت أولاً، وإلا لن تصله الإشعارات.');
    lines.push('');
    lines.push('<b>➖ حذف مشرف</b>');
    lines.push('<b>الأمر:</b> <code>/remove_admin 123456789</code>');
    lines.push('💡 لا يمكنك حذف نفسك.');
    lines.push('');

    lines.push('━━━━━━━━━━━━━━━━━━━');
    lines.push('4️⃣ <b>السجل والإحصائيات</b>');
    lines.push('━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('📜 <code>/history</code> — آخر 10 تبليغات (مُرسلة/مرفوضة/فاشلة)');
    lines.push('📊 <code>/stats</code> — عدد المشتركين + المنتظرة + المُرسلة');
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push(`${isSuper ? '5️⃣' : '2️⃣'} <b>أدوات مساعدة</b>`);
  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('• <code>/cancel</code> — إلغاء أي عملية جارية');
  lines.push('• <code>/help</code> — قائمة الأوامر المختصرة');
  lines.push('• <code>/admin_help</code> — إعادة عرض هذا الدليل');
  lines.push('');

  if (!isSuper) {
    lines.push('━━━━━━━━━━━━━━━━━━━');
    lines.push('ℹ️ <b>ملاحظة</b>');
    lines.push('━━━━━━━━━━━━━━━━━━━');
    lines.push('هذا الدليل يعرض الصلاحيات المتاحة لدورك فقط.');
    lines.push('للحصول على صلاحيات أوسع، تواصل مع المشرف الأعلى.');
    lines.push('');
  }

  await sendMessage(chatId, lines.join('\n'));
}

// ==================== /add_admin ====================
async function handleAddAdminCommand(chatId: number, text: string) {
  const parts = text.split(/\s+/).slice(1);

  if (parts.length >= 2) {
    const targetId = Number(parts[0]);
    const role = parts[1] as AdminRole;
    if (!Number.isFinite(targetId) || !['super_admin', 'admin', 'publisher'].includes(role)) {
      await sendMessage(chatId, '❌ الصيغة: <code>/add_admin CHAT_ID ROLE</code>\nالأدوار: super_admin | admin | publisher');
      return;
    }
    await doAddAdmin(chatId, targetId, role);
    return;
  }

  setFlow(chatId, { type: 'add_admin', step: 'chat_id' });
  await sendMessage(
    chatId,
    '👤 <b>إضافة مشرف جديد</b>\n\nأرسل <b>Chat ID</b> أو <b>@username</b> للمشرف:\n' +
      '<i>المشرف يحتاج يبدأ محادثة مع البوت أول مرة، أو يعرف يوزره.</i>',
    { reply_markup: { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'admin_cancel' }]] } },
  );
}

async function handleAddAdminFlow(
  chatId: number,
  text: string,
  admin: TelegramAdmin,
  flow: { type: 'add_admin'; step: 'chat_id' | 'role'; targetChatId?: number },
) {
  if (flow.step === 'chat_id') {
    const clean = text.trim().replace(/^@/, '');
    let targetId: number | null = null;

    if (/^-?\d+$/.test(clean)) {
      targetId = Number(clean);
    } else {
      const { data } = await getSupabaseAdmin()
        .from('telegram_subscribers')
        .select('chat_id')
        .ilike('username', clean)
        .maybeSingle<{ chat_id: number }>();
      if (data) targetId = data.chat_id;
    }

    if (!targetId) {
      await sendMessage(
        chatId,
        '❌ ما لقيت هذا المستخدم. تأكد من الـChat ID أو أن اليوزر بدأ محادثة مع البوت من قبل.',
      );
      return;
    }

    setFlow(chatId, { type: 'add_admin', step: 'role', targetChatId: targetId });
    await sendMessage(chatId, `👤 تم اختيار: <code>${targetId}</code>\n\nاختر الدور:`, {
      reply_markup: roleKeyboard(),
    });
    return;
  }
}

async function handleRejectFlow(
  chatId: number,
  text: string,
  admin: TelegramAdmin,
  flow: { type: 'reject'; announcementId: string; title: string },
) {
  if (admin.role !== 'super_admin') {
    resetFlow(chatId);
    await sendMessage(chatId, '❌ غير مصرح.');
    return;
  }

  const trimmed = text.trim();
  const note = trimmed === '-' || trimmed === '' ? null : trimmed.slice(0, 500);

  const { error } = await getSupabaseAdmin()
    .from('telegram_announcements')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'super_admin',
      reviewed_note: note,
    })
    .eq('id', flow.announcementId)
    .eq('status', 'pending');

  resetFlow(chatId);

  if (error) {
    console.error('bot reject error:', error.message);
    await sendMessage(chatId, '❌ فشل الرفض. حاول مرة ثانية.');
    return;
  }

  await sendMessage(chatId, '✅ تم رفض التبليغ.');
}

async function doAddAdmin(chatId: number, targetId: number, role: AdminRole) {
  const { data: sub } = await getSupabaseAdmin()
    .from('telegram_subscribers')
    .select('first_name, username')
    .eq('chat_id', targetId)
    .maybeSingle<{ first_name: string | null; username: string | null }>();

  const result = await registerAdmin({
    chatId: targetId,
    username: sub?.username ?? null,
    firstName: sub?.first_name ?? `Admin ${targetId}`,
    role,
    addedBy: chatId,
  });

  if (!result.ok) {
    await sendMessage(chatId, `❌ فشل الإضافة: ${escapeHtml(result.error ?? '')}`);
    return;
  }

  await sendMessage(
    chatId,
    `✅ تم إضافة <code>${targetId}</code> بدور <b>${roleLabel(role)}</b>.`,
  );

  try {
    await sendMessage(
      targetId,
      `🎉 <b>تم تفعيلك في بوت لوازم</b>\n\nالدور: <b>${roleLabel(role)}</b>\n\n` +
        (role === 'super_admin'
          ? 'يمكنك الموافقة على التبليغات وإرسالها عبر <code>/pending</code>.'
          : 'يمكنك إنشاء تبليغات عبر <code>/announce</code>، وسيراجعها المشرف الأعلى.') +
        '\n\n📖 لمزيد من التفاصيل، اكتب <code>/admin_help</code>',
    );
  } catch {
    /* تجاهل */
  }
}

// ==================== /remove_admin ====================
async function handleRemoveAdmin(chatId: number, text: string) {
  const parts = text.split(/\s+/).slice(1);
  if (parts.length === 0 || !/^-?\d+$/.test(parts[0])) {
    await sendMessage(chatId, '❌ الصيغة: <code>/remove_admin CHAT_ID</code>');
    return;
  }
  const targetId = Number(parts[0]);

  if (targetId === chatId) {
    await sendMessage(chatId, '❌ ما تكدر تحذف نفسك.');
    return;
  }

  const result = await deactivateAdmin(targetId);
  if (!result.ok) {
    await sendMessage(chatId, `❌ فشل الحذف: ${escapeHtml(result.error ?? '')}`);
    return;
  }
  await sendMessage(chatId, `✅ تم حذف <code>${targetId}</code>.`);
}

// ==================== /admins ====================
async function handleListAdmins(chatId: number) {
  const admins = await listAdmins();
  if (admins.length === 0) {
    await sendMessage(chatId, 'لا يوجد مشرفون مسجّلون.');
    return;
  }

  const lines: string[] = ['👥 <b>قائمة المشرفين</b>', ''];
  for (const a of admins) {
    lines.push(
      `• <b>${escapeHtml(a.first_name)}</b> ${a.username ? `(@${escapeHtml(a.username)})` : ''}`,
    );
    lines.push(`  <code>${a.chat_id}</code> — ${roleLabel(a.role)}`);
  }
  await sendMessage(chatId, lines.join('\n'));
}

// ==================== /announce Flow ====================
async function handleAnnounceFlow(
  chatId: number,
  text: string,
  admin: TelegramAdmin,
  flow: { type: 'announce'; step: 'title' | 'body' | 'stage' | 'link'; draft: AnnouncementDraft },
) {
  const { step, draft } = flow;
  const trimmed = text.trim();

  if (step === 'title') {
    if (trimmed.length < 3 || trimmed.length > 200) {
      await sendMessage(chatId, '❌ العنوان يجب أن يكون بين 3 و 200 حرف.');
      return;
    }
    const next: AnnouncementDraft = { ...draft, title: trimmed };
    setFlow(chatId, { type: 'announce', step: 'body', draft: next });
    await sendMessage(chatId, '📝 الآن اكتب <b>نص التبليغ</b>:', {
      reply_markup: { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'ann_cancel' }]] },
    });
    return;
  }

  if (step === 'body') {
    if (trimmed.length < 5 || trimmed.length > 2000) {
      await sendMessage(chatId, '❌ النص يجب أن يكون بين 5 و 2000 حرف.');
      return;
    }
    const next: AnnouncementDraft = { ...draft, body: trimmed };
    setFlow(chatId, { type: 'announce', step: 'stage', draft: next });
    await sendMessage(chatId, '🎯 اختر <b>المرحلة</b>:', {
      reply_markup: stageListKeyboard(),
    });
    return;
  }

  if (step === 'stage') {
    await sendMessage(chatId, 'اختر المرحلة من الأزرار أعلاه 👆');
    return;
  }

  if (step === 'link') {
    if (trimmed.toLowerCase() === 'تخطي' || trimmed === '-') {
      await finalizeAnnouncement(chatId, admin, { ...draft, link_url: null, link_label: null });
      return;
    }

    let url: string;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
      url = trimmed;
    } catch {
      await sendMessage(chatId, '❌ رابط غير صالح. أرسل رابطاً يبدأ بـ https:// أو اضغط "تخطّي".');
      return;
    }

    await finalizeAnnouncement(chatId, admin, { ...draft, link_url: url, link_label: null });
    return;
  }
}

async function finalizeAnnouncement(
  chatId: number,
  admin: TelegramAdmin,
  draft: AnnouncementDraft,
) {
  if (!draft.title || !draft.body) {
    resetFlow(chatId);
    await sendMessage(chatId, '❌ بيانات ناقصة. ابدأ من جديد بـ /announce');
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from('telegram_announcements')
    .insert({
      title: draft.title,
      body: draft.body,
      stage: draft.stage,
      link_url: draft.link_url,
      link_label: draft.link_label,
      created_by: admin.first_name,
      status: 'pending',
    })
    .select('id')
    .single<{ id: string }>();

  if (error || !data) {
    resetFlow(chatId);
    await sendMessage(chatId, '❌ فشل إنشاء التبليغ. حاول مرة ثانية.');
    return;
  }

  resetFlow(chatId);
  await sendMessage(
    chatId,
    `✅ <b>تم إرسال التبليغ للمراجعة</b>\n\nرقم: <code>${data.id.slice(0, 8)}</code>\n\n` +
      (admin.role === 'super_admin'
        ? 'يمكنك الموافقة الآن من <code>/pending</code>.'
        : 'سيتم إعلامك عند الموافقة أو الرفض.'),
  );

  const supers = await listSuperAdmins();
  const preview = announcementPreviewText(draft, admin.first_name);
  const kb = announceActionsKeyboard(data.id);

  for (const s of supers) {
    if (s.chat_id === chatId) continue;
    try {
      await sendMessage(s.chat_id, preview, { reply_markup: kb });
    } catch {
      /* تجاهل */
    }
  }
}

// ==================== /pending ====================
async function handlePendingList(chatId: number) {
  const { data } = await getSupabaseAdmin()
    .from('telegram_announcements')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(15);

  const items = (data ?? []) as Array<{
    id: string;
    title: string;
    body: string;
    stage: string | null;
    created_by: string;
  }>;

  if (items.length === 0) {
    await sendMessage(chatId, '✅ لا توجد تبليغات بانتظار المراجعة.');
    return;
  }

  await sendMessage(chatId, `📋 <b>${items.length}</b> تبليغ بانتظار المراجعة:`);

  for (const a of items) {
    const lines: string[] = [];
    lines.push(`📢 <b>${escapeHtml(a.title)}</b>`);
    lines.push(`🎯 ${a.stage ? escapeHtml(a.stage) : 'كل المراحل'} • 👤 ${escapeHtml(a.created_by)}`);
    lines.push('');
    lines.push(escapeHtml(a.body));
    await sendMessage(chatId, lines.join('\n'), {
      reply_markup: pendingItemKeyboard(a.id),
    });
  }
}

// ==================== /history ====================
async function handleHistory(chatId: number) {
  const { data } = await getSupabaseAdmin()
    .from('telegram_announcements')
    .select('id, title, status, sent_count, sent_at, created_at, reviewed_note')
    .in('status', ['sent', 'rejected', 'failed'])
    .order('created_at', { ascending: false })
    .limit(10);

  const items = (data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    sent_count: number;
    sent_at: string | null;
    created_at: string;
    reviewed_note: string | null;
  }>;

  if (items.length === 0) {
    await sendMessage(chatId, 'لا يوجد سجل بعد.');
    return;
  }

  const lines: string[] = ['📜 <b>آخر التبليغات</b>', ''];
  for (const a of items) {
    const emoji =
      a.status === 'sent' ? '✅' : a.status === 'rejected' ? '❌' : '⚠️';
    lines.push(`${emoji} <b>${escapeHtml(a.title)}</b>`);
    if (a.status === 'sent') lines.push(`  أُرسل لـ ${a.sent_count} مشترك`);
    if (a.status === 'rejected' && a.reviewed_note)
      lines.push(`  ${escapeHtml(a.reviewed_note)}`);
    lines.push('');
  }
  await sendMessage(chatId, lines.join('\n'));
}

// ==================== /stats ====================
async function handleStats(chatId: number) {
  const supabaseAdmin = getSupabaseAdmin();

  const [subsCount, pendingCount, sentCount] = await Promise.all([
    supabaseAdmin.from('telegram_subscribers').select('chat_id', { count: 'exact', head: true }),
    supabaseAdmin.from('telegram_announcements').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('telegram_announcements').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
  ]);

  const lines: string[] = [];
  lines.push('📊 <b>إحصائيات البوت</b>');
  lines.push('');
  lines.push(`👥 المشتركون: <b>${subsCount.count ?? 0}</b>`);
  lines.push(`📋 تبليغات منتظرة: <b>${pendingCount.count ?? 0}</b>`);
  lines.push(`📤 تبليغات أُرسلت: <b>${sentCount.count ?? 0}</b>`);

  await sendMessage(chatId, lines.join('\n'));
}

// ==================== /streak ====================
async function sendStreak(chatId: number) {
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

  await sendMessage(chatId, lines.join('\n'));
}

// ==================== /settings ====================
async function sendSettings(chatId: number, messageId?: number) {
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
      [
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
    `👋 <b>تم إلغاء اشتراكك</b>\n\nلن تصلك إشعارات بعد الآن.\nيمكنك العودة في أي وقت بـ /start`,
  );
}

// ==================== /start (مع حفظ الحالة) ====================
async function handleStart(msg: TelegramMessage, baseUrl: string) {
  if (!msg.from) return;
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name ?? '';

  const existing = await getSubscriber(chatId);

  // ✅ إذا كان مسجّلاً بالكامل → لا تطلب منه المرحلة من جديد
  const isFullyOnboarded =
    existing !== null &&
    existing.stage !== null &&
    existing.group_name !== null &&
    existing.onboarding_step === 'idle';

  if (isFullyOnboarded && existing) {
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
    lines.push('اختر ما تريد:');

    await sendMessage(chatId, lines.join('\n'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚙️ الإعدادات', callback_data: 'settings:show' }],
          [{ text: '🔄 تحديث التسجيل', callback_data: 'onboarding:restart' }],
          [{ text: '🌐 افتح المنصة', url: baseUrl }],
        ],
      },
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

// ==================== Callback Handler ====================
async function handleCallback(cb: TelegramCallbackQuery, baseUrl: string) {
  if (!cb.data || !cb.message) return;

  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;

  // ==================== إلغاء wizard ====================
  if (cb.data === 'ann_cancel' || cb.data === 'admin_cancel') {
    resetFlow(chatId);
    await answerCallbackQuery(cb.id, 'تم الإلغاء');
    await editMessageText(chatId, messageId, '❌ تم الإلغاء.', {
      reply_markup: { inline_keyboard: [] },
    });
    return;
  }

  // ==================== اختيار مرحلة (announce) ====================
  if (cb.data.startsWith('ann_stage:')) {
    const admin = await getAdmin(chatId);
    if (!admin) {
      await answerCallbackQuery(cb.id, 'غير مصرح');
      return;
    }
    const session = getSession(chatId);
    if (session.flow.type !== 'announce') {
      await answerCallbackQuery(cb.id, 'انتهت الجلسة، ابدأ /announce');
      return;
    }

    const code = cb.data.slice(10);
    let stage: string | null = null;
    if (code === 'all') {
      stage = null;
    } else {
      stage = STAGE_MAP[code] ?? null;
      if (!stage) {
        await answerCallbackQuery(cb.id, 'مرحلة غير معروفة');
        return;
      }
    }

    const next: AnnouncementDraft = { ...session.flow.draft, stage };
    setFlow(chatId, { type: 'announce', step: 'link', draft: next });

    await answerCallbackQuery(cb.id, stage ?? 'كل المراحل');
    await editMessageText(chatId, messageId, '🔗 أرسل رابطاً (اختياري) أو اضغط "تخطّي":', {
      reply_markup: skipLinkKeyboard(),
    });
    return;
  }

  // ==================== تخطي الرابط ====================
  if (cb.data === 'ann_skip_link') {
    const admin = await getAdmin(chatId);
    if (!admin) {
      await answerCallbackQuery(cb.id, 'غير مصرح');
      return;
    }
    const session = getSession(chatId);
    if (session.flow.type !== 'announce') {
      await answerCallbackQuery(cb.id, 'انتهت الجلسة، ابدأ /announce');
      return;
    }
    await answerCallbackQuery(cb.id);
    await editMessageText(chatId, messageId, '⏳ جاري المعالجة...', {
      reply_markup: { inline_keyboard: [] },
    });
    await finalizeAnnouncement(chatId, admin, session.flow.draft);
    return;
  }

  // ==================== إضافة مشرف: اختيار الدور ====================
  if (cb.data.startsWith('addadmin_role:')) {
    const admin = await getAdmin(chatId);
    if (!admin || admin.role !== 'super_admin') {
      await answerCallbackQuery(cb.id, 'غير مصرح');
      return;
    }
    const session = getSession(chatId);
    if (session.flow.type !== 'add_admin' || session.flow.step !== 'role' || !session.flow.targetChatId) {
      await answerCallbackQuery(cb.id, 'انتهت الجلسة');
      return;
    }
    const role = cb.data.slice(14) as AdminRole;
    if (!['super_admin', 'admin', 'publisher'].includes(role)) {
      await answerCallbackQuery(cb.id, 'دور غير معروف');
      return;
    }

    const targetId = session.flow.targetChatId;
    resetFlow(chatId);

    await answerCallbackQuery(cb.id);
    await editMessageText(chatId, messageId, '⏳ جاري الإضافة...', {
      reply_markup: { inline_keyboard: [] },
    });
    await doAddAdmin(chatId, targetId, role);
    return;
  }

  // ==================== الموافقة على تبليغ ====================
  if (cb.data.startsWith('ann_approve:')) {
    const admin = await getAdmin(chatId);
    if (!admin || admin.role !== 'super_admin') {
      await answerCallbackQuery(cb.id, '❌ غير مصرح — تحتاج صلاحية مشرف أعلى');
      return;
    }

    const id = cb.data.slice(12);
    const supabase = getSupabaseAdmin();

    const { data: existing } = await supabase
      .from('telegram_announcements')
      .select('status')
      .eq('id', id)
      .maybeSingle<{ status: string }>();

    if (!existing) {
      await answerCallbackQuery(cb.id, 'التبليغ غير موجود');
      return;
    }
    if (existing.status !== 'pending') {
      await answerCallbackQuery(cb.id, 'تمت معالجة هذا التبليغ مسبقاً');
      return;
    }

    await answerCallbackQuery(cb.id, '⏳ جاري الإرسال...');

    await supabase
      .from('telegram_announcements')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'super_admin',
      })
      .eq('id', id);

    let result: Awaited<ReturnType<typeof sendAnnouncement>>;
    try {
      result = await sendAnnouncement(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
      await supabase
        .from('telegram_announcements')
        .update({ status: 'failed', sent_error: msg })
        .eq('id', id);
      await sendMessage(chatId, `❌ فشل الإرسال: ${escapeHtml(msg)}`);
      return;
    }

    if (result.error) {
      await supabase
        .from('telegram_announcements')
        .update({
          status: 'failed',
          sent_error: result.error,
          sent_count: result.sent,
        })
        .eq('id', id);
      await sendMessage(chatId, `❌ فشل الإرسال: ${escapeHtml(result.error)}`);
      return;
    }

    await supabase
      .from('telegram_announcements')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: result.sent,
        sent_error: result.failed > 0 ? `فشل ${result.failed}` : null,
      })
      .eq('id', id);

    await editMessageText(chatId, messageId, '✅ تم الإرسال', {
      reply_markup: { inline_keyboard: [] },
    });

    await sendMessage(
      chatId,
      `✅ <b>تم الإرسال</b>\n\n📤 نجح: ${result.sent}\n❌ فشل: ${result.failed}`,
    );
    return;
  }

  // ==================== الرفض ====================
  if (cb.data.startsWith('ann_reject:')) {
    const admin = await getAdmin(chatId);
    if (!admin || admin.role !== 'super_admin') {
      await answerCallbackQuery(cb.id, '❌ غير مصرح');
      return;
    }

    const id = cb.data.slice(11);
    setFlow(chatId, { type: 'reject', announcementId: id, title: '' });
    await answerCallbackQuery(cb.id);
    await sendMessage(
      chatId,
      '📝 اكتب <b>سبب الرفض</b> (أو أرسل <code>-</code> بدون سبب) — أو /cancel للإلغاء:',
    );
    return;
  }

  // ==================== حذف تبليغ ====================
  if (cb.data.startsWith('ann_delete:')) {
    const admin = await getAdmin(chatId);
    if (!admin || admin.role !== 'super_admin') {
      await answerCallbackQuery(cb.id, '❌ غير مصرح');
      return;
    }
    const id = cb.data.slice(11);
    await getSupabaseAdmin().from('telegram_announcements').delete().eq('id', id);
    await answerCallbackQuery(cb.id, 'تم الحذف');
    await editMessageText(chatId, messageId, '🗑 تم حذف التبليغ.', {
      reply_markup: { inline_keyboard: [] },
    });
    return;
  }

  // ==================== Stage (subscriber onboarding) ====================
  if (cb.data.startsWith('stage:')) {
    const code = cb.data.slice(6);
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
      `📚 <b>${escapeHtml(stage)}</b>\n\nالآن اختر كروبك العملي:`,
      { reply_markup: groupKeyboard() },
    );
    return;
  }

  // ==================== Group ====================
  if (cb.data.startsWith('group:')) {
    const code = cb.data.slice(6);
    if (code !== 'A' && code !== 'B') {
      await answerCallbackQuery(cb.id, 'كروب غير معروف');
      return;
    }
    const group = code as Group;

    const before = await getSubscriber(chatId);
    const fromSettings = before?.onboarding_step === 'choosing_group_from_settings';

    if (fromSettings) {
      await upsertSubscriber(cb.from, {
        group_name: group,
        onboarding_step: 'idle',
      });
      await answerCallbackQuery(cb.id, `تم اختيار ${groupLabel(group)}`);
      await sendSettings(chatId, messageId);
    } else {
      await upsertSubscriber(cb.from, {
        group_name: group,
        onboarding_step: 'choosing_subjects',
      });
      await answerCallbackQuery(cb.id, `تم اختيار ${groupLabel(group)}`);
      await sendSubjectsKeyboard(chatId, messageId, before?.stage ?? '');
    }
    return;
  }

  // ==================== Subject toggle ====================
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
    await sendSubjectsKeyboard(chatId, messageId, sub.stage ?? '');
    return;
  }

  // ==================== Subjects done ====================
  if (cb.data === 'subj_done') {
    await upsertSubscriber(cb.from, { onboarding_step: 'idle' });

    const sub = await getSubscriber(chatId);
    const subjectCount = sub?.subjects.length ?? 0;
    const groupLine = sub?.group_name
      ? `${groupEmoji(sub.group_name)} <b>${groupLabel(sub.group_name)}</b>`
      : '⚠️ غير محدد';

    const text = `✅ <b>تم التسجيل!</b>

📌 المرحلة: <b>${escapeHtml(sub?.stage ?? '')}</b>
👥 الكروب: ${groupLine}
📚 المواد: <b>${subjectCount > 0 ? `${subjectCount} مادة` : 'الكل'}</b>

من الآن، سأخبرك بالجديد المناسب لك مباشرة. 🎯

استخدم:
<code>/settings</code> — لتعديل الإشعارات والكروب
<code>/streak</code> — لمتابعة سلسلتك
<code>/help</code> — قائمة الأوامر`;

    await answerCallbackQuery(cb.id, 'تم التسجيل بنجاح!');
    await editMessageText(chatId, messageId, text, {
      reply_markup: {
        inline_keyboard: [[{ text: '🌐 افتح المنصة', url: baseUrl }]],
      },
    });
    return;
  }

  // ==================== Toggle notification ====================
  if (cb.data.startsWith('tog:')) {
    const key = cb.data.slice(4);
    const columnMap: Record<string, keyof Subscriber> = {
      new_note: 'notify_new_note',
      morning: 'notify_morning',
      streak: 'notify_streak',
      weekly: 'notify_weekly',
      trending: 'notify_trending',
      announcements: 'notify_announcements',
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

  // ==================== Settings: show (من زر /start) ====================
  if (cb.data === 'settings:show') {
    await answerCallbackQuery(cb.id);
    await sendSettings(chatId);
    return;
  }

  // ==================== Onboarding: restart ====================
  if (cb.data === 'onboarding:restart') {
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

  // ==================== Settings: change stage ====================
  if (cb.data === 'settings:stage') {
    await upsertSubscriber(cb.from, { onboarding_step: 'choosing_stage' });
    await answerCallbackQuery(cb.id);
    await editMessageText(chatId, messageId, 'اختر مرحلتك:', {
      reply_markup: stageKeyboard(),
    });
    return;
  }

  // ==================== Settings: change group ====================
  if (cb.data === 'settings:group') {
    const sub = await getSubscriber(chatId);
    if (!sub || !sub.stage) {
      await answerCallbackQuery(cb.id, 'حدد المرحلة أولاً');
      return;
    }
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

  // ==================== Settings: change subjects ====================
  if (cb.data === 'settings:subjects') {
    const sub = await getSubscriber(chatId);
    if (!sub || !sub.stage) {
      await answerCallbackQuery(cb.id, 'حدد المرحلة أولاً');
      return;
    }
    await upsertSubscriber(cb.from, { onboarding_step: 'choosing_subjects' });
    await answerCallbackQuery(cb.id);
    await sendSubjectsKeyboard(chatId, messageId, sub.stage);
    return;
  }

  await answerCallbackQuery(cb.id);
}

// ==================== Subjects Keyboard ====================
async function sendSubjectsKeyboard(
  chatId: number,
  messageId: number,
  stage: string,
) {
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