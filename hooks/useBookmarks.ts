// hooks/useBookmarks.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lawazem_bookmarked_notes';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // ===== تحميل المحفوظ =====
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBookmarks(parsed.filter((id): id is string => typeof id === 'string'));
        }
      }
    } catch {
      /* تجاهل الأخطاء */
    }
    setMounted(true);
  }, []);

  // ===== تبديل حالة الحفظ =====
  const toggle = useCallback((noteId: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* قد تكون المساحة ممتلئة */
      }
      return next;
    });
  }, []);

  // ===== التحقق =====
  const isBookmarked = useCallback(
    (noteId: string) => bookmarks.includes(noteId),
    [bookmarks]
  );

  // ===== مسح الكل =====
  const clearAll = useCallback(() => {
    setBookmarks([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* تجاهل */
    }
  }, []);

  return {
    bookmarks,
    toggle,
    isBookmarked,
    clearAll,
    mounted,
    count: bookmarks.length,
  };
}