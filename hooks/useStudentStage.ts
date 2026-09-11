// hooks/useStudentStage.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Stage } from '@/lib/types';

interface Result {
  stage: Stage | null;
  ready: boolean;
}

/**
 * يقرأ المرحلة المختارة من localStorage ويحوّل الطالب للرئيسية إذا ما اختار.
 */
export function useStudentStage(): Result {
  const router = useRouter();
  const [stage, setStage] = useState<Stage | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.studentStage) as Stage | null;
    if (!saved) {
      router.replace('/');
      return;
    }
    setStage(saved);
    setReady(true);
  }, [router]);

  return { stage, ready };
}