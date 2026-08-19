'use strict';

require('dotenv').config();

const db = require('./models');

const TASHKENT_DISTRICT_ARCGIS_URL =
  'https://services5.arcgis.com/Kri0Q7xwN5k6MG7L/ArcGIS/rest/services/tashkent_districts/FeatureServer/0/query?where=OBJECTID%3D17&outFields=*&returnGeometry=true&outSR=4326&f=geojson';

function validPolygon(geometry) {
  const ring = geometry?.type === 'Polygon' ? geometry.coordinates?.[0] : null;
  return (
    ring &&
    ring.length > 1000 &&
    ring.every(
      ([longitude, latitude]) =>
        Number.isFinite(longitude) &&
        Number.isFinite(latitude) &&
        longitude >= 69 &&
        longitude <= 70 &&
        latitude >= 41 &&
        latitude <= 42,
    )
  );
}

async function syncGeographicAreas() {
  const response = await globalThis.fetch(TASHKENT_DISTRICT_ARCGIS_URL);
  if (!response.ok) throw new Error(`Boundary source request failed: ${response.status}`);

  const collection = await response.json();
  const feature = collection.features?.[0];
  if (!validPolygon(feature?.geometry))
    throw new Error('Boundary source returned an invalid geometry');
  if (feature.properties?.cad_raqami !== '11:11')
    throw new Error('Boundary source did not return Toshkent tumani');

  await db.sequelize.authenticate();
  const [updated] = await db.GeographicArea.update(
    {
      geometry: feature.geometry,
      centerLatitude: 41.391335,
      centerLongitude: 69.220651,
      source: 'ArcGIS FeatureServer tashkent_districts OBJECTID 17, cadastral region 11:11',
    },
    { where: { slug: 'tashkent-district' } },
  );
  if (updated !== 1)
    throw new Error('Toshkent tumani geographic area is missing; run db:seed first');

  console.log(
    `Synced Toshkent tumani boundary (${feature.geometry.coordinates[0].length} points).`,
  );
}

syncGeographicAreas()
  .then(() => db.sequelize.close())
  .catch(async (error) => {
    console.error(error);
    await db.sequelize.close();
    process.exitCode = 1;
  });
