// lib/telegram/subscribers.ts
import { getSupabaseAdmin } from '../supabaseAdmin';
import type { Subscriber, OnboardingStep } from './types';

// ==================== Read ====================
export async function getSubscriber(
  chatId: number,
): Promise<Subscriber | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('telegram_subscribers')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle<Subscriber>();

  if (error) {
    console.error('[subs] get error:', error.message);
    return null;
  }
  return data ?? null;
}

// ==================== Upsert ====================
export async function upsertSubscriber(
  user: { id: number; first_name?: string; username?: string },
  patch: Partial<Subscriber>,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const existing = await getSubscriber(user.id);

  if (existing) {
    const { error } = await supabase
      .from('telegram_subscribers')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('chat_id', user.id);
    if (error) console.error('[subs] update error:', error.message);
  } else {
    const { error } = await supabase.from('telegram_subscribers').insert({
      chat_id: user.id,
      first_name: user.first_name ?? null,
      username: user.username ?? null,
      ...patch,
    });
    if (error) console.error('[subs] insert error:', error.message);
  }
}

// ==================== Onboarding helpers ====================
export function isFullyOnboarded(sub: Subscriber | null): boolean {
  if (!sub) return false;
  return (
    sub.stage !== null &&
    sub.group_name !== null &&
    sub.onboarding_step === 'idle'
  );
}

export async function setOnboardingStep(
  chatId: number,
  step: OnboardingStep,
): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('telegram_subscribers')
    .update({ onboarding_step: step, updated_at: new Date().toISOString() })
    .eq('chat_id', chatId);
  if (error) console.error('[subs] setOnboardingStep error:', error.message);
}

// ==================== Delete (unsubscribe) ====================
export async function deleteSubscriber(chatId: number): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('telegram_subscribers')
    .delete()
    .eq('chat_id', chatId);
  if (error) console.error('[subs] delete error:', error.message);
}

// ==================== Stats ====================
export async function countSubscribers(): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('telegram_subscribers')
    .select('chat_id', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

// ==================== Group label helpers ====================
export function groupLabel(g: 'A' | 'B'): string {
  return g === 'A' ? 'كروب A' : 'كروب B';
}

export function groupEmoji(g: 'A' | 'B'): string {
  return g === 'A' ? '🔵' : '🟡';
}