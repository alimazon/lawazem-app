// app/admin/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useAdminAuth } from './_components/useAdminAuth';
import { SubjectsSection } from './_components/SubjectsSection';
import { MaterialsSection } from './_components/MaterialsSection';
import { ChannelsSection } from './_components/ChannelsSection';
import { SchedulesSection } from './_components/SchedulesSection';

type Tab = 'subjects' | 'materials' | 'channels' | 'schedules';

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'subjects', label: 'المواد', icon: <IconBook /> },
  { id: 'materials', label: 'الملازم', icon: <IconDoc /> },
  { id: 'channels', label: 'القنوات', icon: <IconChat /> },
  { id: 'schedules', label: 'الجدول', icon: <IconCalendar /> },
];

// ==================== Icons ====================
function IconBook() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

// ==================== Login Screen ====================
function LoginScreen({
  loading,
  error,
  onLogin,
}: {
  loading: boolean;
  error: string;
  onLogin: (pw: string) => void;
}) {
  const [pw, setPw] = useState('');

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-70px)] max-w-sm flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-line bg-white/80 p-8 shadow-[0_8px_30px_rgba(14,74,74,0.08)] backdrop-blur-sm animate-slide-up">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <IconLock />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black text-ink">دخول المشرف</h1>
        <p className="mt-2 text-center text-sm text-ink/55">
          أدخل كلمة مرور المشرف للوصول إلى لوحة التحكم
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(pw);
          }}
          className="mt-6 space-y-4"
        >
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="كلمة المرور"
            autoComplete="current-password"
            required
            autoFocus
            className="text-center"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-bold text-red-600" role="alert">
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
export default function AdminPage() {
  const { password, authenticated, loading, error, login, logout } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('subjects');

  if (!authenticated) {
    return <LoginScreen loading={loading} error={error} onLogin={login} />;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            مشرف
          </span>
          <h1 className="mt-3 text-3xl font-black text-ink sm:text-4xl">لوحة التحكم</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={logout} icon={<IconLogout />}>
          تسجيل خروج
        </Button>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="أقسام لوحة التحكم"
        className="mt-6 flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white/60 p-1.5 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden animate-slide-up"
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
                  ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]'
                  : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        className="mt-6 animate-slide-up"
        style={{ animationDelay: '120ms' }}
        aria-label={TABS.find((t) => t.id === tab)?.label}
      >
        {tab === 'subjects' && <SubjectsSection password={password} />}
        {tab === 'materials' && <MaterialsSection password={password} />}
        {tab === 'channels' && <ChannelsSection password={password} />}
        {tab === 'schedules' && <SchedulesSection password={password} />}
      </div>
    </main>
  );
}