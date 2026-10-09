// app/lawazem/page.tsx
'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useRecentViews } from '@/hooks/useRecentViews';
import { Input } from '@/components/ui/Field';
import { ReportModal } from '@/components/ReportModal';
import { PullToRefresh } from '@/components/PullToRefresh';
import { postJson } from '@/lib/api-client';
import {
  IconArrowRight,
  IconBook,
  IconBookmark,
  IconClose,
  IconDoc,
  IconFlag,
  IconInbox,
  IconSearch,
  IconTelegram,
} from '@/components/ui/Icons';
import type { LectureNote, Track } from '@/lib/types';

// ==================== Types ====================
interface LatestNote {
  title: string;
  professor: string | null;
  createdAt: string | null;
}

interface SubjectMeta {
  id: string;
  name: string;
  units: number | null;
  noteCount: number;
  latest: LatestNote | null;
}

interface DoctorGroup {
  name: string;
  notes: LectureNote[];
}

const NO_DOCTOR = 'غير محدد';

// ==================== Track View (fire-and-forget) ====================
function trackView(noteId: string) {
  try {
    const payload = JSON.stringify({ action: 'increment', note_id: noteId });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/views', blob);
    } else {
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* تجاهل */
  }
}

// ==================== Helpers ====================
const rtf =
  typeof Intl !== 'undefined' && 'RelativeTimeFormat' in Intl
    ? new Intl.RelativeTimeFormat('ar-u-nu-latn', { numeric: 'auto' })
    : null;

function timeAgo(iso: string | null | undefined): string {
  if (!iso || !rtf) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const days = Math.floor((Date.now() - t) / 86_400_000);
  if (days < 1) return 'اليوم';
  if (days < 7) return rtf.format(-days, 'day');
  if (days < 30) return rtf.format(-Math.floor(days / 7), 'week');
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month');
  return rtf.format(-Math.floor(days / 365), 'year');
}

/** ألوان أيقونات المواضيع (مثل Topics في تيليجرام) */
const TOPIC_COLORS: readonly string[] = [
  'bg-teal/15 text-teal',
  'bg-gold/15 text-gold-ink',
  'bg-success/15 text-success-ink',
  'bg-navy/15 text-navy-ink',
  'bg-warning/20 text-warning-ink',
];

function topicColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TOPIC_COLORS[h % TOPIC_COLORS.length];
}

function topicInitial(name: string): string {
  const clean = name.trim().replace(/^ال/, '');
  return (clean || name.trim()).charAt(0) || '؟';
}

function countLabel(n: number): string {
  return `${n} ${n === 1 ? 'ملزمة' : 'ملازم'}`;
}

function noteMatches(
  note: LectureNote,
  term: string,
  tag: string | null,
): boolean {
  const noteTags = Array.isArray(note.tags) ? note.tags : [];
  if (tag && !noteTags.includes(tag)) return false;
  if (term) {
    const lower = term.toLowerCase();
    const inTitle = note.title.toLowerCase().includes(lower);
    const inDoctor =
      note.professor_name?.toLowerCase().includes(lower) ?? false;
    const inTrack = note.track?.toLowerCase().includes(lower) ?? false;
    const inTags = noteTags.some((t) => t.toLowerCase().includes(lower));
    if (!inTitle && !inDoctor && !inTrack && !inTags) return false;
  }
  return true;
}

function sortNotes(notes: LectureNote[]): LectureNote[] {
  return [...notes].sort((a, b) => {
    const aNum = a.lecture_number ?? Number.POSITIVE_INFINITY;
    const bNum = b.lecture_number ?? Number.POSITIVE_INFINITY;
    if (aNum !== bNum) return aNum - bNum;
    return a.title.localeCompare(b.title, 'ar');
  });
}

function groupByDoctor(notes: LectureNote[]): DoctorGroup[] {
  const groups: Record<string, LectureNote[]> = {};
  for (const note of notes) {
    const doctor = note.professor_name?.trim() || NO_DOCTOR;
    (groups[doctor] ??= []).push(note);
  }
  return Object.entries(groups)
    .map(([name, list]) => ({ name, notes: sortNotes(list) }))
    .sort((a, b) => {
      if (a.name === NO_DOCTOR) return 1;
      if (b.name === NO_DOCTOR) return -1;
      return a.name.localeCompare(b.name, 'ar');
    });
}

function doctorLabel(name: string): string {
  return name === NO_DOCTOR ? 'بدون دكتور' : `د. ${name}`;
}

// ==================== Skeletons ====================
function TopicsSkeleton() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-12 w-12 flex-shrink-0 skeleton-shimmer rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 skeleton-shimmer rounded" />
            <div className="h-3 w-4/5 skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesSkeleton() {
  return (
    <div className="space-y-3 p-3 sm:p-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex gap-3 rounded-2xl rounded-ss-md border border-line bg-paper-soft p-3"
        >
          <div className="h-11 w-11 flex-shrink-0 skeleton-shimmer rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-3/4 skeleton-shimmer rounded" />
            <div className="h-3 w-1/3 skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Topic Avatar ====================
function TopicAvatar({
  subject,
  className = 'h-12 w-12 text-lg',
}: {
  subject: SubjectMeta;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-display font-bold ${topicColor(
        subject.id,
      )} ${className}`}
    >
      {topicInitial(subject.name)}
    </span>
  );
}

// ==================== Topic Row (قائمة المواضيع) ====================
function TopicRow({
  subject,
  active,
  count,
  isResultCount,
  onOpen,
}: {
  subject: SubjectMeta;
  active: boolean;
  count: number;
  isResultCount: boolean;
  onOpen: () => void;
}) {
  const { latest } = subject;
  const when = timeAgo(latest?.createdAt);

  let preview = 'لا توجد ملازم بعد';
  if (isResultCount) {
    preview = `${count} ${count === 1 ? 'نتيجة مطابقة' : 'نتائج مطابقة'}`;
  } else if (latest) {
    const prof = latest.professor?.trim();
    preview = `${prof ? `د. ${prof}: ` : ''}${latest.title}`;
  }

  return (
    <li className="[&:last-child_.row-line]:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? 'true' : undefined}
        className={`flex w-full items-center gap-3 ps-4 text-start transition-colors duration-150 hover:bg-ink/[0.04] active:bg-ink/[0.07] focus-visible:outline-offset-[-2px] ${
          active ? 'bg-teal/10 hover:bg-teal/10' : ''
        }`}
      >
        <TopicAvatar subject={subject} />

        <div className="row-line min-w-0 flex-1 border-b border-line-soft py-3 pe-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="truncate font-display text-[15px] font-bold text-ink">
              {subject.name}
            </h2>
            {when && !isResultCount && (
              <span className="flex-shrink-0 text-[11px] text-ink-muted">
                {when}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="truncate text-[13px] text-ink-muted">{preview}</p>
            {count > 0 && (
              <span
                className={`num flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  active ? 'bg-teal text-on-teal' : 'bg-teal/15 text-teal'
                }`}
              >
                {count}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

// ==================== Note Bubble (الملزمة كرسالة) ====================
function NoteBubble({
  note,
  subjectName,
  reportCount,
  onReport,
}: {
  note: LectureNote;
  subjectName: string;
  reportCount: number;
  onReport: () => void;
}) {
  const { isBookmarked, toggle } = useBookmarks();
  const { addView } = useRecentViews();
  const bookmarked = isBookmarked(note.id);

  const hasLecture = note.lecture_number != null;
  const isTelegram = note.file_path.includes('t.me');
  const noteTags = Array.isArray(note.tags) ? note.tags : [];

  function handleOpen() {
    addView({
      id: note.id,
      title: note.title,
      subject_name: subjectName,
      file_path: note.file_path,
    });
    trackView(note.id);
  }

  return (
    <li className="defer-item">
      <div className="max-w-full rounded-2xl rounded-ss-md border border-line bg-paper-soft p-2.5 shadow-xs md:max-w-xl">
        <a
          href={note.file_path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpen}
          className="group flex items-start gap-3 rounded-xl p-1 transition-colors hover:bg-ink/[0.03]"
        >
          <span
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
              hasLecture
                ? 'num bg-teal text-base font-bold text-on-teal'
                : 'bg-teal/15 text-teal'
            }`}
          >
            {hasLecture ? note.lecture_number : <IconDoc className="h-5 w-5" />}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold leading-snug text-ink group-hover:text-teal">
              {note.title}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
              {note.track && <TrackText track={note.track} />}
              {note.year != null && <span className="num">{note.year}</span>}
              {isTelegram && (
                <span className="inline-flex items-center gap-1">
                  <IconTelegram className="h-3 w-3" />
                  تيليجرام
                </span>
              )}
            </span>
          </span>
        </a>

        {noteTags.length > 0 && (
          <p className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 px-1 text-xs font-medium text-teal">
            {noteTags.map((tag, i) => (
              <span key={`${tag}-${i}`}>#{tag}</span>
            ))}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-1 border-t border-line-soft pt-1">
          {reportCount >= 3 && (
            <span
              className="inline-flex items-center gap-1 rounded-chip bg-coral/15 px-2 py-0.5 text-[11px] font-bold text-coral-ink"
              title={`${reportCount} بلاغ`}
            >
              <IconFlag className="h-3 w-3" />
              <span className="num">{reportCount}</span>
            </span>
          )}

          <div className="ms-auto flex items-center">
            <button
              type="button"
              onClick={() => toggle(note.id)}
              aria-label={bookmarked ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
              aria-pressed={bookmarked}
              className={`flex h-10 w-10 items-center justify-center rounded-full active:scale-95 ${
                bookmarked
                  ? 'text-gold-ink'
                  : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
              }`}
            >
              <IconBookmark filled={bookmarked} className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={onReport}
              aria-label="بلّغ عن مشكلة"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-ink/5 hover:text-gold-ink active:scale-95"
            >
              <IconFlag className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function TrackText({ track }: { track: Track }) {
  return (
    <span
      className={`font-bold ${track === 'نظري' ? 'text-teal' : 'text-gold-ink'}`}
    >
      {track}
    </span>
  );
}

// ==================== Topic Pane (محتوى الموضوع) ====================
function TopicPane({
  subject,
  notes,
  isLoaded,
  isLoading,
  isFiltering,
  filterLabel,
  onClearFilter,
  reportCounts,
  onReport,
  onBack,
}: {
  subject: SubjectMeta;
  notes: LectureNote[];
  isLoaded: boolean;
  isLoading: boolean;
  isFiltering: boolean;
  filterLabel: string;
  onClearFilter: () => void;
  reportCounts: Record<string, number>;
  onReport: (note: LectureNote) => void;
  onBack: () => void;
}) {
  const [doctor, setDoctor] = useState<string | null>(null);

  const groups = useMemo(() => groupByDoctor(notes), [notes]);
  const activeDoctor =
    doctor && groups.some((g) => g.name === doctor) ? doctor : null;
  const visibleGroups = activeDoctor
    ? groups.filter((g) => g.name === activeDoctor)
    : groups;

  const subtitle = isLoaded
    ? notes.length === 0
      ? 'لا توجد ملفات'
      : `${countLabel(notes.length)} · ${groups.length} ${
          groups.length === 1 ? 'دكتور' : 'دكاترة'
        }`
    : countLabel(subject.noteCount);

  return (
    <div className="flex min-h-0 flex-1 flex-col md:overflow-y-auto md:bg-paper">
      {/* ===== رأس الموضوع ===== */}
      <header className="nav-glass sticky top-[var(--nav-h)] z-[var(--z-sticky)] md:top-0">
        <div className="flex items-center gap-2 px-2 py-2 sm:px-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="رجوع إلى المواضيع"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 md:hidden"
          >
            <IconArrowRight className="h-5 w-5" />
          </button>

          <TopicAvatar subject={subject} className="h-10 w-10 text-base" />

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-base font-bold text-ink">
              {subject.name}
            </h2>
            <p className="truncate text-xs text-ink-muted">{subtitle}</p>
          </div>
        </div>

        {(groups.length > 1 || isFiltering) && (
          <div className="flex items-center gap-2 overflow-x-auto px-3 pb-2 scrollbar-none">
            {isFiltering && (
              <button
                type="button"
                onClick={onClearFilter}
                data-compact
                className="inline-flex min-h-8 flex-shrink-0 items-center gap-1 rounded-chip border border-teal/40 bg-teal/10 px-3 py-1.5 text-xs font-bold text-teal active:scale-95"
              >
                {filterLabel}
                <IconClose className="h-3 w-3" />
              </button>
            )}
            {groups.length > 1 && (
              <>
                <Chip
                  active={activeDoctor === null}
                  onClick={() => setDoctor(null)}
                >
                  الكل
                </Chip>
                {groups.map((g) => (
                  <Chip
                    key={g.name}
                    active={activeDoctor === g.name}
                    onClick={() =>
                      setDoctor(activeDoctor === g.name ? null : g.name)
                    }
                  >
                    {doctorLabel(g.name)}
                    <span className="num ms-1 opacity-70">{g.notes.length}</span>
                  </Chip>
                ))}
              </>
            )}
          </div>
        )}
      </header>

      {/* ===== الرسائل (الملازم) ===== */}
      {!isLoaded && isLoading && <NotesSkeleton />}

      {isLoaded && notes.length === 0 && (
        <div className="px-6 py-16 text-center">
          <IconInbox className="mx-auto h-10 w-10 text-ink-muted/40" />
          <p className="mt-3 text-sm font-bold text-ink-soft">
            {isFiltering ? 'لا توجد نتائج في هذا الموضوع' : 'لا توجد ملفات حالياً'}
          </p>
        </div>
      )}

      {isLoaded && notes.length > 0 && (
        <div className="space-y-5 px-3 py-4 pb-24 sm:px-4 md:pb-6">
          {visibleGroups.map((g) => (
            <section key={g.name} aria-label={doctorLabel(g.name)}>
              <div className="mb-3 flex justify-center">
                <span className="rounded-chip bg-ink/[0.07] px-3 py-1 text-xs font-bold text-ink-soft dark:bg-white/10">
                  {doctorLabel(g.name)}
                </span>
              </div>
              <ul className="space-y-2">
                {g.notes.map((note) => (
                  <NoteBubble
                    key={note.id}
                    note={note}
                    subjectName={subject.name}
                    reportCount={reportCounts[note.id] ?? 0}
                    onReport={() => onReport(note)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-compact
      className={`inline-flex min-h-8 flex-shrink-0 items-center whitespace-nowrap rounded-chip px-3 py-1.5 text-xs font-bold active:scale-95 ${
        active
          ? 'bg-teal text-on-teal'
          : 'bg-ink/5 text-ink-soft hover:bg-ink/10'
      }`}
    >
      {children}
    </button>
  );
}

// ==================== Page ====================
export default function LawazemPage() {
  const { stage, ready } = useStudentStage();

  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [notesBySubject, setNotesBySubject] = useState<
    Map<string, LectureNote[]>
  >(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [reportingNote, setReportingNote] = useState<LectureNote | null>(null);

  const [eagerLoading, setEagerLoading] = useState(false);
  const [eagerLoaded, setEagerLoaded] = useState(false);

  // Pull-to-refresh state
  const [reloadKey, setReloadKey] = useState(0);
  const [silentReload, setSilentReload] = useState(false);
  const refreshResolverRef = useRef<(() => void) | null>(null);

  const notesRef = useRef<Map<string, LectureNote[]>>(new Map());
  const loadingRef = useRef<Set<string>>(new Set());

  const pendingReportIdsRef = useRef<Set<string>>(new Set());
  const reportTimerRef = useRef<number | null>(null);
  const autoOpenedRef = useRef(false);
  // رقم دورة التحميل: يُبطل نتائج الطلبات القديمة عند إعادة التحميل
  const loadGenRef = useRef(0);
  const eagerStartedRef = useRef(false);

  const deferredSearch = useDeferredValue(searchTerm);
  const term = deferredSearch.trim().toLowerCase();
  const isFiltering = term !== '' || selectedTag !== null;

  // ==================== Initial load ====================
  useEffect(() => {
    if (!stage) return;
    let cancelled = false;
    const isSilent = silentReload;

    function settleRefresh() {
      if (refreshResolverRef.current) {
        const resolve = refreshResolverRef.current;
        refreshResolverRef.current = null;
        resolve();
      }
    }

    async function loadInitial() {
      if (!isSilent) setLoading(true);
      setError('');

      loadGenRef.current += 1;
      eagerStartedRef.current = false;
      notesRef.current = new Map();
      loadingRef.current = new Set();
      setNotesBySubject(new Map());
      setLoadingIds(new Set());
      setEagerLoaded(false);
      setEagerLoading(false);
      setReportCounts({});

      const { data: subjectsData, error: subjectsErr } = await supabase
        .from('subjects')
        .select('id, name, units')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;

      if (subjectsErr) {
        setError(subjectsErr.message);
        setSubjects([]);
        setAllTags([]);
        setLoading(false);
        setSilentReload(false);
        settleRefresh();
        return;
      }

      const rawSubjects = (subjectsData ?? []) as Array<{
        id: string;
        name: string;
        units: number | null;
      }>;

      if (rawSubjects.length === 0) {
        setSubjects([]);
        setAllTags([]);
        setLoading(false);
        setSilentReload(false);
        settleRefresh();
        return;
      }

      const ids = rawSubjects.map((s) => s.id);

      // نجلب بيانات خفيفة تكفي للعدّاد ومعاينة "آخر ملزمة"
      const { data: metaData } = await supabase
        .from('lecture_notes')
        .select('subject_id, tags, title, professor_name, created_at')
        .in('subject_id', ids)
        .limit(2000);

      if (cancelled) return;

      const countMap = new Map<string, number>();
      const latestMap = new Map<string, LatestNote>();
      const tagSet = new Set<string>();

      for (const row of (metaData ?? []) as Array<{
        subject_id: string;
        tags: string[] | null;
        title: string;
        professor_name: string | null;
        created_at: string | null;
      }>) {
        countMap.set(row.subject_id, (countMap.get(row.subject_id) ?? 0) + 1);

        const cur = latestMap.get(row.subject_id);
        if (!cur || (row.created_at ?? '') >= (cur.createdAt ?? '')) {
          latestMap.set(row.subject_id, {
            title: row.title,
            professor: row.professor_name,
            createdAt: row.created_at,
          });
        }

        if (Array.isArray(row.tags)) {
          for (const t of row.tags) tagSet.add(t);
        }
      }

      setSubjects(
        rawSubjects.map((s) => ({
          id: s.id,
          name: s.name,
          units: s.units,
          noteCount: countMap.get(s.id) ?? 0,
          latest: latestMap.get(s.id) ?? null,
        })),
      );
      setAllTags(Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ar')));
      setLoading(false);
      setSilentReload(false);
      settleRefresh();
    }

    void loadInitial();

    return () => {
      cancelled = true;
      settleRefresh();
    };
  }, [stage, reloadKey, silentReload]);

  const handleRefresh = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      refreshResolverRef.current = resolve;
      setSilentReload(true);
      setReloadKey((k) => k + 1);
    });
  }, []);

  // ==================== Reports batching ====================
  const scheduleReportsFetch = useCallback(() => {
    if (reportTimerRef.current !== null) {
      window.clearTimeout(reportTimerRef.current);
    }
    reportTimerRef.current = window.setTimeout(() => {
      reportTimerRef.current = null;
      const ids = Array.from(pendingReportIdsRef.current);
      pendingReportIdsRef.current.clear();
      if (ids.length === 0) return;

      void postJson<{ counts: Record<string, number> }>('/api/reports', {
        action: 'counts',
        lecture_note_ids: ids,
      })
        .then((res) => {
          if (res.counts) {
            setReportCounts((prev) => ({ ...prev, ...res.counts }));
          }
        })
        .catch(() => {
          /* silent */
        });
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (reportTimerRef.current !== null) {
        window.clearTimeout(reportTimerRef.current);
      }
    };
  }, []);

  // ==================== Load one subject's notes ====================
  const loadSubjectNotes = useCallback(
    async (subjectId: string) => {
      if (notesRef.current.has(subjectId)) return;
      if (loadingRef.current.has(subjectId)) return;

      const gen = loadGenRef.current;
      loadingRef.current.add(subjectId);
      setLoadingIds(new Set(loadingRef.current));

      try {
        const { data, error: fetchErr } = await supabase
          .from('lecture_notes')
          .select('*')
          .eq('subject_id', subjectId);

        // دورة تحميل جديدة بدأت أثناء الانتظار — تجاهل هذه النتيجة
        if (gen !== loadGenRef.current) return;

        if (fetchErr) {
          console.error('load notes error:', fetchErr.message);
          return;
        }

        const notes = (data ?? []) as LectureNote[];
        notesRef.current.set(subjectId, notes);
        setNotesBySubject(new Map(notesRef.current));

        for (const n of notes) pendingReportIdsRef.current.add(n.id);
        if (notes.length > 0) scheduleReportsFetch();
      } finally {
        if (gen === loadGenRef.current) {
          loadingRef.current.delete(subjectId);
          setLoadingIds(new Set(loadingRef.current));
        }
      }
    },
    [scheduleReportsFetch],
  );

  // تحميل ملازم الموضوع المفتوح
  useEffect(() => {
    if (activeId) void loadSubjectNotes(activeId);
  }, [activeId, loadSubjectNotes]);

  // ==================== Eager load (search / tag) ====================
  useEffect(() => {
    if (!isFiltering) return;
    if (eagerLoaded || eagerStartedRef.current) return;
    if (subjects.length === 0) return;

    eagerStartedRef.current = true;
    const gen = loadGenRef.current;
    setEagerLoading(true);

    void Promise.all(subjects.map((s) => loadSubjectNotes(s.id))).finally(() => {
      if (gen !== loadGenRef.current) return;
      setEagerLoading(false);
      setEagerLoaded(true);
    });
  }, [isFiltering, subjects, eagerLoaded, loadSubjectNotes]);

  // ==================== Navigation (موضوع مفتوح + زر الرجوع) ====================
  const openTopic = useCallback((id: string) => {
    setActiveId(id);
    try {
      const st = window.history.state as { lawazimTopic?: string } | null;
      if (st?.lawazimTopic) {
        window.history.replaceState({ lawazimTopic: id }, '');
      } else {
        window.history.pushState({ lawazimTopic: id }, '');
      }
      window.scrollTo({ top: 0 });
    } catch {
      /* تجاهل */
    }
  }, []);

  const closeTopic = useCallback(() => {
    try {
      const st = window.history.state as { lawazimTopic?: string } | null;
      if (st?.lawazimTopic) {
        window.history.back();
        return;
      }
    } catch {
      /* تجاهل */
    }
    setActiveId(null);
  }, []);

  // استعادة الموضوع المفتوح بعد إعادة تحميل الصفحة (history.state يبقى محفوظاً)
  useEffect(() => {
    try {
      const id = (window.history.state as { lawazimTopic?: unknown } | null)
        ?.lawazimTopic;
      if (typeof id === 'string') setActiveId(id);
    } catch {
      /* تجاهل */
    }
  }, []);

  useEffect(() => {
    function onPop(e: PopStateEvent) {
      const id = (e.state as { lawazimTopic?: unknown } | null)?.lawazimTopic;
      setActiveId(typeof id === 'string' ? id : null);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // على الشاشات الكبيرة: افتح أول موضوع تلقائياً (مثل تيليجرام ديسكتوب)
  useEffect(() => {
    if (autoOpenedRef.current || loading || subjects.length === 0) return;
    autoOpenedRef.current = true;
    if (window.matchMedia('(min-width: 768px)').matches) {
      setActiveId((prev) => prev ?? subjects[0].id);
    }
  }, [loading, subjects]);

  // ==================== Derived ====================
  const filteredSubjects = useMemo(() => {
    return subjects.map((s) => {
      const notes = notesBySubject.get(s.id) ?? [];
      const isLoaded = notesBySubject.has(s.id);
      const filtered = isFiltering
        ? notes.filter((n) => noteMatches(n, term, selectedTag))
        : notes;
      return { subject: s, notes: filtered, isLoaded };
    });
  }, [subjects, notesBySubject, term, selectedTag, isFiltering]);

  const subjectsToRender = useMemo(() => {
    if (!isFiltering) return filteredSubjects;
    return filteredSubjects.filter((fs) => fs.isLoaded && fs.notes.length > 0);
  }, [filteredSubjects, isFiltering]);

  const totalNotes = useMemo(
    () => subjects.reduce((sum, s) => sum + s.noteCount, 0),
    [subjects],
  );

  const activeEntry = activeId
    ? (filteredSubjects.find((fs) => fs.subject.id === activeId) ?? null)
    : null;
  // إن لم يطابق activeId أي موضوع نبقى على القائمة بدل شاشة فارغة
  const hasActive = activeEntry !== null;

  const filterLabel = selectedTag
    ? `#${selectedTag}`
    : searchTerm.trim()
      ? `«${searchTerm.trim()}»`
      : '';

  function clearFilters() {
    setSearchTerm('');
    setSelectedTag(null);
  }

  // ==================== Render ====================
  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-6xl md:px-6 md:py-6">
        <TopicsSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl md:px-6 md:py-6">
      <PullToRefresh onRefresh={handleRefresh} disabled={hasActive}>
        <div className="md:grid md:h-[calc(100dvh-var(--nav-h)-3rem)] md:min-h-[30rem] md:grid-cols-[22rem_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden md:rounded-card md:border md:border-line md:bg-paper-soft lg:grid-cols-[24rem_minmax(0,1fr)]">
          {/* ==================== قائمة المواضيع ==================== */}
          <aside
            className={`${
              hasActive ? 'hidden md:flex' : 'flex'
            } min-h-0 flex-col md:border-e md:border-line`}
            aria-label="مواضيع الملازم"
          >
            <div className="px-4 pb-2 pt-5 md:pt-4">
              <div className="flex items-center justify-between gap-2">
                <h1 className="font-display text-2xl font-bold text-ink">
                  الملازم
                </h1>
                {stage && <span className="stage-badge">{stage}</span>}
              </div>
              {!loading && totalNotes > 0 && (
                <p className="mt-1 text-sm text-ink-muted">
                  <span className="num font-bold text-teal">{totalNotes}</span>{' '}
                  ملزمة في{' '}
                  <span className="num font-bold text-teal">
                    {subjects.length}
                  </span>{' '}
                  مادة
                </p>
              )}

              {totalNotes > 0 && (
                <div className="relative mt-3">
                  <IconSearch className="pointer-events-none absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                    type="search"
                    inputMode="search"
                    placeholder="ابحث عن ملزمة أو دكتور أو وسم"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!rounded-full !bg-ink/[0.05] !border-transparent py-2.5 pe-10 [&::-webkit-search-cancel-button]:hidden"
                    aria-label="بحث في الملازم"
                  />
                </div>
              )}
            </div>

            {allTags.length > 0 && (
              <div
                className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none"
                role="group"
                aria-label="تصفية بالوسوم"
              >
                <Chip
                  active={selectedTag === null}
                  onClick={() => setSelectedTag(null)}
                >
                  الكل
                </Chip>
                {allTags.map((tag) => (
                  <Chip
                    key={tag}
                    active={selectedTag === tag}
                    onClick={() =>
                      setSelectedTag(selectedTag === tag ? null : tag)
                    }
                  >
                    #{tag}
                  </Chip>
                ))}
              </div>
            )}

            <div className="min-h-0 flex-1 border-t border-line-soft pb-24 md:overflow-y-auto md:pb-0">
              {isFiltering && eagerLoading && (
                <p className="flex items-center gap-2 px-4 py-3 text-xs text-ink-muted">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
                  جاري البحث في كل المواد...
                </p>
              )}

              {loading && <TopicsSkeleton />}

              {!loading && error && (
                <div className="m-4 rounded-card border border-coral/30 bg-coral/5 p-4 text-sm text-coral-ink">
                  <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
                  <p className="mt-1 opacity-80">{error}</p>
                </div>
              )}

              {!loading && !error && subjects.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <IconInbox className="mx-auto h-12 w-12 text-ink-muted/40" />
                  <p className="mt-4 font-bold text-ink-soft">
                    لا توجد مواد مضافة لمرحلتك حالياً.
                  </p>
                </div>
              )}

              {!loading &&
                !error &&
                subjects.length > 0 &&
                isFiltering &&
                !eagerLoading &&
                subjectsToRender.length === 0 && (
                  <div className="px-6 py-16 text-center">
                    <IconSearch className="mx-auto h-8 w-8 text-ink-muted/40" />
                    <p className="mt-4 font-bold text-ink-soft">
                      لا توجد نتائج مطابقة
                    </p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-3 text-sm font-bold text-teal"
                    >
                      مسح البحث
                    </button>
                  </div>
                )}

              {!loading && !error && subjects.length > 0 && (
                <ul role="list">
                  {subjectsToRender.map((fs) => (
                    <TopicRow
                      key={fs.subject.id}
                      subject={fs.subject}
                      active={fs.subject.id === activeId}
                      count={isFiltering ? fs.notes.length : fs.subject.noteCount}
                      isResultCount={isFiltering}
                      onOpen={() => openTopic(fs.subject.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* ==================== محتوى الموضوع ==================== */}
          <section
            className={`${
              hasActive ? 'flex' : 'hidden md:flex'
            } min-h-0 min-w-0 flex-col`}
            aria-label="ملازم الموضوع"
          >
            {activeEntry ? (
              <TopicPane
                key={activeEntry.subject.id}
                subject={activeEntry.subject}
                notes={activeEntry.notes}
                isLoaded={activeEntry.isLoaded}
                isLoading={loadingIds.has(activeEntry.subject.id)}
                isFiltering={isFiltering}
                filterLabel={filterLabel}
                onClearFilter={clearFilters}
                reportCounts={reportCounts}
                onReport={(note) => setReportingNote(note)}
                onBack={closeTopic}
              />
            ) : (
              <div className="hidden flex-1 flex-col items-center justify-center gap-3 bg-paper px-6 text-center md:flex">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/5 text-ink-muted">
                  <IconBook className="h-6 w-6" />
                </span>
                <p className="text-sm font-bold text-ink-soft">
                  اختر مادة من القائمة لعرض ملازمها
                </p>
                <Link
                  href="/"
                  className="text-xs font-bold text-teal hover:underline"
                >
                  العودة للرئيسية
                </Link>
              </div>
            )}
          </section>
        </div>
      </PullToRefresh>

      <ReportModal
        note={reportingNote}
        onClose={() => setReportingNote(null)}
        onReported={() => {
          if (reportingNote) {
            setReportCounts((prev) => ({
              ...prev,
              [reportingNote.id]: (prev[reportingNote.id] ?? 0) + 1,
            }));
          }
        }}
      />
    </div>
  );
}