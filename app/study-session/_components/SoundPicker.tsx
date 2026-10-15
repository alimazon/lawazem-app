// app/study-session/_components/SoundPicker.tsx
'use client';

import { useMemo, useState } from 'react';
import {
  SOUND_CATEGORY_META,
  getAvailableCategories,
  soundsByCategory,
  type SoundCategory,
} from '@/lib/study-sounds';

interface SoundPickerProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
}

export function SoundPicker({
  selectedId,
  onSelect,
  volume,
  onVolumeChange,
}: SoundPickerProps) {
  const categories = useMemo(() => getAvailableCategories(), []);
  const [activeCat, setActiveCat] = useState<SoundCategory>(
    categories[0] ?? 'ambient',
  );

  const sounds = useMemo(() => soundsByCategory(activeCat), [activeCat]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <span aria-hidden="true">🎵</span>
          صوت الخلفية
        </h2>
        {selectedId && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="rounded-field px-2 py-1 text-xs font-semibold text-coral-ink transition-colors hover:bg-coral/10"
          >
            ⏹ إيقاف
          </button>
        )}
      </div>

      {/* Tabs للفئات */}
      {categories.length > 1 && (
        <div
          role="tablist"
          className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1"
        >
          {categories.map((cat) => {
            const meta = SOUND_CATEGORY_META[cat];
            const active = activeCat === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setActiveCat(cat)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-chip px-3 py-1.5 text-xs font-bold transition-all duration-200 motion-reduce:transition-none ${
                  active
                    ? 'bg-teal text-on-teal'
                    : 'bg-paper-deep text-ink-soft hover:bg-teal-tint hover:text-teal'
                }`}
              >
                <span aria-hidden="true">{meta.emoji}</span>
                <span className="whitespace-nowrap">{meta.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* أصوات الفئة */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {sounds.map((sound) => {
          const active = selectedId === sound.id;
          return (
            <button
              key={sound.id}
              type="button"
              onClick={() => onSelect(active ? null : sound.id)}
              aria-pressed={active}
              aria-label={`${sound.label}${active ? ' — يعمل الآن' : ''}`}
              className={`relative flex flex-col items-center gap-1 rounded-field border px-1.5 py-3 text-[11px] font-bold transition-all duration-200 motion-reduce:transition-none ${
                active
                  ? 'border-teal bg-teal-tint text-teal'
                  : 'border-line bg-paper-soft text-ink-soft hover:border-teal/40 hover:bg-teal-tint/40'
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute end-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-teal motion-reduce:animate-none"
                />
              )}
              <span className="text-2xl leading-none" aria-hidden="true">
                {sound.emoji}
              </span>
              <span className="truncate text-center leading-tight">
                {sound.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* مستوى الصوت */}
      {selectedId && (
        <div className="space-y-2 border-t border-line-soft pt-3">
          <label
            htmlFor="sound-volume"
            className="flex items-center justify-between text-xs font-bold text-ink-muted"
          >
            <span>مستوى الصوت</span>
            <span className="num-inline font-mono">
              {Math.round(volume * 100)}%
            </span>
          </label>
          <input
            id="sound-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            dir="ltr"
            className="w-full accent-teal"
          />
        </div>
      )}
    </div>
  );
}