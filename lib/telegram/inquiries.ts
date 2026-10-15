// lib/telegram/inquiries.ts
import { getSupabaseAdmin } from '../supabaseAdmin';

// ==================== Types ====================
export interface Inquiry {
  id: string;
  chat_id: number;
  student_name: string | null;
  stage: string | null;
  question: string;
  status: 'pending' | 'answered' | 'closed';
  admin_reply: string | null;
  replied_by: number | null;
  replied_at: string | null;
  created_at: string;
}

// ==================== Create ====================
export async function createInquiry(args: {
  chatId: number;
  studentName: string | null;
  stage: string | null;
  question: string;
}): Promise<{ ok: true; inquiry: Inquiry } | { ok: false; error: string }> {
  const question = args.question.trim().slice(0, 1500);
  if (!question) return { ok: false, error: 'السؤال فارغ' };

  const { data, error } = await getSupabaseAdmin()
    .from('telegram_inquiries')
    .insert({
      chat_id: args.chatId,
      student_name: args.studentName,
      stage: args.stage,
      question,
    })
    .select('*')
    .single<Inquiry>();

  if (error || !data) {
    console.error('[inquiries] create error:', error?.message);
    return { ok: false, error: error?.message ?? 'فشل الحفظ' };
  }

  return { ok: true, inquiry: data };
}

// ==================== Read ====================
export async function listPendingInquiries(
  limit = 10,
): Promise<Inquiry[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('telegram_inquiries')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[inquiries] list pending error:', error.message);
    return [];
  }
  return (data ?? []) as Inquiry[];
}

export async function countPendingInquiries(): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('telegram_inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error) return 0;
  return count ?? 0;
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('telegram_inquiries')
    .select('*')
    .eq('id', id)
    .maybeSingle<Inquiry>();
  if (error || !data) return null;
  return data;
}

// ==================== Answer ====================
export async function answerInquiry(args: {
  id: string;
  reply: string;
  adminChatId: number;
}): Promise<{ ok: boolean; inquiry?: Inquiry; error?: string }> {
  const reply = args.reply.trim().slice(0, 1500);
  if (!reply) return { ok: false, error: 'الرد فارغ' };

  const { data, error } = await getSupabaseAdmin()
    .from('telegram_inquiries')
    .update({
      status: 'answered',
      admin_reply: reply,
      replied_by: args.adminChatId,
      replied_at: new Date().toISOString(),
    })
    .eq('id', args.id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle<Inquiry>();

  if (error) {
    console.error('[inquiries] answer error:', error.message);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: 'الاستفسار غير موجود أو تمت معالجته' };
  return { ok: true, inquiry: data };
}

// ==================== Close without reply ====================
export async function closeInquiry(
  id: string,
): Promise<{ ok: boolean; inquiry?: Inquiry; error?: string }> {
  const { data, error } = await getSupabaseAdmin()
    .from('telegram_inquiries')
    .update({ status: 'closed' })
    .eq('id', id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle<Inquiry>();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: 'الاستفسار غير موجود' };
  return { ok: true, inquiry: data };
}

// ==================== Format ====================
export function formatInquiryForAdmin(
  inq: Inquiry,
  escapeHtml: (s: string) => string,
): string {
  const lines: string[] = [];
  lines.push('📮 <b>استفسار جديد</b>');
  lines.push('');
  lines.push(`👤 ${escapeHtml(inq.student_name ?? 'غير معروف')}`);
  if (inq.stage) lines.push(`📌 ${escapeHtml(inq.stage)}`);
  lines.push('');
  lines.push('❓ <b>السؤال:</b>');
  lines.push(escapeHtml(inq.question));
  return lines.join('\n');
}