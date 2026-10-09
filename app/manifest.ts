// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'لوازم — كلية طب جامعة العميد',
    short_name: 'لوازم',
    description: 'منصة تعاونية لملازم ومصادر وجميع احتياجات طلاب كلية الطب',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F7F6F2',
    theme_color: '#0E4A4A',
    lang: 'ar',
    dir: 'rtl',
    categories: ['education', 'medical'],
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192 512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}