// hooks/useBookmarks.ts
'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'lawazem_bookmarked_notes';

function readStored(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string');
    }
  } catch {
    /* تجاهل الأخطاء */
  }
  return [];
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // ===== تحميل المحفوظ =====
  useEffect(() => {
    setBookmarks(readStored());
    setMounted(true);
  }, []);

  // ===== تبديل حالة الحفظ =====
  // نقرأ من localStorage وقت الكتابة لأن كل نسخة من الـ hook تحمل state خاصة بها
  const toggle = useCallback((noteId: string) => {
    const prev = readStored();
    const next = prev.includes(noteId)
      ? prev.filter((id) => id !== noteId)
      : [...prev, noteId];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* قد تكون المساحة ممتلئة */
    }
    setBookmarks(next);
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