import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Invest Tuman — Toshkent tumani investitsiya portali',
    short_name: 'Invest Tuman',
    description:
      'Toshkent tumanidagi tasdiqlangan investitsiya obyektlari va imkoniyatlari.',
    start_url: '/uz',
    scope: '/',
    display: 'standalone',
    background_color: '#f4f8f2',
    theme_color: '#176b45',
    lang: 'uz',
    icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
  };
}
