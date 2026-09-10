import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { subject, materialMethod, formats, language } = body;

  if (!subject || !subject.trim()) {
    return NextResponse.json({ error: 'اختر المادة أول شي.' }, { status: 400 });
  }
  if (!formats || formats.length === 0) {
    return NextResponse.json({ error: 'اختر طريقة شرح وحدة على الأقل.' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'مفتاح Groq غير مُعد بالسيرفر.' }, { status: 500 });
  }

  const systemPrompt = `You are an expert prompt engineer specializing in medical education. Your ONLY job is to write a single, detailed, professional, ready-to-use prompt that a medical student can paste into any AI assistant (such as ChatGPT or Claude) to study a specific subject effectively.

Context about how the student will interact with the target AI right after pasting your prompt:
- Material delivery method: "${materialMethod}"
- If this method is incremental (one slide or one part sent per message, repeated across many messages until the lecture is done), your prompt MUST explicitly instruct the target AI to:
  - Treat each message from the student as ONE slide/part, and respond to EACH one individually and immediately, not wait to accumulate several before responding.
  - Keep each requested format's output SMALL per slide/part — around 2 to 3 items only (e.g. 2-3 flashcards, 2-3 MCQ questions), never a large batch, because slides arrive one at a time and a big batch per slide is overwhelming.
  - If a comprehensive/final review format is among the requested formats below, the target AI must WAIT until the student explicitly signals they are done sending slides (e.g. says "خلصت" or "that's all" or similar) before producing that comprehensive review, and that review alone can be longer/more thorough since it covers the whole lecture.
- If the method is NOT incremental (the whole file/document arrives at once in a single message), the target AI can give one normal, appropriately sized response covering the whole material, without the small-batch restriction above.

The requested response formats the student wants from the target AI (apply the per-slide quantity rule above to each, except any comprehensive-review format):
- ${formats.join('\n- ')}

Rules you must follow strictly:
- Do NOT answer the subject yourself. Do NOT explain the medical content. Do NOT provide any medical information directly — you only produce the prompt text.
- Your entire output is ONLY the prompt text itself — nothing else. No preamble, no quotation marks wrapping it, no meta-commentary, no explanation of what you did.
- The prompt you write should instruct the target AI to act as an expert, patient medical tutor, appropriate in depth and accuracy for a second-year medical student.
- Make the prompt detailed and well-structured: a short role/context line, then clear numbered or bulleted instructions covering the material delivery method, the requested formats with their per-slide quantities, and the waiting/pacing behavior described above. Do not write a single vague sentence — be thorough enough that the target AI has no ambiguity about what to do.
- Write the prompt itself in ${language === 'en' ? 'English' : 'Arabic'}.`;

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
      console.error('Groq error:', groqRes.status, errBody);
      return NextResponse.json({ error: `صار خطأ من خدمة الذكاء الاصطناعي (${groqRes.status}). حاول مرة ثانية بعد شوي.` }, { status: 502 });
    }

    const data = await groqRes.json();
    const generatedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      return NextResponse.json({ error: 'ما وصل رد من الذكاء الاصطناعي. حاول مرة ثانية.' }, { status: 502 });
    }

    return NextResponse.json({ prompt: generatedPrompt });
  } catch (err) {
    return NextResponse.json({ error: 'فشل الاتصال بخدمة الذكاء الاصطناعي.' }, { status: 500 });
  }
}