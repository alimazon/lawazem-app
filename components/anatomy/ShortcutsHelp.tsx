'use client';

// components/anatomy/ShortcutsHelp.tsx
/** تُعرض الاختصارات المنفَّذة فعلاً فقط. */
export const SHORTCUT_LIST: readonly (readonly [string, string])[] = [
  ['⌘ K / Ctrl K', 'بحث وأوامر شاملة'],
  ['?', 'هذه القائمة'],
  ['1 2 3 4', 'تبويبات اللوحة: التفاصيل، الحركات، الرقبة، الفهرس'],
  ['V', 'تبديل 2D / 3D'],
  ['F', 'إضافة العضلة المحددة للمفضّلة'],
  ['N', 'ملاحظة على العضلة المحددة'],
  ['P', 'تقدّمي'],
  ['S', 'نسخ رابط المشاركة'],
  ['Esc', 'إغلاق النافذة المفتوحة'],
  ['في البطاقات: Enter ثم 1 2 3 4', 'كشف الإجابة ثم التقييم'],
];

export default function ShortcutsHelp() {
  return (
    <dl className="fa-shortcuts-list">
      {SHORTCUT_LIST.map(([k, d]) => (
        <div key={k} className="fa-shortcuts-row">
          <dt><kbd dir="ltr">{k}</kbd></dt>
          <dd>{d}</dd>
        </div>
      ))}
      <p className="fq-note">تعمل الاختصارات أيضاً مع التخطيط العربي للوحة المفاتيح (الحرف على نفس المفتاح).</p>
    </dl>
  );
}
