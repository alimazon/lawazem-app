// hooks/useStudyStats.ts
'use client';

import { useEffect, useState } from 'react';
import { loadStats, type StudyStats, emptyStats } from './useRecentViews';

export interface SubjectRank {
  name: string;
  views: number;
  lastViewed: number;
  daysSince: number;
}

export interface StudyAnalysis {
  stats: StudyStats;
  // ملخص
  totalViews: number;
  daysActive: number;
  currentStreak: number;
  // مواد
  topSubjects: SubjectRank[];
  weakSubjects: SubjectRank[];
  // أنماط
  bestHour: number | null; // 0-23
  weeklyActivity: { day: string; count: number }[]; // 7 أيام (الأحدث أخيراً)
  // شارات
  badges: { emoji: string; label: string }[];
}

const WEEK_DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function daysBetween(a: number, b: number): number {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

function computeStreak(daily: Record<string, number>): number {
  let streak = 0;
  const d = new Date();
  // إذا ما فيه نشاط اليوم، لا تكسر الستريك — ابدأ من أمس
  if (!daily[toDateStr(d)]) {
    d.setDate(d.getDate() - 1);
  }
  for (let i = 0; i < 365; i++) {
    const key = toDateStr(d);
    if (daily[key] && daily[key] > 0) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function analyze(stats: StudyStats): StudyAnalysis {
  const now = Date.now();

  // ===== المواد =====
  const subjects: SubjectRank[] = Object.entries(stats.subjects).map(
    ([name, s]) => ({
      name,
      views: s.views,
      lastViewed: s.lastViewed,
      daysSince: daysBetween(s.lastViewed, now),
    })
  );

  const topSubjects = [...subjects]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  const weakSubjects = subjects
    .filter((s) => s.daysSince >= 7)
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 3);

  // ===== الساعات =====
  let bestHour: number | null = null;
  let maxHour = 0;
  stats.hourly.forEach((v, i) => {
    if (v > maxHour) {
      maxHour = v;
      bestHour = i;
    }
  });
  if (maxHour === 0) bestHour = null;

  // ===== آخر 7 أيام =====
  const weeklyActivity: { day: string; count: number }[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 6); // قبل 6 أيام = الأقدم
  for (let i = 0; i < 7; i++) {
    const key = toDateStr(d);
    weeklyActivity.push({
      day: WEEK_DAYS_AR[d.getDay()],
      count: stats.daily[key] ?? 0,
    });
    d.setDate(d.getDate() + 1);
  }

  // ===== الشارات =====
  const daysActive = Object.keys(stats.daily).filter(
    (k) => (stats.daily[k] ?? 0) > 0
  ).length;

  const currentStreak = computeStreak(stats.daily);

  const badges: { emoji: string; label: string }[] = [];
  if (stats.totalViews >= 1) badges.push({ emoji: '🌱', label: 'بداية الرحلة' });
  if (stats.totalViews >= 10) badges.push({ emoji: '📚', label: '10 فتحات' });
  if (stats.totalViews >= 50) badges.push({ emoji: '💪', label: '50 فتحة' });
  if (stats.totalViews >= 100) badges.push({ emoji: '🏆', label: '100 فتحة' });
  if (currentStreak >= 3) badges.push({ emoji: '🔥', label: `${currentStreak} أيام متتالية` });
  if (currentStreak >= 7) badges.push({ emoji: '⚡', label: 'أسبوع كامل' });
  if (topSubjects.length >= 3) badges.push({ emoji: '🎯', label: '3 مواد نشطة' });
  if (daysActive >= 7) badges.push({ emoji: '📅', label: 'أسبوع نشط' });

  return {
    stats,
    totalViews: stats.totalViews,
    daysActive,
    currentStreak,
    topSubjects,
    weakSubjects,
    bestHour,
    weeklyActivity,
    badges,
  };
}

export function useStudyStats(): { analysis: StudyAnalysis; mounted: boolean; reset: () => void } {
  const [analysis, setAnalysis] = useState<StudyAnalysis>(() => analyze(emptyStats()));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAnalysis(analyze(loadStats()));
    setMounted(true);
  }, []);

  function reset() {
    try {
      localStorage.removeItem('lawazem_study_stats');
    } catch {
      /* تجاهل */
    }
    setAnalysis(analyze(emptyStats()));
  }

  return { analysis, mounted, reset };
}

// ==================== Helpers للعرض ====================
export function formatHour(h: number): string {
  const period =
    h >= 5 && h < 12 ? 'صباحاً' : h >= 12 && h < 17 ? 'ظهراً' : h >= 17 && h < 22 ? 'مساءً' : 'ليلاً';
  const hour12 = h % 12 || 12;
  return `${hour12} ${period}`;
}