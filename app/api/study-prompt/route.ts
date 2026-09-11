// app/api/study-prompt/route.ts
import { NextResponse } from 'next/server';
import { jsonError, safeString } from '@/lib/api-server';
import { MATERIAL_METHODS, STUDY_FORMATS, type StudyFormat } from '@/lib/constants';

interface StudyPromptBody {
  subject?: unknown;
  materialMethod?: unknown;
  formats?: unknown;
  language?: unknown;
}

const VALID_FORMATS = new Set<string>(STUDY_FORMATS);
const VALID_METHODS = new Set<string>(MATERIAL_METHODS.map((m) => m.value));

function buildSystemPrompt(
  materialMethod: string,
  formats: string[],
  language: 'ar' | 'en'
): string {
  const isIncremental =
    materialMethod.includes('سلايد بكل رسالة') ||
    materialMethod.includes('جزء بعد جزء');

  const incrementalRules = isIncremental
    ? `
- Treat each message from the student as ONE slide/part, and respond to EACH one individually and immediately — do not wait to accumulate several before responding.
- Keep each requested format's output SMALL per slide/part — around 2 to 3 items only (e.g. 2-3 flashcards, 2-3 MCQ questions), never a large batch. Slides arrive one at a time and a big batch per slide is overwhelming.
- If a comprehensive/final review format is among the requested formats, WAIT until the student explicitly signals they are done sending slides (e.g. says "خلصت" or "that's all" or similar) before producing that comprehensive review. That review alone can be longer/more thorough since it covers the whole lecture.`
    : `
- The student sends the whole material at once, so you can give one normal, appropriately sized response covering everything without per-slide restrictions.`;

  return `You are an expert prompt engineer specializing in medical education. Your ONLY job is to write a single, detailed, professional, ready-to-use prompt that a medical student can paste into any AI assistant (such as ChatGPT or Claude) to study a specific subject effectively.

Context about how the student will interact with the target AI right after pasting your prompt:
- Material delivery method: "${materialMethod}"

If this method is incremental (one slide or one part sent per message, repeated across many messages until the lecture is done), your prompt MUST explicitly instruct the target AI to:${incrementalRules}

The requested response formats the student wants from the target AI (apply the per-slide quantity rule above to each, except any comprehensive-review format):
- ${formats.join('\n- ')}

Rules you must follow strictly:
- Do NOT answer the subject yourself. Do NOT explain the medical content. Do NOT provide any medical information directly — you only produce the prompt text.
- Your entire output is ONLY the prompt text itself — nothing else. No preamble, no quotation marks wrapping it, no meta-commentary, no explanation of what you did.
- The prompt you write should instruct the target AI to act as an expert, patient medical tutor, appropriate in depth and accuracy for a second-year medical student.
- Make the prompt detailed and well-structured: a short role/context line, then clear numbered or bulleted instructions covering the material delivery method, the requested formats with their per-slide quantities, and the waiting/pacing behavior described above. Do not write a single vague sentence — be thorough enough that the target AI has no ambiguity about what to do.
- Write the prompt itself in ${language === 'en' ? 'English' : 'Arabic'}.`;
}

export async function POST(request: Request) {
  let body: StudyPromptBody;
  try {
    body = await request.json();
  } catch {
    return jsonError('الطلب غير صالح', 400);
  }

  const subject = safeString(body.subject, 200);
  const materialMethod = safeString(body.materialMethod, 500);
  const language = body.language === 'en' ? 'en' : 'ar';

  if (!subject) return jsonError('اختر المادة أول شي.');
  if (!materialMethod) return jsonError('اختر طريقة إرسال المحتوى.');
  if (!VALID_METHODS.has(materialMethod)) return jsonError('طريقة الإرسال غير معروفة.');

  if (!Array.isArray(body.formats) || body.formats.length === 0) {
    return jsonError('اختر طريقة شرح وحدة على الأقل.');
  }

  const formats = body.formats.filter(
    (f): f is StudyFormat => typeof f === 'string' && VALID_FORMATS.has(f)
  );

  if (formats.length === 0) {
    return jsonError('ما يو شكل شرح صالح.');
  }
  if (formats.length > STUDY_FORMATS.length) {
    return jsonError('عدد أشكال الشرح غير صالح.');
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY غير مُعد');
    return jsonError('خدمة الذكاء الاصطناعي غير مُعدّة على السيرفر.', 500);
  }

  const systemPrompt = buildSystemPrompt(materialMethod, formats, language);
  const userMessage = `Subject: ${subject}
Material delivery method: ${materialMethod}
Requested formats: ${formats.join('، ')}`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error('Groq error:', groqRes.status, errBody.slice(0, 500));
      return jsonError(
        `صار خطأ من خدمة الذكاء الاصطناعي (${groqRes.status}). حاول مرة ثانية بعد شوي.`,
        502
      );
    }

    const data = (await groqRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const generatedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      return jsonError('ما وصل رد من الذكاء الاصطناعي. حاول مرة ثانية.', 502);
    }

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (err) {
    console.error('Study prompt error:', err);
    return jsonError('فشل الاتصال بخدمة الذكاء الاصطناعي.', 500);
  }
}