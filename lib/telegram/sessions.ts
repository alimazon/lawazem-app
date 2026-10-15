// lib/telegram/sessions.ts
import { getSupabaseAdmin } from '../supabaseAdmin';

// ==================== Types ====================
export type SessionFlowType =
  | 'idle'
  | 'announce'
  | 'add_admin'
  | 'reject'
  | 'inquiry';

export interface AnnouncementDraft {
  templateId: string | null;
  title: string | null;
  body: string | null;
  stage: string | null;
  link_url: string | null;
  link_label: string | null;
}

export interface Session {
  chat_id: number;
  flow_type: SessionFlowType;
  flow_step: string | null;
  flow_data: Record<string, unknown>;
  updated_at: string;
}

// ==================== Helpers ====================
const SESSION_TTL_MS = 60 * 60 * 1000; // ساعة واحدة

function isFresh(updatedAt: string): boolean {
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < SESSION_TTL_MS;
}

// ==================== Read ====================
export async function getSession(
  chatId: number,
): Promise<Session | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('telegram_sessions')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle<Session>();

  if (error || !data) return null;
  if (!isFresh(data.updated_at)) {
    // جلسة قديمة — نظّفها
    void clearSession(chatId);
    return null;
  }
  return data;
}

// ==================== Write ====================
export async function setSession(
  chatId: number,
  flowType: SessionFlowType,
  flowStep: string | null,
  flowData: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('telegram_sessions')
    .upsert(
      {
        chat_id: chatId,
        flow_type: flowType,
        flow_step: flowStep,
        flow_data: flowData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'chat_id' },
    );

  if (error) {
    console.error('[sessions] setSession error:', error.message);
  }
}

export async function clearSession(chatId: number): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('telegram_sessions')
    .delete()
    .eq('chat_id', chatId);
  if (error) {
    console.error('[sessions] clearSession error:', error.message);
  }
}

// ==================== Cleanup ====================
/**
 * احذف كل الجلسات القديمة (أكثر من ساعة بدون تحديث).
 * تُستدعى من الويب هوك sporadically.
 */
export async function cleanupStaleSessions(): Promise<void> {
  const cutoff = new Date(Date.now() - SESSION_TTL_MS).toISOString();
  const { error } = await getSupabaseAdmin()
    .from('telegram_sessions')
    .delete()
    .lt('updated_at', cutoff);
  if (error) {
    console.error('[sessions] cleanup error:', error.message);
  }
}

// ==================== Typed getters ====================
export async function getAnnouncementDraft(
  chatId: number,
): Promise<AnnouncementDraft | null> {
  const s = await getSession(chatId);
  if (!s || s.flow_type !== 'announce') return null;
  const draft = s.flow_data.draft as AnnouncementDraft | undefined;
  return draft ?? null;
}

export function emptyAnnouncementDraft(): AnnouncementDraft {
  return {
    templateId: null,
    title: null,
    body: null,
    stage: null,
    link_url: null,
    link_label: null,
  };
}