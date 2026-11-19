// app/admin/settings/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const [password, setPassword] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', password })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'كلمة المرور خاطئة');
      setData(json.data);
      setIsLogged(true);
    } catch (err) {
      setMsg({ type: 'error', text: err instanceof Error ? err.message : 'خطأ' });
    } finally {
      setLoading(false);
    }
  }

  async function toggleRegistration() {
    setLoading(true);
    try {
      const newStatus = !data.settings.registration_open;
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', password, registration_open: newStatus })
      });
      if (!res.ok) throw new Error('فشل التحديث');
      
      setData({ ...data, settings: { ...data.settings, registration_open: newStatus } });
      setMsg({ type: 'success', text: newStatus ? 'تم فتح التسجيل' : 'تم إغلاق التسجيل' });
    } catch (err) {
      setMsg({ type: 'error', text: 'حدث خطأ' });
    } finally {
      setLoading(false);
    }
  }

  if (!isLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper p-4" dir="rtl">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-ink mb-4 text-center">لوحة تحكم الأدمن</h1>
          {msg.text && <div className="mb-4 rounded-lg bg-red-50 p-2 text-sm text-red-600">{msg.text}</div>}
          <input type="password" placeholder="كلمة مرور الأدمن" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 mb-4 text-center" />
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-teal py-2 font-bold text-white hover:bg-teal/90 disabled:opacity-50">دخول</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper p-6" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-6">
        
        {/* الترويسة */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">لوحة الإعدادات</h1>
          <Link href="/admin/match" className="rounded-lg bg-teal/10 px-4 py-2 text-sm font-bold text-teal">الذهاب للمطابقة 🤖</Link>
        </div>

        {msg.text && <div className={`rounded-lg p-3 text-sm font-semibold ${msg.type === 'success' ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}

        {/* الإحصائيات */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-line bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-ink">{data.stats.students}</div>
            <div className="text-sm text-ink-muted mt-1">طالب مسجل</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-teal">{data.stats.groups}</div>
            <div className="text-sm text-ink-muted mt-1">كروب</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-gold-ink">{data.stats.queue}</div>
            <div className="text-sm text-ink-muted mt-1">في الانتظار</div>
          </div>
        </div>

        {/* إعدادات التسجيل */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-ink mb-4">حالة التسجيل</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">التسجيل وإنشاء الكروبات</p>
              <p className="text-sm text-ink-muted mt-1">إذا كان مغلقاً، لن يتمكن الطلاب الجدد من التسجيل أو إنشاء كروبات.</p>
            </div>
            <button
              onClick={toggleRegistration}
              disabled={loading}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${data.settings.registration_open ? 'bg-teal' : 'bg-ink/20'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${data.settings.registration_open ? '-translate-x-7' : '-translate-x-1'}`} />
            </button>
          </div>
          <div className={`mt-4 inline-block rounded-lg px-3 py-1 text-sm font-bold ${data.settings.registration_open ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-600'}`}>
            {data.settings.registration_open ? '✅ التسجيل مفتوح حالياً' : '🛑 التسجيل مغلق حالياً'}
          </div>
        </div>

        <button onClick={() => setIsLogged(false)} className="text-sm text-ink-muted hover:text-red-500">تسجيل خروج الأدمن</button>
      </div>
    </div>
  );
}