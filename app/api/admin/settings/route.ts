// app/api/admin/settings/route.ts
import { supabaseAdmin } from '@/lib/groups/supabase-admin';
import { ok, fail, handleError } from '@/lib/groups/api-response';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    
    if (body.password !== process.env.ADMIN_PASSWORD) {
      return fail('كلمة المرور غير صحيحة', 401);
    }

    if (body.action === 'get') {
      // جلب الإعدادات
      const { data: settings } = await supabaseAdmin.from('sg_settings').select('*').eq('id', 1).single();
      
      // جلب الإحصائيات
      const { count: students } = await supabaseAdmin.from('sg_students').select('*', { count: 'exact', head: true });
      const { count: groups } = await supabaseAdmin.from('sg_groups').select('*', { count: 'exact', head: true });
      const { count: queue } = await supabaseAdmin.from('sg_match_queue').select('*', { count: 'exact', head: true }).eq('status', 'waiting');

      return ok({ 
        settings, 
        stats: { 
          students: students || 0, 
          groups: groups || 0, 
          queue: queue || 0 
        } 
      });
    }

    if (body.action === 'update') {
      const updateData: any = {};
      if (typeof body.registration_open === 'boolean') updateData.registration_open = body.registration_open;
      if (typeof body.target_size === 'number') updateData.target_size = body.target_size;

      const { error } = await supabaseAdmin.from('sg_settings').update(updateData).eq('id', 1);
      if (error) throw new Error(error.message);
      
      return ok({ message: 'تم التحديث بنجاح' });
    }

    return fail('إجراء غير معروف');
  } catch (err) {
    return handleError(err);
  }
}