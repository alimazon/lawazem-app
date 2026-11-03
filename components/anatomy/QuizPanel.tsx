'use client';

// components/anatomy/QuizPanel.tsx
import { useState } from 'react';
import { MUSCLE_BY_ID } from '@/lib/anatomy-data';
import { ACTION_AR } from '@/lib/anatomy-ar';
import { FACIAL_BRANCHES } from '@/lib/anatomy-extras';
import { TRIANGLES } from '@/lib/anatomy-neck-notes';
import { NERVE_OPTIONS, type Question, type QuizScope } from '@/lib/anatomy-quiz';

export interface QuizState {
  questions: Question[];
  index: number;
  picked: string | null;
  score: number;
  streak: number;
  bestStreak: number;
  missed: string[];
  done: boolean;
  scope: QuizScope;
  hinted: boolean;
}

interface SetupProps {
  best: Record<QuizScope, number>;
  onStart: (o: { scope: QuizScope; count: number }) => void;
  onExit: () => void;
}

const SCOPES: readonly { id: QuizScope; en: string; ar: string }[] = [
  { id: 'all', en: 'Face & neck', ar: 'الوجه والرقبة' },
  { id: 'face', en: 'Face only', ar: 'الوجه فقط' },
  { id: 'neck', en: 'Neck only', ar: 'الرقبة فقط (ومثلثاتها)' },
];

export function QuizSetup({ best, onStart, onExit }: SetupProps) {
  const [scope, setScope] = useState<QuizScope>('all');
  const [count, setCount] = useState(10);
  return (
    <div className="fq">
      <p className="fq-eyebrow">اختبر نفسك</p>
      <h2 className="fq-title">Quiz</h2>

      <p className="fq-label">المحتوى</p>
      <div className="fq-opts">
        {SCOPES.map((s) => (
          <button key={s.id} type="button" className="fq-opt" aria-pressed={scope === s.id} onClick={() => setScope(s.id)}>
            <span dir="ltr">{s.en}</span>
            <small>{s.ar}{best[s.id] > 0 ? ` · أفضل ${best[s.id]}%` : ''}</small>
          </button>
        ))}
      </div>

      <p className="fq-label">عدد الأسئلة</p>
      <div className="fq-seg">
        {[5, 10, 20].map((n) => (
          <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)}>{n}</button>
        ))}
      </div>

      <p className="fq-note">أنواع الأسئلة: تحديد الموضع، التعرّف، الوظيفة، المنشأ والمرتكز، العصب المغذّي{scope !== 'face' ? '، وحدود المثلثات ومحتوياتها (من الملزمة)' : ''}.</p>

      <div className="fq-row">
        <button type="button" className="fa-btn is-primary" onClick={() => onStart({ scope, count })}>ابدأ</button>
        <button type="button" className="fa-btn" onClick={onExit}>رجوع</button>
      </div>
    </div>
  );
}

interface Props {
  state: QuizState;
  best: number;
  onAnswer: (choice: string) => void;
  onNext: () => void;
  onRestart: () => void;
  onRetryMissed: () => void;
  onExit: () => void;
  onReview: (id: string) => void;
  onHint: () => void;
}

const PROMPT: Record<Question['kind'], string> = {
  locate: 'اضغط على هذه العضلة في النموذج',
  identify: 'ما اسم العضلة المظلَّلة؟',
  action: 'أي عضلة تقوم بهذه الوظيفة؟',
  attach: 'أي عضلة لها هذا المنشأ والمرتكز؟',
  branch: 'ما فرع العصب الوجهي الذي يغذّي هذه العضلة؟',
  nerve: 'ما العصب الذي يغذّي هذه العضلة؟',
  boundary: 'أي عضلة تُشكّل أحد حدود هذا المثلث؟',
  contents: 'أي من التالي يقع داخل هذا المثلث؟',
};

function optionText(q: Question, opt: string): { en: string; ar?: string } {
  if (q.kind === 'branch') {
    const b = FACIAL_BRANCHES.find((x) => x.id === opt);
    return { en: b?.en ?? opt, ar: b?.ar };
  }
  if (q.kind === 'nerve') {
    const n = NERVE_OPTIONS.find((x) => x.id === opt);
    return { en: n?.en ?? opt, ar: n?.ar };
  }
  return { en: MUSCLE_BY_ID[opt]?.en ?? opt };
}

export default function QuizPanel({ state, best, onAnswer, onNext, onRestart, onRetryMissed, onExit, onReview, onHint }: Props) {
  const total = state.questions.length;

  if (state.done) {
    const pct = Math.round((state.score / total) * 100);
    const verdict =
      pct === 100 ? 'ممتاز! علامة كاملة.' : pct >= 80 ? 'مستواك قوي، راجع الأخطاء وتنتهي.' : pct >= 50 ? 'جيد، يحتاج مراجعة بسيطة.' : 'لا بأس، ابدأ بالاستكشاف ثم أعد المحاولة.';
    return (
      <div className="fq">
        <p className="fq-eyebrow">انتهت الجولة</p>
        <p className="fq-score">{state.score}<span> / {total}</span></p>
        <p className="fq-note">{verdict}</p>
        <div className="fa-tags">
          <span className="fa-tag">أفضل نتيجة: {Math.max(best, pct)}%</span>
          <span className="fa-tag">أطول سلسلة: {state.bestStreak}</span>
        </div>

        {state.missed.length > 0 && (
          <>
            <p className="fq-label">للمراجعة (اضغط لفتحها في الأطلس)</p>
            <div className="fa-tags" dir="ltr">
              {state.missed.map((id) => (
                <button key={id} type="button" className="fa-tag is-btn is-bad" onClick={() => onReview(id)}>
                  {MUSCLE_BY_ID[id]?.en ?? id}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="fq-row">
          <button type="button" className="fa-btn is-primary" onClick={onRestart}>جولة جديدة</button>
          {state.missed.length > 0 && (
            <button type="button" className="fa-btn" onClick={onRetryMissed}>أعد الأسئلة الخاطئة ({state.missed.length})</button>
          )}
          <button type="button" className="fa-btn" onClick={onExit}>رجوع للأطلس</button>
        </div>
      </div>
    );
  }

  const q = state.questions[state.index];
  if (!q) return null;
  const m = MUSCLE_BY_ID[q.id];
  const tri = q.ref ? TRIANGLES.find((t) => t.id === q.ref) : undefined;
  const answered = state.picked !== null;
  const correct = answered && state.picked === q.correct;
  const muscleId = q.kind === 'boundary' ? q.correct : q.id;
  const mm = MUSCLE_BY_ID[muscleId];

  return (
    <div className="fq">
      <div className="fq-top">
        <p className="fq-eyebrow">سؤال <b>{state.index + 1}</b> من <b>{total}</b></p>
        <div className="fa-tags">
          <span className="fa-tag">النتيجة {state.score}</span>
          {state.streak >= 2 && <span className="fa-tag">سلسلة {state.streak}</span>}
          <button type="button" className="fq-link" onClick={onExit}>خروج</button>
        </div>
      </div>
      <div className="fq-bar" aria-hidden="true"><div style={{ width: `${((state.index + (answered ? 1 : 0)) / total) * 100}%` }} /></div>

      <h3 className="fq-q">{PROMPT[q.kind]}</h3>

      {(q.kind === 'locate' || q.kind === 'branch' || q.kind === 'nerve') && m && <p dir="ltr" className="fq-name">{m.en}</p>}
      {(q.kind === 'boundary' || q.kind === 'contents') && tri && (
        <div className="fq-box" dir="ltr">
          <p className="fq-name">{tri.en}</p>
          {q.kind === 'boundary' && <p className="fq-sm">{tri.boundaries}</p>}
        </div>
      )}
      {q.kind === 'action' && m && <p dir="ltr" className="fq-box">{m.actEn}</p>}
      {q.kind === 'attach' && m && (
        <dl dir="ltr" className="fq-box">
          <dt>Origin</dt><dd>{m.origin}</dd>
          <dt>Insertion</dt><dd>{m.insertion}</dd>
        </dl>
      )}

      {q.kind === 'locate' && !answered && (
        <div className="fq-row">
          <button type="button" className="fa-btn" onClick={onHint} disabled={state.hinted}>{state.hinted ? 'تم التلميح' : 'تلميح: قرّب المنطقة'}</button>
          <button type="button" className="fa-btn" onClick={() => onAnswer('__skip')}>لا أعرف</button>
        </div>
      )}
      {q.kind === 'identify' && !answered && (
        <div className="fq-row">
          <button type="button" className="fa-btn" onClick={onHint} disabled={state.hinted}>{state.hinted ? 'تم التلميح' : 'تلميح: وظيفة العضلة'}</button>
        </div>
      )}
      {q.kind === 'identify' && state.hinted && m && !answered && <p dir="ltr" className="fq-box">{m.actEn}</p>}

      {q.kind !== 'locate' && (
        <ul className="fq-list">
          {q.options.map((opt) => {
            const t = optionText(q, opt);
            const tone = !answered ? '' : opt === q.correct ? ' is-ok' : opt === state.picked ? ' is-bad' : ' is-dim';
            return (
              <li key={opt}>
                <button type="button" dir="ltr" disabled={answered} onClick={() => onAnswer(opt)} className={`fq-choice${tone}`}>
                  {t.en}
                  {t.ar && <span dir="rtl">{t.ar}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {answered && (
        <div className="fq-feedback" role="status">
          <p className={`fq-verdict${correct ? ' is-ok' : ''}`}>{correct ? 'إجابة صحيحة ✓' : 'ليست صحيحة'}</p>
          {mm && (
            <>
              <p dir="ltr" className="fq-name">{mm.en}</p>
              <dl dir="ltr" className="fq-sm-list">
                <dt>Action</dt><dd>{mm.actEn}</dd>
                <dt>Origin</dt><dd>{mm.origin}</dd>
                <dt>Insertion</dt><dd>{mm.insertion}</dd>
                <dt>Innervation</dt><dd>{mm.nerve}</dd>
              </dl>
              <p className="fq-ar">{ACTION_AR[mm.id]}</p>
              <button type="button" className="fq-link" onClick={() => onReview(mm.id)}>افتحها في الأطلس</button>
            </>
          )}
          {q.kind === 'contents' && tri && <p dir="ltr" className="fq-sm">Contents: {tri.contents.join('; ')}.</p>}
        </div>
      )}

      {answered && (
        <button type="button" className="fa-btn is-primary fq-next" onClick={onNext} autoFocus>
          {state.index + 1 >= total ? 'عرض النتيجة' : 'السؤال التالي'}
        </button>
      )}
    </div>
  );
}
