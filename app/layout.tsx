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
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <a href="/" className="font-display text-xl font-black text-teal">
              الملازم
            </a>
            <div className="flex gap-5 text-sm">
              <a href="/add-note" className="transition-colors hover:text-teal">
                أضف ملزمة
              </a>
              <a href="/add" className="transition-colors hover:text-teal">
                أضف ملاحظة
              </a>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}