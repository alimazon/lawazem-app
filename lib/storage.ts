// lib/storage.ts
/** تخزين محلي آمن: يتحمّل الوضع الخاص، امتلاء الحصة، وSSR. يدعم الاشتراك بين التبويبات. */

interface Entry<T> {
  version: number;
  data: T;
}

const PREFIX = 'lawazem:';
const EVENT = 'lawazem:storage';

function ok(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function readRaw<T>(key: string, fallback: T, version = 1): T {
  if (!ok()) return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
      return parsed.version === version ? parsed.data : fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeRaw<T>(key: string, value: T, version = 1): void {
  if (!ok()) return;
  try {
    const entry: Entry<T> = { version, data: value };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
  } catch {
    /* الحصة ممتلئة أو التخزين معطّل */
  }
}

export function subscribeRaw(key: string, cb: () => void): () => void {
  if (!ok()) return () => {};
  const onStorage = (e: StorageEvent): void => {
    if (e.key === PREFIX + key) cb();
  };
  const onLocal = (e: Event): void => {
    if ((e as CustomEvent<{ key: string }>).detail?.key === key) cb();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(EVENT, onLocal);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(EVENT, onLocal);
  };
}
