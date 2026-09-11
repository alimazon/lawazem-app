// app/admin/_components/useAdminAuth.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { postJson, ApiError } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/constants';

interface UseAdminAuthResult {
  password: string;
  authenticated: boolean;
  loading: boolean;
  error: string;
  login: (pw: string) => Promise<boolean>;
  logout: () => void;
}

export function useAdminAuth(): UseAdminAuthResult {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (pw: string): Promise<boolean> => {
    const trimmed = pw.trim();
    if (!trimmed) {
      setError('أدخل كلمة المرور');
      return false;
    }
    setLoading(true);
    setError('');
    try {
      await postJson('/api/admin/subjects', { password: trimmed, action: 'list' });
      sessionStorage.setItem(STORAGE_KEYS.adminPassword, trimmed);
      setPassword(trimmed);
      setAuthenticated(true);
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? 'كلمة المرور غير صحيحة'
          : 'صار خطأ، حاول مرة ثانية.';
      setError(message);
      sessionStorage.removeItem(STORAGE_KEYS.adminPassword);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.adminPassword);
    setPassword('');
    setAuthenticated(false);
    setError('');
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.adminPassword);
    if (saved) login(saved);
  }, [login]);

  return { password, authenticated, loading, error, login, logout };
}