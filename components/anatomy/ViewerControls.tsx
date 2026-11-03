'use client';

// components/anatomy/ViewerControls.tsx
/** أزرار عائمة فوق الرسم: تكبير/تصغير، إعادة ضبط، ملء الشاشة، ومعلومات العضلة. */

interface Props {
  view: '2d' | '3d';
  isFullscreen: boolean;
  fullscreenSupported: boolean;
  zoomPct?: number;
  canZoom: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset: () => void;
  onToggleFullscreen: () => void;
  hasSelection?: boolean;
  onShowInfo?: () => void;
}

const Icon = {
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  minus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  ),
  reset: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  ),
  enterFs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8V5a2 2 0 0 1 2-2h3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
    </svg>
  ),
  exitFs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M16 3v3a2 2 0 0 0 2 2h3" />
      <path d="M8 21v-3a2 2 0 0 0-2-2H3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
} as const;

export default function ViewerControls({
  view,
  isFullscreen,
  fullscreenSupported,
  zoomPct,
  canZoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleFullscreen,
  hasSelection,
  onShowInfo,
}: Props) {
  return (
    <div className="fa-vctrl" role="toolbar" aria-label="أدوات العرض" dir="ltr">
      {hasSelection && onShowInfo && (
        <button
          type="button"
          className="fa-vctrl-btn fa-vctrl-info"
          onClick={onShowInfo}
          aria-label="معلومات العضلة"
          title="معلومات العضلة"
        >
          {Icon.info}
        </button>
      )}
      
      <div className="fa-vctrl-divider" aria-hidden="true" />

      {view === '2d' && canZoom && (
        <>
          <button type="button" className="fa-vctrl-btn" onClick={onZoomIn} aria-label="تكبير" title="تكبير (+)">
            {Icon.plus}
          </button>
          <button type="button" className="fa-vctrl-btn" onClick={onZoomOut} aria-label="تصغير" title="تصغير (−)">
            {Icon.minus}
          </button>
        </>
      )}
      <button type="button" className="fa-vctrl-btn" onClick={onReset} aria-label="إعادة ضبط العرض" title="إعادة ضبط (0)">
        {Icon.reset}
      </button>
      
      {view === '2d' && zoomPct != null && (
        <span className="fa-vctrl-pct" aria-live="polite">{zoomPct}%</span>
      )}
      
      {fullscreenSupported && (
        <button
          type="button"
          className="fa-vctrl-btn"
          onClick={onToggleFullscreen}
          aria-pressed={isFullscreen}
          aria-label={isFullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة'}
          title={isFullscreen ? 'خروج من ملء الشاشة (Shift+F)' : 'ملء الشاشة (Shift+F)'}
        >
          {isFullscreen ? Icon.exitFs : Icon.enterFs}
        </button>
      )}
    </div>
  );
}