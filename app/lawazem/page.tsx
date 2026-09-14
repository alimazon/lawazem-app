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
function IconFolder({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18" />
    </svg>
  ) : (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 flex-shrink-0 text-ink/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
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
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-3xl border border-line bg-white/80 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
            <div className="h-5 w-40 skeleton-shimmer rounded" />
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

// ==================== Sorting Helper ====================
/**
 * يرتب الملازم حسب رقم المحاضرة (تصاعديًا).
 * الملازم بدون رقم محاضرة تذهب إلى النهاية، مرتّبة بالعنوان.
 */
function sortNotes(notes: LectureNote[]): LectureNote[] {
  return [...notes].sort((a, b) => {
    const aNum = a.lecture_number ?? Number.POSITIVE_INFINITY;
    const bNum = b.lecture_number ?? Number.POSITIVE_INFINITY;
    if (aNum !== bNum) return aNum - bNum;
    return a.title.localeCompare(b.title, 'ar');
  });
}

// ==================== Subject Folder ====================
function SubjectFolder({
  subject,
  isOpen,
  onToggle,
  forceOpen,
}: {
  subject: SubjectWithNotes;
  isOpen: boolean;
  onToggle: () => void;
  forceOpen: boolean;
}) {
  const notesCount = subject.lecture_notes.length;
  const open = isOpen || forceOpen;
  const sortedNotes = useMemo(() => sortNotes(subject.lecture_notes), [subject.lecture_notes]);

  return (
    <div
      className={`overflow-hidden rounded-3xl border bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 ${
        open ? 'border-teal/30 shadow-[0_8px_24px_rgba(14,74,74,0.08)]' : 'border-line hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)]'
      }`}
    >
      {/* رأس المجلد */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-right transition-colors hover:bg-ink/[0.02]"
      >
        <span
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
            open
              ? 'bg-teal text-white shadow-[0_4px_14px_rgba(14,74,74,0.30)]'
              : 'bg-teal/8 text-teal'
          }`}
        >
          <IconFolder open={open} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-extrabold text-ink sm:text-xl">
            {subject.name}
          </h2>
          <p className="mt-0.5 text-xs font-bold text-ink/50">
            {notesCount === 0
              ? 'لا توجد ملازم حاليا'
              : notesCount === 1
              ? 'ملزمة وحدة'
              : `${notesCount} ملزمة`}
          </p>
        </div>

        <IconChevron open={open} />
      </button>

      {/* المحتوى */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-line/60 bg-paper/40 px-5 py-4">
            {notesCount === 0 ? (
              <p className="text-center text-sm text-ink/40 py-2">
                لا توجد ملازم لهذه المادة حاليا.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {sortedNotes.map((note) => (
                  <LectureItem key={note.id} note={note} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Lecture Item ====================
function LectureItem({ note }: { note: LectureNote }) {
  const hasLecture = note.lecture_number != null;
  const hasProfessor = !!note.professor_name;
  const isTelegram = note.file_path.includes('t.me');

  return (
    <li>
      <a
        href={note.file_path}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-teal/20 hover:bg-white hover:shadow-[0_2px_8px_rgba(14,74,74,0.06)]"
      >
        {/* Badge رقم المحاضرة */}
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-black transition-all duration-200 ${
            hasLecture
              ? 'bg-teal/10 text-teal group-hover:bg-teal group-hover:text-white'
              : 'bg-ink/5 text-ink/40'
          }`}
        >
          {hasLecture ? note.lecture_number : '—'}
        </span>

        {/* المحتوى */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <IconDoc />
            <span className="truncate font-bold text-ink transition-colors group-hover:text-teal">
              {note.title}
            </span>
          </div>
          {hasProfessor && (
            <p className="mt-0.5 truncate text-xs text-ink/50">
              د. {note.professor_name}
            </p>
          )}
        </div>

        {/* أيقونة خارجية حسب النوع */}
        <span className="flex-shrink-0 text-ink/30 transition-all duration-200 group-hover:text-teal group-hover:translate-x-[-2px]">
          {isTelegram ? (
            // أيقونة تيليجرام
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          ) : (
            // أيقونة رابط خارجي
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          )}
        </span>
      </a>
    </li>
  );
}

// ==================== Page ====================
export default function LawazemPage() {
  const { stage, ready } = useStudentStage();
  const [subjects, setSubjects] = useState<SubjectWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const deferredSearch = useDeferredValue(searchTerm);
  const term = deferredSearch.trim().toLowerCase();

  // ===== تحميل البيانات =====
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

  // ===== فلترة بالبحث =====
  const filteredSubjects = useMemo(() => {
    if (!term) return subjects;
    return subjects.map((s) => ({
      ...s,
      lecture_notes: s.lecture_notes.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          (n.professor_name && n.professor_name.toLowerCase().includes(term))
      ),
    }));
  }, [subjects, term]);

  // ===== إحصائيات =====
  const totalNotes = useMemo(
    () => subjects.reduce((sum, s) => sum + s.lecture_notes.length, 0),
    [subjects]
  );

  // ===== عند البحث: افتح كل المجلدات اللي فيها نتائج =====
  const forceOpenIds = useMemo(() => {
    if (!term) return new Set<string>();
    return new Set(
      filteredSubjects.filter((s) => s.lecture_notes.length > 0).map((s) => s.id)
    );
  }, [term, filteredSubjects]);

  // ===== عدد النتائج الظاهرة =====
  const visibleCount = useMemo(
    () => filteredSubjects.reduce((sum, s) => sum + s.lecture_notes.length, 0),
    [filteredSubjects]
  );

  // ===== Toggle =====
  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // ===== عرض =====
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

      {/* Header */}
      <div className="mt-6 animate-slide-up">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {stage}
        </span>
        <h1 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">
          الملازم والمصادر
        </h1>
        {!loading && totalNotes > 0 && (
          <p className="mt-2 text-sm text-ink/50">
            <span className="font-bold text-teal">{totalNotes}</span> ملزمة موزعة على{' '}
            <span className="font-bold text-teal">{subjects.length}</span> مادة — اضغط على أي مجلد لفتحه
          </p>
        )}
      </div>

      {/* البحث */}
      {totalNotes > 0 && (
        <div className="relative mt-6 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <IconSearch />
          <Input
            type="text"
            placeholder="ابحث باسم الملزمة أو الدكتور..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-11 shadow-[0_2px_8px_rgba(26,33,31,0.04)]"
            aria-label="بحث في الملازم"
          />
        </div>
      )}

      {/* Skeleton */}
      {loading && <Skeleton />}

      {/* خطأ */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80">{error}</p>
        </div>
      )}

      {/* لا توجد مواد */}
      {!loading && !error && subjects.length === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <IconEmpty />
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك حاليا.</p>
          <p className="mt-1 text-sm text-ink/50">تفقدها لاحقًا</p>
        </div>
      )}

      {/* لا توجد نتائج بحث */}
      {!loading && !error && subjects.length > 0 && term && visibleCount === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا نتائج مطابقة</p>
          <p className="mt-1 text-sm text-ink/50">&laquo;{searchTerm}&raquo;</p>
        </div>
      )}

      {/* المجلدات */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredSubjects.map((s, idx) => {
            // في وضع البحث: اخفِ المجلدات اللي لا توجدا نتائج
            if (term && s.lecture_notes.length === 0) return null;

            return (
              <div
                key={s.id}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="animate-slide-up"
              >
                <SubjectFolder
                  subject={s}
                  isOpen={!!expanded[s.id]}
                  onToggle={() => toggle(s.id)}
                  forceOpen={forceOpenIds.has(s.id)}
                />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}