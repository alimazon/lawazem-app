// lib/constants.ts
import type { ContentType, Stage } from './types';

export const STAGES: readonly Stage[] = [
  'المرحلة الأولى',
  'المرحلة الثانية',
  'المرحلة الثالثة',
] as const;

export const CONTENT_TYPES: readonly ContentType[] = [
  'assignment',
  'lecture_note',
  'summary',
  'task',
] as const;

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  assignment: 'واجب',
  lecture_note: 'ملزمة',
  summary: 'ملخص',
  task: 'مهمة | سشن',
};

export const STORAGE_KEYS = {
  studentStage: 'student_stage',
  adminPassword: 'admin_password',
  channelId: 'channel_id',
  channelPassword: 'channel_password',
} as const;

export const STORAGE_BUCKETS = {
  scheduleImages: 'schedule-images',
  channelImages: 'channel-images',
  channelFiles: 'channel-files',
} as const;

export const STUDY_FORMATS = [
  'شرح مبسط وواضح لمحتوى السلايد خطوة بخطوة',
  'أسئلة اختيار من متعدد (MCQ) للمراجعة مع الإجابات الصحيحة وتوضيح كل خيار',
  'فلاش كاردز (سؤال وجواب) للحفظ السريع',
  'ملخص نقطي سريع ومركز',
  'أسئلة نقاش عميقة تساعد على الفهم لا الحفظ',
  'مراجعة شاملة وتجميعية آخر المحاضرة بعد إرسال كل السلايدات',
] as const;

export type StudyFormat = (typeof STUDY_FORMATS)[number];

export const STUDY_FORMAT_LABELS: Record<StudyFormat, string> = {
  'شرح مبسط وواضح لمحتوى السلايد خطوة بخطوة': 'شرح مبسط',
  'أسئلة اختيار من متعدد (MCQ) للمراجعة مع الإجابات الصحيحة وتوضيح كل خيار': 'أسئلة اختيار من متعدد (MCQ)',
  'فلاش كاردز (سؤال وجواب) للحفظ السريع': 'فلاش كاردز',
  'ملخص نقطي سريع ومركز': 'ملخص نقطي',
  'أسئلة نقاش عميقة تساعد على الفهم لا الحفظ': 'أسئلة نقاش عميقة',
  'مراجعة شاملة وتجميعية آخر المحاضرة بعد إرسال كل السلايدات': 'مراجعة شاملة آخر المحاضرة',
};

export const MATERIAL_METHODS = [
  {
    value: 'الطالب راح يرسل صورة سلايد واحد بكل رسالة، سلايد بعد سلايد لين نهاية المحاضرة',
    label: 'إرسال صور السلايدات (سلايد بكل رسالة)',
  },
  {
    value: 'الطالب راح يرسل ملف الملزمة (PDF) كامل دفعة وحدة برسالة وحدة',
    label: 'إرسال ملف الملزمة كامل دفعة وحدة',
  },
  {
    value: 'الطالب راح ينسخ نص جزء من الملزمة ويلصقه بكل رسالة، جزء بعد جزء',
    label: 'نسخ ولصق نص الملزمة على أجزاء',
  },
] as const;