'use client';

// lib/hooks/useLocalState.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { readRaw, subscribeRaw, writeRaw } from '@/lib/storage';

/**
 * حالة محفوظة في localStorage. القراءة بعد التركيب (آمنة مع SSR).
 * الكتابة تتم خارج دالة التحديث حتى لا تتكرر في StrictMode.
 */
export function useLocalState<T>(key: string, initial: T, version = 1): [T, (next: T | ((prev: T) => T)) => void] {
  const initRef = useRef(initial);
  const valueRef = useRef<T>(initial);
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    const load = (): void => {
      const v = readRaw(key, initRef.current, version);
      valueRef.current = v;
      setValue(v);
    };
    load();
    return subscribeRaw(key, load);
  }, [key, version]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(valueRef.current) : next;
      valueRef.current = resolved;
      setValue(resolved);
      writeRaw(key, resolved, version);
    },
    [key, version],
  );

  return [value, set];
}
