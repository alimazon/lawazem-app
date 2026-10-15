// app/study-session/page.tsx
'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { TimerRing } from './_components/TimerRing';
import { SoundPicker } from './_components/SoundPicker';
import { HealthTab } from './_components/HealthTab';
import { ALERT_SOUND, findSound } from '@/lib/study-sounds';
import { recordFocusSession, getTodayStr } from '@/hooks/useRecentViews';
import {
  IconArrowLeft,
  IconClose,
  IconExpand,
  IconHealth,
  IconPlay,
  IconSun,
  IconMoon,
} from '@/components/ui/Icons';

// ==================== Constants ====================
const CONFIG_KEY = 'lawazem_focus_config_v1';
const TODAY_KEY = 'lawazem_focus_today_v1';

interface Preset {
  id: string;
  label: string;
  hint: string;
  study: number;
  breakMin: number;
  sessions: number;
}

const PRESETS: readonly Preset[] = [
  { id: 'classic', label: '25 / 5', hint: 'كلاسيكي', study: 25, breakMin: 5, sessions: 4 },
  { id: 'long', label: '50 / 10', hint: 'مطوّل', study: 50, breakMin: 10, sessions: 3 },
  { id: 'deep', label: '90 / 15', hint: 'عميق', study: 90, breakMin: 15, sessions: 2 },
] as const;

const TIPS: readonly string[] = [
  'ضع هاتفك بعيداً عن متناول يدك — ربع ساعة بلا إشعارات تصنع فرقاً.',
  'اكتب هدف الجلسة قبل أن تبدأ؛ الهدف الواضح يختصر نصف الطريق.',
  'في الراحة قم وتمدّد واشرب ماءً — ولا تنتقل إلى شاشة أخرى.',
  'المراجعة الموزّعة أنفع من الحشو الليلي — كرّر قليلاً كل يوم.',
  'ابدأ بالمادة الأصعب في وقت ذروتك، واترك الأخف لنهاية اليوم.',
];

type Status = 'idle' | 'running' | 'paused';
type Phase = 'study' | 'break';
type Tab = 'timer' | 'health';

// ==================== Helpers ====================
function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(v)));
}

function fmtTitle(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function readToday(): number {
  try {
    const raw = localStorage.getItem(TODAY_KEY);
    if (!raw) return 0;
    const p = JSON.parse(raw) as { d?: unknown; n?: unknown };
    return p.d === getTodayStr() && typeof p.n === 'number' ? p.n : 0;
  } catch {
    return 0;
  }
}

function writeToday(n: number): void {
  try {
    localStorage.setItem(TODAY_KEY, JSON.stringify({ d: getTodayStr(), n }));
  } catch {
    /* ignore */
  }
}

// ==================== Inline Icons ====================
function IconPause() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
function IconRestart() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}
function IconTimer() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="13" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4l3 2M9 2h6" />
    </svg>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-[4px] border border-line bg-paper-deep px-1.5 py-0.5 font-mono text-[10px] text-ink-soft">
      {children}
    </kbd>
  );
}

// ==================== Sound Loading Timeout (ms) ====================
const SOUND_LOAD_TIMEOUT_MS = 45_000; // 45 ثانية للملفات الكبيرة جداً

// ==================== Page ====================
export default function StudySessionPage() {
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();

  const [tab, setTab] = useState<Tab>('timer');
  const [focusMode, setFocusMode] = useState(false);

  // Config
  const [studyMin, setStudyMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [totalSessions, setTotalSessions] = useState(4);
  const [task, setTask] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Runtime
  const [status, setStatus] = useState<Status>('idle');
  const [phase, setPhase] = useState<Phase>('study');
  const [sessionIndex, setSessionIndex] = useState(0);
  const [remaining, setRemaining] = useState(25 * 60);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  // Today / tips
  const [todayCount, setTodayCount] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  // Audio
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [soundLoading, setSoundLoading] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);

  // Refs للتحكم بالمؤقّتات والـhandlers
  const soundLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundCleanupRef = useRef<(() => void) | null>(null);

  // ===== Hydrate config =====
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const c = JSON.parse(raw) as Partial<{
          studyMin: number;
          breakMin: number;
          totalSessions: number;
          task: string;
        }>;
        if (typeof c.studyMin === 'number') setStudyMin(clampInt(c.studyMin, 1, 180));
        if (typeof c.breakMin === 'number') setBreakMin(clampInt(c.breakMin, 1, 60));
        if (typeof c.totalSessions === 'number') setTotalSessions(clampInt(c.totalSessions, 1, 10));
        if (typeof c.task === 'string') setTask(c.task.slice(0, 80));
      }
    } catch {
      /* ignore */
    }
    setTodayCount(readToday());
    const dayOfYear = Math.floor(Date.now() / 86_400_000);
    setTipIdx(dayOfYear % TIPS.length);
    setHydrated(true);
  }, []);

  // ===== Persist config =====
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify({ studyMin, breakMin, totalSessions, task }),
      );
    } catch {
      /* ignore */
    }
  }, [hydrated, studyMin, breakMin, totalSessions, task]);

  // ===== Sync remaining with studyMin when idle =====
  useEffect(() => {
    if (status === 'idle') setRemaining(studyMin * 60);
  }, [studyMin, status]);

  // ===== Setup alert audio =====
  useEffect(() => {
    const audio = new Audio(ALERT_SOUND);
    audio.volume = 0.6;
    audio.preload = 'auto';
    alertAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // ===== Cleanup sound on unmount =====
  useEffect(() => {
    return () => {
      if (soundLoadTimeoutRef.current) {
        clearTimeout(soundLoadTimeoutRef.current);
      }
      if (soundCleanupRef.current) {
        soundCleanupRef.current();
      }
    };
  }, []);

  // ===== Celebrate auto-clear =====
  useEffect(() => {
    if (!celebrate) return;
    const id = setTimeout(() => setCelebrate(false), 8000);
    return () => clearTimeout(id);
  }, [celebrate]);

  // ===== Document title =====
  const baseTitleRef = useRef('');
  useEffect(() => {
    baseTitleRef.current = document.title;
    return () => {
      document.title = baseTitleRef.current;
    };
  }, []);
  useEffect(() => {
    if (status === 'running') {
      document.title = `${fmtTitle(remaining)} · ${phase === 'study' ? 'تركيز' : 'راحة'}`;
    } else {
      document.title = baseTitleRef.current;
    }
  }, [status, remaining, phase]);

  // ===== Wake Lock =====
  useEffect(() => {
    if (status !== 'running') return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let cancelled = false;
    const holder: { sentinel: WakeLockSentinel | null } = { sentinel: null };

    const acquire = async () => {
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void s.release().catch(() => {});
          return;
        }
        holder.sentinel = s;
      } catch {
        /* غير مدعوم أو مرفوض */
      }
    };

    const onVisibility = () => {
      if (
        document.visibilityState === 'visible' &&
        (!holder.sentinel || holder.sentinel.released)
      ) {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void holder.sentinel?.release().catch(() => {});
    };
  }, [status]);

  // ===== Phase transition handler =====
  const handlePhaseComplete = useCallback(() => {
    const alert = alertAudioRef.current;
    if (alert) {
      alert.currentTime = 0;
      void alert.play().catch(() => {});
    }

    if (phase === 'study') {
      recordFocusSession(studyMin);
      const n = readToday() + 1;
      writeToday(n);
      setTodayCount(n);

      const nextIndex = sessionIndex + 1;
      if (nextIndex >= totalSessions) {
        setStatus('idle');
        setPhase('study');
        setSessionIndex(0);
        setRemaining(studyMin * 60);
        setDeadline(null);
        setCelebrate(true);
        toast.show(
          `🎉 أنجزت ${totalSessions} جلسات = ${totalSessions * studyMin} دقيقة!`,
          'success',
        );
        return;
      }
      setPhase('break');
      setSessionIndex(nextIndex);
      setRemaining(breakMin * 60);
      setDeadline(Date.now() + breakMin * 60 * 1000);
      toast.show(`☕ راحة ${breakMin} دقائق`, 'info');
    } else {
      setPhase('study');
      setRemaining(studyMin * 60);
      setDeadline(Date.now() + studyMin * 60 * 1000);
      toast.show(`🎯 لنبدأ الجلسة ${sessionIndex + 1}`, 'info');
    }
  }, [phase, sessionIndex, totalSessions, studyMin, breakMin, toast]);

  const handlerRef = useRef(handlePhaseComplete);
  useEffect(() => {
    handlerRef.current = handlePhaseComplete;
  }, [handlePhaseComplete]);

  // ===== Timer interval =====
  useEffect(() => {
    if (status !== 'running' || deadline === null) return;
    let cancelled = false;
    const id = setInterval(() => {
      if (cancelled) return;
      const rem = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (rem <= 0) {
        cancelled = true;
        clearInterval(id);
        handlerRef.current();
        return;
      }
      setRemaining(rem);
    }, 250);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [status, deadline]);

  // ===== Controls =====
  const handleStart = useCallback(() => {
    const alert = alertAudioRef.current;
    if (alert) {
      const v = alert.volume;
      alert.volume = 0;
      void alert
        .play()
        .then(() => {
          alert.pause();
          alert.currentTime = 0;
          alert.volume = v;
        })
        .catch(() => {
          alert.volume = v;
        });
    }

    setCelebrate(false);

    if (status === 'idle') {
      setPhase('study');
      setSessionIndex(0);
      setRemaining(studyMin * 60);
      setDeadline(Date.now() + studyMin * 60 * 1000);
      setStatus('running');
    } else if (status === 'paused') {
      setDeadline(Date.now() + remaining * 1000);
      setStatus('running');
    }
  }, [status, studyMin, remaining]);

  const handlePause = useCallback(() => {
    if (status !== 'running') return;
    setStatus('paused');
    setDeadline(null);
  }, [status]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setPhase('study');
    setSessionIndex(0);
    setRemaining(studyMin * 60);
    setDeadline(null);
    setCelebrate(false);
  }, [studyMin]);

  const handleToggle = useCallback(() => {
    if (status === 'running') handlePause();
    else handleStart();
  }, [status, handlePause, handleStart]);

  // ===== Keyboard shortcuts =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
        return;
      }
      if (tab !== 'timer') return;

      if (e.code === 'Space') {
        if (tag === 'BUTTON') return;
        e.preventDefault();
        handleToggle();
      } else if (e.code === 'KeyR') {
        if (status !== 'idle') handleReset();
      } else if (e.code === 'KeyF') {
        setFocusMode((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, focusMode, status, handleToggle, handleReset]);

  // ========================================================================
  // 🔊 Sound Handling (مع دعم الملفات الكبيرة)
  // ========================================================================
  /**
   * يوقف أي تحميل جاري، ويلغي المؤقّتات والـlisteners.
   * يُستدعى قبل تشغيل صوت جديد، أو عند unmount.
   */
  const clearSoundLoad = useCallback(() => {
    if (soundLoadTimeoutRef.current) {
      clearTimeout(soundLoadTimeoutRef.current);
      soundLoadTimeoutRef.current = null;
    }
    if (soundCleanupRef.current) {
      soundCleanupRef.current();
      soundCleanupRef.current = null;
    }
  }, []);

  /**
   * يعطي وصفاً مقروءاً لكود الخطأ في HTMLAudioElement.
   */
  const describeMediaError = useCallback((err: MediaError | null): string => {
    if (!err) return 'تعذّر تشغيل الصوت';
    switch (err.code) {
      case 1:
        return 'تم إلغاء التحميل';
      case 2:
        return 'خطأ في الشبكة — تحقق من اتصالك';
      case 3:
        return 'الملف تالف أو ناقص';
      case 4:
        return 'صيغة الملف غير مدعومة في متصفحك';
      default:
        return 'تعذّر تشغيل الصوت';
    }
  }, []);

  const handleSoundSelect = useCallback(
    (id: string | null) => {
      const audio = ambientAudioRef.current;
      if (!audio) return;

      // أوقف أي صوت حالي + امسح أي تحميل معلّق
      clearSoundLoad();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();

      // إلغاء الاختيار
      if (id === null || id === selectedSound) {
        setSelectedSound(null);
        setSoundLoading(null);
        return;
      }

      const sound = findSound(id);
      if (!sound) return;

      // ضع الصوت في حالة تحميل
      setSoundLoading(id);

      // ═══ معالجات الأحداث ═══
      const handleError = () => {
        const msg = describeMediaError(audio.error);
        console.error('[sound] error:', audio.error, sound.source);
        toast.show(`${msg}: ${sound.label}`, 'error');
        clearSoundLoad();
        audio.removeAttribute('src');
        audio.load();
        setSelectedSound(null);
        setSoundLoading(null);
      };

      const handleCanPlay = () => {
        // الصوت جاهز للتشغيل — شغّله
        clearSoundLoad();
        audio.loop = sound.loop;
        audio.volume = volume;
        void audio
          .play()
          .then(() => {
            setSelectedSound(id);
            setSoundLoading(null);
          })
          .catch((playErr: unknown) => {
            console.error('[sound] play failed:', playErr, sound.source);
            const msg =
              playErr instanceof DOMException && playErr.name === 'NotAllowedError'
                ? 'المتصفح منع التشغيل — اضغط على الصفحة أولاً ثم أعد المحاولة'
                : 'تعذّر تشغيل الصوت';
            toast.show(msg, 'error');
            setSelectedSound(null);
            setSoundLoading(null);
          });
      };

      audio.addEventListener('error', handleError);
      audio.addEventListener('canplay', handleCanPlay);

      // خزّن دالة التنظيف
      soundCleanupRef.current = () => {
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('canplay', handleCanPlay);
      };

      // ═══ ابدأ التحميل ═══
      audio.preload = 'auto';
      audio.src = sound.source;
      audio.load();

      // ═══ Timeout احتياطي للملفات الضخمة ═══
      soundLoadTimeoutRef.current = setTimeout(() => {
        // إذا الصوت بدأ يشتغل، تجاهل
        if (!audio.paused && audio.readyState >= 2) return;
        console.error('[sound] load timeout:', sound.source);
        toast.show(
          `انتهت مهلة التحميل لـ«${sound.label}» — الملف ضخم، جرّب مرة ثانية`,
          'error',
        );
        clearSoundLoad();
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        setSelectedSound(null);
        setSoundLoading(null);
      }, SOUND_LOAD_TIMEOUT_MS);
    },
    [selectedSound, volume, toast, clearSoundLoad, describeMediaError],
  );

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = v;
    }
  }, []);

  // ===== Derived =====
  const activePreset =
    PRESETS.find(
      (p) =>
        p.study === studyMin &&
        p.breakMin === breakMin &&
        p.sessions === totalSessions,
    )?.id ?? null;

  const totalForPhase = phase === 'study' ? studyMin * 60 : breakMin * 60;
  const progress = totalForPhase > 0 ? 1 - remaining / totalForPhase : 0;
  const isBreakActive = phase === 'break' && status !== 'idle';
  const warning = status === 'running' && remaining <= 60 && remaining > 0;

  const emptyMessage =
    todayCount === 0
      ? 'لسا ما بدأت اليوم — جلسة واحدة تكفي لتفتح الطريق.'
      : `أنجزت ${todayCount} ${todayCount === 1 ? 'جلسة' : 'جلسات'} اليوم — استمر بهذا الإيقاع.`;

  const shellClass = focusMode
    ? 'campus-paper fixed inset-0 z-[60] overflow-y-auto'
    : 'campus-paper relative min-h-[calc(100dvh-var(--nav-h))] pb-24 md:pb-10';

  return (
    <main className={shellClass}>
      {/* ظلّ الراحة */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 transition-opacity duration-[1600ms] motion-reduce:transition-none"
        style={{
          opacity: isBreakActive ? 1 : 0,
          background:
            'radial-gradient(ellipse 80% 55% at 50% 35%, color-mix(in srgb, var(--gold) 9%, transparent), transparent 75%)',
        }}
      />

      {/* خروج من الوضع الغامر */}
      {focusMode && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          aria-label="الخروج من الوضع الغامر"
          className="fixed end-4 top-4 z-[70] flex h-10 w-10 items-center justify-center rounded-field border border-line bg-paper-soft text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          <IconClose aria-hidden="true" className="h-4 w-4" />
        </button>
      )}

      <div
        className={`relative mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 ${
          focusMode ? 'flex min-h-full flex-col justify-center' : ''
        }`}
      >
        {!focusMode && (
          <>
            {/* Header */}
            <header className="flex items-center justify-between gap-3">
              <Link
                href="/"
                className="group inline-flex items-center gap-1.5 rounded-field text-sm font-semibold text-teal transition-colors hover:text-teal-hover motion-reduce:transition-none"
              >
                <span className="transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                  <IconArrowLeft aria-hidden="true" className="h-4 w-4" />
                </span>
                رجوع إلى لوحة الأقسام
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
                className="flex h-10 w-10 items-center justify-center rounded-field border border-line bg-paper-soft text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                {theme === 'dark' ? (
                  <IconSun aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <IconMoon aria-hidden="true" className="h-4 w-4" />
                )}
              </button>
            </header>

            {/* Title */}
            <div className="mt-6 animate-slide-up motion-reduce:animate-none">
              <span className="stage-badge">مساحة التركيز</span>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
                جلسة دراسة
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
                نظّم وقتك بجلسات تركيز وراحة. اختر صوت خلفية هادئ، وتابع تقدمك في
                صحتك الدراسية.
              </p>
            </div>

            {/* Tabs */}
            <div
              role="tablist"
              aria-label="أقسام جلسة الدراسة"
              className="mt-6 flex gap-1.5 rounded-2xl border border-line bg-white/60 p-1.5 backdrop-blur-sm dark:bg-white/[0.04] animate-slide-up motion-reduce:animate-none"
            >
              <button
                role="tab"
                aria-selected={tab === 'timer'}
                onClick={() => setTab('timer')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 motion-reduce:transition-none ${
                  tab === 'timer'
                    ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]'
                    : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <IconTimer />
                <span>المؤقت</span>
                {status === 'running' && (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none"
                  />
                )}
              </button>
              <button
                role="tab"
                aria-selected={tab === 'health'}
                onClick={() => setTab('health')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 motion-reduce:transition-none ${
                  tab === 'health'
                    ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]'
                    : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <IconHealth aria-hidden="true" className="h-4 w-4" />
                <span>صحتك الدراسية</span>
              </button>
            </div>
          </>
        )}

        {/* Tab Content */}
        <div className={focusMode ? '' : 'mt-6'}>
          {/* ─── Timer Tab ─── */}
          <div hidden={tab !== 'timer'}>
            <div
              className={`grid gap-6 ${
                focusMode ? 'mx-auto w-full max-w-xl' : 'lg:grid-cols-[1fr_320px]'
              }`}
            >
              <section
                className={
                  focusMode
                    ? 'p-2 sm:p-4'
                    : 'card-editorial paper-texture ink-reveal p-5 sm:p-8'
                }
                style={{ '--i': 0 } as CSSProperties}
              >
                {/* شريط علوي */}
                {!focusMode && (
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="badge badge-teal">
                      <span aria-hidden="true">🎯</span>
                      اليوم:
                      <span className="num-inline font-mono font-bold">
                        {todayCount}
                      </span>
                      {todayCount === 1 ? 'جلسة' : 'جلسات'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFocusMode(true)}
                      aria-label="الوضع الغامر"
                      title="الوضع الغامر (F)"
                      className="inline-flex h-9 items-center gap-1.5 rounded-field border border-line bg-paper-soft px-3 text-xs font-bold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                    >
                      <IconExpand aria-hidden="true" className="h-3.5 w-3.5" />
                      <span>وضع غامر</span>
                    </button>
                  </div>
                )}

                {/* مهمة الجلسة */}
                {focusMode ? (
                  task.trim() && (
                    <p className="margin-mark mx-auto mb-4 max-w-sm text-center text-sm font-semibold text-ink-soft">
                      {task}
                    </p>
                  )
                ) : (
                  <div className="mb-6">
                    <label htmlFor="session-task" className="sr-only">
                      مهمة الجلسة
                    </label>
                    <input
                      id="session-task"
                      type="text"
                      value={task}
                      maxLength={80}
                      onChange={(e) => setTask(e.target.value)}
                      placeholder="ماذا ستدرس الآن؟ مثال: فسلجة — المحاضرة 3"
                      className="field-editorial text-center"
                    />
                  </div>
                )}

                <TimerRing
                  progress={celebrate ? 1 : progress}
                  remainingSeconds={remaining}
                  phase={phase}
                  status={status}
                  sessionIndex={sessionIndex}
                  totalSessions={totalSessions}
                  endsAt={status === 'running' ? deadline : null}
                  warning={warning}
                  celebrate={celebrate}
                />

                {/* رسالة دافئة */}
                {status === 'idle' && !celebrate && (
                  <div className="mx-auto mt-6 max-w-sm text-center">
                    <p className="text-sm font-semibold text-ink-soft">
                      {emptyMessage}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                      {TIPS[tipIdx]}
                    </p>
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {status !== 'running' ? (
                    <Button
                      size="lg"
                      onClick={handleStart}
                      className="w-full sm:w-auto sm:min-w-44"
                      icon={<IconPlay aria-hidden="true" className="h-4 w-4" />}
                    >
                      {status === 'paused' ? 'متابعة' : 'بدء الجلسة'}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handlePause}
                      className="w-full sm:w-auto sm:min-w-44"
                      icon={<IconPause />}
                    >
                      إيقاف مؤقت
                    </Button>
                  )}
                  {status !== 'idle' && (
                    <Button
                      size="lg"
                      variant="ghost"
                      onClick={handleReset}
                      className="w-full sm:w-auto"
                      icon={<IconRestart />}
                    >
                      إعادة
                    </Button>
                  )}
                </div>

                {/* اختصارات */}
                <p className="mt-5 hidden items-center justify-center gap-3 text-[11px] text-ink-muted md:flex">
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>Space</Kbd> بدء / إيقاف
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>R</Kbd> إعادة
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>F</Kbd> وضع غامر
                  </span>
                </p>
              </section>

              <aside className={focusMode ? 'hidden' : 'space-y-4'}>
                {/* Presets */}
                <div
                  className="card-editorial ink-reveal p-5"
                  style={{ '--i': 1 } as CSSProperties}
                >
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                    <span aria-hidden="true">⏱️</span>
                    إعدادات الجلسة
                  </h2>

                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((p) => {
                      const active = activePreset === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setStudyMin(p.study);
                            setBreakMin(p.breakMin);
                            setTotalSessions(p.sessions);
                          }}
                          disabled={status === 'running'}
                          aria-pressed={active}
                          className={`rounded-field border px-2 py-3 text-center text-xs font-bold transition-all duration-200 motion-reduce:transition-none disabled:opacity-50 ${
                            active
                              ? 'border-teal bg-teal-tint text-teal'
                              : 'border-line bg-paper-soft text-ink-soft hover:border-teal/40'
                          }`}
                        >
                          <p className="num-inline font-mono text-sm leading-none">
                            {p.label}
                          </p>
                          <p className="mt-1 text-[10px] opacity-70">{p.hint}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-4">
                    <span className="text-xs font-bold text-ink-muted">
                      عدد الجلسات
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTotalSessions((s) => Math.max(1, s - 1))
                        }
                        disabled={status === 'running' || totalSessions <= 1}
                        aria-label="تقليل"
                        className="flex h-8 w-8 items-center justify-center rounded-field border border-line bg-paper-soft text-lg font-bold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="num-inline min-w-[2ch] text-center font-mono text-base font-bold text-ink">
                        {totalSessions}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTotalSessions((s) => Math.min(10, s + 1))
                        }
                        disabled={status === 'running' || totalSessions >= 10}
                        aria-label="زيادة"
                        className="flex h-8 w-8 items-center justify-center rounded-field border border-line bg-paper-soft text-lg font-bold text-ink-soft transition-colors hover:border-teal/40 hover:text-teal disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sound */}
                <div
                  className="card-editorial ink-reveal p-5"
                  style={{ '--i': 2 } as CSSProperties}
                >
                  <SoundPicker
                    selectedId={selectedSound}
                    loadingId={soundLoading}
                    onSelect={handleSoundSelect}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                  />
                </div>
              </aside>
            </div>
          </div>

          {/* ─── Health Tab ─── */}
          <div hidden={tab !== 'health'}>
            <HealthTab onGoToTimer={() => setTab('timer')} />
          </div>
        </div>
      </div>

      {/* Ambient audio element */}
      <audio ref={ambientAudioRef} preload="none" />
    </main>
  );
}