'use client';

// components/anatomy/Flashcards.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { MUSCLE_BY_ID } from '@/lib/anatomy-data';
import { buildStudyQueue, recordAnswer, type LearnState } from '@/lib/anatomy-learn';
import type { Grade } from '@/lib/anatomy-srs';

/** بطاقات مراجعة متباعدة: المستحقّة أولاً ثم عضلات جديدة. التقييم يُسجَّل مرة واحدة لكل بطاقة. */
export default function Flashcards({
  learn, onUpdate, onExit, onOpenMuscle,
}: {
  learn: LearnState;
  onUpdate: (s: LearnState) => void;
  onExit: () => void;
  onOpenMuscle: (id: string) => void;
}) {
  const learnRef = useRef(learn);
  learnRef.current = learn;
  const [queue, setQueue] = useState<string[]>(() => buildStudyQueue(learn));
  const [i, setI] = useState(0);
  const [back, setBack] = useState(false);
  const [done, setDone] = useState(0);
  const [good, setGood] = useState(0);

  const id = queue[i] ?? null;
  const m = id ? MUSCLE_BY_ID[id] : null;

  const rate = useCallback((g: Grade) => {
    if (!id) return;
    onUpdate(recordAnswer(learnRef.current, id, g >= 3, g));
    setDone((d) => d + 1);
    if (g >= 3) setGood((c) => c + 1);
    setBack(false);
    if (i + 1 >= queue.length) {
      setQueue([]);
      setI(0);
    } else {
      setI(i + 1);
    }
  }, [id, i, queue.length, onUpdate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!m) return;
      if (!back && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setBack(true);
      } else if (back) {
        const map: Record<string, Grade> = { '1': 1, '2': 3, '3': 4, '4': 5 };
        const g = map[e.key];
        if (g !== undefined) rate(g);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [m, back, rate]);

  if (!m) {
    return (
      <div className="fa-flash fa-flash-done">
        <p className="fq-score">{done}<span> بطاقة</span></p>
        <p className="fq-note">{done > 0 ? `انتهت الجولة. صحيحة ${good} من ${done}.` : 'لا توجد بطاقات مستحقّة الآن. عُد لاحقاً.'}</p>
        <div className="fq-row"><button type="button" className="fa-btn is-primary" onClick={onExit}>رجوع للأطلس</button></div>
      </div>
    );
  }

  return (
    <div className="fa-flash">
      <div className="fq-top"><p className="fq-eyebrow">بطاقة <b>{i + 1}</b> من <b>{queue.length}</b></p></div>
      <div className="fq-bar" aria-hidden="true"><div style={{ width: `${(i / queue.length) * 100}%` }} /></div>

      <div
        className="fa-flash-card"
        role="button"
        tabIndex={0}
        aria-label={back ? 'Answer shown' : 'Show answer'}
        onClick={() => !back && setBack(true)}
        onKeyDown={(e) => { if (!back && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setBack(true); } }}
      >
        {!back ? (
          <>
            <p className="fq-eyebrow">ما وظيفة هذه العضلة وما عصبها؟</p>
            <p className="fq-name" dir="ltr">{m.en}</p>
            <p className="fq-note">اضغط أو Enter لإظهار الإجابة</p>
          </>
        ) : (
          <>
            <p className="fq-name" dir="ltr">{m.en}</p>
            <dl dir="ltr" className="fq-sm-list">
              <dt>Action</dt><dd>{m.actEn}</dd>
              <dt>Origin</dt><dd>{m.origin}</dd>
              <dt>Insertion</dt><dd>{m.insertion}</dd>
              <dt>Innervation</dt><dd>{m.nerve}</dd>
            </dl>
            <button type="button" className="fq-link" onClick={(e) => { e.stopPropagation(); onOpenMuscle(m.id); }}>افتحها في الأطلس</button>
          </>
        )}
      </div>

      {back && (
        <div className="fa-flash-grades">
          <button type="button" className="fa-grade" onClick={() => rate(1)}><kbd>1</kbd> نسيت</button>
          <button type="button" className="fa-grade" onClick={() => rate(3)}><kbd>2</kbd> صعب</button>
          <button type="button" className="fa-grade" onClick={() => rate(4)}><kbd>3</kbd> جيد</button>
          <button type="button" className="fa-grade" onClick={() => rate(5)}><kbd>4</kbd> سهل</button>
        </div>
      )}
      <p className="fq-note">تمّت مراجعة {done} · صحيحة {good}</p>
    </div>
  );
}
