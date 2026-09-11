// app/channel-portal/_components/useChannelAuth.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { postJson, ApiError } from '@/lib/api-client';
import { supabase } from '@/lib/supabaseClient';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Channel, ChannelListItem } from '@/lib/types';

export interface ChannelSessionResponse {
  channel: Channel;
}

interface UseChannelAuthResult {
  channelsList: ChannelListItem[];
  selectedChannelId: string;
  password: string;
  authenticated: boolean;
  loading: boolean;
  error: string;
  channelInfo: Channel | null;
  setSelectedChannelId: (id: string) => void;
  setPassword: (pw: string) => void;
  login: (channelId: string, pw: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (newPw: string) => void;
  updateChannelInfo: (patch: Partial<Channel>) => void;
}

export function useChannelAuth(): UseChannelAuthResult {
  const [channelsList, setChannelsList] = useState<ChannelListItem[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [channelInfo, setChannelInfo] = useState<Channel | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadChannels() {
      const { data, error: fetchError } = await supabase
        .from('channels')
        .select('id, name')
        .order('name');
      if (cancelled) return;
      if (!fetchError && data) setChannelsList(data as ChannelListItem[]);
    }
    loadChannels();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (channelId: string, pw: string): Promise<boolean> => {
    if (!channelId || !pw) {
      setError('اختر القناة وأدخل كلمة المرور');
      return false;
    }
    setLoading(true);
    setError('');
    try {
      const data = await postJson<ChannelSessionResponse>('/api/channel/content', {
        action: 'login',
        channel_id: channelId,
        password: pw,
      });
      sessionStorage.setItem(STORAGE_KEYS.channelId, channelId);
      sessionStorage.setItem(STORAGE_KEYS.channelPassword, pw);
      setSelectedChannelId(channelId);
      setPassword(pw);
      setChannelInfo(data.channel);
      setAuthenticated(true);
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? 'كلمة المرور غير صحيحة'
          : 'صار خطأ، حاول مرة ثانية.';
      setError(message);
      sessionStorage.removeItem(STORAGE_KEYS.channelId);
      sessionStorage.removeItem(STORAGE_KEYS.channelPassword);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedId = sessionStorage.getItem(STORAGE_KEYS.channelId);
    const savedPw = sessionStorage.getItem(STORAGE_KEYS.channelPassword);
    if (savedId && savedPw) {
      setSelectedChannelId(savedId);
      setPassword(savedPw);
      login(savedId, savedPw);
    }
  }, [login]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.channelId);
    sessionStorage.removeItem(STORAGE_KEYS.channelPassword);
    setAuthenticated(false);
    setPassword('');
    setSelectedChannelId('');
    setChannelInfo(null);
    setError('');
  }, []);

  const updatePassword = useCallback((newPw: string) => {
    sessionStorage.setItem(STORAGE_KEYS.channelPassword, newPw);
    setPassword(newPw);
  }, []);

  const updateChannelInfo = useCallback((patch: Partial<Channel>) => {
    setChannelInfo((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return {
    channelsList,
    selectedChannelId,
    password,
    authenticated,
    loading,
    error,
    channelInfo,
    setSelectedChannelId,
    setPassword,
    login,
    logout,
    updatePassword,
    updateChannelInfo,
  };
}