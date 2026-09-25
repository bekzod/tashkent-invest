# Localized SEO release checklist

Bu checklist `https://toshkent-tuman-invest.uz` production domeni uchun. Qidiruvdagi o‘rin,
AI javobidagi iqtibos yoki ijtimoiy tarmoq tanlaydigan preview tashqi platforma qarori;
ularni kod relizi kafolatlamaydi.

## Release oldidan

- `NEXT_PUBLIC_SITE_URL=https://toshkent-tuman-invest.uz` frontend build vaqtida mavjud.
- Production Docker startup faqat migratsiyani bajaradi; `db:seed:e2e` ishlamaydi.
- Production muhitida `ALLOW_E2E_SEED` va `INCLUDE_DEMO_DATA` belgilanmagan.
- Public obyekt `available`, `auction` yoki `upcoming` holatida va `is_demo=false`.
- Sitemap fetchi `indexable=true` bilan bajariladi va lokal demo rejimida ham demo yozuvlarni olmaydi.
- Obyektning UZ/RU sarlavhasi, tavsifi, manzili, media huquqi va holati tekshirilgan.
- `updatedAt` bazadagi haqiqiy yangilanish sanasi; sitemap request vaqtidagi sana emas.
- Obyekt sotuv taklifi ekani huquqiy tasdiqlanmaguncha JSON-LD ichida `Offer` berilmaydi.

## Lokal va CI tekshiruvlari

```bash
cd backend
bun run lint
bun run format:check
bun run test:coverage

cd ../frontend
bun run lint
bun run test:coverage
bun run build
bun run test:e2e
```

Quyidagi endpointlarda status, `Content-Type`, canonical host va private URL yo‘qligini tekshiring:

- `/uz`, `/ru`, `/uz/map`, `/ru/map`
- `/uz/opengraph-image`, `/ru/opengraph-image`
- `/sitemap.xml`, `/sitemap-uz.xml`, `/sitemap-ru.xml`
- `/robots.txt`, `/llms.txt`, `/manifest.webmanifest`, `/icon`

## Deploydan keyin

- DNS va HTTPS canonical hostda to‘g‘ri ishlashini tekshiring.
- `/`, `/map` va eski obyekt URLlari `308` orqali `/uz` variantiga o‘tishini tekshiring.
- Google Search Console va Bing Webmaster Tools’ga faqat `/sitemap.xml` yuboring.
- Google URL Inspection bilan `/uz`, `/ru`, map va kamida bitta obyektni tekshiring.
- Google Rich Results Test’da Organization, WebSite, CollectionPage, ItemList, Place va BreadcrumbList’ni tekshiring.
- Facebook Sharing Debugger orqali UZ/RU home, map va obyekt kartalarini qayta scrape qiling.
- `OAI-SearchBot` va `GPTBot` uchun robots qoidalari public sahifalarni ruxsat etishini tekshiring.
- OpenSEO follow-up crawl orqali locale route, H1, canonical, hreflang va sitemap qamrovini qayta o‘lchang.

Ijtimoiy platformalar eski kartani cache qilishi mumkin; bunday holatda rescrape kerak. Deploy
bo‘lmaguncha Search Console, Rich Results Test, Facebook Debugger va OpenSEO follow-up crawl
yakuniy tasdiq sifatida bajarilmaydi.
