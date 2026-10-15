// lib/telegram/notify-admins.ts
import {
  sendMessage,
  escapeHtml,
  type InlineKeyboardMarkup,
} from '../telegram';
import { listSuperAdmins } from '../telegram-admins';
import type { Subscriber } from './types';
import { groupLabel, groupEmoji } from './subscribers';
import type { Inquiry } from './inquiries';

// ==================== New Inquiry ====================
export async function notifySuperAdminsNewInquiry(
  inq: Inquiry,
): Promise<void> {
  const supers = await listSuperAdmins();
  if (supers.length === 0) return;

  const lines: string[] = [];
  lines.push('📮 <b>استفسار جديد</b>');
  lines.push('');
  lines.push(`👤 ${escapeHtml(inq.student_name ?? 'غير معروف')}`);
  if (inq.stage) lines.push(`📌 ${escapeHtml(inq.stage)}`);
  lines.push('');
  lines.push('❓ <b>السؤال:</b>');
  lines.push(escapeHtml(inq.question));

  const kb: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '💬 رد', callback_data: `inq_reply:${inq.id}` },
        { text: '✅ إغلاق بدون رد', callback_data: `inq_close:${inq.id}` },
      ],
    ],
  };

  const text = lines.join('\n');
  for (const s of supers) {
    try {
      await sendMessage(s.chat_id, text, { reply_markup: kb });
    } catch {
      /* ignore */
    }
  }
}

// ==================== New Subscriber ====================
export async function notifySuperAdminsNewSubscriber(
  sub: Subscriber,
): Promise<void> {
  const supers = await listSuperAdmins();
  if (supers.length === 0) return;

  const subjectCount = sub.subjects.length;
  const groupLine = sub.group_name
    ? `${groupEmoji(sub.group_name)} <b>${groupLabel(sub.group_name)}</b>`
    : '—';

  const lines: string[] = [];
  lines.push('🎉 <b>مشترك جديد</b>');
  lines.push('');
  lines.push(
    `👤 ${escapeHtml(sub.first_name ?? 'غير معروف')}${
      sub.username ? ` (@${escapeHtml(sub.username)})` : ''
    }`,
  );
  lines.push(`📌 ${escapeHtml(sub.stage ?? '—')}`);
  lines.push(`👥 ${groupLine}`);
  lines.push(`📚 ${subjectCount > 0 ? `${subjectCount} مادة` : 'كل المواد'}`);

  const text = lines.join('\n');
  for (const s of supers) {
    try {
      await sendMessage(s.chat_id, text);
    } catch {
      /* ignore */
    }
  }
}

// ==================== New Pending Announcement ====================
export async function notifySuperAdminsNewAnnouncementPending(info: {
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

  const kb: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        { text: '✅ موافقة وإرسال', callback_data: `ann_approve:${info.id}` },
        { text: '❌ رفض', callback_data: `ann_reject:${info.id}` },
      ],
      [{ text: '🗑 حذف', callback_data: `ann_delete:${info.id}` }],
    ],
  };

  const text = lines.join('\n');
  for (const s of supers) {
    try {
      await sendMessage(s.chat_id, text, { reply_markup: kb });
    } catch {
      /* ignore */
    }
  }
}