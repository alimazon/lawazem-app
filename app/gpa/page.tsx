// app/gpa/page.tsx
'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useStudentStage } from '@/hooks/useStudentStage';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Field';
import {
  IconArrowRight,
  IconChart,
  IconCheck,
  IconChevronDown,
  IconTarget,
  IconTrending,
  IconWarning,
} from '@/components/ui/Icons';
import type { Subject } from '@/lib/types';

// ==================== Constants ====================
interface ComponentDef {
  key: string;
  label: string;
  defaultMax: number;
}

const COMPONENTS: readonly ComponentDef[] = [
  { key: 'first', label: 'الفصل الأول', defaultMax: 10 },
  { key: 'mid', label: 'المد', defaultMax: 20 },
  { key: 'second', label: 'الفصل الثاني', defaultMax: 10 },
  { key: 'finalTheory', label: 'الفاينل (نظري)', defaultMax: 40 },
  { key: 'finalPractical', label: 'الفاينل (عملي)', defaultMax: 20 },
] as const;

interface TargetDef {
  value: number;
  label: string;
  short: string;
}

// ✅ 5 تقديرات عراقية: مقبول / متوسط / جيد / جيد جداً / امتياز
const TARGETS: readonly TargetDef[] = [
  { value: 50, label: 'مقبول', short: 'مقبول' },
  { value: 60, label: 'متوسط', short: 'متوسط' },
  { value: 70, label: 'جيد', short: 'جيد' },
  { value: 80, label: 'جيد جداً', short: 'جيد جداً' },
  { value: 90, label: 'امتياز', short: 'امتياز' },
] as const;

const TARGET_KEY_PREFIX = 'gpa_target_';
const SCORES_KEY_PREFIX = 'gpa_scores_';

/** هامش صغير لتفادي أخطاء الفاصلة العائمة */
const EPS = 1e-9;

// ==================== Types ====================
interface ComponentData {
  max: string;
  score: string;
}
type SubjectScores = Record<string, ComponentData>;
type AllScores = Record<string, SubjectScores>;

interface TargetAnalysis {
  currentScore: number;
  totalMax: number;
  remainingMax: number;
  targetScore: number;
  needFromRemaining: number;
  achieved: boolean;
  impossible: boolean;
  noData: boolean;
  allEntered: boolean;
}

interface ComponentIssues {
  max: string | null;
  score: string | null;
}

// ==================== Storage helpers ====================
function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

// ==================== Helpers ====================
function defaultSubjectScores(): SubjectScores {
  const obj: SubjectScores = {};
  for (const c of COMPONENTS) obj[c.key] = { max: String(c.defaultMax), score: '' };
  return obj;
}

function toStringValue(v: unknown, fallback: string): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return fallback;
}

function sanitizeSubjectScores(raw: unknown): SubjectScores {
  const defaults = defaultSubjectScores();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;
  const source = raw as Record<string, unknown>;
  const result: SubjectScores = {};
  for (const c of COMPONENTS) {
    const fallback = defaults[c.key];
    const item = source[c.key];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      result[c.key] = fallback;
      continue;
    }
    const rec = item as Record<string, unknown>;
    result[c.key] = {
      max: toStringValue(rec.max, fallback.max),
      score: toStringValue(rec.score, fallback.score),
    };
  }
  return result;
}

function safeParseScores(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      return parsed as Record<string, unknown>;
  } catch {
    /* تجاهل */
  }
  return {};
}

function normalizeNumericInput(raw: string): string {
  let s = raw
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u066B\u066C,\u060C]/g, '.')
    .replace(/[^\d.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  return s.slice(0, 6);
}

function fmtNum(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function fmtNeed(n: number): string {
  return fmtNum(Math.ceil(n * 10 - EPS) / 10);
}

function getComponentIssues(comp: ComponentData): ComponentIssues {
  const maxNum = Number(comp.max);
  const maxInvalid =
    comp.max.trim() === '' || Number.isNaN(maxNum) || maxNum <= 0;
  const max = maxInvalid ? 'الدرجة العظمى يجب أن تكون أكبر من صفر' : null;

  let score: string | null = null;
  if (comp.score !== '') {
    const scoreNum = Number(comp.score);
    if (Number.isNaN(scoreNum)) {
      score = 'أدخل رقماً صحيحاً';
    } else if (!maxInvalid && scoreNum > maxNum + EPS) {
      score = `الدرجة أكبر من الحد الأقصى (${fmtNum(maxNum)})`;
    }
  }
  return { max, score };
}

function calculatePercentage(subjectScores: SubjectScores | undefined): number | null {
  if (!subjectScores) return null;
  let totalMax = 0;
  let totalScore = 0;
  let anyEntered = false;

  for (const c of COMPONENTS) {
    const comp = subjectScores[c.key];
    if (!comp || comp.score === '') continue;
    const scoreNum = Number(comp.score);
    const maxNum = Number(comp.max);
    if (Number.isNaN(scoreNum) || Number.isNaN(maxNum) || maxNum <= 0) continue;
    if (scoreNum < 0 || scoreNum > maxNum) continue;
    anyEntered = true;
    totalMax += maxNum;
    totalScore += scoreNum;
  }
  if (!anyEntered || totalMax === 0) return null;
  return (totalScore / totalMax) * 100;
}

function analyzeForTarget(
  subjectScores: SubjectScores | undefined,
  targetPercent: number
): TargetAnalysis {
  const base: TargetAnalysis = {
    currentScore: 0,
    totalMax: 0,
    remainingMax: 0,
    targetScore: 0,
    needFromRemaining: 0,
    achieved: false,
    impossible: false,
    noData: true,
    allEntered: false,
  };

  if (!subjectScores) return base;

  let currentScore = 0;
  let totalMax = 0;
  let remainingMax = 0;
  let enteredCount = 0;

  for (const c of COMPONENTS) {
    const comp = subjectScores[c.key];
    if (!comp) continue;
    const maxNum = Number(comp.max);
    if (Number.isNaN(maxNum) || maxNum <= 0) continue;

    totalMax += maxNum;

    if (comp.score === '') {
      remainingMax += maxNum;
    } else {
      const scoreNum = Number(comp.score);
      if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxNum) {
        remainingMax += maxNum;
        continue;
      }
      currentScore += scoreNum;
      enteredCount++;
    }
  }

  if (totalMax === 0) return base;

  const targetScore = (targetPercent / 100) * totalMax;
  const needFromRemaining = targetScore - currentScore;
  const achieved = needFromRemaining <= EPS;
  const impossible = !achieved && needFromRemaining > remainingMax + EPS;
  const noData = enteredCount === 0;
  const allEntered = remainingMax === 0;

  return {
    currentScore,
    totalMax,
    remainingMax,
    targetScore,
    needFromRemaining,
    achieved,
    impossible,
    noData,
    allEntered,
  };
}

function getScoreColor(pct: number): string {
  if (pct >= 85) return 'bg-teal/10 text-teal dark:bg-teal/20';
  if (pct >= 70) return 'bg-teal/8 text-teal';
  if (pct >= 50) return 'bg-gold/15 text-gold-ink dark:bg-gold/25';
  return 'bg-coral/15 text-coral-ink dark:bg-coral/25';
}

// ✅ التقدير العراقي حسب 5 مستويات
function getGradeLabel(pct: number): string {
  if (pct >= 90) return 'امتياز';
  if (pct >= 80) return 'جيد جداً';
  if (pct >= 70) return 'جيد';
  if (pct >= 60) return 'متوسط';
  if (pct >= 50) return 'مقبول';
  return 'دون النجاح';
}

function hasAnyScore(scores: SubjectScores | undefined): boolean {
  if (!scores) return false;
  return COMPONENTS.some((c) => (scores[c.key]?.score ?? '') !== '');
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="mt-6 space-y-2" role="status" aria-busy="true">
      <span className="sr-only">جارٍ التحميل…</span>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex items-center justify-between rounded-card border border-line bg-paper-soft p-4"
        >
          <div className="h-4 w-40 skeleton-shimmer rounded" />
          <div className="h-6 w-16 skeleton-shimmer rounded-chip" />
        </div>
      ))}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-1.5 text-sm font-bold text-teal transition-colors hover:text-teal-hover"
    >
      <span className="transition-transform duration-200 motion-reduce:transition-none rtl:group-hover:translate-x-1 ltr:group-hover:-translate-x-1">
        <IconArrowRight className="h-4 w-4 ltr:rotate-180" />
      </span>
      رجوع إلى لوحة الأقسام
    </Link>
  );
}

// ==================== Target Selector ====================
function TargetSelector({
  target,
  onChange,
}: {
  target: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="rounded-card border border-line bg-paper-soft p-4"
      role="group"
      aria-labelledby="gpa-target-title"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-field bg-teal/10 text-teal"
        >
          <IconTarget className="h-4 w-4" />
        </span>
        <div>
          <p id="gpa-target-title" className="text-sm font-bold text-ink">
            هدفي في كل مادة
          </p>
          <p className="text-[11px] text-ink-muted">
            اختر هدفك، وسنخبرك بكم تحتاج في المتبقي
          </p>
        </div>
      </div>

      {/* ✅ 5 أزرار */}
      <div className="grid grid-cols-5 gap-1.5">
        {TARGETS.map((t) => {
          const active = target === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              aria-pressed={active}
              aria-label={`${t.label}، ${t.value} بالمئة`}
              className={`rounded-field border px-1 py-2.5 text-center transition-all duration-200 motion-reduce:transition-none active:scale-95 ${
                active
                  ? 'border-teal bg-teal text-on-teal shadow-sm'
                  : 'border-line bg-paper text-ink-soft hover:border-teal/40'
              }`}
            >
              <p
                aria-hidden="true"
                className={`font-mono text-base font-bold leading-none ${
                  active ? '' : 'text-ink'
                }`}
              >
                {t.value}
                <span className="text-[10px]">%</span>
              </p>
              <p
                aria-hidden="true"
                className={`mt-0.5 truncate text-[9px] font-bold ${
                  active ? 'text-on-teal/90' : 'text-ink-muted'
                }`}
              >
                {t.short}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== Target Analysis Card ====================
function TargetAnalysisCard({
  analysis,
  target,
  subjectName,
}: {
  analysis: TargetAnalysis;
  target: number;
  subjectName: string;
}) {
  if (analysis.noData) {
    return (
      <div className="rounded-card border border-line bg-paper p-4 text-center">
        <p className="text-sm text-ink-muted">أدخل أي درجة لتظهر لك التوقعات</p>
      </div>
    );
  }

  if (analysis.achieved) {
    return (
      <div className="rounded-card border border-teal/30 bg-teal/5 p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-field bg-teal text-on-teal"
          >
            <IconCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-teal">
              ضمنت {getGradeLabel(target)} في {subjectName}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              حتى لو جبت صفر في المتبقي، لسا محقق هدفك.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (analysis.impossible) {
    return (
      <div className="rounded-card border border-coral/30 bg-coral/5 p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-field bg-coral text-on-coral"
          >
            <IconWarning className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-coral-ink">
              صعب تحقيق {getGradeLabel(target)} في {subjectName}
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              تحتاج {fmtNeed(analysis.needFromRemaining)} درجة، والحد الأقصى
              المتبقي {fmtNum(analysis.remainingMax)} فقط.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPct =
    analysis.targetScore > 0
      ? Math.min(100, Math.max(0, (analysis.currentScore / analysis.targetScore) * 100))
      : 0;

  return (
    <div className="rounded-card border border-gold/30 bg-gold/5 p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-field bg-gold text-on-gold"
        >
          <IconTrending className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">
            تحتاج{' '}
            <span className="text-lg text-gold-ink">
              {fmtNeed(analysis.needFromRemaining)}
            </span>{' '}
            درجة
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            من أصل <strong>{fmtNum(analysis.remainingMax)}</strong> متبقية لتحقق
            تقدير {getGradeLabel(target)} في {subjectName}
          </p>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-ink-muted">
              <span>حالياً: {fmtNum(analysis.currentScore)}</span>
              <span>الهدف: {fmtNum(analysis.targetScore)}</span>
            </div>
            <div
              aria-hidden="true"
              className="h-2 overflow-hidden rounded-chip bg-ink/8 dark:bg-white/10"
            >
              <div
                className="h-full rounded-chip bg-gradient-to-l from-gold to-gold-light transition-all duration-500 motion-reduce:transition-none"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Status Chip ====================
function StatusChip({
  analysis,
  target,
}: {
  analysis: TargetAnalysis;
  target: number;
}) {
  if (analysis.noData) return null;

  if (analysis.achieved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-chip bg-teal/15 px-2 py-0.5 text-[10px] font-bold text-teal">
        <IconCheck className="h-3 w-3" />
        ضمنت {getGradeLabel(target)}
      </span>
    );
  }

  if (analysis.impossible) {
    return (
      <span className="inline-flex items-center gap-1 rounded-chip bg-coral/15 px-2 py-0.5 text-[10px] font-bold text-coral-ink">
        <IconWarning className="h-3 w-3" />
        {getGradeLabel(target)} صعب
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-chip bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold-ink">
      <IconTrending className="h-3 w-3" />
      تحتاج {fmtNeed(analysis.needFromRemaining)} لـ{getGradeLabel(target)}
    </span>
  );
}

// ==================== Subject Row (memo) ====================
interface SubjectRowProps {
  subject: Subject;
  index: number;
  scores: SubjectScores | undefined;
  target: number;
  isOpen: boolean;
  onToggle: (subjectId: string) => void;
  onUpdate: (
    subjectId: string,
    componentKey: string,
    field: 'max' | 'score',
    value: string
  ) => void;
  onClear: (subjectId: string, subjectName: string) => void;
}

const SubjectRow = memo(function SubjectRow({
  subject,
  index,
  scores,
  target,
  isOpen,
  onToggle,
  onUpdate,
  onClear,
}: SubjectRowProps) {
  const percentage = useMemo(() => calculatePercentage(scores), [scores]);
  const analysis = useMemo(() => analyzeForTarget(scores, target), [scores, target]);
  const scoreColor = percentage !== null ? getScoreColor(percentage) : '';
  const panelId = `gpa-panel-${subject.id}`;
  const triggerId = `gpa-trigger-${subject.id}`;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return;
    const el = e.target;
    if (!(el instanceof HTMLInputElement) || !el.hasAttribute('data-gpa-score')) return;
    e.preventDefault();
    const inputs = Array.from(
      e.currentTarget.querySelectorAll<HTMLInputElement>('input[data-gpa-score]')
    );
    const next = inputs[inputs.indexOf(el) + 1];
    if (next) next.focus();
    else el.blur();
  };

  return (
    <div
      style={{ animationDelay: `${index * 40}ms` }}
      className="overflow-hidden rounded-card border border-line bg-paper-soft transition-all duration-200 motion-reduce:transition-none animate-slide-up motion-reduce:animate-none"
    >
      <button
        id={triggerId}
        type="button"
        onClick={() => onToggle(subject.id)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 p-4 text-start transition-colors hover:bg-paper"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-ink">{subject.name}</span>
            {subject.units != null && (
              <span className="text-xs text-ink-muted">({subject.units} وحدة)</span>
            )}
          </div>
          <div className="mt-1">
            <StatusChip analysis={analysis} target={target} />
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {percentage !== null ? (
            <span
              className={`rounded-chip px-3 py-1 text-sm font-bold ${scoreColor}`}
              aria-label={`النسبة ${percentage.toFixed(1)} بالمئة`}
            >
              {percentage.toFixed(1)}%
            </span>
          ) : (
            <span className="text-sm text-ink-muted" aria-label="لم تُدخل درجات بعد">
              —
            </span>
          )}
          <IconChevronDown
            aria-hidden="true"
            className={`h-4 w-4 flex-shrink-0 text-ink-muted transition-transform duration-200 motion-reduce:transition-none ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        inert={!isOpen}
        className={`grid transition-all duration-300 motion-reduce:transition-none ease-[var(--ease-editorial)] ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className="space-y-4 border-t border-line bg-paper/40 p-4"
            onKeyDown={handleKeyDown}
          >
            <TargetAnalysisCard
              analysis={analysis}
              target={target}
              subjectName={subject.name}
            />

            <div className="space-y-3">
              {COMPONENTS.map((c) => {
                const comp: ComponentData = scores?.[c.key] ?? { max: '', score: '' };
                const issues = getComponentIssues(comp);
                const issueText = issues.score ?? issues.max;
                const scoreId = `${subject.id}-${c.key}-score`;
                const maxId = `${subject.id}-${c.key}-max`;
                const errId = `${subject.id}-${c.key}-err`;
                return (
                  <div
                    key={c.key}
                    role="group"
                    aria-label={c.label}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
                  >
                    <label
                      htmlFor={scoreId}
                      className="w-full text-sm font-medium text-ink-soft sm:w-28"
                    >
                      {c.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={scoreId}
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        autoComplete="off"
                        enterKeyHint="next"
                        data-gpa-score=""
                        value={comp.score}
                        onChange={(e) =>
                          onUpdate(
                            subject.id,
                            c.key,
                            'score',
                            normalizeNumericInput(e.target.value)
                          )
                        }
                        onFocus={(e) => e.currentTarget.select()}
                        placeholder="درجتك"
                        aria-invalid={issues.score !== null}
                        aria-describedby={issueText ? errId : undefined}
                        className="w-20 text-center"
                      />
                      <span className="text-sm text-ink-muted" aria-hidden="true">
                        من
                      </span>
                      <Input
                        id={maxId}
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        autoComplete="off"
                        value={comp.max}
                        onChange={(e) =>
                          onUpdate(
                            subject.id,
                            c.key,
                            'max',
                            normalizeNumericInput(e.target.value)
                          )
                        }
                        onFocus={(e) => e.currentTarget.select()}
                        aria-label={`الدرجة العظمى لـ${c.label}`}
                        aria-invalid={issues.max !== null}
                        aria-describedby={issues.max ? errId : undefined}
                        className="w-16 text-center"
                      />
                    </div>
                    {issueText && (
                      <p
                        id={errId}
                        className="basis-full text-xs font-medium text-coral-ink"
                      >
                        {issueText}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {hasAnyScore(scores) && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onClear(subject.id, subject.name)}
                  className="text-coral-ink hover:bg-coral/10"
                >
                  مسح درجات هذه المادة
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ==================== Page ====================
export default function GpaPage() {
  const { stage, ready } = useStudentStage();
  const confirm = useConfirm();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<AllScores>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<number>(50);
  const [storageFailed, setStorageFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const storageKey = stage ? `${SCORES_KEY_PREFIX}${stage}` : '';
  const targetKey = stage ? `${TARGET_KEY_PREFIX}${stage}` : '';

  const dirtyRef = useRef(false);
  const orphansRef = useRef<Record<string, unknown>>({});

  // ---- تحميل الهدف المحفوظ ----
  useEffect(() => {
    if (!targetKey) return;
    const saved = Number(readStorage(targetKey));
    if (Number.isFinite(saved) && TARGETS.some((t) => t.value === saved)) {
      setTarget(saved);
    }
  }, [targetKey]);

  // ---- تحميل المواد + الدرجات ----
  useEffect(() => {
    if (!stage) return;
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('id, name, stage, units')
        .eq('stage', stage)
        .order('name');

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const subjectList = (data ?? []) as Subject[];
      const saved = safeParseScores(readStorage(`${SCORES_KEY_PREFIX}${stage}`));
      const ids = new Set(subjectList.map((s) => s.id));

      const merged: AllScores = {};
      for (const s of subjectList) merged[s.id] = sanitizeSubjectScores(saved[s.id]);

      const orphans: Record<string, unknown> = {};
      for (const [id, value] of Object.entries(saved)) {
        if (!ids.has(id)) orphans[id] = value;
      }

      orphansRef.current = orphans;
      dirtyRef.current = false;
      setSubjects(subjectList);
      setScores(merged);
      setLoading(false);
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [stage, reloadKey]);

  // ---- حفظ الدرجات ----
  useEffect(() => {
    if (!storageKey || !dirtyRef.current) return;
    const ok = writeStorage(
      storageKey,
      JSON.stringify({ ...orphansRef.current, ...scores })
    );
    setStorageFailed((prev) => (prev === !ok ? prev : !ok));
  }, [scores, storageKey]);

  const handleTargetChange = useCallback(
    (value: number) => {
      setTarget(value);
      if (targetKey) writeStorage(targetKey, String(value));
    },
    [targetKey]
  );

  const updateComponent = useCallback(
    (
      subjectId: string,
      componentKey: string,
      field: 'max' | 'score',
      value: string
    ) => {
      dirtyRef.current = true;
      setScores((prev) => {
        const subject = prev[subjectId] ?? defaultSubjectScores();
        const current: ComponentData = subject[componentKey] ?? { max: '', score: '' };
        return {
          ...prev,
          [subjectId]: {
            ...subject,
            [componentKey]: { ...current, [field]: value },
          },
        };
      });
    },
    []
  );

  const toggleExpand = useCallback((subjectId: string) => {
    setExpanded((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  }, []);

  const clearSubject = useCallback(
    async (subjectId: string, subjectName: string) => {
      const ok = await confirm(`حذف كل درجات مادة «${subjectName}». هل أنت متأكد؟`, {
        variant: 'danger',
        confirmLabel: 'حذف',
      });
      if (!ok) return;
      dirtyRef.current = true;
      setScores((prev) => ({ ...prev, [subjectId]: defaultSubjectScores() }));
    },
    [confirm]
  );

  const resetScores = useCallback(async () => {
    const ok = await confirm('حذف كل الدرجات المدخلة لهذه المرحلة. هل أنت متأكد؟', {
      variant: 'danger',
      confirmLabel: 'حذف',
    });
    if (!ok) return;
    const cleared: AllScores = {};
    for (const s of subjects) cleared[s.id] = defaultSubjectScores();
    orphansRef.current = {};
    dirtyRef.current = true;
    setScores(cleared);
  }, [confirm, subjects]);

  // ---- إحصاءات المعدل ----
  const stats = useMemo(() => {
    let weightedSum = 0;
    let totalUnits = 0;
    let simpleSum = 0;
    let enteredCount = 0;
    let withoutUnits = 0;

    for (const s of subjects) {
      const pct = calculatePercentage(scores[s.id]);
      if (pct === null) continue;
      enteredCount++;
      simpleSum += pct;
      const units = Number(s.units ?? 0);
      if (Number.isFinite(units) && units > 0) {
        totalUnits += units;
        weightedSum += units * pct;
      } else {
        withoutUnits++;
      }
    }

    const usedSimple = enteredCount > 0 && totalUnits === 0;
    const average =
      totalUnits > 0
        ? weightedSum / totalUnits
        : usedSimple
          ? simpleSum / enteredCount
          : null;

    return {
      average,
      usedSimple,
      skippedUnits: usedSimple ? 0 : withoutUnits,
      allFilled: subjects.length > 0 && enteredCount === subjects.length,
      progress: subjects.length > 0 ? (enteredCount / subjects.length) * 100 : 0,
      enteredCount,
    };
  }, [subjects, scores]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
      <BackLink />

      <div className="mt-6 animate-slide-up motion-reduce:animate-none">
        <span className="stage-badge">{stage}</span>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
          المعدل
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          افتح كل مادة وأدخل درجاتك. سنحسب معدلك، وسنخبرك بكم تحتاج في المتبقي
          لتحقيق هدفك.
        </p>
      </div>

      {loading && <Skeleton />}

      {!loading && error && (
        <div
          role="alert"
          className="mt-6 rounded-card border border-coral/30 bg-coral/5 p-4 text-sm text-coral-ink animate-slide-up motion-reduce:animate-none"
        >
          <p className="font-bold">خطأ في الاتصال بقاعدة البيانات</p>
          <p className="mt-1 opacity-80">{error}</p>
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReloadKey((k) => k + 1)}
              className="text-coral-ink hover:bg-coral/10"
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && subjects.length === 0 && (
        <div className="mt-6 rounded-card border border-line bg-paper-soft p-10 text-center animate-slide-up motion-reduce:animate-none">
          <div
            aria-hidden="true"
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-card bg-teal/8 text-teal"
          >
            <IconChart className="h-10 w-10" />
          </div>
          <p className="mt-4 font-bold text-ink-soft">
            لا توجد مواد مضافة لمرحلتك حالياً.
          </p>
        </div>
      )}

      {!loading && !error && subjects.length > 0 && (
        <>
          {storageFailed && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2 rounded-card border border-gold/30 bg-gold/5 p-3 text-xs text-ink-soft animate-slide-up motion-reduce:animate-none"
            >
              <IconWarning
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-ink"
              />
              <p>
                تعذّر حفظ درجاتك على هذا الجهاز (التخزين ممتلئ أو معطّل). ستبقى
                ظاهرة ما دمت في الصفحة فقط.
              </p>
            </div>
          )}

          <div className="mt-6 animate-slide-up motion-reduce:animate-none">
            <TargetSelector target={target} onChange={handleTargetChange} />
          </div>

          {stats.enteredCount > 0 && !stats.allFilled && (
            <div className="mt-6 animate-slide-up motion-reduce:animate-none">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink-muted">
                <span id="gpa-progress-label">التقدم</span>
                <span>
                  {stats.enteredCount} من {subjects.length} مادة
                </span>
              </div>
              <div
                role="progressbar"
                aria-labelledby="gpa-progress-label"
                aria-valuemin={0}
                aria-valuemax={subjects.length}
                aria-valuenow={stats.enteredCount}
                aria-valuetext={`${stats.enteredCount} من ${subjects.length} مادة`}
                className="h-2 overflow-hidden rounded-chip bg-ink/8 dark:bg-white/10"
              >
                <div
                  className="h-full rounded-chip bg-gradient-to-l from-teal to-teal-light transition-all duration-500 motion-reduce:transition-none"
                  style={{ width: `${stats.progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-6 space-y-2">
            {subjects.map((s, idx) => (
              <SubjectRow
                key={s.id}
                subject={s}
                index={idx}
                scores={scores[s.id]}
                target={target}
                isOpen={!!expanded[s.id]}
                onToggle={toggleExpand}
                onUpdate={updateComponent}
                onClear={clearSubject}
              />
            ))}
          </div>

          <div
            aria-live="polite"
            className="mt-6 overflow-hidden rounded-card border border-line bg-gradient-to-bl from-teal/5 via-teal/3 to-gold/5 p-6 text-center shadow-sm animate-slide-up motion-reduce:animate-none"
          >
            {stats.average !== null ? (
              <>
                <p className="text-sm font-bold text-ink-soft">
                  {stats.allFilled ? 'معدلك النهائي' : 'معدلك الحالي (جزئي)'}
                </p>
                <p
                  dir="ltr"
                  className="mt-2 bg-gradient-to-l from-teal to-teal-light bg-clip-text font-mono text-5xl font-bold text-transparent"
                >
                  {stats.average.toFixed(2)}
                  <span className="text-2xl">%</span>
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-chip bg-paper px-3 py-1 text-xs font-bold text-ink-soft">
                    التقدير: {getGradeLabel(stats.average)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-chip bg-paper px-3 py-1 text-xs font-bold text-ink-soft">
                    <IconTarget aria-hidden="true" className="h-3.5 w-3.5 text-teal" />
                    هدفك: {getGradeLabel(target)}
                  </span>
                </div>
                {stats.usedSimple && (
                  <p className="mt-3 text-[11px] text-ink-muted">
                    لم تُحدَّد وحدات المواد، فاحتُسب المتوسط البسيط.
                  </p>
                )}
                {stats.skippedUnits > 0 && (
                  <p className="mt-3 text-[11px] text-ink-muted">
                    {stats.skippedUnits} مادة بلا وحدات لم تدخل في حساب المعدل.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-muted">أدخل درجاتك ليظهر معدلك.</p>
            )}
          </div>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetScores}
              className="text-coral-ink hover:bg-coral/10"
            >
              مسح كل الدرجات
            </Button>
          </div>
        </>
      )}
    </main>
  );
}