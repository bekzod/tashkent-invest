import type { Metadata } from "next";
import type { InvestmentObject } from "@/entities/investment-object/types";
import { apiBaseUrl } from "@/shared/api/base-url";
import { localizedPath, type Locale } from "@/shared/i18n/routing";

const fallbackSiteUrl = "https://toshkent-tuman-invest.uz";

function resolveSiteUrl(value: string | undefined) {
  if (!value?.trim()) return fallbackSiteUrl;

  try {
    return new URL(value).origin;
  } catch {
    return fallbackSiteUrl;
  }
}

const siteUrl = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const seoCatalog = {
  uz: {
    siteTitle: "Invest Tuman — Toshkent tumani investitsiya portali",
    siteDescription:
      "Toshkent tumanidagi yer uchastkalari, tayyor binolar, investitsiya takliflari va auksion obyektlarini interaktiv xaritada toping.",
    keywords: [
      "Toshkent tumani investitsiya",
      "investitsiya obyektlari",
      "investitsiya xaritasi",
      "yer uchastkalari",
      "auksion obyektlari",
    ],
    home: {
      title: "Invest Tuman — Toshkent tumani investitsiya portali",
      description:
        "Toshkent tumanidagi investitsiya obyektlari, yer uchastkalari, tayyor binolar va e-auksion imkoniyatlarini bitta portalda ko‘ring.",
      imageAlt: "Toshkent tumani investitsiya imkoniyatlari",
    },
    map: {
      title: "Investitsiya obyektlari xaritasi",
      description:
        "Toshkent tumanidagi yer uchastkalari, tayyor binolar, investitsiya takliflari va auksion obyektlarini xaritada qidiring va filtrlang.",
      imageAlt: "Toshkent tumani investitsiya obyektlari xaritasi",
    },
    login: {
      title: "Investor kabinetiga kirish",
      description: "Invest Tuman investor kabinetiga xavfsiz kirish sahifasi.",
      imageAlt: "Invest Tuman investor kabineti",
    },
  },
  ru: {
    siteTitle: "Invest Tuman — инвестиционный портал Ташкентского района",
    siteDescription:
      "Найдите земельные участки, готовые здания, инвестиционные предложения и объекты аукциона Ташкентского района на интерактивной карте.",
    keywords: [
      "инвестиции Ташкентский район",
      "инвестиционные объекты",
      "инвестиционная карта",
      "земельные участки",
      "объекты аукциона",
    ],
    home: {
      title: "Invest Tuman — инвестиционный портал Ташкентского района",
      description:
        "Инвестиционные объекты, земельные участки, готовые здания и электронные аукционы Ташкентского района на одном портале.",
      imageAlt: "Инвестиционные возможности Ташкентского района",
    },
    map: {
      title: "Карта инвестиционных объектов",
      description:
        "Ищите и фильтруйте на карте земельные участки, готовые здания, инвестиционные предложения и объекты аукциона Ташкентского района.",
      imageAlt: "Инвестиционная карта Ташкентского района",
    },
    login: {
      title: "Вход в кабинет инвестора",
      description: "Безопасная страница входа в кабинет инвестора Invest Tuman.",
      imageAlt: "Кабинет инвестора Invest Tuman",
    },
  },
} as const;

export const site = {
  name: "Invest Tuman",
  title: seoCatalog.uz.siteTitle,
  description: seoCatalog.uz.siteDescription,
  url: siteUrl,
  locale: "uz_UZ",
  alternateLocale: "ru_RU",
};

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}

export function compactText(value: string | undefined, maxLength = 155) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function publicPageMetadata({
  locale,
  title,
  description,
  path,
  imageAlt,
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  imageAlt: string;
}): Metadata {
  const copy = seoCatalog[locale];
  const localizedCanonicalPath = localizedPath(locale, path);
  const canonical = absoluteUrl(localizedCanonicalPath);
  const alternates = {
    uz: absoluteUrl(localizedPath("uz", path)),
    ru: absoluteUrl(localizedPath("ru", path)),
    "x-default": absoluteUrl(localizedPath("uz", path)),
  };
  const pageTitle = title.includes(site.name) ? title : `${title} | ${site.name}`;
  const compactDescription = compactText(description);
  const socialImage = {
    url: absoluteUrl(`${localizedCanonicalPath}/opengraph-image`),
    width: 1200,
    height: 630,
    alt: imageAlt,
  };

  return {
    title: { absolute: pageTitle },
    description: compactDescription,
    keywords: [...copy.keywords],
    alternates: { canonical, languages: alternates },
    openGraph: {
      title: pageTitle,
      description: compactDescription,
      url: canonical,
      siteName: site.name,
      locale: locale === "uz" ? "uz_UZ" : "ru_RU",
      alternateLocale: [locale === "uz" ? "ru_RU" : "uz_UZ"],
      type: "website",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: compactDescription,
      images: [socialImage],
    },
  };
}

export function homeMetadata(locale: Locale): Metadata {
  const copy = seoCatalog[locale].home;
  return publicPageMetadata({ locale, path: "/", ...copy });
}

export function mapMetadata(locale: Locale): Metadata {
  const copy = seoCatalog[locale].map;
  return publicPageMetadata({ locale, path: "/map", ...copy });
}

export function loginMetadata(locale: Locale): Metadata {
  const copy = seoCatalog[locale].login;
  return {
    ...publicPageMetadata({ locale, path: "/login", ...copy }),
    robots: { index: false, follow: false },
  };
}

export function objectMetadata(object: InvestmentObject, locale: Locale): Metadata {
  const area = object.landAreaHa
    ? locale === "uz"
      ? `${object.landAreaHa} ga`
      : `${object.landAreaHa} га`
    : object.buildingAreaSqm
      ? locale === "uz"
        ? `${object.buildingAreaSqm} m²`
        : `${object.buildingAreaSqm} м²`
      : undefined;
  const amount = object.investmentAmountUsd
    ? `$${Number(object.investmentAmountUsd).toLocaleString("en-US")}`
    : undefined;
  const description = compactText(
    [
      object.shortDescription || object.description,
      object.district
        ? locale === "uz"
          ? `${object.district} tumani`
          : `район ${object.district}`
        : undefined,
      area ? (locale === "uz" ? `maydoni ${area}` : `площадь ${area}`) : undefined,
      amount
        ? locale === "uz"
          ? `investitsiya hajmi ${amount}`
          : `объём инвестиций ${amount}`
        : undefined,
    ]
      .filter(Boolean)
      .join(". "),
  );
  const canonicalPath = `/objects/${object.slug}`;
  const metadata = publicPageMetadata({
    locale,
    title: object.title,
    description: description || seoCatalog[locale].siteDescription,
    path: canonicalPath,
    imageAlt:
      locale === "uz"
        ? `${object.title} investitsiya obyekti`
        : `Инвестиционный объект «${object.title}»`,
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
    },
  };
}

export function structuredData(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

export async function fetchPublicObject(slug: string, locale = "uz") {
  const response = await fetch(`${apiBaseUrl}/objects/${encodeURIComponent(slug)}`, {
    headers: { "Accept-Language": locale },
    next: { revalidate: 300 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Unable to load object ${slug}`);
  return response.json() as Promise<InvestmentObject>;
}

export async function fetchPublicObjects(limit = 48, locale = "uz") {
  const response = await fetch(`${apiBaseUrl}/objects?limit=${limit}`, {
    headers: { "Accept-Language": locale },
    next: { revalidate: 300 },
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as { items?: InvestmentObject[] };
  return payload.items || [];
}

export async function fetchPublicStatistics(locale = "uz") {
  const response = await fetch(`${apiBaseUrl}/statistics`, {
    headers: { "Accept-Language": locale },
    next: { revalidate: 300 },
  });
  if (!response.ok) return null;
  return response.json() as Promise<{
    auctions: number;
    investmentAmountUsd: number;
    objects: number;
    upcoming: number;
  }>;
}
