// lib/telegram/handlers/inquiries.ts
import {
  sendMessage,
  answerCallbackQuery,
  escapeHtml,
} from '../../telegram';
import { getSubscriber } from '../subscribers';
import {
  createInquiry,
  listPendingInquiries,
  countPendingInquiries,
  getInquiry,
  answerInquiry,
  closeInquiry,
  formatInquiryForAdmin,
} from '../inquiries';
import { setSession, clearSession, getSession } from '../sessions';
import { notifySuperAdminsNewInquiry } from '../notify-admins';
import { inquiryActionsKeyboard, STUDENT_MENU } from './menus';

// ==================== Student: Start ====================
export async function handleInquiryStart(chatId: number): Promise<void> {
  const sub = await getSubscriber(chatId);
  if (!sub || !sub.stage) {
    await sendMessage(chatId, 'يجب أن تكمل التسجيل أولاً.\nاكتب /start');
    return;
  }

  await setSession(chatId, 'inquiry', 'awaiting_question', {});
  await sendMessage(
    chatId,
    `📮 <b>استفسار جديد</b>\n\n✍️ اكتب سؤالك أو استفسارك في رسالة واحدة، وسيصل للإدارة مباشرة.`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'inq_cancel' }]],
      },
    },
  );
}

// ==================== Student: Submit ====================
export async function handleInquiryText(
  chatId: number,
  text: string,
): Promise<void> {
  const sub = await getSubscriber(chatId);

  const result = await createInquiry({
    chatId,
    studentName: sub?.first_name ?? null,
    stage: sub?.stage ?? null,
    question: text,
  });

  await clearSession(chatId);

  if (!result.ok) {
    await sendMessage(chatId, `❌ فشل الإرسال: ${result.error}`, {
      reply_markup: STUDENT_MENU,
    });
    return;
  }

  await sendMessage(
    chatId,
    `✅ <b>وصلنا استفسارك</b>\n\nسيتم الرد عليك في أقرب وقت. شكراً لك 🌟`,
    { reply_markup: STUDENT_MENU },
  );

  // إشعار السوبر أدمن (fire-and-forget)
  void notifySuperAdminsNewInquiry(result.inquiry);
}

// ==================== Admin: List Pending ====================
export async function handleInquiriesList(chatId: number): Promise<void> {
  const pending = await listPendingInquiries(10);

  if (pending.length === 0) {
    await sendMessage(chatId, '✅ لا توجد استفسارات بانتظار الرد.');
    return;
  }

  await sendMessage(
    chatId,
    `📮 <b>${pending.length}</b> استفسار بانتظار الرد:`,
  );

  for (const inq of pending) {
    const text = formatInquiryForAdmin(inq, escapeHtml);
    await sendMessage(chatId, text, {
      reply_markup: inquiryActionsKeyboard(inq.id),
    });
  }
}

// ==================== Admin: Start Reply ====================
export async function handleInquiryReplyStart(
  cb: {
    id: string;
    message?: { chat: { id: number }; message_id: number };
  },
  inquiryId: string,
): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  if (!chatId) return;

  const inq = await getInquiry(inquiryId);
  if (!inq || inq.status !== 'pending') {
    await answerCallbackQuery(cb.id, 'الاستفسار غير موجود أو تمت معالجته');
    return;
  }

  await setSession(chatId, 'inquiry', 'awaiting_reply', {
    inquiry_id: inquiryId,
  });

  await answerCallbackQuery(cb.id);
  await sendMessage(
    chatId,
    `💬 <b>الرد على استفسار</b>\n\n👤 ${escapeHtml(
      inq.student_name ?? 'غير معروف',
    )}\n\n❓ ${escapeHtml(inq.question)}\n\n✍️ اكتب ردك الآن:`,
    {
      reply_markup: {
        inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'inq_cancel' }]],
      },
    },
  );
}

// ==================== Admin: Submit Reply ====================
export async function handleInquiryReplyText(
  chatId: number,
  text: string,
  adminChatId: number,
): Promise<void> {
  const session = await getSession(chatId);
  if (!session || session.flow_type !== 'inquiry') {
    await clearSession(chatId);
    return;
  }

  const inquiryId = session.flow_data.inquiry_id as string | undefined;
  if (!inquiryId) {
    await clearSession(chatId);
    await sendMessage(
      chatId,
      '❌ لم أجد الاستفسار، حاول مرة ثانية من القائمة.',
    );
    return;
  }

  const result = await answerInquiry({
    id: inquiryId,
    reply: text,
    adminChatId,
  });

  await clearSession(chatId);

  if (!result.ok || !result.inquiry) {
    await sendMessage(
      chatId,
      `❌ فشل الحفظ: ${result.error ?? 'غير معروف'}`,
    );
    return;
  }

  const inq = result.inquiry;

  // إرسال الرد للطالب
  const studentLines: string[] = [];
  studentLines.push('📬 <b>ردّ الإدارة على استفسارك</b>');
  studentLines.push('');
  studentLines.push('❓ <b>سؤالك:</b>');
  studentLines.push(escapeHtml(inq.question));
  studentLines.push('');
  studentLines.push('💬 <b>الرد:</b>');
  studentLines.push(escapeHtml(text));

  try {
    await sendMessage(inq.chat_id, studentLines.join('\n'), {
      reply_markup: STUDENT_MENU,
    });
  } catch {
    await sendMessage(
      chatId,
      '⚠️ تم الحفظ لكن تعذّر إرسال الرد للطالب.',
    );
    return;
  }

  await sendMessage(chatId, '✅ تم إرسال الرد للطالب.');
}

// ==================== Admin: Close ====================
export async function handleInquiryClose(
  cb: {
    id: string;
    message?: { chat: { id: number }; message_id: number };
  },
  inquiryId: string,
): Promise<void> {
  const chatId = cb.message?.chat.id ?? 0;
  if (!chatId) return;

  const result = await closeInquiry(inquiryId);
  await answerCallbackQuery(
    cb.id,
    result.ok ? 'تم الإغلاق' : result.error ?? 'فشل',
  );

  if (result.ok && result.inquiry) {
    // إشعار الطالب بأن استفساره تم الاطلاع عليه
    try {
      await sendMessage(
        result.inquiry.chat_id,
        `📭 تم الاطلاع على استفسارك وإغلاقه. إن كان لديك سؤال آخر، أرسل استفساراً جديداً.`,
        { reply_markup: STUDENT_MENU },
      );
    } catch {
      /* ignore */
    }

    await sendMessage(chatId, '✅ تم إغلاق الاستفسار.');
  }
}

// ==================== Cancel ====================
export async function handleInquiryCancel(chatId: number): Promise<void> {
  await clearSession(chatId);
  await sendMessage(chatId, '❌ تم الإلغاء.', {
    reply_markup: STUDENT_MENU,
  });
}

// ==================== Count ====================
export async function getPendingInquiriesCount(): Promise<number> {
  return countPendingInquiries();
}