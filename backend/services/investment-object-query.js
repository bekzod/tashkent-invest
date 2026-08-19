'use strict';

const { Op } = require('sequelize');
const { parseBbox, parsePolygon, pointInPolygon } = require('../utils/geo');

const objectTypes = new Set(['land', 'building', 'proposal']);
const statuses = new Set(['available', 'auction', 'upcoming']);
const sectors = new Set([
  'manufacturing',
  'logistics',
  'tourism',
  'trade',
  'it',
  'agriculture',
  'construction',
  'energy',
]);

const smartSectorAliases = new Map([
  ['food', 'manufacturing'],
  ['oziq ovqat', 'manufacturing'],
  ['oziq-ovqat', 'manufacturing'],
  ['пищевая', 'manufacturing'],
  ['пищев', 'manufacturing'],
  ['textile', 'manufacturing'],
  ['tekstil', 'manufacturing'],
  ["to'qimachilik", 'manufacturing'],
  ['to‘qimachilik', 'manufacturing'],
  ['тўқимачилик', 'manufacturing'],
  ['логистика', 'logistics'],
  ['logistics', 'logistics'],
  ['tourism', 'tourism'],
  ['turizm', 'tourism'],
  ['туризм', 'tourism'],
  ['it', 'it'],
  ['энергетика', 'energy'],
  ['energy', 'energy'],
]);

function list(value) {
  return value ? String(value).split(',').filter(Boolean) : [];
}
function validList(value, allowed, name) {
  const values = list(value);
  if (values.some((item) => !allowed.has(item)))
    throw Object.assign(new Error(`Invalid ${name}`), { statusCode: 400 });
  return values;
}
function finite(value, name) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0)
    throw Object.assign(new Error(`Invalid ${name}`), { statusCode: 400 });
  return parsed;
}

function smartQuery(value) {
  let query = String(value || '').trim();
  const normalized = query.toLocaleLowerCase();
  const sector = [...smartSectorAliases.entries()].find(([alias]) =>
    normalized.includes(alias),
  )?.[1];
  const areaMatch = normalized.match(
    /(\d+(?:[.,]\d+)?)\s*(?:ga|га|ha|gektar|hectare|hectares|гектар)\b/i,
  );
  const area = areaMatch ? Number(areaMatch[1].replace(',', '.')) : undefined;

  if (sector) {
    for (const alias of smartSectorAliases.keys()) {
      query = query.replace(new RegExp(alias, 'gi'), ' ');
    }
  }
  if (areaMatch) query = query.replace(areaMatch[0], ' ');

  return {
    q: query.replace(/[,;]+/g, ' ').replace(/\s+/g, ' ').trim(),
    sectors: sector ? [sector] : [],
    areaMin: area === undefined ? undefined : Math.max(0, Number((area * 0.8).toFixed(2))),
    areaMax: area === undefined ? undefined : Number((area * 1.2).toFixed(2)),
  };
}

function parseFilters(query) {
  const parsedQuery = smartQuery(query.q);
  const requestedSectors = validList(query.sectors, sectors, 'sectors');
  const areaMin = finite(query.areaMin, 'areaMin') ?? parsedQuery.areaMin;
  const areaMax = finite(query.areaMax, 'areaMax') ?? parsedQuery.areaMax;
  const investmentMin = finite(query.investmentMin, 'investmentMin');
  const investmentMax = finite(query.investmentMax, 'investmentMax');
  if (
    (areaMin !== undefined && areaMax !== undefined && areaMin > areaMax) ||
    (investmentMin !== undefined && investmentMax !== undefined && investmentMin > investmentMax)
  )
    throw Object.assign(new Error('Invalid range'), { statusCode: 400 });
  return {
    bbox: parseBbox(query.bbox),
    polygon: parsePolygon(query.polygon),
    types: validList(query.types, objectTypes, 'types'),
    statuses: validList(query.statuses, statuses, 'statuses'),
    sectors: requestedSectors.length ? requestedSectors : parsedQuery.sectors,
    q: parsedQuery.q,
    areaMin,
    areaMax,
    investmentMin,
    investmentMax,
  };
}

function buildWhere(filters) {
  const where = {};
  if (filters.types.length) where.type = { [Op.in]: filters.types };
  if (filters.statuses.length) where.status = { [Op.in]: filters.statuses };
  if (filters.sectors.length) where.sectors = { [Op.overlap]: filters.sectors };
  if (filters.bbox) {
    const [minLng, minLat, maxLng, maxLat] = filters.bbox;
    where.latitude = { [Op.between]: [minLat, maxLat] };
    where.longitude = { [Op.between]: [minLng, maxLng] };
  }
  if (filters.areaMin !== undefined || filters.areaMax !== undefined)
    where.landAreaHa = {
      [Op.between]: [filters.areaMin ?? 0, filters.areaMax ?? Number.MAX_SAFE_INTEGER],
    };
  if (filters.investmentMin !== undefined || filters.investmentMax !== undefined)
    where.investmentAmountUsd = {
      [Op.between]: [filters.investmentMin ?? 0, filters.investmentMax ?? Number.MAX_SAFE_INTEGER],
    };
  return where;
}

function filterObjects(objects, filters) {
  if (!filters.polygon && !filters.q) return objects;
  const search = filters.q.toLocaleLowerCase();
  return objects.filter((object) => {
    const translation = object.translation || object.translations?.[0];
    const isInside = pointInPolygon(
      [Number(object.longitude), Number(object.latitude)],
      filters.polygon,
    );
    const searchable =
      `${translation?.title || ''} ${translation?.address || ''} ${object.district} ${object.cadastralNumber}`.toLocaleLowerCase();
    return isInside && (!search || searchable.includes(search));
  });
}

module.exports = {
  parseFilters,
  buildWhere,
  filterObjects,
  objectTypes,
  statuses,
  sectors,
  smartQuery,
};
