// components/PullToRefresh.tsx
'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  /** المسافة التي بعدها يُفعَّل التحديث */
  threshold?: number;
  /** أقصى انسحاب بصري */
  maxPull?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 70,
  maxPull = 130,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistanceState] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const pullDistanceRef = useRef(0);
  const stateRef = useRef({
    startY: 0,
    active: false,
    moved: false,
  });
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef(0);
  const refreshingRef = useRef(false);

  // === setters ===
  const setPullDistance = useCallback((distance: number) => {
    pullDistanceRef.current = distance;
    pendingRef.current = distance;
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setPullDistanceState(pendingRef.current);
    });
  }, []);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // === events ===
  useEffect(() => {
    if (disabled) return;

    function onStart(e: TouchEvent) {
      if (window.scrollY > 0) return;
      if (refreshingRef.current) return;
      if (e.touches.length !== 1) return;
      stateRef.current.startY = e.touches[0].clientY;
      stateRef.current.active = true;
      stateRef.current.moved = false;
      setTransitioning(false);
    }

    function onMove(e: TouchEvent) {
      if (!stateRef.current.active) return;
      if (refreshingRef.current) return;

      const y = e.touches[0].clientY;
      const delta = y - stateRef.current.startY;

      // سحب للأعلى → إلغاء
      if (delta <= 0) {
        if (stateRef.current.moved) {
          stateRef.current.active = false;
          stateRef.current.moved = false;
          setTransitioning(true);
          setPullDistance(0);
        }
        return;
      }

      // لا نبدأ السحب إلا بعد 8px (لتفادي التداخل مع scroll العادي)
      if (!stateRef.current.moved) {
        if (delta < 8) return;
        stateRef.current.moved = true;
      }

      // امنع التمرير الأصلي (iOS bounce + Chrome native refresh)
      if (e.cancelable) e.preventDefault();

      // damping غير خطي: كلما زاد السحب قلّ التجاوب
      const damped = Math.min(maxPull, Math.pow(delta, 0.85) * 0.62);
      setPullDistance(damped);
    }

    function onEnd() {
      if (!stateRef.current.active) return;
      const wasMoved = stateRef.current.moved;
      stateRef.current.active = false;
      stateRef.current.moved = false;

      if (!wasMoved) return;

      setTransitioning(true);

      if (pullDistanceRef.current >= threshold && !refreshingRef.current) {
        setRefreshing(true);
        setPullDistance(56);
        Promise.resolve()
          .then(() => onRefresh())
          .catch(() => {})
          .finally(() => {
            setRefreshing(false);
            setPullDistance(0);
          });
      } else {
        setPullDistance(0);
      }
    }

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [disabled, threshold, maxPull, onRefresh, setPullDistance]);

  const progress = Math.min(1, pullDistance / threshold);
  const showIndicator = pullDistance > 0 || refreshing;

  return (
    <div className="relative">
      {/* ==================== Indicator ==================== */}
      <div
        aria-hidden={!showIndicator}
        className="pointer-events-none fixed inset-x-0 top-[var(--nav-h)] z-[var(--z-sticky)] flex justify-center"
        style={{
          opacity: showIndicator ? 1 : 0,
          transition: 'opacity 150ms ease-out',
        }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper-soft shadow-sm"
          style={{
            transform: `translateY(${Math.max(0, pullDistance - 48)}px) scale(${
              0.75 + progress * 0.25
            })`,
            transition: transitioning ? 'transform 200ms ease-out' : 'none',
          }}
        >
          <svg
            className={`h-5 w-5 text-teal ${refreshing ? 'animate-spin' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${progress * 180}deg)`,
              opacity: refreshing ? 1 : 0.35 + progress * 0.65,
            }}
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 11-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
        </div>
      </div>

      {/* ==================== Content ==================== */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: transitioning
            ? 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}