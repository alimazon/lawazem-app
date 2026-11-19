// lib/groups/supabase-admin.ts
// ⚠️ هذا الملف للاستخدام على السيرفر فقط. لا تستورده من مكونات 'use client'

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !serviceKey) {
  throw new Error(
    'متغيرات Supabase ناقصة. تأكد من وجود NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في .env.local'
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});