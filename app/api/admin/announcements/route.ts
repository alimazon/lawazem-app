// app/api/admin/announcements/route.ts
import { NextResponse } from 'next/server';
import {
  jsonError,
  safeOptionalString,
  safeString,
} from '@/lib/api-server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendAnnouncement } from '@/lib/telegram-notifications';
import { STAGES } from '@/lib/constants';

// ==================== Roles ====================
type Role = 'super_admin' | 'admin' | 'publisher';

function resolveRole(
  password: unknown
): { ok: true; role: Role } | { ok: false } {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false };
  }

  const superPw = process.env.SUPER_ADMIN_PASSWORD;
  if (superPw && password === superPw) {
    return { ok: true, role: 'super_admin' };
  }

  const adminPw = process.env.ADMIN_PASSWORD;
  if (adminPw && password === adminPw) {
    return { ok: true, role: 'admin' };
  }

  const pubPw = process.env.PUBLISHER_PASSWORD;
  if (pubPw && password === pubPw) {
    return { ok: true, role: 'publisher' };
  }

  return { ok: false };
}

// ==================== Helpers ====================
function parseStage(value: unknown): string | null {
  const s = safeOptionalString(value, 100);
  if (!s) return null;
  return (STAGES as readonly string[]).includes(s) ? s : null;
}

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  stage: string | null;
  link_url: string | null;
  link_label: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'sent' | 'failed';
  created_by: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewed_note: string | null;
  sent_at: string | null;
  sent_count: number;
  sent_error: string | null;
}

// ==================== Route ====================
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const auth = resolveRole(body.password);
  if (!auth.ok) {
    return jsonError('كلمة المرور غير صحيحة', 401);
  }
  const { role } = auth;
  const supabaseAdmin = getSupabaseAdmin();

  const action = typeof body.action === 'string' ? body.action : '';

  // ==================== whoami ====================
  if (action === 'whoami') {
    return NextResponse.json({
      role,
      canApprove: role === 'super_admin',
      canEdit: role === 'super_admin',
      canDelete: role === 'super_admin',
    });
  }

  // ==================== create ====================
  if (action === 'create') {
    // publisher / admin / super_admin — الكل ينشئ كـ pending
    // الموافقة والإرسال تحتاج super_admin.
    const title = safeString(body.title, 200);
    const text = safeString(body.body, 2000);
    const stage = parseStage(body.stage);
    const link_url = safeOptionalString(body.link_url, 1000);
    const link_label = safeOptionalString(body.link_label, 60);
    const created_by = safeString(body.created_by, 100);

    if (!title) return jsonError('العنوان مطلوب');
    if (!text) return jsonError('نص التبليغ مطلوب');
    if (!created_by) return jsonError('الاسم مطلوب');
    if (link_url && !isValidUrl(link_url)) {
      return jsonError('رابط غير صالح (يجب أن يبدأ بـ http أو https)');
    }

    const { data, error } = await supabaseAdmin
      .from('telegram_announcements')
      .insert({
        title,
        body: text,
        stage,
        link_url,
        link_label,
        created_by,
        // super_admin يُنشئ pending أيضاً — لكنه يعتمد زر "موافقة وإرسال" فوراً
        status: 'pending',
      })
      .select('id')
      .single<{ id: string }>();

    if (error || !data) {
      console.error('announcement create error:', error?.message);
      return jsonError('فشل إنشاء التبليغ', 500);
    }

        // إشعار فوري للمشرفين الأعلى (fire-and-forget)
    void (async () => {
      try {
        const { notifySuperAdminsNewAnnouncement } = await import('@/lib/telegram-notifications');
        await notifySuperAdminsNewAnnouncement({
          id: data.id,
          title,
          body: text,
          stage,
          created_by,
        });
      } catch (err) {
        console.error('[announcement notify] error:', err);
      }
    })();

    return NextResponse.json({
      success: true,
      id: data.id,
      status: 'pending',
      requires_approval: true,
    });
  }

  // ==================== list_mine ====================
  if (action === 'list_mine') {
    const created_by = safeString(body.created_by, 100);
    if (!created_by) return jsonError('الاسم مطلوب');

    const { data, error } = await supabaseAdmin
      .from('telegram_announcements')
      .select('*')
      .eq('created_by', created_by)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('announcement list_mine error:', error.message);
      return jsonError('فشل تحميل تبليغاتك', 500);
    }

    return NextResponse.json({ items: (data ?? []) as AnnouncementRow[] });
  }

  // ==================== list_pending ====================
  if (action === 'list_pending') {
    if (role !== 'super_admin' && role !== 'admin') {
      return jsonError('غير مصرح', 403);
    }

    const { data, error } = await supabaseAdmin
      .from('telegram_announcements')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('announcement list_pending error:', error.message);
      return jsonError('فشل تحميل القائمة', 500);
    }

    return NextResponse.json({ items: (data ?? []) as AnnouncementRow[] });
  }

  // ==================== list_history ====================
  if (action === 'list_history') {
    if (role !== 'super_admin' && role !== 'admin') {
      return jsonError('غير مصرح', 403);
    }

    const { data, error } = await supabaseAdmin
      .from('telegram_announcements')
      .select('*')
      .in('status', ['sent', 'failed', 'rejected'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('announcement list_history error:', error.message);
      return jsonError('فشل تحميل السجل', 500);
    }

    return NextResponse.json({ items: (data ?? []) as AnnouncementRow[] });
  }

  // ==================== pending_count ====================
  if (action === 'pending_count') {
    if (role !== 'super_admin' && role !== 'admin') {
      return jsonError('غير مصرح', 403);
    }

    const { count, error } = await supabaseAdmin
      .from('telegram_announcements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) return NextResponse.json({ count: 0 });
    return NextResponse.json({ count: count ?? 0 });
  }

  // ==================== approve (super_admin فقط) ====================
  if (action === 'approve') {
    if (role !== 'super_admin') {
      return jsonError('غير مصرح — الموافقة تتطلب صلاحية المشرف الأعلى', 403);
    }

    const id = safeString(body.id, 100);
    if (!id) return jsonError('id مطلوب');

    const { data: existing } = await supabaseAdmin
      .from('telegram_announcements')
      .select('status')
      .eq('id', id)
      .maybeSingle<{ status: string }>();

    if (!existing) return jsonError('التبليغ غير موجود', 404);
    if (existing.status !== 'pending') {
      return jsonError('لا يمكن الموافقة على تبليغ بحالة ' + existing.status);
    }

    await supabaseAdmin
      .from('telegram_announcements')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'super_admin',
      })
      .eq('id', id);

    let result;
    try {
      result = await sendAnnouncement(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطأ غير معروف';
      await supabaseAdmin
        .from('telegram_announcements')
        .update({ status: 'failed', sent_error: msg })
        .eq('id', id);
      return jsonError('فشل الإرسال: ' + msg, 500);
    }

    if (result.error) {
      await supabaseAdmin
        .from('telegram_announcements')
        .update({
          status: 'failed',
          sent_error: result.error,
          sent_count: result.sent,
        })
        .eq('id', id);
      return jsonError('فشل الإرسال: ' + result.error, 500);
    }

    await supabaseAdmin
      .from('telegram_announcements')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: result.sent,
        sent_error: result.failed > 0 ? `فشل ${result.failed}` : null,
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  }

  // ==================== reject (super_admin فقط) ====================
  if (action === 'reject') {
    if (role !== 'super_admin') {
      return jsonError('غير مصرح', 403);
    }

    const id = safeString(body.id, 100);
    const note = safeOptionalString(body.note, 500);

    if (!id) return jsonError('id مطلوب');

    const { error } = await supabaseAdmin
      .from('telegram_announcements')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'super_admin',
        reviewed_note: note,
      })
      .eq('id', id)
      .eq('status', 'pending');

    if (error) {
      console.error('announcement reject error:', error.message);
      return jsonError('فشل الرفض', 500);
    }
    return NextResponse.json({ success: true });
  }

  // ==================== edit (super_admin فقط — لتصحيح النص قبل الإرسال) ====================
  if (action === 'edit') {
    if (role !== 'super_admin') {
      return jsonError('غير مصرح', 403);
    }

    const id = safeString(body.id, 100);
    const title = safeString(body.title, 200);
    const text = safeString(body.body, 2000);
    const stage = parseStage(body.stage);
    const link_url = safeOptionalString(body.link_url, 1000);
    const link_label = safeOptionalString(body.link_label, 60);

    if (!id) return jsonError('id مطلوب');
    if (!title) return jsonError('العنوان مطلوب');
    if (!text) return jsonError('النص مطلوب');
    if (link_url && !isValidUrl(link_url)) {
      return jsonError('رابط غير صالح');
    }

    const { error } = await supabaseAdmin
      .from('telegram_announcements')
      .update({ title, body: text, stage, link_url, link_label })
      .eq('id', id)
      .eq('status', 'pending');

    if (error) {
      console.error('announcement edit error:', error.message);
      return jsonError('فشل التعديل', 500);
    }
    return NextResponse.json({ success: true });
  }

  // ==================== resend (super_admin فقط) ====================
  if (action === 'resend') {
    if (role !== 'super_admin') {
      return jsonError('غير مصرح', 403);
    }

    const id = safeString(body.id, 100);
    if (!id) return jsonError('id مطلوب');

    const result = await sendAnnouncement(id);

    if (result.error) {
      await supabaseAdmin
        .from('telegram_announcements')
        .update({
          status: 'failed',
          sent_error: result.error,
          sent_count: result.sent,
        })
        .eq('id', id);
      return jsonError('فشل الإرسال: ' + result.error, 500);
    }

    await supabaseAdmin
      .from('telegram_announcements')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: result.sent,
        sent_error: result.failed > 0 ? `فشل ${result.failed}` : null,
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  }

  // ==================== delete (super_admin فقط) ====================
  if (action === 'delete') {
    if (role !== 'super_admin') {
      return jsonError('غير مصرح', 403);
    }

    const id = safeString(body.id, 100);
    if (!id) return jsonError('id مطلوب');

    const { error } = await supabaseAdmin
      .from('telegram_announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('announcement delete error:', error.message);
      return jsonError('فشل الحذف', 500);
    }
    return NextResponse.json({ success: true });
  }

  return jsonError('إجراء غير معروف');
}
