// app/grades/page.tsx
import { redirect } from 'next/navigation';

export default function GradesRedirectPage() {
  redirect('/gpa?tab=grades');
}