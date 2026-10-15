// app/grades/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Input } from '@/components/ui/Field';
import {
  GRADE_TYPE_COLORS,
  GRADE_TYPE_EMOJIS,
  GRADE_TYPE_LABELS,
  GRADE_TYPES,
  type GradeType,
} from '@/lib/constants';
import {
  IconArrowLeft,
  IconGrades,
  IconInbox,
  IconSearch,
  IconWarning,
} from '@/components/ui/Icons';
import type { Subject } from '@/lib/types';

// ==================== Types ====================
interface GradeFile {
  id: string;
  subject_id: string;
  title: string;
  grade_type: GradeType;
  professor_name: string | null;
  year: number | null;
  notes: string | null;
  file_path: string;
  created_at: string;
  subjects: { name: string } | Array<{ name: string }> | null;
}

interface SubjectGroup {
  subjectId: string;
  subjectName: string;
  items: GradeFile[];
}

// ==================== Helpers ====================
function getSubjectName(rel: GradeFile['subjects']): string {
  if (!rel) return '—';
  if (Array.isArray(rel)) return rel[0]?.name ?? '—';
  return rel.name ?? '—';
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-8 space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-40 skeleton-shimmer rounded" />
          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-24 skeleton-shimmer rounded-card"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Page ====================
export default function GradesPage() {
  const { stage, ready } = useStudentStage();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [items, setItems] = useState<GradeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | GradeType>('all');

  // ===== تحميل =====
  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .eq('stage', stage)
          .order('name');

        if (cancelled) return;

        const subjectList = (subjectsData ?? []) as Subject[];
        setSubjects(subjectList);

        if (subjectList.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        const subjectIds = subjectList.map((s) => s.id);

        const { data: filesData, error: filesErr } = await supabase
          .from('grade_files')
          .select('*, subjects(name)')
          .in('subject_id', subjectIds)
          .order('created_at', { ascending: false });

        if (cancelled) return;

        if (filesErr) {
          setError(filesErr.message);
          setItems([]);
        } else {
          setItems((filesData ?? []) as GradeFile[]);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'خطأ غير معروف');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [stage]);

  // ===== الفلترة والتجميع =====
  const groups = useMemo<SubjectGroup[]>(() => {
    const term = search.trim().toLowerCase();

    const filteredItems = items
      .filter((i) => filterType === 'all' || i.grade_type === filterType)
      .filter((i) => {
        if (!term) return true;
        const haystack = [
          i.title,
          i.professor_name ?? '',
          getSubjectName(i.subjects),
          i.notes ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });

    const map = new Map<string, SubjectGroup>();
    for (const s of subjects) {
      map.set(s.id, {
        subjectId: s.id,
        subjectName: s.name,
        items: [],
      });
    }
    for (const item of filteredItems) {
      const group = map.get(item.subject_id);
      if (group) group.items.push(item);
    }

    return Array.from(map.values()).filter((g) => g.items.length > 0);
  }, [items, subjects, search, filterType]);

  // ===== حالات =====
  if (!ready) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      {/* ═══ رجوع ═══ */}
      <Link
        href="/"
        className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover motion-reduce:transition-none"
      >
        <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none">
          <IconArrowLeft className="h-4 w-4" />
        </span>
        رجوع إلى لوحة الأقسام
      </Link>

      {/* ═══ Header ═══ */}
      <header className="mt-6 animate-slide-up motion-reduce:animate-none">
        {stage && <span className="stage-badge">{stage}</span>}
        <h1 className="mt-3 flex items-center gap-2.5 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-teal-soft text-teal"
          >
            <IconGrades className="h-5 w-5" />
          </span>
          الدرجات
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
          أرشيف ملفات الدرجات — كوزات، امتحانات يومية، فصلية، وفاينل.
        </p>
      </header>

      {/* ═══ الفلاتر ═══ */}
      {!loading && !error && items.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 animate-slide-up motion-reduce:animate-none">
          <div className="relative min-w-[180px] flex-1">
            <IconSearch className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث..."
              className="pe-10"
            />
          </div>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`rounded-chip px-3 py-1.5 text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-teal text-on-teal'
                : 'bg-ink/5 text-ink-soft hover:bg-ink/10 dark:bg-white/5'
            }`}
          >
            الكل ({items.length})
          </button>
          {GRADE_TYPES.map((t) => {
            const count = items.filter((i) => i.grade_type === t).length;
            if (count === 0) return null;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(filterType === t ? 'all' : t)}
                className={`rounded-chip px-3 py-1.5 text-xs font-bold transition-all ${
                  filterType === t
                    ? 'bg-teal text-on-teal'
                    : 'bg-ink/5 text-ink-soft hover:bg-ink/10 dark:bg-white/5'
                }`}
              >
                {GRADE_TYPE_EMOJIS[t]} {GRADE_TYPE_LABELS[t]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ المحتوى ═══ */}
      {loading && <Skeleton />}

      {!loading && error && (
        <div
          role="alert"
          className="mt-8 flex items-start gap-3 rounded-card border border-coral/30 bg-coral/5 p-4"
        >
          <IconWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral-ink" />
          <div>
            <p className="text-sm font-bold text-coral-ink">خطأ</p>
            <p className="mt-1 break-anywhere text-xs text-ink-soft">
              {error}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-paper-soft p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-teal/8 text-teal">
            <IconInbox className="h-8 w-8" />
          </div>
          <p className="mt-4 font-bold text-ink-soft">
            لا توجد مواد مضافة لمرحلتك.
          </p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && items.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-paper-soft p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-teal/8 text-teal">
            <IconInbox className="h-8 w-8" />
          </div>
          <p className="mt-4 font-bold text-ink-soft">
            لا توجد ملفات درجات بعد.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && groups.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-paper-soft p-8 text-center">
          <p className="font-bold text-ink-soft">لا نتائج مطابقة</p>
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="mt-8 space-y-8 animate-slide-up motion-reduce:animate-none">
          {groups.map((group) => (
            <section key={group.subjectId}>
              <h2 className="mb-3 flex items-baseline gap-2 border-b border-line pb-2 font-display text-lg font-bold text-ink">
                {group.subjectName}
                <span className="font-mono text-xs font-normal text-ink-muted">
                  {group.items.length}
                </span>
              </h2>

              <ul className="grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => {
                  const typeStyle = GRADE_TYPE_COLORS[item.grade_type];
                  return (
                    <li key={item.id}>
                      <a
                        href={item.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full items-start gap-3 rounded-card border border-line bg-paper-soft p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md motion-reduce:transition-none"
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-field text-lg ${typeStyle}`}
                        >
                          {GRADE_TYPE_EMOJIS[item.grade_type]}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="break-anywhere text-sm font-bold text-ink group-hover:text-teal">
                              {item.title}
                            </span>
                            {item.year != null && (
                              <span className="rounded-md bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink/50 dark:bg-white/10">
                                {item.year}
                              </span>
                            )}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
                            <span className="font-bold">
                              {GRADE_TYPE_LABELS[item.grade_type]}
                            </span>
                            {item.professor_name && (
                              <>
                                <span>·</span>
                                <span className="truncate">
                                  د. {item.professor_name}
                                </span>
                              </>
                            )}
                          </span>
                          {item.notes && (
                            <span className="mt-1 line-clamp-2 block text-xs text-ink-soft">
                              {item.notes}
                            </span>
                          )}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}