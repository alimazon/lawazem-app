import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const [notes, questions, profNotes] = await Promise.all([
    supabaseAdmin.from('lecture_notes').select('*, subjects(name)').eq('status', 'pending'),
    supabaseAdmin.from('exam_questions').select('*, lecture_notes(title)').eq('status', 'pending'),
    supabaseAdmin.from('professor_focus_notes').select('*, subjects(name)').eq('status', 'pending'),
  ]);

  return NextResponse.json({
    lectureNotes: notes.data || [],
    examQuestions: questions.data || [],
    professorNotes: profNotes.data || [],
  });
}