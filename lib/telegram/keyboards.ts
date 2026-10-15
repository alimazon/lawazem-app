// lib/telegram/keyboards.ts
import type { InlineKeyboardButton, InlineKeyboardMarkup } from '../telegram';
import type { ReplyKeyboardMarkup } from './types';
import { ANNOUNCEMENT_TEMPLATES } from './templates';
import { STAGES } from '../constants';

// ==================== Reply Keyboards (ثابتة أسفل الشاشة) ====================
export const STUDENT_MENU: ReplyKeyboardMarkup = {
  keyboard: [
    [{ text: '📚 الملازم' }, { text: '🔍 القاموس' }],
    [{ text: '📮 استفسار' }, { text: '🔥 سلسلتي' }],
    [{ text: '⚙️ الإعدادات' }, { text: '❓ مساعدة' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

export const SUPER_ADMIN_MENU: ReplyKeyboardMarkup = {
  keyboard: [
    [{ text: '📢 تبليغ جديد' }, { text: '📋 المراجعة' }],
    [{ text: '📮 الاستفسارات' }, { text: '👥 المشرفون' }],
    [{ text: '📊 الإحصائيات' }, { text: '📖 دليل المشرف' }],
    [{ text: '📚 الملازم' }, { text: '⚙️ الإعدادات' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

export const ADMIN_MENU: ReplyKeyboardMarkup = {
  keyboard: [
    [{ text: '📢 تبليغ جديد' }],
    [{ text: '📚 الملازم' }, { text: '⚙️ الإعدادات' }],
    [{ text: '📖 دليل المشرف' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

export function removeReplyKeyboard(): ReplyKeyboardMarkup {
  return { remove_keyboard: true };
}

// ==================== Template Picker ====================
export function templatePickerKeyboard(): InlineKeyboardMarkup {
  const rows: InlineKeyboardButton[][] = [];
  const templates = ANNOUNCEMENT_TEMPLATES;

  // صفين في كل صف
  for (let i = 0; i < templates.length; i += 2) {
    const row: InlineKeyboardButton[] = [
      {
        text: `${templates[i].emoji} ${templates[i].label}`,
        callback_data: `tpl_pick:${templates[i].id}`,
      },
    ];
    if (templates[i + 1]) {
      row.push({
        text: `${templates[i + 1].emoji} ${templates[i + 1].label}`,
        callback_data: `tpl_pick:${templates[i + 1].id}`,
      });
    }
    rows.push(row);
  }

  rows.push([{ text: '❌ إلغاء', callback_data: 'ann_cancel' }]);
  return { inline_keyboard: rows };
}

// ==================== Draft Preview Actions ====================
export function draftPreviewKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✏️ تعديل العنوان', callback_data: 'ann_edit_title' },
        { text: '✏️ تعديل النص', callback_data: 'ann_edit_body' },
      ],
      [
        { text: '🎯 اختيار المرحلة', callback_data: 'ann_choose_stage' },
        { text: '🔗 إضافة رابط', callback_data: 'ann_add_link' },
      ],
      [
        { text: '👀 معاينة', callback_data: 'ann_preview' },
        { text: '✅ إرسال للمراجعة', callback_data: 'ann_submit' },
      ],
      [{ text: '❌ إلغاء', callback_data: 'ann_cancel' }],
    ],
  };
}

// ==================== Stage Picker (announce) ====================
export function stageListKeyboard(): InlineKeyboardMarkup {
  const rows: InlineKeyboardButton[][] = STAGES.map((s, i) => [
    { text: s, callback_data: `ann_stage:${i + 1}` },
  ]);
  rows.push([{ text: '🌐 كل المراحل', callback_data: 'ann_stage:all' }]);
  rows.push([{ text: '↩️ رجوع', callback_data: 'ann_back_to_draft' }]);
  return { inline_keyboard: rows };
}

// ==================== Announcement Approval ====================
export function announceApprovalKeyboard(id: string): InlineKeyboardMarkup {
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

export function pendingItemKeyboard(id: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ إرسال', callback_data: `ann_approve:${id}` },
        { text: '❌ رفض', callback_data: `ann_reject:${id}` },
      ],
    ],
  };
}

// ==================== Add Admin ====================
export function roleKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '👑 مشرف أعلى', callback_data: 'addadmin_role:super_admin' }],
      [{ text: '🛡 مشرف', callback_data: 'addadmin_role:admin' }],
      [{ text: '✍️ ناشر', callback_data: 'addadmin_role:publisher' }],
      [{ text: '❌ إلغاء', callback_data: 'admin_cancel' }],
    ],
  };
}

// ==================== Inquiry Actions ====================
export function inquiryActionsKeyboard(id: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '💬 رد', callback_data: `inq_reply:${id}` },
        { text: '✅ إغلاق بدون رد', callback_data: `inq_close:${id}` },
      ],
    ],
  };
}

// ==================== Confirmation ====================
export function confirmKeyboard(action: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ نعم', callback_data: `${action}:yes` },
        { text: '❌ لا', callback_data: `${action}:no` },
      ],
    ],
  };
}

// ==================== Cancel ====================
export function cancelOnlyKeyboard(
  callback = 'ann_cancel',
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [[{ text: '❌ إلغاء', callback_data: callback }]],
  };
}

// ==================== Back to Draft ====================
export function backToDraftKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '↩️ رجوع للمعاينة', callback_data: 'ann_back_to_draft' }],
    ],
  };
}