// app/g/[slug]/create/page.tsx
'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { groupsFetch } from '@/lib/groups/client';

export default function CreateGroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await groupsFetch('/api/groups/create', { name });
      router.push(`/g/${slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإنشاء');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">إنشاء كروب جديد</h1>
        <p className="mt-1 text-sm text-ink-soft">ستصبح أنت قائد هذا الكروب ويمكنك قبول الطلبات لاحقاً.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">اسم الكروب (اختياري)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-ink outline-none focus:border-teal focus:ring-1 focus:ring-teal"
              maxLength={50}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal px-4 py-2.5 font-semibold text-white transition hover:bg-teal/90 disabled:opacity-60"
          >
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء الكروب'}
          </button>
        </form>
      </div>
    </div>
  );
}