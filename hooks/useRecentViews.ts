// hooks/useRecentViews.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lawazem_recent_views';
const STATS_KEY = 'lawazem_study_stats';
const MAX_ITEMS = 6;

export interface RecentView {
  id: string;
  title: string;
  subject_name: string;
  file_path: string;
  viewed_at: number;
}

// ==================== Study Stats ====================
export interface SubjectStat {
  views: number;
  lastViewed: number;
}

export interface StudyStats {
  totalViews: number;
  firstVisit: number;
  subjects: Record<string, SubjectStat>;
  hourly: number[]; // 24 خانات
  daily: Record<string, number>; // "YYYY-MM-DD": عدد الزيارات
}

export function emptyStats(): StudyStats {
  return {
    totalViews: 0,
    firstVisit: Date.now(),
    subjects: {},
    hourly: Array(24).fill(0),
    daily: {},
  };
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function loadStats(): StudyStats {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (!saved) return emptyStats();
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') {
      return {
        totalViews: Number(parsed.totalViews) || 0,
        firstVisit: Number(parsed.firstVisit) || Date.now(),
        subjects:
          parsed.subjects && typeof parsed.subjects === 'object'
            ? parsed.subjects
            : {},
        hourly:
          Array.isArray(parsed.hourly) && parsed.hourly.length === 24
            ? parsed.hourly.map((n: unknown) => Number(n) || 0)
            : Array(24).fill(0),
        daily:
          parsed.daily && typeof parsed.daily === 'object' ? parsed.daily : {},
      };
    }
  } catch {
    /* تجاهل */
  }
  return emptyStats();
}

function saveStats(stats: StudyStats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* تجاهل */
  }
}

function recordStat(view: Omit<RecentView, 'viewed_at'>) {
  const stats = loadStats();
  const now = Date.now();
  const hour = new Date().getHours();
  const today = getTodayStr();

  stats.totalViews += 1;
  if (!stats.firstVisit) stats.firstVisit = now;

  // المادة
  const subj = stats.subjects[view.subject_name] ?? { views: 0, lastViewed: 0 };
  subj.views += 1;
  subj.lastViewed = now;
  stats.subjects[view.subject_name] = subj;

  // الساعة
  stats.hourly[hour] = (stats.hourly[hour] ?? 0) + 1;

  // اليوم
  stats.daily[today] = (stats.daily[today] ?? 0) + 1;

  saveStats(stats);
}

// ==================== Hook ====================
export function useRecentViews() {
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [mounted, setMounted] = useState(false);

  // تحميل المحفوظ
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecent(parsed);
        }
      }
    } catch {
      /* تجاهل */
    }
    setMounted(true);
  }, []);

  // إضافة زيارة جديدة
  const addView = useCallback((view: Omit<RecentView, 'viewed_at'>) => {
    // نقرأ من localStorage وقت الكتابة (كل نسخة hook لها state خاصة)
    let prev: RecentView[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) prev = parsed;
      }
    } catch {
      /* تجاهل */
    }

    const next: RecentView[] = [
      { ...view, viewed_at: Date.now() },
      ...prev.filter((v) => v.id !== view.id),
    ].slice(0, MAX_ITEMS);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* تجاهل */
    }
    setRecent(next);

    // سجّل الإحصائيات (fire and forget)
    try {
      recordStat(view);
    } catch {
      /* تجاهل */
    }
  }, []);

  // مسح الكل
  const clearAll = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* تجاهل */
    }
  }, []);

  return { recent, addView, clearAll, mounted };
}

// ==================== تنسيق الوقت النسبي ====================
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'الآن';
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  if (hours < 24) return `قبل ${hours} ساعة`;
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return 'منذ فترة';
}