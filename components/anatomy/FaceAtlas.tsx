'use client';

// components/anatomy/FaceAtlas.tsx
/**
 * أطلس عضلات الوجه التفاعلي (React).
 * - استكشاف: لمس أي عضلة، تقريب، تسميات، تصفية بالعصب، تعابير وجه كاملة.
 * - اختبار: 5 أنواع أسئلة (تحديد الموضع، التعرّف، الوظيفة، المنشأ/المرتكز، فرع العصب).
 * - رابط قابل للمشاركة: ?m=zmaj أو ?x=smile
 */
import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import './face-atlas.css';

import { MUSCLES, MUSCLE_GROUPS, MUSCLE_BY_ID, ZOOMS, type ZoomId } from '@/lib/anatomy-data';
import { GEOMETRY } from '@/lib/anatomy-geometry';
import { canvasRatio, layoutLabels, viewBoxFor, type ViewBox } from '@/lib/anatomy-view';
import { combinePoses, type Pose } from '@/lib/anatomy-pose';
import { ACTION_AR, EXPRESSIONS, PEARLS_AR } from '@/lib/anatomy-ar';
import {
  EXAM_TIPS,
  FACIAL_BRANCHES,
  MUSCLES_BY_BRANCH,
  BRANCH_MNEMONIC,
  branchesOf,
  innervationOf,
  pharyngealArchOf,
  type FacialBranch,
} from '@/lib/anatomy-extras';
import { makeRound } from '@/lib/anatomy-quiz';

import ExpressionPreview from './ExpressionPreview';
import QuizPanel, { type QuizState } from './QuizPanel';
import AtlasExtras from './AtlasExtras';
import { badge, btnGhost, chip, chipSmall } from './ui-classes';

// ==================== ثوابت ====================
type Mode = 'explore' | 'quiz';
type DetailTab = 'anatomy' | 'nerve' | 'clinical';
type BranchFilter = FacialBranch | 'v3' | null;
type Tone = 'sel' | 'ok' | 'bad';
interface SelItem { id: string; tone: Tone }

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const MIRROR = 'translate(400 0) scale(-1 1)';
const BEST_KEY = 'anatomy-face-quiz-best';
const DEFAULT_ID = 'zmaj';
const ROUND_SIZE = 10;
const V3_IDS: readonly string[] = MUSCLES.filter((m) => innervationOf(m) === 'V3').map((m) => m.id);

const TAB_LABEL: Record<DetailTab, string> = {
  anatomy: 'Anatomy',
  nerve: 'Nerve',
  clinical: 'Clinical',
};

// ==================== طبقات الرسم الثابتة ====================
const FaceBase = memo(function FaceBase() {
  return (
    <g>
      <path d="M138,380 L134,540 L266,540 L262,380 Z" className="fa-base-fascia" />
      {[76, 324].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={212} rx={12} ry={28} className="fa-base-skin" />
          <path d={cx < 200 ? 'M80,196 Q70,212 80,230' : 'M320,196 Q330,212 320,230'} className="fa-thin" />
        </g>
      ))}
      <path
        d="M200,18 C120,18 80,70 80,150 C80,220 84,280 94,330 C104,372 138,412 200,430 C262,412 296,372 306,330 C316,280 320,220 320,150 C320,70 280,18 200,18 Z"
        className="fa-base-fascia"
      />
      <path
        d="M200,236 C190,252 182,278 180,296 C179,312 190,326 200,326 C210,326 221,312 220,296 C218,278 210,252 200,236 Z"
        className="fa-base-skin"
      />
    </g>
  );
});

const FaceDecor = memo(function FaceDecor({ clipId }: { clipId: string }) {
  const side = (mirror: boolean) => (
    <g key={mirror ? 'l' : 'r'} transform={mirror ? MIRROR : undefined}>
      <path d="M207,172 C222,154 262,146 296,166 C264,156 226,162 207,172 Z" fill="var(--fa-brow)" stroke="var(--fa-brow)" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M226,201 Q248,187 270,201 Q248,214 226,201 Z" fill="var(--fa-eye)" />
      <circle cx={248} cy={201} r={8.2} fill="var(--fa-iris)" clipPath={`url(#${clipId})`} />
      <circle cx={248} cy={201} r={3.4} fill="var(--fa-ink)" clipPath={`url(#${clipId})`} />
      <path d="M224,201 Q248,184 272,201" fill="none" stroke="var(--fa-ink)" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M226,201 Q248,214 270,201" fill="none" stroke="var(--fa-ink)" strokeOpacity={0.5} strokeWidth={0.9} />
      <ellipse cx={210} cy={314} rx={6.5} ry={3.4} fill="var(--fa-mouth)" />
      <path d="M222,296 Q226,308 218,320" fill="none" stroke="var(--fa-muscle-edge)" strokeOpacity={0.55} strokeWidth={1.1} strokeLinecap="round" />
    </g>
  );
  return (
    <>
      {side(false)}
      {side(true)}
      <path d="M162,347 C174,338 188,330 200,336 C212,330 226,338 238,347 C224,350 210,350 200,350 C190,350 176,350 162,347 Z" fill="var(--fa-lip)" stroke="var(--fa-mouth)" strokeWidth={0.8} strokeLinejoin="round" />
      <path d="M163,348 C176,351 190,351 200,351 C210,351 224,351 237,348 C230,362 216,368 200,368 C184,368 170,362 163,348 Z" fill="var(--fa-lip)" stroke="var(--fa-mouth)" strokeWidth={0.8} strokeLinejoin="round" />
    </>
  );
});

// ==================== طبقة العضلات ====================
const MusclesLayer = memo(function MusclesLayer({
  highlight,
  hideNames,
}: {
  highlight: ReadonlySet<string> | null;
  hideNames: boolean;
}) {
  return (
    <>
      {MUSCLES.flatMap((m) => {
        const geo = GEOMETRY[m.id];
        if (!geo) return [];
        const cls =
          highlight === null ? 'fa-m' : highlight.has(m.id) ? 'fa-m is-hi' : 'fa-m is-dim';
        return (m.paired ? [0, 1] : [0]).map((s) => (
          <g
            key={`${m.id}-${s}`}
            className={cls}
            data-id={m.id}
            transform={s ? MIRROR : undefined}
            {...(s === 0
              ? { role: 'button', tabIndex: 0, 'aria-label': hideNames ? 'Muscle' : m.en }
              : { 'aria-hidden': true })}
          >
            <path d={geo.d} className="fa-mo" fillRule={geo.evenodd ? 'evenodd' : undefined} />
            <path d={geo.dark} className="fa-fa" />
            <path d={geo.light} className="fa-fb" />
          </g>
        ));
      })}
    </>
  );
});

function SelLayer({ items }: { items: readonly SelItem[] }) {
  return (
    <>
      {items.flatMap(({ id, tone }) => {
        const m = MUSCLE_BY_ID[id];
        const geo = GEOMETRY[id];
        if (!m || !geo) return [];
        return (m.paired ? [0, 1] : [0]).map((s) => (
          <g
            key={`${id}-${s}-${tone}`}
            className={tone === 'sel' ? 'fa-m fa-sel' : `fa-m fa-sel fa-sel-${tone}`}
            transform={s ? MIRROR : undefined}
          >
            <path d={geo.d} className="fa-mo" fillRule={geo.evenodd ? 'evenodd' : undefined} />
            <path d={geo.dark} className="fa-fa" />
            <path d={geo.light} className="fa-fb" />
          </g>
        ));
      })}
    </>
  );
}

function Arrow({ a, mirror }: { a: readonly [number, number, number, number]; mirror: boolean }) {
  const [x1, y1, x2, y2] = a;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const s = 8;
  const ex = x2 - 2.5 * Math.cos(ang);
  const ey = y2 - 2.5 * Math.sin(ang);
  const h1x = x2 - s * Math.cos(ang - 0.45);
  const h1y = y2 - s * Math.sin(ang - 0.45);
  const h2x = x2 - s * Math.cos(ang + 0.45);
  const h2y = y2 - s * Math.sin(ang + 0.45);
  const line = `M${x1},${y1} L${ex.toFixed(1)},${ey.toFixed(1)}`;
  return (
    <g transform={mirror ? MIRROR : undefined}>
      <path d={line} className="fa-halo" />
      <path d={line} className="fa-arrow" />
      <path d={`M${x2},${y2} L${h1x.toFixed(1)},${h1y.toFixed(1)} L${h2x.toFixed(1)},${h2y.toFixed(1)} Z`} className="fa-ahead" />
    </g>
  );
}

function ArrowsLayer({ ids }: { ids: readonly string[] }) {
  return (
    <>
      {ids.flatMap((id) => {
        const m = MUSCLE_BY_ID[id];
        if (!m) return [];
        return m.arrows.flatMap((a, i) => {
          const out = [<Arrow key={`${id}-${i}-0`} a={a} mirror={false} />];
          if (m.paired) out.push(<Arrow key={`${id}-${i}-1`} a={a} mirror />);
          return out;
        });
      })}
    </>
  );
}

// ==================== المكوّن الرئيسي ====================
export default function FaceAtlas() {
  const uid = useId().replace(/:/g, '');
  const clipId = `${uid}-eye`;

  // ----- الحالة -----
  const [mode, setMode] = useState<Mode>('explore');
  const [selectedId, setSelectedId] = useState<string | null>(DEFAULT_ID);
  const [expressionId, setExpressionId] = useState<string | null>(null);
  const [branch, setBranch] = useState<BranchFilter>(null);
  const [zoom, setZoom] = useState<ZoomId>('whole');
  const [labelsOn, setLabelsOn] = useState(false);
  const [vb, setVb] = useState<ViewBox>(() => viewBoxFor('whole', false));
  const [svgW, setSvgW] = useState(0);
  const [emW, setEmW] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tab, setTab] = useState<DetailTab>('anatomy');
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [best, setBest] = useState(0);
  const [copied, setCopied] = useState(false);

  // ----- مراجع -----
  const svgRef = useRef<SVGSVGElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const vbRef = useRef<ViewBox>(vb);
  const labelsOnRef = useRef(false);
  const animRef = useRef(0);
  const reducedRef = useRef(false);
  const interacted = useRef(false);
  const bestRef = useRef(0);

  // ==================== الكاميرا ====================
  const animateTo = useCallback((to: ViewBox, instant = false) => {
    cancelAnimationFrame(animRef.current);
    const from = vbRef.current;
    if (instant || reducedRef.current) {
      vbRef.current = to;
      setVb(to);
      return;
    }
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 450);
      const e = 1 - Math.pow(1 - k, 3);
      const mix = (i: 0 | 1 | 2 | 3): number => from[i] + (to[i] - from[i]) * e;
      const next: ViewBox = [mix(0), mix(1), mix(2), mix(3)];
      vbRef.current = next;
      setVb(next);
      if (k < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  const changeZoom = useCallback(
    (z: ZoomId, instant = false) => {
      setZoom(z);
      animateTo(viewBoxFor(z, labelsOnRef.current), instant);
    },
    [animateTo],
  );

  const toggleLabels = useCallback(() => {
    const next = !labelsOnRef.current;
    labelsOnRef.current = next;
    setLabelsOn(next);
    animateTo(viewBoxFor(zoom, next), true);
  }, [animateTo, zoom]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  // ==================== بدء التشغيل ====================
  useIsoLayoutEffect(() => {
    try {
      reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      /* تجاهل */
    }

    let wantLabels = false;
    try {
      wantLabels = window.matchMedia('(min-width: 760px)').matches;
    } catch {
      /* تجاهل */
    }

    let startZoom: ZoomId = 'whole';
    try {
      const p = new URLSearchParams(window.location.search);
      const mid = p.get('m');
      const xid = p.get('x');
      if (xid && EXPRESSIONS.some((e) => e.id === xid)) {
        setExpressionId(xid);
        setSelectedId(null);
      } else if (mid && MUSCLE_BY_ID[mid]) {
        setSelectedId(mid);
        startZoom = MUSCLE_BY_ID[mid].zoom;
      }
    } catch {
      /* تجاهل */
    }

    labelsOnRef.current = wantLabels;
    setLabelsOn(wantLabels);
    setZoom(startZoom);
    const v = viewBoxFor(startZoom, wantLabels);
    vbRef.current = v;
    setVb(v);
  }, []);

  useEffect(() => {
    try {
      const n = Number(localStorage.getItem(BEST_KEY));
      if (Number.isFinite(n) && n > 0) {
        bestRef.current = n;
        setBest(n);
      }
    } catch {
      /* تجاهل */
    }
  }, []);

  useEffect(() => {
    if (!interacted.current || mode !== 'explore') return;
    try {
      const p = new URLSearchParams();
      if (expressionId) p.set('x', expressionId);
      else if (selectedId) p.set('m', selectedId);
      const qs = p.toString();
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    } catch {
      /* تجاهل */
    }
  }, [selectedId, expressionId, mode]);

  // ==================== القياسات ====================
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    setSvgW(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setSvgW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      const t = measureRef.current;
      if (!t || cancelled || typeof t.getComputedTextLength !== 'function') return;
      const next: Record<string, number> = {};
      for (const m of MUSCLES) {
        const text = m.short ?? m.en;
        t.textContent = text;
        const len = t.getComputedTextLength();
        if (len > 0) next[text] = len / 100;
      }
      t.textContent = '';
      if (Object.keys(next).length) setEmW(next);
    };
    run();
    try {
      void document.fonts?.ready.then(run);
    } catch {
      /* تجاهل */
    }
    return () => {
      cancelled = true;
    };
  }, []);

  // ==================== التحديد ====================
  const scrollToFigure = useCallback(() => {
    const fig = figRef.current;
    const card = cardRef.current;
    if (!fig) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
    let stuck = 0;
    if (card && getComputedStyle(card).position === 'sticky' && window.matchMedia('(max-width: 879px)').matches) {
      stuck = card.offsetHeight;
    }
    const top = window.scrollY + fig.getBoundingClientRect().top - navH - stuck - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedRef.current ? 'auto' : 'smooth' });
  }, []);

  const selectMuscle = useCallback(
    (id: string, opts?: { zoom?: boolean; scroll?: boolean }) => {
      const m = MUSCLE_BY_ID[id];
      if (!m) return;
      interacted.current = true;
      setSelectedId(id);
      setExpressionId(null);
      if (opts?.zoom) changeZoom(m.zoom);
      if (opts?.scroll) scrollToFigure();
    },
    [changeZoom, scrollToFigure],
  );

  const selectExpression = useCallback(
    (id: string) => {
      interacted.current = true;
      if (expressionId === id) {
        setExpressionId(null);
        setSelectedId((prev) => prev ?? DEFAULT_ID);
        return;
      }
      setExpressionId(id);
      setSelectedId(null);
      setBranch(null);
      changeZoom('whole');
    },
    [changeZoom, expressionId],
  );

  const toggleBranch = useCallback((b: Exclude<BranchFilter, null>) => {
    setBranch((prev) => (prev === b ? null : b));
    setExpressionId(null);
    setSelectedId((prev) => prev ?? DEFAULT_ID);
  }, []);

  // ==================== الاختبار ====================
  const startQuiz = useCallback(() => {
    setQuiz({
      questions: makeRound(ROUND_SIZE),
      index: 0,
      picked: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      missed: [],
      done: false,
    });
    setMode('quiz');
  }, []);

  const exitQuiz = useCallback(() => {
    setMode('explore');
    setQuiz(null);
    changeZoom('whole');
  }, [changeZoom]);

  const answerQuiz = useCallback((choice: string) => {
    setQuiz((prev) => {
      if (!prev || prev.picked !== null || prev.done) return prev;
      const q = prev.questions[prev.index];
      if (!q) return prev;
      const ok = choice === q.correct;
      const streak = ok ? prev.streak + 1 : 0;
      return {
        ...prev,
        picked: choice,
        score: prev.score + (ok ? 1 : 0),
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
        missed: ok || prev.missed.includes(q.id) ? prev.missed : [...prev.missed, q.id],
      };
    });
  }, []);

  const nextQuiz = useCallback(() => {
    setQuiz((prev) => {
      if (!prev || prev.picked === null) return prev;
      const next = prev.index + 1;
      if (next >= prev.questions.length) return { ...prev, done: true };
      return { ...prev, index: next, picked: null };
    });
  }, []);

  const reviewFromQuiz = useCallback(
    (id: string) => {
      setMode('explore');
      setQuiz(null);
      selectMuscle(id, { zoom: true, scroll: true });
    },
    [selectMuscle],
  );

  const currentQ = mode === 'quiz' && quiz && !quiz.done ? (quiz.questions[quiz.index] ?? null) : null;

  useEffect(() => {
    if (mode !== 'quiz') return;
    const m = currentQ ? MUSCLE_BY_ID[currentQ.id] : undefined;
    if (m && currentQ && (currentQ.kind === 'locate' || currentQ.kind === 'identify' || currentQ.kind === 'branch')) {
      changeZoom(m.zoom);
    } else {
      changeZoom('whole');
    }
  }, [mode, currentQ, changeZoom]);

  useEffect(() => {
    if (!quiz?.done) return;
    const b = Math.max(bestRef.current, quiz.score);
    if (b !== bestRef.current) {
      bestRef.current = b;
      setBest(b);
      try {
        localStorage.setItem(BEST_KEY, String(b));
      } catch {
        /* تجاهل */
      }
    }
  }, [quiz?.done, quiz?.score]);

  const handlePick = useCallback(
    (id: string) => {
      if (mode === 'quiz') {
        if (currentQ?.kind === 'locate' && quiz?.picked === null) answerQuiz(id);
        return;
      }
      selectMuscle(id);
    },
    [mode, currentQ, quiz?.picked, answerQuiz, selectMuscle],
  );

  // ==================== مشتقات العرض ====================
  const selected = selectedId ? (MUSCLE_BY_ID[selectedId] ?? null) : null;
  const expression = expressionId ? (EXPRESSIONS.find((e) => e.id === expressionId) ?? null) : null;

  const highlight = useMemo<ReadonlySet<string> | null>(() => {
    if (mode === 'quiz') return null;
    if (expression) return new Set(expression.muscles.map((x) => x.id));
    if (branch === 'v3') return new Set(V3_IDS);
    if (branch) return new Set(MUSCLES_BY_BRANCH[branch]);
    return null;
  }, [mode, expression, branch]);

  const pose = useMemo<Pose>(() => {
    if (expression) {
      return combinePoses(
        expression.muscles.map((x) => ({ pose: MUSCLE_BY_ID[x.id]?.pose ?? {}, w: x.w ?? 1 })),
        expression.extra,
      );
    }
    return selected?.pose ?? {};
  }, [expression, selected]);
  const poseKey = expression ? `x:${expression.id}` : `m:${selectedId ?? ''}`;

  const selItems = useMemo<SelItem[]>(() => {
    if (mode === 'explore') {
      if (expression) return expression.muscles.map((x) => ({ id: x.id, tone: 'sel' as const }));
      return selectedId ? [{ id: selectedId, tone: 'sel' as const }] : [];
    }
    if (!currentQ || !quiz) return [];
    const picked = quiz.picked;
    const items: SelItem[] = [];
    if (currentQ.kind === 'identify' || currentQ.kind === 'branch') {
      items.push({ id: currentQ.id, tone: picked !== null ? 'ok' : 'sel' });
    } else if (currentQ.kind === 'locate') {
      if (picked !== null) {
        if (picked !== '__skip' && picked !== currentQ.id && MUSCLE_BY_ID[picked]) items.push({ id: picked, tone: 'bad' });
        items.push({ id: currentQ.id, tone: 'ok' });
      }
    } else if (picked !== null) {
      items.push({ id: currentQ.id, tone: 'ok' });
    }
    return items;
  }, [mode, expression, selectedId, currentQ, quiz]);

  const arrowIds = useMemo<string[]>(() => {
    if (mode === 'explore') return expression ? expression.muscles.map((x) => x.id) : selectedId ? [selectedId] : [];
    if (!currentQ || !quiz || quiz.picked === null) return [];
    return [currentQ.id];
  }, [mode, expression, selectedId, currentQ, quiz]);

  const showLabels = labelsOn && mode === 'explore';
  const layout = useMemo(
    () => (showLabels ? layoutLabels(vb, svgW, (t) => emW[t] ?? t.length * 0.55) : { fs: 0, items: [] }),
    [showLabels, vb, svgW, emW],
  );

  const onK = useCallback((k: number) => {
    svgRef.current?.style.setProperty('--k', k.toFixed(3));
  }, []);

  // ==================== أحداث الرسم ====================
  const idFromEvent = (e: { target: EventTarget }): string | null => {
    const t = (e.target as Element).closest?.('[data-id]');
    return t?.getAttribute('data-id') ?? null;
  };

  const onLayerClick = (e: MouseEvent<SVGGElement>) => {
    const id = idFromEvent(e);
    if (id) handlePick(id);
  };

  const onLayerKey = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const id = idFromEvent(e);
    if (id) {
      e.preventDefault();
      handlePick(id);
    }
  };

  const onLayerMove = (e: PointerEvent<SVGGElement>) => {
    const tip = tipRef.current;
    const fig = figRef.current;
    if (!tip || !fig || e.pointerType !== 'mouse' || mode === 'quiz') return;
    const id = idFromEvent(e);
    if (!id) {
      tip.hidden = true;
      return;
    }
    const r = fig.getBoundingClientRect();
    tip.textContent = MUSCLE_BY_ID[id]?.en ?? '';
    tip.style.left = `${e.clientX - r.left}px`;
    tip.style.top = `${e.clientY - r.top}px`;
    tip.hidden = false;
  };

  const hideTip = () => {
    if (tipRef.current) tipRef.current.hidden = true;
  };

  const share = async () => {
    const qs = expressionId ? `x=${expressionId}` : selectedId ? `m=${selectedId}` : '';
    const url = `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Facial Muscles — Lawazem', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* المستخدم ألغى المشاركة */
    }
  };

  // ==================== الفهرس ====================
  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      MUSCLE_GROUPS.map((g) => ({
        g,
        ids: g.ids.filter((id) => {
          if (!q) return true;
          const m = MUSCLE_BY_ID[id];
          if (!m) return false;
          return [m.en, m.short, m.region, ACTION_AR[id], id].join(' ').toLowerCase().includes(q);
        }),
      })).filter((x) => x.ids.length > 0),
    [q],
  );

  // ==================== العرض ====================
  const statusText = expression
    ? `${expression.en} — ${expression.ar}`
    : selected
      ? selected.en
      : '';

  const inn = selected ? innervationOf(selected) : null;
  const arch = selected ? pharyngealArchOf(selected) : null;
  const selBranches = selected ? branchesOf(selected) : [];
  const cardClass = `fa-card rounded-card border border-line bg-paper-soft p-3 shadow-sm sm:p-3.5 ${mode === 'quiz' ? 'is-quiz' : 'is-sticky'}`;

  return (
    <div>
      {/* ---- شريط الأعلى ---- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5" role="group" aria-label="Atlas mode">
          <button type="button" className={chip} aria-pressed={mode === 'explore'} onClick={() => (mode === 'quiz' ? exitQuiz() : undefined)}>
            استكشاف
          </button>
          <button type="button" className={chip} aria-pressed={mode === 'quiz'} onClick={() => (mode === 'explore' ? startQuiz() : undefined)}>
            اختبر نفسك
          </button>
        </div>
        {mode === 'explore' && (
          <button type="button" className={btnGhost} onClick={share}>
            {copied ? 'تم نسخ الرابط ✓' : 'مشاركة هذه العضلة'}
          </button>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">{mode === 'explore' ? statusText : ''}</p>

      <div className="fa-layout mt-3">
        {/* ================= البطاقة ================= */}
        <section ref={cardRef} className={cardClass} aria-label={mode === 'quiz' ? 'Quiz' : 'Muscle info'}>
          {mode === 'quiz' && quiz ? (
            <QuizPanel
              state={quiz}
              best={best}
              onAnswer={answerQuiz}
              onNext={nextQuiz}
              onRestart={startQuiz}
              onExit={exitQuiz}
              onReview={reviewFromQuiz}
            />
          ) : (
            <>
              <div className="fa-card-main">
                <div className="min-w-0">
                  <p className="text-[11.5px] font-bold tracking-wide text-ink-muted">
                    {expression ? 'Expression' : selected?.region}
                  </p>

                  {expression ? (
                    <>
                      <h2 dir="ltr" className="mt-0.5 text-start font-display text-2xl font-bold leading-tight text-ink">
                        {expression.en}
                      </h2>
                      <p className="mt-0.5 text-sm font-semibold text-ink-muted">{expression.ar}</p>
                      {expression.noteEn ? (
                        <>
                          <p dir="ltr" className="mt-1.5 text-start text-sm leading-relaxed text-ink-soft">{expression.noteEn}</p>
                          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{expression.note}</p>
                        </>
                      ) : (
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{expression.note}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {expression.muscles.map((x) => (
                          <button key={x.id} type="button" dir="ltr" className={chipSmall} aria-pressed={false} onClick={() => selectMuscle(x.id, { zoom: true })}>
                            {MUSCLE_BY_ID[x.id]?.short ?? MUSCLE_BY_ID[x.id]?.en}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    selected && (
                      <>
                        <h2 dir="ltr" className="mt-0.5 text-start font-display text-2xl font-bold leading-tight text-ink">
                          {selected.en}
                        </h2>
                        <p dir="ltr" className="mt-1.5 text-start text-sm leading-relaxed text-ink">{selected.actEn}</p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{ACTION_AR[selected.id]}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
                          {inn === 'VII' && <span className={badge}>CN VII</span>}
                          {inn === 'V3' && <span className={badge}>CN V3</span>}
                          {arch && <span className={badge}>Arch {arch}</span>}
                          {selBranches.map((b) => (
                            <span key={b} className={badge}>{FACIAL_BRANCHES.find((x) => x.id === b)?.en}</span>
                          ))}
                        </div>
                      </>
                    )
                  )}
                </div>

                <ExpressionPreview pose={pose} poseKey={poseKey} onK={onK} />
              </div>

              {selected && !expression && (
                <div className="mt-2 border-t border-line pt-2">
                  <button
                    type="button"
                    aria-expanded={detailsOpen}
                    onClick={() => setDetailsOpen((o) => !o)}
                    className="text-sm font-semibold text-ink-soft hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                  >
                    {detailsOpen ? '− ' : '+ '}
                    <span dir="ltr">Origin, Insertion, Nerve & Clinical</span>
                  </button>

                  {detailsOpen && (
                    <div className="mt-2">
                      <div role="group" aria-label="Muscle details" className="flex gap-1.5">
                        {(Object.keys(TAB_LABEL) as DetailTab[]).map((t) => (
                          <button key={t} type="button" aria-pressed={tab === t} className={chipSmall} onClick={() => setTab(t)}>
                            <bdi dir="ltr">{TAB_LABEL[t]}</bdi>
                          </button>
                        ))}
                      </div>

                      <div className="mt-2 max-h-[34vh] overflow-auto text-[13px] leading-snug">
                        {tab === 'anatomy' && (
                          <dl dir="ltr" className="text-left">
                            <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Origin</dt>
                            <dd className="text-ink-soft">{selected.origin}</dd>
                            <dt className="mt-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Insertion</dt>
                            <dd className="text-ink-soft">{selected.insertion}</dd>
                          </dl>
                        )}

                        {tab === 'nerve' && (
                          <div>
                            <p dir="ltr" className="text-left text-ink-soft">{selected.nerve}</p>
                            {arch && (
                              <p className="mt-2 text-ink-soft">
                                {arch === 2
                                  ? 'من القوس البلعومي الثاني → عضلات التعبير تُغذّيها العصب الوجهي (VII).'
                                  : 'من القوس البلعومي الأول → عضلات المضغ يغذّيها العصب مثلث التوائم (V3).'}
                              </p>
                            )}
                          </div>
                        )}

                        {tab === 'clinical' && (
                          <div>
                            <p dir="ltr" className="text-left text-ink-soft">{selected.clin}</p>
                            {PEARLS_AR[selected.id] && (
                              <p className="mt-2 rounded-field border border-gold/30 bg-gold-tint p-2 text-ink">{PEARLS_AR[selected.id]}</p>
                            )}
                            {EXAM_TIPS[selected.id] && (
                              <p className="mt-2 text-ink-soft">
                                <span className="font-bold text-ink">How to examine: </span>
                                <bdi dir="ltr">{EXAM_TIPS[selected.id]?.en}</bdi>
                                <span className="mt-0.5 block text-[12px] text-ink-muted">{EXAM_TIPS[selected.id]?.ar}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ================= المسرح ================= */}
        <section className="fa-stage">
          <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Zoom">
            {(Object.keys(ZOOMS) as ZoomId[]).map((k) => (
              <button key={k} type="button" className={chip} aria-pressed={zoom === k} onClick={() => changeZoom(k)}>
                {ZOOMS[k].labelAr}
              </button>
            ))}
            {mode === 'explore' && (
              <>
                <span className="mx-0.5 w-px self-stretch bg-line" aria-hidden="true" />
                <button type="button" className={chip} aria-pressed={labelsOn} onClick={toggleLabels}>
                  Labels
                </button>
              </>
            )}
          </div>

          {mode === 'explore' && (
            <div className="mt-2 grid gap-1.5">
              <div className="fa-scroll" role="group" aria-label="Filter by nerve">
                <span className="self-center pe-1 text-xs font-bold text-ink-muted">Nerve</span>
                <button type="button" className={chipSmall} aria-pressed={branch === null && !expression} onClick={() => { setBranch(null); setExpressionId(null); setSelectedId((p) => p ?? DEFAULT_ID); }}>
                  All
                </button>
                {FACIAL_BRANCHES.map((b) => (
                  <button key={b.id} type="button" dir="ltr" className={chipSmall} aria-pressed={branch === b.id} onClick={() => toggleBranch(b.id)}>
                    {b.en}
                  </button>
                ))}
                <button type="button" className={chipSmall} aria-pressed={branch === 'v3'} onClick={() => toggleBranch('v3')}>
                  V3 · Mastication
                </button>
              </div>

              <div className="fa-scroll" role="group" aria-label="Expressions">
                <span className="self-center pe-1 text-xs font-bold text-ink-muted">Expressions</span>
                {EXPRESSIONS.map((x) => (
                  <button key={x.id} type="button" className={chipSmall} aria-pressed={expressionId === x.id} onClick={() => selectExpression(x.id)}>
                    <span dir="ltr">{x.en}</span> <span className="text-ink-muted">· {x.ar}</span>
                  </button>
                ))}
              </div>

              {branch && branch !== 'v3' && (
                <p className="text-xs text-ink-muted">
                  <bdi dir="ltr" className="font-mono">{BRANCH_MNEMONIC}</bdi> — Muscles highlighted receive this branch; some may also receive another.
                </p>
              )}
              {branch === 'v3' && (
                <p className="text-xs text-ink-muted">Muscles of mastication shown here: masseter and temporalis. The pterygoids are deep and listed further below.</p>
              )}
            </div>
          )}

          <div ref={figRef} className="fa-plate fa-figure mt-2" style={{ '--R': canvasRatio(labelsOn).toFixed(4) } as CSSProperties}>
            <svg
              ref={svgRef}
              viewBox={vb.map((n) => n.toFixed(2)).join(' ')}
              role="group"
              aria-label="Anatomical drawing of the facial muscles"
            >
              <defs>
                <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                  <path d="M226,201 Q248,187 270,201 Q248,214 226,201 Z" />
                </clipPath>
              </defs>

              <FaceBase />

              <g onClick={onLayerClick} onKeyDown={onLayerKey} onPointerMove={onLayerMove} onPointerLeave={hideTip}>
                <MusclesLayer highlight={highlight} hideNames={mode === 'quiz'} />
              </g>

              <g>
                <SelLayer items={selItems} />
              </g>

              <g className="fa-decor">
                <FaceDecor clipId={clipId} />
              </g>

              <g className="fa-decor">
                <ArrowsLayer ids={arrowIds} />
              </g>

              {showLabels && layout.fs > 0 && (
                <g>
                  {layout.items.map((it) => (
                    <g key={it.id}>
                      <text
                        x={it.tx}
                        y={it.ty}
                        fontSize={layout.fs}
                        textAnchor={it.anchor}
                        strokeWidth={layout.fs * 0.3}
                        className={selectedId === it.id && !expression ? 'fa-lab is-sel' : 'fa-lab'}
                        onClick={() => handlePick(it.id)}
                      >
                        {it.text}
                      </text>
                      <line x1={it.sx} y1={it.sy} x2={it.ax} y2={it.ay} className="fa-leader" strokeWidth={layout.fs * 0.07} />
                      <circle cx={it.ax} cy={it.ay} r={layout.fs * 0.2} className="fa-ldot" />
                    </g>
                  ))}
                </g>
              )}

              <text ref={measureRef} className="fa-lab" fontSize={100} x={0} y={0} visibility="hidden" aria-hidden="true" />
            </svg>

            <div ref={tipRef} className="fa-tip" hidden />
          </div>

          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            Simplified study illustration; positions are approximate. Arrows show the direction of pull on contraction.
            {mode === 'quiz' && currentQ?.kind === 'locate' && ' Tap the muscle on the drawing to answer.'}
          </p>
        </section>
      </div>

      {/* ================= الفهرس ================= */}
      {mode === 'explore' && (
        <section aria-label="Muscle list" className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2">
            <h2 className="font-display text-lg font-bold text-ink">Muscle Index</h2>
            <label className="block">
              <span className="sr-only">Search for a muscle</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search: smile, nasal, jaw..."
                dir="ltr"
                className="w-56 rounded-field border border-line bg-paper-soft px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              />
            </label>
          </div>

          {groups.length === 0 && <p className="mt-4 text-sm text-ink-muted">No matching results.</p>}

          {groups.map(({ g, ids }) => (
            <div key={g.labelEn}>
              <h3 className="mb-1.5 mt-4 text-[11.5px] font-bold tracking-wide text-ink-muted">
                <bdi dir="ltr">{g.labelEn}</bdi> · {g.label}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {ids.map((id) => (
                  <button
                    key={id}
                    type="button"
                    dir="ltr"
                    className={chip}
                    aria-pressed={!expression && selectedId === id}
                    onClick={() => selectMuscle(id, { zoom: true, scroll: true })}
                  >
                    {MUSCLE_BY_ID[id]?.en}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {mode === 'explore' && <AtlasExtras onSelect={(id) => selectMuscle(id, { zoom: true, scroll: true })} />}
    </div>
  );
}