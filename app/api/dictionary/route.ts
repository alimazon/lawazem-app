// app/api/dictionary/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeString } from '@/lib/api-server';
import { MEDICAL_CATEGORIES } from '@/lib/constants';
import type { MedicalCategory } from '@/lib/types';

// ==================== Normalization ====================
function normalizeTerm(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\u0600-\u06FF\s-]/g, '');
}

function parseCategory(v: unknown): MedicalCategory | null {
  if (typeof v !== 'string') return null;
  return (MEDICAL_CATEGORIES as readonly string[]).includes(v)
    ? (v as MedicalCategory)
    : null;
}

// ==================== Groq System Prompt (Lookup) ====================
function buildLookupPrompt(): string {
  return `You are a medical terminology expert for second-year medical students at an Iraqi university. Students study in English but think and speak in Arabic.

Your task: analyze a medical term and return ONLY a valid JSON object with this exact structure:

{
  "arabic_translation": "الترجمة العربية الدقيقة",
  "meaning": "شرح مختصر بجملة واحدة بالعربية",
  "root_breakdown": "تفكيك الكلمة (prefix + root + suffix) مع معنى كل جزء بالعربية — أو null إن لم يكن لها جذور يونانية/لاتينية",
  "clinical_note": "ملاحظة سريرية مهمة بجملة واحدة — أو null إن لم تكن متأكداً 100%",
  "similar_terms": ["term1", "term2", "term3"],
  "category": "one of: general, anatomy, physiology, pathology, pharmacology, microbiology, biochemistry, histology, embryology, immunology, clinical"
}

STRICT RULES:
1. Return ONLY the JSON object — no preamble, no markdown fences, no explanation.
2. If the term is not a recognized medical term, return: {"error": "not_medical"}
3. For clinical_note: if you are not 100% confident about the clinical fact, return null. Do NOT guess. Do NOT fabricate.
4. Keep meaning and clinical_note short — one clear sentence each.
5. similar_terms: 2-4 related terms that students often confuse with this one, or that are commonly studied alongside it. English terms only.
6. root_breakdown: only if the term has Greek/Latin roots. Otherwise null.
7. All Arabic text must be in Modern Standard Arabic (فصحى), clear for a 2nd-year student.
8. category must be exactly one of the listed values — choose the most relevant one.`;
}

// ==================== Groq System Prompt (Deep) ====================
function buildDeepPrompt(): string {
  return `You are a senior medical educator writing an IN-DEPTH explanation of a medical term for a second-year medical student in Iraq. The student already knows a short definition — now they need a comprehensive understanding.

Return ONLY a valid JSON object with this exact structure:

{
  "overview": "نظرة عامة موسعة (3-4 جمل) تشرح المصطلح في سياقه الطبي والدراسي",
  "mechanism": "الآلية/الوظيفة/كيف يعمل بالتفصيل (3-5 جمل). إن كان المصطلح بنية تشريحية، اشرح تركيبها ووظائفها. إن كان مرضي، اشرح الباثوفسيولوجي.",
  "clinical": "الأهمية السريرية: متى يظهر؟ ما الأمراض المرتبطة؟ ما اللي يهم الطالب يعرفه للامتحان وللمرضى (3-4 جمل)",
  "confusions": [
    "مصطلح مشابه 1 — ما الفرق الدقيق (جملة واحدة)",
    "مصطلح مشابه 2 — ما الفرق الدقيق"
  ],
  "mnemonic": "ذاكرة مساعدة (إن أمكن) — جملة أو اختصار يساعد على الحفظ. أو null إن لم توجد طريقة طبيعية"
}

STRICT RULES:
1. Return ONLY the JSON object — no preamble, no markdown fences, no explanation.
2. Do NOT fabricate clinical facts. If you are not confident about something, omit it or keep it general.
3. All Arabic text must be clear Modern Standard Arabic (فصحى) suitable for a 2nd-year student.
4. confusions: 1-3 items. Each item combines term + why confused in one string.
5. mnemonics: only include if genuinely useful — do NOT force one.
6. Keep total response under 600 words.`;
}

// ==================== Parse Groq Response ====================
interface LookupResult {
  arabic_translation: string;
  meaning: string;
  root_breakdown: string | null;
  clinical_note: string | null;
  similar_terms: string[];
  category: MedicalCategory;
}

interface DeepResult {
  overview: string;
  mechanism: string;
  clinical: string;
  confusions: string[];
  mnemonic: string | null;
}

function stripFences(raw: string): string {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned;
}

function parseLookup(raw: string): LookupResult | null {
  try {
    const parsed = JSON.parse(stripFences(raw));
    if (parsed.error === 'not_medical') return null;

    if (
      typeof parsed.arabic_translation !== 'string' ||
      typeof parsed.meaning !== 'string'
    ) {
      return null;
    }

    const category = parseCategory(parsed.category) ?? 'general';

    return {
      arabic_translation: String(parsed.arabic_translation).slice(0, 300),
      meaning: String(parsed.meaning).slice(0, 500),
      root_breakdown:
        typeof parsed.root_breakdown === 'string'
          ? parsed.root_breakdown.slice(0, 500)
          : null,
      clinical_note:
        typeof parsed.clinical_note === 'string'
          ? parsed.clinical_note.slice(0, 500)
          : null,
      similar_terms: Array.isArray(parsed.similar_terms)
        ? parsed.similar_terms
            .filter((t: unknown): t is string => typeof t === 'string')
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0 && t.length <= 60)
            .slice(0, 4)
        : [],
      category,
    };
  } catch {
    return null;
  }
}

function parseDeep(raw: string): DeepResult | null {
  try {
    const parsed = JSON.parse(stripFences(raw));

    if (
      typeof parsed.overview !== 'string' ||
      typeof parsed.mechanism !== 'string' ||
      typeof parsed.clinical !== 'string'
    ) {
      return null;
    }

    return {
      overview: String(parsed.overview).slice(0, 1200),
      mechanism: String(parsed.mechanism).slice(0, 1500),
      clinical: String(parsed.clinical).slice(0, 1200),
      confusions: Array.isArray(parsed.confusions)
        ? parsed.confusions
            .filter((c: unknown): c is string => typeof c === 'string')
            .map((c: string) => c.trim().slice(0, 400))
            .filter(Boolean)
            .slice(0, 3)
        : [],
      mnemonic:
        typeof parsed.mnemonic === 'string' && parsed.mnemonic.trim()
          ? parsed.mnemonic.trim().slice(0, 400)
          : null,
    };
  } catch {
    return null;
  }
}

// ==================== Groq call ====================
async function callGroq(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  temperature: number
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY غير مُعد');
    return null;
  }

  const res = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    console.error('Groq error:', res.status, errBody.slice(0, 500));
    return null;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? null;
}

// ==================== Route ====================
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const action = typeof body.action === 'string' ? body.action : 'lookup';
  const supabaseAdmin = getSupabaseAdmin();

  // ==================== popular ====================
  if (action === 'popular') {
    const categoryFilter = parseCategory(body.category);

    let query = supabaseAdmin
      .from('medical_terms_cache')
      .select('term, arabic_translation, hit_count, category')
      .order('hit_count', { ascending: false })
      .limit(12);

    if (categoryFilter) {
      query = query.eq('category', categoryFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('dictionary popular error:', error.message);
      return jsonError('فشل تحميل المصطلحات الشائعة', 500);
    }
    return NextResponse.json({ terms: data ?? [] });
  }

  // ==================== categories_stats ====================
  if (action === 'categories_stats') {
    const { data, error } = await supabaseAdmin
      .from('medical_terms_cache')
      .select('category');

    if (error) {
      console.error('dictionary categories_stats error:', error.message);
      return jsonError('فشل تحميل التصنيفات', 500);
    }

    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as Array<{ category: string | null }>) {
      const cat = row.category ?? 'general';
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return NextResponse.json({ counts });
  }

  // ==================== deep ====================
  if (action === 'deep') {
    const term = safeString(body.term, 100);
    if (!term || term.length < 2) {
      return jsonError('المصطلح مطلوب');
    }

    const normalized = normalizeTerm(term);
    if (!normalized) return jsonError('المصطلح غير صالح');

    // ابحث في الـcache أولاً
    const { data: cached } = await supabaseAdmin
      .from('medical_terms_cache')
      .select('id, deep_explanation')
      .eq('term_normalized', normalized)
      .maybeSingle<{ id: string; deep_explanation: string | null }>();

    if (cached?.deep_explanation) {
      try {
        const parsed = JSON.parse(cached.deep_explanation) as DeepResult;
        if (parsed?.overview && parsed?.mechanism) {
          return NextResponse.json({ deep: parsed, cached: true });
        }
      } catch {
        // نكمل للـAI
      }
    }

    const content = await callGroq(
      buildDeepPrompt(),
      `Medical term: "${term}"`,
      1500,
      0.4
    );
    if (!content) {
      return jsonError(
        'فشل الاتصال بخدمة الذكاء الاصطناعي. حاول مرة ثانية.',
        502
      );
    }

    const parsed = parseDeep(content);
    if (!parsed) {
      return jsonError(
        'لم نستطع توليد شرح عميق لهذا المصطلح. جرّب مرة ثانية.',
        502
      );
    }

    // احفظ في الـcache
    if (cached?.id) {
      await supabaseAdmin
        .from('medical_terms_cache')
        .update({ deep_explanation: JSON.stringify(parsed) })
        .eq('id', cached.id);
    }

    return NextResponse.json({ deep: parsed, cached: false });
  }

  // ==================== lookup (افتراضي) ====================
  const term = safeString(body.term, 100);
  if (!term || term.length < 2) {
    return jsonError('أدخل مصطلحاً طبياً (حرفان على الأقل)');
  }

  const normalized = normalizeTerm(term);
  if (!normalized) {
    return jsonError('المصطلح غير صالح');
  }

  // 1. ابحث في الـcache
  const { data: cached } = await supabaseAdmin
    .from('medical_terms_cache')
    .select('*')
    .eq('term_normalized', normalized)
    .maybeSingle();

  if (cached) {
    // زد العدّاد (fire and forget)
    void supabaseAdmin
      .from('medical_terms_cache')
      .update({ hit_count: (cached.hit_count ?? 0) + 1 })
      .eq('id', cached.id)
      .then(() => {});

    return NextResponse.json({ result: cached, cached: true });
  }

  // 2. لو ما موجود — استخدم Groq
  const content = await callGroq(
    buildLookupPrompt(),
    `Medical term: "${term}"`,
    700,
    0.3
  );

  if (!content) {
    return jsonError('فشل الاتصال بخدمة الذكاء الاصطناعي', 502);
  }

  const parsed = parseLookup(content);
  if (!parsed) {
    return jsonError(
      'لم نتعرف على هذا المصطلح. تأكد من كتابته بشكل صحيح.',
      404
    );
  }

  // 3. احفظ في الـcache
  const { data: saved, error: saveError } = await supabaseAdmin
    .from('medical_terms_cache')
    .insert({
      term: term.slice(0, 100),
      term_normalized: normalized,
      arabic_translation: parsed.arabic_translation,
      meaning: parsed.meaning,
      root_breakdown: parsed.root_breakdown,
      clinical_note: parsed.clinical_note,
      similar_terms: parsed.similar_terms,
      category: parsed.category,
      hit_count: 1,
    })
    .select('*')
    .single();

  if (saveError) {
    console.error('dictionary save error:', saveError.message);
    return NextResponse.json({
      result: { term, ...parsed, hit_count: 1 },
      cached: false,
    });
  }

  return NextResponse.json({ result: saved, cached: false });
}