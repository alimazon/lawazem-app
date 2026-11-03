// lib/anatomy-meshes.ts
/**
 * ربط عضلات الأطلس (id) بقطع نموذج الـ 3D داخل public/atlas/head-neck.glb.
 * مولَّد من النموذج نفسه — الأسماء بدون البادئة (m| للعضلات، b| للعظام).
 */
export const MUSCLE_MESHES: Readonly<Record<string, readonly string[]>> = {
  "frontalis": [
    "left frontalis",
    "right frontalis"
  ],
  "corrugator": [
    "left corrugator supercilii",
    "right corrugator supercilii"
  ],
  "procerus": [
    "left procerus",
    "right procerus"
  ],
  "orbOculi": [
    "left orbital part of orbicularis oculi",
    "right orbital part of orbicularis oculi",
    "left palpebral part of orbicularis oculi",
    "right palpebral part of orbicularis oculi"
  ],
  "nasalis": [
    "left nasalis",
    "right nasalis"
  ],
  "lls": [
    "left levator labii superioris",
    "right levator labii superioris"
  ],
  "zmin": [
    "left zygomaticus minor",
    "right zygomaticus minor"
  ],
  "zmaj": [
    "left zygomaticus major",
    "right zygomaticus major"
  ],
  "risorius": [
    "left risorius",
    "right risorius"
  ],
  "dao": [
    "left depressor anguli oris",
    "right depressor anguli oris"
  ],
  "dli": [
    "left depressor labii inferioris",
    "right depressor labii inferioris"
  ],
  "mentalis": [
    "left mentalis",
    "right mentalis"
  ],
  "orbOris": [
    "left orbicularis oris",
    "right orbicularis oris"
  ],
  "masseter": [
    "left superficial part of masseter",
    "right superficial part of masseter",
    "left deep part of masseter",
    "right deep part of masseter"
  ],
  "temporalis": [
    "left temporalis",
    "right temporalis"
  ],
  "platysma": [
    "left platysma",
    "right platysma"
  ],
  "scm": [
    "left sternocleidomastoid",
    "right sternocleidomastoid"
  ],
  "trapezius": [
    "ascending part of left trapezius",
    "ascending part of right trapezius",
    "descending part of left trapezius",
    "descending part of right trapezius",
    "transverse part of left trapezius",
    "transverse part of right trapezius"
  ],
  "digastric": [
    "left digastric",
    "left digastric (2)",
    "left digastric (3)",
    "right digastric",
    "right digastric (2)",
    "right intermediate tendon"
  ],
  "stylohyoid": [
    "left stylohyoid",
    "right stylohyoid"
  ],
  "mylohyoid": [
    "left mylohyoid",
    "right mylohyoid"
  ],
  "geniohyoid": [
    "left geniohyoid",
    "right geniohyoid"
  ],
  "omohyoid": [
    "left omohyoid",
    "right omohyoid"
  ],
  "sternohyoid": [
    "left sternohyoid",
    "right sternohyoid"
  ],
  "thyrohyoid": [
    "left thyrohyoid",
    "right thyrohyoid"
  ],
  "sternothyroid": [
    "left sternothyroid",
    "right sternothyroid"
  ],
  "spleniusCapitis": [
    "left splenius capitis",
    "right splenius capitis"
  ],
  "levatorScapulae": [
    "left levator scapulae",
    "right levator scapulae"
  ],
  "scaleneAnt": [
    "left scalenus anterior",
    "right scalenus anterior"
  ],
  "scaleneMid": [
    "left scalenus medius",
    "right scalenus medius"
  ],
  "scalenePost": [
    "left scalenus posterior",
    "right scalenus posterior"
  ],
  "rcAnterior": [
    "left rectus capitis anterior",
    "right rectus capitis anterior"
  ],
  "rcLateralis": [
    "left rectus capitis lateralis",
    "right rectus capitis lateralis"
  ],
  "longusCapitis": [
    "left longus capitis",
    "right longus capitis"
  ],
  "longusColli": [
    "inferior oblique part of left longus colli",
    "superior oblique part of left longus colli",
    "vertical intermediate part of left longus colli"
  ]
};

/** عضلات موجودة في النموذج لكنها ليست في بيانات الأطلس (تظهر كسياق رمادي) */
export const CONTEXT_MUSCLES: readonly string[] = [
  "abdominal part of left pectoralis major",
  "abdominal part of right pectoralis major",
  "acromial part of left deltoid",
  "acromial part of right deltoid",
  "clavicular part of left deltoid",
  "clavicular part of left pectoralis major",
  "clavicular part of right deltoid",
  "clavicular part of right pectoralis major",
  "left inferior oblique",
  "left inferior rectus",
  "left lateral rectus",
  "left levator palpebrae superioris",
  "left longissimus capitis",
  "left medial rectus",
  "left pectoralis minor",
  "left rectus capitis posterior major",
  "left rectus capitis posterior minor",
  "left serratus anterior",
  "left splenius cervicis",
  "left subclavius",
  "left superior oblique",
  "left superior rectus",
  "right inferior oblique",
  "right inferior rectus",
  "right lateral rectus",
  "right levator palpebrae superioris",
  "right longissimus capitis",
  "right medial rectus",
  "right pectoralis minor",
  "right rectus capitis posterior major",
  "right rectus capitis posterior minor",
  "right serratus anterior",
  "right splenius cervicis",
  "right subclavius",
  "right superior oblique",
  "right superior rectus",
  "spinal part of left deltoid",
  "spinal part of right deltoid",
  "sternocostal part of left pectoralis major",
  "sternocostal part of right pectoralis major",
  "left medial pterygoid",
  "right medial pterygoid",
  "left inferior head of lateral pterygoid",
  "right inferior head of lateral pterygoid",
  "left superior head of lateral pterygoid",
  "right superior head of lateral pterygoid"
];

/** عظام تتحرك مع الرأس (الجمجمة والفك الأسفل والفقرة الأولى) */
export const HEAD_BONES: readonly string[] = [
  "atlas",
  "ethmoid",
  "frontal bone",
  "left lacrimal bone",
  "left maxilla",
  "left nasal bone",
  "left palatine bone",
  "left parietal bone",
  "left temporal bone",
  "left zygomatic bone",
  "mandible",
  "occipital bone",
  "right lacrimal bone",
  "right maxilla",
  "right nasal bone",
  "right palatine bone",
  "right parietal bone",
  "right temporal bone",
  "right zygomatic bone",
  "sphenoid bone",
  "vomer"
];
