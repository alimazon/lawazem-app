'use client';

// components/anatomy/FaceAtlas.tsx
import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import './face-atlas.css';

import { MUSCLES, MUSCLE_GROUPS, MUSCLE_BY_ID, NECK_GROUPS, ZOOMS, type ZoomId } from '@/lib/anatomy-data';
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
  nerveTagsOf,
  pharyngealArchOf,
  type FacialBranch,
} from '@/lib/anatomy-extras';
import { makeRound, type QuizScope } from '@/lib/anatomy-quiz';
import { NECK_TOPICS, NECK_OBJECTIVES, TRIANGLES } from '@/lib/anatomy-neck-notes';
import { useLocalState } from '@/lib/hooks/useLocalState';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { useDebounced } from '@/lib/hooks/useDebounced';
import {
  DEFAULT_LEARN, LEARN_KEY, LEARN_VERSION, computeStats, exportLearn, importLearn, markSeen, recordAnswer, setNote,
  toggleFavorite, type LearnState,
} from '@/lib/anatomy-learn';
import AtlasDialog from './AtlasDialog';
import CommandPalette, { type CommandHandlers } from './CommandPalette';
import Flashcards from './Flashcards';
import NoteForm from './NoteForm';
import OnboardingTour from './OnboardingTour';
import ProgressPanel from './ProgressPanel';
import RelatedMuscles from './RelatedMuscles';
import ShortcutsHelp from './ShortcutsHelp';
import { ToastProvider, useToast } from './Toasts';

import ExpressionPreview from './ExpressionPreview';
import QuizPanel, { QuizSetup, type QuizState } from './QuizPanel';
import AtlasExtras from './AtlasExtras';
import Atlas3DLazy, { webglAvailable } from './Atlas3DLazy';
import { NECK_OUTLINE } from '@/lib/anatomy-surface';

// ==================== ثوابت ====================
type Mode = 'explore' | 'quiz';
type PanelTab = 'info' | 'moves' | 'index' | 'neck';
type BranchFilter = FacialBranch | 'v3' | `g:${string}` | null;
type ViewMode = '2d' | '3d';
const isGroupBranch = (b: BranchFilter): b is `g:${string}` => typeof b === 'string' && b.startsWith('g:');
type Tone = 'sel' | 'ok' | 'bad';
interface SelItem { id: string; tone: Tone }

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const MIRROR = 'translate(400 0) scale(-1 1)';
const BEST_KEY = 'anatomy-face-quiz-best';
const EMPTY_BEST: Record<QuizScope, number> = { all: 0, face: 0, neck: 0 };
const VIEW_KEY = 'anatomy-face-view';
const ROUND_SIZE = 10;
const V3_IDS: readonly string[] = MUSCLE_GROUPS.find((g) => g.labelEn === 'Mastication (V3)')?.ids ?? [];

// ==================== طبقات الرسم الثابتة ====================
const FaceBase = memo(function FaceBase() {
  return (
    <g>
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

/** الرقبة والكتفان: تُرسم خلف الرأس وتمتد تحت حدود الرسم الأصلي (y > 540) */
const NeckBase = memo(function NeckBase() {
  return <path d={NECK_OUTLINE} className="fa-base-fascia" />;
});

/** معالم تشريحية بخطوط رفيعة فوق العضلات (العظم اللامي، الغضروف الدرقي، الترقوة) */
const NeckDecor = memo(function NeckDecor() {
  return (
    <g className="fa-decor">
      <path className="fa-neckmark" d="M160,468 L170,460 Q200,472 230,460 L240,468" />
      <path className="fa-neckmark" d="M186,490 L200,498 L214,490 L212,520 L200,526 L188,520 Z" />
      <path className="fa-neckmark" d="M190,532 Q200,538 210,532" />
      {[552, 570, 588, 606].map((y) => (
        <path key={y} className="fa-neckmark" strokeOpacity={0.3} d={`M193,${y} Q200,${y + 5} 207,${y}`} />
      ))}
      <path className="fa-neckmark" d="M204,640 C226,622 262,626 296,630 C330,634 360,628 388,624" />
      <path className="fa-neckmark" d="M196,640 C174,622 138,626 104,630 C70,634 40,628 12,624" />
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
function FaceAtlasInner() {
  const uid = useId().replace(/:/g, '');
  const clipId = `${uid}-eye`;

  // ----- الحالة -----
  const [mode, setMode] = useState<Mode>('explore');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expressionId, setExpressionId] = useState<string | null>(null);
  const [branch, setBranch] = useState<BranchFilter>(null);
  const [zoom, setZoom] = useState<ZoomId>('whole');
  const [labelsOn, setLabelsOn] = useState(false);
  const [vb, setVb] = useState<ViewBox>(() => viewBoxFor('whole', false));
  const [svgW, setSvgW] = useState(0);
  const [emW, setEmW] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [ptab, setPtab] = useState<PanelTab>('info');
  const [triId, setTriId] = useState<string | null>(null);
  const { notify } = useToast();
  const [learn, setLearn] = useLocalState<LearnState>(LEARN_KEY, DEFAULT_LEARN, LEARN_VERSION);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const quizOpts = useRef<{ scope: QuizScope; count: number }>({ scope: 'all', count: 10 });
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const quizRef = useRef<QuizState | null>(null);
  quizRef.current = quiz;
  const [bests, setBests] = useState<Record<QuizScope, number>>(EMPTY_BEST);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewMode>('2d');
  const [glOk, setGlOk] = useState(true);

  // ----- مراجع -----
  const svgRef = useRef<SVGSVGElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const vbRef = useRef<ViewBox>(vb);
  const labelsOnRef = useRef(false);
  const animRef = useRef(0);
  const reducedRef = useRef(false);
  const interacted = useRef(false);
  const bestsRef = useRef<Record<QuizScope, number>>(EMPTY_BEST);
  const kRef = useRef(0);

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
      // إخفاء التسميات افتراضياً على الجوال (أقل من 1024px)
      wantLabels = window.matchMedia('(min-width: 1024px)').matches;
    } catch {
      /* تجاهل */
    }

    let startZoom: ZoomId = 'whole';
    let want3d = false;
    try {
      const p = new URLSearchParams(window.location.search);
      const mid = p.get('m');
      const xid = p.get('x');
      want3d = p.get('v') === '3d';
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
    if (want3d && webglAvailable()) setView('3d');
  }, []);

  useEffect(() => {
    try {
      const loaded: Record<QuizScope, number> = { ...EMPTY_BEST };
      for (const sc of ['all', 'face', 'neck'] as const) {
        const n = Number(localStorage.getItem(`${BEST_KEY}:${sc}`));
        if (Number.isFinite(n) && n > 0) loaded[sc] = n;
      }
      bestsRef.current = loaded;
      setBests(loaded);
      if (localStorage.getItem(VIEW_KEY) === '3d' && webglAvailable()) setView('3d');
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
      if (view === '3d') p.set('v', '3d');
      const qs = p.toString();
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    } catch {
      /* تجاهل */
    }
  }, [selectedId, expressionId, mode, view]);

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
  const selectMuscle = useCallback(
    (id: string, opts?: { zoom?: boolean }) => {
      const m = MUSCLE_BY_ID[id];
      if (!m) return;
      interacted.current = true;
      setSelectedId(id);
      setExpressionId(null);
      setTriId(null);
      setPtab('info');
      if (opts?.zoom) changeZoom(m.zoom);
    },
    [changeZoom],
  );

  const selectExpression = useCallback(
    (id: string) => {
      interacted.current = true;
      if (expressionId === id) {
        setExpressionId(null);
        setSelectedId((prev) => prev);
        return;
      }
      setExpressionId(id);
      setSelectedId(null);
      setBranch(null);
      changeZoom(EXPRESSIONS.find((e) => e.id === id)?.zoom ?? 'whole');
    },
    [changeZoom, expressionId],
  );

  const pickTriangle = useCallback(
    (id: string | null) => {
      interacted.current = true;
      setTriId(id);
      setExpressionId(null);
      setBranch(null);
      if (id) {
        const t = TRIANGLES.find((x) => x.id === id);
        changeZoom(t?.parent === 'posterior' ? 'posterior' : 'throat');
      }
    },
    [changeZoom],
  );

  const chooseView = useCallback((v: ViewMode) => {
    if (v === '3d' && !webglAvailable()) {
      setGlOk(false);
      return;
    }
    interacted.current = true;
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* تجاهل */
    }
  }, []);

  const on3dFail = useCallback(() => {
    setGlOk(false);
    setView('2d');
  }, []);

  const toggleBranch = useCallback((b: Exclude<BranchFilter, null>) => {
    setBranch((prev) => (prev === b ? null : b));
    setExpressionId(null);
    setSelectedId((prev) => prev);
  }, []);

  // ==================== الاختبار ====================
  const startQuiz = useCallback(() => {
    setQuiz(null);
    setMode('quiz');
  }, []);

  const beginQuiz = useCallback((o: { scope: QuizScope; count: number; only?: readonly string[] }) => {
    quizOpts.current = { scope: o.scope, count: o.count };
    setQuiz({
      questions: makeRound({ count: o.count, scope: o.scope, only: o.only }),
      index: 0,
      picked: null,
      score: 0,
      streak: 0,
      bestStreak: 0,
      missed: [],
      done: false,
      scope: o.scope,
      hinted: false,
    });
    setMode('quiz');
  }, []);

  const exitQuiz = useCallback(() => {
    setMode('explore');
    setQuiz(null);
    changeZoom('whole');
  }, [changeZoom]);

  const answerQuiz = useCallback(
    (choice: string) => {
      const cur = quizRef.current;
      if (!cur || cur.picked !== null || cur.done) return;
      const q = cur.questions[cur.index];
      if (!q) return;
      const ok = choice === q.correct;
      // التسجيل مرة واحدة هنا (وليس داخل دالة التحديث التي قد تُنفَّذ مرتين في StrictMode)
      if (MUSCLE_BY_ID[q.id]) setLearn((p) => recordAnswer(p, q.id, ok));
      quizRef.current = { ...cur, picked: choice };
      setQuiz((prev) => {
        if (!prev || prev.picked !== null || prev.done) return prev;
        const streak = ok ? prev.streak + 1 : 0;
        return {
          ...prev,
          picked: choice,
          score: prev.score + (ok ? 1 : 0),
          streak,
          bestStreak: Math.max(prev.bestStreak, streak),
          missed: ok || prev.missed.includes(q.id) || !MUSCLE_BY_ID[q.id] ? prev.missed : [...prev.missed, q.id],
        };
      });
    },
    [setLearn],
  );

  const nextQuiz = useCallback(() => {
    setQuiz((prev) => {
      if (!prev || prev.picked === null) return prev;
      const next = prev.index + 1;
      if (next >= prev.questions.length) return { ...prev, done: true };
      return { ...prev, index: next, picked: null, hinted: false };
    });
  }, []);

  const hintQuiz = useCallback(() => {
    setQuiz((prev) => (prev ? { ...prev, hinted: true } : prev));
    const q = quiz?.questions[quiz.index];
    const m = q ? MUSCLE_BY_ID[q.id] : undefined;
    if (m && q?.kind === 'locate') changeZoom(m.zoom);
  }, [quiz, changeZoom]);

  const reviewFromQuiz = useCallback(
    (id: string) => {
      setMode('explore');
      setQuiz(null);
      selectMuscle(id, { zoom: true });
    },
    [selectMuscle],
  );

  const currentQ = mode === 'quiz' && quiz && !quiz.done ? (quiz.questions[quiz.index] ?? null) : null;

  useEffect(() => {
    if (mode !== 'quiz') return;
    const m = currentQ ? MUSCLE_BY_ID[currentQ.id] : undefined;
    if (m && currentQ && (currentQ.kind === 'identify' || currentQ.kind === 'branch' || currentQ.kind === 'nerve')) {
      changeZoom(m.zoom);
    } else if (currentQ && (currentQ.kind === 'boundary' || currentQ.kind === 'contents')) {
      changeZoom('neck');
    } else {
      changeZoom('whole');
    }
  }, [mode, currentQ, changeZoom]);

  useEffect(() => {
    if (!quiz?.done) return;
    const pct = Math.round((quiz.score / Math.max(1, quiz.questions.length)) * 100);
    const prev = bestsRef.current[quiz.scope];
    if (pct > prev) {
      bestsRef.current = { ...bestsRef.current, [quiz.scope]: pct };
      setBests(bestsRef.current);
      try {
        localStorage.setItem(`${BEST_KEY}:${quiz.scope}`, String(pct));
      } catch {
        /* تجاهل */
      }
    }
  }, [quiz?.done, quiz?.score, quiz?.scope, quiz?.questions.length]);

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
    if (triId) return new Set(TRIANGLES.find((t) => t.id === triId)?.muscles ?? []);
    if (isGroupBranch(branch)) return new Set(MUSCLE_GROUPS.find((g) => `g:${g.labelEn}` === branch)?.ids ?? []);
    if (branch === 'v3') return new Set(V3_IDS);
    if (branch) return new Set(MUSCLES_BY_BRANCH[branch]);
    return null;
  }, [mode, expression, branch, triId]);

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
    if (currentQ.kind === 'identify' || currentQ.kind === 'branch' || currentQ.kind === 'nerve') {
      items.push({ id: currentQ.id, tone: picked !== null ? 'ok' : 'sel' });
    } else if (currentQ.kind === 'locate') {
      if (picked !== null) {
        if (picked !== '__skip' && picked !== currentQ.id && MUSCLE_BY_ID[picked]) items.push({ id: picked, tone: 'bad' });
        items.push({ id: currentQ.id, tone: 'ok' });
      }
    } else if (currentQ.kind === 'boundary') {
      if (picked !== null) items.push({ id: currentQ.correct, tone: 'ok' });
    } else if (currentQ.kind === 'contents') {
      /* لا عضلة محددة */
    } else if (picked !== null) {
      items.push({ id: currentQ.id, tone: 'ok' });
    }
    return items;
  }, [mode, expression, selectedId, currentQ, quiz]);

  const arrowIds = useMemo<string[]>(() => {
    if (mode === 'explore') return expression ? expression.muscles.map((x) => x.id) : selectedId ? [selectedId] : [];
    if (!currentQ || !quiz || quiz.picked === null) return [];
    return MUSCLE_BY_ID[currentQ.id] ? [currentQ.id] : [];
  }, [mode, expression, selectedId, currentQ, quiz]);

  const showLabels = labelsOn && mode === 'explore';
  const layout = useMemo(
    () => (showLabels ? layoutLabels(vb, svgW, (t) => emW[t] ?? t.length * 0.55) : { fs: 0, items: [] }),
    [showLabels, vb, svgW, emW],
  );

  const onK = useCallback((k: number) => {
    kRef.current = k;
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
    const parts: string[] = [];
    if (expressionId) parts.push(`x=${expressionId}`);
    else if (selectedId) parts.push(`m=${selectedId}`);
    if (view === '3d') parts.push('v=3d');
    const qs = parts.join('&');
    const url = `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Facial & Neck Muscles — Lawazem', url });
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
  const debouncedQuery = useDebounced(query, 180);

  // ==================== التعلّم والأوامر ====================
  useEffect(() => {
    if (selectedId && mode === 'explore') setLearn((p) => markSeen(p, selectedId));
  }, [selectedId, mode, setLearn]);

  const favSet = useMemo(() => new Set(learn.favorites), [learn.favorites]);
  const stats = useMemo(() => computeStats(learn), [learn]);

  const toggleFav = useCallback(() => {
    if (!selectedId) return;
    const was = favSet.has(selectedId);
    setLearn((p) => toggleFavorite(p, selectedId));
    notify(was ? 'أُزيلت من المفضّلة' : 'أُضيفت إلى المفضّلة', 'success');
  }, [selectedId, favSet, setLearn, notify]);

  const openNote = useCallback(() => {
    if (selectedId) setNoteOpen(true);
  }, [selectedId]);

  const saveNote = useCallback(
    (text: string) => {
      if (!selectedId) return;
      setLearn((p) => setNote(p, selectedId, text));
      setNoteOpen(false);
      notify(text.trim() ? 'حُفظت الملاحظة' : 'حُذفت الملاحظة', 'success');
    },
    [selectedId, setLearn, notify],
  );

  const handleExport = useCallback(() => {
    const blob = new Blob([exportLearn(learn)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lawazem-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    notify('تم تصدير التقدّم', 'success');
  }, [learn, notify]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const parsed = importLearn(await f.text());
      if (parsed) {
        setLearn(parsed);
        notify('تم استيراد التقدّم', 'success');
      } else {
        notify('ملف غير صالح', 'error');
      }
    };
    input.click();
  }, [setLearn, notify]);

  const resetProgress = useCallback(() => {
    if (window.confirm('تصفير كل التقدّم والمفضّلة والملاحظات؟')) {
      setLearn(DEFAULT_LEARN);
      notify('صُفِّر التقدّم', 'info');
    }
  }, [setLearn, notify]);

  const dialogOpen = cmdOpen || progressOpen || flashOpen || shortcutsOpen || noteOpen;

  const commandHandlers = useMemo<CommandHandlers>(
    () => ({
      onMuscle: (id) => reviewFromQuiz(id),
      onExpression: (id) => {
        setMode('explore');
        setQuiz(null);
        setPtab('moves');
        selectExpression(id);
      },
      onZoom: (z) => {
        setMode('explore');
        setQuiz(null);
        changeZoom(z);
      },
      onTriangle: (id) => {
        setMode('explore');
        setQuiz(null);
        setPtab('neck');
        pickTriangle(id);
      },
      onAction: (a) => {
        if (a === 'quiz') startQuiz();
        else if (a === 'flashcards') setFlashOpen(true);
        else if (a === 'progress') setProgressOpen(true);
        else if (a === 'shortcuts') setShortcutsOpen(true);
        else if (a === 'share') void share();
        else if (a === 'export') handleExport();
        else if (a === 'import') handleImport();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reviewFromQuiz, selectExpression, changeZoom, pickTriangle, startQuiz, handleExport, handleImport],
  );

  useKeyboard([{ key: 'k', meta: true, allowInInput: true, handler: () => setCmdOpen(true), description: 'Search' }], !flashOpen);
  useKeyboard(
    [
      { key: '?', handler: () => setShortcutsOpen(true), description: 'Shortcuts' },
      { key: '؟', handler: () => setShortcutsOpen(true), description: 'Shortcuts' },
      { key: '1', handler: () => setPtab('info'), description: 'Details' },
      { key: '2', handler: () => setPtab('moves'), description: 'Movements' },
      { key: '3', handler: () => setPtab('neck'), description: 'Neck' },
      { key: '4', handler: () => setPtab('index'), description: 'Index' },
      { key: 'v', handler: () => chooseView(view === '3d' ? '2d' : '3d'), description: 'View' },
      { key: 'f', handler: toggleFav, description: 'Favorite' },
      { key: 'n', handler: openNote, description: 'Note' },
      { key: 'p', handler: () => setProgressOpen(true), description: 'Progress' },
      { key: 's', handler: () => void share(), description: 'Share' },
    ],
    mode === 'explore' && !dialogOpen,
  );

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: globalThis.MouseEvent): void => {
      if (!(e.target as HTMLElement).closest('.fa-more-wrap')) setMoreOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [moreOpen]);

  const q = debouncedQuery.trim().toLowerCase();
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

  const selTags = selected ? nerveTagsOf(selected) : [];
  const arch = selected ? pharyngealArchOf(selected) : null;
  const selBranches = selected ? branchesOf(selected) : [];
  
  // حساب النسبة هنا لتتوافق مع حالة التسميات
  const dynamicR = view === '3d' ? 0.9 : canvasRatio(zoom, labelsOn);

  const NECK_MOVES = ['headTurn', 'headFlex', 'lateralFlex', 'shrug', 'swallow'];
  const faceMoves = EXPRESSIONS.filter((x) => !NECK_MOVES.includes(x.id));
  const neckMoves = EXPRESSIONS.filter((x) => NECK_MOVES.includes(x.id));
  const filterValue = branch ?? '';

  const applyFilter = (v: string) => {
    setExpressionId(null);
    setBranch(v === '' ? null : (v as BranchFilter));
  };

  const moveRow = (x: (typeof EXPRESSIONS)[number]) => (
    <div key={x.id}>
      <button type="button" className="fa-row" aria-pressed={expressionId === x.id} onClick={() => selectExpression(x.id)}>
        <span dir="ltr" className="fa-row-en">{x.en}</span>
        <span className="fa-row-ar">{x.ar}</span>
      </button>
      {expressionId === x.id && (
        <div className="fa-row-open">
          {x.noteEn && <p dir="ltr" className="fa-text">{x.noteEn}</p>}
          <p className="fa-text-ar">{x.note}</p>
          <div className="fa-tags" dir="ltr">
            {x.muscles.map((m) => (
              <button key={m.id} type="button" className="fa-tag is-btn" onClick={() => selectMuscle(m.id, { zoom: true })}>
                {MUSCLE_BY_ID[m.id]?.short ?? MUSCLE_BY_ID[m.id]?.en}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fa-studio">
      {/* ---- الشريط العلوي ---- */}
      <div className="fa-bar">
        <div className="fa-seg" role="group" aria-label="Atlas mode">
          <button type="button" aria-pressed={mode === 'explore'} onClick={() => (mode === 'quiz' ? exitQuiz() : undefined)}>استكشاف</button>
          <button type="button" aria-pressed={mode === 'quiz'} onClick={() => (mode === 'explore' ? startQuiz() : undefined)}>اختبر نفسك</button>
        </div>
        <div className="fa-bar-end">
          <div className="fa-seg" role="group" aria-label="View mode">
            <button type="button" aria-pressed={view === '2d'} onClick={() => chooseView('2d')}><span dir="ltr">2D</span></button>
            <button
              type="button"
              aria-pressed={view === '3d'}
              disabled={!glOk}
              title={glOk ? undefined : 'WebGL غير مدعوم على هذا الجهاز'}
              onClick={() => chooseView('3d')}
            >
              <span dir="ltr">3D</span>
            </button>
          </div>
          <button type="button" className="fa-btn" onClick={() => setCmdOpen(true)} aria-label="Search and commands">
            بحث <kbd className="fa-kbd" dir="ltr">⌘K</kbd>
          </button>
          <div className="fa3-menu fa-more-wrap">
            <button type="button" className="fa-btn" aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((o) => !o)}>
              المزيد{stats.due > 0 ? ` · ${stats.due}` : ''} ▾
            </button>
            {moreOpen && (
              <div className="fa3-pop fa-more" role="menu" onClick={() => setMoreOpen(false)}>
                <button type="button" role="menuitem" onClick={() => setProgressOpen(true)}>تقدّمي</button>
                <button type="button" role="menuitem" onClick={() => setFlashOpen(true)}>بطاقات المراجعة{stats.due > 0 ? ` (${stats.due})` : ''}</button>
                <button type="button" role="menuitem" onClick={() => void share()}>{copied ? 'تم نسخ الرابط ✓' : 'مشاركة الرابط'}</button>
                <button type="button" role="menuitem" onClick={handleExport}>تصدير التقدّم</button>
                <button type="button" role="menuitem" onClick={handleImport}>استيراد التقدّم</button>
                <button type="button" role="menuitem" onClick={() => setShortcutsOpen(true)}>الاختصارات</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{mode === 'explore' ? statusText : ''}</p>

      <div className="fa-grid">
        {/* ================= المجسّم / الرسم ================= */}
        <section className="fa-viewer" data-view={view} aria-label="Viewer">
          <div className="fa-vbar" role="toolbar" aria-label="Focus region">
            <div className="fa-scroll">
              {(Object.keys(ZOOMS) as ZoomId[]).map((k) => (
                <button key={k} type="button" className="fa-pill" aria-pressed={zoom === k} onClick={() => changeZoom(k)}>
                  {ZOOMS[k].labelAr}
                </button>
              ))}
            </div>
            {mode === 'explore' && view === '2d' && (
              <button type="button" className="fa-btn fa-hide-sm" aria-pressed={labelsOn} onClick={toggleLabels}>التسميات</button>
            )}
          </div>

          <div ref={figRef} className="fa-plate fa-figure" style={{ '--R': dynamicR.toFixed(4) } as CSSProperties}>
            <svg
              ref={svgRef}
              viewBox={vb.map((n) => n.toFixed(2)).join(' ')}
              role="group"
              aria-label="Anatomical drawing of the facial and neck muscles"
              style={view === '3d' ? { display: 'none' } : undefined}
            >
              <defs>
                <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                  <path d="M226,201 Q248,187 270,201 Q248,214 226,201 Z" />
                </clipPath>
              </defs>

              <NeckBase />
              <FaceBase />

              <g onClick={onLayerClick} onKeyDown={onLayerKey} onPointerMove={onLayerMove} onPointerLeave={hideTip}>
                <MusclesLayer highlight={highlight} hideNames={mode === 'quiz'} />
              </g>

              <g>
                <SelLayer items={selItems} />
              </g>

              <NeckDecor />

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

            {view === '3d' && (
              <Atlas3DLazy
                zoom={zoom}
                selItems={selItems}
                highlight={highlight}
                arrowIds={arrowIds}
                pose={pose}
                kRef={kRef}
                hideNames={mode === 'quiz'}
                onPick={handlePick}
                onFail={on3dFail}
                onZoomRequest={changeZoom}
              />
            )}

            <div ref={tipRef} className="fa-tip" hidden />
          </div>

          <p className="fa-hint">
            {view === '3d'
              ? 'اسحب للتدوير، وبالعجلة أو القرص للتكبير. اضغط على أي عضلة لتحديدها، واستخدم «قشّر الطبقات» للوصول للعضلات العميقة.'
              : 'رسم تعليمي مبسّط. الأسهم تُظهر اتجاه شدّ العضلة عند الانقباض.'}
          </p>
        </section>

        {/* ================= اللوحة الجانبية ================= */}
        <aside className="fa-panel" aria-label={mode === 'quiz' ? 'Quiz' : 'Muscle info'}>
          {mode === 'quiz' ? (
            <div className="fa-panel-pad">
              {quiz ? (
                <QuizPanel
                  state={quiz}
                  best={bests[quiz.scope]}
                  onAnswer={answerQuiz}
                  onNext={nextQuiz}
                  onRestart={() => beginQuiz(quizOpts.current)}
                  onRetryMissed={() => beginQuiz({ scope: quiz.scope, count: quiz.missed.length, only: quiz.missed })}
                  onExit={exitQuiz}
                  onReview={reviewFromQuiz}
                  onHint={hintQuiz}
                />
              ) : (
                <QuizSetup best={bests} onStart={beginQuiz} onExit={exitQuiz} />
              )}
            </div>
          ) : (
            <>
              <div className="fa-search">
                <label>
                  <span className="sr-only">Search for a muscle</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (e.target.value) setPtab('index');
                    }}
                    placeholder="ابحث: smile, jaw, neck, SCM…"
                    dir="ltr"
                  />
                </label>
              </div>

              <div className="fa-sum">
                <div className="fa-sum-text">
                  <p className="fa-eyebrow">{expression ? 'حركة · Movement' : (selected?.region ?? 'الأطلس')}</p>
                  <h2 dir="ltr" className={`fa-title${(expression?.en ?? selected?.en ?? '').length > 15 ? ' is-long' : ''}`}>
                    {expression ? expression.en : selected ? selected.en : 'Select a muscle'}
                  </h2>
                  {expression && <p className="fa-sub">{expression.ar}</p>}
                  {!expression && selected && (
                    <>
                      <p dir="ltr" className="fa-text">{selected.actEn}</p>
                      <p className="fa-text-ar">{ACTION_AR[selected.id]}</p>
                    </>
                  )}
                  {!expression && !selected && (
                    <p className="fa-text-ar">اضغط على أي عضلة في النموذج، أو اخترها من الفهرس، أو جرّب إحدى الحركات.</p>
                  )}
                  {!expression && selected && (
                    <div className="fa-tags" dir="ltr">
                      {selTags.map((t) => <span key={t} className="fa-tag">{t}</span>)}
                      {arch && <span className="fa-tag">Arch {arch}</span>}
                      {selBranches.map((b) => (
                        <span key={b} className="fa-tag">{FACIAL_BRANCHES.find((x) => x.id === b)?.en}</span>
                      ))}
                    </div>
                  )}
                  {!expression && selected && (
                    <div className="fa-tags">
                      <button type="button" className="fa-btn" aria-pressed={favSet.has(selected.id)} onClick={toggleFav}>
                        {favSet.has(selected.id) ? '★ في المفضّلة' : '☆ مفضّلة'}
                      </button>
                      <button type="button" className="fa-btn" onClick={openNote}>{learn.notes[selected.id] ? 'تعديل الملاحظة' : 'ملاحظة'}</button>
                    </div>
                  )}
                </div>
                <ExpressionPreview pose={pose} poseKey={poseKey} onK={onK} />
              </div>

              <div className="fa-tabs" role="tablist" aria-label="Panel">
                {([['info', 'Details', 'التفاصيل'], ['moves', 'Moves', 'الحركات'], ['neck', 'Neck', 'الرقبة'], ['index', 'Index', 'الفهرس']] as const).map(([id, en, ar]) => (
                  <button key={id} type="button" role="tab" aria-selected={ptab === id} onClick={() => setPtab(id)}>
                    <span dir="ltr">{en}</span>
                    <small>{ar}</small>
                  </button>
                ))}
              </div>

              <div className="fa-body" role="tabpanel">
                {ptab === 'info' && (
                  <>
                    {expression && (
                      <div className="fa-sec">
                        {expression.noteEn && <p dir="ltr" className="fa-text">{expression.noteEn}</p>}
                        <p className="fa-text-ar">{expression.note}</p>
                        <p className="fa-sec-title"><span dir="ltr">Muscles involved</span><small>العضلات المشاركة</small></p>
                        <div className="fa-tags" dir="ltr">
                          {expression.muscles.map((x) => (
                            <button key={x.id} type="button" className="fa-tag is-btn" onClick={() => selectMuscle(x.id, { zoom: true })}>
                              {MUSCLE_BY_ID[x.id]?.short ?? MUSCLE_BY_ID[x.id]?.en}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!expression && selected && (
                      <>
                        <div className="fa-sec">
                          <p className="fa-sec-title"><span dir="ltr">Origin</span><small>المنشأ</small></p>
                          <p dir="ltr" className="fa-text">{selected.origin}</p>
                          <p className="fa-sec-title"><span dir="ltr">Insertion</span><small>المرتكز</small></p>
                          <p dir="ltr" className="fa-text">{selected.insertion}</p>
                        </div>
                        <div className="fa-sec">
                          <p className="fa-sec-title"><span dir="ltr">Innervation</span><small>العصب المغذّي</small></p>
                          <p dir="ltr" className="fa-text">{selected.nerve}</p>
                          {arch && (
                            <p className="fa-text-ar">
                              {arch === 2
                                ? 'من القوس البلعومي الثاني → يغذّيها العصب الوجهي (VII).'
                                : 'من القوس البلعومي الأول → يغذّيها العصب مثلث التوائم (V3).'}
                            </p>
                          )}
                        </div>
                        <div className="fa-sec">
                          <p className="fa-sec-title"><span dir="ltr">Clinical</span><small>سريري</small></p>
                          <p dir="ltr" className="fa-text">{selected.clin}</p>
                          {PEARLS_AR[selected.id] && <p className="fa-pearl">{PEARLS_AR[selected.id]}</p>}
                          {EXAM_TIPS[selected.id] && (
                            <p className="fa-text-ar">
                              <strong>الفحص: </strong>
                              <bdi dir="ltr">{EXAM_TIPS[selected.id]?.en}</bdi>
                              <span className="fa-muted-line">{EXAM_TIPS[selected.id]?.ar}</span>
                            </p>
                          )}
                        </div>
                        {learn.notes[selected.id] && (
                          <div className="fa-sec">
                            <p className="fa-sec-title"><span dir="ltr">My note</span><small>ملاحظتي</small></p>
                            <p className="fa-text-ar fa-note-view">{learn.notes[selected.id]}</p>
                          </div>
                        )}
                        <RelatedMuscles id={selected.id} onPick={(id) => selectMuscle(id, { zoom: true })} />
                      </>
                    )}

                    {!expression && !selected && <p className="fa-text-ar">لا توجد عضلة محددة.</p>}
                  </>
                )}

                {ptab === 'moves' && (
                  <>
                    <p className="fa-sec-title"><span dir="ltr">Facial expressions</span><small>تعابير الوجه</small></p>
                    <div className="fa-list">{faceMoves.map(moveRow)}</div>
                    <p className="fa-sec-title"><span dir="ltr">Head and neck movements</span><small>حركات الرأس والرقبة</small></p>
                    <div className="fa-list">{neckMoves.map(moveRow)}</div>
                  </>
                )}

                {ptab === 'neck' && (
                  <>
                    <p className="fa-sec-title"><span dir="ltr">Triangles of the neck</span><small>مثلثات الرقبة</small></p>
                    <div className="fa-list">
                      {TRIANGLES.map((t) => (
                        <div key={t.id}>
                          <button type="button" className="fa-row" aria-pressed={triId === t.id} onClick={() => pickTriangle(triId === t.id ? null : t.id)}>
                            <span dir="ltr" className="fa-row-en">{t.en}</span>
                            <span className="fa-row-ar">{t.ar}</span>
                          </button>
                          {triId === t.id && (
                            <div className="fa-row-open">
                              <p className="fa-sec-title"><span dir="ltr">Boundaries</span><small>الحدود</small></p>
                              <p dir="ltr" className="fa-text">{t.boundaries}</p>
                              <p className="fa-sec-title"><span dir="ltr">Contents</span><small>المحتويات</small></p>
                              <ul dir="ltr" className="fa-bul">{t.contents.map((c) => <li key={c}>{c}</li>)}</ul>
                              <div className="fa-tags" dir="ltr">
                                {t.muscles.map((id) => (
                                  <button key={id} type="button" className="fa-tag is-btn" onClick={() => selectMuscle(id, { zoom: false })}>
                                    {MUSCLE_BY_ID[id]?.short ?? MUSCLE_BY_ID[id]?.en}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="fa-sec-title"><span dir="ltr">Anatomy of the neck</span><small>من الملزمة</small></p>
                    <div className="fa-acc">
                      {NECK_TOPICS.map((t) => (
                        <details key={t.id}>
                          <summary><span dir="ltr">{t.en}</span><small>{t.ar}</small></summary>
                          <ul dir="ltr" className="fa-bul">{t.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                          <p className="fa-text-ar">{t.gist}</p>
                        </details>
                      ))}
                      <details>
                        <summary><span dir="ltr">Learning objectives</span><small>أهداف التعلّم</small></summary>
                        <ul dir="ltr" className="fa-bul">{NECK_OBJECTIVES.map((o) => <li key={o}>{o}</li>)}</ul>
                      </details>
                    </div>
                  </>
                )}

                {ptab === 'index' && (
                  <>
                    <label className="fa-filter">
                      <span>تصفية</span>
                      <select value={filterValue} onChange={(e) => applyFilter(e.target.value)} dir="ltr">
                        <option value="">All muscles</option>
                        <optgroup label="Facial nerve branches">
                          {FACIAL_BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.en}</option>)}
                        </optgroup>
                        <optgroup label="Trigeminal">
                          <option value="v3">V3 · Mastication</option>
                        </optgroup>
                        <optgroup label="Neck">
                          {NECK_GROUPS.map((g) => <option key={g.labelEn} value={`g:${g.labelEn}`}>{g.labelEn}</option>)}
                        </optgroup>
                      </select>
                    </label>
                    {branch && !isGroupBranch(branch) && branch !== 'v3' && (
                      <p className="fa-muted-line"><bdi dir="ltr" className="font-mono">{BRANCH_MNEMONIC}</bdi></p>
                    )}

                    {learn.favorites.length > 0 && !q && !branch && (
                      <div>
                        <p className="fa-sec-title"><span dir="ltr">Favorites</span><small>المفضّلة</small></p>
                        <div className="fa-list">
                          {learn.favorites.map((id) => (
                            <button key={id} type="button" dir="ltr" className="fa-row" aria-pressed={!expression && selectedId === id} onClick={() => selectMuscle(id, { zoom: true })}>
                              <span className="fa-row-en">★ {MUSCLE_BY_ID[id]?.en}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {groups.length === 0 && <p className="fa-text-ar">لا توجد نتائج.</p>}
                    {groups.map(({ g, ids }) => (
                      <div key={g.labelEn}>
                        <p className="fa-sec-title"><bdi dir="ltr">{g.labelEn}</bdi> · {g.label}</p>
                        <div className="fa-list">
                          {ids.map((id) => (
                            <button
                              key={id}
                              type="button"
                              dir="ltr"
                              className="fa-row"
                              aria-pressed={!expression && selectedId === id}
                              onClick={() => selectMuscle(id, { zoom: true })}
                            >
                              <span className="fa-row-en">{MUSCLE_BY_ID[id]?.en}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <AtlasExtras onSelect={(id) => selectMuscle(id, { zoom: true })} />
                  </>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} handlers={commandHandlers} />
      <AtlasDialog open={progressOpen} onClose={() => setProgressOpen(false)} title="تقدّمي في التعلّم">
        <ProgressPanel
          learn={learn}
          onStudy={() => { setProgressOpen(false); setFlashOpen(true); }}
          onReset={resetProgress}
          onExport={handleExport}
          onImport={handleImport}
          onOpenMuscle={(id) => { setProgressOpen(false); reviewFromQuiz(id); }}
        />
      </AtlasDialog>
      <AtlasDialog open={flashOpen} onClose={() => setFlashOpen(false)} title="بطاقات المراجعة">
        {flashOpen && (
          <Flashcards learn={learn} onUpdate={setLearn} onExit={() => setFlashOpen(false)} onOpenMuscle={(id) => { setFlashOpen(false); reviewFromQuiz(id); }} />
        )}
      </AtlasDialog>
      <AtlasDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="اختصارات لوحة المفاتيح">
        <ShortcutsHelp />
      </AtlasDialog>
      <AtlasDialog open={noteOpen && selected !== null} onClose={() => setNoteOpen(false)} title="ملاحظتي">
        {selected && noteOpen && (
          <NoteForm key={selected.id} initial={learn.notes[selected.id] ?? ''} title={selected.en} onSave={saveNote} onCancel={() => setNoteOpen(false)} />
        )}
      </AtlasDialog>
      <OnboardingTour />
    </div>
  );
}

export default function FaceAtlas() {
  return (
    <ToastProvider>
      <FaceAtlasInner />
    </ToastProvider>
  );
}
