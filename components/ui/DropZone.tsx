// components/ui/DropZone.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

interface DropZoneProps {
  onFileSelected: (file: File) => void | Promise<void>;
  accept?: Record<string, string[]>;
  maxSizeMB?: number;
  uploading?: boolean;
  disabled?: boolean;
}

const DEFAULT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
};

export function DropZone({
  onFileSelected,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 50,
  uploading = false,
  disabled = false,
}: DropZoneProps) {
  const [error, setError] = useState('');

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError('');

      if (rejectedFiles.length > 0) {
        const reason = rejectedFiles[0].errors[0]?.code;
        if (reason === 'file-too-large') {
          setError(`حجم الملف كبير جداً (بحد أقصى ${maxSizeMB} ميجا)`);
        } else if (reason === 'file-invalid-type') {
          setError('نوع الملف غير مدعوم');
        } else if (reason === 'too-many-files') {
          setError('اختر ملفاً واحداً فقط');
        } else {
          setError('فشل اختيار الملف');
        }
        return;
      }

      if (acceptedFiles[0]) {
        try {
          await onFileSelected(acceptedFiles[0]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'فشل رفع الملف');
        }
      }
    },
    [onFileSelected, maxSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    disabled: uploading || disabled,
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
          isDragActive
            ? 'border-teal bg-teal/5 dark:bg-teal/10'
            : 'border-line bg-paper/50 hover:border-teal/40 hover:bg-teal/[0.03] dark:bg-paper-deep/40 dark:hover:bg-teal/5'
        } ${uploading ? 'cursor-wait opacity-60' : ''} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input {...getInputProps()} />

        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
            isDragActive ? 'bg-teal/15 text-teal' : 'bg-teal/8 text-teal'
          }`}
        >
          {uploading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : isDragActive ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
        </span>

        <div>
          <p className="text-sm font-bold text-ink/80">
            {uploading
              ? 'جاري الرفع...'
              : isDragActive
              ? 'أفلت الملف هنا'
              : 'اسحب الملف هنا أو اضغط للاختيار'}
          </p>
          <p className="mt-1 text-xs text-ink/50">
            PDF, Word, PowerPoint, صور — بحد أقصى {maxSizeMB} ميجا
          </p>
        </div>
      </div>

      {error && (
        <p
          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}