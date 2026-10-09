// app/dictionary/page.tsx
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api-client';
import {
  MEDICAL_CATEGORIES,
  MEDICAL_CATEGORY_LABELS,
  MEDICAL_CATEGORY_EMOJIS,
} from '@/lib/constants';
import type {
  DictionaryDeepExplanation,
  MedicalCategory,
} from '@/lib/types';
import {
  IconSearch,
  IconArrowLeft,
  IconDoctor,
  IconBook,
  IconSparkles,
  IconTrending,
  IconClock,
  IconCopy,
  IconCheck,
  IconClose,
  IconWarning,
} from '@/components/ui/Icons';

// ==================== Types ====================
interface DictionaryResult {
  id?: string;
  term: string;
  arabic_translation: string;
  meaning: string;
  root_breakdown: string | null;
  clinical_note: string | null;
  similar_terms: string[];
  category: MedicalCategory;
  hit_count: number;
}

interface PopularTerm {
  term: string;
  arabic_translation: string;
  hit_count: number;
  category: MedicalCategory;
}

interface CategoryStat {
  category: MedicalCategory;
  count: number;
}

const RECENT_KEY = 'dictionary_recent_terms';
const MAX_RECENT = 8;
const MIN_TERM_LENGTH = 2;

// ==================== Normalizers ====================
function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeTerm(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function parseCategory(v: unknown): MedicalCategory {
  const s = str(v);
  return (MEDICAL_CATEGORIES as readonly string[]).includes(s)
    ? (s as MedicalCategory)
    : 'general';
}

function normalizeResult(raw: unknown): DictionaryResult | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;

  const term = str(r.term);
  const meaning = str(r.meaning);
  if (!term || !meaning) return null;

  const similar = Array.isArray(r.similar_terms)
    ? r.similar_terms
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const hits =
    typeof r.hit_count === 'number' && Number.isFinite(r.hit_count)
      ? Math.max(0, Math.floor(r.hit_count))
      : 0;

  return {
    id: typeof r.id === 'string' ? r.id : undefined,
    term,
    arabic_translation: str(r.arabic_translation),
    meaning,
    root_breakdown: str(r.root_breakdown) || null,
    clinical_note: str(r.clinical_note) || null,
    similar_terms: Array.from(new Set(similar)),
    category: parseCategory(r.category),
    hit_count: hits,
  };
}

function normalizePopular(raw: unknown): PopularTerm[] {
  if (!Array.isArray(raw)) return [];
  const out: PopularTerm[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const term = str(r.term);
    if (!term) continue;
    out.push({
      term,
      arabic_translation: str(r.arabic_translation),
      hit_count:
        typeof r.hit_count === 'number' && Number.isFinite(r.hit_count)
          ? r.hit_count
          : 0,
      category: parseCategory(r.category),
    });
  }
  return out;
}

function normalizeDeep(raw: unknown): DictionaryDeepExplanation | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const overview = str(r.overview);
  const mechanism = str(r.mechanism);
  const clinical = str(r.clinical);
  if (!overview || !mechanism || !clinical) return null;

  return {
    overview,
    mechanism,
    clinical,
    confusions: Array.isArray(r.confusions)
      ? r.confusions
          .filter((c): c is string => typeof c === 'string')
          .map((c) => c.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [],
    mnemonic: str(r.mnemonic) || null,
  };
}

// ==================== Storage ====================
function loadRecent(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((t): t is string => typeof t === 'string' && t.trim() !== '')
        .slice(0, MAX_RECENT);
    }
  } catch {
    /* ignore */
  }
  return [];
}

function saveRecent(term: string): string[] {
  const current = loadRecent().filter(
    (t) => t.toLowerCase() !== term.toLowerCase()
  );
  const next = [term, ...current].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

function clearRecentStorage(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}

// ==================== Clipboard ====================
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function buildCopyText(result: DictionaryResult): string {
  const catLabel = MEDICAL_CATEGORY_LABELS[result.category];
  return [
    `المصطلح: ${result.term}`,
    `التصنيف: ${catLabel}`,
    result.arabic_translation ? `الترجمة: ${result.arabic_translation}` : '',
    `المعنى: ${result.meaning}`,
    result.root_breakdown ? `تفكيك الكلمة: ${result.root_breakdown}` : '',
    result.clinical_note ? `ملاحظة سريرية: ${result.clinical_note}` : '',
    result.similar_terms.length > 0
      ? `مصطلحات مشابهة: ${result.similar_terms.join(' · ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// ==================== Speech ====================
function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSupported('speechSynthesis' in window);
    return () => {
      // أوقف أي نطق عند الخروج
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }

    // اختر صوتاً إنجليزياً إن توفّر
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.lang === 'en-US' && v.localService) ||
      voices.find((v) => v.lang === 'en-US') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null;

    const utter = new SpeechSynthesisUtterance(text);
    if (preferred) utter.voice = preferred;
    utter.lang = preferred?.lang ?? 'en-US';
    utter.rate = 0.9;
    utter.pitch = 1;

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utter);
    return true;
  }, []);

  const stop = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported };
}

// ==================== Small components ====================
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

function HitCount({ count }: { count: number }) {
  if (count <= 0) return null;
  let content: React.ReactNode;
  if (count === 1) content = 'بُحث عنه مرة واحدة';
  else if (count === 2) content = 'بُحث عنه مرتين';
  else {
    content = (
      <>
        بُحث عنه <span className="num-inline font-mono">{count}</span>{' '}
        {count <= 10 ? 'مرات' : 'مرة'}
      </>
    );
  }
  return (
    <footer className="flex items-center gap-2 border-t border-line-soft pt-3 text-xs text-ink-muted">
      <IconTrending aria-hidden="true" className="h-3.5 w-3.5" />
      <span>{content}</span>
    </footer>
  );
}

function CategoryBadge({ category }: { category: MedicalCategory }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-chip bg-navy-soft px-2.5 py-0.5 text-[11px] font-bold text-navy-ink">
      <span aria-hidden="true">{MEDICAL_CATEGORY_EMOJIS[category]}</span>
      {MEDICAL_CATEGORY_LABELS[category]}
    </span>
  );
}

// ==================== Pronunciation Button ====================
function SpeakButton({
  text,
  speaking,
  supported,
  onSpeak,
  onStop,
}: {
  text: string;
  speaking: boolean;
  supported: boolean;
  onSpeak: (t: string) => void;
  onStop: () => void;
}) {
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (speaking ? onStop() : onSpeak(text))}
      aria-label={speaking ? 'إيقاف النطق' : `نطق ${text}`}
      title={speaking ? 'إيقاف النطق' : 'نطق المصطلح'}
      className={[
        'flex h-9 shrink-0 items-center gap-1.5 rounded-field border px-3',
        'text-xs font-semibold',
        'transition-colors duration-200 motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
        speaking
          ? 'border-teal/50 bg-teal-tint text-teal'
          : 'border-line bg-paper-soft text-ink-soft hover:border-teal/40 hover:text-teal',
      ].join(' ')}
    >
      {speaking ? (
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
        </svg>
      )}
      <span>{speaking ? 'إيقاف' : 'نطق'}</span>
    </button>
  );
}

// ==================== Deep Dive Card ====================
function DeepDiveCard({
  term,
  onClose,
}: {
  term: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deep, setDeep] = useState<DictionaryDeepExplanation | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await postJson<{ deep?: unknown }>('/api/dictionary', {
          action: 'deep',
          term,
        });
        if (cancelled) return;
        const normalized = normalizeDeep(data.deep);
        if (!normalized) {
          setError('وصل رد غير مفهوم. جرّب مرة ثانية.');
          return;
        }
        setDeep(normalized);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'فشل توليد الشرح'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [term]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    el.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  return (
    <section
      ref={cardRef}
      aria-labelledby="deep-heading"
      className="mt-4 scroll-mt-6 overflow-hidden rounded-card border border-gold/40 bg-gold-tint/40 animate-slide-up motion-reduce:animate-none"
    >
      <header className="flex items-center justify-between gap-2 border-b border-gold/30 bg-gold-tint px-4 py-2.5">
        <h3
          id="deep-heading"
          className="flex items-center gap-2 font-display text-sm font-bold text-gold-ink"
        >
          <IconSparkles aria-hidden="true" className="h-4 w-4" />
          شرح عميق — {term}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق الشرح"
          className="flex h-7 w-7 items-center justify-center rounded-field text-gold-ink transition-colors hover:bg-gold/20 motion-reduce:transition-none"
        >
          <IconClose aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="p-4 sm:p-5">
        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 text-sm text-ink-soft"
          >
            <svg
              className="h-4 w-4 animate-spin text-gold-ink"
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
            <span>جاري توليد شرح عميق…</span>
          </div>
        )}

        {error && !loading && (
          <div
            role="alert"
            className="rounded-field border border-coral/30 bg-coral/5 p-3 text-sm text-coral-ink"
          >
            <p className="font-bold">تعذّر توليد الشرح</p>
            <p className="mt-0.5 text-xs opacity-80">{error}</p>
          </div>
        )}

        {deep && !loading && (
          <div className="space-y-4 text-sm leading-relaxed">
            <section>
              <h4 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-gold-ink">
                <span aria-hidden="true">🌐</span>
                نظرة عامة
              </h4>
              <p className="break-anywhere text-ink-soft">{deep.overview}</p>
            </section>

            <section>
              <h4 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-gold-ink">
                <span aria-hidden="true">⚙️</span>
                الآلية والوظيفة
              </h4>
              <p className="break-anywhere text-ink-soft">{deep.mechanism}</p>
            </section>

            <section>
              <h4 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-gold-ink">
                <span aria-hidden="true">🩺</span>
                الأهمية السريرية
              </h4>
              <p className="break-anywhere text-ink-soft">{deep.clinical}</p>
            </section>

            {deep.confusions.length > 0 && (
              <section>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gold-ink">
                  <span aria-hidden="true">⚠️</span>
                  يختلط مع
                </h4>
                <ul className="space-y-2">
                  {deep.confusions.map((c, i) => (
                    <li
                      key={i}
                      className="break-anywhere rounded-field border border-gold/20 bg-paper-soft/70 px-3 py-2 text-xs leading-relaxed text-ink-soft"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {deep.mnemonic && (
              <section className="rounded-field border border-teal/30 bg-teal-tint p-3">
                <h4 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-teal">
                  <span aria-hidden="true">🧠</span>
                  طريقة للحفظ
                </h4>
                <p className="break-anywhere text-xs leading-relaxed text-ink-soft">
                  {deep.mnemonic}
                </p>
              </section>
            )}

            <p className="text-[11px] leading-relaxed text-ink-muted">
              ⚠️ الشرح العميق مولّد بالذكاء الاصطناعي — للتذكير الدراسي فقط،
              راجع المصادر الرسمية.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ==================== Result Card ====================
function ResultCard({
  result,
  headingRef,
  onSelectTerm,
}: {
  result: DictionaryResult;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onSelectTerm: (term: string) => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [showDeep, setShowDeep] = useState(false);
  const timerRef = useRef<number | null>(null);
  const speech = useSpeech();

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  // أوقف النطق عند تغيير المصطلح
  useEffect(() => {
    speech.stop();
    setShowDeep(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.term]);

  const handleCopy = useCallback(async () => {
    const ok = await copyText(buildCopyText(result));
    if (!ok) {
      toast.show('فشل النسخ', 'error');
      return;
    }
    setCopied(true);
    toast.show('تم نسخ المصطلح', 'success');
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1500);
  }, [result, toast]);

  return (
    <article
      aria-labelledby="result-heading"
      className="card-editorial animate-slide-up motion-reduce:animate-none"
    >
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-field bg-teal-soft text-teal"
            >
              <IconDoctor className="h-4 w-4" />
            </span>
            <h2
              id="result-heading"
              ref={headingRef}
              tabIndex={-1}
              className="break-anywhere rounded-field font-display text-xl font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:text-2xl"
            >
              <bdi>{result.term}</bdi>
            </h2>
            <CategoryBadge category={result.category} />
          </div>
          {result.arabic_translation && (
            <p className="mt-2 break-anywhere text-base font-semibold text-teal">
              <bdi>{result.arabic_translation}</bdi>
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <SpeakButton
            text={result.term}
            speaking={speech.speaking}
            supported={speech.supported}
            onSpeak={speech.speak}
            onStop={speech.stop}
          />
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'تم النسخ' : 'نسخ المصطلح'}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-field border border-line bg-paper-soft px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
          >
            {copied ? (
              <IconCheck aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <IconCopy aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            <span>{copied ? 'تم' : 'نسخ'}</span>
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="space-y-5 p-5 sm:p-6">
        <section>
          <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
            <IconBook aria-hidden="true" className="h-3.5 w-3.5" />
            المعنى
          </h3>
          <p className="break-anywhere text-sm leading-relaxed text-ink-soft">
            {result.meaning}
          </p>
        </section>

        {result.root_breakdown && (
          <section>
            <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <IconSparkles aria-hidden="true" className="h-3.5 w-3.5" />
              تفكيك الكلمة
            </h3>
            <p className="break-anywhere text-sm leading-relaxed text-ink-soft">
              {result.root_breakdown}
            </p>
          </section>
        )}

        {result.clinical_note && (
          <section className="rounded-field border border-gold/30 bg-gold-tint p-4">
            <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gold-ink">
              <IconDoctor aria-hidden="true" className="h-3.5 w-3.5" />
              ملاحظة سريرية
            </h3>
            <p className="break-anywhere text-sm leading-relaxed text-ink-soft">
              {result.clinical_note}
            </p>
          </section>
        )}

        {result.similar_terms.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
              <IconSparkles aria-hidden="true" className="h-3.5 w-3.5" />
              مصطلحات مشابهة
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {result.similar_terms.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => onSelectTerm(t)}
                    aria-label={`ابحث عن ${t}`}
                    className="badge badge-neutral cursor-pointer transition-colors hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
                  >
                    <bdi>{t}</bdi>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Deep dive button */}
        {!showDeep && (
          <button
            type="button"
            onClick={() => setShowDeep(true)}
            className="group inline-flex items-center gap-2 rounded-field border-2 border-gold/40 bg-gold-tint px-4 py-2.5 text-sm font-bold text-gold-ink transition-all duration-200 hover:border-gold/70 hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none"
          >
            <IconSparkles
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 motion-reduce:transition-none"
            />
            اشرح لي أكثر
            <span className="rounded-chip bg-gold/20 px-1.5 py-0.5 text-[10px] font-mono">
              AI
            </span>
          </button>
        )}

        {showDeep && (
          <DeepDiveCard term={result.term} onClose={() => setShowDeep(false)} />
        )}

        <HitCount count={result.hit_count} />
      </div>
    </article>
  );
}

// ==================== Skeleton ====================
function ResultSkeleton() {
  return (
    <div
      role="status"
      aria-label="جارٍ البحث"
      className="space-y-3 rounded-card border border-line bg-paper-soft p-6"
    >
      <div className="h-7 w-40 skeleton-shimmer rounded" />
      <div className="h-5 w-32 skeleton-shimmer rounded" />
      <div className="mt-4 h-4 w-full skeleton-shimmer rounded" />
      <div className="h-4 w-3/4 skeleton-shimmer rounded" />
    </div>
  );
}

// ==================== Category Filter ====================
function CategoryFilter({
  selected,
  stats,
  onSelect,
}: {
  selected: MedicalCategory | null;
  stats: CategoryStat[];
  onSelect: (c: MedicalCategory | null) => void;
}) {
  const total = useMemo(
    () => stats.reduce((sum, s) => sum + s.count, 0),
    [stats]
  );

  const sortedStats = useMemo(
    () => [...stats].sort((a, b) => b.count - a.count),
    [stats]
  );

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`rounded-chip px-2.5 py-1 text-xs font-bold transition-all duration-150 active:scale-95 ${
          selected === null
            ? 'bg-teal text-on-teal shadow-sm'
            : 'bg-ink/5 text-ink-soft hover:bg-ink/10 dark:bg-white/5 dark:hover:bg-white/10'
        }`}
      >
        الكل
        <span className="mr-1 font-mono text-[10px] opacity-70">{total}</span>
      </button>
      {sortedStats.map((s) => {
        const active = selected === s.category;
        return (
          <button
            key={s.category}
            type="button"
            onClick={() => onSelect(active ? null : s.category)}
            className={`inline-flex items-center gap-1 rounded-chip px-2.5 py-1 text-xs font-bold transition-all duration-150 active:scale-95 ${
              active
                ? 'bg-teal text-on-teal shadow-sm'
                : 'bg-ink/5 text-ink-soft hover:bg-ink/10 dark:bg-white/5 dark:hover:bg-white/10'
            }`}
          >
            <span aria-hidden="true">{MEDICAL_CATEGORY_EMOJIS[s.category]}</span>
            {MEDICAL_CATEGORY_LABELS[s.category]}
            <span className="font-mono text-[10px] opacity-70">{s.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ==================== Page ====================
export default function DictionaryPage() {
  const toast = useToast();
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [error, setError] = useState('');
  const [popular, setPopular] = useState<PopularTerm[]>([]);
  const [popularCategory, setPopularCategory] = useState<MedicalCategory | null>(
    null
  );
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requestIdRef = useRef(0);

  // ===== تحميل أولي =====
  useEffect(() => {
    setRecent(loadRecent());

    let cancelled = false;

    async function loadCategories() {
      try {
        const data = await postJson<{ counts?: unknown }>(
          '/api/dictionary',
          { action: 'categories_stats' }
        );
        if (cancelled) return;
        const counts = (data.counts ?? {}) as Record<string, number>;
        const arr: CategoryStat[] = [];
        for (const [k, v] of Object.entries(counts)) {
          const cat = parseCategory(k);
          if (Number.isFinite(v) && v > 0) arr.push({ category: cat, count: v });
        }
        setCategoryStats(arr);
      } catch {
        /* silent */
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== تحميل الأكثر بحثاً (يُعاد عند تغيير التصنيف) =====
  useEffect(() => {
    let cancelled = false;

    async function loadPopular() {
      try {
        const data = await postJson<{ terms?: unknown }>(
          '/api/dictionary',
          {
            action: 'popular',
            category: popularCategory,
          }
        );
        if (!cancelled) setPopular(normalizePopular(data.terms));
      } catch {
        /* silent */
      }
    }

    void loadPopular();
    return () => {
      cancelled = true;
    };
  }, [popularCategory]);

  // إلغاء أي طلب معلّق عند مغادرة الصفحة
  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
    };
  }, []);

  // نقل التركيز إلى عنوان النتيجة
  useEffect(() => {
    if (result && !loading) headingRef.current?.focus();
  }, [result, loading]);

  // ===== البحث =====
  const handleLookup = useCallback(
    async (searchTerm: string) => {
      const trimmed = normalizeTerm(searchTerm);
      if (trimmed.length < MIN_TERM_LENGTH) {
        toast.show('أدخل مصطلحاً طبياً (حرفان على الأقل)', 'error');
        return;
      }

      const requestId = ++requestIdRef.current;
      setLoading(true);
      setResult(null);
      setError('');

      try {
        const data = await postJson<{ result?: unknown }>('/api/dictionary', {
          action: 'lookup',
          term: trimmed,
        });
        if (requestId !== requestIdRef.current) return;

        const normalized = normalizeResult(data.result);
        if (!normalized) {
          setError('وصلت استجابة غير مفهومة من الخادم. جرّب مرة أخرى.');
          return;
        }
        setResult(normalized);
        setRecent(saveRecent(trimmed));

        // حدّث إحصاءات التصنيفات (اختياري، fire-and-forget)
        void postJson<{ counts?: unknown }>('/api/dictionary', {
          action: 'categories_stats',
        })
          .then((d) => {
            if (requestId !== requestIdRef.current) return;
            const counts = (d.counts ?? {}) as Record<string, number>;
            const arr: CategoryStat[] = [];
            for (const [k, v] of Object.entries(counts)) {
              const cat = parseCategory(k);
              if (Number.isFinite(v) && v > 0) arr.push({ category: cat, count: v });
            }
            setCategoryStats(arr);
          })
          .catch(() => {});
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(
          err instanceof Error && err.message ? err.message : 'فشل البحث'
        );
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [toast]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleLookup(term);
  };

  const quickSearch = useCallback(
    (t: string) => {
      setTerm(t);
      void handleLookup(t);
      inputRef.current?.blur();
    },
    [handleLookup]
  );

  const clearInput = () => {
    setTerm('');
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && term) {
      e.preventDefault();
      setTerm('');
    }
  };

  const clearRecent = () => {
    clearRecentStorage();
    setRecent([]);
  };

  const normalizedLength = normalizeTerm(term).length;
  const showHints = !result && !loading && !error;
  const canSubmit = !loading && normalizedLength >= MIN_TERM_LENGTH;
  const showLengthHint =
    normalizedLength > 0 && normalizedLength < MIN_TERM_LENGTH;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <BackLink />

      {/* Header */}
      <header className="mt-6 animate-slide-up motion-reduce:animate-none">
        <span className="inline-flex items-center gap-1.5 rounded-chip border border-teal/20 bg-teal-tint px-3 py-1 font-mono text-xs text-teal">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal motion-reduce:animate-none"
          />
          أداة طبية
        </span>

        <h1 className="mt-3 flex items-center gap-2.5 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-field bg-teal-soft text-teal"
          >
            <IconDoctor className="h-5 w-5" />
          </span>
          قاموس المصطلحات الطبية
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          اكتب أي مصطلح طبي، وسنشرحه لك بمستوى طالب الطب: المعنى، تفكيك
          الكلمة، ملاحظة سريرية، ومصطلحات مشابهة. يمكنك أيضاً الاستماع للنطق
          وطلب شرح أعمق.
        </p>
      </header>

      {/* Search form */}
      <form
        role="search"
        onSubmit={handleSubmit}
        className="mt-6 animate-slide-up motion-reduce:animate-none"
        style={{ animationDelay: '80ms' }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            />
            <input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="مثال: Dyspnea, Myocardial, ضيق النفس..."
              maxLength={100}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              dir="auto"
              aria-label="أدخل المصطلح الطبي"
              aria-describedby={showLengthHint ? 'term-hint' : undefined}
              className="field-editorial w-full ps-10 pe-10 text-base"
            />
            {term && (
              <button
                type="button"
                onClick={clearInput}
                aria-label="مسح النص"
                className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-field text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
              >
                <IconClose aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-field bg-teal px-6 text-sm font-semibold text-on-teal transition-colors hover:bg-teal-hover active:bg-teal-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled-ink motion-reduce:transition-none"
          >
            {loading ? (
              <>
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
                <span>جاري البحث</span>
              </>
            ) : (
              <>
                <IconSearch aria-hidden="true" className="h-4 w-4" />
                <span>ابحث</span>
              </>
            )}
          </button>
        </div>

        {showLengthHint && (
          <p id="term-hint" className="mt-1.5 text-xs text-ink-muted">
            اكتب حرفين على الأقل للبحث.
          </p>
        )}
      </form>

      {/* Results area */}
      <div aria-busy={loading}>
        {loading && (
          <div className="mt-6">
            <ResultSkeleton />
          </div>
        )}

        {error && !loading && (
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
              <p className="text-sm font-bold text-coral-ink">
                تعذّر إتمام البحث
              </p>
              <p className="mt-0.5 break-anywhere text-xs text-ink-soft">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void handleLookup(term)}
                disabled={normalizedLength < MIN_TERM_LENGTH}
                className="mt-2 rounded-field border border-line bg-paper-soft px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="mt-6">
            <ResultCard
              result={result}
              headingRef={headingRef}
              onSelectTerm={quickSearch}
            />
          </div>
        )}
      </div>

      {/* Recent */}
      {showHints && recent.length > 0 && (
        <section
          aria-labelledby="recent-heading"
          className="mt-6 animate-slide-up motion-reduce:animate-none"
          style={{ animationDelay: '120ms' }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2
              id="recent-heading"
              className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted"
            >
              <IconClock aria-hidden="true" className="h-3.5 w-3.5" />
              آخر ما بحثت عنه
            </h2>
            <button
              type="button"
              onClick={clearRecent}
              className="rounded-field px-2 py-1 text-xs font-semibold text-ink-muted transition-colors hover:text-coral-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
            >
              مسح السجل
            </button>
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {recent.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => quickSearch(t)}
                  className="break-anywhere rounded-chip border border-line bg-paper-soft px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none"
                >
                  <bdi>{t}</bdi>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Popular */}
      {showHints && popular.length > 0 && (
        <section
          aria-labelledby="popular-heading"
          className="mt-8 animate-slide-up motion-reduce:animate-none"
          style={{ animationDelay: '160ms' }}
        >
          <h2
            id="popular-heading"
            className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink"
          >
            <IconTrending aria-hidden="true" className="h-4 w-4" />
            الأكثر بحثاً على المنصة
          </h2>

          {categoryStats.length > 0 && (
            <CategoryFilter
              selected={popularCategory}
              stats={categoryStats}
              onSelect={setPopularCategory}
            />
          )}

          <ul className="grid gap-2 sm:grid-cols-2">
            {popular.map((t) => (
              <li key={t.term}>
                <button
                  type="button"
                  onClick={() => quickSearch(t.term)}
                  className="group flex w-full items-center justify-between gap-3 rounded-card border border-line bg-paper-soft px-4 py-3 text-start transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-ink transition-colors group-hover:text-teal">
                      <span aria-hidden="true">
                        {MEDICAL_CATEGORY_EMOJIS[t.category]}
                      </span>
                      <bdi>{t.term}</bdi>
                    </p>
                    {t.arabic_translation && (
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        <bdi>{t.arabic_translation}</bdi>
                      </p>
                    )}
                  </div>
                  {t.hit_count > 0 && (
                    <span
                      className="shrink-0 rounded-chip bg-paper-deep px-2 py-0.5 font-mono text-[10px] font-bold text-ink-muted"
                      aria-label={`${t.hit_count} عملية بحث`}
                    >
                      <span className="num-inline">{t.hit_count}</span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Disclaimer */}
      <aside className="mt-10 flex items-start gap-2 rounded-field border border-gold/30 bg-gold-tint p-4 text-xs text-ink-soft">
        <span aria-hidden="true" className="shrink-0 text-gold-ink">
          <IconWarning className="h-4 w-4" />
        </span>
        <p className="leading-relaxed">
          <strong className="font-semibold text-ink">ملاحظة:</strong> هذا
          القاموس مساعد دراسي وليس مرجعاً طبياً. الملاحظات السريرية والشرح
          العميق مولّدة بالذكاء الاصطناعي — راجع دائماً المصادر الرسمية.
        </p>
      </aside>
    </main>
  );
}