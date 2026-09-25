import type { Metadata } from 'next';
import { LocalizedNotFound } from '@/views/not-found';

export const metadata: Metadata = {
  title: 'Sahifa topilmadi',
  robots: { index: false, follow: false },
};

export default function NotFound() { return <LocalizedNotFound />; }
