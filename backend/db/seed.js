'use strict';

require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./models');
const { geographicAreas } = require('./data/tashkent-district-geodata');

const localities = geographicAreas.filter((area) => area.kind === 'locality');
const types = ['land', 'building', 'proposal'];
const statuses = ['available', 'auction', 'upcoming'];
const sectors = [
  'manufacturing',
  'logistics',
  'tourism',
  'trade',
  'it',
  'agriculture',
  'construction',
  'energy',
];

const titleUz = [
  'Sanoat uchun yer uchastkasi',
  'Tayyor ishlab chiqarish binosi',
  'Logistika markazi loyihasi',
];
const titleRu = [
  'Земельный участок для промышленности',
  'Готовое производственное здание',
  'Проект логистического центра',
];

function siteGeometry(longitude, latitude, landAreaHa, index) {
  const areaSqm = Number(landAreaHa) * 10000;
  const aspectRatio = 1.1 + (index % 4) * 0.18;
  const halfWidthMeters = Math.sqrt(areaSqm * aspectRatio) / 2;
  const halfHeightMeters = Math.sqrt(areaSqm / aspectRatio) / 2;
  const longitudeScale = 111320 * Math.cos((latitude * Math.PI) / 180);
  const angle = ((index % 5) - 2) * 0.12;
  const corners = [
    [-halfWidthMeters, -halfHeightMeters],
    [halfWidthMeters, -halfHeightMeters],
    [halfWidthMeters, halfHeightMeters],
    [-halfWidthMeters, halfHeightMeters],
  ].map(([x, y]) => {
    const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
    const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);
    return [longitude + rotatedX / longitudeScale, latitude + rotatedY / 111320];
  });
  return { type: 'Polygon', coordinates: [[...corners, corners[0]]] };
}

async function seed() {
  await db.sequelize.authenticate();
  const passwordHash = await bcrypt.hash('invest2026', 10);
  await db.User.findOrCreate({
    where: { email: 'investor@demo.uz' },
    defaults: { name: 'Demo Investor', passwordHash },
  });
  await db.User.findOrCreate({
    where: { email: 'admin@demo.uz' },
    defaults: { name: 'Portal Admin', passwordHash, role: 'admin' },
  });

  await Promise.all(
    geographicAreas.map((area) =>
      db.GeographicArea.upsert({
        slug: area.slug,
        parentSlug: area.parentSlug,
        kind: area.kind,
        nameUz: area.nameUz,
        nameRu: area.nameRu,
        aliases: area.aliases,
        geometry: area.geometry,
        centerLongitude: area.center[0],
        centerLatitude: area.center[1],
        source: area.source,
      }),
    ),
  );

  const objects = await Promise.all(
    Array.from({ length: 128 }, async (_, index) => {
      const locality = localities[index % localities.length];
      const [baseLng, baseLat] = locality.center;
      const district = locality.nameUz;
      const type = types[index % types.length];
      const latitude = baseLat + ((index % 5) - 2) * 0.00115;
      const longitude = baseLng + ((index % 7) - 3) * 0.00135;
      const landAreaHa = (index % 12) + 1.5;
      // The first 24 records keep the original even split. The following records
      // complete the landing-page reference totals: 128 objects, 45 auctions,
      // 67 upcoming lots and 16 available objects.
      const status =
        index < 24
          ? statuses[index % statuses.length]
          : index < 61
            ? 'auction'
            : index < 120
              ? 'upcoming'
              : 'available';
      const slug = `tashkent-invest-${index + 1}`;
      const payload = {
        slug,
        type,
        status,
        district,
        cadastralNumber: `10:0${(index % 9) + 1}:0${(index % 7) + 1}:00${index + 11}`,
        // Every mock coordinate is generated inside a locality search zone,
        // itself nested in Toshkent tumani's OSM administrative boundary.
        latitude,
        longitude,
        siteGeometry: siteGeometry(longitude, latitude, landAreaHa, index),
        landAreaHa,
        buildingAreaSqm: 1200 + index * 175,
        usableAreaSqm: 900 + index * 110,
        investmentAmountUsd: 250000 + index * 175000,
        jobsPlanned: 20 + index * 8,
        auctionUrl: status === 'auction' ? 'https://e-auksion.uz/' : null,
        auctionStartsAt:
          status === 'upcoming' ? new Date(Date.now() + (index + 2) * 86400000) : null,
        sectors: [sectors[index % sectors.length], sectors[(index + 2) % sectors.length]],
        utilities: {
          electricity: true,
          gas: index % 2 === 0,
          water: true,
          sewerage: index % 3 !== 0,
          internet: true,
          asphaltRoad: true,
        },
        legalDetails: { status: 'Tayyor hujjatlar', ownership: 'Davlat mulki' },
        constructionDetails: { maxFloors: 3 + (index % 5), coveragePercent: 55 + (index % 20) },
        benefits: { tax: 'Mahalliy imtiyozlar mavjud', support: 'Hokimlik ko‘magi' },
      };
      const [object] = await db.InvestmentObject.findOrCreate({
        where: { slug },
        defaults: payload,
      });
      await object.update(payload);
      await db.InvestmentObjectTranslation.destroy({ where: { investmentObjectId: object.id } });
      await db.InvestmentObjectTranslation.bulkCreate([
        {
          investmentObjectId: object.id,
          locale: 'uz',
          title: `${titleUz[index % titleUz.length]} ${index + 1}`,
          shortDescription: `${district} tumanidagi investitsiya imkoniyati.`,
          description:
            'Muhandislik kommunikatsiyalari mavjud bo‘lgan, investorlar uchun tayyor mock investitsiya obyekti.',
          address: `${district}, Toshkent tumani, Toshkent viloyati`,
          permittedBusinesses: object.sectors,
        },
        {
          investmentObjectId: object.id,
          locale: 'ru',
          title: `${titleRu[index % titleRu.length]} ${index + 1}`,
          shortDescription: `Инвестиционная возможность в ${district}.`,
          description:
            'Демонстрационный инвестиционный объект с инженерной инфраструктурой для инвесторов.',
          address: `${locality.nameRu}, Ташкентский район, Ташкентская область`,
          permittedBusinesses: object.sectors,
        },
      ]);
      await db.ObjectMedia.destroy({ where: { investmentObjectId: object.id } });
      await db.ObjectMedia.bulkCreate([
        {
          investmentObjectId: object.id,
          kind: 'image',
          url: `https://picsum.photos/seed/tashkent-invest-${index + 1}/1200/720`,
          title: 'Mock foto',
          sortOrder: 0,
        },
        {
          investmentObjectId: object.id,
          kind: 'document',
          url: 'https://example.com/document.pdf',
          title: 'Loyiha hujjati',
          sortOrder: 1,
        },
      ]);
      return object;
    }),
  );
  console.log(`Seeded ${objects.length} investment objects.`);
}

seed()
  .then(() => db.sequelize.close())
  .catch(async (error) => {
    console.error(error);
    await db.sequelize.close();
    process.exitCode = 1;
  });
