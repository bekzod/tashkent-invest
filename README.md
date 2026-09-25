# Tashkent Invest

Toshkent tumanidagi tasdiqlangan investitsiya obyektlarini topish uchun Next.js va Fastify asosidagi portal.

## Xizmatlar

- `frontend/`: Next.js 16, TypeScript, MapLibre GL JS, OpenStreetMap.
- `backend/`: Bun, Fastify, Sequelize, PostgreSQL.
- `docker-compose.yml`: PostGIS, API va frontendning lokal stacki.

## Lokal ishga tushirish

1. `frontend/.env.example` va `backend/.env.example` fayllaridan `.env` yarating.
2. Docker ishlayotgan bo‘lsa, root papkada `docker compose up --build` buyrug‘ini bering. Compose lokal E2E/demo seedni aniq `ALLOW_E2E_SEED=true` chegarasi orqali ishga tushiradi.
3. Ilova `http://localhost:3000`, API `http://localhost:8080` manzilida ishlaydi.

Yoki Postgres lokal ishlayotganida:

```bash
cd backend && bun install && bun run db:migrate && bun run db:seed && bun run dev
cd frontend && bun install && bun run dev
```

`db:seed` faqat manbasi ko‘rsatilgan geografik hududlarni yozadi va obyekt yaratmaydi.
Faqat lokal/E2E muhitida demo obyekt va foydalanuvchilar kerak bo‘lsa:

```bash
cd backend
ALLOW_E2E_SEED=true bun run db:seed:e2e
```

Lokal demo investor: `investor@demo.uz` / `invest2026`. Demo obyektlarda `is_demo=true`
bo‘ladi va `INCLUDE_DEMO_DATA=true` bo‘lmagan public API, statistika hamda sitemapga kirmaydi.

## Render (backend)

Backendni `Docker` runtime bilan deploy qiling: repository root `backend`, Dockerfile path esa `Dockerfile` bo‘lishi kerak. Kerakli environment variables:

- `DATABASE_URL` — Render PostgreSQL Internal Database URL.
- `DATABASE_SSL=true` — Render Postgres uchun TLS ulanishini yoqadi.
- `JWT_SECRET` — uzun, tasodifiy maxfiy kalit.
- `FRONT_HOST_NAME` — frontend manzili, masalan `https://tashkent-invest.vercel.app`.

Docker image startup vaqtida faqat migratsiyalarni bajaradi; production bazaga mock obyekt yoki demo foydalanuvchi yozmaydi. OSM hamda ArcGIS dan geoma’lumotlarni yangilash deployga kirmaydi; zarur bo‘lsa alohida `npm run db:seed:geodata` buyrug‘i bilan ishga tushiring.

`NEXT_PUBLIC_MAP_TILE_URL` production uchun belgilangan OSM-compatible tile provider URL’iga almashtirilishi kerak. Ommaviy OpenStreetMap tile endpointi faqat lokal/demo yuklama uchun ishlatiladi.

## SEO va public discovery

Production frontend uchun quyidagi qiymatni build vaqtida belgilang:

```bash
NEXT_PUBLIC_SITE_URL=https://toshkent-tuman-invest.uz
```

Public sahifalar `/uz` va `/ru` prefikslaridan foydalanadi. `/sitemap.xml` umumiy sitemap
indeksi bo‘lib, `/sitemap-uz.xml` va `/sitemap-ru.xml` fayllariga yo‘naltiradi. Har bir til
sitemapida o‘zaro `hreflang` bog‘lanishlari va faqat haqiqiy `updatedAt` qiymatiga ega,
public holatdagi, demo bo‘lmagan obyektlar bor. `robots.txt`, `llms.txt`, manifest va dinamik
Open Graph bannerlari public endpoint sifatida beriladi.

Release tekshiruvlari [docs/seo-release-checklist.md](docs/seo-release-checklist.md) faylida.

## Sifat tekshiruvlari

```bash
cd backend && bun run lint && bun run format:check && bun run test:coverage
cd frontend && bun run lint && bun run test:coverage && bun run build
```

Playwright desktop (`1440x900`) va mobile (`390x844`, touch) Chromium
loyihalarini ishlatadi. Birinchi ishga tushirishdan oldin brauzerni o‘rnating va
testlar ro‘yxatini tekshiring:

```bash
cd frontend
bunx playwright install chromium
bunx playwright test --list
```

API/Postgres talab qiladigan to‘liq E2E testlar uchun avval Docker stackining
`healthy` holatga kelishini kuting, keyin testlarni ishga tushiring:

```bash
docker compose up --build --wait
cd frontend
E2E_API_READY=1 bun run test:e2e
```

Alohida loyiha tekshiruvi uchun `--project=desktop-chromium` yoki
`--project=mobile-chromium` ishlatiladi. Visual test helperi xarita tile'larini
`frontend/e2e/fixtures/map-tile.svg` bilan almashtiradi, animatsiyalarni o‘chiradi
va failure holatida screenshot, video hamda trace artefaktlarini saqlaydi. Fixture
cleanup faqat `e2e-*` prefiksli aniq email va slug qiymatlari bilan bajarilishi
kerak.
