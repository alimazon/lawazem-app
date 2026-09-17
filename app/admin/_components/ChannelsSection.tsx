// app/admin/_components/ChannelsSection.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { postJson } from '@/lib/api-client';
import { STAGES } from '@/lib/constants';
import type { Channel, Stage } from '@/lib/types';

interface Props { password: string }

interface ChannelForm {
  name: string;
  stage: Stage | '';
  description: string;
  telegram_link: string;
  channel_password: string;
}

function emptyForm(): ChannelForm {
  return { name: '', stage: '', description: '', telegram_link: '', channel_password: '' };
}
function formFromChannel(c: Channel): ChannelForm {
  return {
    name: c.name,
    stage: c.stage,
    description: c.description ?? '',
    telegram_link: c.telegram_link,
    channel_password: c.channel_password ?? '',
  };
}
function isFormValid(f: ChannelForm): boolean {
  return f.name.trim() !== '' && f.stage !== '' && f.telegram_link.trim() !== '';
}
function generateChannelPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function IconChat() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.show('فشل النسخ — يرجى النسخ يدوياً', 'error');
    }
  }
  return (
    <Button type="button" variant="secondary" size="xs" onClick={handleCopy} icon={<IconCopy />}>
      {copied ? 'تم' : 'نسخ'}
    </Button>
  );
}

function PasswordField({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={200}
        className="min-w-[160px] flex-1 font-mono"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(generateChannelPassword())}
        icon={<IconSparkles />}
      >
        توليد
      </Button>
      {value && <CopyButton value={value} />}
    </div>
  );
}

export function ChannelsSection({ password }: Props) {
  const toast = useToast();
  const confirm = useConfirm();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newForm, setNewForm] = useState<ChannelForm>(emptyForm());
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ChannelForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postJson<{ channels: Channel[] }>('/api/admin/channels', { password, action: 'list' });
      setChannels(data.channels ?? []);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل تحميل القنوات', 'error');
      setChannels([]);
    } finally { setLoading(false); }
  }, [password, toast]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid(newForm)) return;
    setAdding(true);
    try {
      await postJson('/api/admin/channels', {
        password, action: 'add',
        name: newForm.name.trim(),
        stage: newForm.stage,
        description: newForm.description.trim() || null,
        telegram_link: newForm.telegram_link.trim(),
        channel_password: newForm.channel_password.trim() || null,
      });
      setNewForm(emptyForm());
      toast.show('تمت إضافة القناة', 'success');
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الإضافة', 'error');
    } finally { setAdding(false); }
  }

  function startEdit(c: Channel) { setEditingId(c.id); setEditForm(formFromChannel(c)); }
  function cancelEdit() { setEditingId(null); setEditForm(emptyForm()); }

  async function saveEdit(id: string) {
    if (!isFormValid(editForm)) return;
    setSaving(true);
    try {
      await postJson('/api/admin/channels', {
        password, action: 'edit', id,
        name: editForm.name.trim(),
        stage: editForm.stage,
        description: editForm.description.trim() || null,
        telegram_link: editForm.telegram_link.trim(),
        channel_password: editForm.channel_password.trim() || null,
      });
      cancelEdit();
      toast.show('تم الحفظ', 'success');
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally { setSaving(false); }
  }

  async function handleDelete(c: Channel) {
    const ok = await confirm(`حذف القناة «${c.name}» نهائياً. هل أنت متأكد؟`, { variant: 'danger', confirmLabel: 'حذف' });
    if (!ok) return;
    try {
      await postJson('/api/admin/channels', { password, action: 'delete', id: c.id });
      toast.show('تم الحذف', 'success');
      load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحذف', 'error');
    }
  }

  return (
    <section>
      <form
        onSubmit={handleAdd}
        className="mb-5 space-y-3 rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        <div className="flex flex-wrap gap-2">
          <Input
            type="text"
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            placeholder="اسم القناة"
            required
            maxLength={200}
            className="min-w-[200px] flex-1"
          />
          <Select
            value={newForm.stage}
            onChange={(e) => setNewForm({ ...newForm, stage: e.target.value as Stage | '' })}
            required
            className="w-44"
            aria-label="المرحلة"
          >
            <option value="">اختر المرحلة</option>
            {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
          </Select>
        </div>
        <Input
          type="text"
          value={newForm.description}
          onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
          placeholder="وصف قصير (اختياري)"
          maxLength={1000}
        />
        <Input
          type="url"
          value={newForm.telegram_link}
          onChange={(e) => setNewForm({ ...newForm, telegram_link: e.target.value })}
          placeholder="رابط تلغرام (https://t.me/channelname)"
          required
          maxLength={500}
        />
        <PasswordField
          value={newForm.channel_password}
          onChange={(v) => setNewForm({ ...newForm, channel_password: v })}
          placeholder="كلمة مرور القناة"
        />
        <Button type="submit" loading={adding} disabled={!isFormValid(newForm)}>إضافة قناة</Button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />)}
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-3xl border border-line bg-white/80 p-12 text-center backdrop-blur-sm dark:bg-paper/80">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/8 text-teal">
            <IconChat />
          </div>
          <p className="mt-4 font-bold text-ink/70">لا توجد قنوات مضافة حالياً.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((c) => {
            const isEditing = editingId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-line bg-white/80 p-4 shadow-[0_1px_3px_rgba(26,33,31,0.03)] backdrop-blur-sm transition-all duration-200 hover:border-teal/20 dark:bg-paper/80 dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.30)]"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        maxLength={200}
                        className="min-w-[180px] flex-1"
                        autoFocus
                      />
                      <Select
                        value={editForm.stage}
                        onChange={(e) => setEditForm({ ...editForm, stage: e.target.value as Stage | '' })}
                        className="w-44"
                        aria-label="المرحلة"
                      >
                        {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </Select>
                    </div>
                    <Input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="الوصف"
                      maxLength={1000}
                    />
                    <Input
                      type="url"
                      value={editForm.telegram_link}
                      onChange={(e) => setEditForm({ ...editForm, telegram_link: e.target.value })}
                      placeholder="رابط تلغرام"
                      maxLength={500}
                    />
                    <PasswordField
                      value={editForm.channel_password}
                      onChange={(v) => setEditForm({ ...editForm, channel_password: v })}
                      placeholder="كلمة مرور القناة"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(c.id)} loading={saving} disabled={!isFormValid(editForm)}>حفظ</Button>
                      <Button size="sm" variant="secondary" onClick={cancelEdit} disabled={saving}>إلغاء</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-bold text-ink">{c.name}</span>
                        <span className="rounded-full bg-teal/8 px-2 py-0.5 font-mono text-xs text-teal/70 dark:bg-teal/15 dark:text-teal">
                          {c.stage}
                        </span>
                      </div>
                      {c.description && (
                        <p className="mt-1 text-sm text-ink/55">{c.description}</p>
                      )}
                      <a
                        href={c.telegram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block break-all text-sm font-medium text-teal underline decoration-teal/40 underline-offset-4 hover:text-teal/80"
                      >
                        {c.telegram_link}
                      </a>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-ink/50">كلمة المرور:</span>
                        <code className="rounded-md bg-ink/5 px-2 py-0.5 font-mono text-ink/80 dark:bg-white/10 dark:text-ink/90">
                          {c.channel_password || 'غير محددة'}
                        </code>
                        {c.channel_password && <CopyButton value={c.channel_password} />}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(c)} icon={<IconEdit />}>
                        تعديل
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(c)} icon={<IconTrash />}>
                        حذف
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}