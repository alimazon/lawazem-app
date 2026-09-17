// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NavBar } from '@/components/NavBar';
import { MobileBottomNav } from '@/components/MobileBottomNav';  // ✅ جديد

export const metadata: Metadata = {
  title: 'لوازم — كلية طب جامعة العميد',
  description: 'منصة تعاونية لملازم ومصادر وجميع احتياجات طلاب كلية الطب جامعة العميد',
};

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var prefers = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = saved || prefers;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-paper">
        <ThemeProvider>
          <ToastProvider>
            <ConfirmProvider>
              <NavBar />
              {/* ✅ جديد: padding-bottom على الجوال لإفراغ مساحة للشريط */}
              <main className="pb-20 md:pb-0">
                {children}
              </main>
              <MobileBottomNav />
            </ConfirmProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}