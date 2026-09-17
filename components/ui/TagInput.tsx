// components/ui/TagInput.tsx
'use client';

import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'أضف وسم...',
  maxTags = 10,
  suggestions = [],
}: TagInputProps) {
  const [input, setInput] = useState('');

  function addTag(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setInput('');
      return;
    }
    if (tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInput('');
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  const filteredSuggestions = suggestions
    .filter((s) => !tags.includes(s) && s.includes(input.trim()))
    .slice(0, 6);

  const reachedMax = tags.length >= maxTags;

  return (
    <div className="space-y-2">
      {/* حاوية الوسوم + الإدخال */}
      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border-2 border-line bg-white px-3 py-2 transition-all duration-200 focus-within:border-teal focus-within:shadow-[0_0_0_4px_rgba(14,74,74,0.10)]">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal transition-all duration-150"
          >
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-teal/20"
              aria-label={`حذف ${tag}`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={reachedMax}
          className="min-w-[100px] flex-1 bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {/* اقتراحات */}
      {input && filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-bold text-ink/70 transition-all duration-150 hover:border-teal hover:bg-teal/5 hover:text-teal active:scale-95"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {/* تلميح */}
      <p className="text-xs text-ink/40">
        {reachedMax
          ? `وصلت للحد الأقصى (${maxTags} وسوم)`
          : `اضغط Enter أو فاصلة لإضافة وسم — ${tags.length}/${maxTags}`}
      </p>
    </div>
  );
}