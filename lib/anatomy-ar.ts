// lib/anatomy-ar.ts
import type { Pose } from './anatomy-pose';

export const ACTION_AR: Readonly<Record<string, string>> = {
  platysma: 'تشدّ جلد الرقبة وتسحب الشفة السفلى والفك للأسفل (تظهر كشرائط عند الجهد أو التكشير).',
  masseter: 'ترفع الفك السفلي (إغلاق الفم) — عضلة مضغ رئيسية.',
  temporalis: 'ترفع الفك السفلي، وأليافها الخلفية تسحبه للخلف — عضلة مضغ.',
  frontalis: 'ترفع الحاجبين وتُجعّد الجبين أفقياً (الدهشة).',
  buccinator: 'تضغط الخد على الأسنان فتُبقي الطعام بينها أثناء المضغ، وتُستعمل في النفخ والمصّ.',
  orbOris: 'تُغلق الشفتين وتضمّهما (التقبيل، الصفير، الكلام).',
  orbOculi: 'تُغلق الجفون: الجزء الجفني للرمش الخفيف، والجزء الحجاجي للإغماض القوي.',
  nasalis: 'الجزء المستعرض يضغط فتحتي الأنف، والجزء الجناحي يوسّعهما.',
  llsan: 'ترفع الشفة العليا وتوسّع فتحة الأنف (تعبير الاشمئزاز).',
  lls: 'ترفع الشفة العليا وتعمّق الثلم الأنفي الشفوي (nasolabial fold).',
  zmin: 'ترفع الشفة العليا وتساهم في الثلم الأنفي الشفوي.',
  zmaj: 'تسحب زاوية الفم للأعلى والخارج (الابتسام).',
  lao: 'ترفع زاوية الفم (تساعد على الابتسام).',
  risorius: 'تسحب زاوية الفم للخارج (التكشير / الابتسامة العريضة).',
  dao: 'تخفض زاوية الفم (العبوس، الحزن).',
  dli: 'تخفض الشفة السفلى وتسحبها قليلاً للجانب.',
  mentalis: 'ترفع الشفة السفلى وتبرزها وتُجعّد جلد الذقن (التذمّر، الشك).',
  corrugator: 'تسحب الحاجبين للداخل والأسفل فتُحدث خطوط العبوس العمودية.',
  procerus: 'تسحب الطرف الإنسي للحاجبين للأسفل فتُحدث تجاعيد مستعرضة فوق جسر الأنف.',
  depSepti: 'تسحب حاجز الأنف وطرفه للأسفل وتوسّع فتحتي الأنف.',
};

export const PEARLS_AR: Readonly<Record<string, string>> = {
  buccinator:
    'فخ امتحاني: عضلة تعبير (الوجهي – الفرع الشدقي) وليست عضلة مضغ رغم دورها في المضغ. الـ long buccal nerve (فرع V3) يخترقها حسّياً فقط ولا يغذّيها حركياً.',
  platysma:
    'عضلة في الرقبة لكنها تُغذّى بالوجهي (الفرع العنقي)، لأنها من القوس البلعومي الثاني.',
  frontalis:
    'الجبين محفوظ في شلل الـ UMN لأن القشرة تغذّي الوجه العلوي من الجهتين، ويُشلّ في شلل الـ LMN (مثل Bell’s palsy).',
  orbOculi:
    'في Bell’s palsy تعجز العين عن الإغلاق (lagophthalmos) فيجفّ القرنية وقد تتقرّح؛ تحتاج حماية بالقطرة والغطاء.',
  masseter:
    'عضلة مضغ تغذّيها V3 وليس الوجهي؛ تشنّجها يسبب trismus.',
  mentalis:
    'تغذّيها marginal mandibular branch — أكثر فروع الوجهي عرضة للأذى في جراحات الفك السفلي والغدة تحت الفك.',
};

export interface Expression {
  id: string;
  ar: string;
  en: string;
  muscles: readonly { id: string; w?: number }[];
  extra?: Pose;
  /** ملاحظة عربية (تظهر بخط أصغر بعد الإنجليزية) */
  note: string;
  /** ملاحظة إنجليزية (تظهر أولاً — الإنجليزية أوضح) */
  noteEn?: string;
}

export const EXPRESSIONS: readonly Expression[] = [
  {
    id: 'smile',
    ar: 'ابتسامة',
    en: 'Smile',
    muscles: [{ id: 'zmaj' }, { id: 'lao', w: 0.6 }, { id: 'zmin', w: 0.6 }, { id: 'orbOculi', w: 0.35 }],
    note: 'في الابتسامة الحقيقية (Duchenne) تشارك الـ orbicularis oculi أيضاً فتتجعّد زوايا العينين.',
    noteEn:
      'In a genuine (Duchenne) smile, the orbicularis oculi also contracts, creasing the corners of the eyes.',
  },
  {
    id: 'frown',
    ar: 'عبوس / تركيز',
    en: 'Frown',
    muscles: [{ id: 'corrugator' }, { id: 'procerus' }, { id: 'dao', w: 0.6 }],
    note: 'الـ corrugator والـ procerus يُنزلان الحاجبين ويقرّبانهم، والـ depressor anguli oris يخفض زاويتي الفم.',
    noteEn:
      'The corrugator and procerus pull the brows down and inward, while depressor anguli oris depresses the corners of the mouth.',
  },
  {
    id: 'surprise',
    ar: 'دهشة',
    en: 'Surprise',
    muscles: [{ id: 'frontalis' }],
    extra: { eye: -0.35, jaw: 0.55 },
    note: 'الـ frontalis يرفع الحاجبين. ويشارك في فتح العين على اتساعها الـ levator palpebrae superioris (CN III) وهي ليست عضلة وجه، وانخفاض الفك ليس من عضلات هذا الأطلس.',
    noteEn:
      'Frontalis raises the eyebrows. Widening the eye also involves the levator palpebrae superioris (CN III), which is not a facial muscle; jaw opening is also not shown here.',
  },
  {
    id: 'sadness',
    ar: 'حزن',
    en: 'Sadness',
    muscles: [{ id: 'dao' }, { id: 'mentalis', w: 0.8 }, { id: 'corrugator', w: 0.5 }],
    note: 'الـ depressor anguli oris والـ mentalis يخفضان زاويتي الفم ويرفعان الشفة السفلى، مع شدّ الحاجبين للداخل. الرسم تقريبي.',
    noteEn:
      'Depressor anguli oris and mentalis depress the mouth corners and raise the lower lip, while the brows pull inward. The drawing is approximate.',
  },
  {
    id: 'disgust',
    ar: 'اشمئزاز',
    en: 'Disgust',
    muscles: [{ id: 'llsan' }, { id: 'lls' }, { id: 'procerus', w: 0.7 }],
    note: 'الـ levator labii superioris alaeque nasi والـ levator labii superioris يرفعان الشفة العليا والأنف، والـ procerus يُجعّد جسر الأنف.',
    noteEn:
      'Levator labii superioris alaeque nasi and levator labii superioris raise the upper lip and dilate the nose, while procerus creases the bridge of the nose.',
  },
];