'use client';

// components/anatomy/RelatedMuscles.tsx
import { MUSCLE_BY_ID } from '@/lib/anatomy-data';
import { relatedMuscles, type Relation } from '@/lib/anatomy-relations';

const LABEL: Record<Relation['kind'], string> = { antagonist: 'معادية', synergist: 'مساعدة', 'same-nerve': 'نفس العصب' };

export default function RelatedMuscles({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const rel = relatedMuscles(id, 6);
  if (rel.length === 0) return null;
  return (
    <div className="fa-sec">
      <p className="fa-sec-title"><span dir="ltr">Related muscles</span><small>عضلات ذات صلة</small></p>
      <div className="fa-list">
        {rel.map((r) => {
          const m = MUSCLE_BY_ID[r.id];
          if (!m) return null;
          return (
            <button key={r.id} type="button" className="fa-row" onClick={() => onPick(r.id)}>
              <span dir="ltr" className="fa-row-en">{m.short ?? m.en}</span>
              <span className="fa-row-ar">{LABEL[r.kind]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
