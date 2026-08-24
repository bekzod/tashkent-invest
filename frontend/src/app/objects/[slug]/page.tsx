import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { InvestmentObject } from '@/entities/investment-object/types';
import {
  absoluteUrl,
  compactText,
  fetchPublicObject,
  objectMetadata,
  structuredData,
} from '@/shared/lib/seo';
import { ObjectDetail } from '@/views/object-detail';

type ObjectPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ObjectPageProps): Promise<Metadata> {
  const { slug } = await params;
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
    geo: latitude && longitude
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
        ? { '@type': 'PropertyValue', name: 'Bino maydoni', value: object.buildingAreaSqm, unitText: 'm2' }
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

export default async function ObjectPage({ params }: ObjectPageProps) {
  const { slug } = await params;
  const object = await fetchPublicObject(slug).catch(() => null);
  if (!object) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={structuredData(objectJsonLd(object))}
      />
      <ObjectDetail slug={slug} initialLocale="uz" initialObject={object} />
    </>
  );
}
