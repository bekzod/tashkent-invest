import type { Metadata } from "next";
import type { InvestmentObject } from "@/entities/investment-object/types";
import { apiBaseUrl } from "@/shared/api/base-url";

const fallbackSiteUrl = "https://invest-tuman.uz";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || fallbackSiteUrl;

export const site = {
  name: "Invest Tuman",
  title: "Invest Tuman - Toshkent investitsiya obyektlari portali",
  description:
    "Toshkent tumani bo'yicha yer uchastkalari, tayyor binolar, investitsiya takliflari va auksion obyektlarini interaktiv xaritada toping.",
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
  title,
  description,
  path,
  images,
}: {
  title: string;
  description: string;
  path: string;
  images?: string[];
}): Metadata {
  const canonical = absoluteUrl(path);
  const pageTitle = title.includes(site.name) ? title : `${title} | ${site.name}`;
  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical },
    openGraph: {
      title: pageTitle,
      description,
      url: canonical,
      siteName: site.name,
      locale: site.locale,
      alternateLocale: site.alternateLocale,
      type: "website",
      images,
    },
    twitter: {
      card: images?.length ? "summary_large_image" : "summary",
      title: pageTitle,
      description,
      images,
    },
  };
}

export function objectMetadata(object: InvestmentObject): Metadata {
  const area = object.landAreaHa
    ? `${object.landAreaHa} ga`
    : object.buildingAreaSqm
      ? `${object.buildingAreaSqm} m2`
      : undefined;
  const amount = object.investmentAmountUsd
    ? `$${Number(object.investmentAmountUsd).toLocaleString("en-US")}`
    : undefined;
  const description = compactText(
    [
      object.shortDescription || object.description,
      object.district ? `${object.district} tumani` : undefined,
      area ? `maydoni ${area}` : undefined,
      amount ? `investitsiya hajmi ${amount}` : undefined,
    ]
      .filter(Boolean)
      .join(". "),
  );
  const image = object.imageUrl || object.media?.find((media) => media.kind === "image")?.url;
  const canonicalPath = `/objects/${object.slug}`;
  return {
    ...publicPageMetadata({
      title: `${object.title} | Invest Tuman`,
      description,
      path: canonicalPath,
      images: image ? [image] : undefined,
    }),
    openGraph: {
      ...publicPageMetadata({
        title: `${object.title} | Invest Tuman`,
        description,
        path: canonicalPath,
        images: image ? [image] : undefined,
      }).openGraph,
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
