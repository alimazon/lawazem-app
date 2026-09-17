// app/channel-portal/_components/SettingsSection.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { postJson, uploadToStorage } from '@/lib/api-client';
import { STORAGE_BUCKETS } from '@/lib/constants';
import type { Channel } from '@/lib/types';

const MAX_IMAGE_SIZE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return 'png';
  return parts[parts.length - 1].toLowerCase();
}

interface Props {
  channelId: string;
  password: string;
  channelInfo: Channel;
  onPasswordChanged: (newPw: string) => void;
  onChannelInfoChanged: (patch: Partial<Channel>) => void;
}

// ==================== Icons ====================
function IconImage() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ==================== Channel Info Form ====================
function ChannelInfoForm({
  channelId, password, channelInfo, onChannelInfoChanged,
}: {
  channelId: string;
  password: string;
  channelInfo: Channel;
  onChannelInfoChanged: (patch: Partial<Channel>) => void;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState(channelInfo.description ?? '');
  const [imageUrl, setImageUrl] = useState(channelInfo.image_url ?? '');
  const [imageError, setImageError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialDescription = channelInfo.description ?? '';
  const initialImageUrl = channelInfo.image_url ?? '';
  const dirty = description !== initialDescription || imageUrl !== initialImageUrl;

  useEffect(() => {
    setDescription(channelInfo.description ?? '');
    setImageUrl(channelInfo.image_url ?? '');
    setImageError(false);
  }, [channelInfo.id, channelInfo.description, channelInfo.image_url]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.show('نوع الصورة غير مدعوم (PNG/JPG/WebP/GIF).', 'error');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.show(`حجم الصورة كبير جداً (بحد أقصى ${MAX_IMAGE_SIZE_MB} ميجا).`, 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const ext = getFileExtension(file.name);
      const filePath = `${channelId}-${Date.now()}.${ext}`;
      const publicUrl = await uploadToStorage(STORAGE_BUCKETS.channelImages, filePath, file, { upsert: true });
      setImageUrl(publicUrl);
      setImageError(false);
      toast.show('تم رفع الصورة — لا تنسَ الحفظ', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل رفع الصورة', 'error');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    try {
      await postJson('/api/channel/content', {
        action: 'update_channel',
        channel_id: channelId,
        password,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
      });
      onChannelInfoChanged({
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
      });
      toast.show('تم حفظ بيانات القناة', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  }

  function openFilePicker() { fileInputRef.current?.click(); }

  return (
    <section>
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-teal/20 bg-teal/[0.04] p-4 text-sm dark:border-teal/30 dark:bg-teal/10">
        <span className="text-teal"><IconInfo /></span>
        <p className="font-medium text-ink/70">
          الاسم والمرحلة ورابط تلغرام يديرها المشرف. يمكنك تعديل الصورة والوصف فقط.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        {/* الصورة */}
        <div>
          <label className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink/70">
            <IconImage />
            صورة القناة
          </label>

          {imageUrl && !imageError ? (
            <div className="mb-3 flex items-center gap-4">
              <img
                src={imageUrl}
                alt="صورة القناة"
                onError={() => setImageError(true)}
                className="h-20 w-20 rounded-2xl border border-line object-cover shadow-[0_2px_8px_rgba(26,33,31,0.06)]"
              />
              <Button type="button" variant="secondary" size="sm" onClick={openFilePicker} disabled={uploadingImage}>
                تغيير
              </Button>
            </div>
          ) : imageError ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              تعذّر تحميل الصورة الحالية.
              <button type="button" onClick={openFilePicker} className="mr-2 font-bold underline">
                رفع صورة جديدة
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploadingImage}
              className="group mb-3 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper/50 py-6 transition-all duration-200 hover:border-teal/40 hover:bg-teal/[0.03] disabled:opacity-60 dark:bg-white/[0.03] dark:hover:bg-teal/10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/8 text-teal transition-all group-hover:bg-teal/15">
                <IconImage />
              </span>
              <span className="text-sm font-bold text-ink/70">رفع صورة للقناة</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={handleImageUpload}
            disabled={uploadingImage}
            className="hidden"
          />

          {uploadingImage && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-teal/5 px-3 py-2 text-sm font-bold text-teal dark:bg-teal/15">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              جاري الرفع...
            </div>
          )}

          <p className="text-xs text-ink/40">
            PNG / JPG / WebP / GIF — بحد أقصى {MAX_IMAGE_SIZE_MB} ميجا
          </p>
        </div>

        {/* الوصف */}
        <div>
          <label htmlFor="channel-description" className="mb-2 block text-sm font-bold text-ink/70">
            وصف القناة
          </label>
          <Textarea
            id="channel-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر للقناة..."
            rows={3}
            maxLength={2000}
          />
        </div>

        {/* زر الحفظ */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} disabled={!dirty || uploadingImage}>
            حفظ
          </Button>
          {dirty && !saving && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
              توجد تغييرات غير محفوظة
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

// ==================== Change Password Form ====================
function ChangePasswordForm({
  channelId, password, onPasswordChanged,
}: {
  channelId: string;
  password: string;
  onPasswordChanged: (newPw: string) => void;
}) {
  const toast = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const canSubmit = newPassword.length >= 4 && newPassword === confirmNewPassword && !changing;
  const mismatch = confirmNewPassword !== '' && newPassword !== confirmNewPassword;

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setChanging(true);
    try {
      await postJson('/api/channel/content', {
        action: 'change_password',
        channel_id: channelId,
        password,
        new_password: newPassword,
      });
      onPasswordChanged(newPassword);
      setNewPassword('');
      setConfirmNewPassword('');
      toast.show('تم تغيير كلمة المرور', 'success');
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'فشل التغيير', 'error');
    } finally {
      setChanging(false);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/8 p-4 text-sm dark:bg-amber/10">
        <span className="text-amber"><IconLock /></span>
        <p className="font-medium text-ink/70">
          بعد التغيير، لن تعمل كلمة المرور القديمة. تأكد من حفظ الجديدة في مكان آمن.
        </p>
      </div>

      <form
        onSubmit={handleChange}
        className="space-y-4 rounded-3xl border border-line bg-white/80 p-5 shadow-[0_1px_3px_rgba(26,33,31,0.04)] backdrop-blur-sm dark:bg-paper/80"
      >
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-ink/70">
            كلمة المرور الجديدة
          </label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="4 أحرف على الأقل"
            autoComplete="new-password"
            minLength={4}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-ink/70">
            تأكيد كلمة المرور
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="أعد كتابتها"
            autoComplete="new-password"
            required
            aria-invalid={mismatch || undefined}
          />
          {mismatch && (
            <p className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-400" role="alert">
              كلمتا المرور غير متطابقتين.
            </p>
          )}
        </div>

        <Button type="submit" loading={changing} disabled={!canSubmit} icon={<IconLock />}>
          تغيير كلمة المرور
        </Button>
      </form>
    </section>
  );
}

// ==================== Main Section ====================
export function SettingsSection({
  channelId, password, channelInfo, onPasswordChanged, onChannelInfoChanged,
}: Props) {
  return (
    <div className="space-y-8">
      <ChannelInfoForm
        channelId={channelId}
        password={password}
        channelInfo={channelInfo}
        onChannelInfoChanged={onChannelInfoChanged}
      />
      <ChangePasswordForm
        channelId={channelId}
        password={password}
        onPasswordChanged={onPasswordChanged}
      />
    </div>
  );
}