// app/auth/magic/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveToken } from '@/lib/groups/client';

function MagicLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const slug = searchParams.get('slug');

    if (!token || !slug) {
      setError('الرابط غير صالح أو ناقص. يرجى طلب رابط جديد من البوت.');
      return;
    }

    // حفظ التوكن في المتصفح
    saveToken(token);
    
    // توجيه الطالب لصفحة كروبه
    router.replace(`/g/${slug}`);
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-paper p-4 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-ink mb-2">رابط غير صالح</h1>
        <p className="text-ink-soft">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-paper p-4 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mb-4"></div>
      <h1 className="text-xl font-bold text-ink">جارٍ تسجيل الدخول...</h1>
      <p className="text-ink-soft mt-2 text-sm">يتم الآن توجيهك إلى حسابك وكروبك.</p>
    </div>
  );
}

export default function MagicLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center">جارٍ التحميل...</div>}>
      <MagicLogin />
    </Suspense>
  );
}