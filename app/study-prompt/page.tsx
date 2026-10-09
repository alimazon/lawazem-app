// app/study-prompt/page.tsx
'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api-client';
import {
  IconArrowLeft,
  IconBook,
  IconCheck,
  IconClock,
  IconClose,
  IconCopy,
  IconInbox,
  IconSparkles,
  IconTrending,
  IconWarning,
} from '@/components/ui/Icons';
import {
  MATERIAL_METHODS,
  STUDY_FORMATS,
  STUDY_FORMAT_LABELS,
  type StudyFormat,
} from '@/lib/constants';

// ==================== Types ====================
interface SubjectOption {
  id: string;
  name: string;
}

type Language = 'ar' | 'en';

type LoadError = { message: string; detail: string };

interface GeneratedResult {
  text: string;
  language: Language;
  signature: string;
  createdAt: number;
}

interface StoredPrefs {
  materialMethod: string;
  formats: StudyFormat[];
  language: Language;
  subjectId?: string;
}

interface HistoryItem {
  id: string;
  subjectName: string;
  preview: string;
  language: Language;
  createdAt: number;
}

interface Preset {
  id: string;
  label: string;
  emoji: string;
  formats: StudyFormat[];
  methodIndex: number;
}

// ==================== Constants ====================
const MAIN_CLASS =
  'mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10';

const PREFS_KEY = 'lawazem_sp_prefs_v2';
const HISTORY_KEY = 'lawazem_sp_history_v1';
const PRESETS_KEY = 'lawazem_sp_presets_v1';
const MAX_HISTORY = 5;
const COPY_FEEDBACK_MS = 1500;

// كاش على مستوى الوحدة لمنع إعادة التحميل عند التنقل
const subjectsCache = new Map<string, SubjectOption[]>();
const arabicCollator = new Intl.Collator('ar');

// ==================== Presets الافتراضية ====================
const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'quick-review',
    label: 'مراجعة سريعة',
    emoji: '⚡',
    formats: [
      'ملخص نقطي سريع ومركز',
      'أسئلة اختيار من متعدد (MCQ) للمراجعة مع الإجابات الصحيحة وتوضيح كل خيار',
    ],
    methodIndex: 0,
  },
  {
    id: 'deep-study',
    label: 'دراسة عميقة',
    emoji: '🧠',
    formats: [
      'شرح مبسط وواضح لمحتوى السلايد خطوة بخطوة',
      'أسئلة نقاش عميقة تساعد على الفهم لا الحفظ',
      'فلاش كاردز (سؤال وجواب) للحفظ السريع',
    ],
    methodIndex: 0,
  },
  {
    id: 'exam-prep',
    label: 'تحضير امتحان',
    emoji: '🎯',
    formats: [
      'أسئلة اختيار من متعدد (MCQ) للمراجعة مع الإجابات الصحيحة وتوضيح كل خيار',
      'مراجعة شاملة وتجميعية آخر المحاضرة بعد إرسال كل السلايدات',
    ],
    methodIndex: 0,
  },
  {
    id: 'flashcards-only',
    label: 'فلاش كاردز فقط',
    emoji: '🃏',
    formats: ['فلاش كاردز (سؤال وجواب) للحفظ السريع'],
    methodIndex: 0,
  },
];

// ==================== Helpers ====================
function buildError(detail: string): LoadError {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return {
    message: offline
      ? 'يبدو أن الإنترنت مقطوع عندك. سنعيد المحاولة تلقائياً عند رجوعه.'
      : 'تعذّر تحميل المواد الآن. جرّب مرة ثانية بعد قليل.',
    detail,
  };
}

function isLanguage(v: unknown): v is Language {
  return v === 'ar' || v === 'en';
}

function toSubjects(data: unknown): SubjectOption[] {
  if (!Array.isArray(data)) return [];
  const list: SubjectOption[] = [];
  for (const row of data as unknown[]) {
    if (typeof row !== 'object' || row === null) continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id === 'string' && typeof r.name === 'string') {
      list.push({ id: r.id, name: r.name });
    }
  }
  return list.sort((a, b) => arabicCollator.compare(a.name, b.name));
}

function readPrefs(): Partial<StoredPrefs> {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const p = parsed as Record<string, unknown>;
    const out: Partial<StoredPrefs> = {};

    if (
      typeof p.materialMethod === 'string' &&
      MATERIAL_METHODS.some((m) => m.value === p.materialMethod)
    ) {
      out.materialMethod = p.materialMethod;
    }
    if (Array.isArray(p.formats)) {
      const valid = STUDY_FORMATS.filter((f) =>
        (p.formats as unknown[]).includes(f),
      );
      if (valid.length > 0) out.formats = valid;
    }
    if (isLanguage(p.language)) out.language = p.language;
    if (typeof p.subjectId === 'string') out.subjectId = p.subjectId;
    return out;
  } catch {
    return {};
  }
}

function writePrefs(prefs: StoredPrefs): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function readHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter(
        (x): x is HistoryItem =>
          typeof x === 'object' &&
          x !== null &&
          typeof (x as HistoryItem).id === 'string' &&
          typeof (x as HistoryItem).preview === 'string',
      )
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function pushHistory(item: HistoryItem): HistoryItem[] {
  const current = readHistory();
  const next = [item, ...current].slice(0, MAX_HISTORY);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

function readPresets(): Preset[] {
  try {
    const raw = window.localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Preset[]).slice(0, 12);
  } catch {
    return [];
  }
}

function writePresets(presets: Preset[]): void {
  try {
    window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    /* ignore */
  }
}

// نسخ مع بديل للسياقات غير الآمنة
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  const prev =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  } finally {
    prev?.focus({ preventScroll: true });
  }
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'الآن';
  if (min < 60) return `قبل ${min} دقيقة`;
  const h = Math.floor(min / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'أمس';
  return `قبل ${d} أيام`;
}

// ==================== Back Link ====================
function BackLink() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
    >
      <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
        <IconArrowLeft aria-hidden="true" className="h-4 w-4" />
      </span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Skeleton ====================
function FormSkeleton() {
  return (
    <div
      role="status"
      aria-label="جارٍ تحميل النموذج"
      className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="space-y-5 card-editorial p-5 sm:p-6">
        <span className="sr-only">جارٍ التحميل…</span>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2" aria-hidden="true">
            <div className="h-4 w-24 skeleton-shimmer rounded motion-reduce:animate-none" />
            <div className="h-11 w-full skeleton-shimmer rounded-field motion-reduce:animate-none" />
          </div>
        ))}
      </div>
      <div className="hidden lg:block" aria-hidden="true">
        <div className="h-80 skeleton-shimmer rounded-card motion-reduce:animate-none" />
      </div>
    </div>
  );
}

// ==================== Error State ====================
const ErrorState = memo(function ErrorState({
  error,
  onRetry,
}: {
  error: LoadError;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-6 flex items-start gap-3 rounded-card border border-coral/30 bg-coral/5 p-4 animate-slide-up motion-reduce:animate-none"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-field bg-coral text-on-coral"
      >
        <IconWarning className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-coral-ink">تعذّر تحميل المواد</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
          {error.message}
        </p>
        {error.detail && (
          <p
            dir="ltr"
            className="mt-1 break-anywhere text-end font-mono text-[11px] text-ink-muted"
          >
            {error.detail}
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="mt-3"
        >
          إعادة المحاولة
        </Button>
      </div>
    </div>
  );
});

// ==================== Format Card ====================
const FORMAT_META: Record<StudyFormat, { emoji: string; hint: string }> = {
  'شرح مبسط وواضح لمحتوى السلايد خطوة بخطوة': {
    emoji: '📖',
    hint: 'كل سلايد يُشرح بلغة سهلة',
  },
  'أسئلة اختيار من متعدد (MCQ) للمراجعة مع الإجابات الصحيحة وتوضيح كل خيار': {
    emoji: '✅',
    hint: 'أسئلة مع الإجابة الصحيحة وتوضيح',
  },
  'فلاش كاردز (سؤال وجواب) للحفظ السريع': {
    emoji: '🃏',
    hint: 'بطاقات سؤال/جواب للحفظ',
  },
  'ملخص نقطي سريع ومركز': {
    emoji: '⚡',
    hint: 'نقاط مركزة بدون حشو',
  },
  'أسئلة نقاش عميقة تساعد على الفهم لا الحفظ': {
    emoji: '💭',
    hint: 'أسئلة تحفّز الفهم العميق',
  },
  'مراجعة شاملة وتجميعية آخر المحاضرة بعد إرسال كل السلايدات': {
    emoji: '🎯',
    hint: 'تُنتج بعد إرسال كل السلايدات',
  },
};

function FormatCard({
  format,
  selected,
  onToggle,
}: {
  format: StudyFormat;
  selected: boolean;
  onToggle: () => void;
}) {
  const meta = FORMAT_META[format];
  const label = STUDY_FORMAT_LABELS[format];

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={[
        'group flex w-full items-start gap-3 rounded-card border p-3 text-start',
        'transition-all duration-200 ease-[var(--ease-editorial)] motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
        selected
          ? 'border-teal bg-teal-tint shadow-sm'
          : 'border-line bg-paper-soft hover:border-teal/40 hover:bg-paper',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-field text-lg',
          'transition-colors duration-200 motion-reduce:transition-none',
          selected ? 'bg-teal text-on-teal' : 'bg-paper-deep',
        ].join(' ')}
      >
        {selected ? <IconCheck className="h-4 w-4" /> : meta.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-ink-muted">{meta.hint}</span>
      </span>
    </button>
  );
}

// ==================== Progress Steps ====================
function ProgressSteps({ active }: { active: number }) {
  const steps = ['تحليل المادة', 'صياغة البرومبت', 'لمسات أخيرة'];
  return (
    <ol className="space-y-2.5">
      {steps.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={[
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black',
                'transition-colors duration-200 motion-reduce:transition-none',
                done
                  ? 'bg-teal text-on-teal'
                  : current
                    ? 'bg-teal/20 text-teal'
                    : 'bg-ink/5 text-ink-muted',
              ].join(' ')}
            >
              {done ? (
                <IconCheck className="h-3 w-3" />
              ) : current ? (
                <span className="block h-2 w-2 animate-pulse rounded-full bg-teal motion-reduce:animate-none" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={[
                'text-sm',
                done || current
                  ? 'font-bold text-ink'
                  : 'text-ink-muted',
              ].join(' ')}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// ==================== Result Panel ====================
const ResultPanel = memo(function ResultPanel({
  result,
  stale,
  onCopy,
  copied,
  panelRef,
}: {
  result: GeneratedResult;
  stale: boolean;
  onCopy: () => void;
  copied: boolean;
  panelRef: React.RefObject<HTMLElement | null>;
}) {
  const wordCount = useMemo(
    () => result.text.trim().split(/\s+/).filter(Boolean).length,
    [result.text],
  );

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      aria-label="البرومبت المولّد"
      className="scroll-mt-6 overflow-hidden rounded-card border border-teal/25 bg-paper-soft outline-none animate-slide-up motion-reduce:animate-none"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-teal-tint px-4 py-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold text-teal">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-chip bg-teal text-on-teal"
          >
            <IconSparkles className="h-3 w-3" />
          </span>
          البرومبت جاهز
        </h2>
        <Button
          type="button"
          variant={copied ? 'primary' : 'secondary'}
          size="sm"
          onClick={onCopy}
          icon={copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
        >
          {copied ? 'تم النسخ' : 'نسخ'}
        </Button>
      </header>

      {stale && (
        <p
          role="status"
          className="flex items-start gap-2 border-b border-warning/30 bg-warning/5 px-4 py-2.5 text-xs leading-relaxed text-ink-soft"
        >
          <IconWarning
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
          />
          غيّرت اختياراتك بعد التوليد، فهذا البرومبت لم يعد يطابقها. أعد
          التوليد.
        </p>
      )}

      <pre
        dir={result.language === 'en' ? 'ltr' : 'rtl'}
        lang={result.language}
        tabIndex={0}
        aria-label="نص البرومبت"
        className="max-h-[55dvh] overflow-y-auto whitespace-pre-wrap break-anywhere p-4 text-start text-sm leading-relaxed text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal"
      >
        {result.text}
      </pre>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper-deep/40 px-4 py-2.5 text-[11px] text-ink-muted">
        <span className="font-mono">{wordCount} كلمة</span>
        <span>{formatTimestamp(result.createdAt)}</span>
      </footer>
    </section>
  );
});

// ==================== Empty Preview ====================
function EmptyPreview({
  subjectName,
  methodLabel,
  formats,
  language,
}: {
  subjectName: string | null;
  methodLabel: string | null;
  formats: StudyFormat[];
  language: Language;
}) {
  const isEmpty = !subjectName || !methodLabel || formats.length === 0;

  return (
    <section
      aria-label="معاينة الخيارات"
      className="hidden overflow-hidden rounded-card border border-line bg-paper-soft lg:block"
    >
      <header className="border-b border-line bg-paper-deep/40 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink-soft">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold" />
          ملخّص اختياراتك
        </h2>
      </header>

      <dl className="space-y-3 p-4 text-sm">
        <div className="flex items-start gap-3">
          <dt className="w-16 shrink-0 text-xs font-bold text-ink-muted">
            المادة
          </dt>
          <dd className="min-w-0 flex-1 break-anywhere font-bold text-ink">
            {subjectName ?? '—'}
          </dd>
        </div>
        <div className="flex items-start gap-3">
          <dt className="w-16 shrink-0 text-xs font-bold text-ink-muted">
            الطريقة
          </dt>
          <dd className="min-w-0 flex-1 text-xs leading-relaxed text-ink-soft">
            {methodLabel ?? '—'}
          </dd>
        </div>
        <div className="flex items-start gap-3">
          <dt className="w-16 shrink-0 text-xs font-bold text-ink-muted">
            الأشكال
          </dt>
          <dd className="min-w-0 flex-1">
            {formats.length === 0 ? (
              <span className="text-xs text-coral-ink">لم تختر بعد</span>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {formats.map((f) => (
                  <li
                    key={f}
                    className="rounded-chip bg-teal-tint px-2 py-0.5 text-[11px] font-bold text-teal"
                  >
                    {FORMAT_META[f].emoji} {STUDY_FORMAT_LABELS[f]}
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
        <div className="flex items-start gap-3">
          <dt className="w-16 shrink-0 text-xs font-bold text-ink-muted">
            اللغة
          </dt>
          <dd className="min-w-0 flex-1 font-bold text-ink">
            {language === 'ar' ? 'العربية' : 'English'}
          </dd>
        </div>
      </dl>

      <div className="border-t border-line bg-paper-deep/30 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-ink-muted">
          {isEmpty
            ? 'اختر المادة والأشكال ثم اضغط «توليد البرومبت».'
            : 'جاهز — اضغط «توليد البرومبت» في اليسار.'}
        </p>
      </div>
    </section>
  );
}

// ==================== History ====================
function HistoryPanel({
  items,
  onRestore,
  onClear,
}: {
  items: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onClear: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="sp-history-title"
      className="mt-8 animate-slide-up motion-reduce:animate-none"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          id="sp-history-title"
          className="flex items-center gap-1.5 text-sm font-bold text-ink"
        >
          <IconClock aria-hidden="true" className="h-4 w-4" />
          آخر البرومبتات
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="rounded-field px-2 py-1 text-xs font-semibold text-ink-muted transition-colors hover:text-coral-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
        >
          مسح السجل
        </button>
      </div>

      <ul role="list" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onRestore(item)}
              className="group flex w-full flex-col gap-1.5 rounded-card border border-line bg-paper-soft p-3 text-start transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-teal">
                  {item.subjectName}
                </span>
                <span className="shrink-0 text-[10px] text-ink-muted">
                  {formatTimestamp(item.createdAt)}
                </span>
              </div>
              <p
                dir={item.language === 'en' ? 'ltr' : 'rtl'}
                className="line-clamp-2 break-anywhere text-start text-[11px] leading-relaxed text-ink-soft"
              >
                {item.preview}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ==================== Presets Bar ====================
function PresetsBar({
  presets,
  onApply,
  onSaveCurrent,
  canSave,
}: {
  presets: Preset[];
  onApply: (p: Preset) => void;
  onSaveCurrent: () => void;
  canSave: boolean;
}) {
  const all = [...DEFAULT_PRESETS, ...presets];
  return (
    <div className="mt-6 animate-slide-up motion-reduce:animate-none">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
          <IconTrending aria-hidden="true" className="h-3.5 w-3.5" />
          قوالب جاهزة
        </h2>
        {canSave && (
          <button
            type="button"
            onClick={onSaveCurrent}
            className="rounded-field px-2 py-1 text-xs font-semibold text-teal transition-colors hover:text-teal-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
          >
            + حفظ الحالي كقالب
          </button>
        )}
      </div>
      <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {all.map((p) => (
          <li key={p.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onApply(p)}
              className="inline-flex items-center gap-2 rounded-chip border border-line bg-paper-soft px-3 py-1.5 text-xs font-bold text-ink-soft transition-all duration-200 hover:border-teal/40 hover:bg-teal-tint hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
            >
              <span aria-hidden="true">{p.emoji}</span>
              {p.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ==================== Main Page ====================
export default function StudyPromptPage() {
  const { stage, ready } = useStudentStage();
  const toast = useToast();

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectsError, setSubjectsError] = useState<LoadError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [subjectId, setSubjectId] = useState('');
  const [materialMethod, setMaterialMethod] = useState<string>(
    MATERIAL_METHODS[0].value,
  );
  const [selectedFormats, setSelectedFormats] = useState<StudyFormat[]>([
    STUDY_FORMATS[0],
  ]);
  const [language, setLanguage] = useState<Language>('ar');
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [generating, setGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [copied, setCopied] = useState(false);

  const copyTimerRef = useRef<number | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const mountedRef = useRef(true);
  const submitLockRef = useRef(false);

  // ==================== Mounted ====================
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ==================== Prefs load ====================
  useEffect(() => {
    const prefs = readPrefs();
    if (prefs.materialMethod) setMaterialMethod(prefs.materialMethod);
    if (prefs.formats) setSelectedFormats(prefs.formats);
    if (prefs.language) setLanguage(prefs.language);
    setCustomPresets(readPresets());
    setHistory(readHistory());
    setPrefsLoaded(true);
  }, []);

  // ==================== Prefs save ====================
  useEffect(() => {
    if (!prefsLoaded) return;
    writePrefs({ materialMethod, formats: selectedFormats, language, subjectId });
  }, [prefsLoaded, materialMethod, selectedFormats, language, subjectId]);

  // ==================== Load subjects ====================
  useEffect(() => {
    if (!stage) return;
    const currentStage = stage;
    let cancelled = false;

    function applySubjects(list: SubjectOption[]) {
      setSubjects(list);
      setSubjectId((prev) => {
        const stillValid = prev !== '' && list.some((s) => s.id === prev);
        return stillValid ? prev : (list[0]?.id ?? '');
      });
    }

    async function loadSubjects() {
      const cached = subjectsCache.get(currentStage);
      if (cached) {
        applySubjects(cached);
        setLoadingSubjects(false);
      } else {
        setLoadingSubjects(true);
      }
      setSubjectsError(null);

      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('stage', currentStage);

        if (cancelled) return;

        if (error) {
          if (!cached) {
            setSubjectsError(buildError(error.message));
            setSubjects([]);
          }
          return;
        }

        const list = toSubjects(data);
        subjectsCache.set(currentStage, list);
        applySubjects(list);
      } catch (e: unknown) {
        if (cancelled) return;
        if (!cached) {
          setSubjectsError(buildError(e instanceof Error ? e.message : ''));
          setSubjects([]);
        }
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    }

    void loadSubjects();
    return () => {
      cancelled = true;
    };
  }, [stage, reloadKey]);

  // إعادة تلقائية عند رجوع النت
  useEffect(() => {
    if (!subjectsError) return;
    function onOnline() {
      setReloadKey((k) => k + 1);
    }
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [subjectsError]);

  // تنظيف مؤقّت النسخ
  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  // التمرير إلى النتيجة بعد التوليد
  useEffect(() => {
    if (!result) return;
    const el = resultRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    el.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    el.focus({ preventScroll: true });
  }, [result]);

  const handleRetrySubjects = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const toggleFormat = useCallback((format: StudyFormat) => {
    setSelectedFormats((prev) => {
      const next = prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format];
      return STUDY_FORMATS.filter((f) => next.includes(f));
    });
  }, []);

  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId) ?? null,
    [subjects, subjectId],
  );

  const methodLabel = useMemo(
    () =>
      MATERIAL_METHODS.find((m) => m.value === materialMethod)?.label ?? null,
    [materialMethod],
  );

  const signature = useMemo(
    () =>
      [subjectId, materialMethod, selectedFormats.join(','), language].join('|'),
    [subjectId, materialMethod, selectedFormats, language],
  );

  const isStale = result !== null && result.signature !== signature;
  const noFormats = selectedFormats.length === 0;
  const canGenerate = selectedSubject !== null && !noFormats && !generating;

  const canSavePreset =
    selectedFormats.length > 0 && materialMethod !== MATERIAL_METHODS[0].value;

  // ==================== Generate ====================
  const handleGenerate = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!canGenerate || !selectedSubject || submitLockRef.current) return;

      submitLockRef.current = true;
      setGenerating(true);
      setProgressStep(0);
      setResult(null);
      setCopied(false);

      // خطوات وهمية بصرية
      const stepTimers: number[] = [];
      stepTimers.push(window.setTimeout(() => setProgressStep(1), 500));
      stepTimers.push(window.setTimeout(() => setProgressStep(2), 1400));

      try {
        const data = await postJson<{ prompt?: unknown }>('/api/study-prompt', {
          subject: selectedSubject.name,
          materialMethod,
          formats: selectedFormats,
          language,
        });

        if (!mountedRef.current) return;

        const text = typeof data?.prompt === 'string' ? data.prompt.trim() : '';
        if (text === '') {
          toast.show('وصلنا رد فارغ. حاول التوليد مرة ثانية.', 'error');
          return;
        }

        const fresh: GeneratedResult = {
          text,
          language,
          signature,
          createdAt: Date.now(),
        };

        setResult(fresh);

        const preview = text.replace(/\s+/g, ' ').slice(0, 160);
        const item: HistoryItem = {
          id: `${fresh.createdAt}-${Math.random().toString(36).slice(2, 8)}`,
          subjectName: selectedSubject.name,
          preview,
          language,
          createdAt: fresh.createdAt,
        };
        setHistory(pushHistory(item));

        toast.show('تم توليد البرومبت', 'success');
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        const offline =
          typeof navigator !== 'undefined' && !navigator.onLine;
        const message = offline
          ? 'لا يوجد اتصال بالإنترنت. تحقق منه ثم حاول مرة ثانية.'
          : err instanceof Error && err.message
            ? err.message
            : 'حدث خطأ، يرجى المحاولة مرة أخرى.';
        toast.show(message, 'error');
      } finally {
        stepTimers.forEach((t) => window.clearTimeout(t));
        submitLockRef.current = false;
        if (mountedRef.current) {
          setGenerating(false);
          setProgressStep(0);
        }
      }
    },
    [
      canGenerate,
      selectedSubject,
      materialMethod,
      selectedFormats,
      language,
      signature,
      toast,
    ],
  );

  // ==================== Copy ====================
  const handleCopy = useCallback(async () => {
    if (!result) return;
    const ok = await copyText(result.text);
    if (!mountedRef.current) return;
    if (!ok) {
      toast.show('فشل النسخ — يرجى النسخ يدوياً', 'error');
      return;
    }
    setCopied(true);
    toast.show('تم النسخ', 'success');
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(
      () => setCopied(false),
      COPY_FEEDBACK_MS,
    );
  }, [result, toast]);

  // ==================== Preset Apply ====================
  const handleApplyPreset = useCallback((preset: Preset) => {
    setSelectedFormats(preset.formats);
    const method = MATERIAL_METHODS[preset.methodIndex];
    if (method) setMaterialMethod(method.value);
    toast.show(`تم تطبيق «${preset.label}»`, 'success');
  }, [toast]);

  const handleSavePreset = useCallback(() => {
    const methodIndex = MATERIAL_METHODS.findIndex(
      (m) => m.value === materialMethod,
    );
    if (methodIndex < 0 || selectedFormats.length === 0) return;
    const label = window.prompt('اسم القالب؟')?.trim();
    if (!label) return;
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      label: label.slice(0, 30),
      emoji: '⭐',
      formats: selectedFormats,
      methodIndex,
    };
    const next = [...readPresets(), newPreset].slice(-12);
    writePresets(next);
    setCustomPresets(next);
    toast.show('تم حفظ القالب', 'success');
  }, [materialMethod, selectedFormats, toast]);

  const handleRestoreHistory = useCallback(
    (item: HistoryItem) => {
      toast.show(`آخر برومبت لـ «${item.subjectName}» — استخدم النسخ من النتيجة السابقة`, 'info');
    },
    [toast],
  );

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    try {
      window.localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // ==================== Keyboard Shortcut ====================
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canGenerate) {
        e.preventDefault();
        const form = document.getElementById('sp-form') as HTMLFormElement | null;
        form?.requestSubmit();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canGenerate]);

  // ==================== Render guards ====================
  if (!ready) {
    return (
      <main className={MAIN_CLASS} aria-busy="true">
        <FormSkeleton />
      </main>
    );
  }

  if (!stage) {
    return (
      <main className={MAIN_CLASS}>
        <BackLink />
        <div className="mt-6 card-editorial p-8 text-center animate-slide-up motion-reduce:animate-none">
          <div
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-teal-soft text-teal"
          >
            <IconWarning className="h-8 w-8" />
          </div>
          <p className="mt-4 font-bold text-ink-soft">
            لم تحدد مرحلتك الدراسية بعد.
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            اختر مرحلتك من لوحة الأقسام لتظهر لك المواد.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-10 items-center rounded-field border border-line bg-paper-soft px-4 text-sm font-semibold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
          >
            اختيار المرحلة
          </Link>
        </div>
      </main>
    );
  }

  const noSubjects =
    !loadingSubjects && !subjectsError && subjects.length === 0;

  return (
    <main className={MAIN_CLASS} aria-labelledby="study-prompt-title">
      <BackLink />

      {/* ==================== Header ==================== */}
      <header className="mt-6 animate-slide-up motion-reduce:animate-none">
        <span className="stage-badge">{stage}</span>
        <h1
          id="study-prompt-title"
          className="mt-3 flex items-center gap-2.5 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-teal-soft text-teal"
          >
            <IconSparkles className="h-5 w-5" />
          </span>
          أدوات الدراسة
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
          اختر مادتك وأشكال الشرح، وسنصيغ لك برومبت احترافياً جاهزاً للصق في
          أي أداة ذكاء اصطناعي.
        </p>
      </header>

      {/* ==================== Presets ==================== */}
      {!loadingSubjects && !subjectsError && !noSubjects && (
        <PresetsBar
          presets={customPresets}
          onApply={handleApplyPreset}
          onSaveCurrent={handleSavePreset}
          canSave={canSavePreset}
        />
      )}

      {/* ==================== Loading ==================== */}
      {loadingSubjects && <FormSkeleton />}

      {/* ==================== Error ==================== */}
      {!loadingSubjects && subjectsError && (
        <ErrorState error={subjectsError} onRetry={handleRetrySubjects} />
      )}

      {/* ==================== Empty ==================== */}
      {noSubjects && (
        <div className="mt-6 card-editorial p-10 text-center animate-slide-up motion-reduce:animate-none">
          <div
            aria-hidden="true"
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-card bg-teal-soft text-teal"
          >
            <IconInbox className="h-8 w-8" />
          </div>
          <p className="mt-4 font-bold text-ink-soft">
            لا توجد مواد مضافة لمرحلتك حالياً.
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            سنضيف المواد قريباً، حاول مرة ثانية بعد قليل.
          </p>
        </div>
      )}

      {/* ==================== Main Grid ==================== */}
      {!loadingSubjects && !subjectsError && !noSubjects && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* ===== Left: Form ===== */}
          <form
            id="sp-form"
            onSubmit={handleGenerate}
            aria-busy={generating}
            className="space-y-5 card-editorial p-5 animate-slide-up motion-reduce:animate-none sm:p-6"
          >
            {/* المادة */}
            <div>
              <label
                htmlFor="sp-subject"
                className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink"
              >
                <IconBook aria-hidden="true" className="h-4 w-4 text-teal" />
                المادة
              </label>
              <Select
                id="sp-subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* طريقة الإرسال */}
            <div>
              <label
                htmlFor="sp-method"
                className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink"
              >
                <IconTrending aria-hidden="true" className="h-4 w-4 text-teal" />
                كيف ستزود المحتوى للذكاء الاصطناعي؟
              </label>
              <Select
                id="sp-method"
                value={materialMethod}
                onChange={(e) => setMaterialMethod(e.target.value)}
                className="w-full"
              >
                {MATERIAL_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* أشكال الشرح */}
            <fieldset aria-describedby={noFormats ? 'sp-formats-error' : undefined}>
              <legend className="mb-3 flex w-full items-center justify-between gap-2 text-sm font-bold text-ink">
                <span className="flex items-center gap-1.5">
                  <IconSparkles
                    aria-hidden="true"
                    className="h-4 w-4 text-teal"
                  />
                  شكل الشرح
                </span>
                <span className="text-xs font-normal text-ink-muted">
                  {selectedFormats.length} محدد
                </span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {STUDY_FORMATS.map((f) => (
                  <FormatCard
                    key={f}
                    format={f}
                    selected={selectedFormats.includes(f)}
                    onToggle={() => toggleFormat(f)}
                  />
                ))}
              </div>
              {noFormats && (
                <p
                  id="sp-formats-error"
                  role="alert"
                  className="mt-2 text-xs font-bold text-coral-ink"
                >
                  اختر طريقة شرح واحدة على الأقل.
                </p>
              )}
            </fieldset>

            {/* اللغة */}
            <div>
              <span className="mb-2 block text-sm font-bold text-ink">
                لغة البرومبت
              </span>
              <div
                role="radiogroup"
                aria-label="لغة البرومبت"
                className="inline-flex rounded-field border border-line bg-paper-deep/50 p-1"
              >
                {(['ar', 'en'] as const).map((lang) => {
                  const active = language === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setLanguage(lang)}
                      className={[
                        'min-w-[100px] rounded-[calc(var(--r-field)-2px)] px-4 py-1.5 text-sm font-bold',
                        'transition-all duration-200 ease-[var(--ease-editorial)] motion-reduce:transition-none',
                        active
                          ? 'bg-teal text-on-teal shadow-sm'
                          : 'text-ink-soft hover:text-ink',
                      ].join(' ')}
                    >
                      {lang === 'ar' ? 'العربية' : 'English'}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={generating}
              disabled={!canGenerate}
              icon={!generating ? <IconSparkles /> : undefined}
              fullWidth
            >
              {generating ? 'جاري التوليد...' : 'توليد البرومبت'}
            </Button>

            {/* تلميح الاختصار */}
            <p className="hidden text-center text-[11px] text-ink-muted sm:block">
              نصيحة: اضغط{' '}
              <kbd className="rounded border border-line bg-paper-deep px-1.5 py-0.5 font-mono">
                Ctrl
              </kbd>{' '}
              +{' '}
              <kbd className="rounded border border-line bg-paper-deep px-1.5 py-0.5 font-mono">
                Enter
              </kbd>{' '}
              للتوليد السريع
            </p>

            <p className="sr-only" role="status" aria-live="polite">
              {generating ? 'جاري توليد البرومبت' : ''}
            </p>
          </form>

          {/* ===== Right: Preview / Progress / Result ===== */}
          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--nav-h)+1rem)] lg:h-fit">
            {generating ? (
              <div className="card-editorial p-5 animate-slide-up motion-reduce:animate-none">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-field bg-teal/15 text-teal">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">
                      يبني البرومبت الآن
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      ثوانٍ قليلة…
                    </p>
                  </div>
                </div>
                <ProgressSteps active={progressStep} />
              </div>
            ) : result ? (
              <ResultPanel
                result={result}
                stale={isStale}
                onCopy={handleCopy}
                copied={copied}
                panelRef={resultRef}
              />
            ) : (
              <EmptyPreview
                subjectName={selectedSubject?.name ?? null}
                methodLabel={methodLabel}
                formats={selectedFormats}
                language={language}
              />
            )}

            {/* زر مسح سريع إذا كانت النتيجة ظاهرة */}
            {result && !generating && (
              <button
                type="button"
                onClick={() => setResult(null)}
                className="mx-auto flex items-center gap-1.5 rounded-field px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
              >
                <IconClose aria-hidden="true" className="h-3.5 w-3.5" />
                إخفاء النتيجة
              </button>
            )}
          </aside>
        </div>
      )}

      {/* ==================== History ==================== */}
      {!loadingSubjects && !subjectsError && (
        <HistoryPanel
          items={history}
          onRestore={handleRestoreHistory}
          onClear={handleClearHistory}
        />
      )}
    </main>
  );
}
