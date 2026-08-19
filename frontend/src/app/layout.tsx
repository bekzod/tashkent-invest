import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/shared/i18n/language-provider';
import { AppFrame } from '@/widgets/app-frame';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--font-manrope' });
export const metadata: Metadata = { title: 'Invest Tuman', description: 'Toshkent shahridagi investitsiya obyektlari portali' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uz"><body className={manrope.variable} suppressHydrationWarning><LanguageProvider><AppFrame>{children}</AppFrame></LanguageProvider></body></html>;
}
