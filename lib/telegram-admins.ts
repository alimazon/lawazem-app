// lib/telegram-admins.ts
import { getSupabaseAdmin } from './supabaseAdmin';

export type AdminRole = 'super_admin' | 'admin' | 'publisher';

export interface TelegramAdmin {
  chat_id: number;
  username: string | null;
  first_name: string;
  role: AdminRole;
  added_by: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== قراءة ====================
export async function getAdmin(
  chatId: number,
): Promise<TelegramAdmin | null> {
  const { data } = await getSupabaseAdmin()
    .from('telegram_admins')
    .select('*')
    .eq('chat_id', chatId)
    .eq('is_active', true)
    .maybeSingle<TelegramAdmin>();
  return data ?? null;
}

export async function getAdminByUsername(
  username: string,
): Promise<TelegramAdmin | null> {
  const clean = username.replace(/^@/, '').toLowerCase();
  if (!clean) return null;
  const { data } = await getSupabaseAdmin()
    .from('telegram_admins')
    .select('*')
    .eq('is_active', true)
    .ilike('username', clean)
    .maybeSingle<TelegramAdmin>();
  return data ?? null;
}

export async function listAdmins(): Promise<TelegramAdmin[]> {
  const { data } = await getSupabaseAdmin()
    .from('telegram_admins')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  return (data ?? []) as TelegramAdmin[];
}

export async function listSuperAdmins(): Promise<TelegramAdmin[]> {
  const { data } = await getSupabaseAdmin()
    .from('telegram_admins')
    .select('*')
    .eq('role', 'super_admin')
    .eq('is_active', true);
  return (data ?? []) as TelegramAdmin[];
}

export async function hasAnySuperAdmin(): Promise<boolean> {
  const { count } = await getSupabaseAdmin()
    .from('telegram_admins')
    .select('chat_id', { count: 'exact', head: true })
    .eq('role', 'super_admin')
    .eq('is_active', true);
  return (count ?? 0) > 0;
}

// ==================== كتابة ====================
export async function registerAdmin(args: {
  chatId: number;
  username: string | null;
  firstName: string;
  role: AdminRole;
  addedBy: number | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await getSupabaseAdmin()
    .from('telegram_admins')
    .upsert(
      {
        chat_id: args.chatId,
        username: args.username,
        first_name: args.firstName,
        role: args.role,
        added_by: args.addedBy,
        is_active: true,
      },
      { onConflict: 'chat_id' },
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deactivateAdmin(
  chatId: number,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await getSupabaseAdmin()
    .from('telegram_admins')
    .update({ is_active: false })
    .eq('chat_id', chatId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function roleLabel(role: AdminRole): string {
  if (role === 'super_admin') return 'مشرف أعلى';
  if (role === 'admin') return 'مشرف';
  return 'ناشر';
}

export function canApprove(role: AdminRole): boolean {
  return role === 'super_admin';
}