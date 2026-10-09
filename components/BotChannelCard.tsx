// components/BotChannelCard.tsx
'use client';

import { IconBell, IconTelegram, IconArrowLeft } from '@/components/ui/Icons';

// ⚠️ عدّل هذا الرابط إلى رابط البوت الفعلي
const TELEGRAM_BOT_URL = 'https://t.me/Lawazem_Student_Bot';

// ==================== Component ====================
export function BotChannelCard() {
  return (
    <section
      aria-labelledby="bot-channel-heading"
      className="card-editorial flex h-full flex-col overflow-hidden"
    >
      {/* ==================== Header ==================== */}
      <div className="border-b border-line bg-teal px-5 py-4 text-on-teal sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-field bg-on-teal/15">
            <IconBell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] opacity-80">
              Live Updates
            </p>
            <h2
              id="bot-channel-heading"
              className="font-display text-base font-bold leading-tight sm:text-lg"
            >
              تابع آخر التحديثات عبر تيليكرام
            </h2>
          </div>
        </div>
      </div>

      {/* ==================== Body ==================== */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-ink-soft">
          بدل ما تفتح الموقع كل يوم، خلّ البوت يوصلك التحديثات مباشرة:
        </p>

        <ul className="mt-4 space-y-2.5">
          <li className="margin-mark text-sm leading-relaxed text-ink-soft">
            إشعار فوري عند إضافة ملزمة جديدة{' '}
            <strong className="font-semibold text-ink">لمرحتك فقط</strong>
          </li>
          <li className="margin-mark text-sm leading-relaxed text-ink-soft">
            ملخص صباحي بما فاتك أمس
          </li>
          <li className="margin-mark text-sm leading-relaxed text-ink-soft">
            تذكير بسلسلة أيامك الدراسية
          </li>
          <li className="margin-mark text-sm leading-relaxed text-ink-soft">
            بدون تسجيل، بدون بريد — فقط اضغط /start
          </li>
        </ul>

        {/* ==================== Action ==================== */}
        <div className="mt-auto pt-6">
          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="شغّل بوت لوازم على تيليكرام"
            className="group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-card border-2 border-teal bg-teal px-5 py-4 text-on-teal transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-hover hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0"
          >
            {/* زخرفة خلفية (دائرة خفيفة) */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-on-teal/5 transition-transform duration-500 group-hover:scale-110 motion-reduce:transition-none"
            />

            {/* الأيقونة + النص */}
            <span className="relative z-10 flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-field bg-on-teal/15 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none">
                <IconTelegram className="h-5 w-5" />
              </span>
              <span className="flex flex-col items-start gap-0.5 text-start">
                <span className="text-base font-bold leading-tight">
                  شغّل البوت
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                  اضغط /start للتسجيل
                </span>
              </span>
            </span>

            {/* السهم */}
            <span className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-field bg-on-teal/15 transition-all duration-300 group-hover:bg-on-teal/25 motion-reduce:transition-none">
              <IconArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0" />
            </span>
          </a>

          {/* ملاحظة صغيرة تحت الزر */}
          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-muted">
            البوت مجاني ويعمل على تيليكرام —{' '}
            <span className="font-mono">t.me/Lawazem_Student_Bot</span>
          </p>
        </div>
      </div>
    </section>
  );
}