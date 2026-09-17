// app/channel-portal/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { useChannelAuth } from './_components/useChannelAuth';
import { ContentSection } from './_components/ContentSection';
import { SettingsSection } from './_components/SettingsSection';

type Tab = 'content' | 'settings';

// ==================== Icons ====================
function IconContent() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h10" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconEye() {
  return (
    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'content', label: 'المحتوى', icon: <IconContent /> },
  { id: 'settings', label: 'الإعدادات', icon: <IconSettings /> },
];

// ==================== Login Screen ====================
function LoginScreen({
  channelsList,
  loading,
  error,
  onLogin,
}: {
  channelsList: { id: string; name: string }[];
  loading: boolean;
  error: string;
  onLogin: (channelId: string, pw: string) => void;
}) {
  const [channelId, setChannelId] = useState('');
  const [pw, setPw] = useState('');

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-70px)] max-w-sm flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-line bg-white/80 p-8 shadow-[0_8px_30px_rgba(14,74,74,0.08)] backdrop-blur-sm animate-slide-up dark:bg-paper/80 dark:shadow-[0_8px_30px_rgba(0,0,0,0.40)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <IconLock />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black text-ink">دخول صاحب القناة</h1>
        <p className="mt-2 text-center text-sm text-ink/55">
          اختر قناتك وأدخل كلمة المرور التي أعطاك إياها المشرف
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(channelId, pw);
          }}
          className="mt-6 space-y-4"
        >
          <Select
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            required
            className="w-full"
            aria-label="القناة"
          >
            <option value="">اختر قناتك</option>
            {channelsList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="كلمة مرور القناة"
            autoComplete="current-password"
            required
            className="text-center"
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? 'جاري التحقق...' : 'دخول'}
          </Button>
        </form>
      </div>
    </main>
  );
}

// ==================== Page ====================
export default function ChannelPortalPage() {
  const {
    channelsList,
    password,
    authenticated,
    loading,
    error,
    channelInfo,
    login,
    logout,
    updatePassword,
    updateChannelInfo,
  } = useChannelAuth();

  const [tab, setTab] = useState<Tab>('content');

  if (!authenticated) {
    return (
      <LoginScreen
        channelsList={channelsList}
        loading={loading}
        error={error}
        onLogin={login}
      />
    );
  }

  if (!channelInfo) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            {channelInfo.stage}
          </span>
          <h1 className="mt-3 truncate text-2xl font-black text-ink sm:text-3xl">
            قناة: {channelInfo.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink/60 dark:bg-white/10 dark:text-ink/70">
              <IconEye />
              {channelInfo.views ?? 0} زيارة
            </span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={logout} icon={<IconLogout />}>
          تسجيل الخروج
        </Button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="أقسام بوابة القناة"
        className="mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white/60 p-1.5 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible dark:bg-white/[0.04] [&::-webkit-scrollbar]:hidden animate-slide-up"
        style={{ animationDelay: '80ms' }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                active
                  ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)] dark:bg-teal dark:shadow-[0_2px_8px_rgba(0,0,0,0.30)]'
                  : 'text-ink/60 hover:bg-ink/5 hover:text-ink dark:text-ink/60 dark:hover:bg-white/5 dark:hover:text-ink'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        className="mt-6 animate-slide-up"
        style={{ animationDelay: '120ms' }}
        aria-label={TABS.find((t) => t.id === tab)?.label}
      >
        {tab === 'content' && (
          <ContentSection channelId={channelInfo.id} password={password} />
        )}
        {tab === 'settings' && (
          <SettingsSection
            channelId={channelInfo.id}
            password={password}
            channelInfo={channelInfo}
            onPasswordChanged={updatePassword}
            onChannelInfoChanged={updateChannelInfo}
          />
        )}
      </div>
    </main>
  );
}