// app/study-health/page.tsx
import { redirect } from 'next/navigation';

export default function StudyHealthRedirectPage() {
  redirect('/study-session');
}