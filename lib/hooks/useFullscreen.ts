'use client';

// lib/hooks/useFullscreen.ts
/** ملء الشاشة مع دعم webkit (Safari) وكشف الدعم. */
import { useCallback, useEffect, useState } from 'react';

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};

export function useFullscreen<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const d = document as FsDocument;
    setSupported(Boolean(document.fullscreenEnabled || d.webkitFullscreenEnabled));
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const d = document as FsDocument;
    const onChange = (): void => {
      const cur = document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
      setIsFullscreen(cur !== null && cur === el);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, [el]);

  const enter = useCallback(async (): Promise<boolean> => {
    if (!el) return false;
    const target = el as FsElement;
    try {
      if (target.requestFullscreen) await target.requestFullscreen();
      else if (target.webkitRequestFullscreen) await target.webkitRequestFullscreen();
      else return false;
      return true;
    } catch {
      return false;
    }
  }, [el]);

  const exit = useCallback(async (): Promise<void> => {
    const d = document as FsDocument;
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
    } catch {
      /* تجاهل */
    }
  }, []);

  const toggle = useCallback((): Promise<boolean | void> => {
    return isFullscreen ? exit() : enter();
  }, [isFullscreen, enter, exit]);

  return { setRef: setEl, isFullscreen, supported, enter, exit, toggle };
}