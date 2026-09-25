# Localized SEO and Discovery Design

**Date:** 2026-09-25

## Objective

Make Invest Tuman reliably crawlable and understandable in Uzbek and Russian across traditional search, social sharing, and AI-assisted search. The canonical production origin is `https://toshkent-tuman-invest.uz`.

Search engines and social networks ultimately decide what they display, so the implementation will provide strong, standards-based signals without promising placement or a particular preview.

## Localized URL architecture

Public content will have a stable URL per language:

- `/uz` and `/ru`
- `/uz/map` and `/ru/map`
- `/uz/objects/:slug` and `/ru/objects/:slug`
- `/uz/login` and `/ru/login` may remain `noindex`, while preserving the selected locale.

Legacy public URLs redirect permanently to the Uzbek equivalent:

- `/` to `/uz`
- `/map` to `/uz/map`
- `/objects/:slug` to `/uz/objects/:slug`

The `x-default` alternate points to `/uz`. Language switchers are ordinary links to the equivalent localized URL, not JavaScript-only state. Each localized page is server-rendered in its requested language and provides a matching language attribute, canonical URL, and reciprocal `hreflang` alternates.

Dashboard and account-only routes remain outside the public locale tree and stay excluded from indexing. Their existing client-selected localization remains independent of public SEO routing.

## Metadata and social previews

Metadata is produced from a locale-aware source of truth. Every public page supplies:

- a localized title and description;
- its own canonical URL;
- reciprocal `uz`, `ru`, and `x-default` alternates;
- Open Graph URL, locale, alternate locale, title, description, image, and image alt text;
- a large Twitter/X card;
- crawlable icons and manifest metadata.

Dynamic 1200 by 630 social images will be generated for:

- the localized home page;
- the localized map page;
- each localized investment object.

Object cards include a representative object image when available, plus localized title, status, area, and investment amount. Layouts keep important text inside social-platform safe areas and remain readable if a remote object image is unavailable.

A crawlable 512 by 512 Invest Tuman brand mark will be exposed as the organization logo. No unverified address, telephone number, or social profile will be invented.

## Structured data

JSON-LD will use only visible and verifiable content:

- Home: `Organization` and `WebSite`.
- Map: `CollectionPage` with an `ItemList` of discoverable public objects.
- Object detail: `Place`, `Offer`, and `BreadcrumbList`.

Structured data includes canonical identifiers, localized names and descriptions, `inLanguage`, representative images, geographic coordinates when valid, and investment/availability data when present. The old `SearchAction` is omitted because it does not materially support the requested outcome.

## Sitemap architecture

The sitemap surface is:

- `/sitemap.xml`: sitemap index;
- `/sitemap-uz.xml`: every Uzbek public page and object;
- `/sitemap-ru.xml`: every Russian public page and object.

The index is the single general sitemap submitted to crawlers. Locale sitemaps include reciprocal localized alternates for every URL. Object collection is paginated until every public object is included rather than stopping at the current 48-object limit.

`lastmod` uses a real database-backed `updatedAt` value. Static routes omit `lastmod` unless a truthful update source exists. Priority and change-frequency hints are omitted because Google ignores them.

Sitemap XML is emitted by explicit route handlers so sitemap-index and `xhtml:link` output can be controlled and tested.

## Robots and AI discovery

`robots.txt` permits public localized pages and blocks dashboard, login, profile, and internal API routes. It points only to the sitemap index.

`OAI-SearchBot` is explicitly allowed because it controls eligibility for ChatGPT search results. `GPTBot` remains allowed as a separate, deliberate policy for training crawl access. The file does not claim that either bot guarantees inclusion.

`/llms.txt` provides a concise, bilingual, canonical directory of the portal, map, and locale sitemaps. It is supplemental and is not treated as a standardized ranking signal.

## Data flow and resilience

Localized server routes request the backend with the matching `Accept-Language` value. Object and collection data used for HTML, metadata, social images, structured data, and sitemaps share the same fetch helpers to avoid mismatched content.

The public object representation exposes `updatedAt`. Sitemap generation safely degrades to static localized routes if the backend is temporarily unavailable. Object metadata and social images fall back to localized portal defaults when an image or optional field is missing.

Generated XML escapes all data. Structured JSON is serialized using the existing less-than escaping guard. Remote image hosts remain constrained by Next.js image configuration.

## Verification

Automated coverage will verify:

- locale parsing and equivalent-language URL generation;
- canonical and `hreflang` reciprocity;
- localized metadata and Open Graph values;
- sitemap-index validity and content type;
- complete paginated object coverage in both locale sitemaps;
- XML escaping and accurate `lastmod` behavior;
- valid structured-data serialization;
- crawler allow/disallow rules;
- localized route rendering and legacy redirects.

Repository lint, unit coverage, production build, and available Playwright flows will be run. Social previews should also be checked after deployment with platform debuggers because crawlers require a public origin. Search Console submission, recrawl timing, and actual search placement remain deployment/operations work rather than code guarantees.
