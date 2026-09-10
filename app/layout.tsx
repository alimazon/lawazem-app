import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "الملازم — كلية طب جامعة العميد",
  description: "منصة تعاونية لملازم ومصادر طلاب كلية طب جامعة العميد",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
          <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <a href="/" className="text-lg font-black text-teal sm:text-xl">الملازم</a>
            <div className="flex flex-wrap gap-4 text-sm sm:gap-5">
              <a href="/lawazem" className="transition-colors hover:text-teal">ملازم الدكاترة</a>
              <a href="/channels" className="transition-colors hover:text-teal">قنوات الدراسية</a>
              <a href="/schedule" className="transition-colors hover:text-teal">الجدول</a>
              <a href="/study-prompt" className="transition-colors hover:text-teal">جات الدراسة</a>
              <a href="/gpa" className="transition-colors hover:text-teal">المعدل</a>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}