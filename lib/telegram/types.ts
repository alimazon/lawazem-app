// lib/telegram/types.ts
/**
 * كل الأنواع الخاصة ببوت تيليكرام
 */

// ==================== Telegram Update ====================
export interface TelegramUser {
  id: number;
  first_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: {
    message_id: number;
    chat: TelegramChat;
  };
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

// ==================== Reply Keyboard ====================
export interface KeyboardButton {
  text: string;
  request_contact?: boolean;
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  is_persistent?: boolean;
  input_field_placeholder?: string;
  remove_keyboard?: never;
}

export interface ReplyKeyboardRemove {
  remove_keyboard: true;
  selective?: boolean;
}

export type ReplyMarkup = ReplyKeyboardMarkup | ReplyKeyboardRemove;

// ==================== Subscriber ====================
export type OnboardingStep =
  | 'choosing_stage'
  | 'choosing_group'
  | 'choosing_group_from_settings'
  | 'choosing_subjects'
  | 'idle';

export interface Subscriber {
  chat_id: number;
  first_name: string | null;
  username: string | null;
  stage: string | null;
  group_name: 'A' | 'B' | null;
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
  created_at?: string;
  updated_at?: string;
}

// ==================== Notification Toggles ====================
export type NotifyToggleKey =
  | 'notify_new_note'
  | 'notify_morning'
  | 'notify_streak'
  | 'notify_weekly'
  | 'notify_trending'
  | 'notify_announcements';

export const NOTIFY_TOGGLE_LABELS: Record<NotifyToggleKey, string> = {
  notify_new_note: 'ملزمة جديدة',
  notify_morning: 'موجز صباحي',
  notify_streak: 'تنبيه الستريك',
  notify_weekly: 'ملخص أسبوعي',
  notify_trending: 'محتوى رائج',
  notify_announcements: '📢 تبليغات إدارية',
};

// ==================== Menu Button Texts ====================
/**
 * نصوص أزرار الـReply Keyboard — تُستخدم في التوجيه داخل الويب هوك
 */
export const STUDENT_MENU_TEXTS = {
  lawazem: '📚 الملازم',
  dictionary: '🔍 القاموس',
  inquiry: '📮 استفسار',
  streak: '🔥 سلسلتي',
  settings: '⚙️ الإعدادات',
  help: '❓ مساعدة',
} as const;

export const ADMIN_MENU_TEXTS = {
  newAnnounce: '📢 تبليغ جديد',
  pending: '📋 المراجعة',
  inquiries: '📮 الاستفسارات',
  admins: '👥 المشرفون',
  stats: '📊 الإحصائيات',
  help: '📖 دليل المشرف',
  lawazem: '📚 الملازم',
  settings: '⚙️ الإعدادات',
} as const;

// ==================== Helpers ====================
export function isStudentMenuText(text: string): boolean {
  return Object.values(STUDENT_MENU_TEXTS).includes(
    text as (typeof STUDENT_MENU_TEXTS)[keyof typeof STUDENT_MENU_TEXTS],
  );
}

export function isAdminMenuText(text: string): boolean {
  return Object.values(ADMIN_MENU_TEXTS).includes(
    text as (typeof ADMIN_MENU_TEXTS)[keyof typeof ADMIN_MENU_TEXTS],
  );
}