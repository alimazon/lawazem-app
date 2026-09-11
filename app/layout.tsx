// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'لوازم — كلية طب جامعة العميد',
  description: 'منصة تعاونية لملازم ومصادر وجميع احتياجات طلاب كلية الطب جامعة العميد',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-paper">
        <ToastProvider>
          <ConfirmProvider>
            <NavBar />
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}