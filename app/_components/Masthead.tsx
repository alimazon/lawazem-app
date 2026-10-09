// app/_components/Masthead.tsx
'use client';

import { useState } from 'react';
import type { Stage } from '@/lib/types';

// ==================== Date ====================
const DAYS = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const;

const MONTHS = [
  'كانون الثاني',
  'شباط',
  'آذار',
  'نيسان',
  'أيار',
  'حزيران',
  'تموز',
  'آب',
  'أيلول',
  'تشرين الأول',
  'تشرين الثاني',
  'كانون الأول',
] as const;

interface EditorialDate {
  weekday: string;
  day: number;
  month: string;
  year: number;
  iso: string;
}

function getEditorialDate(now: Date): EditorialDate {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const day = now.getDate();

  return {
    weekday: DAYS[now.getDay()] ?? '',
    day,
    month: MONTHS[monthIndex] ?? '',
    year,
    iso: `${year}-${pad(monthIndex + 1)}-${pad(day)}`,
  };
}

// ==================== Props ====================
interface MastheadProps {
  stage: Stage;
  onChangeStage: () => void;
}

// ==================== Component ====================
export function Masthead({ stage, onChangeStage }: MastheadProps) {
  const [today] = useState<EditorialDate>(() => getEditorialDate(new Date()));

  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line pb-4">
        {/* Start: date + stage */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <time
            dateTime={today.iso}
            className="flex items-baseline gap-1.5 text-ink"
          >
            <span className="text-xs font-medium text-ink-muted sm:text-sm">
              {today.weekday}
            </span>
            <span className="font-display text-base font-bold sm:text-lg">
              <span className="num-inline">{today.day}</span> {today.month}
            </span>
            <span className="num-inline hidden text-xs text-ink-muted sm:inline">
              {today.year}
            </span>
          </time>

          <span aria-hidden="true" className="text-gold">
            ◆
          </span>

          <span className="stage-badge">{stage}</span>
        </div>

        {/* End: change stage */}
        <button
          type="button"
          onClick={onChangeStage}
          aria-label={`تغيير المرحلة الدراسية، الحالية: ${stage}`}
          className="rounded-field px-3 py-2 text-xs font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          تغيير المرحلة
        </button>
      </div>
    </header>
  );
}