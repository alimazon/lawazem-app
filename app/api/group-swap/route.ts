// app/api/group-swap/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeOptionalString, safeString } from '@/lib/api-server';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function parseGroup(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const upper = v.toUpperCase().trim();
  return GROUPS.includes(upper) ? upper : null;
}

function normalizeUsername(u: string): string {
  return u.trim().replace(/^@/, '').toLowerCase();
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const supabaseAdmin = getSupabaseAdmin();

  switch (action) {
    // ==================== list ====================
    case 'list': {
      const { data, error } = await supabaseAdmin
        .from('group_swap_requests')
        .select('id, student_name, telegram_username, current_group, target_group, notes, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('group-swap list error:', error.message);
        return jsonError('فشل تحميل الطلبات', 500);
      }
      return NextResponse.json({ requests: data ?? [] });
    }

    // ==================== add ====================
    case 'add': {
      const student_name = safeString(body.student_name, 100);
      const rawUsername = safeString(body.telegram_username, 100);
      const telegram_username = normalizeUsername(rawUsername);
      const current_group = parseGroup(body.current_group);
      const target_group = parseGroup(body.target_group);
      const notes = safeOptionalString(body.notes, 300);

      if (!student_name) return jsonError('الاسم مطلوب');
      if (!telegram_username) return jsonError('يوزر التليكرام مطلوب');
      if (!current_group) return jsonError('اختر الكروب الحالي');
      if (!target_group) return jsonError('اختر الكروب المطلوب');
      if (current_group === target_group) {
        return jsonError('الكروب الحالي والكروب المطلوب متطابقان');
      }

      // ✅ منع التكرار: نفس اليوزر عنده طلب مفتوح
      const { data: existing } = await supabaseAdmin
        .from('group_swap_requests')
        .select('id')
        .ilike('telegram_username', telegram_username)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return jsonError(
          'لديك طلب مفتوح بالفعل بهذا اليوزر. يجب حذفه أولاً قبل إنشاء طلب جديد.'
        );
      }

      const owner_secret = crypto.randomUUID();

      const { data, error } = await supabaseAdmin
        .from('group_swap_requests')
        .insert({
          student_name,
          telegram_username,
          current_group,
          target_group,
          notes,
          owner_secret,
        })
        .select('id')
        .single();

      if (error) {
        console.error('group-swap add error:', error.message);
        return jsonError('فشل إضافة الطلب', 500);
      }

      return NextResponse.json({
        success: true,
        id: data.id,
        owner_secret,
      });
    }

    // ==================== delete ====================
    case 'delete': {
      const id = safeString(body.id, 100);
      const owner_secret = safeString(body.owner_secret, 100);
      const rawUsername = safeString(body.telegram_username, 100);
      const telegram_username = rawUsername ? normalizeUsername(rawUsername) : '';

      if (!id) return jsonError('id مطلوب');

      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('group_swap_requests')
        .select('owner_secret, telegram_username')
        .eq('id', id)
        .maybeSingle<{ owner_secret: string; telegram_username: string }>();

      if (fetchError || !existing) {
        return jsonError('الطلب غير موجود', 404);
      }

      // ✅ تحقق: إما owner_secret صحيح، أو telegram_username مطابق
      const isValidSecret = !!owner_secret && existing.owner_secret === owner_secret;
      const isValidUsername =
        !!telegram_username &&
        normalizeUsername(existing.telegram_username) === telegram_username;

      if (!isValidSecret && !isValidUsername) {
        return jsonError('غير مصرح بحذف هذا الطلب', 403);
      }

      const { error } = await supabaseAdmin
        .from('group_swap_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('group-swap delete error:', error.message);
        return jsonError('فشل حذف الطلب', 500);
      }

      return NextResponse.json({ success: true });
    }

    default:
      return jsonError('إجراء غير معروف');
  }
}