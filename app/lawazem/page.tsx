'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function LawazemPage() {
  const router = useRouter();
  const [stage, setStage] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('student_stage');
    if (!saved) {
      router.push('/');
      return;
    }
    setStage(saved);

    async function loadData() {
      const { data, error } = await supabase
        .from('subjects')
        .select('*, lecture_notes(*)')
        .eq('stage', saved);
      if (error) {
        setError(error.message);
      } else {
        setSubjects(data || []);
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-extrabold">خطأ في الاتصال بقاعدة البيانات</h1>
        <p className="mt-2 text-ink/70">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/" className="text-sm text-teal hover:underline">
        ← رجوع للوحة الأقسام
      </Link>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-teal">{stage}</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">الملازم والمصادر</h1>

      <div className="relative mt-6 mb-8 sm:mb-10">
        <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="ابحث باسم الملزمة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-line bg-white px-4 py-3 pr-11 placeholder:text-ink/40 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
      </div>

      {loading && <p className="text-ink/50">جاري تحميل المواد...</p>}
      {!loading && subjects.length === 0 && <p className="text-ink/60">لا توجد مواد بعد لمرحلتك.</p>}

      {subjects.map((s: any) => {
        const filteredNotes = s.lecture_notes.filter((note: any) =>
          note.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
          <section key={s.id} className="mb-6 rounded-xl border border-line bg-white/70 p-5 shadow-sm transition-shadow hover:shadow-md sm:mb-8 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
              <h2 className="text-lg font-extrabold sm:text-xl">{s.name}</h2>
              <span className="font-mono text-xs text-ink/50">{s.stage}</span>
            </div>

            {filteredNotes.length === 0 ? (
              <p className="text-sm text-ink/50">لا توجد ملازم مطابقة.</p>
            ) : (
              <ul className="space-y-3">
                {filteredNotes.map((note: any) => (
                  <li key={note.id}>
                    <a href={note.file_path} target="_blank" rel="noopener noreferrer" className="font-medium underline decoration-teal/40 underline-offset-4 hover:text-teal">{note.title}</a>
                    <div className="mt-0.5 text-sm text-ink/50">
                      {note.professor_name && <span>د. {note.professor_name}</span>}
                      {note.professor_name && note.lecture_number && <span> · </span>}
                      {note.lecture_number && <span>محاضرة {note.lecture_number}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}