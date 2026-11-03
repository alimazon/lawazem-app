'use client';

// components/anatomy/OnboardingTour.tsx
import { useEffect, useState } from 'react';
import AtlasDialog from './AtlasDialog';

export const TOUR_KEY = 'lawazem:anatomy-tour-done';

const STEPS: readonly { title: string; body: string }[] = [
  { title: 'استكشف النموذج', body: 'اضغط أي عضلة في النموذج أو في الفهرس لتظهر معلوماتها: Origin وInsertion وInnervation. في وضع 3D اسحب للتدوير.' },
  { title: 'الطبقات والإخفاء', body: 'من «الطبقات والأدوات» اخفِ عضلات الوجه وابقَ على الرقبة، أو اعزل عضلة واحدة، أو قشّر الطبقات للوصول للعميقة.' },
  { title: 'تبويب الرقبة', body: 'فيه مثلثات الرقبة بحدودها ومحتوياتها كما في الملزمة، مع إبراز عضلاتها في النموذج.' },
  { title: 'اختبر نفسك وراجع', body: 'اختبر نفسك بأنواع أسئلة متعدّدة، وراجع بالبطاقات المتباعدة. اضغط ⌘K أو Ctrl+K للبحث السريع في أي وقت.' },
];

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_KEY) !== '1') setOpen(true);
    } catch {
      /* لا نعرض الجولة إن تعذّر التخزين */
    }
  }, []);

  const finish = (): void => {
    try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* تجاهل */ }
    setOpen(false);
  };

  const step = STEPS[i];
  if (!step) return null;
  const last = i === STEPS.length - 1;

  return (
    <AtlasDialog open={open} onClose={finish} title="جولة سريعة">
      <p className="fq-eyebrow">{i + 1} / {STEPS.length}</p>
      <h3 className="fq-q">{step.title}</h3>
      <p className="fq-note">{step.body}</p>
      <div className="fq-row">
        {i > 0 && <button type="button" className="fa-btn" onClick={() => setI(i - 1)}>السابق</button>}
        <button type="button" className="fa-btn is-primary" onClick={() => (last ? finish() : setI(i + 1))}>{last ? 'ابدأ' : 'التالي'}</button>
        {!last && <button type="button" className="fq-link" onClick={finish}>تخطّي</button>}
      </div>
    </AtlasDialog>
  );
}
