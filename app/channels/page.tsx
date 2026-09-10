'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function ChannelsPage() {
  const router = useRouter();
  const [stage, setStage] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('student_stage');
    if (!saved) {
      router.push('/');
      return;
    }
    setStage(saved);

    async function loadData() {
      const { data, error } = await supabase
        .from('channels')
        .select('id, name, description, image_url')
        .eq('stage', saved)
        .order('name');

      if (error) {
        setError(error.message);
      } else {
        setChannels(data || []);
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-ink/50">جاري التحميل...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-extrabold">خطأ في الاتصال بقاعدة البيانات</h1>
        <p className="mt-2 text-ink/70">{error}</p>
      </main>
    );
  }

  const term = searchTerm.trim().toLowerCase();
  const visibleChannels = channels.filter((c: any) => c.name.toLowerCase().includes(term));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/" className="text-sm text-teal hover:underline">
        ← رجوع للوحة الأقسام
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-teal">{stage}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">قنوات الدراسة</h1>

      <div className="relative mt-6 mb-8">
        <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="ابحث باسم القناة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-line bg-white px-4 py-3 pr-11 placeholder:text-ink/40 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
      </div>

      {visibleChannels.length === 0 && <p className="text-ink/60">لا نتائج مطابقة.</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleChannels.map((c: any) => (
          <Link key={c.id} href={`/channels/${c.id}`} className="block rounded-xl border border-line bg-white/70 p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-3">
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal/10 font-bold text-teal">{c.name.slice(0, 2)}</div>
              )}
              <span className="font-bold">{c.name}</span>
            </div>
            {c.description && <p className="mt-2 text-sm text-ink/60">{c.description}</p>}
            <span className="mt-3 inline-block text-sm font-bold text-teal">فتح صفحة القناة ←</span>
          </Link>
        ))}
      </div>
    </main>
  );
}