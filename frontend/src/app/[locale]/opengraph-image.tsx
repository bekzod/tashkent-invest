import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { isLocale } from '@/shared/i18n/routing';
import {
  SOCIAL_CARD_SIZE,
  SocialCard,
  buildSocialCardModel,
} from '@/shared/ui/social-card';

export const alt = 'Invest Tuman';
export const size = SOCIAL_CARD_SIZE;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return new ImageResponse(
    <SocialCard model={buildSocialCardModel({ kind: 'home', locale })} />,
    size,
  );
}
