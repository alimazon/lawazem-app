// app/gpa/_components/GradesTab.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { IconInbox, IconSearch, IconWarning } from '@/components/ui/Icons';
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

// ==================== Inline Icon ====================
function IconGrades() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 4h6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
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
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">جارٍ التحميل…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-40 skeleton-shimmer rounded motion-reduce:animate-none" />
          <div className="grid gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-24 skeleton-shimmer rounded-card motion-reduce:animate-none"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== Main ====================
export function GradesTab() {
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
    return <Skeleton />;
  }

  if (loading) {
    return <Skeleton />;
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-card border border-coral/30 bg-coral/5 p-4"
      >
        <IconWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-coral-ink" />
        <div>
          <p className="text-sm font-bold text-coral-ink">خطأ</p>
          <p className="mt-1 break-anywhere text-xs text-ink-soft">{error}</p>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="rounded-card border border-line bg-paper-soft p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-teal/8 text-teal">
          <IconInbox className="h-8 w-8" />
        </div>
        <p className="mt-4 font-bold text-ink-soft">
          لا توجد مواد مضافة لمرحلتك.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-line bg-paper-soft p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-teal/8 text-teal">
          <IconInbox className="h-8 w-8" />
        </div>
        <p className="mt-4 font-bold text-ink-soft">
          لا توجد ملفات درجات بعد.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-ink sm:text-2xl">
            <IconGrades />
            الدرجات
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            أرشيف ملفات الدرجات — كوزات، امتحانات يومية، فصلية، وفاينل.
          </p>
        </div>
        {stage && (
          <span className="stage-badge hidden sm:inline-flex">{stage}</span>
        )}
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-2">
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

      <div className="flex flex-wrap gap-1.5">
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

      {/* القائمة */}
      {groups.length === 0 ? (
        <div className="rounded-card border border-line bg-paper-soft p-8 text-center">
          <p className="font-bold text-ink-soft">لا نتائج مطابقة</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.subjectId}>
              <h3 className="mb-3 flex items-baseline gap-2 border-b border-line pb-2 font-display text-lg font-bold text-ink">
                {group.subjectName}
                <span className="font-mono text-xs font-normal text-ink-muted">
                  {group.items.length}
                </span>
              </h3>

              <ul className="grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => {
                  const typeStyle = GRADE_TYPE_COLORS[item.grade_type];
                  return (
                    <li key={item.id}>
                      <a
                        href={item.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full items-start gap-3 rounded-card border border-line bg-paper-soft p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
    </div>
  );
}