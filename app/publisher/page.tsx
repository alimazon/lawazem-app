// app/publisher/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { usePublisherAuth } from './_components/usePublisherAuth';
import { ComposeForm } from './_components/ComposeForm';
import { MyAnnouncements } from './_components/MyAnnouncements';

type Tab = 'compose' | 'mine';

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
function IconPen() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IconList() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h10" />
    </svg>
  );
}

// ==================== Login ====================
function LoginScreen({
  loading,
  error,
  onLogin,
}: {
  loading: boolean;
  error: string;
  onLogin: (pw: string, name: string) => void;
}) {
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');

  return (
    <main className="relative mx-auto flex min-h-[calc(100dvh-var(--nav-h))] max-w-sm flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-line bg-white/80 p-8 shadow-[0_8px_30px_rgba(14,74,74,0.08)] backdrop-blur-sm animate-slide-up dark:bg-paper/80 dark:shadow-[0_8px_30px_rgba(0,0,0,0.40)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal">
          <IconLock />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black text-ink">
          بوابة الناشر
        </h1>
        <p className="mt-2 text-center text-sm text-ink/55">
          أرسل تبليغاً ليُراجع من المشرف ثم يُرسل للمشتركين
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(pw, name);
          }}
          className="mt-6 space-y-4"
        >
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسمك (يظهر للمشرف)"
            required
            autoFocus
            maxLength={100}
            className="text-center"
          />
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="كلمة مرور الناشرين"
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
export default function PublisherPage() {
  const { password, name, authenticated, loading, error, login, logout } =
    usePublisherAuth();
  const [tab, setTab] = useState<Tab>('compose');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!authenticated) {
    return <LoginScreen loading={loading} error={error} onLogin={login} />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-teal dark:border-teal/30 dark:bg-teal/15">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
            ناشر
          </span>
          <h1 className="mt-3 text-3xl font-black text-ink sm:text-4xl">
            مرحباً، {name}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            اكتب تبليغك وسيراجعه المشرف قبل النشر
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={logout} icon={<IconLogout />}>
          تسجيل الخروج
        </Button>
      </div>

      <div
        role="tablist"
        aria-label="أقسام بوابة الناشر"
        className="mt-6 flex gap-1.5 rounded-2xl border border-line bg-white/60 p-1.5 backdrop-blur-sm dark:bg-white/[0.04] animate-slide-up"
        style={{ animationDelay: '80ms' }}
      >
        <button
          role="tab"
          aria-selected={tab === 'compose'}
          onClick={() => setTab('compose')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            tab === 'compose'
              ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]'
              : 'text-ink/60 hover:bg-ink/5'
          }`}
        >
          <IconPen />
          تبليغ جديد
        </button>
        <button
          role="tab"
          aria-selected={tab === 'mine'}
          onClick={() => setTab('mine')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            tab === 'mine'
              ? 'bg-teal text-white shadow-[0_2px_8px_rgba(14,74,74,0.24)]'
              : 'text-ink/60 hover:bg-ink/5'
          }`}
        >
          <IconList />
          تبليغاتي
        </button>
      </div>

      <div className="mt-6 animate-slide-up" style={{ animationDelay: '120ms' }}>
        {tab === 'compose' && (
          <ComposeForm
            password={password}
            publisherName={name}
            onCreated={() => {
              setRefreshKey((k) => k + 1);
              setTab('mine');
            }}
          />
        )}
        {tab === 'mine' && (
          <MyAnnouncements
            password={password}
            publisherName={name}
            refreshKey={refreshKey}
          />
        )}
      </div>
    </main>
  );
}
