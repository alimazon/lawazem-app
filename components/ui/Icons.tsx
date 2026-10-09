// components/ui/Icons.tsx
import type { SVGProps, ReactNode } from 'react';

// ==================== Base ====================
interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Base({
  size = 20,
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

// ==================== Navigation Icons ====================

/** الملازم — كتاب مفتوح */
export function IconBook(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 6.5V19m0-12.5C10.832 5.5 9.246 5 7.5 5S4.168 5.5 3 6.5V19c1.168-1 2.754-1.5 4.5-1.5S10.832 18 12 19m0-12.5C13.168 5.5 14.754 5 16.5 5S19.832 5.5 21 6.5V19c-1.168-1-2.754-1.5-4.5-1.5S13.168 18 12 19" />
    </Base>
  );
}

/** القنوات — بث/إرسال */
export function IconChannels(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 11l18-8-8 18-2-8-8-2z" />
    </Base>
  );
}

/** الجدول — تقويم */
export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </Base>
  );
}

/** القاموس — كتاب مع علامة */
export function IconDictionary(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M10 7h6M10 11h6" />
    </Base>
  );
}


/** المعدل — مخطط بياني */
export function IconChart(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 21h18M6 21V12M12 21V5M18 21v-6" />
    </Base>
  );
}

/** المعدل — alias لـ IconChart */
export const IconGpa = IconChart;

/** جات الدراسة — sparkles */
export function IconSparkles(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </Base>
  );
}

/** تبديل الكروبات — سهمان */
export function IconSwap(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </Base>
  );
}

/** صحتك الدراسية — نبض */
export function IconHealth(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </Base>
  );
}

/** البوت — مكبر صوت */
export function IconMegaphone(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 11l18-8v18l-18-8v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </Base>
  );
}

/** الرائج — اتجاه صاعد */
export function IconTrending(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </Base>
  );
}

// ==================== UI Icons ====================

/** السهم الأيسر — رجوع */
export function IconArrowLeft(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
    </Base>
  );
}

/** السهم الأيمن — للأزرار */
export function IconArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </Base>
  );
}

/** سهم خارجي */
export function IconExternal(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </Base>
  );
}

/** قفل */
export function IconLock(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Base>
  );
}

/** بحث */
export function IconSearch(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </Base>
  );
}

/** إغلاق */
export function IconClose(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 18L18 6M6 6l12 12" />
    </Base>
  );
}

/** صح */
export function IconCheck(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 13l4 4L19 7" />
    </Base>
  );
}

/** سهم قائمة (chevron) */
export function IconChevronDown(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 9l6 6 6-6" />
    </Base>
  );
}

/** تشغيل / فتح */
export function IconPlay(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 3l14 9-14 9V3z" />
    </Base>
  );
}

/** علامة كتاب (bookmark) */
export function IconBookmark({
  filled,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <Base {...props} fill={filled ? 'currentColor' : 'none'}>
      <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
    </Base>
  );
}

/** علم — بلاغ */
export function IconFlag(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 0 0-2 2zm9-13.5V9" />
    </Base>
  );
}

/** ساعة */
export function IconClock(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 3" />
    </Base>
  );
}

/** طبيب/شخص */
export function IconDoctor(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
    </Base>
  );
}

/** جرس — إشعارات */
export function IconBell(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 0 1-6 0v-1m6 0H9" />
    </Base>
  );
}

/** مستند — ملزمة */
export function IconDoc(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </Base>
  );
}

/** شعلة — رائج */
export function IconFire(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2c1 4 4 5 4 9a4 4 0 1 1-8 0c0-1 .5-2 1-2.5C8 10 7 12 7 14a5 5 0 1 0 10 0c0-5-5-6-5-12z" />
    </Base>
  );
}

/** تحذير — مثلث */
export function IconWarning(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
    </Base>
  );
}

/** تيليكرام */
export function IconTelegram(props: IconProps) {
  const { size = 20, ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      aria-hidden="true"
      {...rest}
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/** قائمة/المزيد */
export function IconMore(props: IconProps) {
  const { size = 20, ...rest } = props;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      aria-hidden="true"
      {...rest}
    >
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}

/** رئيسية */
export function IconHome(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 12l9-8 9 8M5 10v10a1 1 0 0 0 1 1h3m10-11v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />
    </Base>
  );
}
/** شمس — الوضع الفاتح */
export function IconSun(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
    </Base>
  );
}

/** قمر — الوضع الليلي */
export function IconMoon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z" />
    </Base>
  );
}
/** مجلد مغلق */
export function IconFolder(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </Base>
  );
}

/** مجلد مفتوح */
export function IconFolderOpen(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5z" />
      <path d="M3 9h18" />
    </Base>
  );
}

/** صندوق فارغ — empty state */
export function IconInbox(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </Base>
  );
}
/** هدف — دائرة مع نقاط مركزية */
export function IconTarget(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </Base>
  );
}
/** نسخ — مستندان فوق بعضهما */
export function IconCopy(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Base>
  );
}
/** تكبير/عرض بحجم كامل — سهمان يخرجان للزوايا */
export function IconExpand(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </Base>
  );
}