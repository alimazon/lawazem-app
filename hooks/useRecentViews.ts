// hooks/useRecentViews.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lawazem_recent_views';
const MAX_ITEMS = 6;

export interface RecentView {
  id: string;
  title: string;
  subject_name: string;
  file_path: string;
  viewed_at: number;
}

export function useRecentViews() {
  const [recent, setRecent] = useState<RecentView[]>([]);
  const [mounted, setMounted] = useState(false);

  // ===== تحميل المحفوظ =====
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

  // ===== إضافة زيارة جديدة =====
  const addView = useCallback(
    (view: Omit<RecentView, 'viewed_at'>) => {
      setRecent((prev) => {
        // إزالة الزيارة احاليابقة لنفس الملزمة (لتحديث وقتها)
        const filtered = prev.filter((v) => v.id !== view.id);
        // إضافة في المقدمة + تحديد الحد الأقصى
        const next = [
          { ...view, viewed_at: Date.now() },
          ...filtered,
        ].slice(0, MAX_ITEMS);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          /* تجاهل */
        }
        return next;
      });
    },
    []
  );

  // ===== مسح الكل =====
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

// ===== تنسيق الوقت النسبي =====
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