// app/g/[slug]/layout.tsx
import type { ReactNode } from 'react';
import { getAccessToken } from '@/lib/groups/access';

export default async function GroupsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await getAccessToken(slug);

  if (!access) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl">⏰</div>
          <h1 className="text-2xl font-bold text-ink">انتهت فترة التسجيل</h1>
          <p className="text-ink-soft leading-relaxed">
            هذا الرابط لم يعد متاحاً. تواصل مع إدارة لوازم للحصول على رابط جديد.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper" dir="rtl">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <div className="font-bold text-ink">لوازم</div>
              <div className="text-xs text-ink-muted">
                {access.label || 'كروبات الطلاب'}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}