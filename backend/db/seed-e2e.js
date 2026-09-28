'use strict';

require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./models');
const { geographicAreas } = require('./data/tashkent-district-geodata');
const { seedVerifiedBaseline } = require('./seed');

const localities = geographicAreas.filter((area) => area.kind === 'locality');
const types = ['land', 'building', 'proposal'];
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

function demoStatus(index) {
  if (index < 24) return ['available', 'auction', 'upcoming'][index % 3];
  if (index < 61) return 'auction';
  if (index < 120) return 'upcoming';
  return 'available';
}

async function seedDemoUsers(database, passwordHash) {
  await database.User.findOrCreate({
    where: { email: 'investor@demo.uz' },
    defaults: { name: 'Demo Investor', passwordHash },
  });
  await database.User.findOrCreate({
    where: { email: 'admin@demo.uz' },
    defaults: { name: 'Portal Admin', passwordHash, role: 'admin' },
  });
}

async function seedDemoObjects(database) {
  return Promise.all(
    Array.from({ length: 128 }, async (_, index) => {
      const locality = localities[index % localities.length];
      const [baseLng, baseLat] = locality.center;
      const status = demoStatus(index);
      const slug = `tashkent-invest-${index + 1}`;
      const payload = {
        slug,
        type: types[index % types.length],
        status,
        isDemo: true,
        district: locality.nameUz,
        cadastralNumber: `10:0${(index % 9) + 1}:0${(index % 7) + 1}:00${index + 11}`,
        latitude: baseLat + ((index % 5) - 2) * 0.00115,
        longitude: baseLng + ((index % 7) - 3) * 0.00135,
        siteGeometry:
          index === 0
            ? {
                type: 'Polygon',
                coordinates: [
                  [
                    [69.20276, 41.400898],
                    [69.20316, 41.400898],
                    [69.20316, 41.401298],
                    [69.20276, 41.401298],
                    [69.20276, 41.400898],
                  ],
                ],
              }
            : null,
        geometrySource: index === 0 ? 'demo' : null,
        landAreaHa: (index % 12) + 1.5,
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
        legalDetails: { status: 'Demo fixture', ownership: 'Demo fixture' },
        constructionDetails: { maxFloors: 3 + (index % 5), coveragePercent: 55 },
        benefits: { support: 'Demo fixture' },
      };
      const [object] = await database.InvestmentObject.findOrCreate({
        where: { slug },
        defaults: payload,
      });
      await object.update(payload);
      await database.InvestmentObjectTranslation.destroy({
        where: { investmentObjectId: object.id },
      });
      await database.InvestmentObjectTranslation.bulkCreate([
        {
          investmentObjectId: object.id,
          locale: 'uz',
          title: `${titleUz[index % titleUz.length]} ${index + 1}`,
          shortDescription: `${locality.nameUz} hududidagi E2E demo obyekti.`,
          description: 'Faqat lokal va E2E tekshiruvlari uchun demo investitsiya obyekti.',
          address: `${locality.nameUz}, Toshkent tumani, Toshkent viloyati`,
          permittedBusinesses: payload.sectors,
        },
        {
          investmentObjectId: object.id,
          locale: 'ru',
          title: `${titleRu[index % titleRu.length]} ${index + 1}`,
          shortDescription: `Демонстрационный E2E объект в ${locality.nameRu}.`,
          description: 'Демо-объект только для локальных и E2E проверок.',
          address: `${locality.nameRu}, Ташкентский район, Ташкентская область`,
          permittedBusinesses: payload.sectors,
        },
      ]);
      await database.ObjectMedia.destroy({ where: { investmentObjectId: object.id } });
      await database.ObjectMedia.bulkCreate([
        {
          investmentObjectId: object.id,
          kind: 'image',
          url: `https://picsum.photos/seed/tashkent-invest-${index + 1}/1200/720`,
          title: 'E2E demo foto',
          sortOrder: 0,
        },
        {
          investmentObjectId: object.id,
          kind: 'document',
          url: 'https://example.com/document.pdf',
          title: 'E2E demo hujjati',
          sortOrder: 1,
        },
      ]);
      return object;
    }),
  );
}

async function seedE2E(database = db) {
  if (process.env.ALLOW_E2E_SEED !== 'true') {
    throw new Error('Refusing to seed demo inventory without ALLOW_E2E_SEED=true');
  }
  await seedVerifiedBaseline(database);
  await seedDemoUsers(database, await bcrypt.hash('invest2026', 10));
  const objects = await seedDemoObjects(database);
  console.log(`Seeded ${objects.length} isolated E2E investment objects.`);
}

if (require.main === module) {
  seedE2E()
    .then(() => db.sequelize.close())
    .catch(async (error) => {
      console.error(error);
      await db.sequelize.close();
      process.exitCode = 1;
    });
}

module.exports = { demoStatus, seedE2E };
