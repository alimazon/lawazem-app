// components/DailyCompanion.tsx
'use client';

import { useEffect, useState } from 'react';

// ==================== Time Helpers ====================
function getGreeting(): { emoji: string; text: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { emoji: '🌅', text: 'صباح الخير' };
  if (h >= 12 && h < 17) return { emoji: '☀️', text: 'نهارك سعيد' };
  if (h >= 17 && h < 22) return { emoji: '🌆', text: 'مساء الخير' };
  return { emoji: '🌙', text: 'ليلة هادئة' };
}

function getDayName(): string {
  const days = [
    'الأحد',
    'الاثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
  ];
  return days[new Date().getDay()];
}

function getTimeLabel(): string {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const period =
    h >= 5 && h < 12
      ? 'صباحاً'
      : h >= 12 && h < 17
        ? 'ظهراً'
        : h >= 17 && h < 21
          ? 'مساءً'
          : 'ليلاً';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// ==================== Skeleton ====================
function Skeleton() {
  return (
    <div className="card-subtle p-5">
      <div className="h-6 w-40 skeleton-shimmer" />
      <div className="mt-3 h-3 w-32 skeleton-shimmer" />
    </div>
  );
}

// ==================== Component ====================
export function DailyCompanion() {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (!mounted) return <Skeleton />;

  void tick;

  const greeting = getGreeting();
  const day = getDayName();
  const time = getTimeLabel();

  return (
    <div className="card-subtle p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="text-3xl leading-none"
          aria-hidden="true"
        >
          {greeting.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-extrabold leading-tight text-ink sm:text-2xl">
            {greeting.text}
          </h2>
          <p className="mt-1 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            {day} · {time}
          </p>
        </div>
      </div>
    </div>
  );
}