// components/BackgroundPattern.tsx
'use client';

/**
 * خلفية "مطبعة الجامعة"
 * - لون الورق الأساسي (--paper)
 * - صورة نسيج ورق مخططة (texture) بشفافية منخفضة
 * - الوضع الليلي: يخفت النسيج ويستخدم mix-blend-screen
 */
export function BackgroundPattern() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden bg-[var(--paper)]"
    >
      {/* ==================== Paper Texture ==================== */}
      <div
        className="
          absolute inset-0 bg-repeat
          opacity-[0.35] mix-blend-multiply
          dark:opacity-[0.15] dark:mix-blend-screen
        "
        style={{
          backgroundImage: `url('/backgrounds/paper-texture.png')`,
          backgroundSize: '600px 600px',
        }}
      />

      {/* ==================== Very subtle top fade (for nav readability) ==================== */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-paper/40 to-transparent" />
    </div>
  );
}