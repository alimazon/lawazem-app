// app/study-session/_components/TimerRing.tsx
'use client';

interface TimerRingProps {
  /** 0 إلى 1 — تقدم الوقت المنقضي */
  progress: number;
  remainingSeconds: number;
  phase: 'study' | 'break';
  status: 'idle' | 'running' | 'paused';
  sessionIndex: number;
  totalSessions: number;
  /** توقيت انتهاء المرحلة الحالية (ms) — null عند عدم التشغيل */
  endsAt: number | null;
  /** آخر دقيقة */
  warning: boolean;
  /** اكتملت كل الجلسات للتو */
  celebrate: boolean;
}

// ==================== Geometry ====================
const SIZE = 300;
const C = SIZE / 2;
const ARC_R = 116;
const ARC_STROKE = 5;
const CIRCUMFERENCE = 2 * Math.PI * ARC_R;
const TICK_COUNT = 60;

interface Tick {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  major: boolean;
}

// تُحسب مرة واحدة — toFixed لضمان تطابق الخادم والعميل
const TICKS: readonly Tick[] = Array.from({ length: TICK_COUNT }, (_, i) => {
  const a = (i / TICK_COUNT) * 2 * Math.PI;
  const major = i % 5 === 0;
  const r1 = major ? 129 : 135;
  const r2 = 143;
  return {
    x1: (C + r1 * Math.cos(a)).toFixed(2),
    y1: (C + r1 * Math.sin(a)).toFixed(2),
    x2: (C + r2 * Math.cos(a)).toFixed(2),
    y2: (C + r2 * Math.sin(a)).toFixed(2),
    major,
  };
});

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function clockParts(ts: number): { time: string; period: string } {
  const d = new Date(ts);
  const h = d.getHours();
  return {
    time: `${h % 12 || 12}:${pad(d.getMinutes())}`,
    period: h >= 12 ? 'م' : 'ص',
  };
}

export function TimerRing({
  progress,
  remainingSeconds,
  phase,
  status,
  sessionIndex,
  totalSessions,
  endsAt,
  warning,
  celebrate,
}: TimerRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const dashOffset = CIRCUMFERENCE * (1 - clamped);
  const litTicks = Math.floor(clamped * TICK_COUNT);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const isStudy = phase === 'study';
  const isRunning = status === 'running';
  const breathing = !isStudy && isRunning;
  const ringColor = isStudy || celebrate ? 'var(--teal)' : 'var(--gold)';

  // الانتقال الناعم فقط أثناء التشغيل — حتى لا يدور المؤشر للخلف عند الإعادة
  const smooth = isRunning
    ? 'stroke-dashoffset 400ms linear, stroke 300ms ease'
    : 'stroke 300ms ease';

  const statusText = celebrate
    ? '✓ اكتملت جلساتك'
    : status === 'idle'
      ? 'جاهز للبدء'
      : status === 'paused'
        ? 'متوقف مؤقتاً'
        : isStudy
          ? '🎯 وقت التركيز'
          : '☕ وقت الراحة';

  // أثناء الراحة: الجلسة المنتهية هي sessionIndex (وليس التالية)
  const currentSession = Math.min(
    isStudy ? sessionIndex + 1 : sessionIndex,
    totalSessions,
  );
  const end = endsAt !== null ? clockParts(endsAt) : null;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* مؤشر الجلسات */}
      <div
        className="flex items-center gap-1.5"
        role="img"
        aria-label={`الجلسة ${currentSession} من ${totalSessions}`}
      >
        {Array.from({ length: totalSessions }).map((_, i) => {
          const done = celebrate || i < sessionIndex;
          const current = !celebrate && isStudy && i === sessionIndex && status !== 'idle';
          return (
            <span
              key={i}
              aria-hidden="true"
              className={`h-2 w-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                done
                  ? 'bg-teal'
                  : current
                    ? 'bg-teal/60 ring-2 ring-teal/30'
                    : 'bg-line'
              }`}
            />
          );
        })}
      </div>

      {/* الدائرة */}
      <div
        className={`relative aspect-square w-full max-w-[320px] ${
          breathing ? 'ring-breathe' : ''
        }`}
      >
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute inset-0 h-full w-full -rotate-90"
          aria-hidden="true"
        >
          {/* هالة التنبيه — آخر دقيقة */}
          {warning && (
            <circle
              cx={C}
              cy={C}
              r={148}
              fill="none"
              stroke={ringColor}
              strokeWidth={1.5}
              className="ring-warn"
            />
          )}

          {/* هالة الاحتفال */}
          {celebrate && (
            <circle
              cx={C}
              cy={C}
              r={124}
              fill="none"
              stroke="var(--gold)"
              strokeWidth={1}
              className="ring-bloom"
              style={{ transformOrigin: 'center' }}
            />
          )}

          {/* علامات المينا — تضيء مع التقدم */}
          {TICKS.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={i < litTicks ? ringColor : 'var(--line-strong)'}
              strokeWidth={t.major ? 1.8 : 1}
              strokeLinecap="round"
              opacity={i < litTicks ? 1 : t.major ? 0.9 : 0.55}
              style={{ transition: 'stroke 300ms ease, opacity 300ms ease' }}
            />
          ))}

          {/* خط داخلي رفيع */}
          <circle
            cx={C}
            cy={C}
            r={103}
            fill="none"
            stroke="var(--line-soft)"
            strokeWidth={1}
          />

          {/* المسار */}
          <circle
            cx={C}
            cy={C}
            r={ARC_R}
            fill="none"
            stroke="var(--line)"
            strokeWidth={ARC_STROKE}
          />

          {/* القوس */}
          <circle
            cx={C}
            cy={C}
            r={ARC_R}
            fill="none"
            stroke={ringColor}
            strokeWidth={ARC_STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: smooth }}
          />

          {/* رأس يتحرك على القوس */}
          <g
            style={{
              transform: `rotate(${clamped * 360}deg)`,
              transformOrigin: `${C}px ${C}px`,
              transition: isRunning ? 'transform 400ms linear' : 'none',
            }}
          >
            <circle
              cx={C + ARC_R}
              cy={C}
              r={7}
              fill="var(--paper-soft)"
              stroke={ringColor}
              strokeWidth={2.5}
              style={{ transition: 'stroke 300ms ease' }}
            />
          </g>
        </svg>

        {/* المحتوى المركزي */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <p className="text-xs font-bold tracking-wide text-ink-muted">
            {statusText}
          </p>
          <p
            role="timer"
            dir="ltr"
            aria-label={`${minutes} دقيقة و ${seconds} ثانية`}
            className="font-mono text-5xl font-medium leading-none text-ink sm:text-6xl"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {pad(minutes)}
            <span className={isRunning ? 'ring-colon' : ''}>:</span>
            {pad(seconds)}
          </p>
          <p className="text-[11px] text-ink-muted">
            الجلسة{' '}
            <span className="num-inline font-mono">{currentSession}</span> من{' '}
            <span className="num-inline font-mono">{totalSessions}</span>
          </p>
          <p className="h-4 text-[11px] text-ink-muted">
            {end && (
              <>
                تنتهي الساعة{' '}
                <span className="num-inline font-mono">{end.time}</span>{' '}
                {end.period}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}