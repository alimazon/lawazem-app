// lib/telegram/handlers/announce.ts
import {
  sendMessage,
  editMessageText,
  answerCallbackQuery,
  escapeHtml,
  STAGE_MAP,
} from '../../telegram';
import {
  setSession,
  clearSession,
  getSession,
  emptyAnnouncementDraft,
  type AnnouncementDraft,
} from '../sessions';
import {
  templatePickerKeyboard,
  draftPreviewKeyboard,
  stageListKeyboard,
  backToDraftKeyboard,
} from './menus';
import { getTemplate } from '../templates';
import { notifySuperAdminsNewAnnouncementPending } from '../notify-admins';
import { getSupabaseAdmin } from '../../supabaseAdmin';
import type { TelegramAdmin } from '../../telegram-admins';

// ==================== Preview Builder ====================
function buildPreview(draft: AnnouncementDraft): string {
  const lines: string[] = [];
  lines.push('📢 <b>معاينة التبليغ</b>');
  lines.push('');
  lines.push(
    `🎯 المرحلة: <b>${
      draft.stage ? escapeHtml(draft.stage) : 'كل المراحل'
    }</b>`,
  );

  if (draft.templateId) {
    const tpl = getTemplate(draft.templateId);
    if (tpl) lines.push(`🏷️ القالب: ${tpl.emoji} ${escapeHtml(tpl.label)}`);
  }
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━');
  if (draft.title) {
    lines.push(`<b>${escapeHtml(draft.title)}</b>`);
  } else {
    lines.push('<i>(لا يوجد عنوان)</i>');
  }
  lines.push('━━━━━━━━━━━━━━━');
  lines.push('');
  if (draft.body) {
    lines.push(escapeHtml(draft.body));
  } else {
    lines.push('<i>(لا يوجد نص)</i>');
  }
  if (draft.link_url) {
    lines.push('');
    lines.push(`🔗 ${escapeHtml(draft.link_label || draft.link_url)}`);
  }
  return lines.join('\n');
}

// ==================== Start ====================
export async function handleAnnounceStart(chatId: number): Promise<void> {
  await clearSession(chatId);
  await sendMessage(
    chatId,
    `📢 <b>تبليغ جديد</b>\n\nاختر قالباً جاهزاً (يمكنك تعديله لاحقاً):`,
    { reply_markup: templatePickerKeyboard() },
  );
}

// ==================== Pick Template ====================
export async function handleTemplatePick(
  cb: {
    id: string;
    from: { id: number };
    message?: { chat: { id: number }; message_id: number };
  },
  templateId: string,
): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  const messageId = cb.message?.message_id ?? 0;
  if (!chatId || !messageId) return;

  const tpl = getTemplate(templateId);
  if (!tpl) {
    await answerCallbackQuery(cb.id, 'قالب غير معروف');
    return;
  }

  const draft: AnnouncementDraft = {
    ...emptyAnnouncementDraft(),
    templateId: tpl.id,
    title: tpl.title,
    body: tpl.body,
    link_label: tpl.linkLabel ?? null,
  };

  await setSession(chatId, 'announce', 'draft', { draft });
  await answerCallbackQuery(cb.id, `تم اختيار ${tpl.label}`);

  await editMessageText(chatId, messageId, buildPreview(draft), {
    reply_markup: draftPreviewKeyboard(),
  });
}

// ==================== Edit Title ====================
export async function handleEditTitleStart(cb: {
  id: string;
  message?: { chat: { id: number }; message_id: number };
}): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  if (!chatId) return;

  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'announce') {
    await answerCallbackQuery(cb.id, 'انتهت الجلسة');
    return;
  }

  const draft = session.flow_data.draft as AnnouncementDraft;
  await setSession(chatId, 'announce', 'edit_title', { draft });

  await answerCallbackQuery(cb.id);
  await sendMessage(
    chatId,
    `✏️ <b>تعديل العنوان</b>\n\nالعنوان الحالي:\n<code>${escapeHtml(
      draft.title ?? '',
    )}</code>\n\nأرسل العنوان الجديد:`,
    { reply_markup: backToDraftKeyboard() },
  );
}

// ==================== Edit Body ====================
export async function handleEditBodyStart(cb: {
  id: string;
  message?: { chat: { id: number }; message_id: number };
}): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  if (!chatId) return;

  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'announce') {
    await answerCallbackQuery(cb.id, 'انتهت الجلسة');
    return;
  }

  const draft = session.flow_data.draft as AnnouncementDraft;
  await setSession(chatId, 'announce', 'edit_body', { draft });

  await answerCallbackQuery(cb.id);
  await sendMessage(
    chatId,
    `✏️ <b>تعديل النص</b>\n\nالنص الحالي:\n\n<i>${escapeHtml(
      draft.body ?? '',
    )}</i>\n\nأرسل النص الجديد:`,
    { reply_markup: backToDraftKeyboard() },
  );
}

// ==================== Add Link ====================
export async function handleAddLinkStart(cb: {
  id: string;
  message?: { chat: { id: number }; message_id: number };
}): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  if (!chatId) return;

  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'announce') {
    await answerCallbackQuery(cb.id, 'انتهت الجلسة');
    return;
  }

  const draft = session.flow_data.draft as AnnouncementDraft;
  await setSession(chatId, 'announce', 'edit_link_url', { draft });

  await answerCallbackQuery(cb.id);
  await sendMessage(
    chatId,
    `🔗 <b>إضافة رابط</b>\n\nأرسل الرابط (يبدأ بـ http أو https):\n\n💡 أو أرسل <code>-</code> لحذف الرابط الحالي.`,
    { reply_markup: backToDraftKeyboard() },
  );
}

// ==================== Choose Stage ====================
export async function handleChooseStageStart(cb: {
  id: string;
  message?: { chat: { id: number }; message_id: number };
}): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  if (!chatId) return;

  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'announce') {
    await answerCallbackQuery(cb.id, 'انتهت الجلسة');
    return;
  }

  await setSession(chatId, 'announce', 'choose_stage', session.flow_data);
  await answerCallbackQuery(cb.id);
  await sendMessage(chatId, '🎯 اختر المرحلة:', {
    reply_markup: stageListKeyboard(),
  });
}

// ==================== Stage Picked ====================
export async function handleStagePick(
  cb: {
    id: string;
    message?: { chat: { id: number }; message_id: number };
  },
  code: string,
): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  const messageId = cb.message?.message_id ?? 0;
  if (!chatId) return;

  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'announce') {
    await answerCallbackQuery(cb.id, 'انتهت الجلسة');
    return;
  }

  const draft = { ...(session.flow_data.draft as AnnouncementDraft) };

  if (code === 'all') {
    draft.stage = null;
  } else {
    const stage = STAGE_MAP[code];
    if (!stage) {
      await answerCallbackQuery(cb.id, 'مرحلة غير معروفة');
      return;
    }
    draft.stage = stage;
  }

  await setSession(chatId, 'announce', 'draft', { draft });

  await answerCallbackQuery(cb.id, draft.stage ?? 'كل المراحل');

  const text = buildPreview(draft);
  if (messageId) {
    await editMessageText(chatId, messageId, text, {
      reply_markup: draftPreviewKeyboard(),
    });
  } else {
    await sendMessage(chatId, text, { reply_markup: draftPreviewKeyboard() });
  }
}

// ==================== Back to Draft ====================
export async function handleBackToDraft(cb: {
  id: string;
  message?: { chat: { id: number }; message_id: number };
}): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  if (!chatId) return;

  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'announce') {
    await answerCallbackQuery(cb.id, 'انتهت الجلسة');
    return;
  }

  const draft = session.flow_data.draft as AnnouncementDraft;
  await setSession(chatId, 'announce', 'draft', { draft });

  await answerCallbackQuery(cb.id);
  await sendMessage(chatId, buildPreview(draft), {
    reply_markup: draftPreviewKeyboard(),
  });
}

// ==================== Text Input Router ====================
export async function handleAnnounceTextInput(
  chatId: number,
  text: string,
  step: string,
): Promise<void> {
  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'announce') {
    await clearSession(chatId);
    return;
  }

  const draft = { ...(session.flow_data.draft as AnnouncementDraft) };
  const trimmed = text.trim();

  if (step === 'edit_title') {
    if (trimmed.length < 3 || trimmed.length > 200) {
      await sendMessage(chatId, '❌ العنوان يجب أن يكون بين 3 و 200 حرف.');
      return;
    }
    draft.title = trimmed;
  } else if (step === 'edit_body') {
    if (trimmed.length < 5 || trimmed.length > 2000) {
      await sendMessage(chatId, '❌ النص يجب أن يكون بين 5 و 2000 حرف.');
      return;
    }
    draft.body = trimmed;
  } else if (step === 'edit_link_url') {
    if (trimmed === '-') {
      draft.link_url = null;
      draft.link_label = null;
    } else {
      try {
        const u = new URL(trimmed);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error();
      } catch {
        await sendMessage(
          chatId,
          '❌ رابط غير صالح. يجب أن يبدأ بـ https://',
        );
        return;
      }
      draft.link_url = trimmed;
    }
  }

  await setSession(chatId, 'announce', 'draft', { draft });
  await sendMessage(chatId, buildPreview(draft), {
    reply_markup: draftPreviewKeyboard(),
  });
}

// ==================== Submit ====================
export async function handleAnnounceSubmit(
  cb: {
    id: string;
    message?: { chat: { id: number }; message_id: number };
  },
  admin: TelegramAdmin,
): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  const messageId = cb.message?.message_id ?? 0;
  if (!chatId) return;

  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'announce') {
    await answerCallbackQuery(cb.id, 'انتهت الجلسة');
    return;
  }

  const draft = session.flow_data.draft as AnnouncementDraft;
  if (!draft.title || !draft.body) {
    await answerCallbackQuery(cb.id, 'العنوان والنص مطلوبان', true);
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

  await clearSession(chatId);

  if (error || !data) {
    await answerCallbackQuery(cb.id, 'فشل الحفظ', true);
    await sendMessage(chatId, '❌ فشل إنشاء التبليغ. حاول مرة ثانية.');
    return;
  }

  await answerCallbackQuery(cb.id, 'تم الإرسال للمراجعة');

  const text = `✅ <b>تم إرسال التبليغ للمراجعة</b>\n\nرقم: <code>${data.id.slice(
    0,
    8,
  )}</code>\n\n${
    admin.role === 'super_admin'
      ? 'يمكنك الموافقة الآن من /pending.'
      : 'سيتم إعلامك عند الموافقة أو الرفض.'
  }`;

  if (messageId) {
    await editMessageText(chatId, messageId, text);
  } else {
    await sendMessage(chatId, text);
  }

  // إشعار السوبر أدمن (fire-and-forget)
  void notifySuperAdminsNewAnnouncementPending({
    id: data.id,
    title: draft.title,
    body: draft.body,
    stage: draft.stage,
    created_by: admin.first_name,
  });
}

// ==================== Cancel ====================
export async function handleAnnounceCancel(chatId: number): Promise<void> {
  await clearSession(chatId);
  await sendMessage(chatId, '❌ تم الإلغاء.');
}