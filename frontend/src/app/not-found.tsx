import type { Metadata } from 'next';
import { LocalizedNotFound } from '@/views/not-found';

export const metadata: Metadata = {
  title: 'Sahifa topilmadi | Страница не найдена',
  robots: { index: false, follow: false },
};

export default function NotFound() { return <LocalizedNotFound />; }
