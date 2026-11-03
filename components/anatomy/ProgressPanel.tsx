'use client';

// components/anatomy/ProgressPanel.tsx
import { useMemo } from 'react';
import { MUSCLE_BY_ID } from '@/lib/anatomy-data';
import { computeStats, type LearnState } from '@/lib/anatomy-learn';

const pct = (n: number, d: number): number => (d === 0 ? 0 : Math.round((n / d) * 100));

export default function ProgressPanel({
  learn, onStudy, onReset, onExport, onImport, onOpenMuscle,
}: {
  learn: LearnState;
  onStudy: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenMuscle: (id: string) => void;
}) {
  const stats = useMemo(() => computeStats(learn), [learn]);

  const nextDue = useMemo(() => {
    const future = Object.values(learn.srs.cards).filter((c) => c.due > Date.now());
    return future.length ? Math.min(...future.map((c) => c.due)) : null;
  }, [learn.srs.cards]);

  const rows: [string, string, number][] = [
    ['عضلات استُكشفت', `${stats.seen} / ${stats.total}`, pct(stats.seen, stats.total)],
    ['عضلات مُتقنة (مستوى 4+)', `${stats.mastered} / ${stats.total}`, pct(stats.mastered, stats.total)],
    ['دقّة الإجابات', `${Math.round(stats.accuracy * 100)}%`, Math.round(stats.accuracy * 100)],
  ];

  return (
    <div className="fa-progress">
      <p className="fa-progress-sub">يُسجَّل كل شيء محلياً على جهازك فقط: ما فتحته، وإجاباتك، ومفضّلتك، وملاحظاتك.</p>

      <div className="fa-progress-rows">
        {rows.map(([label, value, p]) => (
          <div key={label} className="fa-stat">
            <div className="fa-stat-line"><span>{label}</span><b dir="ltr">{value}</b></div>
            <div className="fa-bar-track"><div style={{ width: `${p}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="fq-row">
        <button type="button" className="fa-btn is-primary" onClick={onStudy}>
          {stats.due > 0 ? `راجع ${stats.due} بطاقة مستحقّة` : 'ابدأ الدراسة بالبطاقات'}
        </button>
      </div>
      {stats.due === 0 && nextDue && (
        <p className="fq-note">المراجعة القادمة: {new Date(nextDue).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      )}

      <p className="fa-sec-title"><span dir="ltr">By region</span><small>حسب المنطقة</small></p>
      <div className="fa-progress-rows">
        {Object.entries(stats.perRegion).sort((a, b) => b[1].total - a[1].total).map(([region, r]) => (
          <div key={region} className="fa-stat">
            <div className="fa-stat-line"><span dir="ltr">{region}</span><b dir="ltr">{r.mastered}/{r.total}</b></div>
            <div className="fa-bar-track"><div style={{ width: `${pct(r.mastered, r.total)}%` }} /></div>
          </div>
        ))}
      </div>

      <p className="fa-sec-title"><span dir="ltr">Favorites</span><small>المفضّلة · {stats.favorites}</small></p>
      {learn.favorites.length === 0 ? (
        <p className="fq-note">لا توجد مفضّلة بعد. اضغط ★ في بطاقة العضلة.</p>
      ) : (
        <div className="fa-tags" dir="ltr">
          {learn.favorites.map((id) => (
            <button key={id} type="button" className="fa-tag is-btn" onClick={() => onOpenMuscle(id)}>{MUSCLE_BY_ID[id]?.short ?? MUSCLE_BY_ID[id]?.en}</button>
          ))}
        </div>
      )}

      <div className="fq-row fa-progress-foot">
        <button type="button" className="fa-btn" onClick={onExport}>تصدير</button>
        <button type="button" className="fa-btn" onClick={onImport}>استيراد</button>
        <button type="button" className="fa-btn" onClick={onReset}>تصفير التقدّم</button>
      </div>
    </div>
  );
}
