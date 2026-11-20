// app/api/telegram/webhook/route.ts
import { NextResponse } from 'next/server';
import {
  sendMessage,
  answerCallbackQuery,
  getWebhookSecret,
} from '@/lib/telegram';
import { getAdmin, type AdminRole } from '@/lib/telegram-admins';
import { getSession, clearSession } from '@/lib/telegram/sessions';

// ═══ استيراد أدوات قاعدة البيانات والجلسات ═══
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { createSession } from '@/lib/groups/session';

// ═══ Student handlers ═══
import {
  handleStart,
  handleStageSelection,
  handleGroupSelection,
  handleSubjectToggle,
  handleSubjectsDone,
  handleToggleNotification,
  handleSettingsNavigation,
  handleStop,
  handleStudentMenuButton,
  sendHelp,
  sendStreak,
  sendSettings,
} from '@/lib/telegram/handlers/student';

// ═══ Announce handlers ═══
import {
  handleAnnounceStart,
  handleTemplatePick,
  handleEditTitleStart,
  handleEditBodyStart,
  handleAddLinkStart,
  handleChooseStageStart,
  handleStagePick,
  handleBackToDraft,
  handleAnnounceTextInput,
  handleAnnounceSubmit,
  handleAnnounceCancel,
} from '@/lib/telegram/handlers/announce';

// ═══ Admin handlers ═══
import {
  handlePendingList,
  handleApprove,
  handleRejectStart,
  handleRejectText,
  handleDeleteAnnouncement,
  handleHistory,
  handleStats,
  handleListAdmins,
  handleAddAdminStart,
  handleAddAdminChatId,
  handleAddAdminRole,
  handleRemoveAdmin,
  handleAdminMenuButton,
  quickAddAdmin,
} from '@/lib/telegram/handlers/admin';

// ═══ Inquiry handlers ═══
import {
  handleInquiryStart,
  handleInquiryText,
  handleInquiriesList,
  handleInquiryReplyStart,
  handleInquiryReplyText,
  handleInquiryClose,
  handleInquiryCancel,
} from '@/lib/telegram/handlers/inquiries';

// ═══ Types ═══
import type {
  TelegramUpdate,
  TelegramMessage,
  TelegramCallbackQuery,
} from '@/lib/telegram/types';
import {
  STUDENT_MENU_TEXTS,
  ADMIN_MENU_TEXTS,
} from '@/lib/telegram/types';

// ==================== Constants ====================
const ADMIN_ROLES: readonly AdminRole[] = [
  'super_admin',
  'admin',
  'publisher',
];

function isAdminRole(v: string): v is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(v);
}

// ==================== POST ====================
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

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'https://lawazem.vercel.app';

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

// ==================== Message Handler ====================
async function handleMessage(
  msg: TelegramMessage,
  baseUrl: string,
): Promise<void> {
  if (!msg.text || !msg.from) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const lower = text.toLowerCase();
  const admin = await getAdmin(chatId);

  // ═══════════════════════════════════════════════════
  // 1. الأوامر الأساسية
  // ═══════════════════════════════════════════════════
  if (lower === '/start' || lower.startsWith('/start ')) {
    await handleStart(msg, baseUrl);
    return;
  }

  // ═══════════════════════════════════════════════════
  // 2. جلسة مفتوحة (text input waiting)
  // ═══════════════════════════════════════════════════
  const session = await getSession(chatId);
  if (session && session.flow_type !== 'idle') {
    const handled = await routeSessionText(
      chatId,
      text,
      session.flow_type,
      session.flow_step,
      admin,
    );
    if (handled) return;
    await clearSession(chatId);
  }

  // ═══════════════════════════════════════════════════
  // 3. أوامر مشتركة
  // ═══════════════════════════════════════════════════
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
  if (lower === '/ask' || lower === '/inquiry') {
    await handleInquiryStart(chatId);
    return;
  }
  if (lower === '/stop') {
    await handleStop(chatId);
    return;
  }

  // ═══════════════════════════════════════════════════
  // 4. 🆕 أمر الأدمن السري لتوليد رابط الدخول
  // ═══════════════════════════════════════════════════
  if (admin && lower.startsWith('/recover ')) {
    const cleanUsername = text.slice(9).replace(/^@+/, '').trim();
    
    if (!/^[A-Za-z0-9_]{5,32}$/.test(cleanUsername)) {
      await sendMessage(chatId, '❌ صيغة المعرف غير صحيحة. استخدم: <code>/recover @username</code>');
      return;
    }

    const { data: student } = await supabaseAdmin
      .from('sg_students')
      .select('id, full_name, telegram_username')
      .ilike('telegram_username', cleanUsername)
      .maybeSingle();

    if (!student) {
      await sendMessage(chatId, `❌ لم يتم العثور على طالب بالمعرف: <code>@${cleanUsername}</code>`);
      return;
    }

    const { data: tokenData } = await supabaseAdmin
      .from('sg_access_tokens')
      .select('slug')
      .eq('is_active', true)
      .order('expires_at', { ascending: false, nullsFirst: true })
      .limit(1)
      .maybeSingle();

    const activeSlug = tokenData?.slug || 'students-register';
    const sessionToken = await createSession(student.id);
    const magicLink = `${baseUrl}/auth/magic?token=${sessionToken}&slug=${activeSlug}`;

    await sendMessage(
      chatId,
      `✅ تم توليد رابط الدخول للطالب: <b>${student.full_name}</b> (<code>@${student.telegram_username}</code>).\n\n` +
      `قم بنسخ هذا الرابط وإرساله له:\n\n` +
      `<code>${magicLink}</code>`,
      { disable_web_page_preview: true }
    );
    return;
  }

  // ═══════════════════════════════════════════════════
  // 5. أوامر المشرف الأخرى
  // ═══════════════════════════════════════════════════
  if (admin) {
    if (lower === '/admin_help' || lower === '/guide' || lower === '/help_admin') {
      await handleAdminMenuButton(chatId, ADMIN_MENU_TEXTS.help, admin);
      return;
    }
    if (lower === '/announce') {
      await handleAnnounceStart(chatId);
      return;
    }
    if (lower === '/pending') {
      await handlePendingList(chatId);
      return;
    }

    if (admin.role === 'super_admin') {
      if (lower === '/history') {
        await handleHistory(chatId);
        return;
      }
      if (lower === '/stats') {
        await handleStats(chatId);
        return;
      }
      if (lower === '/inquiries') {
        await handleInquiriesList(chatId);
        return;
      }
      if (lower === '/admins') {
        await handleListAdmins(chatId);
        return;
      }
      if (lower.startsWith('/add_admin ')) {
        const parts = text.split(/\s+/).slice(1);
        if (parts.length < 2) {
          await sendMessage(chatId, '❌ الصيغة: <code>/add_admin CHAT_ID ROLE</code>\n\nأو اكتب <code>/add_admin</code> فقط للطريقة التفاعلية.');
          return;
        }
        const targetId = Number(parts[0]);
        const roleStr = parts[1];
        if (!Number.isFinite(targetId) || !isAdminRole(roleStr)) {
          await sendMessage(chatId, '❌ الصيغة غير صحيحة. الأدوار المتاحة: super_admin | admin | publisher');
          return;
        }
        await quickAddAdmin(chatId, targetId, roleStr);
        return;
      }
      if (lower === '/add_admin') {
        await handleAddAdminStart(chatId);
        return;
      }
      if (lower.startsWith('/remove_admin')) {
        await handleRemoveAdmin(chatId, text);
        return;
      }
    }

    if (lower === '/cancel') {
      await clearSession(chatId);
      await sendMessage(chatId, '✅ تم الإلغاء.');
      return;
    }

    if (Object.values(ADMIN_MENU_TEXTS).includes(text as never)) {
      const handled = await handleAdminMenuButton(chatId, text, admin);
      if (handled) return;
    }
  }

  // ═══════════════════════════════════════════════════
  // 6. زر "📮 استفسار" وباقي أزرار الطالب
  // ═══════════════════════════════════════════════════
  if (text === STUDENT_MENU_TEXTS.inquiry) {
    await handleInquiryStart(chatId);
    return;
  }

  const studentHandled = await handleStudentMenuButton(chatId, text, baseUrl);
  if (studentHandled) return;

  // ═══════════════════════════════════════════════════
  // 7. Fallback (لا نعطي أي تلميح عن الاستعادة للطلاب)
  // ═══════════════════════════════════════════════════
  await sendMessage(
    chatId,
    `🤔 لم أفهم هذا الأمر.\n\nاكتب /help للقائمة، أو /start للتسجيل.`,
  );
}

// ==================== Session Text Router ====================
async function routeSessionText(
  chatId: number,
  text: string,
  flowType: string,
  flowStep: string | null,
  admin: Awaited<ReturnType<typeof getAdmin>>,
): Promise<boolean> {
  if (flowType === 'announce') {
    if (flowStep === 'edit_title' || flowStep === 'edit_body' || flowStep === 'edit_link_url') {
      await handleAnnounceTextInput(chatId, text, flowStep);
      return true;
    }
    return false;
  }
  if (flowType === 'reject') {
    if (!admin) return false;
    await handleRejectText(chatId, text, admin);
    return true;
  }
  if (flowType === 'add_admin') {
    if (!admin || admin.role !== 'super_admin') return false;
    if (flowStep === 'awaiting_chat_id') {
      await handleAddAdminChatId(chatId, text);
      return true;
    }
    return false;
  }
  if (flowType === 'inquiry') {
    if (flowStep === 'awaiting_question') {
      await handleInquiryText(chatId, text);
      return true;
    }
    if (flowStep === 'awaiting_reply') {
      if (!admin) return false;
      await handleInquiryReplyText(chatId, text, chatId);
      return true;
    }
    return false;
  }
  return false;
}

// ==================== Callback Handler ====================
async function handleCallback(
  cb: TelegramCallbackQuery,
  baseUrl: string,
): Promise<void> {
  if (!cb.data || !cb.message) return;

  const chatId = cb.message.chat.id;
  const data = cb.data;
  const admin = await getAdmin(chatId);

  if (data === 'ann_cancel' || data === 'admin_cancel' || data === 'inq_cancel') {
    await clearSession(chatId);
    if (data === 'inq_cancel') {
      await handleInquiryCancel(chatId);
    } else {
      await handleAnnounceCancel(chatId);
    }
    await answerCallbackQuery(cb.id);
    return;
  }

  if (data.startsWith('stage:')) {
    await handleStageSelection(cb, data.slice(6));
    return;
  }
  if (data.startsWith('group:')) {
    await handleGroupSelection(cb, data.slice(6), baseUrl);
    return;
  }
  if (data.startsWith('subj:')) {
    await handleSubjectToggle(cb, data.slice(5));
    return;
  }
  if (data === 'subj_done') {
    await handleSubjectsDone(cb, baseUrl);
    return;
  }
  if (data.startsWith('tog:')) {
    await handleToggleNotification(cb, data.slice(4));
    return;
  }
  if (data.startsWith('settings:')) {
    await handleSettingsNavigation(cb, data.slice(9));
    return;
  }
  if (data === 'onboarding:restart') {
    await handleSettingsNavigation(cb, 'restart');
    return;
  }
  if (data.startsWith('tpl_pick:')) {
    await handleTemplatePick(cb, data.slice(9));
    return;
  }
  if (data === 'ann_edit_title') {
    await handleEditTitleStart(cb);
    return;
  }
  if (data === 'ann_edit_body') {
    await handleEditBodyStart(cb);
    return;
  }
  if (data === 'ann_add_link') {
    await handleAddLinkStart(cb);
    return;
  }
  if (data === 'ann_choose_stage') {
    await handleChooseStageStart(cb);
    return;
  }
  if (data === 'ann_back_to_draft') {
    await handleBackToDraft(cb);
    return;
  }
  if (data.startsWith('ann_stage:')) {
    await handleStagePick(cb, data.slice(10));
    return;
  }
  if (data === 'ann_submit') {
    if (!admin) {
      await answerCallbackQuery(cb.id, '❌ غير مصرح');
      return;
    }
    await handleAnnounceSubmit(cb, admin);
    return;
  }
  if (data.startsWith('ann_approve:')) {
    if (!admin) {
      await answerCallbackQuery(cb.id, '❌ غير مصرح');
      return;
    }
    await handleApprove(cb, data.slice(12), admin);
    return;
  }
  if (data.startsWith('ann_reject:')) {
    if (!admin) {
      await answerCallbackQuery(cb.id, '❌ غير مصرح');
      return;
    }
    await handleRejectStart(cb, data.slice(11), admin);
    return;
  }
  if (data.startsWith('ann_delete:')) {
    if (!admin) {
      await answerCallbackQuery(cb.id, '❌ غير مصرح');
      return;
    }
    await handleDeleteAnnouncement(cb, data.slice(11), admin);
    return;
  }
  if (data.startsWith('addadmin_role:')) {
    if (!admin || admin.role !== 'super_admin') {
      await answerCallbackQuery(cb.id, '❌ غير مصرح');
      return;
    }
    const roleStr = data.slice(14);
    if (!isAdminRole(roleStr)) {
      await answerCallbackQuery(cb.id, 'دور غير معروف');
      return;
    }
    await handleAddAdminRole(cb, roleStr);
    return;
  }
  if (data.startsWith('inq_reply:')) {
    if (!admin) {
      await answerCallbackQuery(cb.id, '❌ غير مصرح');
      return;
    }
    await handleInquiryReplyStart(cb, data.slice(10));
    return;
  }
  if (data.startsWith('inq_close:')) {
    if (!admin) {
      await answerCallbackQuery(cb.id, '❌ غير مصرح');
      return;
    }
    await handleInquiryClose(cb, data.slice(10));
    return;
  }

  await answerCallbackQuery(cb.id);
}