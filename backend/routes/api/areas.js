'use strict';

module.exports = async (app) => {
  app.get('/', async () => {
    const areas = await app.db.GeographicArea.findAll({
      order: [
        ['kind', 'ASC'],
        ['name_uz', 'ASC'],
      ],
    });
    return areas.map((area) => area.toJSON());
  });
};
