import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { isLocale } from '@/shared/i18n/routing';
import {
  absoluteUrl,
  compactText,
  fetchPublicObject,
  objectMetadata,
  structuredData,
} from '@/shared/lib/seo';
import { ObjectDetail } from '@/views/object-detail';

type ObjectPageProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: ObjectPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return { robots: { index: false, follow: false } };

  const object = await fetchPublicObject(slug).catch(() => null);
  if (!object) {
    return {
      title: 'Obyekt topilmadi',
      robots: { index: false, follow: false },
    };
  }
  return objectMetadata(object);
}

function objectJsonLd(object: InvestmentObject) {
  const image = object.imageUrl || object.media?.find((media) => media.kind === 'image')?.url;
  const [longitude, latitude] = object.coordinates || [];
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: object.title,
    description: compactText(object.description || object.shortDescription, 500),
    url: absoluteUrl(`/objects/${object.slug}`),
    image,
    address: {
      '@type': 'PostalAddress',
      streetAddress: object.address,
      addressLocality: object.district,
      addressRegion: 'Toshkent viloyati',
      addressCountry: 'UZ',
    },
    geo:
      latitude && longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude,
            longitude,
          }
        : undefined,
    additionalProperty: [
      object.landAreaHa
        ? { '@type': 'PropertyValue', name: 'Yer maydoni', value: object.landAreaHa, unitText: 'ga' }
        : undefined,
      object.buildingAreaSqm
        ? {
            '@type': 'PropertyValue',
            name: 'Bino maydoni',
            value: object.buildingAreaSqm,
            unitText: 'm2',
          }
        : undefined,
      object.jobsPlanned
        ? { '@type': 'PropertyValue', name: "Ish o'rinlari", value: object.jobsPlanned }
        : undefined,
      object.cadastralNumber
        ? { '@type': 'PropertyValue', name: 'Kadastr raqami', value: object.cadastralNumber }
        : undefined,
    ].filter(Boolean),
    offers: {
      '@type': 'Offer',
      price: object.investmentAmountUsd,
      priceCurrency: 'USD',
      availability:
        object.status === 'auction'
          ? 'https://schema.org/LimitedAvailability'
          : 'https://schema.org/InStock',
      url: object.auctionUrl || absoluteUrl(`/objects/${object.slug}`),
    },
  };
}

export default async function LocalizedObjectPage({ params }: ObjectPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const object = await fetchPublicObject(slug).catch(() => null);
  if (!object) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={structuredData(objectJsonLd(object))}
      />
      <ObjectDetail slug={slug} initialLocale={locale} initialObject={object} />
    </>
  );
}
