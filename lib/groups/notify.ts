// lib/groups/notify.ts
// ⚠️ للاستخدام على السيرفر فقط

import { supabaseAdmin } from './supabase-admin';

/**
 * إرسال إشعار لطالب واحد (يظهر في مركز الإشعارات في الواجهة)
 */
export async function notify(
  studentId: string,
  type: string,
  title: string,
  body?: string,
  href?: string
): Promise<void> {
  await supabaseAdmin.from('sg_notifications').insert({
    student_id: studentId,
    type,
    title,
    body: body || null,
    href: href || null,
  });
}

/**
 * إرسال إشعار لعدة طلاب دفعة واحدة
 */
export async function notifyMany(
  studentIds: string[],
  type: string,
  title: string,
  body?: string,
  href?: string
): Promise<void> {
  if (studentIds.length === 0) return;
  const rows = studentIds.map((id) => ({
    student_id: id,
    type,
    title,
    body: body || null,
    href: href || null,
  }));
  await supabaseAdmin.from('sg_notifications').insert(rows);
}