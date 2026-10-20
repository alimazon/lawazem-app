'use client';

// components/anatomy/ExpressionPreview.tsx
import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { computeFace, scalePose, type Pose } from '@/lib/anatomy-pose';

const CYCLE = 3400;
const ease = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

function kAt(t: number): number {
  const c = t % CYCLE;
  if (c < 800) return ease(c / 800);
  if (c < 1900) return 1;
  if (c < 2600) return 1 - ease((c - 1900) / 700);
  return 0;
}

function phaseForK(k: number): number {
  const x = k < 0.5 ? Math.sqrt(k / 2) : 1 - Math.sqrt((1 - k) / 2);
  return x * 800;
}

interface Props {
  pose: Pose;
  poseKey: string;
  onK?: (k: number) => void;
}

function ExpressionPreview({ pose, poseKey, onK }: Props) {
  const uid = useId().replace(/:/g, '');
  const clipL = `${uid}-cl`;
  const clipR = `${uid}-cr`;

  const [playing, setPlaying] = useState(true);
  const [k, setK] = useState(0);
  const kRef = useRef(0);
  const lastKey = useRef(poseKey);

  useEffect(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setPlaying(false);
        kRef.current = 1;
        setK(1);
      }
    } catch {
      /* تجاهل */
    }
  }, []);

  useEffect(() => {
    if (!playing) return;
    const resume = lastKey.current === poseKey;
    lastKey.current = poseKey;
    const start = performance.now() - (resume ? phaseForK(kRef.current) : 0);
    let raf = 0;
    const frame = (now: number) => {
      const next = kAt(now - start);
      if (Math.abs(next - kRef.current) > 0.002) {
        kRef.current = next;
        setK(next);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing, poseKey]);

  useEffect(() => {
    onK?.(k);
  }, [k, onK]);

  const f = useMemo(() => computeFace(scalePose(pose, k)), [pose, k]);
  const contracted = k > 0.5;

  return (
    <div className="fa-plate fa-preview">
      <svg viewBox="0 0 220 270" aria-hidden="true" style={{ direction: 'ltr' }}>
        <defs>
          <clipPath id={clipL}><path d={f.eyeL} /></clipPath>
          <clipPath id={clipR}><path d={f.eyeR} /></clipPath>
        </defs>

        <path d="M84,206 L82,270" className="fa-pl" />
        <path d="M136,206 L138,270" className="fa-pl" />
        <ellipse cx="36" cy="112" rx="5" ry="14" className="fa-pl" style={{ fill: 'var(--fa-skin)' }} />
        <ellipse cx="184" cy="112" rx="5" ry="14" className="fa-pl" style={{ fill: 'var(--fa-skin)' }} />
        <path d={f.head} className="fa-pl" style={{ fill: 'var(--fa-skin)' }} />

        <g style={{ opacity: f.op.neck }}>
          <path className="fa-pw" d="M92,214 L86,262" />
          <path className="fa-pw" d="M100,218 L96,262" />
          <path className="fa-pw" d="M128,214 L134,262" />
          <path className="fa-pw" d="M120,218 L124,262" />
        </g>
        <g style={{ opacity: f.op.forehead }}>
          <path className="fa-pw" d="M70,44 Q110,40 150,44" />
          <path className="fa-pw" d="M66,54 Q110,50 154,54" />
          <path className="fa-pw" d="M66,64 Q110,60 154,64" />
        </g>
        <g style={{ opacity: f.op.glabella }}>
          <path className="fa-pw" d="M104,78 L104.5,92" />
          <path className="fa-pw" d="M116,78 L115.5,92" />
        </g>
        <g style={{ opacity: f.op.nose }}>
          <path className="fa-pw" d="M101,95 L119,95" />
          <path className="fa-pw" d="M102,101 L118,101" />
        </g>
        <g style={{ opacity: f.op.squint }}>
          <path className="fa-pw" d="M158,92 L170,86" />
          <path className="fa-pw" d="M160,98 L173,98" />
          <path className="fa-pw" d="M158,104 L170,110" />
          <path className="fa-pw" d="M62,92 L50,86" />
          <path className="fa-pw" d="M60,98 L47,98" />
          <path className="fa-pw" d="M62,104 L50,110" />
        </g>
        <g style={{ opacity: f.op.temple }}>
          <path className="fa-pw" d="M52,66 Q47,84 52,104" />
          <path className="fa-pw" d="M168,66 Q173,84 168,104" />
        </g>
        <g style={{ opacity: f.op.clench }}>
          <path className="fa-pw" style={{ strokeWidth: 2 }} d="M62,156 Q56,174 66,192" />
          <path className="fa-pw" style={{ strokeWidth: 2 }} d="M158,156 Q164,174 154,192" />
        </g>
        <g style={{ opacity: f.op.cheek }}>
          <path className="fa-pw" d="M150,148 Q158,166 148,186" />
          <path className="fa-pw" d="M70,148 Q62,166 72,186" />
        </g>
        <g style={{ opacity: f.op.chin }}>
          <path className="fa-pw" d="M96,198 Q110,193 124,198" />
          <circle cx="102" cy="206" r="1" style={{ fill: 'var(--fa-ink)' }} />
          <circle cx="110" cy="209" r="1" style={{ fill: 'var(--fa-ink)' }} />
          <circle cx="118" cy="206" r="1" style={{ fill: 'var(--fa-ink)' }} />
          <circle cx="106" cy="213" r="1" style={{ fill: 'var(--fa-ink)' }} />
          <circle cx="114" cy="213" r="1" style={{ fill: 'var(--fa-ink)' }} />
        </g>

        <path d={f.nlfR} className="fa-pw" style={{ opacity: f.nlfOpacity }} />
        <path d={f.nlfL} className="fa-pw" style={{ opacity: f.nlfOpacity }} />
        <path d={f.marR} className="fa-pw" style={{ opacity: f.marOpacity }} />
        <path d={f.marL} className="fa-pw" style={{ opacity: f.marOpacity }} />
        <g style={{ opacity: f.op.purse }}>
          {f.purse.map((d, i) => (
            <path key={i} d={d} className="fa-pw" />
          ))}
        </g>

        <path className="fa-pl" style={{ strokeOpacity: 0.35 }} d="M104,100 Q101,128 98,146" />
        <path className="fa-pl" style={{ strokeOpacity: 0.35 }} d="M116,100 Q119,128 122,146" />
        <path d={f.noseWingL} className="fa-pl" />
        <path d={f.noseWingR} className="fa-pl" />
        <path d={f.noseBase} className="fa-pl" />
        <ellipse cx={f.nostril.lx} cy={f.nostril.y} rx={f.nostril.rad} ry="1.8" fill="var(--fa-ink)" opacity=".55" />
        <ellipse cx={f.nostril.rx} cy={f.nostril.y} rx={f.nostril.rad} ry="1.8" fill="var(--fa-ink)" opacity=".55" />

        <path d={f.eyeL} className="fa-pl" style={{ fill: 'var(--fa-eye)' }} />
        <path d={f.eyeR} className="fa-pl" style={{ fill: 'var(--fa-eye)' }} />
        <circle cx="80" cy="98" r="5.6" style={{ fill: 'var(--fa-iris)', opacity: f.irisOpacity }} clipPath={`url(#${clipL})`} />
        <circle cx="140" cy="98" r="5.6" style={{ fill: 'var(--fa-iris)', opacity: f.irisOpacity }} clipPath={`url(#${clipR})`} />
        <circle cx="80" cy="98" r="2.4" style={{ fill: 'var(--fa-ink)', opacity: f.irisOpacity }} clipPath={`url(#${clipL})`} />
        <circle cx="140" cy="98" r="2.4" style={{ fill: 'var(--fa-ink)', opacity: f.irisOpacity }} clipPath={`url(#${clipR})`} />

        <path d={f.browL} className="fa-pl" style={{ strokeWidth: 3.2 }} />
        <path d={f.browR} className="fa-pl" style={{ strokeWidth: 3.2 }} />
        <path d={f.mouth} className="fa-pl" style={{ fill: 'var(--fa-lip)' }} />
      </svg>

      <button
        type="button"
        className="fa-play"
        aria-label={playing ? 'إيقاف الحركة' : 'تشغيل الحركة'}
        onClick={() => setPlaying((p) => !p)}
      >
        {playing ? (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <rect x="2" y="1.5" width="2.8" height="9" fill="currentColor" />
            <rect x="7.2" y="1.5" width="2.8" height="9" fill="currentColor" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 1.5 L10 6 L3 10.5 Z" fill="currentColor" />
          </svg>
        )}
      </button>

      <div className="fa-pstate">{contracted ? 'منقبضة' : 'مسترخية'}</div>

      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(k * 100)}
        aria-label="درجة الانقباض"
        className="fa-range"
        onChange={(e) => {
          const v = Number(e.target.value) / 100;
          setPlaying(false);
          kRef.current = v;
          setK(v);
        }}
      />
    </div>
  );
}

export default memo(ExpressionPreview);