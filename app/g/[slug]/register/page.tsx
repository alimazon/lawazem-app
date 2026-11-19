// app/g/[slug]/register/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { groupsFetch, saveToken, getToken } from '@/lib/groups/client';
import type { Student } from '@/lib/types/groups';

export default function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');

  const [checking, setChecking] = useState(true);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getToken()) {
      router.replace(nextUrl || `/g/${slug}`);
    } else {
      setChecking(false);
    }
  }, [slug, router, nextUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (fullName.trim().length < 5) return setError('الرجاء إدخال الاسم الثلاثي (5 أحرف على الأقل)');
    if (!username.trim()) return setError('الرجاء إدخال معرف التليكرام');
    if (!gender) return setError('الرجاء اختيار الجنس');

    setLoading(true);
    try {
      const data = await groupsFetch<{ token: string; student: Student }>('/api/groups/register', {
        slug,
        full_name: fullName.trim(),
        telegram_username: username.trim(),
        gender,
      });
      saveToken(data.token);
      router.push(nextUrl || `/g/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل التسجيل');
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <div className="flex items-center justify-center py-20 text-ink-muted">جارٍ التحميل...</div>;

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">سجّل الآن</h1>
        <p className="mt-1 text-sm text-ink-soft">أدخل بياناتك للانضمام إلى كروبات الطلاب</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">الاسم الثلاثي</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="مثال: أحمد محمد علي" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none focus:border-teal focus:ring-1 focus:ring-teal disabled:opacity-60" maxLength={100} disabled={loading} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">معرف التليكرام</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ahmed_m أو @ahmed_m" className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-ink outline-none focus:border-teal focus:ring-1 focus:ring-teal disabled:opacity-60" maxLength={33} disabled={loading} dir="ltr" />
            <p className="mt-1 text-xs text-ink-muted">يُستخدم للتواصل بين أعضاء الكروب</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">الجنس</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setGender('male')} disabled={loading} className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${gender === 'male' ? 'border-teal bg-teal text-white' : 'border-line bg-white text-ink hover:border-teal/50'}`}>👨 ذكر</button>
              <button type="button" onClick={() => setGender('female')} disabled={loading} className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${gender === 'female' ? 'border-teal bg-teal text-white' : 'border-line bg-white text-ink hover:border-teal/50'}`}>👩 أنثى</button>
            </div>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-teal px-4 py-2.5 font-semibold text-white transition-colors hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'جارٍ التسجيل...' : 'تسجيل'}
          </button>
        </form>
      </div>
    </div>
  );
}