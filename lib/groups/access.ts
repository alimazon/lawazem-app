// lib/groups/access.ts
// ⚠️ للاستخدام على السيرفر فقط

import { supabaseAdmin } from './supabase-admin';
import type { Settings } from '@/lib/types/groups';

export interface AccessToken {
  slug: string;
  label: string | null;
  is_active: boolean;
  study_year: string;
  expires_at: string | null;
}

/**
 * يجيب رابط الوصول المؤقت (slug) إذا كان فعّالاً
 */
export async function getAccessToken(
  slug: string
): Promise<AccessToken | null> {
  const { data } = await supabaseAdmin
    .from('sg_access_tokens')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!data) return null;
  if (!data.is_active) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now())
    return null;

  return data as AccessToken;
}

/**
 * يجيب إعدادات النظام (صف واحد فقط)
 */
export async function getSettings(): Promise<Settings> {
  const { data } = await supabaseAdmin
    .from('sg_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (!data) {
    return {
      id: 1,
      target_size: 10,
      preferred_male: 5,
      preferred_female: 5,
      registration_open: true,
      allow_create: true,
      allow_join: true,
      session_expires_at: null,
      updated_at: new Date().toISOString(),
    };
  }
  return data as Settings;
}

export function isRegistrationOpen(s: Settings): boolean {
  return s.registration_open === true;
}