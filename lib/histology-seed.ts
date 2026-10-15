// lib/histology-seed.ts
/**
 * بيانات البذرة لأنواع الأنسجة الأساسية
 * تُستخدم لزرع الجداول عند أول تشغيل أو للعرض في حال عدم الاتصال
 */

export interface HistologyCategorySeed {
  slug: string;
  name_ar: string;
  name_en: string;
  description: string;
  icon_emoji: string;
  display_order: number;
}

export const HISTOLOGY_CATEGORIES: HistologyCategorySeed[] = [
  {
    slug: 'epithelial',
    name_ar: 'الأنسجة الطلائية',
    name_en: 'Epithelial Tissue',
    description:
      'الأنسجة التي تغطي الأسطح، تبطن التجاويف، وتشكّل الغدد. تتكون من خلايا متراصة مع مسافة قليلة بينها.',
    icon_emoji: '🟦',
    display_order: 1,
  },
  {
    slug: 'connective',
    name_ar: 'الأنسجة الضامة',
    name_en: 'Connective Tissue',
    description:
      'تدعم الأعضاء وتربطها. تشمل الأنسجة الرخوة، الغضاريف، العظام، الدم، والأنسجة الدهنية.',
    icon_emoji: '🟨',
    display_order: 2,
  },
  {
    slug: 'muscle',
    name_ar: 'الأنسجة العضلية',
    name_en: 'Muscle Tissue',
    description:
      'مسؤولة عن الحركة. ثلاثة أنواع: الهيكلية (إرادية)، الملساء، والقلبية (لا إرادية).',
    icon_emoji: '🟥',
    display_order: 3,
  },
  {
    slug: 'nervous',
    name_ar: 'الأنسجة العصبية',
    name_en: 'Nervous Tissue',
    description:
      'تستقبل وتنقل الإشارات. تتكوّن من العصبونات والخلايا الدبقية.',
    icon_emoji: '🟪',
    display_order: 4,
  },
];

// ═══════════════════════════════════════════════════════════
// شرائح البذرة (روابط من Bioscience Image Library — CC0)
// استبدلها بروابطك لاحقاً
// ═══════════════════════════════════════════════════════════

export interface HistologySlideSeed {
  category_slug: string;
  title_ar: string;
  title_en: string;
  description: string;
  image_url: string;
  thumbnail_url: string;
  stain: string;
  magnification: string;
  display_order: number;
}

/**
 * ⚠️ استبدل هذه الروابط بروابطك الفعلية بعد رفع الصور إلى Supabase Storage
 * أو استخدم روابط من مكتبة Bioscience Image Library (CC0) بعد تحميلها
 *
 * لأغراض التطوير فقط، استخدم الصور التجريبية أدناه
 */
export const HISTOLOGY_SLIDES: HistologySlideSeed[] = [
  // ═══ صور تجريبية للأنسجة الطلائية ═══
  {
    category_slug: 'epithelial',
    title_ar: 'نسيج طلائي حرشفي بسيط',
    title_en: 'Simple Squamous Epithelium',
    description: 'طبقة واحدة من الخلايا المسطحة — تُوجد في الأوعية الدموية والحويصلات الهوائية.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Simple_squamous_epithelium.jpg',
    thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Simple_squamous_epithelium.jpg',
    stain: 'H&E',
    magnification: '40x',
    display_order: 1,
  },
  {
    category_slug: 'epithelial',
    title_ar: 'نسيج طلائي مكعبي بسيط',
    title_en: 'Simple Cuboidal Epithelium',
    description: 'طبقة واحدة من الخلايا المكعبة — تُوجد في الأنابيب الكلوية والغدد.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Simple_cuboidal_epithelium.jpg',
    thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Simple_cuboidal_epithelium.jpg',
    stain: 'H&E',
    magnification: '40x',
    display_order: 2,
  },
  {
    category_slug: 'epithelial',
    title_ar: 'نسيج طلائي عمودي بسيط',
    title_en: 'Simple Columnar Epithelium',
    description: 'طبقة واحدة من الخلايا الأطول من عرضها — تُوجد في الأمعاء والمعدة.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Simple_columnar_epithelium.jpg',
    thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Simple_columnar_epithelium.jpg',
    stain: 'H&E',
    magnification: '40x',
    display_order: 3,
  },

  // ═══ صور تجريبية للأنسجة الضامة ═══
  {
    category_slug: 'connective',
    title_ar: 'نسيج ضام رخو',
    title_en: 'Loose Connective Tissue',
    description: 'ألياف متباعدة مع خلايا متعددة — يملأ الفراغات بين الأعضاء.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Loose_connective_tissue.jpg',
    thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Loose_connective_tissue.jpg',
    stain: 'H&E',
    magnification: '40x',
    display_order: 1,
  },
  {
    category_slug: 'connective',
    title_ar: 'نسيج ضام كثيف منتظم',
    title_en: 'Dense Regular Connective Tissue',
    description: 'ألياف كولاجينية متوازية — يُوجد في الأوتار والأربطة.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Dense_regular_connective_tissue.jpg',
    thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Dense_regular_connective_tissue.jpg',
    stain: 'H&E',
    magnification: '40x',
    display_order: 2,
  },

  // ═══ صور تجريبية للأنسجة العضلية ═══
  {
    category_slug: 'muscle',
    title_ar: 'عضلة هيكلية',
    title_en: 'Skeletal Muscle',
    description: 'ألياف عضلية طويلة متعددة الأنوية — تحت السيطرة الإرادية.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Skeletal_muscle_histology.jpg',
    thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Skeletal_muscle_histology.jpg',
    stain: 'H&E',
    magnification: '40x',
    display_order: 1,
  },
  {
    category_slug: 'muscle',
    title_ar: 'عضلة ملساء',
    title_en: 'Smooth Muscle',
    description: 'خلايا مغزلية بنواة واحدة مركزية — تُوجد في الأعضاء الداخلية.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Smooth_muscle_histology.jpg',
    thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Smooth_muscle_histology.jpg',
    stain: 'H&E',
    magnification: '40x',
    display_order: 2,
  },

  // ═══ صور تجريبية للأنسجة العصبية ═══
  {
    category_slug: 'nervous',
    title_ar: 'خلايا عصبية',
    title_en: 'Neurons',
    description: 'عصبونات بأجسام خلوية وامتدادات — تُوجد في الدماغ والحبل الشوكي.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Multipolar_neuron_histology.jpg',
    thumbnail_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Multipolar_neuron_histology.jpg',
    stain: 'Silver stain',
    magnification: '100x',
    display_order: 1,
  },
];