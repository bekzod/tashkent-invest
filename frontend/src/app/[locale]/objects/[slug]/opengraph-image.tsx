import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { isLocale } from '@/shared/i18n/routing';
import { fetchPublicObject } from '@/shared/lib/seo';
import {
  SOCIAL_CARD_SIZE,
  SocialCard,
  buildSocialCardModel,
} from '@/shared/ui/social-card';

export const alt = 'Invest Tuman investment object';
export const size = SOCIAL_CARD_SIZE;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const object = await fetchPublicObject(slug, locale).catch(() => null);
  if (!object) notFound();
  return new ImageResponse(
    <SocialCard model={buildSocialCardModel({ kind: 'object', locale, object })} />,
    size,
  );
}
