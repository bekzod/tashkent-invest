'use strict';

require('dotenv').config();

const db = require('./models');
const { geographicAreas } = require('./data/tashkent-district-geodata');

async function seedVerifiedBaseline(database = db) {
  await database.sequelize.authenticate();
  await Promise.all(
    geographicAreas.map((area) =>
      database.GeographicArea.upsert({
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
  console.log(`Seeded ${geographicAreas.length} sourced geographic areas; no demo inventory.`);
}

if (require.main === module) {
  seedVerifiedBaseline()
    .then(() => db.sequelize.close())
    .catch(async (error) => {
      console.error(error);
      await db.sequelize.close();
      process.exitCode = 1;
    });
}

module.exports = { seedVerifiedBaseline };
