// app/api/dictionary/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { jsonError, safeString } from '@/lib/api-server';

// ==================== Normalization ====================
function normalizeTerm(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\u0600-\u06FF\s-]/g, '');
}

// ==================== Groq Prompt ====================
function buildSystemPrompt(): string {
  return `You are a medical terminology expert for second-year medical students at an Iraqi university. Students study in English but think and speak in Arabic.

Your task: analyze a medical term and return ONLY a valid JSON object with this exact structure:

{
  "arabic_translation": "الترجمة العربية الدقيقة",
  "meaning": "شرح مختصر بجملة واحدة بالعربية",
  "root_breakdown": "تفكيك الكلمة (prefix + root + suffix) مع معنى كل جزء بالعربية",
  "clinical_note": "ملاحظة سريرية مهمة بجملة واحدة — أو null إن لم تكن متأكداً",
  "similar_terms": ["term1", "term2", "term3"]
}

STRICT RULES:
1. Return ONLY the JSON object — no preamble, no markdown fences, no explanation.
2. If the term is not a recognized medical term, return: {"error": "not_medical"}
3. For clinical_note: if you are not 100% confident about the clinical fact, return null. Do NOT guess. Do NOT fabricate.
4. Keep meaning and clinical_note short — one clear sentence each.
5. similar_terms: 2-4 related terms that students often confuse with this one, or that are commonly studied alongside it. English terms only.
6. root_breakdown: only if the term has Greek/Latin roots. Otherwise null.
7. All Arabic text must be in Modern Standard Arabic (فصحى), clear for a 2nd-year student.`;
}

// ==================== Parse Groq Response ====================
interface DictionaryResult {
  arabic_translation: string;
  meaning: string;
  root_breakdown: string | null;
  clinical_note: string | null;
  similar_terms: string[];
}

function parseGroqResponse(raw: string): DictionaryResult | null {
  try {
    // تنظيف: إزالة أي markdown fences
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');

    const parsed = JSON.parse(cleaned);

    if (parsed.error === 'not_medical') {
      return null;
    }

    if (
      typeof parsed.arabic_translation !== 'string' ||
      typeof parsed.meaning !== 'string'
    ) {
      return null;
    }

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
    };
  } catch {
    return null;
  }
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

  // ==================== popular (الأكثر بحثاً) ====================
  if (action === 'popular') {
    const { data, error } = await supabaseAdmin
      .from('medical_terms_cache')
      .select('term, arabic_translation, hit_count')
      .order('hit_count', { ascending: false })
      .limit(12);

    if (error) {
      console.error('dictionary popular error:', error.message);
      return jsonError('فشل تحميل المصطلحات الشائعة', 500);
    }
    return NextResponse.json({ terms: data ?? [] });
  }

  // ==================== lookup (بحث) ====================
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
    supabaseAdmin
      .from('medical_terms_cache')
      .update({ hit_count: (cached.hit_count ?? 0) + 1 })
      .eq('id', cached.id)
      .then(() => {});

    return NextResponse.json({ result: cached, cached: true });
  }

  // 2. لو ما موجود — استخدم Groq
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY غير مُعد');
    return jsonError('خدمة الذكاء الاصطناعي غير متوفرة', 500);
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: `Medical term: "${term}"` },
        ],
        temperature: 0.3,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error('Groq error:', groqRes.status, errBody.slice(0, 500));
      return jsonError('فشل الاتصال بخدمة الذكاء الاصطناعي', 502);
    }

    const data = (await groqRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return jsonError('لم نصل رد من الذكاء الاصطناعي', 502);
    }

    const parsed = parseGroqResponse(content);
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
        hit_count: 1,
      })
      .select('*')
      .single();

    if (saveError) {
      console.error('dictionary save error:', saveError.message);
      // نرجع النتيجة حتى لو فشل الحفظ
      return NextResponse.json({
        result: {
          term,
          ...parsed,
          hit_count: 1,
        },
        cached: false,
      });
    }

    return NextResponse.json({ result: saved, cached: false });
  } catch (err) {
    console.error('dictionary error:', err);
    return jsonError('فشل الاتصال بخدمة الذكاء الاصطناعي', 500);
  }
}