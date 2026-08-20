# Tashkent Invest

Toshkent shahridagi investitsiya obyektlarini topish uchun Next.js va Fastify asosidagi MVP portal.

## Xizmatlar

- `frontend/`: Next.js 16, TypeScript, MapLibre GL JS, OpenStreetMap.
- `backend/`: Bun, Fastify, Sequelize, PostgreSQL.
- `docker-compose.yml`: PostGIS, API va frontendning lokal stacki.

## Lokal ishga tushirish

1. `frontend/.env.example` va `backend/.env.example` fayllaridan `.env` yarating.
2. Docker ishlayotgan bo‘lsa, root papkada `docker compose up --build` buyrug‘ini bering.
3. Ilova `http://localhost:3000`, API `http://localhost:8080` manzilida ishlaydi.

Yoki Postgres lokal ishlayotganida:

```bash
cd backend && bun install && bun run db:migrate && bun run db:seed && bun run dev
cd frontend && bun install && bun run dev
```

Mock investor: `investor@demo.uz` / `invest2026`.

## Render (backend)

Backendni `Docker` runtime bilan deploy qiling: repository root `backend`, Dockerfile path esa `Dockerfile` bo‘lishi kerak. Kerakli environment variables:

- `DATABASE_URL` — Render PostgreSQL Internal Database URL.
- `DATABASE_SSL=true` — Render Postgres uchun TLS ulanishini yoqadi.
- `JWT_SECRET` — uzun, tasodifiy maxfiy kalit.
- `FRONT_HOST_NAME` — frontend manzili, masalan `https://tashkent-invest.vercel.app`.

Docker image migratsiyalarni va mock ma’lumotlarni ishga tushirishdan oldin Node LTS orqali bajaradi. OSM hamda ArcGIS dan geoma’lumotlarni yangilash deployga kirmaydi; zarur bo‘lsa alohida `npm run db:seed:geodata` buyrug‘i bilan ishga tushiring.

`NEXT_PUBLIC_MAP_TILE_URL` production uchun belgilangan OSM-compatible tile provider URL’iga almashtirilishi kerak. Ommaviy OpenStreetMap tile endpointi faqat lokal/demo yuklama uchun ishlatiladi.

## Sifat tekshiruvlari

```bash
cd backend && bun run lint && bun run format:check && bun run test:coverage
cd frontend && bun run lint && bun run test:coverage && bun run build
```

Playwright test API/Postgres stackini talab qiladi:

```bash
cd frontend
E2E_API_READY=1 bun run test:e2e
```
