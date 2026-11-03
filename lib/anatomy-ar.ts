// lib/anatomy-ar.ts
import type { ZoomId } from './anatomy-data';
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
  scm: 'تدير الرأس نحو الجهة المقابلة وتُميله نحو نفس الكتف؛ والعضلتان معاً تثنيان الرقبة، وتساعدان في الشهيق.',
  trapezius: 'تثبّت لوح الكتف وتحرّكه (رفع، تقريب، تدوير)؛ والألياف العلوية ترفع الكتف.',
  digastric: 'تفتح الفم بخفض الفك السفلي، وترفع العظم اللامي (البطن الأمامي V3، والخلفي VII).',
  stylohyoid: 'تسحب العظم اللامي للأعلى والخلف أثناء البلع.',
  mylohyoid: 'ترفع قاع الفم والعظم اللامي (تُشكّل حجاب الفم diaphragma oris).',
  geniohyoid: 'تسحب العظم اللامي للأمام والأعلى، أو تخفض الفك إذا ثُبّت العظم اللامي.',
  omohyoid: 'تخفض العظم اللامي وتثبّته (بطنان يصل بينهما وتر وسطي).',
  sternohyoid: 'تخفض العظم اللامي بعد البلع.',
  thyrohyoid: 'تخفض العظم اللامي، وإذا ثُبّت رفعت الحنجرة.',
  sternothyroid: 'تسحب الغضروف الدرقي (الحنجرة) للأسفل.',
  spleniusCapitis: 'العضلتان معاً تسحبان الرأس للخلف، وكل واحدة تدير الرأس وتميله لنفس الجهة.',
  levatorScapulae: 'ترفع لوح الكتف.',
  scalenePost: 'ترفع الضلع الثاني.',
  scaleneMid: 'ترفع الضلع الأول.',
  scaleneAnt: 'ترفع الضلع الأول، وتثني الرقبة جانبياً.',
  rcAnterior: 'تثني الرأس عند المفصل القذالي الحاملي.',
  rcLateralis: 'تثني الرأس جانبياً نحو نفس الجهة.',
  longusCapitis: 'تثني الرأس.',
  longusColli: 'تثني الرقبة للأمام وللجانب مع دوران خفيف نحو الجهة المقابلة.',
};

export const PEARLS_AR: Readonly<Record<string, string>> = {
  buccinator:
    'فخ امتحاني: عضلة تعبير (الوجهي – الفرع الشدقي) وليست عضلة مضغ رغم دورها في المضغ. الـ long buccal nerve (فرع V3) يخترقها حسّياً فقط ولا يغذّيها حركياً.',
  platysma:
    'عضلة في الرقبة لكنها تُغذّى بالوجهي (الفرع العنقي)، لأنها من القوس البلعومي الثاني.',
  scm:
    'تقسم الرقبة إلى مثلث أمامي وخلفي. العصب المساعد (CN XI) يغذّيها حركياً، وأعصاب الضفيرة العنقية (C2, C3) تنقل الإحساس العميق فقط.',
  trapezius:
    'العصب المساعد يعبر المثلث الخلفي سطحياً، لذلك يتأذى في خزعات العقد الليمفاوية هناك فيسقط الكتف ويضعف رفعه.',
  digastric:
    'عضلة مختلطة المنشأ: البطن الأمامي من القوس الأول (V3) والبطن الخلفي من القوس الثاني (VII).',
  mylohyoid:
    'يغذّيها فرع من العصب السنخي السفلي (V3) لأنها من القوس البلعومي الأول، وهي ليست من عضلات المضغ وتشكّل أرضية الفم.',
  geniohyoid:
    'ألياف C1 تسير مع العصب تحت اللسان فقط (XII) ولا تغذّيها منه.',
  thyrohyoid:
    'الوحيدة بين العضلات الشريطية التي لا تغذّيها الـ ansa cervicalis (ألياف C1 مع XII).',
  sternothyroid:
    'التصاقها بالخط المائل للغضروف الدرقي يمنع تضخّم الدرقية من الامتداد للأعلى.',
  scaleneAnt:
    'العصب الحجابي يمر على سطحها الأمامي، والضفيرة العضدية تمر بين الأمامية والوسطى (interscalene) — موضع حقن التخدير ومتلازمة المخرج الصدري.',
  scaleneMid:
    'جذوع الضفيرة العضدية تمر أمامها (بين الأمامية والوسطى).',
  longusColli:
    'الجذع الودّي العنقي يستلقي على سطحها الأمامي خلف غمد السُّباتي.',
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
  /** تقريب الكاميرا عند اختيار الحركة (الافتراضي: الوجه كامل) */
  zoom?: ZoomId;
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
  {
    id: 'headTurn',
    ar: 'دوران الرأس',
    en: 'Head rotation',
    zoom: 'neck',
    muscles: [{ id: 'scm' }, { id: 'spleniusCapitis' }],
    extra: { turn: -0.9, tilt: 0.2 },
    note: 'عند دوران الوجه إلى اليسار (في الصورة) تنقبض الـ SCM على اليمين (الجهة المقابلة) والـ splenius capitis على اليسار (نفس الجهة). الرسم يُظهر الجهة اليمنى فقط.',
    noteEn:
      'Turning the face to one side contracts the opposite sternocleidomastoid and the same-side splenius capitis. Only the right side of the image is drawn.',
  },
  {
    id: 'headFlex',
    ar: 'ثني الرقبة',
    en: 'Neck flexion',
    zoom: 'throat',
    muscles: [{ id: 'scm' }, { id: 'longusColli' }, { id: 'longusCapitis' }, { id: 'rcAnterior', w: 0.7 }],
    note: 'الـ SCM من الجهتين مع عضلات ما أمام الفقرات (longus colli و longus capitis) تثني الرأس والرقبة للأمام.',
    noteEn:
      'Both sternocleidomastoids act with the prevertebral muscles (longus colli, longus capitis) to flex the head and neck.',
  },
  {
    id: 'lateralFlex',
    ar: 'الميلان الجانبي',
    en: 'Lateral flexion',
    zoom: 'posterior',
    muscles: [{ id: 'scaleneAnt' }, { id: 'scaleneMid' }, { id: 'scalenePost' }, { id: 'scm', w: 0.7 }, { id: 'rcLateralis', w: 0.6 }],
    note: 'العضلات الأخمعية (scalenes) والـ SCM والـ rectus capitis lateralis تُميل الرأس نحو نفس الكتف.',
    noteEn:
      'The scalenes, sternocleidomastoid and rectus capitis lateralis tilt the head toward the same shoulder.',
  },
  {
    id: 'shrug',
    ar: 'رفع الكتفين',
    en: 'Shoulder shrug',
    zoom: 'posterior',
    muscles: [{ id: 'trapezius' }, { id: 'levatorScapulae' }],
    note: 'الألياف العلوية للـ trapezius والـ levator scapulae ترفعان لوح الكتف. العصب المساعد (XI) يغذّي الأولى، والعصب الكتفي الظهري (dorsal scapular) الثانية.',
    noteEn:
      'The upper trapezius and levator scapulae elevate the scapula. The first is supplied by the accessory nerve, the second by C3, C4 and the dorsal scapular nerve.',
  },
  {
    id: 'swallow',
    ar: 'البلع (رفع العظم اللامي)',
    en: 'Hyoid elevation (swallowing)',
    zoom: 'throat',
    muscles: [{ id: 'mylohyoid' }, { id: 'geniohyoid' }, { id: 'stylohyoid' }, { id: 'digastric', w: 0.8 }],
    extra: { hy: 1 },
    note: 'العضلات فوق العظم اللامي ترفعه وتسحبه للأمام أثناء البلع، ثم تعيده العضلات تحت اللامي إلى مكانه (sternohyoid و omohyoid).',
    noteEn:
      'The suprahyoid muscles elevate and pull the hyoid forward during swallowing; the infrahyoid (strap) muscles then depress it again.',
  },
];
