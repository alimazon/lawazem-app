// components/LawazemLogo.tsx

interface Props {
  className?: string;
}

/**
 * شعار "لوازم" — حرف "ل" عربي بأسلوب هندسي
 * يشتغل بحجم صغير (navbar) وكبير (PWA)
 */
export function LawazemLogo({ className = 'h-8 w-8' }: Props) {
  return (
    <span
      className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-teal via-teal to-teal-light shadow-[0_2px_8px_rgba(14,74,74,0.30)] ${className}`}
      aria-label="لوازم"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[60%] w-[60%]"
        aria-hidden="true"
      >
        {/* حرف "ل" — خط عمودي مع انحناء في الأسفل */}
        <path
          d="M7 4.5 V14.5 C7 17 8.8 18.5 11.2 18.5 H18"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* نقطة "ز" — كهرمانية للحيوية */}
        <circle cx="18" cy="6.5" r="2" fill="#E0A63A" />
      </svg>
    </span>
  );
}