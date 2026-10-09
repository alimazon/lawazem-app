// app/publisher/_components/ComposeForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api-client';
import { STAGES } from '@/lib/constants';
import type { Stage } from '@/lib/types';

interface Props {
  password: string;
  publisherName: string;
  onCreated: () => void;
}

interface FormState {
  title: string;
  body: string;
  stage: Stage | '';
  link_url: string;
  link_label: string;
}

function emptyForm(): FormState {
  return { title: '', body: '', stage: '', link_url: '', link_label: '' };
}

function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function ComposeForm({ password, publisherName, onCreated }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const canSubmit =
    form.title.trim() !== '' &&
    form.body.trim() !== '' &&
    (!form.link_url.trim() || isValidUrl(form.link_url.trim()));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      await postJson('/api/admin/announcements', {
        password,
        action: 'create',
        title: form.title.trim(),
        body: form.body.trim(),
        stage: form.stage || null,
        link_url: form.link_url.trim() || null,
        link_label: form.link_label.trim() || null,
        created_by: publisherName,
      });
      setForm(emptyForm());
      toast.show('تم إرسال التبليغ للمراجعة', 'success');
      onCreated();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإرسال', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {/* ==================== Form ==================== */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        <div>
          <label className="mb-2 block text-sm font-bold text-ink">
            العنوان الداخلي <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: تأجيل امتحان التشريح"
            required
            maxLength={200}
          />
          <p className="mt-1 text-xs text-ink/50">
            يظهر بخط عريض في أعلى الرسالة
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-ink">
            نص التبليغ <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="اكتب التبليغ..."
            required
            rows={5}
            maxLength={2000}
          />
          <p className="mt-1 text-xs text-ink/50">
            {form.body.length} / 2000
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-ink">
            المرحلة
          </label>
          <Select
            value={form.stage}
            onChange={(e) =>
              setForm({ ...form, stage: e.target.value as Stage | '' })
            }
          >
            <option value="">كل المراحل</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
          <div>
            <label className="mb-2 block text-sm font-bold text-ink">
              رابط اختياري
            </label>
            <Input
              type="url"
              value={form.link_url}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https://..."
              maxLength={1000}
            />
            {form.link_url.trim() && !isValidUrl(form.link_url.trim()) && (
              <p className="mt-1 text-xs font-bold text-red-600">
                الرابط غير صالح
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-ink">
              نص الزر
            </label>
            <Input
              type="text"
              value={form.link_label}
              onChange={(e) => setForm({ ...form, link_label: e.target.value })}
              placeholder="المزيد"
              maxLength={60}
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={saving}
          disabled={!canSubmit}
          className="w-full"
        >
          إرسال للمراجعة
        </Button>
      </form>

      {/* ==================== Preview ==================== */}
      <aside className="rounded-3xl border border-line bg-white/80 p-5 dark:bg-paper/80">
        <h3 className="mb-3 text-sm font-bold text-ink">معاينة في البوت</h3>

        <div className="rounded-2xl bg-[#17212B] p-4 text-[13px] text-white">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-xs font-bold">
              لو
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-teal">لوازم</p>
            </div>
          </div>

          <div className="rounded-xl bg-[#1D2A34] p-3">
            <p className="whitespace-pre-line leading-relaxed">
              📢 <b>تبليغ إداري</b>
              {'\n\n'}
              <b>{form.title || 'عنوان التبليغ'}</b>
              {'\n\n'}
              {form.body || 'نص التبليغ سيظهر هنا...'}
            </p>

            <div className="mt-3 space-y-1.5">
              {form.link_url && (
                <div className="rounded-lg bg-[#2A3A47] px-3 py-1.5 text-center text-xs font-bold text-teal">
                  🔗 {form.link_label || 'المزيد'}
                </div>
              )}
              <div className="rounded-lg bg-[#2A3A47] px-3 py-1.5 text-center text-xs font-bold text-teal">
                🌐 فتح المنصة
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-ink/50">
          {form.stage ? (
            <>سيُرسل فقط لمشتركي <b>{form.stage}</b></>
          ) : (
            <>سيُرسل لكل المشتركين المُفعّلين</>
          )}
        </p>
      </aside>
    </div>
  );
}