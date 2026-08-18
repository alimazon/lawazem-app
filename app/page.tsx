'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('subjects')
        .select('*, lecture_notes(*, exam_questions(*)), professor_focus_notes(*)');
      if (error) {
        setError(error.message);
      } else {
        setSubjects(data || []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

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
      <p className="font-mono text-xs uppercase tracking-widest text-teal">كلية طب جامعة العميد</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">الملازم والمصادر</h1>

      <div className="relative mt-6 mb-8 sm:mb-10">
        <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="ابحث باسم الملزمة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-line bg-white px-4 py-3 pr-11 placeholder:text-ink/40 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20" />
      </div>

      {loading && <p className="text-ink/50">جاري تحميل المواد...</p>}
      {!loading && subjects.length === 0 && <p className="text-ink/60">لا توجد مواد بعد.</p>}

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

            <h3 className="mb-2 text-sm font-bold text-teal">الملازم</h3>
            {filteredNotes.length === 0 ? (
              <p className="mb-6 text-sm text-ink/50">لا توجد ملازم مطابقة.</p>
            ) : (
              <ul className="mb-6 space-y-3">
                {filteredNotes.map((note: any) => (
                  <li key={note.id}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a href={note.file_path} target="_blank" rel="noopener noreferrer" className="font-medium underline decoration-teal/40 underline-offset-4 hover:text-teal">{note.title}</a>
                      <a href={`/study/${note.id}`} className="rounded-full bg-amber/20 px-3 py-1 text-xs font-bold text-ink hover:bg-amber/30">بطاقات مذاكرة</a>
                    </div>
                    {note.exam_questions.length > 0 && (
                      <ul className="mt-2 space-y-1 border-r-2 border-line pr-4">
                        {note.exam_questions.map((q: any) => (
                          <li key={q.id} className="text-sm text-ink/60">
                            {q.question_text}
                            {q.exam_term && <span className="mr-2 rounded bg-ink/5 px-1.5 py-0.5 font-mono text-xs text-ink/50">{q.exam_term}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mb-2 text-sm font-bold text-teal">ملاحظات تركيز الدكاترة</h3>
            {s.professor_focus_notes.length === 0 ? (
              <p className="text-sm text-ink/50">لا توجد ملاحظات معتمدة بعد.</p>
            ) : (
              <ul className="space-y-2">
                {s.professor_focus_notes.map((n: any) => (
                  <li key={n.id} className="relative rounded-md bg-amber/15 py-2 pl-3 pr-5">
                    <span className="absolute right-0 top-0 h-full w-1.5 rounded-r-md bg-amber" />
                    <strong>{n.professor_name}</strong>
                    <span className="text-ink/80"> — {n.notes_text}</span>
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