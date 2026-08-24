import type { Metadata } from "next";
import HomeView from "@/views/home";
import {
  absoluteUrl,
  fetchPublicObjects,
  fetchPublicStatistics,
  publicPageMetadata,
  site,
  structuredData,
} from "@/shared/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: site.title,
  description:
    "Toshkent tumanidagi investitsiya obyektlari, yer uchastkalari, tayyor binolar va e-auksion imkoniyatlarini bitta interaktiv portalda ko'ring.",
  path: "/",
});

const homeJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: absoluteUrl("/"),
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Toshkent tumani",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: absoluteUrl("/"),
    inLanguage: ["uz", "ru"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/map")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
];

export default async function HomePage() {
  const [initialStats, initialObjects] = await Promise.all([
    fetchPublicStatistics().catch(() => null),
    fetchPublicObjects(4).catch(() => []),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={structuredData(homeJsonLd)}
      />
      <HomeView initialLocale="uz" initialObjects={initialObjects} initialStats={initialStats} />
    </>
  );
}
