import type { InvestmentObject } from '@/entities/investment-object/types';
import { localizedPath, type Locale } from '@/shared/i18n/routing';
import { absoluteUrl, compactText, site } from '@/shared/lib/seo';

export function homeStructuredData(locale: Locale) {
  const url = absoluteUrl(localizedPath(locale, '/'));
  const areaName = locale === 'ru' ? 'Ташкентский район' : 'Toshkent tumani';

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: site.name,
      url,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: areaName,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url,
      inLanguage: locale,
    },
  ];
}

export function objectStructuredData(object: InvestmentObject, locale: Locale) {
  const image = object.imageUrl || object.media?.find((media) => media.kind === 'image')?.url;
  const [longitude, latitude] = object.coordinates || [];
  const objectUrl = absoluteUrl(localizedPath(locale, `/objects/${object.slug}`));
  const labels = locale === 'ru'
    ? {
        landArea: 'Площадь участка',
        buildingArea: 'Площадь здания',
        jobs: 'Рабочие места',
        cadastral: 'Кадастровый номер',
        region: 'Ташкентская область',
      }
    : {
        landArea: 'Yer maydoni',
        buildingArea: 'Bino maydoni',
        jobs: "Ish o'rinlari",
        cadastral: 'Kadastr raqami',
        region: 'Toshkent viloyati',
      };

  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: object.title,
    description: compactText(object.description || object.shortDescription, 500),
    url: objectUrl,
    inLanguage: locale,
    image,
    address: {
      '@type': 'PostalAddress',
      streetAddress: object.address,
      addressLocality: object.district,
      addressRegion: labels.region,
      addressCountry: 'UZ',
    },
    geo:
      latitude != null && longitude != null
        ? {
            '@type': 'GeoCoordinates',
            latitude,
            longitude,
          }
        : undefined,
    additionalProperty: [
      object.landAreaHa != null
        ? { '@type': 'PropertyValue', name: labels.landArea, value: object.landAreaHa, unitText: locale === 'ru' ? 'га' : 'ga' }
        : undefined,
      object.buildingAreaSqm != null
        ? {
            '@type': 'PropertyValue',
            name: labels.buildingArea,
            value: object.buildingAreaSqm,
            unitText: 'm²',
          }
        : undefined,
      object.jobsPlanned != null
        ? { '@type': 'PropertyValue', name: labels.jobs, value: object.jobsPlanned }
        : undefined,
      object.cadastralNumber
        ? { '@type': 'PropertyValue', name: labels.cadastral, value: object.cadastralNumber }
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
      url: object.auctionUrl || objectUrl,
    },
  };
}
