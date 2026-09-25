import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { LanguageProvider } from '@/shared/i18n/language-provider';
import { defaultLocale, isLocale } from '@/shared/i18n/routing';
import { site } from '@/shared/lib/seo';
import { AppFrame } from '@/widgets/app-frame';

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], display: 'swap', variable: '--font-manrope' });
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: {
    default: site.title,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    'Toshkent investitsiya',
    'Toshkent tumani investitsiya obyektlari',
    'investitsiya xaritasi',
    'yer uchastkalari',
    'auksion obyektlari',
    'investment in Tashkent',
  ],
  authors: [{ name: 'Invest Tuman' }],
  creator: 'Invest Tuman',
  publisher: 'Invest Tuman',
  category: 'investment portal',
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const localeHeader = (await headers()).get('x-invest-locale');
  const locale = localeHeader && isLocale(localeHeader) ? localeHeader : defaultLocale;

  return (
    <html lang={locale}>
      <body className={manrope.variable} suppressHydrationWarning>
        <LanguageProvider initialLocale={locale}>
          <AppFrame>{children}</AppFrame>
        </LanguageProvider>
      </body>
    </html>
  );
}
