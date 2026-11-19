// lib/groups/session.ts
// ⚠️ للاستخدام على السيرفر فقط (API routes)

import { randomBytes } from 'node:crypto';
import { supabaseAdmin } from './supabase-admin';
import type { Student } from '@/lib/types/groups';

// بغداد = UTC+3 (بدون توقيت صيفي)
const BAGHDAD_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * يرجع "الآن" بتوقيت بغداد (كـ Date نتعامل معه عبر getUTC*)
 */
function getBaghdadNow(): Date {
  return new Date(Date.now() + BAGHDAD_OFFSET_MS);
}

/**
 * يحسب موعد "الأحد القادم 23:59:59 بتوقيت بغداد"
 * - إذا اليوم أحد وقبل 23:59 → نفس اليوم
 * - إذا اليوم أحد وبعد 23:59 → الأحد القادم
 * - أي يوم آخر → الأحد القادم
 */
export function getNextSundayDeadline(): Date {
  const baghdadNow = getBaghdadNow();
  const day = baghdadNow.getUTCDay(); // 0 = الأحد
  const daysUntilSunday = (7 - day) % 7;

  const target = new Date(baghdadNow);
  target.setUTCDate(target.getUTCDate() + daysUntilSunday);
  target.setUTCHours(23, 59, 59, 999);

  if (target.getTime() <= baghdadNow.getTime()) {
    target.setUTCDate(target.getUTCDate() + 7);
  }

  // نرجع للـ UTC الحقيقي
  return new Date(target.getTime() - BAGHDAD_OFFSET_MS);
}

/**
 * تاريخ انتهاء الجلسة:
 * - إذا الأدمن حدد موعداً في sg_settings → نستخدمه
 * - وإلا → الأحد القادم 23:59
 */
export async function getSessionExpiresAt(): Promise<Date> {
  const { data: settings } = await supabaseAdmin
    .from('sg_settings')
    .select('session_expires_at')
    .eq('id', 1)
    .maybeSingle();

  if (settings?.session_expires_at) {
    const d = new Date(settings.session_expires_at);
    if (!isNaN(d.getTime())) return d;
  }
  return getNextSundayDeadline();
}

export function generateToken(): string {
  return randomBytes(24).toString('hex');
}

/**
 * ينشئ جلسة جديدة ويحفظها في DB، ويرجع التوكن
 */
export async function createSession(studentId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = await getSessionExpiresAt();

  const { error } = await supabaseAdmin.from('sg_sessions').insert({
    token,
    student_id: studentId,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error('فشل إنشاء الجلسة: ' + error.message);
  return token;
}

/**
 * يقرأ التوكن من Authorization header ويجيب الطالب صاحب الجلسة.
 * يرجع null لو ما فيه توكن، أو منتهي، أو غير موجود.
 */
export async function getStudentFromRequest(
  req: Request
): Promise<Student | null> {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const token = m[1].trim();
  if (!token) return null;

  const { data: session } = await supabaseAdmin
    .from('sg_sessions')
    .select('student_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;

  const { data: student } = await supabaseAdmin
    .from('sg_students')
    .select('*')
    .eq('id', session.student_id)
    .maybeSingle();

  return (student as Student) || null;
}

/**
 * نسخة صارمة: ترمي خطأ 401 إذا ما فيه طالب
 */
export async function requireStudent(req: Request): Promise<Student> {
  const student = await getStudentFromRequest(req);
  if (!student) {
    throw Object.assign(new Error('يجب تسجيل الدخول'), { status: 401 });
  }
  return student;
}