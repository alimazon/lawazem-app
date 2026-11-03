'use client';

// components/anatomy/Atlas3DTools.tsx
/** أدوات المجسّم (واجهة DOM): الزوايا، الإعدادات المسبقة، الطبقات، الشفافية، المقطع، والحفظ. */
import { useState, type ReactNode } from 'react';
import { DEPTH_LABEL, type Depth } from '@/lib/anatomy-layers';
import {
  BONE_GROUPS, CONTEXT_GROUPS, FACE_MUSCLE_GROUP_IDS, MUSCLE_GROUP_DEFS, NECK_MUSCLE_GROUP_IDS, PRESETS,
  type PresetId, type Visibility,
} from './atlas3d-model';

export type ViewId = 'front' | 'left' | 'right' | 'back' | 'top' | 'bottom';
export const VIEW_LABEL: readonly (readonly [ViewId, string])[] = [
  ['front', 'أمامي'], ['left', 'جانب أيسر'], ['right', 'جانب أيمن'], ['back', 'خلفي'], ['top', 'علوي'], ['bottom', 'سفلي'],
];

export type Axis = 'x' | 'y' | 'z';
export interface Section { on: boolean; axis: Axis; pos: number; flip: boolean }

export interface ToolState {
  vis: Visibility;
  peel: Depth;
  boneOpacity: number;
  muscleOpacity: number;
  section: Section;
  autoRotate: boolean;
  labels: boolean;
  focus: boolean;
  freeTouch: boolean;
  quality: 'full' | 'lite';
}

export const SECTION_RANGE: Record<Axis, [number, number]> = { x: [-1.6, 1.6], y: [-3.0, 1.7], z: [-1.1, 1.3] };
const AXIS_LABEL: Record<Axis, string> = { x: 'طولي (يمين/يسار)', y: 'أفقي (علوي/سفلي)', z: 'أمامي/خلفي' };

interface Props {
  ts: ToolState;
  patch: (p: Partial<ToolState>) => void;
  setVis: (v: Visibility) => void;
  toggleGroup: (id: string) => void;
  preset: (id: PresetId) => void;
  canUndo: boolean;
  undo: () => void;
  resetAll: () => void;
  shot: () => void;
  open: boolean;
  onClose: () => void;
}

function Eye({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {on ? (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.5 6.7C3.7 8.4 2 12 2 12s3.6 7 10 7a9.9 9.9 0 0 0 4-.9" />
        </>
      )}
    </svg>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="fa3-sec">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default function Atlas3DTools({ ts, patch, setVis, toggleGroup, preset, canUndo, undo, resetAll, shot, open, onClose }: Props) {
  const [tab, setTab] = useState<'layers' | 'view'>('layers');
  if (!open) return null;

  const hidden = (id: string): boolean => ts.vis.groups.has(id);
  const row = (id: string, en: string, ar: string) => (
    <button key={id} type="button" className="fa3-eye" aria-pressed={!hidden(id)} onClick={() => toggleGroup(id)}>
      <Eye on={!hidden(id)} />
      <span dir="ltr">{en}</span>
      <small>{ar}</small>
    </button>
  );
  const facial = MUSCLE_GROUP_DEFS.filter((g) => FACE_MUSCLE_GROUP_IDS.includes(g.id));
  const neck = MUSCLE_GROUP_DEFS.filter((g) => NECK_MUSCLE_GROUP_IDS.includes(g.id));

  return (
    <div className="fa3-drawer" dir="rtl" role="dialog" aria-label="Tools">
      <div className="fa3-drawer-head">
        <div className="fa-seg" role="tablist">
          <button type="button" role="tab" aria-pressed={tab === 'layers'} onClick={() => setTab('layers')}>الطبقات</button>
          <button type="button" role="tab" aria-pressed={tab === 'view'} onClick={() => setTab('view')}>العرض</button>
        </div>
        <button type="button" className="fa-btn" onClick={onClose} aria-label="إغلاق">إغلاق</button>
      </div>

      <div className="fa3-drawer-body">
        {tab === 'layers' && (
          <>
            <Section title="عرض سريع">
              <div className="fa3-chips">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" className="fa-pill" onClick={() => preset(p.id)}>
                    <span dir="ltr">{p.en}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="الهيكل العظمي · Skeleton">
              <div className="fa3-list">{BONE_GROUPS.map((g) => row(g.id, g.en, g.ar))}</div>
            </Section>
            <Section title="عضلات الوجه · Face">
              <div className="fa3-list">{facial.map((g) => row(g.id, g.en, g.ar))}</div>
            </Section>
            <Section title="عضلات الرقبة · Neck">
              <div className="fa3-list">{neck.map((g) => row(g.id, g.en, g.ar))}</div>
            </Section>
            <Section title="عضلات أخرى · Other">
              <div className="fa3-list">{CONTEXT_GROUPS.map((g) => row(g.id, g.en, g.ar))}</div>
            </Section>

            {ts.vis.muscles.size + ts.vis.parts.size > 0 && (
              <Section title="مخفية يدوياً">
                <p className="fa3-small">{ts.vis.muscles.size + ts.vis.parts.size} عنصر. استخدم «إظهار الكل» أو «تراجع».</p>
              </Section>
            )}
          </>
        )}

        {tab === 'view' && (
          <>
            <Section title="الشفافية">
              <label className="fa3-slider"><span>العظام</span>
                <input type="range" min={0.1} max={1} step={0.05} value={ts.boneOpacity} onChange={(e) => patch({ boneOpacity: Number(e.target.value) })} />
              </label>
              <label className="fa3-slider"><span>العضلات</span>
                <input type="range" min={0.1} max={1} step={0.05} value={ts.muscleOpacity} onChange={(e) => patch({ muscleOpacity: Number(e.target.value) })} />
              </label>
            </Section>

            <Section title="مقطع · Section">
              <div className="fa3-chips">
                <button type="button" className="fa-pill" aria-pressed={ts.section.on} onClick={() => patch({ section: { ...ts.section, on: !ts.section.on } })}>
                  {ts.section.on ? 'إيقاف المقطع' : 'تفعيل المقطع'}
                </button>
                {(['x', 'z', 'y'] as const).map((a) => (
                  <button key={a} type="button" className="fa-pill" aria-pressed={ts.section.axis === a}
                    onClick={() => patch({ section: { ...ts.section, axis: a, pos: 0, on: true } })}>
                    {AXIS_LABEL[a]}
                  </button>
                ))}
                <button type="button" className="fa-pill" aria-pressed={ts.section.flip} onClick={() => patch({ section: { ...ts.section, flip: !ts.section.flip } })}>
                  عكس الاتجاه
                </button>
              </div>
              <label className="fa3-slider"><span>الموضع</span>
                <input type="range" min={SECTION_RANGE[ts.section.axis][0]} max={SECTION_RANGE[ts.section.axis][1]} step={0.02}
                  value={ts.section.pos} onChange={(e) => patch({ section: { ...ts.section, on: true, pos: Number(e.target.value) } })} />
              </label>
            </Section>

            <Section title="خيارات">
              <div className="fa3-chips">
                <button type="button" className="fa-pill" aria-pressed={ts.labels} onClick={() => patch({ labels: !ts.labels })}>أسماء العضلات</button>
                <button type="button" className="fa-pill" aria-pressed={ts.focus} onClick={() => patch({ focus: !ts.focus })}>إبراز المحددة</button>
                <button type="button" className="fa-pill" aria-pressed={ts.autoRotate} onClick={() => patch({ autoRotate: !ts.autoRotate })}>دوران تلقائي</button>
                <button type="button" className="fa-pill" aria-pressed={ts.freeTouch} onClick={() => patch({ freeTouch: !ts.freeTouch })}>تدوير حر باللمس</button>
                <button type="button" className="fa-pill" aria-pressed={ts.quality === 'lite'} onClick={() => patch({ quality: ts.quality === 'lite' ? 'full' : 'lite' })}>
                  {ts.quality === 'lite' ? 'جودة خفيفة' : 'جودة عالية'}
                </button>
              </div>
            </Section>

            <Section title="أدوات">
              <div className="fa3-chips">
                <button type="button" className="fa-pill" onClick={shot}>حفظ صورة</button>
                <button type="button" className="fa-pill" disabled={!canUndo} onClick={undo}>تراجع</button>
                <button type="button" className="fa-pill" onClick={() => setVis({ groups: new Set(), muscles: new Set(), parts: new Set() })}>إظهار الكل</button>
                <button type="button" className="fa-pill" onClick={resetAll}>إعادة ضبط</button>
              </div>
            </Section>
            <p className="fa3-small">الطبقات: {(['1', '2', '3', '4'] as const).map((d) => DEPTH_LABEL[Number(d) as Depth]).join(' › ')}</p>
          </>
        )}
      </div>
    </div>
  );
}
