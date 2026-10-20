'use client';

// components/anatomy/AtlasExtras.tsx
import { MUSCLE_BY_ID } from '@/lib/anatomy-data';
import {
  BRANCH_MNEMONIC,
  EXTRA_MUSCLES,
  FACIAL_BRANCHES,
  FACIAL_PALSY_COMPARISON,
  MUSCLES_BY_BRANCH,
} from '@/lib/anatomy-extras';
import { chipSmall } from './ui-classes';

const summaryCls =
  'cursor-pointer list-none rounded-card px-4 py-3 font-display text-base font-bold text-ink marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal [&::-webkit-details-marker]:hidden';
const boxCls = 'rounded-card border border-line bg-paper-soft';

export default function AtlasExtras({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="mt-8 grid gap-3">
      <details className={boxCls}>
        <summary className={summaryCls}>فروع العصب الوجهي الخمسة</summary>
        <div className="px-4 pb-4">
          <p className="text-sm text-ink-soft">
            للحفظ:{' '}
            <bdi dir="ltr" className="rounded-chip bg-gold-tint px-2 py-0.5 font-mono text-xs text-ink">
              {BRANCH_MNEMONIC}
            </bdi>{' '}
            = Temporal · Zygomatic · Buccal · Marginal mandibular · Cervical
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {FACIAL_BRANCHES.map((b) => (
              <li key={b.id} className="rounded-field border border-line bg-paper p-3">
                <p className="text-sm font-bold text-ink">
                  <bdi dir="ltr">{b.en}</bdi> <span className="font-normal text-ink-muted">· {b.ar}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MUSCLES_BY_BRANCH[b.id].map((id) => (
                    <button key={id} type="button" dir="ltr" className={chipSmall} aria-pressed={false} onClick={() => onSelect(id)}>
                      {MUSCLE_BY_ID[id]?.short ?? MUSCLE_BY_ID[id]?.en ?? id}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-muted">
            بعض العضلات تظهر تحت أكثر من فرع لأنها تتلقى ألياف من فرعين (مثل orbicularis oculi).
          </p>
        </div>
      </details>

      <details className={boxCls}>
        <summary className={summaryCls}>شلل الوجه: UMN مقابل LMN</summary>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs text-ink-muted">
                <th className="py-2 pe-3 text-start font-bold">الصفة</th>
                <th className="py-2 pe-3 text-start font-bold">UMN</th>
                <th className="py-2 text-start font-bold">LMN</th>
              </tr>
            </thead>
            <tbody>
              {FACIAL_PALSY_COMPARISON.map((r) => (
                <tr key={r.feature} className="border-b border-line/60 align-top">
                  <th scope="row" dir="ltr" className="py-2 pe-3 text-left text-[13px] font-bold text-ink">{r.feature}</th>
                  <td dir="ltr" className="py-2 pe-3 text-left text-[13px] text-ink-soft">{r.umn}</td>
                  <td dir="ltr" className="py-2 text-left text-[13px] text-ink-soft">{r.lmn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className={boxCls}>
        <summary className={summaryCls}>عضلات مهمة لا تظهر في الرسم</summary>
        <ul className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
          {EXTRA_MUSCLES.map((x) => (
            <li key={x.id} dir="ltr" className="rounded-field border border-line bg-paper p-3 text-left">
              <p className="text-sm font-bold text-ink">{x.en}</p>
              <dl className="mt-1 text-[13px] leading-snug text-ink-soft">
                <dt className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Nerve</dt>
                <dd>{x.nerve}</dd>
                <dt className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Origin</dt>
                <dd>{x.origin}</dd>
                <dt className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Insertion</dt>
                <dd>{x.insertion}</dd>
                <dt className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Action</dt>
                <dd>{x.actEn}</dd>
                <dt className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Clinical</dt>
                <dd>{x.clin}</dd>
              </dl>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}