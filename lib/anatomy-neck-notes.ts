// lib/anatomy-neck-notes.ts
/**
 * محتوى ملزمة «Anatomy of the Neck» (Dr. Munqith Mazin، كلية الطب، جامعة العميد).
 * النص الإنجليزي مأخوذ من الملزمة؛ الملخّص العربي للتسهيل فقط.
 */

export interface NeckTopic {
  id: string;
  en: string;
  ar: string;
  /** نقاط إنجليزية من الملزمة */
  points: readonly string[];
  /** ملخص عربي قصير */
  gist: string;
}

export const NECK_OBJECTIVES: readonly string[] = [
  'Define the neck and list its boundaries.',
  'Classify the fascial compartments of the neck.',
  'Describe the cervical fascia.',
  'Demonstrate the superficial cervical veins.',
  'Illustrate the cervical triangles.',
  'Describe the muscles of the neck.',
];

export const NECK_TOPICS: readonly NeckTopic[] = [
  {
    id: 'boundaries',
    en: 'The neck and its boundaries',
    ar: 'الرقبة وحدودها',
    points: [
      'The neck is a tube providing continuity from the head to the trunk.',
      'It extends anteriorly from the lower border of the mandible to the upper surface of the manubrium of sternum.',
      'Posteriorly it extends from the superior nuchal line on the occipital bone of the skull to the intervertebral disc between the C7 and T1 vertebrae.',
    ],
    gist: 'أنبوب يصل الرأس بالجذع: من الحافة السفلى للفك إلى أعلى مقبض القص أمامياً، ومن الخط القفوي العلوي إلى القرص بين C7 وT1 خلفياً.',
  },
  {
    id: 'compartments',
    en: 'Compartments of the neck',
    ar: 'حجرات الرقبة',
    points: [
      'Visceral compartment: anterior; contains parts of the digestive and respiratory systems, and several endocrine glands.',
      'Vertebral compartment: posterior; contains the cervical vertebrae, spinal cord, cervical nerves, and muscles associated with the vertebral column.',
      'Two vascular compartments: lateral; contain the major blood vessels and the vagus nerve.',
    ],
    gist: 'أربع حجرات: حشوية أمامية، وفقرية خلفية، ووعائيتان جانبيتان.',
  },
  {
    id: 'fascia',
    en: 'Fascia of the neck',
    ar: 'لفافة الرقبة',
    points: [
      'The superficial fascia in the neck contains a thin sheet of muscle (Platysma).',
      'Investing layer: completely surrounds the neck. Attaches posteriorly to the ligamentum nuchae and the spinous process of C7; anteriorly surrounds the infrahyoid muscles; superiorly to the external occipital protuberance and superior nuchal line; laterally to the mastoid process and zygomatic arch; inferiorly to the spine of the scapula, the acromion, the clavicle, and the manubrium of sternum.',
      'Prevertebral layer: a cylindrical layer surrounding the vertebral column and its muscles (prevertebral muscles, scalenes, deep muscles of the back). Attaches superiorly to the base of the skull and extends inferolaterally to surround the brachial plexus and subclavian artery as the axillary sheath.',
      'Pretracheal layer: surrounds the trachea, esophagus, and thyroid gland. Begins superiorly at the hyoid bone and ends inferiorly in the upper thoracic cavity.',
      'Carotid sheath: a column of fascia surrounding the common carotid artery, the internal carotid artery, the internal jugular vein, and the vagus nerve.',
    ],
    gist: 'السطحية فيها الـ platysma. العميقة أربع طبقات: investing وprevertebral وpretracheal وcarotid sheath.',
  },
  {
    id: 'veins',
    en: 'Superficial venous drainage',
    ar: 'الأوردة السطحية',
    points: [
      'External jugular vein: formed posterior to the angle of the mandible as the posterior auricular vein and the retromandibular vein join.',
      'Anterior jugular veins: paired venous channels draining the anterior aspect of the neck. They begin above the hyoid bone and extend downward on either side of the midline.',
      'Both veins pierce the investing layer of cervical fascia to enter the subclavian vein inferiorly.',
    ],
    gist: 'الوريد الوداجي الخارجي ينشأ من التقاء الأذني الخلفي والخلف-فكي، والأمامي يبدأ فوق العظم اللامي. كلاهما يخترق الطبقة المغلِّفة ويصب في تحت الترقوة.',
  },
  {
    id: 'muscles',
    en: 'Muscles of the neck',
    ar: 'عضلات الرقبة',
    points: [
      'The muscles of the neck are responsible for head movements, stabilizing the upper region of the body, assisting in swallowing, helping to elevate the rib cage during inhalation, and more.',
    ],
    gist: 'تحرّك الرأس، وتثبّت الجزء العلوي من الجسم، وتساعد في البلع، وترفع القفص الصدري أثناء الشهيق.',
  },
];

export interface Triangle {
  id: string;
  en: string;
  ar: string;
  parent: 'anterior' | 'posterior';
  boundaries: string;
  contents: readonly string[];
  /** العضلات التي تُظهَر في الأطلس عند اختيار المثلث */
  muscles: readonly string[];
}

export const TRIANGLES: readonly Triangle[] = [
  {
    id: 'anterior',
    en: 'Anterior triangle',
    ar: 'المثلث الأمامي',
    parent: 'anterior',
    boundaries: 'Sternocleidomastoid, inferior border of mandible and midline of the neck.',
    contents: ['Submental, submandibular, carotid and muscular triangles'],
    muscles: ['scm', 'digastric', 'stylohyoid', 'mylohyoid', 'geniohyoid', 'omohyoid', 'sternohyoid', 'thyrohyoid', 'sternothyroid'],
  },
  {
    id: 'submental',
    en: 'Submental triangle',
    ar: 'المثلث الذقني',
    parent: 'anterior',
    boundaries: 'Outlined by the hyoid bone inferiorly, the anterior belly of the digastric muscle laterally, and the midline.',
    contents: ['Submental lymph nodes', 'Anterior jugular veins'],
    muscles: ['digastric', 'mylohyoid', 'geniohyoid'],
  },
  {
    id: 'submandibular',
    en: 'Submandibular triangle',
    ar: 'المثلث تحت الفك',
    parent: 'anterior',
    boundaries: 'Outlined by the inferior border of the mandible superiorly and the anterior and posterior bellies of the digastric muscle inferiorly.',
    contents: ['Submandibular salivary gland', 'Facial blood vessels', 'Submandibular lymph nodes'],
    muscles: ['digastric', 'mylohyoid', 'stylohyoid'],
  },
  {
    id: 'carotid',
    en: 'Carotid triangle',
    ar: 'المثلث السباتي',
    parent: 'anterior',
    boundaries:
      'Outlined by the superior belly of the omohyoid muscle anteroinferiorly, the stylohyoid muscle and posterior belly of the digastric superiorly, and the anterior border of the sternocleidomastoid muscle posteriorly.',
    contents: [
      'Carotid sheath (carotid artery, internal jugular vein and vagus nerve)',
      'Glossopharyngeal nerve',
      'Hypoglossal nerve',
      'Deep cervical lymph nodes',
    ],
    muscles: ['omohyoid', 'stylohyoid', 'digastric', 'scm'],
  },
  {
    id: 'muscular',
    en: 'Muscular triangle',
    ar: 'المثلث العضلي',
    parent: 'anterior',
    boundaries:
      'Outlined by the hyoid bone superiorly, the superior belly of the omohyoid muscle and the anterior border of the sternocleidomastoid muscle laterally, and the midline.',
    contents: ['Infrahyoid muscles', 'Pharynx', 'Larynx', 'Thyroid and parathyroid glands'],
    muscles: ['omohyoid', 'sternohyoid', 'thyrohyoid', 'sternothyroid', 'scm'],
  },
  {
    id: 'posterior',
    en: 'Posterior triangle',
    ar: 'المثلث الخلفي',
    parent: 'posterior',
    boundaries: 'Sternocleidomastoid, trapezius and middle third of clavicle.',
    contents: ['Muscles of the floor: splenius capitis, levator scapulae, scalenus posterior, scalenus medius, scalenus anterior'],
    muscles: ['scm', 'trapezius', 'spleniusCapitis', 'levatorScapulae', 'scalenePost', 'scaleneMid', 'scaleneAnt', 'omohyoid'],
  },
];
