// public/sw.js
// Service Worker — لوازم
// استراتيجية: Network-first مع Cache fallback
// لا يخزّن: /api/ ولا Supabase ولا الطلبات غير GET

const CACHE_NAME = 'lawazem-v1';
const MAX_CACHE_ENTRIES = 60;

// ==================== Install ====================
self.addEventListener('install', () => {
  // تفعيل النسخة الجديدة فوراً بدل انتظار إغلاق كل التبويبات
  self.skipWaiting();
});

// ==================== Activate ====================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // احذف كل الـcaches القديمة
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      // تولّى السيطرة على كل التبويبات المفتوحة
      await self.clients.claim();
    })()
  );
});

// ==================== Fetch ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // تجاهل غير GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // تجاهل كل الطلبات خارج الأصل (Supabase, Groq, ...)
  if (url.origin !== self.location.origin) return;

  // تجاهل API (محتوى حيّ)
  if (url.pathname.startsWith('/api/')) return;

  // تجاهل طلبات Next.js dev/HMR (لو صار تشغيل محلي)
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  event.respondWith(handleRequest(request));
});

// ==================== Handler ====================
async function handleRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // 1. جرّب الشبكة أولاً
    const response = await fetch(request);

    // خزّن فقط الاستجابات الناجحة
    if (response.ok && response.type === 'basic') {
      // نحفظ نسخة قبل ما نرجّع الأصل
      const clone = response.clone();
      cache.put(request, clone).catch(() => {});
      // نظّف cache لو كبر أكثر من اللازم
      trimCache(cache).catch(() => {});
    }

    return response;
  } catch {
    // 2. لو الشبكة فشلت، جرّب الـcache
    const cached = await cache.match(request);
    if (cached) return cached;

    // 3. لو ما فيه cache — جرّب الصفحة الرئيسية
    //    (تُخزَّن بعد أول زيارة ناجحة)
    const home = await cache.match('/');
    if (home) return home;

    // 4. لا شيء متاح — أرجِع صفحة offline بسيطة
    return new Response(offlinePage(), {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

// ==================== Trim Cache ====================
async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_CACHE_ENTRIES) return;
  // احذف الأقدم (ترتيب الإدراج مضمون في Cache API)
  const toDelete = keys.slice(0, keys.length - MAX_CACHE_ENTRIES);
  await Promise.all(toDelete.map((key) => cache.delete(key)));
}

// ==================== Offline Fallback ====================
function offlinePage() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>لا يوجد اتصال — لوازم</title>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: #F7F6F2;
      color: #1A211F;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #131918; color: #ECEFEE; }
      .card { background: #1B2220 !important; border-color: #2C3635 !important; }
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E4E0D6;
      border-radius: 24px;
      padding: 40px 24px;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 8px 30px rgba(26,33,31,0.06);
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      background: rgba(14,74,74,0.10);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0E4A4A;
    }
    @media (prefers-color-scheme: dark) {
      .icon { background: rgba(77,184,184,0.20); color: #4DB8B8; }
    }
    h1 {
      font-size: 20px;
      font-weight: 900;
      margin: 0 0 8px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      opacity: 0.6;
      margin: 0 0 20px;
    }
    button {
      background: #0E4A4A;
      color: #FFFFFF;
      border: 0;
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
    }
    @media (prefers-color-scheme: dark) {
      button { background: #4DB8B8; color: #131918; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
      </svg>
    </div>
    <h1>لا يوجد اتصال بالإنترنت</h1>
    <p>تحقق من اتصالك وحاول مرة ثانية. المحتوى الذي زرته مؤخراً قد يكون متاحاً في الـcache.</p>
    <button onclick="window.location.reload()">أعد المحاولة</button>
  </div>
</body>
</html>`;
}