// lib/study-sounds.ts
/**
 * أصوات جلسة الدراسة — أربع فئات:
 *  🌧️ أصوات هادئة (loop)
 *  📖 قرآن كريم (بدون loop)
 *  🎙️ أدعية وقصائد (بدون loop)
 *  🎵 أخرى (بدون loop)
 *
 * ⭐ لإضافة صوت:
 *  1. ارفع الملف إلى /public/sounds/ (أو Supabase Storage للملفات الكبيرة)
 *  2. أضف سطراً في CUSTOM_SOUNDS أدناه
 *  3. الطالب سيراه تلقائياً في الفئة المناسبة
 */

export type SoundCategory = 'ambient' | 'quran' | 'recitation' | 'other';

export interface AmbientSound {
  id: string;
  label: string;
  emoji: string;
  source: string; // '/sounds/x.mp3' أو 'https://...'
  category: SoundCategory;
  /** true = يشتغل بلا توقف (للأصوات الهادئة) */
  loop: boolean;
}

// ==================== Meta ====================
export const SOUND_CATEGORY_META: Record<
  SoundCategory,
  { label: string; emoji: string }
> = {
  ambient: { label: 'أصوات هادئة', emoji: '🌧️' },
  quran: { label: 'قرآن كريم', emoji: '📖' },
  recitation: { label: 'أدعية وقصائد', emoji: '🎙️' },
  other: { label: 'متنوّع', emoji: '🎵' },
};

// ==================== Ambient (loop) ====================
export const AMBIENT_SOUNDS: readonly AmbientSound[] = [
  {
    id: 'rain',
    label: 'مطر',
    emoji: '🌧️',
    source: '/sounds/rain.mp3',
    category: 'ambient',
    loop: true,
  },
  {
    id: 'waves',
    label: 'موج',
    emoji: '🌊',
    source: '/sounds/waves.mp3',
    category: 'ambient',
    loop: true,
  },
  {
    id: 'forest',
    label: 'غابة',
    emoji: '🌲',
    source: '/sounds/forest.mp3',
    category: 'ambient',
    loop: true,
  },
  {
    id: 'cafe',
    label: 'مقهى',
    emoji: '☕',
    source: '/sounds/cafe.mp3',
    category: 'ambient',
    loop: true,
  },
  {
    id: 'fireplace',
    label: 'مدفأة',
    emoji: '🔥',
    source: '/sounds/fireplace.mp3',
    category: 'ambient',
    loop: true,
  },
  {
    id: 'wind',
    label: 'ريح',
    emoji: '🍃',
    source: '/sounds/wind.mp3',
    category: 'ambient',
    loop: true,
  },
  {
    id: 'night',
    label: 'ليل',
    emoji: '🌙',
    source: '/sounds/night.mp3',
    category: 'ambient',
    loop: true,
  },
  {
    id: 'white_noise',
    label: 'ضجيج أبيض',
    emoji: '📻',
    source: '/sounds/white-noise.mp3',
    category: 'ambient',
    loop: true,
  },
  {
    id: 'brown_noise',
    label: 'ضجيج بني',
    emoji: '🟤',
    source: '/sounds/brown-noise.mp3',
    category: 'ambient',
    loop: true,
  },
];

// ==================== Custom (ملفاتك — القرآن والأدعية) ====================
/**
 * ⭐ فعّل الأسطر بحذف // بعد رفع الملفات.
 * كل مثال يوضح الاسم المتوقع للملف في المجلد.
 *
 * القرآن → public/sounds/quran/
 * الأدعية → public/sounds/dua/
 */
export const CUSTOM_SOUNDS: readonly AmbientSound[] = [
  // ═══════════ 📖 قرآن كريم ═══════════
  {
    id: 'quran_yasin',
    label: 'سورة يس',
    emoji: '📖',
    source:
      'https://kwcutxqzyyrqlijavrgh.supabase.co/storage/v1/object/public/sounds/quran/yasin.mp3',
    category: 'quran',
    loop: false,
  },
  {
    id: 'quran_taha',
    label: 'سورة طه',
    emoji: '📖',
    source:
      'https://kwcutxqzyyrqlijavrgh.supabase.co/storage/v1/object/public/sounds/quran/taha.mp3',
    category: 'quran',
    loop: false,
  },
  {
    id: 'quran_yosf',
    label: 'سورة يوسف',
    emoji: '📖',
    source:
      'https://kwcutxqzyyrqlijavrgh.supabase.co/storage/v1/object/public/sounds/quran/yosf.mp3',
    category: 'quran',
    loop: false,
  },

  // ═══════════ 🤲 أدعية ═══════════
  {
    id: 'dua_ashor',
    label: 'زيارة عاشوراء',
    emoji: '🤲',
    source:
      'https://kwcutxqzyyrqlijavrgh.supabase.co/storage/v1/object/public/sounds/dua/ashor.mp3',
    category: 'recitation',
    loop: false,
  },
  {
    id: 'dua_tawassul',
    label: 'دعاء التوسل',
    emoji: '🤲',
    source:
      'https://kwcutxqzyyrqlijavrgh.supabase.co/storage/v1/object/public/sounds/dua/tawassul.mp3',
    category: 'recitation',
    loop: false,
  },
  {
    id: 'dua_nudba',
    label: 'دعاء الندبة',
    emoji: '🤲',
    source:
      'https://kwcutxqzyyrqlijavrgh.supabase.co/storage/v1/object/public/sounds/dua/nudba.mp3',
    category: 'recitation',
    loop: false,
  },
];

// ==================== Aggregate ====================
export const ALL_SOUNDS: readonly AmbientSound[] = [
  ...AMBIENT_SOUNDS,
  ...CUSTOM_SOUNDS,
];

export function soundsByCategory(cat: SoundCategory): AmbientSound[] {
  return ALL_SOUNDS.filter((s) => s.category === cat);
}

export function getAvailableCategories(): SoundCategory[] {
  const order: SoundCategory[] = ['ambient', 'quran', 'recitation', 'other'];
  return order.filter((cat) => soundsByCategory(cat).length > 0);
}

export function findSound(id: string): AmbientSound | null {
  return ALL_SOUNDS.find((s) => s.id === id) ?? null;
}

export const ALERT_SOUND = '/sounds/alert.mp3';