import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Profil',
  robots: { index: false, follow: false },
};

export default function ProfilePage() { redirect('/dashboard/profile'); }
