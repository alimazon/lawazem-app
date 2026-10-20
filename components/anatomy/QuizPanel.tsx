'use client';

// components/anatomy/QuizPanel.tsx
import { MUSCLE_BY_ID } from '@/lib/anatomy-data';
import { ACTION_AR } from '@/lib/anatomy-ar';
import { FACIAL_BRANCHES } from '@/lib/anatomy-extras';
import type { Question } from '@/lib/anatomy-quiz';
import { badge, btnGhost, btnPrimary } from './ui-classes';

export interface QuizState {
  questions: Question[];
  index: number;
  picked: string | null;
  score: number;
  streak: number;
  bestStreak: number;
  missed: string[];
  done: boolean;
}

interface Props {
  state: QuizState;
  best: number;
  onAnswer: (choice: string) => void;
  onNext: () => void;
  onRestart: () => void;
  onExit: () => void;
  onReview: (id: string) => void;
}

const PROMPT: Record<Question['kind'], string> = {
  locate: 'اضغط على هذه العضلة في الرسم',
  identify: 'ما اسم العضلة المظلَّلة في الرسم؟',
  action: 'أي عضلة تقوم بهذه الوظيفة؟',
  attach: 'أي عضلة لها هذا المنشأ والمرتكز؟',
  branch: 'ما فرع العصب الوجهي الذي يغذّي هذه العضلة؟',
};

const optionBase =
  'w-full rounded-field border px-3 py-2 text-start text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-default motion-reduce:transition-none';

function optionTone(answered: boolean, isCorrect: boolean, isPicked: boolean): string {
  if (!answered) return 'border-line bg-paper-soft text-ink hover:border-teal/50';
  if (isCorrect) return 'border-teal bg-teal-soft text-ink';
  if (isPicked) return 'border-coral bg-coral-soft text-ink';
  return 'border-line bg-paper-soft text-ink-muted opacity-60';
}

export default function QuizPanel({ state, best, onAnswer, onNext, onRestart, onExit, onReview }: Props) {
  const total = state.questions.length;

  if (state.done) {
    const pct = Math.round((state.score / total) * 100);
    const verdict =
      pct === 100 ? 'ممتاز! علامة كاملة.' : pct >= 80 ? 'مستواك قوي، راجع الأخطاء وتنتهي.' : pct >= 50 ? 'جيد، يحتاج مراجعة بسيطة.' : 'لا بأس، ابدأ بالاستكشاف ثم أعد المحاولة.';
    return (
      <div>
        <p className="text-xs font-bold tracking-wide text-ink-muted">انتهت الجولة</p>
        <p className="mt-1 font-display text-3xl font-bold text-ink">
          {state.score}
          <span className="text-lg text-ink-muted"> / {total}</span>
        </p>
        <p className="mt-1 text-sm text-ink-soft">{verdict}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={badge}>أفضل نتيجة: {Math.max(best, state.score)}/{total}</span>
          <span className={badge}>أطول سلسلة: {state.bestStreak}</span>
        </div>

        {state.missed.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-bold text-ink-muted">للمراجعة (اضغط لفتحها في الأطلس):</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {state.missed.map((id) => (
                <button
                  key={id}
                  type="button"
                  dir="ltr"
                  onClick={() => onReview(id)}
                  className="rounded-chip border border-coral/40 bg-coral-soft px-2.5 py-1 text-xs text-ink hover:border-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  {MUSCLE_BY_ID[id]?.en ?? id}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={onRestart}>جولة جديدة</button>
          <button type="button" className={btnGhost} onClick={onExit}>رجوع للأطلس</button>
        </div>
      </div>
    );
  }

  const q = state.questions[state.index];
  if (!q) return null;
  const m = MUSCLE_BY_ID[q.id];
  const answered = state.picked !== null;
  const correct = answered && state.picked === q.correct;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold tracking-wide text-ink-muted">
          سؤال <span className="font-mono">{state.index + 1}</span> من <span className="font-mono">{total}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <span className={badge}>النتيجة {state.score}</span>
          {state.streak >= 2 && <span className={badge}>🔥 {state.streak}</span>}
          <button type="button" onClick={onExit} className="text-xs font-semibold text-ink-muted underline-offset-2 hover:text-teal hover:underline focus-visible:outline-2 focus-visible:outline-teal">
            خروج
          </button>
        </div>
      </div>

      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full bg-teal transition-all duration-300 motion-reduce:transition-none" style={{ width: `${((state.index + (answered ? 1 : 0)) / total) * 100}%` }} />
      </div>

      <h3 className="mt-3 text-sm font-bold text-ink">{PROMPT[q.kind]}</h3>

      {(q.kind === 'locate' || q.kind === 'branch') && m && (
        <p dir="ltr" className="mt-1 text-start font-display text-xl font-bold text-ink">{m.en}</p>
      )}
      {q.kind === 'action' && m && (
        <p dir="ltr" className="mt-1 rounded-field border border-line bg-paper px-3 py-2 text-start text-[13px] leading-snug text-ink-soft">{m.actEn}</p>
      )}
      {q.kind === 'attach' && m && (
        <dl dir="ltr" className="mt-1 rounded-field border border-line bg-paper px-3 py-2 text-start text-[13px] leading-snug text-ink-soft">
          <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Origin</dt>
          <dd>{m.origin}</dd>
          <dt className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Insertion</dt>
          <dd>{m.insertion}</dd>
        </dl>
      )}

      {q.kind === 'locate' && !answered && (
        <button type="button" className={`${btnGhost} mt-3 w-full`} onClick={() => onAnswer('__skip')}>
          لا أعرف
        </button>
      )}

      {q.kind !== 'locate' && (
        <ul className="mt-3 grid gap-2">
          {q.options.map((opt) => {
            const label =
              q.kind === 'branch'
                ? FACIAL_BRANCHES.find((b) => b.id === opt)
                : null;
            const text = label ? label.en : (MUSCLE_BY_ID[opt]?.en ?? opt);
            return (
              <li key={opt}>
                <button
                  type="button"
                  dir="ltr"
                  disabled={answered}
                  onClick={() => onAnswer(opt)}
                  className={`${optionBase} ${optionTone(answered, opt === q.correct, opt === state.picked)}`}
                >
                  {text}
                  {label && <span dir="rtl" className="ms-2 text-xs text-ink-muted">({label.ar})</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {answered && m && (
        <div className="mt-3 rounded-field border border-line bg-paper p-3" role="status">
          <p className={`text-sm font-bold ${correct ? 'text-teal' : 'text-coral-ink'}`}>
            {correct ? 'إجابة صحيحة ✓' : 'ليست صحيحة'}
          </p>
          <p dir="ltr" className="mt-1 text-start text-sm font-bold text-ink">{m.en}</p>
          <p dir="ltr" className="mt-0.5 text-start text-[13px] leading-relaxed text-ink">{m.actEn}</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{ACTION_AR[m.id]}</p>
          <p dir="ltr" className="mt-1 text-start text-xs text-ink-muted">{m.nerve}</p>
        </div>
      )}

      {answered && (
        <button type="button" className={`${btnPrimary} mt-3 w-full`} onClick={onNext} autoFocus>
          {state.index + 1 >= total ? 'عرض النتيجة' : 'السؤال التالي'}
        </button>
      )}
    </div>
  );
}