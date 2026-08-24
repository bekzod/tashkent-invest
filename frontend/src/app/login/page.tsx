import type { Metadata } from 'next';
import { LoginView } from '@/views/login';

export const metadata: Metadata = {
  title: 'Investor kabinetiga kirish',
  description: 'Invest Tuman investor kabinetiga xavfsiz kirish sahifasi.',
  robots: { index: false, follow: false },
};

export default function LoginPage() { return <LoginView />; }
