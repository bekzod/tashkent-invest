'use strict';

const { URL } = require('node:url');

const objectTypes = new Set(['land', 'building', 'proposal']);
const objectStatuses = new Set(['draft', 'available', 'auction', 'upcoming', 'archived']);
const publicStatuses = new Set(['available', 'auction', 'upcoming']);
const mediaKinds = new Set(['image', 'video', 'virtual_tour', 'document']);

function validation(message) {
  throw Object.assign(new Error(message), { statusCode: 400 });
}

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value, label) {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) validation(`${label} must be a positive number`);
  return number;
}

function coordinate(value, min, max, label) {
  const number = optionalNumber(value, label);
  if (number !== undefined && (number < min || number > max))
    validation(`${label} is out of range`);
  return number;
}

function normalizeGeometry(value) {
  if (value === undefined || value === null) return undefined;
  if (
    value.type !== 'Polygon' ||
    !Array.isArray(value.coordinates) ||
    value.coordinates.length !== 1
  )
    validation('Site geometry must be a Polygon');
  const ring = value.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 4)
    validation('Polygon needs at least four coordinates');
  const normalized = ring.map((pair) => {
    if (!Array.isArray(pair) || pair.length !== 2) validation('Polygon coordinate is invalid');
    const longitude = coordinate(pair[0], -180, 180, 'Longitude');
    const latitude = coordinate(pair[1], -90, 90, 'Latitude');
    return [longitude, latitude];
  });
  if (normalized[0][0] !== normalized.at(-1)[0] || normalized[0][1] !== normalized.at(-1)[1])
    validation('Polygon must be closed');
  return { type: 'Polygon', coordinates: [normalized] };
}

function normalizeMedia(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) validation('Media limit is 20 items');
  const media = value.map((item, index) => {
    if (!mediaKinds.has(item?.kind)) validation('Invalid media kind');
    const url = text(item?.url);
    try {
      if (!url || new URL(url).protocol !== 'https:') validation('Media URL must use HTTPS');
    } catch {
      validation('Media URL must use HTTPS');
    }
    return { kind: item.kind, url, title: text(item.title), sortOrder: index };
  });
  if (media.filter((item) => item.kind === 'image').length > 10) validation('Image limit is 10');
  if (media.filter((item) => item.kind === 'virtual_tour').length > 1)
    validation('Only one virtual tour is allowed');
  return media;
}

function normalizeTranslations(value, allowIncomplete) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object') validation('Translations must be an object');
  return Object.fromEntries(
    ['uz', 'ru']
      .filter((locale) => value[locale])
      .map((locale) => {
        const translation = value[locale];
        const normalized = {
          title: text(translation.title),
          shortDescription: text(translation.shortDescription),
          description: text(translation.description),
          address: text(translation.address),
          permittedBusinesses: Array.isArray(translation.permittedBusinesses)
            ? translation.permittedBusinesses.map(text).filter(Boolean)
            : [],
        };
        if (
          !allowIncomplete &&
          Object.values(normalized)
            .slice(0, 4)
            .some((field) => !field)
        )
          validation(`${locale} translation is incomplete`);
        return [locale, normalized];
      }),
  );
}

function normalizeObjectPayload(body = {}) {
  const status = body.status || 'draft';
  if (!objectStatuses.has(status)) validation('Invalid status');
  const type = body.type === undefined ? undefined : text(body.type);
  if (type && !objectTypes.has(type)) validation('Invalid object type');
  const sectors = Array.isArray(body.sectors) ? body.sectors.map(text).filter(Boolean) : [];
  const translations = normalizeTranslations(
    body.translations,
    status === 'draft' || status === 'archived',
  );
  const normalized = {
    slug: text(body.slug),
    type,
    status,
    district: text(body.district),
    cadastralNumber: text(body.cadastralNumber),
    latitude: coordinate(body.latitude, -90, 90, 'Latitude'),
    longitude: coordinate(body.longitude, -180, 180, 'Longitude'),
    siteGeometry: normalizeGeometry(body.siteGeometry),
    landAreaHa: optionalNumber(body.landAreaHa, 'Land area'),
    buildingAreaSqm: optionalNumber(body.buildingAreaSqm, 'Building area'),
    usableAreaSqm: optionalNumber(body.usableAreaSqm, 'Usable area'),
    investmentAmountUsd: optionalNumber(body.investmentAmountUsd, 'Investment amount'),
    jobsPlanned: optionalNumber(body.jobsPlanned, 'Jobs planned'),
    auctionUrl: text(body.auctionUrl),
    auctionStartsAt: body.auctionStartsAt ? new Date(body.auctionStartsAt) : undefined,
    sectors,
    utilities: body.utilities && typeof body.utilities === 'object' ? body.utilities : {},
    legalDetails:
      body.legalDetails && typeof body.legalDetails === 'object' ? body.legalDetails : {},
    constructionDetails:
      body.constructionDetails && typeof body.constructionDetails === 'object'
        ? body.constructionDetails
        : {},
    benefits: body.benefits && typeof body.benefits === 'object' ? body.benefits : {},
    translations,
    media: normalizeMedia(body.media),
  };

  if (normalized.auctionStartsAt && Number.isNaN(normalized.auctionStartsAt.getTime()))
    validation('Auction start date is invalid');
  if (!publicStatuses.has(status)) return normalized;
  for (const [field, value] of Object.entries({
    type: normalized.type,
    district: normalized.district,
    cadastralNumber: normalized.cadastralNumber,
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    investmentAmountUsd: normalized.investmentAmountUsd,
  })) {
    if (value === undefined) validation(`${field} is required before publishing`);
  }
  if (normalized.landAreaHa === undefined && normalized.buildingAreaSqm === undefined)
    validation('Land area or building area is required before publishing');
  if (!normalized.sectors.length) validation('At least one sector is required before publishing');
  if (!normalized.translations.uz) validation('uz translation is required before publishing');
  if (status === 'auction' && !normalized.auctionUrl)
    validation('Auction URL is required before publishing');
  return normalized;
}

module.exports = { normalizeObjectPayload, objectStatuses, publicStatuses, objectTypes };
