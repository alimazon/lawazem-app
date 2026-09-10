'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function SchedulePage() {
  const router = useRouter();
  const [stage, setStage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('student_stage');
    if (!saved) {
      router.push('/');
      return;
    }
    setStage(saved);

    async function loadData() {
      const { data, error } = await supabase.from('schedules').select('image_url').eq('stage', saved).single();
      if (error) {
        setError(error.message);
      } else {
        setImageUrl(data?.image_url || null);
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/" className="text-sm text-teal hover:underline">
        ← رجوع للوحة الأقسام
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-teal">{stage}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">جدول المحاضرات</h1>

      {loading && <p className="mt-6 text-ink/50">جاري التحميل...</p>}
      {!loading && error && <p className="mt-6 text-red-600">{error}</p>}
      {!loading && !error && !imageUrl && <p className="mt-6 text-ink/60">ما فيه جدول مرفوع لمرحلتك لسا.</p>}
      {!loading && !error && imageUrl && (
        <img src={imageUrl} alt={`جدول ${stage}`} className="mt-6 w-full rounded-xl border border-line shadow-sm" />
      )}
    </main>
  );
}