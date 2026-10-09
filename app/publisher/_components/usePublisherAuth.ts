// app/publisher/_components/usePublisherAuth.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { postJson, ApiError } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/constants';

interface UsePublisherAuthResult {
  password: string;
  name: string;
  authenticated: boolean;
  loading: boolean;
  error: string;
  login: (pw: string, name: string) => Promise<boolean>;
  logout: () => void;
}

export function usePublisherAuth(): UsePublisherAuthResult {
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(
    async (pw: string, nameInput: string): Promise<boolean> => {
      const trimmedPw = pw.trim();
      const trimmedName = nameInput.trim();

      if (!trimmedPw) {
        setError('أدخل كلمة المرور');
        return false;
      }
      if (!trimmedName) {
        setError('أدخل اسمك');
        return false;
      }

      setLoading(true);
      setError('');
      try {
        await postJson('/api/admin/announcements', {
          password: trimmedPw,
          action: 'list_mine',
          created_by: trimmedName,
        });

        sessionStorage.setItem(STORAGE_KEYS.publisherPassword, trimmedPw);
        sessionStorage.setItem(STORAGE_KEYS.publisherName, trimmedName);
        setPassword(trimmedPw);
        setName(trimmedName);
        setAuthenticated(true);
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError && err.status === 401
            ? 'كلمة المرور غير صحيحة'
            : 'صار خطأ، حاول مرة أخرى.';
        setError(message);
        sessionStorage.removeItem(STORAGE_KEYS.publisherPassword);
        sessionStorage.removeItem(STORAGE_KEYS.publisherName);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.publisherPassword);
    sessionStorage.removeItem(STORAGE_KEYS.publisherName);
    setPassword('');
    setName('');
    setAuthenticated(false);
    setError('');
  }, []);

  useEffect(() => {
    const savedPw = sessionStorage.getItem(STORAGE_KEYS.publisherPassword);
    const savedName = sessionStorage.getItem(STORAGE_KEYS.publisherName);
    if (savedPw && savedName) {
      login(savedPw, savedName);
    }
  }, [login]);

  return { password, name, authenticated, loading, error, login, logout };
}