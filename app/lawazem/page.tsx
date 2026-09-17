// app/lawazem/page.tsx
'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useRecentViews } from '@/hooks/useRecentViews';
import { Input } from '@/components/ui/Field';
import type { LectureNote, Subject, Track } from '@/lib/types';

type SubjectWithNotes = Subject & { lecture_notes: LectureNote[] };

// ==================== Tag Colors ====================
const TAG_COLORS: Record<string, string> = {
  'نظري': 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  'عملي': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  'محاضرة': 'bg-teal/10 text-teal',
  'ملخص': 'bg-amber/15 text-amber-800 dark:bg-amber/20 dark:text-amber-300',
  'أساسيات': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'مراجعة': 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  'سلايدات': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  'امتحان': 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  'واجب': 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
  'فاينل': 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || 'bg-ink/5 text-ink/60';
}

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
    <svg className={`h-5 w-5 flex-shrink-0 text-ink/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
function IconTelegram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function IconDoctor() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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

function BackLink() {
  return (
    <Link href="/" className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal/70 transition-colors hover:text-teal">
      <span className="transition-transform duration-200 group-hover:translate-x-1"><IconArrowLeft /></span>
      رجوع للوحة الأقسام
    </Link>
  );
}

// ==================== Sorting Helper ====================
function sortNotes(notes: LectureNote[]): LectureNote[] {
  return [...notes].sort((a, b) => {
    const aNum = a.lecture_number ?? Number.POSITIVE_INFINITY;
    const bNum = b.lecture_number ?? Number.POSITIVE_INFINITY;
    if (aNum !== bNum) return aNum - bNum;
    return a.title.localeCompare(b.title, 'ar');
  });
}

// ==================== Doctor Group ====================
interface DoctorGroup {
  name: string;
  notes: LectureNote[];
  totalNotes: number;
  subjectName: string;
}

function groupByDoctor(notes: LectureNote[], subjectName: string): DoctorGroup[] {
  const groups: Record<string, LectureNote[]> = {};
  for (const note of notes) {
    const doctor = note.professor_name?.trim() || 'غير محدد';
    if (!groups[doctor]) groups[doctor] = [];
    groups[doctor].push(note);
  }
  return Object.entries(groups)
    .map(([name, notes]) => ({
      name,
      notes: sortNotes(notes),
      totalNotes: notes.length,
      subjectName,
    }))
    .sort((a, b) => {
      if (a.name === 'غير محدد') return 1;
      if (b.name === 'غير محدد') return -1;
      return a.name.localeCompare(b.name, 'ar');
    });
}

// ==================== Track Badge ====================
function TrackBadge({ track }: { track: Track | null }) {
  if (!track) return null;
  const styles =
    track === 'نظري'
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
      : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300';
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${styles}`}>
      {track}
    </span>
  );
}

// ==================== Doctor Accordion ====================
function DoctorAccordion({
  doctor,
  isOpen,
  onToggle,
}: {
  doctor: DoctorGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const initial = doctor.name === 'غير محدد' ? '?' : doctor.name.trim().charAt(0);

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 dark:bg-paper ${
      isOpen ? 'border-teal/30 shadow-[0_4px_16px_rgba(14,74,74,0.08)]' : 'border-line'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 p-4 text-right transition-colors hover:bg-ink/[0.02]"
      >
        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black transition-all duration-300 ${
          isOpen
            ? 'bg-amber text-ink shadow-[0_4px_14px_rgba(224,166,58,0.30)]'
            : 'bg-amber/15 text-amber-800'
        }`}>
          {doctor.name === 'غير محدد' ? <IconDoctor /> : initial}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-ink">
            {doctor.name === 'غير محدد' ? 'بدون دكتور' : `د. ${doctor.name}`}
          </h3>
          <p className="mt-0.5 text-xs font-bold text-ink/50">
            {doctor.totalNotes} {doctor.totalNotes === 1 ? 'ملزمة' : 'ملازم'}
          </p>
        </div>

        <IconChevron open={isOpen} />
      </button>

      <div className={`grid transition-all duration-300 ease-out ${
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}>
        <div className="overflow-hidden">
          <div className="border-t border-line/60 bg-paper/40 px-4 py-3">
            <ul className="space-y-1.5">
              {doctor.notes.map((note) => (
                <LectureItem
                  key={note.id}
                  note={note}
                  subjectName={doctor.subjectName}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Lecture Item ====================
function LectureItem({ note, subjectName }: { note: LectureNote; subjectName: string }) {
  const { isBookmarked, toggle } = useBookmarks();
  const { addView } = useRecentViews();
  const bookmarked = isBookmarked(note.id);

  const hasLecture = note.lecture_number != null;
  const isTelegram = note.file_path.includes('t.me');
  const noteTags = Array.isArray(note.tags) ? note.tags : [];

  function handleOpen() {
    // تسجيل الزيارة
    addView({
      id: note.id,
      title: note.title,
      subject_name: subjectName,
      file_path: note.file_path,
    });
  }

  return (
    <li>
      <div className="group flex items-start gap-2 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-teal/20 hover:bg-white hover:shadow-[0_2px_8px_rgba(14,74,74,0.06)] dark:hover:bg-paper">
        {/* المحتوى القابل للنقر */}
        <a
          href={note.file_path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpen}
          className="flex min-w-0 flex-1 flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-black transition-all duration-200 ${
              hasLecture
                ? 'bg-teal/10 text-teal group-hover:bg-teal group-hover:text-white'
                : 'bg-ink/5 text-ink/40'
            }`}>
              {hasLecture ? note.lecture_number : '—'}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <IconDoc />
                <span className="truncate font-bold text-ink transition-colors group-hover:text-teal">
                  {note.title}
                </span>
                <TrackBadge track={note.track} />
              </div>
            </div>

            <span className="flex-shrink-0 text-ink/30 transition-all duration-200 group-hover:text-teal group-hover:translate-x-[-2px]">
              {isTelegram ? <IconTelegram /> : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </span>
          </div>

          {noteTags.length > 0 && (
            <div className="flex flex-wrap gap-1 pr-12">
              {noteTags.map((tag, i) => (
                <span
                  key={i}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getTagColor(tag)}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </a>

        {/* زر المفضلة */}
        <button
          type="button"
          onClick={() => toggle(note.id)}
          aria-label={bookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
          title={bookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
          className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 active:scale-95 ${
            bookmarked
              ? 'bg-amber/20 text-amber-700'
              : 'text-ink/30 hover:bg-ink/5 hover:text-ink/60'
          }`}
        >
          <IconBookmark filled={bookmarked} />
        </button>
      </div>
    </li>
  );
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
  const doctorGroups = useMemo(
    () => groupByDoctor(subject.lecture_notes, subject.name),
    [subject.lecture_notes, subject.name]
  );
  const [expandedDoctors, setExpandedDoctors] = useState<Record<string, boolean>>({});

  function toggleDoctor(name: string) {
    setExpandedDoctors((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <div className={`overflow-hidden rounded-3xl border bg-white/80 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm transition-all duration-300 dark:bg-paper/80 ${
      open
        ? 'border-teal/30 shadow-[0_8px_24px_rgba(14,74,74,0.08)]'
        : 'border-line hover:border-teal/20 hover:shadow-[0_4px_16px_rgba(14,74,74,0.06)]'
    }`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-5 text-right transition-colors hover:bg-ink/[0.02]"
      >
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
          open ? 'bg-teal text-white shadow-[0_4px_14px_rgba(14,74,74,0.30)]' : 'bg-teal/8 text-teal'
        }`}>
          <IconFolder open={open} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-extrabold text-ink sm:text-xl">{subject.name}</h2>
          <p className="mt-0.5 text-xs font-bold text-ink/50">
            {notesCount === 0
              ? 'لا توجد ملازم حاليا'
              : `${notesCount} ملزمة · ${doctorGroups.length} ${doctorGroups.length === 1 ? 'دكتور' : 'دكاترة'}`}
          </p>
        </div>

        <IconChevron open={open} />
      </button>

      <div className={`grid transition-all duration-300 ease-out ${
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}>
        <div className="overflow-hidden">
          <div className="space-y-2 border-t border-line/60 bg-paper/40 px-4 py-4">
            {notesCount === 0 ? (
              <p className="py-2 text-center text-sm text-ink/40">لا توجد ملازم لهذه المادة حاليا.</p>
            ) : (
              doctorGroups.map((doc, idx) => (
                <DoctorAccordion
                  key={doc.name}
                  doctor={doc}
                  isOpen={expandedDoctors[doc.name] ?? idx === 0}
                  onToggle={() => toggleDoctor(doc.name)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Page ====================
export default function LawazemPage() {
  const { stage, ready } = useStudentStage();
  const [subjects, setSubjects] = useState<SubjectWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
    return () => {
      cancelled = true;
    };
  }, [stage]);

  // ===== كل الوسوم المتاحة =====
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const s of subjects) {
      for (const n of s.lecture_notes) {
        if (Array.isArray(n.tags)) {
          for (const t of n.tags) tagSet.add(t);
        }
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [subjects]);

  // ===== فلترة (بحث + وسم) =====
  const filteredSubjects = useMemo(() => {
    return subjects.map((s) => ({
      ...s,
      lecture_notes: s.lecture_notes.filter((n) => {
        const noteTags = Array.isArray(n.tags) ? n.tags : [];

        // فلترة بالوسم
        if (selectedTag && !noteTags.includes(selectedTag)) return false;

        // فلترة بالبحث
        if (term) {
          const inTitle = n.title.toLowerCase().includes(term);
          const inDoctor = n.professor_name?.toLowerCase().includes(term) ?? false;
          const inTrack = n.track?.toLowerCase().includes(term) ?? false;
          const inTags = noteTags.some((t) => t.toLowerCase().includes(term));
          if (!inTitle && !inDoctor && !inTrack && !inTags) return false;
        }

        return true;
      }),
    }));
  }, [subjects, term, selectedTag]);

  const totalNotes = useMemo(
    () => subjects.reduce((sum, s) => sum + s.lecture_notes.length, 0),
    [subjects]
  );

  const forceOpenIds = useMemo(() => {
    if (!term && !selectedTag) return new Set<string>();
    return new Set(filteredSubjects.filter((s) => s.lecture_notes.length > 0).map((s) => s.id));
  }, [term, selectedTag, filteredSubjects]);

  const visibleCount = useMemo(
    () => filteredSubjects.reduce((sum, s) => sum + s.lecture_notes.length, 0),
    [filteredSubjects]
  );

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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
            <span className="font-bold text-teal">{totalNotes}</span> ملزمة موزعة على{' '}
            <span className="font-bold text-teal">{subjects.length}</span> مادة
          </p>
        )}
      </div>

      {/* البحث */}
      {totalNotes > 0 && (
        <div className="relative mt-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <IconSearch />
          <Input
            type="text"
            placeholder="ابحث باسم الملزمة، الدكتور، أو وسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-3 pr-11 shadow-[0_2px_8px_rgba(26,33,31,0.04)]"
            aria-label="بحث في الملازم"
          />
        </div>
      )}

      {/* فلترة بالوسوم */}
      {allTags.length > 0 && (
        <div
          className="mt-4 mb-8 flex flex-wrap items-center gap-1.5 animate-slide-up"
          style={{ animationDelay: '150ms' }}
        >
          <span className="text-xs font-bold text-ink/50">تصفية:</span>
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-150 active:scale-95 ${
              !selectedTag
                ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.20)]'
                : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
            }`}
          >
            الكل
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.20)]'
                    : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
                }`}
              >
                #{tag}
                {isSelected && <IconClose />}
              </button>
            );
          })}
        </div>
      )}

      {loading && <Skeleton />}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 text-red-600/80">{error}</p>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <IconEmpty />
          <p className="mt-4 font-bold text-ink/70">لا توجد مواد مضافة لمرحلتك لسا.</p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (term || selectedTag) && visibleCount === 0 && (
        <div className="rounded-3xl border border-line bg-white/80 p-10 text-center backdrop-blur-sm animate-slide-up dark:bg-paper/80">
          <IconSearch />
          <p className="mt-4 font-bold text-ink/70">لا نتائج مطابقة</p>
          <p className="mt-1 text-sm text-ink/50">
            {selectedTag ? `الوسم: #${selectedTag}` : `البحث: «${searchTerm}»`}
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {filteredSubjects.map((s, idx) => {
            if ((term || selectedTag) && s.lecture_notes.length === 0) return null;
            return (
              <div key={s.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-slide-up">
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