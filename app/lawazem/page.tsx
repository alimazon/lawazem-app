// app/lawazem/page.tsx
'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Input } from '@/components/ui/Field';
import type { LectureNote, Subject } from '@/lib/types';

type SubjectWithNotes = Subject & { lecture_notes: LectureNote[] };

// ==================== Icons ====================
function IconSearch() {
  return (
    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconEmpty() {
  return (
    <svg className="mx-auto h-12 w-12 text-ink/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-3xl border border-line bg-white/80 p-6 backdrop-blur-sm">
          <div className="mb-4 h-6 w-40 skeleton-shimmer rounded" />
          <div className="space-y-3">
            <div className="h-4 w-3/4 skeleton-shimmer rounded" />
            <div className="h-4 w-2/3 skeleton-shimmer rounded" />
            <div className="h-4 w-1/2 skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Back Link ====================
function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع للوحة الأقسام
    </Link>
  );
}

// ==================== Page ====================
export default function LawazemPage() {
  const { stage, ready } = useStudentStage();
  const [subjects, setSubjects] = useState<SubjectWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const deferredSearch = useDeferredValue(searchTerm);
  const term = deferredSearch.trim().toLowerCase();

  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('*, lecture_notes(*)')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setSubjects([]);
      } else {
        setSubjects((data ?? []) as SubjectWithNotes[]);
      }
      setLoading(false);
    }
    loadData();
    return () => { cancelled = true; };
  }, [stage]);

  const filteredSubjects = useMemo(() => {
    if (!term) return subjects;
    return subjects.map((s) => ({
      ...s,
      lecture_notes: s.lecture_notes.filter((n) => n.title.toLowerCase().includes(term)),
    }));
  }, [subjects, term]);

  const totalNotes = useMemo(() => subjects.reduce((sum, s) => sum + s.lecture_notes.length, 0), [subjects]);
  const visibleCount = useMemo(() => filteredSubjects.reduce((sum, s) => sum + s.lecture_notes.length, 0), [filteredSubjects]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <BackLink />

      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">الملازم والمصادر</h1>
        {!loading && totalNotes > 0 && (
          <p className="mt-2 text-sm text-ink/50">
            <span className="font-bold text-teal">{totalNotes}</span> ملزمة موزعة على <span className="font-bold text-teal">{subjects.length}</span> مادة
          </p>
        )}
      </div>

      {totalNotes > 0 && (
        <div className="relative mt-6 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <IconSearch />
          <Input
            type="text"
            placeholder="ابحث باسم الملزمة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-11 shadow-[0_2px_8px_rgba(26,33,31,0.04)]"
            aria-label="بحث في الملازم"
          />
        </div>
      )}

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80">{error}</p>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <IconEmpty />
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك حاليا.</p>
          <p className="mt-1 text-sm text-ink/50">تفقدها لاحقًا</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && visibleCount === 0 && (
        <div className="mt-6 rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا نتائج مطابقة</p>
          <p className="mt-1 text-sm text-ink/50">&laquo;{searchTerm}&raquo;</p>
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 space-y-5">
          {filteredSubjects.map((s, idx) => {
            if (term && s.lecture_notes.length === 0) return null;
            return (
              <section
                key={s.id}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="group overflow-hidden rounded-3xl border border-line bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-teal/20 hover:shadow-[0_8px_24px_rgba(14,74,74,0.08)] animate-slide-up"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 px-6 py-4">
                  <h2 className="text-lg font-extrabold text-ink sm:text-xl">{s.name}</h2>
                  <span className="rounded-full bg-teal/8 px-2.5 py-0.5 font-mono text-xs text-teal/70">{s.stage}</span>
                </div>

                <div className="p-6">
                  {s.lecture_notes.length === 0 ? (
                    <p className="text-sm text-ink/40">لا توجد ملازم لهذه المادة حاليا.</p>
                  ) : (
                    <ul className="space-y-3">
                      {s.lecture_notes.map((note) => {
                        const hasProfessor = !!note.professor_name;
                        const hasLecture = note.lecture_number != null;
                        return (
                          <li key={note.id} className="group/item">
                            <a
                              href={note.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-3 rounded-xl border border-transparent p-3 -m-3 transition-all duration-200 hover:border-teal/20 hover:bg-teal/[0.03]"
                            >
                              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal/8 transition-all duration-200 group-hover/item:bg-teal/15">
                                <IconDoc />
                              </span>
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-ink transition-colors group-hover/item:text-teal">
                                  {note.title}
                                </span>
                                {(hasProfessor || hasLecture) && (
                                  <p className="mt-0.5 text-sm text-ink/50">
                                    {hasProfessor && <span>د. {note.professor_name}</span>}
                                    {hasProfessor && hasLecture && <span> · </span>}
                                    {hasLecture && <span>محاضرة {note.lecture_number}</span>}
                                  </p>
                                )}
                              </div>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}