// lib/telegram/handlers/admin.ts
import {
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  escapeHtml,
} from '../../telegram';
import { getSupabaseAdmin } from '../../supabaseAdmin';
import {
  listAdmins,
  registerAdmin,
  deactivateAdmin,
  roleLabel,
  type TelegramAdmin,
  type AdminRole,
} from '../../telegram-admins';
import { sendAnnouncement } from '../../telegram-notifications';
import { setSession, clearSession, getSession } from '../sessions';
import {
  pendingItemKeyboard,
  roleKeyboard,
  SUPER_ADMIN_MENU,
  ADMIN_MENU,
} from './menus';
import { ADMIN_MENU_TEXTS } from '../types';
import { countPendingInquiries } from '../inquiries';

// ==================== Admin Help ====================
export async function sendAdminHelp(
  chatId: number,
  admin: TelegramAdmin,
): Promise<void> {
  const isSuper = admin.role === 'super_admin';
  const lines: string[] = [];

  lines.push(`📖 <b>دليل ${isSuper ? 'المشرف الأعلى' : 'المشرف'}</b>`);
  lines.push('');
  lines.push(`👤 دورك: <b>${roleLabel(admin.role)}</b>`);
  lines.push('');
  lines.push('👇 استخدم الأزرار الثابتة بالأسفل، أو الأوامر النصية.');
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push('🗺️ <b>الأوامر المتاحة</b>');
  lines.push('━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('📢 <code>/announce</code> — إنشاء تبليغ بقوالب جاهزة');

  if (isSuper) {
    lines.push('📋 <code>/pending</code> — التبليغات قيد المراجعة');
    lines.push('📜 <code>/history</code> — آخر التبليغات');
    lines.push('📊 <code>/stats</code> — إحصائيات البوت');
    lines.push('📮 <code>/inquiries</code> — الاستفسارات');
    lines.push('👥 <code>/admins</code> — قائمة المشرفين');
    lines.push('➕ <code>/add_admin</code> — إضافة مشرف');
    lines.push('➖ <code>/remove_admin</code> — حذف مشرف');
  } else {
    lines.push('📋 <code>/pending</code> — عرض المعلقة (بدون موافقة)');
  }

  lines.push('❌ <code>/cancel</code> — إلغاء أي عملية');
  lines.push('📖 <code>/admin_help</code> — هذا الدليل');

  await sendMessage(chatId, lines.join('\n'), {
    reply_markup: isSuper ? SUPER_ADMIN_MENU : ADMIN_MENU,
  });
}

// ==================== Pending List ====================
export async function handlePendingList(chatId: number): Promise<void> {
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
    lines.push(
      `🎯 ${
        a.stage ? escapeHtml(a.stage) : 'كل المراحل'
      } • 👤 ${escapeHtml(a.created_by)}`,
    );
    lines.push('');
    lines.push(escapeHtml(a.body));
    await sendMessage(chatId, lines.join('\n'), {
      reply_markup: pendingItemKeyboard(a.id),
    });
  }
}

// ==================== Approve ====================
export async function handleApprove(
  cb: {
    id: string;
    from: { id: number };
    message?: { chat: { id: number }; message_id: number };
  },
  id: string,
  admin: TelegramAdmin,
): Promise<void> {
  if (admin.role !== 'super_admin') {
    await answerCallbackQuery(cb.id, '❌ غير مصرح — تحتاج صلاحية مشرف أعلى');
    return;
  }

  const chatId = cb.message?.chat.id ?? 0;
  const messageId = cb.message?.message_id ?? 0;
  if (!chatId) return;

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

  if (messageId) {
    await editMessageText(chatId, messageId, '✅ تم الإرسال', {
      reply_markup: { inline_keyboard: [] },
    });
  }

  await sendMessage(
    chatId,
    `✅ <b>تم الإرسال</b>\n\n📤 نجح: ${result.sent}\n❌ فشل: ${result.failed}`,
  );
}

// ==================== Reject ====================
export async function handleRejectStart(
  cb: {
    id: string;
    message?: { chat: { id: number }; message_id: number };
  },
  id: string,
  admin: TelegramAdmin,
): Promise<void> {
  if (admin.role !== 'super_admin') {
    await answerCallbackQuery(cb.id, '❌ غير مصرح');
    return;
  }

  const chatId = cb.message?.chat.id ?? 0;
  if (!chatId) return;

  await setSession(chatId, 'reject', 'awaiting_reason', {
    announcement_id: id,
  });

  await answerCallbackQuery(cb.id);
  await sendMessage(
    chatId,
    '📝 اكتب <b>سبب الرفض</b> (أو أرسل <code>-</code> بدون سبب) — أو /cancel للإلغاء:',
  );
}

export async function handleRejectText(
  chatId: number,
  text: string,
  admin: TelegramAdmin,
): Promise<void> {
  if (admin.role !== 'super_admin') {
    await clearSession(chatId);
    return;
  }

  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'reject') {
    await clearSession(chatId);
    return;
  }

  const id = session.flow_data.announcement_id as string | undefined;
  if (!id) {
    await clearSession(chatId);
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
    .eq('id', id)
    .eq('status', 'pending');

  await clearSession(chatId);

  if (error) {
    await sendMessage(chatId, '❌ فشل الرفض. حاول مرة ثانية.');
    return;
  }

  await sendMessage(chatId, '✅ تم رفض التبليغ.');
}

// ==================== Delete ====================
export async function handleDeleteAnnouncement(
  cb: {
    id: string;
    message?: { chat: { id: number }; message_id: number };
  },
  id: string,
  admin: TelegramAdmin,
): Promise<void> {
  if (admin.role !== 'super_admin') {
    await answerCallbackQuery(cb.id, '❌ غير مصرح');
    return;
  }

  const chatId = cb.message?.chat.id ?? 0;
  const messageId = cb.message?.message_id ?? 0;
  if (!chatId) return;

  await getSupabaseAdmin().from('telegram_announcements').delete().eq('id', id);
  await answerCallbackQuery(cb.id, 'تم الحذف');
  if (messageId) {
    await editMessageText(chatId, messageId, '🗑 تم حذف التبليغ.', {
      reply_markup: { inline_keyboard: [] },
    });
  } else {
    await sendMessage(chatId, '🗑 تم حذف التبليغ.');
  }
}

// ==================== History ====================
export async function handleHistory(chatId: number): Promise<void> {
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

// ==================== Stats ====================
export async function handleStats(chatId: number): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const [
    subsCount,
    pendingAnnCount,
    sentAnnCount,
    pendingInqCount,
    adminsCount,
  ] = await Promise.all([
    supabaseAdmin
      .from('telegram_subscribers')
      .select('chat_id', { count: 'exact', head: true }),
    supabaseAdmin
      .from('telegram_announcements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabaseAdmin
      .from('telegram_announcements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent'),
    countPendingInquiries(),
    supabaseAdmin
      .from('telegram_admins')
      .select('chat_id', { count: 'exact', head: true })
      .eq('is_active', true),
  ]);

  const lines: string[] = [];
  lines.push('📊 <b>إحصائيات البوت</b>');
  lines.push('');
  lines.push(`👥 المشتركون: <b>${subsCount.count ?? 0}</b>`);
  lines.push(`👤 المشرفون النشطون: <b>${adminsCount.count ?? 0}</b>`);
  lines.push('');
  lines.push(`📋 تبليغات منتظرة: <b>${pendingAnnCount.count ?? 0}</b>`);
  lines.push(`📤 تبليغات أُرسلت: <b>${sentAnnCount.count ?? 0}</b>`);
  lines.push(`📮 استفسارات منتظرة: <b>${pendingInqCount}</b>`);

  await sendMessage(chatId, lines.join('\n'));
}

// ==================== List Admins ====================
export async function handleListAdmins(chatId: number): Promise<void> {
  const admins = await listAdmins();
  if (admins.length === 0) {
    await sendMessage(chatId, 'لا يوجد مشرفون مسجّلون.');
    return;
  }

  const lines: string[] = ['👥 <b>قائمة المشرفين</b>', ''];
  for (const a of admins) {
    lines.push(
      `• <b>${escapeHtml(a.first_name)}</b> ${
        a.username ? `(@${escapeHtml(a.username)})` : ''
      }`,
    );
    lines.push(`  <code>${a.chat_id}</code> — ${roleLabel(a.role)}`);
  }
  await sendMessage(chatId, lines.join('\n'));
}

// ==================== Add Admin ====================
export async function handleAddAdminStart(chatId: number): Promise<void> {
  await setSession(chatId, 'add_admin', 'awaiting_chat_id', {});
  await sendMessage(
    chatId,
    '👤 <b>إضافة مشرف جديد</b>\n\nأرسل <b>Chat ID</b> أو <b>@username</b> للمشرف:\n' +
      '<i>يجب أن يبدأ محادثة مع البوت أول مرة.</i>',
    {
      reply_markup: {
        inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'admin_cancel' }]],
      },
    },
  );
}

export async function handleAddAdminChatId(
  chatId: number,
  text: string,
): Promise<void> {
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
      '❌ ما لقيت هذا المستخدم. تأكد من الـChat ID أو أن اليوزر بدأ محادثة مع البوت.',
    );
    return;
  }

  await setSession(chatId, 'add_admin', 'awaiting_role', {
    target_chat_id: targetId,
  });

  await sendMessage(
    chatId,
    `👤 تم اختيار: <code>${targetId}</code>\n\nاختر الدور:`,
    { reply_markup: roleKeyboard() },
  );
}

export async function handleAddAdminRole(
  cb: {
    id: string;
    message?: { chat: { id: number }; message_id: number };
  },
  role: AdminRole,
): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  const messageId = cb.message?.message_id ?? 0;
  if (!chatId) return;

  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'add_admin') {
    await answerCallbackQuery(cb.id, 'انتهت الجلسة');
    return;
  }

  const targetId = session.flow_data.target_chat_id as number | undefined;
  if (!targetId) {
    await answerCallbackQuery(cb.id, 'لا يوجد هدف');
    return;
  }

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

  await clearSession(chatId);

  if (!result.ok) {
    await answerCallbackQuery(cb.id, `فشل: ${result.error ?? ''}`, true);
    return;
  }

  await answerCallbackQuery(cb.id, 'تمت الإضافة');

  const confirm = `✅ تم إضافة <code>${targetId}</code> بدور <b>${roleLabel(
    role,
  )}</b>.`;
  if (messageId) {
    await editMessageText(chatId, messageId, confirm);
  } else {
    await sendMessage(chatId, confirm);
  }

  try {
    await sendMessage(
      targetId,
      `🎉 <b>تم تفعيلك في بوت لوازم</b>\n\nالدور: <b>${roleLabel(role)}</b>\n\n` +
        (role === 'super_admin'
          ? 'يمكنك الموافقة على التبليغات وإرسالها عبر /pending.'
          : role === 'admin'
            ? 'يمكنك إنشاء تبليغات عبر /announce، وسيراجعها المشرف الأعلى.'
            : 'يمكنك إنشاء تبليغات عبر /announce.') +
        '\n\n📖 اكتب /admin_help للمزيد',
      { reply_markup: role === 'super_admin' ? SUPER_ADMIN_MENU : ADMIN_MENU },
    );
  } catch {
    /* ignore */
  }
}

// ==================== Remove Admin ====================
export async function handleRemoveAdmin(
  chatId: number,
  text: string,
): Promise<void> {
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
    await sendMessage(
      chatId,
      `❌ فشل الحذف: ${escapeHtml(result.error ?? '')}`,
    );
    return;
  }
  await sendMessage(chatId, `✅ تم حذف <code>${targetId}</code>.`);
}

// ==================== Quick Add Admin ====================
export async function quickAddAdmin(
  chatId: number,
  targetId: number,
  role: AdminRole,
): Promise<void> {
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
    await sendMessage(
      chatId,
      `❌ فشل الإضافة: ${escapeHtml(result.error ?? '')}`,
    );
    return;
  }

  await sendMessage(
    chatId,
    `✅ تم إضافة <code>${targetId}</code> بدور <b>${roleLabel(role)}</b>.`,
  );

  try {
    await sendMessage(
      targetId,
      `🎉 <b>تم تفعيلك في بوت لوازم</b>\n\nالدور: <b>${roleLabel(role)}</b>\n\n📖 اكتب /admin_help للمزيد`,
      { reply_markup: role === 'super_admin' ? SUPER_ADMIN_MENU : ADMIN_MENU },
    );
  } catch {
    /* ignore */
  }
}

// ==================== Menu Button Router ====================
export async function handleAdminMenuButton(
  chatId: number,
  text: string,
  admin: TelegramAdmin,
): Promise<boolean> {
  const isSuper = admin.role === 'super_admin';

  if (text === ADMIN_MENU_TEXTS.newAnnounce) {
    const { handleAnnounceStart } = await import('./announce');
    await handleAnnounceStart(chatId);
    return true;
  }

  if (text === ADMIN_MENU_TEXTS.pending) {
    await handlePendingList(chatId);
    return true;
  }

  if (text === ADMIN_MENU_TEXTS.inquiries && isSuper) {
    const { handleInquiriesList } = await import('./inquiries');
    await handleInquiriesList(chatId);
    return true;
  }

  if (text === ADMIN_MENU_TEXTS.admins && isSuper) {
    await handleListAdmins(chatId);
    return true;
  }

  if (text === ADMIN_MENU_TEXTS.stats && isSuper) {
    await handleStats(chatId);
    return true;
  }

  if (text === ADMIN_MENU_TEXTS.help) {
    await sendAdminHelp(chatId, admin);
    return true;
  }

  return false;
}