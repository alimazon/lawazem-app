// lib/strings.ts
/**
 * ملف النصوص المركزي
 * كل النصوص العربية للموقع موجودة هنا بصيغة فصحى رسمية.
 * تعديل أي نص هنا يظهر في كل مكان يستخدمه.
 */

export const strings = {
  // ==================== عام ====================
  common: {
    appName: 'لوازم',
    loading: 'جاري التحميل...',
    backToHome: 'العودة إلى لوحة الأقسام',
    backToChannels: 'العودة إلى القنوات',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    confirm: 'تأكيد',
    retry: 'إعادة المحاولة',
    all: 'الكل',
    filter: 'تصفية',
    remove: 'إزالة',
    copied: 'تم النسخ',
    copy: 'نسخ',
    close: 'إغلاق',
  },

  // ==================== التنقل ====================
  nav: {
    home: 'الرئيسية',
    lawazem: 'الملازم',
    channels: 'القنوات',
    schedule: 'الجدول',
    studyPrompt: 'أدوات الدراسة',
    gpa: 'المعدل',
    bottomNavLabel: 'التنقل السفلي',
  },

  // ==================== الصفحة الرئيسية ====================
  home: {
    badge: 'منصة لطلبة جامعة العميد',
    chooseStage: 'اختر مرحلتك الدراسية',
    chooseStageDesc: 'نعرض لك المحتوى المناسب لمرحلتك — قنوات، جداول، وكل ما تحتاجه.',
    changeStageHint: 'يمكنك تغييرها لاحقاً في أي وقت',
    greeting: 'ماذا تحتاج اليوم؟',
    greetingDesc: 'كل شيء في مكان واحد — اختر القسم الذي تحتاجه',
    changeStage: 'تغيير المرحلة',
    chooseAction: 'اختر',
    openAction: 'فتح',
    footer:
      'صُنع بكل حب لطلاب كلية الطب · جامعة العميد · برمجة وإعداد الطالب: علي مازن @E_W_9',
    sections: {
      lawazem: 'الملازم',
      lawazemDesc: 'ملازم الدكاترة مرتبة حسب المادة',
      channels: 'القنوات الدراسية',
      channelsDesc: 'دليل قنوات التلغرام الدراسية',
      schedule: 'الجدول',
      scheduleDesc: 'جدول المحاضرات الأسبوعي لمرحلتك',
      studyPrompt: 'أدوات الدراسة',
      studyPromptDesc: 'برومبت ذكي يدرس معك بالذكاء الاصطناعي',
      gpa: 'المعدل',
      gpaDesc: 'احفظ درجاتك واحسب معدلك الموزون حسب وحدات موادك',
    },
  },

  // ==================== الملازم ====================
  lawazem: {
    title: 'الملازم والمصادر',
    backLink: 'العودة إلى لوحة الأقسام',
    searchPlaceholder: 'ابحث باسم الملزمة، الدكتور، أو وسم...',
    filterLabel: 'تصفية:',
    summaryPrefix: 'ملزمة موزعة على',
    summaryMiddle: 'مادة',
    emptySubjects: 'لا توجد مواد مضافة لمرحلتك حالياً.',
    emptyNotes: 'لا توجد ملفات حالياً.',
    emptyNotesShort: 'لا توجد ملفات حالياً',
    noResults: 'لا توجد نتائج مطابقة',
    noResultsFor: (search: string) => `البحث: «${search}»`,
    noResultsTag: (tag: string) => `الوسم: #${tag}`,
    doctorCount: (n: number) => (n === 1 ? 'دكتور' : 'دكاترة'),
    noteCount: (n: number) => (n === 1 ? 'ملزمة' : 'ملازم'),
    withoutDoctor: 'بدون دكتور',
    doctorPrefix: 'د.',
    lectureLabel: 'محاضرة',
    trackTheoretical: 'نظري',
    trackPractical: 'عملي',
    bookmark: 'إضافة إلى المفضلة',
    removeBookmark: 'إزالة من المفضلة',
    openOnTelegram: 'فتح على تلغرام',
    openFile: 'فتح الملف',
  },

  // ==================== آخر ما زرته ====================
  recent: {
    title: 'آخر ما زرته',
    clear: 'مسح',
    justNow: 'الآن',
    minutesAgo: (n: number) => `قبل ${n} دقيقة`,
    hoursAgo: (n: number) => `قبل ${n} ساعة`,
    yesterday: 'أمس',
    daysAgo: (n: number) => `قبل ${n} أيام`,
    weeksAgo: (n: number) => `قبل ${n} أسابيع`,
    longAgo: 'منذ فترة',
  },

  // ==================== القنوات ====================
  channels: {
    title: 'قنوات الدراسة',
    backLink: 'العودة إلى لوحة الأقسام',
    searchPlaceholder: 'ابحث باسم القناة...',
    searchContentPlaceholder: 'ابحث بعنوان المحتوى...',
    channelsCount: (n: number) =>
      n === 1 ? 'قناة متاحة لمرحلتك' : `${n} قناة متاحة لمرحلتك`,
    empty: 'لا توجد قنوات مضافة لمرحلتك حالياً.',
    checkLater: 'يرجى العودة لاحقاً',
    noResults: 'لا توجد نتائج مطابقة',
    openChannel: 'فتح صفحة القناة',
    openTelegram: 'فتح القناة على تلغرام',
    notFound: 'لم نجد هذه القناة.',
    pinned: 'مثبّت',
    emptyContent: 'لا يوجد محتوى مضاف لهذه القناة حالياً.',
    emptySearchContent: 'لا توجد نتائج مطابقة لبحثك',
    filePrefix: (n: number) => `ملف ${n}`,
    dueDateLabel: 'تاريخ التسليم:',
    dueExpired: 'انتهى الموعد',
    dueToday: 'التسليم اليوم!',
    dueSoon: (days: number, date: string) =>
      `تاريخ التسليم: ${date} (بعد ${days} ${days === 1 ? 'يوم' : 'أيام'})`,
  },

  // ==================== الجدول ====================
  schedule: {
    title: 'جدول المحاضرات',
    backLink: 'العودة إلى لوحة الأقسام',
    empty: 'لا يوجد جدول مرفوع لمرحلتك حالياً.',
    checkLater: 'يرجى العودة لاحقاً',
    openFullSize: 'فتح الصورة بحجم كامل',
  },

  // ==================== المعدل ====================
  gpa: {
    title: 'المعدل',
    backLink: 'العودة إلى لوحة الأقسام',
    description:
      'افتح كل مادة وأدخل درجاتك أولاً بأول على مدار السنة. يمكنك تعديل «من كم» لكل محطة إذا كانت تختلف بكل مادة. الدرجات تُحفظ في متصفحك فقط.',
    empty: 'لا توجد مواد مضافة لمرحلتك حالياً.',
    progress: 'التقدم',
    progressText: (entered: number, total: number) => `${entered} من ${total} مادة`,
    units: 'وحدة',
    noScores: 'لا توجد درجات',
    yourScorePlaceholder: 'درجتك',
    fromLabel: 'من',
    finalAverage: 'معدلك النهائي',
    partialAverage: 'معدلك الحالي (جزئي)',
    enterScores: 'أدخل درجاتك ليظهر معدلك.',
    clearAll: 'مسح كل الدرجات',
    confirmClear: 'حذف كل الدرجات المدخلة لهذه المرحلة. هل أنت متأكد؟',
    components: {
      first: 'الفصل الأول',
      mid: 'المد',
      second: 'الفصل الثاني',
      finalTheory: 'الفاينل (نظري)',
      finalPractical: 'الفاينل (عملي)',
    },
  },

  // ==================== أدوات الدراسة ====================
  studyPrompt: {
    title: 'أدوات الدراسة',
    backLink: 'العودة إلى لوحة الأقسام',
    description:
      'اختر مادتك وطريقة إرسال المحتوى، وسنصيغ لك برومبت احترافي تنسخه وتستخدمه في أي أداة ذكاء اصطناعي.',
    empty: 'لا توجد مواد مضافة لمرحلتك حالياً.',
    subjectLabel: 'المادة',
    methodLabel: 'كيف ستزود المحتوى للذكاء الاصطناعي؟',
    formatsLabel: 'شكل الشرح المطلوب',
    formatsHint: '(يمكنك اختيار أكثر من خيار)',
    formatsError: 'اختر طريقة شرح واحدة على الأقل.',
    languageLabel: 'لغة البرومبت',
    arabic: 'بالعربية',
    english: 'بالإنجليزية',
    generateBtn: 'توليد البرومبت',
    generatingBtn: 'جاري التوليد...',
    resultReady: 'البرومبت جاهز',
    resultNote:
      'انسخ هذا النص والصقه في أي أداة ذكاء اصطناعي تفضلها، ثم ابدأ بإرسال سلايداتك حسب الطريقة التي اخترتها.',
    generateSuccess: 'تم توليد البرومبت',
    generateFailed: 'حدث خطأ، يرجى المحاولة مرة أخرى.',
    copySuccess: 'تم النسخ',
    copyFailed: 'فشل النسخ — يرجى النسخ يدوياً',
    loadFailed: 'فشل تحميل المواد',
  },

  // ==================== لوحة التحكم ====================
  admin: {
    title: 'لوحة التحكم',
    badge: 'مشرف',
    logout: 'تسجيل الخروج',
    loginTitle: 'دخول المشرف',
    loginDesc: 'أدخل كلمة مرور المشرف للوصول إلى لوحة التحكم',
    passwordPlaceholder: 'كلمة المرور',
    passwordRequired: 'أدخل كلمة المرور',
    loginBtn: 'دخول',
    loggingIn: 'جاري التحقق...',
    passwordIncorrect: 'كلمة المرور غير صحيحة',
    genericError: 'حدث خطأ، يرجى المحاولة مرة أخرى.',
    tabs: {
      subjects: 'المواد',
      materials: 'الملازم',
      channels: 'القنوات',
      schedules: 'الجدول',
    },
  },

  // ==================== المواد (لوحة التحكم) ====================
  subjects: {
    addPlaceholder: 'اسم المادة الجديدة',
    chooseStagePlaceholder: 'اختر المرحلة',
    addBtn: 'إضافة',
    empty: 'لا توجد مواد مضافة حالياً.',
    emptyHint: 'أضف أول مادة من الأعلى',
    editBtn: 'تعديل',
    deleteBtn: 'حذف',
    saveBtn: 'حفظ',
    cancelBtn: 'إلغاء',
    confirmDelete: (name: string) =>
      `حذف مادة «${name}» سيحذف جميع الملازم والأسئلة المرتبطة بها نهائياً. هل أنت متأكد؟`,
    loadFailed: 'فشل تحميل المواد',
    addSuccess: 'تمت إضافة المادة',
    addFailed: 'فشل إضافة المادة',
    editSuccess: 'تم الحفظ',
    editFailed: 'فشل الحفظ',
    deleteSuccess: 'تم الحذف',
    deleteFailed: 'فشل الحذف',
  },

  // ==================== الملازم (لوحة التحكم) ====================
  materials: {
    warningNoSubjects:
      'أضف مادة أولاً من تبويب «المواد» لتتمكن من إضافة الملازم.',
    chooseSubjectPlaceholder: 'اختر المادة',
    chooseTrackPlaceholder: 'نظري / عملي',
    trackTheoretical: 'نظري',
    trackPractical: 'عملي',
    titlePlaceholder: 'اسم الملزمة / المحاضرة',
    professorPlaceholder: 'اسم الدكتور (اختياري)',
    lectureNumberPlaceholder: 'رقم المحاضرة',
    fileSectionLabel: 'ملف الملزمة',
    fileUrlPlaceholder: 'الصق رابط تلغرام أو Supabase يدوياً',
    fileReady: 'الملف جاهز',
    telegramLink: 'رابط تلغرام',
    tagsLabel: 'الوسوم (Tags)',
    tagsSuggestions: [
      'نظري',
      'عملي',
      'محاضرة',
      'ملخص',
      'أساسيات',
      'مراجعة',
      'سلايدات',
      'امتحان',
      'واجب',
      'فاينل',
    ],
    addBtn: 'إضافة ملزمة',
    empty: 'لا توجد ملازم مضافة حالياً.',
    saveBtn: 'حفظ',
    cancelBtn: 'إلغاء',
    editBtn: 'تعديل',
    deleteBtn: 'حذف',
    confirmDelete: (title: string) =>
      `حذف الملزمة «${title}» نهائياً. هل أنت متأكد؟`,
    loadFailed: 'فشل تحميل البيانات',
    addSuccess: 'تمت إضافة الملزمة',
    addFailed: 'فشل الإضافة',
    editSuccess: 'تم الحفظ',
    editFailed: 'فشل الحفظ',
    deleteSuccess: 'تم الحذف',
    deleteFailed: 'فشل الحذف',
    uploadSuccess: 'تم رفع الملف',
    uploadFailed: 'فشل رفع الملف',
  },

  // ==================== القنوات (لوحة التحكم) ====================
  adminChannels: {
    namePlaceholder: 'اسم القناة',
    descriptionPlaceholder: 'وصف قصير (اختياري)',
    descriptionEditPlaceholder: 'الوصف',
    telegramPlaceholder: 'رابط تلغرام (https://t.me/channelname)',
    telegramEditPlaceholder: 'رابط تلغرام',
    passwordPlaceholder: 'كلمة مرور القناة',
    generateBtn: 'توليد',
    copyBtn: 'نسخ',
    copiedBtn: 'تم',
    copyFailed: 'فشل النسخ — يرجى النسخ يدوياً',
    addBtn: 'إضافة قناة',
    empty: 'لا توجد قنوات مضافة حالياً.',
    saveBtn: 'حفظ',
    cancelBtn: 'إلغاء',
    editBtn: 'تعديل',
    deleteBtn: 'حذف',
    confirmDelete: (name: string) =>
      `حذف القناة «${name}» نهائياً. هل أنت متأكد؟`,
    loadFailed: 'فشل تحميل القنوات',
    addSuccess: 'تمت إضافة القناة',
    addFailed: 'فشل الإضافة',
    editSuccess: 'تم الحفظ',
    editFailed: 'فشل الحفظ',
    deleteSuccess: 'تم الحذف',
    deleteFailed: 'فشل الحذف',
    passwordLabel: 'كلمة المرور:',
    passwordNotSet: 'غير محددة',
  },

  // ==================== الجدول (لوحة التحكم) ====================
  adminSchedules: {
    description:
      'ارفع صورة جدول المحاضرات لكل مرحلة، وستظهر للطلاب مباشرة في صفحة «الجدول».',
    changeBtn: 'تغيير',
    uploadPrompt: 'رفع صورة الجدول',
    uploadHint: 'PNG / JPG / WebP — بحد أقصى 5 ميجا',
    uploadingImage: 'جاري رفع الصورة...',
    saving: 'جاري الحفظ...',
    uploadSuccess: (stage: string) => `تم رفع جدول ${stage}`,
    uploadFailed: 'فشل رفع الصورة',
    imageLoadError: 'تعذّر تحميل الصورة الحالية.',
    uploadNew: 'رفع صورة جديدة',
    fileTypeError: 'نوع الملف غير مدعوم. استخدم PNG أو JPG أو WebP.',
    fileSizeError: 'حجم الصورة كبير جداً (بحد أقصى 5 ميجا).',
    loadFailed: 'فشل تحميل الجداول',
  },

  // ==================== بوابة القناة ====================
  channelPortal: {
    loginTitle: 'دخول صاحب القناة',
    loginDesc: 'اختر قناتك وأدخل كلمة المرور التي أعطاك إياها المشرف.',
    chooseChannelPlaceholder: 'اختر قناتك',
    passwordPlaceholder: 'كلمة مرور القناة',
    loginBtn: 'دخول',
    loggingIn: 'جاري التحقق...',
    passwordIncorrect: 'كلمة المرور غير صحيحة',
    genericError: 'حدث خطأ، يرجى المحاولة مرة أخرى.',
    channelPrefix: 'قناة:',
    viewsLabel: (n: number) => `${n} زيارة`,
    logout: 'تسجيل الخروج',
    tabs: {
      content: 'المحتوى',
      settings: 'الإعدادات',
    },
  },

  // ==================== محتوى القناة ====================
  channelContent: {
    filesLabel: 'الملفات والروابط',
    fileNamePlaceholder: (n: number) => `اسم الملف ${n} (اختياري)`,
    deleteBtn: 'حذف',
    uploading: 'جاري الرفع...',
    urlPlaceholder: 'أو الصق رابطاً بديلاً',
    addSlotBtn: '+ إضافة ملف / رابط',
    searchPlaceholder: 'ابحث بعنوان المحتوى...',
    filterAll: 'جميع الأنواع',
    folderPlaceholder: 'اسم المجلد (اختياري)',
    descriptionPlaceholder: 'تفاصيل إضافية (اختياري)',
    pinLabel: 'تثبيت هذا المنشور في أعلى القناة',
    pinned: 'مثبّت',
    dueDate: (date: string) => `تاريخ التسليم: ${date}`,
    pinTooltip: 'تثبيت',
    unpinTooltip: 'إلغاء التثبيت',
    titlePlaceholder: 'العنوان',
    addBtn: 'إضافة',
    saveBtn: 'حفظ',
    cancelBtn: 'إلغاء',
    editBtn: 'تعديل',
    deleteBtnFull: 'حذف',
    empty: 'لا يوجد محتوى مضاف حالياً.',
    emptyHint: 'أضف أول منشور من الأعلى',
    noResults: 'لا توجد نتائج مطابقة',
    fileSizeError: 'حجم الملف كبير جداً (بحد أقصى 20 ميجا).',
    loadFailed: 'فشل تحميل المحتوى',
    uploadSuccess: 'تم رفع الملف',
    uploadFailed: 'فشل رفع الملف',
    addSuccess: 'تمت إضافة المحتوى',
    addFailed: 'فشل الإضافة',
    editSuccess: 'تم الحفظ',
    editFailed: 'فشل الحفظ',
    pinFailed: 'فشل التثبيت',
    confirmDelete: (title: string) => `حذف «${title}» نهائياً. هل أنت متأكد؟`,
    deleteSuccess: 'تم الحذف',
    deleteFailed: 'فشل الحذف',
  },

  // ==================== إعدادات القناة ====================
  channelSettings: {
    infoText:
      'الاسم والمرحلة ورابط تلغرام يديرها المشرف. يمكنك تعديل الصورة والوصف فقط.',
    imageLabel: 'صورة القناة',
    changeImageBtn: 'تغيير',
    imageLoadError: 'تعذّر تحميل الصورة الحالية.',
    uploadNewImage: 'رفع صورة جديدة',
    imageUploadPrompt: 'رفع صورة للقناة',
    imageUploading: 'جاري الرفع...',
    imageHint: 'PNG / JPG / WebP / GIF — بحد أقصى 5 ميجا',
    descriptionLabel: 'وصف القناة',
    descriptionPlaceholder: 'وصف مختصر للقناة...',
    saveBtn: 'حفظ',
    unsavedChanges: 'توجد تغييرات غير محفوظة',
    imageTypeError: 'نوع الصورة غير مدعوم (PNG / JPG / WebP / GIF).',
    imageSizeError: 'حجم الصورة كبير جداً (بحد أقصى 5 ميجا).',
    imageUploadSuccess: 'تم رفع الصورة — لا تنسَ الحفظ',
    imageUploadFailed: 'فشل رفع الصورة',
    saveSuccess: 'تم حفظ بيانات القناة',
    saveFailed: 'فشل الحفظ',

    passwordSection: 'تغيير كلمة المرور',
    passwordNote:
      'بعد التغيير، لن تعمل كلمة المرور القديمة. تأكد من حفظ الجديدة في مكان آمن.',
    newPasswordLabel: 'كلمة المرور الجديدة',
    newPasswordPlaceholder: '4 أحرف على الأقل',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    confirmPasswordPlaceholder: 'أعد كتابتها',
    passwordMismatch: 'كلمتا المرور غير متطابقتين.',
    changePasswordBtn: 'تغيير كلمة المرور',
    passwordChangeSuccess: 'تم تغيير كلمة المرور',
    passwordChangeFailed: 'فشل التغيير',
  },

  // ==================== Drop Zone ====================
  dropZone: {
    dragActive: 'أفلت الملف هنا',
    dragIdle: 'اسحب الملف هنا أو اضغط للاختيار',
    uploading: 'جاري الرفع...',
    hint: (maxSize: number) =>
      `PDF، Word، PowerPoint، صور — بحد أقصى ${maxSize} ميجا`,
    fileSizeError: (maxSize: number) =>
      `حجم الملف كبير جداً (بحد أقصى ${maxSize} ميجا)`,
    fileTypeError: 'نوع الملف غير مدعوم',
    tooManyFiles: 'اختر ملفاً واحداً فقط',
    selectFailed: 'فشل اختيار الملف',
  },

  // ==================== Tag Input ====================
  tagInput: {
    placeholder: 'أضف وسماً...',
    removeAria: (tag: string) => `حذف وسم ${tag}`,
    maxReached: (max: number) => `وصلت إلى الحد الأقصى (${max} وسوم)`,
    hint: (count: number, max: number) =>
      `اضغط Enter أو فاصلة لإضافة وسم — ${count}/${max}`,
  },

  // ==================== رسائل الأخطاء ====================
  errors: {
    invalidRequest: 'الطلب غير صالح',
    unknownAction: 'إجراء غير معروف',
    idRequired: 'المعرّف مطلوب',
    unauthorized: 'غير مصرح',
    channelNotFound: 'القناة غير موجودة',
    passwordIncorrect: 'كلمة المرور غير صحيحة',
    dbError: 'حدث خطأ في الاتصال بقاعدة البيانات',
    loadFailed: 'فشل تحميل البيانات',
    saveFailed: 'فشل الحفظ',
    deleteFailed: 'فشل الحذف',
    addFailed: 'فشل الإضافة',
  },
} as const;

// ==================== Type Helpers ====================
export type Strings = typeof strings;