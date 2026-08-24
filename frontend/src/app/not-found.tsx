import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sahifa topilmadi',
  robots: { index: false, follow: false },
};

export default function NotFound() { return <main className="center-state"><h1>404</h1><p>Bu sahifa topilmadi.</p><Link className="button primary" href="/">Bosh sahifa</Link></main>; }
