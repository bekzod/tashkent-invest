# Invest Tuman landing visual system design

## Maqsad

Landing sahifasini Toshkent investitsiya portali uchun ishonchli, zamonaviy va oson o‘qiladigan interfeysga aylantirish. Avval berilgan reference kompozitsiyasi saqlanadi: bosh navigatsiya, xarita fonidagi hero, o‘ngdagi filter, mashhur obyektlar, kategoriyalar, jarayon bloki va obuna qismi.

## Dizayn qarori

Tanlangan yo‘nalish — mavjud ko‘k-oq brend uslubini saqlagan holda, birlashtirilgan layout va typography tizimi. Hero xaritasi fon vazifasida qoladi; chapdagi kontent va map o‘rtasida keskin vertikal chegara bo‘lmaydi. O‘qiluvchanlik uchun och rangli gradient qo‘yiladi, lekin map zoom hamda markerlari faol qoladi.

## Vizual tizim

- Asosiy shrift: `Inter` yoki hozir loyihada preload qilinayotgan Next fonti; fallback sifatida `Arial, sans-serif`.
- Asosiy matn: 16px, line-height 1.5; yordamchi matn 12–14px dan kichik bo‘lmaydi.
- Sarlavhalar: hero uchun 40–48px, section heading uchun 20–24px, card title uchun 15–16px.
- Spacing qadamlari: 4, 8, 12, 16, 24, 32, 48px.
- Burchak radiusi: kichik control 8px, kartalar 12px, katta bloklar 16px.
- Ranglar: navy matn, asosiy ko‘k CTA, muted ikkilamchi matn, juda och ko‘k background va neytral border.

## Komponentlar

1. Header: markazlashgan kontent eni, navigatsiya linklari va auth tugmalari uchun barqaror balandlik va aniq focus/hover holatlari.
2. Hero: uch kolonka desktop grid — kontent, fon xaritasi, filter. Mobile’da o‘qish tartibiga muvofiq bitta kolonka.
3. Filter: hero’ning o‘ng chetida, map ustida, maxsus sirt/padding/radius bilan; checkbox va range control’lari 44px ga yaqin touch target hosil qiladi.
4. Object card: rasmlar, status badge, metadata va narx uchun bir xil ichki ritm; hoverda ortiqcha sakramaydigan ko‘tarilish va shadow.
5. Kategoriyalar, jarayon va obuna: desktop grid alignmenti va mobile stack holatlarida bir xil section spacing.

## Accessibility

- Matnlar kamida 14px bo‘ladi, hero va CTA kontrasti WCAG AA talabiga yaqinlashtiriladi.
- Barcha button, link, input hamda select’larda ko‘rinadigan `:focus-visible` ring bo‘ladi.
- Touch targetlar kamida 40px, asosiy actionlar 44px bo‘ladi.
- `prefers-reduced-motion` foydalanuvchilarida hover/motion minimal bo‘ladi.

## Tekshiruv

- 1440px va 768px/390px viewportlarda screenshot va manual tekshiruv.
- `bun run lint`, `bun run test`, zarur bo‘lsa `bun run test:e2e`.
- Xaritada zoom, marker selection va filter ishlashi dizayn o‘zgarganda buzilmaganini tekshirish.
