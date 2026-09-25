import type { InvestmentObject } from '@/entities/investment-object/types';
import { localizedPath, type Locale } from '@/shared/i18n/routing';
import { absoluteUrl, compactText, seoCatalog, site } from '@/shared/lib/seo';

type GraphNode = Record<string, unknown> & { '@type': string };

function graph(nodes: GraphNode[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

function validImage(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function validCoordinates(coordinates: InvestmentObject['coordinates']) {
  if (!coordinates || coordinates.length !== 2) return undefined;
  const [longitude, latitude] = coordinates;
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return undefined;
  }
  return { '@type': 'GeoCoordinates', latitude, longitude };
}

export function homeStructuredData(locale: Locale) {
  const url = absoluteUrl(localizedPath(locale, '/'));
  const organizationId = `${site.url}/#organization`;
  const websiteId = `${url}#website`;
  const areaName = locale === 'ru' ? 'Ташкентский район' : 'Toshkent tumani';

  return graph([
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: site.name,
      url: site.url,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/icon'),
        width: 512,
        height: 512,
      },
      areaServed: { '@type': 'AdministrativeArea', name: areaName },
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      name: site.name,
      url,
      description: seoCatalog[locale].siteDescription,
      inLanguage: locale,
      publisher: { '@id': organizationId },
    },
  ]);
}

export function mapStructuredData(objects: InvestmentObject[], locale: Locale) {
  const url = absoluteUrl(localizedPath(locale, '/map'));
  const itemListId = `${url}#objects`;
  return graph([
    {
      '@type': 'CollectionPage',
      '@id': `${url}#page`,
      name: seoCatalog[locale].map.title,
      description: seoCatalog[locale].map.description,
      url,
      inLanguage: locale,
      mainEntity: { '@id': itemListId },
    },
    {
      '@type': 'ItemList',
      '@id': itemListId,
      numberOfItems: objects.length,
      itemListElement: objects.map((object, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: object.title,
        url: absoluteUrl(localizedPath(locale, `/objects/${object.slug}`)),
      })),
    },
  ]);
}

export function objectStructuredData(object: InvestmentObject, locale: Locale) {
  const image = validImage(
    object.imageUrl || object.media?.find((media) => media.kind === 'image')?.url,
  );
  const objectUrl = absoluteUrl(localizedPath(locale, `/objects/${object.slug}`));
  const homeUrl = absoluteUrl(localizedPath(locale, '/'));
  const mapUrl = absoluteUrl(localizedPath(locale, '/map'));
  const labels =
    locale === 'ru'
      ? {
          home: 'Главная',
          map: 'Карта объектов',
          landArea: 'Площадь участка',
          buildingArea: 'Площадь здания',
          jobs: 'Рабочие места',
          cadastral: 'Кадастровый номер',
          region: 'Ташкентская область',
        }
      : {
          home: 'Bosh sahifa',
          map: 'Obyektlar xaritasi',
          landArea: 'Yer maydoni',
          buildingArea: 'Bino maydoni',
          jobs: "Ish o'rinlari",
          cadastral: 'Kadastr raqami',
          region: 'Toshkent viloyati',
        };
  const properties = [
    object.landAreaHa != null
      ? {
          '@type': 'PropertyValue',
          name: labels.landArea,
          value: object.landAreaHa,
          unitText: locale === 'ru' ? 'га' : 'ga',
        }
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
  ].filter(Boolean);

  return graph([
    {
      '@type': 'Place',
      '@id': `${objectUrl}#place`,
      name: object.title,
      description: compactText(object.description || object.shortDescription, 500),
      url: objectUrl,
      inLanguage: locale,
      ...(image ? { image } : {}),
      ...(object.address || object.district
        ? {
            address: {
              '@type': 'PostalAddress',
              ...(object.address ? { streetAddress: object.address } : {}),
              ...(object.district ? { addressLocality: object.district } : {}),
              addressRegion: labels.region,
              addressCountry: 'UZ',
            },
          }
        : {}),
      ...(validCoordinates(object.coordinates) ? { geo: validCoordinates(object.coordinates) } : {}),
      ...(properties.length ? { additionalProperty: properties } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${objectUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: labels.home, item: homeUrl },
        { '@type': 'ListItem', position: 2, name: labels.map, item: mapUrl },
        { '@type': 'ListItem', position: 3, name: object.title, item: objectUrl },
      ],
    },
  ]);
}
